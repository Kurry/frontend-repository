import { useStore } from './store';

// WebMCP global bindings
const registerWebMCP = () => {
  (window as any).webmcp_session_info = {
    schemaVersion: "v1",
    schema: {
      type: "object",
      properties: {
        schemaVersion: { type: "string" },
        exportedAt: { type: "string" },
        records: { type: "array" },
        derived: { type: "object" },
        history: { type: "array" }
      }
    }
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "list_scenarios",
        description: "returns all scenarios",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "create_scenario",
        description: "creates a new scenario",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            difficulty: { type: "number" }
          },
          required: ["title"]
        }
      },
      {
        name: "update_scenario",
        description: "updates a scenario",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            difficulty: { type: "number" }
          },
          required: ["id", "title"]
        }
      },
      {
        name: "delete_scenario",
        description: "deletes a scenario",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "batch_reconcile",
        description: "groups selected records into a batch and reconcile aggregate totals",
        inputSchema: {
          type: "object",
          properties: {
            ids: { type: "array", items: { type: "string" } },
            newStatus: { type: "string" }
          },
          required: ["ids", "newStatus"]
        }
      },
      {
        name: "undo_last_mutation",
        description: "undo the last mutation",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "get_session_info",
        description: "returns artifact schema",
        inputSchema: { type: "object", properties: {} }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const currentState = useStore.getState();
    switch (name) {
      case "list_scenarios":
        return { success: true, records: currentState.records };
      case "create_scenario":
        currentState.addRecord(args);
        return { success: true };
      case "update_scenario": {
        const { id, ...data } = args;
        currentState.updateRecord(id, data);
        return { success: true };
      }
      case "delete_scenario":
        currentState.deleteRecord(args.id);
        return { success: true };
      case "batch_reconcile":
        currentState.batchReconcile(args.ids, args.newStatus);
        return { success: true };
      case "undo_last_mutation":
        currentState.undoLastMutation();
        return { success: true };
      case "get_session_info":
        return { success: true, session_info: (window as any).webmcp_session_info };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
};

export default registerWebMCP;
