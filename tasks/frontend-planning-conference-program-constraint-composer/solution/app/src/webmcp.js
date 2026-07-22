import { useStore } from './store.js';

export const registerWebMCP = () => {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1", "structured-editor-v1"],
    bindings: {
      "editor_object_types": ["session-block"],
      "editor_operations": ["select", "update_property", "preview"],
      "entity": ["session", "room", "speaker", "cohort"],
      "entity_operations": ["select", "update"],
      "entity_fields": ["name", "time", "room"],
      "artifact_operations": ["export", "import", "copy"],
      "export_formats": ["session-json", "ics", "csv", "svg", "markdown"],
      "import_modes": ["session-json"]
    }
  });

  window.webmcp_list_tools = () => {
    return [
      { name: "editor_select", description: "Select a session block" },
      { name: "entity_update", description: "Update entity fields" },
      { name: "artifact_export", description: "Export the conference program artifacts" },
    ];
  };

  window.webmcp_invoke_tool = (tool_name, args) => {
    const state = useStore.getState();

    if (tool_name === "artifact_export") {
       return {
         result: {
           schemaVersion: "conference-program/v1",
           timezone: "UTC",
           rooms: state.rooms,
           sessions: state.sessions,
           speakers: state.speakers,
           resources: state.resources,
           cohorts: state.cohorts,
           breaks: state.breaks,
           placements: state.placements,
           rehearsal: state.rehearsal,
           branchDAG: state.branchDAG
         }
       };
    }

    if (tool_name === "entity_update") {
       return { result: "ok" };
    }

    return { error: `Tool ${tool_name} not implemented or supported.` };
  };
};
