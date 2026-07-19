<summary>
Build a media history timeline explorer using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
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
- The app opens directly onto the timeline exploration stage (axis, era bands, event pins) with a year scrubber and filter controls; no marketing landing, login, or backend
- Primary collection is timeline events: seed a dense corpus on the order of ~60 events spanning at least 10 categories and at least 5 named eras, each event carrying title, year (negative for BCE), place, one or more categories, and a summary/detail; create, edit, and delete are supported for at least the user-managed events (the seeded corpus may stay read-only alongside them)
- Two interaction modes: Scrub/Explore mode (drag to pan the stage, wheel to zoom the year window around its midpoint, Shift+wheel or a dominant horizontal wheel to translate the window) and Library/Filter mode (search + category filters + create/edit forms)
- A dual-handle year scrubber sets the from/to window with a formatted BCE/CE readout; numeric year from/to inputs set the same window; a fit-all/reset control returns to the full span or the default window
- Category filters (all enabled by default) plus a free-text search over title/place/summary recompute which events are in view; a clear-filters control restores every category and the default range
- Named era bands (at least 5) wash the stage behind the axis, and a current-era label reflects the era at the window midpoint and updates as the window moves
- Event pins carry their category color at year positions; hovering an unclustered pin reveals a label with title, place, and BCE/CE year, and same-year or overlapping pins offset so each stays individually clickable
- Clicking a pin opens an in-page detail (panel/popup) showing kicker (year · place), title, category, and body; Previous/Next controls and the left/right arrow keys step through the currently filtered events, and Escape or a close control returns to the stage without leaving the page
- The Library/Filter event list scrolls smoothly through the full seeded corpus with no blank gaps or stutter while scrolling rapidly from top to bottom
- The create and edit forms validate every field before submit: an empty title or an invalid year shows an inline error message naming that field next to it, and the submit control stays disabled or rejects submission until all fields are valid
- An event-count readout ("N events in view") and a result note ("Showing N of M catalogued events", or a search-matched count) track the visible set
- An About/help overlay opens in-page with how-to copy and no outbound links
- Zero outbound navigation — exploration stays on the local app
</core_features>

<user_flows>
User flows (end-to-end state coherence across views):
- Creating a valid event in Library/Filter mode adds exactly one row to the event list, increases the "Showing N of M catalogued events" readout by one, and switching to Scrub/Explore mode shows the new event's pin at its year position (when in the visible window) without a page reload
- Editing a user-managed event's title or year updates that same record in the library list row, in its stage pin position and hover label, and in any open detail panel, all without a reload
- Deleting a user-managed event removes its list row, removes its pin from the stage, clears it from any open detail or selection, and decreases both the event count readout and the in-view count by one
- Disabling a category filter removes that category's pins from the stage, drops the same events from the library list, and lowers the "N events in view" readout immediately; re-enabling or using clear-filters restores the pins, rows, and counts exactly
- Narrowing the year window with the scrubber lowers the "N events in view" readout to only events inside the window, updates the current-era label to the era at the new midpoint, and the numeric from/to inputs show the same bounds the scrubber set
- Stepping through events with Previous/Next in the detail panel follows the currently filtered order: after applying a category filter, stepping never lands on an event from a disabled category
- A page reload returns the app to its seeded state: the seeded corpus, default year window, all categories enabled, and no user-created events
</user_flows>

<edge_cases>
- Submitting the create form with an empty title or an invalid year shows visible per-field validation feedback and adds no event; the collection count does not change
- An empty state appears in the list/stage region when filters or the year window match nothing, or when all user-managed events are deleted, with a message and a control that restores filters or opens the create flow
- Same-year or overlapping pins offset so each remains individually hoverable and clickable
- Double-activating the create form's submit control adds exactly one event: the count increases by one and one new row appears
- Zooming fully out or using fit-all always shows the full seeded span; zooming keeps the window midpoint stable so events do not jump sides
</edge_cases>

<visual_design>
- Product name MediaTimeline with History of Media and Communication as the brand signal; first viewport is the timeline tool itself
- Expressive typography (not Inter/Roboto/system defaults); warm or cool paper stage atmosphere with CSS variables
- Primary composition: full-bleed or primary stage viewport plus scrubber/footer; Library/Filter is a distinct panel or mode, not a competing marketing hero
- Event pins or list rows show category color; detail uses clear hierarchy (kicker, title, body)
- A single icon set is used consistently across chrome controls (mode switch, filters, close, navigation); no mixed icon styles
- Empty filter/collection state is visually present in the list region
</visual_design>

<motion>
- Stage pan/scrub updates the year window and pin positions live without page reload
- Event detail opens/closes with short opacity/transform settle
- Mode switch between Scrub/Explore and Library/Filter updates the canvas without full reload
- Creating an event animates its list row in; deleting an event animates its row out rather than snapping
- Validation errors and the empty state appear with a short fade or slide rather than popping in
- Hover animations (required): pins or list rows scale/glow or take a hover wash; scrubber thumbs and chrome buttons brighten on hover
- Respect prefers-reduced-motion by shortening non-essential fades while keeping pan/scrub/filter functional
</motion>

<responsiveness>
- At widths of 768 pixels and below, the stage and Library/Filter stack or the library becomes a drawer/sheet; both modes stay reachable and usable
- No content clips or overflows the viewport and no horizontal page scrolling appears at 375 pixel width; the scrubber remains operable at that width
</responsiveness>

<accessibility>
- Every interactive control (mode switch, scrubber thumbs, year inputs, filters, pins or their list equivalents, detail navigation) is reachable and operable with the keyboard alone, with a visible focus-visible ring
- The detail panel/popup and the About overlay behave as dialogs: Escape closes them and focus returns to the control that opened them
- Left/right arrow keys step Previous/Next through the filtered events while the detail is open
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during load or a full exercise of scrubbing, zooming, filtering, creating, editing, and deleting
- Rapid wheel zoom and continuous scrubbing update pins and readouts without hangs, visible hitching, or dropped interactions
</performance>

<writing>
- Years render consistently in BCE/CE format everywhere they appear (scrubber readout, pins' hover labels, detail kicker, list rows)
- Validation messages name the field and the fix; empty states explain what matched nothing and how to recover
- The About/help copy explains both interaction modes in complete sentences with no placeholder text anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use Solid stores (in-memory only): events collection, visible year window, filters/selection, active mode, and detail open state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid event increases the collection and shows it in Library/Filter and on the stage when in range
- Editing an event updates that same record in list, pins, and detail
- Deleting an event removes it from list, stage, selection, and counts
- Filters and year window recompute visible events from the shared collection; they never create a second disconnected copy
- Active mode and selection are shared client state; switching modes does not reload the document
Stack: Solid.js + Solid stores + Tailwind CSS 4.3.2 (pinned; design tokens in @theme), built with Vite or an equivalent SPA setup.
- Kobalte components for the app's dialogs/popovers (event detail, About overlay), selects, tooltips, and other primitive chrome
- Motion (motion.dev vanilla) allowed for animation; no other animation libraries
- Tabler icons via @tabler/icons-solidjs only; one set, used consistently; no raw copy-paste SVGs and no icon CDN
- All forms (create and edit) are driven by TanStack Form for Solid or Felte paired with a Zod schema: the schema defines the validation rules and the form surfaces inline per-field errors before submit
- The Library/Filter event list is virtualized with virtua so scrolling the full corpus stays smooth
- All libraries installed via npm and bundled locally; no CDN imports; fonts bundled locally
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
- Filters: era; type
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
