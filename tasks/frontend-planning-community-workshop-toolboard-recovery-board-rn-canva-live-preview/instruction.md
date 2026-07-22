# Community Workshop Toolboard — Recovery Board — Canva Live Preview

<summary>
Manage workshop stations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

Existing tools split workshop stations editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Canva's shipped pattern of live mobile previews, speaker-time notes, whiteboard pan shortcuts, charts, and custom short links into a self-contained frontend job.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
- Workshop Stations collection: Create, edit, archive, and filter workshop stations with explicit domain statuses. Create/edit/delete one record. Filter or reorder records by domain state. Visible states: empty, draft, ready, changed, archived.
- Recovery Board surface: Use the recovery board interaction to derive a decision about the collection. move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation. Visible states: idle, selected, changed, conflict, resolved.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact. Clear and import it with field-level validation. Visible states: unsaved, exported, validated, replayed.
</core_features>

<user_flows>
- Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Boundaries and recovery: Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- Visual Hierarchy: The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel. A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Causal Motion: The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Mobile Transformation: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Alternate Input: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it. Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Large Collection: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. Unrelated rows stay stable.
</performance>

<writing>
- Domain Copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked Utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- Record shape: CommunityWorkshopToolboardSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Record IDs are unique and status values are explicit enums.
- Required fields, numeric/date bounds, and cross-record references validate together.
- In-memory only; export/import is the persistence boundary. No localStorage or remote network calls.
- workshop-toolboard-v1-recovery-board.json uses the recovery-board schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
- Tailwind CSS 4.3.2 must be used for styling.
- All dependencies must be installed locally via npm. Do not use external CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The oracle implementation must be served on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
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
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
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
- Editor object types: recovery-board
- Editor properties: status
- Editor operations: select; update_property
- Entity: record
- Entity operations: create; update; delete; reorder
- Entity fields: status; name
- Artifact operations: export; import; clear
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Gesture and focus states stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
