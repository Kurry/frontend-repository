<summary>
Build a daisyUI theme generator using Svelte, Svelte stores, Tailwind CSS 4.3.2, and DaisyUI.
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
- The top site chrome renders the product brand wordmark, a version control reading 5.6.18, a GitHub-stars control reading ~41k, a theme picker, a language control, and an announcement strip announcing that version 5.6 is now available; each looks interactive but clicking it never navigates away from the page
- Clicking the version, theme, or language chrome control opens its dropdown in place without leaving the page; clicking the brand wordmark or stars control performs no navigation
- After hydration/settle the interactive document contains zero navigational outbound anchors; chrome links behave as inert buttons and only same-document #theme= hash updates are allowed
Feature: Theme catalog —
- The left Themes panel lists exactly 35 built-in themes (light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset, caramellatte, abyss, silk), each row showing a four-swatch color preview beside its name
- Selecting any built-in theme row highlights it as the active theme and applies its name plus color / radius / size tokens to the editor and live preview without a page reload
- A "Hold to add theme" control requires a press-and-hold (~3s) that fills a visible inset progress indicator; completing the hold adds a new theme to My themes and selects it, while releasing early cancels and adds nothing
- The My themes list holds user-created themes; each can be renamed and token-edited, and removed via a Remove control; built-in themes cannot be removed, and editing a built-in forks an editable custom copy into My themes
Feature: Token editor —
- The editor Name field (placeholder "mytheme") renames the active theme and updates its label live in the My themes list and preview
- The Change Colors section exposes base tokens (--color-base-100 / -200 / -300 and --color-base-content) plus eight semantic face/content pairs — primary, secondary, accent, neutral, info, success, warning, error; opening a swatch picker and choosing a color updates the matching CSS variable and immediately recolors the live preview
- The Radius controls set --radius-box (card / modal / alert), --radius-field (button / input / select / tab), and --radius-selector (checkbox / toggle / badge), each chosen from 0rem / 0.25rem / 0.5rem / 1rem / 2rem, and changing one restyles the corresponding preview components' corners
- The Depth (--depth 0/1) and Noise (--noise 0/1) toggles switch a 3D depth and a noise texture on fields and selectors in the preview
- The Sizes controls set --size-field and --size-selector on an xs / sm / md / lg / xl scale plus a --border border-width, and changing them resizes or re-borders the preview's fields and selectors
- The Options section toggles Default theme, Default dark theme, and Dark color scheme, and a Reset control reverts token edits on the active theme
- Clicking Random mutates the active theme's tokens to new values and re-themes the live preview
Feature: Live preview and export —
- The live preview offers three tabs switched by a segmented control without reload — Components Demo (default), Component Variants, and Color Palette; Components Demo renders a dense composition (filter tags, a calendar with events, tabs, a range slider, a product card, search, a registration form, stats, radial progress, recent orders, chat bubbles, a mock terminal, and pricing)
- Any color, radius, effect, or size edit re-themes the visible preview immediately within whichever tab is active
- Clicking CSS opens/exports the active theme's CSS whose declarations reflect the current color / radius / size / effect tokens, and a Copy-to-clipboard action shows a brief copied confirmation before resetting
- Theme JSON request-body field contract (Download theme.json / Copy JSON / Import theme share this schema — the active theme record IS the would-be request body): required name (trimmed slug-safe string length 2–32, matching ^[a-z][a-z0-9_-]*$), required colors (object including --color-base-100, --color-base-200, --color-base-300, --color-base-content plus the eight face/content pairs primary through error, each value a CSS color string), required radius (closed token for the selected radius control), required size (exactly one of xs, sm, md, lg, xl), required effects (object with boolean depth and noise), required generatedAt (ISO-8601 datetime ending in Z). Cross-field: renaming via the Name field must keep name unique among My themes; duplicate or invalid name shows a named name error and does not commit. Download theme.json and Copy JSON emit that object for the active theme; Download CSS / Copy CSS emit the matching custom-properties block. An export that omits a session token edit, rename, create, or Random mutation is invalid. Import theme accepts a conforming JSON and applies name + tokens to the editor and preview; malformed payloads show a visible error and change nothing.
- The theme serializes into a same-document #theme= URL hash (compressed, URL-safe) that updates as the theme is edited; loading a page whose hash contains theme= decodes it and applies that name plus tokens to the editor and preview without reload
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every named surface):
- Create-and-rename flow: completing the Hold to add theme press-and-hold increases the My themes row count by exactly one, the new theme becomes the highlighted active row, the editor Name field shows its name, and the live preview re-themes to its tokens; typing a new name in the editor Name field then updates that same row's label in My themes and the theme name in the CSS export text, all without a reload
- Fork-a-built-in flow: selecting a built-in theme and then changing one of its color swatches adds exactly one editable custom copy to My themes, makes the copy the active theme, recolors the live preview with the edited token, and updates the CSS export to the edited value; re-selecting the original built-in afterwards shows its unmodified original tokens in the editor and preview
- Delete flow: removing the currently active custom theme decreases the My themes count by exactly one, clears it from active selection, moves selection to a remaining theme, and re-themes the editor and live preview to that remaining theme's tokens
- Share-by-hash flow: editing any token updates the #theme= URL hash in place; opening the app fresh with that hash applies the same theme name to the editor Name field, the same swatches to the editor color grid, and the same colors to the live preview as the session that produced the hash
- Random round-trip flow: clicking Random changes the editor's visible swatch colors, recolors the live preview, and changes the declarations in the CSS export so all three surfaces show the same mutated token values
- Reload baseline: reloading the page without a theme= hash returns the app to its seeded state — 35 built-in themes listed, My themes empty, and the default theme active in editor and preview
</user_flows>

<edge_cases>
- Submitting a custom-theme create with an empty or whitespace-only name does not increase the My themes count and shows visible validation feedback naming the name field
- Removing every custom theme leaves My themes showing an empty state message while all 35 built-ins stay listed and selectable
- Releasing the Hold to add theme control before the ~3s hold completes cancels the add: the progress fill resets and the My themes count is unchanged
- Loading a page whose theme= hash payload is malformed or undecodable falls back to the seeded default theme without breaking the page and without uncaught console errors
- Double-activating a Remove control deletes exactly one theme: the My themes count decreases by one, not two
- A theme name longer than roughly 30 characters stays contained in its My themes row without overflowing the panel or breaking the layout
</edge_cases>

<visual_design>
- Dense tool-studio composition: sticky top navbar chrome above a three-panel workspace (themes | editor | live preview) — not a marketing landing or equal-width card stack
- Desktop layout: left themes (~14rem) / center editor (~17rem) / right live preview fills remaining width
- Surfaces driven by active data-theme / theme tokens; the Components Demo preview packs cards, stats, a registration form, a calendar with events, chat bubbles, a product card, a range slider, radial progress, recent orders, a mock terminal, and pricing, while Color Palette renders a token swatch grid
- Typography: Outfit (or equivalent) for chrome; preview text follows the active theme
- The center editor is a dense stack: a Name field (placeholder "mytheme"), a base-plus-eight-pair color swatch grid, radius icon-button rows, xs / sm / md / lg / xl size selectors, Depth/Noise toggles, and Random / CSS actions — not a sparse form
- Theme rows show four-swatch chips; radius/size/effect controls use compact icon/toggle selection states; Hold-to-add shows a visible inset progress fill
- Version / theme / language dropdowns open in the top chrome without leaving the page
</visual_design>

<motion>
- Hold-to-add: press-and-hold Hold to add theme for ~3s with a visible progress fill; early release cancels; success adds a custom theme with brief enter feedback
- New theme enter: the newly added My themes row pops in (brief scale/fade); removing a theme animates the row out rather than snapping
- Random: each click advances the Random control icon with a short rotate ease
- Editing controls animate their selected state: opening a color swatch reveals its picker, radius icon buttons and xs–xl size selectors snap to an active fill/border, and Depth/Noise toggles slide between on/off
- Live preview: preview chrome/background colors ease across token and tab changes so re-theming reads as a smooth shift
- Hover animations (required): announce strip and chrome controls take short color/background transitions on hover; theme-list rows and swatch chips show hover wash; buttons and radius/size selectors change fill/border with ~0.15–0.2s ease; dropdown menus open with brief opacity/scale; focus-visible outlines on interactive controls
- CSS export Copy to clipboard shows a short copied confirmation before resetting
</motion>

<responsiveness>
- Below desktop width the three-panel workspace stacks toward a single column with the themes list, editor, and live preview all still reachable and usable
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears
- The top navbar chrome remains visible and its dropdowns remain usable at narrow widths
</responsiveness>

<accessibility>
- Every interactive control — theme rows, swatch pickers, radius and size selectors, toggles, tabs, and chrome dropdowns — is reachable and operable with the keyboard alone, with a visible focus indicator
- Chrome dropdowns and the color swatch pickers close on the Escape key and return focus to the control that opened them
- The create/rename validation message is exposed to assistive technology (rendered in the DOM as text associated with the field), not only as a color change
- The copied confirmation on CSS export is announced through an aria-live region as well as shown visually
- Text and controls in the site chrome and editor panels keep readable contrast against their surfaces in the default theme
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No uncaught console errors appear during a full exercise of the app (theme selection, token edits, tab switches, create, rename, remove, export)
- Token edits re-theme the live preview immediately, with no visible lag between changing a control and the preview recoloring
- Rapid repeated token edits (dragging through a color picker, clicking several radius options in quick succession) keep the UI responsive with no hangs
</performance>

<writing>
- Control labels and section headings use one consistent capitalization convention across the themes panel, editor, and preview chrome
- Token controls are labeled with the CSS variable or token family they edit (base, primary, secondary, accent, neutral, info, success, warning, error, radius, size) so an edit's target is unambiguous
- Validation messages name the field and the fix; the My themes empty state explains that created themes appear there and how to add one
- No placeholder or lorem text appears anywhere in the shipped UI; preview content reads as realistic product copy
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): custom themes collection, active theme id, editor tokens, preview tab, and site chrome theme preference. Do not use localStorage, sessionStorage, or other browser storage APIs. Shareable theme payloads may use same-document hash only.
State contracts (behavioral, not storage keys):
- Creating a valid custom theme increases My themes and selects it for editing/preview
- Editing name or tokens updates that same theme everywhere (list swatches, editor, live preview)
- Deleting/removing a custom theme removes it from My themes and from active selection if it was active
- Selecting a built-in or custom theme applies tokens to preview without reload; editing a built-in forks a custom copy
- Editing any color/radius/effect/size control updates the corresponding CSS variable and re-themes the live preview from shared state; the CSS export text reflects the current tokens
- Loading a page whose URL hash contains theme= decodes the payload and applies that name + tokens to the editor and preview
- Preview tab switches and Random mutate shared state; they do not invent a disconnected theme copy
- A page reload without a theme= hash returns the app to its seeded state
Stack: Svelte with Svelte stores, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. DaisyUI components provide the theme preview, dropdowns, segmented controls, toggles, modal, and toasts; no other external component library. AutoAnimate and Svelte transitions are allowed for animation; no other animation libraries. Iconify via @iconify/tailwind4 only; no raw pasted SVG icon sets and no icon CDNs. All forms, including theme create, rename, token editors, and Import theme, validate through a Zod schema driven by Felte that mirrors the API-shaped Theme JSON request-body field contract above; inline per-field errors render before submit; the active theme record IS the would-be request body; Download/Copy/Import validate through the same schema. End-state contract: Download theme.json, Download CSS, and Copy MUST reflect the session's actual tokens — an export that omits session work is invalid; Import MUST restore the same visible theme (round-trip). All libraries and fonts are installed via npm or bundled locally; no CDN imports.
- All 35 built-in themes seeded so the Themes panel is non-empty on first load; document title reflects daisyUI and Tailwind CSS theme generator
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
- Editor object types: theme
- Editor properties: color; radius; font
- Editor operations: select; update_property; preview
- Editor modes: edit; compare
- Entity: theme
- Entity operations: create; select; update; delete
- Entity fields: name; tokens
- Artifact operations: export; import; copy; convert
- Export formats: css; json; config
- Import modes: declared-theme
- Conversion modes: css-to-json; json-to-config

Mechanics exclusions:
- Raw file path / base64 blobs must not appear in WebMCP args
- Color-picker drag gestures stay Playwright when mechanism matters
- Hold-to-add press timing stays Playwright when mechanism matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
