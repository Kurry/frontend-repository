<summary>
The user authors recurring task series, links dependencies, edits scopes (one, this and future, or entire series), detaches and rejoins occurrences, reschedules by calendar drag, runs resumable focus sessions, records completion evidence, resolves collisions and missed work, compares schedule branches, and exports exact task and ICS artifacts. The app must preserve series intent, occurrence history, and scope provenance. This planner targets a person managing recurring responsibilities whose individual occurrences often move, split, skip, or require focus-session evidence.

This is not a simple to-do list. The signature interaction is stretching and splitting a recurrence ribbon over a calendar while occurrence cards, lineage graph, dependency lanes, workload histogram, focus log, and export preview update together. Editing this and future creates a child series at an exact recurrence boundary instead of rewriting old instances.
</summary>

<core_features>
Recurrence rule composer supports daily, weekly, monthly intervals, weekdays, day of month, nth or last weekday, start, end, count, local start time, duration, timezone, holiday behavior, and skip or reschedule policies. A live ribbon and occurrence list preview the next 20 instances. Invalid or no-instance rules reject; month-end and DST interpretations are explicitly labeled.

Scoped occurrence editing allows moving, renaming, resizing, changing priority, or completing an occurrence with scopes for this, this and future, or entire series. This creates an exception. This and future closes the parent before the target recurrence id and creates a child. Entire series preserves immutable history and regenerates eligible future instances. Users inspect and undo the exact scope delta.

Occurrences can be detached, skipped, and rejoined. An occurrence may be skipped with a reason, detached to an arbitrary valid slot, or rejoined if its local fields again equal the generated occurrence. Rejoining removes the exception but keeps its audit event. Rescheduled holidays and manually detached instances are distinct. Deleting a series cannot delete historical completion or focus records.

Dependency and workload lanes connect series or individual occurrences with finish before start and same day after edges. Generated dependencies bind by recurrence identity or nearest eligible date under a declared policy. Dragging a task previews downstream shifts, cycles, outside-hours placement, and daily workload overload. Invalid commit snaps back; the histogram selects exact tasks.

Priority and interruption triage assigns impact, urgency, effort, energy, and fixed or flexible status to each occurrence. A deterministic triage view suggests move, shorten, split, or keep actions when collisions arise. Suggestions disclose rule inputs and remain proposals. Accepting a split creates two linked child occurrences whose durations sum to the original.

Resumable focus sessions bind one occurrence, planned duration, phase sequence, interruptions, pause or resume events, and outcome. Logical clock controls make timing deterministic. Reload reconstructs an active or paused session; completing records actual focused and interrupted seconds and optional evidence note. A task may need a minimum focused duration before completion; duplicate terminal events reject.

Branch compare and reconciliation lets the user fork a six-week schedule before accepting multiple triage changes, then compare occurrence slots, workload, dependencies, exceptions, and completion forecast. Merge resolves each conflicting occurrence or series property. Historical sessions never move between branches; a winning branch must retain their bound occurrence identity.

Responsive planner and artifacts on desktop shows calendar and ribbons, series and dependency graph, workload, and focus or lineage rail. Mobile becomes agenda occurrence cards, recurrence or scoped-edit sheets, vertical dependency lineage, workload drilldown, and focus controls. Export produces canonical JSON, RFC5545 ICS with recurring masters and exceptions, and CSV focus or occurrence ledger; import reconstructs exact lineage and verifies ICS agreement.
</core_features>

<visual_design>
Inspect master, generated, exception, detached, skipped, and completed states. Parent and child lineage, dependency edges, overloaded slots, active or paused sessions, and compared branches must be distinctly styled and legible. The design must accommodate dense recurring-task semantics, making exceptions visually obvious against generated instances.

Mobile transformation turns desktop panels into agenda cards, rule and scope sheets, vertical lineage, workload drilldowns, and focus controls while preserving the complete job and maintaining minimum target sizes without overflow. Empty states, invalid rule feedback, and triage proposals must be clearly differentiated from committed schedule data.
</visual_design>

<motion>
Split series, move or dependency propagate, redistribute workload, pause and resume, and compare branches must explain cause through animation. Ribbon splits, occurrence propagation, dependency shifts, and timer states must animate smoothly. Reduced motion uses instant endpoints with persistent deltas, ensuring endpoints and canonical state exactly agree.
</motion>

<requirements>
Build tooling: Next.js with static export (or SSR with client hydration); all interactivity lives in client state after load. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. All libraries installed via npm and bundled locally; no CDN imports.
State contracts and constraints
Begin from a genuinely clean state with no authored work, completion, approval, export, or success evidence preseeded. Each milestone must become observable only after its real UI action, with exact before and after entity and event count deltas.
For every pointer or direct manipulation path, make the keyboard or exact value path converge to one canonical event with identical stable IDs, derived values, linked view selection, history, WebMCP observable state, persistence, and export bytes after normalization. No op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before and after the merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API shaped schema used by create, edit, and export. Validate all records and fields before commit; report every file, record, and field diagnostic together; reject unknown enums, exact boundary violations, duplicate or dangling IDs, cross field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session actual work. Specify exact filenames, schemas, required keys and columns, units, precision, stable sort order, relationship integrity, and regenerated exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
State that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions or import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just inside, and just outside values for every bounded field, plus enum, format, uniqueness, and cross field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command or search where promised), modal focus trap and opener return, live announcements, non color evidence, reduced motion causal parity, and the full canonical flow at the stated mobile viewport without page level overflow or sub 44px targets.
At the maximum declared fixture, direct manipulation must acknowledge within 100 milliseconds, linked and derived views must settle within 500 milliseconds, and export or import must complete within 2 seconds without dropped interactions, stale views, layout jumps, console errors, page errors, or non local network dependence.

Deterministic fixture
The fictional six week planner begins 2027-10-18 in America Detroit and includes five starter series: weekday review, last business day report, biweekly cleanup, monthly coaching call, and every third day practice. It crosses the 2027 fall DST change, contains two holidays, fixed work hours, three task dependencies, four historical occurrences, and deterministic interruption events.

Artifact contract
RecurrenceTaskPlan uses schemaVersion recurrence-task-plan v1 and stores fixture, hash, timezone, holiday rules, series lineage and rules, generated occurrence identities, exceptions, detach, skip, and rejoin events, dependencies and bind policies, priorities and triage proposals, schedule branches and merge resolutions, focus sessions, events, evidence, annotations, view state, history, derived expansion, dependency, workload, session, artifact checksums, ICS, CSV, and UTC exportedAt.
Series ids and recurrence identities are stable; expansion follows declared local time, DST, holiday, inclusive end, and count semantics.
Parent and child series intervals do not overlap; scope mutations preserve immutable past records and form an acyclic lineage.
Exception events reference one valid occurrence; rejoin requires canonical field equality; skip and detach states are mutually exclusive.
Dependency graph is acyclic and bound occurrences obey edge policy; split durations sum exactly.
Focus event state machine is valid and append only; elapsed seconds derive from logical clock; completion gates use focused seconds.
ICS masters use RRULE, EXDATE, and RECURRENCE-ID correctly with fixed UID mapping; CSV rows agree with occurrence and session ledger.
Import rejects fixture or timezone mismatch, impossible recurrence, lineage or dependency cycle, overlapping generations, orphan exception or session, invalid timer event, forged derivation or checksum, or ICS and CSV disagreement atomically.
Canonical re-export changes only exportedAt; ICS and CSV remain byte identical.

Depth first completion protocol mandatory
For every subsystem in this proposal, complete it only when there are no unimplemented implication states. Implement each component end to end first: state model, rendering, stream, error, approval, retry paths, persistence, verification assertions. Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions. Explore each dependency recursively, then explore how each loops back through shared state and event timelines. Add complete recovery and recovery by default cases: malformed or partial input, duplicate or lost or late events, approval races, transient and terminal failures, cancellation and resume semantics, import or export drift, no network constraints in demo mode, runtime and console regressions. Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior. If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates hard
No TODO markers in user facing behavior.
Every feature branch has an explicit observable evidence path.
Stream replay, retry, and cancellation outcomes are deterministic and non duplicated.
Zero partial mutation on validation or import failure.
Final artifacts round trip to the same canonical state shape, including timestamps and provenance fields.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>



<webmcp_action_contract>
Contract version: zto-webmcp-v1
</webmcp_action_contract>
