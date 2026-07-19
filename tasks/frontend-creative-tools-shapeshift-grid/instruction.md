<summary>
Build a SHAPESHIFT QR color grid painter using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
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
Core features:
- Direct studio entry: first load shows the angle-bracket <SHAPESHIFT GRID TOOL> title, a typewriter-style intro line, a floating toolbar, and a blank paint canvas — no login, splash, or backend
- Cell-size range slider rebuilds the grid to the chosen cell size and resamples any existing painting into the new grid (art is preserved, not cleared); the slider locks and fades to a muted disabled look after the first paint, image upload, or camera capture, and Clear re-enables it
- Three brush modes selectable from the toolbar — QR Brush, Color Brush, and Eraser — plus a grid-overlay toggle whose button label flips between Grid On and Grid Off
- QR Brush stamps a fixed festival-QR mask into the cell and recolors it with the active swatch (white swatch → black QR on white, black swatch → white QR on black, any other color → that color QR on white); Color Brush fills the cell solid with the active swatch; Eraser clears the cell back to blank
- Seven-color palette swatches (white, black, red, yellow, green, blue, pink); selecting a swatch marks it active and tints both solid fills and QR stamps
- Pointer drag and touch drag paint across cells; a cell records to undo history only when its value actually changes; Undo steps back through recent changes and Clear empties the whole board
- Primary collection — saved boards (or board presets): seed at least 4 boards; each has name, thumbnail/snapshot of cells, and a tag; the collection supports create (Save board), edit (rename), and delete
- The Save board form has a name field (required) and a tag field; an empty or whitespace-only name shows an inline validation message naming the name field before submit, and the save control stays disabled until the name is valid
- At least two interaction modes: Paint mode (canvas + toolbar) and Gallery mode (browse/load saved boards)
- Domain behavior beyond CRUD: load a saved board's cells onto the canvas; favorite boards; filter gallery by tag; undo/clear on the active board
- Upload an image or capture from the front-facing camera, center-crop it square, and pixelize it onto the grid (which locks the slider); the camera opens an overlay with Capture and Cancel
- Download or Share a PNG of the canvas that appends a black footer band reading "/MADE WITH SHAPESHIFT GRID TOOL" (left) and "<SHAPESHIFTFESTIVAL.COM>" (right); Share uses the Web Share API on mobile and otherwise downloads the file
- Keyboard shortcuts: Q / B / E for brush modes, G for grid overlay, Backspace for undo, and keys 1–7 to select palette colors
</core_features>

<user_flows>
- Save flow: paint several cells, open Save board, and submit a valid name and tag — the gallery collection count increases by exactly one, the new board card appears in Gallery mode with a thumbnail matching the painted cells and its tag, and switching between Paint and Gallery modes shows the same new board without a reload
- Load flow: from Gallery mode, load a saved board — its cells appear on the paint canvas immediately, the app switches to Paint mode showing the loaded art, painting a further cell changes only that cell, and pressing Undo reverts exactly that one change while the rest of the loaded board stays intact
- Rename and delete flow: renaming a board updates that same card's name in Gallery without changing the collection count; deleting a board removes its card, decreases the count by exactly one, and clears it from any current selection; the deleted board no longer appears under any tag filter
- Favorite and filter flow: marking a board as favorite updates its indicator on the card immediately; choosing a tag filter recomputes the visible gallery to only boards with that tag, and clearing the filter restores the full collection with the favorite state preserved
- Reload baseline: a page reload returns the app to its seeded state — the blank canvas, the unlocked cell-size slider, and exactly the seeded boards in Gallery; boards saved before the reload are gone
</user_flows>

<edge_cases>
- Invalid create: submitting the Save board form with an empty name must not add a board — the gallery count stays the same and the inline validation message names the name field
- After deleting all boards, Gallery mode shows an empty state with a message explaining the gallery is empty and how to save a board
- A tag filter that matches no boards shows the empty state rather than a blank region, and clearing the filter restores the list
- Pressing Undo with no history is a safe no-op: the canvas does not change and no error appears
- Cancel in the camera overlay closes it without altering the canvas or locking the slider
- Dragging a paint stroke back and forth over the same cell with the same brush and color records the cell to undo history only once, so one Undo reverts it
- Resizing the cell slider before any paint keeps the board blank; resizing after painting resamples the art into the new grid rather than clearing it
</edge_cases>

<visual_design>
- Light paper stage with high-contrast ink and soft radial washes; condensed UI type
- Angle-bracket display title for SHAPESHIFT Grid Tool and typewriter-style intro line
- Floating black draggable toolbar with cell slider, mode buttons, seven square swatches, and action buttons
- Gallery mode: dense board cards/rows with names and tags; empty state when none remain
- Large centered canvas stage under the toolbar; desktop-first creative tool composition, not a dashboard
- On the canvas: QR cells render as a scannable festival QR mask, Color cells render as flat color fills, and the grid overlay (when on) draws light hairlines between cells
- Icons in the toolbar and gallery come from one consistent icon set used across the whole app
</visual_design>

<motion>
- Desktop toolbar drag: grab the tools header to reposition the floating panel
- Hover animations (required): primary action buttons fill/ease on hover; mode buttons and swatches show active fill/opacity/border changes; gallery board rows take a hover wash
- Cell-size control fades toward muted disabled look when locked; restores on Clear
- Mode switch between Paint and Gallery updates without full reload; loading a board updates the canvas immediately
- Camera capture overlay fades in/out; painting updates cells immediately
- Saving a board animates its new card into the gallery; deleting a board animates its card out rather than snapping
- Validation and save feedback appears with a brief eased transition rather than popping in instantly
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At 375 pixel width the canvas and toolbar reflow to fit with no horizontal scrolling and no clipped controls; painting by touch drag works on the mobile layout
- At desktop widths the toolbar floats over the stage and is draggable; at small widths it may dock, but all brush modes, swatches, and actions stay reachable
- Gallery cards reflow from a dense multi-column desktop arrangement to a single column at narrow widths without losing names, tags, or actions
</responsiveness>

<accessibility>
- Every toolbar control, swatch, and gallery action is reachable and operable with the keyboard alone, with a visible focus indicator
- The camera overlay behaves as a modal dialog: focus moves into it when opened, stays trapped while open, and returns to the triggering control on close
- Palette swatches expose accessible names for their colors rather than being unlabeled colored squares
- The inline save-validation message is announced to assistive technology as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of painting, saving, loading, filtering, and mode switching
- Continuous drag-painting across many cells stays smooth with no visible lag between pointer movement and cells filling
</performance>

<requirements>
Shared application state must use Solid stores, the state library named in summary (in-memory only): board cells, undo history, brush mode, active palette color, saved boards collection, favorites, tag filter, and active mode. Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
State contracts (behavioral, not storage keys):
- Creating/saving a valid board increases the gallery collection
- Editing a board name updates that same record in Gallery
- Deleting a board removes it from Gallery and selection
- Loading a board writes its cells into the shared paint board state
- Favorites/tag filters recompute the visible gallery from the shared collection; they do not create a second disconnected copy
Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2 (pinned), and Kobalte as the single component library (Vite or equivalent); frontend-only. Kobalte provides the UI chrome: the camera and rename dialogs, the cell-size slider, selects/toggles, and any tooltips or toasts. No other component UI libraries.
- Motion (the vanilla motion.dev package) is the only allowed animation library; no other animation libraries
- Tabler icons via the @tabler/icons-solidjs package only; no other icon sets, no raw copy-pasted SVGs, no icon fonts or CDNs
- All forms (Save board, rename) are driven by TanStack Form for Solid paired with a Zod schema: the schema defines the validation rules and the form shows inline per-field errors before submit, with submit disabled until valid
- Ship QRious locally under vendor/ (or equivalent) for client-side QR mask generation; QR Brush stamps a locally generated QR mask encoding the fixed festival URL (SHAPESHIFTFESTIVAL.COM) with no network calls
- Seed at least 4 saved boards so Gallery is non-empty on first load
- Resizing the cell slider resamples existing cells into the new grid rather than clearing them; Clear resets the board to blank and re-enables the slider
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- Product naming: SHAPESHIFT Grid Tool; serve over local HTTP for verification
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
