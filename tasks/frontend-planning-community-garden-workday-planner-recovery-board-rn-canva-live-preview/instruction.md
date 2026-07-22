<summary>
Build a community garden workday recovery planner using React, Zustand, Tailwind CSS 4.3.2, and Radix UI.
</summary>

<core_features>
Feature: Work tasks collection —
- On first load the collection contains exactly 104 deterministic fixture tasks, including exactly one Failed task named Compost delivery failed, no Recovery or Resolved task, no selected task, and zero authored history events.
- Activating Create task opens a modal whose API-shaped request fields are title, description, status, date, plot, volunteers, and duration minutes; submitting a valid request adds exactly one stable-ID record, selects it, increments the collection count and live preview count by one, and adds one create history event.
- Editing a task updates the same stable-ID record in the collection, selection inspector, live mobile preview, derived workload, and export preview without a reload; cancel closes the modal with every value and history event unchanged.
- Archiving and restoring a task toggles only that task between Archived and Draft, updates derived counts, and creates exactly one archive event per real activation; deleting after explicit confirmation removes exactly one record and undo can restore it.
- Search matches task title, description, or plot incrementally, and each explicit status filter shows only that state; a no-match view explains how to restore the full list.
- The Up and Down controls reorder a task by one position while preserving its stable ID, selection, and all domain values; an exact-value WebMCP reorder reaches the same ordered collection with one reorder event.

Feature: Recovery board —
- The Recovery board presents Failed, Recovery path, and Resolved lanes with visible counts; the seeded Compost delivery failed card begins only in Failed and no recovery success evidence is preseeded.
- Dragging Compost delivery failed from Failed into Recovery path, or activating its Move to recovery path button, invokes the same canonical mutation: its stable ID stays unchanged, status becomes Recovery, recoveryBoardState.lane becomes recovery, Failed decreases by one, Recovery increases by one, selection follows the card, and exactly one move_to_recovery event is appended.
- Dropping or activating Move to recovery path twice after the first successful mutation is a no-op with zero extra events and no duplicate card.
- Activating Repair consequences opens a focus-trapped modal; a valid 10-to-180-character repair note resolves the same record, moves it into Resolved, preserves the note in the inspector and artifact, changes Recovery and Resolved counts by exactly one, and appends one resolve_recovery event.
- Ctrl or Command plus Z and the visible Undo control restore the last mutation’s full prior snapshot, including record order, selection, filters, linked counts, recovery lane, repair note, and history anchor; branching with a new mutation after undo uses the restored snapshot.
- The selection inspector, live mobile preview, lane counts, derived volunteer workload, event history, WebMCP record query, and export preview all derive from one collection and show the same recovery state immediately.

Feature: Portable work artifact —
- Export opens a readable preview and Download JSON downloads garden-workday-v1-recovery-board.json; Copy session JSON copies that same live artifact and shows a copy confirmation when clipboard permission allows.
- Every export contains schemaVersion garden-workday-v1, a newly generated RFC3339 exportedAt, records sorted by order then ID, derived, history, selectionId, and filters; every record contains id, title, description, status, date, plot, volunteers, durationMinutes, order, and recoveryBoardState with lane, position, and repairNote.
- Derived contains total, ready, failed, inRecovery, resolved, archived, and volunteerHours at two-decimal precision, and its values exactly match records in that export.
- Import accepts pasted session JSON and validates the entire artifact before commit; a valid artifact atomically restores records, order, recovery state, repair notes, history, selection, filters, and derived values, while the next export regenerates exportedAt.
- Export, clear, import, select the edited task, and export again produces semantically identical authored and derived content except for regenerated exportedAt.
</core_features>

<user_flows>
- Starting from the clean fixture, create a valid task, edit its duration, select it, archive it, undo, and switch to Recovery board: collection count, workload, selection inspector, and event history remain coherent without reload.
- Starting from Compost delivery failed, measure Failed and Recovery counts, move it into Recovery, enter a valid supplier-repair note, inspect the mobile preview and event history, then export: the stable ID, recovery lane, repaired status, count deltas, note, and two canonical events agree across every surface.
- Export the recovered session, clear it to the actionable empty state, import the exported JSON, re-open Compost delivery failed, and re-export: order, selection, repair evidence, counts, and history return coherently while exportedAt changes.
</user_flows>

<edge_cases>
- Title accepts exactly 3 and 80 characters and rejects 2 and 81; description accepts 0 and 240 and rejects 241; correcting one field clears only that field’s inline error.
- Volunteers accepts integers 1 through 20 except Greenhouse tasks accept at most 8; duration accepts 15 through 240 minutes only in 15-minute increments; dates accept 2026-01-01 through 2026-12-31. Each rejected value names the field, rule, and recovery action and creates no record or event.
- New or ordinary edited records cannot enter Recovery or Resolved directly; those states require the canonical board flow, and an attempted bypass preserves the prior record.
- Atomic import reports all diagnostics together for malformed JSON, wrong schemaVersion, duplicate IDs, unknown enum values, invalid bounds, status-to-lane contradictions, stale derived values, dangling history or selection references, and a resolved task without a valid repair note; every rejected import preserves records, selection, filters, and history exactly.
- Clearing the session shows an actionable empty state with zero tasks and events; Create task and Import remain available, and page reload returns to the original 104-task deterministic fixture because the genre is in-memory.
- Canceling any modal, declining delete confirmation, moving to the current order, repeated recovery activation, and invalid submit are no-ops with zero entity and event-count deltas.
</edge_cases>

<visual_design>
- The desktop composition is a calm garden operations workbench: deep forest header, warm harvest accent, off-white canvas, serif display headings, compact sans-serif operational copy, and status tokens that combine text with colored dots.
- Work tasks or the three recovery lanes occupy the primary surface while a dark phone-shaped live preview and selected-task inspector remain visually distinct on the right; current state, next action, counts, timing, crew, and repair evidence have an obvious hierarchy.
- Task rows share consistent anatomy and spacing across the 104-record collection, and selected, Failed, Recovery, Resolved, Archived, hover, focus, disabled, and error states are visibly distinct without relying on color alone.
</visual_design>

<motion>
- The real drag or visible button recovery path causally moves the acted-on card from Failed to Recovery, and resolving it moves the same card to Resolved; linked counts and status tokens settle with the same state change rather than animating unrelated content.
- Created, deleted, filtered, and reordered task rows transition without layout jumps; dialogs fade and scale, controls show hover and press feedback, and feedback remains readable while present.
- With reduced motion requested, transforms and animated travel are removed while the card, counts, live announcement, focus, history, and final recovery state remain identical.
</motion>

<responsiveness>
- At 1020 pixels and below the phone preview moves beneath the active primary surface and recovery lanes stack; at 720 pixels and below task rows and actions recompose vertically instead of clipping.
- At a 375-by-812 viewport the full create, failed-to-recovery, repair, undo, export-preview, and import flows remain operable with no page-level horizontal overflow and every primary control at least 44 by 44 pixels.
- Mobile uses the Work tasks and Recovery board tabs as a step sequence while preserving the same stable IDs, count deltas, selection, and artifact bytes as desktop.
</responsiveness>

<accessibility>
- A skip link reaches the workbench; landmarks and headings are ordered; every icon-only action has a task-specific accessible name; status tokens include visible text as non-color evidence.
- All controls and both tabs are keyboard operable with visible focus, task and repair dialogs trap focus and return it to their opener, Escape and Cancel close without mutation, and confirmation does not strand focus.
- Ctrl or Command plus K focuses task search and Ctrl or Command plus Z invokes the same undo command as the visible control.
- Canonical mutations, imports, errors, copy confirmation, selection changes, and count changes are announced through a polite live region; field errors are associated with their form controls.
</accessibility>

<performance>
- The app becomes interactive within 2 seconds on local load and renders the 104-task fixture without an empty shell or visible layout jump.
- At 104 records, task selection, filtering, exact reordering, and recovery acknowledgement remain visibly responsive; direct manipulation acknowledges within 100 milliseconds and linked counts and preview settle within 500 milliseconds.
- Export, copy preparation, and atomic import of the maximum 150-record schema complete within 2 seconds without dropped input, stale linked views, console errors, page errors, or non-local network requests.
</performance>

<writing>
- Labels use the domain terms Work tasks, Failed, Recovery path, Resolved, repair note, and portable session artifact consistently across tabs, lanes, inspector, dialogs, errors, and announcements.
- Action labels name their effect, empty states explain the next recovery action, and success feedback states the entity and consequence instead of using generic confirmation copy.
- Every validation diagnostic names the rejected field or relationship, the violated rule, and how to recover; no placeholder or internal-process language appears in the shipped UI.
</writing>

<innovation>
- Optional enhancements may add a useful garden-specific decision aid beyond the specified workload preview and repair history, provided it derives from live state, stays accessible, and is preserved in the artifact when it changes session work.
</innovation>

<requirements>
- Build tooling is Vite. Use React, Zustand for all shared collection, active-tab, filter, selection, preview, history, and dialog-trigger state, Tailwind CSS 4.3.2 for the styling base, and Radix UI for accessible dialogs and tabs.
- Use React Hook Form with Zod for every task and repair form and for the API-shaped import schema. Motion for React is the only animation library. Phosphor is the only icon library. All libraries are installed through npm and bundled locally; no CDN imports.
- This is a good-app task: all shared data is in memory only. Do not use localStorage, sessionStorage, IndexedDB, cookies, a backend, authentication, external APIs, or outbound navigation. Reload always restores the deterministic fixture.
- The 104-record fixture contains no user-authored event, no Recovery or Resolved state, and no export or success milestone. User actions alone create credited mutation evidence.
- Form and artifact schemas use the exact fields and bounds stated above. The created record is the would-be request body, and import and export validate the same record and session shapes.
- The app must expose window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool. WebMCP handlers invoke the same Zustand commands as visible controls and never use a parallel state copy.
- npm start serves the committed built output on port 3000 and npm run verify:build produces dist/index.html.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app.
- /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds).
- Implement every declared WebMCP tool and register it against the live page state before considering the task complete.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity: record
- Entity operations: create; select; update; delete; toggle; reorder
- Entity fields: title; description; status; date; plot; volunteers; durationMinutes; order; recoveryBoardState
- Value bounds: title 3 to 80; description 0 to 240; volunteers 1 to 20 and Greenhouse maximum 8; durationMinutes 15 to 240 in 15-minute increments; date 2026-01-01 to 2026-12-31; order 0 to 149
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json
- Visible postconditions: entity and linked counts update together; artifact operations open the visible preview or import surface

Required tools:
- entity_create_record
- entity_select_record
- entity_update_record
- entity_delete_record
- entity_toggle_record
- entity_reorder_record
- artifact_export_session_json
- artifact_import_session_json
- artifact_copy_session_json

Mechanics exclusions:
- Drag, touch, keyboard shortcuts, focus, hover, motion, and responsive transformation remain browser-graded.
- Artifact file contents, clipboard contents, raw files, filesystem paths, blobs, and base64 remain outside WebMCP arguments and results.

Implementation:
- Register browser WebMCP tools for every named operation.
- Tool handlers call the same domain command as the visible control and mutate the same shared state.
</webmcp_action_contract>
