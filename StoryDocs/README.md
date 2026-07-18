# StoryDocs (Getting Started Storyboard) — Product Requirements Document (PRD)

This PRD specifies the **exact** static debranded storyboard getting-started page delivered in this folder (`index.html`, `assets/app.css`, `assets/app.js`, scene images, fonts, favicon). An implementer or AI given only this document must be able to recreate the same page: Vuetify storyboard chrome, scene grid, header tools, view-mode controls, tutorial copy, microinteractions, and the **no-navigation** + **debrand** constraints.

**Visual / behavioral reference (upstream):** Storyboard product “Getting Started” tutorial storyboard UI (SavePage capture).  
**Capture provenance:** SavePage snapshot originally saved as `1. Getting Started - StoryBoom.html` (empty `type="text/plain"` app bundles, scene URLs only in `data-savepage-src`, icon assets via `--savepage-url-*` CSS variables, JWT on `#app`). Working local build restores the rendered DOM + inlined CSS, vendors thumbnails/fonts, strips auth/scripts, then debrands.  
**Local acceptance target:** the files in this directory after path fixes, debranding, and nav removal (single-page demo; not a multi-route product app).

---

## 1. Goal

Build a single-page **storyboard getting-started guide UI** that:

1. Shows a product header with generic wordmark, project title **Demo Projects**, and storyboard title **1. Getting Started**.
2. Presents a grid of tutorial scenes (images + descriptions) teaching header tools, notifications, view modes, scene menus, and add-scene flows.
3. Supports local view-mode switching (Tile / List / Slide) via capture polish JS.
4. Uses **generic product / docs placeholders** (not StoryBoom or any real product brand).

Every control that looks like an external or in-app route link MUST remain interactive in appearance but **must not navigate** anywhere.

---

## 2. Non-goals

- No real multi-page routing, auth, API calls, or storyboard persistence.
- No outbound help / FAQ / marketing / signup / login navigation.
- Do not reset or touch any database.
- Do not depend on DaisyUI / MaterialUI / Shapeshift / LibreChat / DesignPortfolio / other sibling folders.

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** navigational `<a href="...">` elements.
- Allowed `href` / `src` usages are limited to **resource loads**:
  - `<link rel="stylesheet" href="./assets/app.css">`
  - `<link rel="icon" href="./assets/favicon.svg">`
  - `<script src="./assets/app.js">`
  - `<img src="./assets/scenes/scene-XX.webp">`
  - font files under `./assets/fonts/` referenced from CSS
- Replace former navigational links with `<button type="button" class="… inert-nav">` that preserve look and feel.
- Clicks MUST NOT change `location` to an external origin, open new tabs, trigger `mailto:` / `tel:`, or load other HTML pages.
- Capture JS MUST `preventDefault` any residual `a[href]` clicks and show a short non-blocking toast (“demo only”).

### CSS support for inert controls

`assets/app.css` MUST reset UA button chrome for `button.inert-nav` so logo, sidebar storyboard rows, help, and footer CTAs still match the original link styling.

---

## 4. Debrand requirements (critical)

### MUST neutralize / replace

| Original identity cue | Local placeholder |
|---|---|
| Product name “StoryBoom” in title / copy | `Docs` / `Product` (context-appropriate) |
| Welcome line “Welcome to StoryBoom!” | `Welcome to Docs!` |
| “how StoryBoom works” | `how the product works` |
| Project title “Build StoryBoom Projects” | `Demo Projects` |
| Document title / OG / Twitter | `1. Getting Started — Docs` / site_name `Docs` |
| Logo mark (`icon-sb-logo` / `--savepage-url-6`) | Generic clapperboard-style SVG mark (yellow on dark) |
| Favicon | `./assets/favicon.svg` (same generic mark family) |
| Auth URLs / JWT `data-token` / `data-url-*` on `#app` | Removed entirely |
| Help / FAQ / support outbound targets | Inert buttons; toast on click |
| Copyright / social / marketing CTAs tied to the brand | Absent or inert; no brand strings |

### MUST preserve

- Vuetify layout structure (top header, left nav, main storyboard page, scene cards, add-scene group).
- Scene tutorial copy structure and scene count (8 imaged scenes + placeholders).
- Icon masks / CSS variables for UI chrome (bell, dash, kebab, tiles/list/slides, help, etc.).
- Gabarito webfont loading.
- Yellow accent / image-corner body classes from the capture.

### Analysis integrity

Values and layout MUST be derived from the SavePage-rendered DOM and extracted CSS; a static empty page is invalid. Static identity placeholders are intentional for debranding and are normative.

**Normative schema clause:** Output file names and relative paths in §5 are REQUIRED. Example values in tutorial prose are illustrative of structure but the debranded strings in §4 are REQUIRED.

---

## 5. Tech stack & file layout

| Path | Role |
|---|---|
| `index.html` | Debranded page shell + storyboard DOM |
| `assets/app.css` | Extracted Vuetify/app CSS + savepage CSS variables + polish |
| `assets/app.js` | Inert-nav toast, view-mode toggles, scene enter motion, description focus |
| `assets/scenes/scene-01.webp` … `scene-08.webp` | Debranded instructional scene thumbnails (640×360) |
| `assets/fonts/gabarito-400.woff2` | Primary Gabarito face |
| `assets/fonts/gabarito-400-ext.woff2` | Extended Gabarito face |
| `assets/favicon.svg` | Generic brand-neutral icon |
| `_source-capture.html` | Original SavePage capture (reference only; not the runtime entry) |
| `build_capture.py` | Repeatable transform from `_source-capture.html` → runtime files |
| `generate_scenes.py` | Regenerates debranded scene art (no product wordmark / mascot) |

### Relative paths (normative)

```html
<link rel="stylesheet" href="./assets/app.css">
<script src="./assets/app.js" defer></script>
<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
```

Font URLs inside CSS MUST be `url("./fonts/gabarito-400.woff2")` / `url("./fonts/gabarito-400-ext.woff2")` (relative to `assets/app.css`).

Scene images MUST be `src="./assets/scenes/scene-0N.webp"`.

Serve via local HTTP:

```bash
cd StoryDocs && python3 -m http.server 8768
# open http://127.0.0.1:8768/
```

---

## 6. Document shell & chrome

### Header

- Generic logo control (`button.inert-nav` wrapping `i.icon-sb-logo`) — class name may retain historical `sb` token; **visible copy must not**.
- Project title button/text: **Demo Projects**.
- Storyboard title: **1. Getting Started**.
- Utility icons (bell, dashboard, user) remain as buttons; clicks toast “demo only”.

### Sidebar / nav

- Storyboard list rows for Getting Started and sibling demo boards are inert buttons.
- Footer Help control is inert.
- **Add Storyboard** remains a non-navigating control.

### Main

- Scene grid (`.scenes-grid`) with scene cards (`.scene-item`), images, kebab actions, descriptions.
- Opening tutorial paragraph MUST start with `Welcome to Docs!`.
- Closing FAQ / support mentions MUST be inert buttons (no outbound href).

---

## 7. Interactions (capture polish)

`assets/app.js` MUST:

1. Append `#capture-toast` and show brief feedback on inert-nav clicks.
2. Capture-phase block residual `a[href]` navigation.
3. Wire Tile / List / Slide icon buttons in `.storyboard-nav` to toggle `.scenes-grid` classes `is-list` / `is-slide` (slide shows first scene column only).
4. Add focus/click editing affordance class `is-editing` on `.scene-description`.
5. Stagger fade/slide-in for `.scene-item` on load.

CSS MUST include hover lift for `.scene-item`, toast styles, list/slide layout overrides, and `button.inert-nav` resets.

---

## 8. Rebuild procedure

```bash
# Source must exist as _source-capture.html (copy from Downloads; do not delete original)
python3 build_capture.py
python3 -m http.server 8768
```

The build script MUST:

1. Extract all `<style>` blocks into `assets/app.css`, extract Gabarito data-URI fonts to `assets/fonts/`, replace `--savepage-url-6` logo with the generic mark.
2. Map scene `<img>` tags to `./assets/scenes/scene-0N.webp` (may briefly fetch CDN bytes as a cache seed).
3. Run `generate_scenes.py` to overwrite scene files with debranded instructional art (original CDN frames contain product wordmarks / mascot marks and MUST NOT ship).
4. Drop scripts, savepage meta, JWT / auth data attributes.
5. Convert all `<a>` to `button.inert-nav` (innermost-first).
6. Apply debrand string table from §4.
7. Fail if any user-visible `StoryBoom` / `storyboom` text remains in HTML text nodes.

---

## 9. Acceptance checklist

- [ ] `python3 -m http.server` from `StoryDocs/` loads `index.html` with title **1. Getting Started — Docs**
- [ ] No navigational `<a href>` in the document
- [ ] No visible “StoryBoom” / “storyboom” strings; no JWT / user email
- [ ] Eight scene images render from `./assets/scenes/`
- [ ] Logo shows generic mark (not original product lettermark)
- [ ] Tile / List / Slide toggles change layout; toast appears on inert controls
- [ ] Scene cards have hover lift; descriptions show editing affordance
- [ ] Gabarito font loads; yellow accent chrome intact
- [ ] Sibling folders (DaisyUI, MaterialUI, etc.) untouched
