import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolId: string, args: any) => Promise<any>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    app_id: "reasoning-budget-sculptor",
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    {
      id: "editor_select",
      name: "editor_select",
      description: "Selects an object in the editor",
      parameters: { object_type: "string", object_id: "string" }
    },
    {
      id: "editor_update_property",
      name: "editor_update_property",
      description: "Updates a property of an object in the editor",
      parameters: { object_type: "string", object_id: "string", property: "string", value: "any" }
    },
    {
      id: "editor_switch_mode",
      name: "editor_switch_mode",
      description: "Switches the editor mode",
      parameters: { mode: "string" }
    },
    {
      id: "entity_create",
      name: "entity_create",
      description: "Creates an entity",
      parameters: { entity_type: "string", data: "any" }
    },
    {
      id: "artifact_export",
      name: "artifact_export",
      description: "Exports an artifact",
      parameters: { format: "string" }
    },
    {
      id: "artifact_import",
      name: "artifact_import",
      description: "Imports an artifact",
      parameters: { format: "string", data: "any" }
    }
  ];

  window.webmcp_invoke_tool = async (toolId: string, args: any) => {
    const store = useStore.getState();

    switch (toolId) {
      case "editor_update_property":
        if (args.object_type === "phase" && args.property === "locked") {
          store.toggleLock(args.object_id);
          return { success: true };
        }
        if (args.object_type === "event" && args.property === "pinned") {
          store.togglePin(args.object_id);
          return { success: true };
        }
        if (args.object_type === "event" && args.property === "fallback") {
          store.setFallback(args.object_id, args.value);
          return { success: true };
        }
        break;

      case "editor_switch_mode":
        if (["context18k", "min-increase", "new-anchor", "none"].includes(args.mode)) {
          store.setPressure(args.mode);
          return { success: true };
        }
        break;

      case "entity_create":
        if (args.entity_type === "checkpoint") {
          store.addCheckpoint(args.data.name);
          return { success: true };
        }
        break;

      case "artifact_export":
        if (args.format === "policy-json") {
          const policy = store.exportPolicy();
          return { success: true, artifact: policy };
        }
        break;

      case "artifact_import":
        if (args.format === "policy-json") {
          store.importPolicy(args.data);
          return { success: true };
        }
        break;
    }

    return { success: false, error: "Tool not found or arguments invalid" };
  };
}
