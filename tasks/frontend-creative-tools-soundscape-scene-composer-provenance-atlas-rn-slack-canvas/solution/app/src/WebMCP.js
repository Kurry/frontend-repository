export function registerTools({ get_session_state, import_session, quarantine_lineage, undo_last_action }) {
  window.webmcp_list_tools = () => {
    return [
      {
        name: "get_session_state",
        description: "Returns the complete current artifact in the soundscape-scene-v1 schema."
      },
      {
        name: "import_session",
        description: "Imports an artifact into the app state."
      },
      {
        name: "quarantine_lineage",
        description: "Executes the signature canonical mutation programmatically."
      },
      {
        name: "undo_last_action",
        description: "Undoes the last action programmatically."
      }
    ];
  };

  window.webmcp_invoke_tool = (name, args) => {
    switch (name) {
      case "get_session_state":
        return get_session_state();
      case "import_session":
        import_session(args);
        return { success: true };
      case "quarantine_lineage":
        quarantine_lineage(args);
        return { success: true };
      case "undo_last_action":
        undo_last_action();
        return { success: true };
      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
