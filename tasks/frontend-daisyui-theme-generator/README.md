# daisyUI Theme Generator — Product Requirements Document (PRD)

This PRD specifies the **exact** static theme-generator page delivered in this folder (`index.html`, `theme-generator.css`, `theme-generator.js`, vendored `_app/`). An implementer or AI given only this document must be able to recreate the same page: layout, theme controls, live component preview, URL hash serialization, CSS export, microinteractions, and the **no-navigation** constraint.

**Visual / behavioral reference:** [https://daisyui.com/theme-generator/](https://daisyui.com/theme-generator/)  
**Hash fixture (must load):** `#theme=eJxtlOtu4yAQhV8FWaq0KzUIhoth34bYuLHqmAgctbtV330xThMI_heY75y54Xw1sznb5k8zjW-npXltOjc5fwjdyRbXh8MWOJpgD5SQGHLvU3f6FX-_IILI72cIMkirfYbljNhnOjcvdl7uHNDIYUIkAiWwUiJXXPx4Nv7vHearKQaOoG0xAbbDVgk0SwnYKgLcKpWLgo14n6eQtxQUMcExI_t4nYWnLKAQ44BBFDLTdTnbtitLBSCqKNYUarbyZyr5SxY1CnMqc81sr4s302OJWzFEbDMt53SD6w5gE8U5KYlZUdQ4D-5RfnKncWEMsJT0GaxXrLfao4Kz2HdbjPQaGw7h4S6Te9siKhmGsvYbXE8nTZQkkcKa55oP4-dxfruzKvVJlUaKYw56h638eXqklALiAmtS-FvvnX-Uv5GaI8qiu6rIejrba4jLooDJT-3e9OM1xAc32W5J_gQLb895cBjt1KcIPIeO7rOUhPGfLd2gjO2ZHZ3v7UrTy2e66O1lOa3ndJrdGNY_FRJPvR3MdYpdDWYK9rW5eDtYH-K38n67-_4PjS9Oyg`  
**Local acceptance target:** files in this directory after SavePage repair, asset vendoring, link neutralization, and polish (not a multi-page marketing site).

---

## 1. Goal

Build a single-page **daisyUI v5 theme generator** that lets users:

1. Browse built-in daisyUI themes and create custom themes
2. Edit semantic colors, radius, depth/noise effects, and size/border tokens
3. Preview DaisyUI components live against the active theme
4. Export theme CSS and share themes via a compressed `#theme=` URL hash

Every control that looks like a site-nav link (logo, docs, GitHub, language, store, blog, etc.) MUST remain interactive in appearance but **must not navigate** away from this page.

---

## 2. Non-goals

- No real multi-page daisyUI docs site routing.
- No backend APIs, auth, or persistence beyond `localStorage` / `sessionStorage` used by the generator itself.
- Do not reset or touch any database.
- Do not leave the page via `<a href>` navigation.

---

## 3. Hard constraint: no navigational links

### MUST

- After page load and hydration, the interactive document MUST contain **zero** navigational `<a href="...">` elements.
- Allowed resource URLs only:
  - Stylesheet: `<link href="./theme-generator.css" rel="stylesheet" />`
  - Module / script: `<script type="module" src="./theme-generator.js">` and relative imports under `./_app/...`
  - CDN font stylesheets (`fonts.googleapis.com` / `fonts.gstatic.com`) as on the live site
  - Image / icon URLs that load assets (not page navigation)
- Replace every former site-nav link with a non-navigating control that preserves look and hover:
  - Prefer `<button type="button" class="... inert-nav">` after hydration
  - SSR HTML may still contain anchors for SvelteKit hydration fidelity; JS MUST convert them after the app starts
- Clicks MUST NOT change `location` to another origin or another path outside this mirror’s allowed paths (`/`, `/index.html`, `/theme-generator`, `/theme-generator/`, `/theme-generator/index.html`).
- Same-document `#theme=...` hash updates MUST remain allowed (theme serialization).

### CSS support for inert controls

```css
button.inert-nav {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: inherit;
}
```

### JS enforcement (required)

`theme-generator.js` MUST:

1. Capture-phase click handler: `preventDefault` on external / off-page anchors
2. Patch `history.pushState` / `history.replaceState` to ignore disallowed URLs
3. After SvelteKit `kit.start(...)` succeeds, convert remaining `a[href]` to `button.inert-nav` (and keep converting newly inserted nav anchors via `MutationObserver`)

Do **not** convert anchors before hydration — that breaks SvelteKit.

---

## 4. Tech stack & file layout

| Path | Role |
|------|------|
| `index.html` | Page shell + SSR markup from daisyui.com theme-generator |
| `theme-generator.css` | Bundled site CSS (`global` + route CSS) + inert-nav polish |
| `theme-generator.js` | Theme `localStorage` boot, SvelteKit start, nav blocker, post-hydrate link neutralization |
| `_app/immutable/**` | Vendored SvelteKit client chunks/nodes/assets from daisyui.com (required) |

### Runtime model

- The live site is a **SvelteKit** app. This folder is a static mirror of the theme-generator route with local `_app` assets.
- Bootstrap sets `globalThis.__sveltekit_fnlnry = { base: "" }` (module-safe; never bare assignment in `type="module"`).
- Mount target: `document.body.querySelector(":scope > div") || document.body`
- Start call uses node ids `[0, 2, 12, 214]` with the SSR-provided `data` payload (layout nav data + `builtinThemes` / generator config).

### Serve (required for ES modules)

```bash
cd DaisyUI/theme-generator && python3 -m http.server 8766
# open http://127.0.0.1:8766/
# or with hash: http://127.0.0.1:8766/#theme=<payload>
```

Do not verify via `file://`.

### CDN / external resources

- Google Fonts (Outfit, Noto Sans, Noto Sans JP, Vazirmatn) — same query as live site, `min-width: 520px` media
- Remote images used by daisyUI chrome (logos, etc.) may stay on `img.daisyui.com` / similar CDNs

Prefer **relative paths** for local CSS/JS/assets (`./theme-generator.css`, `./theme-generator.js`, `./_app/...`).

---

## 5. Document shell

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="daisyUI theme generator: edit colors, radius, depth, noise, and sizes; preview components; copy CSS; share via #theme= hash." />
    <title>daisyUI and Tailwind CSS theme generator</title>
    <!-- fonts + ./theme-generator.css + modulepreloads for _app entry/chunks -->
  </head>
  <body>
    <!-- SSR chrome + theme generator UI -->
    <script type="module" src="./theme-generator.js"></script>
  </body>
</html>
```

---

## 6. Layout architecture (three columns + site chrome)

Match live daisyui.com theme-generator structure:

### 6.1 Site chrome (top)

1. Optional announcement strip: “daisyUI v5.6 is now available!” (inert after neutralize)
2. Navbar:
   - Menu / logo / wordmark **daisyUI**
   - Version control showing **5.6.18**
   - Theme picker control, language control, GitHub stars control (~41k) — all non-navigating

### 6.2 Left column — Themes

- Heading **Themes** with overflow/options menu
- Primary CTA: **Hold to add theme** (press-and-hold gesture to create a theme)
- Sections:
  - **My themes** — user-created themes (localStorage-backed)
  - **daisyUI themes** — full built-in list (exact names):  
    light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset, caramellatte, abyss, silk  
- Each theme row shows a 4-swatch preview + name; selecting applies that theme to the editor + preview

### 6.3 Center column — Theme editor

1. **Name** text field (placeholder `mytheme`) with edit affordance
2. Actions: **Random**, **CSS** (`{ }` export)
3. **Change Colors**
   - Base group: `--color-base-100/200/300` + `--color-base-content`
   - Semantic pairs (face + content “A” swatch): primary, secondary, accent, neutral, info, success, warning, error
   - Color pickers MUST open and update CSS variables live
4. **Radius**
   - Boxes (`--radius-box`): card, modal, alert — values `0rem | 0.25rem | 0.5rem | 1rem | 2rem`
   - Fields (`--radius-field`): button, input, select, tab — same value set
   - Selectors (`--radius-selector`): checkbox, toggle, badge — same value set
5. **Effects**
   - Depth Effect (`--depth` 0/1) — 3D depth on fields & selectors
   - Noise Effect (`--noise` 0/1) — noise pattern on fields & selectors
6. **Sizes**
   - Fields size scale (`--size-field`) with xs…xl labels and base size
   - Selectors size scale (`--size-selector`) with xs…xl labels and base size
   - Border Width (`--border`) for all components
7. **Options**
   - Default theme / Default dark theme / Dark color scheme toggles
   - Remove theme / Reset theme controls as on live site

### 6.4 Right column — Live preview

Tabbed preview modes (radio/segmented control):

1. **Components Demo** (default) — dense composition of DaisyUI components (filters/tags, calendar/events, tabs, range, product card, search, registration form, stats, radial progress, recent orders, editor, chat, media, mock terminal, pricing, etc.) matching live copy where present
2. **Component Variants**
3. **Color Palette**

Preview MUST re-theme immediately when colors/radius/effects/sizes change.

---

## 7. Theme serialization (`#theme=`)

### Contract

- Encoding: theme object → UTF-8 JSON → **zlib deflate** → **URL-safe Base64** (no padding) → `#theme=<payload>`
- Decoding: reverse of the above
- On load, if `location.hash` contains `theme=`, decode and apply that theme to the editor + preview
- On edit, update the hash so the theme is shareable/reloadable
- Example values in schemas are illustrative; the fixture hash above MUST decode and apply (for the provided fixture, name resolves to **light** with matching oklch tokens)

### Analysis integrity

Values MUST be derived from generator state / decoded hash / built-in theme tables. Static fake outputs that ignore controls are invalid.

### localStorage keys (as used by live generator)

- `gen-themes-0.2` — persisted custom themes array
- `gen-theme-id` — active theme id
- `theme` — site chrome theme preference (read on boot into `data-theme`)

---

## 8. CSS export

- **CSS** button MUST open/export the generated theme CSS for the active theme (copy-to-clipboard and/or modal/code panel as on live site)
- Exported CSS MUST reflect current color/radius/size/effect tokens

---

## 9. Microinteractions & polish

MUST include:

- Theme list selection highlight / active state
- Color swatch hover and picker open
- Radius icon selection states
- Depth/noise toggles
- Preview tab switching
- Hold-to-add theme progress interaction
- Navbar dropdowns (version / theme / language) open without leaving the page
- Smooth visual updates in the preview pane when tokens change

Light/dark: built-in themes include both light and dark `color-scheme` values; switching themes MUST update preview backgrounds/content accordingly.

---

## 10. Acceptance criteria

1. Served via local HTTP, page loads without console bootstrap errors.
2. Built-in theme list is visible and clickable; selecting **synthwave** (or any theme) updates Name + color swatches + preview + `#theme=` hash.
3. Loading the fixture `#theme=` hash applies the encoded theme (name/colors consistent with decode).
4. Color / radius / depth / noise / size controls mutate the live preview.
5. CSS export works for the active theme.
6. Zero navigational `<a href>` remain after hydration; chrome links look clickable but do not leave the page.
7. `file://` is not required; HTTP verification is the bar.
8. Folder layout matches this PRD; the old root SavePage file `daisyUI and Tailwind CSS theme generator.html` is removed once this folder is canonical.

---

## 11. Known repair notes (from SavePage → working mirror)

The original capture failed because:

- Scripts were saved as `type="text/plain"` / empty
- Modulepreload `href`s were blank
- Fonts/CSS blobs were broken SavePage stubs
- SvelteKit chunks were missing

The working implementation vendors live `_app/immutable` assets, extracts CSS into `theme-generator.css`, extracts bootstrap into `theme-generator.js`, fixes `globalThis.__sveltekit_fnlnry` for ES-module strict mode, and applies post-hydration no-nav treatment consistent with `DaisyUI/Dashboard.html`.
