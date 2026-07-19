<summary>
Build a QR color grid paint studio using Svelte, Svelte stores, and Tailwind CSS.
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
- The studio opens directly on the paint stage — an angle-bracket display title reading <GRID PAINT STUDIO>, a typewriter intro that types out an angle-bracketed tagline (e.g. <YOU ARE THE ALGORITHM>), a floating dark toolbar, and a large centered canvas — with no login, splash screen, or backend request
- A Cell range control (default 40, spanning roughly 16–64 on desktop; a narrower ~36–48 band on narrow/touch viewports) rebuilds the square grid whenever it moves: the board re-tiles to floor(1024 / cell) columns and rows over a fixed 1024px base, and any existing art is resampled into the new cell count rather than cleared
- Painting the first cell — or importing an image — locks the Cell control into a visibly muted/disabled state so the grid resolution cannot change mid-artwork; Clear empties the board and re-enables the control
- Four toolbar toggles set the active tool: QR Brush (active on load), Color Brush, and Eraser, plus a grid-overlay button whose label flips between Grid On and Grid Off as the hairline cell grid shows or hides
- With QR Brush active, painting a cell fills it with a QR-glyph mask (encoding a fixed studio string such as GRIDPAINT.STUDIO); the mask recolors with the active swatch — a white swatch yields a black glyph on white, a black swatch yields a white glyph on black, and any colored swatch yields that color's glyph on a white ground
- Color Brush fills whole cells with the active swatch; Eraser returns cells to blank; the active tool alone determines what a pointer stroke writes into each cell
- Exactly seven square palette swatches select the active color — black (active by default), white, red, yellow, green, blue, and pink — and the choice tints both solid fills and QR cells
- Pointer press-drag and touch drag paint across every cell the stroke crosses in one continuous gesture; each completed stroke pushes exactly one undo step, Undo (and Backspace) reverts the most recent stroke, and undo history retains up to ~100 steps
- Upload opens a file picker and pixelizes the chosen image onto the grid — one averaged color per grid cell, scaled to cover and centered — and locks the Cell control
- Camera opens an in-toolbar overlay showing the live front-facing camera feed; Capture center-crops a square frame and pixelizes it onto the grid, Cancel closes the overlay without painting, and the overlay fades in and out
- Download exports a PNG (grid_paint.png) of the board with the grid overlay omitted and a black footer strip added, captioned /MADE WITH GRID PAINT STUDIO on the left and <GRIDPAINT.STUDIO> on the right; Share hands that same PNG to the native share sheet on a mobile device and otherwise falls back to Download
- On desktop the floating toolbar is draggable by its /GRID PAINT TOOLS header and stays clamped within the stage section; the current tool, palette, grid state, and painted board all survive the drag
- Keyboard shortcuts drive the tools: Q / B / E switch to QR / Color / Eraser, G toggles the grid overlay, Backspace undoes, and number keys 1–7 pick the matching palette swatch
- Primary collection — saved boards: seed at least 4 boards, each with a name, a cell-snapshot thumbnail, and a tag; a Gallery mode lists them and supports Save board (create), rename (edit), and delete
- Loading a saved board from Gallery writes its cells back onto the paint canvas and returns to Paint mode; favoriting a board and filtering the gallery by tag each recompute the visible list from the shared collection
- Saving a board with an empty name adds nothing to the gallery and surfaces visible validation feedback; deleting every board shows an empty-gallery state in the list region
</core_features>

<visual_design>
- Saturated blue page field framing a light/white paint stage with high-contrast ink and condensed UI type
- Angle-bracket display title reading <GRID PAINT STUDIO> and a typewriter-style angle-bracketed intro line above the stage
- Floating black draggable toolbar carrying (in order) a labelled Cell slider, the QR/Color/Eraser mode buttons plus the Grid On/Off toggle, seven square color swatches, and the Upload / Camera / Undo / Clear / Download / Share actions
- Seven swatches render the exact palette black #000000, white #ffffff, red #ff0000, yellow #ffff00, green #00ff00, blue #0000ff, pink #ff0098, with the active swatch visibly ringed
- Gallery mode: dense board cards/rows with names and tags plus favorite and delete affordances; a visible empty state when none remain
- Large centered canvas stage under the toolbar; a desktop-first creative-tool composition, not a dashboard
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
Stack: Svelte + Svelte stores + Tailwind CSS (Vite or equivalent); frontend-only. Ship QRious locally under assets/ (or equivalent). No MUI/Chakra/Ant Design.
- Seed at least 4 saved boards so Gallery is non-empty on first load
- Empty required name on save/create must not increase the boards count; show visible validation feedback
- After deleting all boards, show an empty state in Gallery
- Ship QRious (or equivalent) locally for client-side QR mask generation; QR Brush cells render a mask of a fixed studio string with no network request
- The Cell control locks after the first paint or image import and re-enables only on Clear; painting is a stroke-batched undo with capacity for ~100 steps
- Download output is a PNG named grid_paint.png that omits the grid overlay and adds a black branded footer; Share uses the native share sheet on mobile and falls back to Download elsewhere
- All keyboard shortcuts (Q / B / E, G, Backspace, and 1–7) must be wired to the same handlers as the toolbar controls
- Product naming: Grid Paint Studio; serve over local HTTP for verification
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
- Session operations: start; stop; restart

Mechanics exclusions:
- Drag-paint gestures stay Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
