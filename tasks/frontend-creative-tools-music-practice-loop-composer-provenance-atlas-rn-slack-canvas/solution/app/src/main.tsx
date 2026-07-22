import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useStore, computeDerived } from './useStore.ts'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// WebMCP Bindings
;(window as any).webmcp_session_info = () => {
  return {
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  };
};

;(window as any).webmcp_list_tools = () => {
  return [
    {
      name: "webmcp_state",
      description: "Get current composer state",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "webmcp_trace_and_quarantine",
      description: "Trace and quarantine a lineage",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, evidence: { type: "string" } },
        required: ["id", "evidence"]
      }
    },
    {
      name: "webmcp_update_record",
      description: "Update a record property",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, updates: { type: "object" } },
        required: ["id", "updates"]
      }
    },
    {
      name: "webmcp_undo",
      description: "Undo last mutation",
      parameters: { type: "object", properties: {} }
    }
  ];
};

;(window as any).webmcp_invoke_tool = (name: string, args: any) => {
  const store = useStore.getState();
  if (name === 'webmcp_state') {
    return { records: store.records, derived: computeDerived(store.records), selectedId: store.selectedId };
  }
  if (name === 'webmcp_trace_and_quarantine') {
    store.traceAndQuarantine(args.id, args.evidence);
    return { success: true };
  }
  if (name === 'webmcp_update_record') {
    store.updateRecord(args.id, args.updates);
    return { success: true };
  }
  if (name === 'webmcp_undo') {
    store.undo();
    return { success: true };
  }
  throw new Error(`Tool not found: ${name}`);
};
