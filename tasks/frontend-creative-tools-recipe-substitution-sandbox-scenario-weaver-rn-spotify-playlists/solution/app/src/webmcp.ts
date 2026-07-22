import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Record<string, any>;
    webmcp_list_tools: () => Record<string, any>[];
    webmcp_invoke_tool: (name: string, args: Record<string, any>) => any;
  }
}

window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: ["entity-collection-v1", "artifact-transfer-v1", "structured-editor-v1"]
});

window.webmcp_list_tools = () => [
  {
    name: "entity_create_recipe_ingredient",
    description: "Create a new recipe ingredient",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
      },
      required: ["name", "status"]
    }
  },
  {
    name: "entity_update_recipe_ingredient",
    description: "Update a recipe ingredient",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
        name: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "entity_delete_recipe_ingredient",
    description: "Delete a recipe ingredient",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        confirm: { type: "boolean" }
      },
      required: ["id", "confirm"]
    }
  },
  {
    name: "editor_switch_mode_scenario_weaver",
    description: "Branch a scenario for an ingredient",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        substitute: { type: "string" },
        ratio: { type: "string" }
      },
      required: ["id", "substitute"]
    }
  },
  {
    name: "editor_set_content_scenario_weaver",
    description: "Undo the last action",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["undo"] }
      },
      required: ["action"]
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the current session state",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

window.webmcp_invoke_tool = (name: string, args: Record<string, any>) => {
  const store = useStore.getState();

  switch (name) {
    case 'entity_create_recipe_ingredient': {
      if (!args.name || !args.status) throw new Error("Missing required fields");
      store.addRecord({
        name: args.name,
        status: args.status as any,
        substitute: '',
        substituteRatio: ''
      });
      return { success: true };
    }
    case 'entity_update_recipe_ingredient': {
      if (!args.id) throw new Error("Missing ID");
      store.updateRecord(args.id, args);
      return { success: true };
    }
    case 'entity_delete_recipe_ingredient': {
      if (!args.id || args.confirm !== true) throw new Error("Missing ID or confirmation");
      store.deleteRecord(args.id);
      return { success: true };
    }
    case 'editor_switch_mode_scenario_weaver': {
      if (!args.id || !args.substitute) throw new Error("Missing required fields for branching");
      store.branchScenario(args.id, args.substitute, args.ratio || '1:1');
      return { success: true };
    }
    case 'editor_set_content_scenario_weaver': {
      if (args.action === 'undo') {
        store.undo();
        return { success: true };
      }
      throw new Error("Unknown action");
    }
    case 'artifact_export_session_json': {
      const session = store.exportSession();
      return { artifact: session };
    }
    default:
      throw new Error(`Tool ${name} not found`);
  }
};
