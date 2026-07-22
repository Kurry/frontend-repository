<summary>
Build a Soundscape Scene Composer using React, Tailwind CSS 4.3.2, and Vite. The app manages sound layers through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Sound Layers collection. Create, edit, archive, and filter sound layers with explicit domain statuses. Create/edit/delete one record. Filter or reorder records by domain state. Visible states: empty, draft, ready, changed, archived. Boundaries and recovery: Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery. Shared-state/artifact effect: Mutates records array and status fields in soundscape-scene-v1-forecast-ribbon.json.

Feature: Forecast Ribbon surface. Use the forecast ribbon interaction to derive a decision about the collection. Interactions: adjust a selected record on a forecast ribbon and compare projected outcomes. Undo the last mutation and inspect the linked representation. Visible states: idle, selected, changed, conflict, resolved. Boundaries and recovery: A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. Shared-state/artifact effect: Updates forecast-ribbon geometry/selection, derived summaries, and event history.

Feature: Portable work artifact. Export and restore the actual session work in a fresh state. Interactions: Export the current artifact. Clear and import it with field-level validation. Visible states: unsaved, exported, validated, replayed. Boundaries and recovery: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt. Shared-state/artifact effect: Produces soundscape-scene-v1-forecast-ribbon.json with schemaVersion, exportedAt, records, derived state, and history.

Data and artifact contract: Record shape: SoundscapeSceneComposerSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body. Validation rules: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together. Persistence: In-memory only; export/import is the persistence boundary. Import/export: soundscape-scene-v1-forecast-ribbon.json uses the forecast-ribbon schema for export and import, rejects invalid records without mutation, and regenerates exportedAt. Round trip: Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
Build a frontend-only React app with Vite and Tailwind CSS 4.3.2. State must be entirely in-memory. Never use localStorage or remote network calls.
Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
The forecast ribbon surface, derived summary, and artifact query share one state.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Editor object types: forecast-ribbon
- Editor properties: selected_record; projection
- Editor modes: compare; adjust
- Editor operations: select; update_property; preview
- Entity: sound-layer
- Entity operations: create; select; update; delete; reorder
- Entity fields: name; state; duration; volume
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag/scroll gestures on forecast ribbon stay Playwright
- File selection dialog stays Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
