<summary>
Fictional Pocket-Notebook Page-Budget Planner where users allocate a fixed 96-page pocket notebook across six personal sections before a four-week project. A single gesture changes physical section geometry and forecast semantics while page identity, contiguity, index destinations, linked selection, history, persistence, UI/WebMCP parity, and exact artifacts remain coherent. Built with React, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod.
</summary>

<reference_screenshots>
Reference screenshots are not provided. Use the description to determine the visual design.
</reference_screenshots>

<core_features>
Start with deterministic fixture sections, forecasts, and illustrative entry stubs but no credited reallocation, repaired issue, verified rehearsal, approval, export, or completed result. Every milestone follows its real UI action and appends the specified event exactly once.

Pointer, exact-value, keyboard, compact touch, and declared WebMCP paths converge on one canonical event with identical boundary/page/section IDs, ranges, page ownership, coverage, overflow, index destinations, selection, history anchor, persisted state, and normalized artifact bytes. Invalid, canceled, no-op, stale, repeated, and double-confirmed operations append no event.

Exercise move-before-brush and brush-before-equivalent-move, cancel after transient repair preview, selective undo followed by a branch, comment before/after undo, rehearsal reset/replay, reload, and import after divergent local edits. Equivalent committed orders converge; canceled/rejected paths restore allocation, selection, viewport, demand brush, rehearsal cursor, filters, focus, proof, approval, and history anchor.

Validate every import file, record, page, relationship, derived forecast, index destination, and hash before mutation. Report all missing/extra files, bad bounds, unknown enums, duplicate/dangling IDs, gaps, overlaps, noncontiguous ownership, wrong parity, stale profile/overflow/index values, broken history, and manifest disagreement together. Any error preserves the current project byte-for-byte.

Preserve all user-authored structure in the useful artifact: stable section order and page ranges, boundary positions, per-page ownership, entry anchors, demand brush, comments, branch, selection/viewport, rehearsal cursor/events, actor history, approval, and proof state. Regenerate only declared timestamps and directly dependent manifest hashes.

Persist committed plan, branch, selection, viewport, brush, comments, rehearsal mark, approval, and proof state. Never persist hover, drag ghosts, open sheets, invalid range drafts, repair ghosts, active animation, or focus rings. Separate sessions and failed imports cannot leak state.
</core_features>

<user_flows>
Begin with a clean fictional 96-page notebook plan whose Field notes section has 20 pages against a deterministic 28-page forecast while Reference has eight pages of spare capacity.
Drag the shared boundary handle from after page 68 to after page 76, watch exactly pages 69-76 transfer.
Verify that the stacked book, numbered page map, demand profile, overflow ribbon, index pagination, remaining-capacity gauge, issue graph, scenario comparison, history, and packet preview converge.
Reject an overlapping repair preview, preserve a later comment through actor-selective undo/redo, rehearse four weeks of page consumption, approve the allocation, and export a ten-file packet whose standalone HTML proof reconstructs the plan.
</user_flows>

<edge_cases>
Test exact minimum, maximum, just-inside, and just-outside values for every bound plus enum, uniqueness, sort order, page conservation, parity, and cross-field rules. Errors identify stable entity, field or relation, rejected value/rule, unchanged state, and recovery; correcting one fault clears only that fault.
</edge_cases>

<visual_design>
Render the closed notebook, 96 numbered fore-edge lines, six patterned section bands, five handles, fixed Index cap, allocation ticks, entry anchors, selected lineage, and issue markers.
At 1440x900, the patterned 96-line notebook and section bands dominate while page map, demand/profile, index, issues, rehearsal, and history form a deliberate planning desk.
</visual_design>

<motion>
Dragging a boundary shows origin ghost, target spread, transferring page fan, old/new section ranges, coverage/overflow/spare deltas, affected index anchors, and exact snap distance before commit.
Invalid return visibly refans pages back to their original section.
Reduced motion replaces page fanning/turning with numbered before/after range cards, page transfer list 69-76, daily cursor, section/page IDs, coverage, overflow, index changes, conservation totals, and live phase text.
At the maximum fixture, acknowledge manipulation within 100 ms, settle linked derivations within 500 ms, and finish import/export within 2 seconds without stale selection, dropped input, layout shift, console/page error, or nonlocal request.
</motion>

<responsiveness>
At 390x844 the desktop book/profile desk becomes one focused section card with a vertical spread meter.
Pages, Demand, Index, and Proof are mutually exclusive bottom sheets.
A large stepper and exact Move boundary control replace precision dragging while using the same reducer.
Other sections become swipe cards with allocation/forecast rings; every target is at least 44x44 and the page never scrolls horizontally.
</responsiveness>

<accessibility>
Grade real pointer actionability and computed hover, keyboard traversal/shortcuts, confirmation focus trap and opener return, live announcements, non-color evidence.
Sections and boundaries use roving tabindex in page order. Arrow keys move one two-page spread; PageUp/PageDown move four spreads; Home/End choose the nearest legal extreme; Enter opens the exact allocation sheet.
Selecting a boundary via keyboard, entering an after page, and confirming creates the same event, ranges, page ownership, profile, issue, index, selection, persistence, and normalized artifact bytes as pointer dragging.
</accessibility>

<performance>
With 10000 pages, 500 sections, 20000 entries, 10000 demand rows, 5000 issues/comments, and 20000 events, move one visible boundary and scrub 100 rehearsal/history states; acknowledgement stays under 100 ms, views settle under 500 ms, and import/export finishes under 2 seconds without dropped input or resource growth.
</performance>

<writing>
Trigger boundary, parity, length, conservation, ownership, forecast, rehearsal, repair, history, approval, and import faults; copy names stable entity/field/relation, rejected value or exact fictional rule, unchanged state, and recovery without real productivity or stationery claims.
</writing>

<innovation>
One boundary movement reconciles spatial page geometry, conserved identity, demand coverage, overflow/spare, index pagination, issue provenance, rehearsal, actor history, WebMCP, and standalone proof through one stable-ID model, capturing aspects not covered elsewhere and providing verifiable evidence.
</innovation>

<requirements>
Initial State: Plan PLAN-01 Amber Pocket Book has pages PAGE-001..PAGE-096, six ordered sections, five boundaries (four movable and the fixed boundary before Index), 34 fictional entry stubs, a four-week demand fixture, two actors Ari|Sol, five comments, 36 retained history events, and no verified rehearsal, approval, export, or completion credit.
Page Conservation: Pages are conserved stable entities numbered 1..96. Sections partition all pages into inclusive contiguous ranges with no gap or overlap. Adjacent ranges meet exactly.
Section Rules: Every nonfixed section has an even length 4..48 and begins on an odd page; its end is even. Index is fixed at pages 93-96 and cannot move.
Boundary Interaction: A boundary handle center is 700, 72+afterPage*5.20. Release within 10 units of a valid even-page center snaps; page rectangles, section bands, boundary handles, index anchors, brush projection, and SVG serialize coordinates to two decimals.
Initial Demand/Allocation:
SEC-01 Capture: 1-12 (Allocated 12, Demand 12)
SEC-02 Tasks: 13-28 (Allocated 16, Demand 16)
SEC-03 Projects: 29-48 (Allocated 20, Demand 20)
SEC-04 Field notes: 49-68 (Allocated 20, Demand 28) -> Overflow: 8
SEC-05 Reference: 69-92 (Allocated 24, Demand 16) -> Spare: 8
SEC-06 Index: 93-96 (Allocated 4, Demand 4)
Forecast/Index: The fixture forecast is derived from 28 immutable daily demand rows whose pageCount values are integers 1..8 and whose per-section totals equal the table. Each row references one of 28 forecast entry IDs; six additional existing entry stubs make the 34-entry index fixture.
Canonical Move: Boundary BOUNDARY-04 lies between Field notes and Reference after page 68. The canonical mutation drags it downward to after page 76. The preview shows pages 69-76 fanning from Reference to Field notes, old/new ranges, signed coverage/spare changes, index destinations, affected entries, packet hashes, and exact pointer distance. Confirmation commits one allocation.boundary-moved event.
Linked Brush/Profile: Brush any contiguous day range 1..28. The profile recomputes demand, coverage, overflow, spare, modal section using stable section-order tie-break, affected entries, and page-exhaustion day without mutating allocation. Canonical movement while days 1..28 are brushed changes exact linked deltas once.
Rehearsal: The deterministic rehearsal runs on an isolated allocation copy through ready to open-page to write-entry to advance to exhaust-or-complete to mark. Step one day, one demand row, or to next exhaustion. Within a day, demand rows order by section then entry ID; a row consumes its exact pageCount consecutive lowest unused pages in that section.
Repair Preview: Paste or stage a deliberately invalid plan. Preview structural repair proposes the deterministic smallest edit: preserve fixed Index and section order, set each nonfixed start to previous end+1, preserve its declared even length where possible, then shrink from the final nonfixed section backward to fit page 92 while respecting 4..48. Preview renders old/new ghosts, changed pages, range diffs, and resulting demand effects. Cancel mutates nothing. Confirmation creates exactly one repair event only when all resulting ranges are contiguous, parity-valid, and page-conserving.
Branches/History/Comments: Baseline and Rebalanced branches share stable fixture pages, demand, and entry IDs but store ranges, brush, comments, rehearsal, and approval independently. Compare aligns page and boundary IDs and shows signed allocation, demand coverage, overflow, spare, exhaustion day, index destination, issue, rehearsal, and artifact-hash deltas. Ari authors the canonical move. Sol then anchors COMMENT-06 reserve pages 69-76 for field notes to BOUNDARY-04 and pages 69-76. Selectively undoing Ari move returns the boundary to 68, pages 69-76 to Reference, and reopens ISSUE-04 while preserving Sol comment ID, text, actor, logical time, page references, and visible orphan/provenance anchor.
Ten-Artifact Export: Download amber-pocket-page-budget.zip containing exactly 10 specified files.
plan.json
plan.schema.json
sections.csv
pages.csv
index.md
page-map.svg
demand-proof.svg
proof.html
transcript.md
manifest.json
The application must use npm-local dependencies; no CDN or external network requests are allowed during execution.
</requirements>

<integrity>
Never persist hover, drag ghosts, open sheets, invalid range drafts, repair ghosts, active animation, or focus rings.
Separate sessions and failed imports cannot leak state.
</integrity>

<delivery>
The frontend application must be served from the solution/app directory.
The UI should be robust and error-free without any network dependencies.
Evidence.webm should accurately demonstrate the canonical move and verification steps.
</delivery>

<webmcp_action_contract>
Read: get_page_budget_session, get_plan, list_sections, get_section, list_pages, get_page, get_demand_profile, get_index, get_issues, get_history, get_artifact_preview.
Selection/view: set_selection, set_viewport, set_demand_brush, set_compare_brush.
Allocation: preview_boundary_move, confirm_boundary_move, cancel_boundary_move, preview_structural_repair, confirm_structural_repair, cancel_structural_repair.
Rehearsal: start_rehearsal, step_rehearsal, reset_rehearsal, mark_rehearsal.
Scenario/review/history: fork_scenario, compare_scenarios, add_comment, resolve_comment, review_plan, undo_actor_event, redo_actor_event, fork_branch, approve_plan.
Transfer: validate_import, confirm_import, cancel_import, export_packet.
</webmcp_action_contract>
