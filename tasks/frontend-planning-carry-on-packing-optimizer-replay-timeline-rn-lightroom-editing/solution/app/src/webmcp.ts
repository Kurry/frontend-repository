import { CarryOnPackingOptimizerSession } from './store';

// Define standard types for window object
declare global {
  interface Window {
    webmcp_session_info?: any;
    webmcp_list_tools?: () => any[];
    webmcp_invoke_tool?: (toolName: string, args: any) => Promise<any>;
  }
}

export function initWebMCP(store: any) {
  // Register session info
  window.webmcp_session_info = {
    task_name: 'eval-intelligence/frontend-planning-carry-on-packing-optimizer-replay-timeline-rn-lightroom-editing',
    capabilities: ['entity-v1', 'artifact-transfer-v1']
  };

  // Define tools according to standard contracts
  const tools = [
    {
      name: 'entity_create_record',
      description: 'Create a new packing item',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          weight: { type: 'number' },
          quantity: { type: 'number' },
          status: { type: 'string' }
        },
        required: ['name', 'category', 'weight', 'quantity', 'status']
      }
    },
    {
      name: 'entity_update_record',
      description: 'Update a packing item',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          weight: { type: 'number' },
          quantity: { type: 'number' },
          status: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'entity_delete_record',
      description: 'Delete a packing item',
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
      name: 'entity_select_record',
      description: 'Select a packing item to view its timeline',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'entity_scrub_timeline',
      description: 'Restore a prior checkpoint of a selected item',
      inputSchema: {
        type: 'object',
        properties: {
          itemId: { type: 'string' },
          checkpointId: { type: 'string' }
        },
        required: ['itemId', 'checkpointId']
      }
    },
    {
      name: 'entity_undo',
      description: 'Undo the last mutation',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'artifact_export_session_json',
      description: 'Export the current session as JSON',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'artifact_import_session_json',
      description: 'Import a JSON session artifact',
      inputSchema: {
        type: 'object',
        properties: {
          artifact: { type: 'object' }
        },
        required: ['artifact']
      }
    },
    {
      name: 'artifact_clear_session',
      description: 'Clear the current session',
      inputSchema: {
        type: 'object',
        properties: {
          confirm: { type: 'boolean' }
        },
        required: ['confirm']
      }
    }
  ];

  window.webmcp_list_tools = () => tools;

  window.webmcp_invoke_tool = async (toolName: string, args: any) => {
    switch (toolName) {
      case 'entity_create_record': {
        const id = store.addRecord({
          name: args.name,
          category: args.category,
          weight: args.weight,
          quantity: args.quantity,
          status: args.status
        });
        return { success: true, id };
      }

      case 'entity_update_record': {
        const { id, ...updates } = args;
        store.updateRecord(id, updates);
        return { success: true };
      }

      case 'entity_delete_record': {
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true };
        }
        return { success: false, error: 'Confirmation required' };
      }

      case 'entity_select_record': {
        store.setSelectedItemId(args.id);
        return { success: true };
      }

      case 'entity_scrub_timeline': {
        store.restoreCheckpoint(args.itemId, args.checkpointId);
        return { success: true };
      }

      case 'entity_undo': {
        store.undo();
        return { success: true };
      }

      case 'artifact_export_session_json': {
        const data = store.exportSession();
        return { success: true, artifact: data };
      }

      case 'artifact_import_session_json': {
        store.importSession(args.artifact);
        return { success: true };
      }

      case 'artifact_clear_session': {
        if (args.confirm) {
          store.clearSession();
          return { success: true };
        }
        return { success: false, error: 'Confirmation required' };
      }

      default:
        throw new Error(`Tool ${toolName} not found`);
    }
  };
}
