import { useStore } from './store'

window.webmcp_session_info = {
    schemaVersion: "1.0",
    name: "Recipe Substitution Sandbox - Provenance Atlas",
    status: "active",
    capabilities: ["recipe_mutation", "provenance_trace", "artifact_export"]
}

window.webmcp_list_tools = async function() {
    return [
        {
            name: "get_state",
            description: "Gets the current application state.",
            inputSchema: {
                type: "object",
                properties: {},
            }
        },
        {
            name: "add_record",
            description: "Adds a new recipe ingredient record.",
            inputSchema: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    quantity: { type: "string" },
                    substitute: { type: "string" },
                    reason: { type: "string" },
                    source: { type: "string" },
                    status: { type: "string" }
                },
                required: ["name", "substitute"]
            }
        },
        {
            name: "update_record",
            description: "Updates an existing record.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    quantity: { type: "string" },
                    substitute: { type: "string" },
                    reason: { type: "string" },
                    source: { type: "string" },
                    status: { type: "string" }
                },
                required: ["id"]
            }
        },
        {
            name: "delete_record",
            description: "Deletes a record.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string" }
                },
                required: ["id"]
            }
        },
        {
            name: "archive_record",
            description: "Archives a record.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string" }
                },
                required: ["id"]
            }
        },
        {
            name: "trace_and_quarantine",
            description: "Traces a selected record to source evidence and quarantines a bad lineage.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string" }
                },
                required: ["id"]
            }
        },
        {
            name: "undo",
            description: "Undoes the last mutation.",
            inputSchema: {
                type: "object",
                properties: {},
            }
        },
        {
            name: "export_session",
            description: "Exports the session to a JSON string matching the field contract.",
            inputSchema: {
                type: "object",
                properties: {},
            }
        },
        {
            name: "import_session",
            description: "Imports a JSON string representing a session.",
            inputSchema: {
                type: "object",
                properties: {
                    sessionJson: { type: "string" }
                },
                required: ["sessionJson"]
            }
        },
        {
            name: "clear_session",
            description: "Clears the current session.",
            inputSchema: {
                type: "object",
                properties: {},
            }
        }
    ]
}

window.webmcp_invoke_tool = async function(name, args) {
    const store = useStore.getState()

    switch (name) {
        case "get_state":
            return {
                records: store.records,
                derived: store.derived,
                history: store.history,
                selectedRecordId: store.selectedRecordId,
                filterStatus: store.filterStatus
            }
        case "add_record":
            store.addRecord(args)
            return { status: "success" }
        case "update_record":
            const { id, ...updates } = args
            store.updateRecord(id, updates)
            return { status: "success" }
        case "delete_record":
            store.deleteRecord(args.id)
            return { status: "success" }
        case "archive_record":
            store.archiveRecord(args.id)
            return { status: "success" }
        case "trace_and_quarantine":
            store.traceAndQuarantine(args.id)
            return { status: "success" }
        case "undo":
            store.undoLastMutation()
            return { status: "success" }
        case "export_session":
            return { json: store.exportSession() }
        case "import_session":
            const success = store.importSession(args.sessionJson)
            if (!success) {
                throw new Error("Invalid import data or schema")
            }
            return { status: "success" }
        case "clear_session":
            store.clearSession()
            return { status: "success" }
        default:
            throw new Error(`Tool ${name} not found`)
    }
}
