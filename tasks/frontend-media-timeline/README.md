# MediaTimeline — Product Requirements Document

## Product

**MediaTimeline** is a frontend-only interactive timeline explorer for the **history of media and communication** (writing systems → print → telecom → broadcast → networked platforms).

It is a debranded, rethemed recreation of a cultural/historical timeline UX pattern (horizontal scrubbing, category filters, event detail panels, era labels). It is **not** affiliated with any original brand or organization.

## Goals

- Let a visitor scrub a multi-millennium year window and discover dense milestone events.
- Support filter/search without leaving the page.
- Preserve timeline interaction feel: pan, zoom, dual-handle range, hover labels, detail panel.
- Run locally via static files (`python3 -m http.server`) with no backend.

## Non-goals

- No Mapbox/globe integration, no analytics, no outbound navigational links.
- Not a scholarly corpus; event text is illustrative for product/UX density.
- No authentication, database, or CMS.

## Information architecture

```
MediaTimeline/
  index.html          # Shell: header, stage, scrubber, about overlay
  css/styles.css      # Layout, microinteractions, responsive rules
  js/data.js          # Normative event/category/era corpus (window.MT_DATA)
  js/app.js           # Rendering, filters, pointer/wheel, detail panel
  assets/favicon.svg  # Neutral brand mark
  README.md           # This PRD
```

## Visual / brand contract

| Token | Role |
| --- | --- |
| Product name | `MediaTimeline` (hero-level in header) |
| Tagline | History of Media & Communication |
| Display type | Fraunces |
| Body type | Sora |
| Accent | Teal `#0d7c8f` with warm secondary `#c45c26` |
| Background | Cool mist gradients (not warm cream / purple AI defaults) |

Neutral placeholders only — no third-party logos, org names, or original-site attribution.

## Interaction requirements

1. **Timeline stage** — Canvas axis + absolutely positioned event pins in year lanes.
2. **Pan** — Pointer drag pans pins/axis (`panX`).
3. **Zoom / scrub** — Wheel zooms year window around midpoint; Shift+wheel (or dominant deltaX) translates the window.
4. **Range scrubber** — Dual range inputs set `from`/`to` years; readout shows formatted BCE/CE.
5. **Filters** — Category checkboxes + free-text search + numeric year fields.
6. **Detail panel** — Opens on pin click; Previous/Next and ←/→ step among filtered events; Escape closes.
7. **About** — Modal with how-to copy; no external links.
8. **Empty state** — Visible when filters/range yield zero events.
9. **Reduced motion** — CSS disables transitions/animations when preferred.

## Data schema (`window.MT_DATA`)

All keys below are **required** unless marked optional.

```json
{
  "productName": "string",
  "tagline": "string",
  "description": "string",
  "yearMin": "number",
  "yearMax": "number",
  "defaultFrom": "number",
  "defaultTo": "number",
  "categories": [{ "id": "string", "label": "string", "color": "css-color" }],
  "eras": [{ "id": "string", "label": "string", "from": "number", "to": "number" }],
  "events": [{
    "id": "string",
    "title": "string",
    "year": "number",
    "place": "string",
    "categories": ["category-id"],
    "summary": "string",
    "detail": "string"
  }]
}
```

- Years before 1 CE are negative integers (e.g. `-3200`).
- Each event must reference one or more existing `categories[].id` values.
- Target cardinality: **~60 events**, **≥10 categories**, **≥5 eras** so the UI remains dense across zoom levels.

## Retheme / regeneration recipe

To regenerate this exact product class with a **different coherent topic**:

1. Copy `MediaTimeline/` to a new folder named for the interaction pattern + topic (e.g. `CinemaTimeline/`).
2. Replace `js/data.js` corpus: titles, summaries, places, categories, eras, year span — keep similar event count.
3. Update `index.html` title, meta description, OG tags, header tagline, and about copy.
4. Adjust CSS accent tokens if the topic needs a distinct palette; keep typography pairing expressive (non-default stacks).
5. Keep `app.js` interaction contract unchanged unless schema keys change (then update both data + app).
6. Remove any leftover brand strings; ensure no outbound `http(s)` navigational links in UI chrome.
7. Verify with `python3 -m http.server` and a browser pass (pan, zoom, filter, detail, about).

## Acceptance checks

- [ ] Folder is `MediaTimeline/` (describes the UI product, not a prior brand).
- [ ] Topic is media/communication history — no prior cultural-org branding visible.
- [ ] `index.html` + extracted CSS/JS/assets; works offline aside from optional Google Fonts.
- [ ] Timeline pan, zoom, range scrub, filters, detail panel all function.
- [ ] About/help has no outbound navigational links.
- [ ] Mobile: filters/detail stack to bottom; header remains usable.

## Local verify

```bash
cd MediaTimeline
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```
