import { useStore } from './store';

export const setupWebMCP = () => {
  (window as any).webmcp_session_info = () => {
    return {
      status: "active",
      schemaVersion: "v1"
    };
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "query_state",
        description: "Returns the current state of the application including records and derived state.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "create_block",
        description: "Creates a new quilt block.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
            color: { type: "string" },
            pieces: { type: "number" }
          },
          required: ["name", "status", "color", "pieces"]
        }
      },
      {
        name: "update_block",
        description: "Updates an existing quilt block.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            updates: {
              type: "object",
              properties: {
                name: { type: "string" },
                status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
                color: { type: "string" },
                pieces: { type: "number" }
              }
            }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "delete_block",
        description: "Deletes a quilt block.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "trace_and_quarantine",
        description: "Canonical mutation: trace a selected record to source evidence and quarantine a bad lineage.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            lineageInfo: { type: "string" }
          },
          required: ["id", "lineageInfo"]
        }
      },
      {
        name: "undo",
        description: "Undo the last mutation.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "export_session",
        description: "Export the current artifact session.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "import_session",
        description: "Import a session artifact.",
        inputSchema: {
          type: "object",
          properties: {
            jsonStr: { type: "string" }
          },
          required: ["jsonStr"]
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case "query_state":
        return store.exportSession();
      case "create_block":
        store.createBlock(args as any);
        return { success: true };
      case "update_block":
        store.editBlock(args.id, args.updates);
        return { success: true };
      case "delete_block":
        store.deleteBlock(args.id);
        return { success: true };
      case "trace_and_quarantine":
        store.traceAndQuarantineLineage(args.id, args.lineageInfo);
        return { success: true };
      case "undo":
        store.undo();
        return { success: true };
      case "export_session":
        return store.exportSession();
      case "import_session":
        return store.importSession(args.jsonStr);
      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
};
