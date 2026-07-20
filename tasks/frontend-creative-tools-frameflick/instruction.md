<summary>
Build a screenshot-dressing tool called FrameFlick using Vue 3, Pinia, Tailwind CSS 4.3.2, and Ark UI.
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
Feature: Workspace and views —
- The app opens directly at / into an editor workspace with a left panel (upload, recent strip, saved presets), a center canvas preview with export buttons, and a right panel of style controls; a header exposes an Editor tab and a Collaboration tab that switch views without a page reload.
Feature: Image upload —
- Upload accepts a PNG or JPG two ways: a drag-and-drop drop zone labelled with Drop PNG/JPG here and Choose image, and a file picker opened by clicking that zone; a chosen or dropped image loads onto the working canvas and renders live, and the zone then reads Replace image.
- Uploading a new image replaces the working canvas but keeps the currently selected style settings, unless the user picks a Recent thumbnail carrying its own saved settings.
Feature: Background —
- The Background panel shows at least 8 clickable preset background swatches (gradients and solids: Sunset, Ocean, Lime, Rose, Gold, Night, Mint, Slate, Peach); clicking a swatch re-renders the canvas background instantly behind the screenshot and marks that swatch selected with a check.
- A Custom toggle in the Background panel reveals a color picker plus a synced hex text input; setting either dials in a custom solid background color that overrides the active preset, and the picker and hex value stay in sync; picking a preset swatch afterward overrides the custom color again.
Feature: Composition controls —
- A Padding slider ranging 0 to 25 (percent of canvas size) controls the inset margin between the screenshot and the canvas edge; moving it updates the canvas live and the shown value is a whole percent; moving it back down decreases the margin again.
- A Corner radius slider ranging 0 to 48 (px) rounds the screenshot's own corners live; at 48 the corners are visibly rounded, at 0 they are sharp.
- A Shadow slider ranging 0 to 10 controls a drop shadow rendered behind the screenshot; its label reads None at 0 and progresses through Soft, Medium, Strong, Hard as the value rises, and the shadow visibly intensifies.
- A Frame style selector offers None, Browser, and Phone; Browser wraps the screenshot in a mock browser-chrome bar with three traffic-light dots and an address bar reading screenshot.png; Phone wraps it in a mock phone bezel; None leaves it unframed; switching removes the previous frame.
- A Canvas size control offers Square (1:1) 800x800, Widescreen (16:9) 1280x720, Story (9:16) 720x1280, and Original (image size); selecting a preset resizes the canvas to that aspect ratio and re-centers the composition.
- Displayed slider values are rounded to whole numbers or percentages while full precision is kept internally for canvas math.
Feature: Caption and watermark —
- A Caption text field renders an optional heading on the canvas; when text is present, controls appear for position Above or Below, a font-size slider 12 to 64 px, and a color picker with a synced hex input; the caption renders on the canvas reflecting the typed text, chosen size, position, and color.
- A Watermark toggle enables a small semi-transparent label; when enabled, a text input, a color picker with a synced hex input, an opacity slider 5 to 100 percent, and a four-corner selector (TL, TR, BL, BR) appear; the watermark renders in the chosen corner with the chosen color and its transparency tracks the opacity slider; turning the toggle off removes it.
Feature: Position and zoom —
- The screenshot can be dragged inside the canvas to reposition it, and arrow-key nudges plus on-screen move buttons (up, left, right, down) and a Reset position control also move it; a Zoom slider ranging 20 to 200 percent scales the screenshot itself while the canvas dimensions stay fixed.
Feature: Export —
- An Export scale control offers 1x, 2x (default), and 3x; Download PNG rasterizes the full composed canvas at the selected scale and triggers a file download named frameflick-export.png; a Copy image button copies the same rendered image to the clipboard and shows a transient Copied! confirmation; both export actions leave the on-screen composition unchanged.
- Two different style configurations produce visibly different exported PNGs: for example Night with padding 4 versus Ocean with padding 20 and Browser frame yield distinct downloaded compositions, proving the PNG carries the session's actual dressing rather than a static placeholder.
Feature: Style recipe export and import —
- The app produces the user's portable style recipe: a Download style JSON control downloads a structured JSON document compiled live from the current style settings named frameflick-style.json, and a Copy style JSON control copies that same JSON text to the clipboard and shows a transient Copied style! confirmation.
- An Export preview panel shows the live-compiled style JSON in a monospaced read-only block; mutating any style control updates the preview text without a reload.
- RenderSettings field contract (this object IS the would-be render-settings request body a composition API would accept; the Export preview, Download style JSON, Copy style JSON, and Import style JSON all conform to this same shape; field names and enum values are visible in the preview text; all keys below are required unless marked optional; example values are illustrative only):
  - backgroundPreset: exactly one of Sunset, Ocean, Lime, Rose, Gold, Night, Mint, Slate, Peach, or null when a custom solid is active
  - customBackground: null when a preset swatch is active, otherwise a hex string matching #RRGGBB
  - padding: integer 0 to 25
  - cornerRadius: integer 0 to 48
  - shadow: integer 0 to 10
  - frame: exactly one of None, Browser, Phone
  - canvasSize: exactly one of square, widescreen, story, original
  - captionText: string (empty string allowed)
  - captionPosition: exactly one of Above, Below
  - captionSize: integer 12 to 64
  - captionColor: hex string matching #RRGGBB
  - watermarkEnabled: boolean
  - watermarkText: string (empty string allowed)
  - watermarkColor: hex string matching #RRGGBB
  - watermarkOpacity: integer 5 to 100
  - watermarkCorner: exactly one of TL, TR, BL, BR
  - zoom: integer 20 to 200
  - positionX and positionY: finite numbers
  - exportScale: exactly one of 1, 2, 3
- Cross-field rules for RenderSettings: exactly one of (backgroundPreset is a named preset AND customBackground is null) or (backgroundPreset is null AND customBackground is a valid #RRGGBB); when watermarkEnabled is false, watermarkText, watermarkColor, watermarkOpacity, and watermarkCorner remain present in the payload with their last values but the canvas does not render a watermark; when watermarkEnabled is true, watermarkOpacity must stay in 5 to 100 and watermarkCorner must stay in TL|TR|BL|BR. After changing Night to Ocean and padding to 16, the Export preview and the downloaded style JSON both contain those exact values under those field names, and every required key from the field contract remains present.
- An Import style JSON control accepts a previously exported RenderSettings JSON (file pick or paste) and applies every included settings field to the canvas live; exporting then re-importing reconstructs the same visible style settings (background, padding, frame, caption, watermark including color, zoom, and related controls all match). Malformed JSON (unparseable) shows Invalid style JSON and leaves the canvas unchanged. Import that fails the field contract — missing a required key, frame/canvasSize/captionPosition/watermarkCorner/exportScale outside their closed enums, padding/cornerRadius/shadow/captionSize/watermarkOpacity/zoom outside their integer bounds, hex fields not matching #RRGGBB, or a backgroundPreset/customBackground cross-field violation — shows a visible error naming the offending field (or Invalid style JSON when the payload is unparseable) and changes nothing.
Feature: Undo and redo —
- Undo and Redo controls sit in the editor chrome and also respond to Ctrl+Z and Ctrl+Shift+Z (Cmd on macOS); both controls are disabled when their stack is empty.
- Undo reverses the most recent style mutation — background, padding, corner radius, shadow, frame, canvas size, caption, watermark, zoom, position, preset Apply, style import, snapshot Apply, or paste-settings — and restores the prior canvas look; Redo reapplies that mutation; performing a new mutation after undo clears the redo stack and disables Redo.
Feature: Before and after compare —
- A Before/After toggle compares the current dressed composition against the look captured when the current image was first loaded (or after Reset style); activating Before shows that earlier composition and returning to After shows the current dressed look without discarding current settings.
- A Reset style control restores background, padding, corner radius, shadow, frame, caption, watermark, zoom, and position to the defaults for a freshly uploaded image while keeping the current image on the canvas.
Feature: Style snapshots —
- SnapshotCreate field contract (the Save snapshot form submits exactly this payload; the record it creates IS the would-be request body): name (required trimmed non-empty string, max 40 characters, unique among Snapshots) plus settings (a RenderSettings object conforming to the field contract above, snapshotted from the live canvas). An empty, whitespace-only, over-length, or duplicate name shows an inline message naming the name field and adds no entry; each snapshot appears in a Snapshots list with Apply and Del; Apply restores every settings field; Del opens a confirm dialog before removing it.
Feature: Copy and paste settings —
- A Copy settings control captures the current style combination into an in-app settings clipboard; Paste settings opens a granular dialog with checkboxes for Background, Composition (padding, corner radius, shadow), Frame, Caption, and Watermark; confirming paste applies only the checked groups and leaves unchecked groups unchanged; after Copy settings then changing the canvas and pasting with only Background checked, only the background reverts while padding and frame stay at their changed values.
Feature: Saved presets —
- PresetCreate field contract (the Save preset form submits exactly this payload; the record it creates IS the would-be request body; Apply and persistence restore the same shape): name (required trimmed non-empty string, max 40 characters, unique among Saved presets case-sensitive after trim) plus settings (a RenderSettings object conforming to the field contract above, including watermarkColor and the backgroundPreset/customBackground cross-field rule). The save control stays disabled while the name field is empty; an empty, whitespace-only, over-length, or duplicate name shows an inline validation message naming the name field (duplicate uses Preset "name" already exists) and adds no entry.
- Each listed preset offers Apply (restores every stored settings field to the canvas) and Del (which opens a confirm dialog before removing it).
Feature: Recent strip —
- The last 6 processed images appear as thumbnails in a Recent strip, stored as compact data URLs; clicking a thumbnail reloads that image together with the settings that were last used on it, while first capturing the current settings onto the previously active image.
Feature: Collaboration scenario —
- A Collaboration tab opens a Collaboration scenario for the shared caption: a Shared editor labelled textarea, a simulated peer editor, connection controls that read Go offline and Go online, a queued-operations list shown while offline, and a converged region labelled Shared content.
- While offline, edits from each author are queued by stable operation identity and listed; going online applies the queued operations and merges both authors' non-conflicting changes so applying them in either order converges to the same visible Shared content without dropping a change; a genuine conflict surfaces an explicit choice (Use mine, Use theirs, Merge) rather than silently overwriting; an Apply to canvas button copies the converged content into the canvas caption.
</core_features>

<user_flows>
- After uploading an image, picking the Night swatch, setting padding to 12, and saving a preset named Warm Card, the Saved presets list count increases by exactly one, the new entry appears with Apply and Del controls, and a full page refresh restores the canvas settings, keeps Warm Card in the Saved presets list, and shows the uploaded image as a Recent thumbnail.
- After changing the background, padding, and frame style away from a saved preset, clicking that preset's Apply restores every stored setting to the canvas at once: the background, padding value, corner radius, shadow label, frame choice, caption, and watermark all revert to the stored combination and the live canvas re-renders to match without a reload.
- Deleting a preset through Del and its confirm dialog decreases the Saved presets count by exactly one, the removed entry disappears from the list, and after a full page refresh the deleted preset does not reappear.
- Uploading a second image adds a new thumbnail to the Recent strip (up to 6), and clicking the first image's thumbnail first captures the current settings onto the second image, then reloads the first image together with the settings last used on it; switching back and forth shows each image with its own settings and no reload.
- In the Collaboration scenario, clicking Go offline and making one edit in the Shared editor and one in the simulated peer editor grows the queued-operations list by one entry per edit; clicking Go online empties the queue, merges both changes into the Shared content region so either application order shows the same converged text, and clicking Apply to canvas then switching to the Editor tab shows that converged text as the canvas caption without a page reload.
- Style recipe end to end: after uploading an image, picking Ocean, setting padding to 16, enabling a Browser frame, typing a caption, and enabling a watermark with a distinct watermark color, the Export preview JSON contains those values under the RenderSettings field names (including watermarkColor) and still shows every required key; downloading frameflick-style.json then changing settings and importing that file restores Ocean, padding 16, Browser frame, the caption, and the watermark color without a page reload.
- Undo round trip: after changing the background from Night to Ocean and padding from 8 to 18, Undo restores Night and padding 8 on the canvas and in the Export preview JSON; Redo reapplies Ocean and padding 18.
- Before/After compare: after dressing an uploaded image, activating Before shows the earlier undressed look and returning to After shows the current dressed look with the same settings still applied.
- Copy/paste groups: after Copy settings on a Night-plus-Browser look, changing background and padding, then Paste settings with only Background checked restores Night while padding stays at the changed value.
</user_flows>

<edge_cases>
- An unsupported (non-image) file is rejected with a visible message reading Unsupported file type. Choose a PNG or JPG image, and the last valid canvas state is preserved.
- An invalid caption color, watermark color, or custom background hex value (not exactly # followed by six hexadecimal digits) shows Invalid color. Enter six hexadecimal digits after # as a named field error next to that hex input, and the canvas keeps rendering the last valid color.
- Saving a preset with an empty name is rejected with an inline message naming the name field and adds no entry to the Saved presets list.
- Saving a preset with a name that already exists shows Preset "name" already exists and leaves the list count unchanged rather than creating a duplicate record.
- Double-activating the preset save control creates exactly one preset: the Saved presets count increases by one and one new entry appears.
- Before any image is loaded, the canvas region shows a placeholder reading Upload an image to get started and export actions do not produce a broken or empty file state.
- Importing malformed style JSON shows a visible message reading Invalid style JSON and leaves the current canvas settings unchanged.
- Importing parseable JSON that fails the RenderSettings field contract — missing a required key, an out-of-enum frame/canvasSize/captionPosition/watermarkCorner/exportScale, an out-of-bounds padding/cornerRadius/shadow/captionSize/watermarkOpacity/zoom, a hex that is not #RRGGBB, or a backgroundPreset/customBackground cross-field violation — leaves the canvas unchanged and shows validation naming the offending field (or Invalid style JSON when the payload cannot be parsed).
- Undo with an empty history and Redo with an empty redo stack are disabled controls; activating them does nothing and produces no console errors.
- Saving a snapshot with an empty, whitespace-only, or over-length (over 40 characters) name adds no Snapshots entry and shows an inline message naming the name field.
- Saving a preset with a name over 40 characters shows an inline message naming the name field and leaves the Saved presets count unchanged.
- Pasting settings with every group unchecked applies nothing and leaves the canvas unchanged.
</edge_cases>

<visual_design>
- Warm amber-and-brown palette: page background is a soft cream, the header bar is deep brown (#713F12) with yellow (#FDE047) branding reading FrameFlick, and panels sit on off-white cards with hairline amber borders.
- Three-column editor layout on desktop: a fixed left tools column, a flexible center canvas stage on a warm tint, and a fixed right controls column.
- Color tokens exposed as CSS custom properties: --color-primary #FDE047, --color-accent #FDE047, --color-background #FFFFFF, --color-text-primary #713F12, --color-link #713F12.
- Font stack for both heading and body: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Noto Color Emoji"; primary heading and section headings at 16px.
- Base spacing unit 4px and base panel/card border radius 8px.
- Primary buttons are fully pill-shaped with background #FDE047 and text #713F12 and a soft layered inset-plus-outline shadow for depth; the selected background swatch, active frame option, and active toggle are highlighted with a yellow accent ring.
- The canvas preview sits in a rounded container with a soft drop shadow; a placeholder reading Upload an image to get started shows before any image is loaded.
- Panel section headers, move controls, export buttons, undo/redo, Before/After, and the connection controls carry icons from one consistent icon set used across the whole app.
- The Export preview shows style JSON in a monospaced read-only block; the paste-settings dialog lists the five group checkboxes with clear Confirm paste and Cancel actions.
</visual_design>

<motion>
- Background swatches, frame options, and preset thumbnails lift and gain a shadow on hover; the active option shows a persistent accent ring.
- Sliders update the canvas composition live as they are dragged, with no submit step.
- Dragging the screenshot shows a grabbing cursor and a Moving image status badge, and a blue outline appears around the canvas while dragging; releasing commits the position and pressing Escape mid-drag cancels it back to the drag-start position.
- The watermark toggle knob slides between off and on states; buttons ease their background and lift slightly on hover and press.
- Switching between the Editor and Collaboration tabs swaps the main view instantly without a full page reload, and the active tab is highlighted.
- The Copy image button briefly swaps its label to Copied! for about two seconds after a successful copy, then reverts; Copy style JSON briefly shows Copied style! the same way.
- Saving a preset or snapshot animates the new entry into its list, and confirming a delete animates the removed entry out rather than snapping.
- The Before/After toggle crossfades or swaps the canvas composition over a short eased transition rather than a hard cut; with prefers-reduced-motion set the swap is instant.
- A newly processed image's thumbnail animates into the Recent strip instead of appearing instantly.
- Inline validation messages and the Copied! confirmation appear with a brief eased transition rather than popping in.
- With prefers-reduced-motion set, list and feedback animations are removed and state changes apply instantly while every feature stays usable.
</motion>

<responsiveness>
- The three-column editor layout collapses to a single stacked column on narrow viewports, with the upload panel, canvas preview, and style controls all reachable by scrolling.
- At 375 pixel width no content clips or overflows the viewport, no horizontal scrolling appears, and sliders, swatches, both tabs, Export scale, undo/redo, and the paste-settings dialog remain fully usable.
</responsiveness>

<accessibility>
- Every interactive control is reachable and operable with the keyboard alone, with a visible focus indicator.
- The preset delete confirm dialog uses role dialog, traps focus while open, closes on Escape without deleting, and returns focus to the Del control that opened it.
- All sliders (padding, corner radius, shadow, caption size, watermark opacity, zoom) are adjustable with the arrow keys while focused, and the displayed value updates as they change.
- The screenshot position is adjustable without a pointer: arrow-key nudges and the on-screen move buttons perform the same moves as dragging.
- The entire Collaboration scenario, including Go offline, Go online, the conflict choices, and Apply to canvas, is keyboard-operable.
- Undo, Redo, Before/After, Reset style, Copy settings, Paste settings, Download style JSON, Import style JSON, and snapshot Save/Apply/Del are keyboard-operable; the paste-settings dialog and snapshot delete confirm trap focus, close on Escape, and return focus to the control that opened them.
- Validation and rejection messages are announced through an aria-live polite region as well as shown visually.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- No console errors or warnings appear during a full exercise of upload, styling, export, style JSON import/export, undo/redo, presets, snapshots, and the Collaboration scenario.
- Dragging any slider re-renders the canvas live with no visible lag or dropped updates, and rapid repeated preset saves, deletes, and undo/redo keep the UI responsive with no blank screen or freeze.
</performance>

<writing>
- Headings and buttons use one consistent capitalization convention throughout the app.
- Action labels are specific verbs such as Save preset, Apply to canvas, Download PNG, Download style JSON, Copy style JSON, Import style JSON, Copy settings, Paste settings, Before/After, and Reset style rather than generic labels where a specific one is possible.
- Error messages name the problem and the fix (including Invalid style JSON and named hex field errors); empty states explain what belongs there and how to add it; no placeholder or lorem text appears anywhere in the shipped UI.
</writing>

<innovation>
- Optional enhancements are welcome where they do not conflict with the specified behaviors: a keyboard command palette for applying presets or jumping to Export/Collaboration, a live histogram or luminance readout of the composed canvas, or a subtle celebration when a style recipe is downloaded; any enhancement must not interfere with required flows.
</innovation>

<requirements>
- Framework and stack: Vue 3 as a client-rendered Vite single-page app using Single-File Components and the Composition API; all shared application state in Pinia stores (canvas settings, saved presets, snapshots, recent strip, active tab, collaboration state, undo/redo stacks, in-app settings clipboard, before/after baseline, export scale, and live style-recipe export text) — views derive from that one store and never keep a second disconnected copy; styling with Tailwind CSS 4.3.2 (pinned) with the design tokens defined in the theme layer; Node.js 20. No backend, no authentication, no routes other than /.
- Ark UI (Vue) is the component library: use it for the dialogs (the preset delete confirm), the Editor/Collaboration tabs, sliders, toggles and switches, and selects rather than hand-rolled primitives. No other component library is added.
- @vueuse/motion is allowed for animation; no other animation libraries. Phosphor icons via the @phosphor-icons/vue package only — no other icon sets, no raw pasted SVGs, and no icon CDNs.
- All forms — the preset save form, snapshot save form, caption and watermark inputs (including watermark color hex), custom background hex, style JSON import, and collaboration inputs — validate through VeeValidate paired with a Zod schema: the schema defines the rules and inline per-field errors appear before submit, with submit controls disabled until the fields are valid. Schemas are API-shaped: they model the PresetCreate, SnapshotCreate, and RenderSettings payload shapes a composition API would accept (the record Save preset / Save snapshot creates IS the would-be request body; style JSON export and import conform to the same RenderSettings field contract, including closed enums, integer bounds, #RRGGBB hex formats, and the backgroundPreset/customBackground cross-field rule). Hex fields that fail the #RRGGBB format show Invalid color. Enter six hexadecimal digits after # as a named field error next to the hex input, never only a generic schema failure.
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- All image composition (backgrounds, padding, corner rounding, shadows, device frames, captions, watermark, and export) must be implemented with the Canvas 2D API in your own TypeScript; no image-processing library is used. Uploaded images and Recent thumbnails are stored as compact data URLs.
- The yjs library (13.6.31) is available and is used for the concurrent-merge Collaboration scenario.
- Persistence via localStorage is required and must be guarded so the production build does not crash when storage is unavailable. The following must all survive a full page refresh and be restored exactly: the active canvas settings (image, background/custom color, padding, corner radius, shadow, frame, canvas size, caption text/position/size/color, watermark enabled/text/opacity/corner/color, zoom, position), the Saved presets list, the Snapshots list, and the Recent uploads strip. Deleted presets and snapshots must not reappear after a refresh. Undo and redo stacks reset on refresh.
- Persistence contract examples: after uploading an image, adjusting settings, saving a named preset, and saving a named snapshot, a full refresh restores the canvas settings, keeps the preset and snapshot in their lists, and shows the uploaded image as a Recent thumbnail; the stored image data is a compact data URL, not raw binary.
- Useful end state: the session's work product is the dressed PNG (Download PNG / Copy image at the chosen export scale) plus the portable style recipe (Download style JSON / Copy style JSON / Import style JSON with round-trip); both must reflect live session mutations and the style JSON must carry every required key from the RenderSettings field contract above.
- Application depth: expose a primary collection (Saved presets) with create, apply, and delete; provide at least two distinct views (the Editor and the Collaboration scenario); and domain-specific canvas state beyond CRUD including undo/redo, before/after compare, snapshots, copy/paste settings groups, and style-recipe export. In one uninterrupted session a user can create and apply presets, revise settings, recompute the live render, export artifacts, and reset position without stale intermediate state.
- Rapid-use robustness: the Saved presets workflow must withstand 25 rapid deterministic repetitions through its normal controls with an exact final count, responsive controls, and no blank screen, uncaught error, or sustained freeze.
- Adversarial baseline: reject invalid or extreme input (unsupported upload type, empty preset name, invalid caption hex) with specific visible feedback without damaging the last valid state, and make duplicate saves idempotent by name rather than creating duplicate records.
- Concurrent-merge scenario: the Collaboration scenario must queue two independently authored changes, apply them in either order, and simulate an offline reconnect, merging by stable operation identity so both orders converge to the same visible Shared content without dropping a non-conflicting change; conflicts must surface an explicit user choice instead of a silent overwrite; the scenario uses visible controls named Go offline and Go online, an editor labelled Shared editor, and a converged region labelled Shared content, and is keyboard-operable.
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
- Editor operations: update_property; switch_mode; set_content; preview
- Editor properties: background; custom-background; padding; corner-radius; shadow; frame-style; caption-text; caption-position; caption-size; caption-color; watermark; watermark-text; watermark-color; watermark-opacity; watermark-corner; zoom; export-scale
- Editor modes: square; widescreen; story; original
- Value bounds: padding 0-25; corner-radius 0-48; shadow 0-10; caption-size 12-64; watermark-opacity 5-100; zoom 20-200
- Entity: preset
- Entity operations: create; select; delete
- Entity fields: name; settings
- Artifact operations: export; import; copy
- Export formats: style-json; png
- Import modes: style-json

Mechanics exclusions:
- Drag-to-reposition and the Zoom slider gesture stay Playwright-only
- Drag-and-drop upload stays Playwright-observed
- Live canvas render fidelity, Download PNG rasterization at the chosen scale, and Copy Image clipboard stay Playwright-only
- Collaboration Scenario merge convergence stays Playwright-only
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
