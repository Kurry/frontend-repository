<summary>
Build a French Riviera trip itinerary planner using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI. The app produces the traveler's portable trip artifacts: a valid ICS calendar payload every calendar app can import, a structured trip JSON the app can re-import, and a printable markdown day-by-day document — all compiled live from the session store.
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

Feature: Planner workspace entry —
- Direct planner entry: the trip plan workspace (left sidebar + center plan column + right map pane) loads immediately with no marketing landing, login, signup, or booking gate
- Top plan chrome shows a Trip / Travel Planner brand mark, Trip plan / Trip journal mode labels, and Share and edit toolbar affordances rendered as inert in-app chrome that may toast
- Left nav sidebar shows Overview, an Itinerary day list for Sun 7/5 through Sat 7/11 with a distinct day-color dot per day, a Budget row, and Support and Hide sidebar controls
- Plan hero shows a cover image, an editable title Trip to the French Riviera - Cote d'Azur, and the date range 7/5–7/11
- On a fresh load an onboarding coachmark sequence of at least 3 steps points at the plan column, the map pane, and the ideas bucket with Next and Skip controls; once dismissed it does not reappear during the session
- A light/dark toggle swaps the palette across the sidebar, plan column, and map chrome without a reload, with text readable in both themes
- Inert actions (Share, Optimize route, map layers demo chrome) raise demo toasts; zero outbound navigation

Feature: Stop collection and Stop field contract —
- Itinerary stops (places / activities) are the primary collection: seed at least 8 stops distributed across the seven days Sun 7/5 through Sat 7/11 (the reference spreads roughly four to five stops per day) plus at least 3 unscheduled ideas stops not tied to a day; seed includes French Riviera places (Nice, Monaco, Cannes, Antibes / Musée Picasso, Èze, Saint-Tropez, Menton) and a lodging stop titled Hotel Le Negresco
- Stop field contract (the create and edit form submits exactly this payload; the record a successful create produces IS the would-be trip-activity API request body; trip JSON export/import and the form share this SAME shape; all keys required unless marked optional; example values illustrative only): title (required string after trim, length 1 to 120), day (required closed enum string exactly one of 2025-07-05, 2025-07-06, 2025-07-07, 2025-07-08, 2025-07-09, 2025-07-10, 2025-07-11, or unscheduled), location (required string after trim, length 1 to 200), startTime (optional clock string HH:MM in 24-hour form with minutes 00 through 59), endTime (optional clock string HH:MM in 24-hour form; when both startTime and endTime are set, endTime must be strictly after startTime on the same day), category (required closed enum exactly one of lodging, food, transit, activity, idea), costTier (required closed enum string exactly one of 1, 2, 3, 4), status (required closed enum exactly one of to-visit, reserved, completed), tags (optional array of zero to 8 strings, each length 1 to 24 after trim), notes (optional string, length 0 to 500), lat (required number from -90 through 90), lng (required number from -180 through 180). Cross-field rules: endTime may be set only when startTime is set; endTime must be strictly after startTime; day unscheduled means the stop lives in the ideas bucket and does not receive a numbered day pin; a title longer than 120 characters or notes longer than 500 characters leaves the stops count unchanged and names that field in the inline error
- The stop create and edit form validates as the user types: each invalid field under the Stop field contract shows an inline error message naming that field, and the submit control stays disabled until all required fields are valid; an empty title, endTime not after startTime, or out-of-enum category/costTier/status/day leaves the stops count unchanged
- A valid submit creates a record whose visible title, day, location, times, category, costTier, and status match the submitted values; the collection supports create, edit, and delete

Feature: Map, modes, and place detail —
- An interactive map pane renders one numbered pin per scheduled stop colored by its day; the selected pin enlarges and opens a popup showing the place name and its Day N · Côte d'Azur label; unscheduled ideas use a neutral marker
- At least two interaction modes: Plan List mode (day sections + stop rows) and Map mode (map pane focus with pin selection / layers); switching modes updates without a full reload
- Selecting a stop opens a place-detail card over the map with About / Book / Reviews / Photos / Mentions tabs that swap panels in place; a dismiss control closes the card
- Hovering a stop row in the plan column visibly highlights that stop's map marker and emphasizes the route segment through it; moving the pointer away clears the highlight
- Activating a day header Focus control fits the map viewport to exactly that day's stops; leaving focus restores the full-plan map extent
- The map draws one directional polyline per day connecting that day's stops in start-time order in the day's color, with each leg labeled with a distance in kilometers to one decimal; after reordering or reassigning a stop the affected polylines and distance labels update immediately
- Zooming the map out groups nearby pins into cluster badges showing the count of contained stops; zooming in or clicking a cluster expands it back into individual pins
- A map layer toggle offers at least three layer styles and switching between them restyles the map in place without a page reload or blank map
- Selecting the seeded Hotel Le Negresco stop offers an isochrone toggle that draws a translucent circle of roughly 1.25 km radius around the hotel; toggling it off removes the overlay

Feature: Timeline editing depth —
- Dragging a stop card to another day reassigns it and dragging within a day reorders it, with day sections, map pins, polylines, and distance labels reflecting the new arrangement immediately after the drop; each stop card also offers keyboard-operable Move to day and reorder controls that achieve the same reassignment and reordering
- Activating a day section header collapses that day's stop rows and activating it again expands them, while other days keep their own expanded or collapsed state
- When two time blocks in the same day overlap in time, both blocks show an amber overlap treatment with a warning icon; adjusting either block's times so they no longer overlap clears the treatment from both
- Travel-time buffer cards between consecutive stops show a Driving / Walking / Transit mode selector and a computed duration; changing the mode immediately changes the displayed duration consistent with a faster mode yielding a shorter buffer
- When the gap between two consecutive blocks is shorter than the selected mode's computed buffer, the buffer card shows an impossible-transit warning; widening the gap or choosing a faster mode clears it
- A timezone switcher toggles displayed block times between destination local (CET), home (ET), and UTC: every visible time label relabels to the selected zone and the switcher indicates the active zone
- Creating a stop such as Breakfast at hotel 8:00-8:45 with the repeat-daily option enabled creates exactly one block per day across Sun 7/5 through Sat 7/11 (7 blocks) in a single action; running the generator a second time for the same title and time warns about duplicates and adds no additional blocks

Feature: Ideas bucket, collaboration, and roles —
- An unassigned-concepts bucket drawer opens from a persistent control and lists the unscheduled ideas, each carrying a poll widget with per-member vote indicators for Sarah, John, and Marco plus a user vote control
- After starting a vote on a bucket item, the simulated members cast votes with visible count updates, and when the item reaches 3 of 4 votes it leaves the bucket and appears as a scheduled stop on a day timeline with a map pin in that day's color — promotion really mutates the shared collection
- Triggering a simulated peer edit on a block the user has an unsaved edit open on opens a conflict-resolution modal showing current and incoming versions side by side with Keep mine / Take theirs / Merge choices, and the chosen resolution is actually applied to the block
- A role switcher supports Owner, Editor, and Viewer: Viewer visibly disables all mutating controls (create, edit, delete, drag, vote, bulk); Editor keeps delete disabled while create/edit/move work; Owner enables everything
- Simulated presence shows colored peer carets or card outlines drifting across the plan, and an activity log drawer lists session mutations newest first, each entry naming the actor and the change

Feature: Filters, bulk, kanban, undo —
- A filter ribbon combines cost-tier, category, and tag filters to recompute the visible stops from the shared collection, and Clear filters restores the full plan
- Typing a slightly misspelled query such as anitbes in the search field still surfaces the Antibes stop; clearing the query restores the unfiltered view
- Selecting multiple stops summons a bulk action bar showing the selected count, and its Mass tag, Move to day, and Delete actions apply to every selected stop in one operation
- Kanban pivot mode shows the stops as To Visit / Reserved / Completed columns, and dragging a card between columns updates that stop's status wherever it appears
- Undo and redo controls step through structural changes: after a delete, Undo restores the stop across list, map, and kanban together and Redo removes it again; with an empty undo history the Undo control is disabled or inert

Feature: Export and import artifacts (useful end state) —
- An Export control opens an export canvas with Markdown, ICS, and Trip JSON views that always show live-compiled text from the full session store; every create, edit, delete, status change, vote promotion, or merge must appear in the regenerated artifacts — an export that omits session work is incorrect
- Markdown itinerary: a heading per day in date order and time-ordered stop lines; a Copy control places the exact visible markdown on the clipboard and confirms via toast
- ICS field contract (calendar event payload): the ICS view renders a payload that begins with BEGIN:VCALENDAR, contains exactly one VEVENT block per scheduled stop (day not unscheduled) with DTSTART matching that stop's day and startTime when set (or an all-day VALUE=DATE on that day when startTime is absent), SUMMARY equal to the stop title, and when endTime is set a DTEND consistent with that endTime; the payload ends with END:VCALENDAR. Download ICS offers a real download of that visible payload
- Trip JSON field contract (trip package document; live preview, Download trip JSON, Copy trip JSON, and Import all conform to this SAME shape; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string whose value is exactly the characters 1), trip (required object with title string, dateStart exactly 2025-07-05, dateEnd exactly 2025-07-11), stops (required array). Every element of stops conforms to the Stop field contract above (same field names, enums, bounds, and cross-field rules). After creating or renaming a stop the JSON updates to include that stop's title and fields without a reload
- Download trip JSON offers a real download of the visible trip JSON text; Copy trip JSON places that exact text on the clipboard with a visible confirmation toast
- Import trip JSON accepts a previously exported trip JSON file or pasted JSON and reconstructs the stops so list rows, map pins, markdown, ICS, and trip JSON match the imported document; malformed JSON or a payload that violates the Stop field contract (missing title, illegal enum, or endTime not after startTime) shows a visible error naming the import problem or offending field and leaves the session unchanged
- Under print media the plan renders as a clean paginated document of day sections with the map chrome, sidebar, and toolbars excluded
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every step without a reload):
- Create flow: creating a valid stop adds exactly one day-list row and one map pin in that day's color and includes the stop in markdown, ICS, and trip JSON without a reload; submitting with an empty title or endTime before startTime triggers immediate inline validation naming the offending field and adds no stop
- Edit flow: renaming a stop updates the day-list row, place-detail card, map popup, markdown export, ICS SUMMARY, and trip JSON title without a reload
- Delete flow: deleting a stop removes it from the day section, map pins, selection, markdown, ICS, and trip JSON in the same interaction
- Row-pin two-way sync: clicking a stop row flies the map to that stop's pin and highlights the row; clicking a pin selects the same stop and scrolls the list to its row; after either direction the highlighted row and the enlarged pin refer to the same stop
- Day select: selecting a day in the sidebar focuses the map on that day's center/zoom, selects the day's first stop, and recomputes the visible stops from the shared collection; returning to Overview restores the full plan without a reload
- View/mode switch: switching Plan List and Map modes keeps the same selected stop and shows it in both without a full page reload
- Drag reassign flow: dragging a stop from one day to another updates the old day section, the new day section, both days' polylines and distance labels, the adjacent buffer cards, and appends an activity log entry describing the move, all without a reload
- Vote promotion flow: running a bucket poll to its winning threshold moves the item out of the bucket onto the timeline, and the promoted stop then appears in Plan List mode, on the map in its day's color, and under its day heading in the export markdown
- Conflict merge flow: resolving a simulated edit conflict with the Merge choice leaves the merged content visible in the block's row, in its detail card, and in the export markdown, with a matching activity log entry
- Undo/redo round trip: deleting a stop then pressing Undo restores it to its day section, its map pin, and the export document, and pressing Redo removes it again from all three
- Kanban status flow: changing a stop's status by dragging its card between kanban columns is reflected on that stop's row in Plan List mode and in status-filtered results without a reload
- Role gate flow: switching to Viewer disables all mutating controls, and switching back to Owner re-enables them with every edit made before the switch still intact
- Export then import round trip: mutate the plan (rename + new stop), Download or Copy trip JSON, reload to seeded baseline, Import that JSON, and confirm list, map, markdown, ICS, and trip JSON match the pre-export mutated state
- Edge empty: after deleting all stops, the plan list empty state is visible, the map shows no numbered pins, and ICS has zero VEVENT blocks with an empty trip JSON stops array
- Filter clear: applying a day or category filter narrows the plan list and map pins together, and Clear filters restores the full plan
- Overlay dismiss: place-detail, conflict-resolution, and export canvas open and dismiss without trapping the user; dismiss returns to the underlying plan
- Recovery: after a failed import or Viewer-blocked action, a visible error or notice appears and the user can dismiss it and continue editing without a reload
- Collapsible chrome: Hide sidebar collapses the left nav and the toggle reopens it as a drawer or sidebar with the current day selection preserved
- A page reload returns the app to its seeded state: the seeded stops, day colors, and default Overview view reappear; session mutations that were not exported are gone
</user_flows>

<edge_cases>
- Submitting the stop form with an empty title adds no stop: the stops count is unchanged and an inline validation message names the title field
- Submitting a stop with endTime not strictly after startTime adds no stop and shows an inline error naming endTime
- Submitting a stop with a category, costTier, status, or day outside the closed enums adds no stop and shows an inline error naming that field
- Double-activating the stop form submit creates exactly one stop: the day section gains one row and the map gains one pin
- After deleting all stops, the plan list region shows an empty state message and the map shows no numbered day pins; the ICS preview has zero VEVENT blocks and the trip JSON stops array is empty
- Selecting a day whose stops have all been deleted shows an empty day state rather than a blank region
- A stop name too long for its row truncates with an ellipsis in the list row and is shown in full in the place-detail card
- Editing a block's times to overlap another block flags both amber immediately, and editing them apart clears both warnings
- Emptying the ideas bucket shows a bucket empty state message with no orphaned poll widgets remaining
- In the Viewer role, activating a mutating control changes nothing and a read-only notice explains that Viewers cannot edit the plan
- With an empty undo history the Undo control is disabled or inert, and activating it produces no state change and no console error
- Running the repeat-daily generator a second time for the same title and time warns about the duplicates and adds no additional blocks
- Importing malformed trip JSON shows a visible error naming the import problem, leaves stops unchanged, and produces no console errors
- Importing trip JSON whose stops violate the Stop field contract (missing title, illegal enum, or endTime not after startTime) shows a visible error naming the offending field and leaves the plan unchanged
- Submitting a title longer than 120 characters or notes longer than 500 characters adds no stop and shows an inline error naming that field
- The conflict-resolution modal always keeps an operable choice or dismiss path so it cannot trap the user behind a dead overlay
</edge_cases>

<visual_design>
- Product name Trip / Travel Planner with French Riviera — Côte d'Azur as the trip signal; first viewport is the planner workspace
- Soft coastal UI: cool blue-gray page wash, a bundled humanist sans-serif typeface, navy accent
- Three-pane desktop composition: left sidebar / center plan column / right map pane — planner density
- Each day carries its own color, shared by its sidebar dot and its numbered map pins; unscheduled ideas use a neutral marker; the selected pin is enlarged
- Place detail card floats over the map with a tab row (About / Book / Reviews / Photos / Mentions) and a dismiss control
- Icons across the sidebar, toolbar, and map chrome come from one consistent icon set at consistent sizes
- Empty list state is clear when no stops remain; empty day and empty bucket states are visually distinct regions with a message
- The export canvas presents Markdown, ICS, and Trip JSON as monospaced previews with Download and Copy controls — not a screenshot dead end
- Bulk action bar, conflict modal, bucket drawer, and activity log adopt the same spacing scale, radii, and coastal palette as the screenshotted workspace
- Component states: buttons, inputs, and tabs show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Hover animations (required): sidebar items ease hover opacity and brief press scale; place and carousel cards lift slightly on hover; map chrome buttons use the same hover/press microfeedback — verified by real pointer hover
- List microinteractions: a newly created stop row animates into its day section, a deleted row animates out, and reassigning a stop to another day animates the reflow of both affected day sections
- Drag motion: a dragged stop card visibly lifts while dragging and settles into its drop slot with a brief ease; vacated and receiving day sections animate their reflow
- Place detail: tab switches swap panels without page navigation; detail overlays the map
- Day accordion collapse and expand animates height rather than snapping
- Selecting a stop or a day eases/flies the map to the target and animates the chosen pin into its enlarged active state
- Presence carets or card outlines drift with smooth continuous easing between positions rather than teleporting
- Coachmark Next advances with a short fade or slide rather than an instant swap
- A winning poll animates its item out of the bucket and into the day section rather than swapping both surfaces in a single instant frame
- Export copy confirmation and import success or error notices appear with a short enter/exit transition
- Demo toasts slide/fade in then auto-dismiss
- Respect prefers-reduced-motion by disabling toast/control transitions where practical while every feature stays usable
</motion>

<responsiveness>
- At desktop widths of 1024 pixels and above, the sidebar, plan column, and map pane render side by side; below 1024 pixels the map pane stacks below the plan column
- At widths of 768 pixels and below, the left sidebar collapses behind a toggle control that opens it as an overlay drawer; the ideas bucket and activity log also open as overlay drawers
- Below 1024 pixels the kanban columns scroll horizontally inside their own container without page-level horizontal scroll
- No content clips or overflows the viewport and no horizontal scrolling appears at 375 pixel width; conflict modal and coachmark steps remain fully on-screen at 375 pixels
- Export canvas, bulk bar, and conflict modal remain fully usable at 1440 and at 1024 without clipping their primary controls
</responsiveness>

<accessibility>
- Every interactive control — sidebar rows, stop rows, form fields, place-detail tabs, map chrome buttons, export Download/Copy, trip JSON import, bulk bar, role switcher, and undo/redo — is reachable and operable with the keyboard alone, with a visible focus indicator
- The place-detail tab row is keyboard operable and marks the active tab programmatically; the dismiss control closes the card from the keyboard and focus returns to the stop that opened it
- Every drag interaction has a keyboard path: each stop card offers keyboard-operable Move to day and reorder controls that achieve the same reassignment and reordering as a pointer drag
- The conflict-resolution modal has role dialog with aria-modal, traps focus while open, makes Keep mine / Take theirs / Merge operable from the keyboard, and returns focus to the edited block on close
- Poll controls expose accessible names that include the item name and current vote count, and a promotion is announced through an aria-live region
- The role switcher exposes the current role programmatically, and controls disabled by the Viewer role are disabled in the accessibility tree rather than merely styled as inactive
- Stop form validation messages and import errors are shown inline and announced through an aria-live polite region
- Map pins expose accessible names that include the place name and its day assignment
- Demo toasts and export copy confirmations are announced through a polite live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of creating, editing, deleting, mode switching, day selection, map selection, export, and import
- Mode switches, day selection, map fly animations, drag reassign, and undo stay smooth under rapid repeated input with no hangs or dropped interactions
- After roughly 30 recorded undo-history mutations, typing, dragging, and undoing remain responsive without visible lag compared to a fresh session
</performance>

<writing>
- Headings, buttons, and labels keep one consistent capitalization convention across the workspace
- Action labels are specific verbs such as Add stop, Export trip, Download ICS, and Import trip JSON rather than generic labels where a specific one is possible
- Validation and empty-state messages name the problem and the fix (for example Title is required or endTime must be after startTime); no placeholder or lorem text appears anywhere in the shipped UI
- Activity log entries are human-readable sentences naming actor, action, and target (for example John moved Flight 102 to Day 1)
- Markdown export uses a heading per day and readable time-ordered lines; coachmark and conflict-modal copy explains what to do in plain language
</writing>

<innovation>
- Beyond the required collaboration and export depth, optional polish such as presence caret drift, polyline draw-on, an export compile pulse, a day-density strip, or a contextual tip after the first vote promotion or first export is welcome when it stays frontend-only and does not break the field contracts
</innovation>

<requirements>
Shared application state must use Qwik stores, the state library named in summary (in-memory only): stops collection, day selection, active mode, place detail tabs, map selection, filters, role, theme, undo history, collaboration simulation, export previews, and toasts. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence is the portable ICS / trip JSON / markdown artifacts and the MCP query surface only.
State contracts (behavioral, not storage keys):
- Creating a valid stop increases the collection and shows it under its day section and on the map when applicable, and regenerates markdown, ICS, and trip JSON
- Editing a stop updates that same record in list, detail, map selection, and all export previews
- Deleting a stop removes it from day lists, selection, map pins, and exports
- Day filter, mode, role, timezone, and theme are shared client state; they recompute visible stops from the shared collection and never keep a second disconnected copy
- Vote promotion, conflict merge, bulk actions, and undo/redo mutate the same shared collection the UI and exports read
Stack: Qwik with Qwik stores, Tailwind CSS 4.3.2 (pinned), and DaisyUI as the component library for chrome — sidebar menu, cards, tabs, buttons, toasts, modals, and the stop form surfaces; frontend-only.
- AutoAnimate is the allowed animation library, used for stop list add/remove, day-section reflow, and bucket promotion; CSS transitions may cover hover and press feedback; no other animation libraries
- Iconify icons via the @iconify/tailwind4 plugin only, one consistent set; no other icon libraries and no copy-pasted raw SVG icon sets
- All forms validate through a schema: the stop create and edit form and import validation are driven by Modular Forms for Qwik with a Valibot schema defining the Stop field contract and Trip JSON field contract, surfacing inline per-field errors before submit and keeping the submit control disabled until valid. Schemas are API-shaped: they model the payload a real trip-planning API would accept (the activity create/update body and the trip package document), the record a successful create produces IS that request body, and ICS / trip JSON / markdown export plus trip JSON import compile and validate against those same schemas
- Leaflet CSS/JS vendored locally as a product map library
- The body typeface (Source Sans Pro or an equivalent open-license humanist sans) ships locally via an npm font package or vendored woff2; no font CDNs
- All libraries installed via npm and bundled locally; no CDN imports
- Seed a multi-day French Riviera plan (Nice, Monaco, Cannes, Antibes / Musée Picasso, Èze, Saint-Tropez, Menton, Hotel Le Negresco) with at least 8 stops spread across the seven days Sun 7/5–Sat 7/11, each day in its own color, plus at least 3 unscheduled ideas stops
- Empty required fields on create must not increase the stops count; show visible validation feedback
- After deleting all stops, show an empty state in the plan list region
- Zero navigational outbound links; no live booking APIs or chat widgets
- Document title references the French Riviera trip; desktop layout: sidebar + plan + map
- The useful end state is the portable trip package: Export must produce ICS, trip JSON, and markdown that contain the session's actual stops under the declared field contracts, with Copy and Download, and trip JSON must round-trip through Import
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
- Browsable entity: activities
- Destinations: overview; day-detail; activity-form; export-canvas
- Filters: day; category; cost-tier; status; search
- Themes: light; dark
- Entity: activity
- Entity operations: create; select; update; delete; reorder; toggle
- Entity fields: title; day; location; startTime; endTime; category; costTier; status; tags; notes; lat; lng
- Value bounds: {"day":["2025-07-05","2025-07-06","2025-07-07","2025-07-08","2025-07-09","2025-07-10","2025-07-11","unscheduled"],"category":["lodging","food","transit","activity","idea"],"costTier":["1","2","3","4"],"status":["to-visit","reserved","completed"]}
- Form fields: title; day; location; startTime; endTime; category; costTier; status; tags; notes; lat; lng
- Form operations: validate; submit; cancel
- Artifact operations: export; import; copy; print_preview
- Export formats: ics; trip-json; markdown
- Import modes: trip-json
- Workflow completion: export ics and trip-json and markdown reflect session mutations after create edit delete promote or merge
- Workflow completion: import trip-json reconstructs stops matching Stop field contract

Mechanics exclusions:
- Map pan/zoom / marker drag stays Playwright
- Stop card drag-and-drop gesture fidelity stays Playwright-observed; WebMCP entity reorder/update proves state parity only
- Raw file paths/blobs forbidden in WebMCP args; file picker, clipboard contents, and downloads stay Playwright responsibilities
- Coachmark and toast enter/exit timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
