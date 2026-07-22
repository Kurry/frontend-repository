import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import { store, exportArtifact, importArtifact } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => string;
    webmcp_list_tools: () => string;
    webmcp_invoke_tool: (tool_name: string, args: string) => Promise<string>;
  }
}

window.webmcp_session_info = () => {
  return JSON.stringify({
    schema_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1", "structured-editor-v1"]
  });
};

const tools = [
  {
    name: "entity_create",
    description: "Create a new color record",
    parameters: {
      type: "object",
      properties: { name: { type: "string" }, hex: { type: "string" } },
      required: ["name", "hex"]
    }
  },
  {
    name: "entity_update",
    description: "Update an existing color record",
    parameters: {
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" }, hex: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "entity_delete",
    description: "Delete a color record",
    parameters: {
      type: "object",
      properties: { id: { type: "string" }, confirm: { type: "boolean" } },
      required: ["id", "confirm"]
    }
  },
  {
    name: "entity_toggle",
    description: "Toggle selection of a color record for batch reconcile",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "entity_archive",
    description: "Archive a color record",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "editor_switch_mode",
    description: "Reconcile the selected batch",
    parameters: {
      type: "object",
      properties: { mode: { type: "string", enum: ["reconcile"] } },
      required: ["mode"]
    }
  },
  {
    name: "artifact_export",
    description: "Export the session state",
    parameters: {
      type: "object",
      properties: { format: { type: "string", enum: ["session-json"] } },
      required: ["format"]
    }
  },
  {
    name: "artifact_import",
    description: "Import session state",
    parameters: {
      type: "object",
      properties: { mode: { type: "string", enum: ["session-json"] }, payload: { type: "string" } },
      required: ["mode", "payload"]
    }
  },
  {
    name: "query_state",
    description: "Query the current state (test helper)",
    parameters: { type: "object", properties: {}, required: [] }
  }
];

window.webmcp_list_tools = () => {
  return JSON.stringify(tools);
};

window.webmcp_invoke_tool = async (tool_name: string, args_str: string) => {
  const args = JSON.parse(args_str);

  try {
    switch (tool_name) {
      case "entity_create":
        store.addRecord({ name: args.name, hex: args.hex });
        return JSON.stringify({ success: true, result: "Record added" });
      case "entity_update":
        store.updateRecord(args.id, { name: args.name, hex: args.hex });
        return JSON.stringify({ success: true, result: "Record updated" });
      case "entity_delete":
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
        store.deleteRecord(args.id);
        return JSON.stringify({ success: true, result: "Record deleted" });
      case "entity_toggle":
        store.toggleSelection(args.id);
        return JSON.stringify({ success: true, result: "Selection toggled" });
      case "entity_archive":
        store.archiveRecord(args.id);
        return JSON.stringify({ success: true, result: "Record archived" });
      case "editor_switch_mode":
        if (args.mode === "reconcile") {
          store.reconcileBatch();
          return JSON.stringify({ success: true, result: "Batch reconciled" });
        }
        throw new Error("Unknown mode");
      case "artifact_export":
        if (args.format !== "session-json") throw new Error("Unsupported format");
        return JSON.stringify({ success: true, result: exportArtifact() });
      case "artifact_import":
        if (args.mode !== "session-json") throw new Error("Unsupported mode");
        const success = importArtifact(args.payload);
        if (success) return JSON.stringify({ success: true, result: "Session imported" });
        throw new Error("Import failed");
      case "query_state":
        return JSON.stringify({ success: true, result: store.getSnapshot() });
      default:
        throw new Error("Unknown tool");
    }
  } catch (e: any) {
    return JSON.stringify({ success: false, error: e.message || "Operation failed" });
  }
};
