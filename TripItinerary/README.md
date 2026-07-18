# TripItinerary — Product Requirements Document (PRD)

This PRD specifies the **exact** static debranded travel itinerary planner delivered in this folder. An implementer or AI given only this document must be able to recreate the same page: sidebar + plan body + map chrome, French Riviera trip content, SavePage repairs, inert navigation, and the **debrand** contract.

**Behavioral / visual reference:** collaborative trip-planner UIs with day itinerary, place cards, and an embedded map panel (original SavePage source was a branded Wanderlog plan page).  
**Local acceptance target:** the files in this directory after debranding, CSS vendoring, and SavePage repair (not a live SaaS app).

---

## 1. Goal

Build a single-page **travel itinerary / trip planner** demo for a **French Riviera — Côte d'Azur** trip. Users can browse the captured plan structure (sidebar days, explore cards, place detail overlay, map pane). Every former outbound link must be removed or replaced with a non-navigating control. Product branding must be generic (**Trip** / **Travel Planner**), never the original host brand.

---

## 2. Non-goals

- No live backend, auth, booking, payments, or AI assistant APIs.
- No Google Maps JavaScript API (map is a static SavePage snapshot / image tiles already in the capture).
- No chat widgets, analytics, Amplitude, GTM, Stripe, or Tiledesk.
- No multi-page routing or dependency on `wanderlog.com` / original brand assets.
- Do not reset or touch any database.
- Do not modify sibling folders (`DaisyUI`, `CameraExposure`, `MediaTimeline`, etc.).

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** navigational `<a href="...">` elements.
- Allowed `href` / `src` usages are resource loads only: stylesheets, scripts, fonts, images, favicon.
- Former links MUST become `<button type="button" class="… inert-nav">` (or inert spans) that preserve look and feel.
- Clicks MUST NOT change `location`, open new tabs, trigger `mailto:` / `tel:`, or load other HTML pages.
- Demo feedback: clicking inert controls MAY show a short toast (`#capture-toast`) such as `"About — demo only"`.

### CSS support for inert controls

`css/styles.css` MUST reset UA button chrome for `button.inert-nav` / `span.inert-nav` so navbar brand, sidebar items, and cards still match original link styling.

---

## 4. Debrand requirements (critical)

### MUST neutralize / replace

| Original identity cue | Local placeholder |
|---|---|
| Brand name Wanderlog | `Trip` |
| Site / product name in meta | `Travel Planner` |
| Logo / favicon from brand host | `./assets/logo.svg`, `./assets/favicon.svg` |
| Title `… – Wanderlog` | `Trip to the French Riviera — Côte d'Azur \| Travel Planner` |
| `og:site_name` / Twitter titles | Generic Travel Planner / trip title (no brand) |
| `wanderlog.com` URLs in copy / mailto | `example.com` / `support@example.com` |
| “Popular guide by a Wanderlog community member” | `Popular community travel guide` |
| Support chat “Wanderlog support” | Hidden via CSS; copy scrubbed to `Travel support` if residual |
| Canonical / OG image pointing at brand host | Removed; local favicon only |
| SavePage meta (`savepage-*`) | Removed |

### MUST preserve

- French Riviera / Côte d'Azur trip topic and place content (Nice, Antibes, Monaco, Cannes, Musée Picasso, etc.).
- Plan chrome: sidebar (Explore / Notes / Places / day list), header (Share, Trip plan), map pane, place detail card tabs (About / Book / Reviews / Photos / Mentions).
- Visual system from vendored app CSS (layout, cards, orange accents, Source Sans Pro).
- Microinteractions: toast on inert click, hover opacity on inert controls, active press scale, optional card hover lift.

---

## 5. Tech stack & file layout

| Path | Role |
|---|---|
| `_source-capture.html` | Untouched copy of the Downloads SavePage capture |
| `build_capture.py` | Rebuild pipeline (vendor CSS, extract inline CSS, debrand, inert nav) |
| `index.html` | Single page markup (debranded body + local head) |
| `css/styles.css` | Capture polish: inert nav, hide chat/PRO badges, toast |
| `css/capture-inline.css` | Non-tracking inline styles extracted from the capture |
| `js/app.js` | Toast + click blockers + light demo affordances |
| `vendor/css/*.css` | Vendored `itin-compiled.azureedge.net` stylesheets |
| `assets/logo.svg` | Generic Trip wordmark |
| `assets/favicon.svg` | Generic Trip mark |
| `README.md` | This PRD |

Serve locally:

```bash
cd TripItinerary && python3 -m http.server 8791
# open http://127.0.0.1:8791/
```

Rebuild after editing the pipeline:

```bash
cd TripItinerary && python3 build_capture.py
```

---

## 6. Document shell

- Title: **Trip to the French Riviera — Côte d'Azur | Travel Planner**
- Meta description / OG / Twitter: generic travel-planner wording; **no** Wanderlog, no original plan URL, no brand OG image.
- Fonts: Google Fonts link for Source Sans Pro (allowed remote stylesheet for type).
- App CSS: local `./vendor/css/` + `./css/capture-inline.css` + `./css/styles.css`.
- Script: `./js/app.js` (defer only; do **not** restore SavePage `type="text/plain"` tracking scripts).

---

## 7. Layout architecture

Captured SPA shell (static HTML snapshot):

1. **Left sidebar** — brand mark, AI Assistant control (inert), Overview (Explore / Notes / Places), Itinerary day list, Support / Hide sidebar (inert).
2. **Main plan column** — hero cover + trip title input “Trip to the French Riviera - Cote d'Azur”, Browse all, guide/hotel cards, place suggestion strip, day sections / place lists as present in the capture.
3. **Right map pane** — static map canvas from capture, Export / Optimize / layer controls (inert; yellow PRO badges hidden), place detail overlay when present in the snapshot.
4. **Toast** — fixed bottom pill `#capture-toast` for demo-only feedback.

---

## 8. SavePage repair checklist (normative)

The pipeline MUST:

1. Copy the Downloads HTML into `_source-capture.html` (never delete the Downloads original).
2. Download every `itin-compiled.azureedge.net` stylesheet referenced by `<link rel="stylesheet">` into `vendor/css/` and rewrite head links to `./vendor/css/…`.
3. Extract useful `<style>` blocks into `css/capture-inline.css`; skip Tiledesk / chat21 / empty SavePage CSS variable stubs / broken Google font faces with empty `url()`.
4. Restore `/*savepage-url=…*/ url()` stubs via `fix_savepage_css_urls` when kept.
5. Strip all `<script>` / `<noscript>` from the capture; ship only `js/app.js`.
6. Strip iframes and hide chat/support floating chrome via CSS.
7. Restore empty/`about:` image `src` from `data-savepage-currentsrc` / `data-savepage-src` when http(s).
8. Replace brand logo `<img alt="Wanderlog" class="Logo__…">` with `./assets/logo.svg` and `alt="Trip"`.
9. Convert all anchors to inert buttons (zero remaining `<a>`).
10. Apply debrand string table; scrub residual `wanderlog` case-insensitively.
11. Rebuild `<head>` with generic meta + local assets + Google Fonts Source Sans Pro.

---

## 9. Interaction requirements

1. **Inert navigation** — all former links are buttons; toast on click; URL never changes away from the served page.
2. **Fragment jumps** — if any residual `#id` href existed, in-page smooth scroll is allowed; external hrefs are blocked.
3. **Sidebar / tab pressed state** — optional `aria-pressed` / `is-demo-active` on click for demo affordance (does not fetch new data).
4. **Hover polish** — inert controls opacity; place/carousel cards slight `translateY(-2px)` on hover when selectors match.
5. **Reduced motion** — toast / button transitions disabled when `prefers-reduced-motion: reduce`.
6. **Hidden chrome** — Tiledesk/chat, floating assistant, iframes, `.Badge__yellowWithWhiteText` PRO badges.

---

## 10. Acceptance criteria

1. `python3 -m http.server` from `TripItinerary/` serves `index.html` with local CSS/JS/logo/favicon HTTP 200.
2. Page title and visible brand read as **Trip** / **Travel Planner**; **zero** case-insensitive `wanderlog` substrings in `index.html`.
3. Zero navigational `<a>` elements; clicking Share / About / sidebar items does not navigate off-page.
4. French Riviera itinerary structure remains visible (days, places such as Musée Picasso / Antibes region, map pane).
5. Toast appears on inert control click.
6. PRO yellow badges are not visible; support chat widget is not visible.
7. Original file still exists under Downloads after the copy.

---

## 11. Out of scope

- Live Maps API keys, booking flows, collaborative editing, undo/redo persistence
- Rehydrating the original React SPA bundles
- Retheming the trip destination away from the French Riviera (content topic stays)
- Sibling product folders in this workspace
