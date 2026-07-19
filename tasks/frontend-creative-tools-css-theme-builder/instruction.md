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
- Site chrome: an announce strip, a brand mark, a version dropdown, a chrome theme-picker dropdown (light / dark / cupcake / synthwave), a language dropdown (EN / ES / FR / JA), and a stars / docs / components control cluster; the dropdowns open in place without navigating, and choosing a chrome theme option recolors the app shell and marks that option active
- Themes sidebar with a press-and-hold Hold to add theme control (~0.7s: a progress fill sweeps across the button and, on completion, adds a new custom theme; releasing early cancels and adds nothing), a My themes list (custom collection, showing an empty-state hint when none exist), and a built-in catalog of exactly 35 presets (light, dark, cupcake … silk); every theme row shows a four-swatch chip (primary / secondary / accent / neutral) plus the theme name, the active row is highlighted, and clicking a row applies that theme's name + tokens to the editor and live preview
- Custom themes support create (hold-to-add or an equivalent New action), rename, per-token edits, Reset, and Remove; built-in presets cannot be removed (attempting removal on a built-in surfaces a notice instead) and editing a built-in forks an editable custom copy rather than mutating the preset in place
- Theme editor with required anatomy: an editable name field, a Random control, a CSS-export control, Change Colors (11 semantic rows — base-100, base-200, base-300, primary, secondary, accent, neutral, info, success, warning, error — each with a face color picker and a content "A" badge that opens a picker for the paired content color), Radius (Boxes / Fields / Selectors, each a choice among 5 preset radii from 0 to 2rem), Effects (Depth and Noise, each an Off / On toggle), Sizes (Fields and Selectors, each a 5-step xs–xl scale, plus a Border Width choice of 4 widths), and Options (Default theme, Default dark theme, and Dark color scheme checkboxes, with Reset theme and Remove theme actions)
- Editing any token — a color swatch, a radius, a size, the border width, a depth/noise toggle, or the dark-color-scheme option — immediately re-themes the live preview with no reload
- Clicking Random replaces the theme's color tokens with a fresh randomized OKLCH set (and a random light/dark scheme), re-themes the preview, and shows a brief confirmation toast
- At least two interaction modes: Editor/Generator mode (token controls) and Live Preview mode with three tabs — Components Demo (a dense grid of ~9 component cards: badges/filters, a calendar list, tabs & range, a product card, a registration form, stats + radial progress, an orders table, a chat + code mockup, and pricing), Component Variants (button color variants, form controls, and alert states), and Color Palette (16 token swatches, each showing the token name and its value) — switching tabs swaps the pane in place and re-themes immediately as tokens change
- The CSS-export control opens a modal previewing the theme as a [data-theme="name"] { … } CSS block; a Copy control writes that CSS to the clipboard and shows a brief copied confirmation, and Close, the backdrop, or Escape dismiss the modal
- Shareable theme payload: the active theme is encoded into a compressed same-document #theme= URL hash (JSON → deflate → URL-safe Base64) that updates as the theme changes; loading a URL that carries a #theme= payload decodes and applies that theme on first paint
- Invalid create: an empty or whitespace-only theme name must not add a custom theme; show visible validation feedback
- Empty My themes state after removing all custom themes while the built-in catalog remains
- Zero real navigation after settle — same-document hash theme payload allowed; chrome anchors become inert buttons after hydration
</core_features>

<visual_design>
- Dense tool-studio composition: sticky top navbar chrome above a three-panel workspace (themes | editor | live preview) — not a marketing landing or equal-width card stack
- Desktop layout: left themes (~14rem) / center editor (~17rem) / right live preview fills remaining width; stacks toward one column on smaller viewports
- Surfaces driven by active data-theme / theme tokens; the preview frame recolors from the token set, and demos use cards, stats, forms, chat, code mockups, radial-progress, and a palette grid of 16 labelled swatches
- Typography: Outfit (or equivalent) for chrome; preview text follows the active theme
- Theme rows show four-swatch chips; the Change Colors editor uses per-row face swatch pickers plus a round content "A" badge; radius/size/effect controls use compact segmented button choices with an active selection state; Hold-to-add shows a visible inset progress fill
- CSS export appears as a centered modal with a scrollable code block, a copy affordance, and a hint line
- Version / chrome-theme / language dropdowns open in the top chrome without leaving the page
</visual_design>

<motion>
- Hold-to-add: press-and-hold Hold to add theme for ~0.7s with a visible progress fill that sweeps across the button; early release cancels and adds nothing; success adds a custom theme with brief enter feedback
- New theme enter: the newly added My themes row pops in (brief scale/fade)
- Random: each click applies a fresh randomized token set and shows a brief confirmation toast
- Live preview: preview chrome/background colors ease across token and tab changes so re-theming reads as a smooth shift
- Hover animations (required): announce strip and chrome controls take short color/background transitions on hover; theme-list rows and swatch chips show hover wash; buttons and radius/size selectors change fill/border with ~0.15–0.2s ease; dropdown menus open with brief opacity/scale; focus-visible outlines on interactive controls
- CSS export Copy to clipboard shows a short copied confirmation before resetting
</motion>

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
