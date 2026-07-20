import { FIELD_TYPES } from './schemas'

function toolResult(ok, message, data = {}) {
  return {
    content: [{ type: 'text', text: message }],
    structuredContent: { ok, message, ...data },
  }
}

function dispatch(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(`docuseal:${name}`, { detail }))
}

export function registerWebMCP(store) {
  if (window.__docusealWebMCPRegistered) return true
  const stringId = { type: 'string', minLength: 1, maxLength: 120 }
  const tools = [
    {
      name: 'editor_add', description: 'Add a field of a declared type to the active document and submitter.',
      inputSchema: { type: 'object', properties: { type: { type: 'string', enum: FIELD_TYPES } }, required: ['type'], additionalProperties: false },
      execute: ({ type }) => {
        const field = store.addField(type)
        return field ? toolResult(true, `${type} field added and selected.`, { field_id: field.id }) : toolResult(false, 'Field could not be added.')
      },
    },
    {
      name: 'editor_select', description: 'Select a visible field by its product field identifier.',
      inputSchema: { type: 'object', properties: { field_id: stringId, additive: { type: 'boolean' } }, required: ['field_id'], additionalProperties: false },
      execute: ({ field_id, additive = false }) => {
        const ok = store.selectField(field_id, additive)
        return toolResult(ok, ok ? 'Field selected.' : 'Field was not found.')
      },
    },
    {
      name: 'editor_delete', description: 'Delete one declared field using the editor command.',
      inputSchema: { type: 'object', properties: { field_id: stringId }, required: ['field_id'], additionalProperties: false },
      execute: ({ field_id }) => toolResult(store.deleteFields([field_id]), 'Field delete requested.'),
    },
    {
      name: 'editor_update_property', description: 'Update one allowed field property using normal product validation.',
      inputSchema: {
        type: 'object',
        properties: {
          field_id: stringId,
          property: { type: 'string', enum: ['name', 'required', 'submitter'] },
          value: { oneOf: [{ type: 'string', maxLength: 80 }, { type: 'boolean' }] },
        },
        required: ['field_id', 'property', 'value'], additionalProperties: false,
      },
      execute: ({ field_id, property, value }) => {
        const result = store.updateField(field_id, property, value)
        return toolResult(result.ok, result.ok ? 'Field property updated.' : result.error)
      },
    },
    {
      name: 'editor_preview', description: 'Open the document signing preview.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: () => toolResult(store.setMode('preview'), 'Signing preview opened.', { mode: 'preview' }),
    },
    {
      name: 'editor_switch_mode', description: 'Switch the structured editor between build and preview.',
      inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['build', 'preview'] } }, required: ['mode'], additionalProperties: false },
      execute: ({ mode }) => toolResult(store.setMode(mode), `Editor switched to ${mode}.`, { mode }),
    },
    {
      name: 'entity_create', description: 'Create a submitter with a validated name and CSS hex colour.',
      inputSchema: {
        type: 'object', properties: {
          name: { type: 'string', minLength: 1, maxLength: 64 },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        }, required: ['name', 'color'], additionalProperties: false,
      },
      execute: (payload) => {
        const result = store.addSubmitter(payload)
        return toolResult(result.ok, result.ok ? 'Submitter created and selected.' : result.error, result.ok ? { submitter_id: result.submitter.id } : {})
      },
    },
    {
      name: 'entity_select', description: 'Make one existing submitter active for future fields.',
      inputSchema: { type: 'object', properties: { submitter_id: stringId }, required: ['submitter_id'], additionalProperties: false },
      execute: ({ submitter_id }) => toolResult(store.selectSubmitter(submitter_id), 'Submitter selection requested.'),
    },
    {
      name: 'entity_update', description: 'Update one declared submitter field using product validation.',
      inputSchema: {
        type: 'object', properties: {
          submitter_id: stringId,
          field: { type: 'string', enum: ['name', 'color'] },
          value: { type: 'string', minLength: 1, maxLength: 64 },
        }, required: ['submitter_id', 'field', 'value'], additionalProperties: false,
      },
      execute: ({ submitter_id, field, value }) => {
        const result = store.updateSubmitter(submitter_id, { [field]: value })
        return toolResult(result.ok, result.ok ? 'Submitter updated.' : result.error)
      },
    },
    {
      name: 'entity_delete', description: 'Delete an unused submitter after explicit confirmation.',
      inputSchema: {
        type: 'object', properties: { submitter_id: stringId, confirm: { type: 'boolean', const: true } },
        required: ['submitter_id', 'confirm'], additionalProperties: false,
      },
      execute: ({ submitter_id, confirm }) => {
        const result = store.deleteSubmitter(submitter_id, confirm)
        return toolResult(result.ok, result.ok ? 'Submitter deleted.' : result.error)
      },
    },
    {
      name: 'form_validate', description: 'Validate the active signing template with the API-shaped schema.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: () => {
        const result = store.validateTemplate({ forSigning: true })
        return toolResult(result.ok, result.ok ? 'Template is valid for signing.' : result.error)
      },
    },
    {
      name: 'form_submit', description: 'Send the active validated template for signing.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: () => {
        const result = store.sendForSigning()
        return toolResult(result.ok, result.ok ? store.statusLabel : result.error)
      },
    },
    {
      name: 'form_advance', description: 'Advance the pending signing workflow by one submitter.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: () => {
        const result = store.advanceSigning()
        return toolResult(result.ok, result.ok ? store.statusLabel : result.error)
      },
    },
    {
      name: 'artifact_export', description: 'Open the export surface for a declared artifact format.',
      inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'markdown'] } }, required: ['format'], additionalProperties: false },
      execute: ({ format }) => {
        dispatch('open-export', { format })
        return toolResult(true, `${format} export preview opened.`, { format })
      },
    },
    {
      name: 'artifact_import', description: 'Open the validated template-package import surface.',
      inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['template-package'], default: 'template-package' } }, additionalProperties: false },
      execute: () => {
        dispatch('open-import')
        return toolResult(true, 'Template-package import surface opened.', { mode: 'template-package' })
      },
    },
    {
      name: 'artifact_copy', description: 'Open an artifact preview so its visible Copy control can be used.',
      inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'markdown'] } }, required: ['format'], additionalProperties: false },
      execute: ({ format }) => {
        dispatch('open-export', { format, focusCopy: true })
        return toolResult(true, `${format} artifact is ready at the visible Copy control.`, { format })
      },
    },
  ]

  const publicTools = tools.map(({ execute, ...definition }) => definition)
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: [
      { id: 'structured-editor-v1', operations: ['add', 'select', 'delete', 'update_property', 'preview', 'switch_mode'] },
      { id: 'entity-collection-v1', entity: 'submitter', operations: ['create', 'select', 'update', 'delete'] },
      { id: 'form-workflow-v1', operations: ['validate', 'submit', 'advance'] },
      { id: 'artifact-transfer-v1', operations: ['export', 'import', 'copy'] },
    ],
    tool_names: publicTools.map((tool) => tool.name),
  })
  window.webmcp_list_tools = () => publicTools
  window.webmcp_invoke_tool = async (request, suppliedArguments = {}) => {
    const name = typeof request === 'string' ? request : request?.name
    const args = typeof request === 'string' ? suppliedArguments : request?.arguments || suppliedArguments
    const tool = tools.find((item) => item.name === name)
    if (!tool) return { ok: false, error: `Unknown WebMCP tool: ${name || 'missing name'}.` }
    const result = tool.execute(args || {})
    const payload = result?.structuredContent || result || {}
    return { ok: !!payload.ok, ...payload }
  }

  const context = navigator.modelContext
  if (context?.registerTool) tools.forEach((tool) => context.registerTool(tool))
  window.__docusealWebMCPRegistered = true
  return true
}
