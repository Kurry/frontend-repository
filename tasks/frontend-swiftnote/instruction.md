<summary>
Build a SwiftNote keyboard-first note-taking app using Angular, NgRx, and Angular Material.
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
- On first load with no notes yet, the sidebar shows a friendly empty-state message with a hint to create the first note; the main area shows a SwiftNote welcome panel with a Create note button
- A New Note control (the sidebar Create note button, or the Alt+N shortcut) creates an untitled note, inserts its row at the top of the sidebar, and immediately focuses the note title field so typing lands in the title without any extra click
- The left sidebar lists every note sorted by last-edited time (most recently edited first); each row shows the note title (or Untitled), a one-line body preview, and a relative timestamp such as just now, 5m ago, 2h ago, or 3d ago
- Typing a title or body into the open note updates that note's sidebar row title, preview, and timestamp live, and re-sorts the row to the top as the most recently edited; editing a different note moves that note above the previously-edited one
- A small transient Saved label appears beside the editor after every edit and fades away on its own; there is no explicit save button
- A live counter beneath the open note shows the current word count and character count and recomputes exactly as text is added or removed
- A Quick Switcher overlay opens from a control and from the Ctrl+K (Cmd+K on macOS) shortcut; it lists notes by title, typing narrows the list instantly, and the currently highlighted result is visually distinguished from the rest
- Inside the Quick Switcher, the Down and Up arrow keys move the highlight through the currently-filtered results and wrap around at the ends (Down past the last result returns to the first; Up past the first goes to the last); as typing narrows the list the highlight re-clamps to a still-visible result, and pressing Enter opens whichever result is currently highlighted in the editor
- A Search Notes input in the sidebar filters the note list by title or body match; the matching term is visually highlighted within each matching row's preview, and a search matching nothing shows an explicit no-results message in the list area
- An Insert Image control (file picker) and drag-and-drop of an image file directly onto the note body both embed the chosen image inline within the open note; the image is stored as part of that note's own data so it travels with the note
- A Duplicate control clones a note's full text and every embedded image into a new separate note; editing the duplicate does not change the original (they are independent records, not a shared reference)
- An Export as .txt control downloads the open note's text as a plain-text file; embedded images are represented by a filename placeholder line in the exported text
- A Pin toggle on a note keeps it above all unpinned notes in the sidebar regardless of last-edited time; pinning an older note holds it above a newer unpinned note even after the newer note is edited
- A Focus Mode toggle hides the sidebar and expands the open note to fill the page width; an Exit Focus Mode control or the Escape key restores the sidebar
- A Delete control removes the open note only after an explicit confirm step (a confirmation dialog or inline confirm bar); cancelling the confirm leaves the note unchanged, and confirming removes it permanently from the list, the selection, and derived counts while other notes remain
- A Shortcuts control opens an overlay listing every available keyboard shortcut, including at least New Note, Quick Switcher, and Focus Mode, each paired with its key combination; the overlay is dismissed by a visible close control or Escape and returns to the note that was open
- Creating a note and deleting a note each show their own transient confirmation (a toast or equivalent) that is visually distinct from the per-edit Saved indicator
- A Load 10,000 Items control generates deterministic local sample notes and renders the list virtualized: only the visible window plus a small overscan buffer exists in the DOM at once while scrolling, filtering, selection, and scroll position are preserved as rows enter and leave; a visible region labelled Virtualized items shows the total and a region labelled Rendered item count shows how many rows are currently in the DOM (far below 10,000)
- The primary note workflow withstands at least 25 rapid consecutive New Note activations through its normal control: the final visible note count is exact, the controls stay responsive, and no blank screen, uncaught error, or sustained freeze occurs
- All keyboard shortcuts are honored and do not break the page: Alt+N creates a note, Ctrl+K (Cmd+K) toggles the Quick Switcher, Ctrl+Shift+F toggles Focus Mode, ? opens the Shortcuts overlay, Escape closes an open overlay or exits Focus Mode, and inside the Quick Switcher the arrow keys navigate and Enter opens the highlighted note
- No route other than / is required and no control navigates to another origin; every view change happens in-app via shared client state
</core_features>

<visual_design>
- Dark, near-black composition: page background renders as #000000, primary text as #FFFFFF, and primary/accent controls use the coral accent family #F45B69 / #F45B68; a secondary accent #646CFF is available
- Two-pane shell on wide screens: a fixed left sidebar (brand wordmark, Search Notes field, note list, footer stats and Load 10,000 Items) beside a note editor pane (toolbar of note actions, large title field, body area, image thumbnails, word/character counter)
- Typography is Roboto with a Roboto, sans-serif fallback for both headings and body; the primary heading renders at 55px, secondary headings at 24px, and body text at 16px; the base spacing unit is 4px and the default corner radius is 10px
- The Search Notes input and its adjoining Create note button read as one pill: the input has a white (#FFFFFF) background, black (#000000) text, no shadow, and corners rounded only on the left (12px) with square right corners; the button has a dark (#1A1A1A) background, white text, no shadow, and corners rounded only on the right (12px) with square left corners
- The Quick Switcher overlay is unmistakably layered above the rest of the app over a dimmed backdrop, and the currently-highlighted result is clearly distinguished by a background fill and an accent left border
- Body text, sidebar rows, and note previews keep clear contrast against the near-black background at all times, including while a row is hovered or selected; the selected row carries a coral tint and an accent left border
- Empty states are explicit: a sidebar empty-state before any note exists, a no-results message when a search matches nothing, and a welcome panel in the editor when no note is selected
- Buttons, sidebar rows, and toolbar controls show a visible hover state; keyboard Tab focus shows a visible focus ring on every interactive control
- Sidebar rows are dense and consistently aligned: title, one-line preview, and relative timestamp align across rows without ragged spacing or inconsistent truncation
- At approximately 375px wide the app renders without horizontal scrolling, the sidebar collapses behind a reachable hamburger toggle and slides in as an overlay, and the open note stays fully usable
</visual_design>

<motion>
- The Saved indicator fades and slides in when it appears after an edit and clears on its own shortly after
- Create and delete toasts slide up from the lower corner as they appear and dismiss on their own
- The sidebar animates its width, opacity, and position when Focus Mode is toggled and when the mobile drawer opens or closes, rather than snapping instantly
- The Quick Switcher and Shortcuts overlays appear over a dimmed backdrop; the Quick Switcher highlight moves between results as the arrow keys are pressed
- Hover feedback is required: buttons ease their background on hover with a slight press on click, and sidebar rows and toolbar controls take a visible hover wash; interactive controls show a focus ring on keyboard focus
- View switches (Focus Mode, opening or closing an overlay, selecting a note) update the panes without a full page reload
</motion>

<requirements>
Shared application state must live in NgRx store, actions, reducers, and selectors: the notes collection, the selected note, the search query, and UI chrome (Focus Mode, Quick Switcher open, Shortcuts open, sidebar collapse, toast message). Styling uses Angular Material theming conventions on top of the app's own dark token system.
Persistence (required): all notes, including their text, embedded images (stored as data URLs inside each note's own record), and pin state, plus the selected note, must persist to localStorage and be restored exactly after a full page refresh. Guard localStorage access so a build without it does not crash. This localStorage persistence is a required part of the product, not optional.
State contracts (behavioral, not storage keys):
- Creating a note increases the collection, inserts the new row at the top of the sidebar, and focuses the title field
- Editing a note updates that same record everywhere it appears (its sidebar row title, preview, timestamp, and ordering) and updates the live word and character counts to match the exact text
- Deleting a note (after the confirm step) removes it from the list, the selection, and derived counts; a later refresh does not revive it
- Pinning a note keeps it above unpinned notes regardless of edit recency, and pin state survives a refresh
- The search query recomputes the visible list from the shared collection and highlights matches; it does not create a second disconnected copy
- Duplicating a note produces an independent record whose later edits do not affect the original
- Focus Mode, Quick Switcher, and Shortcuts are shared client state; toggling them does not reload the document
Advanced behavior:
- The Load 10,000 Items control generates deterministic local sample notes and the list is virtualized: only the visible window plus a small overscan renders in the DOM, and selection, filtering, keyboard focus, and scroll position are preserved as rows enter and leave; expose a visible Virtualized items total and a visible Rendered item count
- At least 25 rapid consecutive New Note activations must leave an exact final count with the UI responsive and no uncaught error, blank screen, or sustained freeze; repeated activation must not fabricate success without the underlying note being created
- Invalid or extreme input (for example an empty note, an oversized paste, or a non-image drop) must be handled with visible, specific feedback and must not damage the last valid state
Build and scope:
- Angular standalone components; build succeeds against the pinned dependencies and serves on port 3000
- No backend, no authentication, no outbound navigation for app chrome; single library of notes at /
- Keyboard shortcuts must not conflict with standard browser shortcuts in a way that breaks the page, and every shortcut is documented in the Shortcuts overlay
- The app starts blank (no pre-seeded demo notes); the verifier creates its own notes through the UI
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
- entity-collection-v1
- browse-query-v1

Module specs:
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

Bindings:
- Entity: note
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; body
- Browsable entity: notes
- Destinations: editor; quick-switcher; shortcuts; focus-mode

Mechanics exclusions:
- Quick Switcher arrow-key navigation, wrap, and re-clamp stay Playwright-driven
- Focus Mode / mobile drawer slide and sidebar collapse stay Playwright-observed
- Toast and Saved-indicator appearance/timing stay Playwright-observed
- Drag-and-drop image embedding stays Playwright-observed
- 10,000-item virtualization scroll windowing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
