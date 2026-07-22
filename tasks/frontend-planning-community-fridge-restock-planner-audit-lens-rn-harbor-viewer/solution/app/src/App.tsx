import { useEffect } from 'react';
import { RestockTasks } from './components/RestockTasks';
import { AuditLens } from './components/AuditLens';
import { PortableArtifact } from './components/PortableArtifact';
import { useRestockState } from './hooks/useRestockState';

// Global store reference for WebMCP
let globalStore: ReturnType<typeof useRestockState> | null = null;

function App() {
  const store = useRestockState();

  useEffect(() => {
    globalStore = store;
  }, [store]);

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto md:p-4 bg-background">
      <header className="py-4 px-6 mb-4 flex items-center justify-between border-b md:border md:rounded-lg bg-surface">
        <h1 className="text-2xl font-bold text-foreground">Restock Planner</h1>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:border md:rounded-lg bg-surface relative">
        <div className="flex-1 p-6 overflow-auto">
          <RestockTasks />
          <div className="mt-8">
            <PortableArtifact />
          </div>
        </div>

        <div className="w-full md:w-[450px] border-t md:border-t-0 md:border-l h-full shrink-0">
          <AuditLens />
        </div>
      </div>
    </div>
  );
}

export default function AppWithProvider() {
  return <App />;
}

// -------------------------------------------------------------
// WebMCP Contract Implementation
// -------------------------------------------------------------
if (typeof window !== 'undefined') {
  (window as any).webmcp_session_info = () => ({
    task: "eval-intelligence/frontend-planning-community-fridge-restock-planner-audit-lens-rn-provenance-viewer",
    status: "active"
  });

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "entity_create_record",
        description: "Seed a restock task record into the collection.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            location: { type: "string" },
            quantity: { type: "number" },
            maxLimit: { type: "number" },
            dependentRecordId: { type: "string" },
            status: { type: "string" }
          },
          required: ["title", "quantity", "maxLimit", "status"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update a restock task record.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            location: { type: "string" },
            quantity: { type: "number" },
            maxLimit: { type: "number" },
            dependentRecordId: { type: "string" },
            status: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Delete a restock task record.",
        parameters: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"]
        }
      },
      {
        name: "entity_read_state",
        description: "Read the current application state.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "action_undo",
        description: "Undo the last mutation.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "action_resolve_audit",
        description: "Resolve audit discrepancy for a record.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            evidenceUrl: { type: "string" },
            notes: { type: "string" }
          },
          required: ["id", "evidenceUrl"]
        }
      },
      {
        name: "artifact_export_session_json",
        description: "Exports the session artifact.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_session_json",
        description: "Imports a session artifact.",
        parameters: {
          type: "object",
          properties: { data: { type: "object" } },
          required: ["data"]
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    if (!globalStore) {
      return { error: "Application store not initialized" };
    }

    try {
      switch (name) {
        case "entity_create_record": {
          globalStore.addTask(args);
          return { success: true, message: "Record created." };
        }
        case "entity_update_record": {
          const { id, ...updates } = args;
          globalStore.updateTask(id, updates);
          return { success: true, message: "Record updated." };
        }
        case "entity_delete_record": {
          globalStore.deleteTask(args.id);
          return { success: true, message: "Record deleted." };
        }
        case "entity_read_state": {
          return globalStore.state;
        }
        case "action_undo": {
          globalStore.undoLastAction();
          return { success: true, message: "Undo complete." };
        }
        case "action_resolve_audit": {
          globalStore.resolveAuditDiscrepancy(args.id, args.evidenceUrl, args.notes || "");
          return { success: true, message: "Audit resolution attempted." };
        }
        case "artifact_export_session_json": {
          return globalStore.exportArtifact();
        }
        case "artifact_import_session_json": {
          const success = globalStore.importArtifact(args.data);
          if (success) {
            return { success: true, message: "Artifact imported." };
          } else {
            return { error: "Invalid artifact data." };
          }
        }
        default:
          return { error: `Tool ${name} not found.` };
      }
    } catch (err: any) {
      return { error: err.message };
    }
  };
}
