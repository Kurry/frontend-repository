import { useStore, type RecordStatus } from '../store/useStore';

declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = {
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  };

  window.webmcp_list_tools = () => [
    // Entity Collection (record)
    {
      name: "entity_create",
      description: "Create a new record",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" } },
        required: ["name", "quantity", "unit"]
      }
    },
    {
      name: "entity_select",
      description: "Select a record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_update",
      description: "Update a record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, status: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete a record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"]
      }
    },
    {
      name: "entity_toggle",
      description: "Toggle archive status of a record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    // Structured Editor (recovery-board)
    {
      name: "editor_select",
      description: "Select a record on the recovery board",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "editor_update_property",
      description: "Recover a record by repairing downstream consequences",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, reason: { type: "string" } },
        required: ["id", "reason"]
      }
    },
    {
      name: "editor_set_content",
      description: "Undo the last mutation",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    // Artifact Transfer
    {
      name: "artifact_export",
      description: "Export the artifact",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "artifact_import",
      description: "Import the artifact",
      parameters: {
        type: "object",
        properties: { data: { type: "object" } },
        required: ["data"]
      }
    },
    {
      name: "artifact_copy",
      description: "Query current artifact state",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];

  window.webmcp_invoke_tool = (name: string, args: any) => {
    const state = useStore.getState();

    switch (name) {
      case "entity_create":
        state.addRecord({ name: args.name, quantity: args.quantity, unit: args.unit });
        return { success: true };

      case "entity_select":
        return { success: true, record: state.records.find(r => r.id === args.id) };

      case "entity_update":
        state.updateRecord(args.id, { status: args.status as RecordStatus });
        return { success: true };

      case "entity_delete":
        if (args.confirm) {
          state.deleteRecord(args.id);
          return { success: true };
        }
        return { success: false, error: "confirm=true required" };

      case "entity_toggle":
        const record = state.records.find(r => r.id === args.id);
        if (record) {
          if (record.status === 'archived') {
            state.updateRecord(args.id, { status: 'draft' });
          } else {
            state.archiveRecord(args.id);
          }
          return { success: true };
        }
        return { success: false, error: "Record not found" };

      case "editor_select":
        return { success: true, record: state.records.find(r => r.id === args.id) };

      case "editor_update_property":
        state.recoverRecord(args.id, args.reason);
        return { success: true };

      case "editor_set_content":
        state.undo();
        return { success: true };

      case "artifact_export":
      case "artifact_copy":
        return { success: true, data: state.exportArtifact() };

      case "artifact_import":
        const success = state.importArtifact(args.data);
        return { success };

      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
