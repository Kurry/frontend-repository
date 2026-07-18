<summary>
Build a media history timeline explorer using Solid.js, Solid stores, and Tailwind CSS.
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
- Four horizontal timeline bands with named titles; dual-handle year scrubber; cluster menus for overlapping pins; hover labels for unclustered pins
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
- Seed a non-empty corpus so first load is useful; seed enough user-editable events or allow create from empty user set with clear empty state
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all user-managed events (or filtering to zero matches), show an empty state in the list region
- Zero outbound navigational links; document title reflects MediaTimeline
</requirements>
