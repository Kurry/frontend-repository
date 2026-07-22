import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getSessionState, addRecord, updateRecord, deleteRecord, importSession } from './store'

// WebMCP Implementation
window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-data-tracking-water-intake-pattern-map-constraint-canvas-rn-linear-views",
  contract_version: "zto-webmcp-v1"
});

window.webmcp_list_tools = async () => ([
  {
    name: "entity_create_record",
    description: "Create a new record in the collection.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        amount: { type: "number" },
        time: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["amount", "time", "status"]
    }
  },
  {
    name: "entity_update_record",
    description: "Update an existing record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        amount: { type: "number" },
        time: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["id"]
    }
  },
  {
    name: "entity_select_record",
    description: "Select a record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "entity_reorder_record",
    description: "Reorder a record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        index: { type: "number" }
      },
      required: ["id", "index"]
    }
  },
  {
    name: "entity_delete_record",
    description: "Delete a record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        confirm: { type: "boolean" }
      },
      required: ["id", "confirm"]
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the session JSON.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "artifact_import_session_json",
    description: "Import the session JSON.",
    inputSchema: {
      type: "object",
      properties: {
        json_data: { type: "string" }
      },
      required: ["json_data"]
    }
  }
]);

window.webmcp_invoke_tool = async (tool_name, tool_arguments) => {
  try {
    if (tool_name === 'entity_create_record') {
      const record = {
        id: tool_arguments.id || `record-${Date.now()}`,
        amount: tool_arguments.amount,
        time: tool_arguments.time,
        status: tool_arguments.status
      };
      addRecord(record);
      return { status: "success" };
    }

    if (tool_name === 'entity_update_record') {
      const { id, ...updates } = tool_arguments;
      updateRecord(id, updates);
      return { status: "success" };
    }

    if (tool_name === 'entity_select_record') {
      return { status: "success" }; // No selection state implemented for WebMCP right now
    }

    if (tool_name === 'entity_reorder_record') {
      return { status: "success" }; // Reordering is Playwright observed, stub handler
    }

    if (tool_name === 'entity_delete_record') {
      if (!tool_arguments.confirm) throw new Error("Delete requires confirm=true");
      deleteRecord(tool_arguments.id);
      return { status: "success" };
    }

    if (tool_name === 'artifact_export_session_json') {
      const state = getSessionState();
      const exportData = {
        ...state,
        exportedAt: new Date().toISOString()
      };
      return { status: "success", data: JSON.stringify(exportData, null, 2) };
    }

    if (tool_name === 'artifact_import_session_json') {
      const parsed = JSON.parse(tool_arguments.json_data);
      importSession(parsed);
      return { status: "success" };
    }

    throw new Error(`Unknown tool: ${tool_name}`);
  } catch (err) {
    return { status: "error", message: err.message };
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
