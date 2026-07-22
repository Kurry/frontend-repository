<summary>
Build a Drum Pattern Practice Board with an Audit Lens tool, inspired by framework patterns. The app allows users to manage drum patterns in a bounded local workflow, attaching evidence to a selected record to resolve an audit discrepancy. It features a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact (drum-pattern-v1-audit-lens.json). Uses a Vite/React stack with Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Drum Patterns Collection: Create, edit, archive, and filter drum patterns with explicit domain statuses. Includes states: empty, draft, ready, changed, archived.
- Invalid required fields preserve the prior valid record and explain recovery.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Audit Lens Surface: A linked decision surface to attach evidence to a selected record and resolve an audit discrepancy. Includes states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation in Audit Lens is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state/artifact effect: The canonical mutation updates audit-lens geometry/selection, derived summaries, and event history simultaneously.
- Portable work artifact: Export and restore the session work in a fresh state via drum-pattern-v1-audit-lens.json.
- Export the current artifact; clear and import it with field-level validation. States: unsaved, exported, validated, replayed.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Must use Tailwind CSS 4.3.2.
- The state must be entirely in-memory. Never use localStorage or remote network calls.
- The exported artifact must conform to the shape: DrumPatternPracticeBoardSession with schemaVersion ('v1'), exportedAt, records, derived, and history. Each record is an API-shaped would-be request body.
- Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The audit lens surface, derived summary, and artifact query share one state.
- All assets must be loaded locally without CDNs.
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool only.
- Self-test tooling is preinstalled and optional to use: playwright@1.61.0 and @playwright/mcp are installed globally with browsers ready under /ms-playwright, a shared headless Chrome already exposes CDP at http://127.0.0.1:9222, and the same CDP bridge the verifier runs is baked at /opt/webmcp/webmcp_stdio_server.mjs. Drive your served app through that Chrome (playwright connectOverCDP, or npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222), and run node /opt/webmcp/webmcp_stdio_server.mjs (stdio MCP; defaults to that endpoint) to exercise your registered window.webmcp_* tools exactly as the verifier will.
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
- Entity: drum-pattern
- Entity operations: create; update; select; delete
- Entity fields: status
- Artifact operations: export; import
- Export formats: drum-pattern-v1-audit-lens.json
- Import modes: drum-pattern-v1-audit-lens.json

Mechanics exclusions:
- Drag, focus, hover, keyboard events are tested manually by Playwright.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
