<summary>
Build a French Riviera trip itinerary planner using Vue 3 with Nuxt static delivery, Pinia, Tailwind CSS 4.3.2, and PrimeVue.
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
Feature: Itinerary stops collection —
- Itinerary stops (places) are the primary collection: seed at least 8 stops across days on first load; each stop shows a name, a day assignment, an optional time or note, and a category; the collection supports create, edit, and delete
- The stop create and edit form validates inline per field before submit: an empty required name shows an error message naming the name field next to it, and the submit control stays disabled until every required field is valid
- Submitting a valid stop adds exactly one row under its day section in the plan list
Feature: Modes, filter, and place detail —
- At least two interaction modes read from the same stops collection: Plan List mode (day sections + stop rows) and Map mode (map pane focus with pin selection and layers); switching modes swaps the emphasized region without a full page reload
- A day filter recomputes the visible stops from the shared collection; selecting a day narrows the plan list to that day's stops and clearing the filter restores all stops
- Selecting a stop opens a place detail card over the map with a tab row of About / Book / Reviews / Photos / Mentions; a seeded example (Musee Picasso or an equivalent stop) opens as the initial detail
- Optimize route and layers controls are demo chrome that may show a toast; the map pane is a static snapshot with Export / Optimize / layers affordances
Feature: Plan hero and demo chrome —
- The plan hero shows a cover image, an editable title reading Trip to the French Riviera - Cote d'Azur, the date range 7/5 to 7/11, a Browse all control, guide and hotel suggestion cards, and a place-suggestion strip
- Inert controls show demo toasts; zero outbound navigation anywhere in the app
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every step without a reload):
- Stop lifecycle: creating a valid stop closes the form, adds exactly one row under its assigned day section, and shows a matching pin on the map when applicable; switching to Map mode shows the same new stop without a reload; editing that stop's name updates the same record in the plan list row, the place detail card, and the map selection; deleting it removes it from its day section, from the map pins, and from any active selection, and the visible stop count decreases by exactly one
- Day filter echo: choosing a day from the sidebar itinerary list narrows the plan list to exactly that day's stops and the day's color highlight follows the selection; a stop created while the filter is active appears in the filtered list when it belongs to that day; clearing the filter restores the full multi-day list with the new stop still present
- Detail round trip: selecting a stop opens its place detail tabs over the map; switching between About / Book / Reviews / Photos / Mentions swaps panels in place without page navigation; switching Plan List and Map modes keeps the same stop selected; deselecting or deleting the stop dismisses the detail card
- A page reload returns the app to its seeded state: the seeded multi-day stops, no day filter, Plan List mode, and the seeded place detail example
</user_flows>

<edge_cases>
- Submitting the stop form with an empty name adds no stop, leaves the visible stop count unchanged, and shows validation feedback naming the name field
- Double-activating the stop submit control creates exactly one stop: the count increases by one and one new row appears
- Filtering to a day with no stops shows an empty day state in the plan list region with a message and a way to add a stop or clear the filter
- After deleting all stops, the plan list region shows an empty state explaining that no stops remain and offering the create flow
</edge_cases>

<visual_design>
- Product name Trip / Travel Planner with French Riviera — Cote d'Azur as the trip signal; first viewport is the planner workspace
- Soft coastal UI: cool blue-gray page wash, Source Sans Pro type, navy accent
- Three-pane desktop composition: left sidebar / center plan column / right map pane — planner density, not a marketing layout
- Day colors are consistent between the sidebar day dots and the map place pins; the place detail card floats over the map with its tab row
- The plan hero stacks the cover image, editable title, date range, and suggestion cards above the day sections in the plan column
- Empty list and empty day states are visually distinct regions with a message, not blank whitespace
- Component states: buttons, inputs, and tabs show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Hover animations (required): sidebar items ease hover opacity and take a brief press scale; place and carousel cards lift slightly on hover; map chrome buttons use the same hover and press microfeedback
- List microinteractions: a newly created stop row animates into its day section, a deleted row animates out, and reassigning a stop to another day moves it with a transition rather than an instant jump
- Place detail: tab switches swap panels without page navigation; the detail card overlays the map with a short enter transition
- Mode emphasis between Plan List and Map updates without a full reload; day selection may toast or focus the map
- Demo toasts slide or fade in, hold briefly, then auto-dismiss with a fade
- Validation feedback appears with a short transition rather than popping in
- With prefers-reduced-motion set, toast, list, and control transitions are removed and state changes apply instantly while every feature stays usable
</motion>

<responsiveness>
- At desktop widths (1440 pixels) the layout matches the reference composition: left sidebar, center plan column, right map pane all visible
- At widths of 768 pixels and below, the sidebar collapses behind a toggle that opens it as an overlay drawer, and the map pane stacks or yields to the active mode instead of sharing the row
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears
</responsiveness>

<accessibility>
- Every interactive control — sidebar items, mode switches, day filter, stop rows, form fields, detail tabs, and toasts' dismiss affordances — is reachable and operable with the keyboard alone, with a visible focus indicator
- The place detail tab row is keyboard operable: tabs can be reached and activated from the keyboard and the active tab is programmatically distinguishable
- Form validation messages are shown visually and associated with their fields so assistive technology announces them
- Demo toasts are announced through a polite live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app, including no hydration errors or mismatch warnings on any route from a fresh load
- After first paint there is no visible content flash or layout jump as client hydration completes; the seeded workspace renders once and stays stable
- The UI stays responsive under rapid repeated input (fast stop creation, filter toggling, tab switching) with no hangs or dropped interactions
</performance>

<writing>
- Headings, buttons, and labels keep one consistent capitalization convention across the workspace
- Action labels are specific verbs such as Add stop and Optimize route rather than generic labels where a specific one is possible
- Validation and empty-state messages name the problem and the fix; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must live in Pinia, the state library named in summary (in-memory only): the stops collection, day selection, active mode, place detail tabs, map selection, and toasts. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid stop increases the collection and shows it under its day section and on the map when applicable
- Editing a stop updates that same record in list, detail, and map selection
- Deleting a stop removes it from day lists, selection, and map pins
- Day filter and mode are shared client state; they recompute visible stops from the shared collection — never a second disconnected copy
Stack: Vue 3 with Nuxt pinned to static generation or SSR with client hydration; all interactivity lives in client state after load — no server API routes, server actions, or loaders. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in @theme. PrimeVue components for dialogs, selects, tabs, and toasts; PrimeVue keeps its component styles while Tailwind owns layout, spacing, and custom surfaces; no other external component library. Motion for Vue is allowed for animation; no other animation libraries. Tabler icons via @tabler/icons-vue only; no raw pasted SVG icon sets and no icon CDNs. All forms (stop create and edit) validate through a Zod schema driven by VeeValidate rendering inline per-field errors before submit. The Source Sans Pro face ships locally (npm font package or vendored woff2); no font CDNs. The map pane is static snapshot chrome; live map tile engines and external tile servers are not used in this static-map product. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed a multi-day French Riviera plan (Nice, Monaco, Cannes, Antibes / Musee Picasso, Eze, Saint-Tropez, Menton) with at least 8 stops
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
