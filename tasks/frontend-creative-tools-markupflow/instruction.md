<summary>
Build a MarkupFlow image annotation studio using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
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

Feature: Annotation workspace shell —
- The app opens directly at / into a dark annotation workspace: a header (MarkupFlow title, edit/preview view buttons, Reset workspace, theme toggle, Undo, Redo, Compare, Save snapshot, Export PNG, Export project JSON, Import project, Copy project JSON), a left tool rail grouped into Shapes, Effects, Style, and Presets sections, a central canvas region, and a right column with Layers, History, Versions, Saved projects, and Collaboration scenario panels — no backend, no login, no outbound navigation
- Before any image is loaded the canvas region shows an empty state: a dashed drop zone reading Drop an image here with a Choose image button and a Try sample image button, both clearly visible
- Clicking Try sample image immediately draws a built-in demo scene onto a fixed-size canvas so the tool is usable without uploading; loading a file by clicking Choose image or dragging an image file onto the drop zone reads it entirely in the browser and renders it on the canvas, and the image never leaves the browser

Feature: Drawing tools —
- The Shapes section exposes Rectangle, Oval, Line, and Arrow tools; with the tool selected, click-dragging on the canvas draws that shape at the dragged position and size and it persists the instant the pointer is released — Rectangle draws a rectangle, Oval draws an ellipse, Line draws a straight segment, and Arrow draws a segment ending in a filled arrowhead, so the four are visually distinct
- The Text tool places an editable text box where the canvas is clicked and shows an inline text input plus a style bar offering five named styles (Plain, Bold caption, Outline, Highlight box, Shadow) and a font-size slider from 10 to 72; typing changes the rendered text live, switching style visibly changes its appearance, and changing the slider visibly changes its size
- The Effects section provides Blur, Pixelate, Spotlight, Loupe, and Highlighter tools: Blur click-drag permanently blurs the pixels under a rectangle, Pixelate applies a mosaic under a rectangle visibly distinct from Blur, Spotlight click-drag dims everything outside an oval, Loupe click drops a magnifier callout showing a zoomed circular view joined to the source point by a thin line, and Highlighter drag lays a translucent colored band
- The Style section offers a palette of 12 preset color swatches plus a custom color input and a Thin/Medium/Thick stroke selector; the active color and stroke apply to the next shape drawn, and a shape drawn with Thick shows a visibly thicker stroke than one drawn with Thin
- Style also exposes Copy style and Paste style: after drawing a shape, Copy style captures its color and stroke; selecting another annotation and activating Paste style updates that annotation to the copied color and stroke; Paste style stays visibly disabled until Copy style has been used at least once in the session

Feature: Markup presets —
- The Presets section lists exactly four named recipes as distinct activatable controls: Blur redaction, Callout arrow, Highlight band, and Spotlight focus
- On a loaded image, Blur redaction adds exactly one Blur annotation, Highlight band adds exactly one Highlighter annotation, and Spotlight focus adds exactly one Spotlight annotation, each visible on the canvas and in Layers without a separate apply step
- Callout arrow adds exactly two new Layers rows — an arrow and a text annotation with Bold caption reading Callout — both visible on the canvas; Undo becomes enabled after the preset applies

Feature: Layers, history, and versions —
- The Layers panel lists every annotation in creation order by type label with a color chip and index; each row has a Delete control that removes only that annotation from the list and the canvas, and clicking a row (not its Delete) selects it and draws a dashed selection outline around the matching annotation on the canvas
- Each Layers row is draggable via native drag-and-drop and also carries up and down move buttons; dropping a dragged row moves it to the drop position and immediately re-renders the canvas stacking order so the topmost Layers row renders frontmost
- The History panel lists newest-on-top human-readable entries for annotation mutations; clicking an older History entry restores that prior canvas and Layers snapshot and leaves newer entries redoable until a new mutation discards the redo branch; when History is empty it shows a friendly message explaining that actions will appear there
- Save snapshot under a non-empty name (at most 80 characters) adds a Versions row; Restore on a snapshot returns the canvas and Layers to that snapshot; Delete removes only that Versions row; when Versions is empty it explains how snapshots appear; Save snapshot stays disabled while the name is empty
- Compare hides every annotation so only the base image shows, the Compare control shows a visible active treatment, and ending Compare restores the annotated view without deleting annotations

Feature: Undo, export, and projects —
- Undo and Redo buttons step backward and forward through annotation history and are also driven by Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y); each button is visibly disabled when there is nothing to undo or redo
- Export PNG flattens the base image, the destructive effects, and the overlay annotations into a single PNG and triggers a client-side download from an in-browser Blob with no network upload
- MarkupFlowProject request-body field contract (Export project JSON / Download project JSON / Copy project JSON / Import project share this schema — the live-compiled project IS the would-be request body describing the annotated image): required schemaVersion (string exactly markupflow-project-v1), required imageDataUrl (string beginning with data:image/), required imageWidth (positive number), required imageHeight (positive number), required annotations (array). Annotation field contract for each entry: required id (non-empty string), required type (exactly one of rectangle, oval, line, arrow, text, blur, pixelate, spotlight, loupe, highlighter), required x and y (numbers), required color (string matching #RRGGBB), required strokeWidth (exactly one of thin, medium, thick). Type-specific geometry cross-field rules: rectangle, oval, blur, pixelate, spotlight, and highlighter require positive width and height; line and arrow require x2 and y2 numbers; loupe requires cx and cy numbers; text requires text (string), textStyle (exactly one of plain, bold-caption, outline, highlight-box, shadow), and fontSize (integer from 10 through 72 inclusive). An export that omits a session annotation or invents annotations not on the canvas is invalid.
- Export project JSON shows a read-only monospace preview compiled LIVE from the store that conforms to MarkupFlowProject; Download project JSON triggers a client-side .json Blob download with no network upload; Copy project JSON writes that same live-compiled text to the clipboard and shows a brief copied confirmation. With no image loaded, Export project JSON and Copy project JSON stay disabled or show an empty-state hint and do not invent annotations. A copy or export taken after adding annotations differs from one taken before those annotations.
- Import project accepts a conforming MarkupFlowProject JSON file and restores image, annotations, and stacking order onto canvas and Layers; a payload that fails the MarkupFlowProject or Annotation field contract (wrong schemaVersion, missing annotations, imageDataUrl not beginning with data:image/, invalid type or strokeWidth or textStyle enum, fontSize outside 10–72, color not #RRGGBB, or geometry missing width/height, x2/y2, or cx/cy for the type) shows an inline error naming the offending field or rule and leaves canvas and Layers unchanged
- The Saved projects panel provides a save form with a project name field; SavedProjectCreate field contract: required name (trimmed non-empty string, at most 80 characters). The Save control stays disabled while the name is empty, and submitting with an invalid name (empty after trim, or longer than 80 characters) shows an inline validation message naming the name field and saves nothing
- Saving a valid name stores the current image plus its annotation list as a project row, and each saved row offers Open, Update, and Delete controls; opening a project restores its image and annotations onto the canvas
- SnapshotCreate field contract mirrors SavedProjectCreate for the snapshot name (trimmed non-empty, at most 80 characters); submitting a name longer than 80 characters shows an inline validation message naming the name field and adds no Versions row
- A Collaboration scenario panel provides a Shared editor textarea, a remote-editor textarea, Go offline and Go online controls, and a Shared content region; two independently authored non-conflicting edits both appear in the converged Shared content regardless of apply order, and creating a conflict surfaces an explicit Keep local / Keep remote / Merge both choice instead of silently overwriting
- The header edit and preview view buttons switch the workspace mode: preview mode hides the tool rail to show the annotated result, edit mode restores it; the active view button is visibly marked
</core_features>

<user_flows>
- After drawing a rectangle on the canvas, the Layers panel gains exactly one new row labeled as a rectangle with a color chip matching the active color, the Undo button switches from disabled to enabled, and reloading the page restores the same rectangle on the canvas and the same row in the Layers list
- Saving the current work under a new project name adds exactly one row to the Saved projects list, clicking Reset workspace clears the canvas and Layers panel, clicking Open on that saved row restores the saved image and every annotation onto both the canvas and the Layers list, and the saved row is still present after a full page reload
- Deleting an annotation from its Layers row removes that row, removes the matching mark from the canvas, clears any selection outline that referenced it, and enables Undo so the deletion can be stepped back
- After drawing two shapes, pressing Ctrl+Z removes the most recent shape from both the canvas and the Layers list and enables Redo; pressing Redo restores it to both surfaces; drawing a new shape after an undo returns Redo to disabled because the redo branch is discarded
- Moving a Layers row with its up or down button changes the row order in the panel, immediately changes which annotation renders frontmost on the canvas, and the new stacking order is still in effect after a page reload
- Preset-to-export flow: load the sample image, activate Callout arrow, confirm Layers gains exactly two rows (arrow and text), open Export project JSON, and confirm the preview includes schemaVersion markupflow-project-v1, imageDataUrl beginning with data:image/, imageWidth, imageHeight, the annotations array, both annotation types with type/color/strokeWidth, the arrow's x2 and y2, and the text annotation's textStyle and fontSize
- Style copy-paste flow: draw a Thick color-A rectangle, Copy style, draw a Thin color-B oval, select the oval, Paste style — the oval updates to Thick and color A on the canvas while the rectangle stays unchanged
- Snapshot-compare flow: with annotations present, Save snapshot under a valid name, draw one more shape, Restore the snapshot (extra shape gone from canvas and Layers), activate Compare (base image only), end Compare (annotated view restored with Layers count unchanged)
- Project JSON round-trip: draw at least two shapes, reorder Layers, Download project JSON, Reset workspace, Import that file — the same annotations and stacking order return on canvas and Layers; then Import a non-conforming payload and confirm an inline error names the import problem while canvas and Layers stay unchanged
</user_flows>

<edge_cases>
- A click-drag shorter than a small threshold creates no annotation: the Layers row count is unchanged and Undo availability does not change
- When the Layers panel has no annotations it shows a friendly message explaining that annotations will appear there, rather than a blank region
- On first ever load, and whenever a stored value is missing or corrupt, the app falls back to a clean empty workspace without crashing and without console errors
- With nothing drawn, Undo and Redo are both disabled and pressing Ctrl+Z or Ctrl+Y changes nothing
- Deleting the last remaining annotation returns the Layers panel to its empty-state message and leaves the loaded image intact on the canvas
- Creating conflicting edits in the Collaboration scenario never silently drops either side: the Shared content region keeps its prior converged text until the user picks Keep local, Keep remote, or Merge both
- Paste style stays visibly disabled and changes nothing when no style has been copied yet
- Save snapshot stays disabled while the snapshot name is empty and adds no Versions row
- Submitting Saved projects or Save snapshot with a name longer than 80 characters shows an inline validation message naming the name field and adds no row
- Importing a malformed or field-contract-invalid project JSON shows an inline error naming the import problem, leaves canvas and Layers unchanged, and produces no console crash
- Importing a parseable project JSON whose annotations array contains a rectangle without positive width and height, or an arrow without x2 and y2, shows an inline error naming the geometry field and leaves canvas and Layers unchanged
- With no image loaded, Export project JSON and Copy project JSON stay disabled or show an empty-state hint and do not invent annotations
</edge_cases>

<visual_design>
- Dark workspace theme using these tokens: background #1F242E, surface panels #2A303B, borders #3A414D, primary text #F3F4F6, secondary text #9CA3AF, primary action #0000EE, active-tool accent #0079FD with white contrast; a light theme is also available via the header toggle and every pairing stays legible after switching
- Three-region layout: a fixed left tool rail (~88px on wide screens) with Shapes, Effects, Style, and Presets groups separated by hairline dividers, a flexible central canvas region that centers the image, and a right column (~256-288px) holding Layers, History, Versions, Saved projects, and Collaboration scenario
- Toolbar section labels (Shapes, Effects, Style, Presets) render at ~11-13px, semi-bold, uppercase, muted; the Layers, History, and Versions headings render larger and bolder (~16-18px, weight 700); all UI text uses the Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif stack
- Toolbar buttons are square with 8px radius, transparent at rest and surface-colored on hover; the active tool uses the accent background with a white icon and a check mark; the Export PNG button uses the primary color with white text; panels use 12px radius, surface background, and a 1px border
- The project JSON preview renders as monospace text on a recessed surface visually distinct from the Layers list rows
- When Compare is active the Compare control shows a visible active or pressed treatment distinct from rest
- Every toolbar tool, header action, and Layers row control carries an icon drawn from one consistent icon set at a consistent stroke weight, never mixed styles
- Spacing follows a 4px base scale (4/8/12/16/24); the selected color swatch shows a ring/check indicator; Undo and Redo show a dimmed disabled appearance when inactive
- Inline validation messages under the project name, snapshot name, and import surfaces render in a distinct error color clearly separated from secondary text
</visual_design>

<motion>
- Every toolbar button, palette swatch, stroke button, and Layers row shows a visible hover state distinct from rest
- Selecting a tool updates the active-tool highlight immediately with no stale highlight left on the previous tool; each annotation appears the instant the pointer is released with no separate apply step
- The theme toggle recolors every surface; the shape drawing shows a live dashed preview that follows the pointer while dragging and commits on release
- Adding an annotation animates its new Layers row into the list rather than snapping, and deleting an annotation animates its row out; the remaining rows settle smoothly into place
- While a Layers row is dragged it takes reduced opacity and elevated shadow and the target row shows an accent drop-position border; on drop the canvas re-renders in the new stacking order
- Saving a project animates the new Saved projects row into the list rather than snapping it in
- Saving a valid snapshot animates the new Versions row into the list rather than snapping it in
- Applying a preset through a real Preset control briefly pulses the new Layers rows, and Copy project JSON shows a short copied confirmation that auto-dismisses
- Entering Compare through the real Compare control fades annotations out over a short transition; leaving Compare fades them back in; with prefers-reduced-motion set the swap is instant and complete
- The Collaboration scenario shows a Syncing... pulse while reconnecting and a pending-changes note while offline
- View switching and all state changes update the canvas in place without a full page reload
- With prefers-reduced-motion set, list and panel animations are removed and every state change still applies instantly and completely
</motion>

<responsiveness>
- At ~375px width the layout stacks vertically without horizontal page scrolling and the tool rail becomes horizontally scrollable rather than wrapping awkwardly
- At ~375px width the canvas region scales its content to fit the viewport width so the loaded image and its annotations remain fully visible
- At desktop widths (1280px and above) all three regions — tool rail, canvas, and Layers panel — are visible simultaneously without overlap
</responsiveness>

<accessibility>
- Every interactive control — toolbar tools, header actions, swatches, Layers row controls, Saved projects controls, Export project JSON, Import project, Copy project JSON, History entries, Versions Restore/Delete, preset controls, Copy style, Paste style, Save snapshot, and Compare — is reachable with the keyboard alone and shows a clear focus outline distinct from both rest and hover states
- Icon-only toolbar and header buttons expose accessible names so each tool and action is identifiable without relying on the icon alone
- The active tool, the selected color swatch, and Compare when active expose their selected or pressed state to assistive technology, not only through color
- Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y operate undo and redo from the keyboard without requiring pointer use
- The conflict resolution choice (Keep local / Keep remote / Merge both) is operable entirely from the keyboard
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of drawing, effects, layer reordering, undo/redo, presets, snapshots, Compare, saving, export, and import
- The live drawing preview follows the pointer with no visible lag, and rapid repeated undo/redo does not hang or drop interactions
- Reordering layers re-renders the canvas immediately with no visible delay between the row move and the stacking change
</performance>

<writing>
- Empty states explain what belongs there and how to add it: the drop zone names its two ways to load an image, the empty Layers panel explains that annotations will appear there, and empty History and Versions panels explain how entries appear
- Validation and conflict messages name the problem and the way forward rather than showing generic failure text; Import project rejections name the offending field or rule (for example schemaVersion, imageDataUrl, strokeWidth, fontSize, width, or x2) rather than only Import failed; no placeholder text appears anywhere in the shipped UI
- Buttons and section labels use one consistent capitalization convention and specific verbs (Export PNG, Export project JSON, Import project, Copy project JSON, Save snapshot, Blur redaction, Callout arrow, Go offline) rather than generic labels
</writing>

<innovation>
- Bonus, non-blocking craft beyond the minimum: markup presets that feel intentional (brief placement guide, smart default sizing relative to the image, or coordinated Callout arrow text placement), Compare and History that feel power-user grade (clear active Compare treatment and scannable History labels matching tool names), and overall studio polish so Export PNG, project JSON round-trip, presets, and snapshot/compare read as a professional annotation instrument rather than a wired demo
</innovation>

<requirements>
- Shared application state must use Solid stores (createStore) as named in the summary: the annotations collection, active image, active tool, active color and stroke and text style and font size, copied style buffer, undo and redo stacks, History and Versions collections, current selection, saved projects, collaboration state, Compare mode, and view mode; every view derives from this one store, never a second disconnected copy
- Persistence is mandated: the current image (as a data URL) and its full annotation list, plus the saved-projects collection and Versions snapshots, must survive a full page refresh via localStorage; guard reads so a missing or corrupt saved value falls back to a clean empty workspace without crashing
- Adding an annotation increases the collection and pushes an undo snapshot; deleting removes it from the list, canvas, and selection; updating the selected annotation's color, stroke, text style, or font size changes it in place; reordering the list changes the canvas stacking order and survives reload
- Undo restores the previous annotation snapshot and enables Redo; Redo reapplies it; performing a new add after an undo clears the redo stack; both buttons reflect their availability with a visible disabled state; Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y drive the same history
- Shape tools map drawn client coordinates into image coordinates so annotations stay correctly placed and scaled when the canvas is resized or reloaded; the Loupe is placed by a single click, all other shape and effect tools by click-drag; a drag shorter than a small threshold does not create an annotation
- Blur, Pixelate, and Spotlight are destructive effects re-applied to the base image on every render and after reload; overlay annotations (shapes, text, arrow, loupe, highlighter) render on a separate layer in reverse list order so the topmost Layers row is frontmost
- The Collaboration scenario must expose controls named Go offline and Go online, a Shared editor field, and a Shared content region; two non-conflicting changes converge to the same visible content in either order without dropping either, and a conflict surfaces an explicit resolution choice
- End-state contract: Export PNG, Export project JSON / Download project JSON, and Copy project JSON MUST reflect the session's actual image and annotations compiled LIVE from the store — an export that omits session work is invalid; Import project MUST restore the same visible workspace (round-trip); WebMCP artifact export/import/copy surfaces the same final state without returning raw file, blob, or base64 contents in tool results
- Forms: every form, including Saved projects name, SnapshotCreate name, and Import project, validates through a Zod schema driven by TanStack Form for Solid that mirrors the API-shaped MarkupFlowProject, Annotation, SavedProjectCreate, and SnapshotCreate field contracts above (required fields, closed enums, bounds, geometry cross-field rules); inline per-field errors naming the field appear before submit; a generated project JSON IS the would-be request body; Download/Copy/Import validate through the same schema
- Seed nothing: the app starts blank on first load with an empty canvas and empty Layers panel; the user creates all data through the UI
- Styling: Tailwind CSS 4.3.2 (pinned) with the design tokens above defined in @theme; Kobalte components for the workspace chrome — selects, toggles, sliders, tooltips, and any dialogs; the canvas drawing, effects, and export logic remain hand-rolled Canvas 2D
- Animation: motion (the vanilla motion.dev package) is the only animation library allowed, supplemented by plain CSS transitions; no other animation libraries
- Icons: Tabler icons via the @tabler/icons-solidjs package only; no other icon sets, no raw copy-pasted SVG icon collections, no icon CDNs
- All libraries installed via npm and bundled locally; no CDN imports
- No backend, no authentication, no outbound navigation; the only route is /
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Editor object types: rectangle; oval; line; arrow; text; blur; pixelate; spotlight; loupe; highlighter
- Editor properties: color; stroke-width; text-style; font-size
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor modes: edit; preview
- Value bounds: {"font-size":[10,72],"stroke-width":["thin","medium","thick"],"text-style":["plain","bold-caption","outline","highlight-box","shadow"]}
- Entity: project
- Entity operations: create; select; update; delete
- Entity fields: name
- Artifact operations: export; import; copy
- Export formats: json; png
- Import modes: project-json

Mechanics exclusions:
- Shape/effect click-drag drawing and Loupe click placement stay Playwright-observed
- Layer-reorder drag-and-drop gesture stays Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
