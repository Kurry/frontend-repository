<summary>
Build a Community Fridge Restock Planner - Provenance Atlas - Slack Canvas app. It manages restock tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core feature is tracing a selected record to source evidence and quarantining a bad lineage via the Provenance Atlas. The application produces the user's session artifact: a downloadable JSON document preserving authored state and derived consequences, conforming to the API-shaped data schemas. State must be entirely in-memory (no localStorage). Tailwind CSS 4.3.2 is required.
</summary>

<reference_screenshots>
None provided. Follow visual instructions strictly.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Restock Tasks collection —
- Create, edit, archive, and filter restock tasks with explicit domain statuses (empty, draft, ready, changed, archived)
- Seed a deterministic collection with empty, boundary, valid, and conflict states
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery in an inline validation message
- Filtering and reordering records by domain state updates the primary collection
- The collection UI is linked to the provenance atlas and summary views
Feature: Provenance Atlas surface —
- Use the signature provenance atlas interaction to derive a decision: trace a selected record to source evidence and quarantine a bad lineage
- Undo the last mutation (Ctrl/Cmd+Z or explicit button) restores ordering, selection, and derived values
- The provenance atlas has explicit states (idle, selected, changed, conflict, resolved)
- A conflicting or incomplete mutation is rejected without partial updates
- Updates provenance-atlas geometry/selection, derived summaries, and event history synchronously
Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state
- Export produces fridge-restock-v1.json (or fridge-restock-v1-provenance-atlas.json)
- Clear and import it with field-level validation
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change on import
- A valid import restores authored structure and regenerates exportedAt
- The artifact contains schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[], derived{}, and history[]
</core_features>

<user_flows>
- The user traces a selected record to source evidence and quarantines a bad lineage, watches linked views react, then exports the completed artifact.
- The end-to-end job (create, edit, mutate, undo, and complete one record) is recoverable without reload.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state (causal motion) and has a reduced-motion equivalent without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model (stack/drawer/stepper), preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable without rebuilding unrelated surfaces.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely. Inspect labels, statuses, errors, and empty-state text.
</writing>

<innovation>
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- The visual and interaction thesis is coherent without copying unrelated screens.
</innovation>

<requirements>
- State must be entirely in-memory; do not use localStorage or remote network calls.
- The signature interaction "trace a selected record to source evidence and quarantine a bad lineage" is the primary domain mutation.
- Artifact format must be JSON and interoperable.
- All libraries must be installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

Module specs:
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

Bindings:
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: status; name; quantity; source
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json
- Editor object types: lineage
- Editor operations: select; switch_mode
- Editor modes: trace; quarantine; resolved

Mechanics exclusions:
- Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
