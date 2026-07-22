import { useStore } from './store';
import { ApplianceRecordSchema, ArtifactSchemaZod } from './utils';

declare global {
  interface Window {
    webmcp_session_info: () => Record<string, any>;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolId: string, args: Record<string, any>) => Promise<any>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    state: {
      totalRecords: useStore.getState().derived.totalRecords
    }
  });

  window.webmcp_list_tools = () => [
    // Entity Tools
    {
      id: "entity_create",
      title: "Create Appliance Record",
      module: "entity-collection-v1",
      parameters: {
        entity: "appliance-record",
        fields: ["brand", "type", "model", "serial_number"]
      }
    },
    {
      id: "entity_select",
      title: "Select Appliance Record",
      module: "entity-collection-v1",
      parameters: {
        entity: "appliance-record",
        fields: ["id"]
      }
    },
    {
      id: "entity_update",
      title: "Update Appliance Record",
      module: "entity-collection-v1",
      parameters: {
        entity: "appliance-record",
        fields: ["id", "brand", "type", "model", "serial_number"]
      }
    },
    {
      id: "entity_delete",
      title: "Delete Appliance Record",
      module: "entity-collection-v1",
      parameters: {
        entity: "appliance-record",
        fields: ["id"]
      }
    },
    {
      id: "entity_toggle",
      title: "Archive/Unarchive Record",
      module: "entity-collection-v1",
      parameters: {
        entity: "appliance-record",
        fields: ["id"]
      }
    },
    {
      id: "entity_reorder",
      title: "Sort Records",
      module: "entity-collection-v1",
      parameters: {
        entity: "appliance-record",
        fields: ["order"]
      }
    },

    // Editor Tools
    {
      id: "editor_select",
      title: "Select Timeline Event",
      module: "structured-editor-v1",
      parameters: {
        object_types: ["timeline-event"],
        fields: ["id"]
      }
    },
    {
      id: "editor_update_property",
      title: "Scrub Timeline Checkpoint",
      module: "structured-editor-v1",
      parameters: {
        object_types: ["appliance-record"],
        fields: ["recordId", "checkpointId"]
      }
    },
    {
      id: "editor_switch_mode",
      title: "Switch Filter Mode",
      module: "structured-editor-v1",
      parameters: {
        modes: ["replay", "all", "ready", "draft", "changed", "archived", "empty"]
      }
    },
    {
      id: "editor_preview",
      title: "Get State Preview",
      module: "structured-editor-v1",
      parameters: {}
    },

    // Artifact Tools
    {
      id: "artifact_export",
      title: "Export Session Artifact",
      module: "artifact-transfer-v1",
      parameters: {
        format: "appliance-service-v1-replay-timeline-json"
      }
    },
    {
      id: "artifact_import",
      title: "Import Session Artifact",
      module: "artifact-transfer-v1",
      parameters: {
        mode: "appliance-service-v1-replay-timeline-json",
        artifact: "object"
      }
    },
    {
      id: "artifact_copy",
      title: "Copy State JSON",
      module: "artifact-transfer-v1",
      parameters: {}
    }
  ];

  window.webmcp_invoke_tool = async (toolId: string, args: Record<string, any>) => {
    const store = useStore.getState();

    try {
      switch (toolId) {
        // Entity Tool Handlers
        case "entity_create":
          store.createRecord(args as any);
          return { success: true, message: "Record created" };
        case "entity_select":
          store.selectRecord(args.id);
          return { success: true, message: `Record ${args.id} selected` };
        case "entity_update": {
          const { id, ...updates } = args;
          store.updateRecord(id, updates);
          return { success: true, message: "Record updated" };
        }
        case "entity_delete":
          store.deleteRecord(args.id);
          return { success: true, message: "Record deleted" };
        case "entity_toggle":
          store.archiveRecord(args.id);
          return { success: true, message: "Record archived" };
        case "entity_reorder":
          store.setSortOrder(args.order);
          return { success: true, message: `Sorted ${args.order}` };

        // Editor Tool Handlers
        case "editor_update_property":
          store.scrubTimeline(args.recordId, args.checkpointId);
          return { success: true, message: "Timeline scrubbed" };
        case "editor_switch_mode":
          store.setFilter(args.mode as any);
          return { success: true, message: `Filter set to ${args.mode}` };
        case "editor_preview":
        case "editor_select":
          return {
             records: store.records,
             derived: store.derived
          };

        // Artifact Tool Handlers
        case "artifact_export":
        case "artifact_copy":
          return store.exportArtifact();
        case "artifact_import": {
          const validated = ArtifactSchemaZod.parse(args.artifact);
          store.importArtifact(validated as any);
          return { success: true, message: "Artifact imported" };
        }
        default:
          throw new Error(`Tool ${toolId} not found`);
      }
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || "An error occurred" };
    }
  };
}
