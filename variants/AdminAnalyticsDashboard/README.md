# Admin Analytics Dashboard

Clean-room rebuild of the Pineapple Tech commerce operations dashboard (DaisyUI drawer shell).

## Stack

- DaisyUI 5 + Tailwind CSS 4 (CDN)
- `@weblogin/trendchart-elements` charts (`tc-column`, `tc-pie`, `tc-line`)
- `external-svg-loader` + local Heroicons SVGs
- `theme-change` light/dark toggle
- Authored `styles.css` / `app.js` (no compiled `tw-*` monolith)

## Constraints

- Zero navigational `<a href>` — inert `button` controls only
- Sidebar FOUC guard + scroll restore via `sessionStorage`
- Normative copy/metrics match the source demo PRD

## Serve

```bash
cd variants/AdminAnalyticsDashboard && python3 -m http.server 9301
# open http://127.0.0.1:9301/
```
