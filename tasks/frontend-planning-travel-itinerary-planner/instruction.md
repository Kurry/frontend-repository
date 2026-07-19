<summary>
Build a French Riviera trip itinerary planner using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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
- Direct planner entry — the trip plan workspace (left sidebar + center plan column + right map pane) loads immediately with no marketing landing, login, signup, or booking gate
- Top plan chrome — a Trip / Travel Planner brand mark, Trip plan / Trip journal mode labels, and Share and edit toolbar affordances rendered as inert in-app chrome
- Left nav sidebar — Overview, an Itinerary day list for Sun 7/5 through Sat 7/11 with a distinct day-color dot per day, a Budget row, and Support and Hide sidebar controls
- Primary collection — itinerary stops (places): seed at least 8 stops distributed across the seven days (the reference spreads roughly four to five stops per day) plus a few unscheduled ideas stops not tied to a day; each stop has a name, day assignment, optional time/note, and category; the list supports create, edit, and delete
- Plan hero — a cover image, an editable title Trip to the French Riviera - Cote d'Azur, and the date range 7/5–7/11
- An interactive map pane renders one numbered pin per stop colored by its day; the selected pin enlarges and opens a popup showing the place name and its Day N · Côte d'Azur label; unscheduled ideas use a neutral marker
- At least two interaction modes: Plan List mode (day sections + stop rows) and Map mode (map pane focus with pin selection / layers); switching modes updates without a full reload
- Selecting a stop opens a place-detail card over the map with About / Book / Reviews / Photos / Mentions tabs that swap panels in place; a dismiss control closes the card
- The stop create and edit form validates as the user types: each required field shows an inline error message naming that field while it is invalid, and the submit control stays disabled until all required fields are valid
- Domain behavior beyond CRUD: Optimize route and map layers act as demo chrome that may toast; an empty day/list state appears when all stops are deleted or filtered to none
- Inert actions raise demo toasts; zero outbound navigation
</core_features>

<user_flows>
- After creating a valid stop assigned to a day, that day's section shows exactly one more stop row, the map shows exactly one more numbered pin in that day's color, and switching between Plan List and Map modes shows the same new stop without a reload
- Editing a stop's name updates that same record everywhere it appears — its day-list row, the open place-detail card, and its map popup — without a reload
- Clicking a stop row flies the map to that stop's pin and highlights the row; clicking a pin selects the same stop and scrolls the list to its row; after either direction, the highlighted row and the enlarged pin refer to the same stop
- Selecting a day in the sidebar focuses the map on that day's center/zoom, selects the day's first stop, and recomputes the visible stops from the shared collection; returning to Overview restores the full plan without a reload
- Deleting a stop removes its row from the day section, its pin from the map, and clears it from any open selection in the same interaction
- A page reload returns the app to its seeded state: the seeded stops, day colors, and default Overview view reappear
</user_flows>

<edge_cases>
- Submitting the stop form with an empty name adds no stop: the stops count is unchanged and an inline validation message names the name field
- Double-activating the stop form submit creates exactly one stop: the day section gains one row and the map gains one pin
- After deleting all stops, the plan list region shows an empty state message and the map shows no numbered day pins
- Selecting a day whose stops have all been deleted shows an empty day state rather than a blank region
- A stop name too long for its row truncates with an ellipsis in the list row and is shown in full in the place-detail card
</edge_cases>

<visual_design>
- Product name Trip / Travel Planner with French Riviera — Côte d'Azur as the trip signal; first viewport is the planner workspace
- Soft coastal UI: cool blue-gray page wash, a bundled humanist sans-serif typeface, navy accent
- Three-pane desktop composition: left sidebar / center plan column / right map pane — planner density
- Each day carries its own color, shared by its sidebar dot and its numbered map pins; unscheduled ideas use a neutral marker; the selected pin is enlarged
- Place detail card floats over the map with a tab row (About / Book / Reviews / Photos / Mentions) and a dismiss control
- Icons across the sidebar, toolbar, and map chrome come from one consistent icon set at consistent sizes
- Empty list state is clear when no stops remain
</visual_design>

<motion>
- Hover animations (required): sidebar items ease hover opacity and brief press scale; place and carousel cards lift slightly on hover; map chrome buttons use the same hover/press microfeedback
- List microinteractions: a newly created stop row animates into its day section, a deleted row animates out, and reassigning a stop to another day animates the reflow of both affected day sections
- Place detail: tab switches swap panels without page navigation; detail overlays the map
- Mode emphasis between Plan List and Map updates without full reload; day selection may toast or focus the map
- Selecting a stop or a day eases/flies the map to the target and animates the chosen pin into its enlarged active state
- Demo toasts slide/fade in then auto-dismiss
- Respect prefers-reduced-motion by disabling toast/control transitions where practical
</motion>

<responsiveness>
- At desktop widths of 1024 pixels and above, the sidebar, plan column, and map pane render side by side; below 1024 pixels the map pane stacks below the plan column
- At widths of 768 pixels and below, the left sidebar collapses behind a toggle control that opens it as an overlay drawer
- No content clips or overflows the viewport and no horizontal scrolling appears at 375 pixel width
</responsiveness>

<accessibility>
- Every interactive control — sidebar rows, stop rows, form fields, place-detail tabs, and map chrome buttons — is reachable and operable with the keyboard alone, with a visible focus indicator
- The place-detail tab row is keyboard operable and marks the active tab programmatically; the dismiss control closes the card from the keyboard and focus returns to the stop that opened it
- Stop form validation messages are shown inline and announced through an aria-live polite region
- Map pins expose accessible names that include the place name and its day assignment
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of creating, editing, deleting, mode switching, day selection, and map selection
- Mode switches, day selection, and map fly animations stay smooth under rapid repeated input with no hangs or dropped interactions
</performance>

<requirements>
Shared application state must use Qwik stores, the state library named in summary (in-memory only): stops collection, day selection, active mode, place detail tabs, map selection, and toasts. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid stop increases the collection and shows it under its day section and on the map when applicable
- Editing a stop updates that same record in list, detail, and map selection
- Deleting a stop removes it from day lists, selection, and map pins
- Day filter and mode are shared client state; they recompute visible stops from the shared collection and never keep a second disconnected copy
Stack: Qwik with Qwik stores, Tailwind CSS 4.3.2 (pinned), and DaisyUI as the component library for chrome — sidebar menu, cards, tabs, buttons, toasts, and the stop form surfaces; frontend-only.
- AutoAnimate is the allowed animation library, used for stop list add/remove and day-section reflow; CSS transitions may cover hover and press feedback; no other animation libraries
- Iconify icons via the @iconify/tailwind4 plugin only, one consistent set; no other icon libraries and no copy-pasted raw SVG icon sets
- All forms validate through a schema: the stop create and edit form is driven by Modular Forms for Qwik with a Valibot schema defining the required fields, surfacing inline per-field errors before submit and keeping the submit control disabled until valid
- Leaflet CSS/JS vendored locally as a product map library
- The body typeface (Source Sans Pro or an equivalent open-license humanist sans) ships locally via an npm font package or vendored woff2; no font CDNs
- All libraries installed via npm and bundled locally; no CDN imports
- Seed a multi-day French Riviera plan (Nice, Monaco, Cannes, Antibes / Musée Picasso, Èze, Saint-Tropez, Menton) with at least 8 stops spread across the seven days Sun 7/5–Sat 7/11, each day in its own color, plus a few unscheduled ideas stops
- Empty required fields on create must not increase the stops count; show visible validation feedback
- After deleting all stops, show an empty state in the plan list region
- Zero navigational outbound links; no live booking APIs or chat widgets
- Document title references the French Riviera trip; desktop layout: sidebar + plan + map
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
