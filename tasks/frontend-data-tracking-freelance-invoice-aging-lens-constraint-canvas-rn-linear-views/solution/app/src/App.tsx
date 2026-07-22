import { useEffect } from 'react';
import { Header } from './components/Header';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { DetailPanel } from './components/DetailPanel';
import { useAppStore } from './store';

function App() {
  const exportArtifact = useAppStore(state => state.exportArtifact);
  const importArtifact = useAppStore(state => state.importArtifact);
  const createInvoice = useAppStore(state => state.createInvoice);
  const updateInvoice = useAppStore(state => state.updateInvoice);
  const undo = useAppStore(state => state.undo);

  useEffect(() => {
    // Expose WebMCP Contract
    (window as any).webmcp_session_info = {
      name: "Freelance Invoice Aging Lens Constraint Canvas",
      version: "1.0.0"
    };

    (window as any).webmcp_list_tools = () => [
      {
        name: "create_invoice",
        description: "Create a new invoice record",
        inputSchema: {
          type: "object",
          properties: {
            clientName: { type: "string" },
            amount: { type: "number" },
            status: { type: "string", enum: ["draft", "ready", "sent", "paid", "archived", "conflict"] },
            dueDate: { type: "string" }
          },
          required: ["clientName", "amount", "status", "dueDate"]
        }
      },
      {
        name: "update_invoice",
        description: "Update an existing invoice",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string", enum: ["draft", "ready", "sent", "paid", "archived", "conflict"] }
          },
          required: ["id", "status"]
        }
      },
      {
        name: "delete_invoice",
        description: "Delete an existing invoice",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "query_invoices",
        description: "Query all current invoice records",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "export_artifact",
        description: "Export the current session state as a JSON artifact",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "import_artifact",
        description: "Import a session state from a JSON artifact",
        inputSchema: {
          type: "object",
          properties: {
            artifact: {
              type: "object",
              properties: {
                schemaVersion: { type: "string" },
                exportedAt: { type: "string" },
                records: { type: "array" }
              },
              required: ["schemaVersion", "exportedAt", "records"]
            }
          },
          required: ["artifact"]
        }
      },
      {
        name: "undo_last_mutation",
        description: "Undo the last mutation",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ];

    (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
      switch (toolName) {
        case 'create_invoice':
          createInvoice(args);
          return { status: "success" };
        case 'update_invoice':
          updateInvoice(args.id, { status: args.status });
          return { status: "success" };
        case 'delete_invoice':
          const delState = useAppStore.getState();
          delState.deleteInvoice(args.id);
          return { status: "success" };
        case 'query_invoices':
          // Must retrieve from the latest Zustand state, not the closure
          const state = useAppStore.getState();
          return { invoices: state.invoices };
        case 'export_artifact':
          return { artifact: JSON.parse(exportArtifact()) };
        case 'import_artifact':
          importArtifact(args.artifact);
          return { status: "success" };
        case 'undo_last_mutation':
          undo();
          return { status: "success" };
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    };
  }, [createInvoice, updateInvoice, exportArtifact, importArtifact, undo]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas-bg font-sans">
      <Header />
      <main className="flex-1 flex flex-row overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden">
          <ConstraintCanvas />
        </div>
        <DetailPanel />
      </main>
    </div>
  );
}

export default App;
