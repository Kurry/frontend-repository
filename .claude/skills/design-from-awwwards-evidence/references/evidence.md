# Awwwards SOTD evidence snapshot

Use this reference to calibrate design choices. It is not a recipe or a ranking of technologies.

## Provenance

The repository study enumerated 6,197 unique Awwwards Sites of the Day dated 2009-06-01 through 2026-07-22. Of those, 4,562 still returned visitable HTML. The live cohort produced 681 detected technologies across 79 categories and 13,783 observed technology pairs.

Primary repository sources:

- `docs/research/awwwards-sotd-archive/REPORT.md` — method, interpretation, aggregate tables, and limitations
- `docs/research/awwwards-sotd-archive/TASK-SYNTHESIS.md` — examples of converting evidence into coherent product tasks
- `docs/research/awwwards-sotd-archive/derived/` — complete generated CSV appendices
- `docs/research/awwwards-sotd-archive/technology-study/` — reproducible study implementation and tests
- `docs/research/awwwards-sotd-archive/FRONTEND-DEPTH.md` — actual CSS feature and production-asset-system analysis

The study keeps Awwwards editorial metadata, bounded live-response detection, and HTTrack mirror evidence separate. Keep those layers separate in downstream claims too.

## Experience signals

Top Awwwards interaction tags among the live cohort:

| Pattern | Sites | Live share |
|---|---:|---:|
| Animation | 1,889 | 41.4% |
| 3D | 737 | 16.2% |
| Responsive Design | 692 | 15.2% |
| Transitions | 668 | 14.6% |
| Scrolling | 595 | 13.0% |
| Interaction Design | 503 | 11.0% |
| Parallax | 489 | 10.7% |
| Fullscreen | 457 | 10.0% |
| Storytelling | 445 | 9.8% |
| Microinteractions | 441 | 9.7% |

Top browser-observable signals found independently in live HTML:

| Signal | Sites | Live share |
|---|---:|---:|
| SVG | 3,060 | 67.1% |
| Video | 1,721 | 37.7% |
| CSS animation | 1,161 | 25.4% |
| WebGL | 1,056 | 23.1% |
| 3D | 815 | 17.9% |
| Smooth scroll | 775 | 17.0% |
| Canvas | 680 | 14.9% |
| Audio | 477 | 10.5% |
| Lottie | 420 | 9.2% |
| Service worker | 118 | 2.6% |
| Referenced 3D model | 56 | 1.2% |
| Rive | 44 | 1.0% |
| WebAssembly | 20 | 0.4% |

Repeated bundles detected by the study:

| Bundle | Sites | Live share |
|---|---:|---:|
| Immersive 3D | 1,431 | 31.4% |
| Animation plus transitions | 366 | 8.0% |
| Canvas plus WebGL | 310 | 6.8% |
| Video plus audio | 205 | 4.5% |
| Scroll storytelling | 111 | 2.4% |
| Microinteraction system | 94 | 2.1% |

These numbers show available design vocabularies, not minimum feature counts. A rare technique can be right for a product, and a common technique can still be wrong.

## Visual signals

The largest editorial style tags were Black (40.7%), White (39.8%), Clean (29.1%), Typography (21.7%), Minimal (16.0%), Colorful (15.3%), Silver (15.0%), Blue (14.2%), Red (11.6%), Yellow (11.5%), and Art & Illustration (11.4%). The coexistence of opposing tags is evidence against universal palette or density rules.

Use style evidence to ask better questions:

- Is typography the concept spine or merely oversized?
- Does a dark or light field support the content and media?
- Is minimalism clarifying the job or removing needed state?
- Does color encode material and hierarchy as well as personality?
- Does unusual navigation improve the narrative or only hide destinations?

## Technology signals

Common live-response fingerprints included HSTS (50.8%), HTTP/3 (39.5%), Cloudflare (34.4%), jQuery (27.1%), PHP (23.1%), WordPress (17.2%), Node.js (16.5%), Vue.js (11.2%), Nuxt.js (10.4%), React (8.7%), and Next.js (5.1%). Many are infrastructure or mutually exclusive implementation choices.

Awwwards editorial technology tags were led by HTML5 (22.1%), GSAP (20.3%), CSS (20.1%), WebGL (16.3%), jQuery (13.3%), Three.js (9.3%), WordPress (8.5%), SVG (5.2%), React (4.2%), and Vue.js (3.8%). An editorial tag is not equivalent to a live detector match.

Choose technology from the product contract and existing repository, not from frequency. If motion needs only opacity and transforms, CSS may be enough. If the job needs direct spatial manipulation, Three.js or another rendering layer may be justified. The visible outcome and fallback matter more than the dependency name.

## CSS and production assets

The retained-mirror pass found 66 CSS feature families across 2,210 sites with CSS. Common craft primitives include transforms (90.8%), transitions (89.0%), flexbox (88.9%), custom properties (69.5%), grid (62.4%), clipping (39.9%), dynamic viewport units (35.4%), backdrop filters (31.4%), masks (27.5%), `:has()` (21.7%), and reduced-motion queries (16.2%). Use `FRONTEND-DEPTH.md` and the complete CSS CSVs when a task needs evidence beyond broad animation/style tags.

Advanced assets appear as systems: 275 sites referenced at least one advanced format, including GLB, WASM, KTX2, shader files, Rive, HDR, and Spline scenes. Pair asset asks with their production obligations—loaders/decoders, staged loading, material or interaction role, cleanup, reduced motion, alternate input, and a useful fallback. Never require an extension by itself.

## Interpretation limits

- The archive describes selected award winners, not the web at large.
- Only 73.6% of archived destinations still returned HTML; survivorship varies strongly by award year.
- Redirects, bot defenses, consent gates, client rendering, and bounded fetches reduce observability.
- Fingerprints are evidence, not source-code proof.
- HTTrack intentionally excluded images, video, audio, and fonts and used strict depth, rate, size, and time caps.
- The Landonorris inventory records a local asset taxonomy—GLB, KTX2, HDR, Rive, WASM, and fonts—not reusable proprietary content.

## Evidence-to-design rule

Convert evidence through this chain:

`product job → experience spine → observable interaction → appropriate technology → fallback → browser verification`

Do not reverse it into `popular technology → invented feature`.
