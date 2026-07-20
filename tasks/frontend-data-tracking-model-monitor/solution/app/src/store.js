import { create } from 'zustand'
import { calculateCost, refreshAdditions, seedModels, seedUsageEvents } from './data.js'
import { sessionReportSchema } from './schemas.js'

const clone = (value) => JSON.parse(JSON.stringify(value))
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function deriveRollups(events) {
  const grouped = new Map()
  events.forEach((event) => {
    const current = grouped.get(event.model) || { model: event.model, requests: 0, subtotal: 0, events: [] }
    current.requests += 1
    current.subtotal = Number((current.subtotal + event.cost).toFixed(8))
    current.events.push(event)
    grouped.set(event.model, current)
  })
  return [...grouped.values()].sort((a, b) => b.subtotal - a.subtotal)
}

export function csvFromEvents(events) {
  const escape = (value) => {
    const text = String(value)
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  return [
    'timestamp,model,request_label,prompt_tokens,completion_tokens,cost',
    ...events.map((event) => [event.timestamp, event.model, event.request_label, event.prompt_tokens, event.completion_tokens, event.cost].map(escape).join(',')),
  ].join('\n')
}

export function reportFromState(state, exportedAt = new Date().toISOString()) {
  const catalog = state.models.filter((item) => item.lifecycle !== 'departing').map((item) => ({
    name: item.name,
    provider: item.provider,
    context_window: item.context_window,
    input_cost_per_1k: item.input_cost_per_1k,
    output_cost_per_1k: item.output_cost_per_1k,
    pricing_tier: item.pricing_tier,
    pinned: item.pinned,
  }))
  const usage_events = state.usageEvents.map(({ timestamp, model, request_label, prompt_tokens, completion_tokens, cost }) => ({
    timestamp, model, request_label, prompt_tokens, completion_tokens, cost,
  }))
  const cost_rollups = deriveRollups(usage_events).map(({ model, requests, subtotal }) => ({ model, requests, subtotal }))
  return {
    schema_version: 'routing-session-report-v1',
    exported_at: exportedAt,
    catalog,
    usage_events,
    cost_rollups,
    session_total: Number(cost_rollups.reduce((sum, row) => sum + row.subtotal, 0).toFixed(8)),
    total_requests: usage_events.length,
    alert_config: { ...state.alertConfig },
    session_budget_usd: state.sessionBudget,
    compare_selected: state.compareSelected.filter((name) => catalog.some((item) => item.name === name)),
    pinned_models: catalog.filter((item) => item.pinned).map((item) => item.name),
  }
}

const snapshot = (state) => clone({
  models: state.models,
  usageEvents: state.usageEvents,
  alertConfig: state.alertConfig,
  sessionBudget: state.sessionBudget,
})

const applySnapshot = (snap) => ({
  models: clone(snap.models),
  usageEvents: clone(snap.usageEvents),
  alertConfig: clone(snap.alertConfig),
  sessionBudget: snap.sessionBudget,
})

function historyMutation(set, get, makePatch) {
  const current = get()
  const before = snapshot(current)
  const patch = makePatch(current)
  if (!patch) return false
  const after = snapshot({ ...current, ...patch })
  set({ ...patch, undoStack: [...current.undoStack, { before, after }], redoStack: [] })
  return true
}

let toastSequence = 0
let eventSequence = 100

export const useAppStore = create((set, get) => ({
  models: clone(seedModels),
  usageEvents: clone(seedUsageEvents),
  searchQuery: '',
  providerFilter: 'All providers',
  pinnedOnly: false,
  freeOnly: false,
  sortBy: 'name',
  compareSelected: [],
  alertConfig: { alerts_enabled: false, min_context_window: 0 },
  hiddenChartModels: [],
  disclosureOpen: {},
  simulationRunning: false,
  simulationCounter: 0,
  sessionBudget: 5,
  undoStack: [],
  redoStack: [],
  refreshLoading: false,
  refreshIndex: 0,
  alertOpen: false,
  logOpen: false,
  compareOpen: false,
  exportOpen: false,
  commandOpen: false,
  mobileCostsOpen: false,
  exportTab: 'json',
  commandQuery: '',
  highlightedModel: null,
  navTarget: null,
  toasts: [],
  liveMessage: '',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setProviderFilter: (providerFilter) => set({ providerFilter }),
  setPinnedOnly: (pinnedOnly) => set({ pinnedOnly }),
  setFreeOnly: (freeOnly) => set({ freeOnly }),
  setSortBy: (sortBy) => set({ sortBy }),
  clearFilters: () => set({ searchQuery: '', providerFilter: 'All providers', pinnedOnly: false, freeOnly: false }),
  applySuggestion: (value) => {
    const providers = [...new Set(get().models.map((item) => item.provider))]
    if (providers.includes(value)) set({ providerFilter: value })
    else if (value === 'Free') set({ searchQuery: 'free' })
    else set({ searchQuery: value })
  },

  togglePin: (name) => historyMutation(set, get, (state) => ({
    models: state.models.map((item) => item.name === name ? { ...item, pinned: !item.pinned } : item),
    liveMessage: `${name} ${state.models.find((item) => item.name === name)?.pinned ? 'removed from' : 'added to'} pinned models`,
  })),
  toggleCompare: (name) => set((state) => ({
    compareSelected: state.compareSelected.includes(name)
      ? state.compareSelected.filter((item) => item !== name)
      : [...state.compareSelected, name],
  })),
  toggleLegend: (name) => set((state) => ({
    hiddenChartModels: state.hiddenChartModels.includes(name)
      ? state.hiddenChartModels.filter((item) => item !== name)
      : [...state.hiddenChartModels, name],
  })),
  toggleDisclosure: (name) => set((state) => ({ disclosureOpen: { ...state.disclosureOpen, [name]: !state.disclosureOpen[name] } })),
  highlightCatalogModel: (name) => set({ highlightedModel: name, navTarget: { destination: 'model-catalog', token: Date.now() }, mobileCostsOpen: false }),
  clearHighlight: () => set({ highlightedModel: null }),

  saveAlertConfig: (config) => historyMutation(set, get, () => ({ alertConfig: { ...config }, alertOpen: false, liveMessage: 'Free-model alert settings saved' })),
  saveBudget: (value) => historyMutation(set, get, () => ({ sessionBudget: Number(value), liveMessage: `Session budget set to $${Number(value).toFixed(2)}` })),
  addManualUsage: (form, cost) => historyMutation(set, get, (state) => {
    const entry = {
      id: `manual-${++eventSequence}`,
      timestamp: new Date().toISOString(),
      model: form.model,
      request_label: form.request_label.trim(),
      prompt_tokens: Number(form.prompt_tokens),
      completion_tokens: Number(form.completion_tokens),
      cost,
      source: 'manual',
    }
    return { usageEvents: [entry, ...state.usageEvents], logOpen: false, liveMessage: `${entry.request_label} logged for ${entry.model}` }
  }),

  undo: () => {
    const state = get()
    if (!state.undoStack.length) return
    const entry = state.undoStack[state.undoStack.length - 1]
    set({ ...applySnapshot(entry.before), undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, entry], liveMessage: 'Last edit undone' })
  },
  redo: () => {
    const state = get()
    if (!state.redoStack.length) return
    const entry = state.redoStack[state.redoStack.length - 1]
    set({ ...applySnapshot(entry.after), undoStack: [...state.undoStack, entry], redoStack: state.redoStack.slice(0, -1), liveMessage: 'Edit restored' })
  },

  setSimulationRunning: (running) => set({ simulationRunning: running, liveMessage: running ? 'Usage simulation started' : 'Usage simulation paused' }),
  addSimulatedUsage: () => set((state) => {
    if (!state.simulationRunning) return state
    const eligible = state.models.filter((item) => item.lifecycle !== 'departing')
    const index = state.simulationCounter % eligible.length
    const selected = eligible[index]
    const prompt = 28000 + ((state.simulationCounter * 4377) % 22000)
    const completion = 3500 + ((state.simulationCounter * 931) % 5500)
    const cost = calculateCost(selected, prompt, completion)
    const entry = {
      id: `sim-${++eventSequence}`,
      timestamp: new Date().toISOString(),
      model: selected.name,
      request_label: ['Live route probe', 'Latency sample', 'Fallback check', 'Quality evaluation'][state.simulationCounter % 4],
      prompt_tokens: prompt,
      completion_tokens: completion,
      cost,
      source: 'simulation',
    }
    return {
      usageEvents: [entry, ...state.usageEvents],
      simulationCounter: state.simulationCounter + 1,
      liveMessage: `New usage event for ${entry.model}`,
    }
  }),

  triggerRefresh: () => {
    const initial = get()
    if (initial.refreshLoading) return false
    const nextIndex = initial.refreshIndex + 1
    set({ refreshLoading: true, refreshIndex: nextIndex, liveMessage: 'Discovering marketplace models' })
    window.setTimeout(() => {
      const state = get()
      const addition = { ...refreshAdditions[(nextIndex - 1) % refreshAdditions.length], lifecycle: 'new' }
      const removalNames = ['GPT-4o Mini', 'Codestral', 'Nova Lite', 'Command R+', 'Jamba 1.5 Large']
      const removalName = removalNames[(nextIndex - 1) % removalNames.length]
      const flipCandidates = ['Grok 3 Mini', 'DeepSeek V3', 'Gemma 3 27B', 'Claude 3.5 Haiku', 'Nova Pro']
      const flipName = flipCandidates[(nextIndex - 1) % flipCandidates.length]
      let becameFree = null
      let models = state.models.map((item) => {
        if (item.name === removalName && item.lifecycle !== 'departing') return { ...item, pinned: false, lifecycle: 'departing' }
        if (item.name === flipName) {
          if (item.pricing_tier === 'paid') {
            becameFree = { ...item, pricing_tier: 'free', input_cost_per_1k: 0, output_cost_per_1k: 0 }
            return becameFree
          }
          return { ...item, pricing_tier: 'paid', input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0008 }
        }
        return item
      })
      if (!models.some((item) => item.name === addition.name)) models = [addition, ...models]
      const compareSelected = state.compareSelected.filter((name) => name !== removalName)
      const qualifies = becameFree && state.alertConfig.alerts_enabled && becameFree.context_window >= state.alertConfig.min_context_window
      const toast = qualifies ? { id: `toast-${++toastSequence}`, message: `${becameFree.name} just became free`, kind: 'success' } : null
      set({
        models,
        compareSelected,
        compareOpen: compareSelected.length >= 2 ? state.compareOpen : false,
        refreshLoading: false,
        toasts: toast ? [...state.toasts, toast] : state.toasts,
        liveMessage: toast?.message || `Catalog refreshed: ${addition.name} discovered`,
      })
      window.setTimeout(() => set((current) => ({ models: current.models.map((item) => item.name === addition.name ? { ...item, lifecycle: 'stable' } : item) })), 350)
      window.setTimeout(() => set((current) => ({
        models: current.models.filter((item) => !(item.name === removalName && item.lifecycle === 'departing')),
        compareSelected: current.compareSelected.filter((name) => name !== removalName),
      })), 5000)
    }, 700)
    return true
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  setOverlay: (name, open) => set({ [name]: open }),
  setExportTab: (exportTab) => set({ exportTab }),
  setCommandQuery: (commandQuery) => set({ commandQuery }),
  setLiveMessage: (liveMessage) => set({ liveMessage }),
  navigateDestination: (destination) => {
    const patch = { commandOpen: false, commandQuery: '', navTarget: { destination, token: Date.now() } }
    if (destination === 'alert-settings-modal') patch.alertOpen = true
    if (destination === 'comparison-modal' && get().compareSelected.length >= 2) patch.compareOpen = true
    if (destination === 'log-usage-modal') patch.logOpen = true
    if (destination === 'export-panel') patch.exportOpen = true
    if (destination === 'command-palette') patch.commandOpen = true
    if (destination === 'cost-sidebar') patch.mobileCostsOpen = true
    set(patch)
  },
  importReport: (rawReport) => {
    const parsed = sessionReportSchema.safeParse(rawReport)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || 'Import field is invalid' }
    const report = parsed.data
    const models = report.catalog.map((item) => ({ ...item, id: slug(item.name), lifecycle: 'stable', pinned: report.pinned_models.includes(item.name) || item.pinned }))
    const validNames = new Set(models.map((item) => item.name))
    const usageEvents = report.usage_events.map((item, index) => ({ ...item, id: `import-${Date.now()}-${index}`, source: 'import' }))
    set({
      models,
      usageEvents,
      alertConfig: report.alert_config,
      sessionBudget: report.session_budget_usd,
      compareSelected: report.compare_selected.filter((name) => validNames.has(name)),
      undoStack: [],
      redoStack: [],
      importError: '',
      liveMessage: 'Session JSON imported successfully',
    })
    return { ok: true }
  },
}))
