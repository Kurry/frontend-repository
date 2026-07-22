import { AppState, Action, BookRecord, SessionArtifact } from './types';

// Global declaration
declare global {
  interface Window {
    webmcp_session_info?: () => Promise<{ task_id: string }>;
    webmcp_list_tools?: () => { tools: any[] };
    webmcp_invoke_tool?: (req: { tool_name: string; arguments: any }) => Promise<{ success: boolean; result?: any; error?: string }>;
  }
}

export function setupWebMCP(
  getState: () => AppState,
  dispatch: React.Dispatch<Action>
) {
  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-data-tracking-home-library-lending-ledger-recovery-board-rn-canva-live-preview"
  });

  window.webmcp_list_tools = () => ({
    tools: [
      {
        name: "entity_list_records",
        description: "List all book records",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "entity_create_record",
        description: "Create a book record",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            author: { type: "string" },
            isbn: { type: "string" },
            pageCount: { type: "number" },
            status: { type: "string" }
          },
          required: ["title", "author", "isbn", "pageCount"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update a book record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            author: { type: "string" },
            isbn: { type: "string" },
            pageCount: { type: "number" },
            status: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Delete a book record",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Export the current session artifact",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_session_json",
        description: "Import a session artifact",
        inputSchema: {
          type: "object",
          properties: {
            artifact: { type: "object" }
          },
          required: ["artifact"]
        }
      }
    ]
  });

  window.webmcp_invoke_tool = async (req: { tool_name: string; arguments: any }) => {
    const args = req.arguments || {};
    try {
      if (req.tool_name === "entity_list_records") {
        return { success: true, result: getState().records };
      }

      if (req.tool_name === "entity_create_record") {
        const newRecord: BookRecord = {
          id: Date.now().toString(),
          title: args.title,
          author: args.author,
          isbn: args.isbn,
          pageCount: args.pageCount,
          status: args.status || 'draft',
          condition: 'Good'
        };
        dispatch({ type: 'CREATE_RECORD', payload: newRecord });
        return { success: true, result: newRecord };
      }

      if (req.tool_name === "entity_update_record") {
        const existing = getState().records.find(r => r.id === args.id);
        if (!existing) return { success: false, error: "Record not found" };
        const updated = { ...existing, ...args };
        dispatch({ type: 'UPDATE_RECORD', payload: updated });
        return { success: true, result: updated };
      }

      if (req.tool_name === "entity_delete_record") {
        dispatch({ type: 'DELETE_RECORD', payload: args.id });
        return { success: true, result: { deleted: true } };
      }

      if (req.tool_name === "artifact_export_session_json") {
        const state = getState();
        const artifact: SessionArtifact = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived: {
            totalCount: state.records.length,
            recoveryCount: state.records.filter(r => r.status === 'recovery').length,
            readyCount: state.records.filter(r => r.status === 'ready').length,
          },
          history: state.history.past.map(() => 'snapshot')
        };
        return { success: true, result: artifact };
      }

      if (req.tool_name === "artifact_import_session_json") {
        if (args.artifact && args.artifact.schemaVersion === 'v1') {
          dispatch({ type: 'IMPORT_ARTIFACT', payload: args.artifact });
          return { success: true, result: { imported: true } };
        } else {
          return { success: false, error: "Invalid artifact" };
        }
      }

      return { success: false, error: "Unknown tool" };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };
}

export {}; // Ensure it's a module
