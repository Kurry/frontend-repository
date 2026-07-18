# Camera Exposure Simulator — Product Requirements Document (PRD)

This PRD specifies the **exact** static camera exposure simulator delivered in this folder. An implementer or AI given only this document must be able to recreate the same page: layout, exposure controls, preview effects, copy, and the **no-navigation** constraint.

**Behavioral reference:** interactive aperture / shutter / ISO exposure triangle demos (original SavePage source was a branded Webflow page).  
**Local acceptance target:** the files in this directory after debranding, asset vendoring, and SavePage repair (not a live CMS site).

---

## 1. Goal

Build a single-page **interactive camera exposure simulator**. Users adjust aperture, shutter speed, and ISO; the preview updates brightness, depth-of-field blur, motion-blur frames, noise, and an exposure meter. Every former outbound link must be removed or replaced with a non-navigating control.

---

## 2. Non-goals

- No real camera hardware, WebGL RAW pipeline, or photo upload.
- No product/site personal branding, credits to authors, or marketing CTAs.
- No multi-page routing or dependency on the original host (`exposure.tools` or Typekit).
- Do not reset or touch any database.

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** `<a href="...">` used as navigation.
- Allowed `href` / `src` usages are resource loads only: stylesheets, scripts, fonts, images.
- Control steppers MUST be `<button type="button">` (not `<a href="#">`).
- Help triggers MUST be inert divs/buttons with click handlers (no outbound URLs).
- Clicks MUST NOT change `location`, open new tabs, or load other HTML pages.

---

## 4. Tech stack & file layout

| Path | Role |
|------|------|
| `index.html` | Single page markup |
| `css/normalize.css` | Normalize CSS v3 |
| `css/fonts.css` | Local `@font-face` (Bebas Neue + Oswald; aliases for original family names) |
| `css/styles.css` | Simulator layout + control chrome + polish |
| `js/exposure.js` | Exposure triangle logic + help toggle |
| `vendor/gsap.min.js` | GSAP 3.12.2 (exposure meter animation) |
| `vendor/fonts/*.woff2` | Vendored webfonts |
| `assets/background.jpg` | Main depth / base photograph |
| `assets/motion-01.jpg` … `motion-10.jpg` | Shutter-speed motion frames (slow → fast) |
| `assets/iso-noise.jpg` | Tiled ISO noise texture |
| `assets/arrow.svg`, `arrow-up.svg`, `arrow-mob-*.svg` | Control chevrons |
| `assets/load_triangle.svg` | Favicon |

Serve locally:

```bash
cd CameraExposure && python3 -m http.server 8766
# open http://127.0.0.1:8766/
```

---

## 5. Document shell

- Title: **Camera Exposure Simulator**
- Meta description/OG/Twitter: generic exposure-simulator wording (no brand names, no author names, no original site URLs or OG images).
- Body: full-viewport simulator, `overflow: hidden`.

---

## 6. Layout architecture

Full-viewport stack (`100vw` × `100vh`):

1. **Noise layer** — `#noise-overlay` absolute, multiply blend, tiled `iso-noise.jpg`
2. **Image stack** — `#image-container`
   - `#motion-container` with 10 `.motion-image` frames (opacity swapped by shutter)
   - `#depth-image` with `background.jpg` (CSS `filter: blur(...)` from aperture)
3. **Controls** — right side (bottom row on narrow mobile): help trigger + aperture + shutter + ISO dials
4. **Exposure bar** — left vertical meter with `#exposure-dot`
5. **Help panel** — slides in from the right; educational copy only
6. **Brand chip** — inert label “Camera Exposure Simulator” (not a link)

---

## 7. Interactive behavior (normative)

### Stops

| Control | Stops (in order) | Default |
|---------|------------------|---------|
| Aperture | `22, 16, 11, 8, 5.6, 4, 2.8, 1.8` | `16` |
| Shutter | `2, 4, 8, 15, 30, 60, 125, 250, 500, 1000` (shown as `1/N`) | `60` |
| ISO | `50, 100, 200, 400, 800, 1600, 3200` | `100` |

Aperture UI is **inverted**: the “up” button moves toward a wider aperture (lower f-number).

### Visual mappings

- **Brightness** on `#image-container`:  
  `stops = 2·log2(16/aperture) + log2(60/shutter) + log2(iso/100)`  
  `brightness% = 120 · 1.2^stops`
- **Depth of field** on `#depth-image`: `blur = max(0.2, 20 / aperture^1.1)` px
- **Motion**: show `motion-(index+1)` where `index = shutterStops.indexOf(shutter)` (opacity 1 vs 0)
- **Noise**: `opacity = clamp(0 … 0.5, log2(iso/100) · 0.1)`
- **Exposure dot**: GSAP animate `top` from a click-based net stop counter (base 50%, ±10% per step, clamped 5–95%)

### Help panel

- `?` / `X` trigger toggles `.is-open` on `.help-content` and the trigger.
- Panel starts off-screen (`translateX(630px)`, `opacity: 0`).

### Edge buttons

Hide (opacity 0 + `pointer-events: none`) when at the first/last stop for that control.

---

## 8. Image requirements

- Main photograph MUST be photographically rich (highlights + shadows) so exposure/brightness reads clearly.
- MUST NOT use the original branded demo photograph URLs.
- Motion frames MUST match the same scene (generated progressive horizontal motion blur is acceptable).
- All image references MUST be local under `./assets/` (no broken remote URLs).

---

## 9. Debranding checklist

- Remove author/site credits and outbound personal/portfolio links.
- Remove Webflow / Typekit / original-site meta, favicons from brand hosts, and SavePage stubs (`type="text/plain"`).
- Generic title and social meta only.
- No navigational `<a>` elements.

---

## 10. Acceptance criteria

1. `python3 -m http.server` from `CameraExposure/` serves a working page with no console 404s for local assets.
2. Aperture, shutter, and ISO steppers update labels and preview (brightness, blur, motion frame, noise).
3. Exposure meter dot animates.
4. Help panel opens/closes; no outbound navigation anywhere.
5. Preview image is **not** the original demo photo; all assets load locally.

---

## 11. Out of scope

- Webflow runtime, jQuery, Slater remote modules, Typekit kits
- Real EXIF / histogram / RAW processing
- Multi-language help copy
