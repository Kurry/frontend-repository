<summary>
Build the Northstar Collective corporate marketing homepage using Astro with React islands, Tailwind CSS 4.3.2, Radix UI, and GSAP.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They define composition, density,
crop, proportions, and motion; this text wins on identity and content. Create
all Northstar identity, media, and marks locally from scratch. Do not copy,
trace, recolor, rename, crop, decode, transcode, or otherwise derive any
screenshot or source-site asset, and do not ship the screenshots in /app.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished homepage must exhibit):
- The deliverable is a single scrolling homepage at the root path only: a global sticky header, a full-bleed video hero, marketing sections in order, and a global footer; it is a corporate marketing site, not a storefront, and no in-page control triggers a full-page navigation away from this homepage
- The header shows a primary navigation with the exact labels About, Brands, Careers, Investors (marked with an external-link icon), and Responsibility rendered as a dropdown toggler; a newly authored Northstar logo mark and logotype of the same size and placement as the reference sit at the header start
- Hovering or activating the Responsibility toggler opens a dropdown panel exposing the three pillars Purpose, Planet, and Product; the toggler carries aria-expanded that flips to true while the panel is open, and the panel is hidden again when dismissed or on Escape
- Below 1000px the desktop nav is replaced by a Menu toggle button; activating it opens a full-screen menu overlay whose menu items reveal in a staggered sequence, and a Close control plus Escape dismiss the overlay
- The hero fills the viewport with a muted, playsinline newly authored VP9 WebM brand-portfolio montage, backed by a matching local freeze-frame still fallback, and the headline reads exactly Make. Every Day. Better. split across three lines; a hero card links to the local 2025 Annual Report PDF
- A brand-portfolio section headed exactly A portfolio built for every step. presents a particle/galaxy composition of newly authored brand and product imagery with a supporting call-to-action button
- The portfolio spans eleven fictional brands — Trailmark, Cadence, Forgeworks, Alder & Ash, Ironcat, Solstice, Hearthstep, First Mile, Highline, Wildhorse, and Foundry — and all eleven are enumerated as inert or fictional-destination text links in the footer brand grid; each brand has its own newly authored visual mark
- An annual-report block headed exactly 2025 Annual Report (lede copy Our 2025 Annual Report) offers a PDF download affordance
- A culture statement renders the exact heading Many brands, one shared culture, limitless innovation. alongside supporting body copy about curiosity, creativity, and collaboration
- A Market Snapshot section shows the exact heading Market Snapshot, the security name Northstar Collective, Inc. (NST), the label Common Stock, a primary quote value 18.16 USD, and a stat list with DAY'S HIGH $18.60, DAY'S LOW $18.16, DAY'S VOLUME 38,982.00, and LAST UPDATED 2hours ago
- A Latest News section headed exactly Latest News presents a horizontal card carousel with a View All affordance and Prev./Next controls; activating Next advances the track to later cards without leaving the homepage
- The news carousel carries these fictional card stories: Northstar Earns People-First Workplace Certification; Trailmark Celebrates 45 Years Outside; Cadence Velocity Pro Wins Best Racing Shoe; Northstar Studio Receives Four Creative Honors; Cadence Brings the Daily Runner Back; Trailmark Launches a Flow-Focused Trail Shoe; Forgeworks Steps Onto the Small Screen; and Northstar Named Company of the Year. Pair the first story with the employee-culture statistics 96% welcomed, 95% care about colleagues, and 94% proud to share where they work; every card uses distinct newly authored imagery.
- A careers call-to-action section shows the exact heading Creating Your Future With Us with supporting copy No matter the role, the door is open to you at Northstar Collective to create positive change and leave a lasting impact. and an outbound Careers CTA button to the external careers subdomain
- The footer shows About Us, Brands, Careers, Responsibility, Investors, and Contact, plus a social group (Photos, People stories, and Professional network), the eleven-brand link grid, a legal group (Privacy Policy, Terms & Conditions, Patents, Supply Chain Transparency, Customer Returns, Retail Partners), and the copyright line © 2026 Northstar Collective, Inc.
- A cookie-consent banner appears on load with the heading We use cookies and the actions Accept all, Reject all, and Manage preferences; Manage preferences opens a preferences modal presenting per-category consent controls and a save affordance
- Homepage-only scope: header, footer, and in-page chrome links are in-page, inert, or fictional-destination stubs and must not resolve to additional built pages or any source-company, source-brand, investor, careers, or social destination
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Cookie-consent flow: on a fresh load the banner is visible over the page; activating Manage preferences opens the preferences modal with per-category consent controls whose toggle states update as they are switched; saving the preferences closes the modal and dismisses the banner in the same pass, and the banner stays dismissed while scrolling and interacting anywhere on the page; because consent state is in-memory only, a page reload shows the banner again in its initial state
- Consent shortcut flow: activating Accept all or Reject all on the banner dismisses the banner without opening the modal, and no consent surface reappears during the session; after either choice the page content behind remains fully scrollable and interactive
- Responsibility dropdown flow: hovering or activating the Responsibility toggler flips its aria-expanded to true and reveals the panel with Purpose, Planet, and Product; activating a pillar link or pressing Escape hides the panel, returns aria-expanded to false, and leaves the rest of the header unchanged
- Mobile menu flow: below 1000px, activating the Menu toggle opens the full-screen overlay with its items revealed in a staggered sequence, keyboard focus is contained inside the open overlay, and the page behind does not scroll; activating Close or pressing Escape dismisses the overlay, restores scrolling, and returns focus to the Menu toggle with the page's scroll position unchanged
- News carousel flow: activating Next advances the track so later cards become visible and the track's position visibly moves; activating Prev. returns toward earlier cards; dragging the track with the pointer also moves it; the carousel's position is client state that holds while scrolling elsewhere on the page and never leaves the homepage
- Reload baseline flow: after any sequence of interactions, a page reload returns the homepage to its seeded state — scrolled to top, hero intro replaying, cookie banner visible, carousel back at its first card
</user_flows>

<edge_cases>
- If the hero background video cannot play, the freeze-frame still fallback renders in its place at the same size and the headline remains fully legible over it
- Pressing Escape with no menu, dropdown, or modal open changes nothing visible on the page
- At the final news card, activating Next produces no broken state: the track never scrolls past its last card into blank space and the page never gains a horizontal scrollbar
- Rapidly toggling the mobile menu open and closed never stacks overlays or leaves the page scroll-locked after the overlay is closed
- Opening the preferences modal and dismissing it without saving leaves the banner visible with its actions still operable
- The dropdown, mobile menu, and preferences modal are never open simultaneously; opening one dismisses or blocks the others
</edge_cases>

<visual_design>
- Complete debranding is mandatory: Northstar Collective and its eleven fictional labels are the only visible corporate/portfolio identity. No source-company or source-brand name, ticker, domain, logo silhouette, recognizable photograph or video frame, distinctive press copy, social-platform logo, metadata, filename, or outbound destination appears anywhere in the app.
- Required scratch-authored asset inventory: one Northstar symbol and logotype; eleven distinct fictional portfolio marks (ten vector and one raster); one VP9 WebM hero montage and matching still; the complete multi-image portfolio particle/galaxy field; one annual-report cover and a valid local PDF; distinct imagery for all eight news cards; careers-panel imagery; a local 1200x627 social-share image; and one complete SVG icon sprite for every header, modal, carousel, footer, and utility glyph. Every item must be visibly used at the reference role, crop, density, and layer count—no omitted surface, empty card, repeated generic image, or unused dummy file satisfies the inventory.
- Color scarcity: a monochrome editorial system with three primary surface/ink tokens — body background rgb(255,255,255) (--color-white #fff), body text rgb(1,1,1) (--color-black #010101), and a single neutral --color-gray-200 #ccc — plus translucent button wash #0000001a; no saturated accent color appears on chrome; the footer surface is rgb(1,1,1) with rgb(255,255,255) text, and the hero renders white type over full-bleed imagery
- Three-tier CSS tokens: color tokens (--color-black, --color-white, --color-gray-200), fluid type tokens (--text-display-xl and siblings), and spacing/radius/unit tokens (--spacing-fluid-*, --unit-*, --radius-*) are declared as theme variables and drive computed styles across the page
- Typography is a self-hosted open-license grotesque family of similar width and weight character to the reference (medium and bold weights, plus an open-license mono companion for meta and counters) resolving through a --font-sans token; the type scale is fluid via clamp() (for example --text-display-xl is clamp(6.25rem, 4.7717rem + 7.3913vw, 10.5rem)). At the 1440px reference width the tiers render, in the bundled sans: the hero display Make. Every Day. Better. at 168px / weight 700 / line-height 132.72px / letter-spacing -8.4px / color rgb(255,255,255); the portfolio heading A portfolio built for every step. and the careers push heading Creating Your Future With Us at 128px / weight 700 / line-height 101.12px; the Market Snapshot value 18.16 at 128px / weight 700; the section headings Market Snapshot and Many brands, one shared culture, limitless innovation. at 33px / weight 700 / line-height 33px; header nav links at 15px / weight 400 / letter-spacing -0.3px; news card titles at 19px / weight 400 / line-height 22.8px; and market-snapshot meta labels (DAY'S HIGH, DAY'S VOLUME) in the bundled mono at 11px / weight 400 / uppercase
- Classical proportions on a 12-column grid with baseline spacing units --unit-sm 12px, --unit-md 20px, --unit-lg 48px, fluid spacing tokens (for example --spacing-fluid-lg clamp(2rem, 1.8261rem + 0.8696vw, 2.5rem)), and radius tokens (for example --radius-lg 12px); do not replace the fluid clamp() scales with fixed px scales
- Asymmetric hero composition: the display headline sits as the dominant left-weighted type block while the 2025 Annual Report card anchors the lower corner over the full-bleed media; the layout is not an equal two-column split
- Broken-grid portfolio title: A portfolio built for every step. splits across three line spans with progressive horizontal offsets (about 0 / 2.5em / 3.75em at desktop) so the lines step inward rather than stacking flush-left in equal columns, while remaining fully legible
- Z-index layering places the header above page content and modals/overlays above the header, with the cookie layer highest; the header measures roughly 82px tall at 1440px, the logo icon is 24px wide (--icon-width-logo) and the dropdown chevron 8px (--icon-width-chevron)
- UI glyphs come from a single bundled newly authored SVG icon sprite (ids include logo, logotype, logotype-only, chevron-down, close, cross, external, photos, network, arrow-up, expand, plus, minus, sort); the eleven fictional brand marks ship as one newly authored file per brand — ten vector marks and one raster mark
- The composition is image-forward and full-bleed: video hero, a particle/galaxy image field for the portfolio teaser, dense news cards, a market-snapshot stat list, and a dark careers push panel; the footer is a dark rounded-top slab
- The cookie banner renders over a dark overlay computing rgba(0,0,0,0.65), with the modal styled through the same token system as the rest of the page
</visual_design>

<motion>
- Signature interaction: scrolling the brand-portfolio region drives a continuous particle/galaxy parallax field while the split portfolio heading reveals — this scroll-tied particle storytelling is the page's memorable motion idea, not a one-off fade
- Scroll storytelling: fade, rise, rise-and-scale, and split-text elements reveal from their hidden state to settled as they enter the viewport under native document scrolling; scroll-triggered timelines stay synced to scroll position (pinning and sticky header behavior remain intact); staggered groups offset each child by 0.1s times its index; durations are typically 0.6s and 0.8s
- Inertial easing: hero, scroll reveals, header morph, and menu staggers use non-linear inertial curves (cubic-bezier(0.19, 1, 0.22, 1) expo-out, cubic-bezier(0.215, 0.61, 0.355, 1) power2-out, or sine-out equivalents) — motion settles with momentum rather than starting and stopping at constant linear speed
- Hero intro timeline: on first load the hero runs a scripted orchestrated timeline with expo-out easing and base duration 1s: the hero video scales from a slightly enlarged state (about 1.08) down to 1 while the title lines rise and fade from opacity 0, yPercent 40 to settled with stagger about 0.1, and the hero card eases from opacity 0, scale 0.9, yPercent 10 to final just after the titles; the hero animates in rather than appearing pre-settled, while the full-bleed background image itself holds in place as the video and type settle
- Particles: a field of image particles driven by a requestAnimationFrame loop that lerps against scroll position (config speed 0.15, ease 0.1, scaleEase 0.25, scrollMultiplier 0.05, scaleMin 0.5, scaleMax ~1.2), applying translate3d plus scale with an overlay opacity inverse to particle opacity; particle x/y positions are randomized per load, so match the animation config and overall composition rather than pixel placement, and the particles must be in continuous parallax motion rather than static
- Standout image galaxy: each item reveals with a per-item delay of its index times 0.1s and its own vertical offset, and the portfolio heading A portfolio built for every step. splits into three line spans that reveal as the section enters view, easing over the slow/slowest duration tokens with sine-out/expo-out easing
- News carousel: a horizontal track with Prev./Next controls and pointer drag (a visible dragging state during drag), smooth or instant scrolling to position, and snap math; advancing must move the real track
- Header scroll morph: once the page has scrolled past its top the header morphs — the dropdown height contracts from 300px to 200px, the large wordmark/logotype fades out (opacity 1 to 0, visibility hidden) leaving the compact logo mark, and a dark header background fades in from opacity 0 to opacity 1 over a dark rgba(0,0,0,0.8) bar; the inner transition is 0.4s with ease cubic-bezier(0.215, 0.61, 0.355, 1) and the morph reverses when scrolled back to top
- Mobile menu: opening reveals the overlay and its items in an index-staggered clip-path/translate sequence (each item transitions over 0.6s with a per-item transition-delay of its index times ~0.06s, so measured delays step 0s, 0.06s, 0.12s, 0.18s, 0.24s), ease cubic-bezier(0.19, 1, 0.22, 1); closing reverses it
- Cookie-consent modal transitions in and out over 0.25s
- Inline video plays on view (muted, playsinline); lazy images start visually suppressed and settle to opacity 1, scale 1 as they load and enter view
- Hover and focus microinteractions are required: buttons take a hover/focus background of --color-gray-200 with an icon shift of about 25px, header nav links animate an underline (opacity 0 to 1) on hover or when their dropdown is expanded, and cards show a focus-visible title underline and image outline; omitting hover feedback is a failure
- Reduced motion: under prefers-reduced-motion reduce, tokenized transition durations collapse to 0s and scripted timelines short-circuit to their final state (no transform-in animations, no stagger, no particle parallax); the app detects this via matchMedia
</motion>

<responsiveness>
- Responsive breakpoints step from 340px up to 2400px; the load-bearing thresholds are 700px (grid switches), 1000px (mobile menu below, desktop nav at and above, with header logo variants swapping), and 1400px (scrolled header dropdown height and tile type adjustments)
- At and above 1000px the header shows the full primary navigation with the Responsibility dropdown; below 1000px it shows the Menu toggle and the full-screen overlay menu instead
- No content clips or overflows the viewport and no horizontal scrollbar appears at 375, 768, or 1440 widths; the hero video, portfolio imagery, and news cards keep their aspect ratios at every width
- The fluid clamp() type and spacing scales resize typography and gaps smoothly and continuously between widths, with no abrupt size jumps between breakpoints
</responsiveness>

<accessibility>
- Every interactive control (nav links, the Responsibility toggler, the Menu toggle, carousel controls, cookie banner actions, footer links) is reachable and operable with the keyboard alone, with a visible focus indicator
- The Responsibility toggler exposes aria-expanded reflecting the dropdown's open state, and Escape closes the open dropdown
- While the mobile menu overlay or the cookie preferences modal is open, keyboard focus is contained inside it; closing it returns focus to the control that opened it
- The Investors link is marked as external both visually (external-link icon) and accessibly
- Split hero and section headlines keep the original phrase accessible on the heading container while per-line or per-character spans are hidden from the accessibility tree
- The hero video is muted with playsinline and carries an accessible label; all imagery and fictional brand marks carry descriptive alt text or accessible labels
- Text over imagery and all control labels meet WCAG AA contrast, including white hero type over the video and footer text on the dark slab
</accessibility>

<performance>
- The page is interactive within 2 seconds of a local cold load; navigation and copy respond while the hero video is still loading, and the video region holds its space without shifting the layout
- No console errors, warnings, or hydration errors appear on load or during a full scroll-through, menu, dropdown, carousel, and cookie-consent exercise
- Loading the homepage directly at its root URL renders the complete single-page homepage with no flash of unstyled or unhydrated content
- No visible layout shift occurs as fonts, images, or the hero video finish loading; media regions reserve their space from first paint
- Continuous scrolling from top to bottom holds a smooth frame rate through the header morph, scroll reveals, and the continuous particle parallax
</performance>

<writing>
- All mandated copy strings — the nav labels, section headings, hero headline, market-snapshot values, press copy, statistics, awards line, careers copy, legal links, and copyright line — render exactly as specified and free of typos; no lorem ipsum, TODO, or template placeholder text appears anywhere on the page
- The Northstar logo marks and wordmark read as one coherent invented identity and do not copy or imitate a third-party logo
- Headings, buttons, and labels keep the reference's casing conventions consistently (uppercase mono meta labels, sentence-case body copy)
</writing>

<requirements>
- Copyright and rights-clearance prohibition: apart from required npm dependency code and explicitly specified open-license fonts or generic utility icons used under their licenses, every creative asset and every piece of visible editorial copy must be newly authored or generated specifically for this fictional build. Do not use scraped, stock, press, social-media, portfolio, source-site, screenshot-derived, copyrighted, trademarked, or otherwise third-party-controlled creative material, and do not make a trace, near-copy, style-identical imitation, or recognizable derivative of it. This applies to raster pixels, individual video frames and audio, SVG paths, canvas/WebGL/Rive artboards and textures, 3D geometry/materials/HDR environments, PDFs, icon/mark silhouettes, metadata, filenames, alt text, and hidden/preloaded assets. If provenance is uncertain, create a fresh fictional replacement.
- Stack mandate: build with Astro delivering a static single-page homepage, composed from Astro components with React islands for the interactive chrome (header dropdown, mobile menu, news carousel, cookie consent); Tailwind CSS 4.3.2 owns styling with the page's three-tier design tokens declared as CSS theme variables; Radix UI primitives inside the React islands provide the dropdown, dialog, and overlay behavior; GSAP 3 with ScrollTrigger and SplitText drive the hero timeline and scroll-synced reveals under native document scrolling, with focus-trap for menu focus containment; no other UI, animation, or icon libraries. Do not substitute Next.js, Nuxt, Remix, SvelteKit, Webflow, Framer, WordPress, or a plain client-rendered SPA
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon
- Icons ship as a single bundled newly authored SVG sprite referenced locally; fictional brand marks ship as the eleven distinct files specified above
- The cookie preferences modal is the page's form surface: it is driven by a form library with a schema validator (Zod) defining the consent categories, saving applies the schema-validated selection, and any invalid state shows inline feedback before save
- Scratch-build every item in the required inventory above; do not copy, trace, crop, recolor, rename, decode, transcode, or otherwise derive source assets, do not omit any item, and do not substitute empty boxes. Do not bundle licensed fonts: self-host an open-license grotesque (medium and bold) plus an open-license mono companion with similar metrics.
- Scope is the homepage route only — do not build additional pages or soft-navigation between routes; chrome links are in-page, inert, or fictional-destination stubs
- Fully offline at runtime: no font, video, analytics, tag-manager, or CDN request may load from a remote host; all fonts, images, marks, the icon sprite, PDF, posters, and VP9 WebM hero live locally and load with zero 404 or decode failures
- Design tokens must match exactly: colors to the exact values (--color-black #010101, --color-white #fff, --color-gray-200 #ccc), the fluid clamp() type and spacing scales as declared, the 12-column grid with baseline units, and the breakpoints at 700/1000/1400px; layout must land within 2px at the 375, 768, and 1440 reference widths; approximate token values are not acceptable
- Motion contracts above must be implemented with the specified durations, inertial easings, and staggers, and the reduced-motion path must disable transformative motion
- SEO: the homepage must expose a title, meta description, canonical link, and OpenGraph/Twitter tags using a local original og-home.jpg share image (1200x627)
- State is in-memory only: do not use localStorage, sessionStorage, cookies, or any other browser storage API; carousel position, menu open state, dropdown state, and consent state live in runtime client state only, and a reload returns the page to its seeded baseline
- package.json must define npm scripts named exactly start (serves the homepage on port 3000) and verify:build (exits 0 when the built output is present); run via npm start on port 3000; do not iframe, proxy, or fetch the site from another origin
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

Bindings:
- Browsable entity: homepage-section
- Destinations: hero; brand-portfolio; annual-report; culture-statement; market-snapshot; latest-news; culture-stats; awards; careers-cta; mobile-menu; responsibility-dropdown

Mechanics exclusions:
- Header scroll-morph timing stays Playwright-observed
- Particles rAF parallax stays Playwright-observed
- Hero-home GSAP intro timing stays Playwright-observed
- Carousel drag geometry stays Playwright-observed
- Mobile-menu clip-path stagger stays Playwright-observed
- Cookie-consent modal transition stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
