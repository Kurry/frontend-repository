<summary>
Build the Wolverine Worldwide corporate marketing homepage using Vite plus TypeScript custom elements (c-header, c-hero-home, c-particles, c-standout-image-galaxy, c-carousel, c-mobile-menu, and siblings), GSAP 3 and SplitText for hero and scroll animation, Swup for soft page transitions, focus-trap for menu focus containment, vanilla-cookieconsent for the cookie banner, and a CSS custom-property token system, served on port 3000; do not substitute the framework or any of these libraries.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished homepage must exhibit):
- The page is a single scrolling homepage at the root path with a global sticky header, a full-bleed video hero, and a sequence of marketing sections ending in a global footer; it is a corporate marketing site, not a storefront, and no section triggers a full-page reload
- The header shows a primary navigation with the exact labels About Us, Brands, Careers, Investors (an external link, marked with an external-link icon), and Responsibility rendered as a dropdown toggler; a brand logo and logotype sit at the header start
- Hovering or activating the Responsibility toggler opens a dropdown panel exposing the three pillars Purpose, Planet, and Product; the toggler carries aria-expanded that flips to true while the panel is open, and the panel is hidden again when dismissed or on Escape
- On scroll the header morphs: once the page has scrolled past its top, html gains a has-scrolled state, the header dropdown height contracts from 300px to 200px, the large wordmark/logotype fades out (opacity 1 to 0, visibility hidden) leaving the compact logo mark, and a dark header background fades in (the .c-header_bg element goes from opacity 0 to opacity 1 over a dark rgba(0,0,0,0.8) bar); the morph runs over roughly 0.4s and reverses when scrolled back to top
- Below 1000px the desktop nav is replaced by a Menu toggle button; activating it opens a full-screen c-mobile-menu overlay whose menu items reveal in a staggered sequence (each item delayed by its index), and a Close control plus Escape dismiss the overlay
- The hero (c-hero-home) fills the viewport with a muted, playsinline background video of the WWW brand portfolio, backed by a freeze-frame still fallback, and the headline reads exactly Make. Every Day. Better. split across lines; a hero card links to the 2025 Annual Report
- A brand-portfolio section headed exactly A portfolio built for every step. presents a particle/galaxy composition of brand and product imagery (c-standout-image-galaxy over c-particles) with a supporting call-to-action button
- The portfolio spans eleven brands — Merrell, Saucony, Wolverine, Sweaty Betty, CAT Footwear, Chaco, Hush Puppies, Stride Rite, HYTEST, Harley-Davidson, and Bates — and all eleven are enumerated as outbound links in the footer brand grid, each pointing at that brand's real external site
- An annual-report block headed exactly 2025 Annual Report (lede copy Our 2025 Annual Report) offers a PDF download affordance
- A culture statement renders the exact heading Many brands, one shared culture, limitless innovation. alongside supporting body copy about curiosity, creativity, and collaboration
- A Market Snapshot section shows the exact heading Market Snapshot, the security name Wolverine World Wide, Inc. (WWW), the label Common Stock, a primary quote value 18.16 USD, and a stat list with DAY'S HIGH $18.60, DAY'S LOW $18.16, DAY'S VOLUME 38,982.00, and LAST UPDATED 2hours ago
- A Latest News section headed exactly Latest News presents a horizontal card carousel (c-carousel) with a View All affordance and Previous/Next controls; activating Next advances the track to later cards without reloading the page
- The news cards carry the real press copy verbatim, including: WWW Earns Great Place to Work Certification for Second Consecutive Year; Footwear News' June 2026 Milestone Issue explores Merrell's 45th anniversary and how the brand continues to innovate itself while staying true to its mission: It Starts Outside; Saucony's Endorphin Pro 5 wins "Best Racing Shoe" and Endorphin Azura wins "Best Training Shoe" by Runner's World; the MUSE Creative Awards recognizing WWW's in-house creative agency work led by The Agency and The Den; The daily running Azura shoe returns to Saucony's Endorphin collection; Merrell's latest trail runner that grips, flexes, and cushions so nothing breaks your flow; and Wolverine joining season two of Paramount+'s "Landman" as the iconic work boot brand
- An employee-culture statistics block states verbatim: 96% of employees said they feel welcomed when they join the Company. 95% say they care about their colleagues. 94% say they're proud to tell others where they work.
- An awards callout renders the exact recognition line: WWW was awarded Company of the Year for its "new, more-focused brand-building model" at the 2025 Footwear News Achievement Awards (FNAA).
- A careers call-to-action section shows the exact heading Creating Your Future With Us with supporting copy No matter the role, the door is open to you at Wolverine Worldwide and an outbound Careers CTA button to the external careers subdomain
- The footer mirrors the header primary menu and adds Contact, a social group (Instagram corporate, Life at WWW Instagram, and LinkedIn), the eleven-brand link grid, a legal group (Privacy Policy, Terms & Conditions, Patents, CA Supply / Anti-Human Trafficking and Transparency in Supply Chain Statement, Customer Returns, Retail Vendor Partners), and the copyright line © 2026 Wolverine World Wide, Inc.
- A cookie-consent banner appears on load with the heading We use cookies and the actions Accept all, Reject all, and Manage preferences; Manage preferences opens a preferences modal
- The other thirteen routes the live site exposes (About Us, Brands, Careers, Contact, Investors relations, Investors contact, Patents, Privacy Policy, Responsibility, Retail Vendor Partners, Terms and Conditions, Customer Returns, CA Supply) are out of scope: their header, footer, and brand-grid links exist as ordinary links and do not need to resolve to built pages, and outbound brand/investor/careers/social links keep pointing at their real external destinations
</core_features>

<visual_design>
- Monochrome editorial system: body background computes to rgb(255,255,255) (#fff) with body text rgb(1,1,1) (--color-black #010101) and a single neutral --color-gray-200 #ccc; button state background uses a translucent black #0000001a; the footer surface is rgb(1,1,1) with rgb(255,255,255) text, and the hero renders white type over full-bleed imagery
- Typography is the self-hosted ABC Diatype family (Medium and Bold, plus ABC Diatype Mono for meta and counters) resolving through --font-sans "ABCDiatype", sans-serif; the type scale is fluid via clamp() (for example --text-display-xl is clamp(6.25rem, 4.7717rem + 7.3913vw, 10.5rem)). At the 1440px reference width the tiers render, in ABC Diatype: the hero display Make. Every Day. Better. at 168px / weight 700 / line-height 132.72px / letter-spacing -8.4px / color rgb(255,255,255); the portfolio heading A portfolio built for every step. and the careers push heading Creating Your Future With Us at 128px / weight 700 / line-height 101.12px; the Market Snapshot value 18.16 at 128px / weight 700; the section headings Market Snapshot and Many brands, one shared culture, limitless innovation. at 33px / weight 700 / line-height 33px; header nav links at 15px / weight 400 / letter-spacing -0.3px; news card titles at 19px / weight 400 / line-height 22.8px; and market-snapshot meta labels (DAY'S HIGH, DAY'S VOLUME) in ABC Diatype Mono at 11px / weight 400 / uppercase
- Layout is a 12-column grid with fluid spacing and radius tokens (for example --unit-lg 48px, --radius-lg 12px, --spacing-fluid-lg clamp(2rem, 1.8261rem + 0.8696vw, 2.5rem)); do not replace the fluid clamp() scales with fixed px scales
- Responsive breakpoints step from 340px up to 2400px; the load-bearing thresholds are 700px (grid switches), 1000px (mobile menu below, desktop nav at and above, with header logo variants swapping), and 1400px (scrolled header dropdown height and tile type adjustments)
- Z-index layering places the header at 50 (--z-index-header) and modals/overlays at 700 (--z-index-modal), with the cookie layer highest; the header measures roughly 82px tall at 1440px, the logo icon is 24px wide (--icon-width-logo) and the dropdown chevron 8px (--icon-width-chevron)
- UI glyphs come from a single SVG icon sprite (ids include logo, logotype, logotype-only, chevron-down, close, cross, external, instagram, linkedin, arrow-up, expand, plus, minus, sort); brand marks ship as one file per brand, with Chaco a raster lizard PNG and Sweaty Betty a vector wordmark
- The composition is image-forward and full-bleed: video hero, a particle/galaxy image field for the portfolio teaser, dense news cards, a market-snapshot stat list, and a dark careers push panel; the footer is a dark rounded-top slab
- The cookie banner is themed through vanilla-cookieconsent tokens (overlay rgba(0,0,0,0.65), modal transition 0.25s)
</visual_design>

<motion>
- Scroll reveals: elements marked anim-fade, anim-up, anim-up-scale, anim-fade-scale, and anim-text reveal from their hidden state to settled as they enter the viewport (they gain an is-inview state); staggered groups offset each child by --anim-stagger 0.1s times --index; durations are typically 0.6s and 0.8s with easing --ease-expo-out cubic-bezier(0.19, 1, 0.22, 1) or a power2-out equivalent
- Hero intro (c-hero-home) runs a GSAP timeline with ease expo.out and base duration 1: on first load the hero video scales from a slightly enlarged state (about 1.08) down to 1 while the title lines rise and fade from opacity 0, yPercent 40 to settled with stagger about 0.1, and the hero card eases from opacity 0, scale 0.9, yPercent 10 to final just after the titles; the hero animates in rather than appearing pre-settled, while the full-bleed background image itself holds in place as the video and type settle
- Particles (c-particles): a field of image particles driven by a requestAnimationFrame loop that lerps against scroll position (config speed 0.15, ease 0.1, scaleEase 0.25, scrollMultiplier 0.05, scaleMin 0.5, scaleMax ~1.2), applying translate3d plus scale with an overlay opacity inverse to particle opacity; particle x/y positions are randomized per load, so match the animation config and overall composition rather than pixel placement, and the particles must be in continuous parallax motion rather than static
- Standout image galaxy (c-standout-image-galaxy): sets a per-item CSS --delay of index times 0.1s and a --ty, and splits the heading into line spans (the portfolio heading A portfolio built for every step. is three line spans) that reveal as the section enters view, easing over the slow/slowest duration tokens with sine-out/expo-out easing
- News carousel (c-carousel): a horizontal track with Previous/Next controls and pointer drag (an is-dragging state during drag), smooth or instant scrollTo, and snap math; advancing must move the real track
- Header scroll morph: crossing the scroll threshold toggles html.has-scrolled and transitions the dropdown height (300px to 200px), fades the large wordmark/logotype out (opacity to 0 over 0.4s), fades the dark header background in (.c-header_bg opacity 0 to 1), and settles the inner header; the inner transition is 0.4s with ease cubic-bezier(0.215, 0.61, 0.355, 1)
- Mobile menu: opening toggles html.has-menu-opened and reveals the overlay and its items in an index-staggered clip-path/translate sequence (each item transitions over 0.6s with a per-item transition-delay of --index times ~0.06s, so measured delays step 0s, 0.06s, 0.12s, 0.18s, 0.24s), ease cubic-bezier(0.19, 1, 0.22, 1); closing reverses it
- Swup page transitions wrap soft navigations with html.is-animating and a default transition class
- Cookie-consent modal transitions in and out over 0.25s
- Inline video plays on view (muted, playsinline); lazy images start visually suppressed and settle to opacity 1, scale 1 when they gain is-loaded and enter view
- Hover and focus microinteractions are required: buttons take a hover/focus background of --color-gray-200 with an icon shift of about 25px, header nav links animate an underline (:before opacity 0 to 1) on hover or when their dropdown is expanded, and cards show a focus-visible title underline and image outline; omitting hover feedback is a failure
- Reduced motion: under prefers-reduced-motion reduce, tokenized transition durations collapse to 0s and JS timelines short-circuit to their final state (no transform-in animations, no stagger, no particle parallax); the app detects this via matchMedia
</motion>

<requirements>
- Stack mandate: build with Vite as the asset pipeline/dev server, TypeScript, the custom-elements component model (c-header, c-hero-home, c-particles, c-standout-image-galaxy, c-carousel, c-mobile-menu, c-inline-video, c-accordion, and siblings), GSAP 3 plus SplitText, Swup for page transitions, focus-trap for menu focus containment, vanilla-cookieconsent for the cookie banner, and a CSS custom-property token system; do not substitute Next.js, Nuxt, Remix, Astro, Webflow, Framer, WordPress, a plain React SPA, or SvelteKit, and do not swap GSAP/Swup/focus-trap/vanilla-cookieconsent for Framer Motion, a Barba-only approach, CSS-only approximations, or an alternate consent SDK
- Scope is the homepage route only; the other thirteen routes are nav-only stub links and need not resolve to built pages; header, footer, and brand-grid links to external brand sites, the investor and careers subdomains, and social profiles stay as real outbound hrefs
- Fully offline at runtime: no CloudFront, Vimeo, Google Tag Manager, font, or CDN request may load an asset from a remote host; copy the provided fonts, images, brand marks, icon sprite, and hero video into the app's own static directory and reference them locally
- Design tokens must match exactly: colors and fonts to the exact values (--color-black #010101, --color-white #fff, --color-gray-200 #ccc; ABC Diatype and ABC Diatype Mono), fluid clamp() type and spacing scales as declared, the 12-column grid, and the breakpoints at 700/1000/1400px; layout must land within 2px at the 375, 768, and 1440 reference widths; approximate token values are not acceptable
- Motion contracts above must be implemented with the specified durations, easings, and staggers, and the reduced-motion path must disable transformative motion
- SEO: the homepage must expose a title, meta description, canonical link, and OpenGraph/Twitter tags using the local og-home.jpg share image (1200x627); a Google Tag Manager bootstrap may be present but must no-op offline
- State is in-memory only: do not use localStorage, sessionStorage, or any other browser storage API; carousel position, menu open state, and dropdown state live in runtime state only
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
