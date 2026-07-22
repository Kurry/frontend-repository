# Freelance Invoice Aging Lens — Replay Timeline — Lightroom Editing

<summary>
Manage invoices through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Release-derived concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized.

This is a frontend-only task using an in-memory datastore. It is implemented with React, Vite, and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Create, edit, delete one record (FreelanceInvoiceAgingLensSession with schemaVersion, exportedAt, records, derived, and history).
Filter or reorder records by domain state (empty, draft, ready, changed, archived).
Scrub a selected record through its timeline and restore a prior checkpoint.
Undo the last mutation and inspect the linked representation.
Export the current artifact as invoice-aging-v1-replay-timeline.json.
Clear and import it with field-level validation.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop primary surface plus summary and inspector.
Mobile transforms secondary surfaces into drawers or stacked steps.
The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
Record IDs are unique and status values are explicit enums.
Required fields, numeric/date bounds, and cross-record references validate together.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change on import.
Keyboard and touch-equivalent controls produce the identical canonical mutation.
Ctrl/Cmd+Z undoes the canonical mutation.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
All assets must be loaded locally without CDNs.
</requirements>

<webmcp_action_contract>
This task includes a required WebMCP automation contract. You must implement the following tools inside `window`:

```javascript
window.webmcp_session_info = () => ({
  status: "idle" | "evaluating",
  contract_version: "1.0.0"
});

window.webmcp_list_tools = () => [
  {
    name: "seed_state",
    description: "Seed a deterministic collection with empty, boundary, valid, and conflict states.",
    schema: {
      type: "object",
      properties: {
        records: { type: "array" }
      },
      required: ["records"]
    }
  },
  {
    name: "query_state",
    description: "Query the current state.",
    schema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "export_artifact",
    description: "Export the session artifact.",
    schema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "import_artifact",
    description: "Clear and import it with field-level validation.",
    schema: {
      type: "object",
      properties: {
        artifact: { type: "string" }
      },
      required: ["artifact"]
    }
  }
];

window.webmcp_invoke_tool = (name, args) => {
  // Implementation
};
```
</webmcp_action_contract>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The app must be served on port 3000.
</delivery>
