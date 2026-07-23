# Backlog Decay Observatory

<summary>
The user captures tasks and evidence, links dependencies and external waits, allocates a fixed priority budget, advances logical time to reveal freshness decay, runs constrained triage sessions, schedules selected work, archives/defers/delegates/splits tasks, repairs stale context on revival, completes with evidence, and exports an exact backlog decision ledger.
This is not a to-do list or Kanban shell. The signature interaction is moving priority-budget tokens among task nodes while a dependency graph, age/freshness field, risk bands, WIP lanes, schedule, waiting queue, triage rationale, and artifacts update together.

Deterministic fixture
The fictional backlog has 60 tasks across six life areas, 42 evidence/context cards, 35 dependency/wait edges, fixed effort/deadlines/commitment classes, a 100-point priority budget, daily WIP capacity, and deterministic clock events over 45 days. Starter data includes stale evidence, blocked chains, duplicates, overdue tasks, and archived items.
</summary>
<core_features>
Task contract and context evidence
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Tasks require outcome, next action, area, effort, deadline optional, commitment class, current owner/waiting party, and completion evidence rule. Context cards have revision/time/source and freshness horizon. Binding evidence supports readiness; stale/missing context makes a task review-required rather than deleting it.

Dependency and waiting graph
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Edges are blocks, requires, contributes, duplicate-of, waiting-on, or follow-up-after. Blocking/requires graph cycles reject; duplicate groups require one canonical survivor. Selecting a task/edge highlights priority, schedule, context, waiting/follow-up, and artifact rows. Keyboard/mobile source-target binding equals graph gestures.

Priority-budget allocator
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Exactly 100 integer points distribute among active nonwaiting tasks; unallocated reserve is visible. Tasks have min/max by commitment class. Sliders, drag tokens, and keyboard inputs preview downstream rank, schedule eligibility, and risk. Reallocation never changes completion or evidence state.

Logical decay and risk field
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Freshness derives from last meaningful review/evidence revision and class-specific half-life fixture. Risk combines deadline slack, dependency fan-out, stale context, wait duration, effort, and priority under a declared integer formula. Logical clock controls reveal transitions; scores are explanatory, not autonomous decisions.

Triage session
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
The user selects a bounded queue and decides do-next, schedule, defer-to-date, waiting, delegate-proposed, split, merge-duplicate, archive, someday, or delete-draft-only. Each decision requires type-specific fields and appends rationale. Bulk decisions preview exact affected tasks/dependencies/priority points before commit.

WIP and schedule planner
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Selected tasks drag into daily effort lanes with fixed capacity, dependencies, deadline, and context freshness. Starting work moves planned to active to paused/waiting to complete/abandoned under exact WIP limits. Completion binds evidence; splitting allocates effort and completion criteria to children whose sum satisfies parent.

Archive, revival, and follow-up
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Archived/someday tasks keep lineage and release priority. Reviving requires context/evidence revalidation, dependency repair, and priority allocation. External waiting events generate follow-ups; no response may escalate, defer, cancel, or revive blocked work under deterministic clock rules.

Responsive observatory and artifacts
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Desktop shows backlog/risk field, dependency graph, priority allocator, and triage/schedule rail. Mobile becomes task/evidence cards, point-allocation sheets, vertical lineage, triage stepper, and day/WIP cards. Export produces canonical JSON, CSV task/decision/event ledger, ICS scheduled/follow-up items, and SVG dependency/decay/priority report; import reconstructs state exactly.
</core_features>
<visual_design>
The hierarchy remains legible when inspecting fresh/stale/missing, blocked/waiting/duplicate, priority/risk, scheduled/active/paused/complete, and archived/revival states. Priority points, capacity limits, and logical decay visually explain the conservation and exhaustion of available budget.
</visual_design>
<motion>
Reallocating tokens, advancing decay, propagating graph/risk, triage/schedule, and archive/revive visually explain their causes. Reduced motion retains causal parity and before/after point/status values exactly.
</motion>
<requirements>
Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
For every pointer or direct-manipulation path, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP state, persistence, and export.
Exercise adversarial orderings (e.g. edit before/after merge, undo followed by branch). Equivalent orders converge; cancelled actions restore complete prior snapshot (selection, viewport, filters, focus).
Treat import as an atomic transaction validating all records/fields before commit. Reject violations with zero state mutation.
Make the end state an interoperable artifact with exact schemas, keys, units, stable sorts, and regenerated generatedAt/exportedAt values. Re-export matches semantically except metadata.
Persisted state must survive reload exactly; transient states must not leak into persistence.
Handle bounded fields, enums, formats, uniqueness, and cross-field rules with exact minimum/maximum validations.
Require real browser mechanics: pointer actionability, hover styles, keyboard traversal, modal focus traps, live announcements, and full flow at mobile viewport without overflow.
Acknowledge direct manipulation within 100ms, settle linked views within 500ms, export/import within 2s without dropped interactions or console errors.
Support 100,000 tasks, 500,000 edges, and 10,000 triage sessions gracefully.
Handle 0/100/sum priority bounds, cycle limits, WIP bounds, and stale context recovery via named copy.
Do not use unverified third-party libraries (e.g., date-fns, framer-motion) unless explicitly mentioned.
Stick to standard React/Vite dependencies and explicitly approved libraries.
Tailwind CSS 4.3.2 is required.
All assets and dependencies must be installed via local npm install with no CDNs.

Depth-first completion protocol (mandatory)
For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates (hard)
No TODO markers in user-facing behavior.
Every feature branch has an explicit observable evidence path.
Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
Zero partial mutation on validation/import failure.
Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
</requirements>
<integrity>
# (Do not edit this section. It is automatically maintained by the `corpuscheck` utility.)
</integrity>
<delivery>
# (Do not edit this section. It is automatically maintained by the `corpuscheck` utility.)
</delivery>
<webmcp_action_contract>
# (Do not edit this section. It is automatically maintained by the `corpuscheck` utility.)
</webmcp_action_contract>
