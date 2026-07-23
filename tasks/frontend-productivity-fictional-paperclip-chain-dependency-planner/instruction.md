<summary>
Build a fictional paperclip chain dependency planner targeting a solo maker. The app provides a spatial desk for dragging two ended dependency clips between 180x104 task slips. It features orthogonal routing with cycle prevention, deterministically scheduled topological sort for earliest start finish and slack computation, critical chain profiling, issue tracking for missing predecessors, a deterministic rehearsal mechanism, branch history logic with selectively preserved comments, and exact standalone artifact generation. The data state should be in memory only without localStorage.
</summary>

<core_features>
Two ended clip desk and invalid return. Render task slips at exact snapped locations on a canvas. Include punched eyelets for input and output, committed clips, loose tray, source and target jaws, and route clearance. Drag the first jaw to show eligible outputs. Drag the second jaw to show a live route, forecast schedule and critical chain deltas, and valid snapping. Conform to a 16 unit snap distance. The second snap opens a confirmation sheet to commit. Cancel or invalid snap restores clip exactly to tray.

Exact, keyboard, and compact dependency editing. Slips use roving tabindex. Arrow keys move slips and ports. Exact editor selects loose clip, source task output, target task input, and route preference, producing identical results as pointer threading. Mobile 390x844 view renders a focused slip stack, vertical dependency spine, and swipeable predecessor successor cards instead of the wide desk matrix.

Linked schedule, slack, matrix, and issue evidence. Selected entities sync highlights across the clip desk, dependency matrix, earliest start ribbon, slack bars, critical chain profile, buffer gauge, issue graph, and history. The brush selects a timeline range of 5 to 360 mins to view aggregate stats. Filter retains selected clip.

Cycle preview, rehearsal, and route repair. Preview cycle and collision loops without committing. Rehearsal operates on an isolated schedule copy, advancing through tasks in start time order. Rehearsal blocks on required predecessor issues. Rehearsal reset restores authored plan.

Branches, actor history, comments, and review. Maintain distinct Baseline and Clipped branch contexts. Allow actor selective undo that restores schedule but preserves anchored comments as orphans or provenance. Editing forks history. Compare mode highlights exact delta changes. Plan approval requires an acyclic graph, resolved issues, verified rehearsal, and positive buffer.

Atomic import and independent proof. Export ZIP with 10 files including JSON schema, CSVs, standalone SVG desk and schedule, proof HTML, transcript, and manifest. Import tests exact payload and reverts cleanly on errors, updating view, brush, selection, history exactly on success.
</core_features>

<user_flows>
- Thread CLIP-09 from TASK-05 output to TASK-07 input, observing live route and 16-unit snap.
- Watch schedule reconcile (shift TASK-07 to 11:20 and TASK-08 to 11:45, adjust finish to 12:00, buffer to 15, issue 03 resolved, critical chain updated).
- Preview cycle by threading back to earlier task, cancel, and restore state.
- Anchor a comment, undo the clip step, observe comment retained, then redo.
- Start rehearsal, step through sequence, and mark it verified.
- Approve the plan when buffer is positive and issues resolved.
- Export artifact ZIP and view proof without network access.
</user_flows>

<edge_cases>
- Duplicate edges or self loops: Return clip to original state cleanly.
- Over/under orthogonal route collision: Detour algorithm uses first valid orthogonal 12-unit clearance route (prefer over, then under, by path length). No valid route reverts to tray.
- Import with stale/invalid schema, extra files, bad hash, or schedule inconsistency: Revert byte-for-byte safely with zero state bleed.
- Snap distances 15/16/17: Explicit limit for snap triggering.
</edge_cases>

<visual_design>
- Desktop (1440x900) layout integrates visual desk, dependency matrix, and schedule slack panels.
- Distinct states for loose, preview, invalid, committed, critical, selected, branched, rehearsed, and approved.
- Avoid pure color-alone states (use patterns, styling, labels).
</visual_design>

<motion>
- Causal motion logic: Clip jaws travel to eyelets, orthogonal route bends dynamically around clearance envelopes.
- Descendant interval shifts push right smoothly; slack bars contract.
- Reduced motion setting suppresses animation in favor of quick numbered endpoint cards, old/new intervals, static patterns, and live text status.
</motion>

<responsiveness>
- Full mobile support at 390x844: vertical spine, focused task stack, big target predecessor/successor cards (min 44x44 CSS pixels), collapsible bottom sheets for Matrix/Schedule/Issues, zero horizontal overflow.
</responsiveness>

<accessibility>
- Roving tabindex for keyboard focus on tasks/ports in lane schedule order.
- Enter selects endpoints. Exact selection UI works cleanly for screen-reader use with live announcements on snap/commit/error.
- Focus trap and return applied on sheets/dialogs.
</accessibility>

<performance>
- View updates on 1000 tasks/4000 clips matrix within 500ms; user interaction/drag responses in 100ms. Zip export/import parses in 2s with no leaks.
</performance>

<writing>
- Diagnostics on failure uniquely identify stable entity/ID, rule failing, and state unchanged, keeping within the fictional productivity-maker thematic genre.
- Non-productivity-claim phrasing for copy; it's a fictional paperclip context, avoiding real business claims.
</writing>

<requirements>
In memory data store with single deterministically generated canonical hash. Do not use localStorage.
Use React 19, Zustand, Framer Motion, and Tailwind CSS 4.3.2.
Generate valid 10 file ZIP via JSZip.
WebMCP actions correspond entirely to UI driven mutations and map precisely to the state updates.
All dependencies must be installed locally via npm. Do not use CDNs or external network calls.
</requirements>

<webmcp_action_contract>
<module_spec id="fictional-paperclip-planner-v1">
{
  "id": "fictional-paperclip-planner-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Fictional Paperclip Planner",
  "purpose": "Author a dependency plan, thread clips, run rehearsal, and export proofs.",
  "permitted_operations": ["read", "select", "preview_clip", "confirm_clip", "cancel_clip", "remove_clip", "restore_clip", "start_rehearsal", "step_rehearsal", "reset_rehearsal", "mark_rehearsal", "fork_branch", "compare_branches", "add_comment", "resolve_comment", "undo_actor_event", "redo_actor_event", "approve_plan", "export_packet"],
  "binding_keys": {
    "required_any_of": [["planner_operations"]],
    "optional": []
  },
  "restrictions": [
    "No generic state setter.",
    "Operations must mimic identical visual mechanics as UI paths.",
    "WebMCP is bound directly to store logic."
  ],
  "tool_name_prefix": "planner"
}
</module_spec>
Bindings:
- Editor operations: get_plan_session, get_plan, list_tasks, get_task, list_clips, get_clip, get_schedule, get_critical_chain, get_issues, get_history, get_artifact_preview, set_selection, set_viewport, set_timeline_brush, set_compare_brush, preview_clip, confirm_clip, cancel_clip, remove_clip, restore_clip, preview_route, confirm_route, start_rehearsal, step_rehearsal, reset_rehearsal, mark_rehearsal, fork_branch, compare_branches, add_comment, resolve_comment, review_plan, undo_actor_event, redo_actor_event, approve_plan, validate_import, confirm_import, cancel_import, export_packet.
</webmcp_action_contract>
