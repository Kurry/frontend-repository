import { ReadingInputSchema, QUERY_VALUES, SORT_VALUES, deriveSummary } from './domain'
import { useAirStore, visibleRecords } from './store'

const MODULES = ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1']
const DESTINATIONS = ['collection', 'forecast-ribbon', 'evidence-inspector', 'artifact-export', 'artifact-import']
const FILTERS = ['saved-query']

const ok = (result: Record<string, unknown> = {}) => ({ status: 'success', ...result })
const fail = (error: string) => ({ status: 'error', error })

const tools = [
  {
    name: 'browse_open',
    description: 'Open one bounded workbench destination through the visible product path.',
    inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: DESTINATIONS } }, required: ['destination'], additionalProperties: false },
  },
  {
    name: 'browse_search',
    description: 'Search the visible air-reading collection by label, stable ID, or source issue.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 0, maxLength: 80 } }, required: ['query'], additionalProperties: false },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply one bounded saved-query filter shared by the table and inspector.',
    inputSchema: { type: 'object', properties: { filter: { type: 'string', enum: FILTERS }, value: { type: 'string', enum: QUERY_VALUES } }, required: ['filter', 'value'], additionalProperties: false },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear search and saved-query filtering through the same state commands as the visible controls.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'browse_sort',
    description: 'Sort the live reading collection by one bounded sort mode.',
    inputSchema: { type: 'object', properties: { sort: { type: 'string', enum: SORT_VALUES } }, required: ['sort'], additionalProperties: false },
  },
  {
    name: 'entity_create',
    description: 'Create one API-shaped air reading with the same schema and state command as the visible form.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^aq-[a-z0-9-]{3,28}$' },
        label: { type: 'string', minLength: 2, maxLength: 64 },
        status: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived'] },
        aqi: { type: 'integer', minimum: 0, maximum: 500 },
        observedOn: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        projectedAqi: { type: 'integer', minimum: 0, maximum: 500 },
        horizonHours: { type: 'integer', enum: [6, 12, 24] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        releaseVersion: { type: 'string', pattern: '^AQ-\\d{4}\\.\\d{2}$' },
        sourceIssue: { type: 'string', pattern: '^HAQ-\\d{3,5}$' },
        duplicateOfId: { type: ['string', 'null'] },
      },
      required: ['label', 'status', 'aqi', 'observedOn', 'projectedAqi', 'horizonHours', 'confidence', 'releaseVersion', 'sourceIssue'],
      additionalProperties: false,
    },
  },
  {
    name: 'entity_select',
    description: 'Select one stable reading ID for the forecast ribbon and linked evidence inspector.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
  },
  {
    name: 'entity_update',
    description: 'Update the typed fields for an existing reading through the same schema and state command as the visible edit form.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, fields: { type: 'object' } }, required: ['id', 'fields'], additionalProperties: false },
  },
  {
    name: 'entity_delete',
    description: 'Delete one reading only with explicit confirmation, updating references and derived values coherently.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean', const: true } }, required: ['id', 'confirm'], additionalProperties: false },
  },
  {
    name: 'artifact_export',
    description: 'Open the live air-quality-v1 JSON artifact preview. Downloaded bytes remain a visible-browser responsibility.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['air-quality-v1-json'] } }, required: ['format'], additionalProperties: false },
  },
  {
    name: 'artifact_import',
    description: 'Open the visible transactional JSON import form. Raw artifact content remains a visible-browser responsibility.',
    inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['air-quality-v1-json'] } }, required: ['mode'], additionalProperties: false },
  },
  {
    name: 'artifact_copy',
    description: 'Open the live artifact preview so the visible Copy JSON action can copy current session bytes.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['air-quality-v1-json'] } }, required: ['format'], additionalProperties: false },
  },
]

function inputFromArgs(args: Record<string, unknown>) {
  return {
    id: args.id,
    label: args.label,
    status: args.status,
    aqi: args.aqi,
    observedOn: args.observedOn,
    forecast: { projectedAqi: args.projectedAqi, horizonHours: args.horizonHours, confidence: args.confidence },
    provenance: { releaseVersion: args.releaseVersion, sourceIssue: args.sourceIssue, duplicateOfId: args.duplicateOfId ?? null },
  }
}

const handlers: Record<string, (args: Record<string, unknown>) => unknown> = {
  browse_open(args) {
    if (!DESTINATIONS.includes(String(args.destination))) return fail(`destination must be one of ${DESTINATIONS.join(', ')}`)
    if (args.destination === 'artifact-export') window.dispatchEvent(new CustomEvent('airwise:transfer', { detail: 'export' }))
    if (args.destination === 'artifact-import') window.dispatchEvent(new CustomEvent('airwise:transfer', { detail: 'import' }))
    if (args.destination === 'collection') document.getElementById('records-title')?.scrollIntoView({ behavior: 'smooth' })
    if (args.destination === 'forecast-ribbon') document.getElementById('forecast-title')?.scrollIntoView({ behavior: 'smooth' })
    return ok({ destination: args.destination, visible_postcondition: `The ${args.destination} destination is visible.` })
  },
  browse_search(args) {
    if (typeof args.query !== 'string' || args.query.length > 80) return fail('query must be a string of at most 80 characters')
    const store = useAirStore.getState()
    store.setSearch(args.query)
    const matches = visibleRecords({ ...useAirStore.getState(), search: args.query })
    return ok({ query: args.query, matchCount: matches.length, matches: matches.slice(0, 20).map((record) => record.id), visible_postcondition: `${matches.length} reading rows are visible.` })
  },
  browse_apply_filter(args) {
    if (args.filter !== 'saved-query' || !QUERY_VALUES.includes(args.value as never)) return fail(`saved-query must be one of ${QUERY_VALUES.join(', ')}`)
    useAirStore.getState().setQuery(args.value as never)
    return ok({ filter: args.filter, value: args.value, visible_postcondition: `Saved query ${args.value} is active in the rail and table.` })
  },
  browse_clear_filter() {
    const store = useAirStore.getState()
    store.setQuery('all')
    store.setSearch('')
    return ok({ visible_postcondition: 'All readings are visible and the search field is empty.' })
  },
  browse_sort(args) {
    if (!SORT_VALUES.includes(args.sort as never)) return fail(`sort must be one of ${SORT_VALUES.join(', ')}`)
    useAirStore.getState().setSort(args.sort as never)
    return ok({ sort: args.sort, order: visibleRecords(useAirStore.getState()).map((record) => record.id), visible_postcondition: `The table is sorted by ${args.sort}.` })
  },
  entity_create(args) {
    const parsed = ReadingInputSchema.safeParse(inputFromArgs(args))
    if (!parsed.success) return fail(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '))
    const result = useAirStore.getState().createRecord(parsed.data)
    if (!result.ok) return fail(result.message)
    const state = useAirStore.getState()
    return ok({ id: state.selectedId, derived: deriveSummary(state.records), eventId: state.history.at(-1)?.id, visible_postcondition: 'One row is selected and every linked summary reflects the new reading.' })
  },
  entity_select(args) {
    const result = useAirStore.getState().select(String(args.id ?? ''))
    if (!result.ok) return fail(result.message)
    const record = useAirStore.getState().records.find((item) => item.id === args.id)
    return ok({ record, visible_postcondition: 'The selected row, forecast ribbon, and evidence inspector show the same stable ID.' })
  },
  entity_update(args) {
    const store = useAirStore.getState()
    const current = store.records.find((record) => record.id === args.id)
    if (!current) return fail(`Reading ${String(args.id)} was not found.`)
    if (!args.fields || typeof args.fields !== 'object' || Array.isArray(args.fields)) return fail('fields must be an object of declared reading fields')
    const candidate = { ...current, ...(args.fields as object), id: current.id }
    const parsed = ReadingInputSchema.safeParse(candidate)
    if (!parsed.success) return fail(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '))
    const result = store.updateRecord(current.id, parsed.data)
    if (!result.ok) return fail(result.message)
    const state = useAirStore.getState()
    return ok({ record: state.records.find((record) => record.id === current.id), derived: deriveSummary(state.records), eventId: state.history.at(-1)?.id, visible_postcondition: 'The row, forecast ribbon, inspector, summary, and artifact preview share the updated record.' })
  },
  entity_delete(args) {
    if (args.confirm !== true) return fail('delete requires confirm=true')
    const result = useAirStore.getState().deleteRecord(String(args.id ?? ''))
    return result.ok ? ok({ id: args.id, visible_postcondition: 'The reading is absent and linked counts decreased by exactly one.' }) : fail(result.message)
  },
  artifact_export(args) {
    if (args.format !== 'air-quality-v1-json') return fail('format must be air-quality-v1-json')
    window.dispatchEvent(new CustomEvent('airwise:transfer', { detail: 'export' }))
    const state = useAirStore.getState()
    return ok({ format: args.format, recordCount: state.records.length, derived: deriveSummary(state.records), visible_postcondition: 'The live artifact preview is open; download and clipboard bytes remain visible-browser actions.' })
  },
  artifact_import(args) {
    if (args.mode !== 'air-quality-v1-json') return fail('mode must be air-quality-v1-json')
    window.dispatchEvent(new CustomEvent('airwise:transfer', { detail: 'import' }))
    return ok({ mode: args.mode, visible_postcondition: 'The transactional import form is open for visible paste and confirmation.' })
  },
  artifact_copy(args) {
    if (args.format !== 'air-quality-v1-json') return fail('format must be air-quality-v1-json')
    window.dispatchEvent(new CustomEvent('airwise:transfer', { detail: 'export' }))
    return ok({ format: args.format, visible_postcondition: 'The artifact preview is open with the visible Copy JSON control.' })
  },
}

export function registerWebMcp() {
  const toolNames = tools.map((tool) => tool.name)
  const sessionInfo = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'airwise-trendbook-forecast-ribbon',
    modules: MODULES,
    tools: toolNames,
    bindings: {
      browsable_entity: 'air-readings',
      destinations: DESTINATIONS,
      filters: FILTERS,
      sorts: SORT_VALUES,
      entity: 'air-reading',
      entity_operations: ['create', 'select', 'update', 'delete'],
      entity_fields: ['label', 'status', 'aqi', 'observedOn', 'forecast', 'provenance'],
      value_bounds: ['aqi 0..500 integer', 'projectedAqi 0..500 integer', 'horizonHours 6|12|24', 'confidence 0..1'],
      artifact_operations: ['export', 'import', 'copy'],
      import_modes: ['air-quality-v1-json'],
      export_formats: ['air-quality-v1-json'],
    },
  })
  const listTools = () => ({ tools })
  const invokeTool = async (name: string, args: Record<string, unknown> = {}) => {
    const handler = handlers[name]
    if (!handler) return fail(`Unsupported tool ${name}; registered tools: ${toolNames.join(', ')}`)
    try {
      const result = await handler(args ?? {})
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return result
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error))
    }
  }

  window.webmcp_session_info = sessionInfo
  window.webmcp_list_tools = listTools
  window.webmcp_invoke_tool = invokeTool
}

declare global {
  interface Window {
    webmcp_session_info: () => unknown
    webmcp_list_tools: () => unknown
    webmcp_invoke_tool: (name: string, args?: Record<string, unknown>) => Promise<unknown>
  }
}
