<summary>
Create the Double-Spend Interleaving Simulator, a hard browser app/systems simulation tool for exploring how concurrent transfer schedules interact with isolation strategies. A learner drags transaction phases across concurrent lanes, scrubs execution step by step, observes account versions and balances, switches isolation strategies, resolves conflicts with waits/retries/rollbacks, and proves whether the final schedule is serializable and preserves conservation. The useful artifact is a deterministic concurrency scenario with exact phase order, strategy, decisions, state snapshots, invariant results, and replay expectations. This is a pure transition oracle; no localStorage is permitted.
</summary>

<core_features>
Three fictional accounts start with balances {A:100, B:40, C:10}. Four transfers each have phases begin, read, validate, debit, credit, commit and fixed amounts. Total balance must remain 150 and no committed account may be negative.
Concurrent phase lanes: Four transaction lanes share a 24-slot logical-time ruler. Phase blocks drag horizontally and snap to integer slots. Per-transaction phase order is immutable, only interleaving changes. Two executable phases may share a slot only when they touch disjoint accounts. Invalid reorder, overlap, or phase omission springs back without history mutation and names the dependency. Keyboard/mobile slot controls are equivalent.
Isolation strategy switchboard: Changing strategy (none, optimistic-version, pessimistic-lock, serializable) regenerates required version checks, lock acquire/release markers, waits, and retry eligibility without rewriting the authored base phase order. Strategy comparison preserves separate decision layers per strategy.
Step replay and account snapshots: A scrubber executes the schedule in deterministic slot/lane order. At each step, account cards display committed balance/version, transaction-local read/write set, and pending delta. The same selection highlights phase lane, ledger row, invariant ribbon, conflict edge, and graph node.
Conflict and wait-for graph: Read-write, write-read, and write-write conflicts draw between phases and create edges in a transaction serialization graph. Pessimistic waits produce a separate wait-for graph with lock ownership. A cycle detector names the exact edge cycle. Selecting an edge focuses both phases and before/after snapshots.
Resolution composer: When a strategy detects a conflict, the learner chooses one allowed decision: wait, abort/retry, reorder a future phase, or cancel the transaction. Retry creates a linked attempt. Rollback reverses only uncommitted local writes.
Invariant and serializability lens: A conservation bar, nonnegative-balance badges, version consistency, exactly-once credit/debit, and committed-transfer ledger update on every step. The serialization graph is valid only when acyclic; its deterministic topological order is shown.
Scenario comparison: Two named scenarios compare phase slots, strategy, conflicts, decisions, retries, final balances, invariant failures, and serialization order.
Artifact Export/Import: Export/import preserves schedule, decisions, compare/view state, annotations, history, and derived replay checksum.
</core_features>

<visual_design>
Desktop shows lanes, snapshots, graphs, and ledger. Mobile transforms into a logical-time stepper, transaction accordions, lock/conflict sheets, account snapshot carousel, and graph lineage.
Action labels and state indicators use clear verbs and terminology.
</visual_design>

<motion>
Phase moves, lock acquisition/waits, rollback, and balance/version transitions explain causality via motion.
Reduced motion setting substitutes instant endpoints with persistent changed-state deltas.
</motion>

<requirements>
Shared application state must use Solid stores (in-memory only); no localStorage or sessionStorage. A page reload returns the app to its seeded state (unscheduled neutral palette).
The fixture includes one deadlock under naive pessimistic ordering and one valid retry schedule.
Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2 (pinned). No component UI libraries; build custom accessible UI elements.
Motion: motion (vanilla motion.dev) is the only allowed animation library.
Icons: @tabler/icons-solidjs only.
Validation: zod for artifact validation schemas.
Import rejects fixture mismatch, missing/duplicate/out-of-order phase, illegal overlap, impossible decision/wait/lock/retry, forged event/snapshot/graph/invariant data, or duplicate history order, then replays atomically. Canonical export -> reset -> import -> export changes only exportedAt.
All libraries must be installed locally via npm (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Editor object types: phase
- Editor properties: slot
- Editor operations: select; update_property
- Entity: scenario
- Entity operations: create; select; update
- Entity fields: strategy_mode; phase_reorder; wait_choice; abort_retry
- Artifact operations: export; import
- Export formats: scenario-json
- Import modes: scenario-json

Mechanics exclusions:
- Drag-and-drop of phases in timeline remains Playwright (gesture mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
