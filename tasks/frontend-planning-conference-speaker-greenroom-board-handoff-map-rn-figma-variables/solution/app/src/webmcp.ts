import type { StoreType } from './store';

declare global {
  interface Window {
    __store: StoreType;
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => {
    return {
      task_name: "eval-intelligence/frontend-planning-conference-speaker-greenroom-board-handoff-map-rn-figma-variables",
      contract_version: "zto-webmcp-v1",
      modules: [
        "structured-editor-v1",
        "entity-collection-v1",
        "artifact-transfer-v1"
      ]
    };
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: "entity_create_record",
        description: "Creates a new record",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            topic: { type: "string" },
            status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
            owner: { type: "string", nullable: true },
            readiness: { type: "number" }
          },
          required: ["id", "name", "topic", "status", "readiness"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates an existing record",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            updates: { type: "object" }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Archives a record",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            confirm: { type: "boolean" }
          },
          required: ["id", "confirm"]
        }
      },
      {
        name: "editor_update_property",
        description: "Updates property on the handoff-map",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            owner: { type: "string" },
            readiness: { type: "number" }
          },
          required: ["id", "owner", "readiness"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Exports the session artifact",
        input_schema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "artifact_import_session_json",
        description: "Imports the session artifact",
        input_schema: {
          type: "object",
          properties: {
            data: { type: "object" }
          },
          required: ["data"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (name: string, args: any) => {
    const store = window.__store;
    if (!store) throw new Error("Store not initialized");

    switch (name) {
      case "entity_create_record": {
        const success = store.createRecord(args);
        return { result: success ? "success" : "validation_failed" };
      }
      case "entity_update_record": {
        const success = store.updateRecord(args.id, args.updates);
        return { result: success ? "success" : "validation_failed" };
      }
      case "entity_delete_record": {
        if (!args.confirm) return { result: "confirmation_required" };
        store.archiveRecord(args.id);
        return { result: "success" };
      }
      case "editor_update_property": {
        const success = store.connectOwner(args.id, args.owner, args.readiness);
        return { result: success ? "success" : "validation_failed" };
      }
      case "artifact_export_session_json": {
        return { result: store.getSession() };
      }
      case "artifact_import_session_json": {
        const success = store.importSession(args.data);
        return { result: success ? "success" : "validation_failed" };
      }
      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
