# instruction.md Definitions: The Instruction-Ready PRD Template

This document defines the canonical format of a task's `instruction.md` — the PRD-style specification the builder agent sees. It is the companion to [rubrics.md](rubrics.md): rubrics.md defines the grading dimensions and how criteria are written; this document defines how the builder-facing instruction is written so that every behavioral sentence traces to a criterion in some `tests/{dimension}/{dimension}.toml`.

Audience: task authors and reviewers. The builder never sees this file — it sees only the finished `instruction.md`.

**Golden rule: the builder sees behaviors, never grading mechanics.** Anti-cheat probes, judge accuracy guards, rubric weights, and verifier tooling are never mentioned in `instruction.md`. The instruction describes the product; the tests describe how it is graded.

---

## Mandatory PRD Complexity Bar

Every PRD authored from this template must clear this bar before any prose is written.

Good applications have:

- A primary list or collection that can be created, edited, and deleted.
- At least two distinct views or interaction modes.
- Domain-specific state beyond simple CRUD (e.g. completion, priority, streaks, filters).
- Enough complexity to stress-test state management without requiring a backend.

Avoid tasks that are trivially simple (a single counter, a basic to-do list with no secondary features), require real authentication or external APIs, or have only one user flow. Avoid repeated tasks that are too similar — choose a diverse set of applications across the archetype table in [rubrics.md](rubrics.md) (Task Selection & Diversity). Genre equivalents of the bar (games: game loop + scoring + meta screen; landing pages: ≥5 sections + nav + validating form + scroll behavior) are defined there.

**State-management contract** (restated in every task's `<requirements>`): all shared state must be managed with a state library — the one named in `<summary>` — with no backend and no authentication; all data lives in memory. Persistence-genre exceptions (hard browser apps, framework rebuilds) keep localStorage only where their source PRD mandates it.

---

## Global Authoring Rules

1. **XML tags wrapping plain text, not markdown.** Section tags (`<summary>`, `<core_features>`, …) wrap the content; the body is plain sentences and dash lists. No `**bold**`, no `#`/`##` headers, no backticks, no markdown links inside sections. Feature grouping uses plain-text label lines ("Feature: Create item —"), never markdown headers.
2. **Every tag closed, fixed order.** Every opened section tag must be closed. Sections appear in the canonical order given below; omit a section entirely rather than shipping it empty.
3. **Every line is an observable behavior.** Action → expected browser evidence ("Clicking X swaps Y without a full page reload"), never a component inventory ("X view: A, B, C"). A browser judge must be able to confirm each sentence from the running app alone.
4. **Resolve quantifiers.** "At least 8 seeded rows" must say where, when, and whether pagination counts as reachable. Never leave a number a judge can read two ways.
5. **Never name state libraries in `<core_features>`.** The state library appears only in `<summary>` and `<requirements>`. Repeating it per feature encourages name-dropping over shared state.
6. **Text wins over screenshots.** Reference screenshots are illustrative; where a screenshot and the text conflict, the text always takes precedence.
7. **Frontend-only vocabulary.** No server response codes, API endpoints, network SLAs, CI jobs, or audit tooling in behavioral sentences. Evidence is DOM changes, visible counts, rendered text, computed styles, console cleanliness, and load behavior — things an unprivileged browser can observe.
8. **Genre adaptations.** The section definitions below are written for interactive apps; consult the genre-applicability matrix in [rubrics.md](rubrics.md) to adapt (landing pages substitute nav/forms/section behavior for CRUD; fidelity tasks make the reference screenshots near-normative; games substitute the game loop).

---

## Implementation Technology Guidelines

Production quality in one shot comes from proven libraries, not hand-rolled primitives. A corpus where every task is React + Tailwind + hand-built modals trains template output and produces broken dropdowns, inaccessible dialogs, and janky lists. Every task assigns a full kit — framework, state, styling, component library, motion stack, and (where the archetype calls for it) a domain library — and the builder is expected to compose production-grade UI from those parts.

**Corpus diversity rule:** no single framework appears on more than roughly one third of tasks, and the corpus mixes styled kits, headless primitives, and utility-first styling. Two tasks sharing a framework should differ in component library or motion stack.

### Corpus-wide kit mandates

Every task's kit includes, non-negotiably:

1. **Tailwind CSS 4.3.2** (pinned) as the styling base — design tokens in `@theme`; styled component kits keep their component styles, Tailwind owns layout and custom surfaces.
2. **Exactly one component library** from the task's framework ecosystem (games satisfy this via chrome: menus, HUD, dialogs, settings).
3. **At least one dedicated animation library** — framework-native transitions alone don't qualify.
4. **One icon library via the framework-respective package** (Phosphor: @phosphor-icons/react//vue, phosphor-svelte; Tabler: @tabler/icons-react//vue//svelte//solidjs; Iconify via @iconify/tailwind4 or unplugin-icons for any set — Remix Icon, Solar, Carbon; Heroicons; kit-native sets like Material Symbols/PrimeIcons on Material/Prime stacks) — never raw copy-paste SVGs, never a CDN. Avoid defaulting every task to one fashionable set; vary sets across the corpus.
5. **Forms with schemas — all forms, API-shaped**: every form, including settings panels and config editors, is driven by a form library paired with a schema validator (Zod or Valibot) — the schema defines the rules, the form library surfaces inline per-field errors. Schemas are written as if the backend existed: they model the payload shapes the domain's real APIs would accept and return (the record the form creates IS the request body; exports/imports conform to the same schemas; where a real-world API defines the shape — a PR object, a chat-completions request, an ICS event, a PGN game — the schema mirrors it). Schema-first data modeling is a core frontend skill these tasks must exercise, not an internal detail: instructions state the field-level contract observably (required fields, formats, bounds, enum values, cross-field rules) so the judge can verify validation matches the modeled API.
6. **Rich text library** when the app edits formatted text; **data visualization library** when it renders charts — feature-appropriate, not optional where the feature exists.
7. **State tracking**: all shared application state lives in the assigned state library — collection, active view/route, filters/sort/selection, theme, chrome. Views derive from the one store; WebMCP handlers invoke the same store commands as the visible controls.
8. **WebMCP contract**: every task ships its `<webmcp_action_contract>` (delivery requirement, not a scoring criterion). Every state-changing feature a criterion needs to set up must be reachable through the assigned modules' bindings; if a library category adds state the modules can't express, extend the contract (see distribution.md, WebMCP contract coverage) rather than skipping it.

Per-task assignments across the current 65-task corpus live in [distribution.md](distribution.md), including the per-framework defaults for icons and forms.

### The extended stack assignment

The stack table historically assigned framework + state + styling. Each task now also assigns a **component library** and a **motion stack**, carried in the same places as the rest of the kit: framework, state, styling, and component library in `<summary>`; motion and domain libraries in the `<requirements>` allowlist.

```
<summary>
Build a field-service dispatch board using Vue 3, Pinia, Tailwind CSS, and PrimeVue.
</summary>
```

```
(in <requirements>)
Build tooling: Vite or an equivalent SPA setup. PrimeVue components for tables, dialogs, selects, and toasts. Motion for Vue and AutoAnimate allowed for animation; GSAP allowed for the board intro timeline; no other animation libraries. Phosphor icons only. All libraries installed via npm and bundled locally.
```

Framework menu: React, Vue 3, Svelte 5, Solid, Preact, Qwik, Angular. For landing pages and content-heavy sites, prefer static-first delivery — Astro or vanilla + Vite with islands of interactivity — and minimize client-side JavaScript to what the interactions actually need.

Delivery modes: a task may additionally assign a meta-framework — Next.js (React), Nuxt (Vue), SvelteKit (Svelte), Astro — **pinned to static export or SSR-with-client-hydration**. All interactivity lives in client state after load: loaders, server actions, and API routes are forbidden in this harness and invisible to the judge. Meta-framework tasks add the delivery-mode observable lines (hydration-clean console, deep-link parity, no post-hydration content flash — rubrics.md 10.m) to their instruction and technical toml. Gatsby is excluded (maintenance-mode; its data layer is noise without a backend); React Router 7 framework mode is skipped for the same server-centric reason.

### Component libraries

Assign one per task. Menu by framework (all actively maintained):

| Framework | Styled kits | Headless primitives |
|---|---|---|
| React | MUI, Ant Design, Chakra UI, Mantine, shadcn/ui (styled source you own) | Radix UI, React Aria, Headless UI, Ark UI |
| Vue 3 | PrimeVue, Naive UI, Vuetify, shadcn-vue | Reka UI, Headless UI, Ark UI |
| Svelte | shadcn-svelte (Bits UI + Tailwind), Skeleton, Flowbite Svelte, Svelte Material UI, Carbon Components Svelte, Sveltestrap, m3-svelte | Bits UI, Melt, @ark-ui/svelte |
| Solid | — | Kobalte, Ark UI |
| Angular | Angular Material, PrimeNG | — |
| Any | DaisyUI (Tailwind classname system, proven in this corpus) | Ark UI (React/Vue/Svelte/Solid) |

Selection criteria when assigning:

- Active maintenance and release cadence — ongoing development, timely updates.
- Community and ecosystem support — thriving communities and third-party extensions reduce integration friction.
- Accessibility compliance — strong ARIA support, keyboard navigation, WCAG-aware components out of the box.
- Theming and customization — theming tokens or design-system integration so the product keeps a unique identity.
- Bundle and performance — tree-shaking, modular imports, ability to ship only the components used.
- Extensibility and composition — headless primitives or unopinionated styling when bespoke interactions or layouts are required.

Styled vs. headless: styled kits (MUI, PrimeVue, Ant Design, DaisyUI, Skeleton, Flowbite) fit dense admin/dashboard genres where consistency and speed dominate; headless primitives (Radix, Ark, Bits, Melt, Headless UI) plus custom styling fit showcase work where the visual identity is the point — a default-themed MUI page reads as template register, which fails the showcase bar.

### Domain libraries (archetype-matched)

When a task's archetype has a hard component at its center, assign a domain library for it — hand-rolling these is where one-shot builds die:

- **Rich text editing** (creative tools, content pipelines, notes/docs): TipTap (Vue/React/vanilla), Lexical (React), svelte-lexical, ProseKit (framework-agnostic headless), Typewriter (Svelte). Observable asks: toolbar formatting round-trips (bold → rendered bold → toggles off), keyboard shortcuts, sane paste handling, working undo/redo.
- **Charts / data visualization** (dashboards, trackers, analytics): LayerChart or LayerCake (Svelte), Recharts, visx, or Nivo (React), ECharts via vue-echarts (Vue), Chart.js or D3 (any), @weblogin/trendchart-elements (already proven here). Observable asks: hover tooltips, series toggling, and data-driven redraws — the chart re-renders when its inputs change.
- **Node-based UIs / diagrams** (workflow builders, pipelines, mind maps): React Flow (@xyflow/react) or Svelte Flow (@xyflow/svelte). Observable asks: drag nodes, connect edges, pan and zoom the canvas.
- **Maps** (trip planners, schedulers, logistics): MapLibre GL (any framework), svelte-maplibre / svelte-maplibre-gl, react-map-gl. Hard constraint: tile sources must be local — a bundled style with vector tiles or static raster imagery. No external tile servers; the app runs offline.
- **Headless building blocks** (any data-heavy archetype): TanStack Table (sorting/filtering/pagination for admin datagrids), TanStack Virtual or virtua (virtualized lists — makes large-collection smoothness trivially winnable), @event-calendar/core (drag-and-drop event calendar with resource/timeline views, for planners and schedulers). Observable asks: column sort round-trips, smooth scrolling through hundreds of rows, dragging an event to a new slot.
- **Forms and validation** (nearly every archetype): TanStack Form (React/Vue/Svelte/Solid), React Hook Form (React), VeeValidate or FormKit (Vue), Felte (Svelte/Solid), sveltekit-superforms + Formsnap where a task's stack is SvelteKit (client-side validation mode only), paired with a schema validator (Zod or Valibot) so validation rules live in one place. Observable asks: inline per-field errors before submit, submit disabled until valid, error messages that name the field and the fix.
- **Excluded**: AI SDKs and anything requiring a network backend (violates the no-external-API rule); server-side form actions (validation must be fully client-side in this frontend-only harness).

### Motion and microinteraction stack

Assign a motion stack alongside the component library, and use the escalation ladder — the right tool per effect, not one library for everything:

1. CSS transitions for simple state changes: hover, focus, toggles, color/elevation shifts.
2. AutoAnimate for zero-config list microinteractions: add, remove, reorder animate with one line.
3. Framework-native primitives: Svelte transitions and spring/tweened stores, Vue Transition/TransitionGroup, Solid transitions.
4. Motion (motion.dev) for component and layout animation — Motion for React, Motion for Vue, vanilla motion anywhere; svelte-motion where a framer-style API is wanted in Svelte.
5. GSAP + ScrollTrigger for scroll choreography, timelines, and pinning (all GSAP plugins are now free, including SplitText).
6. SplitText or SplitType for character-level kinetic typography — always with the aria-label pattern from the showcase section.
7. Rive or Lottie for interactive vector animation: @lottiefiles/dotlottie-web (any framework), dotlottie-react, dotlottie-vue, svelte-lottie-player; .riv/.lottie files committed locally.
8. Lenis for smooth scroll, preserving native touch physics and position:sticky (existing guardrail).
9. 3D scenes per framework: React Three Fiber + drei, Threlte (Svelte), TresJS (Vue), or raw Three.js — always with local Draco/KTX2 decoders and the capability fallback.
10. Celebration effects for genuinely rewarding moments (completion, streaks, wins): canvas-confetti (any), @neoconfetti/svelte, tsparticles with @tsparticles/react, /vue, /svelte wrappers. Reserved for payoff moments, never ambient noise.

Microinteraction mandate: every state change the user causes gets visible motion — a created row animates in, a reorder slides, a toast springs, a checkbox ticks, a completed goal may celebrate. Write these as `<motion>` behaviors; the ladder above is how the builder delivers them.

### Icons and asset pipeline

- Icons: one set per app, used consistently, varied across the corpus. Menu (all npm-local): Phosphor (@phosphor-icons/react//vue, phosphor-svelte), Tabler (@tabler/icons-* per framework), Iconify via @iconify/tailwind4 or unplugin-icons (any set — Remix Icon, Solar, Carbon), Heroicons, kit-native sets (Material Symbols, PrimeIcons). Never an icon CDN.
- Fonts: @fontsource packages or vendored woff2 in /app. No font CDNs.
- Animation and 3D assets: .riv/.lottie files, GLB models, and their decoders (Draco, Basis/KTX2) all ship locally; heavy assets lazy-load on demand while the page stays interactive.

### How this lands in the instruction (and what the judge sees)

Library identity is not browser-verifiable, so the split stays absolute: the kit is named in `<summary>` and the `<requirements>` allowlist; every behavioral line in `<core_features>`, `<motion>`, and the rest stays library-anonymous and describes only the observable result — the accessible dialog, the animated reorder, the smooth virtualized scroll. The rubric grades those results; the assigned libraries are how a builder hits them in one shot.

Anti-patterns:

- Hand-rolling a modal, dropdown, combobox, or date picker when the assigned component library ships an accessible one.
- Default-theme component-library output presented as the visual design — the library accelerates structure and accessibility; the identity layer is still the task's.
- CDN imports of any library, font, or icon set.
- Library names inside behavioral sections (they belong in summary/requirements only).
- One library for everything — GSAP driving a hover that CSS handles, or a 3D engine for a static illustration.

---

## Showcase-Grade Design Guidance

Tasks with showcase-grade visual ambition — landing pages, website-fidelity rebuilds of showcase-class sites, 3D-forward apps — should be authored against a design-jury mindset rather than a corporate design-kit mindset: **Design 40%, Usability 30%, Creativity 20%, Content 10%**. The weighting is a reminder that beauty carries the most points but never excuses broken usability, and that copy quality is scored too. The corresponding extension criteria live in [rubrics.md](rubrics.md) (Showcase-Grade Design Extensions); this section covers how to *ask for* that caliber of work in `<visual_design>`, `<motion>`, and `<innovation>` — as observable behaviors, in plain text.

### The authoring recipe: how a showcase instruction gets written

A showcase-grade instruction is not a normal instruction with adjectives added. It is authored in this order, and the output of each step becomes concrete instruction lines:

1. **Choose ONE signature interaction first.** Every memorable site is organized around a single interaction idea — a hero object that rotates with scroll, a headline that assembles letter by letter, a page that wipes between chapters. Name it, then write it as the anchor lines of `<motion>`. If you cannot name the signature interaction in one sentence, the concept is not ready to author.
2. **Define the visual identity as three committed decisions**: one display typeface treatment (scale, weight behavior, where it appears), one compositional rule (what is asymmetric, what overlaps what, where whitespace concentrates), and one color/material stance (palette plus how imagery or 3D surfaces are treated). Write each as `<visual_design>` lines. Vague direction ("modern, clean, bold") produces template output; committed decisions ("the display face never appears smaller than half the viewport width in section openers") produce showcase output.
3. **Choreograph the page section by section.** For a scroll-driven page, write the scroll narrative as a numbered sequence in `<motion>`: what pins, what wipes, what parallaxes, in what order, and what state each section settles into. A builder given "sections animate on scroll" will sprinkle fade-ins; a builder given a choreography table will build a narrative.
4. **Give every interactive element a motion identity.** Buttons, links, cards, nav: specify the hover/press language once as a system ("all primary buttons share the magnetic-hover treatment; all cards lift with a shadow ease") so the motion feels designed, not per-element improvised.
5. **Specify the asset stack in `<requirements>`** (3D models, environment lighting, vector-animation runtime, bundled display fonts) and the allowlisted runtimes, then write only the observable results into the behavioral sections.
6. **Close with the floors**: performance (interactive fast, stable layout, smooth frames), accessibility (keyboard paths, reduced-motion completeness, contrast), and the capability fallback. These are what separate a showcase build from a demo reel.

Density bar: a showcase task's `<visual_design>` and `<motion>` sections together should carry **15 or more concrete behavioral lines**. If yours has five, the builder is making the design decisions — not you.

**1. Advanced structural and grid frameworks** (`<visual_design>`). Ask for proportion-based asymmetry instead of equal-width stacks: golden-canon-style spacing, focal structural objects, broken-grid moments where elements cross section borders and text overlays imagery with preserved legibility, and asymmetric whitespace treated as a functional compositional element. Authoring aid (for the designer/author, not for criteria text): the classical golden canon divides the page into ninths with a 2:3:4:6 inner:top:outer:bottom margin ratio and places focal objects on the intersections of corner-to-corner diagonals — use it to derive the composition, then describe the *result* qualitatively; keep the broken grid disciplined by aligning offsets to one baseline unit (multiples of 4 or 8 pixels). Describe the composition anatomy concretely so a judge can see it:

```
- The hero composes asymmetrically: the display headline occupies roughly two thirds of the width and overlaps the hero image edge, while the supporting copy sits in the remaining third with generous offset whitespace; nothing is centered in equal columns <!-- rubric:dimension=visual_design;criterion=2.a1,2.a2;verifier=visual -->
- Section dividers are crossed deliberately: the product image in section two extends past the section boundary into section three while its caption remains fully legible against the background <!-- rubric:dimension=visual_design;criterion=2.a2;verifier=visual -->
```

**2. Kinetic typography and splitting mechanics** (`<visual_design>` for scale, `<motion>` for movement). Treat typography as a core visual asset: a high-personality display typeface at immense scale anchoring minimalist sections, and headline text that animates at the character or word level (staggered reveals, scale or perspective shifts) driven by scroll or pointer. Fonts must ship locally with the app — never from an external host.

```
- The hero headline renders in the bundled display typeface at a scale spanning most of the viewport width, with body text at least four steps smaller so the headline anchors the section <!-- rubric:dimension=visual_design;criterion=2.a3;verifier=visual -->
- On first load the hero headline reveals with a per-character stagger; on scroll, the section-two headline characters shift subtly in response to scroll progress, settling cleanly with no misaligned glyphs <!-- rubric:dimension=motion;criterion=8.a1;verifier=interaction,fresh-load,timing -->
- Resizing the viewport between 1440 and 375 pixels scales all typography smoothly and continuously, with no abrupt size jumps at any width <!-- rubric:dimension=visual_design;criterion=2.a6;verifier=interaction,visual -->
- Split-text headlines keep the original phrase as an aria-label on the heading container while the individual character spans are hidden from the accessibility tree <!-- rubric:dimension=accessibility;criterion=1.a1;verifier=visual -->
```

**3. High-fidelity interaction and scroll-triggered storytelling** (`<motion>`). Scroll drives a sequential narrative: pinned sections, mask reveals, section-wipe transitions, canvas translations, pointer-reactive parallax or magnetic hover, and — where the task's allowlist permits a 3D engine — spatial scenes that respond to input in real time. Author these as choreography a judge can follow:

```
- Scrolling through the features region pins the section while three feature panels wipe in sequence, each mask reveal tied to scroll progress; scrolling back up reverses the sequence <!-- rubric:dimension=motion;criterion=8.a2;verifier=interaction,fresh-load -->
- Moving the pointer across the hero shifts the layered artwork with a smooth parallax offset that follows the cursor continuously <!-- rubric:dimension=motion;criterion=8.a3;verifier=interaction -->
```

**4. Rigorous technical constraints — perceptual speed and interoperability** (`<performance>`, `<responsiveness>`). At this level, beautiful sites that lag do not clear the bar. Require: scroll-linked animation holding a smooth frame rate through the full page, inertia or smooth-scroll effects that settle naturally without input lag, motion that uses inertial (non-linear) easing rather than mechanical linear tweens, a layout that is stable after load, and the showcase composition re-choreographed (not merely stacked) at smaller breakpoints.

```
- Continuous scrolling from top to bottom shows no visible hitching or dropped frames through every animated section <!-- rubric:dimension=technical;criterion=9.a1;verifier=interaction,timing -->
- After first paint, no visible layout jumps occur as fonts, images, or scenes finish loading; media regions hold their space from the start <!-- rubric:dimension=technical;criterion=9.a4;verifier=visual,fresh-load -->
- At 375 pixel width the hero re-composes: the display headline scales down but keeps its overlap relationship with the artwork, and the pinned features sequence becomes a swipeable stacked sequence rather than collapsing into plain static blocks <!-- rubric:dimension=visual_design;criterion=11.a2;verifier=visual,interaction -->
```

**5. Creative tech must stay accessible and judgeable** (`<accessibility>`, `<requirements>`). Showcase-class sites do not trade accessibility for flair — they layer semantics behind the effects: split headlines carry the phrase as an aria-label, canvas scenes expose role img with a label or a hidden sibling DOM mirroring their controls, and scene-driven state changes are announced. And in this harness there is a second, harder reason to require a fallback: the judge's headless chromium may software-render or lack GPU features entirely, so a page whose signature content exists only inside WebGL risks being unjudgeable, not just inaccessible.

```
- The 3D hero scene carries role img with a descriptive aria-label, and its interactive hotspots are mirrored by visually hidden focusable controls that operate the same actions from the keyboard <!-- rubric:dimension=accessibility;criterion=1.a2;verifier=keyboard,interaction -->
- Selecting a product color from the scene announces the change through an aria-live region <!-- rubric:dimension=accessibility;criterion=1.a3;verifier=interaction -->
- If 3D rendering is unavailable, the hero falls back to a static composition of the same artwork; every section, control, and flow remains present and usable <!-- rubric:dimension=technical;criterion=9.a5;verifier=visual,interaction -->
```

**6. Showcase-grade asset pipeline** (`<requirements>` for the mandates, criteria for the results). Work at this level is built on a distinctive asset stack: glTF/GLB 3D models with GPU-compressed textures, HDR studio-lighting environments driving physically-based materials, runtime vector animation files (Rive/Lottie-class) for buttons and illustrative graphics, MSDF font atlases so text drawn inside WebGL stays sharp, display typefaces bundled as woff2, and wasm decoders unpacking it all at runtime. Ask for this caliber of work when the genre supports it — fidelity rebuilds of showcase-class sites, showcase landing pages, 3D-forward apps — by splitting mandate from evidence:

- The **mandate** goes in `<requirements>` as builder-facing contract: which asset classes ship (3D models, environment lighting, vector animation runtime, bundled fonts), that every file including decoders is local in /app, and that the allowlist names the runtimes (3D engine, vector-animation player).
- The **criteria** stay observable — a judge cannot inspect a texture format, but it can see what the format buys:

```
- The hero object renders with physically lit materials: its glossy surfaces show environment reflections while matte and glass regions react differently to the same lighting as the object rotates <!-- rubric:dimension=visual_design;criterion=2.a8;verifier=visual,interaction -->
- Animated buttons and the circuit graphics stay perfectly crisp at every viewport size and zoom, and their animation responds to hover and press state rather than looping identically <!-- rubric:dimension=motion;criterion=8.a8;verifier=interaction,visual -->
- Text drawn inside the 3D scene keeps sharp glyph edges through every camera move and zoom level <!-- rubric:dimension=visual_design;criterion=2.a9;verifier=visual,interaction -->
- The page is interactive before the 3D scene finishes loading: navigation and copy respond immediately while the scene region holds its space and streams in without shifting the layout <!-- rubric:dimension=technical;criterion=9.a6;verifier=fresh-load,interaction,timing -->
```

Anti-slop pairing: require the interactive form, not a facsimile — a pre-rendered video loop standing in for an interactive scene or vector animation (pixelates when scaled, ignores input, restarts identically) fails the motion extension (`8.a9`). And the judgeability rule from block 5 still governs: every scene-dependent experience keeps its capability-checked fallback (`9.a5`).

### Worked showcase example: the density to aim for

A fictional product page for a mechanical dive watch, authored with the recipe above. Signature interaction: the watch head rotates and disassembles as the user scrolls through three chapters. Note the register — every line is a committed, observable decision:

```
<visual_design>
- The page uses exactly two typefaces: the bundled display face for chapter titles and numerals, body text in the bundled grotesque; the display face never renders smaller than 96 pixels at desktop width <!-- rubric:dimension=visual_design;criterion=2.a3;verifier=visual,computed-style -->
- The hero composes asymmetrically: the watch scene occupies the right two thirds and bleeds off the top and right viewport edges; the title stack sits lower-left with the chapter index, and the left third below the title is deliberate empty space <!-- rubric:dimension=visual_design;criterion=2.a1,2.a2;verifier=visual -->
- Chapter titles overlap the scene: each title's last two characters render over the watch artwork while remaining fully legible against it <!-- rubric:dimension=visual_design;criterion=2.a2;verifier=visual -->
- Palette is monochrome ink (#0B0B0C) on bone (#F3F1EC) with a single luminous accent (#00E5A0) reserved exclusively for the depth-rating numerals and the configure control — the accent appears nowhere else <!-- rubric:dimension=visual_design;criterion=2.1;verifier=visual,computed-style -->
- The watch renders with physically lit materials: the polished bezel carries environment reflections, the brushed case reacts more diffusely to the same light, and the crystal shows glass transparency as the head rotates <!-- rubric:dimension=visual_design;criterion=2.a8;verifier=visual,interaction -->
- All spacing aligns to an 8 pixel baseline: section paddings, the chapter index offsets, and the overlapped title positions are multiples of it <!-- rubric:dimension=visual_design;criterion=2.a7;verifier=computed-style -->
- Between 1440 and 375 pixels all typography scales fluidly with no size jumps; at 375 the scene moves above the title stack but keeps its off-edge bleed <!-- rubric:dimension=visual_design;criterion=2.a6,11.a2;verifier=interaction,visual -->
</visual_design>

<motion>
- Signature interaction: scrolling from the hero through chapters one to three rotates the watch head 270 degrees and separates it into bezel, dial, and movement layers, one layer lifting away per chapter; scrolling back reassembles it in reverse <!-- rubric:dimension=motion;criterion=8.a2;verifier=interaction,fresh-load -->
- Each chapter pins while its copy block wipes in from the baseline with a masked reveal, then unpins as the next chapter's rotation segment begins <!-- rubric:dimension=motion;criterion=8.a2;verifier=interaction,fresh-load -->
- On first load the hero title assembles per character with a stagger of roughly 30 milliseconds per glyph, settling cleanly with no misaligned characters <!-- rubric:dimension=motion;criterion=8.a1;verifier=fresh-load,timing -->
- Moving the pointer across the hero tilts the watch head up to roughly 6 degrees toward the cursor, continuously and without stepping; the tilt eases back to neutral when the pointer leaves <!-- rubric:dimension=motion;criterion=8.a3;verifier=interaction -->
- Hover system: the configure control and chapter-index entries share one magnetic hover treatment (the element eases a few pixels toward the cursor and back); body links underline with a left-to-right wipe; no interactive element uses a bare default hover <!-- rubric:dimension=motion;criterion=8.1;verifier=interaction,computed-style -->
- All motion uses inertial easing — nothing starts or stops at constant speed; scroll-linked movement settles with momentum when scrolling stops <!-- rubric:dimension=motion;criterion=8.a7;verifier=interaction -->
- With prefers-reduced-motion set, the disassembly becomes three static exploded views that swap per chapter, the title renders assembled, and every chapter remains reachable by normal scrolling <!-- rubric:dimension=motion;criterion=8.8;verifier=interaction -->
- Continuous scroll from top to bottom holds a smooth frame rate through all three chapters <!-- rubric:dimension=technical;criterion=9.a1;verifier=interaction,timing -->
</motion>
```

What makes this showcase-register rather than template-register: one named signature interaction carried through three sections; exact counts, angles, and durations instead of "smooth" and "modern"; a stated hover *system* instead of per-element effects; the accent color given a scarcity rule; whitespace assigned a job; and the reduced-motion path specified as a complete alternate experience, not an afterthought.

Authoring guardrails (non-negotiable, restate in `<requirements>` where relevant):

- Usability is 30 points: scroll capture must never trap the user, block keyboard access, or hide core content; every showcase effect keeps a working reduced-motion path in which the experience remains complete and navigable.
- Smooth-scroll engines preserve native platform behavior: native touch physics on mobile, position:sticky intact, never fighting the user's scroll direction.
- All fonts, textures, and models ship locally in `/app`; any outbound asset request is a technical failure. Variable fonts are welcome (axis morphing is a showcase-grade signal) but the font files must be bundled.
- Animation, smooth-scroll, and 3D libraries are named only in the `<requirements>` allowlist — never in `<core_features>` — and effects are specified as observable behavior, not library usage.
- Every effect line is tagged `fresh-load` when scroll or intro state matters, and is verified through the real control path (actual scrolling, actual pointer movement).
- Contrast floor is WCAG AA everywhere, including text over imagery and canvas; AAA (7:1 body text, 4.5:1 large text) is an optional showcase-tier stretch stated as guidance, never as a base criterion.

Not gradeable — never write criteria for these (builder tactics whose only judge-visible trace is the observable result):

- Lighthouse scores, Core Web Vitals numbers (LCP, CLS, INP), or any audit-tool threshold — the judge grades what it can see: fast interactive load, stable layout, smooth frames.
- Server-side rendering — contradicts the SPA local-serve delivery contract.
- Web Workers, OffscreenCanvas, GLSL shader specifics, instanced drawing, texture atlasing or compression formats, level-of-detail systems, frustum culling, bundle sizes — internal implementation a browser judge cannot verify. The builder may use all of them; the criteria grade only the resulting smoothness, stability, and speed.
- Library configuration internals (scroll-engine damping values, ticker syncing) — library names belong in the `<requirements>` allowlist and nowhere else.

---

## Rubric-Mapping Comments (Authoring-Only)

Every behavioral sentence in the **authoring source** of an instruction ends with an XML comment mapping it to the dimension toml(s) and criterion id(s) it feeds, plus the verifier method(s) a judge uses:

```
- Submitting the create form with a filled title adds one row to the list and the collection count increases by exactly one <!-- rubric:dimension=core_features;criterion=1.2,5.1;verifier=interaction,count-delta -->
```

Grammar:

```
<!-- rubric:dimension=<tests-dir>[,<tests-dir>];criterion=<id>[,<id>];verifier=<method>[,<method>] -->
```

- `dimension` — exact `tests/{dimension}` directory slug(s). In this repo: `core_features`, `visual_design`, `motion`, `technical`. In the zto 8-shape layout: `functional`, `design`, `ux`, `behavioral`, `accessibility`, `technical`, `writing` (never `anticheat` — see below). No ad-hoc names ("Safety", "Robustness").
- `criterion` — the stable `id` field of the `[[criterion]]` entry (or entries) in that dimension's toml (e.g. `1.2`, `2.n6`, `14.4`). Optional while the rubric is still being drafted; required before packaging.
- `verifier` — one or more from the closed vocabulary:

| Verifier | Meaning |
|---|---|
| `visual` | Judge confirms by looking at the rendered page/screenshot |
| `interaction` | Judge performs the real UI action (click, drag, type) |
| `keyboard` | Keyboard-only operation (Tab/Shift+Tab/Enter/Space) |
| `timing` | Judge measures a duration (transition length, load time) |
| `computed-style` | Judge inspects computed styles (hover-while-hovering, tokens, contrast) |
| `count-delta` | Judge measures a count immediately before and after the action |
| `reload` | Judge reloads mid-flow and checks the persistence rule |
| `fresh-load` | Judge must start from a fresh page load (scroll-reveal state, intro animations) |
| `console` | Judge inspects console for errors/warnings |
| `storage` | Judge inspects localStorage/sessionStorage per the genre rule |
| `webmcp` | Judge exercises the webmcp contract binding |

**Lifecycle:** these comments exist only in authoring sources and in this template. Packaging strips every `<!-- rubric:... -->` comment before the builder-visible `instruction.md` is produced, so the grading map (which sentence feeds which criterion, and how it is verified) never reaches the builder. (The strip step is a packaging contract owned by `corpuscheck.package_frontend_tasks`; adding it there is a follow-up outside this document.)

---

## Canonical Section Order and Dimension Targets

| # | Section | Feeds tests/{dimension} | Status |
|---|---|---|---|
| 1 | `<summary>` | all | Required |
| 2 | `<reference_screenshots>` | visual_design / design | Required when screenshots ship |
| 3 | `<core_features>` | core_features / functional | Required |
| 4 | `<user_flows>` | behavioral | Only when the task ships a behavioral toml |
| 5 | `<edge_cases>` | core_features + ux (no dedicated dir) | Optional; may fold into core_features |
| 6 | `<visual_design>` | visual_design / design | Required |
| 7 | `<motion>` | motion | Required |
| 8 | `<responsiveness>` | visual_design + core_features (no dedicated dir) | Optional; may fold into visual_design |
| 9 | `<accessibility>` | accessibility when shipped, else technical | Optional |
| 10 | `<performance>` | technical | Optional; may fold into requirements |
| 11 | `<writing>` | writing | Only when the task ships a writing toml |
| 12 | `<innovation>` | visual_design / motion (bonus) | Optional, non-blocking |
| 13 | `<requirements>` | technical | Required |
| 14 | `<integrity>` | protected | Required, fixed contract text |
| 15 | `<delivery>` | protected | Required, fixed plumbing text |
| 16 | `<webmcp_action_contract>` | protected | Required when the task declares a contract; machine-rendered |

**There is no `<anticheat>` section and there never will be.** Anti-cheat gate criteria and behavioral probe mechanics live exclusively under `tests/`. The instruction describes product behavior only; it must never reveal what the judge probes for beyond the behavior itself. Likewise, `<user_flows>` describes flows as product behavior ("after a reload the board shows the same cards"), never as probes ("the judge will reload to check").

---

## Section Definitions

Each definition gives: purpose, target dimension, what to encode (positive and negative expectations), and a corrected plain-text example line with its authoring-only rubric comment.

### 1. `<summary>`

Exactly one plain-text line naming the app and the full stack:

```
<summary>
Build a habit tracking dashboard using React, Zustand, and Tailwind CSS.
</summary>
```

This is the only place besides `<requirements>` where the state library is named.

### 2. `<reference_screenshots>`

Target: visual_design / design. Inventory and ground rules for the images in `/reference-screenshots`:

- List every file with viewport, platform, and mode/state (overview.png — full-page desktop overview, downscaled; segment-NN.png — full-resolution 1440x900 sections, top-to-bottom with slight overlap).
- Mark one screenshot as canonical per flow step so graders have a single reference.
- State the conflict rule verbatim: where a screenshot and the text conflict, the text wins; screenshots are illustrative.
- Forbid shipping the images as app assets.

Example line:

```
Screenshots of the reference application are provided in-container at /reference-screenshots: overview.png is a full-page desktop-layout overview; segment-NN.png are full-resolution 1440x900 sections in top-to-bottom order. They are part of this instruction: recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets. <!-- rubric:dimension=visual_design;verifier=visual -->
```

### 3. `<core_features>`

Target: `tests/core_features` (this repo) or `tests/functional` (zto shape). The heart of the PRD: every user-facing feature as observable behaviors, grouped by plain-text feature labels. For each feature encode: the workflow, the visible feedback, demo affordances, and validation behavior. Capture composition density (table anatomy, nav group counts, panel contents) — browser judges cannot infer structure from title-only inventories.

Example feature block (plain text, no markdown):

```
Feature: Create item —
- Clicking the Create button opens a modal with fields: title (required), description (optional), tags (optional); the Submit control stays disabled until title is non-empty <!-- rubric:dimension=core_features;criterion=1.2;verifier=interaction,visual -->
- Submitting with a valid title closes the modal, adds exactly one new row to the list, and increases the visible item count by one <!-- rubric:dimension=core_features;criterion=1.3;verifier=interaction,count-delta -->
- Submitting with an empty title shows an inline validation message naming the title field and adds no row <!-- rubric:dimension=core_features;criterion=1.4;verifier=interaction,visual,count-delta -->

Feature: Search and filter —
- Typing in the search field narrows the visible list incrementally to items whose titles match; clearing the field restores the full list exactly <!-- rubric:dimension=core_features;criterion=1.6;verifier=interaction -->
- When search and filters match nothing, the list region shows an empty state with a message and a Clear filters control that restores the full list <!-- rubric:dimension=core_features;criterion=1.7;verifier=interaction,visual -->
```

Note what is absent versus a backend-era PRD: no endpoints, no response codes, no request counting. Evidence is rows, counts, messages, and view changes.

### 4. `<user_flows>`

Target: `tests/behavioral`. Only present when the task ships a behavioral toml. End-to-end flows written as product behavior, mirroring the behavioral dimension in rubrics.md: multi-facet state coherence, ordering that derives from live data, derived views that track their inputs.

```
- Sorting the expense list by amount ascending then descending reverses the row order relative to ascending <!-- rubric:dimension=behavioral;criterion=14.2;verifier=interaction -->
- Changing the chart timeframe between week and month changes the plotted range to reflect the selected period <!-- rubric:dimension=behavioral;criterion=14.3;verifier=interaction,visual -->
- Marking a habit complete in the list view updates the same habit's streak in the calendar view without a reload <!-- rubric:dimension=behavioral;criterion=14.4;verifier=interaction -->
```

For persistence genres, state the reload rule as behavior ("after a page reload the board shows the same columns, cards, and sort order"); for in-memory genres, state the reset rule ("a page reload returns the app to its seeded state"). Never phrase these as judge actions.

### 5. `<edge_cases>`

Targets: core_features + ux criteria (no dedicated test dir — mapping comments point at functional/ux ids). Empty, error, and boundary situations with their exact visible recovery:

```
- Deleting the last item shows an empty state in the list region with a message and a Create control that opens the create flow <!-- rubric:dimension=core_features;criterion=6.6;verifier=interaction,visual -->
- A title longer than 120 characters is truncated with an ellipsis in the list row and shown in full on the detail view <!-- rubric:dimension=core_features;criterion=5.n?;verifier=interaction,visual -->
- Double-activating the Submit control creates exactly one item: the count increases by one and one new row appears <!-- rubric:dimension=core_features,technical;criterion=1.3;verifier=interaction,count-delta -->
```

Simulated-failure UI is allowed only when the PRD defines it as a demo affordance (a toast with a retry control); never describe real network failure modes.

### 6. `<visual_design>`

Target: `tests/visual_design` (or `design`). Layout composition, density, palette, typography, and component states — what must be visible, not CSS class names:

```
- Color palette: primary #007AFF for primary actions and active states, neutral #6E6E6E for secondary text, error #D32F2F for validation messages, applied consistently across all views <!-- rubric:dimension=visual_design;criterion=2.1;verifier=visual,computed-style -->
- Typography: a clear hierarchy with page titles visibly larger than section headings, which are larger than body and label text, consistent across views <!-- rubric:dimension=visual_design;criterion=2.2;verifier=visual -->
- Spacing follows a consistent rhythm: gaps between cards and sections are visually regular, with no crowded or orphaned regions <!-- rubric:dimension=visual_design;criterion=2.3;verifier=visual -->
- Component states: buttons and inputs show distinct default, hover, focus (visible ring), disabled, and error treatments <!-- rubric:dimension=visual_design;criterion=2.7;verifier=interaction,computed-style -->
```

Describe composition anatomy explicitly (asymmetric mosaic spans, table column lists, sidebar group counts) — judges grade what they can see.

### 7. `<motion>`

Target: `tests/motion`. Durations, easings, which elements animate, and the reduced-motion fallback. Hover feedback is a required callout — its omission is the most common false "done":

```
- Hover animations (required): buttons ease background and shadow with a slight press effect; list rows and nav items take a full-width hover wash; form controls show focus rings <!-- rubric:dimension=motion;criterion=8.1;verifier=interaction,computed-style -->
- The create modal enters with a short opacity and scale transition of roughly 200 to 300 milliseconds and exits the same way <!-- rubric:dimension=motion;criterion=8.4;verifier=interaction,timing -->
- Toasts slide in, remain readable, and auto-dismiss with a fade <!-- rubric:dimension=motion;criterion=8.2;verifier=interaction,timing -->
- With prefers-reduced-motion set, animations are removed and state changes apply instantly <!-- rubric:dimension=motion;criterion=8.8;verifier=timing -->
```

Authoring note (not instruction text): motion criteria must be judged through the real UI control path, and scroll-reveal behavior must be tagged `fresh-load` in its rubric comment because scroll state pollutes reveal state.

### 8. `<responsiveness>`

Targets: visual_design + core_features (no dedicated dir). Breakpoints and reflow rules as visible behavior:

```
- At widths of 768 pixels and below, the sidebar collapses to a hamburger control that opens an overlay drawer; at desktop widths the sidebar is open by default <!-- rubric:dimension=visual_design;criterion=7.5;verifier=interaction,visual -->
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width <!-- rubric:dimension=visual_design;criterion=7.8;verifier=visual -->
```

No network-condition emulation content — load behavior belongs in `<performance>` and is measured locally.

### 9. `<accessibility>`

Target: `tests/accessibility` when the task ships that toml, otherwise fold into technical. Keyboard, ARIA, focus, and contrast expectations phrased as DOM-inspectable behavior:

```
- Every interactive control is reachable and operable with the keyboard alone, with a visible focus indicator <!-- rubric:dimension=accessibility;criterion=1.1;verifier=keyboard,visual -->
- The create modal uses role dialog with aria-modal true, traps focus while open, and returns focus to the Create button on close <!-- rubric:dimension=accessibility;criterion=1.2;verifier=keyboard,interaction -->
- Validation messages are announced via an aria-live polite region as well as shown visually <!-- rubric:dimension=accessibility;criterion=1.4;verifier=interaction,visual -->
```

### 10. `<performance>`

Target: `tests/technical`. Browser-observable budgets only:

```
- The app is interactive within 2 seconds of a local cold load <!-- rubric:dimension=technical;criterion=9.1;verifier=timing -->
- No console errors or warnings appear during a full exercise of the app <!-- rubric:dimension=technical;criterion=9.2;verifier=console -->
- The UI stays responsive under rapid repeated input with no hangs or dropped interactions <!-- rubric:dimension=technical;criterion=9.8;verifier=interaction -->
```

No Lighthouse scores, bundle-size budgets, or network-throttling targets — those are not verifiable in this harness's judging model.

### 11. `<writing>`

Target: `tests/writing` when shipped. Copy conventions for the app's own rendered text; criteria self-scope so text-light apps pass by default:

```
- Headings and buttons use one consistent capitalization convention throughout the app <!-- rubric:dimension=writing;criterion=15.1;verifier=visual -->
- Action labels are specific verbs such as Add expense and Start session rather than generic labels where a specific one is possible <!-- rubric:dimension=writing;criterion=15.2;verifier=visual -->
- Error messages name the problem and the fix; empty states explain what belongs there and how to add it; no placeholder text appears anywhere in the shipped UI <!-- rubric:dimension=writing;criterion=15.3,15.4;verifier=visual -->
```

### 12. `<innovation>`

Targets: visual_design / motion bonus criteria. Optional, non-blocking enhancement space the builder may use to exceed the spec (guided onboarding, dynamic theming, delightful microinteractions). Mark everything here as optional; nothing in this section may be required for a passing build.

### 13. `<requirements>`

Target: `tests/technical`. The stack and state contract, stated as behavior:

```
Shared application state must live in [state library named in summary] (in-memory only): the primary collection, active view, filters, selection, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid item increases the collection and shows the new row; derived counts update
- Editing an item updates that record everywhere it appears
- Deleting an item removes it from the list, selection, and derived counts
- Filters and sort recompute the visible list from the shared collection; they do not create a second disconnected copy
- Theme and active view are shared client state; toggling them does not reload the document
Build tooling: Vite or an equivalent SPA setup. [Allowed component/chart libraries]. No other external component libraries. No backend or authentication.
- Seed at least [N] items so the primary view is non-empty on first load
- Zero navigational outbound links for app chrome; view changes via shared client state
```

The storage prohibition is genre-conditional: good-app tasks forbid all browser storage; hard-browser and framework-rebuild tasks include the persistence contract their source PRD mandates instead.

### 14. `<integrity>` (protected)

Fixed contract text; do not restyle per task:

```
<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>
```

This is not where anti-cheat expectations are described — those exist only in `tests/`.

### 15. `<delivery>` (protected)

Fixed plumbing text: the app is original and self-contained in `/app`; `/app/package.json` defines npm scripts named exactly `start` (serves on port 3000) and `verify:build`; no iframing, proxying, or fetching the product from another origin; WebMCP is a required delivery step, not a scoring criterion.

### 16. `<webmcp_action_contract>` (protected)

Machine-rendered by `corpuscheck webmcp apply` from corpuscheck `schemas/webmcp-assignments.json` and the module specs in `packages/webmcp-contracts`. Never hand-authored or hand-edited; task authors only choose the module assignment. The section carries the contract version, module list, and embedded `<module_spec>` JSON blocks.

---

## Filled Worked Example (Copyable)

A complete feature block in final form — plain text, closed tags, authoring comments in place (stripped at packaging):

```
<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Create expense —
- Clicking the Add expense button opens a modal with amount (required, positive number), category (select, required), and note (optional); Submit stays disabled until amount and category are valid <!-- rubric:dimension=core_features;criterion=1.2;verifier=interaction,visual -->
- Submitting a valid expense closes the modal, adds exactly one row to the expense list, and updates the monthly total and category chart to include the new amount <!-- rubric:dimension=core_features,behavioral;criterion=1.3,14.3;verifier=interaction,count-delta -->
- Submitting with an empty amount shows an inline message naming the amount field in the error color and adds no row <!-- rubric:dimension=core_features;criterion=1.4;verifier=interaction,visual,count-delta -->
- Double-activating Submit creates exactly one expense: the row count increases by one and one new row appears <!-- rubric:dimension=core_features,technical;criterion=1.3;verifier=interaction,count-delta -->
- A note longer than 120 characters is truncated with an ellipsis in the list row and shown in full in the expense detail panel <!-- rubric:dimension=core_features;criterion=1.5;verifier=interaction,visual -->
</core_features>
```

---

## Author Completion Checklist

Before packaging, confirm:

1. The PRD clears the complexity bar: primary collection with create/edit/delete (or genre equivalent), at least two views or interaction modes, domain state beyond CRUD, at least two user flows, no real authentication or external APIs, and not a near-duplicate of an existing task.
2. The shared-state contract is present: the state library is named in `<summary>` and `<requirements>`, all data lives in memory, and the storage rule matches the task's genre.
3. Every behavioral sentence carries a rubric comment; every comment's `dimension` is a valid `tests/{dimension}` slug and every `criterion` id exists in that dimension's toml.
4. Every must-have criterion in the task's dimension tomls is implied by at least one instruction sentence (nothing is graded that was never asked for).
5. Sections contain plain text only — no markdown bold, headers, backticks, or links; all tags closed; canonical section order kept.
6. No state-library names appear in `<core_features>`; no grading mechanics, probe descriptions, or judge tooling appear anywhere.
7. Quantifiers are resolved; screenshots are inventoried with the text-wins rule; protected sections carry their fixed contract text; the webmcp block is generator output, untouched.
8. The strip step will remove every `<!-- rubric:... -->` comment from the builder-visible file.
