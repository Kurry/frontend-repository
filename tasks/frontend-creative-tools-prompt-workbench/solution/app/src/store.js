import { create } from 'zustand'
import { ASSETS, MODELS, PERSONAS, SEEDED_LIBRARY, detectVariables, modelById, resolvedPrompt } from './data'

const makeBindings = (text, current = {}) => Object.fromEntries(detectVariables(text).map((name) => [name, current[name] ?? '']))

const snapshotKeys = ['draft', 'bindings', 'selectedModelId', 'activePersona', 'attachmentIds', 'library']
// Workbench mutations replace arrays/objects instead of mutating them in place,
// so history can retain their immutable references. Deep-cloning the seeded
// library on every editor keystroke made large drafts needlessly expensive.
const snapshot = (state) => Object.fromEntries(snapshotKeys.map((key) => [key, state[key]]))

const withHistory = (set, get, changes) => {
  const before = snapshot(get())
  set((state) => ({
    ...changes(state),
    undoStack: [...state.undoStack, before].slice(-100),
    redoStack: [],
  }))
}

const toastId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
const normalizedTitle = (title) => title.trim().toLocaleLowerCase()

function makeRequest(state) {
  return {
    model: state.selectedModelId,
    messages: [
      ...(state.activePersona ? [{ role: 'system', content: state.activePersona.preface }] : []),
      { role: 'user', content: state.draft },
    ],
    temperature: 1,
    maxTokens: 1024,
  }
}

function responseVariants(state) {
  const resolved = resolvedPrompt(state.draft, state.bindings)
  const subject = resolved.length > 150 ? `${resolved.slice(0, 147)}…` : resolved
  return [
    {
      label: 'Balanced',
      response: `Here is a focused response based on your prompt:\n\n${subject}\n\n### Recommended approach\n1. Clarify the desired outcome and the audience that will act on it.\n2. Structure the answer around the strongest available evidence, and say what is missing.\n3. End with a concrete next action that has an owner and a deadline.\n\n### Why this works\nA balanced response keeps the reader oriented: the summary states the claim, the middle section defends it, and the close converts it into a decision. Each paragraph earns its place by changing what the reader would do next.\n\n### Guardrails\n- Keep every claim traceable to a source or an explicit assumption.\n- Prefer one strong argument over three weak ones.\n- Name the counter-argument before the reader finds it.\n\n\`\`\`javascript\nconst nextStep = "Turn the recommendation into a measurable experiment";\nconsole.log(nextStep);\n\`\`\`\n\n### Follow-up\nIf the decision slips, revisit the assumptions in the second section first — that is where stale context hides. A short re-check of the audience, the success measure, and the evidence base usually restores confidence without a full rewrite.`,
      reasoning: 'I identified the central request, preserved the supplied context, and organized the response into an actionable progression with explicit guardrails.',
    },
    {
      label: 'Concise',
      response: `A concise take:\n\n${subject}\n\nFocus on one clear audience, one defensible insight, and one measurable next step. Remove details that do not change the decision.\n\n### The short version\nLead with the recommendation. Support it with the single strongest piece of evidence. Close with the next action and its owner.\n\n### What to cut\nAnything a reader could remove without changing their decision goes. Background, caveats, and secondary findings can move to an appendix or a follow-up note.\n\n### What to keep\nThe claim, the evidence that would survive a skeptical review, the cost of being wrong, and the next step. Everything else is noise.\n\n### Delivery note\nSend the short version first. Offer the detailed analysis as an attachment so the reader can verify without wading through it on the first pass.`,
      reasoning: 'I optimized for scanability by retaining the core request and reducing the answer to its decision-critical elements.',
    },
    {
      label: 'Detailed',
      response: `A more detailed response to your prompt:\n\n${subject}\n\n### Context\nStart by confirming the constraints and the success measure. A response that answers the wrong question precisely is still wrong, so restate the request in one sentence and flag any ambiguity before proceeding.\n\n### Development\nBuild from evidence, make assumptions explicit, and address the most likely objection. Structure the argument so each section answers one question: what do we know, what do we assume, and what follows from both.\n\n1. Evidence — the observed facts, with sources.\n2. Assumptions — the unstated premises that connect facts to conclusions.\n3. Inference — the conclusions that survive if the assumptions hold.\n4. Risk — what breaks first if an assumption fails.\n\n### Delivery\nUse a short summary up front, supporting detail in the body, and an owner with a deadline for the next action. The summary should stand alone: a reader who only reads the first paragraph should still get the decision and its rationale.\n\n### Appendix\nKeep raw data, full citations, and worked examples here so the main argument stays readable while remaining fully verifiable on demand.`,
      reasoning: 'I expanded the response into context, development, and delivery stages so each recommendation has a clear rationale and execution path.',
    },
  ]
}

const initialState = {
  draft: '',
  bindings: {},
  selectedModelId: MODELS[0].id,
  activePersona: null,
  attachmentIds: [],
  activeView: 'workbench',
  library: structuredClone(SEEDED_LIBRARY),
  selectedLibraryIds: [],
  techniqueFilter: '',
  runs: [],
  activeRunId: null,
  streamingRunId: null,
  followScroll: true,
  undoStack: [],
  redoStack: [],
  commandOpen: false,
  commandQuery: '',
  exportOpen: false,
  exportFormat: 'markdown',
  saveOpen: false,
  importOpen: false,
  variableOpen: false,
  personaOpen: false,
  assetOpen: false,
  toasts: [],
  liveMessage: '',
}

export const useWorkbench = create((set, get) => ({
  ...initialState,
  setDraft: (draft) => withHistory(set, get, () => ({ draft, bindings: makeBindings(draft, get().bindings) })),
  setModel: (selectedModelId) => withHistory(set, get, () => ({ selectedModelId })),
  setBinding: (name, value) => withHistory(set, get, () => ({ bindings: { ...get().bindings, [name]: value } })),
  attachPersona: (activePersona) => withHistory(set, get, () => ({ activePersona, personaOpen: false })),
  clearPersona: () => withHistory(set, get, () => ({ activePersona: null })),
  addAttachment: (id) => {
    if (get().attachmentIds.includes(id)) return
    withHistory(set, get, () => ({ attachmentIds: [...get().attachmentIds, id], assetOpen: false }))
  },
  removeAttachment: (id) => {
    if (!get().attachmentIds.includes(id)) return
    withHistory(set, get, () => ({ attachmentIds: get().attachmentIds.filter((item) => item !== id) }))
    get().addToast('Attachment removed', 'info')
  },
  insertVariable: (name, from = null, to = null) => {
    const state = get()
    const start = from ?? state.draft.length
    const end = to ?? start
    const draft = `${state.draft.slice(0, start)}{{${name}}}${state.draft.slice(end)}`
    withHistory(set, get, () => ({ draft, bindings: makeBindings(draft, state.bindings), variableOpen: false }))
  },
  undo: () => set((state) => {
    if (!state.undoStack.length) return state
    const previous = state.undoStack.at(-1)
    return { ...previous, undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, snapshot(state)] }
  }),
  redo: () => set((state) => {
    if (!state.redoStack.length) return state
    const next = state.redoStack.at(-1)
    return { ...next, redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, snapshot(state)] }
  }),
  switchView: (activeView) => set({ activeView, commandOpen: false }),
  saveLibrary: (payload) => {
    const title = payload.title.trim()
    if (get().library.some((item) => normalizedTitle(item.title) === normalizedTitle(title))) return false
    const record = { id: `lib-${Date.now()}`, ...structuredClone(payload), title }
    withHistory(set, get, () => ({ library: [...get().library, record], saveOpen: false, techniqueFilter: '' }))
    get().addToast(`“${record.title}” saved to library`, 'success')
    return record
  },
  deleteLibrary: (id) => {
    const item = get().library.find((entry) => entry.id === id)
    if (!item) return
    withHistory(set, get, () => ({ library: get().library.filter((entry) => entry.id !== id), selectedLibraryIds: get().selectedLibraryIds.filter((entry) => entry !== id) }))
    get().addToast(`“${item.title}” deleted`, 'info')
  },
  loadLibrary: (id) => {
    const item = get().library.find((entry) => entry.id === id)
    if (!item) return
    const persona = PERSONAS.find((entry) => entry.id === item.personaId) || null
    withHistory(set, get, () => ({
      draft: item.promptText,
      bindings: makeBindings(item.promptText, item.bindings),
      activePersona: persona,
      attachmentIds: [...item.attachments],
      activeView: 'workbench',
      commandOpen: false,
    }))
  },
  toggleLibrarySelection: (id) => set((state) => ({ selectedLibraryIds: state.selectedLibraryIds.includes(id) ? state.selectedLibraryIds.filter((item) => item !== id) : [...state.selectedLibraryIds, id] })),
  setTechniqueFilter: (techniqueFilter) => set({ techniqueFilter }),
  startRun: () => {
    const state = get()
    if (!state.draft.trim() || state.streamingRunId) return null
    const unbound = detectVariables(state.draft).filter((name) => !state.bindings[name])
    if (unbound.length) {
      get().addToast(`Bind variables before running: ${unbound.join(', ')}`, 'warning')
      set({ liveMessage: `Run not started. Unbound variables: ${unbound.join(', ')}` })
      return null
    }
    const id = `run-${Date.now()}`
    const model = modelById(state.selectedModelId)
    const now = new Date()
    const run = {
      id,
      modelId: model.id,
      modelName: model.name,
      timestamp: now.toISOString(),
      status: 'streaming',
      accumulatedText: '',
      variants: responseVariants(state),
      variantIndex: 0,
      reasoningExpanded: false,
      reasoningStartedAt: Date.now(),
      reasoningDuration: null,
      request: makeRequest(state),
      steps: [
        { id: 'prepare', name: 'Prepare Context', status: 'running', output: 'Validating prompt, bindings, and persona.' },
        { id: 'draft', name: 'Generate Draft', status: 'pending', output: '' },
        { id: 'finalize', name: 'Finalize Response', status: 'pending', output: '' },
      ],
    }
    set({ runs: [run, ...state.runs], activeRunId: id, streamingRunId: id, followScroll: true, liveMessage: `Streaming started with ${model.name}.` })
    return id
  },
  appendRunText: (id, chunk, progress) => set((state) => ({
    runs: state.runs.map((run) => run.id !== id ? run : {
      ...run,
      accumulatedText: run.accumulatedText + chunk,
      steps: run.steps.map((step, index) => ({
        ...step,
        status: progress < .18 ? (index === 0 ? 'running' : 'pending')
          : progress < .82 ? (index === 0 ? 'complete' : index === 1 ? 'running' : 'pending')
          : (index < 2 ? 'complete' : 'running'),
        output: index === 0 && progress >= .18 ? 'Context prepared.' : index === 1 && progress >= .82 ? 'Draft generated.' : step.output,
      })),
    }),
  })),
  advanceRun: (id) => {
    const run = get().runs.find((entry) => entry.id === id)
    if (!run || run.status !== 'streaming') return false
    const target = run.variants[0].response
    const next = target.slice(run.accumulatedText.length, run.accumulatedText.length + 22)
    if (!next) { get().completeRun(id); return false }
    get().appendRunText(id, next, (run.accumulatedText.length + next.length) / target.length)
    return true
  },
  completeRun: (id) => set((state) => ({
    streamingRunId: state.streamingRunId === id ? null : state.streamingRunId,
    liveMessage: 'Run complete.',
    runs: state.runs.map((run) => run.id !== id ? run : {
      ...run,
      status: 'complete',
      accumulatedText: run.variants[0].response,
      reasoningDuration: Math.max(1, Math.round((Date.now() - run.reasoningStartedAt) / 1000)),
      steps: run.steps.map((step, index) => ({ ...step, status: 'complete', output: step.output || (index === 1 ? 'Draft generated.' : 'Response checked and finalized.') })),
    }),
  })),
  stopRun: () => set((state) => {
    const id = state.streamingRunId
    if (!id) return state
    return {
      streamingRunId: null,
      liveMessage: 'Run stopped.',
      runs: state.runs.map((run) => run.id !== id ? run : {
        ...run,
        status: 'stopped',
        reasoningDuration: Math.max(1, Math.round((Date.now() - run.reasoningStartedAt) / 1000)),
        variants: [{ ...run.variants[0], response: run.accumulatedText }],
        variantIndex: 0,
        steps: run.steps.map((step) => step.status === 'running' ? { ...step, status: 'failed', output: 'Stopped by user.' } : step),
      }),
    }
  }),
  selectRun: (activeRunId) => set({ activeRunId }),
  setVariant: (runId, variantIndex) => set((state) => ({ runs: state.runs.map((run) => run.id === runId ? { ...run, variantIndex } : run) })),
  toggleReasoning: (runId) => set((state) => ({ runs: state.runs.map((run) => run.id === runId ? { ...run, reasoningExpanded: !run.reasoningExpanded } : run) })),
  setFollowScroll: (followScroll) => set({ followScroll }),
  importPackage: (pkg) => withHistory(set, get, () => ({
    draft: pkg.promptText,
    bindings: makeBindings(pkg.promptText, pkg.bindings),
    selectedModelId: pkg.model,
    activePersona: pkg.persona || null,
    attachmentIds: pkg.attachments.map((item) => item.id),
    importOpen: false,
    activeView: 'workbench',
  })),
  setChrome: (key, value) => set({ [key]: value }),
  addToast: (message, kind = 'success') => {
    const id = toastId()
    set((state) => ({ toasts: [...state.toasts, { id, message, kind }], liveMessage: message }))
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.map((toast) => toast.id === id ? { ...toast, leaving: true } : toast) })), 3300)
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 3650)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

export function compilePackage(state = useWorkbench.getState()) {
  const latest = state.runs.find((run) => ['complete', 'stopped'].includes(run.status))
  const runVariant = latest?.variants[latest.variantIndex]
  return {
    schemaVersion: 'prompt-package-v1',
    model: state.selectedModelId,
    promptText: state.draft,
    messages: [
      ...(state.activePersona ? [{ role: 'system', content: state.activePersona.preface }] : []),
      { role: 'user', content: state.draft },
    ],
    bindings: { ...state.bindings },
    attachments: state.attachmentIds.map((id) => ASSETS.find((asset) => asset.id === id)).filter(Boolean).map(({ id, name }) => ({ id, name })),
    persona: state.activePersona ? { id: state.activePersona.id, name: state.activePersona.name, preface: state.activePersona.preface } : null,
    ...(latest ? { latestRun: { status: latest.status, model: latest.modelId, summary: (runVariant?.response || latest.accumulatedText).slice(0, 160), request: latest.request } } : {}),
  }
}

export function compileMarkdown(state = useWorkbench.getState()) {
  const pkg = compilePackage(state)
  const model = modelById(pkg.model)
  const bindingRows = Object.entries(pkg.bindings).map(([name, value]) => `| \`${name}\` | ${value || 'Unbound'} |`).join('\n') || '| — | No variables |'
  const attachments = pkg.attachments.map((item) => item.name).join(', ') || 'None'
  return `# Prompt package\n\n## Model\n${model.name}\n\n${pkg.persona ? `## Persona: ${pkg.persona.name}\n${pkg.persona.preface}\n\n` : ''}## Prompt\n\n${pkg.promptText}\n\n## Bindings\n\n| Variable | Value |\n| --- | --- |\n${bindingRows}\n\n## Attachments\n${attachments}${pkg.latestRun ? `\n\n## Latest response summary\n${pkg.latestRun.summary}` : ''}\n`
}
