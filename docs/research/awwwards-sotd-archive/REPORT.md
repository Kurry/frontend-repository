# Technology and interaction study of the Awwwards SOTD archive

## Outcome

This snapshot contains **6,197 unique Awwwards Sites of the Day** from
2009-06-01 through 2026-07-22. Of the
**6,197 sites fingerprinted**, **4,562** still
returned visitable HTML. Deep technology, interaction, and asset distributions
below use only that live subset; inaccessible records remain in the status table.

Awwwards displayed 6,410 SOTD items at collection time, while its actual
pagination ended after 6,197 unique cards. The study records the
213-item discrepancy instead of filling it with inferred rows.
The live subset yielded **681 distinct detected technologies** in
**79 categories** and **13,783 observed
technology pairs**; the CSV appendices retain the complete lists.
**595 live responses** ended on a different hostname than the
Awwwards card URL. Those rows stay visible as `redirect_host_changed`; the study does
not assume every cross-domain destination is the original award-winning experience.

## What the evidence says

The most common live-response fingerprints are HSTS (2,316; 50.8%), HTTP/3 (1,801; 39.5%), Cloudflare (1,571; 34.4%), jQuery (1,236; 27.1%), PHP (1,055; 23.1%).
These are delivery and implementation observations, not a prescribed stack. In
particular, infrastructure signals such as HSTS, HTTP/3, and Cloudflare should not
be confused with frontend frameworks.

Awwwards' own interaction taxonomy is led by
Animation (1,889; 41.4%), 3D (737; 16.2%), Responsive Design (692; 15.2%), Transitions (668; 14.6%), Scrolling (595; 13.0%). Independent HTML inspection
finds svg (3,060; 67.1%), video (1,721; 37.7%), css_animation (1,161; 25.4%), webgl (1,056; 23.1%), three_d (815; 17.9%). The disagreement between those
two layers is useful: editorial tags describe the awarded experience, while a
single bounded fetch can only observe what was delivered to that request.

## Evidence model and method

1. Enumerate listing pages newest-first until three consecutive exhausted pages.
2. Preserve Awwwards title, award date, studio, external URL, and editorial tags.
3. Visit each external URL with redirects enabled and a strict timeout; classify
   HTML, blocked, parked, missing, server, TLS/DNS, timeout, and non-HTML outcomes.
4. Detect technologies with `wappalyzergo` v0.2.90 from response headers, cookies,
   metadata, HTML, and script references. Keep Awwwards technology tags as a
   separate editorial evidence layer.
5. Mirror every direct-probe `live_html` candidate with HTTrack 3.49-2 at depth 1 while respecting robots,
   rate/size caps, and the requested media/font exclusions. Mirrors remain outside Git.
6. Count browser-native signals and referenced asset formats from live HTML.

The three evidence layers remain separate throughout the outputs:

- **Archive evidence**: Awwwards card fields and editorial tags for all records.
- **Live-response evidence**: status, headers, Wappalyzer matches, and HTML signals.
- **Mirror evidence**: HTTrack outcome and retained code/configuration assets after
  the explicit image, video, audio, and font exclusions.

## Visit status

| Item | Sites | Share of archive |
|---|---:|---:|
| live_html | 4,562 | 73.6% |
| dns_error | 613 | 9.9% |
| not_found | 229 | 3.7% |
| access_blocked | 213 | 3.4% |
| timeout | 213 | 3.4% |
| network_error | 113 | 1.8% |
| tls_error | 103 | 1.7% |
| server_error | 74 | 1.2% |
| parked | 44 | 0.7% |
| http_error | 22 | 0.4% |
| redirect_error | 9 | 0.1% |
| non_html | 2 | 0.0% |

## HTTrack status

| Item | Sites | Share of archive |
|---|---:|---:|
| mirrored | 4,434 | 71.6% |
| not_in_live_scope | 1,635 | 26.4% |
| no_html | 124 | 2.0% |
| timeout | 4 | 0.1% |

This table classifies the direct-probe live cohort and labels every other archive row
`not_in_live_scope`. The raw status evidence also retains
**35 exploratory pilot attempts** made before the
live-only scope was frozen; those pilots do not alter the table's cohort counts.

## Survivorship by award year

| Award year | Archive sites | Live HTML | Survival |
|---:|---:|---:|---:|
| 2026 | 202 | 195 | 96.5% |
| 2025 | 364 | 339 | 93.1% |
| 2024 | 366 | 338 | 92.3% |
| 2023 | 366 | 319 | 87.2% |
| 2022 | 365 | 304 | 83.3% |
| 2021 | 365 | 288 | 78.9% |
| 2020 | 364 | 288 | 79.1% |
| 2019 | 365 | 266 | 72.9% |
| 2018 | 365 | 255 | 69.9% |
| 2017 | 365 | 249 | 68.2% |
| 2016 | 364 | 240 | 65.9% |
| 2015 | 365 | 228 | 62.5% |
| 2014 | 364 | 216 | 59.3% |
| 2013 | 365 | 229 | 62.7% |
| 2012 | 365 | 223 | 61.1% |
| 2011 | 364 | 246 | 67.6% |
| 2010 | 363 | 224 | 61.7% |
| 2009 | 160 | 115 | 71.9% |

The newest partial-year cohort returned HTML for 96.5% of records;
the lowest-survival cohort, 2014, returned HTML for
59.3%. The date cohorts expose survivorship bias directly: older winners have had more time
to change domains, lose certificates, retire campaigns, or become parking pages. The
`technology-by-award-year.csv` table therefore uses each year's live subset as its own
denominator and should not be read as a longitudinal panel of unchanged sites.

## Detected technologies

| Item | Sites | Share of live sites |
|---|---:|---:|
| HSTS | 2,316 | 50.8% |
| HTTP/3 | 1,801 | 39.5% |
| Cloudflare | 1,571 | 34.4% |
| jQuery | 1,236 | 27.1% |
| PHP | 1,055 | 23.1% |
| Google Analytics | 983 | 21.5% |
| Google Tag Manager | 955 | 20.9% |
| WordPress | 783 | 17.2% |
| MySQL | 777 | 17.0% |
| Node.js | 751 | 16.5% |
| Cloudflare Browser Insights | 647 | 14.2% |
| Nginx | 642 | 14.1% |
| Apache HTTP Server | 617 | 13.5% |
| Vue.js | 511 | 11.2% |
| Vercel | 489 | 10.7% |
| Nuxt.js | 474 | 10.4% |
| Yoast SEO | 405 | 8.9% |
| React | 397 | 8.7% |
| jsDelivr | 369 | 8.1% |
| Amazon Web Services | 365 | 8.0% |
| Netlify | 359 | 7.9% |
| jQuery Migrate | 339 | 7.4% |
| cdnjs | 330 | 7.2% |
| Webpack | 265 | 5.8% |
| Amazon CloudFront | 262 | 5.7% |
| Google Hosted Libraries | 256 | 5.6% |
| Adobe Fonts | 238 | 5.2% |
| Typekit | 238 | 5.2% |
| Next.js | 232 | 5.1% |
| LiteSpeed | 217 | 4.8% |

## Technology categories

| Item | Sites | Share of live sites |
|---|---:|---:|
| Security | 2,530 | 55.5% |
| CDN | 2,473 | 54.2% |
| Miscellaneous | 2,048 | 44.9% |
| Web servers | 1,938 | 42.5% |
| Programming languages | 1,858 | 40.7% |
| Analytics | 1,585 | 34.7% |
| CMS | 1,514 | 33.2% |
| JavaScript libraries | 1,445 | 31.7% |
| PaaS | 1,392 | 30.5% |
| JavaScript frameworks | 1,235 | 27.1% |
| Tag managers | 974 | 21.4% |
| Web frameworks | 898 | 19.7% |
| Databases | 844 | 18.5% |
| Blogs | 806 | 17.7% |
| WordPress plugins | 698 | 15.3% |
| Reverse proxies | 663 | 14.5% |
| RUM | 659 | 14.4% |
| Static site generator | 555 | 12.2% |
| SEO | 487 | 10.7% |
| Caching | 398 | 8.7% |
| Font scripts | 370 | 8.1% |
| Page builders | 366 | 8.0% |
| Ecommerce | 326 | 7.1% |
| Cookie compliance | 293 | 6.4% |
| UI frameworks | 214 | 4.7% |

## Awwwards technology tags

| Item | Sites | Share of live sites |
|---|---:|---:|
| HTML5 | 1,006 | 22.1% |
| GSAP | 928 | 20.3% |
| CSS | 919 | 20.1% |
| WebGL | 743 | 16.3% |
| jQuery | 608 | 13.3% |
| Three.js | 422 | 9.3% |
| WordPress | 386 | 8.5% |
| PHP | 265 | 5.8% |
| SVG | 238 | 5.2% |
| React | 192 | 4.2% |
| Figma | 181 | 4.0% |
| Nginx | 176 | 3.9% |
| Vue.js | 173 | 3.8% |
| Modernizr | 163 | 3.6% |
| GLSL | 149 | 3.3% |
| Nuxt.js | 146 | 3.2% |
| Webpack | 139 | 3.0% |
| Webflow | 123 | 2.7% |
| PixiJS | 121 | 2.7% |
| Next.js | 106 | 2.3% |
| JavaScript | 95 | 2.1% |
| Shopify | 91 | 2.0% |
| BARBA.js | 81 | 1.8% |
| Contentful | 79 | 1.7% |
| Node.js | 74 | 1.6% |
| Google Font API | 70 | 1.5% |
| Hammer.JS | 66 | 1.4% |
| Cloudflare | 63 | 1.4% |
| Typekit | 58 | 1.3% |
| Craft CMS | 54 | 1.2% |

## Interaction patterns

| Item | Sites | Share of live sites |
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
| Video | 432 | 9.5% |
| Unusual Navigation | 419 | 9.2% |
| Single page | 311 | 6.8% |
| Infinite Scroll | 257 | 5.6% |
| Gestures / Interaction | 245 | 5.4% |
| Gallery | 242 | 5.3% |
| Filters and Effects | 236 | 5.2% |
| Navigation Menu | 228 | 5.0% |
| Sound-Audio | 187 | 4.1% |
| Responsive | 152 | 3.3% |
| About Page | 145 | 3.2% |
| Horizontal Layout | 137 | 3.0% |
| 404 pages | 132 | 2.9% |
| Footer Design | 109 | 2.4% |
| Project Page | 84 | 1.8% |
| Social Integration | 72 | 1.6% |
| Data Visualization | 69 | 1.5% |
| Header Design | 55 | 1.2% |
| 360 | 53 | 1.2% |
| App Style | 37 | 0.8% |

## Browser and asset signals

| Item | Sites | Share of live sites |
|---|---:|---:|
| svg | 3,060 | 67.1% |
| video | 1,721 | 37.7% |
| css_animation | 1,161 | 25.4% |
| webgl | 1,056 | 23.1% |
| three_d | 815 | 17.9% |
| smooth_scroll | 775 | 17.0% |
| canvas | 680 | 14.9% |
| audio | 477 | 10.5% |
| lottie | 420 | 9.2% |
| service_worker | 118 | 2.6% |
| model_3d_asset | 56 | 1.2% |
| rive | 44 | 1.0% |
| webassembly | 20 | 0.4% |

## Repeated feature bundles

| Item | Sites | Share of live sites |
|---|---:|---:|
| immersive_3d | 1,431 | 31.4% |
| animation_plus_transitions | 366 | 8.0% |
| canvas_plus_webgl | 310 | 6.8% |
| video_plus_audio | 205 | 4.5% |
| scroll_storytelling | 111 | 2.4% |
| microinteraction_system | 94 | 2.1% |

## Visual styles

| Item | Sites | Share of live sites |
|---|---:|---:|
| Black | 1,855 | 40.7% |
| White | 1,814 | 39.8% |
| Clean | 1,326 | 29.1% |
| Typography | 992 | 21.7% |
| Minimal | 732 | 16.0% |
| Colorful | 697 | 15.3% |
| Silver | 685 | 15.0% |
| Blue | 648 | 14.2% |
| Red | 530 | 11.6% |
| Yellow | 526 | 11.5% |
| Art & Illustration | 520 | 11.4% |
| Graphic design | 470 | 10.3% |
| Green | 466 | 10.2% |
| Big Background Images | 462 | 10.1% |
| UI design | 426 | 9.3% |
| Experimental | 380 | 8.3% |
| Photographic | 335 | 7.3% |
| Brown | 296 | 6.5% |
| Illustration | 278 | 6.1% |
| Orange | 266 | 5.8% |
| Pink | 240 | 5.3% |
| Flat Design | 211 | 4.6% |
| Photography | 187 | 4.1% |
| Flexible | 143 | 3.1% |
| Bright | 99 | 2.2% |

## How to use this study for frontend tasks

The archive supports feature combinations, not a mandate to put every detected
technology into one application. A defensible concept chooses one coherent spine
(for example, a Three.js product scene or a Webflow editorial site), adds the
interaction patterns that fit that spine, and expresses each promise as a visible
action and observable result. Runtime evidence should guide feasibility; editorial
tags should guide experience; neither should be converted into invisible rubric
requirements such as “uses framework X.”

The strongest recurring task ingredients are a purposeful transition system,
scroll-linked narrative progression, tactile microinteractions, responsive alternate
layouts, and a useful end state. Advanced assets such as GLB, KTX2, HDR, Rive, and
WASM are justified only when the experience exposes their value and still provides
loading, reduced-motion, keyboard, touch, and fallback paths.

## Failure patterns this avoids

- **Mega-stack synthesis:** technology frequencies are alternatives and
  co-occurrences, not permission to demand React, Vue, Nuxt, Next.js, Webflow, and
  WordPress in one build.
- **Screenshot-only imitation:** visual resemblance does not prove navigation,
  transitions, 3D controls, forms, persistence, export, or responsive behavior.
- **Dependency-name grading:** browser-observable outcomes are valid criteria;
  source-level implementation claims are not.
- **Survivorship laundering:** dead, blocked, parked, and TLS/DNS failures stay in
  `site-status.csv` and the denominator rather than disappearing from the study.
- **Tag/detection conflation:** `GSAP` on an Awwwards card is editorial evidence;
  a Wappalyzer match is live-response evidence. The CSVs never merge the two.
- **Asset dumping:** the mirror excludes heavy media and fonts, honors robots,
  and enforces per-file, per-site, rate, socket, retry, depth, and time ceilings.
- **Decorative complexity without an end state:** generated tasks should culminate
  in a saved configuration, shareable state, playable result, or downloadable
  artifact rather than ending at a passive landing page.

## Limitations

- Technology fingerprints are evidence-based but not source-code proof; bundled,
  renamed, proxied, or server-only systems can remain invisible.
- Awwwards tags are editorial metadata and are reported separately from live detection.
- Consent walls, bot defenses, regional gating, expired TLS, and client-only rendering
  reduce observability. They are status outcomes, not silently excluded failures.
- The mirror intentionally excludes images, video, audio, and fonts and caps depth,
  time, file size, total bytes, request rate, and sockets per site.
- Client-side routes and lazy-loaded dependencies that require a real browser gesture
  can be absent from the bounded mirror and initial HTML fingerprint.
- Counts describe awarded sites, not the web at large; Awwwards selection effects are
  part of the sample and should not be generalized away.
- The Landonorris asset inventory is a local reference taxonomy only. No proprietary
  asset bytes are included in Git.
