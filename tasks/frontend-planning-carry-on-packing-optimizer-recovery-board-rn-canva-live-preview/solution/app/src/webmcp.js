window.webmcp_session_info = async () => ({ task_id: "eval-intelligence/carry-on-packing-optimizer" });

window.webmcp_list_tools = async () => [
  {
    name: "entity_create_record",
    description: "Create a new packing record",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        weight: { type: "number" },
        category: { type: "string" },
        status: { type: "string" }
      },
      required: ["name", "weight"]
    }
  },
  {
    name: "entity_update_record",
    description: "Update an existing packing record",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string" }
      },
      required: ["id", "status"]
    }
  },
  {
    name: "entity_delete_record",
    description: "Delete a packing record",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "entity_query_record",
    description: "Query packing records",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the session artifact as JSON",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "artifact_import_session_json",
    description: "Import the session artifact from JSON",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "string", description: "JSON string of the artifact" }
      },
      required: ["data"]
    }
  }
];

// Helper to access the current React state dynamically
// (assuming we hook into this from our App component)
window.__WEBMCP_DISPATCH = null;
window.__WEBMCP_STATE = null;

window.webmcp_invoke_tool = async (tool) => {
  const { name, arguments: args } = tool;
  const dispatch = window.__WEBMCP_DISPATCH;
  const state = window.__WEBMCP_STATE;

  if (!dispatch || !state) return { status: "error", message: "App not initialized" };

  try {
    switch (name) {
      case "entity_create_record":
        dispatch({
          type: "CREATE_RECORD",
          payload: {
            name: args.name,
            weight: args.weight,
            category: args.category || "other",
            status: args.status || "ready"
          }
        });
        return { status: "success" };

      case "entity_update_record":
        dispatch({
          type: "UPDATE_RECORD",
          payload: { id: args.id, status: args.status }
        });
        return { status: "success" };

      case "entity_delete_record":
        dispatch({
          type: "DELETE_RECORD",
          payload: args.id
        });
        return { status: "success" };

      case "entity_query_record":
        return { status: "success", data: state.records };

      case "artifact_export_session_json":
        const derived = {
           totalWeight: state.records.filter(r => r.status !== 'archived').reduce((sum, r) => sum + r.weight, 0),
           readyCount: state.records.filter(r => r.status === 'ready').length,
           conflictCount: state.records.filter(r => r.status === 'conflict').length
        };
        const artifact = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived,
          history: state.history
        };
        return { status: "success", artifact: JSON.stringify(artifact, null, 2) };

      case "artifact_import_session_json":
        const data = JSON.parse(args.data);
        if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(data.records)) throw new Error('Records must be an array');
        dispatch({ type: 'IMPORT_STATE', payload: data });
        return { status: "success" };

      default:
        return { status: "not_implemented" };
    }
  } catch (err) {
    return { status: "error", message: err.message };
  }
};
