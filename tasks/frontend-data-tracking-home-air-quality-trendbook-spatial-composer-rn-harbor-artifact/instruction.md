<summary>
Home Air Quality Trendbook: Spatial Composer — Custom Artifact Provenance
A domain-native browser surface where one meaningful mutation ("place a selected record in a spatial composer and rebalance capacity") updates linked views and an interoperable artifact. This concept adapts Custom's pattern (scrubbed API keys, source labels, trial downloads, plain JSON, and explicit upload failures) into a self-contained frontend job.
</summary>

<core_features>
Air Readings collection
- Create, edit, archive, and filter air readings with explicit domain statuses (empty, draft, ready, changed, archived)
- Exact field boundaries are accepted while adjacent out-of-range values are rejected (inline validation messages)
- Invalid required fields preserve the prior valid record and explain recovery

Spatial Composer surface
- Canonical mutation: place a selected record in a spatial composer and rebalance capacity
- Undo the last mutation (Ctrl/Cmd+Z or explicit button) and inspect the linked representation
- Visible states: idle, selected, changed, conflict, resolved
- Conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values

Portable work artifact
- Export the current artifact (air-quality-v1-spatial-composer.json)
- Clear and import it with field-level validation
- Visible states: unsaved, exported, validated, replayed
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
- Source inspiration visually coherent (Custom release notes redaction/source lineage without copying unrelated screens).
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state (causal motion connects action to consequence).
- Reduced motion preserves feedback without transforms (respects prefers-reduced-motion).
</motion>

<requirements>
- Shared application state must use an appropriate state manager (Solid stores, Redux, React context/reducers, Vue Pinia, etc depending on framework choice; in-memory only).
- Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- Seed a deterministic collection with at least 4 records (empty, boundary, valid, and conflict states) so the app is non-empty on load; no target outcome is pre-completed.
- Stack: Modern frontend stack (e.g. React/Vite/Tailwind CSS 4.3.2) or Solid/Vue; frontend-only.
- All assets must be loaded locally without CDNs.
- Record shape (HomeAirQualityTrendbookSession): schemaVersion (v1 enum), exportedAt (RFC3339), records[] (each record is an API-shaped would-be request body), derived{}, and history[].
- Validation: schemaVersion is a task-specific v1 enum; exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together.
- Interoperable format: air-quality-v1-spatial-composer.json
- Round trip: Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard/touch) produces identical state.
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

Bindings:
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: status
- Artifact operations: export; import; copy
- Export formats: air-quality-v1-spatial-composer.json
- Import modes: air-quality-v1-spatial-composer.json

Mechanics exclusions:
- Gesture, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
- Raw file paths/blobs forbidden in WebMCP args.
- Real gestures and downloaded artifacts remain Playwright responsibilities.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
