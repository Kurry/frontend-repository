<summary>
Target user: A fictional homeowner maintaining equipment, service history, and inspection evidence for one small house.
Genre: hard browser app/spatial maintenance ledger
Archetype: data tracking with planning/workflow mechanics
Stack: React, TypeScript, Tailwind CSS 4.3.2, Vite. All libraries installed via npm and bundled locally; no CDN imports.

The user maps assets onto a floor/system diagram, records symptoms and readings, branches diagnostic hypotheses, schedules recurring maintenance, allocates parts, executes and recovers service steps, verifies inspections, compares before/after evidence, and exports a transferable maintenance dossier. Planned work, observed condition, diagnosis, performed action, and verified outcome must remain distinct.

This is not an appliance list. The signature interaction is selecting or moving an asset node in a linked floor/system graph while symptom timelines, dependency paths, maintenance schedule, parts reservations, work-order state, health matrix, and dossier update together.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Depth-first execution is mandatory for this group: complete its named outcome, every interaction and visible state, every connected view and derived/artifact effect, then exhaust enhancements, boundary and invalid/empty/conflict cases, recovery/undo/retry, alternate input, responsive behavior, accessibility, motion, and polish before beginning the next group. A feature is incomplete while any connected state, edge case, recovery path, or TODO/shallow placeholder remains.

Floor and system topology
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Assets drag among valid room anchor points and connect with supplies, drains-to, powers, controls, vents-to, or located-in edges. The floor plan and abstract system graph share selection. Edge types enforce source/target classes and acyclicity where declared. Keyboard node move/link and mobile source-target/room sheets equal pointer gestures.

Condition and symptom timeline
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Readings store measure, value, unit, observed time, provenance, and note; symptoms store type, severity, interval, affected asset/zone, and evidence. Values display against fixture-specific normal bands without giving advice. Brushing time highlights graph nodes, work orders, and health cells. Missing, not-measured, and zero remain distinct.

Diagnostic hypothesis branches
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Users connect symptoms/readings to possible causes and tests in a branch graph. Tests have deterministic fixture outcomes and costs/durations. Accepting a test result prunes incompatible branches only after explicit review; rejected hypotheses remain historical. A hypothesis cannot be marked confirmed without required evidence, and changing upstream evidence marks diagnosis/work stale.

Recurring maintenance planner
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Each asset supports interval- or date-based service series with this, this-and-future, all exceptions, seasonal windows, dependencies, and parts requirements. Generated occurrences appear on a calendar and asset timeline. Completing or rescheduling one occurrence preserves recurrence identity and never rewrites prior service history.

Parts and tool reservation
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Work orders reserve quantities from the fixture inventory with lot, compatibility, and expiry. Reservations are tentative until work begins, release on cancel, and consume only on an explicit step. Substitution requires compatibility evidence and creates a work-order revision. Available, reserved, consumed, returned, and expired quantities reconcile exactly.

Resumable work-order execution
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
The workflow is inspect to isolate fixture state to diagnose/test to approve plan to reserve to perform steps to verify to close. Steps show queued, active, paused, awaiting evidence, failed, skipped-allowed, complete, or rolled back. Deterministic failures include a failed test and incompatible part. Retry, revise branch, rollback reversible step, or abandon preserve attempts and inventory/service history.

Verification and certification
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Before/after readings, symptom resolution, step evidence, parts, and inspection checklist feed a review. Closing requires declared criteria; exceptions need type/note and cannot waive fixture hard checks. Certification freezes asset/topology/diagnosis/work/evidence checksums and becomes stale after relevant edits.

Responsive atlas and artifacts
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Desktop shows floor/system graph, condition timeline, planner, and diagnostic/work rail. Mobile becomes room/asset cards, vertical system lineage, reading/symptom sheets, agenda occurrences, parts cards, and work-order stepper. Export produces canonical JSON, CSV asset/service/reading ledger, SVG floor/system maps, and Markdown handoff report; import reconstructs state exactly.

Depth-first completion protocol
For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates
No TODO markers in user-facing behavior.
Every feature branch has an explicit observable evidence path.
Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
Zero partial mutation on validation/import failure.
Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
</core_features>

<visual_design>
Inspect normal/abnormal/missing, suspected/rejected/confirmed/stale, due/exception, available/reserved/consumed, work/cert states, hierarchy stays legible.
</visual_design>

<motion>
Move/link, propagate evidence, split schedule, reserve/consume, fail/retry, stale/certify, then repeat reduced, endpoints and values agree.
Node-move, hypothesis-branch, and work-order-state transitions need named durations with early/settled frame sampling and computed hover deltas on nodes and cards; reduced motion is verifiable via a visible chrome toggle or URL parameter fresh load.
</motion>

<requirements>
Dashboard-derived hardness contract. The whole job is incomplete unless the implementation proves every clause below through the proposal's own named entities, canonical mutation, linked views, and portable artifact:

Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts, modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
Author one adversarial browser-observable rubric criterion for every promise and every Feature group. The criterion must fail a plausible violating build, use correct negative polarity, and verify artifact content shape not merely button visibility, source code, or a WebMCP shortcut that bypasses the graded gesture.

Deterministic fixture
The fictional Juniper House has two floors, 16 rooms/zones, 22 assets, 28 plumbing/electrical/HVAC dependency edges, fixed service intervals, 12 parts, nine historic readings, three active symptoms, two ambiguous diagnostic paths, one overdue inspection, and deterministic service failures. No real-home or safety advice is provided.

Artifact contract
HomeMaintenanceDossier uses schemaVersion: home-maintenance-dossier/v1 and stores fixture/hash/timezone, floors/rooms/anchors, assets/topology edges, readings/symptoms/evidence, diagnostic branch DAG/tests/results/reviews, maintenance series/occurrences/exceptions, parts/lots/reservations/movements, work orders/revisions/steps/attempts, verification/certifications, filters/annotations/history, derived health/dependency/schedule/inventory/artifact checksums, CSV, SVG maps, Markdown, and UTC exportedAt.

Asset anchors stay in valid zones; typed edges reference compatible assets and obey declared cycle rules.
Reading units/bounds and symptom intervals are exact; provenance/time are append-only after use in a closed order.
Diagnostic graph is acyclic and confirmed state has all required evidence; stale propagation is deterministic.
Series expansion/scope edits preserve occurrence identity under exact local-date rules.
Inventory movements conserve integer quantities per lot; reservations cannot exceed available/compatible/unexpired stock.
Work attempts follow the state machine; rollback only reverses declared steps and cannot resurrect consumed nonreturnable parts.
CSV rows, SVG nodes/edges/anchors, and Markdown chronology/checksums agree with canonical certified state.
Import rejects fixture/timezone mismatch, invalid topology/anchor, unit/bound error, diagnostic cycle/forgery, recurrence overlap, inventory imbalance, impossible attempt/certification, unsafe SVG, or artifact disagreement atomically.
Canonical re-export changes only exportedAt; CSV, SVG, and Markdown remain byte-identical.

Hardening update
Asset selection/move propagates to all seven surfaces in one transition. Selecting or moving an asset node must update symptom timelines, dependency paths, maintenance schedule, parts reservations, work-order state, health matrix, and dossier together, with the previous placement/selection gone from every surface; the health matrix recomputes derived health from current symptom and work-order state immediately.
Diagnostic hypotheses branch; resolved history never rewrites. Branching a diagnostic hypothesis copies the asset's current symptom/evidence state; observations recorded against a branch never rewrite the trunk or sibling branches; rejecting a hypothesis keeps its record inspectable; resolving a diagnosis appends the resolution with the exact hypothesis version cited. Rapid double-branch of the same asset produces exactly one branch.
Resumable work-order execution is exactly-once and append-only. Pausing/resuming a work order produces the identical continuation; completed steps append to history and are immutable to later edits; retry of a failed step reuses inputs and attempt history, increments attempt counts exactly once per retry, and never duplicates a completed step; the partial-execution state is named and visible.
Parts/tool reservation conflicts are graded no-ops. Reserving a part already reserved for an overlapping window is blocked with a visible diagnostic naming the conflicting reservation, all surfaces identical before and after; releasing a reservation propagates to the schedule and dependent work orders immediately.
Certification is gated and effect-graded. An asset with unresolved symptoms, open work orders, or a stale maintenance window cannot be certified; the attempt is blocked with a named reason and zero mutation; certifying a valid asset is judged on post-confirm state, never the dialog's presence.
Dependency-path integrity. Moving an asset that would create a dependency cycle or dangling upstream reference is blocked with a named reason and zero mutation; dependency-path queries show the exact upstream/downstream chain from the current topology.
Motion numerics and a testable reduced-motion path. Node-move, hypothesis-branch, and work-order-state transitions need named durations (150-300ms) with early/settled frame sampling and computed hover deltas on nodes and cards; reduced motion is verifiable via a visible chrome toggle or URL fresh load.
Cross-model pilot calibration. After the oracle is certified: three independent healthy GPT trials and three Claude Sonnet 5 trials on the identical revision, reporting both expected failure signatures.

20-second demo: Move and connect an asset, log an abnormal reading, branch two diagnoses, run a test, reschedule one recurring service using this-and-future, reserve a part, trigger incompatibility, revise/retry the work order, verify before/after evidence, certify, and export the dossier.
Canonical mutation: Editing one evidence-bound asset/reading changes graph paths, hypotheses, schedule/work eligibility, inventory reservation, health matrix, certification, history, WebMCP state, and artifacts.
Alternate input: Node move/link, time brush via controls, evidence/hypothesis binding, recurrence scope, reservation, work controls, verification, and export have keyboard paths.
Linked views: Floor/system maps, condition timeline, diagnostic graph, calendar/asset history, parts ledger, work stepper, health/review, and artifacts share one reducer.
Causal motion: Node/edge travel, evidence propagation, schedule split, reservation flow, work recovery, and health/cert changes explain consequences; reduced motion retains persistent deltas.
Mobile transformation: Room/asset cards, vertical topology/diagnosis, agenda, parts, work stepper, and evidence sheets preserve the complete job.
CRUD substitution: Forms cannot express spatial/system topology, diagnostic lineage, scoped recurrence, inventory reservation flow, or interrupted work/verification semantics.

Fresh load shows immutable house/assets/topology/history/inventory with no user reading, hypothesis decision, recurrence exception, reservation, work attempt, certification, annotation, or export. WebMCP exposes fixture queries and canonical asset/topology, reading/symptom, diagnosis/test, series/occurrence, inventory, work, verification/certification, history, artifact, transfer, and reset handlers. Browser verification grades real graph drag/link, keyboard paths, timeline linking, focus, motion, responsive transformation, and downloaded CSV/SVG/Markdown parsing.

In scope: One fictional house, 200 assets/500 edges, bounded observations/series/orders, JSON + CSV + SVG + Markdown.
Out of scope: Real home/safety advice, IoT, contractors/commerce, live sensors/network, accounts, collaboration, or backend persistence.
All libraries installed via npm and bundled locally; no CDN imports.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
