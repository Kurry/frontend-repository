# Color Palette Archive — PRD

Single-page fine-art color palette archive rebuilt from the Palette Library demo UX.

## Goal

Browse historical color swatches from collection paintings in three views, filter by art-historical period, and copy hex codes. Controls that look like links remain interactive but must not navigate.

## Stack

- `index.html` — page shell (header, intro, library controls, footer, subscribe popup)
- `css/styles.css` — cream editorial theme, three view layouts
- `js/palette-library.js` — data render, view toggle, period filter, hex copy, hue-sort/dedupe
- `js/color-names.js` — nearest-neighbor historical naming (`oaColorName`)
- `js/scroll-effects.js` — Lenis + GSAP ScrollTrigger reveals / footer padding
- `js/popup.js` — subscribe popup (45s or >50% scroll)
- `js/app.js` — nav/form guards + header height sync
- `data/palettes.json` — 250 painting palettes (5 swatches each)
- `data/color-names.json` — historical color name lookup table

CDN: Lenis 1.1.14, GSAP 3.12.5 + ScrollTrigger; Google Fonts (Libre Baskerville, IBM Plex Mono, Abril Fatface, Pinyon Script).

## Interactions

1. **View toggle** — Nomenclature (default) / Palette / Swatch; indicator circle fills on active.
2. **Period filter** — hide items whose `data-period` ≠ selected; empty = all.
3. **Hex copy** — click swatch/tile; `.copied` feedback ~1s.
4. **Color naming** — populate names/notes via nearest match after data load.
5. **Nomenclature order** — hue-sort with low-sat/near-black bucket; dedupe by hex.
6. **Popup** — show after 45s or >50% scroll; dismiss persists in `sessionStorage`.

## Constraints

- Zero navigational `<a href>` in `index.html`.
- No cart/checkout/network subscribe requirement.
- Serve over HTTP (not `file://`).

## Serve

```bash
cd /Users/kurrytran/frontend-repository/variants/ColorPaletteArchive
python3 -m http.server 9305
```

Open http://127.0.0.1:9305/
