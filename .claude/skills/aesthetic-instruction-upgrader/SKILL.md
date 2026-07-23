---
name: aesthetic-instruction-upgrader
description: Rewrite existing frontend Harbor task instructions in place so aesthetics improve while task shape remains exactly constant, grounded in the repository's 6,197-site Awwwards study. Use for tasks/frontend-*/instruction.md when refining the presentation of already-assigned frameworks, libraries, CSS technologies, motion systems, typography, assets, visual design, responsive composition, or state styling without changing features, flows, controls, schemas, artifacts, WebMCP, dependencies, or rubric structure.
---

# Aesthetic Instruction Upgrader

Improve the aesthetic ceiling of a frontend task by turning measured Awwwards evidence and vague taste words into a compact visual and technical system that a builder can implement and a browser judge can observe. This skill changes the brief, not the product scope: preserve the task's domain, workflows, schemas, exports, protected blocks, and useful end state.

Always read [references/awwwards-technology-motion-type.md](references/awwwards-technology-motion-type.md) before proposing frameworks, libraries, motion, typography, CSS features, or advanced assets. Read [references/cohort-examples.md](references/cohort-examples.md) when upgrading one of the lower-scoring productivity, workflow, game, data-tracking, creative-tools, or website-fidelity tasks discussed there. Read the existing `design-from-awwwards-evidence` and `upgrade-frontend-production-design` skills for the broader evidence and production-design workflows when available.

## Workflow

### 0. Freeze task shape

Treat task shape as immutable. Before drafting, inventory and freeze:

- XML tag names and order;
- every `Feature:` group, user flow, edge case, route, screen, control, action, keyboard shortcut, state transition, seeded record, and exact required string;
- all field names, types, ranges, enums, validation rules, persistence behavior, import/export formats, and artifact fields;
- the assigned framework, component system, libraries, dependencies, asset inventory, and delivery architecture;
- the complete `<integrity>`, `<delivery>`, `<webmcp_action_contract>`, and `<reference_screenshots>` blocks;
- every rubric file, criterion count, ID, name, description, type, weight, polarity, and judge configuration.

This skill must not add, remove, rename, reorder, broaden, narrow, or reinterpret any frozen item. Do not edit dimension TOMLs, WebMCP assignments, reference screenshots, the oracle, or any task file other than `instruction.md`. Do not add dependencies or replace an assigned library, even when the Awwwards evidence suggests one.

Only rewrite existing bullets in `<visual_design>`, `<motion>`, `<responsiveness>`, `<accessibility>`, and `<writing>`. Preserve each section's bullet count. Every rewritten bullet must map to the same existing behavior and an existing criterion; improve its art direction, hierarchy, typography, material, choreography, or clarity without introducing a new state or obligation.

If an improvement requires a new feature, state, asset, dependency, criterion, or control, do not apply it. List it separately as an un-applied shape-changing idea requiring explicit user authorization.

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

Do not infer a visual problem from a low WebMCP or technical score. Do not “fix” aesthetic weaknesses by adding features, libraries, dependencies, routes, persistence, criteria, or new data fields.

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
Framework/runtime: the assigned stack, unchanged, and how its existing capabilities support the direction.
Libraries: the assigned libraries, unchanged, with one clear aesthetic responsibility each.
CSS/asset system: existing layout, material, type, rendering, and fallback capabilities only.
Anti-generic constraints: two or three treatments the builder must avoid.
```

Choose one concept spine, one signature motif, and no more than two supporting motifs. Do not make every task dark, glassy, gradient-heavy, editorial, or cinematic. Website-fidelity tasks must preserve their reference identity; product tasks need a domain-appropriate direction.

### 4. Select technologies without making a census

Preserve a task's assigned framework, UI system, dependency set, and asset inventory exactly. Aesthetic weakness is not permission to replace React with Vue, Vue with Svelte, an Astro fidelity build with a client-heavy SPA, or one motion library with another.

Use the technology ladder in the Awwwards reference:

- prefer semantic HTML and CSS for layout, type, material, hover/focus, and simple transitions;
- use an already-assigned framework-native motion solution for component lifecycle or layout continuity;
- use already-assigned GSAP only for coordinated timelines, spatial sequences, SVG/canvas choreography, or bounded scroll narratives that CSS cannot express clearly;
- use already-assigned AutoAnimate only for straightforward list insertion, removal, and reorder continuity;
- use already-assigned Lottie or Rive for authored vector motion with the existing state role and fallback;
- use the already-assigned Canvas, PixiJS, Three.js, or other renderer only for the existing spatial, graphical, or game-like surface;
- describe workers, WASM, compressed geometry/textures, and HDR only when they already belong to the task's loading, failure, cleanup, and fallback system.

Use the technology ladder only to understand and better specify the capabilities already assigned to the task. Do not add or change a library in shape-lock mode. When explaining how an existing library should serve the aesthetic direction, inspect its installed version and use `ctx7` to fetch current official documentation as required by the repository instructions.

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

### 6. Prove existing criterion coverage

Do not edit criterion files. Build a mapping from every rewritten instruction bullet to at least one unchanged, existing criterion in the matching dimension. The rewritten bullet must stay inside that criterion's current semantic envelope; a criterion that would have passed before the rewrite must not fail solely because the rewrite introduced a new obligation.

If a proposed rewrite lacks existing rubric coverage, omit it and report it as shape-changing. Do not add, delete, renumber, reword, reweight, or repolarize criteria. Use the `rubrics` skill only to audit the mapping, never to mutate the rubric during this workflow.

### 7. Hand off a copy-ready upgrade

Return:

1. the aesthetic thesis and chosen visual dials;
2. the Awwwards evidence ledger, including adopted, adapted, and rejected signals;
3. the framework, library, CSS, asset, motion, and typography profile;
4. the concrete gaps found in the original brief;
5. replacement or additive text grouped by instruction tag;
6. the unchanged criterion mapping for every rewritten bullet;
7. the before/after task-shape audit;
8. un-applied ideas that would have changed shape;
9. anti-generic and scope guardrails;
10. validation commands and any oracle mismatch that must be handled separately.

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
- introduce new product behavior solely to create more surfaces to style;
- combine React, Vue, Nuxt, Next.js, GSAP, Three.js, WebGL, Lottie, and smooth scrolling as a technology checklist;
- cite an Awwwards frequency without identifying its evidence layer, product relevance, visible purpose, and fallback;
- require a library in a visual rubric or treat a framework replacement as an aesthetic improvement;
- use a display font, variable axis, motion plugin, shader, or advanced asset without a loading and fallback plan;
- change the number of bullets in an editable instruction section;
- alter a feature, flow, state, control, schema, artifact, dependency, WebMCP binding, criterion, or any non-instruction task file;
- apply an attractive idea that cannot be mapped to an unchanged existing criterion.

## Validate the shape lock

Run the bundled checker after every task edit:

```bash
python3 .claude/skills/aesthetic-instruction-upgrader/scripts/check_task_shape.py tasks/<slug> --base HEAD
```

The checker must report `TASK SHAPE CONSTANT`. It fails when non-aesthetic sections change, aesthetic bullet counts change, protected blocks change, feature headings change, or any task file other than `instruction.md` differs from the baseline. Also run the repository's normal instruction and corpus validators.
