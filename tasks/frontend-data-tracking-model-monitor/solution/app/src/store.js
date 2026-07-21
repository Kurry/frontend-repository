import { create } from 'zustand'
import { calculateCost, refreshAdditions, seedModels, seedUsageEvents } from './data.js'
import { sessionReportSchema } from './schemas.js'

const clone = (value) => JSON.parse(JSON.stringify(value))
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const DEFAULT_BUDGET = 5

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

export function sessionTotal(events) {
  return Number(events.reduce((sum, event) => sum + event.cost, 0).toFixed(8))
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
  const catalog = state.models.filter((item) => item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing').map((item) => ({
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

/* Compact diff of the live session against the pristine seed, for the
   export panel's "changed since seed" summary. */
export function seedDiff(state, seedSnapshot) {
  const parts = []
  const eventDelta = state.usageEvents.length - seedSnapshot.eventCount
  if (eventDelta !== 0) parts.push(`${eventDelta > 0 ? '+' : ''}${eventDelta} usage event${Math.abs(eventDelta) === 1 ? '' : 's'}`)
  const seedPins = new Set(seedSnapshot.pinnedModels)
  const nowPins = new Set(state.models.filter((m) => m.pinned && m.lifecycle !== 'departing').map((m) => m.name))
  const added = [...nowPins].filter((name) => !seedPins.has(name))
  const removed = [...seedPins].filter((name) => !nowPins.has(name))
  if (added.length || removed.length) {
    parts.push(`pins ${added.map((name) => `+${name}`).concat(removed.map((name) => `−${name}`)).join(', ')}`)
  }
  if (state.sessionBudget !== seedSnapshot.sessionBudget) {
    parts.push(`budget $${seedSnapshot.sessionBudget.toFixed(2)} → $${state.sessionBudget.toFixed(2)}`)
  }
  if (state.alertConfig.alerts_enabled !== seedSnapshot.alertConfig.alerts_enabled
    || state.alertConfig.min_context_window !== seedSnapshot.alertConfig.min_context_window) {
    parts.push(`alerts ${state.alertConfig.alerts_enabled ? `on · ≥${state.alertConfig.min_context_window.toLocaleString()} ctx` : 'off'}`)
  }
  const activeModels = state.models.filter((m) => m.lifecycle !== 'departing' && m.lifecycle !== 'collapsing')
  const catalogDelta = activeModels.length - seedSnapshot.modelCount
  if (catalogDelta !== 0) parts.push(`${catalogDelta > 0 ? '+' : ''}${catalogDelta} catalog model${Math.abs(catalogDelta) === 1 ? '' : 's'}`)
  return parts
}

/* Burn rate over the trailing two minutes of the event stream, plus a
   time-to-exhaustion projection against the remaining budget. */
export function burnProjection(events, budget) {
  const now = Date.now()
  const windowMs = 120_000
  const recent = events.filter((event) => now - new Date(event.timestamp).getTime() <= windowMs)
  const spent = recent.reduce((sum, event) => sum + event.cost, 0)
  const perMinute = spent / (windowMs / 60_000)
  const total = sessionTotal(events)
  const remaining = budget - total
  if (perMinute <= 0) return { perMinute: 0, minutesLeft: null, exhausted: remaining <= 0 }
  return {
    perMinute: Number(perMinute.toFixed(4)),
    minutesLeft: remaining > 0 ? Math.max(0, remaining / perMinute) : 0,
    exhausted: remaining <= 0,
  }
}

const snapshot = (state) => clone({
  models: state.models.map(({ name, pinned }) => ({ name, pinned })),
  usageEvents: state.usageEvents,
  alertConfig: state.alertConfig,
  sessionBudget: state.sessionBudget,
})

/* Undo/redo restore the usage stream, budget, and alert config wholesale,
   but pins merge onto the *current* catalog so a refresh-removed model is
   never resurrected by an old history entry. */
const applySnapshot = (state, snap) => {
  const pinnedByName = new Map(snap.models.map((entry) => [entry.name, entry.pinned]))
  return {
    models: state.models.map((model) => (pinnedByName.has(model.name) ? { ...model, pinned: pinnedByName.get(model.name) } : model)),
    usageEvents: clone(snap.usageEvents),
    alertConfig: clone(snap.alertConfig),
    sessionBudget: snap.sessionBudget,
  }
}

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

const removalNames = ['GPT-4o Mini', 'Codestral', 'Nova Lite', 'Command R+', 'Jamba 1.5 Large']
const flipCandidates = ['Grok 3 Mini', 'DeepSeek V3', 'Gemma 3 27B', 'Claude 3.5 Haiku', 'Nova Pro', 'Mistral Large 2', 'Qwen2.5 Coder']

const seedSnapshot = {
  pinnedModels: seedModels.filter((model) => model.pinned).map((model) => model.name),
  eventCount: seedUsageEvents.length,
  modelCount: seedModels.length,
  sessionBudget: DEFAULT_BUDGET,
  alertConfig: { alerts_enabled: false, min_context_window: 0 },
}

export { seedSnapshot }

function makeFreeToast(name) {
  return { id: `toast-${++toastSequence}`, message: `${name} just became free`, kind: 'success', leaving: false }
}

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
  sessionBudget: DEFAULT_BUDGET,
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
  exportStamp: new Date().toISOString(),
  importFocusToken: 0,
  commandQuery: '',
  highlightedModel: null,
  navTarget: null,
  toasts: [],
  liveMessage: '',
  recentModels: [],

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

  touchRecent: (name) => set((state) => ({ recentModels: [name, ...state.recentModels.filter((item) => item !== name)].slice(0, 4) })),

  togglePin: (name) => historyMutation(set, get, (state) => {
    const target = state.models.find((item) => item.name === name)
    if (!target || target.lifecycle === 'departing' || target.lifecycle === 'collapsing') return null
    return {
      models: state.models.map((item) => item.name === name ? { ...item, pinned: !item.pinned } : item),
      liveMessage: `${name} ${target.pinned ? 'removed from' : 'added to'} the pinned watchlist`,
    }
  }),
  setCompareSelected: (names) => set({ compareSelected: names }),
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
  setLegendVisible: (name, visible) => set((state) => {
    const hidden = state.hiddenChartModels.includes(name)
    if (visible && hidden) return { hiddenChartModels: state.hiddenChartModels.filter((item) => item !== name) }
    if (!visible && !hidden) return { hiddenChartModels: [...state.hiddenChartModels, name] }
    return null
  }),
  toggleDisclosure: (name) => set((state) => ({ disclosureOpen: { ...state.disclosureOpen, [name]: !state.disclosureOpen[name] } })),
  setDisclosureOpen: (name, open) => set((state) => ({ disclosureOpen: { ...state.disclosureOpen, [name]: Boolean(open) } })),
  highlightCatalogModel: (name) => {
    get().touchRecent(name)
    set({ highlightedModel: name, navTarget: { destination: 'model-catalog', token: Date.now() }, mobileCostsOpen: false })
  },
  clearHighlight: () => set({ highlightedModel: null }),

  saveAlertConfig: (config) => historyMutation(set, get, () => ({
    alertConfig: { alerts_enabled: Boolean(config.alerts_enabled), min_context_window: Number(config.min_context_window) },
    alertOpen: false,
    liveMessage: 'Free-model alert settings saved',
  })),
  saveBudget: (value) => historyMutation(set, get, () => ({
    sessionBudget: Number(value),
    liveMessage: `Session budget ceiling set to $${Number(value).toFixed(2)}`,
  })),
  addManualUsage: (form, cost) => historyMutation(set, get, (state) => {
    const entry = {
      id: `manual-${++eventSequence}`,
      timestamp: new Date().toISOString(),
      model: form.model,
      request_label: String(form.request_label).trim(),
      prompt_tokens: Number(form.prompt_tokens),
      completion_tokens: Number(form.completion_tokens),
      cost: Number(cost),
      source: 'manual',
    }
    return {
      usageEvents: [entry, ...state.usageEvents],
      logOpen: false,
      recentModels: [entry.model, ...state.recentModels.filter((item) => item !== entry.model)].slice(0, 4),
      liveMessage: `Usage event “${entry.request_label}” logged for ${entry.model}`,
    }
  }),

  undo: () => {
    const state = get()
    if (!state.undoStack.length) return
    const entry = state.undoStack[state.undoStack.length - 1]
    set({ ...applySnapshot(state, entry.before), undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, entry], liveMessage: 'Last edit undone' })
  },
  redo: () => {
    const state = get()
    if (!state.redoStack.length) return
    const entry = state.redoStack[state.redoStack.length - 1]
    set({ ...applySnapshot(state, entry.after), undoStack: [...state.undoStack, entry], redoStack: state.redoStack.slice(0, -1), liveMessage: 'Edit restored' })
  },

  setSimulationRunning: (running) => set({ simulationRunning: Boolean(running), liveMessage: running ? 'Usage simulation started' : 'Usage simulation paused' }),
  addSimulatedUsage: () => set((state) => {
    if (!state.simulationRunning) return state
    const eligible = state.models.filter((item) => item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing')
    if (!eligible.length) return state
    const counter = state.simulationCounter
    const selected = eligible[counter % eligible.length]
    const prompt = 24_000 + ((counter * 4377) % 26_000)
    const completion = 2_800 + ((counter * 931) % 6_200)
    const cost = calculateCost(selected, prompt, completion)
    const entry = {
      id: `sim-${++eventSequence}`,
      timestamp: new Date().toISOString(),
      model: selected.name,
      request_label: ['Live route probe', 'Latency sample', 'Fallback check', 'Quality evaluation', 'Cost regression pass'][counter % 5],
      prompt_tokens: prompt,
      completion_tokens: completion,
      cost,
      source: 'simulation',
    }
    /* Every fifth simulated request re-prices a paid model to free, so the
       alert flow is reachable from the simulation as well as from refresh. */
    let models = state.models
    let toast = null
    if (counter % 5 === 4) {
      const flipName = flipCandidates[counter % flipCandidates.length]
      const candidate = models.find((item) => item.name === flipName && item.pricing_tier === 'paid' && item.lifecycle !== 'departing')
      if (candidate) {
        models = models.map((item) => (item.name === flipName ? { ...item, pricing_tier: 'free', input_cost_per_1k: 0, output_cost_per_1k: 0 } : item))
        if (state.alertConfig.alerts_enabled && candidate.context_window >= state.alertConfig.min_context_window) {
          toast = makeFreeToast(flipName)
        }
      }
    }
    return {
      models,
      usageEvents: [entry, ...state.usageEvents],
      simulationCounter: counter + 1,
      toasts: toast ? [...state.toasts, toast] : state.toasts,
      liveMessage: toast ? toast.message : `New usage event for ${entry.model}`,
    }
  }),

  triggerRefresh: () => {
    const initial = get()
    if (initial.refreshLoading) return false
    const nextIndex = initial.refreshIndex + 1
    set({ refreshLoading: true, refreshIndex: nextIndex, liveMessage: 'Discovering marketplace models…' })
    window.setTimeout(() => {
      const state = get()
      const addition = { ...refreshAdditions[(nextIndex - 1) % refreshAdditions.length], lifecycle: 'new' }
      const removalName = removalNames[(nextIndex - 1) % removalNames.length]
      const flipName = flipCandidates[(nextIndex - 1) % flipCandidates.length]
      let becameFree = null
      let models = state.models.map((item) => {
        if (item.name === removalName && item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing') {
          return { ...item, pinned: false, lifecycle: 'departing' }
        }
        if (item.name === flipName && item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing') {
          if (item.pricing_tier === 'paid') {
            becameFree = { ...item, pricing_tier: 'free', input_cost_per_1k: 0, output_cost_per_1k: 0 }
            return becameFree
          }
          return { ...item, pricing_tier: 'paid', input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0008 }
        }
        return item
      })
      if (!models.some((item) => item.name === addition.name)) models = [addition, ...models]
      const removalActive = models.some((item) => item.name === removalName && item.lifecycle === 'departing')
      const compareSelected = state.compareSelected.filter((name) => name !== removalName || !removalActive)
      const qualifies = becameFree && state.alertConfig.alerts_enabled && becameFree.context_window >= state.alertConfig.min_context_window
      const toast = qualifies ? makeFreeToast(becameFree.name) : null
      set({
        models,
        compareSelected,
        compareOpen: compareSelected.length >= 2 ? state.compareOpen : false,
        refreshLoading: false,
        toasts: toast ? [...state.toasts, toast] : state.toasts,
        liveMessage: toast ? toast.message : `Catalog refreshed — ${addition.name} discovered`,
      })
      window.setTimeout(() => set((current) => ({
        models: current.models.map((item) => (item.name === addition.name && item.lifecycle === 'new' ? { ...item, lifecycle: 'stable' } : item)),
      })), 2500)
      /* Departing rows hold their strikethrough fade, then collapse out. */
      window.setTimeout(() => set((current) => ({
        models: current.models.map((item) => (item.name === removalName && item.lifecycle === 'departing' ? { ...item, lifecycle: 'collapsing' } : item)),
      })), 4_300)
      window.setTimeout(() => set((current) => ({
        models: current.models.filter((item) => !(item.name === removalName && (item.lifecycle === 'departing' || item.lifecycle === 'collapsing'))),
        compareSelected: current.compareSelected.filter((name) => name !== removalName),
        hiddenChartModels: current.hiddenChartModels.filter((name) => name !== removalName),
      })), 5_000)
    }, 700)
    return true
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.map((item) => (item.id === id ? { ...item, leaving: true } : item)) }))
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })), 480)
  },
  setOverlay: (name, open) => set((state) => (name === 'exportOpen' && open
    ? { [name]: open, exportStamp: new Date().toISOString() }
    : { [name]: open })),
  setExportTab: (exportTab) => set({ exportTab }),
  setCommandQuery: (commandQuery) => set({ commandQuery }),
  setLiveMessage: (liveMessage) => set({ liveMessage }),
  navigateDestination: (destination) => {
    const patch = { commandOpen: false, commandQuery: '', navTarget: { destination, token: Date.now() } }
    if (destination === 'alert-settings-modal') patch.alertOpen = true
    if (destination === 'comparison-modal' && get().compareSelected.length >= 2) patch.compareOpen = true
    if (destination === 'log-usage-modal') patch.logOpen = true
    if (destination === 'export-panel') { patch.exportOpen = true; patch.exportStamp = new Date().toISOString() }
    if (destination === 'command-palette') patch.commandOpen = true
    if (destination === 'cost-sidebar') patch.mobileCostsOpen = window.innerWidth <= 900
    set(patch)
  },
  focusImport: () => set((state) => ({ importFocusToken: state.importFocusToken + 1 })),
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
      alertConfig: { ...report.alert_config },
      sessionBudget: report.session_budget_usd,
      compareSelected: report.compare_selected.filter((name) => validNames.has(name)),
      hiddenChartModels: [],
      undoStack: [],
      redoStack: [],
      exportStamp: new Date().toISOString(),
      liveMessage: 'Session JSON imported — session state replaced',
    })
    return { ok: true }
  },
}))
