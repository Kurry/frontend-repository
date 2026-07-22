<summary>
Build a Weaving Draft Constraint Studio using React, Tailwind CSS 4.3.2, and TypeScript. The app is a grid-based textile pattern editor where a user paints threading, tie-up, treadling, and yarn colors; observes the derived drawdown; repairs floats; branches and compares variants; simulates row-by-row weaving with undoable corrections; approves drafts; and exports artifacts (JSON, WIF, SVG, CSV).
</summary>

<core_features>
Feature: Deterministic fixture and loom constraints
- The fictional loom has four shafts, four treadles, 24 warp ends, and 32 picks.
- The editor supports at most 64 ends and 96 picks.
- It starts with a deterministic twill draft fixture, one broken threading repeat, two long warp floats, one long weft float, and fixed yarn/waste formulas.
- Yarn lots: six distinct colors/lots.

Feature: Threading, tie-up, and treadling grids
- Warp end selects exactly one shaft.
- Treadle lifts one or more shafts.
- Pick selects exactly one treadle.
- Users paint/erase cells, drag ranges, copy/paste/rotate/reverse bounded selections, and enter numeric sequences.
- Keyboard navigation and mobile sequence sheets are equal to pointer operations.

Feature: Derived drawdown
- Warp is visible if the selected treadle lifts the threaded shaft; else weft is visible.
- The cloth preview renders exact active warp/weft color.
- Clicking any drawdown cell highlights its threading, tie-up, treadling, and color inputs; editing drawdown directly is forbidden.

Feature: Color orders and yarn lots
- Warp ends and weft picks bind yarn colors/lots.
- Painting, sequence editing, palette reorder preserve color ids.
- Yarn estimates derive from cloth dimensions, density, take-up, loom waste, and lot availability under declared integer-millimeter/gram rounding.
- Insufficient sequences block approval.

Feature: Repeat and symmetry editor
- Users mark repeat ranges, then tile, mirror, rotate, or offset them.
- Repeat overlays compare expected vs actual cells, find first break.
- Nested repeats depth up to 2; overlapping incompatible repeats block.

Feature: Float and structural analysis
- Finds contiguous warp-up/weft-up runs (max 3-7 configurable).
- Lists float cells, lengths, coordinates. Checks for empty treadle, unused shaft, duplicate pick pattern, edge-balance.

Feature: Variant branches and merge
- Fork named drafts, compare cells, colors, yarn, then merge per range.
- Approved versions freeze checksums.

Feature: Weaving simulation and recovery
- Simulation advances pick by pick. Wrong treadle/color/broken yarn can be simulated.
- Pause, unweave, correct and resume, branch at error.

Feature: Responsive studio and artifacts
- Export produces canonical JSON, declared WIF-compatible INI subset, SVG draft/drawdown, and CSV yarn/pick ledger.
- Import reconstructs state.
</core_features>

<visual_design>
- Grid hierarchy must stay legible without color alone (selected/range/copied/repeat/broken/float/lot-short/variant/active-pick/error/approved states).
- Desktop shows input grids, drawdown, inspector/analysis, simulation rail.
- Mobile shows zoomable grid mini-maps, cell/range sequence sheets, drawdown viewport, finding cards, pick stepper (44-pixel targets, no overflow).
</visual_design>

<motion>
- Edit/cascade drawdown, expand repeat, highlight float, merge, weave/unweave must be animated and explain cause.
- Reduced motion retains changed-cell outlines and row labels.
</motion>

<requirements>
- Tailwind CSS 4.3.2 is required. Use npm-local installations only, no CDNs.
- AC-01: Paint/transform grids/colors, define repeats, inspect/repair floats, branch/merge, simulate/recover, approve, and export → all cells/files agree.
- AC-02: Inspect selected/range/copied/repeat/broken/float/lot-short/variant/active-pick/error/approved states → grid hierarchy stays legible without color alone.
- AC-03: Edit/cascade drawdown, expand repeat, highlight float, merge, weave/unweave, then repeat reduced → causal endpoints/cells agree.
- AC-04: Interleave UI/WebMCP grid, color, repeat, validator, branch, simulation, approval, history, and transfer actions → indices, vectors, checksums, files match.
- AC-05: Draft → color → repeat → validate/repair → branch/compare/merge → simulate/recover → approve → export → reset/import.
- AC-06: Test first/last cell, empty/multi threading pick, range bound/overwrite, nested/overlap repeat, exact 3/7 float, lot remainder, wrong treadle/color/broken yarn, stale approval, malformed WIF, forged JSON → named recovery.
- AC-07: Complete at 1440/768/375 → grid/range/repeat/finding/branch/simulation mobile flows retain every action, 44-pixel targets, no overflow.
- AC-08: Navigate/paint ranges, transform, define repeats, inspect linked cells, merge, simulate/unweave, approve, and export without pointer → focus/state match.
- AC-09: Operate 64×96 drawdown with histories/branches and rapid range paint → updates stay responsive and stale analysis cancels.
- AC-10: Trigger every grid/repeat/float/yarn/simulation/import conflict → copy names exact grid/index/range/run/lot/pick/section and recovery.
- AC-11: Toggle one tie-up or threading cell → derived cloth, structural findings, repeats, yarn/simulation expectations, branch diff, approval, and formats remain coherent.
- AC-12: Verify matrix derivation, range transforms, repeats, float scans, yarn math, events, WIF/SVG/CSV → weaving semantics are exact.
- AC-13: Behavioral: Interleave grid ranges, branch merge, simulation error/revision, undo, approval, export/import → draft, lineage, derived cells, and files round-trip exactly.
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
- entity-collection-v1
- structured-editor-v1
- command-session-v1
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Entity: draft-variant
- Entity operations: create; select; update; toggle
- Entity fields: name; threading; tie-up; treadling; warp-colors; weft-colors; repeat; approval
- Editor object types: threading-cell; tie-up-cell; treadling-cell; color-cell; repeat-range; variant-range
- Editor operations: select; update_property; set_content; switch_mode; preview
- Editor properties: shaft; treadle; lifted; color-id; operation; offset; max-float; sequence
- Editor modes: paint; erase; threading; tie-up; treadling; colors; repeat; analysis; variants; simulation; artifacts
- Session operations: start; restart; advance; trigger_demo
- Demos: wrong-treadle; wrong-color; broken-yarn; branch-at-error
- Artifact operations: export; import; copy
- Export formats: canonical-json; wif-ini; draft-svg; drawdown-svg; yarn-pick-ledger-csv
- Import modes: canonical-json; wif-ini
- Value bounds: ends integer 1-64 and picks integer 1-96; shaft and treadle indices integer 1-4; repeat nesting depth at most 2; float threshold integer 3-7; yarn calculations use declared integer millimeter and gram rounding
- Workflow completion: editing threading, tie-up, treadling, or color cells immediately recomputes the derived drawdown and highlights bound inputs without permitting direct drawdown edits
- Workflow completion: repeat transforms preserve bounded source ranges and show the first expected-versus-actual break; incompatible overlaps block
- Workflow completion: float and structural analysis lists run type, length, and coordinates plus empty treadles, unused shafts, duplicate picks, and edge balance
- Workflow completion: forking and merging named variants updates cell/color/yarn comparisons while approved checksums remain frozen
- Workflow completion: simulation advance, pause, error, unweave, correction, resume, and branch-at-error update the visible pick and recovery history
- Workflow completion: canonical JSON or WIF import reconstructs the visible draft; export formats reflect current grid, color, yarn, repeat, variant, and simulation state

Mechanics exclusions:
- Grid painting, erasing, range drag selection, direct keyboard navigation, mobile sequence sheets, palette reorder, and simulation control gestures are driven with Playwright; equivalent bounded state uses editor and session tools
- Drawdown highlight causality, repeat overlays, responsive layout, focus indicators, hover states, and transitions remain Playwright-observed
- File downloads, native file selection, and clipboard contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
