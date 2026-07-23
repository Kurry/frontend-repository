# Task proposal: Recurrence Exception Loom

Proposed slug: frontend-productivity-recurrence-exception-loom
Archetype: productivity
Genre: hard browser app/series-aware task planner
Source basis: Product Hunt feedback around weak recurring-task handling, combined framework-agnostically with task timelines, smart defaults, interruption management, branch lineage, actors, and resumable workflow primitives
Target user: A person planning recurring responsibilities whose individual occurrences often move, split, skip, or require focus-session evidence

<summary>
The user authors recurring task series, links dependencies, edits one, this and future, or all scopes, detaches and rejoins occurrences, reschedules by calendar drag, runs resumable focus sessions, records completion evidence, resolves collisions and missed work, compares schedule branches, and exports exact task and ICS artifacts. The app must preserve series intent, occurrence history, and scope provenance.

This is not a to do list. The signature interaction is stretching and splitting a recurrence ribbon over a calendar while occurrence cards, lineage graph, dependency lanes, workload histogram, focus log, and export preview update together. Editing this and future creates a child series at an exact recurrence boundary instead of rewriting old instances.

Frontier loss hypothesis: The task targets healthy frontier weaknesses in recurrence expansion, time zones and DST, scoped mutation semantics, lineage, dependency propagation, timer recovery, mobile transformation, keyboard parity, UI tool parity, and ICS fidelity. Both healthy model medians below 0.35 is a prospective controlled pilot target.

Technology constraints: Use standard React and Vite. Tailwind CSS 4.3.2 is explicitly pinned. All libraries installed via npm and bundled locally; no CDN imports.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Recurrence rule composer:
Rules support daily, weekly, monthly interval, weekdays, day of month, nth or last weekday, start, end, count, local start time, duration, timezone, holiday behavior, and skip or reschedule policy. A live ribbon and occurrence list preview the next 20 instances. Invalid or no instance rules reject; month end and DST interpretations are explicitly labeled.

Scoped occurrence editing:
Moving, renaming, resizing, changing priority, or completing an occurrence requires this, this and future, or entire series. This creates an exception; this and future closes the parent before the target recurrence id and creates a child; entire series preserves immutable history and regenerates eligible future instances. Users inspect and undo the exact scope delta.
Hardening: This and future creates a child series at an exact boundary, never a rewrite. Editing this and future must create a child series whose boundary is the exact edited occurrence named in the lineage, leaving all prior instances and their provenance byte identical. Pre boundary occurrence ids, times, and edit history remain unchanged after the split. The lineage graph shows parent to child with the boundary occurrence. Re splitting the same boundary twice via rapid double action produces exactly one child series.

Detach, skip, and rejoin:
An occurrence may be skipped with reason, detached to an arbitrary valid slot, or rejoined if its local fields again equal the generated occurrence. Rejoining removes the exception but keeps its audit event. Rescheduled holidays and manually detached instances are distinct. Deleting a series cannot delete historical completion or focus records.
Hardening: A detached occurrence becomes a standalone record retaining its series provenance. A skip records an explicit skipped state, never a deletion, and the histogram reflects it as skipped, not absent. Rejoin merges the detached instance back only at a compatible boundary with the merge rule stated, and rejoin of an incompatible instance is blocked with a named reason and zero mutation.

Dependency and workload lanes:
Series or individual occurrences connect with finish before start and same day after edges. Generated dependencies bind by recurrence identity or nearest eligible date under a declared policy. Dragging a task previews downstream shifts, cycles, outside hours placement, and daily workload overload. Invalid commit snaps back; the histogram selects exact tasks.
Hardening: Moving an occurrence that would violate a dependency is blocked with a visible reason naming the violated dependency, all surfaces identical before and after.

Priority and interruption triage:
Each occurrence has impact, urgency, effort, energy, and fixed or flexible status. A deterministic triage view suggests move, shorten, split, or keep actions when collisions arise. Suggestions disclose rule inputs and remain proposals. Accepting a split creates two linked child occurrences whose durations sum to the original.
Hardening: Priority and interruption triage changes propagate to the focus log queue immediately. Rapid double triage produces exactly one state change.

Resumable focus sessions:
A focus session binds one occurrence, planned duration, phase sequence, interruptions, pause and resume events, and outcome. Logical clock controls make timing deterministic. Reload reconstructs an active or paused session. Completing records actual focused and interrupted seconds and optional evidence note. A task may need a minimum focused duration before completion. Duplicate terminal events reject.
Hardening: Pausing and resuming a focus session produces the identical continuation with same occurrence and same elapsed accounting. Attempt and elapsed logs append, never rewrite. A completed session log is immutable to later rescheduling of its occurrence.

Branch compare and reconciliation:
The user can fork a six week schedule before accepting multiple triage changes, then compare occurrence slots, workload, dependencies, exceptions, and completion forecast. Merge resolves each conflicting occurrence and series property. Historical sessions never move between branches; a winning branch must retain their bound occurrence identity.
Hardening: Comparing layout branches shows both from one shared state with per occurrence deltas named. Reconciliation requires an explicit choice per conflicting occurrence and never invents a resolution. Reconcile then edit and edit then reconcile converge where equivalent.
</core_features>

<user_flows>
Compose: Create a last weekday series.
Schedule: Drag one occurrence across DST.
Scope edit: Choose this and future.
Exceptions: Detach another occurrence.
Dependencies: Create then repair a dependency cycle.
Triage: Accept a split triage suggestion.
Focus: Start, pause, reload, resume a focus session.
Reconcile branch: Compare schedule branches and resolve.
Export: Export canonical JSON, RFC5545 ICS, and CSV.
Reset and import: Reset session and import for exact reconstruction.
</user_flows>

<edge_cases>
Test DST gap and fold, month end and last weekday, inclusive count and end, holiday, this and future boundary, rejoin mismatch, dependency cycle, outside hours, reload timer, duplicate completion, forged import with named recovery.
</edge_cases>

<visual_design>
Desktop shows calendar and ribbons, series and dependency graph, workload, and focus and lineage rail. Mobile becomes agenda occurrence cards, recurrence and scoped edit sheets, vertical dependency lineage, workload drilldown, and focus controls. Export produces canonical JSON, RFC5545 ICS with recurring masters and exceptions, and CSV focus and occurrence ledger. Import reconstructs exact lineage and verifies ICS agreement.
Inspect master, generated, exception, detached, skipped, completed, parent, child, dependency, overloaded, active, paused, and compared states: lineage stays legible.
</visual_design>

<motion>
Hardening: Ribbon stretch and split propagates to all six surfaces in one transition. Stretching or splitting the recurrence ribbon must update occurrence cards, lineage graph, dependency lanes, workload histogram, focus log, and export preview together, with the previous occurrence layout gone from every surface. The workload histogram recomputes from the new occurrence set immediately, not on later navigation.
Hardening: Motion numerics and a testable reduced motion path. Ribbon stretch, split, and rejoin transitions need named durations of 150 to 300ms with early and settled frame sampling and computed hover deltas on cards and lanes. Reduced motion is verifiable via a visible chrome toggle or reducedMotion query param fresh load, never browser prefers reduced motion emulation.
Split series, move, dependency propagate, redistribute workload, pause, resume, compare, then repeat reduced: endpoints and canonical state agree.
</motion>

<responsiveness>
Complete at 1440, 768, 375 viewports. Agenda, rule, scope, dependency, focus mobile flows retain every action, 44 pixel targets, no overflow.
</responsiveness>

<accessibility>
Compose rule, move, resize, select scope, detach, rejoin, link dependencies, accept triage, control timer, merge, and export without pointer: focus and state match.
</accessibility>

<performance>
Expand 40 series and 500 occurrences with dependencies and sessions: interactions stay responsive and stale expansion previews cancel.
</performance>

<writing>
Trigger every rule, scope, dependency, timer conflict: copy names exact series, occurrence, local time, scope, edge, session, and recovery.
</writing>

<innovation>
Apply one this and future edit: lineage, recurrence expansion, dependencies, workload, sessions, compare, and ICS expose coherent consequences.
</innovation>

<requirements>
Dashboard derived hardness contract. The whole job is incomplete unless the implementation proves every clause below through the proposal own named entities, canonical mutation, linked views, and portable artifact.

Begin from a genuinely clean state. No authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before and after entity and event count deltas.

For every pointer or direct manipulation path the proposal names, make the keyboard or exact value path converge to one canonical event with identical stable IDs, derived values, linked view selection, history, WebMCP observable state, persistence, and export bytes after normalization. No op, invalid, cancelled, and double activation paths must create zero extra events.

Exercise adversarial orderings, including canonical edit before and after the proposal merge, repair, reconciliation, or approval action. Undo followed by branch. Cancel after a transient preview. And import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.

Treat every import mode as an atomic transaction over the same API shaped schema used by create, edit, and export. Validate all records and fields before commit. Report every file, record, and field diagnostic together. Reject unknown enums, exact boundary violations, duplicate or dangling IDs, cross field contradictions, stale derived values, and corrupted manifests with zero state mutation.

Make the useful end state an interoperable downloadable artifact of the session actual work. Specify exact filenames, schemas, required keys and columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt and exportedAt values. A successful import must restore authored and derived state, and re export must be semantically identical except for explicitly allowed regenerated metadata.

Verify genre correct reload behavior and isolation. State that the PRD promises to persist must survive reload exactly. Transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions and import attempts must not silently share or overwrite state.

Cover exact minimum, maximum, just inside, and just outside values for every bounded field, plus enum, format, uniqueness, and cross field rules. Error copy must identify the field, rejected value or rule, and recovery action. Correcting the value must clear only the corresponding error.

Require real browser mechanics for evaluated interactions. Normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts including undo and command or search where promised, modal focus trap and opener return, live announcements, non color evidence, reduced motion causal parity, and the full canonical flow at the stated mobile viewport without page level overflow or sub 44px targets.

At the proposal maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked and derived views must settle within 500 ms, and export or import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non local network dependence.

Author one adversarial browser observable rubric criterion for every promise and every feature group. The criterion must fail a plausible violating build, use correct negative polarity, and verify artifact content shape, not merely button visibility, source code, or a WebMCP shortcut that bypasses the evaluated gesture.

Deterministic fixture:
The fictional six week planner begins 2027 10 18 in America Detroit and includes five starter series: weekday review, last business day report, biweekly cleanup, monthly coaching call, and every third day practice. It crosses the 2027 fall DST change, contains two holidays, fixed work hours, three task dependencies, four historical occurrences, and deterministic interruption events.

Artifact contract:
RecurrenceTaskPlan uses schemaVersion recurrence task plan v1 and stores fixture, hash, timezone, holiday rules, series lineage and rules, generated occurrence identities, exceptions, detach, skip, and rejoin events, dependencies and bind policies, priorities and triage proposals, schedule branches and merge resolutions, focus sessions, events, and evidence, annotations, view state, and history, derived expansion, dependency, workload, session, and artifact checksums, ICS, CSV, and UTC exportedAt.
Series ids and recurrence identities are stable; expansion follows declared local time, DST, holiday, inclusive end, and count semantics.
Parent and child series intervals do not overlap; scope mutations preserve immutable past records and form an acyclic lineage.
Exception events reference one valid occurrence; rejoin requires canonical field equality; skip and detach states are mutually exclusive.
Dependency graph is acyclic and bound occurrences obey edge policy; split durations sum exactly.
Focus event state machine is valid and append only; elapsed seconds derive from logical clock; completion gates use focused seconds.
ICS masters use RRULE, EXDATE, RECURRENCE ID correctly with fixed UID mapping; CSV rows agree with occurrence and session ledger.
Import rejects fixture or timezone mismatch, impossible recurrence, lineage or dependency cycle, overlapping generations, orphan exception or session, invalid timer event, forged derivation or checksum, or ICS or CSV disagreement atomically.
Canonical re export changes only exportedAt; ICS and CSV remain byte identical.

Depth first completion protocol mandatory:
For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
Implement each component end to end first: state model, rendering, stream, error, approval, retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery by default cases: malformed or partial input, duplicate, lost, or late events, approval races, transient and terminal failures, cancellation and resume semantics, import and export drift, no network constraints in demo mode, runtime and console regressions.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates hard:
No TODO markers in user facing behavior.
Every feature branch has an explicit observable evidence path.
Stream replay, retry, and cancellation outcomes are deterministic and non duplicated.
Zero partial mutation on validation or import failure.
Final artifacts round trip to the same canonical state shape, including timestamps and provenance fields.

Verification, scope, and pilot:
Fresh load shows immutable starter rules and history with no user exception, dependency change, triage acceptance, branch, active session, annotation, or export. WebMCP exposes fixture queries and canonical series and rule, occurrence and scope, exception, dependency, triage, branch and merge, clock and session, history, artifact, transfer, and reset handlers. Browser verification evaluates real calendar drag and resize, keyboard scheduling, focus, motion, responsive transformation, reload recovery, and downloaded ICS and CSV parsing.
In scope: Six week fictional horizon, 40 series and 500 instances, bounded branches and sessions, JSON plus ICS plus CSV.
Out of scope: External calendars and notifications, real time clock, collaboration, accounts, network, or backend persistence.

Technology constraints: Use standard React and Vite. Tailwind CSS 4.3.2 is explicitly pinned. All libraries installed via npm and bundled locally; no CDN imports.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- structured-editor-v1
- command-session-v1
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
- Entity: recurrence-series
- Entity operations: create; select; update; delete
- Entity fields: interval; count; start; end; duration; skip-policy
- Editor object types: occurrence
- Editor properties: status; priority; scope
- Editor operations: select; update_property; switch_mode; preview
- Editor modes: calendar; agenda; lineage; workload; branch-compare
- Session operations: start; pause; resume
- Demos: branch-reconciliation
- Artifact operations: export; import
- Export formats: task-plan-json; ics; csv

Mechanics exclusions:
- Calendar ribbon drag, stretch, and split are Playwright driven.
- Focus modal trap and reduced motion toggle are Playwright observed.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
