

export function setupWebMCP(hooks: any) {
  // Expose session info based on the current state.
  (window as any).webmcp_session_info = () => {
    return {
      schemaVersion: 'v1',
      recordsCount: hooks.records.length,
      derived: hooks.derived
    };
  };

  const tools = [
    {
      name: "entity_create_record",
      description: "Creates a new lesson block.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          durationMins: { type: "number" }
        },
        required: ["title", "durationMins"]
      }
    },
    {
      name: "entity_update_record",
      description: "Updates a lesson block.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          updates: { type: "object" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Exports the session artifact.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "artifact_import_session_json",
      description: "Imports a session artifact.",
      parameters: {
        type: "object",
        properties: {
          session: { type: "object" }
        },
        required: ["session"]
      }
    },
    {
      name: "query_state",
      description: "Returns the current records.",
      parameters: { type: "object", properties: {} }
    }
  ];

  (window as any).webmcp_list_tools = () => tools;

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    switch (name) {
      case "entity_create_record":
        hooks.createRecord(args);
        return { success: true };
      case "entity_update_record":
        hooks.updateRecord(args.id, args.updates);
        return { success: true };
      case "artifact_export_session_json":
        return hooks.exportArtifact();
      case "artifact_import_session_json":
        hooks.importArtifact(args.session);
        return { success: true };
      case "query_state":
        return hooks.records;
      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
