<summary>
Build a media history timeline explorer using React, Jotai, and Tailwind CSS.
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
Core features (each line is an observable behavior the finished app must exhibit):
- The app opens directly on the timeline stage — a brand header, a canvas year axis with event pins, and a footer scrubber — with no marketing landing, login, or backend request
- Primary collection — timeline events: seed a substantial corpus (on the order of dozens; target roughly 60), each event carrying a title, an integer year (negative for BCE), a place, one or more category/band tags, a short summary, and a longer detail; the collection supports create, edit, and delete of at least a user-managed set (the seeded corpus may stay read-only beside user events, or all events may be editable)
- The stage plots pins by year across a wide span (roughly 3200 BCE to 2024 CE), positioning each pin from the visible year window; the initial window opens on a bounded default range (for example ~1450–1920) rather than the full span
- Panning the stage by drag shifts the pins, wheel-zoom widens or narrows the visible year window about its midpoint, and shift-scroll (or horizontal scroll) slides the window earlier or later in time — all live, without reload
- A dual-handle footer scrubber sets the visible from/to years (the handles cannot cross and keep a minimum gap) and a Full span control fits the entire corpus; a readout shows the current year range in BCE/CE form
- The canvas axis draws era bands (about seven labelled eras across the span) and adaptive year ticks; pins carry their category color and are culled when scrolled off-screen
- At least two interaction modes: Scrub/Explore mode (pan, year window, pins on the stage) and Library/Filter mode (a searchable, filterable event list with create/edit forms)
- Filtering combines a category/band filter (toggling roughly a dozen categories, where an event shows when any of its categories is active), a live text search across title/place/summary/detail, and the year window — all recomputing the visible pins and list from the shared collection, sorted chronologically
- Selecting a pin opens an in-page detail panel with a kicker (year · place), title, category pills, summary, and detail, plus Previous/Next controls that step through the sorted, filtered events with wraparound; closing returns to the stage without leaving the page
- Chrome controls: Filters opens a drawer, About opens an in-page modal, and Reset filters restores the default categories, clears the search, and returns to the default year window
- Empty state: when the filters, search, and year window match nothing — or when all user-managed events are deleted — the list/stage region shows a visible empty state
- Invalid create: an empty title or invalid year must not add an event and must surface visible validation feedback
- Keyboard: Escape closes the topmost of About, the Filters drawer, or the detail panel; ArrowLeft/ArrowRight step Previous/Next while a detail is open (suppressed while typing in a field)
- Zero outbound navigation — exploration stays on the local app
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
- Seed a substantial corpus (on the order of dozens, target roughly 60 events) spanning roughly 3200 BCE to 2024 CE, categorized under about a dozen color-coded categories and grouped by about seven labelled eras; seed enough user-editable events or allow create from an empty user set with a clear empty state
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all user-managed events (or filtering to zero matches), show an empty state in the list region
- Zero outbound navigational links; document title reflects MediaHistoryTimeline
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
- Entity fields: title; era; type

Mechanics exclusions:
- Scroll/scrub timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
