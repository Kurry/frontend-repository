# Good application bar (lean)

## Must clear

1. Primary collection: create, edit, delete
2. ≥2 distinct views / modes (in-app switch, no backend routes)
3. Domain state beyond CRUD (status, filters, roles, priority, bulk, …)
4. Frontend-only: no backend, no auth APIs
5. In-memory stack store only — no localStorage / sessionStorage

## instruction.md

| Section | Content |
|---------|---------|
| summary | `Build a [name] using [framework], [state], and [styling].` |
| core_features | Product behavior + browser-visible density; no state-lib names |
| visual_design | Composition, density, theme, badges, responsive shell |
| motion | Hover required; plus product-fitting chrome motion |
| requirements | Stack + behavioral state contracts; forbid browser storage |

Plain text only inside sections (no markdown bold/backticks).

## Stacks A–L

| | Framework | State | Styling |
|---|-----------|-------|---------|
| A | React | Zustand | Tailwind CSS |
| B | Vue 3 | Pinia | Tailwind CSS |
| C | React | Redux Toolkit | Tailwind CSS |
| D | Svelte | Svelte stores | Tailwind CSS |
| E | React | Zustand | CSS Modules |
| F | Vue 3 | Pinia | UnoCSS |
| G | Solid.js | Solid stores | Tailwind CSS |
| H | React | Jotai | Tailwind CSS |
| I | Preact | Signals | Tailwind CSS |
| J | Angular | NgRx | Angular Material |
| K | React | Zustand | Styled Components |
| L | Qwik | Qwik stores | Tailwind CSS |

## Checklist titles

`{id, title}` · On load / After / When · ~10–14 browser outcomes

## Rubric criteria (exact)

`Core Features` · `Visual Design` · `Motion` · `Technical Implementation`

Types: `positive hli verifier` | `negative hli verifier`

## Gold

`frontend-repository/DaisyUI/` — instruction + checklist + rubric
