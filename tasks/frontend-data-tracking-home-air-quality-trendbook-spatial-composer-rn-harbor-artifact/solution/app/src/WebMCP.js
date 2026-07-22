import { validateData } from './store';

export function registerWebMCPTools() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    {
      name: "entity_create",
      description: "Create a new record",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
          status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
          type: { type: "string" }
        },
        required: ["name", "value", "status", "type"]
      }
    },
    {
      name: "entity_update",
      description: "Update a record",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          updates: { type: "object" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete a record",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["id", "confirm"]
      }
    },
    {
      name: "entity_select",
      description: "Select a record",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "artifact_export",
      description: "Export the current artifact",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "artifact_import",
      description: "Import an artifact",
      parameters: {
        type: "object",
        properties: {
          data: { type: "object" }
        },
        required: ["data"]
      }
    },
    {
      name: "artifact_copy",
      description: "Copy an artifact to clipboard",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];

  window.webmcp_invoke_tool = async (tool_name, args) => {
    const dispatch = window.__APP_DISPATCH;
    const state = window.__APP_STATE;

    if (!dispatch || !state) {
      throw new Error("Application state not initialized");
    }

    switch (tool_name) {
      case "entity_create":
        dispatch({ type: 'CREATE_RECORD', payload: args });
        return { success: true };

      case "entity_update":
        dispatch({ type: 'UPDATE_RECORD', payload: args });
        return { success: true };

      case "entity_delete":
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
        dispatch({ type: 'DELETE_RECORD', payload: args.id });
        return { success: true };

      case "entity_select":
        dispatch({ type: 'SELECT_RECORD', payload: args.id });
        return { success: true };

      case "artifact_export":
        const exportData = {
          schemaVersion: state.schemaVersion,
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived: state.derived,
          history: state.history
        };
        return { success: true, artifact: exportData };

      case "artifact_import":
        const { data } = args;
        if (!validateData(data)) {
          throw new Error("Invalid artifact format");
        }
        dispatch({ type: 'IMPORT_DATA', payload: data });
        return { success: true };

      case "artifact_copy":
        const copyData = {
          schemaVersion: state.schemaVersion,
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived: state.derived,
          history: state.history
        };
        return { success: true, artifact: copyData };

      default:
        throw new Error(`Tool ${tool_name} not found`);
    }
  };
}
