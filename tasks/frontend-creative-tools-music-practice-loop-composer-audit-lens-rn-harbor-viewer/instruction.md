<summary>
Build the Music Practice Loop Composer — Audit Lens — H-Viewer, a domain-native browser surface for managing practice segments. The application features keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery. The user must be able to attach evidence to a selected record and resolve an audit discrepancy, which updates linked views and an interoperable artifact. Built with React and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Practice Segments collection
- Create, edit, archive, and filter practice segments with explicit domain statuses
- Create/edit/delete one record and filter or reorder records by domain state
- Visible states include empty, draft, ready, changed, and archived
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery
- Mutates records array and status fields in the session artifact

Feature: Audit Lens surface
- Use the audit lens interaction to derive a decision about the collection
- Attach evidence to a selected record and resolve an audit discrepancy
- Undo the last mutation and inspect the linked representation
- Visible states include idle, selected, changed, conflict, and resolved
- A conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values
- Updates audit-lens geometry/selection, derived summaries, and event history

Feature: Portable work artifact
- Export and restore the actual session work in a fresh state
- Export the current artifact to practice-loop-v1-audit-lens.json
- Clear and import the artifact with field-level validation
- Visible states include unsaved, exported, validated, and replayed
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
- Produces session artifact with schemaVersion, exportedAt, records, derived state, and history
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
- Desktop layout features a primary surface plus a summary and inspector
- Clear visual hierarchy makes the current state and next action clear
- The visual and interaction thesis is coherent with the cited open source release viewer pattern
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state
- Reduced motion preserves feedback without transforms
</motion>

<requirements>
- State must be entirely in-memory and must not use localStorage, sessionStorage, or remote network calls
- Build with React and Tailwind CSS 4.3.2
- All libraries must be installed locally via npm and no CDNs are allowed for any assets
- The exported artifact must conform to the MusicPracticeLoopComposerSession schema
- The schemaVersion must be a task-specific v1 enum and exportedAt must be an RFC3339 timestamp
- Record IDs must be unique and status values must be explicit enums
- Required fields, numeric/date bounds, and cross-record references must validate together
- Implement alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation, and Ctrl/Cmd+Z undoes it
- The UI must stay responsive on collections with at least 100 records and unrelated rows must stay stable
- Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping
- Desktop surface becomes a usable stack/drawer/stepper on mobile viewports
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support must be implemented
- Copy must name the domain consequence and recovery action precisely
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
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
- Editor object types: loop-segment
- Editor operations: select; update_property
- Entity: practice-segment
- Entity operations: create; select; update; delete; reorder
- Entity fields: status
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Real gesture, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
</webmcp_action_contract>
