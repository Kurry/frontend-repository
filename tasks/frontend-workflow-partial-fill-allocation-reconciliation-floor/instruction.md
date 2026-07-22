# Partial-Fill Allocation Reconciliation Floor

<summary>
An operations learner tool for reconciling fictional execution fragments to intended account allocations. An operator imports deterministic intent and fill fixtures, repairs row-level schema errors, drags partial fills across account allocation lanes, splits/merges lots while conserving quantity, resolves side/price/locate/time conflicts, replays the allocation ledger, and exports a reconciled API-shaped batch JSON plus interoperable CSV exception report.
</summary>

<core_features>
- Two-file import diagnostic: Intent and fill files enter separate dropzones. A mapping grid binds source headers to API fields, previews typed values, and exposes row/column errors. The operator repairs cells inline, maps aliases, or excludes rows with reasons. Block commitment on duplicate ids, noninteger quantity, etc.
- Allocation flow floor: Fills appear in a left rail and account intents in right lanes, connected by a central Sankey. Dragging a fill chip onto an intent opens a quantity splitter.
- Lot split, merge, and conservation: Splitter supports exact quantity entry and ratio presets. Sibling allocations can merge. Conservation ribbon shows imported, excluded, allocatable, allocated, remaining, and excepted totals.
- Rule and locate guard: Enforce rules like max quantity, broker exclusion, and locate inventory. Short-side fills consume locate units in event order. Bound overrides require a reason code.
- Time-ordered execution ledger: Fill/correction events render on a virtualized timeline. Operator can link a correction to its preceding fill. Scrubbing the ledger reconstructs allocation state at that event.
- Weighted-price and variance matrix: Matrix reports intended quantity, allocated quantity, shortfall, weighted average fill price, and deterministic variance. Select cell to highlight edges. Bulk select to assign exception reasons.
- Scenario checkpoint, responsive mode, and export: Compare two named checkpoints. Export/import preserves all authored decisions, layout, history. Export generates JSON (API batch), reconciliation CSV, and exception CSV.
</core_features>

<visual_design>
- Desktop shows rails/Sankey, timeline, matrix, and conflicts.
- Mobile transforms into fill cards, account target carousel, full-screen splitter/rule sheet, conservation meter, and vertical ledger.
- Dense linked state: selecting a cell in the matrix highlights flow edges, fill events, rules, and exceptions.
- Conservation ribbon to show exact equation balances.
- Clear error states for schema errors during import.
</visual_design>

<motion>
- Causal motion: Chips split/travel, flows resize, balances settle, and ledger playback animates fill arrival, allocation, correction, and exception without mutating history.
- Reduced motion uses instant endpoints plus persistent quantity deltas.
</motion>

<requirements>
- Good-app genre means in-memory state only, NO localStorage. A page reload returns the app to its seeded state.
- Must include a deterministic fixture: 12 intended allocations and 18 partial fills across 5 accounts and 4 symbols, containing 1 alias header, 2 malformed numeric cells, 1 unknown account, 1 side mismatch, a duplicate fill id, 2 insufficient-locate cases, and 1 out-of-order correction.
- After valid repair, total intended and executed quantity are both 8,400 units. A certified solution exists with 3 explicit exceptions.
- Artifact contract: Export uses schemaVersion "allocation-reconciliation/v1" with API-shaped body. CSVs have fixed headers/order and RFC 4180 quoting.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- React/Vue/Svelte or vanilla; if React, use a state store like Zustand or Redux.
- Tailwind CSS 4.3.2 (pinned)
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
- Entity: fill-intent-allocation-record
- Entity operations: create; select; update; delete; toggle
- Entity fields: fill-id; intent-id; source-id; account-id; symbol; side; quantity; price; occurred-at; exception-reason; override-reason
- Editor object types: mapping-cell; allocation-flow; lot-split; correction-link; variance-cell; checkpoint
- Editor operations: select; update_property; set_content; switch_mode; preview
- Editor properties: mapped-field; typed-value; excluded; allocation-quantity; ratio; exception-reason; override-reason; ledger-time; checkpoint-name
- Editor modes: import-repair; allocation-floor; execution-ledger; variance-matrix; checkpoint-compare; export
- Artifact operations: export; import; copy
- Export formats: api-batch-json; reconciliation-csv; exception-csv
- Import modes: api-batch-json
- Value bounds: intent and fill ids are unique non-empty strings and quantities are positive integers; allocation quantities are positive integers bounded by both remaining fill quantity and remaining intent quantity; short-side allocations consume non-negative locate inventory in occurred-at event order; rule overrides require a declared reason code and non-empty note; API batch JSON preserves authored decisions, layout, checkpoints, and execution history
- Workflow completion: repairing a typed import cell updates its preview and row/column diagnostics; committing remains blocked while duplicate ids or invalid numeric fields remain
- Workflow completion: allocating or splitting a fill creates Sankey edges and updates imported, excluded, allocatable, allocated, remaining, and excepted conservation totals without loss
- Workflow completion: merging compatible sibling allocations replaces them with one allocation of equal conserved quantity
- Workflow completion: a rejected rule or locate allocation names the violated guard; a valid reason-bound override records the exception and permits the bounded action
- Workflow completion: scrubbing the ordered execution ledger reconstructs allocation and correction state at the selected event
- Workflow completion: selecting or bulk-updating variance cells highlights their allocation edges and records exception reasons
- Workflow completion: checkpoint comparison reports differences between two named authored states
- Workflow completion: export then import reconstructs the visible allocations, exceptions, checkpoints, layout, and history; invalid artifacts leave state unchanged and name offending fields

Mechanics exclusions:
- File dropzones, native file selection, drag-and-drop fill placement, Sankey-edge selection, quantity-slider and ledger-scrubber gestures are driven through Playwright; equivalent state mutations use declared entity/editor tools
- Responsive rail-to-drawer transitions, keyboard navigation, focus indicators, hover highlights, and matrix virtualization remain Playwright-observed
- File downloads and clipboard contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
