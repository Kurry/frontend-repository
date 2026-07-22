import { useStore } from './store';

export function setupWebMCP() {
  window.webmcp_session_info = {
    appName: "Rental Turnaround Control Board",
    version: "1.0.0"
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: "get_state",
        description: "Returns the current turnaround state",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "import_state",
        description: "Imports a turnaround state",
        parameters: {
          type: "object",
          properties: {
            state: { type: "object" }
          },
          required: ["state"]
        }
      },
      {
        name: "reset_state",
        description: "Resets the state to the initial immutable fixture",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "select_loci",
        description: "Select floorplan loci by id",
        parameters: {
          type: "object",
          properties: {
            ids: { type: "array", items: { type: "string" } },
            clear: { type: "boolean" }
          },
          required: ["ids"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (toolName, params) => {
    const store = useStore.getState();

    switch (toolName) {
      case "get_state":
        return store;
      case "import_state":
        store.importState(params.state);
        return { success: true };
      case "reset_state":
        store.resetState();
        return { success: true };
      case "select_loci":
        store.selectLoci(params.ids, params.clear);
        return { success: true, selection: useStore.getState().selection };
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
