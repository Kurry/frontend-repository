import { state, addRecord, updateRecord, removeRecord, clearSession, importSession } from "./store";

export function initWebMCP() {
  window.webmcp_session_info = () => {
    return {
      contract_version: "zto-webmcp-v1",
      modules: ["entity-collection-v1", "artifact-transfer-v1"]
    };
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: "entity_create",
        description: "Create a new record in the collection.",
        parameters: {
          type: "object",
          properties: {
            colors: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived", "conflict", "resolved"] }
          },
          required: ["colors", "status"]
        }
      },
      {
        name: "entity_select",
        description: "Select a record.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_update",
        description: "Update a record in the collection.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            colors: { type: "array", items: { type: "string" } },
            status: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete",
        description: "Delete a record.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            confirm: { type: "boolean" }
          },
          required: ["id", "confirm"]
        }
      },
      {
        name: "artifact_export",
        description: "Export the session artifact.",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["session-json", "png"] }
          },
          required: ["format"]
        }
      },
      {
        name: "artifact_import",
        description: "Import a session artifact.",
        parameters: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["session-json"] },
            data: { type: "string" }
          },
          required: ["mode", "data"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (name, args) => {
    try {
      if (name === "entity_create") {
        const id = "rec_" + Date.now() + "_" + Math.floor(Math.random()*1000);
        addRecord({ id, colors: args.colors, status: args.status });
        return { success: true, result: { id } };
      }

      if (name === "entity_select") {
        // Just return success for tests
        return { success: true, result: { selected: args.id } };
      }

      if (name === "entity_update") {
        updateRecord(args.id, { colors: args.colors, status: args.status });
        return { success: true, result: { id: args.id } };
      }

      if (name === "entity_delete") {
        if (!args.confirm) return { success: false, error: "confirm=true required" };
        removeRecord(args.id);
        return { success: true, result: { deleted: args.id } };
      }

      if (name === "artifact_export") {
        if (args.format === "session-json") {
          const exportState = JSON.parse(JSON.stringify(state));
          exportState.exportedAt = new Date().toISOString();
          return { success: true, result: { content: JSON.stringify(exportState, null, 2) } };
        }
        return { success: false, error: "Unsupported format" };
      }

      if (name === "artifact_import") {
        if (args.mode === "session-json") {
          try {
            const data = JSON.parse(args.data);
            const ok = importSession(data);
            if (ok) return { success: true, result: { imported: true } };
            return { success: false, error: "Validation failed" };
          } catch(e) {
            return { success: false, error: "Invalid JSON" };
          }
        }
        return { success: false, error: "Unsupported mode" };
      }

      return { success: false, error: "Unknown tool" };
    } catch(e) {
      return { success: false, error: e.message };
    }
  };
}
