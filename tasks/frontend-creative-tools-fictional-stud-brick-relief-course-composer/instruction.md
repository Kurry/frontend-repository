<summary>
Build a Fictional Stud-Brick Relief Course Composer built with React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod, incorporating WebMCP contract bindings. This is a frontend-only hard browser spatial editor using deterministic symbolic construction fixtures. The user drags one stable 2x4 brick one stud to the right, watches its exact support ratio, an upper brick’s support, the active course slice, elevation, support graph, parts ledger, instruction grouping, review state, and artifact digest update from one canonical geometry mutation. The user can cancel once, commit it, preview and cancel a save-time instruction repair, confirm the repair without changing geometry, approve the composition, and export an exact portable build packet.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots/: overview.png is a full-page desktop-layout overview; overview-tablet.png and overview-mobile.png are full-page responsive reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections in top-to-bottom order. Recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Feature: Course canvas and snapped brick manipulation —
- Render the active top-down course, ghosted adjacent courses, stud dots, selected brick handles, collision/support patterns, integer rulers, and optional stacked cutaway.
- Users select a brick, drag its body, rotate in quarter turns, switch course, pan/zoom, toggle top/front/side/cutaway, and use Canvas or SVG renderer.
- During drag show old/new footprints, removed/added/retained studs, bounds, collisions, incoming/outgoing support, exact fractions, reachability, affected guide group, and prospective digest.
- Keyboard mode uses Alt+Arrow to preview one-stud x/y movement, Alt+PageUp/PageDown to preview course movement, and R to preview quarter-turn rotation, all followed by the same confirmation.
- An exact-placement dialog accepts x/y/course/rotation.
- Escape cancels and returns focus to the initiating brick.
- Mobile uses a full-screen course slice, 44 px Left/Right/Forward/Back/Course/Rotate steppers, brick-pick mode, pinch/pan, and a sticky old/new geometry/support card.
- All paths commit the same mutation to the one canonical handler.

Feature: Linked support graph, matrix, and elevations —
- The top/front/side/cutaway views, support graph, brick x supporter matrix, fraction histogram, parts ledger, cell inspector, and selected edge share one selection and brush.
- Selecting a stud highlights its occupying brick, supporters, supported children, elevation cells, graph path to base, guide step, and artifact row.
- Brushing support studs cross-highlights exact contributors in every view.
- Support display always shows numerator/denominator and pattern in addition to color.
- Filters apply after complete global occupancy/support/reachability derivation, expose global versus visible counts, and never change decisions or guide validation.

Feature: Guide groups and save-time repair —
- The guide rail shows ordered steps, course spans, group membership, predecessors, part counts, support prerequisites, and validity.
- Users may create/rename/delete empty groups, move bricks between eligible groups, reorder independent steps, and preview a selected step on the model.
- A group/step edit is revision-guarded and cannot duplicate or orphan a brick.
- "Save guide" validates the entire topology. For the canonical invalid group, it presents the exact one-repair diff, changed membership/order/hashes, and explicit unchanged geometry/support/inventory.
- Cancel restores the complete invalid draft. Confirm applies once. Stale or double confirmation is rejected/idempotent with no extra event.
- A later geometry move revalidates all groups rather than trusting a saved status flag.

Feature: Decisions, history, comparison, and approval —
- Users pin checkpoints, compare them with a layer wipe and exact geometry/support/guide tables, record preferred layout/rationale/confidence/sources, annotate stable targets, and inspect event branches.
- A decision stores current geometry/support/guide/metrics hashes; moving a brick or altering a guide makes it stale without overwriting parent values.
- The review panel links each blocker to a visible brick, edge, group, step, artifact, or event.
- Approval requires the canonical move, current preferred decision, confirmed repair, note on the exact-half edge, zero collision/unsupported/disconnected/guide violations, parsed packet preview, and no unresolved blocker.
- Later mutation invalidates approval visibly and in exports.

Feature: Exact build packet, atomic import, and clean reset —
- Export only after approval. Show validation stages, ordered member names, bytes, and hashes before download.
- Import accepts the exact ZIP or brick-relief-project.json alone, validates every authored and derived field before mutation, shows incoming/current differences, and commits once after confirmation. JSON-only import recomputes derivations.
- Reset previews exact authored/session counts, preserves immutable fixture definitions only after confirmation, and returns focus to the opener. Cancelled reset and failed import change neither canonical nor view state.
</core_features>

<user_flows>
- Direct manipulation flow: Select brick-17, drag one stud right. Watch live feedback (old/new footprint, stud deltas, support fraction 6/8->4/8, brick-23 support 4/4->2/4, guide invalidation). Cancel once, restoring exact prior state (including pan/zoom/focus). Repeat and confirm.
- Alternate filter/move order flow: Choose a layout before moving brick-17. Move it. The decision becomes stale and requires explicit reconfirmation. Move before choosing records directly against current geometry. After reconfirmation, normalized model state converges while event provenance remains distinct.
- Save guide repair flow: After the brick-17 move, invoke Save guide. The model is valid, but group-arch is not legal (brick-23 is only 2/4 supported). The save dialog previews one deterministic repair: preserve group-arch with brick-17, brick-18, remove brick-23, create step-05-cap, and attach brick-23 to it. Cancel to restore draft. Reopen and confirm to resolve the violation and record evt-051.
- Atomic export/import flow: Export after approval (creates ZIP with manifest.json, brick-relief-project.json, bricks.csv, support-edges.csv, events.ndjson, course-plan.svg, elevation-support-proof.svg, build-guide.html, brick-relief-project.schema.json). Reset to a clean session. Import the exact ZIP or JSON file. Prove semantic round trip with no data loss and exact derivation match.
</user_flows>

<edge_cases>
- Out-of-bounds, overlap, below-half support, disconnected-from-base, locked brick, no-op, stale confirmation, rapid double-confirm, repair race, UI/WebMCP race, invalid annotation, failed import, and cancelled reset create zero extra canonical events.
- Error copy names the rejected brick, stud set, fraction, coordinate, hash, or revision and a recovery action.
- Brick footprints are half-open integer rectangles. Edges touch is valid (not collision).
- Same-course collision is only one guard beneath the cross-course support graph and layer guide.
</edge_cases>

<visual_design>
- Render top-down course, ghosted adjacent courses, stud dots, and support patterns.
- Clear indicators for old/new geometry and exact support fractions.
- Legible layered blueprint hierarchy; meaning never depends on color alone.
- Distinct states for valid/invalid/repairing/repaired, draft/reviewed/approved.
</visual_design>

<motion>
- The brick slides one stud, removed/added stud hatches trade places, two support meters drain to exact half, the upper dependency edge thins, and the guide group opens.
- Reduced motion preserves old/new outlines, patterns, arrows, fractions, announcements, and focus without spatial travel.
</motion>

<responsiveness>
- 1440x900 desktop split view.
- 1024x768 and 390x844 responsive reflows. Mobile uses a full-screen course slice, swipeable course/brick deck, vertical base-path inspector, bottom guide/evidence sheet, 44 px direction/course/rotate steppers, and sticky geometry/support delta card with no page overflow.
</responsiveness>

<accessibility>
- Without pointer, move focused brick-17 one stud right, inspect old/new studs/support/upper dependency, cancel and confirm, traverse course/elevation/graph/matrix/parts/guide/sources/history, decide/save-repair/approve/export.
- Geometry, fractions, errors, live deltas, and modal focus return are announced.
</accessibility>

<performance>
- At maximum fixture (100 models, 10,000 bricks, 1,000,000 stud-course cells, 50,000 support edges, 20,000 guide records, 50,000 events), drag feedback acknowledges within 100 ms, linked views settle within 500 ms, and export/import finishes within 2 seconds without dropped input, stale work, layout shift, console/page error, or non-local request.
</performance>

<writing>
- Error copy names the fictional ID, exact coordinate/stud/fraction/hash/revision or rule, unchanged-state consequence, and recovery without real structural, material, manufacturing, child-safety, assembly, load, or buildability claims.
- The build-guide.html explicitly states "SYMBOLIC FIXTURE — NOT PHYSICAL BUILDING GUIDANCE".
</writing>

<innovation>
One stud move coherently drives course occupancy, exact vertical support, an upper dependency, elevations, graph/matrix evidence, guide repair, stale decision, UI/WebMCP parity, and nine-member visual round trip under cancel and alternate order.
</innovation>

<requirements>
- Stack: Any framework (React 19 / Vite / Zustand / Tailwind v4 / Framer Motion / Zod suggested based on previous tasks).
- Implementation must follow the PRD rules for exact integer footprint (half-open rectangles), deterministic support calculations (reduced fractions), strict guide grouping validation, and identical mutation outcomes via mouse, keyboard, mobile steppers, and WebMCP.
- Maintain identical derivation for UI, artifacts, and WebMCP.
- Use a single canonical store/reducer. All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Create all 9 specified artifact files for the ZIP export.
- Pre-seed the canonical "Fictional Lantern Relief" fixture in memory.
- Good-app genre means in-memory state only, NO localStorage.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- model_and_bricks
- support_and_evidence
- guide_and_repair
- decisions_history_review
- artifacts_and_session

Module specs:
<module_spec id="model_and_bricks">
{
  "id": "model_and_bricks",
  "contract_version": "zto-webmcp-v1",
  "title": "Model and Bricks",
  "purpose": "Query and manipulate the fictional stud-brick relief model and its constituent bricks.",
  "permitted_operations": ["query_models", "select_model", "query_bricks", "query_brick", "preview_move_brick", "commit_move_brick", "cancel_move_brick", "preview_rotate_brick", "commit_rotate_brick", "set_active_course", "set_model_viewport", "set_view_mode", "set_renderer"]
}
</module_spec>

<module_spec id="support_and_evidence">
{
  "id": "support_and_evidence",
  "contract_version": "zto-webmcp-v1",
  "title": "Support and Evidence",
  "purpose": "Inspect structural support edges, occupancy, reachability, and evidence matrices.",
  "permitted_operations": ["query_stud_occupancy", "query_support_edges", "query_support_edge", "query_base_path", "set_support_brush", "select_studs", "set_support_filters", "query_support_histogram", "set_compare_checkpoint", "set_compare_wipe"]
}
</module_spec>

<module_spec id="guide_and_repair">
{
  "id": "guide_and_repair",
  "contract_version": "zto-webmcp-v1",
  "title": "Guide and Repair",
  "purpose": "Manage guide topology and save-time structural repairs.",
  "permitted_operations": ["query_guide", "query_groups", "query_steps", "create_group", "rename_group", "delete_empty_group", "move_brick_to_group", "reorder_step", "preview_save_guide", "commit_guide_repair", "cancel_guide_repair"]
}
</module_spec>

<module_spec id="decisions_history_review">
{
  "id": "decisions_history_review",
  "contract_version": "zto-webmcp-v1",
  "title": "Decisions, History, and Review",
  "purpose": "Record preferred layouts, navigate event histories, and review/approve the composition.",
  "permitted_operations": ["preview_layout_decision", "commit_layout_decision", "cancel_layout_decision", "query_sources", "add_annotation", "query_history", "undo_event", "redo_event", "switch_branch", "pin_checkpoint", "query_review", "mark_reviewed", "approve_model", "cancel_approval", "query_approval"]
}
</module_spec>

<module_spec id="artifacts_and_session">
{
  "id": "artifacts_and_session",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifacts and Session",
  "purpose": "Export portable build packets and manage the overall workbench session state.",
  "permitted_operations": ["query_artifact_manifest", "validate_packet", "export_packet", "stage_packet_import", "commit_packet_import", "cancel_packet_import", "query_session", "reset_session"]
}
</module_spec>

Bindings:
- Implement all permitted operations from the modules above.
- Tool handlers must call the same application logic as the visible UI.
- WebMCP may set up or query state but is explicitly excluded from satisfying dragging and reduced-motion rendering real browser criteria.
</webmcp_action_contract>
