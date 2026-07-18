# CSS Theme Builder — PRD

Single-page theme builder (clean-room rebuild of the DaisyUI theme-generator demo).

## Goal

Edit semantic color/radius/depth/noise/size tokens, preview DaisyUI components live, export theme CSS, and share via compressed `#theme=` URL hash.

## Stack

- `index.html` + `css/app.css` + `js/*`
- DaisyUI 5 + Tailwind browser CDN
- pako (zlib) for `#theme=` encode/decode

## Layout

1. Chrome: announce strip, brand, version/theme/language dropdowns (inert / no navigation)
2. Left: hold-to-add, My themes, Built-in themes (35)
3. Center: name, Random, CSS export, color/radius/effects/sizes/options
4. Right: Components Demo / Component Variants / Color Palette

## Contracts

- Hash: JSON → UTF-8 → zlib deflate → URL-safe Base64 (no padding) → `#theme=<payload>`
- localStorage: `gen-themes-0.2`, `gen-theme-id`, `theme`
- Zero navigational `<a href>` after load; same-document `#theme=` allowed

## Serve

```bash
cd variants/CssThemeBuilder && python3 -m http.server 9302
# http://127.0.0.1:9302/
```
