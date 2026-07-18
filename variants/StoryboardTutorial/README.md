# StoryboardTutorial — Product Requirements Document (PRD)

Clean-room rebuild of the StoryDocs getting-started storyboard tutorial UI.

## Goal

Single-page storyboard getting-started guide with:

1. Product header (generic mark, **Demo Projects**, **1. Getting Started**)
2. Grid of tutorial scenes (8 imaged + placeholders + Add Scene)
3. Tile / List / Slide view modes
4. Debranded Docs copy (no product brand strings)

## Hard constraints

- Zero navigational `<a href>` elements
- Resource loads only: `./assets/app.css`, `./assets/app.js`, `./assets/favicon.svg`, `./assets/scenes/scene-0N.webp`, fonts under `./assets/fonts/`
- Inert controls use `button.inert-nav`; clicks toast “demo only”
- Title: **1. Getting Started — Docs**; welcome line: **Welcome to Docs!**

## File layout

| Path | Role |
|---|---|
| `index.html` | Page shell + storyboard DOM |
| `assets/app.css` | Authored layout, chrome, polish |
| `assets/app.js` | Toast, view modes, description focus, enter motion |
| `assets/scenes/scene-01.webp` … `scene-08.webp` | Instructional thumbnails |
| `assets/fonts/gabarito-400.woff2` (+ ext) | Gabarito |
| `assets/favicon.svg` | Generic clapperboard-style mark |

## Serve

```bash
cd variants/StoryboardTutorial && python3 -m http.server 9307
# open http://127.0.0.1:9307/
```

## Acceptance

- [ ] Title **1. Getting Started — Docs**
- [ ] No navigational `<a href>`; no StoryBoom strings
- [ ] Eight scene images render; generic logo mark
- [ ] Tile / List / Slide toggles; toast on inert controls
- [ ] Scene hover lift; description editing affordance
