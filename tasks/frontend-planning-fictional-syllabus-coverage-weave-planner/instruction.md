<summary>
Build a frontend-only Fictional Syllabus Coverage-Weave Planner using React, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, Lucide React, Zod, and JSZip. The app allows a learner to turn a fictional exam blueprint into a feasible, inspectable study plan by dragging and dropping allocation knots across session slots. The app features linked views for readiness evidence (capacity histogram, prerequisite braid, coverage matrix, blueprint rosette, feasible-vs-total coverage profile, breach/risk ledger, objective inspector, mini-calendar), branch compare, actor-aware history, rehearsal, and standalone export/import via ZIP packets. It does not use any backend. State is managed entirely in the browser using the specified APIs.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots/:
overview.png is a full-page desktop-layout overview.
compact.png is a full-page responsive reflow at 390x844 (mobile) viewport.
rehearsal.png shows the logical rehearsal flow.
compare.png shows the branch comparison feature.
They are part of this instruction: recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Feature: Coverage-weave editor
- Render objective rails on the left, a chronological session runway on the right, and allocation ribbons whose stable knots attach objectives to session subranges. Selecting a knot highlights its objective, session, minutes, order, prerequisites, and derived contribution.
- Drag KNOT-17 from SES-09 into the open 30-minute tail of SES-04; a source ghost, prospective curve, insertion tick, capacity fill, and prerequisite feed-forward appear before release.
- Valid release commits once after a confirmation sheet names the old/new session, exact minutes, utilization changes, breach delta, feasible-weight delta, and affected IDs. Cancel restores the complete snapshot and returns focus to the knot.
- Release over a commitment, outside a session, into a full slot, onto the same position, or from a stale preview animates or marks return without mutation.

Feature: Exact, keyboard, and compact reroute parity
- Keyboard users traverse objectives, ribbons, knots, and sessions in documented order; Space picks up a knot; arrow keys choose eligible destination and insertion; Enter opens the same confirmation; Escape cancels and restores focus.
- An exact editor accepts destination session ID, insertion order, and start offset in 15-minute units.
- Compact mode uses a full-width objective card, a chronological eligible-session sheet, and an exact offset stepper.
- All committed paths dispatch the same event and normalize to identical geometry and bytes.

Feature: Linked readiness evidence
- Synchronize the weave with a session-capacity histogram, prerequisite braid, objective-by-session coverage matrix, four-domain blueprint rosette, feasible-versus-total coverage profile, breach/risk ledger, objective inspector, and chronological mini-calendar.
- Selection or brushing in any view uses stable IDs and highlights the same objective, knot, session, domain, date interval, branch, and revision everywhere.
- Brush a date range on the mini-calendar to filter evidence without mutating the plan. Moving a knot while a brush is active updates hidden totals and visible in-range values without losing selection. Clearing the brush restores the complete view.
- Search finds objective title, stable ID, domain, knot ID, or note and reveals its linked position.

Feature: Invalid preview, repair, and reverse-order convergence
- Attempt to move a 45-minute knot into SES-04 after the canonical move. The preview must show 135/90, the exact 45-minute overflow, affected commitment boundary, and no claimed feasibility improvement. Confirm is disabled; cancel or outside release restores all state and appends no event.
- If an imported scenario contains an allocation before its prerequisites, Review repair proposes the earliest later eligible session with enough contiguous capacity, sorted by (start, sessionId, knotId). The repair never changes minutes or objective.
- Preview exposes every proposed move and derived delta; cancel is atomic; confirm records one batch event.
- Moving KNOT-17 before brushing versus brushing before the same move converges. Applying the canonical move before repair versus running repair when it proposes that exact move also converges after normalized history provenance.

Feature: Branch compare, author-aware history, and rehearsal
- Fork Recovery from Baseline, compare session occupancy, knot destinations, prerequisite release time, breach count, objective/domain coverage, feasible weight, and first divergence.
- History filters by actor, objective, session, knot, or operation and can replay without mutation.
- Ari-selective undo of the canonical move restores its destination and derivations while retaining Sol's later NOTE-08; redo restores the move and the same note reference.
- Rehearsal advances a deterministic cursor through sessions, marking objective minutes available only at each session's end. It blocks at the seeded breach before the reroute, completes after the reroute, and can reset/replay byte-identically. Rehearsal never edits canonical allocations.
- Approval requires zero breaches, every session at or below capacity, blueprint weights totaling 10,000, rehearsal completion, and review of all warnings. A mutation after approval makes it stale with a named reason.
</core_features>

<user_flows>
- Start with deterministic fixture content (Baseline scenario, Glass Orchard plan).
- Initial state: 1 breach, neutral ledger provenance, no completed rehearsal, no approval.
- Search/select OBJ-03.
- Brush dates on mini-calendar.
- Move KNOT-17 from SES-09 to SES-04.
- Confirm canonical move.
- Attempt to move a 45-minute knot into SES-04; provoke overflow and cancel.
- Clear brush.
- Compare Recovery branch.
- Add note.
- Perform selective undo/redo.
- Run rehearsal (reset/replay).
- Review warnings.
- Approve plan.
- Transfer the plan via export/import.
</user_flows>

<edge_cases>
- Validate all minimum, maximum, just-inside, and just-outside values for bounds, enums, format, uniqueness, ordering, weight-sum, graph, capacity, and cross-field rules.
- Test minutes 0/15/120/135.
- Test session durations 15/30/240/255.
- Test objective target 0/15/600/615.
- Test weight 99/100/4000/4001.
- Test same/full/committed/outside/stale/no-op/double move.
- Test prerequisite cycles.
- Cancel repair.
- Stale approval.
- Corrupt CSV/ICS/SVG/hash imports.
- Every rejection preserves exact state. Correcting one fault clears only that fault.
</edge_cases>

<visual_design>
- At 1440x900, inspect fresh, selected, pickup, prospective, canonical, overflow, brushed, compared, rehearsing, and approved states.
- The weave remains the visual thesis.
- Objective, session, domain, capacity, and feasibility are legible without relying on color alone.
</visual_design>

<motion>
- Sample pickup, canonical travel, linked load/braid/rosette reconciliation, invalid return, undo/redo, and rehearsal at early and settled frames.
- Reduced motion uses immediate placement, before/after anchors, signed numeric deltas, patterns, and causal announcements, removing animations.
</motion>

<responsiveness>
- At 390x844 (compact mode), complete the exact canonical reroute.
- Objective-focused ribbon strip and chronological session sheet replace the wide weave.
- Evidence becomes linked cards.
- Exact controls remain primary.
- Compare/rehearsal/approval/export remain reachable without overflow.
- No page-level overflow or targets below 44x44 CSS pixels.
</responsiveness>

<accessibility>
- Without pointer input, find and pick up KNOT-17, choose SES-04 and offset, confirm, brush, inspect deltas, cancel overflow, compare, undo/redo, rehearse, approve, and export.
- Keyboard traversal covers objectives, ribbons, knots, and sessions. Space picks up, arrow keys navigate, Enter confirms, Escape cancels.
- Focus trap and return for modals.
- Announcements for dynamic changes.
- Event, hash, and files equal pointer use.
</accessibility>

<performance>
- At the maximum declared fixture (1,000 objectives, 2,000 sessions, 20,000 knots, 5,000 prerequisite edges, 10,000 notes, 20,000 events):
- Acknowledge manipulation within 100 ms.
- Settle linked derivations within 500 ms.
- Finish import/export within 2 seconds.
- No dropped input, layout shift, console/page error, or nonlocal request.
</performance>

<writing>
- Error copy names the stable entity, field/relation, rejected value or rule, unchanged-state result, and valid recovery.
- No educational promises.
</writing>

<innovation>
- One stable knot reroute reconciles ribbon geometry, temporal prerequisite release, session capacity, objective/domain coverage, feasible blueprint weight, branch/history, rehearsal, WebMCP, and standalone proofs through one canonical model.
</innovation>

<requirements>
- Render an objective/session weave with ribbons representing allocations.
- Implement dragging of knots to reroute allocations with prospective feedback (curve, capacity fill, prerequisite feed-forward).
- Provide a confirmation sheet upon releasing a knot, showing deltas.
- Enforce that a valid release correctly updates capacity, coverage, and feasibility metrics.
- Support compact (mobile) mode with full-width objective cards, session sheets, and exact stepper controls.
- Support full keyboard operability for reroutes.
- Sync state across all readiness evidence views (histogram, braid, matrix, rosette, profile, ledger, calendar).
- Disallow invalid reroutes (e.g., overflows) with proper preview and atomic cancellation.
- Support branch comparison (Baseline vs Recovery) and actor-aware undo/redo.
- Rehearsal must chronologically evaluate availability without mutating actual allocations, requiring zero breaches for approval.
- Import/Export must use a strict ZIP packet format containing these files: study-plan.json, session-allocations.csv, blueprint-coverage.csv, study-schedule.ics, coverage-weave.svg, readiness-report.md, and manifest.json.
- Strict validation on JSON and ZIP imports, rejecting all invalid schemas, ID conflicts, overflows, or graph cycles.
- Persist committed plan state, active branch, selection, viewport, brush, notes, rehearsal checkpoint, approval, and proof state locally.
- Do not persist transient UI states (hover, drag ghosts, invalid previews, etc.).
- Never use local storage or other browser storage; use only in-memory state.
- Use fictional-syllabus-weave/1.0 schema for study-plan.json. No CDN or external network calls are allowed; all dependencies must be installed via npm.
</requirements>

<integrity>
- Do not make external network requests for data or logic.
- Do not include generated content or any real educational data.
- Do not spoof or bypass the WebMCP tools or Playwright tests.
</integrity>

<delivery>
- Submit solution/app with standard npm start (port 3000).
- Zero console/page errors.
- One WebM (VP9) walkthrough evidence.webm.
- Thirteen fully fleshed out dimension TOMLs.
</delivery>

<webmcp_action_contract>
Bindings:
- get_fixture, get_state, get_derived, and get_artifact_preview expose clean fixture, canonical state, formulas, hashes, and pending files.
- move_allocation, preview_allocation, and cancel_preview cover canonical and invalid transaction state while preserving the same event rules as UI.
- set_brush, select_entity, search_entities, and set_workspace cover linked view state.
- preview_repair, commit_repair, and cancel_repair cover deterministic batch repair.
- fork_scenario, compare_scenarios, append_note, selective_undo, selective_redo, and seek_history cover branch and author provenance.
- start_rehearsal, step_rehearsal, reset_rehearsal, review_warning, and approve_plan cover completion gates.
- export_packet, import_json, import_packet, and reset_session cover transfer and isolation.

Implementation:
- Implement window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool.
- WebMCP actions must use the identical underlying reducer as the React components.
- Tool handlers must validate schemas (e.g. Zod) and return identical success/error outputs as specified.
</webmcp_action_contract>
