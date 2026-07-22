import { useStore } from './store';

window.webmcp_session_info = () => {
    return {
        apiVersion: "1.0",
        capabilities: {
            tools: true,
            subscriptions: false
        }
    };
};

window.webmcp_list_tools = () => {
    return [
        {
            name: "query_state",
            description: "Query the current state of the application",
            inputSchema: {
                type: "object",
                properties: {},
                required: []
            }
        },
        {
            name: "import_artifact",
            description: "Import an artifact state into the application",
            inputSchema: {
                type: "object",
                properties: {
                    data: {
                        type: "object",
                        description: "The artifact data matching schemaVersion v1"
                    }
                },
                required: ["data"]
            }
        },
        {
            name: "export_artifact",
            description: "Export the current application state",
            inputSchema: {
                type: "object",
                properties: {},
                required: []
            }
        },
        {
            name: "add_record",
            description: "Add a new recipe ingredient",
            inputSchema: {
                type: "object",
                properties: {
                    record: { type: "object" }
                },
                required: ["record"]
            }
        },
        {
            name: "update_record",
            description: "Update an existing recipe ingredient",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    updates: { type: "object" }
                },
                required: ["id", "updates"]
            }
        },
        {
            name: "assign_handoff_owner",
            description: "Assign a handoff owner to a record and update readiness",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    owner: { type: "string", nullable: true }
                },
                required: ["id", "owner"]
            }
        },
        {
            name: "undo",
            description: "Undo the last mutation",
            inputSchema: {
                type: "object",
                properties: {},
                required: []
            }
        }
    ];
};

window.webmcp_invoke_tool = async (name, args) => {
    switch (name) {
        case "query_state": {
            const state = useStore.getState();
            return {
                records: state.records,
                selectedRecordId: state.selectedRecordId,
                derived: state.getDerivedState()
            };
        }
        case "export_artifact": {
            const data = useStore.getState().getArtifactData();
            return data;
        }
        case "import_artifact": {
            const success = useStore.getState().importData(args.data);
            if (success) {
                return { success: true };
            } else {
                return { success: false, error: "Invalid artifact data" };
            }
        }
        case "add_record": {
            useStore.getState().addRecord(args.record);
            return { success: true };
        }
        case "update_record": {
            useStore.getState().updateRecord(args.id, args.updates);
            return { success: true };
        }
        case "assign_handoff_owner": {
            useStore.getState().assignHandoffOwner(args.id, args.owner);
            return { success: true };
        }
        case "undo": {
            useStore.getState().undo();
            return { success: true };
        }
        default:
            throw new Error(`Tool not found: ${name}`);
    }
};
