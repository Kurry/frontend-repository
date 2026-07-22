import { useStore } from './store';


declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any;
    webmcp_invoke_tool: (tool: string, args: any) => Promise<any>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => {
    return {
      appName: 'Bike Maintenance Mileage Map',
      version: '1.0.0'
    };
  };

  window.webmcp_list_tools = () => {
    return [
      // Entity collection
      {
        name: 'entity_create',
        description: 'Creates a new bike service record.',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['empty', 'draft', 'ready', 'changed', 'archived'] },
            mileage: { type: 'number' },
            notes: { type: 'string' },
            owner: { type: 'string', enum: ['unassigned', 'mechanic_a', 'mechanic_b', 'customer'] },
            readiness: { type: 'number' }
          },
          required: ['status', 'mileage', 'notes', 'owner', 'readiness']
        }
      },
      {
        name: 'entity_update',
        description: 'Updates an existing bike service record.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['empty', 'draft', 'ready', 'changed', 'archived'] },
            mileage: { type: 'number' },
            notes: { type: 'string' },
            owner: { type: 'string', enum: ['unassigned', 'mechanic_a', 'mechanic_b', 'customer'] },
            readiness: { type: 'number' }
          },
          required: ['id']
        }
      },
      {
        name: 'entity_delete',
        description: 'Deletes a bike service record.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            confirm: { type: 'boolean' }
          },
          required: ['id', 'confirm']
        }
      },
      {
        name: 'entity_select',
        description: 'Selects a bike service record.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },

      // Structured editor
      {
        name: 'editor_select',
        description: 'Selects a handoff map node.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'editor_update_property',
        description: 'Updates a property of a handoff map node (owner, readiness).',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            owner: { type: 'string', enum: ['unassigned', 'mechanic_a', 'mechanic_b', 'customer'] },
            readiness: { type: 'number' }
          },
          required: ['id', 'owner', 'readiness']
        }
      },

      // Artifact transfer
      {
        name: 'artifact_export',
        description: 'Exports the current session.',
        inputSchema: {
          type: 'object',
          properties: {
             format: { type: 'string', enum: ['bike-maintenance-v1-handoff-map-json'] }
          }
        }
      },
      {
        name: 'artifact_import',
        description: 'Imports a session.',
        inputSchema: {
          type: 'object',
          properties: {
             mode: { type: 'string', enum: ['bike-maintenance-v1-handoff-map-json'] },
             content: { type: 'string' }
          }
        }
      },
      {
        name: 'artifact_copy',
        description: 'Copies the current session.',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['bike-maintenance-v1-handoff-map-json'] }
          }
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (tool: string, args: any) => {
    const store = useStore.getState();

    switch (tool) {
      case 'entity_create': {
        store.createRecord(args);
        return { success: true };
      }
      case 'entity_update': {
        const { id, ...updates } = args;
        store.updateRecord(id, updates);
        return { success: true };
      }
      case 'entity_delete': {
        if (!args.confirm) return { success: false, error: 'confirm=true required' };
        store.deleteRecord(args.id);
        return { success: true };
      }
      case 'entity_select':
      case 'editor_select': {
        store.selectRecord(args.id);
        return { success: true };
      }
      case 'editor_update_property': {
        store.connectHandoffOwner(args.id, args.owner, args.readiness);
        return { success: true };
      }
      case 'artifact_export':
      case 'artifact_copy': {
        const sessionData = {
          schemaVersion: 'task-specific-v1',
          exportedAt: new Date().toISOString(),
          records: store.records,
          derived: {
            totalReady: store.records.filter(r => r.status === 'ready').length,
            averageMileage: store.records.length > 0 ? Math.round(store.records.reduce((sum, r) => sum + r.mileage, 0) / store.records.length) : 0,
          },
          history: store.actionHistory,
        };
        return { content: JSON.stringify(sessionData) };
      }
      case 'artifact_import': {
        try {
          const data = JSON.parse(args.content);
          const result = store.importSession(data);
          return result;
        } catch (e) {
          return { success: false, error: 'Invalid JSON' };
        }
      }
      default:
        throw new Error(`Tool ${tool} not found`);
    }
  };
}
