# Storyboard Camera Path Editor — Audit Lens

<summary>
Manage story beats through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.

This is a good-app genre frontend task built with React, Vite, and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs. State is entirely in-memory—do not use localStorage. The application must serve on port 3000.
</summary>

<core_features>
Feature: Story Beats collection
- Create, edit, archive, and filter story beats with explicit domain statuses.
- Interactivity: Create, edit, delete one record. Filter or reorder records by domain state.
- Visible states: empty, draft, ready, changed, archived.
- Boundaries: Exact field boundaries are accepted. Adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state/artifact effect: Mutates records array and status fields.

Feature: Audit Lens surface
- Use the audit lens interaction to derive a decision about the collection.
- Interactions: attach evidence to a selected record and resolve an audit discrepancy. Undo the last mutation and inspect the linked representation.
- Visible states: idle, selected, changed, conflict, resolved.
- Boundaries: Conflicting or incomplete mutations are rejected without partial updates. Undo restores ordering, selection, and derived values.
- Shared-state effect: Updates audit-lens geometry/selection, derived summaries, and event history.

Feature: Portable work artifact
- Export and restore the actual session work in a fresh state.
- Interactions: Export the current artifact, download as JSON. Clear and import it with field-level validation.
- Visible states: unsaved, exported, validated, replayed.
- Boundaries: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. Valid import restores authored structure and regenerates exportedAt.
- Output: Produces camera-path-v1.json.
</core_features>

<visual_design>
- A domain-specific workbench with clear state tokens.
- Intentional density and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
Record shape: StoryboardCameraPathEditorSession
- schemaVersion (string, exact "v1")
- exportedAt (string RFC3339)
- records (array of record objects)
- derived (object summarizing state)
- history (array of audit events)
Validation rules:
- ID uniqueness and explicit enums for status.
- Required fields, numeric/date bounds, and cross-record references validate together.

Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Semantic controls, focus management, live updates, contrast.

Mobile transforms secondary surfaces into drawers or stacked steps.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or test outputs.
</integrity>

<delivery>
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
- Editor object types: camera-path
- Editor properties: position; angle
- Editor modes: edit; view; audit
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: record
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; tag; favorite; cells
- Artifact operations: export; import; copy
- Export formats: session-json; png
- Import modes: session-json

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)
- Mirror-partner cell painting during continuous drag stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- PNG rasterization fidelity and clipboard copy stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
