<summary>
Build a Quilt Block Layout Studio with a Constraint Canvas and Linear Filtered Views using React 19, Zustand, and Tailwind CSS 4.3.2. The app produces the operator's session artifact: a downloadable and copyable Session JSON document compiled live from the quilt blocks collection, constraint canvas, derived state, and history. The app uses in-memory state only, NO localStorage.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Quilt Blocks collection —
- Direct studio entry: first load shows the application with a seeded collection of at least 100 quilt block records in various states (empty, boundary, valid, conflict) — no login or backend.
- Create, edit, delete, and archive quilt blocks. Each block has a unique ID, required fields, and an explicit domain status enum (draft, ready, changed, archived).
- Filter or reorder records by domain state using a linear-style shareable filtered view.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected with field-level recovery, preserving the prior valid record.
Feature: Constraint Canvas surface —
- A visual constraint canvas with lanes corresponding to domain states or constraints.
- Signature interaction: drag a selected record across constraint lanes and resolve a conflict.
- Visible states on the canvas: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation: restores ordering, selection, and derived values.
- Linked views: The constraint canvas surface, derived summary, and artifact query share one state. Mutating a record updates the linked summary and artifact immediately.
Feature: Portable work artifact —
- Session export and import: Export produces quilt-layout-v1-constraint-canvas.json (the API-shaped session document).
- Record shape: QuiltBlockLayoutStudioSession with schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records array, derived object, and history array.
- Clear the current state, and import the artifact with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure, selection, geometry, domain state, and regenerates exportedAt.
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says otherwise):
- Complete user flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Signature interaction flow: drag a selected record across constraint lanes and resolve a conflict. The constraint canvas mutation changes the primary record, linked view, and status together.
- Artifact round trip flow: Export, clear, import, and inspect the edited variant record and derived state. Authored order, selection, geometry, and domain state survive; invalid import is a no-op.
- Keyboard and touch-equivalent flow: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Visual hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Causal motion: drag a selected record across constraint lanes and resolve a conflict. Motion connects the acted-on item to its new state and has a reduced-motion equivalent (preserves feedback without transforms).
</motion>

<responsiveness>
- Mobile mode: Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow, preserving touch targets and changing interaction model.
</responsiveness>

<accessibility>
- Alternate input: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it. Visible focus and live feedback. Semantic controls, focus management, contrast, live updates.
</accessibility>

<performance>
- Large collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable without rebuilding unrelated surfaces.
</performance>

<writing>
- Domain copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<requirements>
- Shared application state must use Zustand (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs.
- Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2, and framer-motion.
- Use framer-motion for motion, dnd-kit for drag and drop.
- Forms driven by React Hook Form with Zod schema validation.
- All libraries installed via npm and bundled locally. No network dependencies.
- Product naming: Quilt Block Layout Studio. Serve over local HTTP for verification.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
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
- Editor object types: constraint-canvas; quilt-block
- Editor properties: status; conflict
- Editor operations: select; update_property; set_content
- Entity: quilt-block
- Entity operations: create; select; update; delete
- Entity fields: status; blockName; size
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag-and-drop gestures for the constraint canvas stay Playwright (gesture mechanics)
- Canvas visual bounds and geometric constraint resolution remain Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
</webmcp_action_contract>
