import { create } from 'zustand'
import { tasks, taskById, trialById } from './data'
import { captureDialogOpener } from './dialogFocus'

const emptyChrome = {
  noteOpen: false,
  exportOpen: false,
  importOpen: false,
  paletteOpen: false,
  mobilePane: 'timeline',
  copied: '',
  notice: '',
}

const cloneReview = (state, trialId) => ({
  annotations: (state.annotationsByTrial[trialId] || []).map((item) => ({ ...item })),
  report: state.reportsByTrial[trialId] ? { ...state.reportsByTrial[trialId], implicated_steps: [...state.reportsByTrial[trialId].implicated_steps] } : null,
})

function buildPackage(state, trialId) {
  const trial = trialById(trialId)
  if (!trial) return null
  return {
    schemaVersion: 'trajectory-viewer.review-package.v1',
    exportedAt: new Date().toISOString(),
    trial_id: trial.id,
    task_id: trial.taskId,
    model: trial.model,
    reward: trial.reward,
    outcome: trial.outcome,
    duration: trial.duration,
    step_count: trial.stepCount,
    annotations: (state.annotationsByTrial[trialId] || []).map(({ note_text, step_index }) => ({ note_text, step_index })),
    failure_report: state.reportsByTrial[trialId]
      ? {
          stage: state.reportsByTrial[trialId].stage,
          root_cause: state.reportsByTrial[trialId].root_cause,
          behavior: state.reportsByTrial[trialId].behavior,
          impact: state.reportsByTrial[trialId].impact,
          evidence: state.reportsByTrial[trialId].evidence,
          implicated_steps: [...state.reportsByTrial[trialId].implicated_steps],
        }
      : null,
  }
}

function buildMarkdown(pkg) {
  if (!pkg) return ''
  const notes = pkg.annotations.length
    ? pkg.annotations.map((note) => `- Step ${note.step_index}: ${note.note_text}`).join('\n')
    : '- No annotations recorded.'
  const failure = pkg.failure_report
    ? `## Failure classification\n\n- Stage: ${pkg.failure_report.stage}\n- Root cause: ${pkg.failure_report.root_cause}\n- Behavior: ${pkg.failure_report.behavior}\n- Impact: ${pkg.failure_report.impact}\n- Implicated steps: ${pkg.failure_report.implicated_steps.join(', ')}\n\n### Evidence\n\n${pkg.failure_report.evidence}`
    : '## Failure classification\n\nNo failure report recorded.'
  return `# Review package\n\n- Task ID: ${pkg.task_id}\n- Trial ID: ${pkg.trial_id}\n- Model: ${pkg.model}\n- Outcome: ${pkg.outcome}\n- Reward: ${pkg.reward.toFixed(2)}\n\n## Annotations\n\n${notes}\n\n${failure}\n`
}

export const useAppStore = create((set, get) => ({
  tasks,
  view: 'catalog',
  activeTaskId: null,
  activeTrialId: null,
  activeStepIndex: 1,
  filesystemSide: 'reference',
  selectedFile: 'README.md',
  disclosureOpen: {},
  toolOutputOpen: {},
  terminalByStep: {},
  annotationsByTrial: {},
  reportsByTrial: {},
  ingest: { completed: 0, total: 4 },
  trialSort: 'asc',
  stepTypeFilter: 'all',
  undoStack: [],
  redoStack: [],
  exportPreview: { json: '', markdown: '', format: 'json', exportedAt: '' },
  importDraft: '',
  noteDrafts: {},
  chrome: emptyChrome,
  locale: 'en',
  theme: 'dark',

  openCatalog: () => set({ view: 'catalog', activeTaskId: null, activeTrialId: null, activeStepIndex: 1, chrome: emptyChrome }),
  openTask: (taskId) => {
    const task = taskById(taskId)
    if (!task) return false
    set({ view: 'task', activeTaskId: taskId, activeTrialId: null, filesystemSide: 'reference', selectedFile: 'README.md', chrome: { ...get().chrome, paletteOpen: false } })
    return true
  },
  openTrial: (trialId) => {
    const trial = trialById(trialId)
    if (!trial) return false
    set({
      view: 'ingest', activeTaskId: trial.taskId, activeTrialId: trialId, activeStepIndex: 1,
      filesystemSide: 'trial', selectedFile: 'README.md', stepTypeFilter: 'all', ingest: { completed: 0, total: 4 },
      chrome: { ...emptyChrome },
    })
    get().refreshExport()
    return true
  },
  setIngestCompleted: (completed) => set({ ingest: { completed, total: 4 } }),
  finishIngest: () => set({ view: 'viewer', activeStepIndex: 1 }),
  setActiveStep: (index) => {
    const trial = trialById(get().activeTrialId)
    if (!trial || !trial.steps.some((step) => step.index === Number(index))) return false
    set({ activeStepIndex: Number(index) })
    return true
  },
  setFilesystemSide: (side) => set({ filesystemSide: side }),
  setSelectedFile: (path) => set({ selectedFile: path }),
  toggleSort: () => set((state) => ({ trialSort: state.trialSort === 'asc' ? 'desc' : 'asc' })),
  setSort: (sort) => set({ trialSort: sort === 'reward-desc' ? 'desc' : 'asc' }),
  setStepTypeFilter: (filter) => set({ stepTypeFilter: filter }),
  toggleDisclosure: (stepIndex) => set((state) => ({ disclosureOpen: { ...state.disclosureOpen, [`${state.activeTrialId}:${stepIndex}`]: !state.disclosureOpen[`${state.activeTrialId}:${stepIndex}`] } })),
  toggleToolOutput: (stepIndex) => set((state) => ({ toolOutputOpen: { ...state.toolOutputOpen, [`${state.activeTrialId}:${stepIndex}`]: !state.toolOutputOpen[`${state.activeTrialId}:${stepIndex}`] } })),
  setTerminalState: (key, patch) => set((state) => ({ terminalByStep: { ...state.terminalByStep, [key]: { ...(state.terminalByStep[key] || {}), ...patch } } })),
  setChrome: (patch) => {
    if (patch.paletteOpen && !get().chrome.paletteOpen) captureDialogOpener('palette')
    if (patch.noteOpen && !get().chrome.noteOpen) captureDialogOpener('note')
    set((state) => ({ chrome: { ...state.chrome, ...patch } }))
  },
  setImportDraft: (importDraft) => set({ importDraft }),
  setNoteDraft: (trialId, text) => set((state) => ({ noteDrafts: { ...state.noteDrafts, [trialId]: text } })),
  setExportFormat: (format) => set((state) => ({ exportPreview: { ...state.exportPreview, format } })),
  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),

  refreshExport: () => {
    const state = get()
    const pkg = buildPackage(state, state.activeTrialId)
    if (!pkg) return
    set({ exportPreview: { ...state.exportPreview, json: JSON.stringify(pkg, null, 2), markdown: buildMarkdown(pkg), exportedAt: pkg.exportedAt } })
  },
  openExport: () => {
    if (!get().chrome.exportOpen) captureDialogOpener('export')
    get().refreshExport()
    set((state) => ({ chrome: { ...state.chrome, exportOpen: true, paletteOpen: false } }))
  },
  openImport: () => {
    if (!get().chrome.importOpen) captureDialogOpener('import')
    set((state) => ({ chrome: { ...state.chrome, importOpen: true, paletteOpen: false } }))
  },

  commitReview: (trialId, nextReview, label) => {
    const state = get()
    const before = cloneReview(state, trialId)
    const after = {
      annotations: nextReview.annotations.map((item) => ({ note_text: item.note_text, step_index: Number(item.step_index) })),
      report: nextReview.report ? { ...nextReview.report, implicated_steps: nextReview.report.implicated_steps.map(Number) } : null,
    }
    set({
      annotationsByTrial: { ...state.annotationsByTrial, [trialId]: after.annotations },
      reportsByTrial: { ...state.reportsByTrial, [trialId]: after.report },
      undoStack: [...state.undoStack, { trialId, before, after, label }],
      redoStack: [],
    })
    get().refreshExport()
  },
  addAnnotation: (body) => {
    const state = get(); const trialId = state.activeTrialId
    get().commitReview(trialId, { annotations: [...(state.annotationsByTrial[trialId] || []), body], report: state.reportsByTrial[trialId] || null }, 'Add note')
  },
  updateAnnotation: (annotationIndex, note_text) => {
    const state = get(); const trialId = state.activeTrialId
    const annotations = (state.annotationsByTrial[trialId] || []).map((note, index) => index === annotationIndex ? { ...note, note_text } : note)
    get().commitReview(trialId, { annotations, report: state.reportsByTrial[trialId] || null }, 'Edit note')
  },
  deleteAnnotation: (annotationIndex) => {
    const state = get(); const trialId = state.activeTrialId
    const annotations = (state.annotationsByTrial[trialId] || []).filter((_, index) => index !== annotationIndex)
    get().commitReview(trialId, { annotations, report: state.reportsByTrial[trialId] || null }, 'Remove note')
  },
  submitReport: (body) => {
    const state = get(); const trialId = state.activeTrialId
    get().commitReview(trialId, { annotations: state.annotationsByTrial[trialId] || [], report: body }, state.reportsByTrial[trialId] ? 'Update classification' : 'Classify failure')
  },
  importReview: (pkg) => {
    const state = get(); const trialId = state.activeTrialId
    get().commitReview(trialId, { annotations: pkg.annotations, report: pkg.failure_report }, 'Import review package')
    get().refreshExport()
  },
  undo: () => {
    const state = get(); const entry = state.undoStack.at(-1)
    if (!entry) return false
    set({
      annotationsByTrial: { ...state.annotationsByTrial, [entry.trialId]: entry.before.annotations },
      reportsByTrial: { ...state.reportsByTrial, [entry.trialId]: entry.before.report },
      undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, entry],
    })
    get().refreshExport(); return true
  },
  redo: () => {
    const state = get(); const entry = state.redoStack.at(-1)
    if (!entry) return false
    set({
      annotationsByTrial: { ...state.annotationsByTrial, [entry.trialId]: entry.after.annotations },
      reportsByTrial: { ...state.reportsByTrial, [entry.trialId]: entry.after.report },
      undoStack: [...state.undoStack, entry], redoStack: state.redoStack.slice(0, -1),
    })
    get().refreshExport(); return true
  },
}))

export { buildPackage, buildMarkdown }
