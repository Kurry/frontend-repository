<summary>
Manage speaker slots through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus group selected records into a batch and reconcile aggregate totals. Release-derived concept a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states. Stack must use Vite and Tailwind CSS 4.3.2.
</summary>

<reference_screenshots>
None
</reference_screenshots>

<core_features>
Create, edit, archive, and filter speaker slots with explicit domain statuses.
Group selected records into a batch and reconcile aggregate totals.
Undo the last mutation and inspect the linked representation.
Export the current artifact.
Clear and import it with field-level validation.
</core_features>

<user_flows>
- Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
- Use the batch reconciler interaction to derive a decision about the collection.
- Undo the last mutation and inspect the linked representation.
- Export and restore the actual session work in a fresh state.
- Clear and import it with field-level validation.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Mobile transforms secondary surfaces into drawers or stacked steps.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Keyboard and touch-equivalent controls produce the identical canonical mutation.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text.
- Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD.
- The artifact speaker-greenroom-v1-batch-reconciler.json preserves authored state and derived consequences for a clean round trip.
</innovation>

<requirements>
Record shape ConferenceSpeakerGreenroomBoardSession with schemaVersion, exportedAt, records, derived, and history. Each record is an API-shaped would-be request body.
Validation rules schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric or date bounds, and cross-record references validate together.
Persistence In-memory only, export or import is the persistence boundary.
Import export speaker-greenroom-v1-batch-reconciler.json uses the batch-reconciler schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
Dependencies must be installed via npm strictly locally. CDN links or external network requests during runtime are banned.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Deliver a working Vite-based React application serving on port 3000.
- `dist/` build output must be present.
</delivery>

<webmcp_action_contract>
```json
{
  "contractVersion": "zto-webmcp-v1",
  "app": "eval-intelligence/frontend-planning-conference-speaker-greenroom-board-batch-reconciler-rn-claude-session",
  "modules": ["browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"],
  "toolNames": ["entity_create_record", "entity_update_record", "entity_delete_record", "batch_reconcile_aggregate_totals", "artifact_export_session_json", "artifact_import_session_json"],
  "tools": [
    {
      "name": "entity_create_record",
      "description": "Create a new speaker slot record.",
      "inputSchema": { "type": "object", "properties": { "record": { "type": "object" } }, "required": ["record"] }
    },
    {
      "name": "entity_update_record",
      "description": "Update a speaker slot record.",
      "inputSchema": { "type": "object", "properties": { "id": { "type": "string" }, "updates": { "type": "object" } }, "required": ["id", "updates"] }
    },
    {
      "name": "entity_delete_record",
      "description": "Delete a speaker slot record.",
      "inputSchema": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] }
    },
    {
      "name": "batch_reconcile_aggregate_totals",
      "description": "Group selected records into a batch and reconcile aggregate totals.",
      "inputSchema": { "type": "object", "properties": { "ids": { "type": "array", "items": { "type": "string" } } }, "required": ["ids"] }
    },
    {
      "name": "artifact_export_session_json",
      "description": "Export the session to JSON.",
      "inputSchema": { "type": "object", "properties": {} }
    },
    {
      "name": "artifact_import_session_json",
      "description": "Import session from JSON.",
      "inputSchema": { "type": "object", "properties": { "session": { "type": "object" } }, "required": ["session"] }
    }
  ]
}
```
</webmcp_action_contract>
