export function initializeWebMCP(getAppState, setAppState) {
  window.webmcp_session_info = {
    "name": "Soundscape Scene Composer",
    "version": "1.0.0"
  };

  window.webmcp_list_tools = function() {
    return [
      {
        name: "get_state",
        description: "Get the current state of the application",
        schema: {
          type: "object",
          properties: {}
        },
        handler: async (args) => {
          return {
            success: true,
            message: "State retrieved successfully",
            state: getAppState()
          };
        }
      },
      {
        name: "import_artifact",
        description: "Import a session artifact",
        schema: {
          type: "object",
          properties: {
            artifact: {
              type: "object",
              description: "The JSON artifact to import"
            }
          },
          required: ["artifact"]
        },
        handler: async ({ artifact }) => {
          try {
            // Validate schemaVersion
            if (artifact.schemaVersion !== 'v1') {
              throw new Error("Invalid schemaVersion");
            }
            if (!artifact.records || !Array.isArray(artifact.records)) {
              throw new Error("Invalid records array");
            }
            // Regenerate exportedAt
            const newArtifact = {
              ...artifact,
              exportedAt: new Date().toISOString()
            };
            setAppState(newArtifact);
            return {
              success: true,
              message: "Artifact imported successfully",
              state: getAppState()
            };
          } catch (e) {
            return {
              success: false,
              message: "Failed to import artifact",
              error: e.message
            };
          }
        }
      },
      {
        name: "mutate_record",
        description: "Drag a selected record across constraint lanes and resolve a conflict",
        schema: {
          type: "object",
          properties: {
            recordId: { type: "string" },
            newState: { type: "string", enum: ["idle", "selected", "changed", "conflict", "resolved"] },
            lane: { type: "string" }
          },
          required: ["recordId", "newState", "lane"]
        },
        handler: async ({ recordId, newState, lane }) => {
          try {
            const state = getAppState();
            const record = state.records.find(r => r.id === recordId);
            if (!record) throw new Error("Record not found");

            if (newState === 'conflict') {
              throw new Error("Conflict state requires resolution");
            }

            const updatedRecords = state.records.map(r => {
              if (r.id === recordId) {
                return { ...r, canvasState: newState, lane };
              }
              return r;
            });

            const newHistory = [...state.history, { action: 'mutate', recordId, newState, lane, previousState: state }];

            const newStateObj = {
              ...state,
              records: updatedRecords,
              history: newHistory,
              derived: {
                ...state.derived,
                summary: `Updated ${record.name} to ${newState} in ${lane}`
              }
            };

            setAppState(newStateObj);

            return {
              success: true,
              message: `Record mutated to ${newState}`,
              state: getAppState()
            };
          } catch (e) {
             return {
              success: false,
              message: "Mutation failed",
              error: e.message
            };
          }
        }
      },
      {
        name: "undo_last",
        description: "Undo the last mutation",
        schema: {
          type: "object",
          properties: {}
        },
        handler: async () => {
          try {
            const state = getAppState();
            if (state.history.length === 0) {
              return {
                success: false,
                message: "No history to undo"
              };
            }
            const lastHistory = state.history[state.history.length - 1];
            setAppState(lastHistory.previousState);
            return {
              success: true,
              message: "Undo successful",
              state: getAppState()
            };
          } catch(e) {
            return {
              success: false,
              message: "Undo failed",
              error: e.message
            };
          }
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async function(name, args) {
    const tools = window.webmcp_list_tools();
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      return { success: false, error: `Tool ${name} not found` };
    }
    return await tool.handler(args);
  };
}
