# Music Practice Loop Composer — Handoff Map

<summary>
Manage practice segments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Connect a selected record to a handoff owner and update readiness. This tool serves as a visual token/prototype editor where variable changes update modes, preview states, and export tokens, providing a local, self-contained frontend job. In-memory state only (no localStorage).
</summary>

<core_features>
Create, edit, archive, and filter practice segments with explicit domain statuses.
Use the handoff map interaction to derive a decision about the collection by connecting a selected record to a handoff owner and updating readiness.
Undo the last mutation and inspect the linked representation.
Export and restore the actual session work in a fresh state via practice-loop-v1-handoff-map.json.
Clear and import the exported artifact with field-level validation.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes the current state and next action clear, with desktop showing primary surface plus summary and inspector.
Statuses are visually distinct (e.g., draft, ready, changed, archived, conflict, resolved).
</visual_design>

<motion>
The acted-on item moves or morphs into its new state during the canonical mutation.
A reduced-motion equivalent must exist and preserve feedback without transforms.
Smooth transitions between states (empty, draft, ready, changed, archived).
</motion>

<requirements>
State must be in-memory only (React Context or Zustand); a page reload returns the app to its seeded state.
Create/edit/delete records must update the shared collection.
The canonical mutation (connect a selected record to a handoff owner and update readiness) must be possible via drag/drop or equivalent gesture.
The artifact practice-loop-v1-handoff-map.json preserves authored state, derived consequences, and history for a clean round trip.
Stack: React 19, Vite, Tailwind CSS 4.3.2 (pinned), Framer Motion, and Zod. Use npm-local/no-CDN installation rule.
All libraries must be installed locally via npm; no CDN imports.
Seed at least 100 practice segments to demonstrate performance on large collections.
Provide keyboard and touch-equivalent controls that produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Forms should show inline field-level errors and disable submit until valid.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in /app; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds).
Run via npm start on port 3000.
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
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP."
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
    "Closed entity and field enums only."
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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: handoff-map-node
- Editor properties: owner; readiness
- Editor modes: view; edit
- Editor operations: select; update_property; switch_mode; preview
- Entity: practice-segment
- Entity operations: create; select; update; delete
- Entity fields: name; domainState; owner; readiness
- Artifact operations: export; import; copy
- Export formats: practice-loop-v1-handoff-map.json
- Import modes: practice-loop-v1-handoff-map.json

Mechanics exclusions:
- Drag/drop interaction stays Playwright (gesture mechanics)
- File download/upload interactions stay Playwright-observed
</webmcp_action_contract>
