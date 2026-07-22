import { useStore } from './store';

export function setupWebMCP() {
  window.webmcp_session_info = () => {
    return {
      "contract_version": "zto-webmcp-v1",
      "registered_modules": ["entity-collection-v1", "artifact-transfer-v1"]
    };
  };

  window.webmcp_list_tools = () => {
    return [
      {
        "name": "entity_create",
        "description": "Create a new bike service record",
        "parameters": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "status": { "type": "string", "enum": ["empty", "draft", "ready", "changed", "archived"] },
            "mileage": { "type": "number" },
            "notes": { "type": "string" }
          }
        }
      },
      {
        "name": "entity_select",
        "description": "Select a record",
        "parameters": {
          "type": "object",
          "properties": {
            "id": { "type": "string" }
          },
          "required": ["id"]
        }
      },
      {
        "name": "entity_update",
        "description": "Update a selected record",
        "parameters": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "title": { "type": "string" },
            "status": { "type": "string" },
            "mileage": { "type": "number" }
          },
          "required": ["id"]
        }
      },
      {
        "name": "entity_delete",
        "description": "Delete a record",
        "parameters": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "confirm": { "type": "boolean" }
          },
          "required": ["id", "confirm"]
        }
      },
      {
        "name": "artifact_export",
        "description": "Export the session JSON",
        "parameters": {
          "type": "object",
          "properties": {
            "format": { "type": "string", "enum": ["session-json"] }
          },
          "required": ["format"]
        }
      },
      {
        "name": "artifact_import",
        "description": "Import session JSON",
        "parameters": {
          "type": "object",
          "properties": {
            "data": { "type": "object" }
          },
          "required": ["data"]
        }
      },
      {
        "name": "artifact_copy",
        "description": "Copy artifact JSON string to clipboard (stub)",
        "parameters": {
          "type": "object",
          "properties": {
             "format": { "type": "string", "enum": ["session-json"] }
          }
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (toolName, args) => {
    const store = useStore.getState();

    switch (toolName) {
      case 'entity_create':
        store.createRecord(args);
        return { success: true, message: `Created record ${args.title || 'Untitled'}` };

      case 'entity_select':
        const exists = store.records.find(r => r.id === args.id);
        if (exists) {
            store.selectRecord(args.id);
            return { success: true, data: exists };
        }
        return { success: false, message: 'Record not found' };

      case 'entity_update':
        const result = store.updateRecord(args.id, args);
        if (result.error) return { success: false, message: result.error };
        return { success: true, message: `Updated record ${args.id}` };

      case 'entity_delete':
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true, message: `Deleted record ${args.id}` };
        }
        return { success: false, message: 'confirm must be true' };

      case 'artifact_export':
        if (args.format === 'session-json') {
          return { success: true, data: store.exportState() };
        }
        return { success: false, message: 'Invalid format' };

      case 'artifact_import':
        store.importState(args.data);
        return { success: true, message: 'Imported session JSON' };

      case 'artifact_copy':
        return { success: true, data: JSON.stringify(store.exportState()) };

      default:
        return { success: false, message: `Unknown tool: ${toolName}` };
    }
  };
}
