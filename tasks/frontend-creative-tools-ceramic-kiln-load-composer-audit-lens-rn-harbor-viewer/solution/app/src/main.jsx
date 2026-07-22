import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { useStore } from './store.js'

import './index.css'

// WebMCP Bindings Implementation
window.webmcp_session_info = () => {
  return JSON.stringify({
    schemaVersion: "kiln-load-v1",
    mode: "development"
  });
};

window.webmcp_list_tools = () => {
  return JSON.stringify([
    // entity-collection-v1
    { name: "entity_create", description: "Create a new record" },
    { name: "entity_select", description: "Select a record" },
    { name: "entity_update", description: "Update a record" },
    { name: "entity_delete", description: "Delete a record" },

    // artifact-transfer-v1
    { name: "artifact_export", description: "Export session JSON" },
    { name: "artifact_import", description: "Import session JSON" },
    { name: "artifact_copy", description: "Copy session JSON" },

    // derived-decision-v1
    { name: "decision_mutate", description: "Resolve an audit discrepancy" },
    { name: "decision_undo", description: "Undo last mutation" },
    { name: "decision_query_state", description: "Query current state" },
  ]);
};

window.webmcp_invoke_tool = (toolName, argsStr) => {
  const store = useStore.getState();
  let args = {};
  if (argsStr) {
    try {
      args = JSON.parse(argsStr);
    } catch(e) {}
  }

  const generateExportData = () => {
    return {
      schemaVersion: 'kiln-load-v1',
      exportedAt: new Date().toISOString(),
      records: store.records,
      auditLensState: store.auditLensState,
      derived: store.derived,
      history: store.history
    };
  };

  switch (toolName) {
    case "entity_create":
      store.addRecord(args.record || { title: 'New', status: 'draft', evidence: '' });
      return JSON.stringify({ success: true, records: useStore.getState().records });

    case "entity_select":
      store.selectForAudit(args.id);
      return JSON.stringify({ success: true, auditLensState: useStore.getState().auditLensState });

    case "entity_update":
      store.updateRecord(args.id, args.updates || {});
      return JSON.stringify({ success: true, records: useStore.getState().records });

    case "entity_delete":
      store.deleteRecord(args.id);
      return JSON.stringify({ success: true, records: useStore.getState().records });

    case "artifact_export":
      return JSON.stringify({ success: true, data: generateExportData() });

    case "artifact_import":
      if (args.data) {
        store.importData(args.data);
        return JSON.stringify({ success: true });
      }
      return JSON.stringify({ success: false, error: 'No data provided' });

    case "artifact_copy":
      return JSON.stringify({ success: true, data: generateExportData() });

    case "decision_mutate":
      store.resolveAuditDiscrepancy(args.id, args.evidence);
      return JSON.stringify({ success: true, state: useStore.getState().auditLensState });

    case "decision_undo":
      store.undo();
      return JSON.stringify({ success: true, historyLength: useStore.getState().history.length });

    case "decision_query_state":
      return JSON.stringify({
        records: store.records,
        auditLensState: store.auditLensState,
        derived: store.derived
      });

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
