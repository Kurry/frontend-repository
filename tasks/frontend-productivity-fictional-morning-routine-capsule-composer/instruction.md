<summary>
Build a browser-native routine composer where the user drags one task capsule inside another, sees an invalid nested draft across a structure canvas and timed focus rail, previews the exact save-time flattening, cancels without losing the draft, confirms the deterministic repair, preserves a later collaborator note through selective undo/redo, approves the sequence, and exports a portable routine packet.

The app uses React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Lucide React.
</summary>

<core_features>
Feature Capsule structure canvas and nest request
Render the root sequence and capsule interiors as an aligned horizontal route with rounded capsule bands, task tiles, insertion seams, duration labels, parent breadcrumbs, selection, and mini playback ticks. Pointer dragging shows origin, prospective parent/index, child count, depth, and validity before release. Autoscroll is bounded and stops on cancel. Root, capsule, and step identities remain visually inspectable.
Only active capsules may move. Dropping CAP-02 before itself, into itself, outside a seam, into a dissolved capsule, or at an index below 0 or above child count rejects the gesture, restores selection/pan/zoom, announces the reason, and creates neither draft nor history. Repeating the identical request is a no-op. A different pending nest request requires explicit Replace Draft confirmation.

Feature Save-time repair preview and recovery
Saving a valid committed routine requires no repair. Saving DRAFT-01 opens a modal comparison with before/after tree, exact operation list, timing delta ribbon, affected-id list, and Cancel/Confirm. It must not mutate behind the modal. Confirm is enabled only when all derived repair checks pass.
The preview computes from the pending request each time; stale preview confirmation is rejected if the draft changes. Cancel preserves the invalid draft; Cancel Nest discards it; browser Back while the modal is open behaves like Cancel Repair and restores focus. Confirm is idempotent: double activation produces one H-001. A simulated import while a repair preview is open requires closing or canceling the preview first.

Feature Linked focus rail, allocation ring, and rehearsal
The focus rail is a linear time representation of expanded active steps with capsule-band overlays, minute ticks, current position, transition marks, and finish. Structure selection and rail selection are bidirectional. Scrubbing to 07:26 selects STEP-05 after repair and highlights its structure tile, note, calendar event, CSV row, and SVG group.
The allocation ring shows Launch, Ready, and root minutes as text and arcs: 20/15/10 to 35/0/10; dissolved Ready is a hatched zero arc linked to provenance rather than silently removed. The transition counter changes 2 to 1. A focus rehearsal can advance, pause, skip, or return to previous without editing the routine; it uses a deterministic logical clock and never grants completion credit in the fixture.
During the invalid draft the rail keeps committed timing with a hatched "repair pending" overlay. During preview it shows old and proposed tracks together. After confirm, it adopts proposed order and times. This three-state distinction prevents a plausible build from treating draft, preview, and commit as the same state.

Feature Actor history, note preservation, search, and approval
History shows stable ids, actor, kind, before/after structure hashes, affected entities, logical time, active/undone status, and repair operations. Selective undo for the active actor reverses their latest eligible action; redo restores it. Undoing Ari must replay later nonconflicting Sol actions. A true dependency opens a deterministic conflict preview; cancel adds no history.
Search finds active and dissolved capsules, steps, notes, actors, history ids, and repair operations. Choosing dissolved CAP-02 opens provenance without changing playback selection until the user activates Jump to children.
Validation requires no draft, active diagnostic, empty active capsule, duplicate/missing step, invalid duration, stale timing, or broken history reference. It records a state hash but no history. Approval requires current validation, traps focus, and returns to its opener. Any later routine mutation clears approval and marks validation stale; a rehearsal-only position change does neither.

Feature Exact routine packet and transactional import
Download exactly copper-dawn-routine.zip with exactly nine root entries and no hidden/nested files: manifest.json, routine.json, structure.csv, schedule.csv, repair-report.json, history.json, view-state.json, routine.ics, routine.svg.
Import accepts only this ZIP packet, at most five MiB. Validate filenames, paths, hashes, media types, schemas, ids, bounds, one-to-one step membership, capsule depth, dissolved provenance, timing, repair consistency, history, notes, view state, ICS equivalence, SVG ids, and cross-file derived values before commit. Unknown keys/files, path traversal, duplicate/dangling ids, nested committed capsules, wrong order/times, stale hashes, impossible undo targets, or five MiB plus one byte reject atomically and display every diagnostic.
</core_features>

<user_flows>
Starting from fictional routine Copper Dawn, Ari drags capsule CAP-02 Ready from the root sequence into CAP-01 Launch immediately after step STEP-02 Wash mug. A committed routine permits only one capsule level, so the move creates a visible depth-two draft that cannot be saved directly. Save Routine must calculate one repair: dissolve CAP-02, splice its two stable child steps into CAP-01 at the requested position, preserve selection and step ids, and show every before/after timing and hierarchy consequence before mutation.

Ari cancels the first repair preview and remains in the exact invalid draft. Ari opens Save again and confirms. The canonical transaction changes the playable step order from 01,02,03,04,05,06 to 01,02,04,05,03,06, expands Launch from 20 to 35 minutes, dissolves Ready without deleting its provenance, moves three step start times, and reduces capsule-boundary transitions from two to one without changing the routine's 45-minute finish.

Sol then annotates STEP-05. Selective Undo Ari restores the two original top-level capsules and original timing while Sol's note remains attached to the same step. Redo Ari restores the flattened sequence and still preserves the note. The user validates, approves, exports copper-dawn-routine.zip, opens a clean session, imports it, and observes identical hierarchy, playback, view state, history, approval, and artifacts.
</user_flows>

<edge_cases>
Invalid, no-op, canceled, repeated, double-confirmed, and out-of-bounds actions add no committed event. Canceling the repair preserves the invalid draft; canceling the initial nest gesture restores the last committed state. Those are distinct recoveries.
Nest-then-note and note-then-equivalent-nest converge on the same repaired schedule and note. Selective undo of Ari affects Ari's repair only; Sol's later note remains. Redo restores the same ids instead of recreating entities.
</edge_cases>

<visual_design>
The visual thesis is an editorial “morning route card”: pale parchment ground, graphite text, copper capsule bands, indigo selection, mint confirmation, tabular minute numerals, generous route spacing, and restrained stitched connectors. It uses no lifestyle photography, wellness iconography, or copyrighted product assets. Initial, draft, repair-preview, repaired, undo, approved, import-error, narrow, and reduced-motion states retain a consistent hierarchy.
</visual_design>

<motion>
Normal motion uses 180–260 ms spatial continuity: Ready nests into Launch as a ghost, preview draws child destination tracks, confirmation peels open Ready and flows steps 04/05 into consecutive seams while the focus rail reorders and ring arcs rebalance. Reduced motion removes transforms/path drawing; old/new parent map, numbered operation list, persistent changed-value outline, and announcement preserve causality with final geometry in one frame.
</motion>

<responsiveness>
At widths at least 1024 CSS pixels, show structure canvas, focus rail, allocation ring, and inspector concurrently. At 390x844, do not shrink or horizontally scroll that canvas. Transform it into a vertical route deck: root entities are cards, expanding Launch reveals ordered child cards and insertion seams, Ready's action sheet supplies Move into/position controls, and a dedicated Repair comparison sheet replaces the desktop modal. A compact focus view swaps the route deck for a full-width vertical schedule with persistent Back to structure and preserved selection.
</responsiveness>

<accessibility>
Every pointer operation has keyboard and touch parity. Space lifts/places, arrows traverse named seams, Escape cancels, M opens exact Move, and shortcuts expose undo/redo/search. Cards, seams, sheet controls, and rail handles are at least 44x44 CSS pixels. Dialogs/sheets trap focus and return it to the opener. Selection, invalid depth, pending repair, dissolved provenance, actor, approval, and focus position use text/icon/shape as well as color.
Confirming H-001 announces "Ready repaired into Launch. Two steps moved. Launch 35 minutes. One transition." Undo and redo announce retained Sol note status. Validation/import errors are assertive once; selection updates are polite. Hover and focus show the same explanatory tooltip, and no required information exists only in a tooltip.
</accessibility>

<performance>
At the maximum fixture, acknowledge manipulation within 100 ms, settle every linked view within 500 ms, and complete import/export within two seconds without stale selection, dropped input, layout shift, console/page errors, or non-local network dependence.
</performance>

<writing>
Every task, actor, time, duration, label, threshold, and outcome is fictional interface-test data. The app must state that it is a planning exercise and does not provide health, mental-health, accessibility, sleep, medical, lifestyle, or productivity advice.
</writing>

<innovation>
Confirm H-001 once; structure, dissolved provenance, playback rail, allocation ring, transition marks, note target, history, calendar, SVG, and packet preview remain one linked selectable state rather than independent widgets.
</innovation>

<requirements>
- The fixture contains illustrative routine data but no credited nest request, repair preview decision, confirmed repair, note, undo/redo, validation, approval, export, or success state. Every milestone appears only after its real UI action and exact event-count delta.
- Pointer drag, keyboard pickup/place, compact touch sheet, and declared WebMCP paths converge on the same requested parent/index and confirmed repair event with identical stable ids, order, parentage, times, selection, diagnostics, history, and normalized artifact meaning.
- Imports are atomic over the same API-shaped routine schema used by UI edits and export. Validate every file and field before commit, report all problems together, and preserve the complete current session when any problem exists.
- Export reflects the session's real repaired hierarchy, order, timing, dissolved-capsule provenance, note, history, selection, and approval. Re-import followed by re-export is semantically identical except only declared regenerated timestamps and ZIP physical entry order.
- Persist committed routine, actor history, note, approval, selection, zoom, and focus-rail position. Never persist drag ghosts, invalid drafts, an open repair sheet, hover, focus ring, animation progress, import preview, or unconfirmed repair.
- Exercise minimum, maximum, just-inside, and just-outside values for every bound. Error copy names the entity, field or rule, rejected value, and recovery; correcting one error clears only that error.
- Grade pointer actionability, computed hover/focus feedback, real keyboard shortcuts, modal focus trapping and return, announcements, early/settled motion, reduced-motion parity, and the entire 390x844 compact flow through real UI mechanics, never a WebMCP shortcut.
- Assets must be fully local and work completely without internet access. No CDN links. All dependencies must be NPM-local.
</requirements>

<integrity>
No skip-stubs or fabricated outputs. Media must be a real recording of the implemented application. Everything except webmcp_action_contract falls before this tag.
</integrity>

<delivery>
Implement the provided feature set as a browser-native single-page application inside solution/app. Support npm start on port 3000. Include WebM evidence.
</delivery>

<webmcp_action_contract>
window.webmcp_session_info = {
  task_slug: "frontend-productivity-fictional-morning-routine-capsule-composer",
  version: "1.0.0",
  mode: "active"
};

window.webmcp_list_tools = function() {
  return [
    { name: "get_session", description: "Get the current session state", inputSchema: { type: "object", properties: {} } },
    { name: "select_entity", description: "Select an entity", inputSchema: { type: "object", properties: { entityId: { type: "string" } }, required: ["entityId"] } },
    { name: "request_nest", description: "Request a nested draft", inputSchema: { type: "object", properties: { entityId: { type: "string" }, requestedParentId: { type: "string" }, requestedIndex: { type: "number" } }, required: ["entityId", "requestedParentId", "requestedIndex"] } },
    { name: "cancel_nest", description: "Cancel the pending nest draft", inputSchema: { type: "object", properties: {} } },
    { name: "preview_save_repair", description: "Preview the save-time repair for the draft", inputSchema: { type: "object", properties: {} } },
    { name: "cancel_save_repair", description: "Cancel the repair preview, restoring the draft", inputSchema: { type: "object", properties: {} } },
    { name: "commit_save_repair", description: "Confirm the save-time repair and commit", inputSchema: { type: "object", properties: {} } },
    { name: "set_focus_position", description: "Set the focus playback time", inputSchema: { type: "object", properties: { second: { type: "number" } }, required: ["second"] } },
    { name: "get_playback_schedule", description: "Get the playback schedule", inputSchema: { type: "object", properties: {} } },
    { name: "get_allocation", description: "Get the duration allocation ring", inputSchema: { type: "object", properties: {} } },
    { name: "get_transition_count", description: "Get the transition count", inputSchema: { type: "object", properties: {} } },
    { name: "add_note", description: "Add a note to an entity", inputSchema: { type: "object", properties: { entityId: { type: "string" }, text: { type: "string" } }, required: ["entityId", "text"] } },
    { name: "set_active_actor", description: "Set the active actor", inputSchema: { type: "object", properties: { actorId: { type: "string" } }, required: ["actorId"] } },
    { name: "undo_actor_action", description: "Undo the last eligible action of the active actor", inputSchema: { type: "object", properties: {} } },
    { name: "redo_actor_action", description: "Redo the last eligible action of the active actor", inputSchema: { type: "object", properties: {} } },
    { name: "validate_routine", description: "Validate the current routine", inputSchema: { type: "object", properties: {} } },
    { name: "approve_routine", description: "Approve the current valid routine", inputSchema: { type: "object", properties: {} } },
    { name: "get_history", description: "Get the history of events", inputSchema: { type: "object", properties: {} } },
    { name: "preview_export", description: "Preview the routine export", inputSchema: { type: "object", properties: {} } },
    { name: "export_routine", description: "Export the routine packet", inputSchema: { type: "object", properties: {} } },
    { name: "preview_import", description: "Preview an imported routine packet", inputSchema: { type: "object", properties: { archiveBase64: { type: "string" } }, required: ["archiveBase64"] } },
    { name: "commit_import", description: "Commit an imported routine packet", inputSchema: { type: "object", properties: {} } },
    { name: "cancel_import", description: "Cancel the import process", inputSchema: { type: "object", properties: {} } },
    { name: "get_view_state", description: "Get the complete view state", inputSchema: { type: "object", properties: {} } }
  ];
};

window.webmcp_invoke_tool = async function(name, args) {
  return window._fictional_routine_mcp_invoke(name, args);
};
</webmcp_action_contract>
