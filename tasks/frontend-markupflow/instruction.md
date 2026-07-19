<summary>
Build a MarkupFlow image annotation studio using Solid.js, Solid stores, and Tailwind CSS.
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
- The app opens directly at / into a dark annotation workspace: a header (MarkupFlow title, edit/preview view buttons, Reset workspace, theme toggle, Undo, Redo, Export PNG), a left tool rail grouped into Shapes, Effects, and Style sections, a central canvas region, and a right Layers panel — no backend, no login, no outbound navigation
- Before any image is loaded the canvas region shows an empty state: a dashed drop zone reading Drop an image here with a Choose image button and a Try sample image button, both clearly visible
- Clicking Try sample image immediately draws a built-in demo scene onto a fixed-size canvas so the tool is usable without uploading; loading a file by clicking Choose image or dragging an image file onto the drop zone reads it entirely in the browser and renders it on the canvas, and the image never leaves the browser
- The Shapes section exposes Rectangle, Oval, Line, and Arrow tools; with the tool selected, click-dragging on the canvas draws that shape at the dragged position and size and it persists the instant the pointer is released — Rectangle draws a rectangle, Oval draws an ellipse, Line draws a straight segment, and Arrow draws a segment ending in a filled arrowhead, so the four are visually distinct
- The Text tool places an editable text box where the canvas is clicked and shows an inline text input plus a style bar offering five named styles (Plain, Bold caption, Outline, Highlight box, Shadow) and a font-size slider from 10 to 72; typing changes the rendered text live, switching style visibly changes its appearance, and changing the slider visibly changes its size
- The Effects section provides Blur, Pixelate, Spotlight, Loupe, and Highlighter tools: Blur click-drag permanently blurs the pixels under a rectangle, Pixelate applies a mosaic under a rectangle visibly distinct from Blur, Spotlight click-drag dims everything outside an oval, Loupe click drops a magnifier callout showing a zoomed circular view joined to the source point by a thin line, and Highlighter drag lays a translucent colored band
- The Style section offers a palette of 12 preset color swatches plus a custom color input and a Thin/Medium/Thick stroke selector; the active color and stroke apply to the next shape drawn, and a shape drawn with Thick shows a visibly thicker stroke than one drawn with Thin
- The Layers panel lists every annotation in creation order by type label with a color chip and index; each row has a Delete control that removes only that annotation from the list and the canvas, and clicking a row (not its Delete) selects it and draws a dashed selection outline around the matching annotation on the canvas
- Each Layers row is draggable via native drag-and-drop and also carries up and down move buttons; while a row is dragged it shows a distinct drag state (reduced opacity and elevated shadow) and a drop-position indicator (an accent top border) appears on the row under the pointer; dropping moves the row and immediately re-renders the canvas stacking order so the topmost Layers row renders frontmost
- Undo and Redo buttons step backward and forward through annotation history and are also driven by Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y); each button is visibly disabled when there is nothing to undo or redo, and adding a new annotation after an undo discards the redo branch (Redo returns to disabled)
- Export PNG flattens the base image, the destructive effects, and the overlay annotations into a single PNG and triggers a client-side download from an in-browser Blob with no network upload
- The Saved projects panel lets the user name and save the current image plus its annotation list as a project, then Open, Update, or Delete any saved project row; opening a project restores its image and annotations onto the canvas
- A Collaboration scenario panel provides a Shared editor textarea, a remote-editor textarea, Go offline and Go online controls, and a Shared content region; two independently authored non-conflicting edits both appear in the converged Shared content regardless of apply order, and creating a conflict surfaces an explicit Keep local / Keep remote / Merge both choice instead of silently overwriting
- The header edit and preview view buttons switch the workspace mode: preview mode hides the tool rail to show the annotated result, edit mode restores it; the active view button is visibly marked
</core_features>

<visual_design>
- Dark workspace theme using these tokens: background #1F242E, surface panels #2A303B, borders #3A414D, primary text #F3F4F6, secondary text #9CA3AF, primary action #0000EE, active-tool accent #0079FD with white contrast; a light theme is also available via the header toggle and every pairing stays legible after switching
- Three-region layout: a fixed left tool rail (~88px on wide screens) with Shapes, Effects, and Style groups separated by hairline dividers, a flexible central canvas region that centers the image, and a right Layers panel (~256-288px) holding the layer list, Saved projects, and Collaboration scenario
- Toolbar section labels (Shapes, Effects, Style) render at ~11-13px, semi-bold, uppercase, muted; the Layers heading renders larger and bolder (~16-18px, weight 700); all UI text uses the Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif stack
- Toolbar buttons are square with 8px radius, transparent at rest and surface-colored on hover; the active tool uses the accent background with a white icon and a check mark; the Export PNG button uses the primary color with white text; panels use 12px radius, surface background, and a 1px border
- Spacing follows a 4px base scale (4/8/12/16/24); the selected color swatch shows a ring/check indicator; Undo and Redo show a dimmed disabled appearance when inactive
- Responsive: at ~375px width the layout stacks vertically without horizontal page scrolling and the tool rail becomes horizontally scrollable rather than wrapping awkwardly; the empty Layers panel shows a friendly message rather than a blank list
</visual_design>

<motion>
- Every toolbar button, palette swatch, stroke button, and Layers row shows a visible hover state and a clear keyboard-focus outline distinct from rest
- Selecting a tool updates the active-tool highlight immediately with no stale highlight left on the previous tool; each annotation appears the instant the pointer is released with no separate apply step
- The theme toggle recolors every surface; the shape drawing shows a live dashed preview that follows the pointer while dragging and commits on release
- While a Layers row is dragged it takes reduced opacity and elevated shadow and the target row shows an accent drop-position border; on drop the canvas re-renders in the new stacking order
- The Collaboration scenario shows a Syncing... pulse while reconnecting and a pending-changes note while offline
- View switching and all state changes update the canvas in place without a full page reload
</motion>

<requirements>
- Shared application state must use Solid stores (createStore) as named in the summary: the annotations collection, active image, active tool, active color and stroke and text style and font size, undo and redo stacks, current selection, saved projects, and collaboration state
- Persistence is mandated: the current image (as a data URL) and its full annotation list, plus the saved-projects collection, must survive a full page refresh via localStorage; guard reads so a missing or corrupt saved value falls back to a clean empty workspace without crashing
- Adding an annotation increases the collection and pushes an undo snapshot; deleting removes it from the list, canvas, and selection; updating the selected annotation's color, stroke, text style, or font size changes it in place; reordering the list changes the canvas stacking order and survives reload
- Undo restores the previous annotation snapshot and enables Redo; Redo reapplies it; performing a new add after an undo clears the redo stack; both buttons reflect their availability with a visible disabled state; Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y drive the same history
- Shape tools map drawn client coordinates into image coordinates so annotations stay correctly placed and scaled when the canvas is resized or reloaded; the Loupe is placed by a single click, all other shape and effect tools by click-drag; a drag shorter than a small threshold does not create an annotation
- Blur, Pixelate, and Spotlight are destructive effects re-applied to the base image on every render and after reload; overlay annotations (shapes, text, arrow, loupe, highlighter) render on a separate layer in reverse list order so the topmost Layers row is frontmost
- The Collaboration scenario must expose controls named Go offline and Go online, a Shared editor field, and a Shared content region; two non-conflicting changes converge to the same visible content in either order without dropping either, and a conflict surfaces an explicit resolution choice
- Export PNG must flatten image plus effects plus annotations to a single PNG via a client-side Blob download with no upload; images are read and annotated entirely client-side and never uploaded anywhere
- Seed nothing: the app starts blank on first load with an empty canvas and empty Layers panel; the user creates all data through the UI
- No backend, no authentication, no outbound navigation; the only route is /; no component libraries beyond Tailwind; hand-rolled canvas logic only
- At ~375px width the page must not scroll horizontally and the tool rail must scroll horizontally instead of overflowing
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

Bindings:
- Editor object types: rectangle; oval; line; arrow; text; blur; pixelate; spotlight; loupe; highlighter
- Editor properties: color; stroke-width; text-style; font-size
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor modes: edit; preview
- Value bounds: {"font-size":[10,72],"stroke-width":["thin","medium","thick"],"text-style":["plain","bold-caption","outline","highlight-box","shadow"]}
- Entity: project
- Entity operations: create; select; update; delete
- Entity fields: name

Mechanics exclusions:
- Shape/effect click-drag drawing and Loupe click placement stay Playwright-observed
- Layer-reorder drag-and-drop gesture stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
