# Household Load-Shift Planner

<summary>
The user imports a deterministic meter fixture, reconciles interval gaps/duplicates, maps appliance cycles, drags flexible loads across a time-of-use grid, honors dependencies and household availability, compares cost/peak/carbon fixture metrics, simulates partial execution, repairs deviations, approves a plan, and exports exact usage/cost schedules and ledgers.

This is not a finance report or utility dashboard. The signature interaction is dragging/resizing appliance-cycle blocks over tariff bands while aggregate load, meter residual, circuit/peak limits, task dependencies, household constraints, plan branches, execution deviations, and artifacts update together.
</summary>

<core_features>
Deterministic fixture: The fictional 48-hour household has 192 fifteen-minute intervals, signed integer watt-minute meter deltas, one gap, one duplicate, one corrected reading, seven appliances with fixed/flexible cycles, two circuits, household quiet/away windows, a three-band tariff plus daily peak charge, and fixed grid-intensity values. A feasible lower-cost schedule exists. No real energy advice is provided.

Meter interval reconciliation: Raw cumulative readings normalize into interval deltas. Users resolve duplicate timestamp, missing interval, reset, and corrected reading by selecting deterministic candidates or entering bounded fixture values. A waterfall shows raw-to-normalized changes; accepted resolutions append provenance and preserve original rows.

Appliance-cycle model: Appliances contain ordered phases with duration slots, watt profile, interruptibility, earliest/latest start, quiet/away eligibility, circuit, and dependency. A cycle may move as a unit or, if declared interruptible, split only at phase boundaries with maximum gap. Editing a fixture appliance creates a plan-local version.

Load scheduling grid: Cycle blocks drag horizontally on 15-minute slots and vertically among appliance lanes. Keyboard move and mobile start/date sheets equal pointer gestures. Invalid placement for window, dependency, quiet/away, circuit, phase gap, or fixed cycle remains preview-only with exact blockers.

Aggregate, residual, and peak views: Stacked load sums appliance watt-minutes per interval; background/unmapped residual equals normalized meter minus mapped actual fixtures and may be negative only under declared export interval. Planned schedule is separate from historic actual mapping. Circuit and household peak thresholds highlight exact contributing phases.

Tariff and impact calculator: Energy cost uses interval watt-minutes times tariff microcents/kWh conversion plus fixed daily peak charge under declared rounding. Carbon is a fixture intensity multiplication and labeled informational. Selecting any bar/charge highlights intervals/cycles. Cost waterfall separates baseline, shifted energy delta, peak delta, and corrections.

Plan branches and suggestions: Users fork schedules, compare starts/phases, constraint slack, aggregate/peak, cost/carbon, and household conflicts, then merge cycle-level or phase-level differences. Deterministic suggestions move one flexible cycle or resolve a peak; acceptance creates a revision and never changes actual meter history.

Execution and deviation recovery: Logical clock execution marks cycles queued, active, paused-if-allowed, complete, missed, or deviated. Fixture events include one late start, one midcycle interruption, and one actual phase consuming 10% more. Users accept actual, reschedule remaining, branch recovery, or mark missed; actual events are append-only and feed meter residual/cost reconciliation.

Artifact contract: HouseholdLoadPlan uses schemaVersion "household-load-plan/v1" and stores fixture/hash/timezone/slot minutes/logical clock, raw meter readings/resolution events/normalized intervals, appliance versions/phases/constraints/dependencies, schedule branch DAG/placements/splits/merge choices, aggregate/circuit/residual/tariff/impact values, suggestions/reviews/approval, execution attempts/events/actual deltas/deviations, annotations/view state/history, derived normalization/load/constraint/cost/peak/artifact checksums, CSV, SVG, ICS, and UTC exportedAt.
Timestamps align to 15-minute slots with explicit zone/offset; normalized watt-minute deltas reconcile cumulative readings/resolutions exactly.
Phase durations/watt profiles are integer slots/watts; split cycles obey phase boundaries/max gap; dependency graph is acyclic.
Aggregate/circuit/peak/residual values conserve integer watt-minutes per interval; planned and actual series are never conflated.
Costs use integer microcents internally with declared kWh conversion and final cent rounding; peak charge uses exact daily maximum rule.
Plan branch graph is acyclic; execution events append-only and follow cycle state/interruptibility rules.
CSV rows, SVG intervals/bands/values, and ICS UIDs/times/status agree with approved plan and actual reconciliation.
Import rejects fixture/timezone/slot mismatch, unresolved/forged meter normalization, invalid phase/split/dependency/schedule, unit/cost conservation error, impossible execution event, forged derived/approval/checksum, unsafe SVG, or artifact disagreement atomically.
Canonical re-export changes only exportedAt; CSV, SVG, and ICS remain byte-identical.
</core_features>

<visual_design>
Hierarchy and Legibility: Inspect raw/duplicate/gap/corrected, fixed/flexible/split/conflicted, circuit/peak, planned/actual/deviated/missed, tariff/approved states. The hierarchy stays legible.
</visual_design>

<motion>
Causal parity: Normalize, move/split, propagate aggregate/peak/cost, execute/deviate/reschedule, then repeat reduced. Causal endpoints and units agree. Cycle travel/split, aggregate/peak/cost propagation, execution deviation, and recovery shift explain consequence; reduced motion retains before/after intervals/values.
</motion>

<requirements>
Interleave actions: Interleave UI/WebMCP meter, appliance, schedule, branch, clock/execution, review/approval, history, and transfer actions. Ids, watt-minutes, microcents, checksums, files match.

User Flows: Import/reconcile to model/schedule to constraint/cost to branch/merge to execute/deviate/recover to approve to export to reset/import.

Edge Cases: Test DST/slot boundary, duplicate/gap/reset, negative export interval, earliest/latest exact slot, phase split/max gap, dependency/circuit/peak threshold, tariff/peak cents rounding, noninterruptible pause, 10% deviation, stale approval, forged import. Named recovery.

Responsiveness: Complete at 1440/768/375. Interval/cycle/phase/dependency/execution/cost mobile flows retain every action, 44-pixel targets, no overflow. Mobile becomes interval/cycle cards, start/phase sheets, vertical dependency/execution lineage, peak/cost drilldowns, and reconciliation stepper.

Accessibility: Resolve intervals, move/split cycles via controls, navigate charts/conflicts, merge, execute/recover, approve, and export without pointer. Focus/state match. Keyboard traversal and named shortcuts. Modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity.

Performance: Operate one year of 15-minute intervals, 500 appliances, 5,000 cycles, and 100 branches. Interaction remains responsive and stale aggregate/cost work cancels. Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

Writing: Trigger every meter/phase/window/dependency/circuit/tariff/execution conflict. Copy names exact interval/appliance/phase/rule/value/unit and recovery. Identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.

Design Fidelity: Verify timestamp normalization, phase/grid rules, watt-minute conservation, microcent/peak math, event state, CSV/SVG/ICS. Load-plan semantics are exact.

Behavioral: Interleave meter corrections, schedule branch/split, execution interruption/deviation, recovery, undo plan-only, approval, export/import. Intervals, events, units, and files round-trip exactly.

Strict Hardness Constraints: Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Keyboard/exact-value path must converge to one canonical event. Adversarial orderings (undo followed by branch, cancel preview, import after local edit). Import as atomic transaction. Exact artifacts on export. Persistent state survives reload. Transient state does not leak.

Depth-first completion protocol (mandatory): For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.
Completion gates (hard): No TODO markers in user-facing behavior. Every feature branch has an explicit observable evidence path. Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated. Zero partial mutation on validation/import failure. Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.

All libraries and tools, including Tailwind CSS 4.3.2, must be installed locally via npm. You may not use CDNs or external network dependencies for styles or fonts.
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
- artifact-transfer-v1

Module specs:
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
- TODO: product bindings pending module-owner review

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
