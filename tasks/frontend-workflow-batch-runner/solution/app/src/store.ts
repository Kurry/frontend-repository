import { create } from 'zustand'
import {
  type CreateJobPayload,
  type DatasetRow,
  type ItemStatus,
  type ModelId,
  type RunReport,
  type Schedule,
  DATASET_SLICES,
  ITEM_STATUSES,
  createJobSchema,
  modelRate,
  runReportSchema,
} from './contracts'

export type AttemptRecord = {
  attempt: number
  timestamp: string
  outcome: 'complete' | 'failed'
  detail: string
}

export type RunItem = {
  index: number
  input: string
  expected?: string
  output: string | null
  status: ItemStatus
  attempts: number
  latencyMs: number | null
  cost: number
  startedAt?: string
  completedAt?: string
  retryAt?: number
  error?: string
  attemptsLog: AttemptRecord[]
  tokenCount: number
  manualRetry?: boolean
  reconciling?: boolean
}

export type TimelineEntry = {
  id: string
  timestamp: string
  status: ItemStatus
  itemIndex: number
  label: string
}

export type RunStatus = 'running' | 'paused' | 'complete' | 'stopped'

export type Run = {
  id: string
  startedAt: string
  endedAt?: string
  status: RunStatus
  items: RunItem[]
  queue: number[]
  timeline: TimelineEntry[]
  frozenEta: number | null
  ordinal: number
  updatedAt: number
}

export type JobStatus = 'Ready' | 'Running' | 'Paused' | 'Complete' | 'Stopped' | 'Scheduled'

export type Job = CreateJobPayload & {
  id: string
  createdAt: string
  status: JobStatus
  runs: Run[]
}

type Snapshot = { jobs: Job[]; selectedJobId: string | null; selectedRunId: string | null }

type UiState = {
  composerOpen: boolean
  editingJobId: string | null
  scheduleOpen: boolean
  exportOpen: boolean
  exportTimestamp: string
  exportPreviewText: string
  importOpen: boolean
  importDraft: string
  calendarOpen: boolean
  compareOpen: boolean
  deleteJobId: string | null
  inspectorIndex: number | null
  sidebarOpen: boolean
  timelineFilter: 'all' | ItemStatus
  highlightedIndex: number | null
  compareA: string | null
  compareB: string | null
  toast: { id: number; kind: 'success' | 'error' | 'info'; title: string; subtitle: string } | null
  announcement: string
}

type Store = {
  jobs: Job[]
  selectedJobId: string | null
  selectedRunId: string | null
  past: Snapshot[]
  future: Snapshot[]
  ui: UiState
  selectJob: (id: string) => void
  selectRun: (id: string) => void
  createJob: (payload: CreateJobPayload) => string
  updateJob: (id: string, payload: CreateJobPayload) => void
  requestDelete: (id: string | null) => void
  deleteJob: (id: string) => void
  setSchedule: (id: string, schedule: Schedule | null) => void
  launchJob: (id?: string) => void
  pauseJob: (id?: string) => void
  resumeJob: (id?: string) => void
  stopJob: (id?: string) => void
  retryFailed: (id?: string) => void
  simulateWindowStart: () => number
  reorderQueue: (fromIndex: number, toIndex: number) => void
  moveQueueItem: (itemIndex: number, direction: -1 | 1) => void
  undo: () => void
  redo: () => void
  importReport: (value: unknown) => { ok: true; jobId: string } | { ok: false; error: string }
  setUi: (patch: Partial<UiState>) => void
  showToast: (kind: UiState['toast'] extends infer T ? T extends { kind: infer K } ? K : never : never, title: string, subtitle: string) => void
  clearToast: () => void
  tickJob: (jobId: string) => void
}

const deepClone = <T,>(value: T): T => structuredClone(value)
const nowIso = () => new Date().toISOString()
let sequence = 1
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${sequence++}`

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function deterministicCandidate(job: Job, item: RunItem): boolean {
  return hashString(`${job.name}|${job.model}|${item.input}|${item.index}`) % 7 === 0
}

function deterministicPermanent(job: Job, run: Run, item: RunItem): boolean {
  return deterministicCandidate(job, item) && (hashString(`${job.model}|${item.index}`) + run.ordinal) % 5 === 0
}

function makeOutput(job: Job, item: RunItem, run: Run): string {
  const labels = ['validated', 'reviewed', 'classified', 'summarized', 'resolved']
  const label = labels[(hashString(`${item.input}|${run.id}`) + item.index) % labels.length]
  if (item.expected && hashString(`${run.id}|${item.index}`) % 4 !== 0) return item.expected
  return `${label}: ${item.input.replace(/\s+/g, ' ').slice(0, 118)}`
}

function makeItems(dataset: DatasetRow[]): RunItem[] {
  return dataset.map((row, index) => ({
    index,
    input: String(row.input),
    expected: typeof row.expected === 'string' ? row.expected : undefined,
    output: null,
    status: 'pending',
    attempts: 1,
    latencyMs: null,
    cost: 0,
    attemptsLog: [],
    tokenCount: 0,
  }))
}

function timelineEntry(itemIndex: number, status: ItemStatus, label: string): TimelineEntry {
  return { id: uid('event'), timestamp: nowIso(), status, itemIndex, label }
}

export function deriveRollups(run: Run | undefined, concurrency = 1) {
  if (!run) return { completed: 0, total: 0, failureRate: 0, estimatedRemainingMs: null, totalCost: 0 }
  const settled = run.items.filter((item) => ['complete', 'failed', 'stopped'].includes(item.status)).length
  const complete = run.items.filter((item) => item.status === 'complete').length
  const failed = run.items.filter((item) => item.status === 'failed').length
  const measured = run.items.filter((item) => item.latencyMs !== null)
  const average = measured.length ? measured.reduce((sum, item) => sum + (item.latencyMs ?? 0), 0) / measured.length : 900
  const estimated = settled >= run.items.length ? 0 : Math.round(((run.items.length - settled) * average) / Math.max(1, concurrency))
  return {
    completed: complete,
    total: run.items.length,
    failureRate: run.items.length ? Number(((failed / run.items.length) * 100).toFixed(1)) : 0,
    estimatedRemainingMs: run.status === 'paused' ? run.frozenEta : estimated,
    totalCost: Number(run.items.reduce((sum, item) => sum + item.cost, 0).toFixed(8)),
  }
}

function buildLargeDataset(count: number): DatasetRow[] {
  const subjects = ['invoice reconciliation', 'access provisioning', 'regional latency', 'export validation', 'account recovery', 'policy review']
  return Array.from({ length: count }, (_, index) => ({
    input: `Record ${String(index + 1).padStart(3, '0')}: Review the ${subjects[index % subjects.length]} request for workspace ${1000 + index} and return the next operational action.`,
    ...(index % 3 === 0 ? { expected: ['approve', 'review', 'escalate'][index % 3] } : {}),
  }))
}

function makeSeedRun(job: Omit<Job, 'runs' | 'status'>, ordinal: number, offsetHours: number): Run {
  const startedAt = new Date(Date.now() - offsetHours * 3600_000).toISOString()
  const items = makeItems(job.dataset).map((item) => {
    const failed = (item.index + ordinal * 3) % 17 === 0
    const latency = 520 + ((item.index * 83 + ordinal * 41) % 980)
    const tokens = 110 + ((item.index * 31) % 540)
    const status: ItemStatus = failed ? 'failed' : 'complete'
    return {
      ...item,
      status,
      attempts: failed ? 3 : item.index % 9 === 0 ? 2 : 1,
      latencyMs: latency,
      tokenCount: tokens,
      cost: Number(((tokens / 1000) * modelRate(job.model as ModelId)).toFixed(8)),
      output: failed ? null : `${item.expected ?? 'complete'} · processed result ${item.index + 1}`,
      error: failed ? 'Retry limit reached after a simulated provider timeout.' : undefined,
      completedAt: new Date(Date.parse(startedAt) + item.index * 60 + latency).toISOString(),
      attemptsLog: [{
        attempt: failed ? 3 : 1,
        timestamp: new Date(Date.parse(startedAt) + item.index * 60).toISOString(),
        outcome: failed ? 'failed' as const : 'complete' as const,
        detail: failed ? 'Provider timeout; retry limit reached' : 'Output accepted',
      }],
    }
  })
  const timeline = items.map((item) => ({
    id: uid('seed-event'),
    timestamp: item.completedAt ?? startedAt,
    status: item.status,
    itemIndex: item.index,
    label: item.status === 'complete' ? `Item ${item.index + 1} completed` : `Item ${item.index + 1} failed after 3 attempts`,
  }))
  return { id: uid('seed-run'), startedAt, endedAt: timeline.at(-1)?.timestamp, status: 'complete', items, queue: [], timeline, frozenEta: 0, ordinal, updatedAt: Date.now() - offsetHours * 3600_000 }
}

function makeSeedJobs(): Job[] {
  const firstBase = {
    id: 'job-support-nightly',
    name: 'Nightly support triage',
    promptTemplate: 'support-intent',
    model: 'lyra-8b' as const,
    concurrency: 3,
    dataset: Array.from({ length: 36 }, (_, index) => ({
      input: `${DATASET_SLICES[0].rows[index % DATASET_SLICES[0].rows.length].input} Case reference SUP-${2400 + index}.`,
      expected: DATASET_SLICES[0].rows[index % DATASET_SLICES[0].rows.length].expected,
    })),
    schedule: null,
    createdAt: new Date(Date.now() - 8 * 86400_000).toISOString(),
  }
  const secondBase = {
    id: 'job-feedback-review',
    name: 'Feedback signal review',
    promptTemplate: 'sentiment-brief',
    model: 'atlas-40b' as const,
    concurrency: 2,
    dataset: Array.from({ length: 32 }, (_, index) => ({ input: `${DATASET_SLICES[1].rows[index % 10].input} Feedback batch ${Math.floor(index / 10) + 1}.` })),
    schedule: null,
    createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
  }
  const firstRuns = [makeSeedRun(firstBase, 1, 28), makeSeedRun(firstBase, 2, 8)]
  const secondRuns = [makeSeedRun(secondBase, 1, 5)]
  return [
    { ...firstBase, status: 'Complete', runs: firstRuns },
    { ...secondBase, status: 'Complete', runs: secondRuns },
    {
      id: 'job-quarterly-corpus',
      name: 'Quarterly corpus sweep',
      promptTemplate: 'quality-review',
      model: 'quasar-mini',
      concurrency: 3,
      dataset: buildLargeDataset(240),
      schedule: null,
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
      status: 'Ready',
      runs: [],
    },
  ]
}

const timers = new Map<string, number>()

function snapshotOf(state: Pick<Store, 'jobs' | 'selectedJobId' | 'selectedRunId'>): Snapshot {
  return deepClone({ jobs: state.jobs, selectedJobId: state.selectedJobId, selectedRunId: state.selectedRunId })
}

function currentRun(state: Store, explicitJobId?: string): { job: Job; run: Run } | null {
  const job = state.jobs.find((entry) => entry.id === (explicitJobId ?? state.selectedJobId))
  if (!job) return null
  const run = job.runs.find((entry) => entry.id === (explicitJobId ? job.runs.at(-1)?.id : state.selectedRunId)) ?? job.runs.at(-1)
  return run ? { job, run } : null
}

function ensureTimer(jobId: string) {
  if (timers.has(jobId)) return
  const timer = window.setInterval(() => useBatchStore.getState().tickJob(jobId), 60)
  timers.set(jobId, timer)
}

function stopTimer(jobId: string) {
  const timer = timers.get(jobId)
  if (timer !== undefined) window.clearInterval(timer)
  timers.delete(jobId)
}

const initialJobs = makeSeedJobs()

export const useBatchStore = create<Store>((set, get) => ({
  jobs: initialJobs,
  selectedJobId: 'job-quarterly-corpus',
  selectedRunId: null,
  past: [],
  future: [],
  ui: {
    composerOpen: false,
    editingJobId: null,
    scheduleOpen: false,
    exportOpen: false,
    exportTimestamp: nowIso(),
    exportPreviewText: '',
    importOpen: false,
    importDraft: '',
    calendarOpen: false,
    compareOpen: false,
    deleteJobId: null,
    inspectorIndex: null,
    sidebarOpen: false,
    timelineFilter: 'all',
    highlightedIndex: null,
    compareA: null,
    compareB: null,
    toast: null,
    announcement: '',
  },
  selectJob: (id) => set((state) => {
    const job = state.jobs.find((entry) => entry.id === id)
    return { selectedJobId: id, selectedRunId: job?.runs.at(-1)?.id ?? null, ui: { ...state.ui, inspectorIndex: null, highlightedIndex: null, sidebarOpen: false } }
  }),
  selectRun: (id) => set((state) => ({ selectedRunId: id, ui: { ...state.ui, inspectorIndex: null, highlightedIndex: null } })),
  createJob: (payload) => {
    const parsed = createJobSchema.parse(payload)
    const id = uid('job')
    set((state) => ({
      jobs: [...state.jobs, { ...deepClone(parsed), id, createdAt: nowIso(), status: parsed.schedule ? 'Scheduled' : 'Ready', runs: [] }],
      selectedJobId: id,
      selectedRunId: null,
      past: [...state.past, snapshotOf(state)].slice(-50),
      future: [],
      ui: { ...state.ui, composerOpen: false, editingJobId: null, toast: { id: Date.now(), kind: 'success', title: 'Job created', subtitle: `${parsed.name} is ready to launch.` } },
    }))
    return id
  },
  updateJob: (id, payload) => {
    const parsed = createJobSchema.parse(payload)
    set((state) => ({
      jobs: state.jobs.map((job) => job.id === id ? { ...job, ...deepClone(parsed), status: parsed.schedule && job.status === 'Ready' ? 'Scheduled' : !parsed.schedule && job.status === 'Scheduled' ? 'Ready' : job.status } : job),
      past: [...state.past, snapshotOf(state)].slice(-50),
      future: [],
      ui: { ...state.ui, composerOpen: false, editingJobId: null, toast: { id: Date.now(), kind: 'success', title: 'Job updated', subtitle: `${parsed.name} configuration was saved.` } },
    }))
  },
  requestDelete: (id) => set((state) => ({ ui: { ...state.ui, deleteJobId: id } })),
  deleteJob: (id) => {
    stopTimer(id)
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
      selectedJobId: state.selectedJobId === id ? null : state.selectedJobId,
      selectedRunId: state.selectedJobId === id ? null : state.selectedRunId,
      past: [...state.past, snapshotOf(state)].slice(-50),
      future: [],
      ui: { ...state.ui, deleteJobId: null, inspectorIndex: null, toast: { id: Date.now(), kind: 'success', title: 'Job deleted', subtitle: 'Undo restores the job and its complete run history.' } },
    }))
  },
  setSchedule: (id, schedule) => set((state) => ({
    jobs: state.jobs.map((job) => job.id === id ? { ...job, schedule: schedule ? deepClone(schedule) : null, status: job.status === 'Running' || job.status === 'Paused' ? job.status : schedule ? 'Scheduled' : 'Ready' } : job),
    past: [...state.past, snapshotOf(state)].slice(-50),
    future: [],
    ui: { ...state.ui, scheduleOpen: false, toast: { id: Date.now(), kind: 'success', title: schedule ? 'Schedule saved' : 'Schedule removed', subtitle: schedule ? 'The off-hours launch window is active.' : 'The job is ready for manual launch.' } },
  })),
  launchJob: (explicitId) => {
    const state = get()
    const id = explicitId ?? state.selectedJobId
    if (!id) return
    const job = state.jobs.find((entry) => entry.id === id)
    if (!job || job.status === 'Running' || job.status === 'Paused') return
    const ordinal = job.runs.length + 1
    const items = makeItems(job.dataset)
    const run: Run = {
      id: uid('run'),
      startedAt: nowIso(),
      status: 'running',
      items,
      queue: items.map((item) => item.index),
      timeline: [],
      frozenEta: null,
      ordinal,
      updatedAt: Date.now(),
    }
    set((current) => ({
      jobs: current.jobs.map((entry) => entry.id === id ? { ...entry, status: 'Running', runs: [...entry.runs, run] } : entry),
      selectedRunId: current.selectedJobId === id ? run.id : current.selectedRunId,
      ui: { ...current.ui, announcement: `${job.name} run started`, toast: { id: Date.now(), kind: 'info', title: 'Run launched', subtitle: `${items.length} items entered the queue.` } },
    }))
    ensureTimer(id)
    get().tickJob(id)
  },
  pauseJob: (explicitId) => {
    const state = get()
    const pair = currentRun(state, explicitId)
    if (!pair || pair.run.status !== 'running') return
    const eta = deriveRollups(pair.run, pair.job.concurrency).estimatedRemainingMs
    set((current) => ({
      jobs: current.jobs.map((job) => job.id === pair.job.id ? { ...job, status: 'Paused', runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, status: 'paused', frozenEta: eta, items: run.items.map((item) => ['pending', 'running', 'retrying'].includes(item.status) ? { ...item, reconciling: true } : item), updatedAt: Date.now() } : run) } : job),
      ui: { ...current.ui, announcement: `${pair.job.name} paused at its checkpoint` },
    }))
    window.setTimeout(() => set((current) => ({ jobs: current.jobs.map((job) => job.id === pair.job.id ? { ...job, runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, items: run.items.map((item) => ({ ...item, reconciling: false })) } : run) } : job) })), 650)
  },
  resumeJob: (explicitId) => {
    const state = get()
    const pair = currentRun(state, explicitId)
    if (!pair || pair.run.status !== 'paused') return
    set((current) => ({
      jobs: current.jobs.map((job) => job.id === pair.job.id ? { ...job, status: 'Running', runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, status: 'running', frozenEta: null, items: run.items.map((item) => ['pending', 'retrying'].includes(item.status) ? { ...item, reconciling: true } : item), updatedAt: Date.now() } : run) } : job),
      ui: { ...current.ui, announcement: `${pair.job.name} resumed from its checkpoint` },
    }))
    ensureTimer(pair.job.id)
    window.setTimeout(() => set((current) => ({ jobs: current.jobs.map((job) => job.id === pair.job.id ? { ...job, runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, items: run.items.map((item) => ({ ...item, reconciling: false })) } : run) } : job) })), 650)
  },
  stopJob: (explicitId) => {
    const state = get()
    const pair = currentRun(state, explicitId)
    if (!pair || !['running', 'paused'].includes(pair.run.status)) return
    const changed = pair.run.items.filter((item) => ['pending', 'running', 'retrying'].includes(item.status))
    const at = nowIso()
    set((current) => ({
      jobs: current.jobs.map((job) => job.id === pair.job.id ? {
        ...job,
        status: 'Stopped',
        runs: job.runs.map((run) => run.id === pair.run.id ? {
          ...run,
          status: 'stopped',
          endedAt: at,
          queue: [],
          items: run.items.map((item) => changed.some((entry) => entry.index === item.index) ? { ...item, status: 'stopped', retryAt: undefined, reconciling: true } : item),
          timeline: [...run.timeline, ...changed.map((item) => timelineEntry(item.index, 'stopped', `Item ${item.index + 1} stopped by operator`))],
          updatedAt: Date.now(),
        } : run),
      } : job),
      ui: { ...current.ui, announcement: `${pair.job.name} stopped; completed outputs were preserved` },
    }))
    stopTimer(pair.job.id)
    window.setTimeout(() => set((current) => ({ jobs: current.jobs.map((job) => job.id === pair.job.id ? { ...job, runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, items: run.items.map((item) => ({ ...item, reconciling: false })) } : run) } : job) })), 650)
  },
  retryFailed: (explicitId) => {
    const state = get()
    const pair = currentRun(state, explicitId)
    if (!pair) return
    const failed = pair.run.items.filter((item) => item.status === 'failed')
    if (!failed.length) return
    set((current) => ({
      jobs: current.jobs.map((job) => job.id === pair.job.id ? {
        ...job,
        status: 'Running',
        runs: job.runs.map((run) => run.id === pair.run.id ? {
          ...run,
          status: 'running',
          endedAt: undefined,
          items: run.items.map((item) => item.status === 'failed' ? { ...item, status: 'pending', error: undefined, manualRetry: true, reconciling: true } : item),
          queue: [...run.queue, ...failed.map((item) => item.index)],
          timeline: [...run.timeline, ...failed.map((item) => timelineEntry(item.index, 'pending', `Item ${item.index + 1} re-queued by operator`))],
          updatedAt: Date.now(),
        } : run),
      } : job),
      ui: { ...current.ui, announcement: `${failed.length} failed items re-queued`, toast: { id: Date.now(), kind: 'info', title: 'Failed items re-queued', subtitle: `Only ${failed.length} failed ${failed.length === 1 ? 'item' : 'items'} will run again.` } },
    }))
    ensureTimer(pair.job.id)
    window.setTimeout(() => set((current) => ({ jobs: current.jobs.map((job) => job.id === pair.job.id ? { ...job, runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, items: run.items.map((item) => ({ ...item, reconciling: false })) } : run) } : job) })), 650)
  },
  simulateWindowStart: () => {
    const scheduled = get().jobs.filter((job) => job.schedule && ['Ready', 'Scheduled'].includes(job.status))
    scheduled.forEach((job) => get().launchJob(job.id))
    set((state) => ({ ui: { ...state.ui, toast: { id: Date.now(), kind: 'success', title: 'Window start simulated', subtitle: `${scheduled.length} scheduled ${scheduled.length === 1 ? 'job' : 'jobs'} launched.` } } }))
    return scheduled.length
  },
  reorderQueue: (fromIndex, toIndex) => set((state) => {
    const pair = currentRun(state)
    if (!pair || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= pair.run.queue.length || toIndex >= pair.run.queue.length) return state
    const queue = [...pair.run.queue]
    const [moved] = queue.splice(fromIndex, 1)
    queue.splice(toIndex, 0, moved)
    return {
      jobs: state.jobs.map((job) => job.id === pair.job.id ? { ...job, runs: job.runs.map((run) => run.id === pair.run.id ? { ...run, queue, updatedAt: Date.now() } : run) } : job),
      past: [...state.past, snapshotOf(state)].slice(-50),
      future: [],
    }
  }),
  moveQueueItem: (itemIndex, direction) => {
    const state = get()
    const pair = currentRun(state)
    if (!pair) return
    const from = pair.run.queue.indexOf(itemIndex)
    const to = from + direction
    if (from >= 0 && to >= 0 && to < pair.run.queue.length) get().reorderQueue(from, to)
  },
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { ...deepClone(previous), past: state.past.slice(0, -1), future: [snapshotOf(state), ...state.future].slice(0, 50), ui: { ...state.ui, inspectorIndex: null, toast: { id: Date.now(), kind: 'info', title: 'Change undone', subtitle: 'The previous operator state was restored.' } } }
  }),
  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return state
    return { ...deepClone(next), past: [...state.past, snapshotOf(state)].slice(-50), future: state.future.slice(1), ui: { ...state.ui, inspectorIndex: null, toast: { id: Date.now(), kind: 'info', title: 'Change redone', subtitle: 'The operator change was applied again.' } } }
  }),
  importReport: (value) => {
    const parsed = runReportSchema.safeParse(value)
    if (!parsed.success) return { ok: false, error: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'report'}: ${issue.message}`).join('; ') }
    const report = parsed.data
    if (report.run.rollups.total !== report.run.items.length) return { ok: false, error: 'run.rollups.total: must equal the number of run.items' }
    const reportComplete = report.run.items.filter((item) => item.status === 'complete').length
    const reportFailed = report.run.items.filter((item) => item.status === 'failed').length
    const reportCost = Number(report.run.items.reduce((sum, item) => sum + item.cost, 0).toFixed(8))
    const reportFailureRate = report.run.items.length ? Number(((reportFailed / report.run.items.length) * 100).toFixed(1)) : 0
    if (report.run.rollups.completed !== reportComplete) return { ok: false, error: 'run.rollups.completed: must equal the number of complete items' }
    if (Math.abs(report.run.rollups.totalCost - reportCost) > 0.00000001) return { ok: false, error: 'run.rollups.totalCost: must equal the sum of item costs' }
    if (Math.abs(report.run.rollups.failureRate - reportFailureRate) > 0.05) return { ok: false, error: 'run.rollups.failureRate: must match failed items' }
    const jobId = uid('imported-job')
    const runId = uid('imported-run')
    const dataset: DatasetRow[] = report.job.dataset.length ? report.job.dataset : report.run.items.map((item) => ({ input: item.input }))
    const items: RunItem[] = report.run.items.map((item) => ({
      ...item,
      expected: dataset[item.index]?.expected,
      startedAt: item.status === 'running' ? report.run.startedAt : undefined,
      retryAt: item.status === 'retrying' ? Date.now() + 1000 : undefined,
      attemptsLog: [{ attempt: item.attempts, timestamp: report.run.startedAt, outcome: item.status === 'complete' ? 'complete' : 'failed', detail: 'Restored from Run Report' }],
      tokenCount: item.cost && modelRate(report.job.model) ? Math.round((item.cost / modelRate(report.job.model)) * 1000) : 0,
    }))
    const active = items.some((item) => ['pending', 'running', 'retrying'].includes(item.status))
    const run: Run = {
      id: runId,
      startedAt: report.run.startedAt,
      status: active ? 'paused' : items.some((item) => item.status === 'stopped') ? 'stopped' : 'complete',
      items,
      queue: items.filter((item) => item.status === 'pending').map((item) => item.index),
      timeline: deepClone(report.run.timeline),
      frozenEta: active ? report.run.rollups.estimatedRemainingMs : 0,
      ordinal: 1,
      updatedAt: Date.now(),
    }
    const job: Job = {
      ...deepClone(report.job),
      dataset,
      id: jobId,
      createdAt: report.exportedAt,
      status: active ? 'Paused' : run.status === 'stopped' ? 'Stopped' : 'Complete',
      runs: [run],
    }
    set((state) => ({
      jobs: [...state.jobs, job],
      selectedJobId: jobId,
      selectedRunId: runId,
      past: [...state.past, snapshotOf(state)].slice(-50),
      future: [],
      ui: { ...state.ui, importOpen: false, importDraft: '', toast: { id: Date.now(), kind: 'success', title: 'Run report imported', subtitle: `${job.name} and its run were restored.` } },
    }))
    return { ok: true, jobId }
  },
  setUi: (patch) => set((state) => ({ ui: { ...state.ui, ...patch } })),
  showToast: (kind, title, subtitle) => set((state) => ({ ui: { ...state.ui, toast: { id: Date.now(), kind, title, subtitle } } })),
  clearToast: () => set((state) => ({ ui: { ...state.ui, toast: null } })),
  tickJob: (jobId) => {
    const state = get()
    const job = state.jobs.find((entry) => entry.id === jobId)
    const run = job ? [...job.runs].reverse().find((entry) => entry.status === 'running' || entry.status === 'paused') : undefined
    if (!job || !run || !['running', 'paused'].includes(run.status)) { stopTimer(jobId); return }
    const timestamp = Date.now()
    let items = run.items.map((item) => ({ ...item }))
    let queue = [...run.queue]
    const events: TimelineEntry[] = []
    let announcement = state.ui.announcement

    for (const item of items) {
      if (item.status === 'running' && item.startedAt && timestamp - Date.parse(item.startedAt) >= 240 + ((item.index * 61) % 300)) {
        const candidate = deterministicCandidate(job, item)
        const shouldFailAttempt = !item.manualRetry && candidate && (item.attempts === 1 || deterministicPermanent(job, run, item))
        if (shouldFailAttempt && item.attempts < 3) {
          const latency = timestamp - Date.parse(item.startedAt)
          item.status = 'retrying'
          item.retryAt = timestamp + 1100
          item.latencyMs = (item.latencyMs ?? 0) + latency
          const tokens = 64 + (item.index % 80)
          item.tokenCount += tokens
          item.cost = Number((item.cost + (tokens / 1000) * modelRate(job.model)).toFixed(8))
          item.attemptsLog = [...item.attemptsLog, { attempt: item.attempts, timestamp: nowIso(), outcome: 'failed', detail: 'Simulated provider timeout; backoff scheduled' }]
          events.push(timelineEntry(item.index, 'retrying', `Item ${item.index + 1} waiting before retry ${item.attempts + 1} of 3`))
        } else if (shouldFailAttempt) {
          const latency = timestamp - Date.parse(item.startedAt)
          item.status = 'failed'
          item.latencyMs = (item.latencyMs ?? 0) + latency
          item.error = 'Retry limit reached after a simulated provider timeout.'
          item.completedAt = nowIso()
          item.attemptsLog = [...item.attemptsLog, { attempt: item.attempts, timestamp: item.completedAt, outcome: 'failed', detail: item.error }]
          item.cost = Number((item.cost + ((64 + item.index % 80) / 1000) * modelRate(job.model)).toFixed(8))
          events.push(timelineEntry(item.index, 'failed', `Item ${item.index + 1} failed after ${item.attempts} attempts`))
          announcement = `Item ${item.index + 1} entered the failed state`
        } else {
          const latency = timestamp - Date.parse(item.startedAt)
          const tokens = 130 + ((item.index * 47 + run.ordinal * 29) % 620)
          item.status = 'complete'
          item.latencyMs = (item.latencyMs ?? 0) + latency
          item.tokenCount += tokens
          item.cost = Number((item.cost + (tokens / 1000) * modelRate(job.model)).toFixed(8))
          item.output = makeOutput(job, item, run)
          item.completedAt = nowIso()
          item.error = undefined
          item.attemptsLog = [...item.attemptsLog, { attempt: item.attempts, timestamp: item.completedAt, outcome: 'complete', detail: 'Output accepted' }]
          events.push(timelineEntry(item.index, 'complete', `Item ${item.index + 1} completed in ${latency} ms`))
        }
      }
    }

    if (run.status === 'running') {
      let running = items.filter((item) => item.status === 'running').length
      for (const item of items) {
        if (item.status === 'retrying' && item.retryAt && timestamp >= item.retryAt) {
          if (running >= job.concurrency) continue
          item.status = 'running'
          item.attempts += 1
          item.startedAt = nowIso()
          item.retryAt = undefined
          events.push(timelineEntry(item.index, 'running', `Item ${item.index + 1} started retry ${item.attempts} of 3`))
          running += 1
        }
      }
      while (running < job.concurrency && queue.length) {
        const nextIndex = queue.shift()!
        const item = items.find((entry) => entry.index === nextIndex)
        if (!item || item.status !== 'pending') continue
        if (item.manualRetry) item.attempts += 1
        item.status = 'running'
        item.startedAt = nowIso()
        events.push(timelineEntry(item.index, 'running', `Item ${item.index + 1} started attempt ${item.attempts}`))
        running += 1
      }
    }

    const settled = items.every((item) => ['complete', 'failed', 'stopped'].includes(item.status))
    const nextRunStatus: RunStatus = settled ? 'complete' : run.status
    const nextJobStatus: JobStatus = settled ? 'Complete' : run.status === 'paused' ? 'Paused' : 'Running'
    set((current) => ({
      jobs: current.jobs.map((entry) => entry.id === jobId ? {
        ...entry,
        status: nextJobStatus,
        runs: entry.runs.map((candidate) => candidate.id === run.id ? {
          ...candidate,
          status: nextRunStatus,
          endedAt: settled ? nowIso() : candidate.endedAt,
          items,
          queue,
          timeline: [...candidate.timeline, ...events],
          updatedAt: Date.now(),
        } : candidate),
      } : entry),
      ui: { ...current.ui, announcement: settled ? `${job.name} run completed` : announcement, toast: settled ? { id: Date.now(), kind: 'success', title: 'Run complete', subtitle: `${job.name} finished processing ${items.length} items.` } : current.ui.toast },
    }))
    if (settled || (run.status === 'paused' && !items.some((item) => item.status === 'running'))) stopTimer(jobId)
  },
}))

export function selectedEntities(state = useBatchStore.getState()) {
  const job = state.jobs.find((entry) => entry.id === state.selectedJobId)
  const run = job?.runs.find((entry) => entry.id === state.selectedRunId) ?? job?.runs.at(-1)
  return { job, run }
}

export function compileRunReport(job: Job, run: Run, exportedAt = nowIso()): RunReport {
  const rollups = deriveRollups(run, job.concurrency)
  return {
    schemaVersion: 'batch-run-v1',
    exportedAt,
    job: {
      name: job.name,
      promptTemplate: job.promptTemplate,
      model: job.model,
      concurrency: job.concurrency,
      dataset: deepClone(job.dataset),
      schedule: job.schedule ? deepClone(job.schedule) : null,
    },
    run: {
      startedAt: run.startedAt,
      items: run.items.map(({ index, input, output, status, attempts, latencyMs, cost }) => ({ index, input, output, status, attempts: Math.max(1, attempts), latencyMs, cost })),
      rollups,
      timeline: run.timeline.map(({ id, timestamp, status, itemIndex, label }) => ({ id, timestamp, status, itemIndex, label })),
    },
  }
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function compileRunCsv(run: Run): string {
  const headers = ['index', 'input', 'output', 'status', 'attempts', 'latencyMs', 'cost']
  return [headers.join(','), ...run.items.map((item) => [item.index, item.input, item.output, item.status, item.attempts, item.latencyMs, item.cost.toFixed(8)].map(csvCell).join(','))].join('\n')
}

export function compileCalendar(jobs: Job[]): string {
  const scheduled = jobs.filter((job) => job.schedule)
  const format = (iso: string) => new Date(iso).toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Batchline//Operator Schedule//EN',
    'CALSCALE:GREGORIAN',
    ...scheduled.flatMap((job) => [
      'BEGIN:VEVENT',
      `UID:${job.id}@batchline.local`,
      `DTSTAMP:${format(nowIso())}`,
      `DTSTART:${format(job.schedule!.windowStart)}`,
      `DTEND:${format(job.schedule!.windowEnd)}`,
      `SUMMARY:${job.name.replaceAll(',', '\\,')}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ].join('\r\n')
}

export function validateImportedReport(value: unknown) {
  return runReportSchema.safeParse(value)
}

export { ITEM_STATUSES }
