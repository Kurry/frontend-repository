# Palette Library — Object and Archive (o+a)

A fine-art colour archive: every palette in the collection, each swatch paired
with its nearest historical colour name, with WCAG contrast + hue-harmony
analysis, and a `palette-archive.v1` export/import pipeline. A static,
frontend-only app with **zero runtime dependencies** — all fonts are bundled
locally, so it makes no outbound network requests and uses no browser storage
(reload returns the seeded baseline).

## Run

```sh
npm run verify:build   # checks entry + referenced assets + JS modules parse
npm start              # serves the app on http://localhost:3000 (PORT overrides)
```

`server.mjs` is a tiny dependency-free static server.

## Layout

```
index.html              semantic shell (chrome, library, overlays)
css/styles.css          cream editorial system + every surface
fonts/                  bundled woff2 (Abril Fatface, Libre Baskerville,
                        IBM Plex Mono, Pinyon Script)
js/
  data.js               seed palettes + historical colour-name dataset + periods
  lib.js                colour maths, contrast, harmony, vision matrices,
                        validation, markdown, focus-trap / overlay helpers
  store.js              in-memory shared store, derived views, undo/redo,
                        all mutating commands (shared with WebMCP)
  exporter.js           CSS / utility-theme / SCSS / archive-JSON / catalog sheet
  render.js             the three Browse layouts, controls, facets, tray,
                        hue spectrum, copy feedback, vision simulation
  editor.js             Detail/Editor: validation, contrast matrix, harmony,
                        notes Write/Preview, drag + keyboard swatch reorder
  overlays.js           export drawer (+ import + print), compare, confirm,
                        batch-tag, subscribe popup, menu/cart, coachmark
  webmcp.js             browse-query-v1 / entity-collection-v1 / artifact-transfer-v1
  app.js                boot, event wiring, keyboard shortcuts, scroll reveals
scripts/verify-build.mjs  the verify:build gate
```

## WebMCP

The page exposes `window.webmcp_session_info`, `window.webmcp_list_tools`, and
`window.webmcp_invoke_tool(name, args)`. Fourteen tools implement the
contract's three modules, each bound to the same store commands and validators
the visible UI uses (so MCP can never do what the form would reject, and never
returns raw artifact contents).

## Notes

- Deterministic Nomenclature index: one row per unique hex, ordered by hue with
  low-saturation / near-black colours bucketed to the end.
- Reordering swatches commits immediately to the shared store (an undoable
  step), so the order persists across close/reopen and into exports.
- The subscribe popup only reveals on genuine user scrolling (wheel / touch /
  paging keys) or ~45s idle — programmatic scrolls never pop it over the work.
