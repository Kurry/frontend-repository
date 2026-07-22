export const registerWebMCP = (state, dispatch) => {
  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"],
    tool_names: ["entity_select", "entity_create", "entity_update", "entity_delete", "artifact_export", "artifact_import"]
  });

  window.webmcp_list_tools = async () => [
    { name: "entity_select", module: "entity-collection-v1", description: "Select entities" },
    { name: "entity_create", module: "entity-collection-v1", description: "Create entity" },
    { name: "entity_update", module: "entity-collection-v1", description: "Update entity" },
    { name: "entity_delete", module: "entity-collection-v1", description: "Delete entity" },
    { name: "artifact_export", module: "artifact-transfer-v1", description: "Export dossier" },
    { name: "artifact_import", module: "artifact-transfer-v1", description: "Import dossier" }
  ];

  window.webmcp_invoke_tool = async (request, separateArgs = {}) => {
    const name = typeof request === 'string' ? request : request?.name;
    const args = typeof request === 'string' ? separateArgs : (request?.arguments || {});

    switch (name) {
      case "entity_select": {
        const entityName = args.entity_name || args.entity;
        const stateKey = entityName.endsWith('s') ? entityName : entityName + 's';
        if (stateKey === 'series' || stateKey === 'seriess') return { entities: state.series || [] };
        if (stateKey === 'readings') return { entities: state.readings || [] };
        return { entities: state[stateKey] || [] };
      }
      case "entity_create":
      case "entity_update":
      case "entity_delete":
        return { status: "success", mock_action: name };
      case "artifact_export":
        return {
          artifact: {
            format: args.export_format || "session-json",
            content: { schemaVersion: "home-maintenance-dossier/v1", exportedAt: new Date().toISOString(), ...state }
          }
        };
      case "artifact_import":
        if (args.artifact?.content?.schemaVersion) {
          dispatch({ type: 'IMPORT_STATE', payload: args.artifact.content });
          return { status: "success" };
        }
        throw new Error("Invalid schema");
      default:
        return { status: "not_implemented" };
    }
  };

  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
};
