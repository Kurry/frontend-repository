declare global {
  interface Window {
    webmcp_session_info: () => Promise<{ task_id: string }>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (tool_name: string, args: any) => Promise<any>;
    _appState: any;
    _appDispatch: any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = async () => ({
    task_id: "frontend-planning-conference-speaker-greenroom-board-spatial-composer-rn-harbor-artifact"
  });

  window.webmcp_list_tools = async () => {
    return [
      {
        name: 'entity_collection_query',
        description: 'Query speaker slot records',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' }
          }
        }
      },
      {
        name: 'entity_create_record',
        description: 'Create a new speaker slot record',
        inputSchema: {
          type: 'object',
          properties: {
            record: { type: 'object' }
          },
          required: ['record']
        }
      },
      {
        name: 'entity_update_record',
        description: 'Update a speaker slot record',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            payload: { type: 'object' }
          },
          required: ['id', 'payload']
        }
      },
      {
        name: 'mutate_spatial',
        description: 'Place a selected record in a spatial composer and rebalance capacity',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            payload: { type: 'object' }
          },
          required: ['id', 'payload']
        }
      },
      {
        name: 'artifact_export_session_json',
        description: 'Export the session artifact',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'artifact_import_session_json',
        description: 'Import the session artifact',
        inputSchema: {
          type: 'object',
          properties: {
            artifact: { type: 'object' }
          },
          required: ['artifact']
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (tool_name: string, args: any) => {
    const state = window._appState;
    const dispatch = window._appDispatch;

    if (!state || !dispatch) {
      throw new Error('Application state not available');
    }

    switch (tool_name) {
      case 'entity_collection_query': {
        let results = [...state.records];
        if (args.id) {
          results = results.filter((r: any) => r.id === args.id);
        }
        if (args.status) {
          results = results.filter((r: any) => r.status === args.status);
        }
        return { records: results, derived: state.derived };
      }

      case 'entity_create_record': {
        dispatch({ type: 'CREATE_RECORD', payload: args.record });
        return { success: true };
      }

      case 'entity_update_record': {
        const record = state.records.find((r: any) => r.id === args.id);
        if (!record) throw new Error('Record not found');
        dispatch({ type: 'UPDATE_RECORD', payload: { ...record, ...args.payload } });
        return { success: true };
      }

      case 'mutate_spatial': {
        dispatch({ type: 'MUTATE_SPATIAL', id: args.id, payload: args.payload });
        return { success: true };
      }

      case 'artifact_export_session_json': {
        const data = {
          ...state,
          exportedAt: new Date().toISOString()
        };
        return { artifact: data };
      }

      case 'artifact_import_session_json': {
        if (args.artifact.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(args.artifact.records)) throw new Error('Invalid records');
        dispatch({ type: 'CLEAR' });
        dispatch({
          type: 'IMPORT',
          payload: {
            ...args.artifact,
            exportedAt: new Date().toISOString()
          }
        });
        return { success: true };
      }

      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  };
}
