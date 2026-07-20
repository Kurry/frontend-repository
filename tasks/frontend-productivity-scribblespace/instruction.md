<summary>
Build a ScribbleSpace freeform notes canvas using Vue 3, Pinia stores for shared state, Tailwind CSS 4.3.2, and Reka UI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots: overview.png is a full-page desktop-layout overview (downscaled); segment-NN.png are full-resolution 1440x900 sections in top-to-bottom order with slight overlap. They are part of this instruction: recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Feature: Canvas shell —
- On load the app opens directly at the canvas (no login) showing one default board named Board 1, an empty canvas with a centered hint reading This board is empty / Add a note, flashcard or shape to get started, a footer object count of 0 objects, and an empty Archive panel
- The infinite canvas pans by click-and-dragging empty canvas space; a dotted-grid backdrop shifts with the pan so movement is visible
- A Zoom Out / zoom-percentage readout / Zoom In / Reset View control group changes zoom in 15 percent steps clamped between 25 percent and 300 percent; the current zoom percentage is always displayed and Reset View returns it to 100 percent and recenters the view
- A page reload returns the app to that seeded baseline — one Board 1, zero objects, empty archive, idle stream — with no prior session boards or objects restored from browser storage

Feature: Create objects —
- Clicking New Note places a draggable sticky note near the canvas center with an editable multi-line text body; when the note is the sole selection a color picker of exactly 6 swatches (butter yellow #FFF9C4, peach #FFE0B2, rose #FFCDD2, mint #C8E6C9, sky blue #BBDEFB, lilac #E1BEE7) appears and clicking a swatch recolors the note immediately with a check mark marking the active swatch
- Clicking New Flashcard places a two-sided card with a Front side shown by default, a small flip icon and side label, and a Flip control; Flip toggles the visible side between Front and Back, and each side has its own editable text
- Clicking New Shape opens a menu offering Rectangle, Circle, and Arrow; choosing one places that shape, and when a single shape is selected a 6-swatch shape color picker (violet #6D5BD0, amber #E0A030, green #3F9E6E, coral #D95563, blue #3E7CB1, slate #5A5F73) recolors it immediately
- New objects placed at an already-occupied default position are offset by about 28px so they stay individually selectable rather than perfectly stacked
- Note create/update field contract (the record New Note places, and every later text, color, or geometry commit on that note, IS this would-be canvas-object request body; every Workspace JSON objects entry with type note uses the same keys, bounds, and enums; all keys required unless marked optional; example values illustrative only):
  - Required type: exactly the string note
  - Required id: non-empty string assigned by the app on create
  - Required text: string of at most 8000 characters (empty allowed); committing an over-length body shows a visible message naming the text field and keeps the last valid text
  - Required color: exactly one of #FFF9C4, #FFE0B2, #FFCDD2, #C8E6C9, #BBDEFB, #E1BEE7
  - Required x and y: finite numbers
  - Required width and height: numbers at least 120 and 96 respectively
  - Required zIndex: non-negative integer
- Flashcard create/update field contract (same sharing rules as note; Workspace JSON objects with type flashcard match):
  - Required type: exactly the string flashcard
  - Required id: non-empty string assigned by the app on create
  - Required front and back: strings each at most 8000 characters (empty allowed); committing an over-length side shows a visible message naming the front or back field and keeps the last valid value
  - Required flipped: boolean
  - Required color: exactly one of #FFF9C4, #FFE0B2, #FFCDD2, #C8E6C9, #BBDEFB, #E1BEE7
  - Required x and y: finite numbers
  - Required width and height: numbers at least 120 and 96 respectively
  - Required zIndex: non-negative integer
- Shape create/update field contract (the record New Shape places IS this payload; Workspace JSON objects with type rectangle, circle, or arrow match):
  - Required type: exactly one of rectangle, circle, or arrow matching the chosen menu item
  - Required id: non-empty string assigned by the app on create
  - Required color: exactly one of #6D5BD0, #E0A030, #3F9E6E, #D95563, #3E7CB1, #5A5F73
  - Required x and y: finite numbers
  - Required width and height: numbers at least 48
  - Required zIndex: non-negative integer

Feature: Edit and format —
- A note body or flashcard side is edited by double-clicking it (or selecting it and pressing Enter) to reveal an inline text editor; typing updates the text live, and Escape or clicking outside the editor commits the text under the note or flashcard field contract
- While editing a note body or a flashcard side, a compact formatting toolbar offers bold, italic, and bullet-list controls; selecting text and activating the bold control renders that text bold immediately, activating it again removes the bold, and committed formatting is preserved on the rendered object
- While a text editor is open, an undo step reverses the most recent typing or formatting change and a redo step reapplies it, without affecting any other object

Feature: Transform and connect —
- Every object can be repositioned by dragging it and resized by dragging any of its four corner handles (shown when singly selected); notes and flashcards stop shrinking below width 120 and height 96, shapes stop below width and height 48, and positions and sizes persist for the session under those field-contract minima
- Each singly selected object also exposes on-screen Move (left/up/down/right) and Grow / Shrink controls that nudge position by 24px and size by 24px as a non-drag alternative without violating the width and height minima
- A Connect tool switches the canvas into connect mode (crosshair cursor, a helper banner reading Click an object to start a connector); clicking one object then another draws a persistent accent-colored line joining them, and a dashed preview line follows the cursor between the two clicks
- Connector create field contract (the line Connect draws IS this would-be connector request body; every Workspace JSON connectors entry uses the same keys and cross-field rules; all keys required unless marked optional):
  - Required id: non-empty string assigned by the app on create
  - Required fromId and toId: distinct non-empty strings that each equal an object.id on the same board; a second Connect of the same undirected pair is rejected with a visible message naming the duplicate and draws no second line
- A connector's endpoints follow their objects live as either is moved; every connector shows a round Remove Connector button at its midpoint that deletes only that connector, leaving both objects
- Requesting a duplicate connector between the same two objects is idempotent: no second line is drawn and a visible message explains the duplicate was ignored

Feature: Selection, archive, and duplicate —
- Clicking an object selects it and shows an unmistakable outline; shift-clicking adds or removes objects from a multi-selection, and a N selected count with Delete Selected, Duplicate Selected, Archive Selected, and Clear selection controls appears while any selection exists
- Delete Selected opens a single confirmation dialog; confirming removes every selected object and every connector touching them from the board into the Archive vault, while canceling leaves them intact
- Archive Selected moves the selection into the Archive panel and off the canvas without requiring the delete confirmation; Restore returns an archive row to the board and Outline; Purge permanently removes that archive row
- With one note selected, Duplicate Selected increases the footer object count by exactly one, places a clone offset by about 28px with independent identity, and editing the clone's text does not change the original
- A singly selected object exposes Bring to Front and Send to Back controls that change its stacking order so it renders above or below overlapping objects

Feature: Boards —
- A boards switcher lists board tabs with the active tab highlighted; New Board creates another independent in-session board (named Board N) and switches to it, and each active board tab has a rename control and a delete control
- Board rename field contract (the record Confirm produces IS this payload; the rename schema and every board.name in Workspace JSON export enforce the same rules; all keys required unless marked optional; example values illustrative only):
  - Required name: trimmed non-empty string at most 60 characters; empty, whitespace-only, or over-length values fail validation naming the board-name field, disable the confirm control, and leave the previous valid name undamaged
- Deleting a board opens a confirmation dialog; confirming removes the board and canceling leaves it intact; deleting the active board switches to another existing board, and deleting the last board creates a fresh default board so the user is never left on a missing board

Feature: Navigation chrome —
- A mini-map panel in the canvas corner shows a scaled overview of all objects on the current board plus a rectangle marking the current viewport; clicking within the mini-map recenters the main view on that point
- A search input highlights every note or flashcard whose text (note body, or flashcard front or back) contains the query with a glowing outline, shows a match count, and pans the view to the first match; a query matching nothing shows an explicit no-results message reading No results for the query
- A second view mode toggles between the canvas and an Outline view listing every object on the active board as rows with type label, color name, flashcard flip state, and inline Edit / Flip / Delete controls; both views read and write the same board state
- Canvas-level Undo and Redo controls reverse and reapply board mutations (create, delete/archive of objects, duplicate); after placing a note then a flashcard, Undo removes the flashcard from canvas, Outline, and footer count and enables Redo; Redo restores it; placing another object after undo disables Redo; with empty stacks Undo and Redo are disabled
- A Command palette opened via Ctrl+K (or Cmd+K) filters commands such as New Note; choosing New Note and pressing Enter places a note the same way the toolbar New Note control does and closes the palette

Feature: Workspace artifacts (the app produces the user's ScribbleSpace package) —
- An Export workspace control opens an artifact panel with three format tabs — Workspace JSON, Markdown outline, and Plain text — each regenerated live from the current boards, objects, connectors, colors, text, formatting, and flashcard flip state whenever those change
- Workspace JSON is API-shaped like a canvas-workspace export payload — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: exactly the string scribblespace-workspace-v1
  - Required exportedAt: non-empty ISO-8601 timestamp string
  - Required activeBoardId: non-empty string that equals exactly one board.id in boards
  - Required boards: array of board objects; each requires id (non-empty string), name (same name contract as board rename), objects (array of note, flashcard, or shape create/update records), and connectors (array of connector create records)
  - Each objects entry must satisfy the Note, Flashcard, or Shape create/update field contract for its type, including closed color enums, text/front/back length bounds, width/height minima, and zIndex rules; note text and flashcard front/back carry any committed formatting representation shown in the preview
  - Each connectors entry must satisfy the Connector create field contract
- Markdown outline previews a human-readable report grouped by board name with each object listed under its board heading; Plain text lists the active board name, object count, every object numbered with its type label (Note, Flashcard, or Shape) including note body text and flashcard front/back and showing side, plus a connectors listing
- The board rename schema, the note/flashcard/shape/connector create schemas, and the Workspace JSON shape share those field contracts; every violation message names the offending field
- Each format tab offers Copy (writes that format's text to the clipboard with a brief copied confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
- Export content that omits the session's actual work is invalid: after creating a note with distinctive text, recoloring it, and renaming the board, all three export formats must contain that text and board name, and Workspace JSON must still show every required key from the field contract including schemaVersion scribblespace-workspace-v1 plus objects entries whose type, color, text, and geometry fields match the create contracts
- An Import workspace control accepts a pasted or file-picked Workspace JSON payload matching the field contract: a valid payload replaces the shared boards collection and activeBoardId so canvas, Outline, footer counts, and all three export previews show the imported state; malformed JSON or a document that fails the field contract (wrong schemaVersion, missing boards or activeBoardId, activeBoardId not in boards, type outside the closed enum, color outside the closed hex enum for that type, text/front/back over 8000 characters, width/height below the create-contract minima, connector endpoints that do not resolve on the same board, or a board name that fails the rename contract) shows visible validation feedback naming the offending field and changes nothing

Feature: Live events —
- A Show live events panel exposes a deterministic local event stream with Start, Pause, Disconnect, Reconnect, and Deliver Out of Order controls and a visible status (Idle, Active, Paused, Disconnected, Replaying, or Caught up) plus an N of 12 events applied readout; the stream applies 12 events that each add one note
- Each live event carries a stable ID and a logical timestamp; duplicate delivery of an event is ignored, out-of-order delivery is received but not applied until Reconnect, Reconnect applies every still-missing event exactly once in logical-timestamp order, and a repeated Reconnect applies nothing new so no update is double-applied
</core_features>

<user_flows>
- After creating a note through New Note, the footer object count increases by exactly one, the empty-canvas hint disappears, switching to the Outline view shows the same note as a row with its color name without a reload, and Export workspace Workspace JSON preview includes schemaVersion scribblespace-workspace-v1 and an objects entry with type note
- Creating a second board through New Board switches to an empty canvas showing the empty hint and a 0 objects count while the first board keeps every one of its objects; renaming the new board updates its tab label immediately and every Export format preview shows the new name
- Connecting two notes and then deleting one of them through Delete Selected removes that note, every connector touching it, and its Outline row in the same confirmed action, moves the note into the Archive vault, and decreases the footer object count by exactly one
- Starting the live event stream raises the applied-events readout and the footer object count together, one note per applied event, and each added note also appears as a row in the Outline view; pausing halts both counts at the same value
- Artifact end state: create notes on two named boards and a connector, open Export workspace, confirm Workspace JSON shows schemaVersion scribblespace-workspace-v1 plus exportedAt, activeBoardId, and boards keys with those objects, confirm Markdown and Plain text contain the board names and note text, Copy confirms on the active tab, Download Workspace JSON then Import of that same document reconstructs the same boards, objects, and connector while later mutations made after download are gone
- Undo flow: place two objects, Undo once (count and Outline drop by one), Redo restores; a new create after undo disables Redo
- Command palette: open via Ctrl+K (or Cmd+K), filter to New Note, press Enter, and confirm a note appears the same way as the toolbar path
- A full page reload returns the app to the seeded baseline — one Board 1, zero objects, empty archive, idle stream — with no prior session work restored
</user_flows>

<edge_cases>
- New objects placed at an already-occupied default position are offset by about 28px so they stay individually selectable rather than perfectly stacked
- An empty or over-60-character board name is rejected with a visible inline message naming the board-name field, and the last valid name is kept undamaged
- Committing a note body or flashcard front/back longer than 8000 characters shows a visible message naming the text, front, or back field and keeps the last valid value; the Workspace JSON preview does not adopt the over-length string
- Requesting a duplicate connector between the same two objects is idempotent: no second line is drawn, no duplicate is stacked, and a visible message explains the duplicate was ignored
- Deleting the active board switches to another existing board, and deleting the last board creates a fresh default board so the user is never left on a missing board
- The primary create action withstands 25 rapid repetitions through its normal control: the final object count is exact, controls stay responsive, and the burst produces no blank screen, uncaught error, or sustained freeze
- Importing malformed Workspace JSON, or parseable JSON that fails the field contract (wrong schemaVersion, missing boards or activeBoardId, invalid type or color enum, text/front/back over 8000 characters, width/height below create-contract minima, or unresolved connector endpoints), leaves boards and objects unchanged and shows validation naming the offending field
- With zero archive rows the Archive panel shows an explicit empty-state message explaining that deleted or archived objects appear there
- With an empty board and no prior mutations, Undo and Redo are both disabled and do not change the canvas
- Canceling Delete Selected or board delete leaves objects and boards intact
</edge_cases>

<visual_design>
Color tokens, applied as CSS custom properties consistently across the UI: primary accent #6D5BD0 for primary buttons, the active tool, focus rings, connector lines, and selection outlines; background #F4F2FB for the canvas, distinct from any note color; text primary #211D3A for ink; text secondary #6B6489 for muted ink such as the zoom readout and board-tab labels; warning #E0A030 for the delete-confirmation state.
Typography uses Inter, system-ui, -apple-system, Segoe UI, sans-serif for all UI chrome; note and flashcard body text uses a slightly larger, more relaxed size (about 16px) than the compact toolbar labels (about 14px).
Shape system on a 4px spacing unit: notes and flashcards use border-radius 8px with a visible drop shadow so they read as raised above the canvas; the toolbar and mini-map panel use border-radius 12px; primary buttons are #6D5BD0 with #FFFFFF text, border-radius 8px, and a subtle shadow.
Every toolbar control, board tab, and panel action pairs a consistent icon from one single icon set with its label; no control mixes icons from visibly different sets.
Object types are distinguishable at a glance beyond content: flashcards show a small flip icon and Front/Back side label, shapes have no text-editing chrome, and circles render as full circles.
A selected object (single or multi-select) shows an unmistakable accent outline treatment distinct from its unselected resting state, and a singly selected object additionally shows square corner handles.
The active tool (Connect mode) and the active board tab are visually highlighted in the accent color so the current mode and board are always clear.
Buttons, tool toggles, board tabs, and canvas objects show a visible hover state distinct from their resting state.
Empty states are explicit: a brand-new board shows a centered add-something hint, a search with no matches shows a no-results message, and an empty Archive shows an empty-state message.
The live-event status is rendered as a distinct colored badge per state so Active, Paused, Disconnected, Replaying, and Caught up are each visibly different.
Export workspace appears as a panel or modal with format tabs (Workspace JSON / Markdown outline / Plain text), a scrollable preview block, and Copy and Download affordances.
</visual_design>

<motion>
Interactive chrome shows a visible hover state on pointer-over: primary and secondary buttons, tool toggles, board tabs, and canvas objects each change appearance on hover, distinct from their resting and focus states.
Buttons give an immediate pressed response (a slight scale-down) on pointer-down, before the triggered action completes.
A newly placed object animates in with a brief scale-and-fade entrance, and a deleted or archived object animates out before disappearing rather than vanishing instantly.
Outline view rows animate smoothly to their new positions when objects are added, removed, or restacked rather than snapping.
Dragging an object shows a lift affordance and a dashed ghost outline at its origin while dragging, and pressing Escape mid-drag returns the object to its starting position.
In connect mode a dashed preview line follows the cursor from the first picked object until the second object is clicked.
Flipping a flashcard plays a visible flip transition between Front and Back rather than an instant swap, and the search glow is an animated-feeling outer glow around matching objects.
Modal dialogs (delete confirmation, Export workspace, Import, Command palette) and popovers (rename, shape menu) enter with a short fade-and-scale transition over a dimmed backdrop and exit the same way.
With prefers-reduced-motion set, entrance, flip, and list animations are removed and state changes apply instantly while every feature stays fully usable.
</motion>

<responsiveness>
At about 375px wide the toolbar stays reachable via wrapping or horizontal scroll, the mini-map and toolbar do not overlap canvas content, the canvas stays pannable, Export workspace, Import workspace, Archive, Undo, and Redo remain reachable, and no page-level horizontal scroll appears.
Between about 1440px and 375px wide no control disappears without a reachable replacement, and dialogs and popovers stay fully on-screen.
</responsiveness>

<accessibility>
Keyboard focus is visible as an accent outline on every non-canvas interactive control, and all toolbar, board, panel, dialog, export, import, archive, and command-palette controls are reachable and operable with the keyboard alone.
Modal dialogs and popovers trap focus while open, are dismissable with Escape, and return focus to the control that opened them.
Status changes (object added, deleted, archived, restored, board renamed, event applied, export copied) are announced in a polite live status line without moving focus.
Each singly selected object's on-screen Move and Grow / Shrink controls provide a full non-drag keyboard-operable alternative to dragging and corner-handle resizing.
Board rename, note/flashcard text, and Import fields have explicit labels or accessible names associated with their validation messages.
</accessibility>

<performance>
The app is interactive within 2 seconds of a local cold load.
No console errors or warnings appear during a full exercise of creating, editing, connecting, duplicating, archiving, deleting, undoing, switching boards and views, exporting, importing, and running the live event stream.
Canvas panning, zooming, and object dragging remain smooth without visible hitching on a board holding 30 or more objects.
Compiling Export workspace previews for a board with dozens of objects updates without freezing the UI for multiple seconds.
</performance>

<writing>
Headings, buttons, chips, and status copy use one consistent capitalization convention throughout the app.
Action labels are specific verbs — New Note, Export workspace, Import workspace, Duplicate Selected, Archive Selected, Restore, Purge, Copy, Download — rather than generic labels where a specific one is possible.
Empty states explain what belongs in the region and how to add it; error messages name the problem and the fix; no placeholder or lorem text appears anywhere in the shipped UI.
</writing>

<innovation>
Optional enhancements beyond the required specification (not required to pass): snap guides while dragging, a denser in-UI keyboard map, clearer archive review rhythms such as bulk restore, connector labels or style variants that still conform to the Workspace JSON field contract, or an optional hint of what changed since the last export — as long as they stay on-brand with the ScribbleSpace canvas and do not write boards to browser storage or replace the required Workspace JSON package.
</innovation>

<requirements>
Stack: Vue 3 with the Composition API and single-file components, Pinia stores holding the shared app state (boards, objects, connectors, archive, selection, canvas view, tool, search, undo/redo stacks, export artifact texts, and stream), and Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; this is a client-rendered Vite single-page app with no backend, no authentication, and only the "/" route.
Persistence: shared Pinia state is in-memory only for this good-app task — do not use localStorage, sessionStorage, IndexedDB, or other browser persistence APIs for boards or objects; a full page reload returns to the seeded baseline (one Board 1, zero objects, empty archive). The useful end-state survival path is Export workspace plus Import workspace and the WebMCP artifact surface, not browser storage.
The primary collection is the set of canvas objects on the active board, supporting create (New Note / New Flashcard / New Shape), edit (text, front/back, color), reposition/resize, reorder (Bring to Front / Send to Back), duplicate, connect, archive, restore, purge, and delete-to-archive through visible controls; boards are a second independent in-session collection supporting create, select, rename, and delete.
There are two distinct views over the same board state, a spatial Canvas and a linear Outline, plus a Connect interaction mode; both views derive from the same Pinia store and stay consistent with each other, and WebMCP tool handlers invoke the same store actions as the visible controls.
Component library: Reka UI provides the accessible primitives for the app chrome — toolbars and toggle groups, dialogs (delete confirmation, Export workspace, Import), popovers and menus (rename, shape menu), tabs, and the Command palette — styled with Tailwind to the palette above; do not hand-roll dialog, popover, or menu behavior.
Rich text: the note body and flashcard side editors are built on TipTap, with toolbar-driven bold, italic, and bullet-list formatting plus editor-scoped undo/redo, and the formatted content is stored with the object and rendered on the canvas and in the export texts.
Animation: Motion for Vue is the animation library for object entrance/exit, list, flip, and dialog transitions; no other animation libraries.
Icons: Phosphor icons via the Vue package only; no other icon libraries, no raw copy-pasted SVG icon sets.
Forms: every form, including the board rename form and Import workspace validation, validates through a Zod schema wired via VeeValidate, showing inline per-field errors that name the field before submit and disabling the confirm control while invalid. Schemas are API-shaped: they model the board rename payload, the note/flashcard/shape/connector create payloads, and the Workspace JSON package a real canvas-workspace API would accept — the record a create or Confirm produces IS that request body; Workspace JSON export and import use the same field names, enums, bounds, and cross-field rules.
Seed/empty rules: first load shows exactly one board named Board 1 with zero objects, the empty-canvas hint, and an empty Archive; do not pre-seed demo objects.
Validation rules: reject an empty or over-60-character board name with visible field feedback and keep the last valid name; reject note text or flashcard front/back over 8000 characters naming the field; enforce width/height minima from the create contracts; make a duplicate connector between the same two objects a no-op with a visible message; reject non-conforming Import payloads naming the offending field; keep the last valid state under invalid or extreme input.
The deterministic live-event stream is local (no network): 12 events with stable IDs and logical timestamps 1..12, each adding one note; duplicates are ignored, out-of-order delivery resolves in timestamp order on reconnect, and reconnect catches up without double-applying.
Observable field contracts the schema must enforce (judgeable without reading source):
- Board name from Feature: Boards
- Note, Flashcard, Shape, and Connector create/update contracts from Feature: Create objects and Feature: Transform and connect
- Workspace JSON schemaVersion, exportedAt, activeBoardId, boards, and nested object/connector records from Feature: Workspace artifacts
The useful end state is the ScribbleSpace package: Export workspace must produce Workspace JSON, Markdown outline, and Plain text that contain the session's actual boards, objects, connectors, colors, and text, with Copy and Download, and Workspace JSON must round-trip through Import while conforming to the declared field contracts; an export that omits session mutations is invalid.
Library allowlist: vue, pinia, tailwindcss and @tailwindcss/vite (Tailwind CSS 4.3.2), reka-ui, the TipTap Vue packages, Motion for Vue, @phosphor-icons/vue, vee-validate, and zod; no other UI, animation, or icon libraries. All libraries are installed via npm and bundled locally; no CDN imports.
Responsive: remain usable and free of page-level horizontal scroll down to about 375px wide.
Zero outbound navigation: all board switching and actions happen through in-page controls, never route changes or links to other origins.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Editor object types: note; flashcard; shape
- Editor operations: add; select; delete; update_property; set_content; switch_mode; preview
- Editor properties: color; text; front; back; z-order
- Editor modes: select; connect
- Entity: board
- Entity operations: create; select; update; delete
- Entity fields: name
- Session operations: start; pause; connect; disconnect; advance
- Demos: deliver-out-of-order; reconnect
- Artifact operations: export; import; copy
- Export formats: json; markdown; text
- Import modes: workspace-json

Mechanics exclusions:
- Canvas pan/zoom and object drag/resize stay Playwright-driven
- Connect click-sequence stays Playwright-driven
- Mini-map click and search pan stay Playwright-observed
- Live-tick timing stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
