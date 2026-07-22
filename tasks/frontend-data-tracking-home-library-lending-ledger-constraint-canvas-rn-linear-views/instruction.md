<summary>
The goal is to build the Home Library Lending Ledger, a frontend-only web application that manages books through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core feature is a constraint canvas where users can drag a selected record across constraint lanes and resolve conflicts. This provides a shareable filtered workflow view whose grouping, context, and generated update remain linked. The app is completely local with in-memory state, relying on exporting and importing a JSON session artifact (library-lending-v1-constraint-canvas.json) to preserve authored state and derived consequences for a clean round trip.
</summary>

<core_features>
Books collection features let users create, edit, archive, and filter books with explicit domain statuses. Users can drag a selected record across constraint lanes and resolve a conflict, with an option to undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation is rejected without partial updates. The tool allows exporting and restoring the actual session work in a fresh state with field-level validation, preserving authored order, selection, geometry, and domain state.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout includes a desktop primary surface plus a summary and inspector, transforming into drawers or stacked steps on mobile to preserve usability and avoid horizontal clipping.
- The visual hierarchy makes the current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state when transitioning lanes or resolving conflicts.
- Motion connects the item to its state and has a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
State must be completely in-memory (no localStorage, remote APIs, or other persistence). Stack must use Vite, React, and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs. Validation logic ensures schemaVersion is a task-specific v1 enum, exportedAt is RFC3339, record IDs are unique, and status values are explicit enums. The useful downloadable end state is an interoperable books session artifact named library-lending-v1-constraint-canvas.json containing schemaVersion, exportedAt, records array, derived object, and history array. Seed a deterministic collection with empty, boundary, valid, and conflict states.
</requirements>

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
- Editor object types: constraint-canvas, book-record
- Editor properties: status, constraint-lane
- Editor operations: select, update_property
- Entity: book
- Entity operations: create, select, update, delete
- Entity fields: id, title, author, status
- Artifact operations: export, import
- Export formats: library-lending-v1-constraint-canvas.json
- Import modes: library-lending-v1-constraint-canvas.json

Mechanics exclusions:
- Dragging a selected record across constraint lanes stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>
