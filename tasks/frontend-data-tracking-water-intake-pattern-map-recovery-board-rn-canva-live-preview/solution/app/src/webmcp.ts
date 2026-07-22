import { v4 as uuidv4 } from 'uuid'
import type { State } from './store'
import type { EventStatus, IntakeEvent } from './types'
import { exportArtifact, validateArtifact } from './utils/artifact'

// Use a singleton approach to hold a dispatch reference, so WebMCP can trigger state changes
let _dispatch: any = null
let _getState: () => State = () => ({
  records: [],
  history: [],
  selectedRecordId: null,
  filter: 'all'
})

export function registerWebMCP(dispatch: any, getState: () => State) {
  _dispatch = dispatch
  _getState = getState

  if (typeof window !== 'undefined') {
    (window as any).webmcp_session_info = async () => ({
      task_id: 'eval-intelligence/frontend-data-tracking-water-intake-pattern-map-recovery-board-rn-canva-live-preview',
      contract_version: 'zto-webmcp-v1',
      supported_modules: [
        'structured-editor-v1',
        'entity-collection-v1',
        'artifact-transfer-v1'
      ]
    });

    (window as any).webmcp_list_tools = async () => [
      // structured-editor-v1 tools
      {
        name: 'editor_select',
        description: 'Select an object (recovery-board)',
        inputSchema: {
          type: 'object',
          properties: {
            object_type: { type: 'string', enum: ['recovery-board'] },
            id: { type: 'string' }
          },
          required: ['object_type', 'id']
        }
      },
      {
        name: 'editor_update_property',
        description: 'Update a property on the recovery board',
        inputSchema: {
          type: 'object',
          properties: {
            object_type: { type: 'string', enum: ['recovery-board'] },
            id: { type: 'string' },
            property: { type: 'string', enum: ['status'] },
            value: { type: 'string', enum: ['empty', 'draft', 'ready', 'changed', 'archived'] }
          },
          required: ['object_type', 'id', 'property', 'value']
        }
      },

      // entity-collection-v1 tools
      {
        name: 'entity_create_record',
        description: 'Create an event',
        inputSchema: {
          type: 'object',
          properties: {
            entity: { type: 'string', enum: ['event'] },
            fields: { type: 'object' }
          },
          required: ['entity', 'fields']
        }
      },
      {
        name: 'entity_select_record',
        description: 'Select an event',
        inputSchema: {
          type: 'object',
          properties: {
            entity: { type: 'string', enum: ['event'] },
            id: { type: 'string' }
          },
          required: ['entity', 'id']
        }
      },
      {
        name: 'entity_update_record',
        description: 'Update an event',
        inputSchema: {
          type: 'object',
          properties: {
            entity: { type: 'string', enum: ['event'] },
            id: { type: 'string' },
            fields: { type: 'object' }
          },
          required: ['entity', 'id', 'fields']
        }
      },
      {
        name: 'entity_delete_record',
        description: 'Delete an event',
        inputSchema: {
          type: 'object',
          properties: {
            entity: { type: 'string', enum: ['event'] },
            id: { type: 'string' },
            confirm: { type: 'boolean' }
          },
          required: ['entity', 'id', 'confirm']
        }
      },

      // artifact-transfer-v1 tools
      {
        name: 'artifact_export_session_json',
        description: 'Export the session as JSON',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['hydration-pattern-v1-recovery-board.json'] }
          },
          required: ['format']
        }
      },
      {
        name: 'artifact_import_session_json',
        description: 'Import session JSON',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['json'] },
            content: { type: 'string' }
          },
          required: ['mode', 'content']
        }
      }
    ];

    (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
      const state = _getState()

      switch (name) {
        // structured-editor-v1
        case 'editor_select': {
          _dispatch({ type: 'SELECT_RECORD', id: args.id })
          return { success: true }
        }
        case 'editor_update_property': {
          if (args.property === 'status') {
             _dispatch({ type: 'MOVE_RECOVERY', id: args.id, status: args.value as EventStatus })
             return { success: true }
          }
          return { success: false, error: 'Unknown property' }
        }

        // entity-collection-v1
        case 'entity_create_record': {
          const newId = uuidv4()
          _dispatch({
            type: 'ADD_RECORD',
            record: {
              id: newId,
              title: args.fields.title || 'New Event',
              amount: args.fields.amount || 0,
              status: args.fields.status || 'draft'
            }
          })
          return { success: true, id: newId }
        }
        case 'entity_select_record': {
          _dispatch({ type: 'SELECT_RECORD', id: args.id })
          return { success: true }
        }
        case 'entity_update_record': {
          const existing = state.records.find((r: IntakeEvent) => r.id === args.id)
          if (!existing) return { success: false, error: 'Not found' }
          _dispatch({
            type: 'UPDATE_RECORD',
            record: {
              ...existing,
              ...args.fields
            }
          })
          return { success: true }
        }
        case 'entity_delete_record': {
          if (!args.confirm) return { success: false, error: 'confirm=true required' }
          _dispatch({ type: 'DELETE_RECORD', id: args.id })
          return { success: true }
        }

        // artifact-transfer-v1
        case 'artifact_export_session_json': {
          const content = exportArtifact(state)
          return { success: true, content }
        }
        case 'artifact_import_session_json': {
          const validated = validateArtifact(args.content)
          if (!validated) {
            return { success: false, error: 'Malformed import or invalid schema' }
          }
          _dispatch({ type: 'IMPORT_SESSION', session: validated })
          return { success: true }
        }

        default:
          return { success: false, error: `Unknown tool: ${name}` }
      }
    };
  }
}
