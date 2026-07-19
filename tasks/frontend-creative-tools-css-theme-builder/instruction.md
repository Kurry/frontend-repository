<summary>
Build a CSS theme builder using Vue 3, Pinia, Tailwind CSS 4.3.2, and Reka UI.
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
Feature: Site chrome —
- The top chrome shows an announce strip, a brand mark, a version dropdown, a chrome theme-picker dropdown (light / dark / cupcake / synthwave), a language dropdown (EN / ES / FR / JA), and a stars / docs / components control cluster; the dropdowns open in place without navigating, and choosing a chrome theme option recolors the app shell and marks that option active
Feature: Themes sidebar —
- The sidebar carries a press-and-hold Hold to add theme control (~0.7s: a progress fill sweeps across the button and, on completion, adds a new custom theme; releasing early cancels and adds nothing), a My themes list (custom collection, showing an empty-state hint when none exist), and a built-in catalog of exactly 35 presets (light, dark, cupcake … silk)
- Every theme row shows a four-swatch chip (primary / secondary / accent / neutral) plus the theme name, the active row is highlighted, and clicking a row applies that theme's name + tokens to the editor and live preview
- Custom themes support create (hold-to-add or an equivalent New action), rename, per-token edits, Reset, and Remove; built-in presets cannot be removed and editing a built-in forks an editable custom copy rather than mutating the preset in place
Feature: Theme editor —
- The editor carries the required anatomy: an editable name field, a Random control, a CSS-export control, Change Colors (11 semantic rows — base-100, base-200, base-300, primary, secondary, accent, neutral, info, success, warning, error — each with a face color picker and a content "A" badge that opens a picker for the paired content color), Radius (Boxes / Fields / Selectors, each a choice among 5 preset radii from 0 to 2rem), Effects (Depth and Noise, each an Off / On toggle), Sizes (Fields and Selectors, each a 5-step xs–xl scale, plus a Border Width choice of 4 widths), and Options (Default theme, Default dark theme, and Dark color scheme checkboxes, with Reset theme and Remove theme actions)
- Editing any token — a color swatch, a radius, a size, the border width, a depth/noise toggle, or the dark-color-scheme option — immediately re-themes the live preview with no reload
- Clicking Random replaces the theme's color tokens with a fresh randomized OKLCH set (and a random light/dark scheme), re-themes the preview, and shows a brief confirmation toast
- The theme name field and rename flow validate inline: a validation message naming the name field appears before submit when the value is empty or whitespace-only, and the invalid value is not applied
Feature: Live preview —
- At least two interaction modes: Editor/Generator mode (token controls) and Live Preview mode with three tabs — Components Demo (a dense grid of ~9 component cards: badges/filters, a calendar list, tabs & range, a product card, a registration form, stats + radial progress, an orders table, a chat + code mockup, and pricing), Component Variants (button color variants, form controls, and alert states), and Color Palette (16 token swatches, each showing the token name and its value) — switching tabs swaps the pane in place and re-themes immediately as tokens change
Feature: CSS export —
- The CSS-export control opens a modal previewing the theme as a [data-theme="name"] { … } CSS block; a Copy control writes that CSS to the clipboard and shows a brief copied confirmation, and Close, the backdrop, or Escape dismiss the modal
Feature: Shareable theme payload —
- The active theme is encoded into a compressed same-document #theme= URL hash (JSON → deflate → URL-safe Base64) that updates as the theme changes; loading a URL that carries a #theme= payload decodes and applies that theme on first paint
- Zero real navigation after settle — same-document hash theme payload allowed; chrome anchors become inert buttons after hydration
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says otherwise):
- Create and edit a custom theme: holding Hold to add theme to completion increases the My themes count by exactly one, the new row appears with brief enter feedback and becomes the highlighted active row, the editor shows its name and tokens, and the live preview recolors to its token set; renaming it in the editor updates the same row's name in My themes immediately, and editing its primary color updates that row's four-swatch chip, the live preview surfaces, the Color Palette tab's primary swatch value, and the CSS-export modal's generated block
- Fork a built-in: selecting a built-in preset applies its tokens to the editor and preview without reload; changing one of its tokens adds exactly one new entry to My themes (an editable copy) while the built-in catalog still contains all 35 presets unchanged, and the preview now tracks the forked copy
- Remove and recover: removing the active custom theme deletes its row from My themes, drops the My themes count by exactly one, clears it from active selection (a remaining theme or default becomes active and the preview recolors accordingly), and removing the last custom theme shows the My themes empty-state hint while the built-in catalog remains fully listed
- Share round-trip: after editing tokens, the #theme= hash payload changes; opening the app fresh at a URL carrying that payload renders the same theme on first paint — the editor tokens, list selection, and preview colors all match what was shared
- A plain page reload without a #theme= payload returns the app to its seeded state: 35 built-in presets, no custom themes beyond the seed, and the default active theme
</user_flows>

<edge_cases>
- Invalid create: an empty or whitespace-only theme name must not add a custom theme; the My themes count stays the same and visible validation feedback names the name field
- Attempting to remove a built-in preset removes nothing and surfaces a notice explaining that built-ins cannot be removed
- Releasing Hold to add theme before the ~0.7s progress completes cancels the add: the progress fill resets and the My themes count does not change
- After removing all custom themes, My themes shows an empty-state hint while the 35 built-ins remain listed and selectable
- Loading a URL whose #theme= payload is malformed or undecodable falls back to the default seeded theme with no console error and no broken UI
- A very long theme name is truncated with an ellipsis in its sidebar row while the editor name field shows the full value
- Rapidly clicking Random several times in a row leaves exactly one coherent token set applied — the editor rows, preview, and palette tab agree with each other
</edge_cases>

<visual_design>
- Dense tool-studio composition: sticky top navbar chrome above a three-panel workspace (themes | editor | live preview) — not a marketing landing or equal-width card stack
- Desktop layout: left themes (~14rem) / center editor (~17rem) / right live preview fills remaining width
- Surfaces driven by active data-theme / theme tokens; the preview frame recolors from the token set, and demos use cards, stats, forms, chat, code mockups, radial-progress, and a palette grid of 16 labelled swatches
- Typography: Outfit (or an equivalent bundled geometric sans) for chrome; preview text follows the active theme
- Theme rows show four-swatch chips; the Change Colors editor uses per-row face swatch pickers plus a round content "A" badge; radius/size/effect controls use compact segmented button choices with an active selection state; Hold-to-add shows a visible inset progress fill
- CSS export appears as a centered modal with a scrollable code block, a copy affordance, and a hint line
- Version / chrome-theme / language dropdowns open in the top chrome without leaving the page
- Component states: buttons, inputs, and segmented choices show distinct default, hover, focus (visible ring), active-selection, and error treatments
</visual_design>

<motion>
- Hold-to-add: press-and-hold Hold to add theme for ~0.7s with a visible progress fill that sweeps across the button; early release cancels and adds nothing; success adds a custom theme with brief enter feedback
- New theme enter: the newly added My themes row pops in (brief scale/fade); removing a custom theme animates its row out rather than snapping the list
- Random: each click applies a fresh randomized token set and shows a brief confirmation toast that slides in and auto-dismisses with a fade
- Live preview: preview chrome/background colors ease across token and tab changes so re-theming reads as a smooth shift
- Hover animations (required): announce strip and chrome controls take short color/background transitions on hover; theme-list rows and swatch chips show hover wash; buttons and radius/size selectors change fill/border with ~0.15–0.2s ease; dropdown menus open with brief opacity/scale; focus-visible outlines on interactive controls
- CSS export Copy to clipboard shows a short copied confirmation before resetting; the export modal enters and exits with a brief opacity/scale transition
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes while every flow — hold-to-add included — remains completable
</motion>

<responsiveness>
- The three-panel desktop workspace stacks toward one column on smaller viewports: at 768 pixels and below the themes, editor, and preview regions reflow vertically and remain fully usable
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width
- Chrome dropdowns, the CSS-export modal, and the color pickers stay fully visible and operable at small widths rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control — theme rows, token pickers, segmented choices, toggles, dropdowns, tabs — is reachable and operable with the keyboard alone, with a visible focus indicator
- The CSS-export modal uses role dialog with aria-modal true, traps focus while open, closes on Escape, and returns focus to the control that opened it
- Chrome dropdowns and the preview tabs are operable from the keyboard: arrow keys move through options, Enter or Space selects, and the selected option is exposed as active to assistive technology
- Validation messages for the theme name are rendered visually and associated with the name field so assistive technology announces them
- Color pickers and the content "A" badges carry accessible names that identify which semantic token they edit
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load, with 35 presets already listed
- No console errors or warnings appear during a full exercise of the app: creating, renaming, editing, removing themes, switching tabs, exporting CSS, and loading a shared payload
- Token edits re-theme the live preview immediately with no visible lag, including while dragging a color picker; rapid repeated edits do not hang the UI
- After first paint no visible layout jumps occur; panels and the preview grid hold their space as the app settles
</performance>

<writing>
- Chrome labels, editor section titles, and buttons use one consistent capitalization convention throughout
- Action labels are specific — Hold to add theme, Reset theme, Remove theme, Copy — rather than generic labels where a specific one is possible
- The My themes empty state explains that no custom themes exist yet and how to add one; validation messages name the field and the fix; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): custom themes collection, active theme id, editor tokens, preview tab, and site chrome theme preference. Do not use localStorage, sessionStorage, or other browser storage APIs. Shareable theme payloads may use same-document hash only.
State contracts (behavioral, not storage keys):
- Creating a valid custom theme increases My themes and selects it for editing/preview
- Editing name or tokens updates that same theme everywhere (list swatches, editor, live preview)
- Deleting/removing a custom theme removes it from My themes and from active selection if it was active
- Selecting a built-in or custom theme applies tokens to preview without reload; editing a built-in forks a custom copy
- Preview tab switches and Random mutate shared state; they do not invent a disconnected theme copy
Stack: Vue 3 with Pinia, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Reka UI components provide dropdowns, the CSS export dialog, selects, toggles, and toasts; no other external component library. Motion for Vue is allowed for animation; no other animation libraries. Remix Icon via unplugin-icons only; no raw pasted SVG icon sets and no icon CDNs. All forms, including theme create, rename, and token editors, validate through a Zod schema driven by VeeValidate and render inline per-field errors before submit. DaisyUI theme tokens and component demos are allowed for the live preview. pako is allowed for hash compression. All libraries are installed via npm and bundled locally; no CDN imports.
- Exactly 35 built-in presets seeded so first load is non-empty; document title reflects CSS theme builder
- Empty required theme name on create must not increase custom themes count; show visible validation feedback
- After removing all custom themes, My themes shows an empty state while built-ins remain
- Zero navigational outbound links after settle; same-document hash theme payload allowed
- Three-panel desktop workspace MUST remain (themes / editor / preview)
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
- Export formats: css
- Import modes: declared-theme

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
