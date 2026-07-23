# Habit Protocol Trialbench

<summary>
The user designs a multi-phase habit experiment, schedules protocol doses, logs adherence and outcomes, annotates confounders, branches the protocol without corrupting prior observations, compares lagged effects, reviews deterministic evaluator findings, and exports a reproducible experiment record. The app must preserve the difference between planned, attempted, completed, skipped, excused, and retrospectively entered behavior.

This is not a streak calendar. The signature interaction is brushing a date range across a phase timeline and adherence heatmap while linked dose, outcome, confounder, branch, and evaluator views recompute. Moving a phase boundary changes which protocol version governed each day but never rewrites its original observation provenance.

Deterministic fixture:
The fictional 42-day study tracks evening-walk-minutes as dose and next-morning-focus from 1 to 10 as primary outcome. It includes fixed weekdays, sleep-duration covariate, three confounder types, 14 seeded observations, two missing-outcome days, one late entry, and one daylight-saving boundary. Suggested protocols and evaluator findings are deterministic local fixtures.

Frontend-native gate:
20-second demo: Drag a phase boundary, log a below-target completion, brush a confounded interval, switch lag from one to two days by creating an amendment branch, compare old/new pairings, run and reject an evaluator finding, create a continuation branch, and export JSON CSV SVG.

Canonical mutation: One phase-boundary or lag edit changes governed dates, pairings, denominators, charts, evaluator freshness, finding, continuation forecast, history, WebMCP state, and artifacts.
Alternate input: Boundary editing, day logging, brushing, branch compare, exclusion review, evaluator control, evidence pinning, and export have keyboard equivalents.
Linked views: Phase timeline, adherence heatmap, day ledger, dose/outcome chart, distributions, confounders, evaluator steps, findings, and report use one reducer.
Causal motion: Boundary travel, heatmap reclassification, point re-pairing, denominator/finding changes, and stale-result transitions show cause; reduced motion keeps persistent before/after deltas.
Mobile transformation: Week strip, day cards, boundary sheets, stacked plots, and evaluator stepper preserve the whole experiment workflow.
CRUD substitution: Tables and forms cannot express temporal boundary manipulation, lag re-pairing, protocol lineage, brushed sensitivity analysis, or evaluator staleness.

Verification, scope, and pilot:
Fresh load shows the immutable 42-day fixture and 14 seeded observations with no user protocol branch, run, review, continuation plan, annotation, or export. WebMCP exposes fixture queries and canonical protocol/phase, observation, confounder, branch, analysis-set, evaluator, review, continuation, history, transfer, and reset handlers. Browser verification grades real timeline drag, keyboard date controls, heatmap/chart linking, focus, motion, reduced motion, mobile transformation, and downloaded CSV SVG parsing.

In scope: One 42-day fictional study, one dose and primary outcome and covariate, four phase types, eight branches, bounded confounders and runs, JSON plus CSV plus SVG.
Out of scope: Medical advice, causal claims, sensors, notifications, accounts, collaboration, network, or backend persistence.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Protocol and phase composer:
The user creates baseline, intervention, washout, and follow-up phases on a horizontal timeline. Phase dates cannot overlap or leave an internal gap; duration is 3 to 21 days. Each intervention defines target minutes, allowed window, minimum qualifying dose, skip policy, and primary-outcome lag of 0 to 3 days. Dragging a boundary previews reassignment counts before commit; keyboard arrows and mobile date sheets are equivalent.

Daily adherence and outcome logging:
Each day stores planned target, actual minutes, status, entry timestamp, entry mode, outcome, sleep, and note. A dose can be below target but completed; excused and skipped are distinct; retrospective entries carry a visible badge. Editing a value shows every derived adherence, lag pairing, phase metric, finding, and artifact consequence before commit.

Branchable protocol amendments:
Changing target, window, lag, or skip policy after observations exist creates a protocol branch effective on a selected future date. Backdating an amendment requires explicit reclassification review and preserves old and new interpretations side-by-side. Branches form an acyclic lineage; users compare, switch active analysis head, and merge only annotations, not incompatible protocol definitions.

Confounder and missingness ledger:
Users log travel, illness, and unusual-workload intervals with severity and notes. These overlay the timeline and may mark paired observations excluded, included, or sensitivity-only. Missing dose, missing outcome, excused day, late entry, and confounded pair remain separately countable. The evaluator cannot silently discard any row.

Linked analytical views:
The heatmap encodes adherence state, the dose and outcome chart shows raw and lag-aligned points, the phase table shows exact denominators, and a distribution panel compares baseline versus each intervention. Brushing any dates synchronizes all views and the record ledger. Users toggle raw, eligible, and sensitivity sets; selection changes analysis only.

Deterministic evaluator workflow:
An evaluator run proceeds through validate to pair by lag to classify exclusions to compute phase summaries to compare effect to check robustness to present finding. Each step shows inputs, concise rationale, output, and state. Runs can pause, resume, fail on invalid boundaries, and be rerun after edits. Findings are insufficient or no-clear-change or possible-improvement or possible-decline under declared deterministic thresholds and never claim causality.

Decision and continuation plan:
The user reviews the finding, pins exact evidence rows, accepts or rejects it with a note, and creates a continuation branch: repeat, adjust dose, change lag, or stop. A forecast ribbon displays the proposed future schedule but cannot fabricate observations. Approval freezes a result checksum; later edits mark it stale without deleting it.
</core_features>

<user_flows>
</user_flows>

<edge_cases>
</edge_cases>

<visual_design>
Desktop shows timeline and heatmap, charts, and protocol evaluator rail. Responsive transformation handles smaller screens. Inspect planned, completed, below-target, skipped, excused, missing, late, confounded, excluded, stale states. Encodings stay distinct without color alone.
</visual_design>

<motion>
Boundary travel, heatmap reclassification, point re-pairing, denominator changes, finding changes, and stale-result transitions show cause; reduced motion keeps persistent before and after deltas. Move boundary, re-pair lag, brush, rerun, stale and approve, then repeat reduced. Causal endpoints and values agree.
</motion>

<responsiveness>
</responsiveness>

<accessibility>
</accessibility>

<performance>
</performance>

<writing>
</writing>

<innovation>
</innovation>

<requirements>
Dashboard-derived hardness contract:
Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before and after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard or exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before and after the proposal merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create, edit, export. Validate all records and fields before commit; report every file and record and field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session actual work. Specify exact filenames, schemas, required keys and columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt and exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions and import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts, modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
At the proposal maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked and derived views must settle within 500 ms, and export and import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

Artifact contract:
HabitProtocolTrial uses schemaVersion habit-protocol-trial/v1 and stores fixture, hash, timezone, measures, protocol branches, active head, ordered phases, amendments, daily observations with provenance, confounder intervals, analysis-set decisions, evaluator runs, steps, findings, reviews, continuation plan, annotations, selection and view state, ordered history, derived pairing, summary, finding, report checksums, CSV, SVG report, and UTC exportedAt.
Dates are ISO local dates in the fixture timezone; phases cover a contiguous bounded interval and satisfy type and duration rules.
Each date has at most one observation; numeric fields honor exact bounds; entry provenance and original timestamp are immutable.
Lag pairing maps a dose date to one outcome date deterministically across the DST fixture; no outcome may be double-counted within one analysis head.
Branch lineage is acyclic and effective dates agree with phase assignment; reclassification decisions cover every changed historic row.
Phase denominators expose planned, eligible, completed, missing, excused, skipped, confounded, and sensitivity counts.
CSV row order and values match canonical observations and pairing decisions; SVG labels, point counts, summaries, finding, and checksum match active analysis.
Import rejects fixture mismatch, date gaps and overlap, invalid bounds, duplicate observations, impossible provenance, branch cycles, forged evaluator and derived and artifact values, or unsafe SVG atomically.
Canonical re-export changes only exportedAt; CSV and SVG remain byte-identical.

Requirements note: Tailwind CSS 4.3.2 must be used for styling, installed via npm locally, no CDN allowed.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
