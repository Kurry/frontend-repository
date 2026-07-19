<summary>
Build a single long-scroll fintech launch-event marketing microsite using Astro with static delivery and vanilla TypeScript island scripts for interactivity, Tailwind CSS 4.3.2, and DaisyUI, with GSAP with ScrollTrigger, Three.js with GLTFLoader and DRACOLoader, and Rive as the motion and 3D runtime.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. The screenshots show the source site's trademarked wordmarks, executive
photography, and brand media; recreate their size, placement, and role with
the original placeholder assets this instruction describes instead of copying
them. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit at the /sprint/26 route). The site presents a fictional fintech brand named Novapay; wherever the reference shows the source brand's mark or name, the shipped site renders the Novapay placeholder identity instead.
Feature: Preloader and 3D scroll hero —
- On first paint a full-viewport black preloader covers the page showing the white Novapay Sprint placeholder mark and a thin progress track; its bar animates toward 100 percent while the 3D hero scene and critical assets load, then the loader exits upward and is removed, revealing the page
- A full-viewport 3D scroll hero fills the screen behind the loader: a WebGL canvas renders an original compressed 3D scene whose camera is scrubbed by scroll position, with a billboard reading SPRINT 26 / 100+ LAUNCHES & UPDATES over the scene, a bottom-center pill CTA reading SCROLL TO SEE 100+ UPDATES, and a top-left white brand lockup pairing the Novapay placeholder wordmark with SPRINT '26; the hero is fixed at the top of the scroll then releases into the stacked sections once the scroll-linked sequence completes
Feature: Navigation —
- A fixed segment nav pinned across the top shows the white Novapay placeholder wordmark plus six labels in order: 01.AGENTIC STACK, 02.INTERNATIONAL PAYMENTS, 03.PAYMENT GATEWAY, 04.D2C, 05.MARKETING, 06.BUSINESS BANKING, with hairline border dividers between segments
- Clicking any of the six segment nav labels scrolls the matching in-page section (hash anchors #agentic-stack, #international, #payment-gateway, #D2C, #Marketers, #finance) into view and marks that nav cell active; clicking the wordmark returns to the hero (#Hero)
- A scroll-spy independently highlights the nav cell for whichever section is currently in view as the user scrolls, without a click
- A persistent vertical GET ACCESS rail is fixed to the side; its link opens an external signup form in a new tab (target _blank, rel noopener noreferrer)
Feature: Stacked sections and feature cards —
- Below the hero, six stacked thematic sections each overlap the one above and alternate background theme (black, blue, white, light-grey); each section pairs an original placeholder executive portrait, name, role, a play control, and a pull quote with a grid of feature cards
- The Agentic Stack section opens with an Agentic Stack watermark, tagline, and the Arjun Mehta intro quote, then runs five sub-bands in order: 01/A Agentic Payments, 01/B Agentic Platform, 01/C Agent Studio, 01/D Payment for Builders, 01/E Agentic Business Banking, each with its own feature cards
- Feature cards render their visuals as original runtime vector animations drawn to canvas elements that are lazily hydrated only as the card scrolls into view (not eagerly on first paint); on hover-capable devices a card wrapping an animated canvas scales up slightly on hover
- Clicking an executive play control opens a full-viewport video modal that plays a local original placeholder MP4 (with its poster thumbnail) and locks body scroll while open; closing the modal via its close control unlocks scroll and stops the video
- Word-reveal headings such as THE AGENTIC ERA split into individual words (THE, AGENTIC, ERA) and reveal them in sequence as the heading scrolls into view
- A footer shows the copy AI-native fintech. / Built from India. For the world., a GET ACCESS CTA, the copyright line Copyright © Novapay FTX26, social links (Instagram, X, LinkedIn), a www.novapay.example link, and a /SPRINT'26 word-mark, with a gradient overlay that fades in tied to scroll position
Feature: Copy anchors —
- Executive quotes are exact copy anchors and must appear verbatim with their fictional placeholder attributions, including Arjun Mehta, SVP, Engineering ("This shift will redefine commerce as we know it. Not because payments got faster. But because it got intelligent."), Rohan Iyer, VP, Product Management ("The future of global commerce isn't just about reach. It's about delivering a global standard of performance, with a local experience, everywhere."), Nikhil Rao, Senior VP, Engineering ("We don't wait for the market to move. We build for where it's going."), Kabir Menon ("D2C isn't about choosing channels. It's about owning the experience across them."), Dev Sharma, GM and Senior Director ("Because business isn't won by who spends the most. It's won by who builds the strongest loops."), and Meera Nair, Senior Director, Product ("We aim to deliver the best business banking experience. Today, that translates to 70% of Indian unicorns using NovapayX.")
- Section taglines and callouts appear verbatim, including Your business has a new co-founder and it's AI-native., Checkout of choice for top brands., Curated rewards for your users., and Don't let banking weigh you down.
- Feature names appear verbatim within their sections, including Agentic Payments cards (Payments on In-App Chats, Payments on LLMs, Novapay for ChatGPT Apps, Voice Payments); Agentic Platform cards (Agentic Onboarding, Ray Smart Assist, Agentic Integration, Ray Customer Support, Agentic Dashboard, Novapay Dashboard on Claude); Agent Studio cards (Dispute Auto-Responder, Cashflow Insights Agent, RTO Shielder Agent, Subscription Recovery Agent); Payment for Builders cards (Novapay Node for n8n, Novapay x Replit, Novapay MCP, Novapay MCP 1.0, Remote MCP); Agentic Business Banking cards (Insights Agent, Receivables Agent, Payouts Agent, Bookkeeping Agent, Reporting Agent); International Payments cards (Localised Checkout, Apple Pay now on Novapay, Google Pay now on Novapay, Chargeback Fraud Protection, Saved Cards, Intelligent Routing, In-House Cards Switch, New Global Accounts, Smart AML Risk Screening, Exporter Dashboard 2.0, Optimised Messaging); Payment Gateway cards (Biometric Card Authentication, UPI Reserve Pay, Novapay CardSync with CRED, Intelligent Retry Engine, Enterprise-Grade SSO, Card Support for 8 & 9-Digit BINs, Upgraded Card Retry for Recurring Payments, Intelligent Downtime Handling, ₹1 Registrations for UPI Autopay, UPI Mandate Cancellation APIs, Higher Card Auto-Debit Limits, Copilot-Powered Card Migration); D2C cards (Quick Buy 2.0, Buyer Protection, Login with Novapay, Omnichannel Payments, Self Healing POS, POS Command Centre, Growth DQR, Remote Trouble Shooting, Order Milestone Badges, Checkout Payment Configuration, ClickPost × Novapay, Divyang Drishti Pay); Marketing cards (Rewards Marketplace 2.0, Omni-channel Gift cards, Wallet-Based Refunds, Lounge Connect); and Business Banking cards (Bank Account Verification for Employees, Corporate Card, Payroll Engine 2.0, AI Payslip, Payroll Approvals Agent, DirectToPhone Payouts, Instant Reimbursements for Employees, Automated TDS Payments and Filing, Smart Collect 2.0, AI-powered Multi-Bank Routing)
- EXPLORE and READ MORE calls to action on cards use an underline plus chevron affordance and link out to absolute external destination URLs in a new tab
</core_features>

<user_flows>
User flows (each flow tracks visible state across the hero, the nav, and the section surfaces):
- Fresh-load hero flow: loading /sprint/26 shows the preloader with its bar filling toward 100 percent, the loader exits upward, and the 3D hero is revealed pinned at the top; scrolling down scrubs the 3D camera through the scene while the SPRINT 26 billboard and pill CTA stay overlaid; once the scroll-linked sequence completes, the hero releases and the first stacked section scrolls into view with the scroll-spy highlighting 01.AGENTIC STACK
- Reload baseline: reloading the page from any scroll depth returns to the top of the page and restarts the preloader-then-hero sequence from the beginning; no scroll position or UI state survives the reload
- Section navigation flow: from the hero, clicking 03.PAYMENT GATEWAY scrolls the payment gateway section into view, that nav cell flashes the click-active blue and is marked active, and the section's index numeral, executive block, and card grid are visible; continuing to scroll manually into the D2C section moves the scroll-spy highlight from 03.PAYMENT GATEWAY to 04.D2C without any click; clicking the wordmark then returns the page to the hero
- Video modal flow: in any section, clicking the executive play control opens the full-viewport video modal with the placeholder video playing; while the modal is open the page behind cannot be scrolled and the nav state is unchanged; closing the modal stops playback, unlocks scrolling, and leaves the page at the same section so the scroll-spy highlight is unchanged
- Mobile menu flow: at a viewport narrower than 768px, the desktop segment nav is gone and a hamburger control is present; opening it lists I.AGENTIC STACK through VI.BUSINESS BANKING; choosing V.MARKETING closes the menu and scrolls the Marketing section into view
</user_flows>

<edge_cases>
- After the preloader exits it no longer intercepts pointer or keyboard input anywhere on the page
- Deep-linking a hash URL such as /sprint/26#payment-gateway renders the same view as in-app navigation: the target section is in view and its nav cell is highlighted
- Rapid successive clicks across several nav labels settle on the last clicked section with exactly one nav cell marked active
- Closing and reopening the video modal plays the video from a clean state, and body scroll is never left locked after a close
- Resizing the viewport across the 768px breakpoint swaps between the desktop and mobile nav treatments without a page reload and without console errors
- If WebGL is unavailable, the hero region falls back to a static composition with its heading text still present, and every section, nav link, and CTA below remains reachable and usable
</edge_cases>

<visual_design>
Tolerance: EXACT match is required for colors, copy, font families, structure, ratios, and breakpoints; CLOSE tolerance (antialiasing and subpixel layout variance only) applies to rendered geometry. The measured values below are the rendered-oracle ground truth.
- Electric blue #0039ff (computes to rgb(0,57,255)) is the click-flash active color of the segment nav cell and the resting background of the GET ACCESS rail and the blue section band; a second blue #305eff (rgb(48,94,255)) is the scroll-spy active-cell color, the loader progress bar, the GET ACCESS hover color, and the focus outline
- The preloader fills the viewport with a solid rgb(0,0,0) background; its progress bar is #305eff (rgb(48,94,255)) on a rgba(255,255,255,0.1) track, both 220px wide, the placeholder mark rendered white
- The base body computes to background-color rgb(26,26,26) (#1a1a1a) with color rgb(255,255,255) white text; dark section bands compute to rgb(21,21,21) (#151515); the grey token is #2c2c2c; supporting palette values include yellow #e3f51a, sky #b8cbd1, secondary/index text rgb(138,138,138), and card body text rgb(120,120,120)
- Fonts are self-hosted: Inter Tight (variable) for body and UI text, Geist Mono (variable) for mono labels and section index numerals, and a bundled open-license display face with a similar tight, high-impact display character at regular 400, medium 500, and bold 700; do not load any font from an external host. Measured type: nav labels render in the mono face at 16px/400; the hero SPRINT/2026 fold text in the display face at 144px/400, letter-spacing -6px; the word-reveal THE AGENTIC ERA heading in the display face at 156px/400, letter-spacing -6px; section index numerals (01/) in the mono face at 38.4px/400, color rgb(138,138,138); section titles in the display face at 48px/500, line-height 43.2px, letter-spacing -0.9px; executive names in the mono face at 16px/400, letter-spacing 0.64px; the executive quote in the display face at 25.6px/400, line-height 28.16px; feature-card headings in the body face at 16px/500; feature-card body in the body face at 16px/400, line-height 19.2px
- The six stacked sections alternate background bands and overlap the section above them so each new band slides up over its predecessor; measured band backgrounds are dark rgb(21,21,21), blue rgb(0,57,255), white rgb(255,255,255), and light-grey rgb(240,240,240)/rgb(237,237,237)/rgb(233,233,233); the Agentic Stack runs an intro band then dark, blue, white, and light-grey sub-bands (01/A through 01/E)
- The fixed nav header is 70px tall spanning the full viewport width from top 0; the GET ACCESS rail is a 30px by 140px box pinned to the right edge
- Over the 3D hero, the SPRINT 26 / 100+ LAUNCHES & UPDATES billboard sits over the scene, the SCROLL TO SEE 100+ UPDATES pill is anchored bottom-center (bottom 32px desktop), and the white Novapay / SPRINT '26 brand lockup sits top-left (fixed, top 32px, left 32px, width 160px desktop)
- All brand marks, executive portraits, card artwork, and video media are original placeholder assets holding the same sizes, aspect ratios, and placements the reference shows; no trademarked logo or brand photograph appears anywhere
- A flash-of-unstyled-content guard in the head presets the resting opacity, color, and background of animated elements so nothing flashes unstyled on load
- No third-party site-builder attribution badge appears anywhere on the page
</visual_design>

<motion>
Motion contracts (observable timings; approximate similar values are not acceptable; the durations/easings below are the measured rendered-oracle ground truth). Scroll-driven 3D and pinning motion is verified as a real scroll/gesture-to-state contract, never a state shortcut:
- Preloader mark fades and slides in over 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) delayed 0.3s; the progress track fades in with the same easing delayed 0.5s; the progress bar width uses transition width 0.12s linear as it animates toward 100 percent
- Preloader exit adds an is-exiting state that transforms translateY(-100%) over 0.9s cubic-bezier(0.76, 0, 0.24, 1); after exit its pointer events are cleared so it never traps input
- Scroll position drives the 3D camera along a path through the hero scene; on desktop, mouse movement adds a parallax with smoothness 0.06; parallax is disabled entirely below the 768px breakpoint where a fixed camera offset is used instead
- The pinned hero lockup and SCROLL TO SEE 100+ UPDATES pill fade in via an opacity transition of 0.6s ease once the hero is ready
- Scroll position drives section pinning and parallax background layers that move at a different rate than their foreground content, tied continuously to scroll progress and reversing when the user scrolls back up
- Each stacked section overlaps the one above via a 100px stack overlap driving a negative top margin, with the overflowing edge clipped, for the scroll-driven reveal
- Feature-card canvas animations hydrate lazily as their card enters the viewport rather than eagerly on load; canvas pointer events are disabled by default and enabled only on hover-capable devices; a card wrapping an animated canvas scales to transform scale(1.03) over transition transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) on hover, on hover-capable devices only
- Word-reveal headings (for example THE / AGENTIC / ERA) split into words and reveal them in sequence as the heading scrolls into view
- Two independent nav active-state mechanisms both run over a measured transition of background-color 0.3s: the segment nav's clicked cell flashes the click-active blue rgb(0,57,255) / #0039ff, while the scroll-spy current-section indicator uses #305eff (rgb(48,94,255))
- The GET ACCESS rail rests at #0039ff (rgb(0,57,255)) and its background transitions to #305eff over the measured 0.3s on real pointer hover (required hover feedback)
- The video modal opens on a play-button click and locks the underlying page scroll while open, unlocking it again on close
- The footer gradient overlay fades in relative to scroll position
</motion>

<responsiveness>
- The primary breakpoint is 768px; below it the desktop segment nav is replaced by a hamburger menu that toggles open and closed, listing the same six sections with Roman-numeral labels: I.AGENTIC STACK, II.INTERNATIONAL PAYMENTS, III.PAYMENT GATEWAY, IV.D2C, V.MARKETING, VI.BUSINESS BANKING
- Below 768px the hero loads a lighter mobile variant of the 3D scene and mouse parallax is disabled in favor of a fixed camera offset
- On mobile the pinned hero lockup repositions to top 20px, left 20px, width 120px and the pill moves to bottom 24px; the mobile hero pill background is rgba(10,10,10,0.82)
- On mobile (max-width 767px) the stacked-section overlap is removed so sections stack edge-to-edge
- At 375px width no content clips or overflows the viewport and no horizontal scrolling appears
</responsiveness>

<accessibility>
- The 3D hero canvas is decorative: the section's real heading text stays present in the DOM as an accessible equivalent
- Word-reveal headings keep the full original phrase exposed to assistive technology on the heading container while the per-word fragments are hidden from the accessibility tree
- Every nav anchor and CTA has an accessible link name; outbound links keep rel noopener noreferrer and open in a new tab
- Every interactive control is reachable with the keyboard and shows a visible focus outline (the #305eff outline color); the video modal's close control is keyboard-focusable and operable
- No page-chrome outbound navigation exists except the declared signup and card CTA links
</accessibility>

<performance>
- The page is interactive before the 3D hero scene finishes loading: the nav, rail, and copy respond immediately while the scene region holds its space and streams in without shifting the layout
- No console errors, hydration errors, or hydration warnings appear on load or during a full top-to-bottom scroll of the page
- Continuous scrolling from top to bottom shows no visible hitching or dropped frames through the hero scrub, the pinned sections, and the card grids
- Lazy hydration of the feature-card canvas animations keeps scrolling smooth; cards far below the fold do not run animations before they are reached
- After first paint, no visible layout jumps occur as fonts, images, or the 3D scene finish loading
</performance>

<writing>
- All rendered copy uses the exact strings this instruction specifies: nav labels with their numeric prefixes, section taglines, executive quotes with their attributions, feature-card names, and footer lines appear verbatim with their original punctuation and capitalization
- Uppercase label styling (nav segments, the SCROLL TO SEE 100+ UPDATES pill, GET ACCESS) is applied consistently wherever those elements appear
- No lorem ipsum, placeholder-text markers, or unfinished copy appears anywhere in the shipped UI
</writing>

<requirements>
- Stack mandate: build the site with Astro using static delivery — the build emits static HTML and all interactivity (nav, scroll-spy, hero scrub, modal, menu) runs in client-side island scripts after load; no server routes, loaders, or API endpoints; do not use jQuery anywhere; do not substitute React, Next.js, or another SPA framework for the page shell
- Styling: Tailwind CSS 4.3.2 (pinned), with the page's design tokens (the blues, band backgrounds, greys, yellow, sky) defined in the @theme block; DaisyUI provides the base chrome — the nav bar shell, button and pill CTAs, the hamburger drawer, and the video-modal shell — restyled to this page's identity; no other component library
- Animation allowlist: GSAP 3.12.5 with ScrollTrigger for scroll choreography, section pinning, and parallax; Three.js r160 with GLTFLoader and DRACOLoader for the 3D hero; the Rive canvas runtime (rive-canvas 2.26.6 or the current rive-js equivalent) for the feature-card vector animations; CSS transitions for hover and simple state changes; no other animation libraries
- Icons: the footer social marks and card chevrons come from astro-icon (npm-local) or original bundled SVG files committed in /app; no icon CDN and no copied third-party icon artwork
- Forms: the page ships no in-page form — lead capture is the outbound signup link; if any form is added it must validate client-side through a Zod or Valibot schema with inline per-field errors shown before submit
- All shipped assets are original placeholders: the Novapay wordmark and brand lockup, executive portraits, feature-card vector animation files, the modal MP4 and its poster, and the hero 3D scenes are original or generated stand-ins matching the reference's sizes, aspect ratios, and layer counts; do not ship any trademarked logo or wordmark, brand photography or video, or licensed font file
- Fonts are self-hosted open-license faces served as local woff2: Inter Tight (variable), Geist Mono (variable), and a bundled open-license display face; no font CDNs
- The build must run fully offline at runtime: with all external network access blocked the page must still fully load its CSS, fonts, and images, open the video modal to a playable state on the local MP4, and run the 3D hero from the locally served scene files and Draco decoder; every font, image, video, 3D scene, decoder, and vendored JS or CSS library must be served same-origin with zero requests to any external CDN
- Vendor a desktop 3D scene and a lighter mobile variant plus the Draco decoder under /app; the hero loads the mobile scene below 768px and the desktop scene otherwise and never fetches scene assets from an external origin; ship the full srcset image size variants and every vector-animation file referenced by the feature grid
- The only permitted external network destinations are outbound marketing links (the external signup form and the card CTA destinations), which remain real, absolute, clickable links opening in a new tab; no analytics or tag-manager network calls may fire from the offline build
- Route contract: /sprint/26 returns the full document; implement (or at minimum document) the redirects / to /sprint/26, /sprint/26/ 301 to /sprint/26, and the www host 301 to the apex domain then /sprint/26; the six nav labels are in-page hash anchors within this one route, not separate pages; deep-linking any hash anchor renders the same view as in-app navigation
- Do not use localStorage, sessionStorage, or other browser storage APIs
- SEO strings: document title Novapay Sprint 2026: The Age of AI-Native Payments; meta description Novapay Sprint 2026 Unveils 100+ Launches, From AI-native Payment Upgrades to Agentic Business Banking. The Agentic Era Begins Today.; a canonical link for the /sprint/26 route; keep a WebPage JSON-LD block in the head describing the page
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon set
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
