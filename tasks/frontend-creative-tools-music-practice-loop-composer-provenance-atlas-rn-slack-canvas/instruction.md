<summary>
Build a Music Practice Loop Composer using React 19, Vite, Zustand, Tailwind CSS 4.3.2 (npm-local/no-CDN), framer-motion, and lucide-react. The application is a self-contained local workspace inspired by Slack canvas embedded workflows, designed to manage practice segments with a provenance atlas interaction. Users can trace a selected record to source evidence and quarantine a bad lineage. The app operates entirely in-memory and produces a downloadable JSON artifact containing the full state, history, and derived summaries, which can be re-imported in a clean session to restore exact authored conditions.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Practice Segments collection —
- Complete CRUD operations for practice segments, including explicit domain statuses (empty, draft, ready, changed, archived).
- Filter and reorder records by domain state.
- Form controls validate input boundaries, rejecting out-of-range values and preserving the prior valid record when errors occur, displaying actionable recovery messages.
- Modifying a segment synchronously mutates the in-memory state and the linked provenance atlas view without intermediate saves.
Feature: Provenance Atlas surface —
- A primary interaction surface for viewing segments, where the user can trace a selected record to source evidence and quarantine a bad lineage.
- The UI handles states: idle, selected, changed, conflict, resolved.
- Implementing an undo action (Ctrl/Cmd+Z or a button) restores the immediately preceding mutation's order, selection, and derived values.
- Reject conflicting or incomplete mutations without partial state updates.
Feature: Portable work artifact —
- Users can export the session artifact as a file named practice-loop-v1-provenance-atlas.json containing schemaVersion, exportedAt (RFC3339 timestamp), records array, derived state, and history.
- Importing valid JSON restores the exact state and regenerates exportedAt.
- Importing an invalid file (malformed schema, duplicate IDs, unknown references, or invalid bounds) results in no state change.
</core_features>

<visual_design>
Visual design constraints:
- Use Tailwind CSS 4.3.2 classes exclusively for styling.
- Create a distinctive, domain-specific workbench UI with clear state tokens and intentional density.
- Organize the layout for desktop with a primary provenance atlas surface, a derived summary panel, and a detail inspector.
- Provide clear visual hierarchy making current state and next available actions immediately obvious.
</visual_design>

<motion>
Motion and animation:
- Implement causal motion using framer-motion where an acted-on item animates into its new state (e.g., when traced and quarantined).
- Ensure that the animations have a reduced-motion equivalent that preserves feedback without physical transforms.
</motion>

<requirements>
Requirements and constraints:
- Responsive design: narrow layouts (mobile) transform secondary surfaces into drawers or stacked steps, preserving touch targets and preventing horizontal scrolling.
- Accessibility: ensure keyboard parity for the signature mutation and all controls, proper semantic markup, focus management, and adequate contrast.
- Performance: interactions remain responsive with a collection of at least 100 records seeded.
- Language: use precise domain copy for labels, statuses, errors, and empty-state text.
- Technology: Must use React 19, Vite, Tailwind CSS 4.3.2, and npm-local/no-CDN installation. No localStorage; state is in-memory only.
- Validation: Enforce strict schema and boundary validation on export and import.
- WebMCP: Implement standard bindings (window.webmcp_session_info, webmcp_list_tools, webmcp_invoke_tool) for deterministic state inspection and interaction.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Bindings:
<binding id="structured-editor-v1">
{
  "editor_operations": ["select", "update_property", "switch_mode"],
  "editor_object_types": ["practice_segment", "provenance_lineage"],
  "editor_properties": ["status"],
  "editor_modes": ["idle", "selected", "changed", "conflict", "resolved"],
  "visible_postconditions": ["Linked views updated", "Summary calculated"]
}
</binding>

<binding id="entity-collection-v1">
{
  "entity_types": ["practice_segment", "history_event"],
  "collection_operations": ["create", "read", "update", "delete", "list", "filter", "sort"],
  "filter_properties": ["status"],
  "sort_properties": ["status"],
  "visible_postconditions": ["Collection list updated", "Record details visible"]
}
</binding>

<binding id="artifact-transfer-v1">
{
  "artifact_types": ["application/json"],
  "transfer_operations": ["export", "import", "clear"],
  "artifact_schemas": ["practice-loop-v1-provenance-atlas.json"],
  "validation_rules": ["Valid schema required", "Duplicate IDs rejected"],
  "visible_postconditions": ["State restored", "History regenerated", "Invalid import rejected"]
}
</binding>
</webmcp_action_contract>
