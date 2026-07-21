import { personaSchema } from './schema'
import { SCENARIOS, TRAITS, generateResponse, toPayload, useAppStore } from './store'

const registered = new Set()
const ok = (message) => ({ content: [{ type: 'text', text: message }] })
const fail = (message) => ({ isError: true, content: [{ type: 'text', text: message }] })
const objectSchema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const stringEnum = (values) => ({ type: 'string', enum: values })
const personaIds = () => useAppStore.getState().personas.map((p) => p.id)

const traitProperties = Object.fromEntries(TRAITS.map((trait) => [trait, { type: 'integer', minimum: 0, maximum: 100 }]))
const createSchema = objectSchema({
  name: { type: 'string', minLength: 2, maxLength: 80 }, role: stringEnum(['Coder', 'Writer', 'Analyst', 'Reviewer']), tone: stringEnum(['formal', 'neutral', 'casual', 'assertive']),
  tags: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1 } }, constraints: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1, maxLength: 2000 } }, goals: { type: 'string', minLength: 1, maxLength: 2000 },
  examples: { type: 'array', minItems: 1, items: objectSchema({ user: { type: 'string', minLength: 1 }, reply: { type: 'string', minLength: 1 } }, ['user', 'reply']) }, promptBody: { type: 'string', minLength: 1 },
  traits: objectSchema(traitProperties, TRAITS),
}, ['name', 'role', 'tone', 'tags', 'constraints', 'goals', 'examples', 'promptBody', 'traits'])

function payloadFromArgs(args) {
  const examples = args.examples
  const promptBody = args.promptBody
  return { ...args, variants: [
    { id: 'direct', label: 'Direct instruction', promptBody, examples },
    { id: 'few-shot', label: 'Few-shot', promptBody: `${promptBody}<p>Follow the example exchange.</p>`, examples },
  ], activeVariant: 'direct', activeIteration: null }
}

const definitions = [
  {
    name: 'browse_open', description: 'Open a bounded Persona Foundry destination.', inputSchema: objectSchema({ destination: stringEnum(['library', 'test-bench', 'compare', 'export-drawer', 'attacher-drawer']) }, ['destination']),
    execute: ({ destination }) => { const s = useAppStore.getState(); if (['library', 'test-bench', 'compare'].includes(destination)) s.setView(destination); else s.setUI(destination === 'export-drawer' ? { exportOpen: true } : { attacherOpen: true }); return ok(`Opened ${destination}; verify the visible destination.`) },
  },
  { name: 'browse_search', description: 'Search personas by name or role.', inputSchema: objectSchema({ query: { type: 'string', maxLength: 80 } }, ['query']), execute: ({ query }) => { useAppStore.getState().setFilters({ search: query }); return ok(`Applied visible search “${query}”.`) } },
  {
    name: 'browse_apply_filter', description: 'Apply one bounded persona filter.', inputSchema: objectSchema({ filter: stringEnum(['name-role-search', 'role-category', 'tag-facet', 'archived-toggle']), value: { type: ['string', 'boolean'] } }, ['filter', 'value']),
    execute: ({ filter, value }) => { const s = useAppStore.getState(); if (filter === 'name-role-search') s.setFilters({ search: String(value) }); else if (filter === 'role-category') { if (!['All roles', 'Coder', 'Writer', 'Analyst', 'Reviewer'].includes(value)) return fail('role-category must be Coder, Writer, Analyst, Reviewer, or All roles'); s.setFilters({ role: value }) } else if (filter === 'tag-facet') s.setFilters({ tag: value || null }); else s.setFilters({ archived: Boolean(value) }); return ok(`Applied ${filter}; the grid and facet counts updated.`) },
  },
  { name: 'browse_clear_filter', description: 'Clear all persona filters.', inputSchema: objectSchema(), execute: () => { useAppStore.getState().clearFilters(); return ok('Cleared visible filters.') } },
  { name: 'browse_sort', description: 'Sort is declared but unavailable because library ordering follows creation history.', inputSchema: objectSchema({ sort: stringEnum(['creation-order']) }), execute: () => fail('Only creation-order is supported; no state changed.') },
  { name: 'browse_set_locale', description: 'Locale selection is not exposed in this workspace.', inputSchema: objectSchema({ locale: stringEnum(['en']) }, ['locale']), execute: () => ok('Locale remains en.') },
  { name: 'browse_set_theme', description: 'Theme selection is bounded to the product dark theme.', inputSchema: objectSchema({ theme: stringEnum(['foundry-dark']) }, ['theme']), execute: () => ok('Theme remains foundry-dark.') },

  { name: 'entity_create', description: 'Create one API-shaped persona using the same validated command as the visible editor.', inputSchema: createSchema, execute: (args) => { const parsed = personaSchema.safeParse(payloadFromArgs(args)); if (!parsed.success) return fail(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')); const id = useAppStore.getState().createPersona(parsed.data); return ok(`Created persona ${id}; the new card is visible.`) } },
  { name: 'entity_select', description: 'Select a persona for the collection, comparison, or Test Bench.', inputSchema: objectSchema({ id: { type: 'string' }, target: stringEnum(['collection', 'comparison-slot-1', 'comparison-slot-2', 'test-bench-slot']) }, ['id', 'target']), execute: ({ id, target }) => { const s = useAppStore.getState(); if (!personaIds().includes(id)) return fail('Unknown persona id'); if (target === 'collection') s.toggleSelected(id); else if (target === 'test-bench-slot') s.openInTestBench(id); else { s.setComparisonSlot(target.endsWith('1') ? 0 : 1, id); s.setView('compare') } return ok(`Selected ${id} for ${target}.`) } },
  {
    name: 'entity_update', description: 'Update one closed persona field through the shared save command.', inputSchema: objectSchema({ id: { type: 'string' }, field: stringEnum(['name', 'role', 'tone', 'tags', 'constraints', 'goals', 'examples', 'prompt-body', 'active-variant', 'trait-formality', 'trait-verbosity', 'trait-creativity', 'trait-empathy', 'trait-assertiveness', 'comparison-slot', 'test-bench-slot']), value: {} }, ['id', 'field', 'value']),
    execute: ({ id, field, value }) => { const s = useAppStore.getState(); const persona = s.personas.find((p) => p.id === id); if (!persona) return fail('Unknown persona id'); if (field === 'comparison-slot') { s.addToComparison(id); return ok('Comparison slot updated.') } if (field === 'test-bench-slot') { s.openInTestBench(id); return ok('Test Bench slot updated.') } const payload = toPayload(persona); const trait = field.startsWith('trait-') ? field.slice(6) : null; if (trait) { const number = Number(value); if (!Number.isInteger(number) || number < 0 || number > 100) return fail(`${trait} must be an integer between 0 and 100`); payload.traits[trait] = number } else if (field === 'prompt-body') { payload.promptBody = String(value); const index = payload.variants.findIndex((v) => v.id === payload.activeVariant); payload.variants[index].promptBody = payload.promptBody } else if (field === 'active-variant') payload.activeVariant = String(value); else payload[field] = value; const parsed = personaSchema.safeParse(payload); if (!parsed.success) return fail(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')); s.updatePersona(id, parsed.data); return ok(`Updated ${field}; all live surfaces now use the saved value.`) },
  },
  { name: 'entity_toggle', description: 'Toggle a persona archived or selected state.', inputSchema: objectSchema({ id: { type: 'string' }, field: stringEnum(['archived', 'selected']), value: { type: 'boolean' } }, ['id', 'field', 'value']), execute: ({ id, field, value }) => { const s = useAppStore.getState(); if (!personaIds().includes(id)) return fail('Unknown persona id'); if (field === 'archived') s.archivePersona(id, value); else if (s.selectedIds.includes(id) !== value) s.toggleSelected(id); return ok(`Set ${field} to ${value}.`) } },
  { name: 'entity_delete', description: 'Delete one or more personas with explicit confirmation.', inputSchema: objectSchema({ ids: { type: 'array', minItems: 1, items: { type: 'string' } }, confirm: { type: 'boolean' } }, ['ids', 'confirm']), execute: ({ ids, confirm }) => { if (!confirm) return fail(`Delete requires confirm=true for ${ids.length} personas`); const valid = ids.filter((id) => personaIds().includes(id)); if (valid.length !== ids.length) return fail('One or more persona ids are unknown'); useAppStore.getState().deletePersonas(ids); return ok(`Deleted ${ids.length} personas; visible references were reconciled.`) } },
  { name: 'entity_quantity', description: 'Quantity does not apply to persona entities.', inputSchema: objectSchema({ id: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 1 } }, ['id', 'quantity']), execute: () => fail('Persona quantity is fixed at one; no state changed.') },
  { name: 'entity_reorder', description: 'Persona order follows creation history and is not manually reorderable.', inputSchema: objectSchema({ ids: { type: 'array', items: { type: 'string' } } }, ['ids']), execute: () => fail('Manual reorder is unavailable; no state changed.') },

  { name: 'session_start', description: 'Start the current Test Bench simulation.', inputSchema: objectSchema({ demo: stringEnum(['test-bench-run']) }, ['demo']), execute: () => { const s = useAppStore.getState(); const p = s.personas.find((x) => x.id === s.testBench.personaId); const sc = SCENARIOS.find((x) => x.id === s.testBench.scenarioId); if (!p) return fail('Attach a persona first'); s.setView('test-bench'); s.startRun(generateResponse(p, sc)); return ok('Test Bench run started; observe streaming in the transcript.') } },
  { name: 'session_stop', description: 'Stop and freeze the current Test Bench run.', inputSchema: objectSchema(), execute: () => { useAppStore.getState().finishRun(true); return ok('Stop requested; verify the frozen visible transcript.') } },
  { name: 'session_trigger_demo', description: 'Trigger the bounded Test Bench or iteration-poll demo.', inputSchema: objectSchema({ demo: stringEnum(['test-bench-run', 'iteration-poll']), personaId: { type: 'string' } }, ['demo']), execute: ({ demo, personaId }) => { const s = useAppStore.getState(); if (demo === 'iteration-poll') { if (!personaId) return fail('personaId is required for iteration-poll'); s.openDetail(personaId); return s.startPoll(personaId) ? ok('Iteration poll started; watch votes arrive.') : fail('At least two iterations are required') } const p = s.personas.find((x) => x.id === (personaId || s.testBench.personaId)); if (!p) return fail('Attach or name a persona first'); s.setTestPersona(p.id); s.setView('test-bench'); s.startRun(generateResponse(p, SCENARIOS.find((x) => x.id === s.testBench.scenarioId))); return ok('Test Bench demo started.') } },
  ...['pause', 'resume', 'restart', 'advance', 'connect', 'disconnect'].map((operation) => ({ name: `session_${operation}`, description: `${operation} is declared but not applicable to this deterministic local simulation.`, inputSchema: objectSchema(), execute: () => fail(`${operation} is not applicable; use start or stop.`) })),

  { name: 'artifact_export', description: 'Open the live export drawer for a bounded format.', inputSchema: objectSchema({ format: stringEnum(['persona-pack-json', 'comparison-report-text']) }, ['format']), execute: ({ format }) => { useAppStore.getState().setUI({ exportOpen: true, exportRestoreFocus: false, exportTab: format === 'persona-pack-json' ? 'pack' : 'report' }); return ok(`Opened visible ${format} export. Contents remain in the UI.`) } },
  { name: 'artifact_copy', description: 'Prepare a bounded export for user-observed clipboard copying.', inputSchema: objectSchema({ format: stringEnum(['persona-pack-json', 'comparison-report-text']) }, ['format']), execute: ({ format }) => { const s = useAppStore.getState(); const label = format === 'persona-pack-json' ? 'Persona pack JSON' : 'Comparison report'; s.setUI({ exportOpen: true, exportRestoreFocus: false, exportTab: format === 'persona-pack-json' ? 'pack' : 'report' }); s.toast(`${label} opened; choose Copy to copy the exact preview`); return ok('Export is visible and ready; clipboard contents require UI observation.') } },
  { name: 'artifact_import', description: 'Import is not enabled for this in-memory seeded workspace.', inputSchema: objectSchema({ mode: stringEnum(['persona-pack-json']) }, ['mode']), execute: () => fail('Import is unavailable; no file or content was accepted.') },
  { name: 'artifact_print_preview', description: 'Open the comparison report as the bounded print-preview source.', inputSchema: objectSchema(), execute: () => { useAppStore.getState().setUI({ exportOpen: true, exportRestoreFocus: false, exportTab: 'report' }); return ok('Comparison report opened for visible preview.') } },
  { name: 'artifact_convert', description: 'Switch between the two live export representations.', inputSchema: objectSchema({ mode: stringEnum(['persona-pack-json', 'comparison-report-text']) }, ['mode']), execute: ({ mode }) => { useAppStore.getState().setUI({ exportOpen: true, exportRestoreFocus: false, exportTab: mode === 'persona-pack-json' ? 'pack' : 'report' }); return ok(`Visible artifact converted to ${mode}.`) } },
]

function invokeDefinition(name, args = {}) {
  const definition = definitions.find((item) => item.name === name)
  if (!definition) throw new Error(`Unknown WebMCP tool: ${name}`)
  const result = definition.execute(args)
  if (result.isError) throw new Error(result.content[0].text)
  return { ok: true, message: result.content[0].text }
}

export function registerWebMCP() {
  if (!window.webmcp_session_info) {
    window.webmcp_action_contract = 'zto-webmcp-v1'
    window.webmcp_session_info = () => ({
      contractVersion: 'zto-webmcp-v1',
      modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
      toolNames: definitions.map((definition) => definition.name),
    })
    window.webmcp_list_tools = () => definitions.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
    window.webmcp_invoke_tool = async (name, args = {}) => invokeDefinition(name, args)
  }

  let attempts = 0
  const register = () => {
    attempts += 1
    const context = navigator.modelContext
    if (!context?.registerTool) {
      if (attempts < 30) window.setTimeout(register, 350)
      return
    }
    definitions.forEach((definition) => {
      if (registered.has(definition.name)) return
      try {
        context.registerTool(definition)
        registered.add(definition.name)
      } catch (error) {
        if (!String(error).toLowerCase().includes('already')) console.warn(`WebMCP registration failed for ${definition.name}`, error)
      }
    })
  }
  register()
}
