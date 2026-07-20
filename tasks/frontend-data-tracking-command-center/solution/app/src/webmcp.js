import { agentInputSchema, nightScheduleSchema, useCommandStore } from './store.js'

const result = (message, data = {}) => ({
  content: [{ type: 'text', text: message }],
  structuredContent: { message, ...data },
})

const normalizeAgentForm = (values = {}) => ({
  name: values['agent-name'] ?? values.name ?? '',
  model: values.model ?? '',
  description: values.description ?? '',
})

const normalizeNightForm = (values = {}) => ({
  enable: values['night-enable'] ?? values.enable ?? false,
  startTime: values['night-start-time'] ?? values.startTime ?? '',
  endTime: values['night-end-time'] ?? values.endTime ?? '',
})

const resolveAgent = ({ id, name } = {}) => {
  const agents = useCommandStore.getState().agents
  const byId = id ? agents.find((agent) => agent.id === id) : undefined
  const byName = name ? agents.find((agent) => agent.name === name) : undefined
  if (id && name) return byId && byName && byId.id === byName.id ? byId : undefined
  return byId || byName
}

const handlers = {
  browse_open: ({ destination }) => {
    const destinations = ['dashboard', 'total-prompts-detail', 'active-agents-detail', 'evaluations-run-detail', 'cost-this-month-detail', 'export-drawer']
    if (!destinations.includes(destination)) return result('Destination is not allowed.', { ok: false })
    if (destination === 'export-drawer') useCommandStore.getState().setExportOpen(true)
    else useCommandStore.getState().setView(destination)
    return result(`Opened ${destination}.`, { ok: true, destination })
  },
  browse_search: ({ query = '' }) => {
    const bounded = String(query).slice(0, 100)
    useCommandStore.getState().setFeedSearch(bounded)
    useCommandStore.getState().setView('dashboard')
    return result('Activity event search applied.', { ok: true, query: bounded })
  },
  browse_apply_filter: ({ filter, value }) => {
    if (filter !== 'event-type' || !['prompt', 'evaluation', 'agent', 'error'].includes(value)) return result('Filter value is not allowed.', { ok: false })
    const state = useCommandStore.getState()
    state.setFilters([...state.feedFilters.filter((item) => item !== value), value])
    return result(`Activity filter ${value} applied to the visible feed.`, { ok: true, feedFilters: useCommandStore.getState().feedFilters })
  },
  browse_clear_filter: () => {
    useCommandStore.getState().clearFilters()
    return result('Activity filters cleared.', { ok: true })
  },
  browse_sort: () => result('No sort binding is declared for this dashboard.', { ok: false, unavailable: true }),
  browse_set_locale: () => result('No locale binding is declared for this dashboard.', { ok: false, unavailable: true }),
  browse_set_theme: ({ theme }) => {
    const ok = useCommandStore.getState().setThemeFromBrowse(theme)
    return result(ok ? `Theme set to ${theme} in the visible app.` : 'Theme is not allowed.', { ok, theme: useCommandStore.getState().theme })
  },
  entity_create: (input) => {
    const parsed = agentInputSchema.safeParse(input)
    if (!parsed.success) return result(parsed.error.issues[0]?.message || 'Agent is invalid.', { ok: false })
    const outcome = useCommandStore.getState().connectAgent(parsed.data)
    const agent = outcome.ok ? useCommandStore.getState().agents.find((item) => item.id === outcome.id) : null
    return result(outcome.ok ? `Agent ${parsed.data.name} created and visible in the agent panel.` : outcome.error, { ...outcome, agent })
  },
  entity_select: ({ id, name, selected = true }) => {
    const agent = resolveAgent({ id, name })
    if (!agent) return result('Agent was not found.', { ok: false })
    useCommandStore.getState().toggleSelected(agent.id, Boolean(selected))
    return result('Agent selection updated in the visible panel.', { ok: true, id: agent.id, name: agent.name, selected: Boolean(selected) })
  },
  entity_update: ({ id, name, field, value }) => {
    const agent = resolveAgent({ id, name })
    if (!agent) return result('Agent was not found.', { ok: false })
    const outcome = useCommandStore.getState().updateAgent(agent.id, field, value)
    const updated = useCommandStore.getState().agents.find((item) => item.id === agent.id)
    return result(outcome.ok ? 'Agent updated in the visible panel.' : outcome.error, { ...outcome, agent: updated })
  },
  entity_delete: ({ id, name, confirm }) => {
    if (confirm !== true) return result('Agent deletion requires confirm=true.', { ok: false })
    const agent = resolveAgent({ id, name })
    if (!agent) return result('Agent was not found.', { ok: false })
    const ok = useCommandStore.getState().disconnectAgent(agent.id)
    return result(ok ? 'Agent disconnected from the visible panel.' : 'Agent was not found.', { ok, id: agent.id, name: agent.name })
  },
  form_validate: ({ form, values = {} }) => {
    const schema = form === 'agent' ? agentInputSchema : form === 'night-schedule' ? nightScheduleSchema : null
    if (!schema) return result('Form is not declared.', { ok: false })
    const parsed = schema.safeParse(form === 'agent' ? normalizeAgentForm(values) : normalizeNightForm(values))
    return result(parsed.success ? 'Form is valid.' : parsed.error.issues[0]?.message || 'Form is invalid.', { ok: parsed.success })
  },
  form_submit: ({ form, values = {} }) => {
    if (form === 'agent') {
      const outcome = useCommandStore.getState().connectAgent(normalizeAgentForm(values))
      return result(outcome.ok ? 'Agent form submitted.' : outcome.error, outcome)
    }
    if (form === 'night-schedule') {
      const outcome = useCommandStore.getState().saveNightSchedule(normalizeNightForm(values))
      return result(outcome.ok ? 'Night schedule form submitted.' : outcome.error, outcome)
    }
    return result('Form is not declared.', { ok: false })
  },
  form_cancel: ({ form }) => {
    if (form === 'agent') useCommandStore.getState().setConnectOpen(false)
    else if (form === 'night-schedule') useCommandStore.getState().setNightOpen(false)
    else return result('Form is not declared.', { ok: false })
    return result('Form cancelled.', { ok: true })
  },
  artifact_export: ({ format }) => {
    if (!['json', 'csv'].includes(format)) return result('Export format is not allowed.', { ok: false })
    const state = useCommandStore.getState()
    state.setExportFormat(format)
    state.setExportOpen(true)
    return result(`Export drawer opened for ${format}.`, { ok: true, format })
  },
  artifact_import: ({ mode }) => {
    if (mode !== 'session-json') return result('Import mode is not allowed.', { ok: false })
    useCommandStore.getState().setExportOpen(true)
    return result('Import form opened. Paste Session JSON using the visible form.', { ok: true, mode })
  },
  artifact_copy: ({ format }) => {
    if (!['json', 'csv'].includes(format)) return result('Copy format is not allowed.', { ok: false })
    const state = useCommandStore.getState()
    state.setExportFormat(format)
    state.setExportOpen(true)
    return result('Export preview opened. Clipboard interaction remains with the visible Copy control.', { ok: true, format })
  },
}

const schemas = {
  browse_open: { type: 'object', properties: { destination: { type: 'string', enum: ['dashboard', 'total-prompts-detail', 'active-agents-detail', 'evaluations-run-detail', 'cost-this-month-detail', 'export-drawer'] } }, required: ['destination'], additionalProperties: false },
  browse_search: { type: 'object', properties: { query: { type: 'string', maxLength: 100 } }, required: ['query'], additionalProperties: false },
  browse_apply_filter: { type: 'object', properties: { filter: { const: 'event-type' }, value: { type: 'string', enum: ['prompt', 'evaluation', 'agent', 'error'] } }, required: ['filter', 'value'], additionalProperties: false },
  browse_clear_filter: { type: 'object', properties: {}, additionalProperties: false },
  browse_sort: { type: 'object', properties: {}, additionalProperties: false },
  browse_set_locale: { type: 'object', properties: {}, additionalProperties: false },
  browse_set_theme: { type: 'object', properties: { theme: { type: 'string', enum: ['light', 'night'] } }, required: ['theme'], additionalProperties: false },
  entity_create: { type: 'object', properties: { name: { type: 'string', minLength: 1, maxLength: 80 }, model: { type: 'string', enum: ['gpt-4.1', 'claude-sonnet-4', 'o3-mini', 'gemini-2.5-pro'] }, description: { type: 'string', maxLength: 280 } }, required: ['name', 'model'], additionalProperties: false },
  entity_select: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string', minLength: 1, maxLength: 80 }, selected: { type: 'boolean' } }, anyOf: [{ required: ['id'] }, { required: ['name'] }], additionalProperties: false },
  entity_update: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string', minLength: 1, maxLength: 80 }, field: { type: 'string', enum: ['name', 'model', 'description', 'state'] }, value: { type: 'string', maxLength: 280 } }, required: ['field', 'value'], anyOf: [{ required: ['id'] }, { required: ['name'] }], additionalProperties: false },
  entity_delete: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string', minLength: 1, maxLength: 80 }, confirm: { const: true } }, required: ['confirm'], anyOf: [{ required: ['id'] }, { required: ['name'] }], additionalProperties: false },
  form_validate: { type: 'object', properties: { form: { type: 'string', enum: ['agent', 'night-schedule'] }, values: { type: 'object' } }, required: ['form', 'values'], additionalProperties: false },
  form_submit: { type: 'object', properties: { form: { type: 'string', enum: ['agent', 'night-schedule'] }, values: { type: 'object' } }, required: ['form', 'values'], additionalProperties: false },
  form_cancel: { type: 'object', properties: { form: { type: 'string', enum: ['agent', 'night-schedule'] } }, required: ['form'], additionalProperties: false },
  artifact_export: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } }, required: ['format'], additionalProperties: false },
  artifact_import: { type: 'object', properties: { mode: { const: 'session-json' } }, required: ['mode'], additionalProperties: false },
  artifact_copy: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } }, required: ['format'], additionalProperties: false },
}

const definitions = Object.keys(handlers).map((name) => ({
  name,
  description: `${name.replaceAll('_', ' ')} for the PromptOps command center.`,
  inputSchema: schemas[name],
}))

let registered = false
export function registerWebMCPTools() {
  if (registered) return
  registered = true
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    app: 'PromptOps command center',
    modules: ['browse-query-v1', 'entity-collection-v1', 'form-workflow-v1', 'artifact-transfer-v1'],
    toolNames: definitions.map((definition) => definition.name),
    tools: definitions,
  })
  window.webmcp_list_tools = () => definitions
  window.webmcp_invoke_tool = async (name, args = {}) => {
    if (!handlers[name]) throw new Error(`Unknown WebMCP tool: ${name}`)
    return handlers[name](args)
  }

  const context = navigator.modelContext
  if (!context?.registerTool) return
  definitions.forEach((definition) => {
    const execute = (args) => handlers[definition.name](args || {})
    try {
      context.registerTool({ ...definition, execute })
    } catch {
      try { context.registerTool(definition, execute) } catch { /* compatibility bridge remains available */ }
    }
  })
}
