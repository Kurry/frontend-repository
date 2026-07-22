import { useStore } from './store';
import { createExportPayload, validateImportPayload } from './utils/artifact';

window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: ["entity-collection-v1", "artifact-transfer-v1"]
});

window.webmcp_list_tools = () => [
  { name: "entity_create_fit-annotation", description: "Create a new fit annotation" },
  { name: "entity_select_fit-annotation", description: "Select an annotation for viewing or recovery" },
  { name: "entity_update_fit-annotation", description: "Update a fit annotation (e.g., recover it)" },
  { name: "entity_delete_fit-annotation", description: "Delete a fit annotation" },
  { name: "artifact_export_fit-annotations-v1", description: "Export session state" },
  { name: "artifact_import_fit-annotations-v1", description: "Import session state" }
];

window.webmcp_invoke_tool = (tool_name, args) => {
  const store = useStore.getState();

  try {
    if (tool_name === "entity_create_fit-annotation") {
      const newId = `record-${Date.now()}`;
      store.createRecord({
        id: newId,
        title: args.title || 'New Annotation',
        status: args.status || 'draft',
        measurement: args.measurement || 50
      });
      return { success: true, result: { id: newId } };
    }

    if (tool_name === "entity_select_fit-annotation") {
      const rec = store.records.find(r => r.id === args.id);
      if (!rec) throw new Error("Not found");
      return { success: true, result: rec };
    }

    if (tool_name === "entity_update_fit-annotation") {
      const rec = store.records.find(r => r.id === args.id);
      if (!rec) throw new Error("Not found");

      const nextMeasurement = args.measurement !== undefined ? args.measurement : rec.measurement;
      if (nextMeasurement < 0 || nextMeasurement > 200) {
        throw new Error("Invalid measurement bounds");
      }

      store.updateRecord(args.id, {
        title: args.title !== undefined ? args.title : rec.title,
        status: args.status !== undefined ? args.status : rec.status,
        measurement: nextMeasurement
      });
      return { success: true, result: { id: args.id } };
    }

    if (tool_name === "entity_delete_fit-annotation") {
      if (!args.confirm) throw new Error("confirm=true is required");
      store.deleteRecord(args.id);
      return { success: true, result: { id: args.id } };
    }

    if (tool_name === "artifact_export_fit-annotations-v1") {
      const payload = createExportPayload(store);
      return { success: true, result: payload };
    }

    if (tool_name === "artifact_import_fit-annotations-v1") {
      const validated = validateImportPayload(args.payload);
      store.importSession(validated);
      return { success: true, result: { schemaVersion: validated.schemaVersion } };
    }

    throw new Error(`Tool ${tool_name} not found`);
  } catch (err) {
    return { success: false, error: err.message };
  }
};
