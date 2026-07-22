---
name: design-from-awwwards-evidence
description: Design, redesign, or critique distinctive frontend experiences using measured patterns from a 6,197-site Awwwards SOTD archive study. Use for frontend concepts, landing pages, portfolios, product experiences, interactive tools, games, task specifications, visual-system decisions, motion plans, responsive behavior, or design-fidelity reviews where award-site inspiration must become a coherent, useful, accessible product rather than a decorative mega-stack.
---

# Design From Awwwards Evidence

Use evidence as a prior, not a prescription. Build one coherent experience around the product's job, then choose only the visual and interaction patterns that strengthen it.

Read [references/evidence.md](references/evidence.md) when choosing patterns, technologies, or assets, or when making a claim about the study.

## Start with an Experience Read

Inspect the brief, repository, current UI, available assets, and constraints before proposing a direction. If redesigning an existing product, preserve working behavior and identify what is actually weak before changing it.

Write one internal sentence before implementation:

> This is a [surface type] for [audience] whose job is [useful outcome], expressed through [concept spine] with [primary interaction system].

Classify the surface because award-site patterns do not transfer equally:

- **Marketing or storytelling:** narrative sequence, art direction, transitions, and a decisive conversion path may lead.
- **Product or tool:** information hierarchy, direct manipulation, state clarity, and artifact quality lead; spectacle supports comprehension.
- **Game or simulation:** rules, feedback, latency, replay, and input parity lead; motion communicates causality.
- **Editorial or portfolio:** sequencing, typography, media rhythm, filtering, and project depth lead.

If that sentence is vague, do not compensate with more effects.

## Set the Design Dials

State these three dials in a short design note. Treat them as deliberate constraints, not quality scores.

- **Visual variance — restrained / composed / expressive:** how far layout and art direction depart from familiar conventions.
- **Motion intensity — quiet / responsive / cinematic:** how much motion participates in navigation and feedback.
- **Information density — spacious / balanced / dense:** how much decision-relevant information appears at once.

Also name:

- one **concept spine**: the central visual metaphor or composition rule;
- one **primary interaction system**: direct manipulation, scroll narrative, spatial navigation, timeline, command surface, or another product-appropriate model;
- no more than two **supporting motifs**: type treatment, transition family, material effect, sound cue, illustration language, or microinteraction family.

Do not mix several unrelated award-site idioms to manufacture novelty.

## Separate the Evidence Layers

Use the archive correctly:

1. **Editorial evidence** describes how Awwwards classified the experience: animation, 3D, storytelling, typography, and similar tags.
2. **Live-response evidence** estimates what surviving sites currently deliver: detected libraries, frameworks, infrastructure, and browser signals.
3. **Asset evidence** describes referenced formats and runtime needs: SVG, video, canvas, WebGL, GLB, KTX2, HDR, Rive, WASM, and related assets.

Never turn a frequency into a stack mandate. React, Vue, Next.js, Nuxt, WordPress, GSAP, Three.js, and WebGL are alternatives or complements in specific architectures—not ingredients to combine by default. Preserve the repository's existing stack unless a new dependency has a visible product benefit that simpler code cannot provide.

When adding or changing a library, inspect the installed version and fetch its current official documentation before implementation.

## Build the Experience Contract

Define observable behavior before polishing the surface:

1. **Useful end state:** what the user finishes, saves, shares, plays, configures, or downloads.
2. **Canonical state:** one source of truth for UI actions, alternate input, persistence, automation, and exports.
3. **State cycle:** loading, ready, empty, invalid, interrupted, error, recovery, restored, and completed states that matter here.
4. **Input parity:** pointer, keyboard, and touch paths appropriate to the interaction; do not hide essential behavior behind hover.
5. **Responsive transformation:** specify how hierarchy and controls recompose, not merely how they shrink.
6. **Motion alternative:** reduced-motion behavior keeps orientation, causality, and completion evidence.
7. **Advanced-path fallback:** define timeouts and a semantic DOM or simpler-rendering path for 3D, canvas, video, audio, WASM, or GPU failure.
8. **Artifact contract:** if work can be exported, define version, shape, current-state parity, timestamps, validation, and import round-trip.

For task specifications and rubrics, express each promise as **user action → visible result**. Grade behavior in the browser, not dependency names or source-code structure.

## Compose a Distinctive System

### Layout and hierarchy

Make the first viewport communicate identity, purpose, and the next meaningful action. Use asymmetry, overlap, cropping, large type, fullscreen media, or unusual navigation only when the reading order remains clear. A conventional grid can still be distinctive through proportion, rhythm, and content.

Design narrow layouts as alternate compositions. Reorder, collapse, tab, step, or move controls into sheets when needed. Avoid preserving desktop density by scaling everything down.

### Typography and color

Choose type roles before individual sizes: display voice, reading voice, labels, data, and controls. Tune line length, hierarchy, and contrast in the rendered layout. The study contains both black- and white-led work, minimal and colorful work, and typography-heavy and photographic work; none is a universal default.

Use color to establish material, hierarchy, and state. Never make color the only carrier of status, selection, or strategy.

### Motion and interaction

Give motion a job:

- orient users across navigation or spatial changes;
- connect cause and effect;
- stage narrative information;
- acknowledge direct manipulation;
- reveal state without blocking the next action.

Use a small timing and easing vocabulary. Test interruption, rapid repeat input, back navigation, resize, and restored sessions. Scroll-linked effects must preserve native scrolling, keyboard access, and readable content when scripting is unavailable. Do not add smooth-scroll interception merely because it appears in the archive.

### Media and advanced rendering

SVG is common and often sufficient. Use video, canvas, WebGL, 3D, audio, Lottie, Rive, or WASM only when their visible value justifies loading, controls, fallbacks, and test cost.

For every advanced path, provide:

- staged or honest loading feedback;
- bounded failure and retry behavior;
- reduced-motion behavior;
- keyboard and touch access to the same outcome;
- a usable fallback rather than a blank rectangle;
- cleanup for workers, animation loops, audio, observers, and GPU resources.

## Avoid the Known Failure Modes

- **Mega-stack synthesis:** do not implement a technology census.
- **Screenshot-only imitation:** visual similarity cannot substitute for navigation, state transitions, validation, persistence, or output.
- **Decorative dead end:** the experience must converge on a useful outcome.
- **Concept collage:** do not combine every fashionable layout, shader, transition, and type treatment.
- **Framework replacement as design:** changing infrastructure is not an art direction.
- **Fake proof:** do not invent customers, metrics, generated artifacts, loading stages, or successful operations.
- **Happy-path theater:** test blocked, empty, invalid, interrupted, restored, and failed states.
- **Desktop miniaturization:** responsive work must preserve task priority and control reachability.
- **Inaccessible mechanics:** essential outcomes need semantic controls and alternate input.
- **Fallback as apology:** fallback paths should preserve the job, not merely explain why it cannot be done.

## Verify in the Browser

Use the real interaction path for anything whose timing, gesture, transition, or layout matters. Verify at representative desktop and compact viewports and with reduced motion enabled.

Before declaring the work complete, confirm:

- the Experience Read is visible in the result rather than only in prose;
- the useful end state can be completed from a fresh load;
- hierarchy and primary action survive narrow and wide layouts;
- keyboard, touch, focus, and hover-dependent behavior are coherent;
- loading, error, retry, empty, invalid, and restored states tell the truth;
- motion is causal, interruptible, and nonessential under reduced motion;
- advanced rendering has a tested, useful fallback;
- exports describe the current session and imports validate and reproduce it;
- no console errors, runaway animation loops, stale async results, or hidden overflow remain;
- every added dependency earns its payload and complexity through observable value.

Report the chosen dials, concept spine, primary interaction system, end state, and fallbacks when handing off the work.
