<summary>
Build a daisyUI theme generator using Svelte, Svelte stores, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Site chrome: announce strip, brand mark, version control, theme picker, language control, and stars control — interactive in appearance but must not navigate away
- Themes sidebar with press-and-hold Hold to add theme (~3s progress fill), My themes list (primary collection), and a full built-in theme catalog (~35 presets with 4-swatch previews; selecting a preset applies name + tokens + preview)
- Primary collection — custom/saved themes: create (hold-to-add or New), edit (name + tokens), and delete/remove custom themes; built-ins cannot be removed; editing a built-in forks a custom copy
- Theme editor with required anatomy: name field, Random, CSS export, Change Colors (base + semantic face/content swatches with live pickers), Radius (box / field / selector), Effects (Depth / Noise), Sizes (field / selector scales + border width), and Options (default / default dark / dark color scheme; Remove / Reset as applicable)
- At least two interaction modes: Editor/Generator mode (token controls) and Live Preview mode with tabs Components Demo, Component Variants, and Color Palette — re-themes immediately as tokens change
- Domain behavior beyond CRUD: active theme selection, Random token mutation, live preview re-theme, CSS export copy confirmation, shareable compressed hash theme payload encode/decode, empty My themes state after removing all custom themes while built-ins remain
- Invalid create: empty or whitespace-only theme name must not add a custom theme; show visible validation feedback
- Zero real navigation after settle — same-document hash theme payload allowed; chrome anchors become inert buttons after hydration
</core_features>

<visual_design>
- Dense tool-studio composition: sticky top navbar chrome above a three-panel workspace (themes | editor | live preview) — not a marketing landing or equal-width card stack
- Desktop layout: left themes (~14rem) / center editor (~17rem) / right live preview fills remaining width; stacks toward one column on smaller viewports
- Surfaces driven by active data-theme / theme tokens; preview demos use cards, stats, forms, chat, mockups, radial-progress, and palette grids
- Typography: Outfit (or equivalent) for chrome; preview text follows the active theme
- Theme rows show four-swatch chips; radius/size/effect controls use compact icon/toggle selection states; Hold-to-add shows a visible inset progress fill
- Version / theme / language dropdowns open in the top chrome without leaving the page
</visual_design>

<motion>
- Hold-to-add: press-and-hold Hold to add theme for ~3s with a visible progress fill; early release cancels; success adds a custom theme with brief enter feedback
- New theme enter: the newly added My themes row pops in (brief scale/fade)
- Random: each click advances the Random control icon with a short rotate ease
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
Stack: Svelte + Svelte stores + Tailwind CSS (SvelteKit or Vite). DaisyUI / Tailwind theme tokens are allowed for data-theme and CSS variables. No additional external component libraries beyond DaisyUI (Google Fonts CDN for chrome typefaces is allowed).
- Built-in themes seeded so first load is non-empty; document title reflects daisyUI and Tailwind CSS theme generator
- Empty required theme name on create must not increase custom themes count; show visible validation feedback
- After removing all custom themes, My themes shows an empty state while built-ins remain
- Zero navigational outbound links after settle; same-document hash theme payload allowed
- Three-panel desktop workspace MUST remain (themes / editor / preview)
</requirements>
