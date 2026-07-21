import { create } from 'zustand'
import { attributionSchema, labResultsSchema } from './contracts.js'
import { makeNewLabelResult, seedLabels, seedTrials } from './seed.js'

const clone = (value) => structuredClone(value)
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const resultList = (trials, name) => trials.map((trial) => trial.results[name]).filter(Boolean)

export const PASS_THRESHOLD = 0.7

export function visibleTrials(state) {
  let rows = state.trials.filter((trial) => {
    if (state.filters.task !== 'all' && trial.taskName !== state.filters.task) return false
    if (state.filters.passState !== 'all') {
      const result = trial.results[state.filters.passLabel]
      if (!result || (state.filters.passState === 'pass') !== result.pass) return false
    }
    if (state.filters.deltaMin > 0 && state.deltaPair.length === 2) {
      const [a, b] = state.deltaPair
      if (!trial.results[a] || !trial.results[b] || Math.abs(trial.results[b].totalReward - trial.results[a].totalReward) <= state.filters.deltaMin) return false
    }
    return true
  })
  const direction = state.sort.direction === 'asc' ? 1 : -1
  rows = [...rows].sort((a, b) => {
    if (state.sort.type === 'task-name') return direction * (a.taskName.localeCompare(b.taskName) || a.id.localeCompare(b.id))
    if (state.sort.type === 'label-reward') return direction * ((a.results[state.sort.label]?.totalReward ?? -1) - (b.results[state.sort.label]?.totalReward ?? -1))
    const [la, lb] = state.deltaPair
    const da = Math.abs((a.results[lb]?.totalReward ?? 0) - (a.results[la]?.totalReward ?? 0))
    const db = Math.abs((b.results[lb]?.totalReward ?? 0) - (b.results[la]?.totalReward ?? 0))
    return direction * (da - db)
  })
  return rows
}

export function pairedTrials(state) {
  if (!state.compareA || !state.compareB || state.compareA === state.compareB) return []
  return visibleTrials(state).filter((trial) => trial.results[state.compareA] && trial.results[state.compareB])
}

export function trialDelta(trial, labelA, labelB) {
  if (!trial.results[labelA] || !trial.results[labelB]) return null
  return trial.results[labelB].totalReward - trial.results[labelA].totalReward
}

export function deriveCompareSummary(state) {
  if (!state.compareA || !state.compareB || state.compareA === state.compareB) return null
  const pairs = pairedTrials(state)
  if (!pairs.length) {
    return { labelA: state.compareA, labelB: state.compareB, meanDelta: 0, wins: 0, losses: 0, ties: 0, costA: 0, costB: 0, passRateA: 0, passRateB: 0 }
  }
  const deltas = pairs.map((trial) => trialDelta(trial, state.compareA, state.compareB))
  return {
    labelA: state.compareA,
    labelB: state.compareB,
    meanDelta: Number((deltas.reduce((sum, value) => sum + value, 0) / pairs.length).toFixed(4)),
    wins: deltas.filter((value) => value > 0.005).length,
    losses: deltas.filter((value) => value < -0.005).length,
    ties: deltas.filter((value) => Math.abs(value) <= 0.005).length,
    costA: Number(pairs.reduce((sum, trial) => sum + trial.results[state.compareA].scorerCost, 0).toFixed(3)),
    costB: Number(pairs.reduce((sum, trial) => sum + trial.results[state.compareB].scorerCost, 0).toFixed(3)),
    passRateA: pairs.filter((trial) => trial.results[state.compareA].pass).length / pairs.length,
    passRateB: pairs.filter((trial) => trial.results[state.compareB].pass).length / pairs.length,
  }
}

export function flipsForTrial(state, trial, labelA, labelB) {
  const resultA = trial.results[labelA]
  const resultB = trial.results[labelB]
  if (!resultA || !resultB) return []
  return resultA.criteria.filter((criterion) => resultB.criteria.find((item) => item.id === criterion.id)?.verdict !== criterion.verdict)
}

/** Derived narrative insights — recomputed from live state on every render. */
export function labInsights(state) {
  const insights = []
  const [a, b] = state.deltaPair
  const rows = visibleTrials(state)
  if (rows.length && a && b && a !== b) {
    let biggest = null
    let passToFail = 0
    for (const trial of rows) {
      const delta = trialDelta(trial, a, b)
      if (delta === null) continue
      if (!biggest || Math.abs(delta) > Math.abs(biggest.delta)) biggest = { trial, delta }
      if (trial.results[a].pass && !trial.results[b].pass) passToFail += 1
    }
    if (biggest && Math.abs(biggest.delta) > 0.005) {
      insights.push(`Biggest swing: ${biggest.trial.id} moves ${biggest.delta >= 0 ? '+' : '−'}${Math.abs(biggest.delta).toFixed(2)} reward from ${a} to ${b}.`)
    }
    if (passToFail > 0) insights.push(`${passToFail} trial${passToFail === 1 ? '' : 's'} flip from pass to fail between ${a} and ${b}.`)
  }
  const ranked = state.labels
    .map((label) => ({ label, mean: resultList(state.trials, label.name).reduce((sum, item) => sum + item.totalReward, 0) / Math.max(state.trials.length, 1) }))
    .sort((x, y) => y.mean - x.mean)
  if (ranked.length) insights.push(`${ranked[0].label.name} posts the highest mean reward across the collection (${ranked[0].mean.toFixed(2)}).`)
  if (state.compareA && state.compareB && state.compareA !== state.compareB) {
    const pairs = pairedTrials(state)
    const flipTotal = pairs.reduce((sum, trial) => sum + flipsForTrial(state, trial, state.compareA, state.compareB).length, 0)
    const tagged = state.attributions.filter((item) => item.labelA === state.compareA && item.labelB === state.compareB).length
    if (flipTotal > 0) insights.push(`${flipTotal - tagged} of ${flipTotal} verdict flips under ${state.compareA} vs ${state.compareB} are still unattributed.`)
  }
  return insights.slice(0, 3)
}

export function compileLabResults(state, generatedAt = new Date().toISOString()) {
  const labels = state.labels.map((label) => {
    const results = resultList(state.trials, label.name)
    return {
      name: label.name,
      scorerModel: label.scorerModel,
      configNote: label.configNote,
      meanReward: Number((results.reduce((sum, item) => sum + item.totalReward, 0) / Math.max(results.length, 1)).toFixed(4)),
      totalCost: Number(results.reduce((sum, item) => sum + item.scorerCost, 0).toFixed(3)),
    }
  })
  const trials = state.trials.map((trial) => ({
    id: trial.id,
    taskName: trial.taskName,
    results: Object.fromEntries(Object.entries(trial.results).map(([name, result]) => [name, {
      totalReward: result.totalReward,
      pass: result.pass,
      dimensions: { ...result.dimensions },
      scorerCost: result.scorerCost,
      criteria: result.criteria.map(({ id, dimension, verdict, reasoning }) => ({ id, dimension, verdict, reasoning })),
    }])),
  }))
  const document = {
    schemaVersion: 'rescore-ab-lab-v1',
    labels,
    trials,
    attributions: clone(state.attributions),
    compareSummary: deriveCompareSummary(state),
    savedPairs: clone(state.savedPairs),
    generatedAt,
  }
  return labResultsSchema.parse(document)
}

const initialRun = { active: false, label: null, steps: [], events: [], startedAt: null, elapsed: 0, failures: 0, completed: false, selectedStep: null }
const defaultFilters = () => ({ task: 'all', passState: 'all', passLabel: 'Baseline', deltaMin: 0 })
const defaultSort = () => ({ type: 'task-name', direction: 'asc', label: 'Baseline' })

export const useLabStore = create((set, get) => ({
  trials: clone(seedTrials),
  labels: clone(seedLabels),
  activeView: 'experiments',
  theme: 'light',
  compareA: 'Baseline',
  compareB: 'Rubric v2',
  shownLabels: ['Baseline', 'Quartz Swap', 'Rubric v2'],
  deltaPair: ['Baseline', 'Rubric v2'],
  filters: defaultFilters(),
  sort: defaultSort(),
  activeChip: null,
  pairRejection: '',
  openedTrialId: null,
  highlightedTrialId: null,
  attributions: [],
  undoStack: [],
  redoStack: [],
  savedPairs: [],
  run: initialRun,
  toast: null,
  liveMessage: '',
  // Overlay orchestration lives in the store so WebMCP handlers can drive — and
  // await — exactly the same state the visible controls read.
  rescoreOpen: false,
  exportOpen: false,
  paletteOpen: false,
  savePairOpen: false,
  attributionDraft: null,
  onboarded: false,

  setView: (activeView) => set({ activeView }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setRescoreOpen: (rescoreOpen) => set({ rescoreOpen }),
  setExportOpen: (exportOpen) => set({ exportOpen }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSavePairOpen: (savePairOpen) => set({ savePairOpen }),
  setAttributionDraft: (attributionDraft) => set({ attributionDraft }),
  setOnboarded: (onboarded) => set({ onboarded }),

  setCompare: (side, label) => set((state) => {
    if (!label) {
      return side === 'A'
        ? { compareA: '', compareError: '', pairRejection: '' }
        : { compareB: '', pairRejection: '' }
    }
    if ((side === 'A' && label === state.compareB) || (side === 'B' && label === state.compareA)) {
      const field = side === 'A' ? 'labelA' : 'labelB'
      const message = `${field}: ${label} is already selected on the other side — pick a different label to avoid a self-comparison.`
      return { pairRejection: message, liveMessage: message }
    }
    const compareA = side === 'A' ? label : state.compareA
    const compareB = side === 'B' ? label : state.compareB
    return {
      compareA, compareB, pairRejection: '',
      deltaPair: compareA && compareB ? [compareA, compareB] : state.deltaPair,
      openedTrialId: null, highlightedTrialId: null,
    }
  }),
  setShownLabels: (names) => set((state) => ({ shownLabels: names, deltaPair: names.length >= 2 ? names.slice(-2) : state.deltaPair })),
  // Applying a manual filter composes with an active suggestion chip instead of clearing it.
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value }, sort: key === 'passLabel' ? { ...state.sort, label: value } : state.sort })),
  clearFilters: () => set({ filters: defaultFilters(), activeChip: null, sort: defaultSort() }),
  toggleChip: (chip) => set((state) => {
    if (state.activeChip === chip) {
      // Re-clicking an active chip clears only that chip's own filter facet.
      const filters = { ...state.filters }
      if (chip === 'baseline-fails') filters.passState = 'all'
      else if (chip === 'big-deltas') filters.deltaMin = 0
      else filters.task = 'all'
      return { activeChip: null, filters }
    }
    if (chip === 'baseline-fails') return { activeChip: chip, filters: { ...state.filters, passLabel: 'Baseline', passState: 'fail' } }
    if (chip === 'big-deltas') return { activeChip: chip, filters: { ...state.filters, deltaMin: 0.08 } }
    return { activeChip: chip, filters: { ...state.filters, task: chip.replace('task:', '') } }
  }),
  setSort: (type, label) => set((state) => ({
    sort: {
      type,
      label: label || state.sort.label,
      direction: state.sort.type === type ? (state.sort.direction === 'asc' ? 'desc' : 'asc') : 'asc',
    },
  })),
  openTrial: (id) => set({ openedTrialId: id }),
  closeTrial: () => set({ openedTrialId: null }),
  highlightTrial: (id) => set({ highlightedTrialId: id }),

  // Shared attribution command — the visible form, the drawer, and the WebMCP
  // entity handlers all route through this single validated mutation.
  saveAttribution: (record) => {
    const parsed = attributionSchema.safeParse(record)
    if (!parsed.success) {
      const issue = parsed.error.issues?.[0]
      return { saved: false, error: issue ? (issue.message.includes(':') ? issue.message : `${issue.path.join('.')}: ${issue.message}`) : 'attribution: validation failed' }
    }
    const clean = parsed.data
    set((state) => {
      const previous = clone(state.attributions)
      const match = (item) => item.trialId === clean.trialId && item.criterionId === clean.criterionId && item.labelA === clean.labelA && item.labelB === clean.labelB
      const exists = state.attributions.some(match)
      const attributions = exists ? state.attributions.map((item) => (match(item) ? clean : item)) : [...state.attributions, clean]
      return {
        attributions,
        undoStack: [...state.undoStack, previous],
        redoStack: [],
        toast: { id: Date.now(), kind: 'save' },
        liveMessage: `Attribution saved for ${clean.trialId} · ${clean.criterionId}: ${clean.cause}. The pair rollup updated.`,
      }
    })
    return { saved: true }
  },
  undo: () => set((state) => {
    if (!state.undoStack.length) return {}
    const previous = state.undoStack.at(-1)
    return {
      attributions: previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, clone(state.attributions)],
      toast: { id: Date.now(), kind: 'undo' },
      liveMessage: 'Undo: the last attribution change was reverted and the rollup decremented.',
    }
  }),
  redo: () => set((state) => {
    if (!state.redoStack.length) return {}
    const next = state.redoStack.at(-1)
    return {
      attributions: next,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, clone(state.attributions)],
      toast: { id: Date.now(), kind: 'redo' },
      liveMessage: 'Redo: the attribution change was restored and the rollup incremented.',
    }
  }),
  savePair: (record) => {
    set((state) => ({ savedPairs: [...state.savedPairs, { name: record.name, labelA: record.labelA, labelB: record.labelB }], toast: { id: Date.now(), kind: 'pair', name: record.name }, liveMessage: `Saved pair ${record.name} (${record.labelA} vs ${record.labelB}).` }))
    return { saved: true }
  },
  applyPair: (name) => set((state) => {
    const pair = state.savedPairs.find((item) => item.name === name)
    return pair ? { compareA: pair.labelA, compareB: pair.labelB, deltaPair: [pair.labelA, pair.labelB], activeView: 'compare', openedTrialId: null, pairRejection: '', liveMessage: `Applied saved pair ${pair.name}: ${pair.labelA} vs ${pair.labelB}.` } : {}
  }),
  deletePair: (name) => set((state) => ({ savedPairs: state.savedPairs.filter((pair) => pair.name !== name), liveMessage: `Deleted saved pair ${name}.` })),
  dismissToast: () => set({ toast: null }),

  prepareRescore: () => set((state) => (state.run.completed && !state.run.active ? { run: initialRun } : {})),
  openRescore: () => {
    get().prepareRescore()
    set({ rescoreOpen: true })
  },

  importDocument: (document) => {
    const parsed = labResultsSchema.parse(document)
    const importedLabels = parsed.labels.map(({ name, scorerModel, configNote }) => ({ name, scorerModel, configNote }))
    const modelByLabel = Object.fromEntries(importedLabels.map((label) => [label.name, label.scorerModel]))
    const originalById = Object.fromEntries(get().trials.map((trial) => [trial.id, trial]))
    const importedTrials = parsed.trials.map((trial) => ({
      ...trial,
      results: Object.fromEntries(Object.entries(trial.results).map(([name, result]) => [name, {
        ...result,
        scorerModel: modelByLabel[name],
        toolCalls: originalById[trial.id]?.results[name]?.toolCalls ?? 8,
        duration: originalById[trial.id]?.results[name]?.duration ?? 24,
        criteria: result.criteria.map((criterion) => ({
          ...criterion,
          title: originalById[trial.id]?.results[name]?.criteria.find((item) => item.id === criterion.id)?.title ?? criterion.id,
        })),
      }])),
    }))
    set((state) => ({
      labels: importedLabels,
      trials: importedTrials,
      attributions: parsed.attributions,
      savedPairs: parsed.savedPairs,
      compareA: parsed.compareSummary?.labelA ?? importedLabels[0]?.name ?? '',
      compareB: parsed.compareSummary?.labelB ?? importedLabels[1]?.name ?? '',
      deltaPair: parsed.compareSummary ? [parsed.compareSummary.labelA, parsed.compareSummary.labelB] : importedLabels.slice(0, 2).map((label) => label.name),
      shownLabels: importedLabels.slice(0, 3).map((label) => label.name),
      pairRejection: '',
      undoStack: [],
      redoStack: [],
      highlightedTrialId: null,
      toast: { id: Date.now(), kind: 'import', attributions: parsed.attributions.length, savedPairs: parsed.savedPairs.length },
      liveMessage: `Import complete: ${parsed.attributions.length} attribution${parsed.attributions.length === 1 ? '' : 's'} and ${parsed.savedPairs.length} saved pair${parsed.savedPairs.length === 1 ? '' : 's'} restored.`,
    }))
    return { imported: true, attributions: parsed.attributions.length, savedPairs: parsed.savedPairs.length }
  },

  startRescore: async (payload) => {
    // Hard guard: a run in flight or a completed run blocks any second start,
    // so double-activating submit starts exactly one run and one label.
    if (get().run.active || get().run.label) return false
    const steps = get().trials.map((trial) => ({ trialId: trial.id, taskName: trial.taskName, status: 'pending', attempt: 1 }))
    set({
      run: {
        active: true, label: payload, steps,
        events: [{ id: `${Date.now()}-start`, trialId: null, status: 'started', time: nowTime(), text: `Run started for ${payload.labelName}` }],
        startedAt: Date.now(), elapsed: 0, failures: 0, completed: false, selectedStep: null,
      },
      liveMessage: `Rescore run started for ${payload.labelName}: 12 steps queued.`,
    })
    const update = (trialId, status, attempt = 1, text) => set((state) => ({
      run: {
        ...state.run,
        steps: state.run.steps.map((step) => (step.trialId === trialId ? { ...step, status, attempt } : step)),
        events: [...state.run.events, { id: `${Date.now()}-${trialId}-${status}`, trialId, status, time: nowTime(), text: text || `${trialId} ${status}` }],
        elapsed: Date.now() - state.run.startedAt,
      },
    }))
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    for (let index = 0; index < steps.length; index += 1) {
      if (!get().run.active) return false
      const step = steps[index]
      update(step.trialId, 'running', 1, `${step.trialId} running attempt 1`)
      await delay(300)
      if (index === 4) {
        set((state) => ({ run: { ...state.run, failures: 1 } }))
        update(step.trialId, 'retrying', 2, `${step.trialId} failed attempt 1 — waiting to retry (retry 2 of 3)`)
        await delay(850)
        update(step.trialId, 'running', 2, `${step.trialId} running attempt 2`)
        await delay(280)
      }
      update(step.trialId, 'complete', index === 4 ? 2 : 1, `${step.trialId} complete`)
      await delay(90)
    }
    const label = { name: payload.labelName.trim(), scorerModel: payload.scorerModel, configNote: payload.configNote }
    set((state) => ({
      labels: [...state.labels, label],
      trials: state.trials.map((trial, index) => ({ ...trial, results: { ...trial.results, [label.name]: makeNewLabelResult(index, label) } })),
      shownLabels: state.shownLabels.includes(label.name) ? state.shownLabels : [...state.shownLabels.slice(-2), label.name],
      deltaPair: [state.compareA || 'Baseline', label.name],
      run: {
        ...state.run, active: false, completed: true, elapsed: Date.now() - state.run.startedAt,
        events: [...state.run.events, { id: `${Date.now()}-done`, trialId: null, status: 'complete', time: nowTime(), text: `${label.name} completed — results added to every view` }],
      },
      toast: { id: Date.now(), kind: 'run', labelName: label.name },
      liveMessage: `Rescore complete. ${label.name} is now available in the experiment table, both Compare pickers, and the cost chart.`,
    }))
    return true
  },
  selectRunStep: (trialId) => set((state) => ({ run: { ...state.run, selectedStep: trialId } })),
}))

/** Resolve a promise once a store predicate commits (used by WebMCP handlers to
 * report post-conditions that the rendered UI has actually updated). */
export function waitForStore(predicate, timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (predicate(useLabStore.getState())) return resolve(true)
    const unsubscribe = useLabStore.subscribe((state) => {
      if (predicate(state)) {
        unsubscribe()
        resolve(true)
      }
    })
    setTimeout(() => {
      unsubscribe()
      resolve(false)
    }, timeoutMs)
  })
}
