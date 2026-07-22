import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useStore } from './store.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// WebMCP bindings
declare global {
  interface Window {
    webmcp_session_info: () => Record<string, unknown>;
    webmcp_list_tools: () => Record<string, unknown>[];
    webmcp_invoke_tool: (tool: string, args: Record<string, unknown>) => Promise<unknown>;
  }
}

window.webmcp_session_info = () => {
  return {
    state: "ready",
    appVersion: "1.0.0"
  };
};

window.webmcp_list_tools = () => [
  {
    name: "query_state",
    description: "Returns the current state of the store, including records and summary.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "export_artifact",
    description: "Exports the interoperable invoice-aging-v1 session artifact.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "import_artifact",
    description: "Clears current state and imports an invoice-aging-v1 artifact.",
    inputSchema: {
      type: "object",
      properties: {
        jsonString: { type: "string" }
      },
      required: ["jsonString"]
    },
  },
  {
    name: "create_record",
    description: "Creates a new invoice record.",
    inputSchema: {
      type: "object",
      properties: {
        clientName: { type: "string" },
        amount: { type: "number" },
        dueDate: { type: "string" }
      },
      required: ["clientName", "amount", "dueDate"]
    },
  },
  {
    name: "update_record",
    description: "Updates an existing invoice record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        clientName: { type: "string" },
        amount: { type: "number" },
        dueDate: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_record",
    description: "Deletes an existing invoice record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "select_record",
    description: "Selects a record to view in the Audit Lens.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "attach_evidence_and_resolve",
    description: "Attaches evidence to the selected record and resolves the audit discrepancy.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        evidence: { type: "string" }
      },
      required: ["id", "evidence"]
    }
  },
  {
    name: "mark_conflict",
    description: "Marks a record as having an audit conflict.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "undo",
    description: "Undoes the last action.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "clear",
    description: "Clears all records and history.",
    inputSchema: { type: "object", properties: {} }
  }
];

window.webmcp_invoke_tool = async (tool: string, args: Record<string, unknown>) => {
  const store = useStore.getState();

  switch (tool) {
    case "query_state":
      return {
        records: store.records,
        selectedInvoiceId: store.selectedInvoiceId,
        historyCount: store.history.length
      };

    case "export_artifact":
      return { artifact: store.exportSession() };

    case "import_artifact":
      return store.importSession(args.jsonString as string);

    case "create_record":
      store.addInvoice({
        clientName: args.clientName as string,
        amount: args.amount as number,
        dueDate: args.dueDate as string
      });
      return { success: true };

    case "update_record":
      store.updateInvoice(args.id as string, {
        clientName: args.clientName as string | undefined,
        amount: args.amount as number | undefined,
        dueDate: args.dueDate as string | undefined
      });
      return { success: true };

    case "delete_record":
      store.deleteInvoice(args.id as string);
      return { success: true };

    case "select_record":
      store.selectInvoice(args.id as string);
      return { success: true };

    case "attach_evidence_and_resolve":
      store.attachEvidenceAndResolve(args.id as string, args.evidence as string);
      return { success: true };

    case "mark_conflict":
      store.markConflict(args.id as string);
      return { success: true };

    case "undo":
      store.undo();
      return { success: true };

    case "clear":
      store.clearSession();
      return { success: true };

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
};
