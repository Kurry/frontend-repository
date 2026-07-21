import { formSchemas, makeLibraryDocument, markdownForPrompt, savePayloadSchema, techniqueIds, assemblePrompt } from './domain'
import { studioActions } from './store'
import { copyText, downloadText } from './components/PreviewPanel'

const destinationSchema = { type: 'string', enum: [...techniqueIds, 'library'] }
const emptySchema = { type: 'object', properties: {}, additionalProperties: false }

const legacyTools = [
  ...['validate', 'submit', 'cancel', 'reset', 'advance', 'return'].map((operation) => ({
    name: `form_${operation}`,
    description: `${operation[0].toUpperCase()}${operation.slice(1)} the visible active technique workflow.`,
    inputSchema: emptySchema,
  })),
  {
    name: 'browse_open',
    description: 'Open a declared prompting technique or the library using the visible navigation state.',
    inputSchema: { type: 'object', properties: { destination: destinationSchema }, required: ['destination'], additionalProperties: false },
  },
  {
    name: 'browse_search',
    description: 'Search library prompts by title query using the visible library search control.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply a technique filter to the library-prompts collection.',
    inputSchema: {
      type: 'object',
      properties: { technique: { type: 'string', enum: ['all', ...techniqueIds] } },
      required: ['technique'],
      additionalProperties: false,
    },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear the library technique filter and search query.',
    inputSchema: emptySchema,
  },
  {
    name: 'browse_sort',
    description: 'Toggle or set library sort order using the visible sort control.',
    inputSchema: {
      type: 'object',
      properties: { order: { type: 'string', enum: ['asc', 'desc'] } },
      additionalProperties: false,
    },
  },
  {
    name: 'browse_set_locale',
    description: 'Set the visible product locale preference.',
    inputSchema: { type: 'object', properties: { locale: { type: 'string', enum: ['en'] } }, required: ['locale'], additionalProperties: false },
  },
  {
    name: 'browse_set_theme',
    description: 'Set the visible product theme preference.',
    inputSchema: { type: 'object', properties: { theme: { type: 'string', enum: ['light', 'dark'] } }, required: ['theme'], additionalProperties: false },
  },
  {
    name: 'entity_create',
    description: 'Create a library-prompt from the current valid generated preview.',
    inputSchema: { type: 'object', properties: { title: { type: 'string', minLength: 2, maxLength: 80 } }, required: ['title'], additionalProperties: false },
  },
  {
    name: 'entity_select',
    description: 'Select a library-prompt by its visible zero-based index.',
    inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0 } }, required: ['index'], additionalProperties: false },
  },
  {
    name: 'entity_update',
    description: 'Update the title of a library-prompt by visible index.',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'integer', minimum: 0 },
        title: { type: 'string', minLength: 2, maxLength: 80 },
      },
      required: ['index', 'title'],
      additionalProperties: false,
    },
  },
  {
    name: 'entity_delete',
    description: 'Delete a library-prompt by index; explicit confirmation is required.',
    inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0 }, confirm: { type: 'boolean' } }, required: ['index', 'confirm'], additionalProperties: false },
  },
  {
    name: 'entity_toggle',
    description: 'Toggle the library export panel open state for the selected collection.',
    inputSchema: emptySchema,
  },
  {
    name: 'entity_quantity',
    description: 'Report the current library-prompt quantity.',
    inputSchema: emptySchema,
  },
  {
    name: 'entity_reorder',
    description: 'Reorder a library-prompt from one visible index to another.',
    inputSchema: {
      type: 'object',
      properties: {
        fromIndex: { type: 'integer', minimum: 0 },
        toIndex: { type: 'integer', minimum: 0 },
      },
      required: ['fromIndex', 'toIndex'],
      additionalProperties: false,
    },
  },
  {
    name: 'artifact_copy',
    description: 'Copy the current visible prompt preview or library export through the product copy handler.',
    inputSchema: { type: 'object', properties: { target: { type: 'string', enum: ['prompt', 'library'] } }, required: ['target'], additionalProperties: false },
  },
  {
    name: 'artifact_import',
    description: 'Open the visible validated JSON import workflow; file contents remain a browser interaction.',
    inputSchema: emptySchema,
  },
  {
    name: 'artifact_export',
    description: 'Export the current visible library JSON or active prompt markdown.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'markdown'] } }, required: ['format'], additionalProperties: false },
  },
  {
    name: 'artifact_print_preview',
    description: 'Open the browser print preview for the current prompt or library export surface.',
    inputSchema: emptySchema,
  },
  {
    name: 'artifact_convert',
    description: 'Convert the active prompt preview into downloadable markdown through the product handler.',
    inputSchema: emptySchema,
  },
]

const formFields = ['task-description', 'output-format', 'tone', 'example-input', 'expected-output', 'goal', 'reasoning-step', 'scratchpad', 'success-criterion', 'measurement', 'role', 'audience', 'constraint-type', 'constraint-text', 'reference-documents', 'title']
const entityFields = ['title', 'technique', 'field-values', 'attachments']
const objectSchema = (properties = {}, required = []) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) })
const fieldsSchema = { type: 'object', additionalProperties: { type: 'string', maxLength: 200 } }

const tools = [
  { name: 'browse.open', description: 'Open a declared destination (route, tab, section, or item).', inputSchema: objectSchema({ destination: destinationSchema }, ['destination']), invokeAs: 'browse_open' },
  { name: 'browse.search', description: 'Search within the browsable surface.', inputSchema: objectSchema({ query: { type: 'string', maxLength: 200 } }, ['query']), invokeAs: 'browse_search' },
  { name: 'entity.create', description: 'Create an entity using declared fields.', inputSchema: objectSchema({ fields: fieldsSchema }), allowedFields: entityFields, invokeAs: 'entity_create' },
  { name: 'entity.select', description: 'Select an entity by public id.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 } }, ['id']), invokeAs: 'entity_select' },
  { name: 'entity.delete', description: 'Delete an entity with explicit confirmation.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, confirm: { type: 'boolean', const: true } }, ['id', 'confirm']), invokeAs: 'entity_delete' },
  { name: 'form.validate', description: 'Run declared form validation.', inputSchema: objectSchema({ fields: fieldsSchema }), allowedFields: formFields, invokeAs: 'form_validate' },
  { name: 'form.submit', description: 'Submit the form through the visible handler.', inputSchema: objectSchema({ fields: fieldsSchema }), allowedFields: formFields, invokeAs: 'form_submit' },
  { name: 'form.cancel', description: 'Cancel the active form workflow.', inputSchema: emptySchema, invokeAs: 'form_cancel' },
  { name: 'form.reset', description: 'Reset the form to its initial state.', inputSchema: emptySchema, invokeAs: 'form_reset' },
  { name: 'artifact.copy', description: 'Trigger copy via the visible control (clipboard verified in Playwright).', inputSchema: emptySchema },
]

function validateInput(tool, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'arguments must be an object'
  const properties = tool.inputSchema.properties || {}
  const unknown = Object.keys(input).find((key) => !(key in properties)); if (unknown) return `unknown argument: ${unknown}`
  const missing = (tool.inputSchema.required || []).find((key) => input[key] === undefined); if (missing) return `missing required argument: ${missing}`
  for (const [key, rule] of Object.entries(properties)) {
    const value = input[key]; if (value === undefined) continue
    if (rule.type === 'string' && typeof value !== 'string') return `${key} must be a string`
    if (rule.type === 'boolean' && typeof value !== 'boolean') return `${key} must be a boolean`
    if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`
    if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`
    if (rule.type === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return `${key} must be an object`
      const badField = tool.allowedFields && Object.keys(value).find((field) => !tool.allowedFields.includes(field)); if (badField) return `Unknown field: ${badField}`
      const badValue = Object.entries(value).find(([, fieldValue]) => typeof fieldValue !== 'string' || fieldValue.length > 200); if (badValue) return `${key}.${badValue[0]} must be a string of at most 200 characters`
    }
  }
  return ''
}

async function invokeExact(tool, args) {
  if (tool.name === 'artifact.copy') {
    const button = document.querySelector('[data-copy-prompt]')
    if (!button) return { ok: false, error: 'Generate a visible prompt preview first' }
    delete button.dataset.copyStatus
    button.click()
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      if (button.dataset.copyStatus === 'success') return { ok: true, copy_triggered: true }
      if (button.dataset.copyStatus === 'error') return { ok: false, error: 'Visible copy control reported failure' }
    }
    return { ok: false, error: 'Visible copy control did not settle' }
  }
  if (tool.name.startsWith('form.') && Object.keys(args.fields || {}).length) {
    const applied = window.__templateFormApplyFields?.(args.fields)
    if (!applied?.ok) return applied || { ok: false, error: 'Active form is not ready' }
  }
  if (tool.name === 'entity.create') return invoke('entity_create', { title: args.fields?.title })
  if (tool.name === 'entity.select') return invoke('entity_select', { index: Number(args.id) })
  if (tool.name === 'entity.delete') return invoke('entity_delete', { index: Number(args.id), confirm: args.confirm })
  return invoke(tool.invokeAs, args)
}

function unavailable(operation) {
  return { ok: false, unavailable: `${operation} is not available in this product workflow.` }
}

function visibleLibraryEntries(state) {
  const query = (state.libraryQuery || '').trim().toLowerCase()
  return state.library
    .map((record, originalIndex) => ({ record, originalIndex }))
    .filter(({ record }) => {
      if (state.libraryTechniqueFilter !== 'all' && record.technique !== state.libraryTechniqueFilter) return false
      if (!query) return true
      const haystack = `${record.title} ${record.promptText} ${record.technique}`.toLowerCase()
      return haystack.includes(query)
    })
    .sort((a, b) => {
      if (state.sortOrder === 'manual') return a.originalIndex - b.originalIndex
      return state.sortOrder === 'asc'
        ? a.record.title.localeCompare(b.record.title)
        : b.record.title.localeCompare(a.record.title)
    })
}

function visibleLibraryIndex(state, index) {
  if (!Number.isInteger(index) || index < 0) return null
  return visibleLibraryEntries(state)[index]?.originalIndex ?? null
}

async function invoke(name, args = {}) {
  const state = studioActions()
  if (name.startsWith('form_')) {
    const operation = name.slice(5)
    if (window.__templateFormCommand) return window.__templateFormCommand(operation)
    if (operation === 'return') {
      state.setView('forms')
      return { ok: true, returned: true }
    }
    if (operation === 'cancel') {
      state.setChrome({ assetPickerOpen: false, saveModalOpen: false, importModalOpen: false, exportPanelOpen: false })
      return { ok: true, cancelled: true }
    }
    if (operation === 'reset') {
      state.resetTechnique(state.activeTechnique)
      return { ok: true, reset: true }
    }
    if (operation === 'validate' || operation === 'submit' || operation === 'advance') {
      // Fallback when the active form bridge has not mounted yet: report store-level readiness.
      const technique = state.activeTechnique
      const draft = state.drafts[technique]
      const parsed = formSchemas[technique].safeParse({
        ...draft.fields,
        ...((technique === 'few-shot' || technique === 'role-based') ? { attachments: draft.attachments } : {}),
      })
      if (operation === 'validate') return { ok: true, valid: parsed.success }
      if (!parsed.success) return { ok: true, valid: false, submitted: false }
      const promptText = assemblePrompt(technique, draft.fields, draft.attachments || [])
      state.generatePrompt(technique, draft.fields, draft.attachments || [], promptText)
      return { ok: true, valid: true, submitted: true }
    }
    return unavailable(operation)
  }
  if (name === 'browse_open') {
    if (args.destination === 'library') state.setView('library')
    else if (techniqueIds.includes(args.destination)) state.selectTechnique(args.destination)
    else throw new Error('Destination is not declared.')
    return { ok: true, destination: args.destination }
  }
  if (name === 'browse_search') {
    state.setView('library')
    state.setLibraryQuery(String(args.query ?? ''))
    return { ok: true, query: String(args.query ?? ''), matches: visibleLibraryEntries(studioActions()).length }
  }
  if (name === 'browse_apply_filter') {
    const technique = args.technique || 'all'
    if (technique !== 'all' && !techniqueIds.includes(technique)) throw new Error('Filter technique is not declared.')
    state.setView('library')
    state.setLibraryTechniqueFilter(technique)
    return { ok: true, technique, matches: visibleLibraryEntries(studioActions()).length }
  }
  if (name === 'browse_clear_filter') {
    state.setLibraryTechniqueFilter('all')
    state.setLibraryQuery('')
    return { ok: true, cleared: true }
  }
  if (name === 'browse_sort') {
    if (args.order === 'asc' || args.order === 'desc') state.setSortOrder(args.order)
    else state.toggleSortOrder()
    return { ok: true, order: studioActions().sortOrder }
  }
  if (name === 'browse_set_locale') {
    if (args.locale !== 'en') throw new Error('Locale is not declared.')
    state.setLocale(args.locale)
    return { ok: true, locale: args.locale }
  }
  if (name === 'browse_set_theme') {
    if (args.theme !== 'light' && args.theme !== 'dark') throw new Error('Theme is not declared.')
    state.setTheme(args.theme)
    return { ok: true, theme: args.theme }
  }

  if (name === 'entity_create') {
    const current = studioActions()
    const technique = current.activeTechnique
    const draft = current.drafts[technique]
    const promptText = current.prompts[technique]
    const parsed = savePayloadSchema.safeParse({
      title: args.title,
      technique,
      fields: draft.fields,
      promptText: promptText || '',
      ...(draft.attachments.length ? { attachments: draft.attachments } : {}),
    })
    if (!parsed.success || !formSchemas[technique].safeParse({ ...draft.fields, ...(draft.attachments.length || technique === 'few-shot' || technique === 'role-based' ? { attachments: draft.attachments } : {}) }).success) {
      return { ok: false, validationError: 'Generate a valid current prompt before saving.' }
    }
    current.setChrome({ saveModalOpen: true })
    const saved = studioActions().saveCurrent(parsed.data.title)
    return { ok: Boolean(saved), title: saved?.title }
  }
  if (name === 'entity_select') {
    const originalIndex = visibleLibraryIndex(state, args.index)
    if (originalIndex === null) throw new Error('Library prompt index is out of range.')
    state.openLibraryEntry(originalIndex)
    return { ok: true, index: args.index }
  }
  if (name === 'entity_update') {
    const originalIndex = visibleLibraryIndex(state, args.index)
    if (originalIndex === null) throw new Error('Library prompt index is out of range.')
    const title = String(args.title || '').trim()
    if (title.length < 2 || title.length > 80) return { ok: false, validationError: 'Title must be 2–80 characters.' }
    state.updateLibraryEntry(originalIndex, { title })
    return { ok: true, index: args.index, title }
  }
  if (name === 'entity_delete') {
    if (args.confirm !== true) throw new Error('Delete requires confirm=true.')
    const originalIndex = visibleLibraryIndex(state, args.index)
    if (originalIndex === null) throw new Error('Library prompt index is out of range.')
    state.deleteLibraryEntry(originalIndex)
    return { ok: true, remaining: studioActions().library.length }
  }
  if (name === 'entity_toggle') {
    state.setView('library')
    const current = studioActions()
    current.setChrome({ exportPanelOpen: !current.exportPanelOpen })
    return { ok: true, exportPanelOpen: studioActions().exportPanelOpen }
  }
  if (name === 'entity_quantity') {
    return { ok: true, quantity: state.library.length }
  }
  if (name === 'entity_reorder') {
    const entries = visibleLibraryEntries(state)
    const fromVisible = args.fromIndex
    const toVisible = args.toIndex
    if (!Number.isInteger(fromVisible) || !Number.isInteger(toVisible)
      || fromVisible < 0 || toVisible < 0
      || fromVisible >= entries.length || toVisible >= entries.length) {
      throw new Error('Library prompt index is out of range.')
    }
    const order = entries.map((entry) => entry.originalIndex)
    const [moved] = order.splice(fromVisible, 1)
    order.splice(toVisible, 0, moved)
    const included = new Set(order)
    const library = order.map((index) => state.library[index])
    state.library.forEach((record, index) => {
      if (!included.has(index)) library.push(record)
    })
    state.replaceLibrary(library)
    state.setSortOrder('manual')
    return { ok: true, fromIndex: fromVisible, toIndex: toVisible }
  }

  if (name === 'artifact_copy') {
    const current = studioActions()
    if (args.target === 'prompt') {
      const text = current.prompts[current.activeTechnique]
      if (!text) return { ok: false, validationError: 'No active preview is available.' }
      await copyText(text)
    } else if (args.target === 'library') {
      await copyText(JSON.stringify(makeLibraryDocument(current.library), null, 2))
    } else throw new Error('Artifact target is not declared.')
    return { ok: true, copied: args.target }
  }
  if (name === 'artifact_import') {
    state.setView('library')
    state.setChrome({ importModalOpen: true })
    return { ok: true, workflow: 'import-modal-open' }
  }
  if (name === 'artifact_export') {
    const current = studioActions()
    if (args.format === 'json') {
      const text = JSON.stringify(makeLibraryDocument(current.library), null, 2)
      current.setView('library')
      current.setChrome({ exportPanelOpen: true })
      downloadText('template-library.json', text, 'application/json')
    } else if (args.format === 'markdown') {
      const text = current.prompts[current.activeTechnique]
      if (!text) return { ok: false, validationError: 'No active preview is available.' }
      downloadText(`${current.activeTechnique}-prompt.md`, markdownForPrompt(current.activeTechnique, text), 'text/markdown')
    } else throw new Error('Export format is not declared.')
    return { ok: true, exported: args.format }
  }
  if (name === 'artifact_print_preview') {
    state.setView(state.activeView)
    if (typeof window.print === 'function') window.print()
    return { ok: true, printed: true }
  }
  if (name === 'artifact_convert') {
    const current = studioActions()
    const text = current.prompts[current.activeTechnique]
    if (!text) return { ok: false, validationError: 'No active preview is available.' }
    downloadText(`${current.activeTechnique}-prompt.md`, markdownForPrompt(current.activeTechnique, text), 'text/markdown')
    return { ok: true, converted: 'markdown' }
  }
  throw new Error(`Unknown registered tool: ${name}`)
}

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'Template Forms',
    modules: ['form-workflow-v1', 'browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tool_names: tools.map((tool) => tool.name),
    tool_count: tools.length,
  })
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    if (name && typeof name === 'object') { args = name.arguments || {}; name = name.name }
    const tool = tools.find((candidate) => candidate.name === name)
    if (!tool) return { ok: false, error: `unknown_tool: ${name}` }
    const error = validateInput(tool, args); if (error) return { ok: false, error }
    try { return await invokeExact(tool, args) } catch (cause) { return { ok: false, error: String(cause?.message || cause) } }
  }
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  }
  try {
    if (navigator.modelContext?.registerTool) tools.forEach((tool) => navigator.modelContext.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, invoke: (args) => window.webmcp_invoke_tool(tool.name, args || {}) }))
  } catch { /* Window bridge remains available when native registration is unsupported. */ }
}
