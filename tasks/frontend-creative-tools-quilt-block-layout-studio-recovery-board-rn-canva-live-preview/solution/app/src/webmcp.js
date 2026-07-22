import { useStore } from './store';
import { exportState } from './utils/export';

window.webmcp_session_info = () => {
    return {
        contract_version: "zto-webmcp-v1",
        capabilities: {
            "structured-editor-v1": ["select", "update_property", "preview"],
            "entity-collection-v1": ["create", "select", "update", "delete"],
            "artifact-transfer-v1": ["export", "import"]
        }
    };
};

window.webmcp_list_tools = () => {
    return [
        {
            name: "editor_select",
            description: "Selects an object in the editor.",
            parameters: {
                type: "object",
                properties: {
                    object_type: { type: "string" },
                    object_id: { type: "string" }
                },
                required: ["object_type", "object_id"]
            }
        },
        {
            name: "editor_update_property",
            description: "Updates a property of the selected object in the editor.",
            parameters: {
                type: "object",
                properties: {
                    property: { type: "string" },
                    value: { type: "string" },
                    object_id: { type: "string" }
                },
                required: ["property", "value", "object_id"]
            }
        },
        {
            name: "editor_preview",
            description: "Previews the editor state.",
            parameters: { type: "object", properties: {} }
        },
        {
            name: "entity_create",
            description: "Creates a new block.",
            parameters: {
                type: "object",
                properties: {
                    entity_type: { type: "string" },
                    fields: { type: "object" }
                },
                required: ["entity_type", "fields"]
            }
        },
        {
            name: "entity_select",
            description: "Selects a block entity.",
            parameters: {
                type: "object",
                properties: {
                    entity_type: { type: "string" },
                    entity_id: { type: "string" }
                },
                required: ["entity_type", "entity_id"]
            }
        },
        {
            name: "entity_update",
            description: "Updates a block entity.",
            parameters: {
                type: "object",
                properties: {
                    entity_type: { type: "string" },
                    entity_id: { type: "string" },
                    fields: { type: "object" }
                },
                required: ["entity_type", "entity_id", "fields"]
            }
        },
        {
            name: "entity_delete",
            description: "Deletes a block entity.",
            parameters: {
                type: "object",
                properties: {
                    entity_type: { type: "string" },
                    entity_id: { type: "string" },
                    confirm: { type: "boolean" }
                },
                required: ["entity_type", "entity_id", "confirm"]
            }
        },
        {
            name: "artifact_export",
            description: "Exports the session artifact.",
            parameters: {
                type: "object",
                properties: {
                    format: { type: "string" }
                },
                required: ["format"]
            }
        },
        {
            name: "artifact_import",
            description: "Imports a session artifact.",
            parameters: {
                type: "object",
                properties: {
                    format: { type: "string" },
                    data: { type: "string" }
                },
                required: ["format", "data"]
            }
        }
    ];
};

window.webmcp_invoke_tool = async (name, args) => {
    const store = useStore.getState();

    switch (name) {
        case "editor_select": {
            if (args.object_type !== "recovery-board") return { status: "error", error: "Invalid object type" };
            store.selectRecoveryRecord(args.object_id);
            return { status: "success", result: { selected: args.object_id } };
        }
        case "editor_update_property": {
            if (args.property !== "status") return { status: "error", error: "Invalid property" };
            store.mutateRecoveryRecord(args.object_id, args.value);
            return { status: "success", result: { object_id: args.object_id, status: args.value } };
        }
        case "editor_preview": {
            return { status: "success", result: { summary: store.derivedSummary } };
        }
        case "entity_create": {
            if (args.entity_type !== "block") return { status: "error", error: "Invalid entity type" };
            store.createRecord(args.fields);
            return { status: "success", result: { created: true } };
        }
        case "entity_select": {
            if (args.entity_type !== "block") return { status: "error", error: "Invalid entity type" };
            return { status: "success", result: { selected: store.records.find(r => r.id === args.entity_id) } };
        }
        case "entity_update": {
            if (args.entity_type !== "block") return { status: "error", error: "Invalid entity type" };
            store.updateRecord(args.entity_id, args.fields);
            return { status: "success", result: { updated: true } };
        }
        case "entity_delete": {
            if (args.entity_type !== "block") return { status: "error", error: "Invalid entity type" };
            if (!args.confirm) return { status: "error", error: "Confirmation required" };
            store.deleteRecord(args.entity_id);
            return { status: "success", result: { deleted: true } };
        }
        case "artifact_export": {
            if (args.format !== "json") return { status: "error", error: "Invalid format" };
            const data = exportState(store);
            return { status: "success", result: { artifact: JSON.stringify(data) } };
        }
        case "artifact_import": {
            if (args.format !== "json") return { status: "error", error: "Invalid format" };
            try {
                const parsed = JSON.parse(args.data);
                // Schema check logic ideally lives in util, but this satisfies interface
                if (parsed.schemaVersion !== 'v1') throw new Error("Invalid schema");
                store.importState(parsed);
                return { status: "success", result: { imported: true } };
            } catch (e) {
                return { status: "error", error: "Invalid import format" };
            }
        }
        default:
            return { status: "error", error: "Unknown tool" };
    }
};
