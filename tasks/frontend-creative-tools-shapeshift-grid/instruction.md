<summary>
Build a SHAPESHIFT QR color grid painter using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte. The app produces the operator's session artifact: a downloadable and copyable Session JSON document (plus a branded PNG) compiled live from the paint board, tool state, fill stats, and saved boards, conforming to the same API-shaped field contracts as Save board / rename forms, with Import that round-trips that JSON.
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
- Direct studio entry: first load shows the angle-bracket <SHAPESHIFT GRID TOOL> title, a typewriter-style intro line, a floating toolbar, and a blank paint canvas — no login, splash, or backend
- Cell-size range slider (integer cellSize spanning 16–64) rebuilds the grid to the chosen cell size and resamples any existing painting into the new grid (art is preserved, not cleared); the slider locks and fades to a muted disabled look after the first paint, image upload, or camera capture, and Clear re-enables it
- Three brush modes selectable from the toolbar — QR Brush, Color Brush, and Eraser — plus a grid-overlay toggle whose button label flips between Grid On and Grid Off
- QR Brush stamps a fixed festival-QR mask into the cell and recolors it with the active swatch (white swatch → black QR on white, black swatch → white QR on black, any other color → that color QR on white); Color Brush fills the cell solid with the active swatch; Eraser clears the cell back to blank
- Seven-color palette swatches (white, black, red, yellow, green, blue, pink); selecting a swatch marks it active and tints both solid fills and QR stamps
- Pointer drag and touch drag paint across cells; a cell records to undo history only when its value actually changes; Undo steps back through recent changes and Clear empties the whole board
Feature: Mirror paint —
- A mirror-mode control cycles Off, Horizontal, and Vertical; when Horizontal or Vertical is active, each painted, QR-stamped, or erased cell also writes the same brush and color into its mirror-partner cell across the chosen axis in the same stroke; Off paints only the pointed cell
- Mirror mode is visible on the toolbar (active choice marked) and survives mode switches between Paint and Gallery without a reload
Feature: Live fill stats —
- A live fill-stats readout on the stage shows four integer counts derived from the current cells: painted (any non-blank), qr (QR-kind cells), colorFilled (solid Color-kind cells), and blank; painting, erasing, loading a board, importing a session, Clear, and cell-size resampling update the counts immediately; painted equals qr plus colorFilled, and painted plus blank equals the total cell count
Feature: Gallery of saved boards —
- Primary collection — saved boards: seed at least 4 boards; each has name, thumbnail/snapshot of cells, and a tag; the collection supports create (Save board), edit (rename), and delete
- Board field contract (the Save board and rename forms submit exactly this payload; the record created IS the would-be request body a boards API would accept; Export Session JSON boards[] entries use the same shape; all keys required unless marked optional; example values illustrative only): name (required trimmed non-empty string, max 40 characters, unique among boards case-sensitively after trim); tag (required trimmed non-empty string, max 24 characters); favorite (boolean, default false on create); cells (array of Cell objects matching the Cell field contract below, snapshotted from the paint board at save time)
- An empty, whitespace-only, over-length, or duplicate name, or an empty/whitespace-only/over-length tag, shows an inline validation message naming the offending field before submit, and the save control stays disabled until name and tag are valid; invalid submit adds nothing
- At least two interaction modes: Paint mode (canvas + toolbar) and Gallery mode (browse/load saved boards)
- Domain behavior beyond CRUD: load a saved board's cells onto the canvas; favorite boards; filter gallery by tag; undo/clear on the active board
Feature: Import image and camera —
- Upload an image or capture from the front-facing camera, center-crop it square, and pixelize it onto the grid (which locks the slider); the camera opens an overlay with Capture and Cancel
Feature: Session export and import (useful end state) —
- The app produces the user's session files: Export opens a surface with two format tabs regenerated live from the store — Session JSON (the API-shaped session document) and PNG (the branded raster). Each tab shows a preview; Copy writes the active text format to the clipboard with a brief confirmation; Download triggers a real file download whose contents match the open preview for Session JSON, or the branded PNG for the PNG tab
- Session field contract (this object IS the would-be session upsert request body; Save board / rename produce Board records that appear under boards; Export Session JSON and Import validate against it; field names and enum values are visible in the Session JSON preview text; all keys below are required unless marked optional; example values are illustrative only):
  - schemaVersion: exactly shapeshift-session-v1
  - cellSize: integer from 16 through 64 inclusive
  - brushMode: exactly one of qr, color, erase
  - paletteColor: exactly one of white, black, red, yellow, green, blue, pink
  - gridOverlay: boolean
  - mirrorMode: exactly one of off, horizontal, vertical
  - fillStats: object with integer keys painted, qr, colorFilled, blank (non-negative); painted equals qr plus colorFilled; painted plus blank equals the length of cells
  - cells: array of Cell objects (length matches the current grid); Cell field contract: row and col are non-negative integers within the grid; kind is exactly one of blank, qr, color; when kind is blank, color is null; when kind is qr or color, color is exactly one of white, black, red, yellow, green, blue, pink
  - boards: array of Board objects conforming to the Board field contract above (name, tag, favorite, cells)
- Cross-field rules: after painting cells or changing brushMode, paletteColor, mirrorMode, or gridOverlay, reopening Export shows those live values under the Session field-contract keys; after saving a board, boards includes that board under name, tag, favorite, and cells; fillStats in the preview matches the on-stage live readout
- An Import control accepts a previously exported Session JSON document (file pick or paste) and replaces paint cells, tool state (cellSize, brushMode, paletteColor, gridOverlay, mirrorMode), fill stats, and the boards collection so the UI and the next Export preview match the imported document without a reload. Exporting then re-importing reconstructs the same visible canvas, mirror mode, fill stats, and gallery boards. Malformed JSON (unparseable) shows visible validation and leaves canvas, tools, fill stats, and gallery unchanged. Import that fails the Session/Board/Cell field contract — wrong schemaVersion, cellSize outside 16–64, brushMode or paletteColor or mirrorMode outside their closed enums, a Cell kind/color mismatch, a Board missing name/tag/cells, empty or illegal name/tag bounds, duplicate board names, or fillStats that do not sum to the cell count — shows validation naming the offending field and changes nothing
Feature: Branded PNG —
- Download or Share a PNG of the canvas that appends a black footer band reading "/MADE WITH SHAPESHIFT GRID TOOL" (left) and "<SHAPESHIFTFESTIVAL.COM>" (right); Share uses the Web Share API on mobile and otherwise downloads the file; the PNG tab in Export uses this same branded raster
Feature: Keyboard shortcuts —
- Keyboard shortcuts: Q / B / E for brush modes, G for grid overlay, Backspace for undo, and keys 1–7 to select palette colors
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says otherwise):
- Save flow: paint at least 3 cells, open Save board, and submit a valid Board payload (trimmed unique name of at most 40 characters and trimmed tag of at most 24 characters) — the gallery collection count increases by exactly one, the new board card appears in Gallery mode with a thumbnail matching the painted cells and its tag, the Export Session JSON boards array includes that board under name, tag, favorite, and cells, and switching between Paint and Gallery modes shows the same new board without a reload
- Load flow: from Gallery mode, load a saved board — its cells appear on the paint canvas immediately, the app switches to Paint mode showing the loaded art, painting a further cell changes only that cell, and pressing Undo reverts exactly that one change while the rest of the loaded board stays intact; fill stats update to match the loaded and then edited cells
- Rename and delete flow: renaming a board updates that same card's name in Gallery without changing the collection count; deleting a board removes its card, decreases the count by exactly one, and clears it from any current selection; the deleted board no longer appears under any tag filter
- Favorite and filter flow: marking a board as favorite updates its indicator on the card immediately; choosing a tag filter recomputes the visible gallery to only boards with that tag, and clearing the filter restores the full collection with the favorite state preserved
- Mirror paint flow: set mirrorMode to Horizontal or Vertical, paint one cell near an edge — the mirror-partner cell receives the same brush and color in the same stroke; fill stats increase for both cells when both were blank; switching mirrorMode to Off then painting a different cell changes only that cell
- Artifact end state: paint cells, set Horizontal or Vertical mirror, save one uniquely named board, open Export and confirm Session JSON shows schemaVersion shapeshift-session-v1 plus brushMode, paletteColor, mirrorMode, fillStats, cells, and boards; Download or Copy that JSON, then Import it — canvas cells, mirror mode, fill stats, and gallery boards match the pre-export state; then Import a non-conforming payload (wrong schemaVersion or missing required fields) and confirm an inline error names the import problem while the studio stays unchanged
- Create record is request body: save a board with a valid name and tag after painting — Export Session JSON boards entry for that board carries the same name, tag, favorite, and cells the form produced
- Schema validation flow: attempt Save board with an empty, over-length, or duplicate name (gallery unchanged, name field named); Import JSON missing schemaVersion or with brushMode outside qr|color|erase (state unchanged, offending field named); then a valid save yields Session JSON whose boards payload shape matches the form-produced request body
- Reload baseline: a page reload returns the app to its seeded state — the blank canvas, the unlocked cell-size slider, mirrorMode Off, and exactly the seeded boards in Gallery; boards saved before the reload are gone
</user_flows>

<edge_cases>
- Invalid create: submitting the Save board form with an empty name, whitespace-only name, name over 40 characters, duplicate name, empty tag, whitespace-only tag, or tag over 24 characters must not add a board — the gallery count stays the same and the inline validation message names the offending field
- After deleting all boards, Gallery mode shows an empty state with a message explaining the gallery is empty and how to save a board
- A tag filter that matches no boards shows the empty state rather than a blank region, and clearing the filter restores the list
- Pressing Undo with no history is a safe no-op: the canvas does not change and no error appears
- Cancel in the camera overlay closes it without altering the canvas or locking the slider
- Dragging a paint stroke back and forth over the same cell with the same brush and color records the cell to undo history only once, so one Undo reverts it
- Resizing the cell slider before any paint keeps the board blank; resizing after painting resamples the art into the new grid rather than clearing it
- Importing malformed Session JSON, or parseable JSON that fails the Session/Board/Cell field contract (wrong schemaVersion, cellSize outside 16–64, brushMode/paletteColor/mirrorMode outside closed enums, Cell kind/color mismatch, Board missing required keys, or fillStats that do not sum to the cell count), shows an inline error naming the offending field or the import problem, leaves gallery count, canvas cells, and fill stats unchanged, and produces no console crash
- With mirrorMode Horizontal or Vertical, painting the center cell of an odd-width grid (partner coincides with itself) writes that cell only once and records one undo step for that cell
</edge_cases>

<visual_design>
- Light paper stage with high-contrast ink and soft radial washes; condensed UI type
- Angle-bracket display title for SHAPESHIFT Grid Tool and typewriter-style intro line
- Floating black draggable toolbar with cell slider, mode buttons, mirror-mode control, seven square swatches, fill-stats readout nearby, and action buttons including Export and Import
- Gallery mode: dense board cards/rows with names and tags; empty state when none remain
- Large centered canvas stage under the toolbar; desktop-first creative tool composition, not a dashboard
- On the canvas: QR cells render as a scannable festival QR mask, Color cells render as flat color fills, and the grid overlay (when on) draws light hairlines between cells
- Export opens as a centered surface with Session JSON / PNG format tabs, a scrollable monospaced Session JSON preview, Copy and Download affordances, and a hint line; Import uses a paste or file area in the same visual language
- Icons in the toolbar and gallery come from one consistent icon set used across the whole app
- Component states: toolbar buttons, swatches, and form fields show distinct default, hover, focus, disabled (locked cell slider; empty Undo), and error treatments
</visual_design>

<motion>
- Desktop toolbar drag: grab the tools header to reposition the floating panel
- Hover animations (required): primary action buttons fill/ease on hover; mode buttons, mirror control, and swatches show active fill/opacity/border changes; gallery board rows take a hover wash
- Cell-size control fades toward muted disabled look when locked; restores on Clear
- Mode switch between Paint and Gallery updates without full reload; loading a board updates the canvas immediately
- Camera capture overlay fades in/out; painting updates cells immediately
- Saving a board animates its new card into the gallery; deleting a board animates its card out rather than snapping
- Validation and save feedback appears with a brief eased transition rather than popping in instantly
- Export Copy shows a short confirmation before resetting; the Export surface enters and exits with a brief opacity/scale transition
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every feature remains usable — painting, saving, loading, filtering, camera overlay, Export, and Import included
</motion>

<responsiveness>
- At 375 pixel width the canvas and toolbar reflow to fit with no horizontal scrolling and no clipped controls; painting by touch drag works on the mobile layout
- At desktop widths the toolbar floats over the stage and is draggable; at small widths it may dock, but all brush modes, swatches, mirror control, fill stats, Export, Import, and actions stay reachable
- Gallery cards reflow from a dense multi-column desktop arrangement to a single column at narrow widths without losing names, tags, or actions
- The Export and Import surfaces remain readable and operable at 375px without clipped controls
</responsiveness>

<accessibility>
- Every toolbar control, swatch, gallery action, Export, Import, and form field is reachable and operable with the keyboard alone, with a visible focus indicator
- The camera overlay and the Export surface behave as modal dialogs: focus moves into them when opened, stays trapped while open, and returns to the triggering control on close; Escape dismisses them
- Palette swatches expose accessible names for their colors rather than being unlabeled colored squares; mirror-mode options and tool toggles expose accessible names and a discernible selected state
- The inline save-validation and Import-validation messages are announced to assistive technology as well as shown visually
- Fill-stats counts are exposed as text numerals, not color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of painting, saving, loading, filtering, Export, Import, and mode switching
- Continuous drag-painting across many cells stays smooth with no visible lag between pointer movement and cells filling — including when mirrorMode is Horizontal or Vertical
- Rebuilding the grid via the cell-size slider (while unlocked) completes without freezing the page
</performance>

<writing>
- Toolbar labels, gallery actions, Export/Import labels, and form labels use one consistent capitalization convention throughout the app
- Validation messages name the offending field-contract key and the fix (for example name, tag, or schemaVersion); empty states explain what belongs there and how to save a board or clear the filter
- Action labels use specific verbs such as Save board, Clear, Grid On, Export, and Import rather than generic Submit or OK alone
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
- Export footer captions (/MADE WITH SHAPESHIFT GRID TOOL and <SHAPESHIFTFESTIVAL.COM>) stay consistent with on-stage product naming
</writing>

<innovation>
Optional enhancements the builder may add, none required for a passing build: a brief coachmark that points at Export after the first save; a before/after flip that compares the current canvas to the last loaded board; a printable one-page festival board summary reachable from Export.
</innovation>

<requirements>
Shared application state must use Solid stores, the state library named in summary (in-memory only): board cells, undo history, brush mode, active palette color, mirror mode, fill stats, saved boards collection, favorites, tag filter, active mode, and export preview text. Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
State contracts (behavioral, not storage keys):
- Creating/saving a valid board increases the gallery collection
- Editing a board name updates that same record in Gallery
- Deleting a board removes it from Gallery and selection
- Loading a board writes its cells into the shared paint board state
- Favorites/tag filters recompute the visible gallery from the shared collection; they do not create a second disconnected copy
- Mirror mode writes partner cells through the same shared paint board state as direct strokes
- Fill stats recompute from the shared cells array after every mutation
- Export Session JSON compiles live from that shared state; Import replaces that shared state from a validated document
Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2 (pinned), and Kobalte as the single component library (Vite or equivalent); frontend-only. Kobalte provides the UI chrome: the camera, Export, Import, and rename dialogs, the cell-size slider, selects/toggles, and any tooltips or toasts. No other component UI libraries.
- Motion (the vanilla motion.dev package) is the only allowed animation library; no other animation libraries
- Tabler icons via the @tabler/icons-solidjs package only; no other icon sets, no raw copy-pasted SVGs, no icon fonts or CDNs
- All forms (Save board, rename, and Import) are driven by TanStack Form for Solid paired with a Zod schema: the schema defines the validation rules and the form shows inline per-field errors before submit, with submit disabled until valid. Schemas are API-shaped: they model the Board and Session payload shapes a festival-boards API would accept (the record Save board creates IS the would-be request body; Session JSON export and import conform to the same Session/Board/Cell field contracts, including closed enums, cellSize bounds 16–64, unique board names, and fillStats cross-field sum rules)
- Ship QRious locally under vendor/ (or equivalent) for client-side QR mask generation; QR Brush stamps a locally generated QR mask encoding the fixed festival URL (SHAPESHIFTFESTIVAL.COM) with no network calls
- Seed at least 4 saved boards so Gallery is non-empty on first load
- Resizing the cell slider resamples existing cells into the new grid rather than clearing them; Clear resets the board to blank and re-enables the slider
- Useful end state: the session's work product is the produced Session JSON (Copy and Download) plus branded PNG, with Import session round-trip against the Session field contract; every export must reflect live session mutations and Session JSON must carry every required key from the field contract above
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- Product naming: SHAPESHIFT Grid Tool; serve over local HTTP for verification
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
- Editor object types: grid-cell
- Editor properties: color; brush; mirror
- Editor modes: paint; erase; qr
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: board
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; tag; favorite; cells
- Artifact operations: export; import; copy
- Export formats: session-json; png
- Import modes: session-json

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)
- Mirror-partner cell painting during continuous drag stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- PNG rasterization fidelity and clipboard copy stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
