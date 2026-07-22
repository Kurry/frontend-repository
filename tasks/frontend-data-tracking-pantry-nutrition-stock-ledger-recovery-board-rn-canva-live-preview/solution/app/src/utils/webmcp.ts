export {};

declare global {
  interface Window {
    webmcp_session_info?: () => Promise<{ task_id: string }>;
    webmcp_list_tools?: () => any;
    webmcp_invoke_tool?: (toolName: string, args: any) => Promise<any>;
  }
}

export function setupWebMCP(store: any) {
  window.webmcp_session_info = async () => ({
    task_id: 'frontend-data-tracking-pantry-nutrition-stock-ledger-recovery-board-rn-canva-live-preview',
  });

  window.webmcp_list_tools = () => {
    return {
      tools: [
        {
          name: 'entity_create_record',
          description: 'Create a new ingredient',
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
          description: 'Update an existing ingredient',
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
          name: 'artifact_export_session_json',
          description: 'Export session as JSON',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'artifact_import_session_json',
          description: 'Import session from JSON',
          inputSchema: {
            type: 'object',
            properties: {
              sessionData: { type: 'string' }
            },
            required: ['sessionData']
          }
        },
        {
          name: 'entity_get_derived_summary',
          description: 'Get derived stats',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'entity_undo_last_action',
          description: 'Undo last action',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  };

  window.webmcp_invoke_tool = async (toolName: string, args: any) => {
    switch (toolName) {
      case 'entity_create_record':
        store.addRecord(args.record);
        return { success: true };
      case 'entity_update_record':
        store.updateRecord(args.id, args.updates);
        return { success: true };
      case 'artifact_export_session_json':
        return { session: store.exportSession() };
      case 'artifact_import_session_json':
        try {
          const parsed = JSON.parse(args.sessionData);
          const success = store.importSession(parsed);
          return { success };
        } catch (e) {
          return { success: false, error: 'Invalid JSON' };
        }
      case 'entity_get_derived_summary':
        return { stats: store.derivedStats };
      case 'entity_undo_last_action':
        store.undo();
        return { success: true };
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
