import type { StoreState, DerivedState, LedgerSession } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (tool_name: string, arguments_json: string) => Promise<any>;
    _app_dispatch: (action: any) => void;
    _app_get_state: () => { state: StoreState; derived: DerivedState };
  }
}

export function initWebMCP(
  dispatch: (action: any) => void,
  getState: () => { state: StoreState; derived: DerivedState }
) {
  window._app_dispatch = dispatch;
  window._app_get_state = getState;

  window.webmcp_session_info = async () => ({
    task_id: "eval-intelligence/frontend-data-tracking-home-library-lending-ledger-spatial-composer-rn-artifact",
    task_version: "1.0.0",
    contract_version: "zto-webmcp-v1"
  });

  window.webmcp_list_tools = async () => ({
    tools: [
      {
        name: "entity_create_record",
        description: "Creates a new book record.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            title: { type: "string" },
            status: { type: "string" },
            capacity: { type: "number" }
          },
          required: ["entity", "title"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates an existing book record.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            id: { type: "string" },
            title: { type: "string" },
            status: { type: "string" },
            capacity: { type: "number" }
          },
          required: ["entity", "id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Deletes a book record.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { type: "string" },
            id: { type: "string" },
            confirm: { type: "boolean" }
          },
          required: ["entity", "id", "confirm"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Exports the session artifact.",
        inputSchema: {
          type: "object",
          properties: {
            format: { type: "string" }
          }
        }
      },
      {
        name: "artifact_import_session_json",
        description: "Imports a session artifact.",
        inputSchema: {
          type: "object",
          properties: {
            mode: { type: "string" },
            payload: { type: "string" }
          },
          required: ["payload"]
        }
      }
    ]
  });

  window.webmcp_invoke_tool = async (tool_name: string, arguments_json: string) => {
    const args = JSON.parse(arguments_json);
    const { state, derived } = window._app_get_state();

    switch (tool_name) {
      case "entity_create_record": {
        if (args.entity !== "book") throw new Error("Unknown entity");
        window._app_dispatch({
          type: "ADD_BOOK",
          payload: {
            title: args.title,
            author: args.author || 'Unknown',
            isbn: '000-0000000000',
            status: args.status || "draft",
            capacity: args.capacity || 1,
            spatialComposerState: { placed: false, x: 0, y: 0 }
          }
        });
        return { success: true };
      }
      case "entity_update_record": {
        if (args.entity !== "book") throw new Error("Unknown entity");
        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.status !== undefined) updates.status = args.status;
        if (args.capacity !== undefined) updates.capacity = args.capacity;

        window._app_dispatch({
          type: "UPDATE_BOOK",
          payload: { id: args.id, ...updates }
        });
        return { success: true };
      }
      case "entity_delete_record": {
        if (args.entity !== "book") throw new Error("Unknown entity");
        if (!args.confirm) throw new Error("Delete requires confirm=true");
        window._app_dispatch({
          type: "DELETE_BOOK",
          payload: args.id
        });
        return { success: true };
      }
      case "artifact_export_session_json": {
        const session: LedgerSession = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived,
          history: state.history,
        };
        return { artifact: JSON.stringify(session) };
      }
      case "artifact_import_session_json": {
        try {
          const session = JSON.parse(args.payload);
          if (session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
             throw new Error("Invalid artifact schema. schemaVersion must be v1.");
          }
          window._app_dispatch({ type: "IMPORT_ARTIFACT", payload: session });
          return { success: true };
        } catch (e: any) {
          throw new Error("Failed to parse or validate artifact payload.");
        }
      }
      default:
        throw new Error(`Tool ${tool_name} not found`);
    }
  };
}
