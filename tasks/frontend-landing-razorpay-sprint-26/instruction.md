<summary>
Build a single long-scroll marketing microsite as a Webflow-style static export using jQuery, GSAP with ScrollTrigger, Three.js with GLTFLoader and DRACOLoader, and Rive.
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
Core features (each line is an observable behavior the finished app must exhibit at the /sprint/26 route):
- On first paint a full-viewport black preloader (#site-loader) covers the page showing the Razorpay Sprint logo and a thin progress track; its bar animates toward 100 percent while the 3D hero GLB and critical assets load, then the loader exits upward and is removed, revealing the page; after exit the loader no longer intercepts pointer or keyboard input
- A fixed segment nav pinned across the top shows a white Razorpay logo plus six labels in order: 01.AGENTIC STACK, 02.INTERNATIONAL PAYMENTS, 03.PAYMENT GATEWAY, 04.D2C, 05.MARKETING, 06.BUSINESS BANKING, with hairline border dividers between segments
- Clicking any of the six segment nav labels scrolls the matching in-page section (hash anchors #agentic-stack, #international, #payment-gateway, #D2C, #Marketers, #finance) into view and marks that nav cell active; clicking the logo returns to the hero (#Hero)
- A scroll-spy independently highlights the nav cell for whichever section is currently in view as the user scrolls, without a click
- A persistent vertical GET ACCESS rail is fixed to the side; its link opens the Typeform lead-capture form in a new tab (target _blank, rel noopener noreferrer)
- A full-viewport Three.js scroll hero fills the screen behind the loader: a WebGL canvas renders a Draco-compressed GLB scene whose camera (DutchCamera001) is scrubbed by scroll position, with a billboard reading SPRINT 26 / 100+ LAUNCHES & UPDATES over the scene, a bottom-center pill CTA reading SCROLL TO SEE 100+ UPDATES, and a top-left brand mark (Razorpay / SPRINT '26, white); the hero is fixed at the top of the scroll then releases into the stacked sections once the scroll-linked sequence completes
- On reload the page force-scrolls to the top (history.scrollRestoration is manual) so the hero sequence always restarts from the beginning
- Below the hero, six stacked thematic sections each overlap the one above and alternate background theme (black, blue, white, light-grey); each section pairs an executive portrait, name, role, a play control, and a pull quote with a grid of feature cards
- The Agentic Stack section opens with an Agentic Stack watermark, tagline, and the Prabu Ram intro quote, then runs five sub-bands in order: 01/A Agentic Payments, 01/B Agentic Platform, 01/C Agent Studio, 01/D Payment for Builders, 01/E Agentic Business Banking, each with its own feature cards
- Feature cards render their visuals as Rive canvas animations that are lazily hydrated only as the card scrolls into view (not eagerly on first paint); on hover-capable devices a card wrapping a Rive canvas scales up slightly on hover
- Clicking an executive play control opens a full-viewport video modal that plays a local MP4 (with its poster thumbnail) and locks body scroll while open; closing the modal via its close control unlocks scroll and stops the video
- Word-reveal headings such as THE AGENTIC ERA split into individual words (THE, AGENTIC, ERA) and reveal them in sequence as the heading scrolls into view
- A footer shows the copy AI-native fintech. / Built from India. For the world., a GET ACCESS CTA, the copyright line Copyright © Razorpay FTX26, social links (Instagram, X, LinkedIn), a www.razorpay.com link, and a /SPRINT'26 word-mark, with a gradient overlay that fades in tied to scroll position
- Below the 768px breakpoint the desktop segment nav is replaced by a hamburger menu that toggles open and closed; its menu lists the same six sections with Roman-numeral labels: I.AGENTIC STACK, II.INTERNATIONAL PAYMENTS, III.PAYMENT GATEWAY, IV.D2C, V.MARKETING, VI.BUSINESS BANKING
- Executive quotes are exact copy anchors and must appear verbatim, including Prabu Ram, SVP, Engineering ("This shift will redefine commerce as we know it. Not because payments got faster. But because it got intelligent."), Tejas Gowda, VP, Product Management ("The future of global commerce isn't just about reach. It's about delivering a global standard of performance, with a local experience, everywhere."), Vivek Agarwal, Senior VP, Engineering ("We don't wait for the market to move. We build for where it's going."), Anand Laxmanan ("D2C isn't about choosing channels. It's about owning the experience across them."), Ritesh Jain, GM and Senior Director ("Because business isn't won by who spends the most. It's won by who builds the strongest loops."), and Asheesh V, Senior Director, Product ("We aim to deliver the best business banking experience. Today, that translates to 70% of Indian unicorns using RazorpayX.")
- Section taglines and callouts appear verbatim, including Your business has a new co-founder and it's AI-native., Checkout of choice for top brands., Curated rewards for your users., and Don't let banking weigh you down.
- Feature names appear verbatim within their sections, including Agentic Payments cards (Payments on In-App Chats, Payments on LLMs, Razorpay for ChatGPT Apps, Voice Payments); Agentic Platform cards (Agentic Onboarding, Ray Smart Assist, Agentic Integration, Ray Customer Support, Agentic Dashboard, Razorpay Dashboard on Claude); Agent Studio cards (Dispute Auto-Responder, Cashflow Insights Agent, RTO Shielder Agent, Subscription Recovery Agent); Payment for Builders cards (Razorpay Node for n8n, Razorpay x Replit, Razorpay MCP, Razorpay MCP 1.0, Remote MCP); Agentic Business Banking cards (Insights Agent, Receivables Agent, Payouts Agent, Bookkeeping Agent, Reporting Agent); International Payments cards (Localised Checkout, Apple Pay now on Razorpay, Google Pay now on Razorpay, Chargeback Fraud Protection, Saved Cards, Intelligent Routing, In-House Cards Switch, New Global Accounts, Smart AML Risk Screening, Exporter Dashboard 2.0, Optimised Messaging); Payment Gateway cards (Biometric Card Authentication, UPI Reserve Pay, Razorpay CardSync with CRED, Intelligent Retry Engine, Enterprise-Grade SSO, Card Support for 8 & 9-Digit BINs, Upgraded Card Retry for Recurring Payments, Intelligent Downtime Handling, ₹1 Registrations for UPI Autopay, UPI Mandate Cancellation APIs, Higher Card Auto-Debit Limits, Copilot-Powered Card Migration); D2C cards (Quick Buy 2.0, Buyer Protection, Login with Razorpay, Omnichannel Payments, Self Healing POS, POS Command Centre, Growth DQR, Remote Trouble Shooting, Order Milestone Badges, Checkout Payment Configuration, ClickPost × Razorpay, Divyang Drishti Pay); Marketing cards (Rewards Marketplace 2.0, Omni-channel Gift cards, Wallet-Based Refunds, Lounge Connect); and Business Banking cards (Bank Account Verification for Employees, Corporate Card, Payroll Engine 2.0, AI Payslip, Payroll Approvals Agent, DirectToPhone Payouts, Instant Reimbursements for Employees, Automated TDS Payments and Filing, Smart Collect 2.0, AI-powered Multi-Bank Routing)
- EXPLORE and READ MORE calls to action on cards use an underline plus chevron affordance and link out to the real Razorpay product or blog pages in a new tab
</core_features>

<visual_design>
Tolerance: EXACT match is required for colors, copy, font families, structure, ratios, and breakpoints; CLOSE tolerance (antialiasing and subpixel layout variance only) applies to rendered geometry. The measured values below are the rendered-oracle ground truth.
- Electric blue #0039ff (computes to rgb(0,57,255)) is the click-flash active color of the segment nav cell and the resting background of the GET ACCESS rail and the blue section band; a second blue #305eff (rgb(48,94,255)) is the scroll-spy active-cell color, the loader progress bar, the GET ACCESS hover color, and the focus outline
- The preloader fills the viewport with a solid rgb(0,0,0) background; its progress bar is #305eff (rgb(48,94,255)) on a rgba(255,255,255,0.1) track, both 220px wide, the logo rendered white via filter brightness(0) invert(1)
- The base body computes to background-color rgb(26,26,26) (#1a1a1a) with color rgb(255,255,255) white text; dark section bands compute to rgb(21,21,21) (--black #151515); --grey is #2c2c2c; supporting palette values include --yellow #e3f51a, --sky #b8cbd1, secondary/index text rgb(138,138,138), and card body text rgb(120,120,120)
- Fonts are self-hosted and must not be substituted: Inter_tight (variable) for body and UI text, Geist_mono (variable) for mono labels and section index numerals, and TASA Orbiter Display (Tasa_Regular 400, Tasa 500 medium, Tasa_Bold 700) for display headings; do not swap in Google Fonts Inter, system-ui, or any other family. Measured type: nav labels render in Geist_mono at 16px/400; the hero SPRINT/2026 fold text in Tasa_Regular at 144px/400, letter-spacing -6px; the word-reveal THE AGENTIC ERA heading in Tasa_Regular at 156px/400, letter-spacing -6px; section index numerals (01/) in Geist_mono at 38.4px/400, color rgb(138,138,138); section titles in Tasa (Medium) at 48px/500, line-height 43.2px, letter-spacing -0.9px; executive names in Geist_mono at 16px/400, letter-spacing 0.64px; the executive quote in Tasa_Regular at 25.6px/400, line-height 28.16px; feature-card headings in Inter_tight at 16px/500; feature-card body in Inter_tight at 16px/400, line-height 19.2px
- The six stacked sections alternate background bands and overlap the section above them so each new band slides up over its predecessor; measured band backgrounds are dark rgb(21,21,21), blue rgb(0,57,255), white rgb(255,255,255), and light-grey rgb(240,240,240)/rgb(237,237,237)/rgb(233,233,233); the Agentic Stack runs an intro band then dark, blue, white, and light-grey sub-bands (01/A through 01/E)
- The fixed nav header is 70px tall spanning the full viewport width from top 0; the GET ACCESS rail is a 30px by 140px box pinned to the right edge
- Over the 3D hero, the SPRINT 26 / 100+ LAUNCHES & UPDATES billboard sits over the scene, the SCROLL TO SEE 100+ UPDATES pill is anchored bottom-center (bottom 32px desktop), and the white Razorpay / SPRINT '26 brand mark sits top-left (fixed, top 32px, left 32px, width 160px desktop)
- On mobile the pinned hero logo repositions to top 20px, left 20px, width 120px and the pill moves to bottom 24px; the mobile Three.js logo pill background is rgba(10,10,10,0.82)
- A flash-of-unstyled-content guard in the head presets the resting opacity, color, and background of animated elements so nothing flashes unstyled on load
- The Webflow attribution badge is suppressed; no visible Made in Webflow badge appears
</visual_design>

<motion>
Motion contracts (observable timings; approximate similar values are not acceptable; the durations/easings below are the measured rendered-oracle ground truth). Scroll-driven Three.js and GSAP motion is not inspectable via getAnimations() and is verified as a real scroll/gesture-to-state contract, never a WebMCP state shortcut:
- Preloader logo fades and slides in over 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) delayed 0.3s; the progress track fades in with the same easing delayed 0.5s; the progress bar width uses transition width 0.12s linear as it animates toward 100 percent
- Preloader exit adds an is-exiting state that transforms translateY(-100%) over 0.9s cubic-bezier(0.76, 0, 0.24, 1); after exit its pointer events are cleared so it never traps input
- Scroll position drives the Three.js camera along a path through the GLB scene; on desktop mouse movement adds a parallax with smoothness 0.06; parallax is disabled entirely below the 768px breakpoint where a fixed camera offset is used instead
- The pinned hero logo and SCROLL TO SEE 100+ UPDATES pill fade in via an opacity transition of 0.6s ease once the hero is ready
- GSAP with ScrollTrigger drives section pinning and parallax backgrounds (.parallax-bg); GSAP and ScrollTrigger must be initialized before any logic that depends on them runs
- Each stacked section overlaps the one above via a --stack-overlap of 100px driving a negative margin-top, with overflow hidden and will-change transform for the scroll-driven reveal; on mobile (max-width 767px) the overlap is removed so sections stack edge-to-edge
- Rive feature-card visuals hydrate lazily as their card enters the viewport rather than eagerly on load; canvas pointer events are disabled by default and enabled only on hover-capable devices; a card wrapping a Rive canvas scales to transform scale(1.03) over transition transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) on hover, on hover-capable devices only
- Word-reveal headings (for example THE / AGENTIC / ERA) split into words and reveal them in sequence as the heading scrolls into view
- Two independent nav active-state mechanisms both run over a measured transition of background-color 0.3s: the segment nav's clicked cell flashes the Webflow-interaction blue rgb(0,57,255) / #0039ff, while the scroll-spy current-section indicator uses #305eff (rgb(48,94,255))
- The GET ACCESS rail rests at #0039ff (rgb(0,57,255)) and its background transitions to #305eff over the measured 0.3s on real pointer hover (required hover feedback)
- The video modal opens on a play-button click and locks the underlying page scroll while open, unlocking it again on close
- The footer gradient overlay fades in relative to scroll position
</motion>

<requirements>
- Stack mandate (do not substitute React, Next.js, Framer, WordPress, Astro, or any equivalent framework): rebuild this as a Webflow-style static export (or a byte-faithful static site) using jQuery 3.5.1 plus Webflow-style compiled interactions, GSAP 3.12.5 with ScrollTrigger, Three.js r160 with GLTFLoader and DRACOLoader, Rive canvas 2.26.6, and es-module-shims 1.10.0
- The build must run fully offline at runtime: with all external network access blocked the page must still fully load its CSS, fonts, and images, open the video modal to a playable state on the local MP4, and run the Three.js hero from the locally served GLB and Draco decoder; every font, image, video, GLB scene, Draco decoder, and vendored JS or CSS library must be served same-origin with zero requests to any external CDN
- Vendor the desktop GLB and a mobile GLB variant plus the Draco decoder; the ThreeHero config loads /assets/3d/Sprint_mobile.glb below 768px and /assets/3d/Sprint.glb otherwise, targets camera DutchCamera001, and never fetches the GLB from an external bucket; ship the full srcset image size variants and every Rive file referenced by the feature grid
- The only permitted external network destinations are outbound marketing links (the Typeform signup form and the Razorpay product/blog article links), which remain real, absolute, clickable links opening in a new tab; no analytics or GTM network calls may fire from the offline build
- Route contract: /sprint/26 returns the full document; implement (or at minimum document) the redirects / to /sprint/26, /sprint/26/ 301 to /sprint/26, and the www host 301 to the apex domain then /sprint/26; the six nav labels are in-page hash anchors within this one route, not separate pages
- Behavior contracts: loading /sprint/26 shows the loader then the loader exits; scrolling the hero drives camera and parallax motion on desktop; clicking each section nav link scrolls that section into view and marks it active; hovering GET ACCESS shows the #305eff background; clicking a play control opens the video modal; resizing to a mobile viewport swaps in the mobile GLB and the mobile nav
- Responsive: the primary breakpoint is 768px; below it the mobile GLB variant loads, mouse parallax is disabled, the nav becomes Roman-numeral labels behind a hamburger menu, and (below 767px) the pinned hero logo and pill reposition and the stacked-section overlap is removed so sections stack edge-to-edge
- Do not use localStorage, sessionStorage, or other browser storage APIs
- SEO strings must match the live site exactly: document title Razorpay Sprint 2026: The Age of AI-Native Payments; meta description Razorpay Sprint 2026 Unveils 100+ Launches, From AI-native Payment Upgrades to Agentic Business Banking. The Agentic Era Begins Today.; canonical https://razorpay.com/sprint/26; keep a WebPage JSON-LD block in the head matching the live structure
- Zero page-chrome outbound navigation except the declared Typeform signup and Razorpay product/blog links; the 3D hero canvas is decorative, so keep the section's real heading text present in the DOM as an accessible equivalent; maintain link names for every nav anchor and CTA, keep visible focus outlines, and preserve rel noopener/noreferrer on outbound links
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
- command-session-v1

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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

Bindings:
- Destinations: hero; agentic-stack; international; payment-gateway; d2c; marketing; business-banking
- Session operations: start; stop; trigger_demo
- Demos: mobile-menu

Mechanics exclusions:
- Preloader translateY exit stays Playwright-observed
- Three.js scroll-hero camera scrub / desktop mouse parallax stays Playwright-observed
- GSAP section pinning + parallax reveal stays Playwright-observed
- Rive lazy hydration + hover scale(1.03) stays Playwright-observed
- Word-reveal heading sequencing stays Playwright-observed
- Video-modal scroll lock stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
