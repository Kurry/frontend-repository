// WebMCP Bindings
window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: [
    "entity-collection-v1",
    "structured-editor-v1",
    "artifact-transfer-v1"
  ]
});

window.webmcp_list_tools = () => [
  {
    name: "entity_record_create",
    description: "Create a new service record",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "entity_record_update",
    description: "Update an existing service record",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" }
      },
      required: ["id", "name"]
    }
  },
  {
    name: "entity_record_delete",
    description: "Archive a service record",
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
    name: "editor_scenario_branch",
    description: "Branch a selected record into a scenario",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "editor_scenario_undo",
    description: "Undo the last action",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "artifact_session_export",
    description: "Export the current session state",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "artifact_session_import",
    description: "Import session data",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string" }
      },
      required: ["data"]
    }
  },
  {
    name: "artifact_session_clear",
    description: "Clear the session",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

window.webmcp_invoke_tool = (tool_name, parameters) => {
  const actions = window.__APP_ACTIONS__;
  const state = window.__APP_STATE__;

  if (!actions || !state) {
    throw new Error("Application state or actions not initialized");
  }

  switch (tool_name) {
    case "entity_record_create":
      actions.createRecord({ name: parameters.name });
      return { result: "created", state: window.__APP_STATE__ };

    case "entity_record_update":
      actions.updateRecord(parameters.id, { name: parameters.name });
      return { result: "updated", state: window.__APP_STATE__ };

    case "entity_record_delete":
      if (!parameters.confirm) throw new Error("Delete requires confirm=true");
      actions.archiveRecord(parameters.id);
      return { result: "archived", state: window.__APP_STATE__ };

    case "editor_scenario_branch":
      actions.branchScenario(parameters.id);
      return { result: "branched", state: window.__APP_STATE__ };

    case "editor_scenario_undo":
      actions.undo();
      return { result: "undone", state: window.__APP_STATE__ };

    case "artifact_session_export":
      return {
        result: "exported",
        artifact: { ...state, exportedAt: new Date().toISOString() }
      };

    case "artifact_session_import":
      actions.importData(parameters.data);
      return { result: "imported", state: window.__APP_STATE__ };

    case "artifact_session_clear":
      actions.clear();
      return { result: "cleared", state: window.__APP_STATE__ };

    default:
      throw new Error(`Tool ${tool_name} not found`);
  }
};
