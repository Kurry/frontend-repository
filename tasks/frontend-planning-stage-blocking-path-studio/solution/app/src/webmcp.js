import { useStore } from './store';

// Basic standard module shape for WebMCP tasks
const MODULES = {
    "stage-blocking": {
        name: "stage-blocking",
        description: "Stage blocking score and state management",
        tools: {
            "get_score": {
                description: "Get the current blocking score and state",
                parameters: { type: "object", properties: {} }
            },
            "update_waypoint": {
                description: "Update a waypoint",
                parameters: {
                    type: "object",
                    properties: {
                        key: { type: "string" },
                        data: { type: "object" }
                    },
                    required: ["key", "data"]
                }
            },
            "add_waypoint": {
                description: "Add a waypoint",
                parameters: {
                    type: "object",
                    properties: {
                        entityId: { type: "string" },
                        beat: { type: "number" },
                        x: { type: "number" },
                        y: { type: "number" },
                        facing: { type: "number" },
                        type: { type: "string" },
                        hold: { type: "boolean" }
                    },
                    required: ["entityId", "beat", "x", "y"]
                }
            },
            "set_beat": {
                description: "Set the current beat",
                parameters: {
                    type: "object",
                    properties: { beat: { type: "number" } },
                    required: ["beat"]
                }
            },
            "create_branch": {
                description: "Create a new blocking branch",
                parameters: {
                    type: "object",
                    properties: { name: { type: "string" }, from: { type: "string" } },
                    required: ["name"]
                }
            },
            "checkout_branch": {
                description: "Checkout a blocking branch",
                parameters: {
                    type: "object",
                    properties: { name: { type: "string" } },
                    required: ["name"]
                }
            },
            "approve_score": {
                description: "Approve the score",
                parameters: { type: "object", properties: {} }
            }
        }
    }
};

export const bindWebMCP = () => {
    window.webmcp_session_info = {
        schemaVersion: "zto-webmcp-v1",
        supportedModules: ["stage-blocking"]
    };

    window.webmcp_list_tools = (moduleName) => {
        if (!MODULES[moduleName]) return [];
        return Object.entries(MODULES[moduleName].tools).map(([name, schema]) => ({
            name,
            ...schema
        }));
    };

    window.webmcp_invoke_tool = async (moduleName, toolName, params) => {
        if (moduleName !== "stage-blocking") throw new Error("Unknown module");
        const state = useStore.getState();

        switch (toolName) {
            case "get_score":
                return {
                    score: state.score,
                    currentBeat: state.currentBeat,
                    activeBranch: state.score.activeBranch
                };
            case "update_waypoint":
                state.updateWaypoint(params.key, params.data);
                return { success: true };
            case "add_waypoint":
                state.addWaypoint(params);
                return { success: true };
            case "set_beat":
                state.setBeat(params.beat);
                return { success: true };
            case "create_branch":
                state.createBranch(params.name, params.from);
                return { success: true };
            case "checkout_branch":
                state.checkoutBranch(params.name);
                return { success: true };
            case "approve_score":
                state.approveScore();
                return { success: true };
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    };
};
