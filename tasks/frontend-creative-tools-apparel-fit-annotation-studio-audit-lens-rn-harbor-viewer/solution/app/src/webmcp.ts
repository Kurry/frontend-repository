import { useStore } from './store';


export function registerWebMCP() {
  // @ts-ignore
  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tool_names: [
      "editor_select", "editor_update_property", "editor_preview",
      "entity_create", "entity_select", "entity_update", "entity_delete",
      "artifact_export", "artifact_import", "artifact_copy"
    ]
  });

  // @ts-ignore
  window.webmcp_list_tools = async () => {
    return [
      { name: "editor_select", module: "structured-editor-v1", description: "Select an audit-lens object" },
      { name: "editor_update_property", module: "structured-editor-v1", description: "Update properties on the audit-lens (e.g. resolve discrepancy)" },
      { name: "editor_preview", module: "structured-editor-v1", description: "Preview the audit-lens state" },
      { name: "entity_create", module: "entity-collection-v1", description: "Create a fit-annotation" },
      { name: "entity_select", module: "entity-collection-v1", description: "Select a fit-annotation" },
      { name: "entity_update", module: "entity-collection-v1", description: "Update a fit-annotation" },
      { name: "entity_delete", module: "entity-collection-v1", description: "Delete a fit-annotation" },
      { name: "artifact_export", module: "artifact-transfer-v1", description: "Export session JSON" },
      { name: "artifact_import", module: "artifact-transfer-v1", description: "Import session JSON" },
      { name: "artifact_copy", module: "artifact-transfer-v1", description: "Copy session JSON" }
    ];
  };

  // @ts-ignore
  window.webmcp_invoke_tool = async (request: any, separateArguments?: any) => {
    const name = typeof request === "string" ? request : request?.name;
    const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
    const store = useStore.getState();

    switch (name) {
      case "editor_select":
      case "entity_select":
      case "editor_preview":
        return store.session.records.find(r => r.id === args.id) || null;
      case "editor_update_property":
        if (args.property === 'discrepancy-resolved' || args.evidenceAttached || args.discrepancyResolved) {
          const res = store.attachEvidenceAndResolve(args.id);
          if (!res.success) throw new Error(res.error);
          return store.session.records.find(r => r.id === args.id);
        }
        return null;
      case "entity_create":
        const id = `rec-${Date.now()}`;
        const newRecord = { ...args, id, evidenceAttached: false, auditLensState: 'idle', discrepancyResolved: false };
        store.addRecord(newRecord);
        return newRecord;
      case "entity_update":
        store.updateRecord(args.id, args);
        return store.session.records.find(r => r.id === args.id);
      case "entity_delete":
        store.deleteRecord(args.id);
        return { success: true };
      case "artifact_export":
      case "artifact_copy":
        return {
          ...store.session,
          exportedAt: new Date().toISOString()
        };
      case "artifact_import":
        const res = store.importSession(args.payload || args);
        if (!res.success) throw new Error(res.error);
        return store.session;
      default:
        throw new Error(`WebMCP tool ${name} is not registered`);
    }
  };
}
