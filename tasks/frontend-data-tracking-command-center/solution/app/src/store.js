import { create } from 'zustand'
import { z } from 'zod'

export const MODELS = ['gpt-4.1', 'claude-sonnet-4', 'o3-mini', 'gemini-2.5-pro']
export const AGENT_STATES = ['idle', 'running', 'error']
export const KPI_KEYS = ['total-prompts', 'active-agents', 'evaluations-run', 'cost-this-month']

export const agentInputSchema = z.object({
  name: z.string().trim().min(1, 'name: Agent name is required and cannot be whitespace only.').max(80, 'name: Agent name must be 80 characters or fewer.'),
  model: z.enum(MODELS, { error: 'Model is required and must be one of the four allowed models.' }),
  description: z.string().max(280, 'description: Description must be 280 characters or fewer.').default(''),
}).strict()

export const renameSchema = z.object({
  name: z.string().trim().min(1, 'name: Agent name is required and cannot be whitespace only.').max(80, 'name: Agent name must be 80 characters or fewer.'),
}).strict()

const timeField = (label) => z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} is required in 24-hour HH:MM format.`)

export const nightScheduleSchema = z.object({
  enable: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
}).strict().superRefine((value, ctx) => {
  if (!value.enable) return
  const start = timeField('Start time').safeParse(value.startTime)
  const end = timeField('End time').safeParse(value.endTime)
  if (!start.success) ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Start time is required in 24-hour HH:MM format.' })
  if (!end.success) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time is required in 24-hour HH:MM format.' })
})

const exportedAgentSchema = z.object({
  name: z.string().trim().min(1, 'Agent name is required.').max(80, 'name: Agent name must be 80 characters or fewer.'),
  model: z.enum(MODELS),
  description: z.string().max(280, 'Agent description must be 280 characters or fewer.'),
  state: z.enum(AGENT_STATES),
  'last-active': z.string().datetime({ message: 'Agent last-active must be an ISO timestamp.' }),
}).strict()

const eventSchema = z.object({
  type: z.enum(['prompt', 'evaluation', 'agent']),
  description: z.string().min(1),
  status: z.enum(['info', 'success', 'error']),
  timestamp: z.string().datetime({ message: 'Event timestamp must be an ISO timestamp.' }),
  relatedName: z.string().optional(),
  metricKey: z.enum(KPI_KEYS).optional(),
}).strict()

const kpiSchema = z.object({
  key: z.enum(KPI_KEYS),
  label: z.string(),
  current: z.number(),
  trend: z.number(),
  series: z.array(z.object({ label: z.string(), value: z.number() }).strict()).min(7),
}).strict()

export const sessionSchema = z.object({
  agents: z.array(exportedAgentSchema),
  events: z.array(eventSchema).max(50),
  kpis: z.array(kpiSchema).length(4),
  nightSchedule: z.object({
    enable: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }).strict().superRefine((value, ctx) => {
    if (!value.enable) return
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.startTime)) ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Night schedule start time must use HH:MM.' })
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.endTime)) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Night schedule end time must use HH:MM.' })
  }),
  theme: z.enum(['light', 'night']),
  activeView: z.enum(['dashboard', 'total-prompts-detail', 'active-agents-detail', 'evaluations-run-detail', 'cost-this-month-detail']),
  feedFilters: z.array(z.enum(['prompt', 'evaluation', 'agent', 'error'])),
}).strict()

const now = Date.now()
let sequence = 100
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(sequence++).toString(36)}`
const isoAgo = (minutes) => new Date(now - minutes * 60_000).toISOString()
const makeSteps = (statuses = ['pending', 'pending', 'pending']) => [
  { id: 'analyze', name: 'Analyze repository context', status: statuses[0] },
  { id: 'draft', name: 'Draft prompt changes', status: statuses[1] },
  { id: 'verify', name: 'Verify evaluation results', status: statuses[2] },
]

const seedAgents = [
  { id: 'agent-nova', name: 'Nova Refactor', model: 'gpt-4.1', description: 'Modernizes React code and validates component boundaries.', state: 'running', lastActive: isoAgo(1), steps: makeSteps(['complete', 'running', 'pending']), expanded: true, selected: false, isNew: false },
  { id: 'agent-sentry', name: 'Sentry Reviewer', model: 'claude-sonnet-4', description: 'Reviews prompt changes for safety and regression risk.', state: 'idle', lastActive: isoAgo(7), steps: makeSteps(), expanded: false, selected: false, isNew: false },
  { id: 'agent-vector', name: 'Vector Evaluator', model: 'o3-mini', description: 'Runs fast rubric-based evaluation suites.', state: 'error', lastActive: isoAgo(18), steps: makeSteps(['complete', 'complete', 'pending']), expanded: false, selected: false, isNew: false },
  { id: 'agent-orbit', name: 'Orbit Context Mapper', model: 'gemini-2.5-pro', description: 'Maps large codebases into compact working context.', state: 'idle', lastActive: isoAgo(42), steps: makeSteps(), expanded: false, selected: false, isNew: false },
]

const seedEvents = [
  ['agent', 'Nova Refactor started a repository analysis run', 'info', 1, 'agent-nova', 'Nova Refactor'],
  ['evaluation', 'Safety rubric evaluation finished at 96.4%', 'success', 4, null, null, 'evaluations-run'],
  ['prompt', 'Customer-support system prompt was created', 'success', 7, null, null, 'total-prompts'],
  ['agent', 'Vector Evaluator encountered a context window error', 'error', 18, 'agent-vector', 'Vector Evaluator'],
  ['evaluation', 'Hallucination benchmark finished with 42 cases', 'success', 27, null, null, 'evaluations-run'],
  ['agent', 'Sentry Reviewer completed a policy review', 'success', 39, 'agent-sentry', 'Sentry Reviewer'],
  ['prompt', 'Code migration prompt was revised', 'info', 51, null, null, 'total-prompts'],
  ['evaluation', 'Tool-use evaluation finished at 91.8%', 'success', 76, null, null, 'evaluations-run'],
  ['agent', 'Orbit Context Mapper connected to the workspace', 'info', 110, 'agent-orbit', 'Orbit Context Mapper'],
  ['prompt', 'Retrieval grounding prompt was created', 'success', 165, null, null, 'total-prompts'],
  ['evaluation', 'Monthly evaluation cost checkpoint completed', 'info', 228, null, null, 'cost-this-month'],
  ['agent', 'Nova Refactor completed step Analyze repository context', 'success', 310, 'agent-nova', 'Nova Refactor'],
  ['prompt', 'Incident response prompt was archived', 'info', 430, null, null, 'total-prompts'],
  ['evaluation', 'Agent handoff benchmark reported one error', 'error', 610, null, null, 'evaluations-run'],
].map(([type, description, status, minutes, resourceId, relatedName, metricKey], index) => ({
  id: `event-${index + 1}`,
  type, description, status, timestamp: isoAgo(minutes), resourceId, relatedName, metricKey, isNew: false,
}))

const seedKpis = [
  { key: 'total-prompts', label: 'Total prompts', current: 2486, trend: 12.4, format: 'number', series: [2012, 2098, 2160, 2218, 2304, 2389, 2486].map((value, i) => ({ label: `Jul ${14 + i}`, value })) },
  { key: 'active-agents', label: 'Active agents', current: 1, trend: -8.2, format: 'number', series: [3, 2, 4, 3, 2, 2, 1].map((value, i) => ({ label: `Jul ${14 + i}`, value })) },
  { key: 'evaluations-run', label: 'Evaluations run', current: 18432, trend: 18.7, format: 'number', series: [12950, 13820, 14610, 15120, 16390, 17540, 18432].map((value, i) => ({ label: `Jul ${14 + i}`, value })) },
  { key: 'cost-this-month', label: 'Cost this month', current: 4296, trend: -3.1, format: 'currency', series: [3640, 3780, 3860, 4010, 4175, 4380, 4296].map((value, i) => ({ label: `Jul ${14 + i}`, value })) },
]

const clone = (value) => JSON.parse(JSON.stringify(value))
const capture = (state) => clone({
  agents: state.agents,
  events: state.events,
  kpis: state.kpis,
  nightSchedule: state.nightSchedule,
  theme: state.theme,
  activeView: state.activeView,
  feedFilters: state.feedFilters,
})

const domainMutation = (set, label, recipe) => set((state) => ({
  ...recipe(state),
  undoStack: [...state.undoStack, capture(state)].slice(-30),
  redoStack: [],
  lastAction: label,
}))

const makeEvent = (data) => ({
  id: uid('event'),
  timestamp: new Date().toISOString(),
  isNew: true,
  ...data,
})

const appendEvent = (events, event) => [event, ...events.map((item) => ({ ...item, isNew: false }))].slice(0, 50)

const isTimeInside = ({ startTime, endTime }) => {
  const current = new Date()
  const minutes = current.getHours() * 60 + current.getMinutes()
  const toMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  return start <= end ? minutes >= start && minutes <= end : minutes >= start || minutes <= end
}

export const useCommandStore = create((set, get) => ({
  agents: seedAgents,
  events: seedEvents,
  kpis: seedKpis,
  activeView: 'dashboard',
  feedFilters: [],
  feedSearch: '',
  feedSort: 'newest',
  suggestion: null,
  autoFollow: true,
  theme: 'light',
  nightSchedule: { enable: false, startTime: '20:00', endTime: '06:00' },
  undoStack: [],
  redoStack: [],
  lastAction: 'Seeded session',
  connectOpen: false,
  exportOpen: false,
  exportFormat: 'json',
  paletteOpen: false,
  nightOpen: false,
  summaryOpen: false,
  shortcutsOpen: false,
  importError: '',
  announcement: '',
  density: 'comfortable',
  accent: 'blue',
  lastSimulateIndex: -1,

  setView: (activeView, options = {}) => {
    const allowed = ['dashboard', 'total-prompts-detail', 'active-agents-detail', 'evaluations-run-detail', 'cost-this-month-detail']
    if (!allowed.includes(activeView)) return false
    if (!options.fromHistory && typeof window !== 'undefined' && get().activeView !== activeView) {
      const url = activeView === 'dashboard' ? `${window.location.pathname}${window.location.search}` : `#${activeView}`
      window.history.pushState({ promptOpsView: activeView }, '', url)
    }
    set({ activeView })
    return true
  },
  setConnectOpen: (connectOpen) => set({ connectOpen }),
  setExportOpen: (exportOpen) => set({ exportOpen, importError: exportOpen ? get().importError : '' }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setNightOpen: (nightOpen) => set({ nightOpen }),
  setSummaryOpen: (summaryOpen) => set({ summaryOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setDensity: (density) => set({ density: density === 'compact' ? 'compact' : 'comfortable' }),
  setAccent: (accent) => set({ accent: ['blue', 'teal', 'violet'].includes(accent) ? accent : 'blue' }),
  announce: (announcement) => set({ announcement }),
  markArtifactAction: (lastAction, announcement) => set({ lastAction, announcement }),

  connectAgent: (input) => {
    const parsed = agentInputSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
    const payload = parsed.data
    const id = uid('agent')
    domainMutation(set, `Connected ${payload.name}`, (state) => ({
      agents: [...state.agents.map((agent) => ({ ...agent, isNew: false })), {
        id, ...payload, state: 'idle', lastActive: new Date().toISOString(), steps: makeSteps(), expanded: false, selected: false, isNew: true,
      }],
      events: appendEvent(state.events, makeEvent({ type: 'agent', description: `${payload.name} connected to the workspace`, status: 'success', resourceId: id, relatedName: payload.name })),
      connectOpen: false,
      announcement: `Agent ${payload.name} connected.`,
    }))
    return { ok: true, id }
  },

  renameAgent: (id, input) => {
    const parsed = renameSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
    const old = get().agents.find((agent) => agent.id === id)
    if (!old) return { ok: false, error: 'Agent was not found.' }
    const name = parsed.data.name
    domainMutation(set, `Renamed ${old.name}`, (state) => ({
      agents: state.agents.map((agent) => agent.id === id ? { ...agent, name, lastActive: new Date().toISOString() } : agent),
      events: appendEvent(state.events.map((event) => event.resourceId === id ? {
        ...event, description: event.description.replaceAll(old.name, name), relatedName: name,
      } : event), makeEvent({ type: 'agent', description: `${old.name} was renamed to ${name}`, status: 'info', resourceId: id, relatedName: name })),
      announcement: `Agent renamed to ${name}.`,
    }))
    return { ok: true }
  },

  updateAgent: (id, field, value) => {
    const allowed = ['name', 'model', 'description', 'state']
    if (!allowed.includes(field)) return { ok: false, error: 'Agent field is not allowed.' }
    const agent = get().agents.find((item) => item.id === id)
    if (!agent) return { ok: false, error: 'Agent was not found.' }
    const candidate = { name: agent.name, model: agent.model, description: agent.description, [field]: value }
    const inputResult = agentInputSchema.safeParse(candidate)
    if (!inputResult.success) return { ok: false, error: inputResult.error.issues[0]?.message }
    if (field === 'state' && !AGENT_STATES.includes(value)) return { ok: false, error: 'Agent state is not allowed.' }
    if (field === 'name') return get().renameAgent(id, { name: value })
    domainMutation(set, `Updated ${agent.name}`, (state) => ({
      agents: state.agents.map((item) => item.id === id ? { ...item, [field]: value, lastActive: new Date().toISOString() } : item),
      events: appendEvent(state.events, makeEvent({ type: 'agent', description: `${agent.name} ${field} was updated`, status: 'info', resourceId: id, relatedName: agent.name })),
    }))
    return { ok: true }
  },

  disconnectAgent: (id) => {
    const target = get().agents.find((agent) => agent.id === id)
    if (!target) return false
    domainMutation(set, `Disconnected ${target.name}`, (state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
      events: appendEvent(state.events, makeEvent({ type: 'agent', description: `${target.name} disconnected from the workspace`, status: 'info', relatedName: target.name })),
      announcement: `Agent ${target.name} disconnected.`,
    }))
    return true
  },

  bulkDisconnect: () => {
    const selected = get().agents.filter((agent) => agent.selected)
    if (!selected.length) return false
    domainMutation(set, `Disconnected ${selected.length} agents`, (state) => {
      const selectedIds = new Set(selected.map((agent) => agent.id))
      let events = state.events
      selected.forEach((agent) => {
        events = appendEvent(events, makeEvent({ type: 'agent', description: `${agent.name} disconnected from the workspace`, status: 'info', relatedName: agent.name }))
      })
      return { agents: state.agents.filter((agent) => !selectedIds.has(agent.id)), events, announcement: `${selected.length} agents disconnected.` }
    })
    return true
  },

  retryAgent: (id) => {
    const target = get().agents.find((agent) => agent.id === id)
    if (!target || target.state !== 'error') return false
    domainMutation(set, `Retried ${target.name}`, (state) => ({
      agents: state.agents.map((agent) => agent.id === id ? { ...agent, state: 'idle', lastActive: new Date().toISOString(), steps: makeSteps() } : agent),
      events: appendEvent(state.events, makeEvent({ type: 'agent', description: `${target.name} reset after retry`, status: 'success', resourceId: id, relatedName: target.name })),
      announcement: `${target.name} is idle and ready after retry.`,
    }))
    return true
  },

  runAgent: (id) => {
    const target = get().agents.find((agent) => agent.id === id)
    if (!target || target.state !== 'idle') return false
    domainMutation(set, `Started ${target.name}`, (state) => ({
      agents: state.agents.map((agent) => agent.id === id ? { ...agent, state: 'running', lastActive: new Date().toISOString(), steps: makeSteps(['running', 'pending', 'pending']) } : agent),
      events: appendEvent(state.events, makeEvent({ type: 'agent', description: `${target.name} started a new run`, status: 'info', resourceId: id, relatedName: target.name })),
      announcement: `Agent ${target.name} started and is now running.`,
    }))
    return true
  },

  toggleExpanded: (id, force) => set((state) => ({ agents: state.agents.map((agent) => agent.id === id ? { ...agent, expanded: typeof force === 'boolean' ? force : !agent.expanded } : agent) })),
  toggleSelected: (id, force) => set((state) => ({ agents: state.agents.map((agent) => agent.id === id ? { ...agent, selected: typeof force === 'boolean' ? force : !agent.selected } : agent) })),
  setAllSelected: (force) => set((state) => ({ agents: state.agents.map((agent) => ({ ...agent, selected: Boolean(force) })) })),
  clearSelection: () => set((state) => ({ agents: state.agents.map((agent) => ({ ...agent, selected: false })) })),

  openAgentFromEvent: (id, relatedName) => {
    get().setView('dashboard')
    set((state) => ({
      agents: state.agents.map((agent) => agent.id === id || (!id && agent.name === relatedName) ? { ...agent, expanded: true } : agent),
    }))
  },

  advanceAgentSteps: () => set((state) => ({
    agents: state.agents.map((agent) => {
      if (agent.state !== 'running') return agent
      const runningIndex = agent.steps.findIndex((step) => step.status === 'running')
      const pendingIndex = agent.steps.findIndex((step) => step.status === 'pending')
      if (runningIndex >= 0) {
        return { ...agent, lastActive: new Date().toISOString(), steps: agent.steps.map((step, index) => index === runningIndex ? { ...step, status: 'complete' } : index === runningIndex + 1 ? { ...step, status: 'running' } : step) }
      }
      if (pendingIndex >= 0) return { ...agent, steps: agent.steps.map((step, index) => index === pendingIndex ? { ...step, status: 'running' } : step) }
      return { ...agent, steps: makeSteps(['running', 'pending', 'pending']) }
    }),
  })),

  setFilters: (feedFilters, suggestion = null) => set({ feedFilters: [...new Set(feedFilters)], suggestion }),
  toggleFilter: (filter) => set((state) => ({ feedFilters: state.feedFilters.includes(filter) ? state.feedFilters.filter((item) => item !== filter) : [...state.feedFilters, filter], suggestion: null })),
  clearFilters: () => set({ feedFilters: [], feedSearch: '', suggestion: null }),
  setFeedSearch: (feedSearch) => set({ feedSearch }),
  setFeedSort: (feedSort) => set({ feedSort }),
  setAutoFollow: (autoFollow) => set({ autoFollow }),

  simulateActivity: () => {
    const state = get()
    const choices = [
      { type: 'prompt', description: 'New optimization prompt was created', status: 'success', metricKey: 'total-prompts' },
      { type: 'evaluation', description: 'Adversarial evaluation finished at 94.1%', status: 'success', metricKey: 'evaluations-run' },
      { type: 'evaluation', description: 'Latency evaluation exceeded its threshold', status: 'error', metricKey: 'evaluations-run' },
      { type: 'prompt', description: 'Retrieval grounding prompt was revised', status: 'info', metricKey: 'total-prompts' },
    ]
    const agent = state.agents[Math.floor(Math.random() * Math.max(state.agents.length, 1))]
    if (agent) choices.push({ type: 'agent', description: `${agent.name} reported a new status update`, status: agent.state === 'error' ? 'error' : 'info', resourceId: agent.id, relatedName: agent.name })
    let index = Math.floor(Math.random() * choices.length)
    if (choices.length > 1 && index === state.lastSimulateIndex % choices.length) index = (index + 1) % choices.length
    const event = makeEvent(choices[index])
    // Simulated activity is a new mutating action: it clears the redo stack,
    // matching the Undo/Redo contract for post-undo mutations.
    set((current) => ({ events: appendEvent(current.events, event), redoStack: [], lastSimulateIndex: index, announcement: 'A new activity event was added.' }))
    return event.id
  },

  saveNightSchedule: (input) => {
    const parsed = nightScheduleSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }
    const nightSchedule = parsed.data
    const theme = nightSchedule.enable && isTimeInside(nightSchedule) ? 'night' : 'light'
    domainMutation(set, 'Saved night schedule', (state) => ({
      nightSchedule, theme, nightOpen: false,
      events: appendEvent(state.events, makeEvent({ type: 'agent', description: nightSchedule.enable ? `Night mode scheduled from ${nightSchedule.startTime} to ${nightSchedule.endTime}` : 'Night mode schedule disabled', status: 'info' })),
      announcement: nightSchedule.enable ? 'Night mode schedule saved.' : 'Night mode disabled.',
    }))
    return { ok: true }
  },

  setThemeFromBrowse: (theme) => {
    if (!['light', 'night'].includes(theme)) return false
    const current = new Date()
    const hh = String(current.getHours()).padStart(2, '0')
    const mm = String(current.getMinutes()).padStart(2, '0')
    const schedule = theme === 'night' ? { enable: true, startTime: `${hh}:${mm}`, endTime: `${hh}:${mm}` } : { enable: false, startTime: get().nightSchedule.startTime, endTime: get().nightSchedule.endTime }
    domainMutation(set, `Set ${theme} theme`, () => ({
      theme,
      nightSchedule: schedule,
      nightOpen: false,
      announcement: theme === 'night' ? 'Night theme is active.' : 'Light theme is active and night mode is disabled.',
    }))
    return true
  },

  undo: () => set((state) => {
    if (!state.undoStack.length) return state
    const previous = state.undoStack[state.undoStack.length - 1]
    return { ...clone(previous), undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, capture(state)].slice(-30), lastAction: 'Undid last action', announcement: 'Last action undone.' }
  }),
  redo: () => set((state) => {
    if (!state.redoStack.length) return state
    const next = state.redoStack[state.redoStack.length - 1]
    return { ...clone(next), undoStack: [...state.undoStack, capture(state)].slice(-30), redoStack: state.redoStack.slice(0, -1), lastAction: 'Redid last action', announcement: 'Last action redone.' }
  }),

  importSession: (raw) => {
    let document
    try { document = JSON.parse(raw) } catch { set({ importError: 'Session JSON import field contains malformed JSON.' }); return { ok: false } }
    const parsed = sessionSchema.safeParse(document)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      set({ importError: `Session JSON import field ${issue.path.join('.')} — ${issue.message}` })
      return { ok: false }
    }
    const data = parsed.data
    const agents = data.agents.map((agent) => ({
      id: uid('agent'), name: agent.name.trim(), model: agent.model, description: agent.description, state: agent.state, lastActive: agent['last-active'], steps: makeSteps(agent.state === 'running' ? ['complete', 'running', 'pending'] : ['pending', 'pending', 'pending']), expanded: false, selected: false, isNew: false,
    }))
    const idByName = Object.fromEntries(agents.map((agent) => [agent.name, agent.id]))
    const events = data.events.map((event) => ({ ...event, id: uid('event'), resourceId: event.relatedName ? idByName[event.relatedName] : undefined, isNew: false }))
    domainMutation(set, 'Imported session', () => ({
      agents, events, kpis: data.kpis.map((kpi) => ({ ...kpi, format: kpi.key === 'cost-this-month' ? 'currency' : 'number' })), nightSchedule: data.nightSchedule, theme: data.theme, activeView: data.activeView, feedFilters: data.feedFilters, feedSearch: '', importError: '', announcement: 'Session JSON import completed.',
    }))
    return { ok: true }
  },
}))

export const getActiveAgentCount = (state) => state.agents.filter((agent) => agent.state === 'running').length

export const getLiveKpis = (state) => state.kpis.map((kpi) => kpi.key === 'active-agents' ? {
  ...kpi,
  current: getActiveAgentCount(state),
  series: kpi.series.map((point, index) => index === kpi.series.length - 1 ? { ...point, value: getActiveAgentCount(state) } : point),
} : kpi)

export const compileSessionObject = (state) => ({
  agents: state.agents.map((agent) => ({ name: agent.name, model: agent.model, description: agent.description, state: agent.state, 'last-active': agent.lastActive })),
  events: state.events.map((event) => ({ type: event.type, description: event.description, status: event.status, timestamp: event.timestamp, ...(event.relatedName ? { relatedName: event.relatedName } : {}), ...(event.metricKey ? { metricKey: event.metricKey } : {}) })),
  kpis: getLiveKpis(state).map(({ key, label, current, trend, series }) => ({ key, label, current, trend, series })),
  nightSchedule: state.nightSchedule,
  theme: state.theme,
  activeView: state.activeView,
  feedFilters: state.feedFilters,
})

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
export const compileAgentsCsv = (state) => [
  'name,model,description,state,last-active',
  ...state.agents.map((agent) => [agent.name, agent.model, agent.description, agent.state, agent.lastActive].map(csvCell).join(',')),
].join('\n')

export const compileSessionJson = (state) => JSON.stringify(compileSessionObject(state), null, 2)
