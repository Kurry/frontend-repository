<summary>
Build a Fictional Capsule-Vending Spiral Refill Planner using React 19, Vite, Zustand, Tailwind CSS 4.3.2, and framer-motion. The app is a hard browser spatial queue and rehearsal planner for a fictional display-machine curator arranging invented color capsules to satisfy a scheduled vend sequence. It must implement deterministic Archimedean spiral geometry, linked state across 11 views, scenario branching, history, actor-selective undo, and output exactly 10 standalone artifacts including a zip with a standalone HTML proof.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots/. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Spiral refill stage and invalid-return recovery —
- Render three spiral tracks (A, B, C), bay arcs/centers, queue direction, next-vend gate, occupied patterns, gaps, tray capsules, snap halos, selected lineage, and issue markers
- Dragging CAP-17 shows its origin ghost, target bay, insertion ray, prospective queue/profile/inventory/rehearsal deltas, accepted variant, and exact snap distance before commit
- Canonical release opens one confirmation sheet with old/new Track A, demand offset 4, counts, queue hash, and artifacts. Confirm commits once
- Cancel, Escape, double confirm, occupied bay, wrong track/variant, no-op tray, outside 18-unit snap, locked or stale capsule, stale gap, noninteger exact bay, pointer outside stage, and cross-session drag restore tray coordinate, selection, viewport, brush, playhead, focus, hashes, approval, and event count. Invalid return follows the insertion ray back rather than disappearing
Feature: Exact, keyboard, and compact refill editing —
- Tracks and bays use roving tabindex in track then bay order. Arrow keys move between bays; Home/End choose front/rear; Enter opens the exact insertion sheet
- Selecting CAP-17, choosing Track A and bay 3, and confirming creates the same event, geometry, order, profile, inventory, rehearsal forecast, selection, persistence, and normalized artifact bytes as pointer insertion
- At 390x844, the desktop machine/tray/evidence desk becomes one zoomable track focus with a vertical bay rail. Tray, Queue, Demand, and Proof are mutually exclusive bottom sheets. An exact track/bay picker and large Insert control replace precision dragging
Feature: Linked queue, profile, inventory, and issues —
- Spiral stage, linear queue ribbon, brushed demand timeline, target-versus-covered variant profile histogram, coverage band, inventory ledger, issue graph, history, and packet preview share one stable-ID model. Selecting a capsule, bay/gap, demand offset, profile bin, inventory row, issue, event, or artifact record highlights the same capsule/bay/variant/provenance everywhere
- Brush any contiguous demand window of 1..24 logical vends; the profile recomputes variant counts, modal variant with stable enum tie-break, coverage, gap/mismatch offsets, and affected tracks without mutating the plan
- Canonical insertion while the eight-vend brush is active changes exact linked deltas once
- Filter/sort after insertion retains selected CAP-17 or shows an explicit filtered-selection state; deleting/restoring an eligible tray capsule never leaves stale detail
Feature: Rehearsal, gap propagation, and compaction preview —
- The deterministic rehearsal runs on an isolated copy through ready→load→advance→present→verify→mark. Step one vend, one track cycle, or to next issue. At each Track A vend, the capsule moves to the fictional output rail while later occupied bays advance toward index 0; stable canonical identities and source-bay provenance remain visible. Reset restores the exact authored plan and creates no inventory mutation
- Preview compact gaps for selected tracks. The deterministic algorithm sorts occupied capsules by current bay and moves each to the lowest available bay, preserving relative order, capsule IDs, and variants. Canonical fixture compaction is invalid because it would move CAP-A04 into gap 3 and leave the required indigo absent; preview shows origin/destination ghosts and demand regression. Cancel restores selection, brush, playhead, viewport, focus, proof, and history. A valid confirm records one event; locked capsules or demand regression prohibit partial commit
Feature: Scenario branches, actor history, comments, and approval —
- Variants Baseline and Resolved share machine geometry and stable fixture entities but store occupancy, brush, comments, rehearsal events, and approval independently. Compare aligns capsule/bay IDs and shows signed occupancy, variant-profile, coverage, mismatch, consecutive-vend, inventory, issue, rehearsal, and artifact-hash deltas. Brushing a delta selects its linked track geometry
- Sol then anchors comment COMMENT-06 keep indigo at vend four to GAP-A-03/CAP-17. Selectively undoing Ari's insertion returns CAP-17 to its exact tray position and reopens the gap while preserving Sol's comment ID, text, actor, logical time, gap provenance, capsule reference, and visible anchor. Redo/reapply restores the plan without duplicating the comment. Editing after undo forks history and retains the abandoned future with hashes
- Reviews use needs-work|ready|accepted-fictional with optional 0–240 character note. Any occupancy, demand alternative, compaction, variant, comment resolution, or import mutation stales approval. Approval requires contiguous active queues or explicit accepted gaps, inventory conservation, full brushed demand coverage, zero unresolved issue, current verified rehearsal, one resolved comment, confirmed scenario comparison, and validated packet preview
Feature: Atomic import and independent proof —
- Import accepts plan.json alone or the exact ZIP. It parses all files/records/fields, presents machine/queue/profile/inventory/rehearsal/history diffs, and commits only after confirmation
- Cancel or any contradiction leaves the current plan byte-for-byte unchanged including selection, viewport, brush, playhead, filters, focus, branch, approval, persistence, and event count
- The exported proof.html opens without network access or app CSS. Keyboard users choose tracks/bays/capsules, brush demand, inspect profiles/inventory/issues, step/reset the rehearsal, compare Baseline/Resolved, traverse comments, and view the canonical before/after insertion
</core_features>

<user_flows>
- Pointer, exact-value, keyboard, compact touch, and declared WebMCP paths must converge on one canonical event with identical capsule/bay IDs, geometry, queue order, demand coverage, inventory totals, selection, history anchor, persisted state, and normalized artifact bytes.
- Exercise fill-before-brush and brush-before-equivalent-fill, cancel after a transient compaction preview, selective undo followed by a branch, comment before/after undo, rehearsal reset/replay, reload, and import after divergent edits. Equivalent committed orders converge; canceled/rejected paths restore occupancy, selection, playhead, viewport, filters, focus, proof, approval, and history anchor.
- Export a ten-file packet whose standalone HTML proof reproduces the plan.
</user_flows>

<edge_cases>
- Validate every import record and file before mutation. Report all missing/extra files, unknown enums, exact-bound failures, duplicate/dangling IDs, impossible bay occupancy, stale queue/profile/rehearsal derivations, inventory imbalance, invalid history, and cross-file hash/geometry disagreement together. Any error preserves the current project.
- Test exact minimum, maximum, just-inside, and just-outside values for every bound plus enum, format, uniqueness, ordering, and cross-field rules. Errors identify stable entity, field/relation, rejected value or rule, unchanged state, and recovery; fixing one fault clears only that fault.
</edge_cases>

<visual_design>
- Preserve all user-authored structure in the useful artifact: stable track/bay geometry, capsule identity/order, pattern/variant, tray position, demand brush, comments, scenario branch, selection/viewport, rehearsal playhead/events, actor history, approval, and proof state.
- Regenerate only declared timestamps and directly dependent manifest hashes.
</visual_design>

<motion>
- Acknowledge manipulation within 100 ms, settle linked views and derivations within 500 ms, and finish import/export within 2 seconds without stale selection, dropped input, layout shift, console/page error, or nonlocal request.
</motion>

<responsiveness>
- Grade real pointer actionability and computed hover, keyboard traversal/shortcuts, sheet focus trap/opener return, live announcements, non-color evidence, early/settled causal motion, reduced-motion parity, and the complete 390x844 flow without page overflow or targets below 44x44 CSS pixels.
</responsiveness>

<accessibility>
- Tracks and bays use roving tabindex in track then bay order. Arrow keys move between bays; Home/End choose front/rear; Enter opens the exact insertion sheet.
- Reduced motion replaces spiral advance with numbered before/after queue cards, playhead, capsule IDs, variants, source/target bays, coverage, inventory conservation, and live phase text.
</accessibility>

<performance>
- At the maximum fixture (100 tracks, 1,200 bays, 1,000 tray capsules, 5,000 demand offsets, 5,000 issues/comments, and 20,000 events), acknowledge manipulation within 100 ms, settle linked views and derivations within 500 ms, and finish import/export within 2 seconds without dropped input or resource growth.
</performance>

<writing>
- All machines, capsules, colors, schedules, dimensions, and actors are invented deterministic fixtures. The task contains no real vending mechanism, inventory recommendation, food/product data, pricing, safety guidance, or commercial artwork.
</writing>

<innovation>
- One capsule insertion reconciles spiral geometry, ordered queue, brushed profile, demand coverage, inventory conservation, issue topology, rehearsal forecast, actor history, WebMCP, and standalone proof through one stable-ID model.
</innovation>

<requirements>
- Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies.
- The plan is the would-be request body for the API state.
- Download prism-parade-spiral-refill.zip containing exactly: plan.json, plan.schema.json, capsules.csv, vend-sequence.csv, inventory.csv, track-proof.svg, demand-proof.svg, proof.html, transcript.md, manifest.json.
- Each track is a deterministic Archimedean spiral with center (cx,cy), base radius 52, radial step 9 per bay, and bay angle theta=bayIndex*30. Bay center is x=cx+(52+9*bayIndex)*cos(theta), y=cy+(52+9*bayIndex)*sin(theta).
- Capsules are 32-unit circles and may occupy at most one stable bay. Track capacity is exactly 12.
- Track A centers at (270,300).
- The brushed fixture demand window DEMAND-A-01 requires Track A variants [coral,indigo,coral,indigo,coral,indigo,coral,indigo] at logical vend offsets 1..8.
- Tray capsule CAP-17 is indigo, radius 16, at tray coordinate (980,180), revision 2, actor Ari.
</requirements>

<integrity>
- Persist committed plan, branch, selection, viewport, brush, comments, rehearsal mark, approval, and proof state. Never persist hover, drag ghosts, open sheets, invalid drafts, transient compaction, active animation, or focus rings. Failed imports and separate sessions cannot leak state.
- Zero partial mutation on validation/import failure.
</integrity>

<delivery>
- Complete the whole job inside solution/app.
- Must run on port 3000 via npm start.
- Do not edit any registry files like webmcp-task-sources.json.
</delivery>

<webmcp_action_contract>
- get_refill_session, get_machine, list_tracks, get_track, list_capsules, get_capsule, get_queue, get_demand_profile, get_inventory, get_issues, get_history, get_artifact_preview
- set_selection, set_viewport, set_demand_brush, set_compare_brush
- preview_insertion, confirm_insertion, remove_capsule, restore_capsule
- start_rehearsal, step_rehearsal, reset_rehearsal, mark_rehearsal, preview_compaction, confirm_compaction, cancel_compaction
- fork_scenario, compare_scenarios, add_comment, resolve_comment, review_track, undo_actor_event, redo_actor_event, fork_branch, approve_plan
- validate_import, confirm_import, cancel_import, export_packet
</webmcp_action_contract>
