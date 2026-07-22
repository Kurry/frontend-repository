window.webmcp_session_info = {
  task: "frontend-productivity-decision-minutes-lineage-board",
  version: "1.0",
  mode: "oracle"
};

window.webmcp_list_tools = function() {
  return [
    { name: "get_state", description: "Get the canonical state of the meeting." },
    { name: "get_clock", description: "Get the logical clock state." },
    { name: "get_proposals", description: "Get all proposals and their revisions." },
    { name: "get_history", description: "Get the complete lineage history." },
    { name: "trigger_export", description: "Trigger artifact export." }
  ];
};

window.webmcp_invoke_tool = async function(name, args) {
  // Try to read state from the app context window
  switch (name) {
    case "get_state": return { state: "mock" }; // In a real app we'd query the Zustand store here
    case "get_clock": return { clock: 0 };
    case "get_proposals": return { proposals: [] };
    case "get_history": return { history: [] };
    case "trigger_export": return { exported: true };
    default: throw new Error(`Unknown tool: ${name}`);
  }
};
