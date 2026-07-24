# Habit Protocol Trialbench

<summary>
The user designs a multi-phase habit experiment, schedules protocol doses, logs adherence and outcomes, annotates confounders, branches the protocol without corrupting prior observations, compares lagged effects, reviews deterministic evaluator findings, and exports a reproducible experiment record. The app must preserve the difference between planned, attempted, completed, skipped, excused, and retrospectively entered behavior.

This is not a streak calendar. The signature interaction is brushing a date range across a phase timeline and adherence heatmap while linked dose, outcome, confounder, branch, and evaluator views recompute. Moving a phase boundary changes which protocol version governed each day but never rewrites its original observation provenance.
</summary>

<reference_screenshots>

</reference_screenshots>

<core_features>
The user creates baseline, intervention, washout, and followup phases on a horizontal timeline. Phase dates cannot overlap or leave an internal gap; duration is 3 to 21 days. Each intervention defines target minutes, allowed window, minimum qualifying dose, skip policy, and primary outcome lag of 0 to 3 days. Dragging a boundary previews reassignment counts before commit; keyboard arrows and mobile date sheets are equivalent.

Each day stores planned target, actual minutes, status, entry timestamp, entry mode, outcome, sleep, and note. A dose can be below target but completed; excused and skipped are distinct; retrospective entries carry a visible badge. Editing a value shows every derived adherence, lag pairing, phase metric, finding, and artifact consequence before commit.

Changing target, window, lag, or skip policy after observations exist creates a protocol branch effective on a selected future date. Backdating an amendment requires explicit reclassification review and preserves old and new interpretations side by side. Branches form an acyclic lineage; users compare, switch active analysis head, and merge only annotations—not incompatible protocol definitions.

Users log travel, illness, and unusual-workload intervals with severity and notes. These overlay the timeline and may mark paired observations excluded, included, or sensitivity-only. Missing dose, missing outcome, excused day, late entry, and confounded pair remain separately countable. The evaluator cannot silently discard any row.

The heatmap encodes adherence state, the dose/outcome chart shows raw and lag-aligned points, the phase table shows exact denominators, and a distribution panel compares baseline versus each intervention. Brushing any dates synchronizes all views and the record ledger. Users toggle raw, eligible, and sensitivity sets; selection changes analysis only.

An evaluator run proceeds step by step from validation through lag pairing and exclusion classification to compute summaries and check robustness. Each step shows inputs, concise rationale, output, and state. Runs can pause, resume, fail on invalid boundaries, and be rerun after edits. Findings are insufficient or no clear change or possible improvement or possible decline under declared deterministic thresholds and never claim causality.

The user reviews the finding, pins exact evidence rows, accepts or rejects it with a note, and creates a continuation branch: repeat, adjust dose, change lag, or stop. A forecast ribbon displays the proposed future schedule but cannot fabricate observations. Approval freezes a result checksum; later edits mark it stale without deleting it.
</core_features>

<visual_design>
Visual elements must clearly distinguish between planned, completed, below-target, skipped, excused, missing, late, confounded, excluded, and stale states. Do not rely solely on color encoding.
</visual_design>

<motion>
Moving a boundary, re-pairing lag, brushing, running the evaluator, and stale/approve actions must show clear cause-and-effect transitions (150–300ms duration). Heatmap reclassification, point re-pairing, denominator/finding changes, and stale-result transitions should use animation. A reduced motion mode must preserve before/after deltas without animation.
</motion>

<requirements>
The fictional 42-day study tracks evening-walk-minutes as dose and next-morning-focus from 1–10 as primary outcome. It includes fixed weekdays, sleep-duration covariate, three confounder types, 14 seeded observations, two missing-outcome days, one late entry, and one daylight-saving boundary. Suggested protocols and evaluator findings are deterministic local fixtures.

Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

HabitProtocolTrial uses schemaVersion: "habit-protocol-trial/v1" and stores fixture/hash/timezone, measures, protocol branches/active head, ordered phases/amendments, daily observations with provenance, confounder intervals, analysis-set decisions, evaluator runs/steps/findings/reviews, continuation plan, annotations, selection/view state, ordered history, derived pairing/summary/finding/report checksums, CSV, SVG report, and UTC exportedAt.
Dates are ISO local dates in the fixture timezone; phases cover a contiguous bounded interval and satisfy type/duration rules.
Each date has at most one observation; numeric fields honor exact bounds; entry provenance and original timestamp are immutable.
Lag pairing maps a dose date to one outcome date deterministically across the DST fixture; no outcome may be double-counted within one analysis head.
Branch lineage is acyclic and effective dates agree with phase assignment; reclassification decisions cover every changed historic row.
Phase denominators expose planned, eligible, completed, missing, excused, skipped, confounded, and sensitivity counts.
CSV row order and values match canonical observations/pairing decisions; SVG labels, point counts, summaries, finding, and checksum match active analysis.
Import rejects fixture mismatch, date gaps/overlap, invalid bounds, duplicate observations, impossible provenance, branch cycles, forged evaluator/derived/artifact values, or unsafe SVG atomically.
Canonical re-export changes only exportedAt; CSV and SVG remain byte-identical.

For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery-by-default cases:
  malformed/partial input,
  duplicate/lost/late events,
  approval races,
  transient and terminal failures,
  cancellation + resume semantics,
  import/export drift,
  no-network constraints in demo mode,
  runtime/console regressions.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

No TODO markers in user-facing behavior.
Every feature branch has an explicit observable evidence path.
Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
Zero partial mutation on validation/import failure.
Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.

Phase-boundary moves must recompute governance without touching provenance: after a boundary move, every day's governing-version updates in dose, outcome, confounder, branch, and evaluator views in one committed transition (old assignment gone everywhere), while each observation's recorded original-version provenance fields remain byte-identical.
The six adherence states need an audit-trail contract: planned/attempted/completed/skipped/excused/retrospectively-entered must stay distinguishable: a retrospective entry carries a visible retroactive marker and never overwrites what was originally logged for that day; correcting an entry appends rather than rewrites where provenance is promised; rapid double-log of the same day/dose produces exactly one entry. A phase whose days are all skipped/excused shows a named empty analysis, not stale derived statistics.
Brushing is a graded live gesture: brushing a date range across the phase timeline and adherence heatmap must recompute the linked dose/outcome/confounder/branch/evaluator views during the brush, not only on release, with the keyboard/numeric-exact path producing the identical filter state; clearing the brush restores the full-range recompute.
Branch lineage over immutable observations: a branch copies the protocol definition and version schedule, shares the immutable observation record set, and neither branch deletion nor any merge touches observation rows; evaluator findings cite the exact branch and protocol version they were computed from, and recomputing a finding after a boundary move cites the new governance with the old finding retained in history.
Lagged-effect comparison shows both windows from one state: comparing lagged effects must render both date windows simultaneously from the shared filtered state with per-metric deltas named; switching the comparison window never rewrites the underlying observations.
Reproducible record exactness: The experiment record export (tabular + JSON) needs exact columns/fields, stable sort order, regenerated exportedAt, per-field import diagnostics naming the first offending field with zero state mutation on reject, and re-export-after-import field-identical modulo timestamps.
Motion numerics and a testable reduced-motion path: Heatmap recompute, boundary-move, and branch-fork transitions need named durations (150–300ms) with early/settled frame sampling and computed hover deltas on cells and handles; reduced motion is verifiable via a visible chrome toggle or ?reducedMotion=1 fresh load.

All libraries installed via npm and bundled locally; no CDN imports. Pinned Tailwind version: Tailwind CSS 4.3.2.
</requirements>

<integrity>

</integrity>

<delivery>

</delivery>


<webmcp_action_contract>
```json
{
  "tools": [
    {
      "name": "dummy_tool",
      "description": "Dummy tool for testing",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    }
  ]
}
```
</webmcp_action_contract>
