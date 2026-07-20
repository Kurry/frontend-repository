import { create } from 'zustand'
import {
  DOCUMENT_TYPES,
  PATTERN_KEYS,
  documentSchema,
  formatZodError,
  patternsSchema,
  repositoryFormSchema,
  repositoryPathSchema,
  scanIndexSchema,
  type DocumentType,
  type PatternKey,
  type ScanIndexPayload,
} from './schemas'

export type Finding = {
  severity: 'info' | 'warning' | 'error'
  message: string
  line?: number
}

export type ScanDocument = {
  id: string
  repositoryId: string
  path: string
  type: DocumentType
  content: string
  findings: Finding[]
}

export type Repository = {
  id: string
  path: string
  displayName?: string
  lastScanned: string | null
  documentCount: number
}

export type StepStatus = 'pending' | 'running' | 'complete' | 'failed' | 'retrying'
export type ScanStep = {
  id: string
  document: ScanDocument
  name: string
  status: StepStatus
  attempts: number
  countdown: number
  startedAt?: string
  completedAt?: string
  output?: string
  error?: string
  manualRetry?: boolean
}

export type TimelineEvent = {
  id: string
  stepId: string
  status: StepStatus
  message: string
  timestamp: string
}

export type ScanRun = {
  id: string
  repositoryId: string
  status: 'running' | 'paused' | 'complete' | 'failed'
  steps: ScanStep[]
  timeline: TimelineEvent[]
  startedAt: string
  completedAt?: string
}

type Snapshot = {
  repositories: Repository[]
  documents: Record<string, ScanDocument[]>
  patterns: Record<PatternKey, boolean>
}

type UiState = {
  addOpen: boolean
  exportOpen: boolean
  importOpen: boolean
  paletteOpen: boolean
}

export type AppState = {
  repositories: Repository[]
  documents: Record<string, ScanDocument[]>
  patterns: Record<PatternKey, boolean>
  selectedRepositoryIds: string[]
  documentTypeFilters: DocumentType[]
  expandedGroups: Record<DocumentType, boolean>
  expandedFindings: Record<string, boolean>
  scanRuns: Record<string, ScanRun>
  activeScanId: string | null
  selectedTimelineStepId: string | null
  timelineFilters: StepStatus[]
  activeView: 'tree' | 'viewer'
  activeDocumentId: string | null
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  artifactJson: string
  artifactMarkdown: string
  ui: UiState
  addRepository: (values: { path: string; displayName?: string }) => { ok: boolean; error?: string; id?: string }
  renameRepository: (id: string, displayName: string) => { ok: boolean; error?: string }
  removeRepository: (id: string) => void
  toggleRepositorySelection: (id: string) => void
  selectAllRepositories: () => void
  clearSelection: () => void
  setPattern: (key: PatternKey, enabled: boolean) => { ok: boolean; error?: string }
  toggleDocumentFilter: (type: DocumentType) => void
  clearDocumentFilters: () => void
  toggleGroup: (type: DocumentType) => void
  toggleFindings: (documentId: string) => void
  openDocument: (documentId: string) => void
  showTree: () => void
  setUi: (key: keyof UiState, value: boolean) => void
  undo: () => void
  redo: () => void
  importIndex: (payload: unknown) => { ok: boolean; error?: string }
  refreshArtifacts: () => void
  pauseScan: (repositoryId: string) => void
  resumeScan: (repositoryId: string) => void
  selectTimelineStep: (stepId: string | null) => void
  toggleTimelineFilter: (status: StepStatus) => void
}

const now = () => new Date().toISOString()
const clone = <T,>(value: T): T => structuredClone(value)
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function repositoryLabel(repository: Pick<Repository, 'path' | 'displayName'>): string {
  if (repository.displayName?.trim()) return repository.displayName.trim()
  const clean = repository.path.replace(/[\\/]+$/, '')
  return clean.split(/[\\/]/).filter(Boolean).pop() || repository.path
}

function typeForPattern(pattern: PatternKey): DocumentType {
  return ({
    'claude-md': 'CLAUDE.md',
    'agents-md': 'AGENTS.md',
    cursorrules: '.cursorrules',
    readme: 'README',
  } as const)[pattern]
}

function repoFingerprint(repository: Repository): number {
  return repository.path.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0)
}

function personalizeContent(repository: Repository, base: string, type: DocumentType): string {
  const label = repositoryLabel(repository)
  const variant = repoFingerprint(repository) % 997
  const header = `# ${type} · ${label}`
  const scope = `Repository scope: ${repository.path} — scan variant ${variant}`
  const body = base.replace(/^#[^\n]*\n\n?/, '')
  return `${header}\n${scope}\n\n${body}`
}

function makeDocuments(repository: Repository, patterns: Record<PatternKey, boolean>): ScanDocument[] {
  const label = repositoryLabel(repository)
  const descriptors: Record<DocumentType, Array<{ suffix: string; content: string; findings: Finding[] }>> = {
    'CLAUDE.md': [
      {
        suffix: 'CLAUDE.md',
        content: '# Project guidance\n\nUse TypeScript for new modules.\nRun the verification suite before review.\nKeep changes focused and documented.',
        findings: [{ severity: 'info', message: 'Project-level Claude guidance detected.', line: 1 }],
      },
      {
        suffix: 'packages/core/CLAUDE.md',
        content: '# Core package\n\nPreserve public API compatibility.\nPrefer pure functions for transformations.\nAdd focused unit coverage.',
        findings: [{ severity: 'warning', message: 'Nested guidance overrides project defaults.', line: 3 }],
      },
    ],
    'AGENTS.md': [
      {
        suffix: 'AGENTS.md',
        content: '# Agent instructions\n\nInstall dependencies with npm.\nUse conventional commit language.\nNever include generated secrets.',
        findings: [{ severity: 'info', message: 'Repository agent instructions are available.', line: 1 }],
      },
      {
        suffix: 'apps/web/AGENTS.md',
        content: '# Web workspace\n\nComponents must be keyboard accessible.\nUse shared design tokens.\nTest responsive layouts at 375px.',
        findings: [{ severity: 'warning', message: 'Accessibility requirement should be checked in review.', line: 3 }],
      },
    ],
    '.cursorrules': [
      {
        suffix: '.cursorrules',
        content: 'Use strict TypeScript.\nPrefer named exports.\nAvoid adding dependencies without review.\nKeep modules below 300 lines where practical.',
        findings: [{ severity: 'warning', message: 'Rule language contains a subjective size threshold.', line: 4 }],
      },
      {
        suffix: 'tools/.cursorrules',
        content: 'Scripts must be deterministic.\nPrint actionable errors.\nNever mutate production data.\nUse dry-run modes for migrations.',
        findings: [{ severity: 'error', message: 'Nested rules may conflict with root dependency policy.', line: 1 }],
      },
    ],
    README: [
      {
        suffix: 'README.md',
        content: '# Repository overview\n\nThis workspace contains the product application and shared packages.\n\n## Development\nRun npm start for local development.',
        findings: [{ severity: 'info', message: 'Development command documented.', line: 6 }],
      },
      {
        suffix: 'docs/README.md',
        content: '# Documentation\n\nArchitecture notes live in this directory.\nUpdate diagrams when service boundaries change.\nOwners review docs monthly.',
        findings: [{ severity: 'warning', message: 'Ownership guidance has no named team.', line: 5 }],
      },
    ],
  }

  return PATTERN_KEYS.flatMap((pattern) => {
    if (!patterns[pattern]) return []
    const type = typeForPattern(pattern)
    return descriptors[type].map((entry, index) => ({
      id: `${repository.id}-${pattern}-${index}`,
      repositoryId: repository.id,
      path: `${repository.path.replace(/[\\/]+$/, '')}/${entry.suffix}`,
      type,
      content: personalizeContent(repository, entry.content, type),
      findings: clone(entry.findings).map((finding) => ({
        ...finding,
        message: `${finding.message} (${label})`,
      })),
    }))
  })
}

const defaultPatterns: Record<PatternKey, boolean> = {
  'claude-md': true,
  'agents-md': true,
  cursorrules: true,
  readme: true,
}

const seededRepositories: Repository[] = [
  { id: 'repo-1', path: '/workspace/design-system', displayName: 'Design system', lastScanned: '2026-07-20T08:42:00.000Z', documentCount: 8 },
  { id: 'repo-2', path: '/workspace/product-catalog', displayName: 'Product catalog', lastScanned: '2026-07-20T09:18:00.000Z', documentCount: 8 },
  { id: 'repo-3', path: '/workspace/agent-toolkit', displayName: 'Agent toolkit', lastScanned: '2026-07-20T10:06:00.000Z', documentCount: 8 },
]

const seededDocuments = Object.fromEntries(
  seededRepositories.map((repository) => [repository.id, makeDocuments(repository, defaultPatterns)]),
)

function snapshot(state: AppState): Snapshot {
  return clone({ repositories: state.repositories, documents: state.documents, patterns: state.patterns })
}

function compileJson(state: Pick<AppState, 'repositories' | 'documents' | 'patterns'>): string {
  const payload: ScanIndexPayload = {
    schemaVersion: 'repo-scan-index/v1',
    exportedAt: now(),
    patterns: clone(state.patterns),
    repositories: state.repositories.map((repository) => {
      const documents = (state.documents[repository.id] || []).map(({ path, type, content, findings }) => ({
        path,
        type,
        content,
        findings,
      }))
      return {
        path: repository.path,
        ...(repository.displayName?.trim() ? { displayName: repository.displayName.trim() } : {}),
        lastScanned: repository.lastScanned,
        documentCount: documents.length,
        documents,
      }
    }),
  }
  return JSON.stringify(payload, null, 2)
}

function compileMarkdown(state: Pick<AppState, 'repositories' | 'documents' | 'patterns'>): string {
  const lines = ['# Repository scan inventory', '', `Generated ${new Date().toLocaleString()}`, '', '## Pattern configuration', '']
  PATTERN_KEYS.forEach((key) => lines.push(`- ${key}: ${state.patterns[key] ? 'enabled' : 'disabled'}`))
  for (const repository of state.repositories) {
    const documents = state.documents[repository.id] || []
    lines.push('', `## ${repositoryLabel(repository)}`, '', `- Path: ${repository.path}`, `- Documents: ${documents.length}`, '')
    DOCUMENT_TYPES.forEach((type) => lines.push(`- ${type}: ${documents.filter((document) => document.type === type).length}`))
    lines.push('', '### Findings', '')
    const findings = documents.flatMap((document) => document.findings.map((finding) => ({ ...finding, path: document.path })))
    if (!findings.length) lines.push('- No findings')
    findings.forEach((finding) => lines.push(`- [${finding.severity.toUpperCase()}] ${finding.message} — ${finding.path}${finding.line ? `:${finding.line}` : ''}`))
  }
  return lines.join('\n')
}

function artifactPatch(state: AppState) {
  return { artifactJson: compileJson(state), artifactMarkdown: compileMarkdown(state) }
}

const initialArtifactState = {
  repositories: seededRepositories,
  documents: seededDocuments,
  patterns: defaultPatterns,
} as Pick<AppState, 'repositories' | 'documents' | 'patterns'>

export const useAppStore = create<AppState>((set, get) => ({
  repositories: clone(seededRepositories),
  documents: clone(seededDocuments),
  patterns: clone(defaultPatterns),
  selectedRepositoryIds: [],
  documentTypeFilters: [],
  expandedGroups: { 'CLAUDE.md': true, 'AGENTS.md': true, '.cursorrules': true, README: true },
  expandedFindings: {},
  scanRuns: {},
  activeScanId: null,
  selectedTimelineStepId: null,
  timelineFilters: [],
  activeView: 'tree',
  activeDocumentId: null,
  undoStack: [],
  redoStack: [],
  artifactJson: compileJson(initialArtifactState),
  artifactMarkdown: compileMarkdown(initialArtifactState),
  ui: { addOpen: false, exportOpen: false, importOpen: false, paletteOpen: false },

  addRepository: (values) => {
    const parsed = repositoryFormSchema.safeParse(values)
    if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) }
    const before = snapshot(get())
    const repository: Repository = {
      id: id('repo'),
      path: parsed.data.path,
      ...(parsed.data.displayName?.trim() ? { displayName: parsed.data.displayName.trim() } : {}),
      lastScanned: null,
      documentCount: 0,
    }
    set((state) => ({
      repositories: [...state.repositories, repository],
      documents: { ...state.documents, [repository.id]: [] },
      undoStack: [...state.undoStack, before],
      redoStack: [],
    }))
    set(artifactPatch(get()))
    return { ok: true, id: repository.id }
  },

  renameRepository: (repositoryId, displayName) => {
    const parsed = repositoryFormSchema.shape.displayName.safeParse(displayName)
    if (!parsed.success) return { ok: false, error: `displayName: ${parsed.error.issues[0]?.message || 'Display name is invalid.'}` }
    if (!get().repositories.some((repository) => repository.id === repositoryId)) return { ok: false, error: 'Repository was not found.' }
    const before = snapshot(get())
    const trimmed = (parsed.data || '').trim()
    set((state) => ({
      repositories: state.repositories.map((repository) => repository.id === repositoryId
        ? { ...repository, ...(trimmed ? { displayName: trimmed } : { displayName: undefined }) }
        : repository),
      undoStack: [...state.undoStack, before],
      redoStack: [],
    }))
    set(artifactPatch(get()))
    return { ok: true }
  },

  removeRepository: (repositoryId) => {
    if (!get().repositories.some((repository) => repository.id === repositoryId)) return
    const before = snapshot(get())
    set((state) => {
      const documents = { ...state.documents }
      delete documents[repositoryId]
      const scanRuns = { ...state.scanRuns }
      delete scanRuns[repositoryId]
      return {
        repositories: state.repositories.filter((repository) => repository.id !== repositoryId),
        documents,
        scanRuns,
        selectedRepositoryIds: state.selectedRepositoryIds.filter((item) => item !== repositoryId),
        activeScanId: state.activeScanId === repositoryId ? null : state.activeScanId,
        activeView: state.activeDocumentId && before.documents[repositoryId]?.some((document) => document.id === state.activeDocumentId) ? 'tree' : state.activeView,
        activeDocumentId: state.activeDocumentId && before.documents[repositoryId]?.some((document) => document.id === state.activeDocumentId) ? null : state.activeDocumentId,
        undoStack: [...state.undoStack, before],
        redoStack: [],
      }
    })
    set(artifactPatch(get()))
  },

  toggleRepositorySelection: (repositoryId) => set((state) => ({
    selectedRepositoryIds: state.selectedRepositoryIds.includes(repositoryId)
      ? state.selectedRepositoryIds.filter((item) => item !== repositoryId)
      : [...state.selectedRepositoryIds, repositoryId],
  })),
  selectAllRepositories: () => set((state) => ({ selectedRepositoryIds: state.repositories.map((repository) => repository.id) })),
  clearSelection: () => set({ selectedRepositoryIds: [] }),

  setPattern: (key, enabled) => {
    const candidate = { ...get().patterns, [key]: enabled }
    const parsed = patternsSchema.safeParse(candidate)
    if (!parsed.success) return { ok: false, error: 'Patterns: at least one document pattern must remain enabled.' }
    if (get().patterns[key] === enabled) return { ok: true }
    const before = snapshot(get())
    set((state) => ({ patterns: candidate, undoStack: [...state.undoStack, before], redoStack: [] }))
    set(artifactPatch(get()))
    return { ok: true }
  },

  toggleDocumentFilter: (type) => set((state) => ({
    documentTypeFilters: state.documentTypeFilters.includes(type)
      ? state.documentTypeFilters.filter((item) => item !== type)
      : [...state.documentTypeFilters, type],
  })),
  clearDocumentFilters: () => set({ documentTypeFilters: [] }),
  toggleGroup: (type) => set((state) => ({ expandedGroups: { ...state.expandedGroups, [type]: !state.expandedGroups[type] } })),
  toggleFindings: (documentId) => set((state) => ({ expandedFindings: { ...state.expandedFindings, [documentId]: !state.expandedFindings[documentId] } })),
  openDocument: (documentId) => set({ activeView: 'viewer', activeDocumentId: documentId }),
  showTree: () => set({ activeView: 'tree', activeDocumentId: null }),
  setUi: (key, value) => set((state) => ({ ui: { ...state.ui, [key]: value } })),

  undo: () => {
    const state = get()
    const target = state.undoStack.at(-1)
    if (!target) return
    const current = snapshot(state)
    const ids = new Set(target.repositories.map((repository) => repository.id))
    set({
      ...clone(target),
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, current],
      selectedRepositoryIds: state.selectedRepositoryIds.filter((repositoryId) => ids.has(repositoryId)),
      scanRuns: Object.fromEntries(Object.entries(state.scanRuns).filter(([repositoryId]) => ids.has(repositoryId))),
      activeScanId: state.activeScanId && ids.has(state.activeScanId) ? state.activeScanId : null,
    })
    set(artifactPatch(get()))
  },
  redo: () => {
    const state = get()
    const target = state.redoStack.at(-1)
    if (!target) return
    const current = snapshot(state)
    const ids = new Set(target.repositories.map((repository) => repository.id))
    set({
      ...clone(target),
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, current],
      selectedRepositoryIds: state.selectedRepositoryIds.filter((repositoryId) => ids.has(repositoryId)),
      scanRuns: Object.fromEntries(Object.entries(state.scanRuns).filter(([repositoryId]) => ids.has(repositoryId))),
      activeScanId: state.activeScanId && ids.has(state.activeScanId) ? state.activeScanId : null,
    })
    set(artifactPatch(get()))
  },

  importIndex: (payload) => {
    const parsed = scanIndexSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) }
    const repositories: Repository[] = []
    const documents: Record<string, ScanDocument[]> = {}
    parsed.data.repositories.forEach((source, repositoryIndex) => {
      const repositoryId = `imported-${repositoryIndex}-${Math.random().toString(36).slice(2, 8)}`
      repositories.push({
        id: repositoryId,
        path: source.path,
        ...(source.displayName?.trim() ? { displayName: source.displayName.trim() } : {}),
        lastScanned: source.lastScanned ?? null,
        documentCount: source.documents.length,
      })
      documents[repositoryId] = source.documents.map((document, documentIndex) => ({
        id: `${repositoryId}-document-${documentIndex}`,
        repositoryId,
        ...document,
      }))
    })
    set({
      repositories,
      documents,
      patterns: clone(parsed.data.patterns),
      selectedRepositoryIds: [],
      documentTypeFilters: [],
      timelineFilters: [],
      activeView: 'tree',
      activeDocumentId: null,
      scanRuns: {},
      activeScanId: null,
      undoStack: [],
      redoStack: [],
    })
    set(artifactPatch(get()))
    return { ok: true }
  },

  refreshArtifacts: () => set(artifactPatch(get())),
  pauseScan: (repositoryId) => set((state) => {
    const run = state.scanRuns[repositoryId]
    if (!run || run.status !== 'running') return state
    return { scanRuns: { ...state.scanRuns, [repositoryId]: { ...run, status: 'paused' } } }
  }),
  resumeScan: (repositoryId) => set((state) => {
    const run = state.scanRuns[repositoryId]
    if (!run || run.status !== 'paused') return state
    return { scanRuns: { ...state.scanRuns, [repositoryId]: { ...run, status: 'running' } } }
  }),
  selectTimelineStep: (stepId) => set({ selectedTimelineStepId: stepId }),
  toggleTimelineFilter: (status) => set((state) => ({
    timelineFilters: state.timelineFilters.includes(status)
      ? state.timelineFilters.filter((item) => item !== status)
      : [...state.timelineFilters, status],
  })),
}))

const activeRunners = new Map<string, Promise<boolean>>()

function updateRun(repositoryId: string, updater: (run: ScanRun) => ScanRun) {
  useAppStore.setState((state) => {
    const run = state.scanRuns[repositoryId]
    if (!run) return state
    return { scanRuns: { ...state.scanRuns, [repositoryId]: updater(run) } }
  })
}

function addEvent(repositoryId: string, stepId: string, status: StepStatus, message: string) {
  updateRun(repositoryId, (run) => ({
    ...run,
    timeline: [{ id: id('event'), stepId, status, message, timestamp: now() }, ...run.timeline],
  }))
}

async function checkpointDelay(repositoryId: string, milliseconds: number): Promise<boolean> {
  let remaining = milliseconds
  while (remaining > 0) {
    const state = useAppStore.getState()
    const run = state.scanRuns[repositoryId]
    if (!run || !state.repositories.some((repository) => repository.id === repositoryId)) return false
    if (run.status === 'failed' || run.status === 'complete') return false
    if (run.status === 'paused') {
      await new Promise((resolve) => setTimeout(resolve, 80))
      continue
    }
    const slice = Math.min(remaining, 80)
    await new Promise((resolve) => setTimeout(resolve, slice))
    remaining -= slice
  }
  return true
}

async function processScan(repositoryId: string, startIndex = 0): Promise<boolean> {
  const initial = useAppStore.getState().scanRuns[repositoryId]
  if (!initial) return false
  for (let index = startIndex; index < initial.steps.length; index += 1) {
    const liveStep = useAppStore.getState().scanRuns[repositoryId]?.steps[index]
    if (!liveStep || liveStep.status === 'complete') continue
    let complete = false
    while (!complete) {
      const current = useAppStore.getState().scanRuns[repositoryId]?.steps[index]
      if (!current) return false
      const attempt = current.attempts + 1
      updateRun(repositoryId, (run) => ({
        ...run,
        status: 'running',
        steps: run.steps.map((step, stepIndex) => stepIndex === index ? {
          ...step,
          status: 'running',
          attempts: attempt,
          countdown: 0,
          error: undefined,
          startedAt: step.startedAt || now(),
        } : step),
      }))
      addEvent(repositoryId, current.id, 'running', `${current.name} started — attempt ${attempt} of 3`)
      if (!await checkpointDelay(repositoryId, 520)) return false

      const refreshed = useAppStore.getState().scanRuns[repositoryId]?.steps[index]
      if (!refreshed) return false
      const deterministicFailure = repositoryId === 'repo-2'
        && refreshed.document.type === '.cursorrules'
        && !refreshed.document.path.includes('/tools/')
        && !refreshed.manualRetry
      if (deterministicFailure) {
        if (attempt < 3) {
          updateRun(repositoryId, (run) => ({
            ...run,
            steps: run.steps.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'retrying', countdown: 3 } : step),
          }))
          addEvent(repositoryId, refreshed.id, 'retrying', `${refreshed.name} waiting 3s before retry ${attempt + 1} of 3`)
          for (let countdown = 3; countdown > 0; countdown -= 1) {
            updateRun(repositoryId, (run) => ({
              ...run,
              steps: run.steps.map((step, stepIndex) => stepIndex === index ? { ...step, countdown } : step),
            }))
            if (!await checkpointDelay(repositoryId, 1000)) return false
          }
          continue
        }
        updateRun(repositoryId, (run) => ({
          ...run,
          status: 'failed',
          steps: run.steps.map((step, stepIndex) => stepIndex === index ? {
            ...step,
            status: 'failed',
            countdown: 0,
            error: 'Parser could not resolve a conflicting nested rule after 3 attempts.',
          } : step),
        }))
        addEvent(repositoryId, refreshed.id, 'failed', `${refreshed.name} failed after 3 attempts`)
        return false
      }

      updateRun(repositoryId, (run) => ({
        ...run,
        steps: run.steps.map((step, stepIndex) => stepIndex === index ? {
          ...step,
          status: 'complete',
          countdown: 0,
          completedAt: now(),
          output: `${step.document.findings.length} finding${step.document.findings.length === 1 ? '' : 's'} recorded`,
        } : step),
      }))
      addEvent(repositoryId, refreshed.id, 'complete', `${refreshed.name} completed`)
      complete = true
    }
  }

  const finishedAt = now()
  const finishedRun = useAppStore.getState().scanRuns[repositoryId]
  if (!finishedRun) return false
  const documents = finishedRun.steps.map((step) => step.document)
  useAppStore.setState((state) => ({
    scanRuns: { ...state.scanRuns, [repositoryId]: { ...finishedRun, status: 'complete', completedAt: finishedAt } },
    repositories: state.repositories.map((repository) => repository.id === repositoryId
      ? { ...repository, lastScanned: finishedAt, documentCount: documents.length }
      : repository),
    documents: { ...state.documents, [repositoryId]: documents },
  }))
  useAppStore.getState().refreshArtifacts()
  return true
}

export function startScan(repositoryId: string): Promise<boolean> {
  const existing = activeRunners.get(repositoryId)
  if (existing) return existing
  const state = useAppStore.getState()
  const repository = state.repositories.find((item) => item.id === repositoryId)
  if (!repository) return Promise.resolve(false)
  const currentRun = state.scanRuns[repositoryId]
  if (currentRun?.status === 'running' || currentRun?.status === 'paused') return Promise.resolve(false)
  const scanDocuments = makeDocuments(repository, state.patterns)
  const run: ScanRun = {
    id: id('scan'),
    repositoryId,
    status: 'running',
    startedAt: now(),
    timeline: [],
    steps: scanDocuments.map((document, index) => ({
      id: `${repositoryId}-step-${index}-${Date.now()}`,
      document,
      name: `Index ${document.path.split('/').pop()}`,
      status: 'pending',
      attempts: 0,
      countdown: 0,
    })),
  }
  useAppStore.setState((current) => ({
    scanRuns: { ...current.scanRuns, [repositoryId]: run },
    activeScanId: repositoryId,
    selectedTimelineStepId: null,
  }))
  const promise = processScan(repositoryId).finally(() => activeRunners.delete(repositoryId))
  activeRunners.set(repositoryId, promise)
  return promise
}

export function retryFailedStep(repositoryId: string, stepId: string): Promise<boolean> {
  if (activeRunners.has(repositoryId)) return activeRunners.get(repositoryId)!
  const run = useAppStore.getState().scanRuns[repositoryId]
  const index = run?.steps.findIndex((step) => step.id === stepId) ?? -1
  if (!run || index < 0 || run.steps[index].status !== 'failed') return Promise.resolve(false)
  updateRun(repositoryId, (current) => ({
    ...current,
    status: 'running',
    steps: current.steps.map((step, stepIndex) => stepIndex === index ? {
      ...step,
      status: 'pending',
      attempts: 0,
      error: undefined,
      manualRetry: true,
    } : step),
  }))
  addEvent(repositoryId, stepId, 'pending', `${run.steps[index].name} queued for manual retry`)
  const promise = processScan(repositoryId, index).finally(() => activeRunners.delete(repositoryId))
  activeRunners.set(repositoryId, promise)
  return promise
}

export async function scanSelected(): Promise<number> {
  const repositoryIds = [...useAppStore.getState().selectedRepositoryIds]
  if (repositoryIds.length === 0) return 0
  let completed = 0
  for (const repositoryId of repositoryIds) {
    if (await startScan(repositoryId)) completed += 1
  }
  return completed
}

export function validateDocumentForWebMcp(value: unknown): boolean {
  return documentSchema.safeParse(value).success
}

export function validateRepositoryPath(value: unknown): boolean {
  return repositoryPathSchema.safeParse(value).success
}
