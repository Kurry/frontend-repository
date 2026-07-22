import { useStore } from '../store/useStore.js';
import { QuiltBlockSessionSchema } from '../lib/schema.js';

export function setupWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    {
      name: "editor_select",
      description: "Select a record in the handoff map",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      name: "editor_update_property",
      description: "Update property of a selected record",
      parameters: { type: "object", properties: { id: { type: "string" }, updates: { type: "object" } }, required: ["id", "updates"] }
    },
    {
      name: "editor_set_content",
      description: "Set content of the map",
      parameters: { type: "object", properties: { records: { type: "array" } }, required: ["records"] }
    },
    {
      name: "editor_preview",
      description: "Preview the map",
      parameters: { type: "object", properties: {}, required: [] }
    },
    {
      name: "entity_create",
      description: "Create a quilt block record",
      parameters: { type: "object", properties: { record: { type: "object" } }, required: ["record"] }
    },
    {
      name: "entity_select",
      description: "Select a quilt block record",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      name: "entity_update",
      description: "Update a quilt block record",
      parameters: { type: "object", properties: { id: { type: "string" }, updates: { type: "object" } }, required: ["id", "updates"] }
    },
    {
      name: "entity_delete",
      description: "Delete a quilt block record",
      parameters: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
    },
    {
      name: "artifact_export",
      description: "Export session JSON",
      parameters: { type: "object", properties: { format: { type: "string", enum: ["quilt-layout-v1-handoff-map.json"] } }, required: ["format"] }
    },
    {
      name: "artifact_import",
      description: "Import session JSON",
      parameters: { type: "object", properties: { mode: { type: "string", enum: ["quilt-layout-v1-handoff-map.json"] }, payload: { type: "object" } }, required: ["mode", "payload"] }
    },
    {
      name: "artifact_copy",
      description: "Copy export JSON to clipboard (simulated)",
      parameters: { type: "object", properties: { format: { type: "string", enum: ["quilt-layout-v1-handoff-map.json"] } }, required: ["format"] }
    }
  ];

  window.webmcp_invoke_tool = (tool_name, params) => {
    const store = useStore.getState();

    switch (tool_name) {
      case "editor_select":
      case "entity_select":
        store.selectRecord(params.id);
        return { success: true, result: { id: params.id } };

      case "editor_update_property":
      case "entity_update":
        store.updateRecord(params.id, params.updates);
        return { success: true, result: { id: params.id, updates: params.updates } };

      case "entity_create":
        store.addRecord(params.record);
        return { success: true, result: { id: params.record.id } };

      case "entity_delete":
        if (!params.confirm) return { success: false, error: "Confirmation required" };
        store.deleteRecord(params.id);
        return { success: true, result: { id: params.id } };

      case "editor_set_content":
        store.setFullState({ records: params.records, derived: store.derived, history: store.history });
        return { success: true };

      case "editor_preview":
        return { success: true, result: { records: store.records, derived: store.derived } };

      case "artifact_export":
      case "artifact_copy":
        const exportData = {
          schemaVersion: "quilt-layout-v1",
          exportedAt: new Date().toISOString(),
          records: store.records,
          derived: store.derived,
          history: store.history
        };
        return { success: true, result: { data: exportData } };

      case "artifact_import":
        try {
          const validData = QuiltBlockSessionSchema.parse(params.payload);
          // Check duplicate IDs
          const ids = new Set();
          for (const r of validData.records) {
            if (ids.has(r.id)) throw new Error("Duplicate IDs not allowed");
            ids.add(r.id);
          }
          store.setFullState({
            records: validData.records,
            derived: validData.derived,
            history: validData.history
          });
          return { success: true, result: { restored: validData.records.length } };
        } catch (e) {
          return { success: false, error: e.message };
        }

      default:
        return { success: false, error: `Tool ${tool_name} not found` };
    }
  };
}
