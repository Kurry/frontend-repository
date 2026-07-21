import { createCardSchema } from './schemas.js'
import { getBoardState } from './store.js'

const cardColumns = ['backlog', 'in-progress', 'review', 'done']
const statusValues = ['pending', 'running', 'retrying', 'failed', 'complete']

const schemas = {
  cardId: { type: 'string', minLength: 1 },
  column: { type: 'string', enum: cardColumns },
}

const legacyTools = [
  {
    name: 'entity_create_card',
    description: 'Create one validated card through the same command as Add Card.',
    inputSchema: { type: 'object', required: ['title', 'column'], properties: {
      title: { type: 'string', minLength: 1, maxLength: 120 }, description: { type: 'string', maxLength: 2000 },
      column: schemas.column, position: { type: 'integer', minimum: 0 }, assignee: { type: ['string', 'null'] }, 'attached-prompt': { type: ['string', 'null'] },
    }, additionalProperties: false },
    execute: async (args) => {
      const state = getBoardState()
      const schema = createCardSchema(state.prompts.map((item) => item.id), state.assignees.map((item) => item.id))
      const parsed = schema.safeParse({
        title: args.title ?? '', description: args.description ?? '', column: args.column,
        position: args.position ?? 0, assignee: args.assignee ?? '', attached_prompt: args['attached-prompt'] ?? '',
      })
      if (!parsed.success) return { success: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) }
      const id = state.createCard(parsed.data)
      return { success: true, card_id: id, workflow_completion: 'column-counts' }
    },
  },
  {
    name: 'entity_select_card', description: 'Open a card detail view.',
    inputSchema: { type: 'object', required: ['card_id'], properties: { card_id: schemas.cardId }, additionalProperties: false },
    execute: async ({ card_id }) => { const state = getBoardState(); if (!state.cards[card_id]) return { success: false, error: 'Card not found.' }; state.setDetailId(card_id); return { success: true, visible: 'card-detail' } },
  },
  {
    name: 'entity_update_card', description: 'Update declared card fields, including moving a card.',
    inputSchema: { type: 'object', required: ['card_id'], properties: {
      card_id: schemas.cardId, title: { type: 'string', minLength: 1, maxLength: 120 }, description: { type: 'string', maxLength: 2000 },
      column: schemas.column, position: { type: 'integer', minimum: 0 }, assignee: { type: ['string', 'null'] }, 'attached-prompt': { type: ['string', 'null'] },
      comment: { type: 'string', minLength: 1, maxLength: 1000 }, status: { type: 'string', enum: statusValues },
    }, additionalProperties: false },
    execute: async (args) => {
      const state = getBoardState(); const card = state.cards[args.card_id]
      if (!card) return { success: false, error: 'Card not found.' }
      const targetColumn = args.column || card.column
      let moved = false
      if ((args.column && args.column !== card.column) || Number.isInteger(args.position)) {
        moved = state.moveCard(args.card_id, targetColumn, args.position ?? state.order[targetColumn].length)
      }
      const edits = Object.fromEntries(['title', 'description', 'assignee'].filter((key) => key in args).map((key) => [key, args[key]]))
      if ('attached-prompt' in args) edits.attached_prompt = args['attached-prompt']
      if (Object.keys(edits).length) state.updateCard(args.card_id, edits)
      if (typeof args.comment === 'string' && args.comment.trim()) state.addComment(args.card_id, args.comment)
      if (args.status === 'running') state.runCard(args.card_id)
      return { success: true, moved, workflow_completion: 'column-counts' }
    },
  },
  {
    name: 'entity_delete_card', description: 'Delete a card after explicit confirmation.',
    inputSchema: { type: 'object', required: ['card_id', 'confirm'], properties: { card_id: schemas.cardId, confirm: { type: 'boolean', const: true } }, additionalProperties: false },
    execute: async ({ card_id, confirm }) => ({ success: confirm === true && getBoardState().deleteCard(card_id) }),
  },
  {
    name: 'entity_reorder_card', description: 'Reorder a card to a zero-based position.',
    inputSchema: { type: 'object', required: ['card_id', 'column', 'position'], properties: { card_id: schemas.cardId, column: schemas.column, position: { type: 'integer', minimum: 0 } }, additionalProperties: false },
    execute: async ({ card_id, column, position }) => ({ success: getBoardState().moveCard(card_id, column, position), workflow_completion: 'column-counts' }),
  },
  {
    name: 'entity_toggle_card', description: 'Toggle one card in the board selection.',
    inputSchema: { type: 'object', required: ['card_id'], properties: { card_id: schemas.cardId }, additionalProperties: false },
    execute: async ({ card_id }) => { const state = getBoardState(); if (!state.cards[card_id]) return { success: false, error: 'Card not found.' }; state.toggleSelection(card_id); return { success: true, selected: getBoardState().selection.includes(card_id) } },
  },
  {
    name: 'form_validate_card', description: 'Validate the Add Card form using the product schema.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, column: schemas.column, assignee: { type: ['string', 'null'] }, 'attached-prompt': { type: ['string', 'null'] } }, additionalProperties: false },
    execute: async (args) => {
      const state = getBoardState()
      const column = args.column ?? state.createColumn ?? 'backlog'
      const seed = {
        title: args.title ?? '',
        description: args.description ?? '',
        attached_prompt: args['attached-prompt'] ?? '',
        assignee: args.assignee ?? '',
      }
      state.setCreateFormSeed(seed)
      if (!state.createColumn) state.setCreateColumn(column)
      const schema = createCardSchema(state.prompts.map((item) => item.id), state.assignees.map((item) => item.id))
      const result = schema.safeParse({
        title: seed.title,
        description: seed.description,
        column,
        position: 0,
        assignee: seed.assignee,
        attached_prompt: seed.attached_prompt,
      })
      if (result.success) {
        state.setCreateFormErrors({})
        return { success: true, valid: true }
      }
      const errors = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]
        if (key && !errors[key]) errors[key] = issue.message
      })
      // Defer so the freshly mounted modal registers setError first.
      queueMicrotask(() => getBoardState().setCreateFormErrors(errors))
      return {
        success: false,
        valid: false,
        errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      }
    },
  },
  {
    name: 'form_submit_card', description: 'Submit a validated Add Card form.',
    inputSchema: { type: 'object', required: ['title', 'column'], properties: { title: { type: 'string' }, description: { type: 'string' }, column: schemas.column, assignee: { type: ['string', 'null'] }, 'attached-prompt': { type: ['string', 'null'] } }, additionalProperties: false },
    execute: async (args) => {
      const state = getBoardState()
      const seed = {
        title: args.title ?? '',
        description: args.description ?? '',
        attached_prompt: args['attached-prompt'] ?? '',
        assignee: args.assignee ?? '',
      }
      state.setCreateFormSeed(seed)
      if (!state.createColumn) state.setCreateColumn(args.column)
      const schema = createCardSchema(state.prompts.map((item) => item.id), state.assignees.map((item) => item.id))
      const parsed = schema.safeParse({
        title: seed.title,
        description: seed.description,
        column: args.column,
        position: 0,
        assignee: seed.assignee,
        attached_prompt: seed.attached_prompt,
      })
      if (!parsed.success) {
        const errors = {}
        parsed.error.issues.forEach((issue) => {
          const key = issue.path[0]
          if (key && !errors[key]) errors[key] = issue.message
        })
        state.setCreateFormErrors(errors)
        return {
          success: false,
          errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        }
      }
      state.setCreateFormErrors({})
      const id = state.createCard(parsed.data)
      state.setCreateColumn(null)
      return { success: true, card_id: id, workflow_completion: 'column-counts' }
    },
  },
  {
    name: 'form_cancel_card', description: 'Cancel the currently visible card form.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => { const state = getBoardState(); state.setCreateColumn(null); state.setDetailId(null); return { success: true } },
  },
  {
    name: 'session_start_card_execution', description: 'Start the selected card execution simulation.',
    inputSchema: { type: 'object', required: ['card_id'], properties: { card_id: schemas.cardId, demo: { type: 'string', enum: ['card-execution', 'seeded-failing-run'] } }, additionalProperties: false },
    execute: async ({ card_id }) => { const state = getBoardState(); if (!state.cards[card_id]) return { success: false, error: 'Card not found.' }; state.runCard(card_id); return { success: true, workflow_completion: 'status-chip-label' } },
  },
  {
    name: 'session_restart_card_execution', description: 'Restart a card execution from the beginning.',
    inputSchema: { type: 'object', required: ['card_id'], properties: { card_id: schemas.cardId }, additionalProperties: false },
    execute: async ({ card_id }) => { const state = getBoardState(); if (!state.cards[card_id]) return { success: false, error: 'Card not found.' }; state.runCard(card_id, true); return { success: true, workflow_completion: 'card-progress-n-of-m' } },
  },
  ...['json', 'markdown'].map((format) => ({
    name: `artifact_export_${format}`, description: `Open the Export drawer on the ${format} preview.`,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => { const state = getBoardState(); state.setExportFormat(format); state.setExportOpen(true); return { success: true, format, visible: 'export-preview' } },
  })),
  {
    name: 'artifact_import_board_json', description: 'Open the board JSON import surface. Artifact contents stay in the visible form.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => { getBoardState().setExportOpen(true); return { success: true, mode: 'board-json', visible: 'import-field' } },
  },
  {
    name: 'artifact_copy_export', description: 'Open the exact export preview for user-observed clipboard copying.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'markdown'] } }, additionalProperties: false },
    execute: async ({ format = 'json' }) => { const state = getBoardState(); state.setExportFormat(format); state.setExportOpen(true); return { success: true, format, visible: 'export-preview', clipboard_requires_visible_action: true } },
  },
]

const entityFields = ['title', 'description', 'column', 'position', 'assignee', 'attached-prompt', 'comment', 'status']
const formFields = ['title', 'description', 'attached-prompt', 'assignee', 'comment', 'import']
const objectSchema = (properties = {}, required = []) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) })
const stringFieldsSchema = { type: 'object', additionalProperties: { type: 'string', maxLength: 200 } }
const emptySchema = objectSchema()

function currentCardId() {
  const state = getBoardState()
  return state.detailId || state.selection[0] || Object.keys(state.cards)[0] || null
}

async function legacy(name, args = {}) {
  const tool = legacyTools.find((item) => item.name === name)
  if (!tool) return { ok: false, error: `Internal handler unavailable: ${name}` }
  const result = await tool.execute(args)
  return { ok: result?.success !== false, ...result }
}

const tools = [
  { name: 'entity.create', description: 'Create an entity using declared fields.', inputSchema: objectSchema({ fields: stringFieldsSchema }), allowedFields: entityFields, execute: ({ fields = {} }) => legacy('entity_create_card', { ...fields, position: fields.position === undefined ? undefined : Number(fields.position), column: fields.column || 'backlog' }) },
  { name: 'entity.select', description: 'Select an entity by public id.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 } }, ['id']), execute: ({ id }) => legacy('entity_select_card', { card_id: id }) },
  { name: 'entity.update', description: 'Update declared fields on an entity.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, fields: stringFieldsSchema }, ['id', 'fields']), allowedFields: entityFields, execute: ({ id, fields }) => legacy('entity_update_card', { card_id: id, ...fields, position: fields.position === undefined ? undefined : Number(fields.position) }) },
  { name: 'entity.delete', description: 'Delete an entity with explicit confirmation.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, confirm: { type: 'boolean', const: true } }, ['id', 'confirm']), execute: ({ id, confirm }) => legacy('entity_delete_card', { card_id: id, confirm }) },
  { name: 'entity.toggle', description: 'Toggle a boolean field on an entity.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, field: { type: 'string', enum: entityFields } }, ['id']), execute: ({ id }) => legacy('entity_toggle_card', { card_id: id }) },
  { name: 'entity.reorder', description: 'Reorder an entity by index when gesture mechanics are excluded.', inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, to_index: { type: 'integer', minimum: 0 } }, ['id', 'to_index']), execute: ({ id, to_index }) => { const card = getBoardState().cards[id]; return card ? legacy('entity_reorder_card', { card_id: id, column: card.column, position: to_index }) : { ok: false, error: 'Card not found.' } } },
  { name: 'form.validate', description: 'Run declared form validation.', inputSchema: objectSchema({ fields: stringFieldsSchema }), allowedFields: formFields, execute: ({ fields = {} }) => legacy('form_validate_card', fields) },
  { name: 'form.submit', description: 'Submit the form through the visible handler.', inputSchema: objectSchema({ fields: stringFieldsSchema }), allowedFields: formFields, execute: ({ fields = {} }) => legacy('form_submit_card', { ...fields, column: getBoardState().createColumn || 'backlog' }) },
  { name: 'form.cancel', description: 'Cancel the active form workflow.', inputSchema: emptySchema, execute: () => legacy('form_cancel_card') },
  { name: 'session.start', description: 'Invoke session operation: start.', inputSchema: emptySchema, execute: () => { const id = currentCardId(); return id ? legacy('session_start_card_execution', { card_id: id }) : { ok: false, error: 'No visible card' } } },
  { name: 'session.restart', description: 'Invoke session operation: restart.', inputSchema: emptySchema, execute: () => { const id = currentCardId(); return id ? legacy('session_restart_card_execution', { card_id: id }) : { ok: false, error: 'No visible card' } } },
  { name: 'artifact.import', description: 'Start a declared import mode (no file bytes in WebMCP).', inputSchema: objectSchema({ mode: { type: 'string', enum: ['board-json'] } }, ['mode']), execute: () => legacy('artifact_import_board_json') },
  { name: 'artifact.export', description: 'Export using a declared format (no blob/base64 in results).', inputSchema: objectSchema({ format: { type: 'string', enum: ['json', 'markdown'] } }, ['format']), execute: ({ format }) => legacy(`artifact_export_${format}`) },
  { name: 'artifact.copy', description: 'Trigger copy via the visible control (clipboard verified in Playwright).', inputSchema: emptySchema, execute: async () => { const state = getBoardState(); state.setExportOpen(true); await new Promise((resolve) => setTimeout(resolve, 0)); const button = document.querySelector('[data-export-copy]'); if (!button) return { ok: false, error: 'Visible copy control not found' }; delete button.dataset.copyStatus; button.click(); for (let attempt = 0; attempt < 100; attempt += 1) { await new Promise((resolve) => setTimeout(resolve, 20)); if (button.dataset.copyStatus === 'success') return { ok: true, copy_triggered: true }; if (button.dataset.copyStatus === 'error') return { ok: false, error: 'Visible copy control reported failure' } } return { ok: false, error: 'Visible copy control did not settle' } } },
]

function validateInput(tool, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'arguments must be an object'
  const schema = tool.inputSchema
  const properties = schema.properties || {}
  const unknown = Object.keys(input).find((key) => !(key in properties)); if (unknown) return `unknown argument: ${unknown}`
  const missing = (schema.required || []).find((key) => input[key] === undefined); if (missing) return `missing required argument: ${missing}`
  for (const [key, rule] of Object.entries(properties)) {
    const value = input[key]; if (value === undefined) continue
    if (rule.type === 'string' && typeof value !== 'string') return `${key} must be a string`
    if (rule.type === 'boolean' && typeof value !== 'boolean') return `${key} must be a boolean`
    if (rule.type === 'integer' && (!Number.isInteger(value) || value < (rule.minimum || 0))) return `${key} must be a non-negative integer`
    if (rule.type === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return `${key} must be an object`
      const badField = tool.allowedFields && Object.keys(value).find((field) => !tool.allowedFields.includes(field)); if (badField) return `Unknown field: ${badField}`
      const badValue = Object.entries(value).find(([, fieldValue]) => typeof fieldValue !== 'string' || fieldValue.length > 200); if (badValue) return `${key}.${badValue[0]} must be a string of at most 200 characters`
    }
    if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`
    if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`
  }
  return ''
}

export function registerWebMCP() {
  window.webmcp_tools = tools
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    if (name && typeof name === 'object') { args = name.arguments || {}; name = name.name }
    const tool = tools.find((item) => item.name === name)
    if (!tool) return { ok: false, error: `unknown_tool: ${name}` }
    const error = validateInput(tool, args); if (error) return { ok: false, error }
    try { return await tool.execute(args) } catch (cause) { return { ok: false, error: String(cause?.message || cause) } }
  }
  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['entity-collection-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'], tool_names: tools.map((tool) => tool.name), tool_count: tools.length, app: 'PromptOps Execution Board' })
  if (navigator.modelContext?.registerTool) {
    tools.forEach((tool) => {
      try { navigator.modelContext.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, invoke: (args) => window.webmcp_invoke_tool(tool.name, args || {}) }) } catch { /* Browser bridge globals remain available. */ }
    })
  }
}
