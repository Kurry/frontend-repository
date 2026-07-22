<summary>
A pet care wellness log and recovery board application. Users can manage pet care events in a bounded local workflow, move a failed record into a recovery path, repair downstream consequences, and export/import their work as an interoperable JSON artifact.
</summary>

<core_features>
Feature: Pet Care Events collection —
- A main view displays a collection of pet care events. The user can create, edit, archive, and filter pet care events.
- Each record has an explicit domain status. Visible states include: empty, draft, ready, changed, archived.
- The user can filter or reorder records by domain state.
- Form inputs enforce exact boundaries. Adjacent out-of-range values are rejected.
- When saving, invalid required fields preserve the prior valid record and explain the recovery action to the user with an inline error message.
- Creating or editing events mutates the records array and status fields which will be represented in the export artifact.

Feature: Recovery Board surface —
- A dedicated recovery board allows the user to interact with records that require attention.
- The user can move a failed record into a recovery path and repair its downstream consequences.
- The recovery board reflects visible states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation in the recovery board is rejected without partial updates.
- The user can undo the last mutation (e.g. via an Undo button or Ctrl/Cmd+Z), and the interface will restore the previous ordering, selection, and derived values.
- Moving records updates the recovery-board geometry/selection, updates derived summaries (e.g., total recovered, pending issues), and appends to the event history.

Feature: Portable work artifact —
- The user can export the current session's work as pet-wellness-v1-recovery-board.json.
- The user can clear the current state and import a previously exported artifact with field-level validation.
- The interface displays states: unsaved, exported, validated, replayed.
- On import, a malformed schema, duplicate IDs, unknown references, or invalid bounds make no state change and display an error.
- A valid import restores the authored structure (records, derived state, history) and regenerates exportedAt.
- The exported artifact uses the schema shape: { schemaVersion: "v1", exportedAt: "<ISO string>", records: [...], derived: {...}, history: [...] }.
</core_features>

<user_flows>
- To recover a failed record, the user selects a record marked as failed from the collection, opens the Recovery Board, moves the record to a recovery state, resolves its downstream fields, and clicks save. The derived summary updates and the event is added to the history.
</user_flows>

<edge_cases>
- Entering a date in the past for a future scheduled event will show a field-level error and block saving.
- Attempting to import an invalid JSON file will show an error without wiping the current state.
</edge_cases>

<visual_design>
- The visual hierarchy makes the current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The desktop layout features a primary surface plus summary and inspector.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state (e.g., an item visually moves or morphs into its new state when recovered).
- Reduced motion preserves feedback without transforms (i.e. if prefers-reduced-motion is active, it just snaps to the new state).
</motion>

<responsiveness>
- Narrow layouts change the interaction model, transforming secondary surfaces into drawers or stacked steps without horizontal clipping.
- Preserves touch targets (at least 44px by 44px) on mobile views.
</responsiveness>

<accessibility>
- Provides semantic controls, keyboard parity, focus management, and live updates.
- The recovery board mutation has a full keyboard equivalent that produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- The application can handle a seeded collection with at least 100 records while keeping the signature interaction responsive (within 100ms) and without rebuilding unrelated surfaces.
</performance>

<writing>
- The domain copy names the domain consequence and recovery action precisely (e.g., using "Recover" and "Resolve" rather than generic "Submit").
</writing>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- State must be in-memory only; no localStorage or external persistence is allowed.
- The user interface must be completely client-side rendered using React.
</requirements>

<webmcp_action_contract>
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "CRUD operations and state management for bounded collections.",
  "permitted_operations": ["create", "read", "update", "delete", "list", "reorder", "filter", "undo"],
  "binding_keys": {
    "required_any_of": [["entity_operations"]],
    "optional": ["entity_types", "visible_postconditions"]
  },
  "restrictions": [
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "clear", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity operations: create, read, update, delete, list, reorder, filter, undo
- Entity types: event
- Artifact operations: import, export, clear
- Export formats: json

Mechanics exclusions:
- Drag-and-drop interactions in the recovery board are graded via Playwright.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
