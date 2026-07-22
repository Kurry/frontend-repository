---
name: aesthetic-instruction-upgrader
description: Rewrite frontend Harbor task instructions so the resulting apps have distinctive, coherent, production-grade aesthetics grounded in the repository's 6,197-site Awwwards study. Use for tasks/frontend-*/instruction.md when selecting or refining frameworks, libraries, CSS technologies, motion systems, typography, advanced assets, visual design, responsive composition, state styling, innovation, or design fidelity without creating a generic technology mega-stack.
---

# Aesthetic Instruction Upgrader

Improve the aesthetic ceiling of a frontend task by turning measured Awwwards evidence and vague taste words into a compact visual and technical system that a builder can implement and a browser judge can observe. This skill changes the brief, not the product scope: preserve the task's domain, workflows, schemas, exports, protected blocks, and useful end state.

Always read [references/awwwards-technology-motion-type.md](references/awwwards-technology-motion-type.md) before proposing frameworks, libraries, motion, typography, CSS features, or advanced assets. Read [references/cohort-examples.md](references/cohort-examples.md) when upgrading one of the lower-scoring productivity, workflow, game, data-tracking, creative-tools, or website-fidelity tasks discussed there. Read the existing `design-from-awwwards-evidence` and `upgrade-frontend-production-design` skills for the broader evidence and production-design workflows when available.

## Workflow

### 1. Audit before rewriting

Inspect the complete `instruction.md`, task genre, reference screenshots, dimension TOMLs, and existing oracle when in scope. Identify concrete aesthetic failures:

- interchangeable visual language that could describe ten unrelated products;
- equal-weight cards instead of a focal composition;
- no relationship between the domain artifact and surrounding chrome;
- default typography, arbitrary gradients, excessive pills, or unmotivated rounded cards;
- realistic content in the happy path but generic empty, error, loading, selected, or completed states;
- motion described as a list of fades rather than a causal interaction grammar;
- desktop layout squeezed onto mobile;
- focus, contrast, reduced motion, or touch behavior treated as postscript;
- a polished shell with a visually weak export, dialog, table, canvas, or result state.

Do not infer a visual problem from a low WebMCP or technical score. Do not “fix” aesthetic weaknesses by adding features, libraries, dependencies, routes, persistence, or new data fields.

### 2. Run the Awwwards evidence pass

Consult the repository study before choosing a direction. Keep its evidence layers separate:

1. **Editorial tags** describe how Awwwards classified a site, including animation, typography, 3D, storytelling, GSAP, Three.js, and WebGL.
2. **Live fingerprints** estimate surviving frameworks, libraries, infrastructure, and browser signals.
3. **Retained CSS and asset evidence** describes production primitives and pipelines such as grid, transforms, variable fonts, GLB, KTX2, HDR, Rive, workers, and WASM.

Create a short evidence ledger for every substantial upgrade:

```text
Product need | Evidence layer and measured signal | Adopt/adapt/reject | Visible purpose | Cost/fallback
```

Use at least one relevant composition/style signal and one relevant motion, typography, CSS, library, framework, or asset signal. Explicitly reject tempting but irrelevant techniques. Never treat frequency as quality, combine mutually exclusive frameworks, or infer implementation proof from an editorial tag.

Apply this chain:

`product job → experience bundle → visible requirement → existing or justified technology → fallback → browser evidence`

Do not reverse it into `popular library → invented feature`.

### 3. Write the aesthetic and technology brief

Before editing tags, write an internal brief with these fields:

```text
Aesthetic thesis: [product/domain] feels like [specific reference world] because [visual principle].
Composition: [dominant object or surface], [secondary chrome], [reading order].
Typography: [display role], [reading role], [utility/data role], [contrast and density].
Color roles: [field], [surface], [ink], [accent], [status], [selection], [visualization].
Material language: [paper, instrument, felt, archive, studio, terminal, editorial, etc.].
Signature motif: one recurring visual device tied to the product's job.
State language: how active, selected, empty, loading, error, success, and completed states belong to the system.
Responsive art direction: what remains primary, what collapses, and what changes interaction mode.
Motion signature: one causal transition plus a small feedback vocabulary.
Framework/runtime: preserve the assigned stack or justify one architecture for a new task.
Libraries: the smallest set that earns its cost through a visible product benefit.
CSS/asset system: relevant layout, material, type, rendering, and fallback primitives.
Anti-generic constraints: two or three treatments the builder must avoid.
```

Choose one concept spine, one signature motif, and no more than two supporting motifs. Do not make every task dark, glassy, gradient-heavy, editorial, or cinematic. Website-fidelity tasks must preserve their reference identity; product tasks need a domain-appropriate direction.

### 4. Select technologies without making a census

Preserve a task's assigned framework and UI system. Aesthetic weakness is not permission to replace React with Vue, Vue with Svelte, or an Astro fidelity build with a client-heavy SPA. For a new task, select one primary framework/runtime from the interaction architecture and delivery constraints, not from archive popularity.

Use the technology ladder in the Awwwards reference:

- prefer semantic HTML and CSS for layout, type, material, hover/focus, and simple transitions;
- add one framework-native motion solution for component lifecycle or layout continuity;
- use GSAP when the product needs a coordinated timeline, spatial sequence, SVG/canvas choreography, or carefully bounded scroll narrative that CSS cannot express clearly;
- use AutoAnimate only for straightforward list insertion, removal, and reorder continuity;
- use Lottie or Rive for authored vector motion with a defined state role and static fallback;
- use Canvas, PixiJS, Three.js, or another renderer only when the work surface or scene is intrinsically spatial, graphical, or game-like;
- use workers, WASM, compressed geometry/textures, and HDR only as a complete loading, failure, cleanup, and fallback system.

An instruction may name an assigned framework or required technical integration in `<requirements>`. Rubric criteria must grade the resulting browser-observable behavior, never the dependency name. Before adding or changing any library, inspect the installed version and use `ctx7` to fetch its current official documentation as required by the repository instructions.

### 5. Upgrade the instruction by observable dimension

Keep promises in their existing tags. Write each requirement as an action, state, or viewport condition followed by visible evidence. Prefer a few high-leverage requirements over a long adjective list.

`<visual_design>` should establish:

- the dominant focal surface or artifact and the hierarchy of surrounding controls;
- a type system with distinct display, reading, utility, and numeric roles;
- semantic color and material roles, including selected, disabled, warning, error, and success treatments;
- realistic populated content that exercises density, wrapping, hierarchy, and empty states;
- the signature motif and how it reinforces the product's job;
- visual relationships across the main workspace, dialogs, drawers, exports, and completed result.

`<motion>` should establish a grammar, not an animation inventory. For each graded transition state the trigger, affected elements, order, interruption behavior, settled state, and reduced-motion alternative. Require the real gesture or control path for drag, hover, focus, canvas, game, and scroll behavior.

`<responsiveness>` should explain composition changes at the task's meaningful breakpoints: what remains visible, what becomes a drawer or sheet, what scrolls internally, what changes order, how typography and touch targets hold up, and how the signature interaction works on mobile.

`<accessibility>` should make aesthetic states operable: visible focus against every surface, semantic names, logical focus return, live announcements for async feedback, non-color status cues, keyboard alternatives for direct manipulation, and reduced-motion behavior that retains orientation and state evidence.

`<writing>` should specify the product's voice and realistic content rules. Require exact copy only when fidelity matters. Ban lorem ipsum, unexplained metrics, fake proof, placeholder labels, and generic “Submit/OK” actions where the domain has a precise verb.

For typography, specify both art direction and delivery: display, reading, utility, and numeric roles; family/weight/width contrast; measure and wrapping; variable axes only when the asset supports them; stable numerals for changing data; fallback behavior; and avoidance of layout shift. Do not require a proprietary font that is not shipped or licensed.

### 6. Convert the brief into criteria

If the task's dimension TOMLs are in scope, add or refine only browser-observable criteria in the matching dimensions. Never grade “uses a design system,” a named framework, a dependency, or an aesthetic adjective. Grade the visible hierarchy, role separation, state treatment, motion continuity, responsive transformation, contrast, or content quality produced by that choice.

Preserve existing criterion IDs and protected instruction blocks. Do not silently expand schemas, exports, persistence, or feature groups. Use the `task-authoring` and `rubrics` skills for repository-specific mutation and validation rules.

### 7. Hand off a copy-ready upgrade

Return:

1. the aesthetic thesis and chosen visual dials;
2. the Awwwards evidence ledger, including adopted, adapted, and rejected signals;
3. the framework, library, CSS, asset, motion, and typography profile;
4. the concrete gaps found in the original brief;
5. replacement or additive text grouped by instruction tag;
6. proposed rubric coverage, grouped by dimension;
7. anti-generic and scope guardrails;
8. validation commands and any oracle mismatch that must be handled separately.

The finished brief must let a capable builder make specific visual decisions and let a browser judge distinguish a coherent product from a decorated default template.

## Quality bar

Reject upgrades that:

- only add “premium,” “modern,” “clean,” “beautiful,” or “cinematic” adjectives;
- prescribe arbitrary pixel trivia without a fidelity or usability reason;
- add gradients, 3D, shaders, sound, parallax, or smooth scrolling merely because they are fashionable;
- turn every product into a dashboard, card grid, or centered hero;
- make mobile a smaller desktop screenshot;
- grade animation presence without causality, interruption, settled state, and reduced motion;
- improve the hero while leaving work surfaces, errors, dialogs, exports, and completed artifacts generic;
- introduce new product behavior solely to create more surfaces to style.
- combine React, Vue, Nuxt, Next.js, GSAP, Three.js, WebGL, Lottie, and smooth scrolling as a technology checklist;
- cite an Awwwards frequency without identifying its evidence layer, product relevance, visible purpose, and fallback;
- require a library in a visual rubric or treat a framework replacement as an aesthetic improvement;
- use a display font, variable axis, motion plugin, shader, or advanced asset without a loading and fallback plan.
