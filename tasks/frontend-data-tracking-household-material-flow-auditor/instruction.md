<summary>
The user logs weighed discard items, classifies material and destination under fixture rules, groups items into bags/bins, reconciles scale readings, identifies contamination, schedules pickups, compares material-flow weeks, creates reduction experiments, records actual outcomes, and exports exact mass, route, and calendar artifacts.

This is not a sustainability dashboard. The signature interaction is dragging item cards through a material-to-destination flow graph while bag/bin weights, contamination rules, capacity, pickup readiness, weekly comparisons, experiment baselines, and artifacts update together.
</summary>

<core_features>
The fictional four-week household fixture has 96 discard items, integer gram weights, 18 material types, six destinations, 14 classification rules, 12 bags, four bins with capacities, fixed pickup calendar, two duplicate scans, one scale correction, five contamination conflicts, and three deterministic reduction interventions. Rules are benchmark data, not real disposal guidance.

Item capture and classification
Items store id, observed date, weight grams, material, submaterial, cleanliness, size, source room, note, and evidence placeholder. Users drag items to destination nodes or use keyboard/mobile selectors. Rules may require clean/dry, disassembly, size cutoff, or special destination. Invalid classification remains proposed with exact blocker.

Disassembly and component graph
Composite items split into components whose integer gram weights plus declared residue equal parent grams. Components classify independently and preserve parent lineage. Merge is allowed only to undo an unbagged split with exact weight/content match. Cycles, duplicate component ids, and mass imbalance reject.

Bag and bin hierarchy
Accepted items/components drag into bags, then bags into compatible bins. Tare and gross readings reconcile net contents; direct bin items are allowed where declared. Bag/bin capacity, destination compatibility, contamination, pickup date, and sealed/collected state are exact. Collected contents become immutable history.

Material-flow graph and contamination lens
A Sankey-style graph connects source room to material to processing action to destination to pickup. Edge widths derive integer grams. Selecting an edge highlights exact item/component/container rows. Contamination findings identify contaminant, host bag/bin, rule, grams, and repair: reclassify, clean fixture state, disassemble, or remove.

Scale and event reconciliation
Raw scale events include timestamp, container, gross grams, source, and correction/reversal. Users match readings to bag/bin snapshots, resolve duplicate scans, and explain residual differences within exact tolerance. Corrections append; original events never mutate. Closing a container requires reconciled contents/readings.

Pickup and exception workflow
Bins move open to ready to staged to collected to rejected/accepted to emptied. Logical clock controls due pickups. Fixture events include a missed pickup and contamination rejection. Users unstage, repair contents, reschedule, split destination, or accept a typed exception while preserving events and collected history.

Reduction experiments
Users choose a material/source slice, define baseline weeks, target grams/percentage, intervention fixture, active dates, and comparison method. The plan previews affected items but never deletes them. Actual post-period data computes exact eligible grams/counts and labels insufficient, no-clear-change, possible-reduction, or increase under declared thresholds without causal claims.

Artifact contract
HouseholdMaterialAudit uses schemaVersion: "household-material-audit/v1" and stores fixture/hash/timezone/logical clock, items/material properties/classifications/rule decisions, component graph/residue, bags/bins/tare/capacity/content/seal/collection, scale events/matches/corrections/residuals, flow graph/contamination findings, pickup state/events/exceptions, experiment definitions/baseline/post sets/findings/reviews, filters/annotations/history, derived mass/capacity/flow/weekly/experiment/artifact checksums, CSV, SVG, ICS, and UTC exportedAt.

All mass is integer grams; parent equals components plus residue; item/component appears in at most one live container and one destination. Container net/gross/tare/content/residual and capacities reconcile under declared tolerance; collected contents immutable. Classification/contamination follows exact fixture rule predicates and current item/component state. Scale/pickup/correction events are append-only and follow state machines; duplicate/reversal resolution preserves originals. Flow edge sums equal canonical eligible grams at every layer; filters expose included/excluded mass. Experiment sets/dates/denominators/thresholds are exact and never rewrite observations. CSV rows, SVG edge widths/counts/week bars, and ICS UIDs/dates/status agree with canonical state.

Import rejects fixture/timezone mismatch, mass imbalance, graph/container cycle, duplicate containment, invalid classification/capacity, impossible event, forged experiment/derived/checksum, unsafe SVG, or artifact disagreement atomically. Canonical re-export changes only exportedAt; CSV, SVG, and ICS remain byte-identical.
</core_features>

<visual_design>
Desktop shows item/container ledger, material-flow graph, weekly matrix, and pickup/experiment rail. Mobile becomes item/bag/bin cards, classification/disassembly sheets, vertical flow/pickup lineage, weight reconciliation, and experiment drilldowns. Export produces canonical JSON, CSV item/component/container/event ledger, SVG flow/weekly report, and ICS pickup/experiment schedule; import reconstructs state exactly.

Verify integer mass/components/residue, containment/tare, rules/events, flow sums, experiment sets, CSV/SVG/ICS. Material-audit semantics are exact. Inspect raw/proposed/accepted/invalid, parent/component/residue, open/sealed/staged/collected/rejected, contaminated/repaired, baseline/post states to ensure hierarchy stays legible.
</visual_design>

<motion>
Causal motion: Item/component/container flow, edge-width changes, capacity/contamination propagation, pickup transition, and experiment comparison explain cause; reduced motion retains gram/status deltas. Classify/split, move into containers, resize flow, repair contamination, transition pickup, compare experiment, then repeat reduced, checking that causal endpoints/grams agree.
</motion>

<requirements>

- The app must use Tailwind CSS 4.3.2.\n- All dependencies must be strictly npm-local; no CDNs or external network calls are allowed.
Dashboard-derived hardness contract: The whole job is incomplete unless the implementation proves every clause below through the proposal's own named entities, canonical mutation, linked views, and portable artifact:

Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

20-second demo: Classify a composite item incorrectly, split it into balanced components, place them into different bags, trigger contamination and repair it, match a duplicate scale event, stage a bin, simulate missed pickup/rejection, reschedule after repair, create a reduction experiment, and export.

Canonical mutation: Moving/splitting one item changes mass hierarchy, classification/contamination, bag/bin readings/capacity, flow edges, pickup readiness, weekly/experiment sets, history, WebMCP state, and artifacts.
Alternate input: Classification, split/merge, bag/bin binding, scale matching, flow navigation, pickup/recovery, experiment composition, and export have keyboard paths.
Linked views: Item/component ledger, bag/bin hierarchy, scale reconciliation, material-flow graph, contamination lens, weekly matrix, pickup workflow, experiments, and artifacts share one reducer.
Mobile transformation: Item/bag/bin cards, classification/disassembly sheets, vertical flow/pickup lineage, reconciliation and experiment drilldowns preserve the full job. Complete at 1440/768/375.
CRUD substitution: Forms cannot express mass-conserving disassembly, nested container reconciliation, flow-edge provenance, contamination propagation, or append-only pickup/experiment state.
Accessibility: Classify/split/bind items, navigate flow, match scales, stage/recover pickup, compose/review experiment, and export without pointer; focus/state match.
Performance: Operate 100,000 items/components, 10,000 containers/events, and 1,000 experiments; interactions remain responsive and stale flow/analysis work cancels.
Writing: Trigger every rule/mass/container/scale/pickup/experiment conflict. Copy names exact item/component/bag/bin/rule/gram/event/set and recovery.
Edge cases: Test zero/max grams, component/residue remainder, split/contain cycle, bag/bin capacity exact bound, incompatible destination, contamination after seal, duplicate/corrected scale, missed/rejected pickup, empty experiment denominator, stale review, forged import. Use named recovery.
Behavioral: Interleave split/merge, container moves, scale correction, pickup failure/repair, experiment review, undo uncollected-only, export/import; mass, events, lineage, and files round-trip exactly.
Technical: Interleave UI/WebMCP item/classification, component, container, scale, pickup, experiment, history, and transfer actions; ids, grams, events, checksums, files match.
User flows: Capture to classify/disassemble to bag/bin to reconcile to stage/collect/recover to compare/experiment to export to reset/import.
</requirements>

<integrity>
- `WEBMCP_CDP_PORT` will be exported in the test environment (e.g., `9222`). Your oracle must invoke `window.webmcp_session_info()` and `window.webmcp_list_tools()` exactly once on initial paint, and handle `window.webmcp_invoke_tool(name, args)` calls.
- `verifier-tool` (the verifier) replaces `claude-code` after your execution and evaluates the app using real headless Chromium (via `@playwright/mcp`).
- A passing dimension yields a score of 1.0. A failing dimension yields 0.0. An unattempted / incomplete dimension yields 0.0. To succeed, you must achieve 1.0 in all core and structural dimensions.
- The oracle must serve on `0.0.0.0:3000` (`npm start`). Avoid brand names like "Provenance" or "Creator" in the UI.
- All evidence of your work MUST remain within this task's directory. No code, scripts, or media may be placed in the repository root or outside `solution/app`.
- Leave the oracle fully built (`npm run verify:build` clean and `dist/` intact if Vite) and `npm install` complete. Do NOT delete `node_modules` inside `solution/app` (the verifier removes it cleanly later, but needs it for `test.sh`).
</integrity>

<delivery>
1. (If scaffolded) Delete any placeholder files in `solution/app` and build your framework-agnostic implementation (Vite, React, or standard vanilla).
2. Complete all `<requirements>` through linked views and mass-conserving mutations.

- The app must use Tailwind CSS 4.3.2.\n- All dependencies must be strictly npm-local; no CDNs or external network calls are allowed.
3. Validate locally: run your own `verify:build` and check the build output.
4. Final execution: run `npm start`, confirm `0.0.0.0:3000` serves your app, and take any screenshots mandated.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
