import { agentByNameOrId, getRollup, STATUSES, useFleetStore } from './store'
import { createAgentSchema } from './schemas'

const stringEnum = (values, description) => ({ type: 'string', enum: values, description })
const agentRef = { type: 'string', minLength: 1, maxLength: 80, description: 'Exact agent id or name' }
const timelineKinds = ['all', 'status', 'run', 'step', 'retry', 'checkpoint', 'error', 'manual']

const tools = [
  {
    name: 'browse_open',
    description: 'Open a bounded fleet console destination using the same navigation state as the visible UI.',
    inputSchema: { type: 'object', properties: { destination: stringEnum(['agent-registry', 'detail-configuration', 'detail-history', 'detail-activity', 'export-fleet'], 'Declared destination'), agent: agentRef }, required: ['destination'], additionalProperties: false },
  },
  {
    name: 'browse_search',
    description: 'Open the command palette and visibly search the current agent collection by name.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 40 } }, required: ['query'], additionalProperties: false },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply the declared status filter to the visible agent registry.',
    inputSchema: { type: 'object', properties: { filter: stringEnum(['status', 'timeline-status-kind']), values: { type: 'array', uniqueItems: true, minItems: 1, items: stringEnum([...new Set([...STATUSES, ...timelineKinds])]) } }, required: ['filter', 'values'], additionalProperties: false },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear the status or timeline-status-kind filter through the same visible state handler.',
    inputSchema: { type: 'object', properties: { filter: stringEnum(['status', 'timeline-status-kind']) }, required: ['filter'], additionalProperties: false },
  },
  {
    name: 'entity_create',
    description: 'Create one agent from the bounded fleet API payload contract.',
    inputSchema: { type: 'object', properties: { name: { type: 'string', minLength: 2, maxLength: 40 }, agentType: stringEnum(['aster', 'boreal', 'cinder']), editorIntegration: stringEnum(['codedeck', 'nimbus', 'quill', 'vector', 'none']), accessKey: { type: 'string', minLength: 16, maxLength: 64, pattern: '^[A-Za-z0-9_-]+$' } }, required: ['name', 'agentType', 'editorIntegration', 'accessKey'], additionalProperties: false },
  },
  {
    name: 'entity_select',
    description: 'Select an agent and open its visible detail panel.',
    inputSchema: { type: 'object', properties: { entity: { const: 'agent' }, agent: agentRef }, required: ['entity', 'agent'], additionalProperties: false },
  },
  {
    name: 'entity_update',
    description: 'Update an agent configuration using the same validated command as the edit modal.',
    inputSchema: { type: 'object', properties: { agent: agentRef, name: { type: 'string', minLength: 2, maxLength: 40 }, agentType: stringEnum(['aster', 'boreal', 'cinder']), editorIntegration: stringEnum(['codedeck', 'nimbus', 'quill', 'vector', 'none']), accessKey: { type: 'string', minLength: 16, maxLength: 64, pattern: '^[A-Za-z0-9_-]+$' } }, required: ['agent', 'name', 'agentType', 'editorIntegration', 'accessKey'], additionalProperties: false },
  },
  {
    name: 'entity_delete',
    description: 'Delete one declared agent. Explicit confirm=true is required.',
    inputSchema: { type: 'object', properties: { agent: agentRef, confirm: { const: true } }, required: ['agent', 'confirm'], additionalProperties: false },
  },
  {
    name: 'entity_toggle',
    description: 'Toggle the bounded summary-expanded field for one visible agent row.',
    inputSchema: { type: 'object', properties: { agent: agentRef, field: { const: 'summary-expanded' }, value: { type: 'boolean' } }, required: ['agent', 'field', 'value'], additionalProperties: false },
  },
  ...['start', 'pause', 'resume', 'restart'].map((operation) => ({
    name: `session_${operation}`,
    description: `${operation.slice(0, 1).toUpperCase()}${operation.slice(1)} a bounded agent work-run session through the same domain command as the UI.`,
    inputSchema: { type: 'object', properties: { agent: agentRef, ...(operation === 'start' ? { demo: stringEnum(['work-run', 'seeded-failure-retry-scenario']) } : {}) }, required: ['agent'], additionalProperties: false },
  })),
  {
    name: 'artifact_export',
    description: 'Open the visible live fleet-json export preview; artifact contents are not returned.',
    inputSchema: { type: 'object', properties: { format: { const: 'fleet-json' } }, required: ['format'], additionalProperties: false },
  },
  {
    name: 'artifact_import',
    description: 'Open the visible fleet-snapshot paste surface; raw artifact contents are not accepted.',
    inputSchema: { type: 'object', properties: { mode: { const: 'fleet-snapshot' } }, required: ['mode'], additionalProperties: false },
  },
  {
    name: 'artifact_copy',
    description: 'Copy the current visible fleet preview through the same UI handler; clipboard contents are not returned.',
    inputSchema: { type: 'object', properties: { artifact: { const: 'fleet-json' } }, required: ['artifact'], additionalProperties: false },
  },
]

function visibleState(extra = {}) {
  const state = useFleetStore.getState()
  return { ok: true, rollup: getRollup(state.agents), detailAgent: state.agents.find((agent) => agent.id === state.detailAgentId)?.name || null, ...extra }
}

function requireAgent(reference) {
  const agent = agentByNameOrId(reference)
  if (!agent) throw new Error(`Unknown agent: ${reference}`)
  return agent
}

async function invoke(name, args) {
  const state = useFleetStore.getState()
  if (name === 'browse_open') {
    if (args.destination === 'agent-registry') state.closeDetail()
    else if (args.destination === 'export-fleet') state.openExport()
    else {
      const agent = requireAgent(args.agent)
      const tabs = { 'detail-configuration': 0, 'detail-history': 1, 'detail-activity': 2 }
      state.selectAgent(agent.id, tabs[args.destination])
    }
    return visibleState({ destination: args.destination })
  }
  if (name === 'browse_search') {
    state.openPalette()
    useFleetStore.getState().setPaletteQuery(String(args.query || '').slice(0, 40))
    const matches = useFleetStore.getState().agents.filter((agent) => agent.name.toLocaleLowerCase().includes(String(args.query).toLocaleLowerCase())).map((agent) => agent.name)
    return visibleState({ paletteOpen: true, matches })
  }
  if (name === 'browse_apply_filter') {
    if (!Array.isArray(args.values)) throw new Error('Filter values must be an array')
    if (args.filter === 'status') {
      if (args.values.some((value) => !STATUSES.includes(value))) throw new Error('Status filter contains an undeclared value')
      state.setFilters([...new Set(args.values)])
    } else if (args.filter === 'timeline-status-kind') {
      if (args.values.length !== 1 || !timelineKinds.includes(args.values[0])) throw new Error('Timeline status kind must be one declared value')
      state.setTimelineFilter(args.values[0])
    } else throw new Error('Unknown declared filter')
    return visibleState({ activeFilter: args.values })
  }
  if (name === 'browse_clear_filter') {
    if (args.filter === 'status') state.clearFilters()
    else if (args.filter === 'timeline-status-kind') state.setTimelineFilter('all')
    else throw new Error('Unknown declared filter')
    return visibleState({ activeFilter: [] })
  }
  if (name === 'entity_create') {
    const parsed = createAgentSchema.safeParse(args)
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const result = state.registerAgent(parsed.data)
    if (!result.ok) throw new Error(result.error)
    return visibleState({ created: result.agent.name })
  }
  if (name === 'entity_select') {
    const agent = requireAgent(args.agent)
    state.selectAgent(agent.id)
    return visibleState({ selected: agent.name })
  }
  if (name === 'entity_update') {
    const agent = requireAgent(args.agent)
    const payload = { name: args.name, agentType: args.agentType, editorIntegration: args.editorIntegration, accessKey: args.accessKey }
    const result = state.updateAgent(agent.id, payload)
    if (!result.ok) throw new Error(result.error)
    return visibleState({ updated: payload.name })
  }
  if (name === 'entity_delete') {
    if (args.confirm !== true) throw new Error('Delete requires confirm=true')
    const agent = requireAgent(args.agent)
    state.removeAgent(agent.id)
    return visibleState({ deleted: agent.name })
  }
  if (name === 'entity_toggle') {
    const agent = requireAgent(args.agent)
    if (args.field !== 'summary-expanded' || typeof args.value !== 'boolean') throw new Error('Only the declared summary-expanded boolean field can be toggled')
    state.toggleSummary(agent.id, args.value)
    return visibleState({ agent: agent.name, summaryExpanded: args.value })
  }
  if (name.startsWith('session_')) {
    const operation = name.slice('session_'.length)
    const agent = requireAgent(args.agent)
    let changed = false
    if (operation === 'start') changed = state.startRun(agent.id, args.demo === 'seeded-failure-retry-scenario')
    else if (operation === 'pause') changed = state.pauseAgent(agent.id)
    else if (operation === 'resume') changed = state.resumeAgent(agent.id)
    else if (operation === 'restart') changed = agent.run?.steps.some((step) => step.status === 'failed') ? state.manualRetryStep(agent.id) : agent.status === 'error' ? (state.retryAgent(agent.id), true) : false
    else throw new Error('Unknown session operation')
    return visibleState({ agent: agent.name, changed, status: useFleetStore.getState().agents.find((item) => item.id === agent.id)?.status })
  }
  if (name === 'artifact_export') {
    state.openExport()
    return visibleState({ surface: 'export-fleet', format: 'fleet-json' })
  }
  if (name === 'artifact_import') {
    state.openImport()
    return visibleState({ surface: 'import-fleet', mode: 'fleet-snapshot' })
  }
  if (name === 'artifact_copy') {
    if (!state.exportOpen) state.openExport()
    const copied = await useFleetStore.getState().copyExport()
    return visibleState({ surface: 'export-fleet', copied })
  }
  throw new Error(`Unknown WebMCP tool: ${name}`)
}

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((tool) => tool.name),
  })
  window.webmcp_list_tools = () => ({ tools })
  window.webmcp_invoke_tool = (name, args = {}) => invoke(name, args)
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  }
}
