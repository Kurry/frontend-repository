import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useStore } from './store.js';
import { getExportState, importExportState } from './export.js';

// Setup WebMCP
window.webmcp_session_info = {
  contract_version: "zto-webmcp-v1",
  modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
};

window.webmcp_list_tools = () => {
  return [
    { name: "entity_select", description: "Select frames or bursts" },
    { name: "entity_update", description: "Update entity fields like rating, flag, cull-reason" },
    { name: "editor_update_property", description: "Update editor properties like crop-dimensions, slot-role" },
    { name: "editor_switch_mode", description: "Switch between compare, crop, sequence, review modes" },
    { name: "artifact_export", description: "Export current state" },
    { name: "artifact_import", description: "Import state" }
  ];
};

window.webmcp_invoke_tool = (toolName, args) => {
  const store = useStore.getState();
  try {
    switch (toolName) {
      case "entity_select":
        store.setSelection(args.ids || []);
        return { success: true };
      case "entity_update":
        if (args.entity === 'frame' && args.id) {
          store.setDecision(args.id, args.updates);
          return { success: true };
        }
        return { success: false, error: "Invalid entity or missing id" };
      case "editor_update_property":
        if (args.type === 'sequence-slot' && args.id) {
          store.updateSequenceSlot(args.id, args.updates);
          return { success: true };
        } else if (args.type === 'frame-crop' && args.id) {
          store.setCrop(args.id, args.updates);
          return { success: true };
        }
        return { success: false, error: "Invalid type or missing id" };
      case "artifact_export":
        return { success: true, artifact: getExportState() };
      case "artifact_import":
        importExportState(args.artifact);
        return { success: true };
      default:
        return { success: false, error: "Unknown tool" };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
