import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useStore } from './store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// WebMCP Bindings
(window as any).webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
});

(window as any).webmcp_list_tools = () => {
  return [
    {
      name: "editor_select",
      description: "Selects a record in the provenance-atlas.",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      name: "editor_trace",
      description: "Traces the selected record (no-op visual).",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "editor_quarantine",
      description: "Quarantines a bad lineage for the selected record.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "editor_undo",
      description: "Undo the last mutation.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "entity_create",
      description: "Creates a new bike service record.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: { type: "string" },
          mileage: { type: "number" }
        },
        required: ["title", "date", "mileage"]
      }
    },
    {
      name: "entity_update",
      description: "Updates a bike service record.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          date: { type: "string" },
          mileage: { type: "number" },
          status: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete",
      description: "Deletes a bike service record.",
      inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
    },
    {
      name: "entity_filter",
      description: "Filter bike service records.",
      inputSchema: { type: "object", properties: { status: { type: "string" } }, required: ["status"] }
    },
    {
      name: "artifact_export",
      description: "Exports the session artifact.",
      inputSchema: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
    },
    {
      name: "artifact_import",
      description: "Imports the session artifact.",
      inputSchema: { type: "object", properties: { data: { type: "string" } }, required: ["data"] }
    }
  ];
};

(window as any).webmcp_invoke_tool = (name: string, args: any) => {
  const store = useStore.getState();

  switch (name) {
    case 'editor_select':
      store.selectRecord(args.id);
      return { status: "success" };

    case 'editor_trace':
      return { status: "success" };

    case 'editor_quarantine':
      store.traceAndQuarantine();
      return { status: "success" };

    case 'editor_undo':
      store.undo();
      return { status: "success" };

    case 'entity_create':
      store.createRecord({ title: args.title, date: args.date, mileage: args.mileage });
      return { status: "success" };

    case 'entity_update':
      store.updateRecord(args.id, args);
      return { status: "success" };

    case 'entity_delete':
      if (args.confirm) {
        store.deleteRecord(args.id);
        return { status: "success" };
      }
      return { status: "error", message: "confirm=true required" };

    case 'entity_filter':
      store.setFilter(args.status);
      return { status: "success" };

    case 'artifact_export':
      return {
        status: "success",
        data: JSON.stringify({
          schemaVersion: 'bike-maintenance-v1',
          exportedAt: new Date().toISOString(),
          records: store.records,
          provenanceAtlasState: store.provenanceAtlasState,
          derived: store.derived,
          history: store.history,
        })
      };

    case 'artifact_import':
      try {
        const parsed = JSON.parse(args.data);
        store.importSession(parsed);
        return { status: "success" };
      } catch (e: any) {
        return { status: "error", message: e.message };
      }

    default:
      return { status: "error", message: `Tool ${name} not found` };
  }
};
