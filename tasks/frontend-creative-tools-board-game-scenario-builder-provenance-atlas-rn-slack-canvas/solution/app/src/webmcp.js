import { useStore } from './store';

export function initWebMCP() {
  window.webmcp_session_info = () => {
    return {
      status: "ready",
      message: "Scenario Builder MCP Ready"
    };
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: "get_state",
        description: "Returns the current state of the application.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "quarantine_lineage",
        description: "Trace a selected record to source evidence and quarantine a bad lineage.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Record ID" },
            evidenceSource: { type: "string", description: "Source of evidence" }
          },
          required: ["id", "evidenceSource"]
        }
      },
      {
        name: "export_artifact",
        description: "Export the session state as a JSON artifact.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "import_artifact",
        description: "Import a JSON artifact to restore state.",
        inputSchema: {
          type: "object",
          properties: {
            data: { type: "object", description: "The scenario-builder-v1 JSON artifact" }
          },
          required: ["data"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (toolName, args) => {
    const store = useStore.getState();

    switch (toolName) {
      case "get_state":
        return { result: store.exportState() };

      case "quarantine_lineage":
        if (!args || !args.id || !args.evidenceSource) {
          throw new Error("Missing required arguments: id, evidenceSource");
        }
        store.quarantineLineage(args.id, args.evidenceSource);
        return { result: { success: true, message: `Quarantined lineage for record ${args.id}` } };

      case "export_artifact":
        return { result: store.exportState() };

      case "import_artifact":
        if (!args || !args.data) {
          throw new Error("Missing required argument: data");
        }
        store.importState(args.data);
        return { result: { success: true, message: "Artifact imported successfully" } };

      default:
        throw new Error(`Tool not found: ${toolName}`);
    }
  };
}
