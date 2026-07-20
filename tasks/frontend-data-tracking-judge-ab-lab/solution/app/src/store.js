import { create } from 'zustand'
import { labResultsSchema } from './contracts.js'
import { makeNewLabelResult, seedLabels, seedTrials } from './seed.js'

const clone = (value) => structuredClone(value)
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const resultList = (trials, name) => trials.map((trial) => trial.results[name]).filter(Boolean)

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

export function deriveCompareSummary(state) {
  const pairs = pairedTrials(state)
  if (!state.compareA || !state.compareB || !pairs.length) return state.compareA && state.compareB ? {
    labelA: state.compareA, labelB: state.compareB, meanDelta: 0, wins: 0, losses: 0, ties: 0, costA: 0, costB: 0, passRateA: 0, passRateB: 0,
  } : null
  const deltas = pairs.map((trial) => trial.results[state.compareB].totalReward - trial.results[state.compareA].totalReward)
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

export function compileLabResults(state, generatedAt = new Date().toISOString()) {
  const labels = state.labels.map((label) => {
    const results = resultList(state.trials, label.name)
    return {
      ...label,
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
      dimensions: result.dimensions,
      scorerCost: result.scorerCost,
      criteria: result.criteria.map(({ id, dimension, verdict, reasoning }) => ({ id, dimension, verdict, reasoning })),
    }])),
  }))
  const document = {
    schemaVersion: 'rescore-ab-lab-v1', labels, trials, attributions: state.attributions,
    compareSummary: deriveCompareSummary(state), savedPairs: state.savedPairs, generatedAt,
  }
  return labResultsSchema.parse(document)
}

const initialRun = { active: false, label: null, steps: [], events: [], startedAt: null, elapsed: 0, failures: 0, completed: false, selectedStep: null }

export const useLabStore = create((set, get) => ({
  trials: clone(seedTrials),
  labels: clone(seedLabels),
  activeView: 'experiments',
  theme: 'light',
  compareA: 'Baseline',
  compareB: 'Rubric v2',
  shownLabels: ['Baseline', 'Quartz Swap', 'Rubric v2'],
  deltaPair: ['Baseline', 'Rubric v2'],
  filters: { task: 'all', passState: 'all', passLabel: 'Baseline', deltaMin: 0 },
  sort: { type: 'task-name', direction: 'asc', label: 'Baseline' },
  activeChip: null,
  openedTrialId: null,
  highlightedTrialId: null,
  attributions: [],
  undoStack: [],
  redoStack: [],
  savedPairs: [],
  run: initialRun,
  toast: null,
  liveMessage: '',
  setView: (activeView) => set({ activeView }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setCompare: (side, label) => set((state) => {
    if ((side === 'A' && label === state.compareB) || (side === 'B' && label === state.compareA)) return { liveMessage: `${side === 'A' ? 'labelA' : 'labelB'}: choose a different label` }
    const compareA = side === 'A' ? label : state.compareA
    const compareB = side === 'B' ? label : state.compareB
    return { compareA, compareB, deltaPair: compareA && compareB ? [compareA, compareB] : state.deltaPair, openedTrialId: null, highlightedTrialId: null }
  }),
  setShownLabels: (names) => set((state) => ({ shownLabels: names, deltaPair: names.length >= 2 ? names.slice(-2) : state.deltaPair })),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value }, sort: key === 'passLabel' ? { ...state.sort, label: value } : state.sort, activeChip: null })),
  clearFilters: () => set({ filters: { task: 'all', passState: 'all', passLabel: 'Baseline', deltaMin: 0 }, activeChip: null, sort: { type: 'task-name', direction: 'asc', label: 'Baseline' } }),
  toggleChip: (chip) => set((state) => {
    if (state.activeChip === chip) return { activeChip: null, filters: { task: 'all', passState: 'all', passLabel: 'Baseline', deltaMin: 0 } }
    if (chip === 'baseline-fails') return { activeChip: chip, filters: { ...state.filters, passLabel: 'Baseline', passState: 'fail' } }
    if (chip === 'big-deltas') return { activeChip: chip, filters: { ...state.filters, deltaMin: 0.08 } }
    return { activeChip: chip, filters: { ...state.filters, task: chip.replace('task:', '') } }
  }),
  setSort: (type, label) => set((state) => ({ sort: { type, label: label || state.sort.label, direction: state.sort.type === type ? (state.sort.direction === 'asc' ? 'desc' : 'asc') : 'desc' } })),
  openTrial: (id) => set({ openedTrialId: id }),
  closeTrial: () => set({ openedTrialId: null }),
  highlightTrial: (id) => set({ highlightedTrialId: id, openedTrialId: null }),
  saveAttribution: (record) => set((state) => {
    const previous = clone(state.attributions)
    const match = (item) => item.trialId === record.trialId && item.criterionId === record.criterionId && item.labelA === record.labelA && item.labelB === record.labelB
    const exists = state.attributions.some(match)
    const attributions = exists ? state.attributions.map((item) => match(item) ? record : item) : [...state.attributions, record]
    return { attributions, undoStack: [...state.undoStack, previous], redoStack: [], toast: { id: Date.now(), message: 'Attribution saved' }, liveMessage: 'Attribution saved and rollup updated' }
  }),
  undo: () => set((state) => {
    if (!state.undoStack.length) return {}
    const previous = state.undoStack.at(-1)
    return { attributions: previous, undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, clone(state.attributions)] }
  }),
  redo: () => set((state) => {
    if (!state.redoStack.length) return {}
    const next = state.redoStack.at(-1)
    return { attributions: next, redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, clone(state.attributions)] }
  }),
  savePair: (record) => set((state) => ({ savedPairs: [...state.savedPairs, record] })),
  applyPair: (name) => set((state) => {
    const pair = state.savedPairs.find((item) => item.name === name)
    return pair ? { compareA: pair.labelA, compareB: pair.labelB, deltaPair: [pair.labelA, pair.labelB], activeView: 'compare', openedTrialId: null } : {}
  }),
  deletePair: (name) => set((state) => ({ savedPairs: state.savedPairs.filter((pair) => pair.name !== name) })),
  dismissToast: () => set({ toast: null }),
  prepareRescore: () => set((state) => state.run.completed && !state.run.active ? { run: initialRun } : {}),
  importDocument: (document) => {
    const parsed = labResultsSchema.parse(document)
    const importedLabels = parsed.labels.map(({ name, scorerModel, configNote }) => ({ name, scorerModel, configNote }))
    const modelByLabel = Object.fromEntries(importedLabels.map((label) => [label.name, label.scorerModel]))
    const originalById = Object.fromEntries(get().trials.map((trial) => [trial.id, trial]))
    const importedTrials = parsed.trials.map((trial) => ({ ...trial, results: Object.fromEntries(Object.entries(trial.results).map(([name, result]) => [name, {
      ...result,
      scorerModel: modelByLabel[name],
      toolCalls: originalById[trial.id]?.results[name]?.toolCalls ?? 0,
      duration: originalById[trial.id]?.results[name]?.duration ?? 0,
      criteria: result.criteria.map((criterion) => ({ ...criterion, title: originalById[trial.id]?.results[name]?.criteria.find((item) => item.id === criterion.id)?.title ?? criterion.id })),
    }])) }))
    set((state) => ({
      labels: importedLabels, trials: importedTrials, attributions: parsed.attributions, savedPairs: parsed.savedPairs,
      compareA: parsed.compareSummary?.labelA ?? state.compareA, compareB: parsed.compareSummary?.labelB ?? state.compareB,
      shownLabels: importedLabels.slice(0, 3).map((label) => label.name), undoStack: [], redoStack: [], toast: { id: Date.now(), message: 'Lab results imported' },
    }))
  },
  startRescore: async (payload) => {
    if (get().run.active) return false
    const steps = get().trials.map((trial) => ({ trialId: trial.id, taskName: trial.taskName, status: 'pending', attempt: 1 }))
    set({ run: { active: true, label: payload, steps, events: [{ id: `${Date.now()}-start`, trialId: null, status: 'started', time: nowTime(), text: `Run started for ${payload.labelName}` }], startedAt: Date.now(), elapsed: 0, failures: 0, completed: false, selectedStep: null } })
    const update = (trialId, status, attempt = 1, text) => set((state) => ({ run: {
      ...state.run,
      steps: state.run.steps.map((step) => step.trialId === trialId ? { ...step, status, attempt } : step),
      events: [...state.run.events, { id: `${Date.now()}-${trialId}-${status}`, trialId, status, time: nowTime(), text: text || `${trialId} ${status}` }],
      elapsed: Date.now() - state.run.startedAt,
    } }))
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index]
      update(step.trialId, 'running', 1)
      await delay(260)
      if (index === 4) {
        set((state) => ({ run: { ...state.run, failures: 1 } }))
        update(step.trialId, 'retrying', 2, `${step.trialId} failed attempt 1 · retry 2 of 3`)
        await delay(680)
        update(step.trialId, 'running', 2, `${step.trialId} running attempt 2`)
        await delay(240)
      }
      update(step.trialId, 'complete', index === 4 ? 2 : 1)
      await delay(80)
    }
    const label = { name: payload.labelName.trim(), scorerModel: payload.scorerModel, configNote: payload.configNote }
    set((state) => ({
      labels: [...state.labels, label],
      trials: state.trials.map((trial, index) => ({ ...trial, results: { ...trial.results, [label.name]: makeNewLabelResult(index, label) } })),
      shownLabels: [...state.shownLabels.slice(-2), label.name],
      deltaPair: [state.shownLabels.at(-1) ?? 'Baseline', label.name],
      run: { ...state.run, active: false, completed: true, elapsed: Date.now() - state.run.startedAt, events: [...state.run.events, { id: `${Date.now()}-done`, trialId: null, status: 'complete', time: nowTime(), text: `${label.name} completed` }] },
      toast: { id: Date.now(), message: `${label.name} completed and added to the lab` }, liveMessage: `Rescore complete. ${label.name} is available in all views.`,
    }))
    return true
  },
  selectRunStep: (trialId) => set((state) => ({ run: { ...state.run, selectedStep: trialId } })),
}))
