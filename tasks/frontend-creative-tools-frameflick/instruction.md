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
- A Watermark toggle enables a small semi-transparent label; when enabled, a text input, an opacity slider 5 to 100 percent, and a four-corner selector (TL, TR, BL, BR) appear; the watermark renders in the chosen corner and its transparency tracks the opacity slider; turning the toggle off removes it.
Feature: Position and zoom —
- The screenshot can be dragged inside the canvas to reposition it, and arrow-key nudges plus on-screen move buttons (up, left, right, down) and a Reset position control also move it; a Zoom slider ranging 20 to 200 percent scales the screenshot itself while the canvas dimensions stay fixed.
Feature: Export —
- A Download PNG button rasterizes the full composed canvas at 2x resolution and triggers a file download named frameflick-export.png; a Copy image button copies the same rendered image to the clipboard and shows a transient Copied! confirmation; both export actions leave the on-screen composition unchanged.
Feature: Saved presets —
- A Save preset control offers a name field and stores the current combination of background, padding, corner radius, shadow, frame, caption, and watermark settings under the given name into a persistent Saved presets list; the save control stays disabled while the name field is empty, and an inline validation message naming the name field appears before submit when the field is invalid.
- Each listed preset offers Apply (restores every stored setting to the canvas) and Del (which opens a confirm dialog before removing it).
Feature: Recent strip —
- The last 6 processed images appear as thumbnails in a Recent strip, stored as compact data URLs; clicking a thumbnail reloads that image together with the settings that were last used on it, while first capturing the current settings onto the previously active image.
Feature: Collaboration scenario —
- A Collaboration tab opens a Collaboration scenario for the shared caption: a Shared editor labelled textarea, a simulated peer editor, connection controls that read Go offline and Go online, a queued-operations list shown while offline, and a converged region labelled Shared content.
- While offline, edits from each author are queued by stable operation identity and listed; going online applies the queued operations and merges both authors' non-conflicting changes so applying them in either order converges to the same visible Shared content without dropping a change; a genuine conflict surfaces an explicit choice (Use mine, Use theirs, Merge) rather than silently overwriting; an Apply to canvas button copies the converged content into the canvas caption.
</core_features>

<user_flows>
- After uploading an image, picking the Night swatch, setting padding to 12, and saving a preset named Warm Card, the Saved presets list count increases by exactly one, the new entry appears with Apply and Del controls, and a full page refresh restores the canvas settings, keeps Warm Card in the Saved presets list, and shows the uploaded image as a Recent thumbnail.
- After changing several settings away from a saved preset, clicking that preset's Apply restores every stored setting to the canvas at once: the background, padding value, corner radius, shadow label, frame choice, caption, and watermark all revert to the stored combination and the live canvas re-renders to match without a reload.
- Deleting a preset through Del and its confirm dialog decreases the Saved presets count by exactly one, the removed entry disappears from the list, and after a full page refresh the deleted preset does not reappear.
- Uploading a second image adds a new thumbnail to the Recent strip (up to 6), and clicking the first image's thumbnail first captures the current settings onto the second image, then reloads the first image together with the settings last used on it; switching back and forth shows each image with its own settings and no reload.
- In the Collaboration scenario, clicking Go offline and making one edit in the Shared editor and one in the simulated peer editor grows the queued-operations list by one entry per edit; clicking Go online empties the queue, merges both changes into the Shared content region so either application order shows the same converged text, and clicking Apply to canvas then switching to the Editor tab shows that converged text as the canvas caption without a page reload.
</user_flows>

<edge_cases>
- An unsupported (non-image) file is rejected with a visible message reading Unsupported file type. Choose a PNG or JPG image, and the last valid canvas state is preserved.
- An invalid caption or watermark hex value shows Invalid color. Enter six hexadecimal digits after # and the canvas keeps rendering the last valid color.
- Saving a preset with an empty name is rejected with an inline message naming the name field and adds no entry to the Saved presets list.
- Saving a preset with a name that already exists shows Preset "name" already exists and leaves the list count unchanged rather than creating a duplicate record.
- Double-activating the preset save control creates exactly one preset: the Saved presets count increases by one and one new entry appears.
- Before any image is loaded, the canvas region shows a placeholder reading Upload an image to get started and export actions do not produce a broken or empty file state.
</edge_cases>

<visual_design>
- Warm amber-and-brown palette: page background is a soft cream, the header bar is deep brown (#713F12) with yellow (#FDE047) branding reading FrameFlick, and panels sit on off-white cards with hairline amber borders.
- Three-column editor layout on desktop: a fixed left tools column, a flexible center canvas stage on a warm tint, and a fixed right controls column.
- Color tokens exposed as CSS custom properties: --color-primary #FDE047, --color-accent #FDE047, --color-background #FFFFFF, --color-text-primary #713F12, --color-link #713F12.
- Font stack for both heading and body: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Noto Color Emoji"; primary heading and section headings at 16px.
- Base spacing unit 4px and base panel/card border radius 8px.
- Primary buttons are fully pill-shaped with background #FDE047 and text #713F12 and a soft layered inset-plus-outline shadow for depth; the selected background swatch, active frame option, and active toggle are highlighted with a yellow accent ring.
- The canvas preview sits in a rounded container with a soft drop shadow; a placeholder reading Upload an image to get started shows before any image is loaded.
- Panel section headers, move controls, export buttons, and the connection controls carry icons from one consistent icon set used across the whole app.
</visual_design>

<motion>
- Background swatches, frame options, and preset thumbnails lift and gain a shadow on hover; the active option shows a persistent accent ring.
- Sliders update the canvas composition live as they are dragged, with no submit step.
- Dragging the screenshot shows a grabbing cursor and a Moving image status badge, and a blue outline appears around the canvas while dragging; releasing commits the position and pressing Escape mid-drag cancels it back to the drag-start position.
- The watermark toggle knob slides between off and on states; buttons ease their background and lift slightly on hover and press.
- Switching between the Editor and Collaboration tabs swaps the main view instantly without a full page reload, and the active tab is highlighted.
- The Copy image button briefly swaps its label to Copied! for about two seconds after a successful copy, then reverts.
- Saving a preset animates the new entry into the Saved presets list, and confirming a delete animates the removed entry out rather than snapping.
- A newly processed image's thumbnail animates into the Recent strip instead of appearing instantly.
- Inline validation messages and the Copied! confirmation appear with a brief eased transition rather than popping in.
- With prefers-reduced-motion set, list and feedback animations are removed and state changes apply instantly while every feature stays usable.
</motion>

<responsiveness>
- The three-column editor layout collapses to a single stacked column on narrow viewports, with the upload panel, canvas preview, and style controls all reachable by scrolling.
- At 375 pixel width no content clips or overflows the viewport, no horizontal scrolling appears, and sliders, swatches, and both tabs remain fully usable.
</responsiveness>

<accessibility>
- Every interactive control is reachable and operable with the keyboard alone, with a visible focus indicator.
- The preset delete confirm dialog uses role dialog, traps focus while open, closes on Escape without deleting, and returns focus to the Del control that opened it.
- All sliders (padding, corner radius, shadow, caption size, watermark opacity, zoom) are adjustable with the arrow keys while focused, and the displayed value updates as they change.
- The screenshot position is adjustable without a pointer: arrow-key nudges and the on-screen move buttons perform the same moves as dragging.
- The entire Collaboration scenario, including Go offline, Go online, the conflict choices, and Apply to canvas, is keyboard-operable.
- Validation and rejection messages are announced through an aria-live polite region as well as shown visually.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- No console errors or warnings appear during a full exercise of upload, styling, export, presets, and the Collaboration scenario.
- Dragging any slider re-renders the canvas live with no visible lag or dropped updates, and rapid repeated preset saves and deletes keep the UI responsive with no blank screen or freeze.
</performance>

<writing>
- Headings and buttons use one consistent capitalization convention throughout the app.
- Action labels are specific verbs such as Save preset, Apply to canvas, and Download PNG rather than generic labels where a specific one is possible.
- Error messages name the problem and the fix; empty states explain what belongs there and how to add it; no placeholder or lorem text appears anywhere in the shipped UI.
</writing>

<requirements>
- Framework and stack: Vue 3 as a client-rendered Vite single-page app using Single-File Components and the Composition API; all shared application state in Pinia stores (canvas settings, saved presets, recent strip, active tab, and collaboration state) — views derive from that one store and never keep a second disconnected copy; styling with Tailwind CSS 4.3.2 (pinned) with the design tokens defined in the theme layer; Node.js 20. No backend, no authentication, no routes other than /.
- Ark UI (Vue) is the component library: use it for the dialogs (the preset delete confirm), the Editor/Collaboration tabs, sliders, toggles and switches, and selects rather than hand-rolled primitives. No other component library is added.
- @vueuse/motion is allowed for animation; no other animation libraries. Phosphor icons via the @phosphor-icons/vue package only — no other icon sets, no raw pasted SVGs, and no icon CDNs.
- All forms — the preset save form and the caption, watermark, and collaboration inputs — validate through VeeValidate paired with a Zod schema: the schema defines the rules and inline per-field errors appear before submit, with submit controls disabled until the fields are valid.
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- All image composition (backgrounds, padding, corner rounding, shadows, device frames, captions, watermark, and export) must be implemented with the Canvas 2D API in your own TypeScript; no image-processing library is used. Uploaded images and Recent thumbnails are stored as compact data URLs.
- The yjs library (13.6.31) is available and is used for the concurrent-merge Collaboration scenario.
- Persistence via localStorage is required and must be guarded so the production build does not crash when storage is unavailable. The following must all survive a full page refresh and be restored exactly: the active canvas settings (image, background/custom color, padding, corner radius, shadow, frame, canvas size, caption text/position/size/color, watermark enabled/text/opacity/corner, zoom, position), the Saved presets list, and the Recent uploads strip. Deleted presets must not reappear after a refresh.
- Persistence contract examples: after uploading an image, adjusting settings, and saving a named preset, a full refresh restores the canvas settings, keeps the saved preset in the Saved presets list, and shows the uploaded image as a Recent thumbnail; the stored image data is a compact data URL, not raw binary.
- Application depth: expose a primary collection (Saved presets) with create, apply, and delete; provide at least two distinct views (the Editor and the Collaboration scenario); and domain-specific canvas state beyond CRUD. In one uninterrupted session a user can create and apply presets, revise settings, recompute the live render, and reset position without stale intermediate state.
- Rapid-use robustness: the Saved presets workflow must withstand 25 rapid deterministic repetitions through its normal controls with an exact final count, responsive controls, and no blank screen, uncaught error, or sustained freeze.
- Adversarial baseline: reject invalid or extreme input (unsupported upload type, empty preset name, invalid caption hex) with specific visible feedback without damaging the last valid state, and make duplicate saves idempotent by name rather than creating duplicate records.
- Concurrent-merge scenario: the Collaboration scenario must queue two independently authored changes, apply them in either order, and simulate an offline reconnect, merging by stable operation identity so both orders converge to the same visible Shared content without dropping a non-conflicting change; conflicts must surface an explicit user choice instead of a silent overwrite; the scenario uses visible controls named Go offline and Go online, an editor labelled Shared editor, and a converged region labelled Shared content, and is keyboard-operable.
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
- Editor operations: update_property; switch_mode; set_content; preview
- Editor properties: background; custom-background; padding; corner-radius; shadow; frame-style; caption-text; caption-position; caption-size; caption-color; watermark; watermark-text; watermark-opacity; watermark-corner; zoom
- Editor modes: square; widescreen; story; original
- Value bounds: padding 0-25; corner-radius 0-48; shadow 0-10; caption-size 12-64; watermark-opacity 5-100; zoom 20-200
- Entity: preset
- Entity operations: create; select; delete
- Entity fields: name; settings

Mechanics exclusions:
- Drag-to-reposition and the Zoom slider gesture stay Playwright-only
- Drag-and-drop upload stays Playwright-observed
- Live canvas render fidelity, Download PNG 2x rasterization, and Copy Image clipboard stay Playwright-only
- Collaboration Scenario merge convergence stays Playwright-only

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
