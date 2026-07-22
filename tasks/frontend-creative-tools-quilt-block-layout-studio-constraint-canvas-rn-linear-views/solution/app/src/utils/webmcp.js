import { useStore } from '../store/useStore';

export function setupWebMCP() {
  window.webmcp_session_info = {
    contract_version: "zto-webmcp-v1",
    capabilities: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: "editor_select",
        description: "Select a constraint-canvas or quilt-block object",
        parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
      },
      {
        name: "editor_update_property",
        description: "Update a property of a selected object",
        parameters: { type: "object", properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } }, required: ["id", "property", "value"] }
      },
      {
        name: "editor_set_content",
        description: "Set content",
        parameters: { type: "object", properties: {}, required: [] }
      },
      {
        name: "entity_create",
        description: "Create a quilt-block",
        parameters: { type: "object", properties: { blockName: { type: "string" }, size: { type: "number" }, status: { type: "string" } }, required: ["blockName", "size", "status"] }
      },
      {
        name: "entity_select",
        description: "Select a quilt-block entity",
        parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
      },
      {
        name: "entity_update",
        description: "Update a quilt-block entity",
        parameters: { type: "object", properties: { id: { type: "string" }, blockName: { type: "string" }, size: { type: "number" }, status: { type: "string" } }, required: ["id"] }
      },
      {
        name: "entity_delete",
        description: "Delete a quilt-block entity",
        parameters: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
      },
      {
        name: "artifact_export",
        description: "Export the session",
        parameters: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
      },
      {
        name: "artifact_import",
        description: "Import a session",
        parameters: { type: "object", properties: { format: { type: "string" }, data: { type: "object" } }, required: ["format", "data"] }
      },
      {
        name: "artifact_copy",
        description: "Copy export to clipboard",
        parameters: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
      }
    ];
  };

  window.webmcp_invoke_tool = async (tool_name, parameters) => {
    const store = useStore.getState();

    switch (tool_name) {
      case 'editor_select':
      case 'entity_select': {
        store.setSelectedRecord(parameters.id);
        return { success: true, result: { id: parameters.id } };
      }
      case 'editor_update_property': {
        store.updateRecord(parameters.id, { [parameters.property]: parameters.value });
        return { success: true, result: { id: parameters.id, [parameters.property]: parameters.value } };
      }
      case 'editor_set_content': {
        return { success: true, result: {} };
      }
      case 'entity_create': {
        const id = `block-${Date.now()}`;
        store.createRecord({ id, ...parameters });
        return { success: true, result: { id } };
      }
      case 'entity_update': {
        const { id, ...updates } = parameters;
        store.updateRecord(id, updates);
        return { success: true, result: { id, ...updates } };
      }
      case 'entity_delete': {
        if (!parameters.confirm) return { success: false, error: "Requires confirm=true" };
        store.deleteRecord(parameters.id);
        return { success: true, result: { deletedId: parameters.id } };
      }
      case 'artifact_export': {
        if (parameters.format !== 'session-json') return { success: false, error: "Unsupported format" };
        const data = store.exportSession();
        return { success: true, result: { content: data } };
      }
      case 'artifact_import': {
        if (parameters.format !== 'session-json') return { success: false, error: "Unsupported format" };
        const success = store.importSession(parameters.data);
        if (success) {
          return { success: true, result: { imported: true } };
        } else {
          return { success: false, error: "Invalid payload" };
        }
      }
      case 'artifact_copy': {
        if (parameters.format !== 'session-json') return { success: false, error: "Unsupported format" };
        const data = store.exportSession();
        return { success: true, result: { copied: true, content: data } };
      }
      default:
        return { success: false, error: `Tool ${tool_name} not found` };
    }
  };
}
