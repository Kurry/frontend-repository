---
name: upgrade-frontend-production-design
description: Upgrade frontend Harbor task instructions, visual and motion rubrics, reference direction, or solution-oracle briefs to demand production-grade art direction, layout, typography, color, imagery, interaction, motion, responsive composition, accessibility, content, and state design. Use when hardening tasks/frontend-* beyond generic AI-looking interfaces, improving visual_design, motion, responsiveness, design_fidelity, writing, innovation, or related criteria, reviewing why a task produces weak real-world frontends, or translating the repository's 6,197-site Awwwards study into coherent browser-observable production requirements.
---

# Upgrade Frontend Production Design

Raise the quality ceiling of the task without dictating a fashionable clone. Specify a coherent product experience whose craft can be observed in a browser and whose behavior still serves the task's useful end state.

Read these references as needed:

- [references/awwwards-pattern-language.md](references/awwwards-pattern-language.md) when choosing an evidence-backed visual or interaction direction.
- [references/production-craft.md](references/production-craft.md) when writing requirements for layout, typography, color, components, content, motion, media, or responsive behavior.
- [references/task-upgrade-patterns.md](references/task-upgrade-patterns.md) when converting a weak instruction or criterion into an observable production-grade one.
- [references/css-and-production-assets.md](references/css-and-production-assets.md) when specifying CSS craft, 3D/vector/runtime assets, loading pipelines, or asset-backed rubric evidence.

When working in this repository, also follow the project `AGENTS.md`. Use the `task-authoring` and `rubrics` skills for their full mutation, coverage, and validation protocols; this skill supplies the visual-production specialization.

## Establish the Production Thesis

Inspect the complete task before editing:

- `instruction.md`, including every protected block;
- all thirteen dimension TOMLs and `tests/reward.toml`;
- reference screenshots and existing verification media;
- the solution oracle when the requested scope includes it;
- the task genre, framework assignment, asset constraints, and useful end state.

Describe the current failure in concrete terms. Examples: undifferentiated card grid, weak hierarchy, placeholder content, arbitrary gradients, no visual relationship between input and output, motion that only fades everything upward, desktop layout merely squeezed onto mobile, or a polished happy path surrounded by raw browser states.

Then write an internal production thesis:

> For [audience and job], use [concept spine] to make [primary state or artifact] feel [three precise qualities]. The interface is organized by [composition rule], voiced through [type/color/material system], and animated by [causal motion principle].

Set three deliberate dials:

- visual variance: restrained, composed, or expressive;
- motion intensity: quiet, responsive, or cinematic;
- information density: spacious, balanced, or dense.

Choose one concept spine, one primary interaction system, and at most two supporting motifs. Do not solve weak direction by adding more techniques.

## Audit the Task Before Adding Requirements

Score the current specification against these questions:

1. **Identity:** Could the same visual description fit ten unrelated apps?
2. **Hierarchy:** Does each major viewport have a clear focal point, reading order, and primary action?
3. **Product truth:** Do realistic domain content, data density, errors, and completed artifacts shape the design?
4. **System:** Do typography, color, spacing, surfaces, icons, imagery, and controls form a reusable language?
5. **State:** Are loading, empty, invalid, active, success, interrupted, restored, and failure states intentionally designed?
6. **Motion:** Does animation explain causality, continuity, hierarchy, or direct manipulation?
7. **Responsiveness:** Does the interface recompose by priority instead of shrinking?
8. **Access:** Are focus, contrast, reduced motion, keyboard, touch, and non-color cues part of the same design?
9. **Performance:** Do advanced visuals have bounded loading, cleanup, and useful fallbacks?
10. **Outcome:** Does the visual journey converge on the task's real saved, playable, shareable, or downloadable result?

Record only gaps a violating build could visibly demonstrate. Do not add requirements for novelty alone.

Keep the upgrade inside its requested scope. Do not invent new product features, schemas, filters, confirmation flows, persistence, or export fields merely to create more design surfaces. If the audit uncovers a behavioral gap, report it separately for `task-authoring`; add it here only when the user also requested feature hardening. A production-design pass may clarify the presentation and states of existing behavior without expanding that behavior.

## Upgrade the Instruction by Dimension

Keep every promise in its proper tag and write it as action, condition, or viewport → visible evidence. Preserve the task's identity and behavior.

### Visual design

Specify a compositional system rather than adjectives:

- identify the dominant surface, focal object, or artifact and its relationship to secondary controls;
- define hierarchy through scale, contrast, placement, whitespace, cropping, depth, or density;
- assign typography roles for display, reading, labels, controls, and data;
- define color roles for field, surface, text, accent, status, selection, and visualization;
- describe material and edge language: flat, outlined, translucent, tactile, editorial, technical, cinematic, or another coherent treatment;
- require domain-specific content and believable populated states instead of lorem ipsum, repeated cards, and generic metrics;
- design empty, loading, error, validation, selection, drag, success, and completed-artifact states as part of the same system;
- state how imagery, illustration, 3D, diagrams, or data graphics earn space and communicate the product.

Use exact seeded copy, quantities, or visual relationships when they are important to fidelity. Avoid prescribing subjective pixel trivia that does not change the composition.

Do not impose an arbitrary spacing base, control height, breakpoint, type scale, palette value, or animation duration. Reuse values already established by the task or reference; introduce exact values only when they define observable fidelity, input safety, readability, or timing behavior that the judge can reliably measure.

### Motion and animation

Build a motion grammar with distinct jobs:

- **entrance:** establish hierarchy without delaying first action;
- **navigation:** preserve continuity across views, tabs, panels, or scenes;
- **manipulation:** make drag, resize, reorder, draw, play, scrub, or edit actions feel attached to input;
- **state change:** connect the initiating control to the changed result, count, chart, artifact, or status;
- **feedback:** acknowledge hover, focus, press, validation, success, and failure without visual noise;
- **ambient:** use only when it reinforces atmosphere and does not compete with work.

Specify trigger, affected elements, ordering, interruption behavior, and settled state. Require the real UI path for animation criteria. WebMCP state shortcuts may prepare data but must not replace the gesture being graded.

Define reduced-motion behavior as an alternate choreography: remove parallax, long travel, loops, and camera motion while retaining state evidence, focus movement, and orientation. Do not simply say "respect prefers-reduced-motion."

### Typography, color, and content

Make type and color carry product meaning:

- require visibly distinct type roles with controlled measure, line-height, wrapping, and numeric alignment where relevant;
- allow expressive display typography while preserving readable body and control text;
- require contrast across normal, muted, disabled, selected, focus, warning, and destructive states;
- pair every semantic color with text, iconography, shape, pattern, or position;
- provide realistic names, labels, values, histories, descriptions, and artifact contents that exercise the layout;
- ban fabricated social proof, customer claims, successful operations, and unexplained metrics.

Do not universalize dark mode, pure black, gradients, rounded cards, uppercase labels, or any particular aesthetic. The concept determines the treatment.

### Responsive, accessible, and performant composition

Describe what moves, collapses, becomes a sheet or tab, changes order, changes input mode, or remains fixed at compact and wide viewports. Keep the primary artifact and next action visible. Require touch-safe direct manipulation and a non-drag alternative where the task depends on dragging.

Treat focus indication as art direction, not a browser-default afterthought. Require semantic controls, logical focus order, visible keyboard state, understandable labels, and equivalent outcomes across input modes.

For video, canvas, WebGL, 3D, audio, Rive, Lottie, or WASM, require honest staged loading, timeout and retry, cleanup, reduced-motion handling, and a semantic or lightweight fallback that preserves the task's job.

Specify advanced assets as a production system. Name the visible role of geometry, textures, environment lighting, vector state machines, shaders, workers, or WASM decoders; require evidence that the loaded asset changes the real experience. Do not add a GLB, Rive file, shader, or compressed texture merely to satisfy a format checklist.

## Translate Requirements into Rubrics

Honor the repository's criterion provenance rules:

- never delete, renumber, or rewrite an existing authored criterion merely to make room;
- add criteria using the next valid IDs when new production promises lack coverage;
- keep criteria in their tag-aligned dimensions;
- describe browser-observable evidence only, never source code or dependency names;
- keep at least one positive criterion per dimension;
- set `negate = true` only when the description states a defect as present;
- require fresh load for intro or scroll-reveal observations;
- require actual hover, focus, gesture, drag, or transition mechanics when those are graded;
- make visual failures concrete enough that two judges can inspect the same evidence.

Cover systems, not only isolated details. A strong visual criterion can verify a hierarchy relationship across header, work surface, and output. A strong motion criterion names the initiating action, causal sequence, and final state. A strong responsive criterion states the alternate composition and preserved priority.

Do not reward "uses Three.js," "uses GSAP," or "has good typography." Reward the visible spatial interaction, transition continuity, readable hierarchy, or typographic role separation those choices produce.

## Preserve Production Coherence

Reject these common upgrades:

- adding 3D, smooth scrolling, video, sound, and shaders to the same task because each appeared in the archive;
- describing every interface as premium, modern, clean, glassy, or cinematic without visible evidence;
- demanding a centered hero, three feature cards, gradient blobs, pill labels, and a generic dashboard shell;
- over-specifying a reference screenshot while leaving interaction and state design ungraded;
- grading animation presence while ignoring interruption, rapid input, settled state, and reduced motion;
- treating mobile as a narrow screenshot rather than an alternate interaction composition;
- making a beautiful landing state while exported artifacts, dialogs, errors, and populated work surfaces remain generic;
- replacing the assigned framework or adding libraries as a substitute for design reasoning.

## Validate and Hand Off

Run the full validators required by the `task-authoring` and `rubrics` skills for every task changed. At minimum, validate dimensions, rubric structure, corpus consistency for the slug, and canonical drift when shared sources changed.

Inspect the finished instruction-to-rubric mapping and report:

- the original production-quality failures;
- the production thesis and three dials;
- the chosen visual, type, color, and motion systems;
- the responsive and reduced-motion transformations;
- every added criterion grouped by dimension;
- any oracle mismatch intentionally deferred to the oracle phase;
- commands run and observable results.

The upgrade is complete only when a capable builder can make clear design decisions from the brief and a browser judge can distinguish a coherent real-world production from a decorated prototype.
