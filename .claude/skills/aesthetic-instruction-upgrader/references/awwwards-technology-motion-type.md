# Awwwards technology, motion, and typography application guide

## Contents

1. Evidence model
2. Required evidence workflow
3. Framework and runtime selection
4. Library selection
5. CSS production language
6. Motion system
7. Typography system
8. Advanced rendering and asset systems
9. Genre profiles
10. Instruction and rubric boundary

## 1. Evidence model

The repository archive contains 6,197 Awwwards Sites of the Day; 4,562 still returned visitable HTML. Use three distinct evidence layers:

- **Editorial metadata:** Awwwards tags and classifications. These indicate recognized experience qualities, not verified source code.
- **Live-response fingerprints:** bounded technology detection from surviving sites. These estimate current delivered stacks and infrastructure.
- **Retained CSS/asset evidence:** mirrored CSS, code references, runtime signals, and parsed retained files. These reveal production primitives and asset pipelines but remain incomplete because mirrors were bounded and excluded photos, video, audio, and fonts.

Do not combine percentages across layers as though they measured the same thing. Do not interpret popularity as quality or rarity as sophistication.

Useful editorial experience signals among live sites include Animation `41.4%`, 3D `16.2%`, Responsive Design `15.2%`, Transitions `14.6%`, Scrolling `13.0%`, Storytelling `9.8%`, and Microinteractions `9.7%`. Visual tags include Black `40.7%`, White `39.8%`, Clean `29.1%`, Typography `21.7%`, Minimal `16.0%`, Colorful `15.3%`, and Art & Illustration `11.4%`. Opposing styles coexist; the archive does not establish a universal palette.

Live fingerprints include Vue.js `11.2%`, Nuxt.js `10.4%`, React `8.7%`, Next.js `5.1%`, Webflow `2.1%`, GSAP `1.5%`, Three.js `1.3%`, and Astro `0.9%`. Awwwards editorial technology tags separately include GSAP `20.3%`, WebGL `16.3%`, Three.js `9.3%`, React `4.2%`, Vue.js `3.8%`, Nuxt.js `3.2%`, PixiJS `2.7%`, Next.js `2.3%`, Barba.js `1.8%`, Locomotive Scroll `1.1%`, and Lottie `1.0%`. The large differences demonstrate why editorial and detector evidence must stay separate.

Primary sources:

- `docs/research/awwwards-sotd-archive/REPORT.md`
- `docs/research/awwwards-sotd-archive/TASK-SYNTHESIS.md`
- `docs/research/awwwards-sotd-archive/technology-frequency.csv`
- `docs/research/awwwards-sotd-archive/awwwards-technology-tag-frequency.csv`
- `docs/research/awwwards-sotd-archive/interaction-frequency.csv`
- `docs/research/awwwards-sotd-archive/visual-style-frequency.csv`
- the CSS and production-asset depth artifacts when present

## 2. Required evidence workflow

For each upgraded task:

1. Classify it as editorial/marketing, product/tool, game/simulation, data/workflow, or immersive/spatial.
2. Select one coherent Awwwards experience bundle: editorial narrative, direct-manipulation studio, dense operational product, playful game loop, or immersive spatial experience.
3. Record two to five relevant study signals and their evidence layers.
4. Translate each signal into a visible product purpose.
5. Preserve the assigned stack; select additional technology only when a simpler existing capability cannot satisfy that purpose.
6. Define loading, interruption, compact-layout, reduced-motion, and failure behavior.
7. Record at least two rejected techniques to prevent concept collage and technology accumulation.

Use this ledger:

| Product need | Study signal and layer | Decision | Visible requirement | Cost and fallback |
|---|---|---|---|---|
| Preserve card identity during reorder | Transitions editorial tag; transforms/transitions in retained CSS | Adapt | Source slot, insertion preview, and settled order remain continuous | CSS or assigned motion library; instant but clear reduced-motion state |
| Make release history legible | Storytelling editorial tag | Adapt | Timeline communicates release lineage without becoming a marketing scroll page | Static ordered timeline fallback |
| Add 3D background | 3D editorial tag | Reject | It does not improve the release-diff job | Avoid payload and input complexity |

## 3. Framework and runtime selection

Framework frequency is descriptive, not a recommendation. Follow these rules:

- Preserve the framework already assigned in `docs/distribution.md`, task requirements, or the existing solution. Do not switch frameworks to improve aesthetics.
- For a new frontend-only task, choose one runtime architecture based on state, routing, rendering, and interaction needs.
- Use islands or static-first delivery for content-led experiences when most of the page does not need client state.
- Use a component SPA when the product has dense client state, direct manipulation, undo/redo, or many coordinated panels.
- Use a DOM framework around Canvas/WebGL rather than forcing the entire UI into the renderer; semantic controls, overlays, dialogs, and exports remain DOM surfaces.
- Do not prescribe SSR, server actions, databases, or backend frameworks for a frontend-only task unless the task explicitly owns that scope.

Architecture guide:

| Product shape | Suitable architecture | Aesthetic implication |
|---|---|---|
| Editorial or fidelity landing | Existing Astro/static/islands assignment or observed reference stack | Prioritize type, media rhythm, and progressive enhancement |
| Stateful product/editor | Existing React, Vue, Svelte, Solid, Qwik, or Preact assignment | Keep canonical state and component transitions coherent |
| Dense workflow/data tool | Existing component framework plus assigned store and chart system | Use density, linked selection, tables, timelines, and state continuity |
| Game/simulation | Existing framework plus one Canvas/2D/3D renderer | Protect frame loop from UI state churn; retain semantic controls |
| Immersive spatial experience | Existing framework plus Three.js/WebGL or equivalent only when the scene is the product | Require staged loading, capability fallback, and disposal |

## 4. Library selection

Select the smallest coherent set. One library should own each responsibility.

### Motion and transitions

| Need | Prefer | Do not use when |
|---|---|---|
| Hover, focus, press, simple enter/exit | CSS transitions/keyframes | A library adds no sequencing or lifecycle benefit |
| Straightforward list insertion/reorder | AutoAnimate or framework-native layout transitions | Item identity, drag physics, or custom staging needs explicit control |
| Component presence/layout continuity | The assigned framework's motion library | CSS already expresses the state clearly |
| Coordinated multi-element timeline, SVG/canvas choreography, bounded scroll narrative | GSAP timeline/ScrollTrigger | The effect is a single property transition or would hijack native scrolling |
| Authored vector state machine | Rive | A static SVG or CSS state is sufficient |
| Authored linear vector sequence | Lottie | Interaction depends on semantic state not encoded by the animation |
| Route continuity | Native View Transitions or the assigned router's transition system | It obscures focus, history, or loading truth |
| Smooth-scroll layer | Native scrolling first; Lenis/Locomotive only for a demonstrated narrative need | Keyboard, anchors, reduced motion, or browser restoration degrade |

GSAP is justified when the requirement needs timeline labels, sequencing, pause/reverse/seek control, SVG/canvas coordination, or a carefully bounded ScrollTrigger relationship. Require teardown on navigation or remount, refresh after layout changes, interruption behavior, native-scroll preservation, and a reduced-motion branch. Do not name GSAP in a visual rubric.

### Graphics, data, and direct manipulation

- Use SVG for crisp icons, diagrams, masks, paths, and accessible static graphics; it was the strongest browser-observed visual signal at `67.1%`.
- Use Canvas 2D or PixiJS for high-frequency 2D drawing, particles, maps, or games where DOM/SVG scale is insufficient.
- Use Three.js or another 3D renderer only when camera, geometry, lighting, or spatial manipulation is central to the experience.
- Use the task's assigned chart library for data visualization; do not stack D3, ECharts, Chart.js, Recharts, and custom canvas in one task. Require semantic labels and linked UI state regardless of renderer.
- Use the assigned drag-and-drop library when direct manipulation is core. Require keyboard and touch alternatives and visible source/destination states.
- Use the assigned component library as accessible structural chrome, then art-direct its tokens and composition. Do not mix component systems to manufacture visual variety.

Before adding a library, inspect the installed version and fetch current official documentation with `ctx7`. Record payload/lifecycle implications and why existing CSS or framework primitives are insufficient.

## 5. CSS production language

The retained-CSS cohort contained 2,210 sites. Common feature-family presence included media queries `91.8%`, transforms `90.8%`, transitions `89.0%`, flexbox `88.9%`, fixed positioning `88.6%`, `@font-face` `88.1%`, custom properties `69.5%`, gradients `65.8%`, grid `62.4%`, 3D transforms `57.4%`, `clip-path` `39.9%`, fluid `clamp()/min()/max()` sizing `38.8%`, dynamic viewport units `35.4%`, backdrop filters `31.4%`, masks `27.5%`, and `:focus-visible` `27.1%`.

Use these as a craft vocabulary:

- **Composition:** grid, flex, subgrid, aspect ratio, object fit, logical properties, sticky/fixed positioning, container queries, and fluid sizing.
- **Typography:** variable axes, numeric features, balanced/pretty wrapping, controlled measure, fluid spacing, and writing modes where conceptually justified.
- **Material:** custom properties, gradients, masks, clipping, shadows, blend/filter effects, SVG vectors, and color spaces.
- **Interaction:** pointer/hover media queries, `:focus-visible`, touch action, overscroll containment, `:has()`, and reduced-motion alternatives.
- **Rendering:** containment, content visibility, cascade layers, feature queries, and bounded `will-change`.

Do not require every feature. State the visible composition or material result first. Name a CSS primitive only in technical guidance or when that primitive is itself the task's subject.

Only `16.2%` of retained-CSS sites exposed reduced-motion queries. Treat that as a weakness to improve, not a precedent to copy.

## 6. Motion system

Build one motion grammar with five jobs:

1. **Acknowledge:** immediate press, focus, hover, and direct-input feedback.
2. **Manipulate:** preserve attachment during drag, resize, draw, scrub, reorder, or deal.
3. **Navigate:** maintain orientation across tabs, drawers, routes, scenes, or detail transitions.
4. **Explain state:** connect the initiating action to changed counts, charts, status, artifacts, or results.
5. **Celebrate or warn:** reserve stronger motion for meaningful completion, achievement, defeat, or destructive consequence.

For every signature transition specify:

- trigger and real UI path;
- affected elements and sequence;
- origin, intermediate evidence, and settled state;
- interruption, rapid-repeat, resize, back-navigation, and stale-result behavior;
- focus behavior during and after the transition;
- reduced-motion choreography that keeps causality and orientation;
- cleanup for timelines, observers, workers, render loops, and offscreen ambient motion.

Prefer a small timing/easing vocabulary. Longer timelines belong only to scene or narrative changes. Do not make users wait for decorative animation before the next action.

## 7. Typography system

Typography was an Awwwards visual tag on `21.7%` of live sites. In retained CSS, `@font-face` appeared on `88.1%`, variable-font controls on `16.0%`, and balanced/pretty wrapping on `11.4%`. Fonts themselves were excluded from mirrors, so do not claim specific font-file usage from mirror evidence.

Define typography as roles and behavior:

- **Display:** identity, section moments, hero/result emphasis; expressive width or weight may carry the concept.
- **Reading:** long-form notes, explanations, reports, and dialog copy; prioritize measure, line-height, and durable fallback.
- **Utility/control:** labels, buttons, tabs, metadata, timestamps; remain legible at compact sizes and dense layouts.
- **Numeric/data:** counts, currency, clocks, coordinates, scores, charts; use stable-width numerals and consistent unit alignment.
- **Code/technical:** use monospace only for source, identifiers, commands, diffs, or genuinely technical metadata.

Require no more families than the concept needs. A common production profile is one display family plus one reading/utility family, with a monospace role only when domain-correct. Variation within a variable family can replace unnecessary font proliferation.

Specify:

- hierarchy through size, weight, width, case, tracking, placement, and whitespace;
- line length, wrapping, truncation, and long/localized copy behavior;
- responsive type changes tied to composition, not arbitrary scale reduction;
- stable numerals where values update;
- licensed local/open assets, honest fallback stacks, and readable behavior before fonts load;
- no visible layout jump that moves the primary action or changes completed-state composition;
- decorative split text hidden from assistive technology while the full phrase remains available.

Do not mandate proprietary Awwwards fonts or copy font files from reference sites. The local Lando Norris inventory demonstrates a variable-plus-display architecture, not reusable font content.

## 8. Advanced rendering and asset systems

Advanced assets must form a pipeline, not an extension checklist. The depth study found references to GLB on 111 sites, WASM on 107, OBJ on 56, KTX2 on 51, fragment shaders on 39, glTF on 28, Rive on 25, HDR on 24, and Spline scenes on 19. Runtime signals included OffscreenCanvas on 306 mirrors, workers on 252, Lottie on 203, glTF loaders on 116, Draco on 113, Basis/KTX2 transcoders on 101, and Meshopt on 94.

For a justified spatial or asset-heavy task, define:

`geometry → compression/decoder → material textures → lighting → interaction layer → loading → fallback → cleanup`

The local Lando Norris inventory demonstrates this architecture with GLB geometry, Draco compression, KTX2 PBR textures, Basis WASM transcoding, HDR lighting states, Rive interaction assets, and variable/display typography. Use the architecture only; never copy proprietary bytes.

Require staged loading, bounded failure, retry, low-memory/capability fallback, reduced motion, equivalent DOM controls, stale async protection, and resource disposal. A blank canvas with an apology is not a useful fallback.

## 9. Genre profiles

### Dense product, data, and workflow

Use assigned component/store/chart systems. Favor grid/flex composition, custom properties, stable numeric typography, restrained transitions, linked selection, reordering continuity, and responsive drawers/sheets. Usually reject Three.js, smooth-scroll layers, autoplay video, and cinematic page transitions.

### Productivity and editorial tools

Use an editorial or tactile type/content system around the primary work surface. Framework-native transitions or AutoAnimate may preserve item identity; a heavy timeline library needs a real sequencing requirement. Favor readable measure, annotation roles, and composed empty/search states.

### Games and simulations

Use the assigned framework plus one renderer. Motion explains rules, direct input, result, reset, and replay. Use particles or confetti only as bounded secondary feedback. Protect the play surface on compact screens and provide semantic controls outside the canvas.

### Creative studios

Use a dominant canvas/preview, compact tool chrome, immediate before/after evidence, and a production-grade export result. Choose SVG/Canvas/Three.js according to the artifact, not prestige. Motion follows manipulation and derived output.

### Website fidelity and marketing

Preserve observed framework constraints and reference composition when mandated. GSAP, ScrollTrigger, Lenis, Swiper, Lottie, route transitions, and WebGL may be appropriate when the reference evidence supports each role. Require native scrolling, semantic content, reduced motion, mobile recomposition, and fallback media treatment.

## 10. Instruction and rubric boundary

Place assigned framework, required integration, asset pipeline, and lifecycle constraints in `<requirements>`. Place the browser-visible choreography in `<motion>`, composition and type roles in `<visual_design>`, alternate compact composition in `<responsiveness>`, and focus/reduced-motion/non-color behavior in `<accessibility>`.

Good technical instruction:

> Preserve the assigned Svelte and Canvas architecture. Keep semantic controls and session history in the DOM while Canvas renders the play field; the renderer must stop when hidden and recover to a usable DOM summary if initialization fails.

Good visual criterion:

> Starting a run visibly advances the stage strip in order, updates each gate when its evidence arrives, and appends the timeline result only after the final gate settles; reduced motion retains the same ordering without travel animation.

Bad criterion:

> Uses GSAP, Three.js, Tailwind, and variable fonts.

The judge observes rendered behavior and real interactions. It does not inspect dependency strings or source architecture.
