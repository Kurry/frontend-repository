<summary>
Build a French Riviera trip itinerary planner using Vue 3, Pinia, and UnoCSS.
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
- Map pane is static snapshot chrome with Export / Optimize / layers affordances; place detail seeded open example (Musée Picasso or equivalent)
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
Stack: Vue 3 + Pinia + UnoCSS (Vite or equivalent SPA); frontend-only. Leaflet/live map tiles are not required for this static-map product.
- Seed a multi-day French Riviera plan (Nice, Monaco, Cannes, Antibes / Musée Picasso, Èze, Saint-Tropez, Menton) with at least 8 stops
- Empty required fields on create must not increase the stops count; show visible validation feedback
- After deleting all stops, show an empty state in the plan list region
- Zero navigational outbound links; no live booking APIs or chat widgets
- Document title references the French Riviera trip; desktop layout: sidebar + plan + map
</requirements>
