<summary>
Build a React-based Escape Room Puzzle Studio for authoring spatial puzzle dependencies and room layout. The app features an interactive 9x7 meter room canvas (0.1m grid), a puzzle dependency graph, clue/lock configuration, a playtest simulator, a static analyzer, and an export artifact compiler (JSON, SVG, CSV, Markdown). It uses in-memory state only with no localStorage.
</summary>

<core_features>
Feature: Room and Prop Layout —
- 90x70 grid canvas representing a 9x7 meter room (0.1m per cell).
- Add, drag, and remove Props (rectangles with customizable width/height/name) on the grid.
- Props must not overlap; dragging them snaps to the grid and rejects overlapping placements.
Feature: Puzzle Dependency Graph —
- Nodes represent entities like Action, Clue, Fact, Item, and Lock.
- Edges represent dependencies (Requires, Produces).
- An interface to create and connect nodes. Cycle detection prevents intentional dependency cycles.
Feature: Playtest Simulation —
- A simulation mode where the user steps through available Actions based on current Knowledge (Facts) and Inventory (Items).
- Actions are triggerable only if dependencies are met.
- Keeps an append-only event log.
Feature: Static Analysis Evaluator —
- A tool to run analysis that lists unreachable nodes (nodes that can never have their dependencies met).
Feature: Export and Import (Useful end state) —
- Export interface producing four formats: JSON (canonical state), SVG (room map), CSV (playtest events), and Markdown (build runbook).
- Import replaces state from a valid JSON document.
- Reloading the page clears state (in-memory only).
</core_features>

<visual_design>
- Tabbed interface switching between Canvas, Graph, Simulation, and Export.
- Layout uses visual boundaries for the room.
- Clear error states for invalid actions.
</visual_design>

<motion>
- Basic state feedback (e.g., node highlight when selected).
</motion>

<requirements>
- Stack: React, Tailwind CSS 4.3.2. Frontend-only.
- State: In-memory only (React state or Zustand). No localStorage.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
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
- Editor object types: prop; node; edge
- Editor properties: x; y; width; height; type
- Editor modes: layout; graph; simulate
- Editor operations: select; add; delete; update_property; switch_mode
- Entity: playtest-event
- Entity operations: create; select
- Artifact operations: export; import
- Export formats: json; svg; csv; markdown
- Import modes: json

Mechanics exclusions:
- Dragging props stays Playwright-driven.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
