# Freelance Invoice Aging Lens — Batch Reconciler — Claude Session

Manage invoices through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: group selected records into a batch and reconcile aggregate totals. Release-derived concept: a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states.

<summary>
A React/Vite local-only application (Tailwind CSS 4.3.2 installed via npm-local/no-CDN) for managing invoices. The user groups selected records into a batch and reconciles aggregate totals. The canonical mutation updates the primary view, linked derived surfaces, and an interoperable JSON artifact in unison.
</summary>

<core_features>
Create, edit, archive, and filter invoices with explicit domain statuses.
Use the batch reconciler interaction to derive a decision about the collection: group selected records into a batch and reconcile aggregate totals.
Undo the last mutation and inspect the linked representation.
Export and restore the actual session work in a fresh state via invoice-aging-v1-batch-reconciler.json.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes current state and next action clear.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
Tailwind CSS 4.3.2 must be installed and used via npm-local/no-CDN.
The application must serve on port 3000 and run without console or page errors.
Persistence is in-memory only; export/import is the persistence boundary. NO localStorage.
The artifact invoice-aging-v1-batch-reconciler.json preserves authored state and derived consequences for a clean round trip.
schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
Invalid imports (malformed schema, duplicate IDs, unknown references, and invalid bounds) make no state change.
A valid import restores authored structure and regenerates exportedAt.
</requirements>

<webmcp_action_contract>
window.webmcp_session_info = () => ({
  status: "active",
  workspace_isolated: true
});

window.webmcp_list_tools = () => [
  {
    name: "create_invoice",
    description: "Create a new invoice.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        client: { type: "string" },
        amount: { type: "number" },
        dueDate: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["id", "client", "amount", "dueDate", "status"]
    }
  },
  {
    name: "update_invoice",
    description: "Update an existing invoice.",
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
    name: "delete_invoice",
    description: "Delete an invoice.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "reconcile_batch",
    description: "Group selected records into a batch and reconcile aggregate totals.",
    inputSchema: {
      type: "object",
      properties: {
        invoiceIds: { type: "array", items: { type: "string" } },
        reconcileNotes: { type: "string" }
      },
      required: ["invoiceIds"]
    }
  },
  {
    name: "undo_last_mutation",
    description: "Undo the last reconciliation or mutation.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_state",
    description: "Query current state.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

window.webmcp_invoke_tool = async (name, args) => {
  return { error: "Not implemented in Oracle" }; // The real application will intercept this
};
</webmcp_action_contract>
