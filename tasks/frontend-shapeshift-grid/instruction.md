<summary>
Build a SHAPESHIFT QR color grid painter using Solid.js, Solid stores, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct studio entry with angle-bracket title, typewriter-style intro, floating toolbar, and paint canvas — no login or backend
- Cell-size range control that rebuilds the grid and locks after the first paint or image import; Clear re-enables it
- Brush modes: QR Brush, Color Brush, and Eraser, plus a grid overlay toggle
- Seven-color palette swatches that tint solid fills and QR cells
- Pointer and touch painting on a structured cell board with undo history and clear
- Primary collection — saved boards (or board presets): seed at least 4 boards; each has name, thumbnail/snapshot of cells, and a tag; the collection supports create (Save board), edit (rename), and delete
- At least two interaction modes: Paint mode (canvas + toolbar) and Gallery mode (browse/load saved boards)
- Domain behavior beyond CRUD: load a board onto the canvas; favorite boards; filter gallery by tag; empty gallery state; undo/clear on the active board
- Upload or camera-capture an image and pixelize it onto the grid; Download/Share PNG with branded footer
- Invalid create: empty board name must not add a board; show visible validation feedback
- Keyboard shortcuts: Q / B / E for modes, G for grid, Backspace for undo, keys 1–7 for palette
</core_features>

<visual_design>
- Light paper stage with high-contrast ink and soft radial washes; condensed UI type
- Angle-bracket display title for SHAPESHIFT Grid Tool and typewriter-style intro line
- Floating black draggable toolbar with cell slider, mode buttons, seven square swatches, and action buttons
- Gallery mode: dense board cards/rows with names and tags; empty state when none remain
- Large centered canvas stage under the toolbar; desktop-first creative tool composition, not a dashboard
</visual_design>

<motion>
- Desktop toolbar drag: grab the tools header to reposition the floating panel
- Hover animations (required): primary action buttons fill/ease on hover; mode buttons and swatches show active fill/opacity/border changes; gallery board rows take a hover wash
- Cell-size control fades toward muted disabled look when locked; restores on Clear
- Mode switch between Paint and Gallery updates without full reload; loading a board updates the canvas immediately
- Camera capture overlay fades in/out; painting updates cells immediately
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): board cells, undo history, brush mode, palette, saved boards collection, active mode, and filters. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating/saving a valid board increases the gallery collection
- Editing a board name updates that same record in Gallery
- Deleting a board removes it from Gallery and selection
- Loading a board writes its cells into the shared paint board state
- Favorites/tag filters recompute the visible gallery from the shared collection
Stack: Solid.js + Solid stores + Tailwind CSS (Vite or equivalent); frontend-only. Ship QRious locally under vendor/ (or equivalent). No external component UI libraries.
- Seed at least 4 saved boards so Gallery is non-empty on first load
- Empty required name on save/create must not increase the boards count; show visible validation feedback
- After deleting all boards, show an empty state in Gallery
- Ship QRious (or equivalent) locally for client-side QR mask generation
- Product naming: SHAPESHIFT Grid Tool; serve over local HTTP for verification
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
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
- Editor object types: grid-cell
- Editor properties: color
- Editor modes: paint; erase
- Editor operations: select; update_property; switch_mode; preview
- Session operations: start; stop; restart; trigger_demo
- Demos: fill-demo

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
