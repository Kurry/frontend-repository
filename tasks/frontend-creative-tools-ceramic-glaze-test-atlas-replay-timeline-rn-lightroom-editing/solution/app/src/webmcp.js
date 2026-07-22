import { GlazeTestSchema, SessionSchema } from './schema';

window.webmcp_session_info = function() {
  return {
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"],
    capabilities: {}
  };
};

window.webmcp_list_tools = function() {
  return [
    {
      name: "entity_create",
      description: "Create a new glaze test",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" }
        },
        required: ["name"]
      }
    },
    {
      name: "entity_select",
      description: "Select a glaze test by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_update",
      description: "Update a glaze test",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete a glaze test by ID",
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
      name: "artifact_export",
      description: "Export current session",
      parameters: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["glaze-atlas-v1.json"] }
        },
        required: ["format"]
      }
    },
    {
      name: "artifact_import",
      description: "Import session JSON",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["glaze-atlas-v1.json"] },
          data: { type: "object" }
        },
        required: ["mode", "data"]
      }
    }
  ];
};

window.webmcp_invoke_tool = async function(name, args) {
  const state = window.__appState;
  const dispatch = window.__appDispatch;

  if (!state || !dispatch) {
    return { isError: true, text: "Application not initialized" };
  }

  try {
    switch (name) {
      case "entity_create": {
        const newRecord = {
          id: Math.random().toString(36).substr(2, 9),
          name: args.name,
          status: "draft",
          history: [{ timestamp: new Date().toISOString(), status: "draft" }]
        };
        GlazeTestSchema.parse(newRecord);
        dispatch({ type: 'CREATE_RECORD', payload: newRecord });
        dispatch({ type: 'SELECT_RECORD', payload: newRecord.id });
        return { isError: false, text: "Created", result: newRecord };
      }

      case "entity_select": {
        const record = state.records.find(r => r.id === args.id);
        if (!record) return { isError: true, text: "Record not found" };
        dispatch({ type: 'SELECT_RECORD', payload: args.id });
        return { isError: false, text: "Selected", result: record };
      }

      case "entity_update": {
        const record = state.records.find(r => r.id === args.id);
        if (!record) return { isError: true, text: "Record not found" };
        const updated = { ...record };
        if (args.name !== undefined) updated.name = args.name;
        if (args.status !== undefined && args.status !== record.status) {
          updated.status = args.status;
          updated.history = [...record.history, { timestamp: new Date().toISOString(), status: args.status }];
        }
        dispatch({ type: 'UPDATE_RECORD', payload: updated });
        return { isError: false, text: "Updated", result: updated };
      }

      case "entity_delete": {
        if (!args.confirm) return { isError: true, text: "Must provide confirm=true" };
        const record = state.records.find(r => r.id === args.id);
        if (!record) return { isError: true, text: "Record not found" };
        dispatch({ type: 'DELETE_RECORD', payload: record });
        return { isError: false, text: "Deleted" };
      }

      case "artifact_export": {
        // Must calculate derived logic here if we don't have access to the context derived
        const records = state.records;
        const readyTests = records.filter(r => r.status === "ready").length;
        let latestChangedAt = null;
        records.forEach(r => {
          r.history.forEach(h => {
            if (!latestChangedAt || new Date(h.timestamp) > new Date(latestChangedAt)) {
              latestChangedAt = h.timestamp;
            }
          });
        });
        const derived = { totalTests: records.length, readyTests, latestChangedAt };

        const session = {
          schemaVersion: "v1",
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived,
          history: []
        };
        return { isError: false, text: "Exported", result: session };
      }

      case "artifact_import": {
        const parsed = SessionSchema.parse(args.data);
        dispatch({ type: 'SET_STATE', payload: { records: parsed.records, selectedId: null, undoStack: [] } });
        return { isError: false, text: "Imported" };
      }

      default:
        return { isError: true, text: `Tool ${name} not found` };
    }
  } catch (err) {
    return { isError: true, text: err.message };
  }
};
