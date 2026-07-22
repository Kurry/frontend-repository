import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useStore } from './store';
import { ArtifactSchema, LayoverActivitySchema } from './schema';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (req: any) => Promise<any>;
  }
}

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-planning-airport-layover-activity-planner-recovery-board-rn-canva-live-preview",
  contract_version: "zto-webmcp-v1",
  modules: ["entity-collection-v1", "artifact-transfer-v1"]
});

window.webmcp_list_tools = async () => ({
  tools: [
    {
      name: "entity_create_record",
      description: "Create a new layover activity record",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          status: { type: "string" },
          durationMinutes: { type: "number" },
          location: { type: "string" },
          notes: { type: "string" }
        },
        required: ["title", "status", "durationMinutes", "location"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an existing layover activity record or apply recovery mutation",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          updates: { type: "object" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "entity_get_records",
      description: "Get all layover activity records",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Export the current session state as a portable artifact",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Import a session state from a portable artifact",
      inputSchema: {
        type: "object",
        properties: {
          artifact: { type: "object" }
        },
        required: ["artifact"]
      }
    },
    {
      name: "artifact_undo",
      description: "Undo the last state mutation",
      inputSchema: {
        type: "object",
        properties: {}
      }
    }
  ]
});

window.webmcp_invoke_tool = async (req: any) => {
  const store = useStore.getState();

  switch (req.name) {
    case "entity_create_record": {
      const parsed = LayoverActivitySchema.omit({id: true, recoveryPathId: true, downstreamImpact: true}).safeParse(req.arguments);
      if (!parsed.success) {
        throw new Error(parsed.error.message);
      }
      store.addRecord(parsed.data);
      return { content: [{ type: "text", text: "Record created successfully" }] };
    }

    case "entity_update_record": {
      const { id, updates } = req.arguments;
      const target = store.records.find(r => r.id === id);
      if (!target) throw new Error("Record not found");
      const parsedUpdates = LayoverActivitySchema.safeParse({ ...target, ...updates });
      if (!parsedUpdates.success) throw new Error(parsedUpdates.error.message);

      if (updates.status === 'resolved' && updates.recoveryPathId && updates.downstreamImpact) {
        store.applyRecoveryMutation(id, updates.recoveryPathId, updates.downstreamImpact);
      } else {
        store.updateRecord(id, updates);
      }
      return { content: [{ type: "text", text: "Record updated successfully" }] };
    }

    case "entity_get_records": {
      return {
        content: [{ type: "text", text: JSON.stringify(store.records, null, 2) }]
      };
    }

    case "artifact_export_session_json": {
      const totalDuration = store.records.reduce((acc, r) => acc + r.durationMinutes, 0);
      const readyCount = store.records.filter(r => r.status === 'ready').length;
      const failedCount = store.records.filter(r => r.status === 'failed').length;
      const resolvedCount = store.records.filter(r => r.status === 'resolved').length;

      const artifact = {
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records: store.records,
        derived: {
          totalDuration,
          readyCount,
          failedCount,
          resolvedCount
        },
        history: store.history
      };

      return { content: [{ type: "text", text: JSON.stringify(artifact, null, 2) }] };
    }

    case "artifact_import_session_json": {
      const parsed = ArtifactSchema.safeParse(req.arguments.artifact);
      if (!parsed.success) {
        throw new Error("Invalid schema: " + parsed.error.issues[0].message);
      }
      store.importState(parsed.data.records, parsed.data.history);
      return { content: [{ type: "text", text: "Artifact imported successfully" }] };
    }

    case "artifact_undo": {
      store.undo();
      return { content: [{ type: "text", text: "Undo executed successfully" }] };
    }

    default:
      throw new Error(`Unknown tool: ${req.name}`);
  }
};
