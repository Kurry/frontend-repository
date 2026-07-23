# Backlog Decay Observatory

<summary>
The user captures tasks and evidence, links dependencies and external waits, allocates a fixed priority budget, advances logical time to reveal freshness decay, runs constrained triage sessions, schedules selected work, archives, defers, delegates, splits tasks, repairs stale context on revival, completes with evidence, and exports an exact backlog decision ledger.
</summary>

<core_features>
Tasks require outcome, next action, area, effort, deadline optional, commitment class, current owner or waiting party, and completion evidence rule.
Context cards have revision, time, source and freshness horizon. Binding evidence supports readiness, and stale or missing context makes a task review required rather than deleting it.
Edges are blocks, requires, contributes, duplicate of, waiting on, or follow up after.
Blocking or requires graph cycles reject, and duplicate groups require one canonical survivor.
Selecting a task or edge highlights priority, schedule, context, waiting or follow up, and artifact rows. Keyboard and mobile source to target binding equals graph gestures.
Waiting on edges name the blocking task. Creating a wait cycle is blocked with a named reason and zero mutation.
Completing a blocker propagates to every waiting tasks eligibility in one transition where the waiting queue recomputes and old blocked state is gone everywhere.
A task waiting on an archived task surfaces a named broken wait state rather than waiting forever silently.
Exactly 100 integer points distribute among active nonwaiting tasks, and the unallocated reserve is visible. Tasks have min and max bounds by commitment class.
Sliders, drag tokens, and keyboard inputs preview downstream rank, schedule eligibility, and risk.
Reallocation never changes completion or evidence state.
Moving priority budget tokens among task nodes must update the dependency graph, age and freshness field, risk bands, WIP lanes, schedule, waiting queue, triage rationale, and artifacts together, with the previous allocation gone from every surface in one transition.
Risk bands and the schedule recompute from the new allocation immediately, not on later navigation.
The total budget is fixed. Tokens on tasks plus unallocated equal the declared total after every move to the exact unit.
Over allocating spending tokens that do not exist is blocked with a visible diagnostic and zero mutation.
Fractional tokens state the exact divisibility rule. Rapid double move of the same token produces exactly one transfer.
Freshness derives from last meaningful review or evidence revision and class specific half life fixture.
Risk combines deadline slack, dependency fan out, stale context, wait duration, effort, and priority under a declared integer formula.
Logical clock controls reveal transitions. Scores are explanatory, not autonomous decisions.
Freshness and decay advances by the apps logical clock, not wall time. The decay function states its exact form and step rule.
The risk field derives deterministically from current allocation and decay state. Advancing the logical clock reproduces identical decay results for the same state.
The user selects a bounded queue and decides do next, schedule, defer to date, waiting, delegate proposed, split, merge duplicate, archive, someday, or delete draft only.
Each decision requires type specific fields and appends rationale. Bulk decisions preview exact affected tasks, dependencies, and priority points before commit.
Triage decisions record their rationale with the decision and never rewrite prior rationale records.
Confirming a triage outcome is judged on post confirm state where task state, budget, and queue update together, never the dialogs presence.
Selected tasks drag into daily effort lanes with fixed capacity, dependencies, deadline, and context freshness.
Starting work moves planned to active to paused or waiting to complete or abandoned under exact WIP limits.
Completion binds evidence. Splitting allocates effort and completion criteria to children whose sum satisfies parent.
Moving a task into a WIP lane beyond its declared limit is blocked, or flagged with an explicit recorded override, with the violated limit named.
WIP counts recompute live on every lane change.
Archived and someday tasks keep lineage and release priority. Reviving requires context and evidence revalidation, dependency repair, and priority allocation.
External waiting events generate follow ups. No response may escalate, defer, cancel, or revive blocked work under deterministic clock rules.
Archiving appends an archive event with the archived state snapshot.
Reviving creates a revival record linked to the archive event and never rewrites the archived history.
Follow ups link to their parent task and track to completion with exact due states.
Reviving a task whose dependencies changed surfaces the broken dependency state explicitly.
</core_features>

<visual_design>
Desktop shows backlog and risk field, dependency graph, priority allocator, and triage and schedule rail.
Mobile becomes task and evidence cards, point allocation sheets, vertical dependency and wait lineage, triage stepper, and day and WIP cards.
Inspect fresh, stale, missing, blocked, waiting, duplicate, priority, risk, scheduled, active, paused, complete, archived, and revival states. Hierarchy stays legible.
</visual_design>

<motion>
Causal motion means token reallocation, freshness and risk transition, graph propagation, triage status travel, and archive or revival explain cause.
Token drag, decay step, and risk band transitions need named durations of 150 to 300ms with early and settled frame sampling and computed hover deltas.
Reduced motion via a chrome toggle, never browser emulation. Reduced motion retains before and after points, status, and scores with all non zero CSS transitions removed.
</motion>

<requirements>
Artifact contract for BacklogDecisionLedger uses schemaVersion backlog decision ledger v1 and stores fixture, hash, timezone, logical clock, task revisions, contracts, status, context cards, revisions, bindings, freshness, dependency, wait, duplicate graph, priority allocations, reserve, events, decay, risk inputs, results, triage sessions, decisions, bulk previews, schedule, WIP, work events, completion evidence, archive, revival, follow up events, filters, annotations, history, derived graph, priority, freshness, risk, capacity, artifact checksums, CSV, ICS, SVG, and UTC exportedAt.
Active priority allocations are nonnegative integers within class bounds and sum plus reserve to exactly 100.
Dependency graph obeys typed cycle and duplicate rules. Status, owner, and waiting consistency is exact.
Freshness and risk derive from logical time, current evidence revision, deadlines, graph, wait, effort, and allocation under declared formulas.
Triage, work, archive, and revival events are append only and follow state machines. Deletion is allowed only for never committed drafts.
WIP and effort capacity, dependency eligibility, split effort and evidence, and completion rules are exact.
CSV rows, ICS UIDs, dates, status, and SVG nodes, edges, priority, and risk values agree with canonical selected state.
Import rejects fixture or timezone mismatch, graph cycle, priority sum or bounds forgery, freshness or risk forgery, impossible triage, work, revival event, orphan evidence, capacity violation, forged checksum, unsafe SVG, or artifact disagreement atomically.
Canonical re export changes only exportedAt. CSV, ICS, and SVG remain byte identical.
Hardness contract begins from a genuinely clean state with no authored work, completion, approval, export, or success evidence preseeded. Each milestone must become observable only after its real UI action, with exact before and after entity and event count deltas.
For every pointer or direct manipulation path the proposal names, make the keyboard or exact value path converge to one canonical event with identical stable IDs, derived values, linked view selection, history, WebMCP observable state, persistence, and export bytes after normalization.
Treat every import mode as an atomic transaction over the same API shaped schema used by create, edit, and export.
Verify genre correct reload behavior and isolation where state that the PRD promises to persist must survive reload exactly, and transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence.
Do not use CDNs or external network requests. All assets and libraries must be loaded from local npm dependencies.
Tailwind CSS 4.3.2 must be used.
Do not use browser storage APIs like localStorage or sessionStorage. Utilize in memory JavaScript variables.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>

<reference_screenshots>
</reference_screenshots>
