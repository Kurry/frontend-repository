import { dispatchGlobal, initialState } from './store.js';
import { importArtifact } from './utils.js';

export const initWebMCP = () => {
    window.webmcp_session_info = () => {
        return {
            status: "ready",
            task: "frontend-data-tracking-freelance-invoice-aging-lens-recovery-board-rn-canva-live-preview"
        };
    };

    window.webmcp_list_tools = () => {
        return [
            {
                name: "query_state",
                description: "Queries the current state of the Freelance Invoice Aging Lens.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "reset_state",
                description: "Resets the application to its initial state.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "import_artifact",
                description: "Imports a full state artifact into the application.",
                inputSchema: {
                    type: "object",
                    properties: {
                        artifact: {
                            type: "object",
                            description: "The complete state object to import"
                        }
                    },
                    required: ["artifact"]
                }
            },
            {
                name: "add_record",
                description: "Adds a new invoice record.",
                inputSchema: {
                    type: "object",
                    properties: {
                        record: {
                            type: "object",
                            description: "The invoice record to add"
                        }
                    },
                    required: ["record"]
                }
            }
        ];
    };

    window.webmcp_invoke_tool = async (toolName, args) => {
        try {
            switch (toolName) {
                case "query_state":
                    return window.__APP_STATE__;

                case "reset_state":
                    window.__APP_STATE__ = JSON.parse(JSON.stringify(initialState));
                    dispatchGlobal({ type: 'IMPORT_STATE', payload: window.__APP_STATE__ });
                    return { success: true, message: "State reset to initial" };

                case "import_artifact":
                    const validatedState = importArtifact(args.artifact);
                    dispatchGlobal({ type: 'IMPORT_STATE', payload: validatedState });
                    return { success: true, message: "Artifact imported successfully" };

                case "add_record":
                    dispatchGlobal({ type: 'CREATE_RECORD', payload: args.record });
                    return { success: true, message: `Record ${args.record.id} added` };

                default:
                    throw new Error(`Tool ${toolName} not found`);
            }
        } catch (error) {
            return { error: error.message };
        }
    };
};
