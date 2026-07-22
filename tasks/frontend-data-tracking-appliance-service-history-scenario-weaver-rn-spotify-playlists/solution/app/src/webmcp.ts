import { useAppStore } from './store';

export function setupWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1", "scenario-weaver-v1"]
  });

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "entity_create",
        description: "Create a new appliance record",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            model: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
            cost: { type: "number" }
          },
          required: ["name", "model", "status"]
        }
      },
      {
        name: "entity_update",
        description: "Update an appliance record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
          },
          required: ["id"]
        }
      },
      {
        name: "scenario_branch_scenario",
        description: "Branch a selected record into a scenario",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            newCost: { type: "number" }
          },
          required: ["id", "newCost"]
        }
      },
      {
        name: "scenario_undo_mutation",
        description: "Undo the last mutation",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "artifact_export",
        description: "Export the current session state",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "artifact_import",
        description: "Import a session state",
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

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const store = useAppStore.getState();

    switch (name) {
      case "entity_create":
        store.addRecord({
          id: `rec-${Date.now()}`,
          name: args.name,
          model: args.model,
          status: args.status,
          cost: args.cost
        });
        return { success: true };

      case "entity_update":
        store.updateRecord(args.id, { status: args.status });
        return { success: true };

      case "scenario_branch_scenario":
        store.branchScenario(args.id, args.newCost);
        return { success: true };

      case "scenario_undo_mutation":
        store.undo();
        return { success: true };

      case "artifact_export":
        return { data: store.exportData() };

      case "artifact_import":
        store.importData(args.data);
        return { success: true };

      default:
        throw new Error(`Tool not found: ${name}`);
    }
  };
}
