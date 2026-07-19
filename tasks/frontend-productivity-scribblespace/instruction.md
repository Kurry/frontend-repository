<summary>
Build a ScribbleSpace freeform notes canvas using Vue 3, Pinia stores for shared state, Tailwind CSS 4.3.2, and Reka UI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots: overview.png is a full-page desktop-layout overview (downscaled); segment-NN.png are full-resolution 1440x900 sections in top-to-bottom order with slight overlap. They are part of this instruction: recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
On load with empty storage the app opens directly at the canvas (no login) showing one default board named Board 1, an empty canvas with a centered hint reading "This board is empty" / "Add a note, flashcard or shape to get started", and a footer object count of "0 objects".
The infinite canvas pans by click-and-dragging empty canvas space; a dotted-grid backdrop shifts with the pan so movement is visible.
A Zoom Out / zoom-percentage readout / Zoom In / Reset View control group changes zoom in 15 percent steps clamped between 25 percent and 300 percent; the current zoom percentage is always displayed and Reset View returns it to 100 percent and recenters the view.
Clicking New Note places a draggable sticky note near the canvas center with an editable multi-line text body; when the note is the sole selection a color picker of exactly 6 swatches (butter yellow, peach, rose, mint, sky blue, lilac) appears and clicking a swatch recolors the note immediately with a check mark marking the active swatch.
A note's body is edited by double-clicking it (or selecting it and pressing Enter) to reveal an inline text editor; typing updates the note live, and Escape or clicking outside the editor commits the text.
While editing a note body or a flashcard side, a compact formatting toolbar offers bold, italic, and bullet-list controls; selecting text and activating the bold control renders that text bold immediately, activating it again removes the bold, and committed formatting is preserved on the rendered object.
While a text editor is open, an undo step reverses the most recent typing or formatting change and a redo step reapplies it, without affecting any other object.
Clicking New Flashcard places a two-sided card with a "Front" side shown by default, a small flip icon and side label, and a Flip control; Flip toggles the visible side between Front and Back, and each side has its own editable text.
Clicking New Shape opens a menu offering Rectangle, Circle, and Arrow; choosing one places that shape, and when a single shape is selected a 6-swatch shape color picker (violet, amber, green, coral, blue, slate) recolors it immediately.
Every object can be repositioned by dragging it and resized by dragging any of its four corner handles (shown when singly selected); notes and flashcards keep a minimum size and shapes resize from the dragged corner. Positions and sizes persist.
Each singly selected object also exposes on-screen Move (left/up/down/right) and Grow / Shrink controls that nudge position by 24px and size by 24px as a non-drag alternative.
A Connect tool switches the canvas into connect mode (crosshair cursor, a helper banner reading "Click an object to start a connector"); clicking one object then another draws a persistent accent-colored line joining them, and a dashed preview line follows the cursor between the two clicks.
A connector's endpoints follow their objects live as either is moved; every connector shows a round Remove Connector button at its midpoint that deletes only that connector, leaving both objects.
Clicking an object selects it and shows an unmistakable outline; shift-clicking adds or removes objects from a multi-selection, and a "N selected" count with Delete Selected and Clear selection controls appears while any selection exists.
Delete Selected opens a single confirmation dialog; confirming removes every selected object and every connector touching them, while canceling leaves them intact.
A singly selected object exposes Bring to Front and Send to Back controls that change its stacking order so it renders above or below overlapping objects.
A boards switcher lists board tabs with the active tab highlighted; New Board creates another independent, separately persisted board (named Board N) and switches to it, and each active board tab has a rename control and a delete control.
The board rename control is a small form: while the entered name is empty or longer than 60 characters an inline error message naming the board-name field is shown, the confirm control is disabled, and the previous valid name stays in place until a valid name is submitted.
Deleting a board opens a confirmation dialog; confirming removes the board and canceling leaves it intact.
A mini-map panel in the canvas corner shows a scaled overview of all objects on the current board plus a rectangle marking the current viewport; clicking within the mini-map recenters the main view on that point.
A search input highlights every note or flashcard whose text (note body, or flashcard front or back) contains the query with a glowing outline, shows a match count, and pans the view to the first match; a query matching nothing shows an explicit no-results message reading No results for the query.
An Export as Text control opens a modal with a read-only, copyable textarea listing the board name, object count, and every object numbered with its type label (Note, Flashcard, or Shape) including note body text and flashcard front/back and showing side, plus a connectors listing; a Copy text control copies it.
A second view mode toggles between the canvas and an Outline view listing every object on the active board as rows with type label, color name, flashcard flip state, and inline Edit / Flip / Delete controls; both views read and write the same board state.
A Show live events panel exposes a deterministic local event stream with Start, Pause, Disconnect, Reconnect, and Deliver Out of Order controls and a visible status (Idle, Active, Paused, Disconnected, Replaying, or Caught up) plus an "N of 12 events applied" readout; the stream applies 12 events that each add one note.
Each live event carries a stable ID and a logical timestamp; duplicate delivery of an event is ignored, out-of-order delivery is received but not applied until Reconnect, Reconnect applies every still-missing event exactly once in logical-timestamp order, and a repeated Reconnect applies nothing new so no update is double-applied.
</core_features>

<user_flows>
After creating a note through New Note, the footer object count increases by exactly one, the empty-canvas hint disappears, and switching to the Outline view shows the same note as a row with its color name without a reload; after a full page reload the note is still present at the same position with the same text and color.
Creating a second board through New Board switches to an empty canvas showing the empty hint and a "0 objects" count while the first board keeps every one of its objects; renaming the new board updates its tab label immediately and the Export as Text modal shows the new name; after a full page reload both boards, their names, and the active board selection are restored.
Connecting two notes and then deleting one of them through Delete Selected removes that note, every connector touching it, and its Outline row in the same confirmed action, and the footer object count decreases by exactly one; after a full page reload neither the deleted note nor its connector reappears.
Starting the live event stream raises the applied-events readout and the footer object count together, one note per applied event, and each added note also appears as a row in the Outline view; pausing halts both counts at the same value, and after a full page reload every applied note is still present exactly once.
In one uninterrupted session the user can create, edit, recolor, reorder, connect, and delete objects, switch between the canvas and outline views, and every committed change is restored exactly after a full page reload with no deleted object revived.
</user_flows>

<edge_cases>
New objects placed at an already-occupied default position are offset by 28px so they stay individually selectable rather than perfectly stacked.
An empty or over-60-character board name is rejected with a visible inline message naming the board-name field, and the last valid name is kept undamaged.
Requesting a duplicate connector between the same two objects is idempotent: no second line is drawn, no duplicate is stacked, and a visible message explains the duplicate was ignored.
Deleting the active board switches to another existing board, and deleting the last board creates a fresh default board so the user is never left on a missing board.
The primary create action withstands 25 rapid repetitions through its normal control: the final object count is exact, controls stay responsive, and the burst produces no blank screen, uncaught error, or sustained freeze.
</edge_cases>

<visual_design>
Color tokens, applied as CSS custom properties consistently across the UI: primary accent #6D5BD0 for primary buttons, the active tool, focus rings, connector lines, and selection outlines; background #F4F2FB for the canvas, distinct from any note color; text primary #211D3A for ink; text secondary #6B6489 for muted ink such as the zoom readout and board-tab labels; warning #E0A030 for the delete-confirmation state.
Typography uses "Inter", system-ui, -apple-system, "Segoe UI", sans-serif for all UI chrome; note and flashcard body text uses a slightly larger, more relaxed size (about 16px) than the compact toolbar labels (about 14px).
Shape system on a 4px spacing unit: notes and flashcards use border-radius 8px with a visible drop shadow so they read as raised above the canvas; the toolbar and mini-map panel use border-radius 12px; primary buttons are #6D5BD0 with #FFFFFF text, border-radius 8px, and a subtle shadow.
Every toolbar control, board tab, and panel action pairs a consistent icon from one single icon set with its label; no control mixes icons from visibly different sets.
Object types are distinguishable at a glance beyond content: flashcards show a small flip icon and Front/Back side label, shapes have no text-editing chrome, and circles render as full circles.
A selected object (single or multi-select) shows an unmistakable accent outline treatment distinct from its unselected resting state, and a singly selected object additionally shows square corner handles.
The active tool (Connect mode) and the active board tab are visually highlighted in the accent color so the current mode and board are always clear.
Buttons, tool toggles, board tabs, and canvas objects show a visible hover state distinct from their resting state.
Empty states are explicit: a brand-new board shows a centered add-something hint, and a search with no matches shows a no-results message.
The live-event status is rendered as a distinct colored badge per state so Active, Paused, Disconnected, Replaying, and Caught up are each visibly different.
</visual_design>

<motion>
Interactive chrome shows a visible hover state on pointer-over: primary and secondary buttons, tool toggles, board tabs, and canvas objects each change appearance on hover, distinct from their resting and focus states.
Buttons give an immediate pressed response (a slight scale-down) on pointer-down, before the triggered action completes.
A newly placed object animates in with a brief scale-and-fade entrance, and a deleted object animates out before disappearing rather than vanishing instantly.
Outline view rows animate smoothly to their new positions when objects are added, removed, or restacked rather than snapping.
Dragging an object shows a lift affordance and a dashed ghost outline at its origin while dragging, and pressing Escape mid-drag returns the object to its starting position.
In connect mode a dashed preview line follows the cursor from the first picked object until the second object is clicked.
Flipping a flashcard plays a visible flip transition between Front and Back rather than an instant swap, and the search glow is an animated-feeling outer glow around matching objects.
Modal dialogs (delete confirmation, export) and popovers (rename, shape menu) enter with a short fade-and-scale transition over a dimmed backdrop and exit the same way.
With prefers-reduced-motion set, entrance, flip, and list animations are removed and state changes apply instantly while every feature stays fully usable.
</motion>

<responsiveness>
At about 375px wide the toolbar stays reachable via wrapping or horizontal scroll, the mini-map and toolbar do not overlap canvas content, the canvas stays pannable, and no page-level horizontal scroll appears.
Between about 1440px and 375px wide no control disappears without a reachable replacement, and dialogs and popovers stay fully on-screen.
</responsiveness>

<accessibility>
Keyboard focus is visible as an accent outline on every non-canvas interactive control, and all toolbar, board, panel, and dialog controls are reachable and operable with the keyboard alone.
Modal dialogs and popovers trap focus while open, are dismissable with Escape, and return focus to the control that opened them.
Status changes (object added, deleted, board renamed, event applied) are announced in a polite live status line without moving focus.
Each singly selected object's on-screen Move and Grow / Shrink controls provide a full non-drag keyboard-operable alternative to dragging and corner-handle resizing.
</accessibility>

<performance>
The app is interactive within 2 seconds of a local cold load.
No console errors or warnings appear during a full exercise of creating, editing, connecting, deleting, switching boards and views, and running the live event stream.
Canvas panning, zooming, and object dragging remain smooth without visible hitching on a board holding 30 or more objects.
</performance>

<requirements>
Stack: Vue 3 with the Composition API and single-file components, Pinia stores holding the shared app state (boards, objects, connectors, selection, canvas view, tool, search, and stream), and Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; this is a client-rendered Vite single-page app with no backend, no authentication, and only the "/" route.
Persistence: mirror the shared Pinia state to localStorage under the key scribblespace_state on every change and rehydrate from it on load, guarding access so the production build never crashes when storage is unavailable; a full page reload restores the exact prior state — every board, every object with its position, size, text, formatting, colors, and flashcard flip state, and every connector — and never revives a deleted object or board.
The primary collection is the set of canvas objects on the active board, supporting create (New Note / New Flashcard / New Shape), edit (text, front/back, color), reposition/resize, reorder (Bring to Front / Send to Back), connect, and delete through visible controls; boards are a second independently persisted collection supporting create, select, rename, and delete.
There are two distinct views over the same board state, a spatial Canvas and a linear Outline, plus a Connect interaction mode; both views derive from the same Pinia store and stay consistent with each other, and WebMCP tool handlers invoke the same store actions as the visible controls.
Component library: Reka UI provides the accessible primitives for the app chrome — toolbars and toggle groups, dialogs (delete confirmation, export), popovers and menus (rename, shape menu), and tabs — styled with Tailwind to the palette above; do not hand-roll dialog, popover, or menu behavior.
Rich text: the note body and flashcard side editors are built on TipTap, with toolbar-driven bold, italic, and bullet-list formatting plus undo/redo, and the formatted content is stored with the object and rendered on the canvas and in the export text.
Animation: Motion for Vue is the animation library for object entrance/exit, list, flip, and dialog transitions; no other animation libraries.
Icons: Phosphor icons via the Vue package only; no other icon libraries, no raw copy-pasted SVG icon sets.
Forms: every form, including the board rename form, validates through a Zod schema wired via VeeValidate, showing inline per-field errors that name the field before submit and disabling the confirm control while invalid.
Seed/empty rules: first load with empty storage shows exactly one board named Board 1 with zero objects and the empty-canvas hint; do not pre-seed demo objects.
Validation rules: reject an empty or over-60-character board name with visible field feedback and keep the last valid name; make a duplicate connector between the same two objects a no-op with a visible message; keep the last valid state under invalid or extreme input.
The deterministic live-event stream is local (no network): 12 events with stable IDs and logical timestamps 1..12, each adding one note; duplicates are ignored, out-of-order delivery resolves in timestamp order on reconnect, and reconnect catches up without double-applying.
Library allowlist: vue, pinia, tailwindcss and @tailwindcss/vite (Tailwind CSS 4.3.2), reka-ui, the TipTap Vue packages, Motion for Vue, @phosphor-icons/vue, vee-validate, and zod; no other UI, animation, or icon libraries. All libraries are installed via npm and bundled locally; no CDN imports.
Responsive: remain usable and free of page-level horizontal scroll down to about 375px wide.
Zero outbound navigation: all board switching and actions happen through in-page controls, never route changes or links to other origins.
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
