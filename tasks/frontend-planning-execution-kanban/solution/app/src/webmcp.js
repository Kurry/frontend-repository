import { createCardSchema } from './schemas.js'
import { getBoardState } from './store.js'

const cardColumns = ['backlog', 'in-progress', 'review', 'done']
const statusValues = ['pending', 'running', 'retrying', 'failed', 'complete']

const schemas = {
  cardId: { type: 'string', minLength: 1 },
  column: { type: 'string', enum: cardColumns },
}

const tools = [
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
      column: schemas.column, position: { type: 'integer', minimum: 0 }, assignee: { type: ['string', 'null'] }, 'attached-prompt': { type: ['string', 'null'] }, status: { type: 'string', enum: statusValues },
    }, additionalProperties: false },
    execute: async (args) => {
      const state = getBoardState(); const card = state.cards[args.card_id]
      if (!card) return { success: false, error: 'Card not found.' }
      if (args.column || Number.isInteger(args.position)) state.moveCard(args.card_id, args.column || card.column, args.position ?? state.order[args.column || card.column].length)
      const edits = Object.fromEntries(['title', 'description', 'assignee'].filter((key) => key in args).map((key) => [key, args[key]]))
      if ('attached-prompt' in args) edits.attached_prompt = args['attached-prompt']
      if (Object.keys(edits).length) state.updateCard(args.card_id, edits)
      if (args.status === 'running') state.runCard(args.card_id)
      return { success: true, workflow_completion: 'column-counts' }
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
      const state = getBoardState(); const schema = createCardSchema(state.prompts.map((item) => item.id), state.assignees.map((item) => item.id))
      const result = schema.safeParse({ title: args.title ?? '', description: args.description ?? '', column: args.column ?? state.createColumn ?? 'backlog', position: 0, assignee: args.assignee ?? '', attached_prompt: args['attached-prompt'] ?? '' })
      return result.success ? { success: true, valid: true } : { success: false, valid: false, errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) }
    },
  },
  {
    name: 'form_submit_card', description: 'Submit a validated Add Card form.',
    inputSchema: { type: 'object', required: ['title', 'column'], properties: { title: { type: 'string' }, description: { type: 'string' }, column: schemas.column, assignee: { type: ['string', 'null'] }, 'attached-prompt': { type: ['string', 'null'] } }, additionalProperties: false },
    execute: async (args) => tools.find((tool) => tool.name === 'entity_create_card').execute(args),
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

export function registerWebMCP() {
  window.webmcp_tools = tools
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = tools.find((item) => item.name === name)
    if (!tool) return { success: false, error: `Unknown tool: ${name}` }
    return tool.execute(args)
  }
  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', tool_count: tools.length, app: 'PromptOps Execution Board' })
  if (navigator.modelContext?.registerTool) {
    tools.forEach((tool) => {
      try { navigator.modelContext.registerTool(tool) } catch { /* Browser bridge globals remain available. */ }
    })
  }
}
