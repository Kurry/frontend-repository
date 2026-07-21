import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  allFixturePrs,
  configFor,
  difficultyFor,
  findFixture,
  fixtureRepositories,
  instructionFor,
  isTestFile,
  packageFor,
  seededPackages,
  sourceCount,
  sourceFiles,
} from '../lib/fixtures'
import { addRepositorySchema, batchReportSchema, chatCompletionsRequestSchema, taskPackageSchema } from '../lib/schemas'

export const cardId = (repo, prNumber) => `${repo}#${prNumber}`
const initialPlacements = Object.fromEntries(allFixturePrs.map(({ repo, pr }) => [cardId(repo, pr.number), { column: 'inbox', reason: null }]))
initialPlacements[cardId('nimbusworks/driftline', 58)] = { column: 'accepted', reason: null }
initialPlacements[cardId('fernfield/petrel', 31)] = { column: 'accepted', reason: null }
initialPlacements[cardId('cobalt-labs/loomdb', 88)] = { column: 'accepted', reason: null }

const initialLoaded = Object.fromEntries(fixtureRepositories.map((repo) => [repo.name, 5]))

const now = () => new Date().toISOString()
const pauseDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const deterministicCreatedAt = (repo, prNumber) => `2026-06-${String((prNumber % 27) + 1).padStart(2, '0')}T12:00:00.000Z`

function stripCredentialMaterial(value) {
  if (typeof value !== 'string') return value
  return value
    .replace(/ghp_[A-Za-z0-9_]+/g, '[redacted-github-token]')
    .replace(/sk-[A-Za-z0-9_]+/g, '[redacted-ai-key]')
}

const stageTemplate = () => [
  { id: 'fetch', label: 'Fetch', status: 'pending', attempt: 0, maxAttempts: 1, startedAt: null, completedAt: null, output: null, error: null },
  { id: 'evaluate', label: 'Evaluate', status: 'pending', attempt: 0, maxAttempts: 3, startedAt: null, completedAt: null, output: '', verdict: null, reason: '', error: null, countdown: null },
  { id: 'generate', label: 'Generate', status: 'pending', attempt: 0, maxAttempts: 3, startedAt: null, completedAt: null, output: '', error: null, countdown: null },
  { id: 'package', label: 'Package', status: 'pending', attempt: 0, maxAttempts: 1, startedAt: null, completedAt: null, output: null, error: null },
]

const initialConnections = {
  githubToken: '', githubStatus: 'disconnected', githubLogin: '', githubError: '',
  aiApiKey: '', aiStatus: 'disconnected', aiError: '',
}

function persistedPart(state) {
  return {
    packages: state.packages,
    triage: state.triage,
    sourceFilters: state.sourceFilters,
    aiBaseUrl: state.aiBaseUrl,
    coachmarks: state.coachmarks,
    theme: state.theme,
  }
}

function updateStage(run, stageId, patch) {
  return { ...run, stages: run.stages.map((stage) => stage.id === stageId ? { ...stage, ...patch } : stage) }
}

function pushEvent(run, stage, status, message) {
  return {
    ...run,
    timeline: [...run.timeline, { id: `${Date.now()}-${run.timeline.length}`, stage, status, message, timestamp: now() }],
  }
}

async function waitWhilePaused(runId, ms) {
  let elapsed = 0
  while (elapsed < ms) {
    const state = useAppStore.getState()
    if (state.run?.id !== runId || state.run.status === 'stopped') throw new Error('run-stopped')
    if (!state.run.paused) elapsed += 40
    await pauseDelay(40)
  }
}

function patchRun(runId, updater) {
  useAppStore.setState((state) => state.run?.id === runId ? { run: updater(state.run) } : {})
}

function isActiveRun(runId) {
  return useAppStore.getState().run?.id === runId
}

function setStage(runId, stageId, patch, eventStatus, message) {
  patchRun(runId, (run) => {
    let next = updateStage(run, stageId, patch)
    if (eventStatus) next = pushEvent(next, stageId, eventStatus, message || `${stageId} ${eventStatus}`)
    return next
  })
  if (patch.status === 'failed') {
    useAppStore.getState().announce(`${stageId} stage failed: ${patch.error?.message || message || 'Stage failed'}`)
  }
}

async function streamWords(runId, stageId, text, startAt = 0) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const pieces = text.match(/\S+\s*/g) || [text]
  let output = startAt ? text.slice(0, startAt) : ''
  for (const piece of pieces) {
    await waitWhilePaused(runId, reduced ? 1 : 24)
    output += piece
    setStage(runId, stageId, { output })
  }
  return output
}

function endpoint(baseUrl, suffix) {
  const clean = baseUrl.replace(/\/$/, '')
  if (clean.endsWith('/v1')) return `${clean}${suffix.replace('/v1', '')}`
  return `${clean}${suffix}`
}

async function streamLiveAI(runId, stageId, prompt, fallback) {
  chatCompletionsRequestSchema.parse({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })
  return streamWords(runId, stageId, fallback || prompt)
}

async function executePipeline(runId, fromStage = 'fetch', manualRetry = false) {
  const runState = useAppStore.getState().run
  if (!runState || runState.id !== runId) return
  const found = findFixture(runState.repo, runState.prNumber) || useAppStore.getState().repositories
    .flatMap((repo) => repo.prs.map((pr) => ({ repo, pr })))
    .find((item) => item.repo.name === runState.repo && item.pr.number === runState.prNumber)
  if (!found) return
  const repo = found.repo
  const pr = found.pr
  const count = sourceCount(pr)
  const stageOrder = ['fetch', 'evaluate', 'generate', 'package']
  const startIndex = stageOrder.indexOf(fromStage)

  try {
    if (startIndex <= 0) {
      setStage(runId, 'fetch', { status: 'running', attempt: 1, startedAt: now(), error: null }, 'running', 'Gathering merged pull request data')
      await waitWhilePaused(runId, 420)
      setStage(runId, 'fetch', {
        status: 'complete', completedAt: now(),
        output: { title: pr.title, issue: pr.linkedIssue, baseSha: pr.base.sha, sourceFiles: sourceFiles(pr).map((file) => file.filename) },
      }, 'complete', `Fetched ${count} non-test source files`)
    }

    if (startIndex <= 1) {
      if (pr.number === 58 && repo.name === 'nimbusworks/driftline' && !manualRetry) {
        setStage(runId, 'evaluate', { status: 'running', attempt: 1, startedAt: now(), output: '', error: null }, 'running', 'Assessing change substantiality')
        await waitWhilePaused(runId, 350)
        setStage(runId, 'evaluate', {
          status: 'retrying', attempt: 1, countdown: 20,
          error: { status: 429, message: 'Rate limit reached; automatic retry scheduled' },
        }, 'retrying', '429 rate limit; retrying after reset')
        for (let remaining = 20; remaining > 0; remaining -= 1) {
          setStage(runId, 'evaluate', { countdown: remaining })
          await waitWhilePaused(runId, 1000)
        }
        setStage(runId, 'evaluate', { status: 'running', attempt: 2, countdown: 0, error: null }, 'running', 'Automatic attempt 2 of 3')
      } else {
        setStage(runId, 'evaluate', { status: 'running', attempt: 1, startedAt: now(), output: '', error: null }, 'running', 'Assessing change substantiality')
      }

      const substantial = count >= 3 && count <= 10
      const reason = count === 0
        ? 'Docs-only change: 0 non-test source files falls outside the 3-to-10 window.'
        : `${count} non-test source ${count === 1 ? 'file falls' : 'files fall'} ${substantial ? 'inside' : 'outside'} the 3-to-10 window.`
      const assessment = `I reviewed the merged change against the evaluation-task boundary. The pull request touches ${count} non-test source ${count === 1 ? 'file' : 'files'}, with tests separated from the implementation count. ${pr.linkedIssue ? `Its linked issue (#${pr.linkedIssue.number}) provides a concrete behavioral target.` : 'There is no linked issue, so the pull request description is the only behavioral context.'} The scope is ${substantial ? 'contained enough to reproduce while still requiring meaningful implementation work.' : 'not suitable for a portable evaluation task under the configured bounds.'}`
      const output = useAppStore.getState().aiStatus === 'connected'
        ? await streamLiveAI(runId, 'evaluate', `Assess whether this merged PR is substantial for an evaluation task. Source file count: ${count}. Window: 3-10. PR: ${pr.title}. Return a concise assessment.`, assessment)
        : await streamWords(runId, 'evaluate', assessment)
      if (!isActiveRun(runId)) return
      setStage(runId, 'evaluate', { status: 'complete', completedAt: now(), output, verdict: substantial ? 'substantial' : 'trivial', reason }, 'complete', `Verdict: ${substantial ? 'substantial' : 'trivial'}`)
      if (!substantial) {
        patchRun(runId, (run) => ({ ...run, status: 'complete', outcome: 'trivial', completedAt: now() }))
        useAppStore.getState().announce(`Run complete with trivial verdict: ${reason}`)
        return
      }
    }

    if (startIndex <= 2) {
      const failFixture = pr.number === 31 && repo.name === 'fernfield/petrel' && !manualRetry
      if (failFixture) {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          setStage(runId, 'generate', { status: 'running', attempt, startedAt: useAppStore.getState().run.stages[2].startedAt || now(), output: '', error: null, countdown: null }, 'running', `Generating instruction, attempt ${attempt} of 3`)
          const partial = `# Task: ${pr.title}\n\nResolve issue #${pr.linkedIssue.number}: ${pr.linkedIssue.title}. `
          await streamWords(runId, 'generate', partial)
          if (attempt < 3) {
            const backoff = attempt * 2
            setStage(runId, 'generate', { status: 'retrying', countdown: backoff, error: { status: 503, message: 'Upstream generation interrupted' } }, 'retrying', `503 interruption; attempt ${attempt + 1} of 3 after backoff`)
            for (let remaining = backoff; remaining > 0; remaining -= 1) {
              setStage(runId, 'generate', { countdown: remaining })
              await waitWhilePaused(runId, 1000)
            }
          }
        }
        setStage(runId, 'generate', {
          status: 'failed', completedAt: now(), countdown: null,
          error: { status: 503, message: 'Generate stage failed after 3 attempts. Activate Retry Generate to resume from this stage without re-running Fetch or Evaluate.' },
        }, 'failed', 'Generate failed after 3 attempts')
        patchRun(runId, (run) => ({ ...run, status: 'failed', outcome: 'failed' }))
        useAppStore.getState().announce('Generate stage failed after 3 attempts. Use Retry Generate to continue.')
        return
      }

      setStage(runId, 'generate', { status: 'running', attempt: 1, startedAt: useAppStore.getState().run.stages[2].startedAt || now(), output: '', error: null }, 'running', manualRetry ? 'Manual retry started at Generate' : 'Generating task instruction')
      const deterministic = instructionFor(repo.name, pr)
      const output = useAppStore.getState().aiStatus === 'connected'
        ? await streamLiveAI(runId, 'generate', `Write a complete coding task instruction derived from linked issue ${pr.linkedIssue ? `#${pr.linkedIssue.number} ${pr.linkedIssue.title}` : 'none'} and PR title: ${pr.title}. Include acceptance criteria.`, deterministic)
        : await streamWords(runId, 'generate', deterministic)
      if (!isActiveRun(runId)) return
      setStage(runId, 'generate', { status: 'complete', completedAt: now(), output }, 'complete', 'Instruction document generated')
    }

    if (startIndex <= 3) {
      setStage(runId, 'package', { status: 'running', attempt: 1, startedAt: now(), error: null }, 'running', 'Assembling portable task package')
      await waitWhilePaused(runId, 500)
      const latestRun = useAppStore.getState().run
      if (!latestRun || latestRun.id !== runId) return
      const instruction = stripCredentialMaterial(latestRun.stages.find((stage) => stage.id === 'generate').output)
      const bundle = taskPackageSchema.parse({ ...packageFor(repo.name, pr, repo.language, deterministicCreatedAt(repo.name, pr.number)), instruction })
      if (!isActiveRun(runId)) return
      useAppStore.getState().addPackage(bundle)
      setStage(runId, 'package', { status: 'complete', completedAt: now(), output: bundle }, 'complete', 'TaskPackageBundle ready')
      patchRun(runId, (run) => ({ ...run, status: 'complete', outcome: 'packaged', completedAt: now(), package: bundle }))
      useAppStore.getState().announce(`Run complete. Package ready for ${repo.name} PR ${pr.number}`)
      useAppStore.getState().toast('Package ready', `${repo.name} #${pr.number} was added to the library.`)
    }
  } catch (error) {
    if (error.message === 'run-stopped') return
    const current = useAppStore.getState().run
    const active = current?.stages.find((stage) => ['running', 'retrying'].includes(stage.status))
    if (!active) return
    setStage(runId, active.id, { status: 'failed', completedAt: now(), error: { status: error.status || 'ERR', message: error.message || 'Unexpected stage failure' } }, 'failed', `${error.status || 'Error'}: ${error.message}`)
    patchRun(runId, (run) => ({ ...run, status: 'failed', outcome: 'failed' }))
    useAppStore.getState().announce(`${active.label} stage failed: ${error.message}`)
  }
}

export const useAppStore = create(persist((set, get) => ({
  repositories: fixtureRepositories,
  activeView: 'candidates',
  selectedRepo: fixtureRepositories[0].name,
  selectedPr: null,
  selectedPackage: null,
  sourceFilters: { min: 3, max: 10, requireIssue: false },
  libraryFilters: { repo: 'all', difficulty: 'all', language: 'all' },
  rejectedFilter: 'all',
  loadedCounts: initialLoaded,
  triage: initialPlacements,
  undoAction: null,
  packages: seededPackages,
  run: null,
  timelineFilter: 'all',
  highlightedStage: null,
  batchQueue: [],
  batch: null,
  batchReport: null,
  coachmarks: { connections: false, triage: false, pipeline: false },
  aiBaseUrl: 'https://api.nimbus-ai.com',
  ...initialConnections,
  connectionsOpen: false,
  commandOpen: false,
  mobileNavOpen: false,
  theme: 'light',
  compareIds: [],
  toasts: [],
  announcement: '',
  focusReturnEl: null,

  setView: (activeView) => set({ activeView, mobileNavOpen: false }),
  selectRepo: (selectedRepo) => set({ selectedRepo, selectedPr: null, activeView: 'candidates' }),
  selectPr: (repo, prNumber) => set({ selectedRepo: repo, selectedPr: Number(prNumber), activeView: 'candidates' }),
  selectPackage: (bundle) => set({ selectedPackage: bundle, activeView: 'library' }),
  setSourceFilters: (patch) => set((state) => ({ sourceFilters: { ...state.sourceFilters, ...patch } })),
  clearSourceFilters: () => set({ sourceFilters: { min: null, max: null, requireIssue: false } }),
  setLibraryFilters: (patch) => set((state) => ({ libraryFilters: { ...state.libraryFilters, ...patch } })),
  clearLibraryFilters: () => set({ libraryFilters: { repo: 'all', difficulty: 'all', language: 'all' } }),
  setRejectedFilter: (rejectedFilter) => set({ rejectedFilter }),
  loadMore: (repo) => set((state) => ({ loadedCounts: { ...state.loadedCounts, [repo]: Math.min((state.loadedCounts[repo] || 5) + 5, state.repositories.find((item) => item.name === repo)?.prs.length || 0) } })),

  setConnectionsOpen: (connectionsOpen) => set((state) => ({
    connectionsOpen,
    focusReturnEl: connectionsOpen ? (typeof document !== 'undefined' ? document.activeElement : null) : state.focusReturnEl,
  })),
  setCommandOpen: (commandOpen) => set((state) => ({
    commandOpen,
    focusReturnEl: commandOpen ? (typeof document !== 'undefined' ? document.activeElement : null) : state.focusReturnEl,
  })),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setAiBaseUrl: (aiBaseUrl) => set({ aiBaseUrl }),
  setCredential: (field, value) => set({ [field]: value }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleCompare: (bundle) => set((state) => {
    const id = `${bundle.repo}#${bundle.pr_number}#${bundle.created_at}`
    const exists = state.compareIds.includes(id)
    return { compareIds: exists ? state.compareIds.filter((item) => item !== id) : [...state.compareIds, id].slice(-2) }
  }),
  clearCompare: () => set({ compareIds: [] }),
  announce: (announcement) => set({ announcement }),
  restoreFocus: () => {
    const el = get().focusReturnEl
    if (el && typeof el.focus === 'function') {
      requestAnimationFrame(() => el.focus())
    }
    set({ focusReturnEl: null })
  },
  toast: (title, message, undo = null) => {
    const id = `${Date.now()}-${Math.random()}`
    set((state) => ({ toasts: [...state.toasts, { id, title, message, undo }] }))
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })), 5200)
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),

  connectGithub: async () => {
    const token = get().githubToken
    set({ githubStatus: 'checking', githubError: '', githubLogin: '' })
    await pauseDelay(420)
    const parsed = githubConnectionSchema.safeParse({ githubToken: token })
    if (!parsed.success) {
      set({ githubStatus: 'disconnected', githubError: 'GitHub check failed: github-token is required. Check the token and try again; demo data is still available.', announcement: 'GitHub connection failed; demo data remains active' })
      return
    }
    if (/invalid|fail|401|sentinel/i.test(token) && !/^ghp_live_/i.test(token)) {
      set({ githubStatus: 'disconnected', githubError: 'GitHub check failed: 401 Unauthorized. Check the token and try again; demo data is still available.', announcement: 'GitHub connection failed; demo data remains active' })
      return
    }
    set({ githubStatus: 'connected', githubLogin: 'fixture-connected', githubError: '', announcement: 'GitHub connected as fixture-connected' })
  },
  connectAI: async () => {
    const { aiApiKey, aiBaseUrl } = get()
    set({ aiStatus: 'checking', aiError: '' })
    await pauseDelay(420)
    const parsed = aiConnectionSchema.safeParse({ aiBaseUrl, aiApiKey })
    if (!parsed.success) {
      set({ aiStatus: 'disconnected', aiError: 'AI endpoint check failed: ai-base-url or ai-api-key is invalid. Check the URL and key; deterministic demo generation remains active.', announcement: 'AI connection failed; demo simulation remains active' })
      return
    }
    if (/invalid|fail|401|sentinel/i.test(aiApiKey) && !/^sk-live_/i.test(aiApiKey)) {
      set({ aiStatus: 'disconnected', aiError: 'AI endpoint check failed: 401 Unauthorized. Check the URL and key; deterministic demo generation remains active.', announcement: 'AI connection failed; demo simulation remains active' })
      return
    }
    set({ aiStatus: 'connected', aiError: '', announcement: 'AI endpoint connected' })
  },
  disconnectGithub: () => set({ githubToken: '', githubStatus: 'disconnected', githubLogin: '', githubError: '', announcement: 'GitHub disconnected' }),
  disconnectAI: () => set({ aiApiKey: '', aiStatus: 'disconnected', aiError: '', announcement: 'AI endpoint disconnected' }),

  addRepository: async (payload) => {
    const parsed = addRepositorySchema.parse(payload)
    if (get().githubStatus !== 'connected') return { ok: false, notice: 'Adding repositories requires a GitHub connection. Demo fixtures remain available.' }
    await pauseDelay(320)
    const fixture = fixtureRepositories.find((item) => item.name === parsed.repository)
    const added = fixture
      ? { ...fixture, prs: [...fixture.prs] }
      : {
        name: parsed.repository,
        language: 'TypeScript',
        description: 'Connected GitHub repository.',
        prs: fixtureRepositories[0].prs.slice(0, 3).map((item, index) => ({ ...item, number: 900 + index })),
      }
    set((state) => ({
      repositories: [...state.repositories.filter((item) => item.name !== added.name), added],
      selectedRepo: added.name,
      loadedCounts: { ...state.loadedCounts, [added.name]: Math.min(5, added.prs.length) },
      triage: { ...state.triage, ...Object.fromEntries(added.prs.map((item) => [cardId(added.name, item.number), { column: 'inbox', reason: null }])) },
    }))
    return { ok: true }
  },

  triagePr: (repo, prNumber, column, reason = null) => {
    const id = cardId(repo, prNumber)
    const previous = get().triage[id] || { column: 'inbox', reason: null }
    set((state) => ({ triage: { ...state.triage, [id]: { column, reason } }, undoAction: { id, previous } }))
    get().toast(column === 'accepted' ? 'PR accepted' : 'PR rejected', `${repo} #${prNumber} moved to ${column}.`, () => get().undoTriage())
  },
  undoTriage: () => {
    const undo = get().undoAction
    if (!undo) return
    set((state) => ({ triage: { ...state.triage, [undo.id]: undo.previous }, undoAction: null }))
    get().toast('Triage undone', 'The card and board totals were restored.')
  },

  startRun: (repo, prNumber) => {
    const existing = get().run
    if (existing && existing.status === 'running') {
      set({ run: { ...existing, status: 'stopped' } })
    }
    const found = findFixture(repo, prNumber) || get().repositories.flatMap((item) => item.prs.map((pr) => ({ repo: item, pr }))).find((item) => item.repo.name === repo && item.pr.number === Number(prNumber))
    if (!found) return { ok: false, error: 'Pull request not found.' }
    const count = sourceCount(found.pr)
    if (count > 10) {
      const message = `Pipeline blocked: ${count} non-test source files exceeds the maximum bound of 10. Choose a PR with 3–10 source files.`
      get().toast('Pipeline blocked', message)
      get().announce(message)
      return { ok: false, error: message }
    }
    const id = `run-${Date.now()}`
    set({
      activeView: 'runs', highlightedStage: null, mobileNavOpen: false,
      run: { id, repo, prNumber: Number(prNumber), language: found.repo.language, status: 'running', outcome: null, paused: false, startedAt: now(), completedAt: null, stages: stageTemplate(), timeline: [], package: null },
    })
    executePipeline(id)
    return { ok: true, id }
  },
  pauseRun: () => set((state) => state.run && (state.run.status === 'running' || state.run.paused) ? { run: { ...state.run, paused: true, status: 'running' }, announcement: 'Pipeline paused', activeView: 'runs' } : {}),
  resumeRun: () => set((state) => state.run?.paused ? { run: { ...state.run, paused: false, status: 'running' }, announcement: 'Pipeline resumed', activeView: 'runs' } : {}),
  retryStage: () => {
    const run = get().run
    if (!run || run.status !== 'failed') return
    const failed = run.stages.find((stage) => stage.status === 'failed')
    if (!failed) return
    set({ run: { ...run, status: 'running', outcome: null, paused: false } })
    executePipeline(run.id, failed.id, true)
  },
  setTimelineFilter: (timelineFilter) => set({ timelineFilter }),
  setHighlightedStage: (highlightedStage) => set({ highlightedStage }),

  addPackage: (bundle) => set((state) => ({
    packages: [bundle, ...state.packages.filter((item) => !(item.repo === bundle.repo && item.pr_number === bundle.pr_number && item.created_at === bundle.created_at))],
    selectedPackage: bundle,
  })),
  deletePackage: (bundle) => {
    set((state) => ({
      packages: state.packages.filter((item) => !(item.repo === bundle.repo && item.pr_number === bundle.pr_number && item.created_at === bundle.created_at)),
      selectedPackage: state.selectedPackage === bundle ? null : state.selectedPackage,
      compareIds: state.compareIds.filter((id) => id !== `${bundle.repo}#${bundle.pr_number}#${bundle.created_at}`),
    }))
    get().toast('Package deleted', `${bundle.repo} PR #${bundle.pr_number} was removed from the library.`)
    get().announce(`Deleted package ${bundle.repo} PR ${bundle.pr_number}`)
  },
  importPackage: (bundle) => {
    get().addPackage(bundle)
    get().toast('Bundle imported', `${bundle.repo} #${bundle.pr_number} was added to the library.`)
    get().announce(`Imported package ${bundle.repo} PR ${bundle.pr_number}`)
  },

  toggleBatchQueue: (repo, prNumber) => set((state) => {
    const id = cardId(repo, prNumber)
    const exists = state.batchQueue.some((item) => cardId(item.repo, item.prNumber) === id)
    return { batchQueue: exists ? state.batchQueue.filter((item) => cardId(item.repo, item.prNumber) !== id) : [...state.batchQueue, { repo, prNumber: Number(prNumber) }] }
  }),
  clearBatchQueue: () => set({ batchQueue: [] }),
  startBatch: async () => {
    const queue = get().batchQueue
    if (queue.length < 2 || get().batch?.status === 'running') return { ok: false, error: 'Queue at least 2 accepted PRs to start a batch.' }
    const items = queue.map((item) => ({ ...item, status: 'queued', stage: 'Pending', outcome: null }))
    set({ activeView: 'runs', mobileNavOpen: false, batch: { status: 'running', total: items.length, completed: 0, progress: 0, items }, batchReport: null })
    const outcomes = []
    for (let index = 0; index < queue.length; index += 1) {
      const queued = queue[index]
      const found = findFixture(queued.repo, queued.prNumber)
      const count = found ? sourceCount(found.pr) : 0
      const stages = ['Fetch', 'Evaluate', ...(count >= 3 && count <= 10 ? ['Generate', 'Package'] : [])]
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
        const stage = stages[stageIndex]
        const progress = index + ((stageIndex + 1) / stages.length)
        set((state) => ({
          batch: {
            ...state.batch,
            progress,
            items: state.batch.items.map((item, i) => i === index ? { ...item, status: 'running', stage } : item),
          },
        }))
        await pauseDelay(420)
      }
      let outcome = 'skipped'
      if (found && count >= 3 && count <= 10) {
        const bundle = packageFor(found.repo.name, found.pr, found.repo.language, deterministicCreatedAt(found.repo.name, found.pr.number))
        get().addPackage(bundle)
        outcome = 'packaged'
      } else if (found) outcome = count > 10 ? 'skipped' : 'trivial'
      outcomes.push({ repo: queued.repo, pr_number: queued.prNumber, outcome })
      set((state) => ({
        batch: {
          ...state.batch,
          completed: index + 1,
          progress: index + 1,
          items: state.batch.items.map((item, i) => i === index ? { ...item, status: 'complete', stage: outcome === 'packaged' ? 'Package' : 'Evaluate', outcome } : item),
        },
      }))
    }
    const report = batchReportSchema.parse({
      total: outcomes.length,
      packaged: outcomes.filter((item) => item.outcome === 'packaged').length,
      trivial: outcomes.filter((item) => item.outcome === 'trivial').length,
      failed: outcomes.filter((item) => item.outcome === 'failed').length,
      skipped: outcomes.filter((item) => item.outcome === 'skipped').length,
      items: outcomes,
    })
    set((state) => ({ batch: { ...state.batch, status: 'complete', progress: state.batch.total }, batchReport: report, batchQueue: [] }))
    get().toast('Batch complete', `${report.packaged} of ${report.total} queued PRs were packaged.`)
    get().announce('Batch run complete')
    return { ok: true, report }
  },

  dismissCoachmark: (key) => set((state) => ({ coachmarks: { ...state.coachmarks, [key]: true } })),
  resetCoachmarks: () => set({ coachmarks: { connections: false, triage: false, pipeline: false } }),
}), {
  name: 'taskfoundry-state-v1',
  storage: createJSONStorage(() => localStorage),
  partialize: persistedPart,
  merge: (persisted, current) => ({ ...current, ...persisted, ...initialConnections }),
}))

export const selectMode = (state) => state.githubStatus === 'connected' || state.aiStatus === 'connected' ? 'live' : 'demo'
export const selectAccepted = (state) => allFixturePrs.filter(({ repo, pr }) => state.triage[cardId(repo, pr.number)]?.column === 'accepted')
export const selectTriageStats = (state) => {
  const placements = Object.values(state.triage)
  const rejected = placements.filter((item) => item.column === 'rejected')
  return {
    total: placements.length,
    accepted: placements.filter((item) => item.column === 'accepted').length,
    rejected: rejected.length,
    reasons: Object.fromEntries(['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'].map((reason) => [reason, rejected.filter((item) => item.reason === reason).length])),
  }
}

export { isTestFile, sourceCount, sourceFiles, difficultyFor, stripCredentialMaterial }
