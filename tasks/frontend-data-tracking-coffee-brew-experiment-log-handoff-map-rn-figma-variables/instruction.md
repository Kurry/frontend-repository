<summary>
Build a Coffee Brew Experiment Log using React, Zustand, and Tailwind CSS 4.3.2 (npm-local/no-CDN). The app manages brew experiments through a domain-native browser surface where one meaningful mutation (connecting a selected record to a handoff owner on a handoff map and updating readiness) updates linked views and an interoperable artifact. The app produces the user's session artifact: a downloadable and copyable Session JSON document compiled live from the experiments, derived handoff state, and history, conforming to the same API-shaped field contracts as the forms, with Import that round-trips that JSON.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Brew Experiments collection —
- Direct studio entry: first load shows the application with a list of brew experiments, a handoff map surface, and an export/import panel.
- Collection management: create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived).
- Validation: exact field boundaries are accepted; adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Feature: Handoff Map surface —
- Use the handoff map interaction to derive a decision about the collection: connect a selected record to a handoff owner and update readiness.
- Linked state: The map visually represents records. Selecting a record on the map allows assigning an owner.
- Constraints: A conflicting or incomplete mutation is rejected without partial updates.
- Undo: Undo the last mutation and inspect the linked representation, restoring ordering, selection, and derived values.
Feature: Portable work artifact —
- Export the current artifact: Export opens a surface with a format tab (Session JSON). Copy writes the text format to the clipboard; Download triggers a real file download.
- Import: Clear and import a session JSON with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says otherwise):
- Create and edit flow: Create a new experiment, fill it out, and save it. It appears in the collection.
- Signature interaction flow: Select an experiment, connect it to a handoff owner on the handoff map, and update its readiness. The linked collection list and derived summary update immediately.
- Undo flow: After the signature mutation, trigger undo. The map, selection, collection readiness, and history revert exactly.
- Validation flow: Try to save a record with invalid bounds (e.g. negative bean weight). The UI rejects the change and preserves the last valid state.
- Artifact end state: Create records, perform map mutations. Export Session JSON. Clear state. Import the JSON. Authored structure, derived state, and history must match exactly.
</user_flows>

<edge_cases>
- Boundary validation: exact bounds accepted, adjacent out-of-range rejected.
- Invalid cross-field values, empty states, and malformed imports are rejected gracefully, offering field-level recovery without dropping the user's prior valid state.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state (e.g. when connecting to a handoff owner).
- Reduced motion preserves feedback without transforms (e.g. respects prefers-reduced-motion).
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping (e.g., desktop surface becomes a usable stack/drawer/stepper).
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Keep edits responsive on 100+ seeded records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
- Domain copy names the domain consequence and recovery action precisely (labels, statuses, errors, empty-state text).
</writing>

<innovation>
Optional enhancements: linked utility providing domain utility beyond CRUD.
</innovation>

<requirements>
- Stack: React, Zustand (in-memory only, NO localStorage), Tailwind CSS 4.3.2 (npm-local/no-CDN).
- Record shape: CoffeeBrewExperimentLogSession with schemaVersion (v1 enum), exportedAt (RFC3339), records[], derived{}, and history[]. Each record is an API-shaped would-be request body.
- Interoperable format: brew-experiment-v1-handoff-map.json.
- State contracts: in-memory only; export/import is the persistence boundary.
- A CRUD table cannot satisfy the domain-native signature, linked derived consequence, alternate input, causal motion, mobile transformation, or exact artifact round trip.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
- WebMCP is a required delivery step. Implement exactly the `<webmcp_action_contract>` below.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

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
- Editor object types: handoff-map-node
- Editor properties: owner; readiness
- Editor operations: select; update_property
- Entity: brew-experiment
- Entity operations: create; select; update; delete
- Entity fields: status
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag/drop interaction on the handoff map stays Playwright-observed.
</webmcp_action_contract>