<summary>
Build a symbolic shadowbox composition workbench using React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod. The user drags one stable cutout from depth slot 2 to slot 4, scrubs a three-stop parallax viewer, and watches projected geometry, an occlusion raster, directed overlap weights, visibility bands, depth-stack membership, spacer markers, assembly prerequisites, comparison state, review blockers, and artifact digests update from one guarded mutation. The user cancels once, repeats and confirms, records why the balanced reveal is preferred, annotates the exact occlusion edge, approves the scene, and exports a portable depth packet.

This is a local, in-memory frontend application (no localStorage, no backend). All imports must be local npm dependencies; no remote CDNs are allowed.
</summary>

<core_features>
Feature: Perspective stage and depth-rail manipulation
Open the clean fictional scene Symbolic Window containing 18 stable rectilinear cutouts across seven discrete depth slots on an 800x500 logical board.
Render the current projected scene, discrete depth rail, old and new ghost silhouettes, world-position anchors, viewer-stop ruler, center-view lock marker, projected bounds, overlap hatching, and selection.
Users select cutouts, drag between slots, edit world rectangles within bounds, pan and zoom, spread and collapse the stack, scrub the viewer, and switch SVG and Canvas renderer.
Parallax depth-rail manipulation: select cutout-07 (world [300,420)x[180,300), slot 2) and drag its depth token down the exploded rail from slot 2 to 4 without moving the world silhouette.
During the gesture, show old and new rail positions, projected rectangles at viewer offsets -40, 0, +40, old and new parallax traces, the invariant center projection, directed overlap with cutout-12, visibility bands, slot occupancy, spacer count, assembly-step reassignment, preferred-decision freshness, and prospective packet digest.
Release at slot 4 and inspect a revision-guarded confirmation naming old and new slots, all three projected bounds, exact overlap and visibility vectors, invariant center overlap, minimum visibility at approval boundary, spacer and step changes.
Cancel once. Depth and view states return exactly.
Repeat and confirm. Mutates depthSlot 2 to 4.

Feature: Linked parallax and occlusion evidence
Synchronize perspective stage, three-stop contact sheet, continuous parallax trace, exploded depth stack, occlusion raster, directed edge graph, cutout by cutout by stop matrix, visibility bands, selected-overlap inspector, and proof preview.
Brush overlap rectangles to see matching fixed-point cells highlighted everywhere.
Projection uses eighth-unit fixed point. Intersect projected half-open rectangles deterministically for occlusion.
Update visibility bands, slot occupancy, directed overlap weights, and spacer markers.
Filters apply after global evaluation.

Feature: Depth sheets, spacers, and assembly plan
Depth sheets show ordered cutout membership, derived spacer markers, visibility prerequisites, predecessor steps.
The canonical move reassigns cutout-07 to the slot-4 sheet and step and creates markers spacer-cutout-07-2 and spacer-cutout-07-3.
Assembly steps are a strict acyclic order.

Feature: Comparison, decisions, history, and approval
Pin and compare Shallow Draft and Balanced Reveal with an aligned wipe and signed deltas.
Record preferred layout, rationale, confidence, sources, annotate stable evidence, selectively undo bookmark.
Review links blockers. Approval requires canonical depth move, preferred decision, note on edge, minimum visibility exactly or above 2000, zero conflicts.

Feature: Exact depth packet, atomic import, and clean reset
Export ZIP: manifest.json, shadowbox-project.json, cutouts.csv, occlusion-stops.csv, events.ndjson, parallax-stage.svg, depth-assembly-proof.svg, viewer-card.html, shadowbox-project.schema.json.
Import accepts ZIP or JSON alone, validates before mutation, reports diagnostics, and commits atomically.
Reset previews counts, restores fixture definitions, returns focus to opener.
</core_features>

<user_flows>
Scene select -> depth preview/cancel -> depth commit -> viewer scrub/edge inspect -> prefer layout -> alternate-order comparison -> edge note/bookmark undo -> step/review/approve -> exact export/import with no precredited work.
</user_flows>

<edge_cases>
Test rectangle/slot/offset minima/maxima, just-outside values, slots 3/4/5.
Same-depth edge-touch vs one-eighth overlap, projected board edge, hidden selected edge.
Locked/no-op/stale/double confirm, decision-before-move, corrupt each member, reset cancel.
</edge_cases>

<visual_design>
Inspect clean/selected, idle/hover/lift/between-slot/snap/disallowed/same-depth-return/confirmed states.
Ensure the cut-paper depth thesis stays legible and z-order/visibility never depend on color alone.
</visual_design>

<motion>
Early/settled slot travel, center lock, endpoint divergence, overlap rebalance, visibility convergence, spacer insertion, step reassignment.
Reduced motion: keeps old/new outlines, tethers, patterns, fixed values, focus, announcements without spatial travel.
</motion>

<responsiveness>
At 1440x900, 768x1024, and 390x844: perform real depth preview/confirm, scrub/overlap inspection, review/export through desk/tabs/full stage/vertical rail/swipe cards/delta sheet with 44px targets and no page overflow.
</responsiveness>

<accessibility>
Keyboard parity: without pointer, pick up cutout-07, preview slot 4, inspect center invariant, cancel and confirm, traverse stops, decide/note/approve/export.
Geometry, errors, deltas, and focus return are announced.
</accessibility>

<performance>
Process depth move, global projection, union visibility, filter/brush, compare, export/import within budget (100/500/2,000 ms) while cancelling stale work and retaining selection/scroll.
</performance>

<writing>
Failures: copy names fictional ID, slot, half-open bounds, hash, revision, unchanged-state consequence, and recovery without real paper or optics claims.
</writing>

<innovation>
One depth-rail mutation preserves world and center geometry while coherently changing endpoint parallax, half-open occlusion, union visibility, assembly membership, decision freshness, UI/WebMCP state, and nine-member round trip under cancel and alternate order.
</innovation>

<requirements>
Eighth-unit projection formula xFixed8 is x times 8 minus u times depthSlot. Y does not shift.
Half-open occlusion intersection and union visibility computation.
Canonical slots 2 to 4 overlap vector changes 1200, 2400, 3600 to 2000, 2400, 2800.
WebMCP bindings expose state mutation and query identical to UI operations.
The state must be entirely in-memory, no localStorage.
All resources must be local; no CDN usage is permitted.
</requirements>

<webmcp_action_contract>
- scene_and_depth_stage: query_scenes, select_scene, query_cutouts, query_cutout, preview_set_depth_slot, commit_set_depth_slot, cancel_set_depth_slot, preview_set_world_rect, commit_set_world_rect, cancel_set_world_rect, set_viewer_offset, set_stage_viewport, set_stack_spread, set_renderer
- projections_and_occlusion: query_projections, query_projection, query_occlusion_edges, query_occlusion_edge, query_visibility_bands, query_overlap_union, set_occlusion_brush, select_overlap, set_occlusion_filters, set_compare_stop, query_renderer_proof
- depth_sheets_and_assembly: query_depth_sheets, select_depth_sheet, rename_depth_sheet, query_spacer_markers, query_assembly_steps, reorder_assembly_step, preview_assembly_step, query_blockers
- decisions_history_review: preview_layout_decision, commit_layout_decision, cancel_layout_decision, query_sources, add_annotation, query_history, undo_event, redo_event, switch_branch, pin_checkpoint, set_compare_checkpoint, set_compare_wipe, query_review, mark_reviewed, approve_scene, cancel_approval, query_approval
- artifacts_and_session: query_artifact_manifest, validate_packet, export_packet, stage_packet_import, commit_packet_import, cancel_packet_import, query_session, reset_session
</webmcp_action_contract>
