---
name: aesthetic-instruction-upgrader
description: Rewrite frontend Harbor task instructions so the resulting apps have distinctive, coherent, production-grade aesthetics instead of generic AI-generated styling. Use for tasks/frontend-*/instruction.md when visual design, motion, responsive composition, typography, content, state styling, or design fidelity needs to improve; especially when scores show strong feature compliance but weak motion, accessibility, innovation, or visual identity.
---

# Aesthetic Instruction Upgrader

Improve the aesthetic ceiling of a frontend task by turning vague taste words into a compact visual system that a builder can implement and a browser judge can observe. This skill changes the brief, not the product scope: preserve the task's domain, workflows, schemas, exports, protected blocks, and useful end state.

Read [references/cohort-examples.md](references/cohort-examples.md) when upgrading one of the lower-scoring productivity, workflow, game, data-tracking, creative-tools, or website-fidelity tasks discussed there. Read the existing `upgrade-frontend-production-design` skill for the broader production-design and rubric workflow when available.

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

### 2. Write the aesthetic brief

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
Anti-generic constraints: two or three treatments the builder must avoid.
```

Choose one concept spine, one signature motif, and no more than two supporting motifs. Do not make every task dark, glassy, gradient-heavy, editorial, or cinematic. Website-fidelity tasks must preserve their reference identity; product tasks need a domain-appropriate direction.

### 3. Upgrade the instruction by observable dimension

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

### 4. Convert the brief into criteria

If the task's dimension TOMLs are in scope, add or refine only browser-observable criteria in the matching dimensions. Never grade “uses a design system,” a named framework, a dependency, or an aesthetic adjective. Grade the visible hierarchy, role separation, state treatment, motion continuity, responsive transformation, contrast, or content quality produced by that choice.

Preserve existing criterion IDs and protected instruction blocks. Do not silently expand schemas, exports, persistence, or feature groups. Use the `task-authoring` and `rubrics` skills for repository-specific mutation and validation rules.

### 5. Hand off a copy-ready upgrade

Return:

1. the aesthetic thesis and chosen visual dials;
2. the concrete gaps found in the original brief;
3. replacement or additive text grouped by instruction tag;
4. proposed rubric coverage, grouped by dimension;
5. anti-generic and scope guardrails;
6. validation commands and any oracle mismatch that must be handled separately.

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
