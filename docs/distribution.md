# Stack Distribution Plan: 65 Tasks × Extended Kit

Planning document for rolling the extended stack assignment ([instructions.md](instructions.md), Implementation Technology Guidelines) across the 65 tasks, ahead of updating `tasks/*/instruction.md`. This revision includes real stack migration, not just additive kit assignment.

## Task naming convention (category prefixes) — applied corpus-wide

Task slugs carry their archetype category: `frontend-<category>-<name>`. All 65 tasks are renamed (task dir, task.toml `name`, the three webmcp schema files + canonical map, `TASK_SPECS`, run configs, unit-test fixtures, and this doc updated together):

| Prefix | Count | Category |
|---|---|---|
| `frontend-creative-tools-*` | 22 | Theme/palette/config builders, editors, annotation and portfolio tools |
| `frontend-productivity-*` | 15 | Habits, tasks, notes, time, focus, bookmarks, personal utilities |
| `frontend-landing-*` | 8 | Landing/marketing homepages (incl. the fidelity conversions) |
| `frontend-data-tracking-*` | 8 | Expense/finance/analytics/portfolio dashboards and timelines |
| `frontend-game-*` | 6 | Playable games and game-sims (no archetype column fits a game loop) |
| `frontend-planning-*` | 3 | Day planners and trip itineraries |
| `frontend-workflow-*` | 2 | Admin/user-management and document-workflow apps |
| (unprefixed) | 1 | frontend-mosbyfiles — ten-route editorial fidelity site; flagged as the one open categorization call |

Judgment calls worth knowing: framework rebuilds carry their archetype, not a rebuild prefix (ghostfolio/plausible → data-tracking, docuseal → workflow, mermaid-live-editor/vert/ghostty-config/euroscope → creative-tools, loopdaily/md-uy/nostrpass/weblink → productivity); repquest is a game-sim → game; lineforge (chess study) → productivity. Renames invalidate references in pre-rename harbor job artifacts — `harbor score --task` must use the new paths.

## Corpus-wide mandates (every task)

1. **Tailwind CSS 4.3.2, pinned, everywhere.** All other styling systems are migrated: UnoCSS (5 tasks), CSS Modules (2), Styled Components (1), Emotion (1), and the fidelity tasks' bespoke CSS token systems all convert to Tailwind 4.3.2 (design tokens live in `@theme`). Component libraries with their own styling layer (Angular Material, PrimeNG, MUI, Mantine, PrimeVue, Naive UI) keep their component styles; Tailwind owns layout, spacing, and custom surfaces.
2. **Exactly one component library per task**, drawn from the task's framework ecosystem. No task ships zero; games satisfy this through their chrome (menus, HUD panels, dialogs, settings) even when the play surface is custom canvas.
3. **Rich text editing library** wherever the app edits formatted/structured text (notes, memos, editors): TipTap, ProseKit, Lexical/svelte-lexical, CodeMirror 6 for source panes.
4. **Data visualization library** wherever the app renders charts/trends/breakdowns: Recharts, LayerChart, ECharts/ngx-echarts, Chart.js, or the corpus-proven trendchart-elements. (Single carve-out: game-repquest's PRD mandates hand-written Canvas 2D — the mandate is the task.)
5. **At least one dedicated animation library per task** — AutoAnimate, Motion (React/Vue/vanilla), @vueuse/motion, svelte-motion, GSAP — framework-native transitions alone don't satisfy this. Celebration effects (canvas-confetti, neoconfetti, tsparticles) added where the archetype has win moments.
6. **One icon library per task, via the framework-respective package** — never raw SVG copy-paste, never a CDN. Defaults per framework below; Iconify's Tailwind plugin (@iconify/tailwind4) and unplugin-icons (Vite, on-demand) are the any-framework routes.
7. **Forms with schemas, every task, every form.** Every task has at least one form (create/edit, settings, config — games included via their settings/start screens), and **all** forms — including settings panels and config editors — are driven by a form library paired with a schema validator (Zod or Valibot): the schema defines the rules, the form library renders inline per-field errors before submit. Defaults per framework below.
8. **State tracking, every task.** All shared application state lives in the task's assigned state library (the one named in `<summary>`): the primary collection, active view/route state, filters/sort/selection, form-driven domain state, theme, and UI chrome. In-memory only, except where a persistence-genre PRD mandates localStorage. Views derive from the one store — never a second disconnected copy — and WebMCP tool handlers invoke the same store commands the visible controls use, so contract-driven changes and UI-driven changes are indistinguishable in the rendered app.
9. **WebMCP contract, every task.** All 65 tasks carry a `<webmcp_action_contract>` (all 65 already have assignments in `schemas/webmcp-assignments.json`). The contract is a delivery requirement, not a scoring criterion. Rule for the new kit: every state-changing feature a rubric criterion needs to set up must be reachable through the task's assigned modules' bindings — if a new library category adds state the modules can't express, the contract gets extended (see WebMCP contract coverage below), not skipped.

**Per-framework defaults** (every task inherits these unless its row says otherwise):

| Framework | Icon package | Forms + schema |
|---|---|---|
| React / Preact | @phosphor-icons/react or @tabler/icons-react; @iconify/tailwind4 | React Hook Form + Zod (Preact: via preact/compat, or TanStack Form) |
| Vue 3 / Nuxt | @phosphor-icons/vue or unplugin-icons (any Iconify set) | VeeValidate + Zod (or FormKit) |
| Svelte | phosphor-svelte; @tabler/icons-svelte; svelte-awesome (Font Awesome) | TanStack Form (Svelte) or Felte + Zod |
| Solid | @tabler/icons-solidjs; unplugin-icons | TanStack Form (Solid) or Felte + Zod |
| Qwik | @iconify/tailwind4 (CSS icons — resumability-safe) | Modular Forms (Qwik) + Valibot |
| Angular | Material Symbols / PrimeIcons (kit-native) | Reactive Forms + Zod schema layer |
| Astro | @iconify/tailwind4 or astro-icon; island framework's package inside islands | island framework's form default (forms live in islands) |

## Framework rebalance

React drops from 16 to **7**. The 5 static/legacy stacks (jQuery Webflow export, dependency-free static Node, vanilla custom elements, static-first Webflow rebuild, Vite+Emotion) all convert to **Astro**, which becomes a real lane. Moves are chosen to kill near-duplicate stack+archetype pairs (the corpus had two React storyboards, two React terminal portfolios only differing in styling, etc. — moves make each twin a genuinely different stack).

| Framework | Before | After | Change |
|---|---|---|---|
| React | 16 | **7** | −9 (moves below) |
| Svelte (incl. 2 Astro+Svelte-island games) | 14 | 14 | — |
| Vue 3 (incl. Nuxt) | 11 | 12 | +productivity-scribblespace |
| Astro | 2 | **9** | +landing-l1-network-marketing, +creative-tools-story-docs, +landing-readymag, +landing-landonorris, +landing-razorpay-sprint-26, +landing-units-gr, +landing-wolverineworldwide |
| Qwik | 6 | 7 | +game-letterdrop |
| Solid | 6 | 7 | +creative-tools-camera-exposure |
| Preact | 3 | 5 | +workflow-daisyui-admin-dashboard, +creative-tools-terminal-portfolio |
| Angular | 3 | 4 | +data-tracking-expense-breakdown-reports |
| Static / jQuery / custom elements | 4 | **0** | all → Astro |

React keeps (7): data-tracking-admin-analytics-dashboard (flagship DaisyUI admin), creative-tools-material-theme-studio + creative-tools-material-ui-theme-creator (MUI is React-native — domain-tied), data-tracking-media-history-timeline (Mantine representation), and the three React-named framework rebuilds: data-tracking-ghostfolio, data-tracking-plausible-analytics, productivity-loopdaily.

React moves (9): creative-tools-camera-exposure→Solid, workflow-daisyui-admin-dashboard→Preact, data-tracking-expense-breakdown-reports→Angular, landing-l1-network-marketing→Astro, game-letterdrop→Qwik, productivity-scribblespace→Vue 3, creative-tools-story-docs→Astro, creative-tools-terminal-portfolio→Preact, landing-readymag→Astro.

## Delivery modes (meta-frameworks inside the framework quotas)

Meta-framework tasks count within their base framework's quota — delivery mode is a second axis, not a new framework row. Hard constraint from the harness: **static export or SSR-with-client-hydration only** — all interactivity lives in client state after load (loaders/server actions/API routes are forbidden or invisible, and the WebMCP bridge binds to client state on the judged page). `npm start` on port 3000 covers both `next start`/`node build` servers and serving a static export.

| Delivery mode | Count | Tasks |
|---|---|---|
| Next.js (static export or hydration) | 3 of 7 React | data-tracking-admin-analytics-dashboard, data-tracking-ghostfolio, data-tracking-plausible-analytics |
| Nuxt (SSG/SSR + hydration) | 3 of 12 Vue | mosbyfiles (already Nuxt SSR), planning-daily-planner-board, planning-trip-itinerary |
| SvelteKit (adapter-static) | 4 of 14 Svelte | creative-tools-mermaid-live-editor, creative-tools-vert (both real apps ARE SvelteKit — fidelity gain), productivity-md-uy, productivity-clockcraft |
| Astro | 9 | the Astro lane above |
| React Router 7 framework mode (Remix successor) | 0 | skipped — most server-centric of the set; with loaders/actions neutered, little remains over plain client routing |
| Gatsby | 0 | excluded — maintenance-mode ecosystem; its GraphQL data layer is noise in a no-backend harness; fails the "active maintenance" selection criterion |

SvelteKit tasks switch their forms default to **sveltekit-superforms + Formsnap (client-side validation mode) + Zod**. Every meta-framework task adds the delivery-mode criteria from rubrics.md (10.m: hydration-clean console, deep-link parity, no content flash) to its technical toml, and its instruction gains the matching observable lines.

## WebMCP contract coverage for the new kit

Current contract (zto-webmcp-v1, `packages/webmcp-contracts/specs/modules/`, rendered per task by `scripts/webmcp_h3.py`): six modules — browse-query-v1 (open/search/apply_filter/clear_filter/sort/set_locale/set_theme), entity-collection-v1 (create/select/update/delete/toggle/quantity/reorder), form-workflow-v1 (validate/submit/cancel/reset/advance/return), structured-editor-v1 (select/add/delete/update_property/set_content/switch_mode/preview), command-session-v1 (start/pause/resume/stop/restart/advance/trigger_demo/connect/disconnect), artifact-transfer-v1 (import/export/copy/print_preview/convert). All 65 tasks already have module assignments.

Coverage check against the new kit categories:

| Kit category | Covered by | Gap? |
|---|---|---|
| Component libraries, forms+schemas | form-workflow-v1 (validate/submit/cancel/reset) + entity-collection-v1 field bindings | No — schema validation is builder-side; the contract already exercises validate/submit paths |
| Charts / data viz | browse-query-v1 (apply_filter/sort drive derived charts) | Minor — no explicit timeframe/series controls; judges currently express them as filters |
| Calendars (@event-calendar) | entity-collection-v1 (create/update/delete; reschedule = update) | No |
| Maps | browse-query-v1 (destinations, filters) + playwright gestures for pan/zoom | No — pan/zoom is observation mechanics, not state setup |
| Meta-framework routes | browse-query-v1 destinations | No |
| Games | command-session-v1 | No |
| Rich text editors (TipTap/ProseKit/Lexical/CodeMirror) | structured-editor-v1 `set_content` only | **Yes — formatting operations are not expressible** |
| Node-based UIs (React Flow / Svelte Flow) | entity-collection-v1 (nodes/edges as entities) | **Yes — connect/position semantics are strained** |

Proposed contract adjustments (a `zto-webmcp-v1.1` additive rev of `packages/webmcp-contracts` — new operations are optional, so existing tasks stay valid):

1. **structured-editor-v1: add rich-text operations** `apply_format` (closed enum: bold, italic, heading, list, link, code), `insert_block`, `undo`, `redo`; new optional binding keys `formats`, `block_types`. Needed by: productivity-mindthread, productivity-notenest, productivity-scribblespace, productivity-swiftnote, productivity-tagnote, productivity-md-uy, creative-tools-mermaid-live-editor. Restriction to keep: invokes the same editor commands as the visible toolbar — no direct HTML injection.
2. **entity-collection-v1: add graph operations** `connect` (source, target — closed entity refs) and `set_position` (bounded coordinates); optional binding key `connectable`. Needed by any future node-UI task; harmless elsewhere.
3. **browse-query-v1: add optional binding keys** `timeframes` and `series` with a `set_timeframe` / `toggle_series` operation pair, so chart-heavy tasks (admin-analytics, data-tracking-ghostfolio, plausible, finance/expense reports) can declare chart controls first-class instead of overloading filters.
4. **No new modules.** All gaps fit as additive operations on existing modules; a new module would ripple through `schemas/webmcp-assignments.json`, the h3 renderer, and every stdio-server copy for no expressive gain.

Sequencing: contract rev lands before Phase 1 of the migration (it changes `packages/webmcp-contracts` specs + `webmcp_h3.py` rendering + `versioning.json`); per-task binding updates ride each task's migration phase. The stdio bridge (`tests/webmcp_stdio_server.mjs`) is operation-agnostic and needs no change beyond the vendored copy refresh that packaging already does.

## Per-task assignments

Framework column shows the post-migration stack; **bold** = migrated. State library follows the framework (Zustand→Pinia/stores/Signals/NgRx per move). Styling is Tailwind 4.3.2 everywhere and omitted from the tables.

### Good-app genre (25)

| Task | Framework | Component library | Animation stack | Rich text / Data viz / Domain | Icons |
|---|---|---|---|---|---|
| data-tracking-admin-analytics-dashboard | React (Next.js static export) | DaisyUI | Motion for React + AutoAnimate | viz: trendchart-elements; TanStack Table | Heroicons |
| data-tracking-budget-angular | Angular | Angular Material | AutoAnimate + Angular animations | viz: ngx-echarts; Reactive Forms | Material Symbols |
| creative-tools-camera-exposure | **Solid** (stores) | Kobalte | motion (vanilla) | — | Phosphor (unplugin-icons) |
| creative-tools-color-palette-archive | Qwik | DaisyUI | AutoAnimate | — | Iconify |
| creative-tools-css-theme-builder | Vue 3 | Reka UI | Motion for Vue | forms: VeeValidate + Zod | Remix Icon (unplugin-icons) |
| planning-daily-planner-board | Vue 3 (Nuxt SSG) | shadcn-vue | Motion for Vue + AutoAnimate | @event-calendar/core | Phosphor (@phosphor-icons/vue) |
| workflow-daisyui-admin-dashboard | **Preact** (Signals) | DaisyUI (named by task) | AutoAnimate | viz: Chart.js sparklines; forms | Heroicons |
| creative-tools-daisyui-theme-generator | Svelte | DaisyUI (named by task) | AutoAnimate + Svelte transitions | — | Iconify |
| creative-tools-design-portfolio | Angular | Angular Material (light) | GSAP (terminal type) | — | Material Symbols |
| data-tracking-expense-breakdown-reports | **Angular** (NgRx) | PrimeNG | AutoAnimate + Angular animations | viz: ngx-echarts | PrimeIcons |
| creative-tools-exposure-control-lab | Vue 3 | Naive UI | Motion for Vue | — | Solar (unplugin-icons) |
| data-tracking-finance-reports | Preact | DaisyUI | AutoAnimate | viz: Chart.js | Iconify |
| creative-tools-grid-paint-studio | Svelte | Bits UI (chrome) | svelte-motion | — | phosphor-svelte |
| landing-l1-network-marketing | **Astro** (islands) | DaisyUI | GSAP + ScrollTrigger; Lenis | — | astro-icon (Phosphor set) |
| creative-tools-material-theme-studio | React | MUI | Motion for React | — | Material Symbols |
| creative-tools-material-ui-theme-creator | React | MUI (named by task) | Motion for React | forms: React Hook Form + Zod | Material Symbols |
| data-tracking-media-history-timeline | React | Mantine | Motion for React + AutoAnimate | TanStack Virtual | Tabler |
| data-tracking-media-timeline | Solid | Kobalte | motion (vanilla) | virtua | Tabler (@tabler/icons-solidjs) |
| creative-tools-palette-library | Vue 3 (**UnoCSS→TW 4.3.2**) | Ark UI (Vue) | @vueuse/motion | — | Iconify (TW plugin) |
| creative-tools-story-docs | **Astro** (islands) | DaisyUI | GSAP scroll reveals | — | astro-icon (Remix Icon set) |
| creative-tools-storyboard-tutorial | Preact | DaisyUI | AutoAnimate | — | Iconify |
| productivity-swiftnote | Angular | PrimeNG | AutoAnimate + Angular animations | rich text: ProseKit | PrimeIcons |
| creative-tools-terminal-portfolio | **Preact** (Signals) | DaisyUI (chrome) | GSAP (typewriter) | — | Iconify CSS (Tabler set) |
| planning-travel-itinerary-planner | Qwik | DaisyUI | AutoAnimate | maps: MapLibre local tiles (phase 2 flag) | Iconify |
| planning-trip-itinerary | Vue 3 (Nuxt SSG; **UnoCSS→TW 4.3.2**) | PrimeVue | Motion for Vue | maps: MapLibre local tiles (phase 2 flag) | Tabler (@tabler/icons-vue) |

### Hard browser apps / games (21)

Icons and forms+schema follow the per-framework defaults table for every row (games carry them via chrome, settings, and start screens).

| Task | Framework | Component library (chrome) | Animation stack | Rich text / Data viz / Domain |
|---|---|---|---|---|
| productivity-cipherlog | Svelte | Melt | svelte-motion | — |
| productivity-clockcraft | Svelte (SvelteKit static) | Skeleton | AutoAnimate + Svelte transitions | viz: LayerChart |
| game-dare-night | Astro+Svelte islands | Bits UI (cards/dialogs) | svelte-motion; canvas-confetti | — |
| game-fandangofury | Astro+Svelte islands | Bits UI (menus/HUD) | canvas loop; tsparticles | — |
| game-feltrun | Vue 3 | Reka UI (table chrome) | Motion for Vue; canvas-confetti | — |
| productivity-focuspath | Qwik | DaisyUI | AutoAnimate | — |
| creative-tools-frameflick | Vue 3 (**UnoCSS→TW 4.3.2**) | Ark UI (Vue) | @vueuse/motion | — |
| game-letterdrop | **Qwik** (stores) | DaisyUI (chrome) | GSAP (tile physics); canvas-confetti | — |
| productivity-lineforge | Preact | DaisyUI (chrome) | AutoAnimate | — |
| creative-tools-markupflow | Solid | Kobalte | motion (vanilla) | — |
| productivity-mindthread | Vue 3 (**UnoCSS→TW 4.3.2**) | Reka UI | @vueuse/motion + AutoAnimate | rich text: TipTap |
| game-mineclash | Qwik | DaisyUI (chrome) | AutoAnimate; canvas-confetti | — |
| productivity-notenest | Svelte | Bits UI | AutoAnimate + Svelte transitions | rich text: TipTap; virtua (10k mandate) |
| creative-tools-panecraft | Svelte | shadcn-svelte | svelte-motion | viz: LayerChart |
| creative-tools-portfolioframe | Qwik | DaisyUI | AutoAnimate | — |
| game-repquest | Svelte | Skeleton (meta screens) | canvas; @neoconfetti/svelte | — (hand-canvas mandated) |
| productivity-scribblespace | **Vue 3** (Pinia) | Reka UI (toolbars) | Motion for Vue | rich text: TipTap (text blocks) |
| creative-tools-shapeshift-grid | Solid | Kobalte (chrome) | motion (vanilla) | — |
| productivity-sidedock | Vue 3 (**UnoCSS→TW 4.3.2**) | Naive UI | @vueuse/motion + AutoAnimate | — |
| productivity-tagnote | Qwik | DaisyUI | AutoAnimate | rich text: ProseKit (vanilla core) |
| productivity-taskgrove | Svelte | Melt | AutoAnimate + Svelte transitions | — |

### Framework rebuilds (11)

Icons and forms+schema follow the per-framework defaults table for every row.

| Task | Framework | Component library | Animation stack | Rich text / Data viz / Domain |
|---|---|---|---|---|
| workflow-docuseal | Vue 3 | Reka UI | Motion for Vue | forms: VeeValidate + Zod |
| creative-tools-euroscope | Solid | Kobalte | motion (vanilla) | — |
| data-tracking-ghostfolio | React (Next.js) | shadcn/ui | Motion for React | viz: Recharts (named); TanStack Table |
| creative-tools-ghostty-config | Svelte 5 | Bits UI | AutoAnimate + Svelte transitions | — |
| productivity-loopdaily | React | shadcn/ui | Motion for React + AutoAnimate; canvas-confetti (streaks) | viz: Recharts (habit heatmap/trend) |
| productivity-md-uy | Svelte 5 (SvelteKit static) | Bits UI | Svelte transitions + AutoAnimate | CodeMirror 6 |
| creative-tools-mermaid-live-editor | Svelte 5 (SvelteKit — matches real app) | DaisyUI (matches real app) | Svelte transitions + AutoAnimate | CodeMirror 6; mermaid (mandated) |
| productivity-nostrpass | Solid | Ark UI (Solid) | motion (vanilla) | forms: Felte + Zod |
| data-tracking-plausible-analytics | React (Next.js) | Headless UI | Motion for React | viz: charting lib (named); TanStack Table |
| creative-tools-vert | Svelte 5 (SvelteKit — matches real app) | Bits UI (queue chrome) | AutoAnimate + Svelte transitions | — |
| productivity-weblink | Solid | Kobalte | motion (vanilla) | — |

### Website-fidelity (8) — all converted to Astro + Tailwind 4.3.2 (visual output unchanged)

The recreated *look and motion* stay pixel-faithful to the source sites; only the build stack converges. Each keeps its source site's motion/3D runtime as its animation stack — these remain the corpus's showcase-motion anchors.

| Task | Old stack → New | Component library | Animation stack (kept) | Notes |
|---|---|---|---|---|
| landing-avax-network | Astro (already) | DaisyUI (base chrome) | GSAP | TW already; pin to 4.3.2 |
| landing-hildenkaira | Astro (already) | DaisyUI (base chrome) | GSAP | TW already; pin to 4.3.2 |
| landing-landonorris | **static Webflow-style → Astro** | Bits UI via Svelte islands (menus/overlays) | GSAP + Lenis + Three.js (Draco/KTX2) + Rive | fonts stay self-hosted (Mona Sans Variable, Brier) |
| mosbyfiles | Nuxt 3 (keep — SSR is the task) | Reka UI | GSAP + Lenis + Plyr | styling → TW 4.3.2 tokens |
| landing-razorpay-sprint-26 | **jQuery Webflow export → Astro** | DaisyUI (base chrome) | GSAP + ScrollTrigger + Three.js (GLTF/Draco) + Rive | drop jQuery entirely |
| landing-readymag | **Vite+React+Emotion → Astro** | Radix UI via React islands | GSAP; Motion | Emotion → TW 4.3.2 |
| landing-units-gr | **static Node → Astro** | DaisyUI (base chrome) | GSAP family + Lenis + Swiper + lottie-web | Barba page transitions → Astro view transitions |
| landing-wolverineworldwide | **custom elements → Astro** | Radix UI via React islands (menu/carousel chrome) | GSAP + SplitText; focus-trap | Swup → Astro view transitions; CSS custom-property tokens → TW `@theme` |

Note kept exception: **mosbyfiles stays Nuxt** — its PRD is explicitly an SSR/Storyblok-model reproduction; converting it to Astro would change what the task tests. If a hard "zero non-Astro fidelity" rule is wanted, flag it and we'll convert it too.

## Flags and open questions

1. **Fidelity conversions are the expensive row.** Each of the 5 conversions (landing-landonorris, razorpay, landing-readymag, landing-units-gr, landing-wolverineworldwide) invalidates its solution oracle, reference screenshots, and parts of its technical rubric (stack-mandate lines in instructions). Budget these as full re-authoring tasks, not edits.
2. **The 9 React moves also invalidate their oracles** (solution/app is per-stack). Instructions/rubrics change little (behaviors are stack-agnostic by design); oracles must be rebuilt on the new stack before `capture_reference_screenshots` and `solve.sh` work again.
3. **Tailwind 4.3.2 pin**: verify the exact version exists on npm at migration time and add it to `tasks/_pins.py` alongside the other pins so test.sh and instructions stay in lockstep.
4. **Preact = DaisyUI monoculture** (5/5 Preact tasks) — ecosystem limitation; differentiate via theme + motion. Revisit if a maintained Preact-compat headless kit emerges.
5. **MapLibre on the two trip planners** stays a phase-2 flag (offline tile bundling needs one proving task first).
6. **productivity-swiftnote gains ProseKit** (rich-text mandate: it's a note app) — its keyboard-first PRD needs a check that ProseKit shortcuts don't conflict with the app's own keymap.

## Migration mechanics (per task)

1. `<summary>`: rewrite the stack clause — framework, state, "Tailwind CSS 4.3.2", component library ("Build a … using Preact, Signals, Tailwind CSS 4.3.2, and DaisyUI.").
2. `<requirements>`: rewrite the stack bullet + allowlist sentence: animation libraries, rich text / viz / domain libraries, icon set, "no other UI, animation, or icon libraries"; pin phrasing "Tailwind CSS 4.3.2".
3. `<core_features>` / `<motion>`: add observable lines exercising the mandated categories (list add/remove/reorder animates; chart redraws on input change; formatting round-trips; celebration on the real win action) — library-anonymous.
4. Dimension tomls: add matching criteria (motion microinteractions, behavioral chart-sensitivity, core-features editor round-trips).
5. Migrated-stack tasks additionally: rebuild `solution/app` on the new stack, re-run screenshot capture + install, re-verify test.sh serve path.
6. **Rollout order** (cheapest first): Phase 1 — unchanged-stack good-apps (kit additions only); Phase 2 — hard-browser (motion/celebration + chrome kits); Phase 3 — unchanged framework rebuilds; Phase 4 — the 9 React moves (oracle rebuilds); Phase 5 — the 5 fidelity conversions (full re-author). UnoCSS→Tailwind conversions ride with their task's phase.
7. Packaging caveat: authoring sources are archived (`~/Documents/frontend-repository-authoring-backup-2026-07-18`); `regen_dimension_tomls.py` needs them restored. Direct edits to instruction.md content sections and dimension tomls are fine; never touch generated test.sh/task.toml/webmcp blocks.

## Verification once migration starts

- Per updated task: `node scripts/capture_reference_screenshots.mjs <slug>` passes (oracle serves clean, zero console errors); for migrated stacks this requires the rebuilt oracle.
- Spot `harbor run` one task per phase; confirm the builder installs the assigned kit and the judge confirms the new observable lines.
- Corpus recount after each phase against the framework table above: React exactly 7, Astro 9, static 0; every task's requirements name Tailwind 4.3.2, exactly one component library, one framework-respective icon package, ≥1 animation library, a form library + schema validator, and the feature-appropriate rich-text/viz libraries.
