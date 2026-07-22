import { useStore } from './state';

export function setupWebMCP() {
  if (typeof window === 'undefined') return;

  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => {
    return [
      {
        name: "editor_select",
        description: "Select a color-record in the composer",
        parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
      },
      {
        name: "editor_update_property",
        description: "Update property (capacity, position) for selected color-record",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            property: { type: "string", enum: ["capacity", "position"] },
            value: { type: "any" }
          },
          required: ["id", "property", "value"]
        }
      },
      {
        name: "editor_set_content",
        description: "Set position and capacity simultaneously (mutate in composer)",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            position: { type: "object" },
            capacity: { type: "number" }
          },
          required: ["id", "position", "capacity"]
        }
      },
      {
        name: "entity_create",
        description: "Create a new color",
        parameters: { type: "object", properties: { hex: { type: "string" } }, required: ["hex"] }
      },
      {
        name: "entity_select",
        description: "Select a color",
        parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
      },
      {
        name: "entity_update",
        description: "Update a color",
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
        description: "Delete a color",
        parameters: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
      },
      {
        name: "artifact_export",
        description: "Export palette-harmony-v1",
        parameters: { type: "object", properties: {}, required: [] }
      },
      {
        name: "artifact_import",
        description: "Import palette-harmony-v1",
        parameters: { type: "object", properties: { data: { type: "object" } }, required: ["data"] }
      }
    ];
  };

  window.webmcp_invoke_tool = (name, args) => {
    const store = useStore.getState();

    switch (name) {
      case "editor_select":
      case "entity_select":
        store.selectRecord(args.id);
        return { success: true, result: { selectedId: args.id } };

      case "editor_update_property": {
        const record = store.records.find(r => r.id === args.id);
        if (!record) return { success: false, error: "Record not found" };

        let position = record.position;
        let capacity = record.capacity;

        if (args.property === 'position') position = args.value;
        if (args.property === 'capacity') capacity = args.value;

        store.mutateInComposer(args.id, position, capacity);
        return { success: true, result: { updated: args.id } };
      }

      case "editor_set_content":
        store.mutateInComposer(args.id, args.position, args.capacity);
        return { success: true, result: { mutated: args.id } };

      case "entity_create":
        store.createRecord(args.hex);
        return { success: true, result: { created: true } };

      case "entity_update":
        store.updateRecord(args.id, args.updates);
        return { success: true, result: { updated: true } };

      case "entity_delete":
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true, result: { deleted: true } };
        }
        return { success: false, error: "Must set confirm=true" };

      case "artifact_export":
        return {
          success: true,
          result: {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: store.records,
            derived: store.derived,
            history: store.history
          }
        };

      case "artifact_import":
        store.importArtifact(args.data);
        return { success: true, result: { imported: true } };

      default:
        return { success: false, error: "Tool not found" };
    }
  };
}
