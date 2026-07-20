<summary>
Build a French Riviera trip itinerary planner using Vue 3 with Nuxt static delivery, Pinia, Tailwind CSS 4.3.2, and PrimeVue. The app produces the traveler's portable trip files — an ICS calendar payload every calendar app can import, a structured trip JSON the app can re-import, and a printable markdown day-by-day document — compiled live from the store so every mutation the session makes leaves with the user.
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
- Direct planner entry: the trip plan workspace (sidebar + plan column + map) renders immediately on load; no marketing landing, login, signup, or booking gate
- Top plan chrome shows a Trip / Travel Planner brand mark, Trip plan / Trip journal mode labels, and Share and edit toolbar affordances as in-app chrome
- Left nav sidebar shows an inert AI Assistant control, an Overview group (Explore / Notes / Places), an Itinerary day list for Sun 7/5 through Sat 7/11 with day-colored dots, a Budget row, and Support / Hide sidebar controls
- Deep-linking the app URL directly renders the same planner workspace as reaching it through in-app navigation, with the same seeded stops visible

Feature: Stop field contract (API-shaped request body) —
- Stop field contract (the record create and edit submit IS the would-be itinerary-stops API request body; all keys required unless marked optional; example values illustrative only): title (required trimmed string, length 1 to 80), day (required closed enum exactly one of 2025-07-05, 2025-07-06, 2025-07-07, 2025-07-08, 2025-07-09, 2025-07-10, 2025-07-11), location (optional string at most 120 characters), notes (optional string, length 0 to 400), startTime (optional string matching HH:MM 24-hour clock with minutes 00 through 59), endTime (optional string matching HH:MM 24-hour clock with minutes 00 through 59), category (required closed enum exactly one of sightseeing, dining, lodging, transport, other). Cross-field rules: endTime may be set only when startTime is set; when both are set, endTime must be strictly after startTime; day must be one of the seven trip dates
- The stop create and edit form validates inline per field before submit against that contract: an empty required title, a title over 80 characters, a day or category outside the closed enums, or an endTime that is not strictly after startTime each show an inline error message naming that field, and the submit control stays disabled until every required field is valid
- Submitting a valid stop adds exactly one row under its day section in the plan list; itinerary stops are the primary collection: seed at least 8 stops across days on first load; each stop shows its title, day assignment, optional time or note, and category; the collection supports create, edit, and delete

Feature: Modes, filter, and place detail —
- At least two interaction modes read from the same stops collection: Plan List mode (day sections + stop rows) and Map mode (map pane focus with pin selection and layers); switching modes swaps the emphasized region without a full page reload
- A day filter recomputes the visible stops from the shared collection; selecting a day narrows the plan list to that day's stops and clearing the filter restores all stops
- Selecting a stop opens a place detail card over the map with a tab row of About / Book / Reviews / Photos / Mentions; a seeded example (Musee Picasso or an equivalent stop) opens as the initial detail
- Optimize route and layers controls are demo chrome that may show a toast; the map pane is a static snapshot with Export / Optimize / layers affordances

Feature: Plan hero and demo chrome —
- The plan hero shows a cover image, an editable title reading Trip to the French Riviera - Cote d'Azur, the date range 7/5 to 7/11, a Browse all control, guide and hotel suggestion cards, and a place-suggestion strip
- Inert controls show demo toasts; zero outbound navigation anywhere in the app

Feature: Expense field contract and multi-currency ledger —
- Expense field contract (the record create and edit submit IS the would-be expenses API request body; all keys required unless marked optional; example values illustrative only): description (required trimmed string, length 1 to 120), amount (required number greater than 0 with at most 2 decimal places), currency (required closed enum exactly one of EUR, USD, GBP, CHF), day (required closed enum exactly one of the seven 2025-07-05 through 2025-07-11 dates), category (required closed enum exactly one of Lodging, Food, Transit, Activities), payer (required closed enum exactly one of Ava, Ben, Chloe, Dan), splitMode (required closed enum exactly one of per-capita, weighted), weights (required only when splitMode is weighted: an object with numeric keys Ava, Ben, Chloe, Dan each greater than 0 that sum to a positive total). Cross-field rules: amount must be greater than 0; weighted split rejects missing weights, non-positive weights, or a zero sum with an inline error naming weights
- The Budget / Ledger view shows an expense grid with at least 10 seeded expenses spanning Lodging, Food, Transit, and Activities in at least 3 currencies; each row shows description, amount, an inline currency dropdown, day, category, payer, and a split-mode control
- A visible mock FX table lists rates for at least USD, GBP, and CHF against EUR; each expense row shows a converted EUR amount, and changing a row's currency through its inline dropdown immediately updates that row's EUR amount and the ledger grand total consistently with the FX table, without a reload
- Toggling an expense between per-capita and weighted split changes the per-traveler balances for Ava, Ben, Chloe, and Dan: per-capita divides the EUR amount equally by 4; weighted exposes per-traveler weight inputs and divides proportionally; balances update immediately on toggle
- A who-owes-whom matrix or network visualizer shows the settle-up transactions with a stated transaction count, and the set is minimal for the current balances
- The payment settlement checklist lists each computed transaction with a Mark as settled control; marking one settled visibly checks it off and updates the outstanding balances and the debt visualizer to exclude it
- The burn-rate chart plots cumulative spend per day for 7/5-7/11 against a visible 4500 EUR ceiling line, includes a projected end-of-trip total fed by reserved lodging and flight expenses, and visibly highlights the projected-overage region when the projection crosses the ceiling
- The cost-allocation pie shows the EUR share of Lodging, Food, Transit, and Activities and redraws when an expense's category, amount, or currency is changed through the UI
- Expense create and edit enforce the Expense field contract in the UI: empty description, non-positive amount, or out-of-enum currency/day/category/payer/splitMode each show an inline error naming that field, and weighted split with invalid weights is rejected with a named error

Feature: Ingestion, spreadsheet, and structural tools —
- Pasting raw confirmation text into the parsing sandbox visibly highlights recognized dates and booking codes inside the pasted text and lists extracted draft items that can each be accepted into the ledger or itinerary or discarded
- Dropping or picking a CSV opens a schema-mapping wizard with per-column field dropdowns followed by a row-level diagnostic screen where rows with invalid cells are listed and each offending cell can be fixed inline before commit
- The template injector control, after a confirmation, seeds a complete sample trip (stops plus expenses) in one action and the new data is visible across the plan list, ledger, and charts
- Dropping an image placeholder on the mock receipt-scanner canvas renders a bounding-box overlay and extracts a cost and a date into a draft expense that the user confirms or edits before it joins the ledger
- In the spreadsheet view, arrow keys move a visibly indicated active cell, Enter or double-click starts inline editing, Escape cancels, and a committed cell edit updates the shared data everywhere that datum appears
- The formula bar computes =SUM and =AVERAGE over a selected column range, shows the result, and the two functions over the same range give correctly related results (average equals sum divided by the row count)
- The pivot-style grouping renders category by day summaries (a row per category, a column per day, EUR cell totals), and switching the grouping recomputes the summary from live data
- The display-currency toggle switches every displayed amount to the selected display currency, and toggling back to EUR restores the exact original values
- Selecting 2 or more rows reveals the bulk mutation tray, and batch recategorize, batch day reassignment, and batch delete each apply to exactly the selected rows and no others
- Setting a per-category cap below that category's current EUR total flags the category's rows with a warning treatment that includes an icon or text (not color alone), and the flags update as expenses or caps change

Feature: Notes, packing, gallery, custom fields, undo, theme —
- Typing markdown in a stop or expense note block renders headers, bullet lists, and checkboxes, and clicking a rendered checkbox toggles its state
- The packing list sub-tab shows categorized items with per-category progress in the form 4/12 packed, and checking an item updates the count and progress bar immediately
- The image gallery drawer for a stop supports reordering its placeholder images and editing captions, with both changes persisting in-session
- A URL typed in a note renders as a hyperlink preview card (title, domain, thumbnail placeholder) inside the note, and activating the card never navigates away from the app
- Defining a custom field (name plus text, number, or rating type) makes it immediately appear as an editable input on every stop and expense card and as a column in the spreadsheet matrix
- Undo and redo controls step backward and forward through structural changes (create, edit, delete, import commit, bulk mutation), each undo visibly reverting the most recent change across every affected pane
- The factory reset control asks for confirmation; confirming restores the seeded baseline data across all panes while cancelling leaves all current data untouched
- The light/dark theme toggle switches the whole workspace without a reload and every pane, chart, and overlay restyles coherently
- The settlement report surface shows live text with per-traveler balances, the minimum settle-up transactions, and which are settled; the Copy control shows a visible confirmation, and the report content matches the session's current ledger state at open time
- The budget summary surface shows live text with per-category EUR totals, burn-rate versus the 4500 EUR ceiling, and the projected end-of-trip total with any overage, offers Copy with a visible confirmation, and reflects the session's actual edits

Feature: Export and import artifacts (useful end state) —
- The app produces the traveler's trip files: an Export control opens an export canvas with markdown, ICS, and trip JSON format tabs compiled LIVE from the current store
- ICS field contract: the ICS export preview renders a payload that begins with BEGIN:VCALENDAR, contains exactly one VEVENT block per scheduled stop with a DTSTART and a SUMMARY equal to the stop title, optional DTEND when endTime is set, optional LOCATION when location is present, and ends with END:VCALENDAR
- Trip JSON field contract (Copy, Download, and Import all conform to this same shape; all top-level keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly 1), trip (required object with title string, dateStart exactly 2025-07-05, dateEnd exactly 2025-07-11, budgetCeilingEur number exactly 4500), stops (required array whose every element matches the Stop field contract above), expenses (required array whose every element matches the Expense field contract above). Cross-field rules: every stop.day and expense.day is one of the seven trip dates; every stop.category and expense.category stay inside their closed enums; when a stop has both startTime and endTime, endTime is strictly after startTime
- The markdown itinerary export shows a heading per day in date order with time-ordered stop lines, and regenerating it after a stop create or rename shows the updated document
- Download trip JSON and Download ICS start real downloads of those artifacts, and Copy for markdown, ICS, or JSON places the exact visible preview text on the clipboard and shows a brief copied confirmation
- Export content must reflect every mutation the session made — a stop or expense create, edit, delete, currency change, bulk mutation, or import commit that is visible in the UI must appear in the regenerated ICS, trip JSON, and markdown before copy or download; an export that omits session work or fails the field contracts is incorrect
- An Import trip JSON control accepts a previously exported trip JSON document; a successful import that conforms to the Trip JSON field contract reconstructs stops and expenses so the plan list, ledger, balances, charts, markdown, ICS, trip JSON, settlement report, and budget summary match the imported document; malformed JSON or a document that violates the field contracts shows a visible error naming the import problem and leaves the session unchanged
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every step without a reload):
- Stop lifecycle: creating a valid stop closes the form, adds exactly one row under its assigned day section, and shows a matching pin on the map when applicable; switching to Map mode shows the same new stop without a reload; editing that stop's title updates the same record in the plan list row, the place detail card, and the map selection; deleting it removes it from its day section, from the map pins, and from any active selection, and the visible stop count decreases by exactly one
- Day filter echo: choosing a day from the sidebar itinerary list narrows the plan list to exactly that day's stops and the day's color highlight follows the selection; a stop created while the filter is active appears in the filtered list when it belongs to that day; clearing the filter restores the full multi-day list with the new stop still present
- Detail round trip: selecting a stop opens its place detail tabs over the map; switching between About / Book / Reviews / Photos / Mentions swaps panels in place without page navigation; switching Plan List and Map modes keeps the same stop selected; deselecting or deleting the stop dismisses the detail card
- Expense create updates all money surfaces: a new expense created via the UI appears in the ledger grid, spreadsheet, and derived totals; invalid expense submission shows inline field-contract validation and adds no row
- Ingestion review commit: paste confirmation text or drop a CSV, review the drafts or diagnostics, commit, and confirm the accepted items land in the ledger or itinerary while discarded or excluded ones do not appear anywhere
- Settlement chain: add an expense, open the debt visualizer, mark a computed transaction settled in the checklist, and open the settlement report — each step's output feeds the next with no reload and no dead end
- Undo after bulk delete: after a bulk delete from the mutation tray, one Undo restores every deleted row to the ledger, the spreadsheet, and the charts; Redo re-applies the delete
- Spreadsheet echo: an inline cell edit committed in the matrix is visible on the corresponding card or ledger row immediately, and continuing to navigate cells with the keyboard keeps working after the edit
- Create ending at artifacts: after creating a valid stop, the plan list gains the row and the export canvas markdown, ICS, and trip JSON all include the new stop without a reload; the ICS gains a VEVENT whose SUMMARY is that title and the trip JSON stops array contains an object with that title and startTime when set
- Export/import round trip: mutate the plan (rename a stop, create one valid expense with a unique description, change one expense currency), Download or Copy the trip JSON, reload to the seeded baseline, Import that JSON, and confirm list rows, ledger rows, balances, charts, markdown, ICS, trip JSON, settlement report, and budget summary all match the pre-export mutated state
- A page reload returns the app to its seeded state: the seeded multi-day stops and ledger, no day filter, Plan List mode, light theme, unsettled transactions, and the seeded place detail example
</user_flows>

<edge_cases>
- Submitting the stop form with an empty title adds no stop, leaves the visible stop count unchanged, and shows validation feedback naming the title field
- Submitting stop create/edit with a title over 80 characters, a day or category outside the closed enums, or endTime not strictly after startTime shows an inline error naming that field and leaves the stops count unchanged
- Submitting expense create/edit with empty description, non-positive amount, or out-of-enum currency/day/category/payer/splitMode shows an inline error naming that field and adds or changes no expense; weighted split with invalid weights is rejected naming weights
- Double-activating the stop submit control creates exactly one stop: the count increases by one and one new row appears
- Filtering to a day with no stops shows an empty day state in the plan list region with a message and a way to add a stop or clear the filter
- After deleting all stops, the plan list region shows an empty state explaining that no stops remain and offering the create flow; the ICS payload has zero VEVENT blocks and the trip JSON stops array is empty
- A CSV row with a non-numeric amount or unparseable date cannot be committed until the cell is fixed inline or the row is excluded, and the diagnostic screen names the offending cell and the problem
- Entering a formula over an empty or invalid range shows an inline formula error message naming the problem instead of a numeric result
- Marking every settlement transaction settled brings all outstanding balances to zero and the debt visualizer shows an all-settled state with zero remaining transactions
- Deleting an expense removes its contribution from the per-traveler balances, the debt visualizer, the pie, and the burn-rate chart in the same interaction
- Raising a category cap above that category's current total clears the threshold flags from its rows immediately, and pasting text with no recognizable tokens into the parsing sandbox shows a no-matches message with no draft items created
- Importing malformed or undecodable trip JSON, or JSON whose stops or expenses violate their field contracts, shows a visible error naming the import problem, leaves stop and expense counts unchanged, and produces no console errors
- Factory reset or a bulk delete asks for confirmation; cancelling leaves all current data untouched
</edge_cases>

<visual_design>
- Product name Trip / Travel Planner with French Riviera — Cote d'Azur as the trip signal; first viewport is the planner workspace
- Soft coastal UI: cool blue-gray page wash, Source Sans Pro type, navy accent
- Three-pane desktop composition: left sidebar / center plan column / right map pane — planner density, not a marketing layout
- Day colors are consistent between the sidebar day dots and the map place pins; the place detail card floats over the map with its tab row
- The plan hero stacks the cover image, editable title, date range, and suggestion cards above the day sections in the plan column
- Empty list and empty day states are visually distinct regions with a message, not blank whitespace
- Component states: buttons, inputs, and tabs show distinct default, hover, focus (visible ring), disabled, and error treatments
- The ledger grid, spreadsheet matrix, and charts keep the planner's coastal visual language: dense but aligned rows, labeled chart axes and legends, prominent EUR totals, and a burn-rate ceiling line clearly distinguishable from the spend line
- The export canvas presents markdown, ICS, and trip JSON as monospaced previews with Download and Copy controls that read as part of the coastal planner chrome rather than a screenshot dead end
- Threshold-flagged rows, projected-overage regions, and settled transactions each have a distinct visual treatment that pairs color with an icon or text label
- In dark theme every pane, chart, overlay, and form keeps readable contrast and the same layout as light theme
</visual_design>

<motion>
- Hover animations (required): sidebar items ease hover opacity and take a brief press scale; place and carousel cards lift slightly on hover; map chrome buttons use the same hover and press microfeedback
- List microinteractions: a newly created stop row animates into its day section, a deleted row animates out, and reassigning a stop to another day moves it with a transition rather than an instant jump
- Place detail: tab switches swap panels without page navigation; the detail card overlays the map with a short enter transition
- Mode emphasis between Plan List and Map updates without a full reload; day selection may toast or focus the map
- Demo toasts slide or fade in, hold briefly, then auto-dismiss with a fade
- Validation feedback appears with a short transition rather than popping in
- Selecting 2 or more rows slides the bulk mutation tray in and clearing the selection slides it out; the gallery drawer and settlement report surface open with a short enter transition rather than snapping
- Pie slices and the burn-rate line transition to their new values when an expense changes; marking a settlement settled animates the checklist row into its settled state; checking a packing item animates its progress bar
- With prefers-reduced-motion set, toast, list, and control transitions are removed and state changes apply instantly while every feature stays usable
</motion>

<responsiveness>
- At desktop widths (1440 pixels) the layout matches the reference composition: left sidebar, center plan column, right map pane all visible
- At widths of 768 pixels and below, the sidebar collapses behind a toggle that opens it as an overlay drawer, and the map pane stacks or yields to the active mode instead of sharing the row
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears
- At 375px width the ledger grid and spreadsheet matrix scroll horizontally inside their own containers rather than widening the page, and the charts resize to fit their panes
- At 375px width the import wizard, diagnostics screen, export canvas, and report surfaces stay usable — controls reachable, steps not clipped, commit/copy actions on-screen
</responsiveness>

<accessibility>
- Every interactive control — sidebar items, mode switches, day filter, stop rows, form fields, detail tabs, export and import controls, and toasts' dismiss affordances — is reachable and operable with the keyboard alone, with a visible focus indicator
- The place detail tab row is keyboard operable: tabs can be reached and activated from the keyboard and the active tab is programmatically distinguishable
- Form validation messages are shown visually and associated with their fields so assistive technology announces them
- Demo toasts, export copy confirmations, and import errors are announced through a polite live region as well as shown visually
- The import wizard and its diagnostics screen are keyboard operable, and each diagnostic error message is programmatically associated with its cell input so assistive technology announces it
- The spreadsheet matrix is keyboard operable: arrow keys move the active cell, the active cell is programmatically distinguishable, and inline editing starts and commits from the keyboard alone
- Financial figures are not conveyed by color or graphics alone: ledger totals, balances, and chart values are also available as text or accessible labels
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app, including no hydration errors or mismatch warnings on any route from a fresh load
- After first paint there is no visible content flash or layout jump as client hydration completes; the seeded workspace renders once and stays stable
- The UI stays responsive under rapid repeated input (fast stop creation, filter toggling, tab switching, FX edits, formula edits) with no hangs or dropped interactions
- Committing a CSV import of dozens of rows in one action renders the new rows, chart updates, and recomputed balances without freezing the UI
</performance>

<writing>
- Headings, buttons, and labels keep one consistent capitalization convention across the workspace
- Action labels are specific verbs such as Add stop, Optimize route, Download trip JSON, Copy ICS, and Import trip JSON rather than generic labels where a specific one is possible
- Validation and empty-state messages name the problem and the fix, including the field contract rule when validation fails (for example title length, category enum, endTime after startTime, schemaVersion, or amount greater than 0); no placeholder or lorem text appears anywhere in the shipped UI
- Settlement report and budget summary read as structured documents with labeled sections (balances, transactions, settled state; category totals, burn-rate, projection), not raw data dumps
- The markdown export uses a heading per day and readable time-ordered lines with no raw serialization artifacts such as [object Object] or undefined
</writing>

<innovation>
- Beyond the required ledger, export, and field-contract depth, optional polish such as chart tooltips or series toggles, a compile pulse on the export canvas, or a packing-progress celebration when a category reaches fully packed is welcome when it stays frontend-only and does not break the Stop, Expense, ICS, or Trip JSON field contracts
</innovation>

<requirements>
Shared application state must live in Pinia, the state library named in summary (in-memory only): the stops collection, expenses collection, day selection, active mode, place detail tabs, map selection, theme, undo/redo stacks, settlement settled flags, custom fields, packing progress, and toasts. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid stop increases the collection and shows it under its day section and on the map when applicable
- Editing a stop updates that same record in list, detail, and map selection
- Deleting a stop removes it from day lists, selection, and map pins
- Creating, editing, or deleting an expense updates the ledger, spreadsheet, balances, debt visualizer, pie, burn-rate chart, settlement report, and budget summary from the same shared collection
- Day filter and mode are shared client state; they recompute visible stops from the shared collection — never a second disconnected copy
- ICS, trip JSON, and markdown export previews compile live from the shared stores; Import trip JSON that passes the Trip JSON field contract replaces stops and expenses so every derived surface matches
Stack: Vue 3 with Nuxt pinned to static generation or SSR with client hydration; all interactivity lives in client state after load — no server API routes, server actions, or loaders. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in @theme. PrimeVue components for dialogs, selects, tabs, tables, and toasts; PrimeVue keeps its component styles while Tailwind owns layout, spacing, and custom surfaces; no other external component library. Motion for Vue is allowed for animation; no other animation libraries. Tabler icons via @tabler/icons-vue only; no raw pasted SVG icon sets and no icon CDNs. All forms (stop create and edit, expense create and edit, import paste when presented as a form) validate through a Zod schema driven by VeeValidate rendering inline per-field errors before submit. Schemas are API-shaped: they model the Stop, Expense, and Trip JSON field contracts above — the record a form creates IS the would-be request body, and exports and imports conform to those same schemas. Charting for the burn-rate chart and cost-allocation pie uses a local chart library installed via npm. The Source Sans Pro face ships locally (npm font package or vendored woff2); no font CDNs. The map pane is static snapshot chrome; live map tile engines and external tile servers are not used in this static-map product. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed a multi-day French Riviera plan (Nice, Monaco, Cannes, Antibes / Musee Picasso, Eze, Saint-Tropez, Menton) with at least 8 stops and at least 10 expenses spanning Lodging, Food, Transit, and Activities in at least 3 currencies; every seeded stop and expense conforms to its field contract
- Empty required fields on create must not increase the stops or expenses count; show visible validation feedback naming the field
- After deleting all stops, show an empty state in the plan list region and an ICS payload with zero VEVENT blocks
- Zero navigational outbound links; no live booking APIs or chat widgets
- Document title references the French Riviera trip; desktop layout: sidebar + plan + map
- The useful end state is the portable trip artifact set: ICS, trip JSON, and markdown compiled live from the session under the declared field contracts; an export that omits session mutations or fails those contracts is invalid
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
- Destinations: overview; day-detail; activity-form; budget-ledger; export-canvas
- Filters: day; type; category
- Themes: light; dark
- Entity: activity
- Entity operations: create; select; update; delete; reorder
- Entity fields: title; day; location; notes; startTime; endTime; category
- Form fields: title; day; location; notes; startTime; endTime; category
- Form operations: validate; submit; cancel
- Artifact operations: export; import; copy
- Export formats: ics; json; markdown
- Import modes: trip-json

Mechanics exclusions:
- Map pan/zoom / marker drag stays Playwright
- Raw file paths/blobs forbidden in WebMCP args
- Chart hover tooling stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
