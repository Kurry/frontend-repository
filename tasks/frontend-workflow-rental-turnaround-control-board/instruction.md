<summary>
Build a "Rental Turnaround Control Board", a framework-agnostic frontend web application that synthesizes adaptive grids, scheduling, source evidence, task dependencies, review gates, interruption, and resource-state primitives.

The user coordinates one fictional two-bedroom unit between occupants. They record room/fixture inspection evidence, classify findings, create and sequence work blocks, reserve replacement inventory, track keys and access, branch scope decisions for approval, dispatch and verify tasks, and complete partial handoffs.

This is a spatial inspection and handoff workflow targeting frontier weaknesses in DAG scheduling, inventory conservation, partial handoff recovery, and exact downloadable artifacts.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
The user views a room-state floorplan. Rooms and fixtures are selectable SVG loci with inspection status, severity, work, and verification overlays. Selecting loci via lasso or keyboard tree selection creates a work scope without merging fixture identities. Zoom and pan are supported, and mobile room cards preserve coordinates and selection.

The user manages a findings and evidence ledger. Each observation stores the fixture, category, severity, note, an evidence hash (photo/note), captured-at logical time, and supersession state. Recording a finding requires attached evidence; without evidence, it remains unverified and blocks readiness. Duplicate-looking evidence remains distinct. Zero findings differs from uninspected. Finding records are append-only.

The user manages a work graph and turnaround timeline. Selecting or lassoing loci and dragging their work blocks on the timeline updates findings, evidence, inventory, access custody, dependencies, readiness, approval freshness, handoff state, and artifacts together in one transition. Work requires attached findings. The user defines dependencies, assignee, duration, room access, inventory, and verification rules. Work dependencies (e.g., clean-before-repair) are strictly enforced; scheduling past unsatisfied dependencies blocks readiness. Cycles, overlaps, unavailable access, missing inventory, and unverified predecessors remain as previews.

The user manages inventory and key custody. They reserve, issue, consume, return, or substitute exact inventory units. Key check-in/check-out transfers record exact holder and time state; keys cannot be in two custody states at once, and conflicting transfers are blocked. Work requiring access to a locked locus is gated on key custody. Counts cannot go negative and event IDs are idempotent. Task readiness cites exact lot and key evidence.

The user branches scope and seeks approval. They can branch repair, replace, defer, or accept-as-is fixture decisions, comparing cost, time, dependencies, inventory, readiness, and unresolved findings. Approving freezes the evidence and schedule basis. Scope-branch approval becomes visibly stale if a finding, work block, or inventory state changes after approval; dispatching on a stale approval is blocked. Re-approval records a new decision citing the fresh scope.

The user dispatches tasks, verifies completion, and handles partial handoff. They advance the logical clock, dispatch tasks, record deterministic progress, and trigger delayed deliveries. Verification of completed work appends verification records and is immutable to later edits. A partial handoff records exactly which loci are handed off and which remain (e.g., at 19/22 tasks), exposing blocked rooms, missing key returns, and stale verification. Handing off a partially ready unit never flips the remaining loci's state. Readiness per locus derives from its findings, work, and verification state; an open blocking finding prevents readiness.
</core_features>

<visual_design>
The visual design distinguishes between uninspected, finding, work, and verified states. Selected/linked, reserved/issued/consumed, checked-out/returned, and branch/stale/partial/ready states remain legible.

The application uses real browser mechanics for graded interactions, including normal pointer actionability, computed style while actually hovered, keyboard traversal, live announcements, non-color evidence, and causal parity at a mobile viewport without page-level overflow or sub-44px targets.

All bounding boxes, target sizes, fonts, icons, color contrasts, layout grids, spacing primitives, and interaction states are designed to look cohesive and professional.
</visual_design>

<motion>
Lasso, work-drag, and readiness-wave transitions use named durations (150-300ms) with early/settled frame sampling and computed hover deltas. Loci flow into task blocks; dependency and readiness paths reroute immediately after edits; partial handoff recovery shows causal state.

Reduced motion must be supported via a Chrome toggle, never relying solely on browser emulation. When reduced motion is requested, causal endpoints and values must agree without animation delays.
</motion>

<requirements>
The state must begin genuinely clean. No authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after a real UI action, with exact before/after entity and event-count deltas.

The keyboard and exact-value paths must converge to the same canonical event as the pointer or direct-manipulation paths, producing identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. Cancelled, invalid, or double activations create zero extra events.

Adversarial orderings (e.g., canonical edit before/after merge, undo followed by branch) must converge correctly. Cancelled actions must restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.

Every import mode must act as an atomic transaction, validating all records and fields before commit. It must reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.

The useful end state is an interoperable downloadable artifact of the session's actual work. It includes:
The artifact turnaround.json contains schema/version, fixture hash, logical clock, spatial loci, observations, evidence, tasks/edges, assignments, inventory, custody, branches, approvals, handoffs, events, and lineage.
The artifact work-order.csv contains one row per task with locus, finding, timing, dependencies, assignee, lot/key ids, state, and verification.
The artifact turnaround.ics contains accepted task/access blocks with stable UIDs and UTC timestamps.
The artifact unit-status.svg contains the floorplan with room/fixture ids, current overlays, selection, and accessible labels.
The artifact handoff-packet.md contains readiness by room, unresolved/waived findings, evidence hashes, custody, decisions, and revision provenance.
Export must be deterministic (except exportedAt). Reset/import recreates canonical state and equivalent files.

State that is promised to persist must survive reload exactly. Transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence.

Bounded fields must enforce minimum, maximum, just-inside, and just-outside values, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action.

Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

The application must be fully usable without external network requests; all assets and libraries must be loaded from local npm dependencies. Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies. Use Tailwind CSS 4.3.2. Do not use CDNs. Build a single-page app that runs offline.

Use generic terminology like 'Workflow' rather than restricted brand names like H-rbor in the solution code.

The deterministic fixture data requires: A fictional two-bedroom unit has eight rooms, 46 fixtures, 31 inspection observations, 18 evidence images represented by abstract thumbnails/hashes, 22 tasks, 14 inventory lots, six keys/access items, three workers, one delivery delay, and a seven-day logical clock. No real addresses, tenants, or legal claims appear.

Do not use localStorage or sessionStorage. All state must be in-memory for the Good-app genre.

To make file downloads directly observable to the evaluator in the DOM without requiring a synthetic click and download interception, use a tags with data URI href attributes (like href=data:application/json...) instead of URL.createObjectURL.

Provide HTML5 drag event fallbacks (dragstart, dragover, drop) and set draggable=true to support Playwright's dragAndDrop API in custom pointer-event-based drag implementations.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>



<webmcp_action_contract>
</webmcp_action_contract>
