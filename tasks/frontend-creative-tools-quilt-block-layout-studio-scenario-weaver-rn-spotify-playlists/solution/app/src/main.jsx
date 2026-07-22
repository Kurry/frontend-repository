import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useStore } from './store';

// WebMCP Bindings
window.webmcp_session_info = async () => ({
  task_id: "frontend-creative-tools-quilt-block-layout-studio-scenario-weaver-rn-spotify-playlists",
  title: "Quilt Block Layout Studio",
  version: "zto-webmcp-v1"
});

window.webmcp_list_tools = async () => [
  {
    name: "entity_create",
    description: "Create a new quilt block record",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["quilt-block"] },
        fields: {
          type: "object",
          properties: {
            name: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] }
          },
          required: ["name"]
        }
      },
      required: ["entity_type", "fields"]
    }
  },
  {
    name: "entity_update",
    description: "Update an existing quilt block record, or branch into a scenario",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["quilt-block"] },
        entity_id: { type: "string" },
        fields: {
          type: "object",
          properties: {
            name: { type: "string" },
            status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
            scenarioWeaverState: { type: "string" }
          }
        }
      },
      required: ["entity_type", "entity_id", "fields"]
    }
  },
  {
    name: "entity_delete",
    description: "Delete a quilt block record",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["quilt-block"] },
        entity_id: { type: "string" },
        confirm: { type: "boolean" }
      },
      required: ["entity_type", "entity_id", "confirm"]
    }
  },
  {
    name: "artifact_export",
    description: "Export the current session as JSON",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "artifact_import",
    description: "Import a JSON session",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "object" }
      },
      required: ["data"]
    }
  }
];

window.webmcp_invoke_tool = async (name, args) => {
  const store = useStore.getState();

  if (name === "entity_create") {
    store.createRecord(args.fields);
    return { success: true };
  }

  if (name === "entity_update") {
    if (args.fields.scenarioWeaverState) {
      store.branchScenario(args.entity_id, args.fields);
    } else {
      store.updateRecord(args.entity_id, args.fields);
    }
    return { success: true };
  }

  if (name === "entity_delete") {
    if (!args.confirm) throw new Error("Delete requires explicit confirm=true.");
    store.deleteRecord(args.entity_id);
    return { success: true };
  }

  if (name === "artifact_export") {
    const data = {
      schemaVersion: 'quilt-layout-v1',
      exportedAt: new Date().toISOString(),
      records: store.records,
      derived: {
        summary: `Total blocks: ${store.records.length}`
      },
      history: store.history
    };
    return { result: data };
  }

  if (name === "artifact_import") {
    store.importData(args.data);
    if (useStore.getState().error) {
       throw new Error(useStore.getState().error);
    }
    return { success: true };
  }

  throw new Error(`Unknown tool: ${name}`);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
