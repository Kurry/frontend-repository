<summary>
Manage invoices through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

All assets must be loaded locally without CDNs.
Styling framework: Tailwind CSS 4.3.2.
</summary>

<core_features>
Create, edit, archive, and filter invoices with explicit domain statuses.
Use the recovery board interaction to derive a decision about the collection.
Move a failed record into a recovery path and repair its downstream consequences.
Undo the last mutation and inspect the linked representation.
Export and restore the actual session work in a fresh state.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop primary surface plus summary and inspector.
Mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
All assets must be loaded locally without CDNs.
</requirements>

<webmcp_action_contract>
```json
{
  "webmcp_session_info": {
    "status": "ready",
    "task": "frontend-data-tracking-freelance-invoice-aging-lens-recovery-board-rn-canva-live-preview"
  },
  "webmcp_list_tools": [
    {
      "name": "query_state",
      "description": "Queries the current state of the Freelance Invoice Aging Lens.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "reset_state",
      "description": "Resets the application to its initial state.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "import_artifact",
      "description": "Imports a full state artifact into the application.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "artifact": {
            "type": "object",
            "description": "The complete state object to import"
          }
        },
        "required": ["artifact"]
      }
    },
    {
      "name": "add_record",
      "description": "Adds a new invoice record.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "record": {
            "type": "object",
            "description": "The invoice record to add"
          }
        },
        "required": ["record"]
      }
    }
  ]
}
```
</webmcp_action_contract>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
</delivery>
