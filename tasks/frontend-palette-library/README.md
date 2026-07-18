# Palette Library (Object & Archive) — Product Requirements Document (PRD)

This PRD specifies the **exact** static Palette Library page delivered in this folder. An implementer or AI given only this document must be able to recreate the same page: layout, copy, palette data views, microinteractions, typography, and the **no-navigation** constraint.

**Visual / behavioral reference:** [https://objectandarchive.com/pages/palette-library](https://objectandarchive.com/pages/palette-library)  
**Local acceptance target:** the files in this directory after SavePage repair, asset vendoring, link removal, and interaction restore (not a multi-page Shopify storefront).

---

## 1. Goal

Build a single-page **fine-art color palette library** for the brand **Object & Archive (O&A)**. Visitors browse historical color swatches extracted from collection paintings in three interchangeable views, filter by art-historical period, and copy hex codes. Every control that looks like a link or CTA must remain interactive in appearance (hover, focus, cursor) but **must not navigate** anywhere.

---

## 2. Non-goals

- No real Shopify cart, checkout, account auth, or localization POSTs.
- No marketing pixels, Klaviyo network subscribe (local demo may fake success), Facebook, or GTM.
- No multi-page routing to product PDPs or collection pages.
- Do not reset or touch any database.

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** `<a href="...">` used as navigation.
- The only allowed navigational-like `href` usages are **resource loads**: stylesheet `<link href="./styles.css">` and script `src` / font `url(...)` paths.
- Replace every former storefront link with a non-navigating control that preserves look and feel:
  - Header logo, MENU, CART, mega-menu items, drawer links, footer columns, painting titles → `<button type="button" class="… inert-nav">`
  - Skip-to-content style fragments may be `<span class="… inert-nav">`
- Clicks MUST NOT change `location`, open new tabs, or load other HTML pages.
- `app.js` MUST `preventDefault` on residual `<a href>` clicks and on form `submit`.

### CSS support for inert controls

Reset UA button chrome for `button.inert-nav` and related former-link classes (`appearance: none`, transparent background, no border, inherit font/color, `cursor: pointer`) while preserving site hover underlines / opacity transitions (especially `.nomenclature-source__title:hover`, menu item hover).

---

## 4. Tech stack & file layout

| File / path | Role |
|-------------|------|
| `index.html` | Single page markup (Shopify Dawn-derived structure, static) |
| `styles.css` | Extracted theme + section CSS (~790KB): base, fabrik, palette-library, header/footer, popup |
| `palette-library.js` | View toggle, period filter, hue-sort/dedupe, hex copy, OA name populate |
| `scroll-effects.js` | Lenis smooth scroll + GSAP ScrollTrigger reveals / footer reveal padding |
| `popup.js` | Subscribe popup show/dismiss (local; no required network) |
| `app.js` | Nav/form guards + `--header-height` sync |
| `vendor/` | jQuery 3.7.1, Dawn helpers (`global.js`, `constants.js`, `pubsub.js`, details disclosure/modal), `oa-color-library.js`, Lenis 1.1.14, GSAP 3.12.5 + ScrollTrigger |
| `vendor/fonts/` | Abril Fatface, HAL Timezone Book / BookItalic / Mono, Desmontilles script |
| `_source-capture.html` | Unmodified SavePage source (do not serve as primary) |
| `build_capture.py` | Optional regenerator from the SavePage source |

### Runtime libraries (exact local copies)

- jQuery 3.7.1 — `./vendor/jquery-3.7.1.min.js`
- Lenis 1.1.14 — `./vendor/lenis.min.js`
- GSAP 3.12.5 + ScrollTrigger — `./vendor/gsap.min.js`, `./vendor/ScrollTrigger.min.js`
- `oa-color-library.js` — nearest-neighbor historical color naming (`oaColorName(hex)`)

Prefer **relative paths** for all local CSS/JS/fonts.

Serve via local HTTP (required for modules/fonts/clipboard in some browsers):

```bash
cd PaletteLibrary && python3 -m http.server 8791
# open http://127.0.0.1:8791/
```

Do **not** rely on `file://`.

---

## 5. Document shell

```html
<!DOCTYPE html>
<html class="js lenis" lang="en" style="--header-height: 73px;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Palette Library – Object &amp; Archive</title>
  <meta name="description" content="Explore our interactive Palette Library. Browse hundreds of fine art color palettes from famous paintings, searchable by specific artist or art movement." />
  <link rel="stylesheet" href="./styles.css" />
</head>
<body class="gradient template-page title-palette-library">
  <!-- sticky header group, MainContent sections, footer group, oa-popup -->
  <!-- deferred vendor + app scripts -->
</body>
</html>
```

- Brand background scheme: warm off-white `--color-background: 249,248,242` (`#f9f8f2`) with near-black foreground.
- Body classes MUST include `template-page title-palette-library` (and `gradient` as in capture).

---

## 6. Layout architecture

### 6.1 Chrome

1. **Sticky header** with O&A script logo lockup (“THE O&A PALETTE LIBRARY”), centered **MENU** control, right **CART** control.
2. Optional announcement / utility strip may appear above header (muted taupe band matching live).
3. Mobile drawer / mega-menu markup may remain for visual parity but MUST be inert (no navigation).
4. **Footer group** sticks behind main content; `#MainContent` gets dynamic `padding-bottom` equal to footer height (scroll-effects).

### 6.2 Intro (rich-text / grid)

1. Large serif lead: explains browsing by painting, swatches, and color across centuries.
2. Two-column monospace body:
   - Left: historical naming sources (Werner’s *Nomenclature of Colours*, Winsor & Newton, Cennini).
   - Right: open-source / ongoing dataset framing.

### 6.3 Palette library section

Container: `#PaletteLibrary-template--27515259093026__palette_library_GpBcQB` (section id suffix may vary if regenerated from theme; keep stable in this deliverable).

**Controls row**

- Left: radio-style view toggles (custom labels, not native radio UI chrome):
  - Nomenclature View (default `active`)
  - Palette View
  - Swatch View
- Right: `Filter by Period:` + `<select>` with All Periods plus: Abstract + Geometric, Americana, Baroque to Neoclassical, Expressionism, Fauvism, Medieval, Modern, Old Masters, Post-Impressionism, Primitive + Folk, Realism, Romanticism, Symbolism, Tonalism.

**Views**

1. **Nomenclature** (`#nomenclature-view-…`, grid, default `active`): header row Hex / Name / Notes / Painting; data rows with swatch square, hex, italic name, notes, painting title button.
2. **Palette** (`#palette-view-…`): responsive card grid (5→4→3→2 columns by breakpoint); each card shows 5 swatches + painting meta.
3. **Swatch** (`#swatch-view-…`): large color tiles; hover reveals hex, historical name, painting title; text color flips by luminance.

Item counts in this capture (order after hue-sort/dedupe may reduce nomenclature rows):

- ~1,217 nomenclature rows (deduped by hex)
- 250 palette cards
- ~1,237 swatch tiles

Each item carries `data-period` and (where applicable) `data-hex`.

---

## 7. Interactions (MUST)

### 7.1 View toggle

Clicking a `.palette-library__toggle-option`:

- Sets `active` on that option; fills its indicator SVG circle with `currentColor`; clears others to `transparent`.
- Toggles `.palette-library__view.active` so exactly one of nomenclature / palette / swatch is shown (`display: grid` when active).

### 7.2 Period filter

On `<select>` `change`:

- Empty value → show all items (`hidden = false`).
- Otherwise set `hidden` when `dataset.period !== selected` for nomenclature rows, palette cards, and swatch tiles.

### 7.3 Hex copy

Clicking `.nomenclature-swatch`, `.palette-card__swatch`, or `.swatch-tile` (not the painting title control):

- Copies hex string to clipboard (`navigator.clipboard` with `execCommand` fallback).
- Adds `.copied` for ~1000ms (checkmark / “Copied” overlay per CSS).

### 7.4 Color naming

On load, after `oaColorName` is available, populate `[data-color-name]` / `[data-color-note]` and swatch tile names from nearest match in `OA_COLOR_NAMES`.

### 7.5 Nomenclature ordering

On load: sort nomenclature rows by hue (with low-saturation/near-black bucket), dedupe by hex, keep header first.

### 7.6 Smooth scroll / reveal

- Lenis duration `1.4` with exponential easing; sync GSAP ticker + ScrollTrigger.
- `[data-scroll-reveal]`, `[data-parallax]` (desktop), `[data-reveal]`, `[data-reveal-group]` behave as on live.
- Footer reveal padding on `#MainContent`.

### 7.7 Subscribe popup (`#oa-popup`)

- NOT visible on first paint.
- Show after 45s **or** >50% scroll, whichever first.
- Close sets `sessionStorage['oa-popup-dismissed']`.
- Submit MUST `preventDefault`; may show local success state without requiring network.

### 7.8 Swatch luminance text

For each `.swatch-tile`, compute perceived luminance; set hex/name/title color to `rgba(0,0,0,0.6)` if light else `rgba(255,255,255,0.82)`.

---

## 8. Typography & color

- Headings / painting titles: custom heading face (HAL Timezone Book family via `CustomHeadingFont` / `xl`).
- Body paragraphs in intro columns: mono (`CustomParagraphFont` / `mono` / HAL Timezone Mono).
- Color names: italic face (`CustomItalicFont` / `xl-italic`).
- Captions / UI labels: caption face; uppercase + tracked letter-spacing where theme specifies.
- Script wordmark / popup placeholders: `script` (Desmontilles).
- Decorative Abril Fatface may load for specific headings.
- Background `#f9f8f2`; hairline black rules on nomenclature rows; no purple/glow UI chrome.

---

## 9. Capture repair requirements (implementation notes)

When rebuilding from a browser SavePage HTML:

1. Copy source into a new workspace folder; keep Downloads original intact.
2. Extract all `<style>` blocks to `styles.css`; fix empty `/*savepage-url=…*/ url()` font/src to local `./vendor/fonts/…`.
3. Replace all `type="text/plain"` emptied scripts: drop analytics; restore critical theme JS + Lenis/GSAP from CDN into `vendor/`.
4. Restore the **inline palette library IIFE** (stripped by SavePage) as `palette-library.js`.
5. Unhide `.nomenclature-row`, `.palette-card`, `.swatch-tile` that SavePage serialized with `hidden=""`.
6. Convert all `<a href>` to inert buttons/spans.
7. Verify over `python3 -m http.server`, not `file://`.

---

## 10. Acceptance criteria

1. `http://127.0.0.1:<port>/` loads without console-breaking missing CSS/JS (fonts 200).
2. Zero navigational `<a href>` in `index.html`.
3. Default view is Nomenclature with visible rows and painting titles as non-navigating buttons.
4. Palette View and Swatch View switch with indicator fill animation parity to live.
5. Period filter hides/shows the correct subsets; All Periods restores full set.
6. Swatch click shows copied feedback; hex reaches clipboard when permissions allow.
7. Historical names/notes populate via `oaColorName`.
8. Smooth scrolling (Lenis) and footer reveal padding engage.
9. Subscribe popup can be dismissed; does not hard-depend on third-party success.
10. Visual parity: cream field, O&A lockup, editorial serif lead, monospace notes, hairline table.

---

## 11. How to open (local)

```bash
cd /Users/kurrytran/frontend-repository/PaletteLibrary
python3 -m http.server 8791
```

Open [http://127.0.0.1:8791/](http://127.0.0.1:8791/).
