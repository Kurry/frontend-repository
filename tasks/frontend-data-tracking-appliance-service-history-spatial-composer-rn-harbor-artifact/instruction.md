# Appliance Service History — Spatial Composer — Artifact Provenance

<summary>
A React frontend-only application for managing appliance service records using an in-memory state. Users can create, edit, archive, and filter records. The core interaction is placing a selected record in a spatial composer to rebalance capacity, which simultaneously updates linked views (a derived summary and an artifact inspector). The final output is an interoperable appliance-service-v1-spatial-composer.json artifact containing scrubbed source lineage and exact visual layout geometry, strictly matching the canonical pattern. Built with React and Tailwind CSS 4.3.2; all assets must be loaded locally without CDNs. No localStorage or remote network calls are permitted.
</summary>

<core_features>
Appliance Records collection: Create, edit, archive, and filter records with explicit domain statuses (empty, draft, ready, changed, archived). Invalid fields preserve the prior record.
Spatial Composer surface: The canonical mutation is placing a selected record in a spatial composer to rebalance capacity. This requires selecting a record, interacting with a spatial composer canvas to move it (which rebalances other records), and resolving conflicts. Includes an undo function to restore the previous state and derived values.
Portable work artifact: Export the session work as a clean JSON artifact. Clear the state. Import the artifact to restore authored structure and regenerate the exportedAt timestamp, validating field schemas.
</core_features>

<visual_design>
- A distinctive domain-specific workbench with clear state tokens.
- Layout features a primary spatial surface and secondary summary/inspector panels on desktop. On mobile, secondary surfaces transform into stack/drawers to avoid horizontal clipping.
- The visual hierarchy clearly differentiates current states (idle, selected, changed, conflict, resolved) and actions.
</visual_design>

<motion>
- The acted-on item smoothly moves or morphs into its new state within the spatial composer.
- A reduced-motion equivalent must exist to preserve feedback without heavy transforms.
</motion>

<requirements>
State is strictly in-memory (no localStorage). A page reload resets the app.
Shared application state: appliance records array, active filter, spatial layout geometry, current selected record, derived summaries, undo history.
The canonical mutation (placing a record in the spatial composer to rebalance capacity) updates the records list, spatial geometry, and the artifact inspector at once.
Alternate input parity: Keyboard and touch-equivalent controls produce the exact same canonical mutation; Ctrl/Cmd+Z undoes it.
Boundaries: Reject incomplete/conflicting mutations in the composer without partial updates. Reject invalid imports (malformed schema, duplicate IDs, unknown refs, invalid bounds) with no state change.
Artifact shape: ApplianceServiceHistorySession with schemaVersion (must be v1), exportedAt (RFC3339), records array, derived object, and history array.
Seed the app with at least 100 deterministic records including empty, boundary, valid, and conflict states to prove performance. Unrelated rows must stay stable during mutations.
Writing: Copy names the domain consequence and recovery actions precisely. No lorem-ipsum.
Stack: React, Tailwind CSS 4.3.2.
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
- Editor object types: appliance-record
- Editor properties: geometry; capacity
- Editor modes: spatial-composer
- Editor operations: select; update_property; set_content
- Entity: record
- Entity operations: create; select; update; delete; toggle
- Entity fields: status; name; type; date
- Artifact operations: export; import; copy
- Export formats: appliance-service-v1-spatial-composer.json
- Import modes: appliance-service-v1-spatial-composer.json

Mechanics exclusions:
- Drag-and-drop interactions for spatial composition remain Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
