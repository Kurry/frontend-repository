import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (tool_name: string, args: any) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => {
    return {
      version: 'zto-webmcp-v1',
      app: 'recipe-flavor-balance-studio'
    };
  };

  window.webmcp_list_tools = () => {
    return [
      // Editor operations
      {
        name: 'editor_select',
        description: 'Select a flavor component or checkpoint',
        inputSchema: {
          type: 'object',
          properties: {
            object_type: { type: 'string', enum: ['flavor-component'] },
            id: { type: 'string' }
          },
          required: ['object_type', 'id']
        }
      },
      {
        name: 'editor_update_property',
        description: 'Update a property of the selected record',
        inputSchema: {
          type: 'object',
          properties: {
            property: { type: 'string', enum: ['flavor-profile', 'timeline-checkpoint'] },
            value: { type: 'object' } // depending on property, could be profile or checkpoint ID
          },
          required: ['property', 'value']
        }
      },
      {
        name: 'editor_set_content',
        description: 'Set content of the editor',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'object' }
          },
          required: ['content']
        }
      },
      {
        name: 'editor_switch_mode',
        description: 'Switch between replay and edit modes',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['replay', 'edit'] }
          },
          required: ['mode']
        }
      },
      // Entity collection
      {
        name: 'entity_create',
        description: 'Create a new flavor component',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['empty', 'draft', 'ready', 'changed', 'archived'] },
            details: { type: 'string' },
            profile: { type: 'object' }
          },
          required: ['name', 'status']
        }
      },
      {
        name: 'entity_select',
        description: 'Select an entity',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      },
      {
        name: 'entity_update',
        description: 'Update an entity',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            updates: { type: 'object' }
          },
          required: ['id', 'updates']
        }
      },
      {
        name: 'entity_delete',
        description: 'Delete an entity',
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
        name: 'entity_toggle',
        description: 'Toggle an entity state (e.g. status)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            state: { type: 'string' }
          },
          required: ['id', 'state']
        }
      },
      // Artifact transfer
      {
        name: 'artifact_export',
        description: 'Export session as JSON',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['flavor-balance-v1-json'] }
          },
          required: ['format']
        }
      },
      {
        name: 'artifact_import',
        description: 'Import session from JSON data (excluding file picker mechanics)',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['flavor-balance-v1-json'] },
            data: { type: 'object' }
          },
          required: ['mode', 'data']
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (tool_name: string, args: any) => {
    const store = useStore.getState();

    switch (tool_name) {
      case 'editor_select': {
        store.selectRecord(args.id);
        return { success: true };
      }

      case 'editor_update_property': {
        if (!store.selectedRecordId) throw new Error('No record selected');

        if (args.property === 'flavor-profile') {
          store.updateRecord(store.selectedRecordId, { profile: args.value });
        } else if (args.property === 'timeline-checkpoint') {
          // scrubber action (not changing actual current history until restored)
          store.scrubTimeline(store.selectedRecordId, args.value.id);
          store.setEditorMode('replay');
        }
        return { success: true, state: useStore.getState().records.find(r => r.id === store.selectedRecordId) };
      }

      case 'editor_set_content': {
        if (!store.selectedRecordId) throw new Error('No record selected');
        // This acts as a restore or bulk set content
        store.updateRecord(store.selectedRecordId, args.content);
        return { success: true };
      }

      case 'editor_switch_mode': {
        store.setEditorMode(args.mode);
        return { success: true };
      }

      case 'entity_create': {
        const defaultProfile = { sweetness: 50, acidity: 50, saltiness: 50, bitterness: 50, umami: 50 };
        store.addRecord({
          name: args.name,
          status: args.status,
          details: args.details || '',
          profile: args.profile || defaultProfile
        });
        const records = useStore.getState().records;
        return { success: true, new_id: records[records.length - 1].id };
      }

      case 'entity_select': {
        store.selectRecord(args.id);
        return { success: true };
      }

      case 'entity_update': {
        store.updateRecord(args.id, args.updates);
        return { success: true };
      }

      case 'entity_delete': {
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true };
        }
        throw new Error('Confirm required');
      }

      case 'entity_toggle': {
        store.updateRecord(args.id, { status: args.state });
        return { success: true };
      }

      case 'artifact_export': {
        return { success: true, artifact: store.exportSession() };
      }

      case 'artifact_import': {
        const success = store.importSession(args.data);
        if (!success) throw new Error('Invalid JSON format or bounds.');
        return { success: true };
      }

      default:
        throw new Error(`Tool ${tool_name} not found`);
    }
  };
}
