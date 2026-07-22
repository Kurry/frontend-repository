<summary>
Build a Household Receipt Reconciliation Floor using Solid.js, Solid stores, and Tailwind CSS 4.3.2 (or React, depending on your setup). The user maps receipt line items to people and categories, authors reusable split rules, matches bank transactions and reimbursements, resolves duplicates and rounding, reviews budget effects, computes a minimum-transfer settlement, records simulated partial payments, and exports an auditable household ledger. Raw records, proposed matches, accepted allocations, and settled obligations must remain distinct.
</summary>

<core_features>
Feature: Receipt line allocation canvas —
- Receipt lines show quantity, subtotal, tax eligibility, purchaser, and evidence region.
- Users drag ribbons to one or more people and a category, then set equal, percentage, share-unit, exact-cent, or purchaser-only allocation.
- Every line including proportional tax/tip must allocate exactly; keyboard source-target selection and mobile allocation sheets equal drag behavior.

Feature: Split-rule composer —
- Rules match merchant, line tag, household presence, category, and date window, then propose (not auto-accept) allocations.
- Rules have priority, exceptions, preview counts, and version lineage. Overlapping rules show conflicts.
- Editing a used rule creates a future-effective branch while prior accepted allocations retain their rule/version provenance.

Feature: Transaction and reimbursement matching —
- Users connect receipts to bank charges and reimbursements with exact, split, aggregate, reversal, or unmatched relationships.
- Suggested matches expose score factors. Duplicate records, reversed charges, date boundaries, and one-to-multiple matches require explicit resolution.

Feature: Budget consequence matrix —
- Rows are people and columns are categories; cells show allocated, reimbursable, paid, owed, and budget remaining.
- Selecting a cell highlights exact ribbons/receipts/transactions. Before/after compare shows consequences of a proposed rule or match without committing. Budget warnings do not change allocation state.

Feature: Obligation graph and settlement optimizer —
- Accepted allocations and matched payments derive directed obligations. The graph nets reciprocal debts and computes a deterministic minimum-transfer plan with stable tie-breaking.
- Users may pin a required transfer or exclude a payment method, causing recomputation. The plan is a proposal until approved.

Feature: Partial payment workflow —
- Simulated settlement attempts can succeed, fail, reverse, or partially pay.
- The first batch deterministically records two successes, one partial, and one failure. Retry failed/remaining-only, replace a transfer, reverse a mistaken success, or cancel outstanding preserves append-only attempts and cannot overpay an obligation.

Feature: Reconciliation review —
- A completion checklist requires all receipts fully allocated, nonduplicate bank records resolved, matched totals conserved, reimbursements classified, budgets current, and settlement attempts reconciled.
- Exceptions need type, reason, owner, and note. Approval becomes stale when an accepted upstream allocation/match changes.

Feature: Responsive ledger and artifacts —
- Desktop shows receipt/allocation canvas, ledger, graph, and matrix/review rail. Mobile becomes receipt line cards, allocation sheets, match pair cards, vertical money-flow lineage, matrix drilldowns, and settlement stepper.
- Export produces canonical JSON, CSV line allocation ledger, CSV transaction/settlement ledger, and SVG money-flow statement; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect raw/proposed/accepted/conflicted/unbalanced/duplicate/reversed/owed/paid/partial/stale states → provenance and money flow stay distinguishable.
- Desktop layout is a multi-panel view (canvas, ledger, graph, matrix).
- Mobile layout transforms to stack-based stepper views.
</visual_design>

<motion>
- Causal motion: Ribbon flow, cent redistribution, match/obligation propagation, plan reroute, and partial payment animate consequences.
- Reduced motion uses persistent before/after deltas.
</motion>

<requirements>
All dependencies must be installed locally via npm. Do not load CSS, fonts, or JS via CDNs.
No localStorage, IndexedDB, or backend persistence. The app must reconstruct entirely from the imported JSON.

<artifact_shapes>
HouseholdReconciliation uses schemaVersion: "household-reconciliation/v1".
Contains: fixture/hash/currency, receipts/lines/evidence, allocation ribbons/tax-tip distributions, rule version DAG/proposals/acceptances, bank/reimbursement records and match graph, budgets, obligation graph/plan/pins, approvals/exceptions, settlement attempts/results, filters/annotations/history, derived conservation/budget/obligation/artifact checksums, and UTC exportedAt.
</artifact_shapes>
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
- command-session-v1

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

Bindings:
- Editor object types: allocation-ribbon; split-rule; receipt-match
- Editor properties: allocation-type; allocation-targets; amount; priority; matching-relationship
- Editor modes: allocation; matching; review
- Editor operations: select; add; update_property; delete; preview
- Entity: record
- Entity operations: select; update; toggle
- Entity fields: resolved; note; matched
- Artifact operations: export; import
- Export formats: session-json; csv-ledger; svg-graph
- Import modes: session-json
- Session operations: execute; undo; redo; reset; query_state
- Session Queries: derived-obligations; settlement-plan; budget-status

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
<artifact_shapes>
HouseholdReconciliation uses schemaVersion: "household-reconciliation/v1".
Contains: fixture/hash/currency, receipts/lines/evidence, allocation ribbons/tax-tip distributions, rule version DAG/proposals/acceptances, bank/reimbursement records and match graph, budgets, obligation graph/plan/pins, approvals/exceptions, settlement attempts/results, filters/annotations/history, derived conservation/budget/obligation/artifact checksums, and UTC exportedAt.
</artifact_shapes>
