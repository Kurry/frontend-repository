<summary>
Build a Rental Turnaround Control Board using React, Zustand, and Tailwind CSS 4.3.2. The app is a spatial inspection and handoff workflow tool where a user coordinates one unit between occupants. It features a room-state floorplan, findings and evidence ledger, work graph and turnaround timeline, inventory and key custody, scope branches and approval, dispatch, verification, and partial handoff. The app produces the operator's session artifacts: a downloadable JSON, CSV, ICS, SVG, and Markdown packet compiled live from the state, conforming to the WebMCP contract bindings for state querying and mutation.
</summary>

<core_features>
Feature: Deterministic Fixture —
- A fictional two-bedroom unit has eight rooms, 46 fixtures, 31 inspection observations, 18 evidence images represented by abstract thumbnails/hashes, 22 tasks, 14 inventory lots, six keys/access items, three workers, one delivery delay, and a seven-day logical clock. No real addresses, tenants, or legal claims appear.
Feature: Room-state floorplan —
- Rooms and fixtures are selectable SVG loci with inspection status, severity, work, and verification overlays. Lasso or keyboard tree selection creates a work scope without merging fixture identities. Zoom/pan and mobile room cards preserve coordinates and selection.
Feature: Findings and evidence ledger —
- Each observation stores fixture, category, severity fixture, note, evidence hash, captured-at logical time, and supersession. Duplicate-looking evidence stays distinct; zero findings differs from uninspected. Selecting evidence traces finding, decision, task, verification, and export use.
Feature: Work graph and turnaround timeline —
- Create tasks from findings, define dependencies, assignee, duration, room access, inventory, and verification rule. Drag/resize on worker lanes or use exact keyboard/mobile controls. Cycles, overlaps, unavailable access, missing inventory, and unverified predecessors remain previews.
Feature: Inventory and key custody —
- Reserve, issue, consume, return, or substitute exact inventory units; check keys/access items out and in through append-only custody events. Counts cannot go negative and duplicate event ids are idempotent. Task readiness cites exact lot/key evidence.
Feature: Scope branches and approval —
- Branch repair, replace, defer, or accept-as-is fixture decisions; compare cost fixture, time, dependencies, inventory, readiness, and unresolved findings. Merge per locus/property. Approving freezes evidence and schedule basis; later changes mark the decision stale.
Feature: Dispatch, verification, and partial handoff —
- Advance the clock, dispatch tasks, record deterministic progress, verify with evidence, and trigger a delayed delivery. A partial handoff at 19/22 tasks exposes blocked rooms, missing key return, and stale verification; recover by resequence, substitute lot, revoke handoff, or issue conditional packet.
Feature: Artifact contract (Export/Import) —
- Export is deterministic except regenerated exportedAt; reset/import recreates canonical state and equivalent files. Imports reject bad loci, evidence hashes, cycles, overlaps, lot/custody arithmetic, event order, derived readiness, or forged handoff hashes atomically.
- turnaround.json: schema/version, fixture hash, logical clock, spatial loci, observations, evidence, tasks/edges, assignments, inventory, custody, branches, approvals, handoffs, events, and lineage.
- work-order.csv: one row per task with locus, finding, timing, dependencies, assignee, lot/key ids, state, and verification.
- turnaround.ics: accepted task/access blocks with stable UIDs and UTC timestamps.
- unit-status.svg: floorplan with room/fixture ids, current overlays, selection, and accessible labels.
- handoff-packet.md: readiness by room, unresolved/waived findings, evidence hashes, custody, decisions, and revision provenance.
</core_features>

<visual_design>
- Inspect uninspected/finding/work/verified, selected/linked, reserved/issued/consumed, checked-out/returned, branch/stale/partial/ready states: distinctions stay legible.
- Linked views: Desktop links floorplan, evidence, timeline, inventory/custody, branch compare, and readiness. Tablet uses synchronized panes. Mobile uses room/fixture cards, evidence sheet, day/worker schedule, custody stepper, and handoff checklist with all actions.
- Complete at 1440/768/375 viewports: mobile locus/evidence/schedule/resource/custody/branch/handoff/export flows retain every action, 44-pixel targets, no overflow.
</visual_design>

<motion>
- Causal motion: Loci flow into task blocks; dependency and readiness paths reroute after edits; partial handoff recovery shows causal state.
- Reduced motion preserves endpoints: Select/lasso, schedule, reserve/issue, compare/merge, dispatch/verify, partial/recover, then repeat reduced, causal endpoints and values agree.
</motion>

<requirements>
- In-memory state only, NO localStorage.
- Local dependencies only: npm install or script tags loading local files, no CDNs.
- The application must serve on port 3000 via npm start with zero console/page errors.
- Interleave UI/WebMCP locus, observation/evidence, task/edge/schedule, inventory/custody, branch/approval, clock/dispatch/handoff, history, artifact, transfer, reset. State matches.
- Accessibility: Select loci, inspect evidence, schedule, reserve/custody, compare, dispatch/verify, recover handoff, and export without pointer; focus, announcements, and values match.
- Performance: Operate 10,000 units, 1,000,000 loci/observations, 100,000 tasks, and 1,000,000 events: selection/scheduling remain responsive and stale derivations cancel.
- Writing: Trigger every locus/evidence/task/resource/custody/approval/handoff conflict: copy names exact room, fixture, finding, task, lot, key, event, prerequisite, and recovery.
</requirements>

<webmcp_action_contract>
Contract:
- webmcp_session_info returns appName and version
- webmcp_list_tools returns get_state, import_state, reset_state, select_loci
- webmcp_invoke_tool handles the invocations properly
</webmcp_action_contract>
