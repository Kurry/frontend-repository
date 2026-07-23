import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

declare global {
  interface Window {
    webmcp_session_info?: () => any;
    webmcp_list_tools?: () => any;
    webmcp_invoke_tool?: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-data-tracking-home-air-quality-trendbook-forecast-ribbon-rn-github-issue-fields"
});

window.webmcp_list_tools = async () => ([
  {
    name: "entity_create_record",
    description: "Create a new air reading record.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string" },
        value: { type: "number" },
        date: { type: "string" }
      },
      required: ["status", "value", "date"]
    }
  },
  {
    name: "entity_update_record",
    description: "Update an existing air reading record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string" },
        value: { type: "number" }
      },
      required: ["id"]
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the current session as JSON.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "artifact_import_session_json",
    description: "Import a JSON payload to overwrite the current session.",
    inputSchema: {
      type: "object",
      properties: {
        payload: {
          type: "object"
        }
      },
      required: ["payload"]
    }
  }
]);

window.webmcp_invoke_tool = async (name: string, args: any) => {
  if (name === "entity_create_record") {
    const newRecord = { ...args, id: Math.random().toString(36).substring(2, 9) };
    window.__appDispatch({ type: 'CREATE_RECORD', payload: newRecord });
    return { success: true, record: newRecord };
  }

  if (name === "entity_update_record") {
    const existing = window.__appState.records.find(r => r.id === args.id);
    if (!existing) throw new Error("Record not found");
    const updated = { ...existing, ...args };
    window.__appDispatch({ type: 'UPDATE_RECORD', payload: updated });
    return { success: true, record: updated };
  }

  if (name === "artifact_export_session_json") {
    const exportState = { ...window.__appState, exportedAt: new Date().toISOString() };
    return { export: exportState };
  }

  if (name === "artifact_import_session_json") {
    window.__appDispatch({ type: 'IMPORT_STATE', payload: args.payload });
    return { success: true };
  }

  throw new Error(`Tool ${name} not found`);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
