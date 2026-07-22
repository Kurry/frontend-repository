<summary>
Build a conference speaker greenroom recovery board using React, Zustand, Tailwind CSS 4.3.2, and Radix UI. The app turns repaired speaker-slot state into a downloadable speaker-greenroom-v1-recovery-board.json artifact.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots: overview.png is the canonical full-page desktop overview; segment-01.png and segment-02.png are the canonical full-resolution 1440 by 900 desktop segments in top-to-bottom order; overview-tablet.png is the 900-pixel responsive overview; overview-mobile.png is the canonical 375 by 812 stacked mobile overview. Recreate their composition while implementing every behavior below. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Speaker Slots collection —
- The first load shows exactly eight deterministic speaker slots distributed across draft, ready, changed, and failed states; no slot starts in recovery, resolved, archived, exported, or success state
- Speaker slot cards and the collection table show speaker name, session title, room, start time, duration, status, short link, and a non-color status label; selecting a slot highlights the same stable ID in the table, recovery board, and mobile preview
- Add slot opens a labeled dialog; submitting a valid slot adds exactly one record and updates counts, board lanes, timing summary, mobile preview, WebMCP selection, and export text from the same state without a reload
- The slot payload field contract is: id is a unique stable string; speakerName is 2 through 80 trimmed characters; sessionTitle is 3 through 120 trimmed characters; room is exactly Main Hall, Studio A, or Studio B; startMinute is an integer from 480 through 1080 inclusive; durationMinutes is an integer from 15 through 90 inclusive in five-minute steps; status is exactly draft, ready, changed, failed, recovery, resolved, or archived; mobileNote is at most 160 characters; shortLink is 3 through 32 lowercase letters, numbers, or hyphens and is unique across records
- Edit slot uses the same field contract and updates that stable record everywhere it appears; deleting a slot requires confirmation and removes exactly that record from every linked surface; Archive changes status to archived without deleting history
- Status filter chips and title or speaker search combine over the same collection; clearing both restores all eight seeded slots in their existing recovery-board order; sorting by start time ascending then descending reverses the live order
- Loading the 100-slot performance fixture replaces the collection with exactly 104 deterministic non-completed slots, including the four core seeded examples and 100 generated records, while preserving a usable recovery flow

Feature: Recovery Board surface —
- The board has Failed feed, Recovery path, and Resolved lanes; each card exposes pointer drag plus a 44-pixel Move to recovery button so touch and keyboard users can invoke the identical stable-ID transition
- Moving the seeded failed slot with ID slot-maya into Recovery path creates exactly one history event, retains its stable ID, sets its recoveryBoardState lane to recovery, selects it in every view, changes the linked mobile preview to Holding, and updates failed, recovery, and minutes-at-risk summaries immediately
- Cancelling a pointer drag outside a valid lane, double-activating Move to recovery, moving a non-failed slot, or submitting an incomplete recovery creates zero extra events and restores the prior selection, filters, ordering, and derived values
- The Recovery inspector accepts a replacement start from 480 through 1080 in five-minute steps and a repair note from 8 through 160 trimmed characters; Apply repair rejects a room overlap or incomplete value with field-level guidance and no partial mutation
- Applying a valid repair to a recovery slot creates exactly one repair event, changes its status and recoveryBoardState lane to resolved, stores the repair note, updates its start time, changes the linked mobile preview from Holding to Live, and recomputes every summary
- Undo or Ctrl/Cmd+Z restores the complete prior snapshot including record fields, ordering, lane, selection, summaries, filters, and history anchor; after undo, a different valid mutation discards the abandoned redo branch
- The visible event timeline lists event sequence, action, stable record ID, and consequence for create, edit, archive, move-to-recovery, repair, delete, reorder, and fixture mutations; a successful import restores its authored history exactly and reports the import receipt separately, while invalid, cancelled, no-op, and double actions add no event

Feature: Canva-inspired live mobile preview —
- A phone-shaped preview always renders the selected speaker's name, session title, formatted start time, duration, room, speaker-time note, short link, and state banner from the same record the table and board show
- Editing title, timing note, room, start, duration, or short link refreshes the preview immediately; moving a failed slot shows Holding and applying repair shows Live without a reload
- The preview includes a compact timing chart whose remaining-minutes bar width and number change when duration changes; its share card shows the exact local short link greenroom.local/s/{shortLink}

Feature: Portable work artifact —
- Export JSON downloads the current full session as speaker-greenroom-v1-recovery-board.json and Copy JSON copies the exact visible export preview, with a visible confirmation; each export regenerates exportedAt as an RFC3339 timestamp
- The artifact top level contains exactly schemaVersion, exportedAt, records, derived, and history; schemaVersion is speaker-greenroom/v1; records are stably sorted by recoveryBoardState.order then ID and contain every field from the slot contract plus recoveryBoardState with lane and integer order, repairNote, and previewState; derived contains activeCount, failedCount, recoveryCount, resolvedCount, minutesAtRisk, and selectedId; history contains ordered objects with seq, type, recordId, and summary
- The derived counts and minutesAtRisk in exported JSON equal the visible summary at export time, selectedId names an existing record or is null, every history recordId names an exported record except a delete event, and re-export after any mutation changes the corresponding record and derived fields rather than returning stale bytes
- Clear session empties all three lanes, the collection, preview selection, summaries, and history after confirmation; it leaves Add slot and Import JSON available and does not create success evidence
- Import JSON accepts pasted text or a selected .json file, validates every top-level key, record, field, enum, bound, five-minute step, unique ID, unique short link, history sequence, history reference, derived value, and recovery-lane/status relationship before committing, then reports every discovered record and field diagnostic together
- A valid import atomically restores authored records, stable board ordering, selection, derived state, and history, then regenerates exportedAt; exporting, clearing, importing, and re-exporting is semantically identical except for exportedAt
</core_features>

<user_flows>
- Starting from eight slots, add a valid failed slot, confirm the collection and failed counts each increase by exactly one and the same stable record appears in the table and Failed feed, move it to Recovery path, repair it, and confirm the failed count drops, resolved count rises, mobile preview reads Live, and export JSON contains the repaired fields and both events
- Select slot-maya, drag or activate Move to recovery, confirm exactly one event and the Holding preview, press Ctrl/Cmd+Z, confirm the card, selection, summaries, and timeline return to their prior values, then use the alternate-input button and confirm the identical canonical event fields
- Edit slot-jordan from duration 45 to 60 and mobile note to Keynote begins after the welcome reel; the collection row, summary minutes, chart number and width, mobile note, and exported record all change without a reload
- Export the mutated session, clear it, import the exported text, re-open the same stable record, and confirm all record fields, recovery lane ordering, selected ID, summaries, preview, and history match; only exportedAt may differ on re-export
- A page reload returns this good-app to the exact eight-slot seeded baseline with zero recovery, zero resolved, no event history, and no export-success confirmation because browser storage is not used
</user_flows>

<edge_cases>
- Exact field minima and maxima are accepted: speakerName lengths 2 and 80, sessionTitle lengths 3 and 120, startMinute 480 and 1080, durationMinutes 15 and 90, mobileNote length 160, and shortLink lengths 3 and 32; each adjacent out-of-range value is rejected with the field, rejected rule, and recovery action named
- Unknown room, status, previewState, or recovery lane enums; non-five-minute timing; duplicate IDs; duplicate short links; dangling selection or history references; nonsequential history; stale derived counts; overlapping repair times in the same room; unknown top-level keys; and malformed JSON all leave state byte-for-byte unchanged
- Import diagnostics list all failing file, record index, field, rejected rule, and correction guidance in one visible report; correcting one field clears only that field's error while the remaining diagnostics stay visible
- Deleting or filtering away every visible record shows a helpful empty state with Clear filters, Add slot, and Import JSON recovery actions; derived totals read zero when the collection is actually empty
- Rapid double activation of Add, Move to recovery, Apply repair, Delete, Import, and Clear produces at most one committed event or transaction and never duplicate records or history sequence numbers
</edge_cases>

<visual_design>
- The desktop workbench uses an intentional three-surface composition: a 280-pixel slot navigator, a broad recovery canvas, and a 320-pixel inspector with phone preview; a compact summary ribbon and event timeline complete the workspace rather than resembling a generic CRUD table
- The palette uses ink #17211B, warm paper #F4F0E8, moss #3C6E57, amber #D99B45, failure coral #C95E55, and resolved mint #D7E9DD; every status pairs color with a text label or icon
- Typography uses a compact uppercase eyebrow, a high-contrast display title, and legible 14-to-16-pixel workbench copy; identifiers and artifact text use a distinct monospaced treatment
- Board lanes have distinct headers, counts, subtle grid texture, stable card anatomy, and clear empty states; selected cards use both a dark outline and Selected text rather than color alone
- The phone preview resembles an original event share card rather than copied Canva branding: dark bezel, timing badge, speaker card, compact bar chart, and local short-link footer
- Buttons, inputs, cards, filters, dialogs, timeline rows, and drop targets show distinct default, hover, focus, active, disabled, validation, and selected treatments within one spacing and radius system
</visual_design>

<motion>
- Dragging the real slot card toward Recovery path lifts the card and highlights the valid drop target; on drop it settles into the new lane over roughly 220 milliseconds while linked count and preview changes remain immediate
- Moving to recovery and applying repair through visible controls animate the acted-on card between state treatments; no WebMCP-only state shortcut is required to see the motion
- Add, delete, reorder, filter, and import transitions animate affected cards and surrounding layout instead of flashing or reloading the document
- Dialogs and the import drawer enter with a 180-to-240-millisecond opacity and scale or slide transition, keep content stable, and reverse on close
- Hover animations are required: buttons, cards, filter chips, table rows, timeline rows, and drop targets ease background, border, shadow, or translation; press feedback is visibly distinct from hover
- Toasts and live confirmations slide in, remain readable, and fade automatically without blocking controls
- With prefers-reduced-motion set, transforms and timed transitions are removed while outlines, labels, count changes, and live announcements preserve the complete causal feedback
</motion>

<responsiveness>
- At 1440 pixels the slot navigator, recovery canvas, and inspector are simultaneously visible without page-level horizontal scrolling
- At 900 pixels the navigator becomes a collapsible drawer, the recovery board stays primary, and the inspector follows the board as a full-width panel
- At 375 by 812 pixels the surface becomes three labeled steps, Slots, Recover, and Preview; each tab exposes the full canonical flow, every target is at least 44 by 44 pixels, and no page-level horizontal overflow occurs
- On mobile, selecting a failed slot in Slots and activating Recover opens the Recovery step with the same slot selected; Apply repair advances to Preview and shows the updated Live share card
</responsiveness>

<accessibility>
- A skip link reaches the workbench main region; headings and landmarks follow a logical order; every icon has an accessible name or is hidden when decorative
- Every action is reachable and operable by keyboard with a visible focus indicator; pointer drag has Move to recovery and lane-order controls that invoke the identical stable-ID commands
- Add, edit, delete, clear, and import dialogs use dialog semantics, trap focus while open, close with Escape, and restore focus to the opener
- Status and validation never rely on color alone; field errors are linked to their inputs, the complete import report is announced, and slot, summary, preview, copy, import, repair, and undo changes use a polite live region
- Ctrl/Cmd+Z invokes Undo unless focus is inside a text field; focus remains on a meaningful control after move, repair, deletion, import, clear, and mobile-step changes
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load with no layout jump, console error, page error, or non-local network request
- With the 104-record fixture loaded, pointer or button mutation acknowledges within 100 milliseconds, linked counts and preview settle within 500 milliseconds, and export or import completes within 2 seconds
- Rapid filter, selection, keyboard, edit, move, undo, export, and import operations stay responsive without dropped interaction, duplicate events, stale rows, or unrelated cards visibly rebuilding
</performance>

<writing>
- Headings, buttons, status labels, and field labels use consistent sentence-case terminology for Speaker slots, Recovery path, Mobile preview, and Event timeline
- Errors identify the field, rejected value or rule, and a specific correction; empty states explain what is absent and provide the exact next action
- Action labels use domain verbs such as Add slot, Move to recovery, Apply repair, Archive slot, Export JSON, Copy JSON, and Import JSON; no placeholder, lorem, generic Submit, or copied brand text appears
</writing>

<innovation>
- Optional enhancements may add genuinely useful greenroom utility such as guided conflict comparison, accessible command search, or an alternate timing visualization, provided they preserve the exact canonical state and artifact contract
</innovation>

<requirements>
Shared application state must use Zustand in memory only: records, recoveryBoardState ordering, selected ID, status filter, search, mobile step, dialogs, derived summaries, undo snapshots, event history, and artifact preview. Do not use localStorage, sessionStorage, IndexedDB, cookies, service-worker caches, URL persistence, or another browser storage API.
State contracts:
- Visible controls and WebMCP tools invoke the same domain commands; stable IDs, record fields, derived values, selection, history, and exports must agree after normalization
- Create, edit, archive, delete, move-to-recovery, repair, reorder, import, clear, and undo are atomic; invalid, cancelled, duplicate, and no-op actions do not mutate any facet
- Undo snapshots include record ordering, selected ID, filters, derived state inputs, and history anchor; a new branch after undo discards redo
- Import validates the full ConferenceSpeakerGreenroomBoardSession document before commit and never partially applies valid records from an invalid file
Stack and tooling:
- React with a Vite SPA setup, Zustand for shared state, Tailwind CSS 4.3.2 for layout and tokens, and Radix UI for dialogs, tabs, selects, tooltips, and toasts
- React Hook Form paired with Zod drives every create, edit, repair, and import form; the schemas expose inline field-level errors and model the same API-shaped record and artifact payloads described above
- Motion for React and AutoAnimate are allowed for animation; no other animation libraries
- Recharts renders the live timing chart; Phosphor icons via @phosphor-icons/react are the only icon set
- All libraries are installed via npm and bundled locally; no CDN, backend, authentication, external API, analytics, notification service, or non-local runtime request
- Document title is Greenroom Recovery Board; all synthetic conference data is original
- npm start serves the app on port 3000 and npm run verify:build succeeds before serving
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in summary; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before finishing, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. The verifier runs the same verify:build gate first; an app that fails it is not served or judged.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the webmcp_action_contract below using the same domain commands as visible controls. Mechanics exclusions remain browser-graded.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- form-workflow-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

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

<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
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
- Browse destinations are slots, recovery-board, mobile-preview, import, and export; searchable entity is speaker-slot; status filters are all, draft, ready, changed, failed, recovery, resolved, and archived; sorts are start-asc, start-desc, and board-order.
- Entity is speaker-slot; operations are create, select, update, delete, toggle archive, quantity performance-fixture, and reorder; fields are speakerName, sessionTitle, room, startMinute, durationMinutes, status, mobileNote, shortLink, recoveryStartMinute, and repairNote with the exact enums and bounds declared above.
- Form fields are the exact speaker-slot, repair, and import validation fields; operations are validate, submit, cancel, and reset; visible errors remain active.
- Artifact operations are import, export, copy, and print preview; import mode and export format are speaker-greenroom-v1; export and copy expose no artifact bytes through WebMCP.

Mechanics exclusions:
- Pointer drag, touch-equivalent controls, keyboard focus, Ctrl/Cmd+Z, modal focus trapping, hover/computed styles, animation timing, reduced-motion behavior, mobile transformation, clipboard contents, file-picker contents, downloaded bytes, and runtime performance remain browser-graded through their real control paths.
</webmcp_action_contract>
