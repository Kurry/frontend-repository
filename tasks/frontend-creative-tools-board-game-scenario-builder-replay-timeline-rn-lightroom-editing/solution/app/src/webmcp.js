import { store, loadState, addRecord, updateRecord, deleteRecord, setActiveRecord, scrubTimeline } from './store';

// Contract: zto-webmcp-v1
// Modules: structured-editor-v1, entity-collection-v1, artifact-transfer-v1

export function initWebMCP() {
  window.webmcp_session_info = () => {
    return {
      contract_version: "zto-webmcp-v1",
      modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
    };
  };

  window.webmcp_list_tools = () => {
    return [
      // structured-editor-v1: editor object types: scenario-record
      {
        name: "editor_select",
        description: "Select a scenario-record in the editor.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "editor_update_property",
        description: "Update a property (timeline-state, status) on the selected scenario-record.",
        inputSchema: {
          type: "object",
          properties: {
              property: { type: "string", enum: ["timeline-state", "status"] },
              value: { type: "string" }
          },
          required: ["property", "value"]
        }
      },
      {
        name: "editor_preview",
        description: "Preview the derived state of the active scenario.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "editor_switch_mode",
        description: "Switch between edit and replay modes. (No-op in this implementation as both are on screen)",
        inputSchema: {
            type: "object",
            properties: { mode: { type: "string", enum: ["edit", "replay"] } },
            required: ["mode"]
        }
      },
      {
        name: "editor_set_content",
        description: "Set the content (title, description) of the active scenario.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" }
            }
        }
      },

      // entity-collection-v1: scenario
      {
        name: "entity_create",
        description: "Create a new scenario entity.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          }
        }
      },
      {
        name: "entity_select",
        description: "Select a scenario entity.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "entity_update",
        description: "Update a scenario entity.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete",
        description: "Delete a scenario entity. Requires confirm=true.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" }, confirm: { type: "boolean" } },
          required: ["id", "confirm"]
        }
      },
      {
        name: "entity_toggle",
        description: "Toggle a boolean property (e.g., archived status) on a scenario entity.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },

      // artifact-transfer-v1
      {
        name: "artifact_export",
        description: "Export the scenario session data.",
        inputSchema: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["scenario-builder-v1-replay-timeline.json"] }
          },
          required: ["format"]
        }
      },
      {
        name: "artifact_import",
        description: "Import scenario session data.",
        inputSchema: {
          type: "object",
          properties: {
            data: { type: "string" },
            mode: { type: "string", enum: ["scenario-builder-v1-replay-timeline.json"] }
          },
          required: ["data", "mode"]
        }
      },
      {
        name: "artifact_copy",
        description: "Copy scenario session data to clipboard (Playwright observed).",
        inputSchema: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["scenario-builder-v1-replay-timeline.json"] }
          },
          required: ["format"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (name, args) => {
    try {
        switch (name) {
            case "editor_select":
            case "entity_select":
                setActiveRecord(args.id);
                return { result: { success: true, activeId: args.id } };

            case "editor_update_property":
                if (!store.activeRecordId) throw new Error("No active record selected");
                if (args.property === "timeline-state") {
                    scrubTimeline(store.activeRecordId, parseInt(args.value, 10));
                } else if (args.property === "status") {
                    updateRecord(store.activeRecordId, { status: args.value });
                }
                return { result: { success: true } };

            case "editor_preview":
                if (!store.activeRecordId) throw new Error("No active record selected");
                const previewRec = store.records.find(r => r.id === store.activeRecordId);
                return { result: { derived: previewRec.derived } };

            case "editor_switch_mode":
                return { result: { success: true, mode: args.mode } };

            case "editor_set_content":
                if (!store.activeRecordId) throw new Error("No active record selected");
                updateRecord(store.activeRecordId, {
                    ...(args.title !== undefined && { title: args.title }),
                    ...(args.description !== undefined && { description: args.description })
                });
                return { result: { success: true } };

            case "entity_create":
                const newId = `rec-${Date.now()}`;
                addRecord({
                    id: newId,
                    title: args.title || 'New Scenario',
                    description: args.description || '',
                    status: 'draft',
                    timelineState: 0,
                    history: [{ timestamp: Date.now(), state: { timelineState: 0, status: 'draft' } }],
                    derived: { summary: 'Newly created scenario' }
                });
                return { result: { success: true, id: newId } };

            case "entity_update":
                updateRecord(args.id, {
                    ...(args.title !== undefined && { title: args.title }),
                    ...(args.description !== undefined && { description: args.description }),
                    ...(args.status !== undefined && { status: args.status })
                });
                return { result: { success: true } };

            case "entity_delete":
                if (args.confirm !== true) throw new Error("confirm=true required to delete");
                deleteRecord(args.id);
                if (store.activeRecordId === args.id) setActiveRecord(null);
                return { result: { success: true } };

            case "entity_toggle":
                const record = store.records.find(r => r.id === args.id);
                if (record) {
                    updateRecord(args.id, { status: record.status === 'archived' ? 'ready' : 'archived' });
                }
                return { result: { success: true } };

            case "artifact_export":
            case "artifact_copy":
                return {
                    result: {
                        schemaVersion: 'v1',
                        exportedAt: new Date().toISOString(),
                        records: store.records
                    }
                };

            case "artifact_import":
                const data = JSON.parse(args.data);
                if (data.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion");
                loadState({
                    schemaVersion: 'v1',
                    exportedAt: new Date().toISOString(),
                    records: data.records,
                    activeRecordId: null,
                    filterStatus: 'all'
                });
                return { result: { success: true } };

            default:
                throw new Error(`Tool ${name} not found`);
        }
    } catch (e) {
        return { error: e.message };
    }
  };
}
