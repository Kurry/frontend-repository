import { calculateCost } from './data.js'
import { makeUsageFormSchema } from './schemas.js'
import { csvFromEvents, deriveRollups, reportFromState, useAppStore } from './store.js'

const destinations = ['model-catalog', 'cost-sidebar', 'event-feed', 'alert-settings-modal', 'comparison-modal', 'log-usage-modal', 'export-panel', 'command-palette']
const filters = ['provider', 'search', 'free', 'pinned']

const tools = [
  { name: 'browse_open', description: 'Open a declared Routewatch destination.', inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: destinations } }, required: ['destination'], additionalProperties: false } },
  { name: 'browse_search', description: 'Search models by model or provider name.', inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 80 } }, required: ['query'], additionalProperties: false } },
  { name: 'browse_apply_filter', description: 'Apply a provider, search, free, or pinned catalog filter.', inputSchema: { type: 'object', properties: { filter: { type: 'string', enum: filters }, value: { oneOf: [{ type: 'string', maxLength: 80 }, { type: 'boolean' }] } }, required: ['filter', 'value'], additionalProperties: false } },
  { name: 'browse_clear_filter', description: 'Clear one catalog filter.', inputSchema: { type: 'object', properties: { filter: { type: 'string', enum: filters } }, required: ['filter'], additionalProperties: false } },
  { name: 'browse_sort', description: 'Sort the catalog by a declared model attribute.', inputSchema: { type: 'object', properties: { sort: { type: 'string', enum: ['name', 'provider', 'context-window', 'input-cost'] } }, required: ['sort'], additionalProperties: false } },
  { name: 'entity_create', description: 'Create one manual model usage event.', inputSchema: { type: 'object', properties: { model: { type: 'string' }, request_label: { type: 'string', minLength: 1, maxLength: 80 }, prompt_tokens: { type: 'integer', minimum: 0 }, completion_tokens: { type: 'integer', minimum: 0 } }, required: ['model', 'request_label', 'prompt_tokens', 'completion_tokens'], additionalProperties: false } },
  { name: 'entity_select', description: 'Select or deselect a model for comparison.', inputSchema: { type: 'object', properties: { model: { type: 'string' }, selected: { type: 'boolean' } }, required: ['model', 'selected'], additionalProperties: false } },
  { name: 'entity_update', description: 'Update one bounded session field through the same domain command as the UI.', inputSchema: { type: 'object', properties: { field: { type: 'string', enum: ['alerts-enabled', 'min-context-window', 'session-budget-usd'] }, value: { oneOf: [{ type: 'boolean' }, { type: 'number' }] } }, required: ['field', 'value'], additionalProperties: false } },
  { name: 'entity_toggle', description: 'Toggle a model pin, chart legend, or contributing-events disclosure.', inputSchema: { type: 'object', properties: { field: { type: 'string', enum: ['pinned', 'legend-visible', 'events-disclosure-open'] }, model: { type: 'string' } }, required: ['field', 'model'], additionalProperties: false } },
  { name: 'session_start', description: 'Start the usage simulation session.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'session_pause', description: 'Pause the usage simulation session.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'session_resume', description: 'Resume the usage simulation session.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'session_trigger_demo', description: 'Trigger a declared Routewatch demo.', inputSchema: { type: 'object', properties: { demo: { type: 'string', enum: ['usage-simulation', 'catalog-refresh'] } }, required: ['demo'], additionalProperties: false } },
  { name: 'artifact_export', description: 'Open the live session export in JSON or CSV format.', inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } }, required: ['format'], additionalProperties: false } },
  { name: 'artifact_import', description: 'Open the replace-session import surface. File contents remain a visible UI interaction.', inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['replace'] } }, required: ['mode'], additionalProperties: false } },
  { name: 'artifact_copy', description: 'Copy the currently selected live export preview.', inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } }, required: ['format'], additionalProperties: false } },
]





function visibleResult() {
  const state = useAppStore.getState()

  const rollups = deriveRollups(state.usageEvents)
  const total = rollups.reduce((sum, row) => sum + row.subtotal, 0)
  const query = state.searchQuery.toLowerCase()
  const shown = state.models.filter((model) => {
    const textMatch = !query || model.name.toLowerCase().includes(query) || model.provider.toLowerCase().includes(query) || (query === 'free' && model.pricing_tier === 'free')
    return textMatch && (state.providerFilter === 'All providers' || model.provider === state.providerFilter) && (!state.freeOnly || model.pricing_tier === 'free') && (!state.pinnedOnly || model.pinned)
  }).length
  return {
    shown_of_total_count: `${shown} of ${state.models.length}`,
    session_total: Number(total.toFixed(8)),
    per_model_subtotals: rollups.map(({ model, subtotal }) => ({ model, subtotal })),
    session_budget_remaining: Number((state.sessionBudget - total).toFixed(8)),
    pinned_count: state.models.filter((item) => item.pinned).length,
  }
}

async function invoke(name, args = {}) {
  const store = useAppStore.getState()
  if (name === 'browse_open') store.navigateDestination(args.destination)
  else if (name === 'browse_search') store.setSearchQuery(args.query)
  else if (name === 'browse_apply_filter') {
    if (args.filter === 'provider') store.setProviderFilter(String(args.value))
    if (args.filter === 'search') store.setSearchQuery(String(args.value))
    if (args.filter === 'free') store.setFreeOnly(Boolean(args.value))
    if (args.filter === 'pinned') store.setPinnedOnly(Boolean(args.value))
  } else if (name === 'browse_clear_filter') {
    if (args.filter === 'provider') store.setProviderFilter('All providers')
    if (args.filter === 'search') store.setSearchQuery('')
    if (args.filter === 'free') store.setFreeOnly(false)
    if (args.filter === 'pinned') store.setPinnedOnly(false)
  } else if (name === 'browse_sort') store.setSortBy(args.sort)
  else if (name === 'entity_create') {
    const names = store.models.map((item) => item.name)
    const parsed = makeUsageFormSchema(names).safeParse(args)
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const model = store.models.find((item) => item.name === parsed.data.model)
    store.addManualUsage(parsed.data, calculateCost(model, parsed.data.prompt_tokens, parsed.data.completion_tokens))
  } else if (name === 'entity_select') {
    const isSelected = store.compareSelected.includes(args.model)
    if (Boolean(args.selected) !== isSelected) store.toggleCompare(args.model)
  } else if (name === 'entity_update') {
    if (args.field === 'alerts-enabled') store.saveAlertConfig({ ...store.alertConfig, alerts_enabled: Boolean(args.value) })
    if (args.field === 'min-context-window') {
      if (!Number.isInteger(args.value) || args.value < 0) throw new Error('Minimum context window must be a non-negative integer')
      store.saveAlertConfig({ ...store.alertConfig, min_context_window: args.value })
    }
    if (args.field === 'session-budget-usd') {
      const text = String(args.value)
      if (!(args.value > 0 && args.value <= 100000) || !/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Session budget must be greater than 0 with at most 2 decimals')
      store.saveBudget(args.value)
    }
  } else if (name === 'entity_toggle') {
    if (!store.models.some((item) => item.name === args.model)) throw new Error('Model must exactly match the catalog')
    if (args.field === 'pinned') store.togglePin(args.model)
    if (args.field === 'legend-visible') store.toggleLegend(args.model)
    if (args.field === 'events-disclosure-open') store.toggleDisclosure(args.model)
  } else if (name === 'session_start' || name === 'session_resume') store.setSimulationRunning(true)
  else if (name === 'session_pause') store.setSimulationRunning(false)
  else if (name === 'session_trigger_demo') {
    if (args.demo === 'usage-simulation') store.setSimulationRunning(true)
    if (args.demo === 'catalog-refresh') store.triggerRefresh()
  } else if (name === 'artifact_export') {
    store.setExportTab(args.format)
    store.navigateDestination('export-panel')
  } else if (name === 'artifact_import') store.navigateDestination('export-panel')
  else if (name === 'artifact_copy') {
    const live = useAppStore.getState()
    const preview = args.format === 'json' ? JSON.stringify(reportFromState(live), null, 2) : csvFromEvents(live.usageEvents)
    await navigator.clipboard.writeText(preview)
    live.setExportTab(args.format)
    live.navigateDestination('export-panel')
  } else throw new Error(`Unknown WebMCP tool: ${name}`)
  return new Promise(resolve => {
    setTimeout(() => {
      window.dispatchEvent(new Event('__webmcp_flush_state'));
      setTimeout(() => {
        resolve({ ok: true, ...visibleResult() });
      }, 0);
    }, 50);
  });
}

export function registerWebMCP() {
  const sessionInfo = () => ({ contract_version: 'zto-webmcp-v1', modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'], tools: tools.map((tool) => tool.name) })
  window.webmcp_session_info = sessionInfo
  window.webmcp_list_tools = () => tools
  window.webmcp_invoke_tool = invoke
  window.webmcp = { sessionInfo, listTools: () => tools, invokeTool: invoke }
}
