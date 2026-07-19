<summary>
Build a personal time-tracking productivity app using Svelte 5 with SvelteKit static delivery, Svelte stores, Tailwind CSS 4.3.2, and Skeleton.
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

Feature: Dashboard shell â
- The app opens at / into a single-user time-tracking dashboard with no login: a header showing the ClockCraft wordmark, a Meaningful ratio stat, a Today's minutes stat, and a Meaningful streak stat, plus a Live timer panel, a Today's timeline, a Weekly overview chart, a streak heat-map, and an All entries list. It starts completely empty â no seeded entries and no seeded tags
- The app never navigates away from /: all controls act through in-app state and there are no outbound navigational links in the chrome

Feature: Live timer â
- The Live timer takes an activity name and a required category, and clicking Start timer begins a running timer whose elapsed display increases about once per second; clicking Stop timer saves the elapsed time as a new entry
- Only one timer runs at a time: starting a new timer while one is already running automatically stops and saves the previous timer as a completed entry with a nonzero duration, and shows a toast noting the switch, leaving only the new timer live
- Stopping a running timer (Stop timer or an auto-switch) that has run for less than 25 minutes opens an interruption reason step requiring exactly one of Internal or External before the entry is committed; cancelling the interruption step leaves the timer running and adds no entry; confirming writes the chosen reason onto that entry and shows it as a small chip on the entry in the list and timeline

Feature: Manual entry and field contract â
- An Add entry manually form logs a past activity from an activity name, a required category, a start time, and a duration in minutes without running a live timer; submitting adds the entry to the timeline and list with the specified name, category chip, and duration
- The manual form, the timer inputs, the tag manager, the edit dialog, and the interruption reason step validate each field inline before submit: an invalid field shows a message beside that specific field naming what is wrong, and the submit control stays disabled while any required field is invalid
- Every entry is modeled as a time-entry API record whose field contract is:
  - Required name: trimmed non-empty string, at most 120 characters
  - Required category: exactly one of the closed enum Meaningful, Neutral, or Draining (selector always defaults to a valid value)
  - Optional tag: null or a trimmed string of at most 40 characters naming an existing custom tag
  - Required durationMinutes: integer greater than or equal to 1 and at most 1440
  - Required startTime: a local datetime string parseable as YYYY-MM-DDTHH:mm (24-hour)
  - Optional interruptionReason: null, or exactly one of the closed enum Internal or External
  - The record a create or edit form produces IS that payload shape â same field names, bounds, and enums â and form validation enforces the same contracts the export shape declares, always naming the offending field inline
- Every entry carries exactly one category chosen from the required selector; each category renders as a visually distinct colored chip everywhere the entry appears

Feature: Tags â
- A tag manager lets the user create reusable custom tags (for example Reading or Social Media) and one such tag can be assigned to any entry through the timer, the manual form, or the edit dialog; the assigned tag shows on or beside that entry

Feature: Timeline, stats, and charts â
- The Today's timeline renders each of today's entries as a block whose size is proportional to its duration and whose color matches its category, with the activity name and duration legible in or beside each block; a 60-minute entry renders roughly twice as tall as a 30-minute entry
- The header Meaningful ratio shows the percentage of today's tracked minutes that are Meaningful versus Draining
- The Weekly overview is a seven-day stacked bar chart with one bar per day, each bar split into Meaningful, Neutral, and Draining segments sized to that day's minutes; hovering a bar segment surfaces a tooltip identifying its day, category, and minutes
- A Meaningful streak counter shows the number of consecutive days on which Meaningful minutes exceeded Draining minutes, and reflects a multi-day streak built from prior days of tracked data
- A streak heat-map below the Weekly overview shows at least the last 12 weeks as a grid of day cells; each cell's fill intensity encodes that day's total tracked minutes (empty days stay visibly empty), and hovering a cell surfaces a tooltip with the day and total minutes; logging or deleting entries for a day updates that cell immediately

Feature: Edit, delete, filter, search â
- Clicking an entry opens an edit dialog prefilled with its current values where the name, category, tag, duration, and interruption reason can be changed; saving updates that entry's rendering â chip color, duration, text, and interruption chip â everywhere it appears
- Each entry has a labeled Delete control that opens a confirmation step; cancelling the confirmation leaves the entry in place, and confirming removes it from the timeline, the list, the ratio, the chart, and the heat-map
- Category filter buttons labeled All, Meaningful, Neutral, and Draining narrow the timeline and list to entries of the chosen category, and the active filter button is visibly highlighted
- A search input narrows the entry list as the user types, matching the typed text against activity name or assigned tag, and clearing the search restores the full list

Feature: Bulk selection â
- Each All entries list row carries a checkbox; selecting one or more entries reveals a bulk action bar naming the selected count with Set category (Meaningful / Neutral / Draining) and Clear selection
- Choosing a category from Set category updates every selected entry's category chip in the list and timeline, recomputes the Meaningful ratio, Weekly overview, and heat-map, and leaves the selection cleared; Clear selection clears checkboxes without mutating entries

Feature: Toasts and history â
- Starting a timer, saving a manual entry, deleting an entry, completing a bulk category change, and exporting or importing each raise a transient toast confirmation that appears after the action and then dismisses on its own
- A View history control opens a history panel that models edits to the entry collection as explicit transitions: it shows Undo and Redo controls, a region labelled History state showing the current snapshot, a numbered list of snapshots, and an Apply scenario change action; Undo and Redo restore the exact adjacent visible states
- Undoing one or more steps and then making a different change (for example Apply scenario change, or a new create, edit, delete, or bulk categorize) creates a selectable alternate branch rather than silently discarding or flattening the abandoned states; the panel lists the alternate branches, and selecting a branch restores the exact prior visible state that branch represents

Feature: Command palette â
- Pressing Cmd+K (or Ctrl+K) opens a command palette overlay with a scoped search input; typing fuzzy-matches across commands (Start timer focus, Add entry manually, View history, Export session, Import session, filter All / Meaningful / Neutral / Draining) and custom tag names, with matches updating on every keystroke
- Arrow keys move the palette highlight, Enter activates the highlighted command (focusing the timer, opening the named overlay, applying the filter, or opening Export / Import), and Escape closes the palette

Feature: Session artifacts (the app produces the user's time-tracking files) â
- An Export session control opens a centered artifact drawer with two format tabs â Session JSON and Timesheet CSV â each regenerated live from the current in-memory entries and tags whenever the collection changes
- Session JSON is API-shaped like a time-tracking service export: a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: the string "clockcraft.session.v1"
  - Required exportedAt: an ISO-8601 timestamp string
  - Required tags: an array of objects each with required name (trimmed non-empty, at most 40 characters)
  - Required entries: an array of time-entry records each conforming to the entry field contract above (name, category, tag, durationMinutes, startTime, interruptionReason)
  - Required rollup: an object with required todayMinutes (non-negative integer), meaningfulRatio (number from 0 to 100 inclusive), and streakDays (non-negative integer) that match the header stats derived from the same collection
- Timesheet CSV is a spreadsheet-ready text with a header row exactly name,category,tag,durationMinutes,startTime,interruptionReason and one data row per entry in the current collection; cells escape commas and quotes so a spreadsheet can open the file
- Each format tab offers Copy (writes that format's text to the clipboard with a brief copied confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
- Export content that omits the session's actual work is invalid: after adding or editing entries, both open export formats must contain those entries' names, categories, and durations, and Session JSON must still show every required key from the field contract including rollup values that match the visible header stats
- An Import session control accepts a previously exported Session JSON file; after an explicit confirmation that warns the current session will be replaced, a document that passes the field contract replaces the in-memory entries and tags so the list, timeline, ratio, streak, Weekly overview, heat-map, and both export previews show the imported state; malformed JSON or a document that fails the field contract (wrong schemaVersion, missing required keys, category outside the closed enum, durationMinutes outside 1â1440, invalid startTime, or rollup values that do not match recomputation from entries) shows visible validation feedback naming the offending field and changes nothing
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- Timer round trip: starting the Live timer with a name and a Meaningful category, letting it run past 25 minutes worth of elapsed display or confirming an interruption reason after a short run, and clicking Stop timer adds exactly one entry to the All entries list and one block to the Today's timeline, increases the Today's minutes stat by the elapsed amount, recalculates the Meaningful ratio, grows a matching Meaningful segment on today's bar in the Weekly overview, and updates today's heat-map cell â all without a reload
- Manual add echo: submitting the Add entry manually form with a valid name, category, start time, and duration adds exactly one row to the All entries list, renders a proportional block in the timeline, and updates the ratio, Today's minutes, today's chart bar, and heat-map in the same interaction; selecting that entry's category filter still shows the new entry
- Edit propagation: changing an entry's category from Draining to Meaningful in the edit dialog and saving updates that entry's chip color in both the timeline and the list, moves the corresponding minutes between segments on today's chart bar, and shifts the Meaningful ratio and its colored lean toward Meaningful, all without a reload
- Delete propagation: confirming a delete decreases the All entries list count by exactly one, removes the matching timeline block, and recomputes the ratio, streak, chart, and heat-map immediately
- Bulk categorize: selecting two entries of different categories, choosing Set category â Meaningful, clears the selection and shows both entries with Meaningful chips while the Meaningful ratio and today's chart segment increase accordingly
- Artifact end state: after creating entries and at least one custom tag, open Export session and confirm Session JSON and Timesheet CSV each contain the session's actual entry names, categories, and durations, Session JSON shows schemaVersion, exportedAt, tags, entries, and rollup keys with rollup values matching the header stats; Copy confirms on the active tab; Download of Session JSON then Import of that same document reconstructs the same visible entries, tags, stats, chart, and heat-map
- Interruption then export: start a timer, stop it before 25 minutes, choose External, confirm the entry shows an External interruption chip, and reopen Export â Session JSON for that entry includes "interruptionReason":"External" and the CSV row's last cell is External
- A page reload returns the app to its empty seeded state: no entries, no tags, empty timeline and list empty states, zero Today's minutes, empty heat-map, and empty undo/redo history
</user_flows>

<edge_cases>
- Before any entry exists, the timeline and All entries list show friendly empty states, and the timeline invites the user to log a first activity
- A search or filter that matches nothing shows an explicit no-results message rather than a blank area; clearing the search or choosing All restores the full list exactly
- Submitting the manual form with an empty name or a zero, negative, or non-numeric duration is rejected with a visible inline message naming the offending field, and adds no entry
- Submitting a name longer than 120 characters, a durationMinutes above 1440, or a startTime that is not YYYY-MM-DDTHH:mm is rejected with a visible inline message naming the offending field, and adds no entry
- Double-activating the manual form's submit control creates exactly one entry: the list count increases by one and one new row appears
- Undo is disabled when there is no earlier snapshot and Redo is disabled when there is no later snapshot to move to
- Deleting the last remaining entry returns the timeline and list to their empty states and the Today's minutes stat to zero
- Cancelling the interruption reason step leaves the timer running and adds no entry
- Importing malformed Session JSON, or JSON that fails the field contract, leaves entries, tags, stats, chart, and heat-map unchanged and shows validation naming the offending field
- Bulk Set category with zero selected entries is unavailable (control disabled or hidden)
</edge_cases>

<visual_design>
- Clean, airy productivity-tool composition on a light neutral background (about #F9FAFB) with white surface cards (about #FFFFFF) separated by hairline borders (about #E5E7EB); the header stats, timer, timeline, weekly chart, heat-map, and entry list read as distinct rounded cards
- Three category colors that are distinguishable at a glance on both chips and chart segments: green for Meaningful (about #16A34A), slate for Neutral (about #64748B), and rose for Draining (about #E11D48)
- Body and UI text use a system sans-serif stack while the live timer digits and duration numbers use a monospace stack so they read as precise measurements, visibly distinct from surrounding text
- A 4px spacing base: cards and inputs use an 8px-scale rounded corner and buttons a slightly tighter 6px-scale corner; primary buttons are a filled dark button with white text, and secondary buttons are outlined against the border color
- A single icon set is used consistently across the chrome â timer, filter, search, delete, history, export, and palette controls carry icons from one visually coherent family, never mixed styles
- Timeline blocks are visibly proportional to duration and colored by category, with name and duration legible inside or beside each block
- The Meaningful ratio stat visually leans toward whichever side, Meaningful or Draining, currently has more minutes, using the meaningful and draining color tokens rather than a plain uncolored number
- The currently selected category filter is highlighted with a fill or underline so the active view is obvious
- The weekly chart's stacked day segments stay individually legible with visible separation between days, and a small legend maps colors to categories
- The streak heat-map reads as a compact multi-week grid with empty cells visually quieter than filled cells; tooltip treatment matches the Weekly overview
- Export appears as a centered modal/drawer with format tabs (Session JSON / Timesheet CSV), a scrollable code or text block, Copy and Download affordances, and a hint line
- The bulk action bar sits above the All entries list when any row is selected and names the selected count
- Inline validation messages render in a distinct error treatment beside the field they name, visually separate from helper text
</visual_design>

<motion>
- Buttons, filter chips, timeline entry blocks, and heat-map cells each show a visible hover state â a background, border, or shadow change â when the pointer is over them (hover feedback is required and is a common false done; do not omit it)
- Adding an entry animates the new row into the All entries list and the new block into the timeline; deleting an entry animates its row out rather than snapping; switching category filters animates the surviving rows into their new positions
- The live timer's elapsed display updates about once per second while running and stays legible without visibly jittering or reflowing the rest of the page
- The Meaningful ratio and its colored lean bar animate their update in place when entries change, without a full reload
- Starting a timer, saving a manual entry, deleting an entry, bulk categorize, export, and import each surface a transient toast that eases in and then dismisses on its own
- The edit dialog, delete confirmation, tag manager, history panel, export drawer, import confirmation, interruption reason step, and command palette appear as overlays anchored above the page with a brief enter transition, and dismiss on cancel, backdrop click, or Escape
- Undo, Redo, and branch selection in the history panel update the visible timeline, list, ratio, chart, and heat-map through the panel's real controls
- With prefers-reduced-motion set, list, toast, and overlay animations are removed and state changes apply instantly while every feature remains fully usable
</motion>

<responsiveness>
- Responsive down to about 375px wide: the layout reflows to a single column with no horizontal scrolling and no content clipped at the viewport edge
- At narrow widths the Start timer, Add entry, Export session, and bulk action controls stay fully usable and legible, and the weekly chart, heat-map, and timeline remain readable within the single column
</responsiveness>

<accessibility>
- Keyboard Tab focus is visibly indicated on every interactive control, including filter buttons, form fields, entry rows, checkboxes, and export controls
- The edit dialog, delete confirmation, tag manager, history panel, export drawer, import confirmation, interruption reason step, and command palette are keyboard-dismissable with Escape, trap focus while open, and return focus to the control that opened them on close
- Inline validation messages are programmatically associated with their fields so the failing field is identified, not just colored
- Category filter buttons expose their active state to assistive technology, not only through color
- Entry selection checkboxes and the bulk action bar are operable with the keyboard alone
</accessibility>

<performance>
- The app is interactive within about 2 seconds of a local cold load
- Loading / directly in a fresh tab renders the full dashboard with no hydration errors or warnings in the console and no visible flash of missing or unstyled content after first paint
- No console errors appear during a full exercise of the app â timer, manual add, edit, delete, filters, search, tags, history, bulk categorize, export, and import included
- The UI stays responsive under rapid repeated input with no hangs, dropped interactions, or duplicate records
</performance>

<writing>
- Headings, buttons, and filter labels use one consistent capitalization convention throughout the app
- Toasts name the action that just happened (for example confirming a saved entry, a timer switch, an export, or an import) rather than showing a generic success message
- Empty states and no-results messages explain what belongs in the region and how to add or restore it; no placeholder or lorem text appears anywhere in the shipped UI
- Export and import validation copy names the offending field from the field contract
</writing>

<innovation>
- Optional enhancements the builder may add, none required for a passing build: a daily velocity speedometer against a configurable minute target; ambient focus-sound toggles; printable day summary layout; coachmarks for first-run export
</innovation>

<requirements>
Shared application state must live in Svelte stores (writable and derived, in-memory only): the entries collection, custom tags, the live timer, the category filter and search text, the Meaningful streak, the streak heat-map derived cells, bulk selection ids, the transition history with its branches, the live export artifact texts, command palette state, and transient toasts. A change made through any control must flow through these shared stores so every view that shows it updates together without a reload, and WebMCP tool handlers must invoke the same store commands as the visible controls. Do not use localStorage, sessionStorage, or other browser storage APIs â session durability is the export and import surface plus MCP queryability.
State contracts (behavioral, not storage keys):
- Starting and stopping the live timer saves an entry whose duration reflects the elapsed time; starting a new timer while one runs auto-saves the previous one; stops under 25 minutes require an interruption reason before commit
- Submitting the manual form with a valid name, category, start time, and a durationMinutes of at least 1 and at most 1440 adds exactly one entry; empty name, over-length name, invalid startTime, or a zero, negative, non-numeric, or over-1440 duration is rejected with a visible inline message and adds no entry
- Editing an entry updates that same record everywhere it appears and recomputes the ratio, streak, chart, and heat-map; deleting an entry through its confirmation removes it from the list, timeline, ratio, streak, chart, and heat-map
- Bulk Set category mutates every selected entry through the same shared collection the list and timeline read
- The category filter and search recompute the visible timeline and list from the shared collection; they never create a second disconnected copy
- The Meaningful ratio, Today's minutes, weekly chart, streak, heat-map, and export texts are all derived from the shared entries collection and update immediately as it changes
- Edits to the collection are recorded as explicit history transitions; Undo and Redo restore exact adjacent snapshots, invalid Undo or Redo is disabled, Apply scenario change and other changes after an Undo create a selectable branch instead of flattening history, and selecting a branch restores that branch's exact visible state
- Session JSON and Timesheet CSV export texts are derived live from the shared collection; Import of valid Session JSON replaces that same collection the UI shows; export must contain the session's actual mutations and Session JSON rollup must match visible header stats
- The primary workflow must stay exact and responsive under at least 25 rapid repetitions through its normal controls, without a blank screen, uncaught error, or sustained freeze, and duplicate rapid submissions must not create duplicate records
Seeds and empty state: the app starts with no entries and no tags; the timeline and list show empty states until the user creates data; a page reload returns to that empty baseline.
Build tooling: a SvelteKit app built with Svelte 5 and the Tailwind CSS Vite plugin, delivered as a static build (adapter-static) with no server routes, loaders, or actions â all interactivity lives in client state after load, and npm start serves the built app on port 3000. Styling is Tailwind CSS 4.3.2, pinned, with design tokens in the theme layer. Skeleton is the sole component library, used for the app chrome: dialogs, selects, toasts, form controls, and cards. AutoAnimate and Svelte transitions are allowed for animation; no other animation libraries. The weekly overview chart is rendered with LayerChart. Icons come from phosphor-svelte only. All forms â the manual entry form, the timer inputs, the tag manager, the edit dialog, the interruption reason step, and import confirmation â validate through sveltekit-superforms with Formsnap in client-side validation mode against a Zod schema: the schema defines the rules and each invalid field shows an inline error before submit. No backend and no authentication. All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon. All controls act in-app with no outbound navigation.
Responsive: the layout reflows to a single column at about 375px wide with no horizontal scrolling and the Start timer, Add entry, and Export session controls remain usable.
The useful end state is the session artifact: Export must produce Session JSON and Timesheet CSV texts that contain the session's actual entries and tags, with Copy and Download, and Session JSON must round-trip through Import while conforming to the declared field contract.
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
- entity-collection-v1
- browse-query-v1
- command-session-v1
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Entity: entry
- Entity operations: create; select; update; delete
- Entity fields: name; category; tag; duration; start-time; interruption-reason
- Value bounds: {"category":["Meaningful","Neutral","Draining"],"interruption-reason":["Internal","External"]}
- Browsable entity: entries
- Destinations: timeline; weekly-chart; tag-manager; export-drawer; heat-map
- Filters: category
- Session operations: start; stop; restart
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: session-json
- Workflow completion: export Session JSON and Timesheet CSV previews reflect session mutations after create, edit, delete, or bulk categorize
- Workflow completion: header rollup stats and heat-map update after entry mutations

Mechanics exclusions:
- Undo/Redo/branch selection and the History panel stay Playwright-driven via the real controls
- Live per-second timer tick stays Playwright-observed
- Duration-proportional timeline block sizing stays Playwright-observed
- Streak heat-map cell intensity and tooltip stay Playwright-observed
- File-picker Import bytes and clipboard/download contents stay Playwright-only per artifact-transfer no-raw-file-contents restriction
- Command palette keyboard navigation stays Playwright-observed
- Interruption reason overlay gesture stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
