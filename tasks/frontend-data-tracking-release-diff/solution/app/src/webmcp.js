import { cutReleaseSchema } from './lib/contracts'

const destinations = ['manifest', 'diff', 'splits', 'rotation', 'timeline']
const exportFormats = ['release-pack-json', 'manifest-summary-text']

const objectSchema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const stringEnum = (values) => ({ type: 'string', enum: values })
const response = (payload) => ({ content: [{ type: 'text', text: JSON.stringify(payload) }] })

function toolsFor(store) {
  const currentVersionEnum = () => store.versions.map((version) => version.name)
  const register = (name, description, inputSchema, execute) => ({ name, description, inputSchema, execute })

  return [
    register('browse_open', 'Open a declared Larkspur Releases destination.', objectSchema({ destination: stringEnum(destinations) }, ['destination']), async ({ destination }) => {
      if (!destinations.includes(destination)) return response({ ok: false, message: `Destination must be one of ${destinations.join(', ')}.` })
      if (destination === 'timeline') document.querySelector('.timeline-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else store.setActiveTab(destination)
      return response({ ok: true, destination, visible: true })
    }),
    register('browse_search', 'Find and select a release by its bounded version name.', objectSchema({ query: { type: 'string', minLength: 1, maxLength: 64 } }, ['query']), async ({ query }) => {
      const match = store.versions.find((version) => version.name.toLowerCase().includes(query.toLowerCase()))
      if (!match) return response({ ok: true, matched: false, message: 'No release matched the query.' })
      store.selectVersion(match.name); store.setActiveTab('manifest')
      return response({ ok: true, matched: true, selectedVersion: match.name })
    }),
    register('browse_apply_filter', 'Apply a declared version filter to the diff base or compare picker.', objectSchema({ filter: stringEnum(['diff-base', 'diff-compare']), value: { type: 'string' } }, ['filter', 'value']), async ({ filter, value }) => {
      if (!currentVersionEnum().includes(value)) return response({ ok: false, message: 'The value is not an available seeded or session-cut version.' })
      const changed = filter === 'diff-base' ? store.setDiffBase(value) : store.setDiffCompare(value)
      store.setActiveTab('diff')
      return response({ ok: changed, filter, value, summary: store.diffSummary })
    }),
    register('browse_clear_filter', 'Reset the two diff version filters to the oldest and newest releases.', objectSchema(), async () => {
      store.setDiffBase(store.versions[store.versions.length - 1].name)
      store.setDiffCompare(store.versions[0].name)
      store.setActiveTab('diff')
      return response({ ok: true, base: store.diffBase, compare: store.diffCompare })
    }),
    register('form_validate', 'Validate the declared cut-release fields without starting a cut.', objectSchema({ 'version-name': { type: 'string' }, notes: { type: 'string', maxLength: 500 } }, ['version-name']), async (args) => {
      const payload = { name: args['version-name'], notes: args.notes ?? '' }
      const parsed = cutReleaseSchema.safeParse(payload)
      const duplicate = store.versions.some((version) => version.name.toLowerCase() === payload.name.toLowerCase())
      store.openDialog('cut')
      return response({ ok: parsed.success && !duplicate, fieldErrors: parsed.success ? (duplicate ? { 'version-name': `Version ${payload.name} already exists.` } : {}) : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] === 'name' ? 'version-name' : issue.path[0], issue.message])) })
    }),
    register('form_submit', 'Submit the cut-release form through the same release workflow as the visible form.', objectSchema({ 'version-name': { type: 'string' }, notes: { type: 'string', maxLength: 500 } }, ['version-name']), async (args) => {
      store.openDialog('cut')
      const result = await store.startCut({ name: args['version-name'], notes: args.notes ?? '' })
      return response({ ok: result.success, message: result.message || (store.cutRun.error || 'Release workflow started.'), visibleStep: store.cutRun.steps.find((step) => step.status === 'running' || step.status === 'failed')?.id || 'seal' })
    }),
    register('form_cancel', 'Cancel the visible cut form when no cut is running.', objectSchema(), async () => response({ ok: store.closeDialog(), dialog: store.dialog })),
    register('session_start', 'Start the declared release-cut session through the same product command as the visible form.', objectSchema({ 'version-name': { type: 'string' }, notes: { type: 'string', maxLength: 500 } }, ['version-name']), async (args) => {
      store.openDialog('cut')
      const result = await store.startCut({ name: args['version-name'], notes: args.notes ?? '' })
      return response({ ok: result.success, message: result.message || store.cutRun.error || 'Release workflow started.' })
    }),
    register('session_restart', 'Restart the failed rank-stability check.', objectSchema(), async () => response({ ok: await store.retryRankCheck(), correlation: store.cutRun.correlation })),
    register('session_advance', 'Advance the held-out subset rotation by one cycle.', objectSchema(), async () => response({ ok: true, cycle: store.advanceRotation(), activeSubsets: store.rotation.activeSubsets })),

    register('artifact_import', 'Open the visible release-pack JSON import workflow and focus its paste field.', objectSchema({ mode: stringEnum(['release-pack-json']) }, ['mode']), async () => {
      store.openDialog('import')
      window.setTimeout(() => document.getElementById('pack-json')?.focus(), 100)
      return response({ ok: true, panel: 'import', message: 'The visible file picker, paste area, and seeded sample are ready.' })
    }),
    register('artifact_export', 'Open a declared live release artifact and focus its visible Download control.', objectSchema({ format: stringEnum(exportFormats) }, ['format']), async ({ format }) => {
      store.setExportFormat(format)
      window.setTimeout(() => document.getElementById('export-download-button')?.focus(), 100)
      return response({ ok: true, format, panel: 'export' })
    }),
    register('artifact_copy', 'Open a declared live release artifact and focus its visible Copy control. Clipboard interaction remains a Playwright gesture.', objectSchema({ format: stringEnum(exportFormats) }, ['format']), async ({ format }) => {
      store.setExportFormat(format)
      window.setTimeout(() => document.getElementById('export-copy-button')?.focus(), 100)
      return response({ ok: true, format, panel: 'export' })
    }),
  ]
}

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = ['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1']

export function registerWebMCP(store) {
  const definitions = toolsFor(store)
  window.__larkspurWebMcpTools = definitions
  const byName = new Map(definitions.map((definition) => [definition.name, definition]))

  // WebMCP surface the verifier bridge probes:
  // window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.
  // Handlers drive the same Pinia store commands as the visible UI.
  window.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    title: 'Larkspur Releases',
    modules: MODULES,
    tools: definitions.map((definition) => definition.name),
  })
  window.webmcp_list_tools = () =>
    definitions.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = byName.get(name)
    if (!tool) return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: `Unknown tool: ${name}` }) }], isError: true }
    try {
      return await tool.execute(args || {})
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: String(error && error.message || error) }) }], isError: true }
    }
  }

  // Also register with a native modelContext host when one is present (optional).
  let attempts = 0
  const tryRegister = () => {
    const context = navigator.modelContext || window.modelContext
    const register = context?.registerTool?.bind(context) || context?.addTool?.bind(context)
    if (!register) {
      attempts += 1
      if (attempts < 40) window.setTimeout(tryRegister, 250)
      return
    }
    const registered = window.__larkspurRegisteredTools || (window.__larkspurRegisteredTools = new Set())
    definitions.forEach((definition) => {
      if (registered.has(definition.name)) return
      try { register(definition); registered.add(definition.name) } catch (error) { console.warn(`Unable to register ${definition.name}`, error) }
    })
  }
  tryRegister()
}
