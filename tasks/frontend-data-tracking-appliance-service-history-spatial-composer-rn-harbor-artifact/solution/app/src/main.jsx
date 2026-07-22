import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { store } from './store.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// WebMCP Contract Implementation
window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
});

window.webmcp_list_tools = () => [
  {
    name: "editor_select",
    description: "Selects an appliance record in the spatial composer.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "editor_update_property",
    description: "Moves an appliance record in the spatial composer.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        property: { type: "string", enum: ["geometry"] },
        value: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] }
      },
      required: ["id", "property", "value"]
    }
  },
  {
    name: "entity_create",
    description: "Creates a new appliance record.",
    parameters: { type: "object", properties: {}, required: [] }
  },
  {
    name: "entity_select",
    description: "Selects an appliance record in the list.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "entity_update",
    description: "Updates an appliance record.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        updates: { type: "object" }
      },
      required: ["id", "updates"]
    }
  },
  {
    name: "entity_delete",
    description: "Deletes an appliance record.",
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
    description: "Exports the session artifact.",
    parameters: {
      type: "object",
      properties: { format: { type: "string", enum: ["appliance-service-v1-spatial-composer.json"] } },
      required: ["format"]
    }
  }
];

window.webmcp_invoke_tool = (name, args) => {
  try {
    switch (name) {
      case "editor_select":
      case "entity_select":
        store.dispatch({ type: 'SELECT_RECORD', payload: args.id });
        return { success: true };

      case "editor_update_property":
        if (args.property === "geometry") {
           store.dispatch({ type: 'MOVE_RECORD', payload: { id: args.id, x: args.value.x, y: args.value.y } });
           return { success: true };
        }
        return { success: false, error: "Unsupported property" };

      case "entity_create":
        const newRec = {
            id: `rec-${Date.now()}`,
            name: 'New Appliance',
            type: 'Washer',
            status: 'empty',
            date: new Date().toISOString().split('T')[0],
            capacity: 1
        };
        store.dispatch({ type: 'CREATE_RECORD', payload: newRec });
        return { success: true, id: newRec.id };

      case "entity_update":
        store.dispatch({ type: 'UPDATE_RECORD', payload: { id: args.id, ...args.updates } });
        return { success: true };

      case "entity_delete":
        if (args.confirm) {
           store.dispatch({ type: 'DELETE_RECORD', payload: { id: args.id } });
           return { success: true };
        }
        return { success: false, error: "Confirmation required" };

      case "artifact_export":
        const state = store.getSnapshot();
        const derivedSummary = {
            total: state.records.length,
            totalCapacity: state.records.reduce((sum, r) => sum + r.capacity, 0)
        };
        const artifact = {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived: {
                summary: derivedSummary,
                spatialGeometry: state.spatialGeometry
            },
            history: state.undoStack
        };
        return { success: true, format: args.format, _preview: JSON.stringify(artifact) };

      default:
        return { success: false, error: "Unknown tool" };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
};
