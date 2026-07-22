# Session Compression Loom

<summary>
An operator folds contiguous trajectory events into structured summary capsules, preserves mandatory evidence and causal ancestry, previews the exact distilled session, and proves every output sentence maps back to source events. The operator iterates until the package fits a token cap, compares two compression strategies, then exports a deterministic compressed trace with provenance and preservation assertions.
</summary>

<core_features>
- A linked graph shows raw events, capsules, protected anchors, and dependency paths.
- Folding reroutes external edges to the capsule while preserving internal edges in its expandable interior.
- A live ruler reports raw, capsule, protected, and remaining tokens. A loss lens groups omitted facts by phase and severity.
- Brushing ruler intervals synchronizes loom, graph, and preview.
- The preview interleaves raw retained events and capsule text in canonical temporal order. Selecting a sentence reveals its capsule, facts, and complete source set.
- Data export provides a deterministic compressed trace with provenance and preservation assertions, conforming strictly to the API-shaped artifact contract.
- The trace fixture has exactly 72 ordered events, 9 phases, 14 dependency edges, 6 protected evidence anchors, and a 10,000-token raw size. The token cap is 4,200.
</core_features>

<visual_design>
- Foldable temporal loom: Events render as colored warp threads on a zoomable time ruler.
- Capsule anatomy editor: Exposes included facts, omitted facts, source-event chips, and token weight.
- Loss lens: Groups omitted facts by phase and severity.
</visual_design>

<motion>
- Causal motion: Threads wrap into capsules and edges reroute; reduced motion uses instant substitution with persistent source and token deltas.
</motion>

<requirements>
- Desktop aligns loom, graph, preview, and token ruler. Tablet uses a synchronized two-pane layout. Mobile becomes a vertical temporal outline with expandable capsule cards, sticky token meter, source sheet, and sentence provenance drawer.
- Sibling intervals never overlap; child intervals are strictly contained; source membership must equal the interval's resolved leaf events.
- Selected facts belong to the capsule variant; protected facts/anchors and required ancestry survive exactly once in resolved output.
- Every fold changes temporal geometry, dependency validity, token use, preview text, and artifact topology.
- Data output MUST be API-shaped and verifiable.
- The exported output must be a valid JSON with schemaVersion: "compressed-session-pack/v1". It must contain the deterministic fold tree, capsule variant selections, titles, strategies, view state, and UTC exportedAt.
- Reject fixture mismatch, crossing intervals, duplicate ids, external sources, absent protected facts, forged derived data, or unknown variants upon import.
- Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2 (pinned), and Kobalte as the single component library (Vite or equivalent); frontend-only.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- Editor Entity: capsule
- Editor operations: select; update; create; preview
- Editor Fields: title; variant
- Artifact Formats: compressed-session-pack-v1
- Artifact operations: export; import
- Import modes: compressed-session-pack-v1

Mechanics exclusions:
- Text selection, range highlighting, preview layout, and download bytes stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
