<summary>
Build a media history timeline explorer using React, Jotai, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct timeline entry — exploration stage plus year scrubber/controls; no marketing landing, login, or backend
- Primary collection — timeline events (clips): seed a non-empty corpus (on the order of dozens of events); each event has title, year (negative for BCE), place, category/band, and summary; the collection supports create, edit, and delete of user-managed events (seeded corpus may remain read-only alongside user events, or all events may be editable — but create/edit/delete of at least the user-managed set is required)
- At least two interaction modes: Scrub/Explore mode (pan, year window, pins on the stage) and Library/Filter mode (searchable/filterable event list with create/edit forms)
- Domain behavior beyond CRUD: year-window scrubbing that changes which pins are in view; category/band filters; selection opens in-page detail; empty state when filters match nothing or when all user-managed events are deleted; BCE/CE year display
- Event detail opens in-page (popup or panel); close returns to the stage without leaving the page
- Invalid create: empty title or invalid year must not add an event; show visible validation feedback
- Zero outbound navigation — exploration stays on the local app
- Brand header with Full span, Filters, and About; canvas axis with pins; dual-handle footer scrubber; Filters drawer and detail panel
</core_features>

<visual_design>
- Product name MediaHistoryTimeline with History of Media and Communication as the brand signal; first viewport is the timeline tool itself
- Expressive typography (not Inter/Roboto/system defaults); warm or cool paper stage atmosphere with CSS variables
- Primary composition: full-bleed or primary stage viewport plus scrubber/footer; Library/Filter is a distinct panel or mode, not a competing marketing hero
- Event pins or list rows show category color; detail uses clear hierarchy (kicker, title, body)
- Empty filter/collection state is visually present in the list region
</visual_design>

<motion>
- Stage pan/scrub updates the year window and pin positions live without page reload
- Event detail opens/closes with short opacity/transform settle
- Mode switch between Scrub/Explore and Library/Filter updates the canvas without full reload
- Hover animations (required): pins or list rows scale/glow or take a hover wash; scrubber thumbs and chrome buttons brighten on hover; focus-visible rings on interactive controls
- Respect prefers-reduced-motion by shortening non-essential fades while keeping pan/scrub/filter functional
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): events collection, visible year window, filters/selection, active mode, and detail open state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid event increases the collection and shows it in Library/Filter and on the stage when in range
- Editing an event updates that same record in list, pins, and detail
- Deleting an event removes it from list, stage, selection, and counts
- Filters and year window recompute visible events from the shared collection
- Active mode and selection are shared client state; switching modes does not reload the document
Stack: React + Jotai + Tailwind CSS (Vite or equivalent SPA). No external component libraries beyond the stack.
- Seed a non-empty corpus so first load is useful; seed enough user-editable events or allow create from empty user set with clear empty state
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all user-managed events (or filtering to zero matches), show an empty state in the list region
- Zero outbound navigational links; document title reflects MediaHistoryTimeline
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

Bindings:
- Browsable entity: timeline-events
- Destinations: timeline; event-detail; filters
- Filters: era; type
- Entity: event
- Entity operations: create; select; update; delete
- Entity fields: title; era; type

Mechanics exclusions:
- Scroll/scrub timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
