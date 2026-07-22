<summary>
Build a Drum Pattern Practice Board with a Replay Timeline and Lightroom-style editing using React, Vite, and Tailwind CSS 4.3.2. The application manages a local session of drum patterns with a signature interaction to scrub a selected record through its timeline and restore a prior checkpoint. It must be an in-memory application with no localStorage, network calls, or backend. The application produces a downloadable JSON artifact conforming to API-shaped schemas. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Drum Patterns collection
- Seed a deterministic collection of at least 4 drum pattern records with empty, draft, ready, changed, and archived states. No target outcome is pre-completed.
- The collection supports create, edit, delete, and filtering by domain status (empty, draft, ready, changed, archived).
- Exact field boundaries for tempo (40 to 300) and step count (4 to 32) are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Mutates records array and status fields in the shared memory state.

Feature: Replay Timeline surface
- A Replay Timeline interaction allows users to scrub a selected record through its timeline history of edits and restore a prior checkpoint.
- Undo the last mutation and inspect the linked representation.
- Visible states include idle, selected, changed, conflict, and resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Updates replay timeline geometry/selection, derived summaries, and event history.

Feature: Portable work artifact
- Export the current artifact as drum-pattern-v1-replay-timeline.json with schemaVersion (drum-pattern-v1), exportedAt (RFC3339), records, derived state, and history.
- Clear the workspace and import the artifact with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout features a primary surface plus summary and inspector panels.
- Mobile layout transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
- Source fidelity: The visual and interaction thesis is coherent without copying unrelated screens from the cited source application.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms (i.e. if prefers-reduced-motion is active, animations are skipped but state updates remain visible).
</motion>

<requirements>
- Stack: React with Vite, Tailwind CSS 4.3.2.
- State: In-memory only. Do not use localStorage or sessionStorage.
- Validation: Forms and import feature must reject invalid values gracefully with field-level validation messages.
- Keyboard and touch parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in summary.
- The application package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds). Run via npm start on port 3000.
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
- Editor object types: timeline-event
- Editor properties: status; tempo; stepCount
- Editor modes: drum-pattern
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: drum-pattern
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; status; tempo; stepCount
- Artifact operations: export; import; copy
- Export formats: drum-pattern-v1-replay-timeline-json
- Import modes: drum-pattern-v1-replay-timeline-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
