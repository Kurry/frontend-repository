<summary>
Build a CSS theme builder using Vue 3, Pinia, Tailwind CSS 4.3.2, and Reka UI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Site chrome —
- The top chrome shows an announce strip, a brand mark, a version dropdown, a chrome theme-picker dropdown (light / dark / cupcake / synthwave), a language dropdown (EN / ES / FR / JA), and a stars / docs / components control cluster; the dropdowns open in place without navigating, and choosing a chrome theme option recolors the app shell and marks that option active
Feature: Themes sidebar —
- The sidebar carries a press-and-hold Hold to add theme control (~0.7s: a progress fill sweeps across the button and, on completion, adds a new custom theme; releasing early cancels and adds nothing), a My themes list (custom collection, showing an empty-state hint when none exist), and a built-in catalog of exactly 35 presets (light, dark, cupcake … silk)
- Every theme row shows a four-swatch chip (primary / secondary / accent / neutral) plus the theme name, the active row is highlighted, and clicking a row applies that theme's name + tokens to the editor and live preview
- Custom themes support create (hold-to-add or an equivalent New action), rename, Duplicate, per-token edits, Reset, and Remove; built-in presets cannot be removed and editing a built-in forks an editable custom copy rather than mutating the preset in place
- With a custom theme active, Duplicate adds exactly one new My themes row whose tokens match the source, selects the duplicate, and leaves the source row intact
Feature: Theme editor —
- The editor carries the required anatomy: an editable name field, Undo and Redo, Random, Export, Change Colors (11 semantic face rows — base-100, base-200, base-300, primary, secondary, accent, neutral, info, success, warning, error — each with a face color picker and a content A badge; base-100/base-200/base-300 share one paired base-content via their content A control, and the other eight each have their own paired content color), Radius (Boxes / Fields / Selectors, each a choice among 5 preset radii from 0rem to 2rem), Effects (Depth and Noise, each an Off / On toggle), Sizes (Fields and Selectors, each a 5-step xs–xl scale, plus a Border Width choice of 4 widths), Options (Default theme, Default dark theme, and Dark color scheme checkboxes, with Reset theme and Remove theme actions), a Contrast panel, and a Snapshots section with Save snapshot and Before / After
- Editing any token — a color swatch, a radius, a size, the border width, a depth/noise toggle, or the dark-color-scheme option — immediately re-themes the live preview with no reload
- Clicking Random replaces the theme's color tokens with a fresh randomized OKLCH set (and a random light/dark scheme), re-themes the preview, and shows a brief confirmation toast
- The theme name field and rename flow validate inline: a validation message naming the name field appears before submit when the value is empty, whitespace-only, longer than 64 characters, or contains characters outside lowercase letters, digits, hyphens, and underscores, and the invalid value is not applied
- Undo restores the previous token or list mutation in editor, list swatches, preview, Contrast, and Export; Redo reapplies it; Undo and Redo are visibly disabled when their stacks are empty; a new edit after Undo clears the redo stack
Feature: Contrast and vision —
- The Contrast panel lists every face/content pair from the 11 Change Colors rows with a live numeric contrast ratio plus AA and AAA pass/fail badges; changing a face or content color immediately updates that pair's ratio and badges, and failing pairs show a distinct warning treatment
- A vision-mode control on the preview chrome offers at least None and Deuteranopia; choosing Deuteranopia applies a client-side color-vision simulation to the preview pane only while editor swatches stay unfiltered; choosing None clears the simulation
Feature: Snapshots —
- SnapshotCreate field contract (the Save snapshot form submits exactly this payload; the record it creates IS the would-be request body): name (required trimmed non-empty string, max 64 characters) plus theme (a Theme JSON object conforming to the Theme JSON field contract below, snapshotted from the active theme). An empty, whitespace-only, or over-length name shows validation naming the name field and adds nothing; each snapshot appears in a Snapshots list; restoring a snapshot writes those tokens into editor and preview; after further edits, Before / After flips the preview between the snapshot tokens and the live edits without losing either set
Feature: Live preview —
- At least two interaction modes: Editor/Generator mode (token controls) and Live Preview mode with three tabs — Components Demo (a dense grid of ~9 component cards: badges/filters, a calendar list, tabs and range, a product card, a registration form, stats + radial progress, an orders table, a chat + code mockup, and pricing), Component Variants (button color variants, form controls, and alert states), and Color Palette (16 token swatches, each showing the token name and its value) — switching tabs swaps the pane in place and re-themes immediately as tokens change
Feature: Theme files export and import (useful end state) —
- The app produces the user's theme files: Export opens a modal with three format tabs regenerated live from the active theme — CSS ([data-theme="name"] { … } custom-properties block), Theme JSON (the API-shaped theme definition object), and theme-extension (a Tailwind @theme / config snippet that declares the same tokens). Each tab shows a scrollable preview; Copy writes that format's text to the clipboard with a brief confirmation; Download triggers a real file download whose contents match the open preview; Close, the backdrop, or Escape dismiss the modal
- Theme JSON field contract (this object IS the would-be theme-definition request body a theme API would accept; create/rename/token forms produce this same record; CSS, Theme JSON, and theme-extension exports are derived from it; Import accepts and validates against it; field names and enum values are visible in the Theme JSON preview text; all keys below are required unless marked optional; example values are illustrative only):
  - name: required trimmed non-empty string, max 64 characters, characters limited to lowercase a-z, digits 0-9, hyphen, and underscore
  - color-scheme: exactly one of light or dark
  - --color-base-100, --color-base-200, --color-base-300, --color-base-content, --color-primary, --color-primary-content, --color-secondary, --color-secondary-content, --color-accent, --color-accent-content, --color-neutral, --color-neutral-content, --color-info, --color-info-content, --color-success, --color-success-content, --color-warning, --color-warning-content, --color-error, --color-error-content: each a non-empty color string matching either oklch(...) or #RRGGBB (twenty color keys total)
  - --radius-box, --radius-field, --radius-selector: each exactly one of 0rem, 0.25rem, 0.5rem, 1rem, 2rem
  - --size-field, --size-selector: each exactly one of 0.1875rem, 0.21875rem, 0.25rem, 0.28125rem, 0.3125rem (UI labels xs / sm / md / lg / xl map one-to-one onto this closed size-step enum)
  - --border: exactly one of 0.5px, 1px, 1.5px, 2px
  - --depth, --noise: each exactly 0 or 1
- Cross-field rules for Theme JSON: when Dark color scheme is checked in Options, color-scheme is dark; when unchecked, color-scheme is light; after toggling the option, the Theme JSON preview updates that field without reload. After editing primary and Radius Boxes, every Export tab's preview text contains those edited values, and Theme JSON still shows every required key from this contract
- An Import theme control accepts a previously exported Theme JSON document (file pick or paste) and applies name plus tokens to the active custom theme (or creates/selects a custom theme as needed); exporting then re-importing reconstructs the same visible name and tokens in editor, My themes swatches, preview, Contrast, and all three Export format previews. Malformed JSON (unparseable) shows visible validation and leaves My themes, editor, preview, and Export unchanged. Import that fails the Theme JSON field contract — missing a required key, a --color-* value that is empty or neither oklch(...) nor #RRGGBB, color-scheme outside light|dark, a radius/size/border/depth/noise value outside its closed enum, an empty or illegal name, or a color-scheme / Dark-option cross-field disagreement — shows validation naming the offending field and changes nothing
Feature: Shareable theme payload —
- The active theme is encoded into a compressed same-document #theme= URL hash (JSON → deflate → URL-safe Base64) that updates as the theme changes; loading a URL that carries a #theme= payload decodes and applies that theme on first paint
- Zero real navigation after settle — same-document hash theme payload allowed; chrome anchors become inert buttons after hydration
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says otherwise):
- Create and edit a custom theme: holding Hold to add theme to completion increases the My themes count by exactly one, the new row appears with brief enter feedback and becomes the highlighted active row, the editor shows its name and tokens, and the live preview recolors to its token set; renaming it in the editor updates the same row's name in My themes immediately, and editing its primary color updates that row's four-swatch chip, the live preview surfaces, the Color Palette tab's primary swatch value, the Contrast panel's primary pair, and every Export format preview
- Fork a built-in: selecting a built-in preset applies its tokens to the editor and preview without reload; changing one of its tokens adds exactly one new entry to My themes (an editable copy) while the built-in catalog still contains all 35 presets unchanged, and the preview now tracks the forked copy
- Remove and recover: removing the active custom theme deletes its row from My themes, drops the My themes count by exactly one, clears it from active selection (a remaining theme or default becomes active and the preview recolors accordingly), and removing the last custom theme shows the My themes empty-state hint while the built-in catalog remains fully listed
- Duplicate then undo: with a custom theme active, Duplicate increases My themes by exactly one with matching tokens; Undo removes that duplicate and restores the prior selection and preview; Redo restores the duplicate again
- Artifact end state: edit primary and Radius Boxes, open Export and confirm CSS, Theme JSON, and theme-extension each contain the edits and Theme JSON still shows required name, color-scheme, color (oklch or #RRGGBB), radius, size, border, depth, and noise keys; Download Theme JSON then Import that document reconstructs the same visible name and tokens in editor, preview, Contrast, and Export
- Create record is request body: create a custom theme with a valid name, edit primary and box radius, open Theme JSON — the preview object carries that same name and the edited token values under the required contract keys
- Schema validation flow: attempt create/rename with an illegal or over-length name (My themes unchanged, name field named); Import JSON missing a --color-* key or with a non-oklch/non-#RRGGBB color (state unchanged, offending field named); then a valid create yields Theme JSON whose payload shape matches the form-produced request body
- Snapshots flow: Save snapshot under a valid name after editing tokens (snapshot theme matches the Theme JSON field contract), change tokens further so the preview differs, then toggle Before / After and confirm the preview flips between the snapshot tokens and the live edits without losing either set
- Vision mode: with Components Demo visible, choose Deuteranopia and confirm the preview pane's colors change under simulation while editor swatches stay unfiltered; choosing None restores the unfiltered preview
- Share round-trip: after editing tokens, the #theme= hash payload changes; opening the app fresh at a URL carrying that payload renders the same theme on first paint — the editor tokens, list selection, and preview colors all match what was shared
- A plain page reload without a #theme= payload returns the app to its seeded state: 35 built-in presets, no custom themes beyond the seed, and the default active theme
</user_flows>

<edge_cases>
- Invalid create: an empty, whitespace-only, over-length (greater than 64), or illegal-character theme name must not add a custom theme; the My themes count stays the same and visible validation feedback names the name field
- Attempting to remove a built-in preset removes nothing and surfaces a notice explaining that built-ins cannot be removed
- Releasing Hold to add theme before the ~0.7s progress completes cancels the add: the progress fill resets and the My themes count does not change
- After removing all custom themes, My themes shows an empty-state hint while the 35 built-ins remain listed and selectable
- Loading a URL whose #theme= payload is malformed or undecodable falls back to the default seeded theme with no console error and no broken UI
- A very long theme name is truncated with an ellipsis in its sidebar row while the editor name field shows the full value
- Rapidly clicking Random at least three times in a row leaves exactly one coherent token set applied — the editor rows, preview, and palette tab agree with each other
- Undo and Redo are visibly disabled when their stacks are empty and activating them at that boundary never throws or corrupts themes
- Saving a snapshot with an empty, whitespace-only, or over-length (greater than 64) name adds nothing to the Snapshots list and shows validation naming the name field
- Importing malformed Theme JSON leaves My themes, editor, preview, and Export unchanged and shows visible validation feedback
- Importing parseable JSON that fails the Theme JSON field contract — missing a required color or radius key, a --color-* value that is empty or neither oklch(...) nor #RRGGBB, color-scheme outside light|dark, a radius/size/border/depth/noise value outside its closed enum, an empty/illegal name, or a color-scheme/Dark-option cross-field disagreement — leaves My themes, editor, preview, and Export unchanged and shows validation naming the offending field
- Importing Theme JSON where --color-primary is an empty string or a non-color token (neither oklch(...) nor #RRGGBB) leaves state unchanged and shows validation naming --color-primary
- After Undo, performing a new token edit clears the redo stack and disables Redo
</edge_cases>

<visual_design>
- Dense tool-studio composition: sticky top navbar chrome above a three-panel workspace (themes | editor | live preview) — not a marketing landing or equal-width card stack
- Desktop layout: left themes (~14rem) / center editor (~17rem) / right live preview fills remaining width
- Surfaces driven by active data-theme / theme tokens; the preview frame recolors from the token set, and demos use cards, stats, forms, chat, code mockups, radial-progress, and a palette grid of 16 labelled swatches
- Typography: Outfit (or an equivalent bundled geometric sans) for chrome; preview text follows the active theme
- Theme rows show four-swatch chips; the Change Colors editor uses per-row face swatch pickers plus a round content A badge; radius/size/effect controls use compact segmented button choices with an active selection state; Hold-to-add shows a visible inset progress fill
- The Contrast panel reads as a compact matrix of pair name, numeric ratio, and AA/AAA badges with a distinct warning treatment on failing pairs, sitting in the editor without breaking the three-panel studio
- Snapshots list and Before / After sit near the editor, and the vision-mode control sits on the preview chrome, without collapsing the themes | editor | preview composition
- Export opens as a centered modal with CSS / Theme JSON / theme-extension format tabs, a scrollable code block, Copy and Download affordances, and a hint line
- Version / chrome-theme / language dropdowns open in the top chrome without leaving the page
- Component states: buttons, inputs, and segmented choices show distinct default, hover, focus (visible ring), active-selection, disabled (empty Undo/Redo), and error treatments
</visual_design>

<motion>
- Hold-to-add: press-and-hold Hold to add theme for ~0.7s with a visible progress fill that sweeps across the button; early release cancels and adds nothing; success adds a custom theme with brief enter feedback
- New theme enter: the newly added My themes row pops in (brief scale/fade); removing a custom theme animates its row out rather than snapping the list
- Random: each click applies a fresh randomized token set and shows a brief confirmation toast that slides in and auto-dismisses with a fade
- Live preview: preview chrome/background colors ease across token and tab changes so re-theming reads as a smooth shift
- Before / After toggles and vision-mode changes ease the preview recolor rather than hard-cutting when motion is allowed
- Hover animations (required): announce strip and chrome controls take short color/background transitions on hover; theme-list rows and swatch chips show hover wash; buttons and radius/size selectors change fill/border with ~0.15–0.2s ease; dropdown menus open with brief opacity/scale; focus-visible outlines on interactive controls
- Export Copy or Download shows a short confirmation before resetting; the export modal enters and exits with a brief opacity/scale transition
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes while every flow — hold-to-add, undo/redo, export, and import included — remains completable
</motion>

<responsiveness>
- The three-panel desktop workspace stacks toward one column on smaller viewports: at 768 pixels and below the themes, editor, and preview regions reflow vertically and remain fully usable
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width
- Chrome dropdowns, the Export modal (format tabs, Copy, Download), color pickers, the Contrast panel, and snapshot controls stay fully visible and operable at small widths rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control — theme rows, token pickers, segmented choices, toggles, dropdowns, tabs, Hold to add, Random, Undo/Redo, Export format tabs, Import, snapshots, Before / After, and vision mode — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Export modal uses role dialog with aria-modal true, traps focus while open, closes on Escape, and returns focus to the control that opened it
- Chrome dropdowns and the preview tabs are operable from the keyboard: arrow keys move through options, Enter or Space selects, and the selected option is exposed as active to assistive technology
- Validation messages for the theme name, snapshot name, and Import are rendered visually and associated with their fields so assistive technology announces them
- Color pickers and the content A badges carry accessible names that identify which semantic token they edit
- Contrast AA/AAA results are exposed as text (pass/fail labels or ratios), not color alone, and Undo/Redo expose their disabled state to assistive technology when stacks are empty
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load, with 35 presets already listed
- No console errors or warnings appear during a full exercise of the app: creating, renaming, duplicating, editing, undoing, removing themes, switching preview tabs, exporting all three formats, importing Theme JSON, toggling snapshots/before-after, changing vision mode, and loading a shared payload
- Token edits re-theme the live preview and refresh Contrast ratios immediately with no visible lag, including while dragging a color picker; rapid repeated edits and undo/redo do not hang the UI
- After first paint no visible layout jumps occur; panels and the preview grid hold their space as the app settles
</performance>

<writing>
- Chrome labels, editor section titles, and buttons use one consistent capitalization convention throughout
- Action labels are specific — Hold to add theme, Reset theme, Remove theme, Duplicate, Export, Copy, Download, Save snapshot, Import theme — rather than generic labels where a specific one is possible
- The My themes empty state explains that no custom themes exist yet and how to add one; validation messages name the offending field (for example name, color-scheme, --color-primary, --radius-box) and the fix; Contrast AA/AAA badges read as clear pass/fail
- No placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): custom themes collection, active theme id, editor tokens, preview tab, site chrome theme preference, undo/redo stacks, snapshots, and vision mode. Do not use localStorage, sessionStorage, or other browser storage APIs. Shareable theme payloads may use same-document hash only.
State contracts (behavioral, not storage keys):
- Creating a valid custom theme increases My themes and selects it for editing/preview
- Editing name or tokens updates that same theme everywhere (list swatches, editor, live preview, Contrast, Export)
- Deleting/removing a custom theme removes it from My themes and from active selection if it was active
- Selecting a built-in or custom theme applies tokens to preview without reload; editing a built-in forks a custom copy
- Preview tab switches and Random mutate shared state; they do not invent a disconnected theme copy
- Export CSS / Theme JSON / theme-extension texts are derived live from the same shared theme tokens; Import mutates that same store
Stack: Vue 3 with Pinia, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Reka UI components provide dropdowns, the Export dialog, selects, toggles, and toasts; no other external component library. Motion for Vue is allowed for animation; no other animation libraries. Remix Icon via unplugin-icons only; no raw pasted SVG icon sets and no icon CDNs. All forms — theme create, rename, token editors, Save snapshot, and Import — validate through a Zod schema driven by VeeValidate and render inline per-field errors before submit. Schemas are API-shaped: they model the Theme JSON and SnapshotCreate payload shapes a theme API would accept (the record create/rename produces IS the would-be request body; CSS/Theme JSON/theme-extension export and Theme JSON import conform to the same Theme JSON field contract, including closed enums, oklch/#RRGGBB color formats, and the color-scheme cross-field rule). DaisyUI theme tokens and component demos are allowed for the live preview. pako is allowed for hash compression. All libraries are installed via npm and bundled locally; no CDN imports.
- Exactly 35 built-in presets seeded so first load is non-empty; document title reflects CSS theme builder
- Empty required theme name on create must not increase custom themes count; show visible validation feedback
- After removing all custom themes, My themes shows an empty state while built-ins remain
- Zero navigational outbound links after settle; same-document hash theme payload allowed
- Three-panel desktop workspace MUST remain (themes / editor / preview)
- Useful end state: the session's work product is the produced theme files (Export CSS / Theme JSON / theme-extension with Copy and Download) plus Import theme round-trip against the Theme JSON field contract; every export must reflect live session mutations and Theme JSON must carry every required key from the field contract above
- Optional enhancements are welcome where they do not conflict with the specified behaviors: a richer Hold-to-add success microinteraction, a guided first-run coachmark for the studio, an OKLCH hue-wheel or harmonic suggest aid beyond Contrast, or keyboard nudging of a focused color value; any enhancement must not interfere with required flows
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
- Editor object types: css-theme
- Editor properties: token; value
- Editor operations: select; update_property; preview
- Entity: theme
- Entity operations: create; select; update; delete
- Entity fields: name; tokens
- Artifact operations: export; import; copy
- Export formats: css; json; theme-extension
- Import modes: declared-theme

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Color-picker drag gestures stay Playwright when mechanism matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
