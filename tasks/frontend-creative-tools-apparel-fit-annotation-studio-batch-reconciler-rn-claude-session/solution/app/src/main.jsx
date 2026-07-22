import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { useStore } from './store.js'
import './index.css'

// WebMCP Contract Bindings
const WEBMCP_CONTRACT = {
  webmcp_session_info: {
    description: "Returns session context.",
    parameters: {}
  },
  webmcp_list_tools: {
    description: "Lists available contract bindings.",
    parameters: {}
  },
  webmcp_invoke_tool: {
    description: "Invokes a contract binding to interact with the batch reconciler.",
    parameters: {
      tool_name: "string",
      args: "object"
    }
  }
};

window.webmcp_session_info = async () => ({ session: "active", version: "1" });
window.webmcp_list_tools = async () => Object.entries(WEBMCP_CONTRACT).map(([name, schema]) => ({ name, ...schema }));
window.webmcp_invoke_tool = async (tool, args) => {
  if (tool === 'group_batch') {
    // Interacting with store from outside React
    useStore.getState().groupAndReconcile();
    return { success: true };
  }
  if (tool === 'export_artifact') {
    const state = useStore.getState();
    return {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  }
  if (tool === 'query_state') {
    return useStore.getState();
  }
  throw new Error(`Unknown tool: ${tool}`);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
