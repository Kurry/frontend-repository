import { useStore } from './store';

// Initialize WebMCP Contract Bindings
window.webmcp_session_info = {
    version: "1.0",
    name: "ceramic-glaze-test-atlas-scenario-weaver",
    capabilities: ["session_read", "session_write"]
};

window.webmcp_list_tools = () => {
    return [
        {
            name: "seed_records",
            description: "Seeds deterministic glaze test records.",
            input_schema: {
                type: "object",
                properties: {
                    records: {
                        type: "array",
                        items: { type: "object" }
                    }
                },
                required: ["records"]
            }
        },
        {
            name: "query_session",
            description: "Exports the current session matching the portable artifact schema.",
            input_schema: {
                type: "object",
                properties: {}
            }
        },
        {
            name: "import_session",
            description: "Imports a full session artifact.",
            input_schema: {
                type: "object",
                properties: {
                    sessionData: {
                        type: "object"
                    }
                },
                required: ["sessionData"]
            }
        },
        {
            name: "branch_scenario",
            description: "Branch a selected record into a scenario programmatically.",
            input_schema: {
                type: "object",
                properties: {
                    recordId: { type: "string" }
                },
                required: ["recordId"]
            }
        }
    ];
};

window.webmcp_invoke_tool = (toolName, args) => {
    const store = useStore.getState();

    switch (toolName) {
        case "seed_records":
            store.setInitialState(args.records, []);
            return JSON.stringify({ success: true, count: args.records.length });

        case "query_session":
            return JSON.stringify(store.exportSession());

        case "import_session": {
            const res = store.importSession(args.sessionData);
            if (res.success) {
                return JSON.stringify({ success: true });
            } else {
                return JSON.stringify({ success: false, error: res.error.message });
            }
        }

        case "branch_scenario": {
            store.branchToScenario(args.recordId);
            return JSON.stringify({ success: true, branchedRecordId: args.recordId });
        }

        default:
            throw new Error(`Tool not found: ${toolName}`);
    }
};
