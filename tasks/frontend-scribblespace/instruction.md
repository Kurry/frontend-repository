<summary>
Build a ScribbleSpace freeform notes canvas using React 19 with functional components, Redux Toolkit slices for shared state, and Tailwind CSS.
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
On load with empty storage the app opens directly at the canvas (no login) showing one default board named Board 1, an empty canvas with a centered hint reading "This board is empty" / "Add a note, flashcard or shape to get started", and a footer object count of "0 objects".
The infinite canvas pans by click-and-dragging empty canvas space; a dotted-grid backdrop shifts with the pan so movement is visible.
A Zoom Out / zoom-percentage readout / Zoom In / Reset View control group changes zoom in 15 percent steps clamped between 25 percent and 300 percent; the current zoom percentage is always displayed and Reset View returns it to 100 percent and recenters the view.
Clicking New Note places a draggable sticky note near the canvas center with an editable multi-line text body; when the note is the sole selection a color picker of exactly 6 swatches (butter yellow, peach, rose, mint, sky blue, lilac) appears and clicking a swatch recolors the note immediately with a check mark marking the active swatch.
A note's body is edited by double-clicking it (or selecting it and pressing Enter) to reveal a textarea; typing updates the note live, and Escape or Enter commits the text.
Clicking New Flashcard places a two-sided card with a "Front" side shown by default, a small flip icon and side label, and a Flip control; Flip toggles the visible side between Front and Back, and each side has its own editable text.
Clicking New Shape opens a menu offering Rectangle, Circle, and Arrow; choosing one places that shape, and when a single shape is selected a 6-swatch shape color picker (violet, amber, green, coral, blue, slate) recolors it immediately.
Every object can be repositioned by dragging it and resized by dragging any of its four corner handles (shown when singly selected); notes and flashcards keep a minimum size and shapes resize from the dragged corner. Positions and sizes persist.
Each singly selected object also exposes on-screen Move (left/up/down/right) and Grow / Shrink controls that nudge position by 24px and size by 24px as a non-drag alternative.
A Connect tool switches the canvas into connect mode (crosshair cursor, a helper banner reading "Click an object to start a connector"); clicking one object then another draws a persistent accent-colored line joining them, and a dashed preview line follows the cursor between the two clicks.
A connector's endpoints follow their objects live as either is moved; every connector shows a round Remove Connector button at its midpoint that deletes only that connector, leaving both objects.
Clicking an object selects it and shows an unmistakable outline; shift-clicking adds or removes objects from a multi-selection, and a "N selected" count with Delete Selected and Clear selection controls appears while any selection exists.
Delete Selected opens a single confirmation dialog; confirming removes every selected object and every connector touching them, while canceling leaves them intact.
A singly selected object exposes Bring to Front and Send to Back controls that change its stacking order so it renders above or below overlapping objects.
A boards switcher lists board tabs with the active tab highlighted; New Board creates another independent, separately persisted board (named Board N) and switches to it, each active board tab has a rename control (validated non-empty, 60 characters or fewer) and a delete control.
Deleting a board opens a confirmation; deleting the active board switches to another existing board, and deleting the last board creates a fresh default board so the user is never left on a missing board.
A mini-map panel in the canvas corner shows a scaled overview of all objects on the current board plus a rectangle marking the current viewport; clicking within the mini-map recenters the main view on that point.
A search input highlights every note or flashcard whose text (note body, or flashcard front or back) contains the query with a glowing outline, shows a match count, and pans the view to the first match; a query matching nothing shows an explicit no-results message reading No results for the query.
An Export as Text control opens a modal with a read-only, copyable textarea listing the board name, object count, and every object numbered with its type label (Note, Flashcard, or Shape) including note body text and flashcard front/back and showing side, plus a connectors listing; a Copy text control copies it.
A second view mode toggles between the canvas and an Outline view listing every object on the active board as rows with type label, color name, flashcard flip state, and inline Edit / Flip / Delete controls; both views read and write the same board state.
New objects placed at an already-occupied default position are offset by 28px so they stay individually selectable rather than perfectly stacked.
In one uninterrupted session the user can create, edit, recolor, reorder, connect, and delete objects, switch between the canvas and outline views, and every committed change is restored exactly after a full page reload with no deleted object revived.
The primary create action withstands 25 rapid repetitions through its normal control: the final object count is exact, controls stay responsive, and the burst produces no blank screen, uncaught error, or sustained freeze.
Adversarial input is handled with specific visible feedback: an empty or over-long board name is rejected without damaging the last valid name, and duplicate connector requests between the same two objects are idempotent rather than stacking duplicate lines.
A Show live events panel exposes a deterministic local event stream with Start, Pause, Disconnect, Reconnect, and Deliver Out of Order controls and a visible status (Idle, Active, Paused, Disconnected, Replaying, or Caught up) plus an "N of 12 events applied" readout; the stream applies 12 events that each add one note.
Each live event carries a stable ID and a logical timestamp; duplicate delivery of an event is ignored, out-of-order delivery is received but not applied until Reconnect, Reconnect applies every still-missing event exactly once in logical-timestamp order, and a repeated Reconnect applies nothing new so no update is double-applied.
</core_features>

<visual_design>
Color tokens, applied as CSS custom properties consistently across the UI: primary accent #6D5BD0 for primary buttons, the active tool, focus rings, connector lines, and selection outlines; background #F4F2FB for the canvas, distinct from any note color; text primary #211D3A for ink; text secondary #6B6489 for muted ink such as the zoom readout and board-tab labels; warning #E0A030 for the delete-confirmation state.
Typography uses "Inter", system-ui, -apple-system, "Segoe UI", sans-serif for all UI chrome; note and flashcard body text uses a slightly larger, more relaxed size (about 16px) than the compact toolbar labels (about 14px).
Shape system on a 4px spacing unit: notes and flashcards use border-radius 8px with a visible drop shadow so they read as raised above the canvas; the toolbar and mini-map panel use border-radius 12px; primary buttons are #6D5BD0 with #FFFFFF text, border-radius 8px, and a subtle shadow.
Object types are distinguishable at a glance beyond content: flashcards show a small flip icon and Front/Back side label, shapes have no text-editing chrome, and circles render as full circles.
A selected object (single or multi-select) shows an unmistakable accent outline treatment distinct from its unselected resting state, and a singly selected object additionally shows square corner handles.
The active tool (Connect mode) and the active board tab are visually highlighted in the accent color so the current mode and board are always clear.
Buttons, tool toggles, board tabs, and canvas objects show a visible hover state, and keyboard focus is visible as an accent outline on every non-canvas interactive control.
Empty states are explicit: a brand-new board shows a centered add-something hint, and a search with no matches shows a no-results message.
At about 375px wide the toolbar stays reachable via wrapping or horizontal scroll, the mini-map and toolbar do not overlap canvas content, the canvas stays pannable, and no page-level horizontal scroll appears.
The live-event status is rendered as a distinct colored badge per state so Active, Paused, Disconnected, Replaying, and Caught up are each visibly different.
</visual_design>

<motion>
Interactive chrome shows a visible hover state on pointer-over: primary and secondary buttons, tool toggles, board tabs, and canvas objects each change appearance on hover, distinct from their resting and focus states.
Buttons give an immediate pressed response (a slight scale-down) on pointer-down, before the triggered action completes.
Dragging an object shows a lift affordance and a dashed ghost outline at its origin while dragging, and pressing Escape mid-drag returns the object to its starting position.
In connect mode a dashed preview line follows the cursor from the first picked object until the second object is clicked.
Flipping a flashcard swaps its visible side, and the search glow is an animated-feeling outer glow around matching objects.
Modal dialogs (delete confirmation, export) and popovers (rename, shape menu) appear over a dimmed backdrop and trap focus, dismissable with Escape.
Status changes (object added, deleted, board renamed, event applied) are announced in a live status line without moving focus.
</motion>

<requirements>
Stack: React 19 with functional components, Redux Toolkit slices holding the shared app state (boards, objects, connectors, selection, canvas view, tool, search, and stream), and Tailwind CSS; this is a client-rendered Vite single-page app with no backend, no authentication, and only the "/" route.
Persistence: mirror the shared Redux state to localStorage under the key scribblespace_state on every change and rehydrate from it on load, guarding access so the production build never crashes when storage is unavailable; a full page reload restores the exact prior state — every board, every object with its position, size, text, colors, and flashcard flip state, and every connector — and never revives a deleted object or board.
The primary collection is the set of canvas objects on the active board, supporting create (New Note / New Flashcard / New Shape), edit (text, front/back, color), reposition/resize, reorder (Bring to Front / Send to Back), connect, and delete through visible controls; boards are a second independently persisted collection supporting create, select, rename, and delete.
There are two distinct views over the same board state, a spatial Canvas and a linear Outline, plus a Connect interaction mode; both views stay consistent with each other.
Seed/empty rules: first load with empty storage shows exactly one board named Board 1 with zero objects and the empty-canvas hint; do not pre-seed demo objects.
Validation rules: reject an empty or over-60-character board name with visible field feedback and keep the last valid name; make a duplicate connector between the same two objects a no-op with a visible message; keep the last valid state under invalid or extreme input.
The deterministic live-event stream is local (no network): 12 events with stable IDs and logical timestamps 1..12, each adding one note; duplicates are ignored, out-of-order delivery resolves in timestamp order on reconnect, and reconnect catches up without double-applying.
Library allowlist: use only @reduxjs/toolkit, react, react-dom, react-redux, tailwindcss, and @tailwindcss/vite; do not add component libraries — hand-rolled styling is expected.
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

Bindings:
- Editor object types: note; flashcard; shape
- Editor operations: add; select; delete; update_property; set_content; switch_mode; preview
- Editor properties: color; text; front; back; z-order
- Editor modes: select; connect
- Entity: board
- Entity operations: create; select; update; delete
- Session operations: start; pause; connect; disconnect; advance
- Demos: deliver-out-of-order; reconnect

Mechanics exclusions:
- Canvas pan/zoom and object drag/resize stay Playwright-driven
- Connect click-sequence stays Playwright-driven
- Mini-map click and search pan stay Playwright-observed
- Live-tick timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
