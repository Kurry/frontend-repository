import { create } from 'zustand'
import { taskManifestSchema } from '../lib/schemas'

let createDialogOpener = null

export const STAGES = ['Fetch', 'Evaluate', 'Skeleton', 'Generate', 'Validate']
export const VERDICTS = ['good-success', 'bad-success', 'good-failure', 'bad-failure', 'infrastructure-error', 'timeout']
export const EVENT_STATUSES = ['started', 'completed', 'failed', 'retry', 'accepted', 'skipped']

const stageSet = (statuses, attempts = {}) => STAGES.map((name, index) => ({
  name,
  status: statuses[index] || 'pending',
  attemptCount: attempts[name] || 1,
  startedAt: statuses[index] && statuses[index] !== 'pending' ? new Date(Date.now() - (5 - index) * 130000).toISOString() : null,
  completedAt: statuses[index] === 'complete' ? new Date(Date.now() - (4 - index) * 125000).toISOString() : null,
}))

const check = (status, attempts, log) => ({ status, attemptCount: attempts, log })

const trialSeed = [
  { id: 'trial-01', verdict: 'good-success', duration: '2m 14s', agent: 'Kepler 4B', note: 'Minimal patch; all generated assertions pass.' },
  { id: 'trial-02', verdict: 'bad-success', duration: '1m 49s', agent: 'Kepler 4B', note: 'Passed by weakening an unrelated assertion.' },
  { id: 'trial-03', verdict: 'good-failure', duration: '3m 02s', agent: 'Nacre 7B', note: 'Located the fault but missed a boundary condition.' },
  { id: 'trial-04', verdict: 'good-success', duration: '2m 31s', agent: 'Nacre 7B', note: 'Correct implementation with focused regression test.' },
  { id: 'trial-05', verdict: 'bad-failure', duration: '1m 08s', agent: 'Kepler 4B', note: 'Edited generated fixtures outside task scope.' },
  { id: 'trial-06', verdict: 'infrastructure-error', duration: '0m 19s', agent: 'Mica 3B', note: 'Sandbox provisioner timed out before checkout.' },
  { id: 'trial-07', verdict: 'good-failure', duration: '2m 56s', agent: 'Mica 3B', note: 'Sound diagnosis; incomplete migration step.' },
]

const makePr = (repo, number, title, files, options = {}) => {
  const statuses = options.statuses || ['complete', 'complete', 'complete', 'complete', 'complete']
  const naturallyAccepted = !options.rejectionReason && statuses.every((status) => status === 'complete') && !options.checks
  const createdAt = options.createdAt || '2026-07-14T09:30:00.000Z'
  return {
    id: `${repo}-${number}`,
    repository: repo,
    number,
    title,
    fileCount: files,
    linkedIssue: options.linkedIssue === undefined ? `ISS-${number - 80}` : options.linkedIssue,
    rejectionReason: options.rejectionReason || null,
    stages: stageSet(statuses, options.attempts),
    checks: options.checks || (naturallyAccepted ? {
      baseline: check('passing', 1, 'FAIL reproduced_case\nBaseline reproduced the regression.'),
      reference: check('passing', 1, 'PASS reproduced_case\nReference fix passed all checks.'),
    } : null),
    trials: options.trials || (naturallyAccepted ? trialSeed.filter((trial) => trial.verdict !== 'bad-success') : []),
    request: options.request || (naturallyAccepted ? { repository: repo, pullRequestNumber: String(number), minFiles: 1, maxFiles: Math.max(files, 2) } : null),
    createdAt,
    generatedAt: options.generatedAt || (naturallyAccepted ? createdAt : null),
    sessionCreated: false,
    difficulty: options.difficulty || (files <= 5 ? 'Easy' : files <= 12 ? 'Medium' : 'Hard'),
  }
}

const repositories = [
  { id: 'quartz-orm', name: 'quartz-orm', language: 'TypeScript', description: 'Relational query planning and schema tools' },
  { id: 'copperline', name: 'copperline', language: 'Rust', description: 'Streaming transform runtime and worker protocol' },
  { id: 'fernweh-gateway', name: 'fernweh-gateway', language: 'Go', description: 'Edge policy routing and request controls' },
  { id: 'lattice-db', name: 'lattice-db', language: 'Python', description: 'Embedded analytical storage engine' },
]

const cleanTrials = trialSeed.filter((trial) => trial.verdict !== 'bad-success')

const prs = {
  'quartz-orm': [
    makePr('quartz-orm', 184, 'Preserve parameter order across nested relation filters', 9, {
      checks: {
        baseline: check('passing', 1, 'FAIL nested_relation_order\nExpected [org_id, state], received [state, org_id]\nBaseline reproduced the regression.'),
        reference: check('passing', 1, 'PASS nested_relation_order\nPASS filter_parameter_binding\n24 checks completed in 3.8s.'),
      },
      trials: trialSeed,
      request: { repository: 'quartz-orm', pullRequestNumber: '184', minFiles: 2, maxFiles: 20 },
      attempts: { Generate: 2 },
      generatedAt: '2026-07-14T09:42:18.000Z',
      createdAt: '2026-07-14T09:30:00.000Z',
    }),
    makePr('quartz-orm', 183, 'Stabilize cursor pagination without bad-success trial noise', 8, {
      checks: {
        baseline: check('passing', 1, 'FAIL cursor_pagination\nBaseline reproduced the regression.'),
        reference: check('passing', 1, 'PASS cursor_pagination\nReference fix passed all checks.'),
      },
      trials: cleanTrials,
      request: { repository: 'quartz-orm', pullRequestNumber: '183', minFiles: 2, maxFiles: 20 },
      generatedAt: '2026-07-13T16:12:00.000Z',
      createdAt: '2026-07-13T16:00:00.000Z',
    }),
    makePr('quartz-orm', 181, 'Refresh query builder documentation examples', 3, { linkedIssue: null, rejectionReason: 'docs-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('quartz-orm', 179, 'Normalize whitespace in generated migration snapshots', 6, { rejectionReason: 'formatting-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('quartz-orm', 176, 'Add composite cursor support for paginated relation loading', 14, { statuses: ['complete', 'complete', 'complete', 'running', 'pending'] }),
    makePr('quartz-orm', 173, 'Repair nullable enum coercion during batch insert operations', 7, { checks: { baseline: check('passing', 1, 'FAIL nullable_enum_batch\nRegression reproduced.'), reference: check('failing', 2, 'FAIL nullable_enum_batch\nUnexpected null coercion in row 14.') }, trials: trialSeed.slice(2) }),
    makePr('quartz-orm', 170, 'Rename internal token helper', 1, { rejectionReason: 'too-few-files', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('quartz-orm', 168, 'Split tenant-aware transaction context from connection pool acquisition', 18, {
      trials: cleanTrials,
      request: { repository: 'quartz-orm', pullRequestNumber: '168', minFiles: 2, maxFiles: 40 },
    }),
    makePr('quartz-orm', 165, 'Guard relation mapper when projected keys contain duplicate aliases', 8, { linkedIssue: null, rejectionReason: 'no-linked-issue', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
  ],
  copperline: [
    makePr('copperline', 292, 'Prevent partition cursor rewind after an interrupted checkpoint commit', 12, { createdAt: '2026-07-08T08:10:00.000Z' }),
    makePr('copperline', 289, 'Add bounded retry window to worker lease renewal', 8),
    makePr('copperline', 286, 'Reformat protocol fixtures', 4, { rejectionReason: 'formatting-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('copperline', 282, 'Expose stream watermark lag in worker diagnostics', 6, { statuses: ['complete', 'complete', 'complete', 'complete', 'running'], checks: { baseline: check('passing', 1, 'FAIL watermark_lag\nRegression reproduced.'), reference: check('pending', 1, 'Waiting for reference sandbox.') } }),
    makePr('copperline', 279, 'Replace checkpoint serialization format across runtime and worker crates', 43, { rejectionReason: 'too-many-files', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('copperline', 276, 'Handle zero-capacity backpressure channels without spinning', 5),
    makePr('copperline', 271, 'Update deployment guide for lease settings', 2, { linkedIssue: null, rejectionReason: 'docs-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('copperline', 268, 'Cancel orphaned transforms when a parent stream closes', 11),
  ],
  'fernweh-gateway': [
    makePr('fernweh-gateway', 418, 'Keep header canonicalization stable across policy rewrites and chained upstream retries', 10, { createdAt: '2026-07-01T14:00:00.000Z' }),
    makePr('fernweh-gateway', 415, 'Reject malformed weighted route definitions before activation', 7),
    makePr('fernweh-gateway', 411, 'Document policy ordering', 3, { rejectionReason: 'docs-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('fernweh-gateway', 408, 'Attach trace context to deferred origin health checks', 8),
    makePr('fernweh-gateway', 404, 'Consolidate edge fixture formatting', 5, { rejectionReason: 'formatting-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('fernweh-gateway', 399, 'Apply request body limits before decompression', 13),
    makePr('fernweh-gateway', 395, 'Lift shared gateway configuration into generated packages', 51, { rejectionReason: 'too-many-files', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('fernweh-gateway', 391, 'Repair IPv6 host matching in wildcard policies', 6),
  ],
  'lattice-db': [
    makePr('lattice-db', 126, 'Release pinned pages after a cancelled vectorized scan', 9, { createdAt: '2026-06-24T11:00:00.000Z' }),
    makePr('lattice-db', 123, 'Preserve dictionary encoding through union projections', 12),
    makePr('lattice-db', 120, 'Correct null ordering in descending merge joins', 8),
    makePr('lattice-db', 117, 'Update storage layout notes', 2, { linkedIssue: null, rejectionReason: 'docs-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('lattice-db', 114, 'Avoid eager materialization of filtered parquet row groups', 15),
    makePr('lattice-db', 109, 'Sort import declarations', 3, { rejectionReason: 'formatting-only', statuses: ['complete', 'complete', 'skipped', 'skipped', 'skipped'] }),
    makePr('lattice-db', 106, 'Propagate decimal scale through aggregation expressions', 7),
    makePr('lattice-db', 102, 'Return stable snapshot ids after compaction', 6),
  ],
}

const seedEvents = [
  { id: 'evt-8', at: '2026-07-14T09:42:18.000Z', status: 'accepted', repository: 'quartz-orm', prNumber: 184, text: 'Task accepted' },
  { id: 'evt-7', at: '2026-07-14T09:42:10.000Z', status: 'completed', repository: 'quartz-orm', prNumber: 184, text: 'Validate completed' },
  { id: 'evt-6', at: '2026-07-14T09:41:32.000Z', status: 'started', repository: 'quartz-orm', prNumber: 184, text: 'Validate started' },
  { id: 'evt-5', at: '2026-07-14T09:40:48.000Z', status: 'completed', repository: 'quartz-orm', prNumber: 184, text: 'Generate completed' },
  { id: 'evt-4', at: '2026-07-14T09:39:13.000Z', status: 'retry', repository: 'quartz-orm', prNumber: 184, text: 'Generate retry scheduled · attempt 2' },
  { id: 'evt-3', at: '2026-07-14T09:39:01.000Z', status: 'failed', repository: 'quartz-orm', prNumber: 184, text: 'Generate failed · attempt 1' },
  { id: 'evt-2', at: '2026-07-14T09:31:09.000Z', status: 'completed', repository: 'quartz-orm', prNumber: 184, text: 'Fetch completed' },
  { id: 'evt-1', at: '2026-07-14T09:30:00.000Z', status: 'started', repository: 'quartz-orm', prNumber: 184, text: 'Fetch started' },
]

function addEvent(set, payload) {
  set((state) => ({
    events: [{ id: `evt-${Date.now()}-${Math.random()}`, at: new Date().toISOString(), fresh: true, ...payload }, ...state.events],
  }))
}

function updatePr(set, repoId, prId, updater) {
  set((state) => ({
    pullRequests: {
      ...state.pullRequests,
      [repoId]: state.pullRequests[repoId].map((pr) => pr.id === prId ? updater(pr) : pr),
    },
  }))
}

function buildManifest(pr) {
  if (!pr?.request || pr.checks?.baseline?.status !== 'passing' || pr.checks?.reference?.status !== 'passing') return null
  const stages = STAGES.map((name, index) => {
    const stage = pr.stages?.[index]
    return {
      name,
      status: 'complete',
      attemptCount: Math.max(1, Number(stage?.attemptCount) || 1),
    }
  })
  const payload = {
    schemaVersion: 1,
    id: pr.id,
    repository: pr.request.repository,
    pullRequestNumber: Number(pr.request.pullRequestNumber),
    minFiles: Number(pr.request.minFiles),
    maxFiles: Number(pr.request.maxFiles),
    checks: { skeleton: true, validate: true },
    stages,
    generatedAt: pr.generatedAt && /Z$/.test(pr.generatedAt) ? pr.generatedAt : new Date().toISOString(),
  }
  const parsed = taskManifestSchema.safeParse(payload)
  return parsed.success ? parsed.data : null
}

const seedManifestLedger = Object.values(prs).flat()
  .map((pr) => buildManifest(pr))
  .filter(Boolean)

export const useFactoryStore = create((set, get) => ({
  repositories,
  pullRequests: prs,
  events: seedEvents,
  activeView: 'repositories',
  selectedRepositoryId: null,
  selectedPrId: null,
  trialFilter: null,
  timelineFilter: null,
  pipelineQuery: '',
  pipelineSort: 'newest',
  pipelineStatusFilter: 'all',
  expandedLogs: {},
  createDialogOpen: false,
  mobileNavOpen: false,
  toasts: [],
  runningIds: [],
  manifestLedger: seedManifestLedger,
  lastExportCount: seedManifestLedger.length,
  theme: 'light',
  onboardingStep: 0,
  createDrafts: {
    'quartz-orm': { repository: 'quartz-orm', pullRequestNumber: '', minFiles: '2', maxFiles: '20' },
    'copperline': { repository: 'copperline', pullRequestNumber: '', minFiles: '2', maxFiles: '20' },
    'fernweh-gateway': { repository: 'fernweh-gateway', pullRequestNumber: '', minFiles: '2', maxFiles: '20' },
    'lattice-db': { repository: 'lattice-db', pullRequestNumber: '', minFiles: '2', maxFiles: '20' },
  },
  gestureMode: false,
  density: 'comfortable',

  // Keep create dialog open across view switches so interleaved drafts stay intact.
  navigate: (view) => set({ activeView: view, mobileNavOpen: false }),
  openRepository: (repoId) => set({ activeView: 'repository-pipeline', selectedRepositoryId: repoId, selectedPrId: null, mobileNavOpen: false }),
  openTask: (repoId, prId) => set((state) => ({
    activeView: 'task-detail',
    selectedRepositoryId: repoId,
    selectedPrId: prId,
    trialFilter: state.selectedRepositoryId === repoId && state.selectedPrId === prId ? state.trialFilter : null,
  })),
  backToPipeline: () => set({ activeView: 'repository-pipeline', selectedPrId: null }),
  setTrialFilter: (trialFilter) => set({ trialFilter }),
  setTimelineFilter: (timelineFilter) => set({ timelineFilter }),
  setPipelineQuery: (pipelineQuery) => set({ pipelineQuery }),
  setPipelineSort: (pipelineSort) => set({ pipelineSort }),
  setPipelineStatusFilter: (pipelineStatusFilter) => set({ pipelineStatusFilter }),
  toggleLog: (key) => set((state) => ({ expandedLogs: { ...state.expandedLogs, [key]: !state.expandedLogs[key] } })),
  setCreateDialogOpen: (createDialogOpen) => {
    if (createDialogOpen && typeof document !== 'undefined') createDialogOpener = document.activeElement
    set({ createDialogOpen })
    if (!createDialogOpen && createDialogOpener?.focus) {
      window.setTimeout(() => createDialogOpener?.focus(), 0)
    }
  },
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setTheme: (theme) => {
    set({ theme })
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
  },
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  setCreateDraft: (repo, draft) => set((state) => ({ createDrafts: { ...state.createDrafts, [repo]: draft } })),
  setGestureMode: (gestureMode) => set({ gestureMode }),
  setDensity: (density) => set({ density }),
  clearRepositoryRegister: (repoId) => {
    if (!repoId) return
    set((state) => ({
      pullRequests: { ...state.pullRequests, [repoId]: [] },
      selectedPrId: null,
      pipelineQuery: '',
      pipelineStatusFilter: 'all',
      activeView: 'repository-pipeline',
      selectedRepositoryId: repoId,
    }))
    get().addToast(`Cleared ${repoId} pipeline register`, 'info')
  },
  restoreRepositoryRegister: (repoId) => {
    if (!repoId || !prs[repoId]) return
    set((state) => ({
      pullRequests: { ...state.pullRequests, [repoId]: prs[repoId].map((pr) => ({ ...pr })) },
      selectedPrId: null,
      pipelineQuery: '',
      pipelineStatusFilter: 'all',
      activeView: 'repository-pipeline',
      selectedRepositoryId: repoId,
    }))
    get().addToast(`Restored ${repoId} seed register`, 'success')
  },
  addToast: (message, kind = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    set((state) => ({ toasts: [...state.toasts, { id, message, kind }] }))
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 4200)
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  getManifest: (pr) => buildManifest(pr),

  listAcceptedManifests: () => {
    const state = get()
    const byId = new Map()
    // Ledger is append-only provenance — never drop prior accepted exports
    state.manifestLedger.forEach((manifest) => byId.set(manifest.id, manifest))
    acceptedTasks(state).forEach((pr) => {
      const manifest = buildManifest(pr)
      if (manifest) byId.set(manifest.id, manifest)
    })
    return [...byId.values()]
  },

  startRun: (body) => {
    const runKey = `${body.repository}-${body.pullRequestNumber}`
    if (get().runningIds.includes(runKey)) return null
    const id = `${body.repository}-session-${body.pullRequestNumber}-${Date.now()}`
    const newPr = {
      id,
      repository: body.repository,
      number: Number(body.pullRequestNumber),
      title: `Generate benchmark task from merged change #${body.pullRequestNumber}`,
      fileCount: Math.max(body.minFiles, Math.min(body.maxFiles, Math.round((body.minFiles + body.maxFiles) / 2))),
      linkedIssue: `ISS-${String(Date.now()).slice(-4)}`,
      rejectionReason: null,
      stages: stageSet(['pending', 'pending', 'pending', 'pending', 'pending']),
      checks: null,
      trials: [],
      request: { ...body },
      createdAt: new Date().toISOString(),
      generatedAt: null,
      sessionCreated: true,
      fresh: true,
      difficulty: body.maxFiles <= 5 ? 'Easy' : body.maxFiles <= 15 ? 'Medium' : 'Hard',
    }
    set((state) => ({
      pullRequests: { ...state.pullRequests, [body.repository]: [newPr, ...state.pullRequests[body.repository]] },
      runningIds: [...state.runningIds, runKey],
      createDialogOpen: false,
      activeView: 'repository-pipeline',
      selectedRepositoryId: body.repository,
    }))
    get().addToast(`Run started for ${body.repository} #${body.pullRequestNumber}`, 'info')

    const transition = (stageIndex, status, attemptCount = 1) => {
      const stageName = STAGES[stageIndex]
      const now = new Date().toISOString()
      updatePr(set, body.repository, id, (pr) => ({
        ...pr,
        stages: pr.stages.map((stage, index) => index === stageIndex ? {
          ...stage,
          status,
          attemptCount,
          startedAt: status === 'running' ? (stage.startedAt || now) : stage.startedAt,
          completedAt: status === 'complete' ? now : stage.completedAt,
        } : stage),
      }))
      const statusMap = { running: 'started', complete: 'completed', failed: 'failed' }
      addEvent(set, {
        status: statusMap[status], repository: body.repository, prNumber: Number(body.pullRequestNumber),
        text: `${stageName} ${status === 'complete' ? 'completed' : status === 'running' ? 'started' : 'failed'}${status === 'failed' ? ` · attempt ${attemptCount}` : ''}`,
      })
    }

    let delay = 300
    STAGES.forEach((stageName, index) => {
      window.setTimeout(() => transition(index, 'running', index === 3 ? 1 : 1), delay)
      delay += 650
      if (index === 3) {
        window.setTimeout(() => transition(index, 'failed', 1), delay)
        delay += 300
        window.setTimeout(() => addEvent(set, { status: 'retry', repository: body.repository, prNumber: Number(body.pullRequestNumber), text: 'Generate retry scheduled · attempt 2' }), delay)
        delay += 650
        window.setTimeout(() => transition(index, 'running', 2), delay)
        delay += 650
      }
      window.setTimeout(() => transition(index, 'complete', index === 3 ? 2 : 1), delay)
      delay += 250
    })
    window.setTimeout(() => {
      const generatedAt = new Date().toISOString()
      let manifest = null
      set((state) => {
        const nextPullRequests = {
          ...state.pullRequests,
          [body.repository]: state.pullRequests[body.repository].map((pr) => {
            if (pr.id !== id) return pr
            return {
              ...pr,
              stages: pr.stages.map((stage, index) => ({
                ...stage,
                status: 'complete',
                attemptCount: index === 3 ? Math.max(2, stage.attemptCount || 2) : Math.max(1, stage.attemptCount || 1),
                completedAt: stage.completedAt || generatedAt,
              })),
              checks: {
                baseline: check('passing', 1, 'FAIL regression_case\nExpected current behavior to fail.\nBaseline reproduced the reported defect.'),
                reference: check('passing', 1, 'PASS regression_case\nPASS related_behavior\nReference fix completed successfully.'),
              },
              trials: trialSeed.map((trial, index) => ({ ...trial, id: `${id}-trial-${index + 1}` })),
              generatedAt,
            }
          }),
        }
        const accepted = nextPullRequests[body.repository].find((pr) => pr.id === id)
        manifest = accepted ? buildManifest(accepted) : null
        const ledger = manifest
          ? [...state.manifestLedger.filter((item) => item.id !== manifest.id), manifest]
          : state.manifestLedger
        return {
          pullRequests: nextPullRequests,
          runningIds: state.runningIds.filter((item) => item !== runKey),
          selectedPrId: id,
          selectedRepositoryId: body.repository,
          activeView: 'task-detail',
          manifestLedger: ledger,
          lastExportCount: ledger.length,
        }
      })
      addEvent(set, { status: 'accepted', repository: body.repository, prNumber: Number(body.pullRequestNumber), text: 'Task accepted' })
      get().addToast(`Task accepted · ${body.repository} #${body.pullRequestNumber}`, 'success')
      get().addToast(`Run completed · ${body.repository} #${body.pullRequestNumber}`, 'success')
    }, delay + 200)
    return id
  },
}))

export const isAccepted = (pr) => pr?.checks?.baseline?.status === 'passing' && pr?.checks?.reference?.status === 'passing'

export const repositoryRollup = (state, repoId) => {
  const items = state.pullRequests[repoId] || []
  const tasks = items.filter(isAccepted).length
  return { processed: items.length, tasks, yield: items.length ? Math.round(tasks / items.length * 100) : 0 }
}

export const acceptedTasks = (state) => Object.values(state.pullRequests).flat().filter(isAccepted)
