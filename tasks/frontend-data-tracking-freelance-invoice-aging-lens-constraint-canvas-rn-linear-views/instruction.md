# Freelance Invoice Aging Lens Constraint Canvas

<summary>
Manage invoices through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Drag a selected record across constraint lanes and resolve a conflict. Produce a shareable filtered workflow view whose grouping, context, and generated update remain linked. The app is a frontend-only tool built with React and Tailwind CSS 4.3.2 using npm-local/no-CDN installation. Do not use localStorage or other browser persistence.
</summary>

<core_features>
Create, edit, archive, and filter invoices with explicit domain statuses.
Drag a selected record across constraint lanes and resolve a conflict.
Filter or reorder records by domain state.
Use the constraint canvas interaction to derive a decision about the collection.
Undo the last mutation and inspect the linked representation.
Export the current artifact to invoice-aging-v1-constraint-canvas.json.
Clear and import the artifact with field-level validation.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout includes a desktop primary surface plus summary and inspector.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
Build with Tailwind CSS 4.3.2 installed via npm-local/no-CDN.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
</requirements>

<webmcp_action_contract>
```javascript
window.webmcp_session_info = {
  name: "Freelance Invoice Aging Lens Constraint Canvas",
  version: "1.0.0"
};

window.webmcp_list_tools = () => [
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

window.webmcp_invoke_tool = async (toolName, args) => {
  // Implementation provided by the application
};
```
</webmcp_action_contract>
