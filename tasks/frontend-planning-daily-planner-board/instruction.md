<summary>
Build a Cadence multi-day daily planner board using Vue 3 with Nuxt static-site delivery, Pinia, Tailwind CSS 4.3.2, and shadcn-vue. The app produces the user's portable planner artifacts: a valid ICS calendar payload and a structured planner JSON the app can re-import.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Board chrome and seeded baseline —
- The app opens straight onto the Home board — a left global-nav rail, a central multi-day board, and a right calendar rail — with no login, signup, or onboarding gate
- The central board renders 21 day columns from Monday July 6 through Sunday July 26, laid out left to right and horizontally scrollable; each column header shows its weekday and date (for example Monday and July 6) and a per-column action label that reads Reflect for the past days July 6 through 17, Shutdown for July 18, and Plan for the future days July 19 through 26
- The board opens non-empty with four seeded tasks: Set up Cadence and Weekly planning in the July 18 column, Daily planning in the July 19 column, and Work in the July 20 column; every seeded task shows an unchecked completion checkbox and a #work channel tag
- The Set up Cadence task shows a planned-time chip reading 0:20, a notes indicator, and an expanded subtask checklist of exactly Add a task, Complete daily planning, Add integrations, Add channels, and Add recurring tasks; the Work task shows a scheduled start reading 9:00 am and a planned-time chip reading 1:00
- The left nav rail shows the Cadence wordmark, primary items Home (rendered active), Today, and Focus, a Daily rituals group (Daily planning, Daily shutdown, Daily highlights), a Weekly rituals group (Weekly planning, Weekly review), Backlog, and the controls Add folder and Invite someone, plus an account footer reading Alex Rivera and alex.rivera@example.com
- The right rail also shows a utility strip of Search, GitHub, Backlog, Archive, Objectives, and Calendar buttons, and the board header shows Today, Filter, Board, Export, Undo, and Redo controls
- Chrome-only controls never navigate to another origin: clicking any left-nav item other than the active Home, the board Filter control, the right-rail Search, GitHub, Backlog, Archive, or Objectives buttons, Add folder, Invite someone, or the help button shows a brief demo toast and keeps the board in view
- A help button in the bottom corner shows a demo toast rather than opening any external chat widget
- Zero outbound navigation — in-app controls only; no backend routes exist

Feature: Task collection and field contract —
- Tasks are the primary collection: each day column has an Add task control that appends a new task to that column, and each task can be opened and edited (title, channel, planned time, scheduled start, notes), completed, and deleted; adding, editing, or deleting tasks updates the board from shared application state without a full page reload
- Task field contract (the create and edit form submits exactly this payload; the record the form creates IS the request body a planner API would accept): title (required non-empty string, max 120 characters), day (required closed enum of the twenty-one ISO dates 2026-07-06 through 2026-07-26), channel (required closed enum: work, personal, health, focus — rendered as a #channel tag), plannedTime (optional duration string H:MM or HH:MM where minutes are 00 through 59 and total duration is at most 12:00), startTime (optional clock string matching h:mm am or h:mm pm, for example 9:00 am), done (boolean, default false), notes (optional string, max 500 characters), subtasks (optional list of objects each with title string max 80 characters and done boolean, at most 12 subtasks). Out-of-enum day or channel, a plannedTime over 12:00, a startTime that is not a clock string, or an empty title keeps submit disabled and shows an inline error naming that field
- The Add task and task edit forms validate inline: an invalid field shows an error message naming that field before submit, and the submit control stays disabled until every required field is valid
- Each day column shows a planned-time footer total that recomputes from that column's tasks: July 18 reads 0:20 and July 20 reads 1:00 on first load

Feature: Calendar day panel —
- Two interaction modes read from the same task collection: the multi-day board and a calendar day panel in the right rail; the calendar panel titled Calendars shows a 1x zoom control, a day header reading Sat 18, an all-day event reading Automatic Bill Payment - Sallie Mae, and an hour ruler listing every hour from 12 AM through 11 PM; a task that carries a scheduled start appears on the selected day's hour grid, and selecting a different day updates the calendar panel in place without a reload
- On the calendar day panel, dragging a scheduled task's block to a different hour slot updates that task's scheduled start, and the task's board card shows the new start time without a reload
- Schedule conflict drawer: when two or more incomplete tasks on the same day share the same startTime, a Conflicts control shows a count greater than zero and opening it lists each colliding pair by title; resolving by changing one task's startTime drops that pair from the drawer and decrements the count

Feature: Channel filter and search —
- A Filter control on the board header opens channel chips for All, work, personal, health, and focus plus a search field; choosing a channel other than All hides tasks whose channel does not match across every day column while preserving the 21-column structure, and typing in search narrows visible tasks by title match; clearing channel and search restores every task
- Column planned-time footer totals always reflect only the currently visible tasks in that column

Feature: Multi-select and bulk tray —
- Each task card exposes a selection checkbox distinct from its completion checkbox; selecting one or more tasks reveals a bulk tray with Complete selected, Move to day, and Delete selected
- Complete selected marks every selected task done on the board and on the calendar day panel when scheduled
- Move to day opens a day picker of the twenty-one board days; confirming reassigns every selected task to that day, updates column footers, and moves calendar blocks when those tasks carry a startTime
- Delete selected removes every selected task from its column, the calendar panel, and the planned-time totals after a visible confirm step

Feature: Morning rollover —
- A Rollover incomplete control on the board header collects every incomplete task whose day is before July 18 (2026-07-06 through 2026-07-17) and moves them onto the July 18 column in one action; column footers and the calendar panel update without a reload; completed past-day tasks stay on their original days

Feature: Undo and redo —
- Undo and Redo controls reverse and reapply the most recent task mutation (create, edit, complete toggle, delete, bulk action, rollover, or calendar drag reschedule); after deleting a task, Undo restores its card, calendar block when scheduled, and the affected column footer; Redo removes it again
- With an empty undo history the Undo control is disabled or inert; with nothing to redo the Redo control is disabled or inert

Feature: Export and import artifacts —
- An Export control opens an export canvas with ICS and Planner JSON tabs that always show live-compiled text from the full session task store (not the filtered visible subset); every create, edit, delete, complete toggle, bulk action, rollover, and calendar drag must appear in the regenerated artifacts — an export that omits session work is a failure
- ICS field contract: the ICS tab renders a payload that begins with BEGIN:VCALENDAR, contains exactly one VEVENT block per task that has a day assignment (every board task), with SUMMARY equal to the task title, DTSTART matching that task's day plus startTime when startTime is set (or an all-day VALUE=DATE on that day when startTime is absent), and ends with END:VCALENDAR; when plannedTime is set the VEVENT includes a DURATION or DTEND consistent with that planned duration
- Planner JSON field contract: a top-level object with schemaVersion equal to the string 1, board (object with title Cadence, dateStart 2026-07-06, dateEnd 2026-07-26), and tasks (array). Every element of tasks conforms to the Task field contract above (same field names, enums, bounds, and cross-field rules). The JSON is compiled LIVE from the store
- Download ICS and Download planner JSON offer real downloads of those artifacts; Copy on either tab puts the exact visible preview text on the clipboard and shows a brief copied confirmation
- Import planner JSON accepts a previously exported planner JSON file or pasted JSON and reconstructs the tasks collection so board cards, column footers, calendar blocks, conflict counts, and both export previews match the imported document; malformed JSON or a payload that violates the Task field contract shows a visible error naming the import problem and leaves the current session unchanged
</core_features>

<user_flows>
- Submitting Add task on the July 19 column with a valid title appends exactly one card to that column, increases that column's card count by exactly one, recomputes the column's planned-time footer total when a planned time is entered, and, when a scheduled start is entered, shows the same task on the July 19 calendar day panel without a reload
- Clicking the Work task's checkbox on the board marks that card completed, and the same task's block on the July 20 calendar day reflects the completed state without a reload; clicking the checkbox again clears the completed state in both places
- Editing a task's title and planned time from its edit form updates the board card text, recomputes that column's planned-time footer total, and updates the task's calendar panel block when it carries a scheduled start, all without a reload
- Deleting a scheduled task removes its card from the column, removes its block from the calendar day panel, and reduces that column's planned-time footer total by the deleted task's planned time
- Channel filter flow: set channel filter to work, confirm only #work tasks remain visible across columns; switch to personal and confirm the seeded #work tasks hide; clear the filter and confirm all four seeded tasks return
- Bulk complete flow: select Daily planning and Work, activate Complete selected, and confirm both cards render completed on the board and Work's July 20 calendar block reflects completed
- Rollover flow: add an incomplete task titled Carry me to the July 17 column, activate Rollover incomplete, and confirm Carry me moves to the July 18 column while July 17's footer drops that task's planned time
- Undo/redo round trip: delete Weekly planning, confirm it is gone from July 18, press Undo and confirm it returns with the July 18 footer restored, then press Redo and confirm it is removed again
- Export then import round trip: rename Work to Deep work, set its plannedTime to 1:30, create one new valid task on July 21, Copy or Download the planner JSON, reload to the seeded baseline, Import that JSON, and confirm board cards, footers, calendar blocks, ICS, and planner JSON match the pre-export mutated state
- After creating a scheduled task, open Export: the ICS preview gains exactly one VEVENT whose SUMMARY matches the new title and whose DTSTART matches its day and startTime, and the planner JSON tasks array gains one object matching the Task field contract
- A page reload returns the app to its seeded state: exactly the four seeded tasks, the July 18 column total reading 0:20, the July 20 column total reading 1:00, and the other 18 columns empty at 0:00; session mutations that were not exported are gone
</user_flows>

<edge_cases>
- Submitting Add task with an empty required title shows visible validation feedback naming the title field and adds no task; the column's card count and planned-time total do not change
- Submitting with an out-of-enum channel or a plannedTime of 13:00 shows a field error naming channel or plannedTime and adds no task
- Double-activating a valid Add task submit creates exactly one task: the column's card count increases by exactly one
- Deleting every task in a column, or a column that started empty, shows an empty column that still offers Add task and reads a 0:00 planned-time total; with every task deleted the ICS payload has zero VEVENT blocks and the planner JSON tasks array is empty
- A task with no planned time contributes nothing to its column's footer total, and a task with no scheduled start never appears on the calendar hour grid
- With an empty undo history the Undo control is disabled or inert, and activating it produces no state change and no console error
- Importing malformed or undecodable planner JSON, or JSON whose tasks violate the Task field contract, shows a visible error naming the import problem, leaves the current session state unchanged, and produces no console errors
- Bulk Delete selected with zero tasks selected keeps the tray actions disabled or inert and deletes nothing
</edge_cases>

<visual_design>
- Calm productivity-app composition on a light surface: a fixed left nav rail, a central board of dense day columns, and a fixed right calendar rail, with a single accent color used for the active nav item, the Today control, planned-time chips, and channel tags
- Day columns are narrow, equal-height cards with a header (weekday, date, action label), a scrollable task area, an Add task affordance, and a planned-time footer; the July 18 column is visually marked as today
- Task cards are compact: a circular completion checkbox at left, the title, a #work channel tag, optional scheduled-start and planned-time chips, an optional notes indicator, and an optional subtask checklist
- The calendar panel uses a titled header with a 1x zoom pill, a highlighted all-day event row, and a full 24-row hour ruler from 12 AM to 11 PM
- The right utility strip stacks six icon buttons (Search, GitHub, Backlog, Archive, Objectives, Calendar); density reads as a planner workspace, not a marketing landing
- Icons across the nav rail, utility strip, board header, and task chips come from one consistent icon set with a uniform visual weight
- The export canvas presents ICS and Planner JSON as monospaced previews with Download and Copy controls — not a screenshot dead end
- The bulk tray and conflict drawer adopt the same spacing scale, radii, and accent as the board chrome
</visual_design>

<motion>
- Task add and remove: a newly created task card animates into its column, a deleted card animates out, and the surrounding cards slide smoothly to close the gap
- Task completion: toggling a checkbox animates the checked state with a short transition and the task's appearance updates immediately
- Calendar drag: while dragging a scheduled task's block on the hour grid, the block follows the pointer and settles into its new slot with a short ease
- Planned-time totals: a column's footer total updates immediately when its tasks change
- Calendar panel: selecting a different day swaps the panel contents in place without a page reload
- Demo toast: chrome-only controls show a toast that enters with a short ease, holds briefly, then exits
- Export canvas and bulk tray: opening either surface animates in with a short ease; closing reverses it
- Hover animations (required): nav items, board and header buttons, task cards, Add task affordances, and right-rail buttons take a visible hover wash or border or shadow change and use a pointer cursor
- With prefers-reduced-motion set, animations are removed and state changes apply instantly
</motion>

<responsiveness>
- At 1440 pixels wide all three regions are visible: the fixed left nav rail, the central multi-day board, and the fixed right calendar rail
- The board scrolls horizontally inside its own region; the page body never scrolls horizontally and no content clips outside the viewport at desktop widths
- At narrower desktop widths the central board region shrinks while remaining horizontally scrollable; the nav rail and calendar rail never overlap board content
- The export canvas and bulk tray remain fully usable at 1440 and at 1024 without clipping their primary controls
</responsiveness>

<accessibility>
- Every interactive control — nav items, Add task controls, task checkboxes, selection checkboxes, board header buttons, bulk tray actions, export and import controls, and right-rail buttons — is reachable and operable with the keyboard alone and shows a visible focus indicator
- The task edit dialog uses dialog semantics with aria-modal, traps focus while open, and returns focus to the control that opened it on close
- Each task's completion checkbox exposes an accessible name that includes the task title
- The demo toast and copied confirmation are announced through an aria-live polite region as well as shown visually
- The Conflicts control exposes an accessible name that includes the current conflict count
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- The console stays clean during a full exercise of the app: no errors, no warnings, and no hydration mismatch messages on first load or after in-app interaction
- Loading the app URL directly renders the complete board with its seeded tasks; pre-rendered content does not visibly flash or get replaced by different content after the page becomes interactive
- Rapidly toggling checkboxes, adding tasks, filtering, and recompiling export previews keeps the UI responsive with no hangs or dropped interactions
</performance>

<writing>
- Headings, buttons, and nav labels keep one consistent capitalization convention throughout the app
- Validation and empty-state messages name the problem and the fix in plain language; no placeholder or lorem text appears anywhere in the shipped UI
- Action labels are specific verbs such as Add task, Export, Download ICS, Copy planner JSON, Import planner JSON, Rollover incomplete, Complete selected, and Undo rather than generic labels where a specific one is possible
</writing>

<requirements>
Shared application state must use Pinia, the state library named in summary (in-memory only): the tasks collection, per-task fields from the Task field contract, the selected calendar day, channel filter, search query, multi-select set, undo/redo history, conflict list, export text for ICS and planner JSON, and the toast timer. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this good-app genre is the portable planner artifacts (ICS + planner JSON) plus the MCP query surface — never browser storage.
State contracts (behavioral, not storage keys):
- Creating a valid task appends it to the chosen day column, recomputes that column's planned-time total, and regenerates ICS and planner JSON
- Editing a task updates that same task in the board, in the calendar panel when it is scheduled, and in both export previews
- Deleting a task removes it from its column, the calendar panel, that column's planned-time total, and both export previews
- Toggling a task's completion updates the same task's state everywhere it appears
- The calendar day panel is derived from the shared tasks collection for the selected day; it is not a second disconnected copy
- Per-column planned-time totals are derived from each column's visible tasks, not hardcoded captions
- Import reconstructs the tasks collection into that same store; undo, bulk actions, and rollover operate on the same collection the UI and exports read
Stack: Vue 3 delivered through Nuxt as a static export or SSR with client hydration; all interactivity lives in client state after load — no server API routes, no server actions, no backend, and no authentication. Frontend-only.
- Tailwind CSS 4.3.2 (pinned) is the styling base; design tokens live in the Tailwind theme
- shadcn-vue is the component library: use it for the task edit dialog, selects, form inputs, dropdown menus, export canvas, and toasts; no other component or UI-kit libraries
- Motion for Vue and AutoAnimate are allowed for animation; no other animation libraries
- Phosphor icons via the @phosphor-icons/vue package only; no other icon sets and no icon CDNs
- The calendar day panel is built on @event-calendar/core
- All forms (Add task, the task edit form, and the planner JSON import paste when presented as a form) validate through VeeValidate paired with a Zod schema: the schema defines the rules and the form renders inline per-field errors before submit. The schema is API-shaped: it models the Task payload a real planner API would accept — the Task field contract above — and the created record is that request body; planner JSON export and import use the same field names, enums, bounds, and cross-field rules; ICS VEVENT SUMMARY/DTSTART/DURATION are derived from those same fields. Field contracts are enforceable in the UI (named field errors), not only declared in schema code
- All libraries are installed via npm and bundled locally; no CDN imports of scripts, styles, fonts, or icons
- Seed exactly the four tasks above so the July 18, July 19, and July 20 columns are non-empty on first load; the other 18 columns start empty with a 0:00 total; every seeded task conforms to the Task field contract (channel work, days 2026-07-18 / 2026-07-19 / 2026-07-20)
- Document title MUST be Cadence
- Zero navigational outbound links; synthetic demo data only
- Desktop layout: fixed left nav rail, central multi-day board, fixed right calendar rail
- The planner export is the session's useful end state: Download and Copy must emit live-compiled ICS or planner JSON that reflects every mutation; Import round-trips a valid planner JSON back into the visible surfaces
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
- Browsable entity: tasks
- Destinations: board; calendar-day-panel; export-canvas
- Filters: channel; search; day
- Entity: task
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; done; channel; plannedTime; day; startTime; notes; subtasks
- Value bounds: {"day":["2026-07-06","2026-07-07","2026-07-08","2026-07-09","2026-07-10","2026-07-11","2026-07-12","2026-07-13","2026-07-14","2026-07-15","2026-07-16","2026-07-17","2026-07-18","2026-07-19","2026-07-20","2026-07-21","2026-07-22","2026-07-23","2026-07-24","2026-07-25","2026-07-26"],"channel":["work","personal","health","focus"],"plannedTime":"optional H:MM or HH:MM duration; minutes 00-59; max 12:00","startTime":"optional h:mm am/pm clock string","title":"required non-empty string max 120","notes":"optional string max 500","subtasks":"optional list max 12 of {title max 80, done boolean}"}
- Form fields: title; done; channel; plannedTime; day; startTime; notes; subtasks
- Form operations: validate; submit; cancel
- Artifact operations: export; import; copy
- Export formats: ics; planner-json
- Import modes: planner-json

Mechanics exclusions:
- Calendar panel day-scroll / hour-grid gestures stay Playwright-observed
- Calendar drag reschedule gesture fidelity stays Playwright-observed
- Undo/redo keyboard and control path stays Playwright-observed
- Multi-select and bulk tray gestures stay Playwright-observed
- File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp may drive paste-mode Import confirm only
- Download file contents and clipboard payload remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
