import { useStore } from './store';

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    "contract_version": "zto-webmcp-v1",
    "app_name": "recipe-substitution-sandbox",
    "supported_modules": [
      "structured-editor-v1",
      "entity-collection-v1",
      "artifact-transfer-v1"
    ]
  });

  window.webmcp_list_tools = () => [
    {
      "name": "editor_select",
      "description": "Select an editor object.",
      "parameters": {
        "type": "object",
        "properties": {
          "object_type": { "type": "string", "enum": ["recipe-ingredient"] },
          "id": { "type": "string" }
        },
        "required": ["object_type", "id"]
      }
    },
    {
      "name": "editor_update_property",
      "description": "Update a property of the selected object.",
      "parameters": {
        "type": "object",
        "properties": {
          "object_type": { "type": "string", "enum": ["recipe-ingredient"] },
          "id": { "type": "string" },
          "property": { "type": "string", "enum": ["timeline-state", "quantity", "substitution"] },
          "value": { "type": "string" }
        },
        "required": ["object_type", "id", "property", "value"]
      }
    },
    {
      "name": "editor_switch_mode",
      "description": "Switch editor mode.",
      "parameters": {
        "type": "object",
        "properties": {
          "mode": { "type": "string", "enum": ["replay", "edit"] }
        },
        "required": ["mode"]
      }
    },
    {
      "name": "editor_preview",
      "description": "Preview editor content.",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "entity_create",
      "description": "Create a new entity.",
      "parameters": {
        "type": "object",
        "properties": {
          "entity": { "type": "string", "enum": ["record"] },
          "fields": { "type": "object" }
        },
        "required": ["entity", "fields"]
      }
    },
    {
      "name": "entity_select",
      "description": "Select an entity.",
      "parameters": {
        "type": "object",
        "properties": {
          "entity": { "type": "string", "enum": ["record"] },
          "id": { "type": "string" }
        },
        "required": ["entity", "id"]
      }
    },
    {
      "name": "entity_update",
      "description": "Update an entity.",
      "parameters": {
        "type": "object",
        "properties": {
          "entity": { "type": "string", "enum": ["record"] },
          "id": { "type": "string" },
          "fields": { "type": "object" }
        },
        "required": ["entity", "id", "fields"]
      }
    },
    {
      "name": "entity_delete",
      "description": "Delete an entity.",
      "parameters": {
        "type": "object",
        "properties": {
          "entity": { "type": "string", "enum": ["record"] },
          "id": { "type": "string" },
          "confirm": { "type": "boolean" }
        },
        "required": ["entity", "id", "confirm"]
      }
    },
    {
      "name": "entity_reorder",
      "description": "Reorder entities.",
      "parameters": {
        "type": "object",
        "properties": {
          "entity": { "type": "string", "enum": ["record"] },
          "id": { "type": "string" },
          "new_index": { "type": "number" }
        },
        "required": ["entity", "id", "new_index"]
      }
    },
    {
      "name": "artifact_export",
      "description": "Export the artifact.",
      "parameters": {
        "type": "object",
        "properties": {
          "format": { "type": "string", "enum": ["recipe-substitution-v1.json"] }
        },
        "required": ["format"]
      }
    },
    {
      "name": "artifact_import",
      "description": "Import an artifact.",
      "parameters": {
        "type": "object",
        "properties": {
          "mode": { "type": "string", "enum": ["recipe-substitution-v1.json"] },
          "data": { "type": "string" }
        },
        "required": ["mode", "data"]
      }
    },
    {
      "name": "artifact_copy",
      "description": "Copy artifact.",
      "parameters": {
        "type": "object",
        "properties": {
          "format": { "type": "string", "enum": ["recipe-substitution-v1.json"] }
        },
        "required": ["format"]
      }
    }
  ];

  window.webmcp_invoke_tool = async (name, args) => {
    const store = useStore.getState();

    switch (name) {
      case "editor_select": {
        store.selectRecord(args.id);
        return { success: true, message: `Selected ${args.object_type} ${args.id}` };
      }
      case "editor_update_property": {
        const fieldName = args.property === 'timeline-state' ? 'timelineState' : args.property;
        store.mutateRecordWithHistory(args.id, { [fieldName]: args.value });
        return { success: true, message: `Updated ${args.property} on ${args.id}` };
      }
      case "editor_switch_mode": {
        return { success: true, message: `Switched to mode ${args.mode}` };
      }
      case "editor_preview": {
        return { success: true, message: "Preview opened" };
      }

      case "entity_create": {
        store.addRecord(args.fields);
        return { success: true, message: "Record created" };
      }
      case "entity_select": {
        store.selectRecord(args.id);
        return { success: true, message: `Selected entity ${args.id}` };
      }
      case "entity_update": {
        store.updateRecord(args.id, args.fields);
        return { success: true, message: `Updated entity ${args.id}` };
      }
      case "entity_delete": {
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
        store.deleteRecord(args.id);
        return { success: true, message: `Deleted entity ${args.id}` };
      }
      case "entity_reorder": {
        return { success: true, message: "Reordered (no-op in basic logic)" };
      }

      case "artifact_export":
      case "artifact_copy": {
        const content = store.exportArtifact();
        return { success: true, content };
      }
      case "artifact_import": {
        store.importArtifact(args.data);
        return { success: true, message: "Artifact imported" };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
