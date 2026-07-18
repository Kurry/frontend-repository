<summary>
Build a media history timeline explorer using Solid.js, Solid stores, and Tailwind CSS.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features:
- The app opens directly onto the timeline exploration stage (axis, era bands, event pins) with a year scrubber and filter controls; no marketing landing, login, or backend
- Primary collection is timeline events: seed a dense corpus on the order of ~60 events spanning at least 10 categories and at least 5 named eras, each event carrying title, year (negative for BCE), place, one or more categories, and a summary/detail; create, edit, and delete are supported for at least the user-managed events (the seeded corpus may stay read-only alongside them)
- Two interaction modes: Scrub/Explore mode (drag to pan the stage, wheel to zoom the year window around its midpoint, Shift+wheel or a dominant horizontal wheel to translate the window) and Library/Filter mode (search + category filters + create/edit forms)
- A dual-handle year scrubber sets the from/to window with a formatted BCE/CE readout; numeric year from/to inputs set the same window; a fit-all/reset control returns to the full span or the default window
- Category filters (all enabled by default) plus a free-text search over title/place/summary recompute which events are in view; a clear-filters control restores every category and the default range
- Named era bands (at least 5) wash the stage behind the axis, and a current-era label reflects the era at the window midpoint and updates as the window moves
- Event pins carry their category color at year positions; hovering an unclustered pin reveals a label with title, place, and BCE/CE year, and same-year or overlapping pins offset so each stays individually clickable
- Clicking a pin opens an in-page detail (panel/popup) showing kicker (year · place), title, category, and body; Previous/Next controls and the ←/→ arrow keys step through the currently filtered events, and Escape or a close control returns to the stage without leaving the page
- An event-count readout ("N events in view") and a result note ("Showing N of M catalogued events", or a search-matched count) track the visible set
- An About/help overlay opens in-page with how-to copy and no outbound links
- Invalid create: empty title or invalid year shows visible validation feedback and adds no event
- Editing a user event updates it in the list, its pin, and any open detail; deleting removes it from the list, stage, selection, and counts
- An empty state appears in the list/stage region when filters or the year window match nothing, or when all user-managed events are deleted
- Zero outbound navigation — exploration stays on the local app
</core_features>

<visual_design>
- Product name MediaTimeline with History of Media and Communication as the brand signal; first viewport is the timeline tool itself
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
Stack: Solid.js + Solid stores + Tailwind CSS (Vite or equivalent SPA). Paper.js (or equivalent vector canvas) plus client helpers (e.g. GSAP/Draggable, particles) are allowed for pan, scrubber, labels, and popup transitions.
- Seed a dense corpus on the order of ~60 events across at least 10 categories and at least 5 named eras so first load is useful across zoom levels; seed enough user-editable events or allow create from an empty user set with a clear empty state
- Wheel zoom and Shift/horizontal-wheel pan recompute the year window; the current-era label and event-count readout follow the shared window and filters
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all user-managed events (or filtering to zero matches), show an empty state in the list region
- Zero outbound navigational links; document title reflects MediaTimeline
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
- Filters: category
- Entity: event
- Entity operations: create; select; update; delete
- Entity fields: title; era; type; summary

Mechanics exclusions:
- Scroll-linked parallax / scrub timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
