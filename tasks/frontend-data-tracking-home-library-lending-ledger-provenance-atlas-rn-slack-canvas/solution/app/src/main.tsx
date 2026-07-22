import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
    __DISPATCH__?: any;
    __STATE__?: any;
  }
}

window.webmcp_session_info = async () => ({
  task_id: "frontend-data-tracking-home-library-lending-ledger-provenance-atlas-rn-slack-canvas",
  eval_org: "eval-intelligence",
  task_version: "1.0",
});

window.webmcp_list_tools = async () => ({
  tools: [
    {
      name: "artifact_export",
      description: "Exports the current session state.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "artifact_import",
      description: "Imports a session state.",
      inputSchema: { type: "object", properties: { state: { type: "object" } } }
    },
    {
      name: "entity_collection_query",
      description: "Queries the collection of records.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "structured_editor_invoke",
      description: "Invokes an action to mutate state.",
      inputSchema: { type: "object", properties: { action: { type: "string" }, payload: { type: "object" } } }
    }
  ]
});

window.webmcp_invoke_tool = async (name: string, args: any) => {
  if (name === "artifact_export") {
    return { result: window.__STATE__ };
  }
  if (name === "artifact_import") {
    if (args.state && window.__DISPATCH__) {
      window.__DISPATCH__({ type: 'IMPORT_STATE', payload: args.state });
      return { success: true };
    }
    throw new Error("Invalid state or dispatch not bound");
  }
  if (name === "entity_collection_query") {
    return { records: window.__STATE__?.records || [] };
  }
  if (name === "structured_editor_invoke") {
    if (window.__DISPATCH__) {
      window.__DISPATCH__({ type: args.action, payload: args.payload });
      return { success: true };
    }
    throw new Error("Dispatch not bound");
  }
  throw new Error(`Tool ${name} not found`);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
