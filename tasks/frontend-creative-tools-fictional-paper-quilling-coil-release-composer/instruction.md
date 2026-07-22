<summary>
Build a symbolic paper-coil composition workbench. The user pulls one selected coil's release handle outward by exactly 10 board units, watches its sampled spiral, radial-spacing profile, footprint, nearest-gap ruler, contact graph, motif connectivity, assembly readiness, strip ledger, comparison, review, and artifact preview update from one guarded mutation, cancels once, repeats and confirms, records why the newly connected motif is preferred, annotates the exact tangent contact, approves the composition, and exports a portable sample packet. Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2, Zod.
</summary>

<reference_screenshots>
Screenshots are not provided for this task. Build exactly to the logical rules.
</reference_screenshots>

<core_features>
Feature: coil stage and release-handle manipulation —
- Render a crisp logical board with sampled coil paths, release disks, centers, inner guides, end handles, contact points, motif hull hints, rulers, snap ticks, selection, and old/new ghosts.
- Users select, pan/zoom, move a coil body, edit release radius, switch SVG/Canvas renderer, and open an exact geometry sheet.
- The radius preview exposes current/attempted parameter, fixed-point curve hash, bounds, nearest pair, gap/tangent/overlap relation, contact point, motif consequence, invariant token/allocation, and prospective event.
- Keyboard users press Enter on a focused handle to enter preview mode, use Alt+Left/Right to change radius by 5 without committing, and press Enter once to confirm or Escape to cancel.
- Exact sheet accepts centerX/centerY/innerRadius/releaseRadius/turnCount/phase/winding with per-field diagnostics.
- Mobile uses a full-screen coil close-up, horizontal release ruler, 44 px -5/+5 steppers, center-direction pad, and sticky old/new geometry/contact card.
Feature: linked radial, contact, and renderer evidence —
- Synchronize board/close-up, radial-spacing profile, sampled-vertex table, nearest-gap strip, contact graph, coil×coil adjacency matrix, motif component map, strip ledger, and proof preview.
- SVG and Canvas use identical fixed-point samples and logical bounds. A renderer checksum covers ordered coil IDs, sample IDs/coordinates, contact points, and selected state.
Feature: motifs and assembly sequence —
- Motif cards show member coils, contact components, exact tangent prerequisites, overlaps, blockers, and referenced assembly steps.
- Users may create/rename motifs, move an eligible coil between motifs, reorder independent steps, and preview a selected step on the board.
Feature: comparison, decisions, history, and approval —
- Pin and compare Tight Draft and Open Contact with aligned coil IDs, a board wipe, curve overlays, signed radius/bounds/sample/contact/component/blocker deltas, and invariant strip allocation.
- Record a preferred layout with rationale/confidence/sources, annotate stable evidence, navigate event branches, create view bookmarks, and selectively undo an independent bookmark.
- Review links each blocker to a visible coil, contact, motif, step, decision, artifact, or event. Approval requires the canonical current radius edit, exact tangent note, current preferred decision, one connected blocker-free motif, zero overlaps, valid assembly graph, parsed packet preview, and no unresolved review item.
Feature: exact sample packet, atomic import, and clean reset —
- Export only after approval. Show validation stages, ordered filenames, byte lengths, hashes, and proof thumbnails before download.
- Import accepts the exact ZIP or coil-project.json alone, validates every authored and derived value before mutation, shows current/incoming differences, and commits once after confirmation. JSON-only import recomputes curve samples, bounds, contacts, components, blockers, metrics, SVGs, and HTML rather than trusting imported derivations.
- Reset previews exact authored/session counts, preserves immutable fixture definitions only after confirmation, and returns focus to the opener.
</core_features>

<user_flows>
Complete project select → release preview/cancel → release commit → sample/contact inspect → prefer layout → alternate-order comparison → tangent note/bookmark undo → step/review/approve → exact export/import with no precredited work.
</user_flows>

<edge_cases>
Test center/radius/turn/phase minima/maxima and just-outside values, radius 45/50/55, exact tangent versus one-unit gap/overlap, board edge, coincident centers, locked/no-op/stale/double confirm, hidden selected edge, decision-before-edit, corrupt each member, and reset cancel; valid state persists and recovery is named.
</edge_cases>

<visual_design>
Inspect clean/selected, idle/hover/lift/snap/gap/tangent/overlap-return/confirmed, sparse/dense/hidden-selected/empty filter, connected/disconnected, draft/stale/reviewed/approved states; the paper-diagram thesis remains legible and relation never depends on color alone.
</visual_design>

<motion>
Sample early/settled radius expansion, old/new curve and disk, profile change, gap collapse, edge draw, component join, blocker exit, invalid return, and approval invalidation; reduced motion exposes identical endpoints, ticks, patterns, values, focus, and announcements.
</motion>

<responsiveness>
At 1440×900, 768×1024, and 390×844, perform real release preview/cancel/confirm, sample/contact inspection, decision, annotation, review/approval, and export/import through desk/tabs/full close-up/release ruler/swipe cards/delta sheet with 44 px targets and no page overflow.
</responsiveness>

<accessibility>
Without pointer, enter handle preview, change 40→50, inspect curve samples/gap/tangent/component/step, cancel and confirm, traverse profile/graph/matrix/motif/sources/history, decide/note/approve/export; geometry, relation, errors, live deltas, and modal focus return are announced.
</accessibility>

<performance>
On 100 projects/10,000 coils/250,000 samples/50,000 candidate pairs/20,000 motif-step records/50,000 events, edit one visible radius, recompute global contacts/components, filter/brush, switch renderer, compare, undo a bookmark, and export/import within 100/500/2,000 ms budgets while cancelling stale work and retaining selection/scroll.
</performance>

<writing>
Trigger every center/radius/bounds/overlap/contact/motif/step/decision/annotation/import/reset failure; copy names the fictional ID, coordinate, squared operand, rational, hash, revision or rule, unchanged-state consequence, and recovery without real paper, adhesive, cutting, safety, construction, or fabrication claims.
</writing>

<innovation>
One release-handle mutation coherently changes a fixed-point spiral, rational spacing profile, exact tangent topology, graph components, assembly readiness, decision freshness, UI/WebMCP state, and nine-member round trip under cancel and alternate order.
</innovation>

<requirements>
- State is strictly in-memory (React context, Zustand, or similar). No localStorage, sessionStorage, or IndexedDB. A full page reload restores the seeded state.
- Seeded state must include the project Tight Draft with 24 stable coils on a 900x600 logical-unit board, eight invented strip tokens, four motifs, seven assembly steps, and 36 retained fixture events. It must contain coil-07 centered at (380,280) with inner radius 10, release radius 40, four turns, phase 0, and strip allocation 180 units.
- coil-12 must be centered at (445,280) with inner radius 5, release radius 15. The center distance is 65.
- The UI must allow selecting coil-07 and pulling its east release handle from (420,280) to (430,280), which sets radius to 50, creating exactly a tangent contact with coil-12.
- Artifact constraints: Export produces a ZIP packet containing manifest.json, coil-project.json, coils.csv, contacts.csv, events.ndjson, coil-board.svg, radial-contact-proof.svg, assembly-card.html, coil-project.schema.json.
- Deterministic sampled spiral: Every coil has exactly turnCountx12+1 samples. Fixed coordinates use thousandths of one logical unit.
- Exact contact rules: relation is gap when distanceSquared > radiusSumSquared, tangent when equal, overlap when less.
- Stack: React 19, Vite, Tailwind CSS 4.3.2, Zustand, Zod.
- All forms and UI must work fully.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- coils_and_stage
- contacts_and_profiles
- motifs_and_assembly
- decisions_history_review
- artifacts_and_session

Module specs:
<module_spec id="coils_and_stage">
{
  "id": "coils_and_stage",
  "contract_version": "zto-webmcp-v1",
  "title": "Coils and Stage",
  "purpose": "Manage stage viewport, renderers, and coil manipulations.",
  "permitted_operations": ["query_projects", "select_project", "query_coils", "query_coil", "preview_release_radius", "commit_release_radius", "cancel_release_radius", "preview_move_coil", "commit_move_coil", "cancel_move_coil", "set_stage_viewport", "set_renderer"],
  "binding_keys": {
    "required_any_of": [["editor_operations"]],
    "optional": ["editor_properties"]
  },
  "restrictions": [
    "Commit requires project/coil/base revisions, target integer radius or center, preview hash, and confirmation token",
    "Returns old/new parameters, bounds, changed samples, nearest pair/relation, contact/motif consequences, event/revision IDs, and state digest"
  ],
  "tool_name_prefix": "coil"
}
</module_spec>

<module_spec id="contacts_and_profiles">
{
  "id": "contacts_and_profiles",
  "contract_version": "zto-webmcp-v1",
  "title": "Contacts and Profiles",
  "purpose": "Query deterministic curve samples, profiles, contacts, and set views.",
  "permitted_operations": ["query_curve_samples", "query_radial_profile", "query_contact_pairs", "query_contact_edge", "query_motif_components", "set_sample_brush", "select_samples", "select_contact", "set_contact_filters", "set_profile_range", "query_renderer_proof"],
  "binding_keys": {
    "required_any_of": [["query_operations"]],
    "optional": []
  },
  "restrictions": [
    "Queries expose global/visible counts, reduced rationals, exact squared operands and points, stable component members, and proof checksums"
  ],
  "tool_name_prefix": "contact"
}
</module_spec>

<module_spec id="motifs_and_assembly">
{
  "id": "motifs_and_assembly",
  "contract_version": "zto-webmcp-v1",
  "title": "Motifs and Assembly",
  "purpose": "Manage motif collections and assembly steps.",
  "permitted_operations": ["query_motifs", "select_motif", "create_motif", "rename_motif", "move_coil_to_motif", "query_assembly_steps", "reorder_assembly_step", "preview_assembly_step", "query_blockers"],
  "binding_keys": {
    "required_any_of": [["motif_operations"]],
    "optional": []
  },
  "restrictions": [
    "Motif/step mutations guard coil/contact/motif revisions, reject duplicate/orphan members and cycles, and return changed topology/hashes without inventing contacts or geometry"
  ],
  "tool_name_prefix": "motif"
}
</module_spec>

<module_spec id="decisions_history_review">
{
  "id": "decisions_history_review",
  "contract_version": "zto-webmcp-v1",
  "title": "Decisions, History, and Review",
  "purpose": "Record preferred layouts, annotate contacts, view history, and handle approvals.",
  "permitted_operations": ["preview_layout_decision", "commit_layout_decision", "cancel_layout_decision", "query_sources", "add_annotation", "query_history", "undo_event", "redo_event", "switch_branch", "pin_checkpoint", "set_compare_checkpoint", "set_compare_wipe", "query_review", "mark_reviewed", "approve_project", "cancel_approval", "query_approval"],
  "binding_keys": {
    "required_any_of": [["decision_operations"]],
    "optional": []
  },
  "restrictions": [
    "Decisions guard curve/contact/motif/metrics hashes; dependency violations reject without mutation; review returns exact blockers linked to visible stable targets and current digests"
  ],
  "tool_name_prefix": "decision"
}
</module_spec>

<module_spec id="artifacts_and_session">
{
  "id": "artifacts_and_session",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifacts and Session",
  "purpose": "Export portable packets, import state, and reset.",
  "permitted_operations": ["query_artifact_manifest", "validate_packet", "export_packet", "stage_packet_import", "commit_packet_import", "cancel_packet_import", "query_session", "reset_session"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": []
  },
  "restrictions": [
    "Returns ordered filenames/bytes/hashes, staged diagnostics, import mode, before/after state digest, confirmation token, and reset counts"
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor operations: select
- Decision operations: approve
- Session operations: export

Mechanics exclusions:
- Dragging, snapping, real hover, modal focus, motion, responsive layout stay Playwright-observed.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
