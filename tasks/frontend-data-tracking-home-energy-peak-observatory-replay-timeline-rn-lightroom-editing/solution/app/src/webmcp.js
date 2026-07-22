import { storeActions, getRawState } from './store.js';

export function initWebMCP() {
    if (typeof window === 'undefined') return;

    window.webmcp_session_info = () => {
        return {
            contract_version: "zto-webmcp-v1",
            supported_modules: ["entity-collection-v1", "timeline-scrub-v1", "artifact-transfer-v1"]
        };
    };

    const tools = [
        {
            name: "entity_create",
            description: "Create a new reading",
            parameters: {
                type: "object",
                properties: {
                    value: { type: "number" },
                    status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
                },
                required: ["value"]
            }
        },
        {
            name: "entity_select",
            description: "Select a reading",
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
            description: "Update a reading",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    value: { type: "number" },
                    status: { type: "string" }
                },
                required: ["id"]
            }
        },
        {
            name: "timeline_scrub",
            description: "Scrub the selected record timeline",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    checkpoint_index: { type: "number" }
                },
                required: ["id", "checkpoint_index"]
            }
        },
        {
            name: "timeline_restore_checkpoint",
            description: "Restore a prior checkpoint",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" }
                },
                required: ["id"]
            }
        },
        {
            name: "timeline_undo",
            description: "Undo the last mutation",
            parameters: {
                type: "object",
                properties: {}
            }
        },
        {
            name: "artifact_export",
            description: "Query artifact metadata",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    ];

    window.webmcp_list_tools = () => tools;

    window.webmcp_invoke_tool = async (name, args) => {
        const { addRecord, selectRecord, updateRecord, scrubTimeline, restoreCheckpoint, undo } = storeActions;

        try {
            switch (name) {
                case "entity_create":
                    const newRec = {
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        value: args.value,
                        status: args.status || 'draft',
                        checkpoints: []
                    };
                    addRecord(newRec);
                    return { status: "success", id: newRec.id };
                case "entity_select":
                    selectRecord(args.id);
                    return { status: "success" };
                case "entity_update":
                    updateRecord(args.id, args);
                    return { status: "success" };
                case "timeline_scrub":
                    scrubTimeline(args.id, args.checkpoint_index);
                    return { status: "success" };
                case "timeline_restore_checkpoint":
                    restoreCheckpoint(args.id);
                    return { status: "success" };
                case "timeline_undo":
                    undo();
                    return { status: "success" };
                case "artifact_export":
                    const state = getRawState();
                    const artifact = {
                        schemaVersion: 'v1',
                        exportedAt: new Date().toISOString(),
                        records: state.records,
                        derived: state.derived,
                    };
                    return { status: "success", artifact: JSON.stringify(artifact) };
                default:
                    throw new Error(`Tool not found: ${name}`);
            }
        } catch (error) {
            return { status: "error", error: error.message };
        }
    };
}
