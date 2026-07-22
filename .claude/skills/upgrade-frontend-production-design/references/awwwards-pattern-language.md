# Awwwards production pattern language

Use the measured archive as design evidence, not as a checklist.

## Evidence snapshot

The repository study enumerated 6,197 unique Awwwards SOTD cards from 2009-06-01 through 2026-07-22. Of these, 4,562 still returned visitable HTML. Editorial and browser-observed signals were recorded separately.

| Signal | Live share |
|---|---:|
| Animation editorial tag | 41.4% |
| 3D editorial tag | 16.2% |
| Responsive Design editorial tag | 15.2% |
| Transitions editorial tag | 14.6% |
| Scrolling editorial tag | 13.0% |
| Storytelling editorial tag | 9.8% |
| Microinteractions editorial tag | 9.7% |
| SVG observed in HTML | 67.1% |
| Video observed in HTML | 37.7% |
| CSS animation observed in HTML | 25.4% |
| WebGL observed in HTML | 23.1% |
| Canvas observed in HTML | 14.9% |
| Audio observed in HTML | 10.5% |
| Lottie observed in HTML | 9.2% |

The leading style tags include Black (40.7%), White (39.8%), Clean (29.1%), Typography (21.7%), Minimal (16.0%), Colorful (15.3%), Art & Illustration (11.4%), and Graphic Design (10.3%). Opposing styles coexist; there is no archive-approved default palette.

Read `docs/research/awwwards-sotd-archive/REPORT.md` for complete methodology, counts, and limitations.

## Coherent pattern bundles

Choose a bundle only when it fits the product job.

### Editorial narrative

- strong typographic hierarchy and controlled reading measure;
- image or illustration rhythm that changes with narrative emphasis;
- restrained scroll-linked reveals or chapter transitions;
- progress and navigation that preserve orientation;
- a final action or artifact rather than an endless showcase.

Best for portfolios, reports, campaigns, explainers, and chronology-led products.

### Direct-manipulation studio

- one dominant work surface;
- tools grouped by task phase and proximity to their effect;
- immediate before/after evidence;
- tactile press, drag, scrub, resize, or reorder feedback;
- an output preview and production-grade export state.

Best for editors, configurators, design tools, data transformation, and builders.

### Immersive spatial experience

- a 3D or canvas scene that is itself the product interaction;
- constrained camera and clear scene orientation;
- staged loading and meaningful progress;
- DOM-equivalent controls and useful fallback;
- camera transitions tied to state changes, not decorative orbiting.

Best for product exploration, simulation, games, maps, and spatial storytelling.

### Dense operational product

- hierarchy through alignment, density, contrast, and typography rather than oversized decoration;
- linked tables, charts, timelines, filters, and detail panels;
- motion focused on continuity, deltas, reordering, and status;
- compact responsive modes that use tabs, sheets, or staged detail;
- realistic failure, empty, stale, and recovery states.

Best for analytics, workflows, planning, monitoring, and research tools.

### Playful game or learning loop

- visual rules and state legible before ornament;
- immediate input feedback and causal result motion;
- paced celebration, failure, reset, replay, and review states;
- touch, keyboard, and pointer parity;
- sound and particles optional, bounded, and never the only feedback.

Best for games, drills, simulations, and interactive education.

## Selection rule

Apply this chain:

`user job → concept spine → one bundle → product-specific motifs → accessible fallback → browser evidence`

Never reverse it into `popular effect → invented requirement`.
