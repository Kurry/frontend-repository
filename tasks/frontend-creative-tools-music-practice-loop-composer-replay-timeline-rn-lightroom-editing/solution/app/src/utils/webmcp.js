export const registerWebMCP = (getState, actions) => {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => ([
    { name: "entity_create", description: "Create a new record", inputSchema: {} },
    { name: "entity_select", description: "Select a record", inputSchema: { id: { type: "string" } } },
    { name: "entity_update", description: "Update a record", inputSchema: { id: { type: "string" }, properties: { type: "object" } } },
    { name: "entity_delete", description: "Delete a record", inputSchema: { id: { type: "string" }, confirm: { type: "boolean" } } },
    { name: "artifact_export", description: "Export session JSON", inputSchema: { format: { type: "string" } } },
    { name: "artifact_import", description: "Import session JSON", inputSchema: { payload: { type: "string" }, mode: { type: "string" } } },
    { name: "artifact_copy", description: "Copy session JSON", inputSchema: { format: { type: "string" } } }
  ]);

  window.webmcp_invoke_tool = (name, args) => {
    const state = getState();
    try {
      if (name === "entity_create") {
        const newRecord = actions.createRecord();
        return { success: true, result: newRecord };
      }
      if (name === "entity_select") {
        actions.selectRecord(args.id);
        return { success: true, result: { id: args.id } };
      }
      if (name === "entity_update") {
        actions.updateRecord(args.id, args.properties);
        return { success: true, result: { id: args.id, properties: args.properties } };
      }
      if (name === "entity_delete") {
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true.");
        actions.deleteRecord(args.id);
        return { success: true, result: { id: args.id } };
      }
      if (name === "artifact_export") {
        const data = {
          schemaVersion: state.schemaVersion,
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived: state.derived,
          history: state.history
        };
        return { success: true, result: { format: "session-json", content: JSON.stringify(data, null, 2) } };
      }
      if (name === "artifact_import") {
        const payload = JSON.parse(args.payload);
        const valid = actions.importSession(payload);
        if (!valid) throw new Error("Validation failed");
        return { success: true, result: { valid: true } };
      }
      if (name === "artifact_copy") {
        const data = {
          schemaVersion: state.schemaVersion,
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived: state.derived,
          history: state.history
        };
        return { success: true, result: { format: "session-json", content: JSON.stringify(data, null, 2) } };
      }
      return { success: false, error: "Unknown tool" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };
};
