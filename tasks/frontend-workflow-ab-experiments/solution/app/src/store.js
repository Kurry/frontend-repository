import { create } from 'zustand'
import { seedExperiments, criteria as seedCriteria, prompts as seedPrompts, makeSamples } from './data'
import { LETTERS, experimentSchema, criterionSchema, decisionSchema, reportSchema, zodErrorMessage } from './contracts'
import { computeStatistics } from './stats'

const clone = value => structuredClone(value)
const historySnapshot = state => ({ experiments: clone(state.experiments), criteria: clone(state.criteria), prompts: clone(state.prompts), activeExperimentId: state.activeExperimentId, selectedIds: [...state.selectedIds] })
const designOf = experiment => ({
  name: experiment.name,
  hypothesis: experiment.hypothesis,
  successMetric: experiment.successMetric,
  minimumSampleSize: experiment.minimumSampleSize,
  variants: clone(experiment.variants)
})

const addHistory = state => ({ past: [...state.past.slice(-19), historySnapshot(state)], future: [] })
const event = (type, text) => ({ id: `${type}-${Date.now()}-${Math.random()}`, type, text, at: new Date().toISOString() })
let notifyTimer

export const useStudio = create((set, get) => ({
  experiments: clone(seedExperiments),
  criteria: clone(seedCriteria),
  prompts: clone(seedPrompts),
  search: '', filters: [], showArchived: false, selectedIds: [], activeExperimentId: null,
  view: 'experiments', activeTab: 'results', timelineFilter: 'all', inspectorVariant: 'A', flaggedOnly: false,
  designer: null, decisionFor: null, criterionOpen: false, reportFor: null, confirm: null,
  previewOpen: false, previewInput: 'Explain the key idea clearly and concisely.', previewResponses: [],
  toast: null, announcement: '', past: [], future: [], sampleSort: 'desc', copied: false,

  setField: (field, value) => set({ [field]: value }),
  notify: (title, kind = 'success', announcement = title) => {
    clearTimeout(notifyTimer)
    const id = Date.now()
    set({ toast: { id, title, kind }, announcement })
    notifyTimer = setTimeout(() => set(state => ({
      toast: state.toast?.id === id ? null : state.toast,
      announcement: state.announcement === announcement ? '' : state.announcement,
    })), 3800)
  },
  setSearch: search => set({ search }),
  toggleFilter: status => set(state => ({ filters: state.filters.includes(status) ? state.filters.filter(item => item !== status) : [...state.filters, status] })),
  clearFilters: () => set({ search: '', filters: [], showArchived: false }),
  toggleSelected: id => set(state => ({ selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter(item => item !== id) : [...state.selectedIds, id] })),
  selectAll: ids => set(state => ({ selectedIds: state.selectedIds.length === ids.length ? [] : ids })),
  selectExperiment: id => set({ activeExperimentId: id, activeTab: 'results', inspectorVariant: 'A' }),
  closePanel: () => set({ activeExperimentId: null }),
  openDesigner: id => set({ designer: id || 'new', previewOpen: false }),
  closeDesigner: () => set({ designer: null, previewOpen: false }),
  saveExperiment: payload => {
    const parsed = experimentSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: zodErrorMessage(parsed.error) }
    const state = get()
    if (!state.criteria.some(criterion => criterion.name === parsed.data.successMetric)) return { ok: false, error: 'successMetric must name an existing scoring criterion' }
    if (parsed.data.variants.some(variant => !state.prompts.some(prompt => prompt.id === variant.promptId))) return { ok: false, error: 'variant.promptId must name a seeded prompt' }
    if (state.designer !== 'new') {
      set(current => ({ ...addHistory(current), experiments: current.experiments.map(experiment => experiment.id === current.designer ? { ...experiment, ...clone(parsed.data) } : experiment), designer: null }))
      get().notify('Experiment updated')
      return { ok: true }
    }
    const id = `exp-${Date.now()}`
    const experiment = {
      id, ...clone(parsed.data), status: 'pending', previousStatus: null, startedAt: null, createdAt: new Date().toISOString(),
      samples: Object.fromEntries(parsed.data.variants.map((_, index) => [LETTERS[index], []])),
      progress: Object.fromEntries(parsed.data.variants.map((_, index) => [LETTERS[index], 0])),
      timeline: [], flaggedResponseIds: [], decision: null, isNew: true
    }
    set(current => ({ ...addHistory(current), experiments: [experiment, ...current.experiments], designer: null }))
    get().notify('Experiment created')
    return { ok: true, id }
  },
  addCriterion: payload => {
    const parsed = criterionSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: zodErrorMessage(parsed.error) }
    if (get().criteria.some(item => item.name.toLowerCase() === parsed.data.name.toLowerCase())) return { ok: false, error: 'Criterion name must be unique' }
    set(state => ({ ...addHistory(state), criteria: [...state.criteria, { id: parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: parsed.data.name, ...parsed.data }], criterionOpen: false }))
    get().notify('Criterion created')
    return { ok: true }
  },
  archiveSelected: () => {
    const ids = get().selectedIds
    if (!ids.length) return
    set(state => ({ ...addHistory(state), experiments: state.experiments.map(experiment => ids.includes(experiment.id) ? { ...experiment, previousStatus: experiment.status, status: 'archived' } : experiment), selectedIds: [], activeExperimentId: ids.includes(state.activeExperimentId) ? null : state.activeExperimentId }))
    get().notify(`${ids.length} experiment${ids.length === 1 ? '' : 's'} archived`)
  },
  deleteSelected: () => {
    const ids = get().selectedIds
    if (!ids.length) return
    set(state => ({ ...addHistory(state), experiments: state.experiments.filter(experiment => !ids.includes(experiment.id)), selectedIds: [], activeExperimentId: ids.includes(state.activeExperimentId) ? null : state.activeExperimentId }))
    get().notify(`${ids.length} experiment${ids.length === 1 ? '' : 's'} deleted`)
  },
  archiveOne: id => { set({ selectedIds: [id] }); get().archiveSelected() },
  unarchive: id => { set(state => ({ ...addHistory(state), experiments: state.experiments.map(experiment => experiment.id === id ? { ...experiment, status: experiment.previousStatus || 'pending', previousStatus: null } : experiment) })); get().notify('Experiment restored') },
  undo: () => set(state => {
    if (!state.past.length) return state
    const previous = state.past[state.past.length - 1]
    const experiments = previous.experiments.map(prior => {
      const locked = state.experiments.find(item => item.id === prior.id && item.status === 'decided')
      return locked ? { ...prior, status: 'decided', decision: clone(locked.decision), flaggedResponseIds: [...locked.flaggedResponseIds] } : prior
    })
    return { ...previous, experiments, past: state.past.slice(0, -1), future: [historySnapshot(state), ...state.future] }
  }),
  redo: () => set(state => {
    if (!state.future.length) return state
    const next = state.future[0]
    const experiments = next.experiments.map(futureExperiment => {
      const locked = state.experiments.find(item => item.id === futureExperiment.id && item.status === 'decided')
      return locked ? { ...futureExperiment, status: 'decided', decision: clone(locked.decision), flaggedResponseIds: [...locked.flaggedResponseIds] } : futureExperiment
    })
    return { ...next, experiments, past: [...state.past, historySnapshot(state)], future: state.future.slice(1) }
  }),
  startRun: id => set(state => ({ experiments: state.experiments.map(experiment => experiment.id === id && experiment.status === 'pending' ? { ...experiment, status: 'running', startedAt: new Date().toISOString(), timeline: [event('started', 'Run started')] } : experiment), announcement: 'Experiment run started' })),
  pauseRun: id => set(state => ({ experiments: state.experiments.map(experiment => experiment.id === id && experiment.status === 'running' ? { ...experiment, status: 'paused', timeline: [...experiment.timeline, event('paused', 'Run paused')] } : experiment) })),
  resumeRun: id => set(state => ({ experiments: state.experiments.map(experiment => experiment.id === id && experiment.status === 'paused' ? { ...experiment, status: 'running', timeline: [...experiment.timeline, event('resumed', 'Run resumed')] } : experiment) })),
  tickRuns: () => set(state => ({ experiments: state.experiments.map(experiment => {
    if (experiment.status !== 'running') return experiment
    const target = experiment.minimumSampleSize
    const nextSamples = { ...experiment.samples }
    const nextProgress = { ...experiment.progress }
    let milestone = false
    
    experiment.variants.forEach((_, index) => {
      const letter = LETTERS[index]
      if ((nextProgress[letter] || 0) < target) {
        const step = Math.max(1, Math.ceil(target / 40));
        const currentCount = nextProgress[letter] || 0;
        const addCount = Math.min(step, target - currentCount);
        
        const newSamples = makeSamples(experiment.id, experiment.variants, addCount, currentCount)[letter];
        nextSamples[letter] = [...(nextSamples[letter] || []), ...newSamples];
        nextProgress[letter] = currentCount + addCount;
        
        if ([0.25, 0.5, 0.75].some(mark => nextProgress[letter] >= Math.ceil(target * mark) && currentCount < Math.ceil(target * mark))) milestone = true
      }
    })
    const complete = experiment.variants.every((_, index) => nextProgress[LETTERS[index]] >= target)
    const nextTimeline = milestone ? [...experiment.timeline, event('milestone', `${Math.min(...Object.values(nextProgress))} samples collected per variant`)] : experiment.timeline
    if (complete) setTimeout(() => { get().notify('Run completed'); set({ announcement: 'Experiment run completed. Results are ready.' }) }, 0)
    return { ...experiment, samples: nextSamples, progress: nextProgress, status: complete ? 'completed' : 'running', timeline: complete ? [...nextTimeline, event('completed', 'All variants completed')] : nextTimeline }
  }) })),
  runPreview: () => {
    const state = get(); const source = state.designer === 'new' ? null : state.experiments.find(item => item.id === state.designer)
    const variants = source?.variants || []
    set({ previewResponses: variants.map((variant, index) => ({ letter: LETTERS[index], title: variant.title, model: variant.model, latency: 580 + index * 173 + state.previewInput.length, tokens: 98 + index * 31 + Math.round(state.previewInput.length / 3), text: `${variant.title} responds through ${variant.model}: ${state.previewInput} — ${variant.promptId.replaceAll('-', ' ')} produces a ${index % 2 ? 'detailed, evidence-aware' : 'direct, compact'} answer.` })) })
  },
  toggleOutlier: (experimentId, responseId) => set(state => {
    const experiment = state.experiments.find(item => item.id === experimentId)
    if (!experiment || experiment.status === 'decided') return state
    const flagged = experiment.flaggedResponseIds.includes(responseId)
    return { ...addHistory(state), experiments: state.experiments.map(item => item.id === experimentId ? { ...item, flaggedResponseIds: flagged ? item.flaggedResponseIds.filter(id => id !== responseId) : [...item.flaggedResponseIds, responseId] } : item) }
  }),
  decide: (experimentId, payload) => {
    const parsed = decisionSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: zodErrorMessage(parsed.error) }
    const experiment = get().experiments.find(item => item.id === experimentId)
    const letters = experiment?.variants.map((_, index) => LETTERS[index]) || []
    if (parsed.data.choice === 'declare-winner' && !letters.includes(parsed.data.winnerVariant)) return { ok: false, error: 'winnerVariant must name a variant present on the experiment' }
    set(state => ({ experiments: state.experiments.map(item => item.id === experimentId ? { ...item, status: 'decided', decision: { ...parsed.data, winnerVariant: parsed.data.choice === 'declare-winner' ? parsed.data.winnerVariant : null } } : item), decisionFor: null }))
    get().notify('Decision recorded', 'success', 'Decision recorded. The experiment is now locked.')
    return { ok: true }
  },
  promoteWinner: experimentId => {
    const experiment = get().experiments.find(item => item.id === experimentId)
    if (!experiment?.decision?.winnerVariant) return
    const index = LETTERS.indexOf(experiment.decision.winnerVariant)
    const variant = experiment.variants[index]
    set(state => ({ prompts: state.prompts.map(prompt => prompt.id === variant.promptId ? { ...prompt, head: `promoted · ${experiment.decision.winnerVariant}` } : prompt), confirm: null }))
    get().notify(`Variant ${experiment.decision.winnerVariant} promoted to prompt head`)
  },
  compileReport: id => {
    const experiment = get().experiments.find(item => item.id === id)
    if (!experiment || !['completed', 'decided'].includes(experiment.status)) return null
    const stats = computeStatistics(experiment)
    const letters = experiment.variants.map((_, index) => LETTERS[index])
    const report = {
      schemaVersion: 'ab-experiment-report-v1', experimentId: experiment.id, design: designOf(experiment), status: experiment.status,
      sampleCounts: Object.fromEntries(letters.map(letter => [letter, experiment.samples[letter]?.length || 0])),
      statistics: { winner: stats.winner, winRate: Number(stats.winRate.toFixed(6)), pValue: Number(stats.pValue.toFixed(6)), confidenceInterval: stats.confidenceInterval.map(value => Number(value.toFixed(4))), means: Object.fromEntries(letters.map(letter => [letter, Number((stats.means[letter] || 0).toFixed(4))])) },
      decision: experiment.decision ? clone(experiment.decision) : null,
      flaggedResponseIds: [...experiment.flaggedResponseIds], generatedAt: new Date().toISOString()
    }
    return reportSchema.parse(report)
  },
  importReport: (text, selectedId) => {
    let raw
    try { raw = JSON.parse(text) } catch { return { ok: false, error: 'JSON is malformed and could not be parsed' } }
    const parsed = reportSchema.safeParse(raw)
    if (!parsed.success) return { ok: false, error: zodErrorMessage(parsed.error) }
    const state = get()
    let target = state.experiments.find(item => item.id === parsed.data.experimentId)
    if (!target) target = state.experiments.find(item => item.id === selectedId && ['completed', 'decided'].includes(item.status))
    if (!target) return { ok: false, error: 'experimentId does not match an available completed experiment' }
    if (!state.criteria.some(criterion => criterion.name === parsed.data.design.successMetric)) return { ok: false, error: 'design.successMetric must name an existing scoring criterion' }
    const unknownPrompt = parsed.data.design.variants.find(variant => !state.prompts.some(prompt => prompt.id === variant.promptId))
    if (unknownPrompt) return { ok: false, error: 'design.variants.promptId must name a seeded prompt' }
    const targetLetters = target.variants.map((_, index) => LETTERS[index])
    const countMismatch = targetLetters.find(letter => parsed.data.sampleCounts[letter] !== (target.samples[letter]?.length || 0))
    if (countMismatch) return { ok: false, error: `sampleCounts.${countMismatch} must equal the collected sample count` }
    const responseIds = new Set(Object.values(target.samples).flat().map(sample => sample.id))
    const invalidFlag = parsed.data.flaggedResponseIds.find(id => !responseIds.has(id))
    if (invalidFlag) return { ok: false, error: `flaggedResponseIds contains unknown response id ${invalidFlag}` }
    const importedStats = computeStatistics({ ...target, flaggedResponseIds: parsed.data.flaggedResponseIds })
    if (parsed.data.statistics.winner !== importedStats.winner) return { ok: false, error: 'statistics.winner does not match the unflagged sample data' }
    const meanMismatch = targetLetters.find(letter => Math.abs(parsed.data.statistics.means[letter] - (importedStats.means[letter] || 0)) > 0.001)
    if (meanMismatch) return { ok: false, error: `statistics.means.${meanMismatch} does not match the unflagged sample data` }
    set(current => ({ experiments: current.experiments.map(item => item.id === target.id ? { ...item, status: parsed.data.status, decision: clone(parsed.data.decision), flaggedResponseIds: [...parsed.data.flaggedResponseIds] } : item), reportFor: target.id }))
    get().notify('Experiment report imported')
    return { ok: true }
  }
}))

export const getVisibleExperiments = state => state.experiments.filter(experiment => {
  const archivedMatch = state.showArchived ? experiment.status === 'archived' : experiment.status !== 'archived'
  const statusMatch = !state.filters.length || state.filters.includes(experiment.status)
  const searchMatch = experiment.name.toLowerCase().includes(state.search.trim().toLowerCase())
  return archivedMatch && statusMatch && searchMatch
})
