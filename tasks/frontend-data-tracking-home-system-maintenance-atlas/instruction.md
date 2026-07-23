<summary>
Build the frontend for the Home System Maintenance Atlas: a hard browser app for spatial maintenance ledger, targeting a fictional homeowner maintaining equipment, service history, and inspection evidence for one small house. The user maps assets onto a floor/system diagram, records symptoms and readings, branches diagnostic hypotheses, schedules recurring maintenance, allocates parts, executes and recovers service steps, verifies inspections, compares before/after evidence, and exports a transferable maintenance dossier. Planned work, observed condition, diagnosis, performed action, and verified outcome must remain distinct.
</summary>

<core_features>
Floor and system topology: Assets drag among valid room anchor points and connect with supplies, drains-to, powers, controls, vents-to, or located-in edges. The floor plan and abstract system graph share selection. Edge types enforce source/target classes and acyclicity where declared. Keyboard node move/link and mobile source-target/room sheets equal pointer gestures.
Condition and symptom timeline: Readings store measure, value, unit, observed time, provenance, and note; symptoms store type, severity, interval, affected asset/zone, and evidence. Values display against fixture-specific normal bands without giving advice. Brushing time highlights graph nodes, work orders, and health cells. Missing, not-measured, and zero remain distinct.
Diagnostic hypothesis branches: Users connect symptoms/readings to possible causes and tests in a branch graph. Tests have deterministic fixture outcomes and costs/durations. Accepting a test result prunes incompatible branches only after explicit review; rejected hypotheses remain historical. A hypothesis cannot be marked confirmed without required evidence, and changing upstream evidence marks diagnosis/work stale.
Recurring maintenance planner: Each asset supports interval- or date-based service series with this|this-and-future|all exceptions, seasonal windows, dependencies, and parts requirements. Generated occurrences appear on a calendar and asset timeline. Completing or rescheduling one occurrence preserves recurrence identity and never rewrites prior service history.
Parts and tool reservation: Work orders reserve quantities from the fixture inventory with lot, compatibility, and expiry. Reservations are tentative until work begins, release on cancel, and consume only on an explicit step. Substitution requires compatibility evidence and creates a work-order revision. Available, reserved, consumed, returned, and expired quantities reconcile exactly.
Resumable work-order execution: The workflow is inspect → isolate fixture state → diagnose/test → approve plan → reserve → perform steps → verify → close. Steps show queued, active, paused, awaiting evidence, failed, skipped-allowed, complete, or rolled back. Deterministic failures include a failed test and incompatible part. Retry, revise branch, rollback reversible step, or abandon preserve attempts and inventory/service history.
Verification and certification: Before/after readings, symptom resolution, step evidence, parts, and inspection checklist feed a review. Closing requires declared criteria; exceptions need type/note and cannot waive fixture hard checks. Certification freezes asset/topology/diagnosis/work/evidence checksums and becomes stale after relevant edits.
Responsive atlas and artifacts: Desktop shows floor/system graph, condition timeline, planner, and diagnostic/work rail. Mobile becomes room/asset cards, vertical system lineage, reading/symptom sheets, agenda occurrences, parts cards, and work-order stepper. Export produces canonical JSON, CSV asset/service/reading ledger, SVG floor/system maps, and Markdown handoff report; import reconstructs state exactly.
</core_features>

<visual_design>
Inspect normal/abnormal/missing, suspected/rejected/confirmed/stale, due/exception, available/reserved/consumed, work/cert states → hierarchy stays legible.
</visual_design>

<motion>
Move/link, propagate evidence, split schedule, reserve/consume, fail/retry, stale/certify, then repeat reduced → endpoints and values agree.
</motion>

<requirements>
Hardness contract: Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
Hardness contract: For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Hardness contract: Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Hardness contract: Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Hardness contract: Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Hardness contract: Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
Hardness contract: Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Hardness contract: Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
Hardness contract: At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
Artifact contract: HomeMaintenanceDossier uses schemaVersion: "home-maintenance-dossier/v1" and stores fixture/hash/timezone, floors/rooms/anchors, assets/topology edges, readings/symptoms/evidence, diagnostic branch DAG/tests/results/reviews, maintenance series/occurrences/exceptions, parts/lots/reservations/movements, work orders/revisions/steps/attempts, verification/certifications, filters/annotations/history, derived health/dependency/schedule/inventory/artifact checksums, CSV, SVG maps, Markdown, and UTC exportedAt.
Artifact contract: Asset anchors stay in valid zones; typed edges reference compatible assets and obey declared cycle rules.
Artifact contract: Reading units/bounds and symptom intervals are exact; provenance/time are append-only after use in a closed order.
Artifact contract: Diagnostic graph is acyclic and confirmed state has all required evidence; stale propagation is deterministic.
Artifact contract: Series expansion/scope edits preserve occurrence identity under exact local-date rules.
Artifact contract: Inventory movements conserve integer quantities per lot; reservations cannot exceed available/compatible/unexpired stock.
Artifact contract: Work attempts follow the state machine; rollback only reverses declared steps and cannot resurrect consumed nonreturnable parts.
Artifact contract: CSV rows, SVG nodes/edges/anchors, and Markdown chronology/checksums agree with canonical certified state.
Artifact contract: Import rejects fixture/timezone mismatch, invalid topology/anchor, unit/bound error, diagnostic cycle/forgery, recurrence overlap, inventory imbalance, impossible attempt/certification, unsafe SVG, or artifact disagreement atomically.
Artifact contract: Canonical re-export changes only exportedAt; CSV, SVG, and Markdown remain byte-identical.
Fixture: The fictional Juniper House has two floors, 16 rooms/zones, 22 assets, 28 plumbing/electrical/HVAC dependency edges, fixed service intervals, 12 parts, nine historic readings, three active symptoms, two ambiguous diagnostic paths, one overdue inspection, and deterministic service failures.
Use Tailwind CSS 4.3.2 for styling.
All libraries must be installed via npm and bundled locally; no CDN imports for scripts, styles, fonts, or icons.
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
- browse-query-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
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
- Destinations: floor-system-graph; condition-timeline; planner; diagnostic-rail; work-rail
- Filters: symptom-status; work-order-state
- Entity: asset; reading; symptom; diagnostic-hypothesis; recurrence-series; part-reservation; work-order
- Entity operations: create; select; update; delete
- Entity fields: asset-name; room-anchor; reading-value; reading-unit; symptom-type; symptom-severity; part-quantity
- Value bounds: bounded field values per fixture limits, enums matching specified classes
- Artifact operations: export; import
- Export formats: json; csv; svg; markdown
- Import modes: home-maintenance-dossier-v1
- Workflow completion: state converges exactly on identical values when using WebMCP or direct UI inputs

Mechanics exclusions:
- Drag-and-drop asset topology edits remain Playwright-observed; WebMCP entity update supports coordinate/anchor setting instead
- Interactive brush filtering on condition timeline stays Playwright-observed
- File-picker import and artifact downloads remain Playwright-observed; WebMCP import triggers validation and state merge without passing file bytes

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
