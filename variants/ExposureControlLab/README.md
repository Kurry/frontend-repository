# Exposure Control Lab — Product Requirements

Interactive aperture / shutter / ISO exposure triangle lab. Adjust stops; the preview updates brightness, depth-of-field blur, motion frames, noise, and the exposure meter. No outbound navigation.

## Stack

| Path | Role |
|------|------|
| `index.html` | Single-page shell |
| `css/styles.css` | Layout, dials, meter, help |
| `js/lab.js` | Exposure math + UI bindings |
| `assets/` | Local photo, motion frames, noise, icons |
| GSAP 3.12.2 (CDN) | Exposure-meter animation |
| Oswald (Google Fonts) | UI type |

## Serve

```bash
cd variants/ExposureControlLab && python3 -m http.server 9308
# open http://127.0.0.1:9308/
```

## Stops (defaults)

- Aperture: `22, 16, 11, 8, 5.6, 4, 2.8, 1.8` (default `16`; up UI narrows)
- Shutter: `2 … 1000` as `1/N` (default `60`)
- ISO: `50 … 3200` (default `100`)

## Constraints

- Zero navigational `<a href>` elements
- Steppers are `<button type="button">`
- Help is an inert toggle (no outbound URLs)
- All imagery loads from `./assets/`
