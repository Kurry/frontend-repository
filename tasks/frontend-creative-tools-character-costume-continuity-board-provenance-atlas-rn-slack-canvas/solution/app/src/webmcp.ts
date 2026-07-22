import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: {
      status: string;
      role: string;
      capabilities: string[];
    };
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
  }
}

window.webmcp_session_info = {
  status: 'ready',
  role: 'costume-continuity-board',
  capabilities: ['read', 'write']
};

window.webmcp_list_tools = () => {
  return [
    {
      name: 'get_records',
      description: 'Get all costume records.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'trace_and_quarantine',
      description: 'Trace a selected record to source evidence and quarantine a bad lineage.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['id', 'reason']
      }
    },
    {
      name: 'resolve_conflict',
      description: 'Resolve a conflict for a record.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'undo',
      description: 'Undo the last action.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'add_record',
      description: 'Add a new costume record.',
      parameters: {
        type: 'object',
        properties: {
          character: { type: 'string' },
          scene: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['character', 'scene', 'description']
      }
    },
    {
      name: 'update_record',
      description: 'Update a costume record.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          updates: { type: 'object' }
        },
        required: ['id', 'updates']
      }
    },
    {
      name: 'delete_record',
      description: 'Delete a costume record.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    {
      name: 'export_artifact',
      description: 'Export the current artifact.',
      parameters: { type: 'object', properties: {} }
    },
    {
      name: 'import_artifact',
      description: 'Import an artifact.',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'object' }
        },
        required: ['data']
      }
    }
  ];
};

window.webmcp_invoke_tool = async (toolName, args) => {
  const store = useStore.getState();

  switch (toolName) {
    case 'get_records':
      return { records: store.records };

    case 'trace_and_quarantine':
      store.traceAndQuarantine(args.id, args.reason);
      return { success: true };

    case 'resolve_conflict':
      store.resolveConflict(args.id);
      return { success: true };

    case 'undo':
      store.undo();
      return { success: true };

    case 'add_record':
      store.addRecord(args);
      return { success: true };

    case 'update_record':
      store.updateRecord(args.id, args.updates);
      return { success: true };

    case 'delete_record':
      store.deleteRecord(args.id);
      return { success: true };

    case 'export_artifact':
      return store.exportArtifact();

    case 'import_artifact':
      const success = store.importArtifact(args.data);
      return { success };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};
