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
- Three primary modes switch the main surface without full page navigation: Paint, Gallery, and Export center
- A Cell range control (default 40, spanning roughly 16–64 on desktop) rebuilds the square grid whenever it moves: the board re-tiles to floor(1024 / cell) columns and rows over a fixed 1024px base, and any existing art is resampled into the new cell count rather than cleared
- Painting the first cell — or importing an image or project — locks the Cell control into a visibly muted/disabled state so the grid resolution cannot change mid-artwork; Clear empties the board and re-enables the control
Feature: Tools, palette, and symmetry —
- Five toolbar toggles set the active tool: QR Brush (active on load), Color Brush, Flood Fill, and Eraser, plus a grid-overlay button whose label flips between Grid On and Grid Off as the hairline cell grid shows or hides
- With QR Brush active, painting a cell fills it with a QR-glyph mask (encoding a fixed studio string such as GRIDPAINT.STUDIO); the mask recolors with the active swatch — a white swatch yields a black glyph on white, a black swatch yields a white glyph on black, and any colored swatch yields that color's glyph on a white ground
- Color Brush fills whole cells with the active swatch; Eraser returns cells to blank; Flood Fill replaces every contiguous cell matching the clicked cell's current value with a flat whole-cell fill of the active swatch in one update; the active tool alone determines what a pointer action writes
- A Mirror control cycles Off, Horizontal, Vertical, and Both; with Mirror not Off, each Color Brush or QR Brush write also paints the matching mirrored cell(s) in the same step, and one Undo clears the whole mirrored write together
- Exactly seven square palette swatches select the active color — black #000000 (active by default), white #ffffff, red #ff0000, yellow #ffff00, green #00ff00, blue #0000ff, and pink #ff0098 — and the choice tints both solid fills and QR cells
- Pointer press-drag and touch drag paint across every cell the stroke crosses in one continuous gesture; each completed stroke, fill, or mirror-expanded write pushes exactly one undo step; Undo (and Backspace / Ctrl or Cmd+Z) reverts the most recent step; Redo (and Ctrl or Cmd+Shift+Z) restores it; painting a new stroke after an undo clears the redo stack; undo history retains up to roughly 100 steps
Feature: Live histogram, vision, and versions —
- A live color histogram shows bars for the seven palette colors plus blank; painting, erasing, filling, clearing, loading, or importing recomputes bar heights from the live board without a reload
- A Vision control cycles Off, Protanopia, Deuteranopia, and Tritanopia; non-Off modes visibly filter the paint stage for color-blindness simulation without rewriting stored cell colors; Vision Off restores the original swatch appearance of every painted cell
- Snap version with a valid name (trimmed, max 40 characters) adds a Versions list entry with a thumbnail of the current cells; selecting that version and the live board and activating Compare shows a labeled before/after split; exiting Compare restores the live editable board unchanged; Compare with fewer than two sides selected shows a short message and does not enter the split view
Feature: Import, capture, and Export center —
- Upload opens a file picker and pixelizes the chosen image onto the grid — one averaged color per grid cell, scaled to cover and centered — and locks the Cell control
- Camera opens an in-toolbar overlay showing the live front-facing camera feed; Capture center-crops a square frame and pixelizes it onto the grid, and Cancel closes the overlay without painting
- Export center is the end-state surface: it regenerates live from the shared store three artifacts — Project JSON (the ProjectDocument request body), a CSS palette block listing custom properties for all seven swatches, and a branded PNG preview — so every paint, save, version snap, tool, swatch, mirror, and vision mutation appears in the export text without a reload
- Copy on the Project JSON artifact shows a visible confirmation; Download Project produces a .json file of the current Project JSON text; Download PNG exports grid_paint.png of the board with the grid overlay omitted and a black footer strip added, captioned /MADE WITH GRID PAINT STUDIO on the left and <GRIDPAINT.STUDIO> on the right; Share hands that same PNG to the native share sheet on a mobile device and otherwise falls back to Download
- An export that omits the session's painted cells, saved boards, or version snaps is invalid
- Import Project accepts a conforming Project JSON document and reconstructs board cells, cell-size lock when non-blank, tool/swatch/mirror/vision, gallery boards, versions, and histogram so the canvas and gallery match the export; malformed or non-conforming payloads show a visible error naming the offending field and leave board and gallery unchanged
Feature: ProjectDocument and SavedBoard field contracts —
- ProjectDocument request-body field contract (Export center Project JSON, Download Project, Copy, and Import Project share this schema — the generated document IS the would-be request body for the session project): required cellSize (integer matching the Cell control, desktop band roughly 16–64), required tool (exactly one of qr, color, fill, erase), required swatch (exactly one of #000000, #ffffff, #ff0000, #ffff00, #00ff00, #0000ff, #ff0098), required mirror (exactly one of off, horizontal, vertical, both), required vision (exactly one of off, protanopia, deuteranopia, tritanopia), required gridVisible (boolean), required cells (2D array whose row and column counts both equal floor(1024 / cellSize)), required boards (array of SavedBoard records), required versions (array of VersionSnapshot records). Cross-field: cells dimensions must equal floor(1024 / cellSize) on both axes; each blank cell is null or an explicit blank marker; each solid cell carries kind color and a palette hex; each QR cell carries kind qr and color (palette hex); a cells/cellSize mismatch, a tool/swatch/mirror/vision value outside its closed enum, a QR cell missing kind or color, or a boards/versions entry that violates SavedBoard / VersionSnapshot rules is rejected on Import with a visible field-named error and no mutation
- SavedBoard request-body field contract (Save board create, rename, gallery cards, and ProjectDocument.boards entries share this schema — a created board IS the would-be request body): required name (trimmed non-empty string, max 40 characters, unique among boards after trim), required tag (exactly one of pattern, portrait, abstract, logo, study, signal), required favorite (boolean, false on create until toggled), required cellSize (integer matching the board snapshot), required cells (2D array whose dimensions match floor(1024 / cellSize) with the same blank/solid/QR cell shape as ProjectDocument.cells). Cross-field: empty, duplicate, or overlong name, or a tag outside the closed enum, blocks submit with an inline per-field message naming name or tag and does not change the gallery count
- VersionSnapshot field contract (Snap version and ProjectDocument.versions share this schema): required name (trimmed non-empty string, max 40 characters), required cellSize, required cells (same dimension and cell-shape rules as SavedBoard). Empty or overlong version names show inline validation naming the name field and add nothing to the Versions list
Feature: Toolbar and shortcuts —
- On desktop the floating toolbar is draggable by its /GRID PAINT TOOLS header and stays clamped within the stage section; the current tool, palette, grid state, mirror mode, and painted board all survive the drag
- Keyboard shortcuts drive the tools: Q / B / F / E switch to QR / Color / Flood Fill / Eraser, G toggles the grid overlay, M cycles Mirror, Backspace and Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo, and number keys 1–7 pick the matching palette swatch
- Ctrl+K or Cmd+K opens a command palette; typing part of a seeded board name and pressing Enter on that result loads the board onto the canvas in Paint mode; choosing Export center from the palette switches to that panel; Escape closes the palette and returns focus
Feature: Gallery of saved boards —
- Primary collection — saved boards: seed at least 4 boards, each with a name, a closed-enum tag, a cell-snapshot thumbnail, and favorite false; Gallery mode lists them and supports Save board (create), rename (edit), delete, favorite toggle, tag filter, and multi-select bulk actions
- The Save board and rename forms validate name and tag inline before submit: an invalid or empty name, duplicate name, name over 40 characters, or tag outside pattern|portrait|abstract|logo|study|signal shows a per-field message naming that field, and the submit control stays disabled until every required field is valid; a valid save produces a gallery card and a Project JSON boards entry both showing that name and tag under the same SavedBoard field names, with favorite false until toggled
- Favoriting a board toggles a visible favorite marker on its card, and filtering the gallery by tag recomputes the visible list from the shared collection; clearing the filter restores the full list exactly
- Selecting multiple gallery boards and choosing Favorite selected marks all selected; Delete selected after a confirmation naming the count removes exactly those boards and decreases the gallery count by that count; with zero boards selected the bulk bar stays hidden or Delete selected stays disabled
</core_features>

<user_flows>
- Paint-and-save flow: paint at least 3 cells with Color Brush, switch to Gallery mode, and save the board with a valid name and closed-enum tag — the gallery count increases by exactly one, the new card shows the entered name, tag, and a thumbnail matching the painted cells, and returning to Paint mode shows the same painted board untouched, all without a reload
- Load-and-verify flow: loading a saved board from Gallery writes its cells back onto the paint canvas, returns to Paint mode with the loaded artwork visible, locks the Cell control because the board now holds art, and reopening Gallery still lists that same board unchanged
- Rename flow: renaming a board in Gallery updates that same card's name in place; the gallery count stays the same and no duplicate card appears
- Delete flow: deleting a board removes its card, decreases the gallery count by exactly one, and if that board's cells were loaded on the canvas the canvas keeps its current pixels — only the collection changes
- Filter echo flow: favoriting a board and then filtering the gallery by its tag shows the board with its favorite marker intact; both facets read from the one shared collection, so toggling the favorite while the filter is active updates the same visible card without a reload
- Export pipeline: paint a recognizable multicolor pattern, save the board with a valid name and closed-enum tag, snap a named version, open Export center — Project JSON shows ProjectDocument keys (cellSize, tool, swatch, mirror, vision, gridVisible, cells, boards, versions) with the painted cells, the new board name and tag, and the version name; CSS palette lists seven swatch custom properties; Download PNG yields branded grid_paint.png matching the board
- Import round-trip: export Project JSON from a session with painted cells and a saved board, Clear and alter gallery if needed, then Import Project that JSON — canvas, cell lock, tool/swatch/mirror/vision, gallery cards, versions, and histogram bars reconstruct to match the export
- Undo/redo flow: paint a stroke, flood-fill a region, undo twice, redo once — only the first action returns; histogram bars track each step; a new paint after undo disables Redo
- Symmetry paint flow: set Mirror to Horizontal, paint one edge cell with Color Brush — the mirrored cell paints in the same stroke; one Undo clears both cells together
- Command palette flow: open with Ctrl+K or Cmd+K, type part of a seeded board name, Enter loads it in Paint mode; reopen and choose Export center to switch to that panel
- Bulk gallery flow: select three gallery boards, Favorite selected marks all three; Delete selected after confirmation removes exactly those three and decreases the count by three
- A page reload returns the app to its seeded state: the 4 seeded boards in Gallery, a blank canvas at cell size 40, QR Brush active, the black swatch selected, Mirror Off, Vision Off, and empty undo/redo
</user_flows>

<edge_cases>
- Saving a board with an empty name, a duplicate name, a name over 40 characters, or a tag outside pattern|portrait|abstract|logo|study|signal adds nothing to the gallery and surfaces visible validation feedback naming the offending field; the gallery count does not change
- Deleting every board shows an empty-gallery state in the list region that explains the gallery is empty and how to save a board
- When the tag filter matches no boards, the list region shows an empty state and clearing the filter restores the full list
- Undo with no strokes and Redo with an empty redo stack are disabled; activating them changes nothing and causes no errors; after roughly 100 strokes the oldest undo steps drop off while Undo keeps reverting the most recent ones
- Moving the Cell control after art exists is impossible: the control stays visibly disabled until Clear empties the board
- Cancelling the camera overlay leaves the board exactly as it was, and denying camera access shows a visible message instead of a broken overlay
- Double-activating Save board creates exactly one gallery entry: the count increases by one and one new card appears
- Flood Fill on a board where every cell in the contiguous region already matches the active swatch fill target changes nothing and does not push an undo step
- Importing malformed Project JSON, or JSON that omits a required ProjectDocument key, uses tool/swatch/mirror/vision outside their closed enums, carries cells whose dimensions disagree with cellSize, or carries boards/versions that violate SavedBoard / VersionSnapshot rules, shows a visible error naming the offending field, leaves the board and gallery unchanged, and does not lock Cell
- Compare with fewer than two sides selected shows a short message explaining that two versions (or a version and the live board) must be chosen, and does not enter the split view
- With zero gallery checkboxes checked, the bulk action bar stays hidden or its Delete selected action stays disabled so nothing is deleted
- Vision preview filters never rewrite stored cell colors: toggling Vision Off restores the original swatch appearance of every painted cell
- Snap version with an empty name or a name over 40 characters shows inline validation naming the name field and adds nothing to the Versions list
</edge_cases>

<visual_design>
- Saturated blue page field framing a light/white paint stage with high-contrast ink and condensed UI type
- Angle-bracket display title reading <GRID PAINT STUDIO> and a typewriter-style angle-bracketed intro line above the stage
- Floating black draggable toolbar carrying (in order) a labelled Cell slider, the QR/Color/Flood Fill/Eraser mode buttons plus the Grid On/Off toggle, a Mirror control, seven square color swatches, and the Upload / Camera / Undo / Redo / Clear / Export / Share actions
- Seven swatches render the exact palette black #000000, white #ffffff, red #ff0000, yellow #ffff00, green #00ff00, blue #0000ff, pink #ff0098, with the active swatch visibly ringed
- Live histogram with seven color bars plus a blank bar and readable labels; Vision mode chips make the active simulation discernible
- Gallery mode: dense board cards/rows with names and tags plus favorite, delete, and multi-select affordances; a visible empty state when none remain; a bulk action bar when selection is non-empty
- Export center: monospaced Project JSON and CSS palette preview blocks, a PNG preview, and Copy/Download controls with clear section labels
- Versions list with thumbnails and Compare labels for the before/after split
- Large centered canvas stage under the toolbar; a desktop-first creative-tool composition, not a dashboard
- Component states: toolbar buttons, swatches, and form fields show distinct default, hover, focus, disabled, and error treatments
</visual_design>

<motion>
- Desktop toolbar drag: grab the tools header to reposition the floating panel
- Hover animations (required): primary action buttons fill/ease on hover; mode buttons and swatches show active fill/opacity/border changes; gallery board rows take a hover wash
- Cell-size control fades toward muted disabled look when locked; restores on Clear
- Mode switch among Paint, Gallery, and Export center updates without full reload; loading a board updates the canvas immediately
- Camera capture overlay fades in and out
- Saving a board animates the new card into the gallery list, and deleting a board animates its card out rather than snapping
- Histogram bars ease height changes when cell counts change; Compare and Copy confirmation transitions are brief and readable
- Validation and save feedback (toasts or inline confirmations) appear with a short entrance motion and dismiss with a fade
- Painting and Flood Fill update cells immediately with no perceptible lag between the action and the fill
- With prefers-reduced-motion set, transitions are removed and state changes apply instantly
</motion>

<responsiveness>
- On narrow/touch viewports the Cell range control spans a narrower ~36–48 band instead of the desktop 16–64 range
- On narrow viewports the toolbar docks as a fixed panel instead of floating free, and every tool, swatch, and action remains reachable
- Touch drag paints continuously across cells just as pointer drag does on desktop
- Export center previews, histogram, and Gallery remain usable at 375 pixel width without horizontal scrolling
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width
</responsiveness>

<accessibility>
- Every toolbar control, swatch, gallery action, command palette result, and form field is reachable and operable with the keyboard alone, with a visible focus indicator
- The camera overlay behaves as a modal dialog: it traps focus while open and returns focus to the Camera button on close
- The command palette traps focus while open, closes on Escape, and returns focus to the control that opened it
- Export center dialogs and Compare overlays that behave as modals trap focus while open and return focus on close
- Palette swatches and tool toggles (including Flood Fill, Mirror, and Grid On/Off) expose accessible names and a discernible selected state to assistive technology, not color alone
- Histogram state is not conveyed by color alone — bars have readable labels or equivalent non-color cues
- Validation messages for the save, rename, version, and import forms are announced via an aria-live polite region as well as shown visually
- Save board, rename, and Snap version name fields use explicit labels associated with the controls
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of painting, filling, importing, saving, export/import, and gallery actions
- Rapid drag strokes across the grid keep painting smoothly with no hangs, dropped cells, or visible frame stutter
- Flood Fill on a nearly full board and Project JSON recompilation after edits finish without locking the UI
- Histogram updates track board changes without jank; switching among Paint, Gallery, and Export center under repeated input stays responsive
- Rebuilding the grid via the Cell control completes without freezing the page, even at the largest cell count
</performance>

<writing>
- Toolbar labels, gallery actions, Export center labels, and form labels use one consistent capitalization convention throughout the app
- Action labels use specific verbs appropriate to the studio (for example Save board, Clear, Upload, Flood Fill, Grid On/Off, Download Project) rather than generic Submit/OK alone
- Validation messages for Save board, rename, Snap version, or Import Project name the offending field (name, tag, ProjectDocument key, or a cells/cellSize cross-field rule) and the fix; empty states explain what belongs there and how to add it
- Tool names (QR Brush, Color Brush, Flood Fill, Eraser) and Mirror / Vision mode names stay consistent across the toolbar, command palette, and Export center
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): board cells, undo/redo history, brush mode, palette, mirror, vision, saved boards collection, versions, active mode, filters, and export-derived text. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating/saving a valid board increases the gallery collection and appears under ProjectDocument.boards
- Editing a board name updates that same record in Gallery and in Project JSON
- Deleting a board removes it from Gallery and selection
- Loading a board writes its cells into the shared paint board state
- Favorites/tag filters and bulk actions recompute the visible gallery from the shared collection
- Export center Project JSON, CSS palette, and PNG recompile from the live store after every mutation
- Import Project of a conforming document restores the visible session; non-conforming payloads mutate nothing
- A page reload returns the app to its seeded state
Stack: Svelte with Svelte stores, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Bits UI components provide the toolbar chrome, camera overlay, gallery controls, command palette, dialogs, and toasts; no other external component library. svelte-motion is allowed for animation; no other animation libraries. Phosphor icons via phosphor-svelte only; no raw pasted SVG icon sets and no icon CDNs. All forms, including saved-board create and rename, Snap version, and Import Project, validate through a Zod schema driven by Felte and render inline per-field errors before submit; those schemas mirror the API-shaped ProjectDocument, SavedBoard, and VersionSnapshot field contracts in core_features (closed enums, max lengths, cells/cellSize cross-field rules); a created SavedBoard and the exported ProjectDocument ARE the would-be request bodies; Export/Copy/Import validate through the same schemas. QRious or an equivalent client-side QR helper is allowed. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 4 saved boards so Gallery is non-empty on first load
- Empty, duplicate, or overlong required name, or invalid tag, on save/create must not increase the boards count; show visible validation feedback
- After deleting all boards, show an empty state in Gallery
- Ship QRious (or equivalent) locally for client-side QR mask generation; QR Brush cells render a mask of a fixed studio string with no network request
- The Cell control locks after the first paint or image/project import and re-enables only on Clear; painting is a stroke-batched undo/redo with capacity for roughly 100 undo steps
- End-state contract: Export center Project JSON, CSS palette, Download Project, Copy, Download PNG (grid_paint.png with branded footer), and Share MUST reflect the session's actual cells, boards, and versions — an export that omits session work is invalid; Import Project MUST restore the same visible state (round-trip)
- All keyboard shortcuts (Q / B / F / E, G, M, Backspace, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, 1–7, and Ctrl/Cmd+K) must be wired to the same handlers as the toolbar controls
- Product naming: Grid Paint Studio; serve over local HTTP for verification
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1
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
- Editor modes: qr; color; fill; erase
- Editor operations: select; update_property; switch_mode; preview
- Entity: board
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; tag; favorite
- Artifact operations: export; import; copy
- Export formats: project-json; png; css-palette
- Import modes: project-json
- Session operations: start; stop; restart

Mechanics exclusions:
- Drag-paint gestures stay Playwright
- Camera overlay capture stays Playwright-observed
- Toolbar drag stays Playwright-driven
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
