<summary>
Build a QR color grid paint studio using Svelte, Svelte stores, Tailwind CSS 4.3.2, and Bits UI.
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
Feature: Paint stage and grid —
- The studio opens directly on the paint stage — an angle-bracket display title reading <GRID PAINT STUDIO>, a typewriter intro that types out an angle-bracketed tagline (e.g. <YOU ARE THE ALGORITHM>), a floating dark toolbar, and a large centered canvas — with no login, splash screen, or backend request
- A Cell range control (default 40, spanning roughly 16–64 on desktop) rebuilds the square grid whenever it moves: the board re-tiles to floor(1024 / cell) columns and rows over a fixed 1024px base, and any existing art is resampled into the new cell count rather than cleared
- Painting the first cell — or importing an image — locks the Cell control into a visibly muted/disabled state so the grid resolution cannot change mid-artwork; Clear empties the board and re-enables the control
Feature: Tools and palette —
- Four toolbar toggles set the active tool: QR Brush (active on load), Color Brush, and Eraser, plus a grid-overlay button whose label flips between Grid On and Grid Off as the hairline cell grid shows or hides
- With QR Brush active, painting a cell fills it with a QR-glyph mask (encoding a fixed studio string such as GRIDPAINT.STUDIO); the mask recolors with the active swatch — a white swatch yields a black glyph on white, a black swatch yields a white glyph on black, and any colored swatch yields that color's glyph on a white ground
- Color Brush fills whole cells with the active swatch; Eraser returns cells to blank; the active tool alone determines what a pointer stroke writes into each cell
- Exactly seven square palette swatches select the active color — black (active by default), white, red, yellow, green, blue, and pink — and the choice tints both solid fills and QR cells
- Pointer press-drag and touch drag paint across every cell the stroke crosses in one continuous gesture; each completed stroke pushes exactly one undo step, Undo (and Backspace) reverts the most recent stroke, and undo history retains up to ~100 steps
Feature: Import, capture, and export —
- Upload opens a file picker and pixelizes the chosen image onto the grid — one averaged color per grid cell, scaled to cover and centered — and locks the Cell control
- Camera opens an in-toolbar overlay showing the live front-facing camera feed; Capture center-crops a square frame and pixelizes it onto the grid, and Cancel closes the overlay without painting
- Download exports a PNG (grid_paint.png) of the board with the grid overlay omitted and a black footer strip added, captioned /MADE WITH GRID PAINT STUDIO on the left and <GRIDPAINT.STUDIO> on the right; Share hands that same PNG to the native share sheet on a mobile device and otherwise falls back to Download
Feature: Toolbar and shortcuts —
- On desktop the floating toolbar is draggable by its /GRID PAINT TOOLS header and stays clamped within the stage section; the current tool, palette, grid state, and painted board all survive the drag
- Keyboard shortcuts drive the tools: Q / B / E switch to QR / Color / Eraser, G toggles the grid overlay, Backspace undoes, and number keys 1–7 pick the matching palette swatch
Feature: Gallery of saved boards —
- Primary collection — saved boards: seed at least 4 boards, each with a name, a cell-snapshot thumbnail, and a tag; a Gallery mode lists them and supports Save board (create), rename (edit), and delete
- The Save board and rename forms validate the name inline before submit: an invalid or empty name shows a per-field message naming the name field, and the submit control stays disabled until the name is valid
- Favoriting a board toggles a visible favorite marker on its card, and filtering the gallery by tag recomputes the visible list from the shared collection; clearing the filter restores the full list exactly
</core_features>

<user_flows>
- Paint-and-save flow: paint several cells with Color Brush, switch to Gallery mode, and save the board with a valid name — the gallery count increases by exactly one, the new card shows the entered name and a thumbnail matching the painted cells, and returning to Paint mode shows the same painted board untouched, all without a reload
- Load-and-verify flow: loading a saved board from Gallery writes its cells back onto the paint canvas, returns to Paint mode with the loaded artwork visible, locks the Cell control because the board now holds art, and reopening Gallery still lists that same board unchanged
- Rename flow: renaming a board in Gallery updates that same card's name in place; the gallery count stays the same and no duplicate card appears
- Delete flow: deleting a board removes its card, decreases the gallery count by exactly one, and if that board's cells were loaded on the canvas the canvas keeps its current pixels — only the collection changes
- Filter echo flow: favoriting a board and then filtering the gallery by its tag shows the board with its favorite marker intact; both facets read from the one shared collection, so toggling the favorite while the filter is active updates the same visible card without a reload
- A page reload returns the app to its seeded state: the 4 seeded boards in Gallery, a blank canvas at cell size 40, QR Brush active, and the black swatch selected
</user_flows>

<edge_cases>
- Saving a board with an empty name adds nothing to the gallery and surfaces visible validation feedback naming the name field; the gallery count does not change
- Deleting every board shows an empty-gallery state in the list region that explains the gallery is empty and how to save a board
- When the tag filter matches no boards, the list region shows an empty state and clearing the filter restores the full list
- Undo with no strokes recorded changes nothing and causes no errors; after ~100 strokes the oldest steps drop off while Undo keeps reverting the most recent ones
- Moving the Cell control after art exists is impossible: the control stays visibly disabled until Clear empties the board
- Cancelling the camera overlay leaves the board exactly as it was, and denying camera access shows a visible message instead of a broken overlay
- Double-activating Save board creates exactly one gallery entry: the count increases by one and one new card appears
</edge_cases>

<visual_design>
- Saturated blue page field framing a light/white paint stage with high-contrast ink and condensed UI type
- Angle-bracket display title reading <GRID PAINT STUDIO> and a typewriter-style angle-bracketed intro line above the stage
- Floating black draggable toolbar carrying (in order) a labelled Cell slider, the QR/Color/Eraser mode buttons plus the Grid On/Off toggle, seven square color swatches, and the Upload / Camera / Undo / Clear / Download / Share actions
- Seven swatches render the exact palette black #000000, white #ffffff, red #ff0000, yellow #ffff00, green #00ff00, blue #0000ff, pink #ff0098, with the active swatch visibly ringed
- Gallery mode: dense board cards/rows with names and tags plus favorite and delete affordances; a visible empty state when none remain
- Large centered canvas stage under the toolbar; a desktop-first creative-tool composition, not a dashboard
- Component states: toolbar buttons, swatches, and form fields show distinct default, hover, focus, disabled, and error treatments
</visual_design>

<motion>
- Desktop toolbar drag: grab the tools header to reposition the floating panel
- Hover animations (required): primary action buttons fill/ease on hover; mode buttons and swatches show active fill/opacity/border changes; gallery board rows take a hover wash
- Cell-size control fades toward muted disabled look when locked; restores on Clear
- Mode switch between Paint and Gallery updates without full reload; loading a board updates the canvas immediately
- Camera capture overlay fades in and out
- Saving a board animates the new card into the gallery list, and deleting a board animates its card out rather than snapping
- Validation and save feedback (toasts or inline confirmations) appear with a short entrance motion and dismiss with a fade
- Painting updates cells immediately with no perceptible lag between the stroke and the fill
</motion>

<responsiveness>
- On narrow/touch viewports the Cell range control spans a narrower ~36–48 band instead of the desktop 16–64 range
- On narrow viewports the toolbar docks as a fixed panel instead of floating free, and every tool, swatch, and action remains reachable
- Touch drag paints continuously across cells just as pointer drag does on desktop
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width
</responsiveness>

<accessibility>
- Every toolbar control, swatch, gallery action, and form field is reachable and operable with the keyboard alone, with a visible focus indicator
- The camera overlay behaves as a modal dialog: it traps focus while open and returns focus to the Camera button on close
- Palette swatches and tool toggles expose accessible names and a discernible selected state to assistive technology, not color alone
- Validation messages for the save and rename forms are announced via an aria-live polite region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of painting, importing, saving, and gallery actions
- Rapid drag strokes across the grid keep painting smoothly with no hangs, dropped cells, or visible frame stutter
- Rebuilding the grid via the Cell control completes without freezing the page, even at the largest cell count
</performance>

<writing>
- Toolbar labels, gallery actions, and form labels use one consistent capitalization convention throughout the app
- Validation messages name the field and the fix; empty states explain what belongs there and how to add it
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): board cells, undo history, brush mode, palette, saved boards collection, active mode, and filters. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating/saving a valid board increases the gallery collection
- Editing a board name updates that same record in Gallery
- Deleting a board removes it from Gallery and selection
- Loading a board writes its cells into the shared paint board state
- Favorites/tag filters recompute the visible gallery from the shared collection
- A page reload returns the app to its seeded state
Stack: Svelte with Svelte stores, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Bits UI components provide the toolbar chrome, camera overlay, gallery controls, dialogs, and toasts; no other external component library. svelte-motion is allowed for animation; no other animation libraries. Phosphor icons via phosphor-svelte only; no raw pasted SVG icon sets and no icon CDNs. All forms, including saved-board create and rename, validate through a Zod schema driven by Felte and render inline per-field errors before submit. QRious or an equivalent client-side QR helper is allowed. All libraries are installed via npm and bundled locally; no CDN imports.
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
