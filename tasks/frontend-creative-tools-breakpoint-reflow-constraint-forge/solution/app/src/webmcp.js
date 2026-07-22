import { useStore } from './store';
import { generateContract } from './utils/exportImport';

window.webmcp_session_info = {
  contract_version: "zto-webmcp-v1",
  modules: ["structured-editor-v1", "artifact-transfer-v1"]
};

window.webmcp_list_tools = () => {
  return [
    {
      name: "editor_select",
      description: "Selects a component in the editor.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "editor_update_property",
      description: "Updates a property of a component.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          property: { type: "string" },
          value: { type: "any" },
          mode: { type: "string", enum: ["desktop", "tablet", "mobile"] }
        },
        required: ["id", "property", "value", "mode"]
      }
    },
    {
      name: "editor_switch_mode",
      description: "Switches the active editor mode.",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["desktop", "tablet", "mobile", "rehearsal", "compare"] }
        },
        required: ["mode"]
      }
    },
    {
      name: "artifact_export",
      description: "Exports the layout contract.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  ];
};

window.webmcp_invoke_tool = (toolName, params) => {
  const store = useStore.getState();

  try {
    switch (toolName) {
      case "editor_select":
        store.setSelectedComponentId(params.id);
        return { success: true };

      case "editor_update_property":
        if (params.mode === 'desktop') {
          store.updateDesktopLayout(params.id, { [params.property]: params.value });
        } else {
          store.updateOverride(params.mode, params.id, params.property, params.value);
        }
        return { success: true };

      case "editor_switch_mode":
        store.setActiveMode(params.mode);
        return { success: true };

      case "artifact_export":
        return { success: true, result: generateContract(store) };

      default:
        throw new Error(`Tool ${toolName} not implemented`);
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};
