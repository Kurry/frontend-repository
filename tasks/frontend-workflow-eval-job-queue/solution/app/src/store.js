import { create } from 'zustand'
import { MODELS, queueSnapshotSchema, firstZodError } from './schemas'

export const MODEL_PROVIDER = {
  'cobalt-4': 'northgale-compute',
  'meridian-xl': 'bluefjord-cloud',
  'willow-mini': 'skylark-systems',
}

export const MODEL_COLORS = {
  'cobalt-4': '#72d7ae',
  'meridian-xl': '#6ea8ff',
  'willow-mini': '#e5ae62',
}

const MODEL_COST = { 'cobalt-4': 0.082, 'meridian-xl': 0.116, 'willow-mini': 0.047 }
const MAX_RETRIES = 3
let sequence = 310

const isoAgo = (minutes, seconds = 0) => new Date(Date.now() - minutes * 60_000 - seconds * 1000).toISOString()
const nextId = (prefix) => `${prefix}-${++sequence}`
const rewardFor = (jobId, trialIndex) => Number((0.58 + ((jobId.length * 13 + trialIndex * 17) % 37) / 100).toFixed(2))

function makeTrial(jobId, index, status, options = {}) {
  const completed = status === 'completed'
  return {
    id: `${jobId}-t${String(index + 1).padStart(2, '0')}`,
    status,
    reward: completed ? (options.reward ?? rewardFor(jobId, index)) : null,
    duration: completed ? (options.duration ?? 8 + index * 2) : null,
    retryCount: options.retryCount ?? 0,
    errorCategory: status === 'failed' ? (options.errorCategory ?? 'provider_timeout') : null,
    backoff: options.backoff ?? null,
    elapsed: options.elapsed ?? 0,
    targetDuration: options.targetDuration ?? 4 + (index % 3),
  }
}

function makeJob({ id, dataset, agent, model, trialCount, status, complete = 0, minutes = 0, special }) {
  const trials = Array.from({ length: trialCount }, (_, index) => {
    if (index < complete) return makeTrial(id, index, 'completed')
    if (status === 'completed') return makeTrial(id, index, 'completed')
    if (status === 'cancelled') return makeTrial(id, index, 'cancelled')
    if (status === 'failed' && index === complete) {
      return makeTrial(id, index, 'failed', { retryCount: MAX_RETRIES, errorCategory: 'invalid_response' })
    }
    if (status === 'running' && index === complete) {
      if (special === 'backoff') {
        return makeTrial(id, index, 'failed', { retryCount: 1, backoff: 7, errorCategory: 'rate_limit' })
      }
      return makeTrial(id, index, 'running', { elapsed: index % 3 })
    }
    return makeTrial(id, index, status === 'queued' ? 'queued' : 'cancelled')
  })
  return {
    id,
    dataset,
    agent,
    model,
    providerId: MODEL_PROVIDER[model],
    trialCount,
    status,
    progressComplete: trials.filter((trial) => trial.status === 'completed').length,
    progressTotal: trialCount,
    submittedAt: isoAgo(minutes),
    holdUntil: special === 'hold' ? Date.now() + 15_000 : null,
    trials,
    isNew: false,
  }
}

function seedJobs() {
  return [
    makeJob({ id: 'evq-309', dataset: 'orchard-qa', agent: 'scouthand', model: 'cobalt-4', trialCount: 8, status: 'running', complete: 5, minutes: 7 }),
    makeJob({ id: 'evq-308', dataset: 'ledgerline-suite', agent: 'forgeline', model: 'meridian-xl', trialCount: 6, status: 'running', complete: 2, minutes: 11, special: 'backoff' }),
    makeJob({ id: 'evq-307', dataset: 'orchard-qa', agent: 'forgeline', model: 'willow-mini', trialCount: 5, status: 'completed', complete: 5, minutes: 29 }),
    makeJob({ id: 'evq-306', dataset: 'ledgerline-suite', agent: 'scouthand', model: 'cobalt-4', trialCount: 4, status: 'completed', complete: 4, minutes: 41 }),
    makeJob({ id: 'evq-305', dataset: 'orchard-qa', agent: 'scouthand', model: 'meridian-xl', trialCount: 7, status: 'failed', complete: 3, minutes: 54 }),
    makeJob({ id: 'evq-304', dataset: 'ledgerline-suite', agent: 'forgeline', model: 'willow-mini', trialCount: 6, status: 'queued', minutes: 4 }),
    makeJob({ id: 'evq-303', dataset: 'orchard-qa', agent: 'forgeline', model: 'cobalt-4', trialCount: 3, status: 'cancelled', complete: 1, minutes: 68 }),
    makeJob({ id: 'evq-302', dataset: 'ledgerline-suite', agent: 'scouthand', model: 'meridian-xl', trialCount: 5, status: 'queued', minutes: 2, special: 'hold' }),
    makeJob({ id: 'evq-301', dataset: 'orchard-qa', agent: 'scouthand', model: 'willow-mini', trialCount: 6, status: 'completed', complete: 6, minutes: 83 }),
    makeJob({ id: 'evq-300', dataset: 'ledgerline-suite', agent: 'forgeline', model: 'cobalt-4', trialCount: 4, status: 'completed', complete: 4, minutes: 96 }),
    makeJob({ id: 'evq-299', dataset: 'orchard-qa', agent: 'forgeline', model: 'meridian-xl', trialCount: 8, status: 'cancelled', complete: 2, minutes: 112 }),
  ]
}

function seedProviders() {
  return [
    { id: 'northgale-compute', name: 'Northgale Compute', rateLimit: 'normal', previousRateLimit: 'normal' },
    { id: 'bluefjord-cloud', name: 'Bluefjord Cloud', rateLimit: 'throttled', previousRateLimit: 'throttled' },
    { id: 'skylark-systems', name: 'Skylark Systems', rateLimit: 'normal', previousRateLimit: 'normal' },
  ]
}

function seedTimeline() {
  return [
    { id: 'evt-12', timestamp: isoAgo(8), status: 'completed', kind: 'trial', label: 'evq-309 · trial 05 completed' },
    { id: 'evt-11', timestamp: isoAgo(29), status: 'completed', kind: 'job', label: 'evq-307 completed 5 trials' },
    { id: 'evt-10', timestamp: isoAgo(41), status: 'completed', kind: 'job', label: 'evq-306 completed 4 trials' },
    { id: 'evt-09', timestamp: isoAgo(54), status: 'failed', kind: 'job', label: 'evq-305 failed after automatic retries' },
    { id: 'evt-08', timestamp: isoAgo(68), status: 'cancelled', kind: 'job', label: 'evq-303 cancelled by operator' },
    { id: 'evt-07', timestamp: isoAgo(83), status: 'completed', kind: 'job', label: 'evq-301 completed 6 trials' },
  ]
}

export function getProviderStats(jobs, providerId) {
  return {
    queueDepth: jobs.filter((job) => job.providerId === providerId && job.status === 'queued').length,
    inFlight: jobs
      .filter((job) => job.providerId === providerId)
      .flatMap((job) => job.trials)
      .filter((trial) => trial.status === 'running').length,
  }
}

export function deriveAggregates(jobs) {
  const meanRewardByModel = {}
  for (const model of MODELS) {
    const rewards = jobs
      .filter((job) => job.model === model && job.status === 'completed')
      .flatMap((job) => job.trials)
      .filter((trial) => trial.status === 'completed' && typeof trial.reward === 'number')
      .map((trial) => trial.reward)
    meanRewardByModel[model] = rewards.length
      ? Number((rewards.reduce((sum, reward) => sum + reward, 0) / rewards.length).toFixed(3))
      : 0
  }
  const totalCost = Number(
    jobs
      .flatMap((job) => job.trials.filter((trial) => trial.status === 'completed').map(() => MODEL_COST[job.model] || 0))
      .reduce((sum, value) => sum + value, 0)
      .toFixed(2),
  )
  return { meanRewardByModel, totalCost }
}

export function buildSnapshot(state) {
  return {
    schemaVersion: 'eval-queue-v1',
    exportedAt: new Date().toISOString(),
    jobs: state.jobs.map((job) => ({
      id: job.id,
      dataset: job.dataset,
      agent: job.agent,
      model: job.model,
      trialCount: job.trialCount,
      status: job.status,
      progressComplete: job.trials.filter((trial) => trial.status === 'completed').length,
      progressTotal: job.trialCount,
      submittedAt: job.submittedAt,
      trials: job.trials.map((trial) => ({
        id: trial.id,
        status: trial.status,
        reward: trial.status === 'completed' ? trial.reward : null,
        duration: trial.status === 'completed' ? trial.duration : null,
        retryCount: trial.retryCount,
        errorCategory: trial.status === 'failed' ? trial.errorCategory : null,
      })),
    })),
    providers: state.providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      ...getProviderStats(state.jobs, provider.id),
      rateLimit: provider.rateLimit,
    })),
    aggregates: deriveAggregates(state.jobs),
    timeline: state.timeline.map(({ id, timestamp, status, kind, label }) => ({ id, timestamp, status, kind, label })),
  }
}

const initialChrome = {
  submitOpen: false,
  exportOpen: false,
  importOpen: false,
  confirm: null,
}

export const useQueueStore = create((set, get) => ({
  jobs: seedJobs(),
  providers: seedProviders(),
  timeline: seedTimeline(),
  filters: { status: '', model: '', dataset: '', timelineStatus: '' },
  selectedJobId: null,
  activeView: 'jobs',
  formDraft: { dataset: '', agent: '', model: '', trialCount: '4', sweepModel: '' },
  exportPreviewText: '',
  importDraft: '',
  importError: '',
  chrome: initialChrome,
  toasts: [],
  submitting: false,

  setActiveView: (activeView) => set({ activeView }),
  setSelectedJob: (selectedJobId) => set({ selectedJobId, activeView: 'jobs' }),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilters: () => set((state) => ({ filters: { ...state.filters, status: '', model: '', dataset: '' } })),
  setFormDraft: (formDraft) => set({ formDraft }),
  setImportDraft: (importDraft) => set({ importDraft, importError: '' }),
  setChrome: (name, value) => set((state) => ({ chrome: { ...state.chrome, [name]: value } })),
  requestConfirm: (confirm) => set((state) => ({ chrome: { ...state.chrome, confirm } })),
  closeConfirm: () => set((state) => ({ chrome: { ...state.chrome, confirm: null } })),

  addToast: (title, tone = 'success') => {
    const id = nextId('toast')
    set((state) => ({ toasts: [...state.toasts, { id, title, tone }] }))
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 3400)
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  refreshExport: () => {
    const preview = JSON.stringify(buildSnapshot(get()), null, 2)
    set({ exportPreviewText: preview })
    return preview
  },

  submitJobs: (payload) => {
    if (get().submitting) return []
    set({ submitting: true })
    const models = [payload.model, ...(payload.sweepModel ? [payload.sweepModel] : [])]
    const createdAt = new Date().toISOString()
    const newJobs = models.map((model) => {
      const id = nextId('evq')
      const trials = Array.from({ length: payload.trialCount }, (_, index) => makeTrial(id, index, 'queued'))
      return {
        id,
        dataset: payload.dataset,
        agent: payload.agent,
        model,
        providerId: MODEL_PROVIDER[model],
        trialCount: payload.trialCount,
        status: 'queued',
        progressComplete: 0,
        progressTotal: payload.trialCount,
        submittedAt: createdAt,
        holdUntil: Date.now() + 3_000,
        trials,
        isNew: true,
      }
    })
    const events = newJobs.map((job) => ({
      id: nextId('evt'),
      timestamp: createdAt,
      status: 'queued',
      kind: 'job',
      label: `${job.id} submitted to ${job.providerId}`,
    }))
    set((state) => ({
      jobs: [...newJobs, ...state.jobs],
      timeline: [...events, ...state.timeline],
      submitting: false,
      chrome: { ...state.chrome, submitOpen: false },
    }))
    window.setTimeout(() => set((state) => ({ jobs: state.jobs.map((job) => ({ ...job, isNew: false })) })), 800)
    get().addToast(newJobs.length > 1 ? `${newJobs.length} sweep jobs submitted` : `${newJobs[0].id} submitted`)
    return newJobs
  },

  cancelJob: (jobId) => {
    const job = get().jobs.find((item) => item.id === jobId)
    if (!job || !['queued', 'running'].includes(job.status)) return false
    const timestamp = new Date().toISOString()
    set((state) => ({
      jobs: state.jobs.map((item) =>
        item.id !== jobId
          ? item
          : {
              ...item,
              status: 'cancelled',
              trials: item.trials.map((trial) =>
                trial.status === 'completed'
                  ? trial
                  : { ...trial, status: 'cancelled', reward: null, duration: null, errorCategory: null, backoff: null },
              ),
            },
      ),
      timeline: [
        { id: nextId('evt'), timestamp, status: 'cancelled', kind: 'job', label: `${jobId} cancelled by operator` },
        ...state.timeline,
      ],
      chrome: { ...state.chrome, confirm: null },
    }))
    get().addToast(`${jobId} cancelled`, 'neutral')
    return true
  },

  setProviderPaused: (providerId, paused) => {
    const provider = get().providers.find((item) => item.id === providerId)
    if (!provider) return false
    set((state) => ({
      providers: state.providers.map((item) =>
        item.id !== providerId
          ? item
          : paused
            ? { ...item, previousRateLimit: item.rateLimit === 'paused' ? item.previousRateLimit : item.rateLimit, rateLimit: 'paused' }
            : { ...item, rateLimit: item.previousRateLimit || 'normal' },
      ),
      chrome: { ...state.chrome, confirm: null },
    }))
    get().addToast(`${provider.name} ${paused ? 'paused' : 'resumed'}`, paused ? 'warning' : 'success')
    return true
  },

  manualRetry: (jobId, trialId) => {
    let changed = false
    set((state) => ({
      jobs: state.jobs.map((job) => {
        if (job.id !== jobId) return job
        const target = job.trials.find((trial) => trial.id === trialId)
        if (!target || target.status !== 'failed' || target.retryCount < MAX_RETRIES) return job
        changed = true
        return {
          ...job,
          status: 'running',
          trials: job.trials.map((trial) =>
            trial.id === trialId
              ? { ...trial, status: 'running', reward: null, duration: null, errorCategory: null, backoff: null, elapsed: 0 }
              : trial,
          ),
        }
      }),
    }))
    if (changed) get().addToast(`${trialId} manual retry started`)
    return changed
  },

  importSnapshot: (rawText) => {
    let raw
    try {
      raw = JSON.parse(rawText)
    } catch (error) {
      const message = `JSON: malformed JSON (${error.message})`
      set({ importError: message })
      return { success: false, error: message }
    }
    const parsed = queueSnapshotSchema.safeParse(raw)
    if (!parsed.success) {
      const message = firstZodError(parsed.error)
      set({ importError: message })
      return { success: false, error: message }
    }
    const snapshot = parsed.data
    const providers = snapshot.providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      rateLimit: provider.rateLimit,
      previousRateLimit: provider.rateLimit === 'paused' ? 'normal' : provider.rateLimit,
    }))
    const knownIds = new Set(providers.map((provider) => provider.id))
    for (const model of MODELS) {
      const id = MODEL_PROVIDER[model]
      if (!knownIds.has(id)) {
        const fallback = seedProviders().find((provider) => provider.id === id)
        providers.push(fallback)
      }
    }
    const jobs = snapshot.jobs.map((job) => ({
      ...job,
      providerId: MODEL_PROVIDER[job.model],
      isNew: false,
      trials: job.trials.map((trial, index) => ({
        ...trial,
        backoff: null,
        elapsed: trial.duration || 0,
        targetDuration: 4 + (index % 3),
      })),
    }))
    set((state) => ({
      jobs,
      providers,
      timeline: snapshot.timeline,
      selectedJobId: null,
      importDraft: rawText,
      importError: '',
      chrome: { ...state.chrome, importOpen: false },
      activeView: 'jobs',
      exportPreviewText: '',
    }))
    get().addToast('Queue snapshot imported')
    return { success: true }
  },

  resetQueue: () => set({
    jobs: seedJobs(),
    providers: seedProviders(),
    timeline: seedTimeline(),
    selectedJobId: null,
    activeView: 'jobs',
    filters: { status: '', model: '', dataset: '', timelineStatus: '' },
    exportPreviewText: '',
    importDraft: '',
    importError: '',
    chrome: initialChrome,
  }),

  tick: () => {
    const now = new Date().toISOString()
    set((state) => {
      let timelineEvents = []
      let jobs = state.jobs.map((job) => ({ ...job, trials: job.trials.map((trial) => ({ ...trial })) }))

      for (const provider of state.providers) {
        if (provider.rateLimit === 'paused') continue
        let runningCount = jobs.filter((job) => job.providerId === provider.id && job.status === 'running').length
        if (runningCount < 3) {
          const waiting = jobs
            .filter((job) => job.providerId === provider.id && job.status === 'queued' && (!job.holdUntil || Date.now() >= job.holdUntil))
            .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
          for (const job of waiting.slice(0, 3 - runningCount)) {
            job.status = 'running'
            const first = job.trials.find((trial) => trial.status === 'queued')
            if (first) first.status = 'running'
            timelineEvents.push({ id: nextId('evt'), timestamp: now, status: 'running', kind: 'job', label: `${job.id} started on ${provider.name}` })
            runningCount += 1
          }
        }

        for (const job of jobs.filter((item) => item.providerId === provider.id && item.status === 'running')) {
          const waitingRetry = job.trials.find((trial) => trial.status === 'failed' && typeof trial.backoff === 'number' && trial.backoff > 0)
          if (waitingRetry && !job.trials.some((trial) => trial.status === 'running')) {
            waitingRetry.backoff -= 1
            if (waitingRetry.backoff <= 0) {
              waitingRetry.status = 'running'
              waitingRetry.retryCount += 1
              waitingRetry.errorCategory = null
              waitingRetry.backoff = null
              waitingRetry.elapsed = 0
              timelineEvents.push({ id: nextId('evt'), timestamp: now, status: 'running', kind: 'trial', label: `${waitingRetry.id} automatic retry ${waitingRetry.retryCount}` })
            }
            continue
          }

          let runningTrial = job.trials.find((trial) => trial.status === 'running')
          if (!runningTrial) {
            const nextTrial = job.trials.find((trial) => trial.status === 'queued')
            if (nextTrial) {
              nextTrial.status = 'running'
              runningTrial = nextTrial
            }
          }
          if (!runningTrial) continue
          runningTrial.elapsed = (runningTrial.elapsed || 0) + 1
          const multiplier = provider.rateLimit === 'throttled' ? 2 : 1
          if (runningTrial.elapsed >= runningTrial.targetDuration * multiplier) {
            const trialIndex = job.trials.findIndex((trial) => trial.id === runningTrial.id)
            runningTrial.status = 'completed'
            runningTrial.reward = rewardFor(job.id, trialIndex)
            runningTrial.duration = runningTrial.elapsed
            runningTrial.errorCategory = null
            runningTrial.backoff = null
            job.progressComplete = job.trials.filter((trial) => trial.status === 'completed').length
            timelineEvents.push({ id: nextId('evt'), timestamp: now, status: 'completed', kind: 'trial', label: `${job.id} · ${runningTrial.id.split('-').at(-1)} completed` })

            const nextTrial = job.trials.find((trial) => trial.status === 'queued')
            if (nextTrial) nextTrial.status = 'running'
            else if (job.trials.every((trial) => trial.status === 'completed')) {
              job.status = 'completed'
              timelineEvents.push({ id: nextId('evt'), timestamp: now, status: 'completed', kind: 'job', label: `${job.id} completed ${job.trialCount} trials` })
            }
          }
        }
      }

      return {
        jobs,
        timeline: timelineEvents.length ? [...timelineEvents.reverse(), ...state.timeline].slice(0, 120) : state.timeline,
      }
    })
  },
}))
