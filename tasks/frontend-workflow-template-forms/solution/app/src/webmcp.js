import { formSchemas, makeLibraryDocument, markdownForPrompt, savePayloadSchema, techniqueIds } from './domain'
import { studioActions } from './store'
import { copyText, downloadText } from './components/PreviewPanel'

const destinationSchema = { type: 'string', enum: [...techniqueIds, 'library'] }
const emptySchema = { type: 'object', properties: {}, additionalProperties: false }

const tools = [
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
  ...['search', 'apply_filter', 'clear_filter', 'sort', 'set_locale', 'set_theme'].map((operation) => ({
    name: `browse_${operation}`,
    description: `${operation.replaceAll('_', ' ')} for the library-prompts collection when supported.`,
    inputSchema: emptySchema,
  })),
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
    name: 'entity_delete',
    description: 'Delete a library-prompt by index; explicit confirmation is required.',
    inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0 }, confirm: { type: 'boolean' } }, required: ['index', 'confirm'], additionalProperties: false },
  },
  ...['update', 'toggle', 'quantity', 'reorder'].map((operation) => ({
    name: `entity_${operation}`,
    description: `${operation} a library-prompt when supported by the visible product.`,
    inputSchema: emptySchema,
  })),
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
  ...['print_preview', 'convert'].map((operation) => ({
    name: `artifact_${operation}`,
    description: `${operation.replaceAll('_', ' ')} when supported by the visible product.`,
    inputSchema: emptySchema,
  })),
]

function unavailable(operation) {
  return { ok: false, unavailable: `${operation} is not available in this product workflow.` }
}

async function invoke(name, args = {}) {
  const state = studioActions()
  if (name.startsWith('form_')) {
    const operation = name.slice(5)
    if (window.__templateFormCommand) return window.__templateFormCommand(operation)
    return unavailable(operation)
  }
  if (name === 'browse_open') {
    if (args.destination === 'library') state.setView('library')
    else if (techniqueIds.includes(args.destination)) state.selectTechnique(args.destination)
    else throw new Error('Destination is not declared.')
    return { ok: true, destination: args.destination }
  }
  if (name.startsWith('browse_')) return unavailable(name.slice(7))

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
    if (!state.library[args.index]) throw new Error('Library prompt index is out of range.')
    state.openLibraryEntry(args.index)
    return { ok: true, index: args.index }
  }
  if (name === 'entity_delete') {
    if (args.confirm !== true) throw new Error('Delete requires confirm=true.')
    if (!state.library[args.index]) throw new Error('Library prompt index is out of range.')
    state.deleteLibraryEntry(args.index)
    return { ok: true, remaining: studioActions().library.length }
  }
  if (name.startsWith('entity_')) return unavailable(name.slice(7))

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
  if (name.startsWith('artifact_')) return unavailable(name.slice(9))
  throw new Error(`Unknown registered tool: ${name}`)
}

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    product: 'Template Forms',
    modules: ['form-workflow-v1', 'browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    tools: tools.map((tool) => tool.name),
  })
  window.webmcp_list_tools = () => ({ tools })
  window.webmcp_invoke_tool = invoke
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  }
}
