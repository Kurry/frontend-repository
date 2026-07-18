# MediaHistoryTimeline — Product Requirements Document

## Product

**MediaHistoryTimeline** is a frontend-only interactive timeline explorer for the history of media and communication (writing systems → print → telecom → broadcast → networked platforms).

## Goals

- Scrub a multi-millennium year window and discover dense milestone events.
- Filter/search without leaving the page.
- Preserve timeline interaction feel: pan, zoom, dual-handle range, hover labels, detail panel.
- Run locally via static files with no backend.

## Non-goals

- No Mapbox/globe, analytics, or outbound navigational links.
- Not a scholarly corpus; event text is illustrative.
- No authentication, database, or CMS.

## Structure

```
MediaHistoryTimeline/
  index.html
  css/styles.css
  js/data.js
  js/app.js
  assets/favicon.svg
  README.md
```

## Visual contract

| Token | Value |
| --- | --- |
| Product name | `MediaHistoryTimeline` |
| Tagline | History of Media & Communication |
| Display | Fraunces |
| Body | Sora |
| Accent | Teal `#0d7c8f` with warm `#c45c26` |

## Interactions

1. Timeline stage with canvas axis and event pins
2. Pointer pan; wheel zoom; Shift+wheel scrub
3. Dual-handle year scrubber with BCE/CE readout
4. Category filters, search, year fields
5. Detail panel with Previous/Next and ←/→; Escape closes
6. About modal (no external links)
7. Empty state when filters yield zero events
8. Reduced-motion CSS respect

## Local verify

```bash
cd variants/MediaHistoryTimeline
python3 -m http.server 9309
# open http://127.0.0.1:9309/
```
