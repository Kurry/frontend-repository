import { useStore } from "./store"; import type { RecordStatus } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any;
    webmcp_invoke_tool: (toolName: string, args: any) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => ({
    tools: [
      {
        name: "entity_create",
        description: "Create a kiln record",
        input_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
            temperature: { type: "number" },
            notes: { type: "string" }
          },
          required: ["name"]
        }
      },
      {
        name: "entity_select",
        description: "Select a kiln record",
        input_schema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "entity_update",
        description: "Update a kiln record",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete",
        description: "Delete a kiln record",
        input_schema: {
          type: "object",
          properties: { id: { type: "string" }, confirm: { type: "boolean" } },
          required: ["id", "confirm"]
        }
      },
      {
        name: "entity_query",
        description: "List kiln records",
        input_schema: { type: "object", properties: {} }
      },
      {
        name: "artifact_export",
        description: "Export the session artifact",
        input_schema: { type: "object", properties: { format: { type: "string" } } }
      },
      {
        name: "artifact_import",
        description: "Import a session artifact",
        input_schema: { type: "object", properties: { data: { type: "object" } }, required: ["data"] }
      },
      {
        name: "artifact_clear",
        description: "Clear the session",
        input_schema: { type: "object", properties: { confirm: { type: "boolean" } }, required: ["confirm"] }
      }
    ]
  });

  window.webmcp_invoke_tool = (toolName: string, args: any) => {
    const store = useStore.getState();

    switch (toolName) {
      case "entity_create":
        store.addRecord({
          name: args.name,
          status: (args.status || "draft") as RecordStatus,
          lineage: "good",
          temperature: args.temperature || 0,
          notes: args.notes || ""
        });
        return { result: "success" };

      case "entity_select":
        store.selectRecord(args.id);
        return { result: "success" };

      case "entity_update":
        store.updateRecord(args.id, args);
        return { result: "success" };

      case "entity_delete":
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { result: "success" };
        }
        throw new Error("confirm required");

      case "entity_query":
        return { records: store.records };

      case "artifact_export":
        return { data: store.exportSession() };

      case "artifact_import":
        const success = store.importSession(args.data);
        if (!success) throw new Error("Invalid schema");
        return { result: "success" };

      case "artifact_clear":
        if (args.confirm) {
          store.clearSession();
          return { result: "success" };
        }
        throw new Error("confirm required");

      default:
        throw new Error(`Unknown tool ${toolName}`);
    }
  };
}
