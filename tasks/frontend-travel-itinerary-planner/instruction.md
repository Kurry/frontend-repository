<summary>
Build a French Riviera trip itinerary planner using Qwik, Qwik stores, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct planner entry — trip plan workspace (sidebar + plan column + map); no marketing landing, login, signup, or booking gate
- Top plan chrome — Trip / Travel Planner brand mark, Trip plan / Trip journal mode labels, Share and edit toolbar affordances as in-app chrome
- Left nav sidebar — Overview, Itinerary day list for Sun 7/5–Sat 7/11 with day-colored dots, Budget row, Support and Hide sidebar
- Primary collection — itinerary stops (places): seed at least 8 stops across days; each has name, day assignment, time/note optional, and category; the list supports create, edit, and delete
- At least two interaction modes: Plan List mode (day sections + stop rows) and Map mode (map pane focus with pin selection / layers)
- Domain behavior beyond CRUD: day filter; select a stop to open place detail tabs (About / Book / Reviews / Photos / Mentions); Optimize route and layers as demo chrome that may toast; empty day/list state when all stops deleted or filtered to none
- Plan hero — cover image, editable title Trip to the French Riviera - Cote d'Azur, date range 7/5–7/11
- Invalid create: empty stop name must not add a stop; show visible validation feedback
- Demo toasts for inert actions; zero outbound navigation
- Interactive map via vendored Leaflet + OSM tiles; day nav and place selection must move/focus the map; pin and list sync required
</core_features>

<visual_design>
- Product name Trip / Travel Planner with French Riviera — Côte d'Azur as the trip signal; first viewport is the planner workspace
- Soft coastal UI: cool blue-gray page wash, Source Sans Pro, navy accent
- Three-pane desktop composition: left sidebar / center plan column / right map pane — planner density
- Day colors on sidebar dots and place pins; place detail card over the map with tab row
- Empty list state is clear when no stops remain
</visual_design>

<motion>
- Hover animations (required): sidebar items ease hover opacity and brief press scale; place and carousel cards lift slightly on hover; map chrome buttons use the same hover/press microfeedback
- Place detail: tab switches swap panels without page navigation; detail overlays the map
- Mode emphasis between Plan List and Map updates without full reload; day selection may toast or focus the map
- Demo toasts slide/fade in then auto-dismiss
- Respect prefers-reduced-motion by disabling toast/control transitions where practical
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): stops collection, day selection, active mode, place detail tabs, map selection, and toasts. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid stop increases the collection and shows it under its day section and on the map when applicable
- Editing a stop updates that same record in list, detail, and map selection
- Deleting a stop removes it from day lists, selection, and map pins
- Day filter and mode are shared client state; they recompute visible stops from the shared collection
Stack: Qwik + Qwik stores + Tailwind CSS; frontend-only. Leaflet CSS/JS vendored locally as a product map library.
- Seed a multi-day French Riviera plan (Nice, Monaco, Cannes, Antibes / Musée Picasso, Èze, Saint-Tropez, Menton) with at least 8 stops
- Empty required fields on create must not increase the stops count; show visible validation feedback
- After deleting all stops, show an empty state in the plan list region
- Zero navigational outbound links; no live booking APIs or chat widgets
- Document title references the French Riviera trip; desktop layout: sidebar + plan + map
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- form-workflow-v1

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

Bindings:
- Browsable entity: activities
- Destinations: overview; day-detail; activity-form
- Filters: day
- Entity: activity
- Entity operations: create; select; update; delete; reorder
- Entity fields: title; day; location
- Form fields: title; day; location; notes
- Form operations: validate; submit; cancel

Mechanics exclusions:
- Map pan/zoom / marker drag stays Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
