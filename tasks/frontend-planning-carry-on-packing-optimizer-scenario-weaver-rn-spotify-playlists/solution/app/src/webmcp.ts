import { usePacking } from './hooks/usePacking';

type PackingState = ReturnType<typeof usePacking>;

export function setupWebMCP(state: PackingState) {
  (window as any).__webmcp_state = state;

  (window as any).webmcp_session_info = () => ({
    task: "eval-intelligence/frontend-planning-carry-on-packing-optimizer-scenario-weaver-rn-spotify-playlists",
    status: "ready"
  });

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "entity_create_record",
        description: "Create a new packing item.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
            category: { type: "string" },
            quantity: { type: "number" },
            weight: { type: "number" }
          },
          required: ["name", "status", "category", "quantity", "weight"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update an existing packing item.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            updates: { type: "object" }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Export the current session state as JSON.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_session_json",
        description: "Import session state from JSON.",
        inputSchema: {
          type: "object",
          properties: {
            data: { type: "object" }
          },
          required: ["data"]
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const currentState = (window as any).__webmcp_state as PackingState;
    if (!currentState) throw new Error("State not initialized");

    switch (name) {
      case "entity_create_record":
        currentState.addRecord(args);
        return { success: true };

      case "entity_update_record":
        currentState.updateRecord(args.id, args.updates);
        return { success: true };

      case "artifact_export_session_json":
        return { artifact: currentState.exportData() };

      case "artifact_import_session_json":
        currentState.importData(args.data);
        return { success: true };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
