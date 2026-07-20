<summary>
Build a single-page long-scroll fintech launch-event marketing microsite (one document at /sprint/26 only — no other product pages or client routes) using Astro with static delivery and vanilla TypeScript island scripts for interactivity, Tailwind CSS 4.3.2, and DaisyUI, with GSAP with ScrollTrigger, Three.js with GLTFLoader and DRACOLoader, and Rive as the motion and 3D runtime. The app produces the operator's Sprint launch brief — a downloadable, copyable JSON and Markdown artifact compiled live from the session shortlist, compare set, theme filter, search, and watch log.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate their composition, proportions, density, and motion. The screenshots'
source wordmarks, people, photography, video, UI marks, and card artwork are
composition-only references and must be replaced by the fictional Novapay
system below. Do not copy, crop, trace, recolor, rename, or ship screenshot
pixels or any source-site file.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit on the single /sprint/26 document). This is one long-scroll page only: the six themes are in-page hash sections, not separate routes or pages. The site presents a fictional fintech brand named Novapay; wherever the reference shows the source brand's mark or name, the shipped site renders the Novapay placeholder identity instead.
Feature: Preloader and 3D scroll hero —
- On first paint a full-viewport black preloader covers the page showing the white Novapay Sprint placeholder mark and a thin progress track; its bar animates toward 100 percent while the 3D hero scene and critical assets load, then the loader exits upward and is removed, revealing the page
- Signature interaction: a full-viewport 3D scroll hero fills the screen behind the loader; a WebGL canvas renders an original compressed 3D scene whose camera is scrubbed by native scroll position, with a billboard reading SPRINT 26 / 100+ LAUNCHES & UPDATES over the scene, a bottom-center pill CTA reading SCROLL TO SEE 100+ UPDATES, and a top-left white brand lockup pairing the Novapay placeholder wordmark with SPRINT '26; the hero is fixed at the top of the scroll then releases into the stacked sections once the scroll-linked sequence completes
Feature: Navigation —
- A fixed segment nav pinned across the top shows the white Novapay placeholder wordmark plus six labels in order: 01.AGENTIC STACK, 02.INTERNATIONAL PAYMENTS, 03.PAYMENT GATEWAY, 04.D2C, 05.MARKETING, 06.BUSINESS BANKING, with hairline border dividers between segments
- Clicking any of the six segment nav labels scrolls the matching in-page section (hash anchors #agentic-stack, #international, #payment-gateway, #D2C, #Marketers, #finance) into view on the same document and marks that nav cell active; clicking the wordmark returns to the hero (#Hero); no click loads a different HTML page
- A scroll-spy independently highlights the nav cell for whichever section is currently in view as the user scrolls, without a click
- A persistent vertical GET ACCESS rail is fixed to the side; its link opens an external signup form in a new tab (target _blank, rel noopener noreferrer)
Feature: Stacked sections and feature cards —
- Below the hero, six stacked thematic sections each overlap the one above and alternate background theme (black, blue, white, light-grey); each section pairs an original placeholder executive portrait, name, role, a play control, and a pull quote with a grid of feature cards
- The Agentic Stack section opens with an Agentic Stack watermark, tagline, and the Arjun Mehta intro quote, then runs five sub-bands in order: 01/A Agentic Payments, 01/B Agentic Platform, 01/C Agent Studio, 01/D Payment for Builders, 01/E Agentic Business Banking, each with its own feature cards
- Feature cards render their visuals as original runtime vector animations drawn to canvas elements that are lazily hydrated only as the card scrolls into view (not eagerly on first paint); on hover-capable devices a card wrapping an animated canvas scales up slightly on hover
- Clicking an executive play control opens a full-viewport video modal that plays that section's newly authored local VP9 WebM (with its matching poster thumbnail) and locks body scroll while open; closing the modal via its close control unlocks scroll and stops the video
- Word-reveal headings such as THE AGENTIC ERA split into individual words (THE, AGENTIC, ERA) and reveal them in sequence as the heading scrolls into view
- A footer shows the copy AI-native fintech. / Built with ambition. For the world., a GET ACCESS CTA, the copyright line Copyright © Novapay FTX26, fictional community links (Photos, Updates, Network), a www.novapay.example link, and a /SPRINT'26 word-mark, with a gradient overlay that fades in tied to scroll position
Feature: Copy anchors —
- Executive quotes are exact copy anchors and must appear verbatim with their fictional placeholder attributions, including Arjun Mehta, SVP, Engineering ("This shift will redefine commerce as we know it. Not because payments got faster. But because it got intelligent."), Rohan Iyer, VP, Product Management ("The future of global commerce isn't just about reach. It's about delivering a global standard of performance, with a local experience, everywhere."), Nikhil Rao, Senior VP, Engineering ("We don't wait for the market to move. We build for where it's going."), Kabir Menon ("D2C isn't about choosing channels. It's about owning the experience across them."), Dev Sharma, GM and Senior Director ("Because business isn't won by who spends the most. It's won by who builds the strongest loops."), and Meera Nair, Senior Director, Product ("We aim to deliver the best business banking experience. Today, that translates to 70% of Indian unicorns using NovapayX.")
- Section taglines and callouts appear verbatim, including Your business has a new co-founder and it's AI-native., Checkout of choice for top brands., Curated rewards for your users., and Don't let banking weigh you down.
- Feature names appear verbatim within their sections, including Agentic Payments cards (Payments on In-App Chats, Payments on LLMs, Novapay for ChatGPT Apps, Voice Payments); Agentic Platform cards (Agentic Onboarding, Ray Smart Assist, Agentic Integration, Ray Customer Support, Agentic Dashboard, Novapay Dashboard on Claude); Agent Studio cards (Dispute Auto-Responder, Cashflow Insights Agent, RTO Shielder Agent, Subscription Recovery Agent); Payment for Builders cards (Novapay Node for n8n, Novapay x Replit, Novapay MCP, Novapay MCP 1.0, Remote MCP); Agentic Business Banking cards (Insights Agent, Receivables Agent, Payouts Agent, Bookkeeping Agent, Reporting Agent); International Payments cards (Localised Checkout, Apple Pay now on Novapay, Google Pay now on Novapay, Chargeback Fraud Protection, Saved Cards, Intelligent Routing, In-House Cards Switch, New Global Accounts, Smart AML Risk Screening, Exporter Dashboard 2.0, Optimised Messaging); Payment Gateway cards (Biometric Card Authentication, UPI Reserve Pay, Novapay CardSync with CRED, Intelligent Retry Engine, Enterprise-Grade SSO, Card Support for 8 & 9-Digit BINs, Upgraded Card Retry for Recurring Payments, Intelligent Downtime Handling, ₹1 Registrations for UPI Autopay, UPI Mandate Cancellation APIs, Higher Card Auto-Debit Limits, Copilot-Powered Card Migration); D2C cards (Quick Buy 2.0, Buyer Protection, Login with Novapay, Omnichannel Payments, Self Healing POS, POS Command Centre, Growth DQR, Remote Trouble Shooting, Order Milestone Badges, Checkout Payment Configuration, ClickPost × Novapay, Divyang Drishti Pay); Marketing cards (Rewards Marketplace 2.0, Omni-channel Gift cards, Wallet-Based Refunds, Lounge Connect); and Business Banking cards (Bank Account Verification for Employees, Corporate Card, Payroll Engine 2.0, AI Payslip, Payroll Approvals Agent, DirectToPhone Payouts, Instant Reimbursements for Employees, Automated TDS Payments and Filing, Smart Collect 2.0, AI-powered Multi-Bank Routing)
- EXPLORE and READ MORE calls to action on cards use an underline plus chevron affordance and point only to fictional .example destinations in a new tab
Feature: Shortlist, compare, filter, search, and watch log —
- Every feature card exposes Pin to shortlist / Unpin and Add to compare controls. Pinning Voice Payments then Quick Buy 2.0 raises a Shortlist tray count from 0 to 1 to 2, marks those cards pinned, and lists both names in pin order; unpinning Voice Payments drops the count to 1 and removes only that name. Pinning the same feature twice does not duplicate its name or inflate the count past a single pin for that card
- Add to compare accepts up to three feature names in a Compare tray; attempting a fourth shows Compare is full (3/3) and leaves the tray at exactly three names
- A Theme filter closed select offers All, Agentic Stack, International Payments, Payment Gateway, D2C, Marketing, and Business Banking. Choosing Payment Gateway hides non-Payment-Gateway feature cards while section chrome stays; typing into Launch search (string ≤120 characters) further narrows visible cards to name matches; choosing All and clearing search restores every card
- Opening an executive video modal appends that executive's name to a Watch log (closed set: Arjun Mehta, Rohan Iyer, Nikhil Rao, Kabir Menon, Dev Sharma, Meera Nair); closing the modal leaves the entry present. Opening Nikhil Rao's Payment Gateway video appends Nikhil Rao
- Undo and Redo reverse shortlist pin/unpin mutations: pinning Voice Payments then Undo returns the Shortlist tray count to 0 and clears the pin mark; Redo restores the pin and count together. With an empty undo history Undo is disabled or inert
- Command palette (Ctrl+K / Cmd+K): opens with search focused; choosing Jump to Payment Gateway closes the palette and scrolls that section into view with its nav cell active; choosing Open sprint brief opens the Sprint launch brief panel; Escape closes the palette
Feature: Sprint launch brief field contract (useful end state) —
- Export sprint brief opens a panel with JSON and Markdown preview tabs plus Download, Copy, Import brief, and Load sample brief controls. The JSON document is an API-shaped session export compiled live from the store and MUST include exactly these required keys: brand (required string, exactly Novapay), event (required string, exactly Sprint 26), shortlistedFeatures (required array of catalog feature-name strings, pin order), compareFeatures (required array of catalog feature-name strings, length 0–3), watchedExecutives (required array of names from the closed executive set above), themeFilter (required closed enum: All, Agentic Stack, International Payments, Payment Gateway, D2C, Marketing, Business Banking), searchQuery (required string, length 0–120), generatedAt (required ISO-8601 UTC timestamp string ending in Z). Cross-field rules: every shortlistedFeatures and compareFeatures entry MUST be a feature name that appears on the page catalog; compareFeatures length MUST be ≤3; watchedExecutives entries MUST be from the closed executive set. An export that omits a session shortlist, compare, theme filter, search, or watch-log mutation is invalid
- After pinning Voice Payments and Quick Buy 2.0, adding Biometric Card Authentication to compare, setting Theme filter Payment Gateway, typing Card into Launch search, and watching Nikhil Rao's video, those live values appear in the JSON with a fresh generatedAt
- Download on the JSON tab offers a real file download named novapay-sprint-26-brief.json whose body matches the live schema-valid preview; Copy copies that same JSON text and shows a visible Copied confirmation; the Markdown tab shows the same facts under headings Shortlisted launches, Compare set, Theme filter, Search, and Watched executives
- Import brief accepts a previously exported contract-valid JSON packet and restores shortlist, compare, theme filter, search, watchedExecutives/Watch log, and pinned marks so trays and both preview tabs match; Load sample brief loads a built-in valid sample through the same restore path
- Importing a contract-invalid brief (brand not Novapay, event not Sprint 26, themeFilter outside the closed enum, compareFeatures longer than 3, a shortlistedFeatures or compareFeatures name not on the page catalog, a watchedExecutives name outside the closed executive set, generatedAt not an ISO-8601 UTC string ending in Z, or missing a required key) leaves shortlist, compare, theme filter, search, and watch log unchanged and shows an inline import error naming the offending field or rule
- With an empty shortlist, Export sprint brief still produces schema-valid JSON whose shortlistedFeatures is [], brand is Novapay, event is Sprint 26, and other required keys reflect the live session
</core_features>

<user_flows>
User flows (each flow tracks visible state across the hero, the nav, and the section surfaces):
- Fresh-load hero flow: loading /sprint/26 shows the preloader with its bar filling toward 100 percent, the loader exits upward, and the 3D hero is revealed pinned at the top; scrolling down scrubs the 3D camera through the scene while the SPRINT 26 billboard and pill CTA stay overlaid; once the scroll-linked sequence completes, the hero releases and the first stacked section scrolls into view with the scroll-spy highlighting 01.AGENTIC STACK
- Reload baseline: reloading the page from any scroll depth returns to the top of the page and restarts the preloader-then-hero sequence from the beginning; no scroll position or UI state survives the reload
- Section navigation flow: from the hero, clicking 03.PAYMENT GATEWAY scrolls the payment gateway section into view, that nav cell flashes the click-active blue and is marked active, and the section's index numeral, executive block, and card grid are visible; continuing to scroll manually into the D2C section moves the scroll-spy highlight from 03.PAYMENT GATEWAY to 04.D2C without any click; clicking the wordmark then returns the page to the hero
- Video modal flow: in any section, clicking the executive play control opens the full-viewport video modal with that section's VP9 WebM playing; while the modal is open the page behind cannot be scrolled and the nav state is unchanged; closing the modal stops playback, unlocks scrolling, and leaves the page at the same section so the scroll-spy highlight is unchanged
- Mobile menu flow: at a viewport narrower than 768px, the desktop segment nav is gone and a hamburger control is present; opening it lists I.AGENTIC STACK through VI.BUSINESS BANKING; choosing V.MARKETING closes the menu and scrolls the Marketing section into view
- Shortlist and compare flow: pin Voice Payments then Quick Buy 2.0 (count 2, both names listed); add Biometric Card Authentication to compare; unpin Voice Payments — count returns to 1 and that name disappears from the tray and both brief preview tabs without a reload
- Sprint brief export flow: after shortlist, compare, theme filter, search, and watch mutations, open Export sprint brief; JSON matches the Sprint launch brief field contract with brand Novapay, event Sprint 26, matching shortlistedFeatures, compareFeatures, themeFilter, searchQuery, watchedExecutives, and ISO-8601 UTC generatedAt ending in Z; Download offers novapay-sprint-26-brief.json; Copy shows Copied; Markdown shows the same facts under Shortlisted launches, Compare set, Theme filter, Search, and Watched executives
- Import round-trip flow: with a non-empty shortlist, compare set, and Watch log entry, Download JSON, clear both trays and the Watch log, then Import that file; Shortlist tray, Compare tray, Watch log, pinned marks, and both preview tabs match the exported session again; a follow-up Import of themeFilter NotATheme, four compareFeatures, or a catalog-illegal shortlistedFeatures name keeps trays and Watch log unchanged and shows a named-field import error
- Command palette flow: press Ctrl+K, type Payment, choose Jump to Payment Gateway; palette closes and payment-gateway is in view with its nav cell active; reopen palette and choose Open sprint brief to open the brief panel
- Undo flow: pin Voice Payments, then Undo — Shortlist count returns to 0, pin clears, brief shortlistedFeatures is []; Redo restores the pin and preview together
- Reload baseline for session chrome: pinning features, setting Theme filter, typing a search query, and watching a video, then reloading, coherently resets shortlist, compare, theme filter, search, Watch log, brief/palette closed, and empty undo/redo — never a mixed partial survival
</user_flows>

<edge_cases>
- After the preloader exits it no longer intercepts pointer or keyboard input anywhere on the page
- Deep-linking a hash URL such as /sprint/26#payment-gateway renders the same view as in-app navigation: the target section is in view and its nav cell is highlighted
- Rapid successive clicks across three or more nav labels settle on the last clicked section with exactly one nav cell marked active
- Closing and reopening the video modal plays the video from a clean state, and body scroll is never left locked after a close
- Resizing the viewport across the 768px breakpoint swaps between the desktop and mobile nav treatments without a page reload and without console errors
- If WebGL is unavailable, the hero region falls back to a static composition with its heading text still present, and every section, nav link, and CTA below remains reachable and usable
- Pinning the same feature twice in a row does not duplicate its name in the shortlist or inflate the count past a single pin for that card
- Adding a fourth compare feature shows Compare is full (3/3) and the Compare tray still holds exactly three names
- Opening Export sprint brief with an empty shortlist still produces schema-valid JSON whose shortlistedFeatures is [], brand is Novapay, event is Sprint 26, themeFilter is the live closed-enum value, generatedAt is an ISO-8601 UTC string ending in Z, and other required keys reflect the live session without crashing or showing lorem
- Importing a malformed or contract-invalid brief JSON (missing required string brand or required array shortlistedFeatures, brand not Novapay, themeFilter outside the closed enum, compareFeatures longer than 3, a feature name not on the page catalog, a watchedExecutives name outside the closed executive set, or generatedAt not ending in Z) does not apply partial state; shortlist, compare, theme filter, search, and watch log stay unchanged and an inline import error names the offending field or rule
- Importing a brief whose themeFilter is NotATheme keeps Theme filter and trays unchanged and shows an inline import error that names themeFilter (or the enum rule)
</edge_cases>

<visual_design>
Tolerance: EXACT match is required for colors, copy, font families, structure, ratios, and breakpoints; CLOSE tolerance (antialiasing and subpixel layout variance only) applies to rendered geometry. The measured values below are the rendered-oracle ground truth. This is a Novapay electric-blue fintech identity — not a lime or cream editorial palette.
- Complete debranding is visible and exhaustive: Novapay is the only fintech identity. No source company/product name, logo silhouette, executive likeness, partner or social-service mark, recognizable source screenshot/video frame, licensed typeface, or site-builder credit may appear in DOM text, pixels, SVG, canvas/WebGL textures, runtime vector-animation artboards, metadata rendered in the UI, or footer details.
- Three-tier design tokens live in the Tailwind @theme block (and matching CSS custom properties): primitives for the palette (#0039ff, #305eff, #1a1a1a, #151515, #2c2c2c, #e3f51a, #b8cbd1, white); spacing geometry (--nav-h 70px, --gutter 66px desktop / 12px mobile, --stack-overlap 100px); and semantic surface roles that map those primitives onto body, dark band, blue band, white band, and light-grey band backgrounds
- Color scarcity: electric blue #0039ff (rgb(0,57,255)) is reserved for the click-flash active nav cell, the resting GET ACCESS rail, and the single blue section band; #305eff (rgb(48,94,255)) is reserved for the scroll-spy active cell, the loader progress bar, the GET ACCESS hover fill, and the focus outline; yellow #e3f51a and sky #b8cbd1 appear only as sparse supporting accents, never as page-wide fills
- The preloader fills the viewport with a solid rgb(0,0,0) background; its progress bar is #305eff (rgb(48,94,255)) on a rgba(255,255,255,0.1) track, both 220px wide, the placeholder mark rendered white
- The base body computes to background-color rgb(26,26,26) (#1a1a1a) with color rgb(255,255,255) white text; dark section bands compute to rgb(21,21,21) (#151515); secondary/index text is rgb(138,138,138) and card body text rgb(120,120,120)
- Fonts are self-hosted: Inter Tight (variable) for body and UI text, Geist Mono (variable) for mono labels and section index numerals, and a bundled open-license display face with a similar tight, high-impact display character at regular 400, medium 500, and bold 700; do not load any font from an external host. Measured type at the 1440 desktop width: nav labels render in the mono face at 16px/400; the hero SPRINT/2026 fold text in the display face at 144px/400, letter-spacing -6px; the word-reveal THE AGENTIC ERA heading in the display face at 156px/400, letter-spacing -6px; section index numerals (01/) in the mono face at 38.4px/400, color rgb(138,138,138); section titles in the display face at 48px/500, line-height 43.2px, letter-spacing -0.9px; executive names in the mono face at 16px/400, letter-spacing 0.64px; the executive quote in the display face at 25.6px/400, line-height 28.16px; feature-card headings in the body face at 16px/500; feature-card body in the body face at 16px/400, line-height 19.2px. Type steps at the 768px and mobile breakpoints rather than using fluid clamp() size jumps between unrelated families
- Broken-grid stacked composition on desktop: the six stacked sections alternate background bands and overlap the section above by the 100px stack-overlap token so each new band slides up over its predecessor; section headers use an asymmetric two-column grid (index column about 330px, title and tagline in the remaining span) rather than equal-width stacks; feature-hero card grids use uneven column ratios; spacing and offsets stay on the gutter / nav-h / stack-overlap baseline. Measured band backgrounds are dark rgb(21,21,21), blue rgb(0,57,255), white rgb(255,255,255), and light-grey rgb(240,240,240)/rgb(237,237,237)/rgb(233,233,233); the Agentic Stack runs an intro band then dark, blue, white, and light-grey sub-bands (01/A through 01/E)
- The fixed nav header is 70px tall spanning the full viewport width from top 0; the GET ACCESS rail is a 30px by 140px box pinned to the right edge
- Over the 3D hero, the SPRINT 26 / 100+ LAUNCHES & UPDATES billboard sits over the scene, the SCROLL TO SEE 100+ UPDATES pill is anchored bottom-center (bottom 32px desktop), and the white Novapay / SPRINT '26 brand lockup sits top-left (fixed, top 32px, left 32px, width 160px desktop)
- All brand marks, executive portraits, card artwork, and video media are newly authored fictional assets holding the same sizes, aspect ratios, placements, and visual density the reference shows; no trademarked logo or recognizable source photograph appears anywhere
- Replacement-asset craft is mandatory. Create or generate roughly from scratch inside /app: a Novapay wordmark, symbol, and SPRINT '26 lockup; six distinct fictional executive portraits; at least one poster and playable video per executive section; the desktop and mobile GLB hero scenes with their material textures; every feature-card runtime vector-animation file and poster/fallback; distinct artwork for every visible feature card; the footer social/chevron SVGs; and the local social-share image. Flat blocks, emoji, repeated portraits, one video reused for all executives, plain text posing as a logo, broken/transparent files, or omitted scene/card art do not count.
- The true structural target is the asymmetric six-band overlap system: 100px desktop stack overlaps, unequal index/content columns, uneven feature grids, and billboard copy layered over the 3D scene on the shared gutter/nav/baseline scale. Display typography uses the reference's breakpoint-stepped scale where measured; split word/character reveals preserve the complete phrase on the parent accessible name while fragments are aria-hidden.
- A flash-of-unstyled-content guard in the head presets the resting opacity, color, and background of animated elements so nothing flashes unstyled on load
- No third-party site-builder attribution badge appears anywhere on the page
- Text and controls on dark, blue, white, and light-grey bands meet WCAG AA contrast against their immediate backgrounds
- Shortlist tray, Compare tray, Theme filter, Launch search, command palette, and Sprint launch brief panel share the Novapay electric-blue token system: dark-band tray surfaces with #305eff accents on active pins and focus rings; JSON tab monospaced; Markdown tab display/body type — integrated into the long-scroll composition rather than a mismatched default dialog kit
</visual_design>

<motion>
Motion contracts (observable timings; approximate similar values are not acceptable; the durations/easings below are the measured rendered-oracle ground truth). Scroll-driven 3D and pinning motion is verified as a real scroll/gesture-to-state contract, never a state shortcut:
- Timeline orchestration on a fresh load: preloader intro and progress run first, the loader exits upward, then the hero lockup and pill fade in, then scroll chapters the 3D camera scrub, the stacked-section overlap reveals, the word-reveal headings, and the footer gradient in that narrative order
- Document scrolling uses native smooth scrolling (html scroll-behavior smooth) for hash and anchor jumps; the 3D camera scrub, section parallax, and stacked-section transforms stay synced to that same native scroll position — no separate smooth-scroll engine that fights position sticky or native touch physics
- Signature and supporting motion use inertial (ease-out / cubic-bezier) easings rather than mechanical linear tweens, except the loader progress bar width which is intentionally linear
- Preloader mark fades and slides in over 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) delayed 0.3s; the progress track fades in with the same easing delayed 0.5s; the progress bar width uses transition width 0.12s linear as it animates toward 100 percent
- Preloader exit adds an is-exiting state that transforms translateY(-100%) over 0.9s cubic-bezier(0.76, 0, 0.24, 1); after exit its pointer events are cleared so it never traps input
- Scroll position drives the 3D camera along a path through the hero scene; on desktop, mouse movement adds a parallax with smoothness 0.06; parallax is disabled entirely below the 768px breakpoint where a fixed camera offset is used instead
- The pinned hero lockup and SCROLL TO SEE 100+ UPDATES pill fade in via an opacity transition of 0.6s ease once the hero is ready
- Scroll storytelling: scroll position drives section pinning and parallax background layers that move at a different rate than their foreground content, tied continuously to scroll progress and reversing when the user scrolls back up
- Each stacked section overlaps the one above via a 100px stack overlap driving a negative top margin, with the overflowing edge clipped, for the scroll-driven reveal
- Feature-card canvas animations hydrate lazily as their card enters the viewport rather than eagerly on load; canvas pointer events are disabled by default and enabled only on hover-capable devices; a card wrapping an animated canvas scales to transform scale(1.03) over transition transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) on hover, on hover-capable devices only
- Word-reveal headings (for example THE / AGENTIC / ERA) split into words and reveal them in sequence with staggered inertial easing as the heading scrolls into view
- Reduced motion: under prefers-reduced-motion, the preloader exits immediately, smooth scrolling and parallax/pinning are disabled, WebGL settles to a static first composition, and split/reveal/vector timelines jump to readable end states while every control and section remains operable.
- Two independent nav active-state mechanisms both run over a measured transition of background-color 0.3s: the segment nav's clicked cell flashes the click-active blue rgb(0,57,255) / #0039ff, while the scroll-spy current-section indicator uses #305eff (rgb(48,94,255))
- The GET ACCESS rail rests at #0039ff (rgb(0,57,255)) and its background transitions to #305eff over the measured 0.3s on real pointer hover (required hover feedback)
- The video modal opens on a play-button click and locks the underlying page scroll while open, unlocking it again on close
- The footer gradient overlay fades in relative to scroll position with an ease-out settle
- Via the real UI path, command palette and Sprint launch brief panel open and close with a short about 0.2s opacity/translate transition using inertial easing; pin/unpin updates the Shortlist tray count without a full-page reload flash; Copied confirmation fades in and out on the brief Copy control
</motion>

<responsiveness>
- The primary breakpoint is 768px; below it the desktop segment nav is replaced by a hamburger menu that toggles open and closed, listing the same six sections with Roman-numeral labels: I.AGENTIC STACK, II.INTERNATIONAL PAYMENTS, III.PAYMENT GATEWAY, IV.D2C, V.MARKETING, VI.BUSINESS BANKING
- Below 768px the hero loads a lighter mobile variant of the 3D scene and mouse parallax is disabled in favor of a fixed camera offset
- On mobile the pinned hero lockup repositions to top 20px, left 20px, width 120px and the pill moves to bottom 24px; the mobile hero pill background is rgba(10,10,10,0.82)
- On mobile (max-width 767px) the stacked-section overlap is removed so sections stack edge-to-edge
- At 375px width no content clips or overflows the viewport and no horizontal scrolling appears
- At 375px width, Shortlist tray, Compare tray, Theme filter, Launch search, command palette, and Sprint launch brief panel remain fully usable without clipping controls or requiring horizontal scroll
</responsiveness>

<accessibility>
- HTML-first structure: landmarks and headings are real semantic elements (nav for the segment and mobile menus, heading levels for section titles) rather than clickable divs standing in for links
- The 3D hero canvas is decorative: the section's real heading text stays present in the DOM as an accessible equivalent
- Word-reveal headings keep the full original phrase exposed to assistive technology on the heading container (aria-label or equivalent) while the per-word fragments are hidden from the accessibility tree
- Every nav anchor and CTA has an accessible link name; outbound links keep rel noopener noreferrer and open in a new tab
- Every interactive control is reachable with the keyboard and shows a visible focus outline (the #305eff outline color); the video modal's close control is keyboard-focusable and operable
- Text and control labels meet WCAG AA contrast against their band backgrounds, including white text on dark and blue bands and dark text on white and light-grey bands
- No page-chrome outbound navigation exists except the declared signup and card CTA links
- Command palette, Sprint launch brief panel, Shortlist tray, and Compare tray trap focus while open, close on Escape, and return focus to the control that opened them; Pin, Unpin, Add to compare, Theme filter, Launch search, Export, Download, Copy, Import, Undo, and Redo expose accessible names
- Copied confirmations and import errors are announced through a polite live region as well as shown visually
</accessibility>

<performance>
- The page is interactive before the 3D hero scene finishes loading: the nav, rail, and copy respond immediately while the scene region holds its space and streams in without shifting the layout
- No console errors, hydration errors, or hydration warnings appear on load or during a full top-to-bottom scroll of the page
- Continuous scrolling from top to bottom shows no visible hitching or dropped frames through the hero scrub, the pinned sections, and the card grids
- Lazy hydration of the feature-card canvas animations keeps scrolling smooth; cards far below the fold do not run animations before they are reached
- After first paint, no visible layout jumps occur as fonts, images, or the 3D scene finish loading
- Opening the command palette, regenerating the Sprint launch brief after shortlist and filter mutations, and rapid Undo/Redo never freeze the page or drop nav or rail responsiveness
</performance>

<writing>
- All rendered copy uses the exact strings this instruction specifies: nav labels with their numeric prefixes, section taglines, executive quotes with their attributions, feature-card names, and footer lines appear verbatim with their original punctuation and capitalization
- Uppercase label styling (nav segments, the SCROLL TO SEE 100+ UPDATES pill, GET ACCESS) is applied consistently wherever those elements appear
- No lorem ipsum, placeholder-text markers, or unfinished copy appears anywhere in the shipped UI
- Where the app renders shortlist, compare, filter, palette, and brief chrome, labels stay specific (Pin to shortlist, Unpin, Add to compare, Export sprint brief, Download, Copy, Import brief, Load sample brief, Undo, Redo, No launches pinned yet, Compare is full (3/3), Copied) rather than generic Submit/OK alone
</writing>

<innovation>
Optional enhancements that are not required to pass: keyboard shortcut hints in the command palette, richer Markdown brief formatting, or coachmarks for first-time shortlist use. Do not substitute these for the required shortlist, compare, filter, watch-log, or Sprint launch brief field-contract behaviors above. Score execution quality of the useful end state: the live JSON/Markdown preview, Download/Copy, and shortlist/compare trays should feel finished and coherent with the Novapay Sprint narrative rather than unfinished stubs.
</innovation>

<requirements>
- Copyright and rights-clearance prohibition: apart from required npm dependency code and explicitly specified open-license fonts or generic utility icons used under their licenses, every creative asset and every piece of visible editorial copy must be newly authored or generated specifically for this fictional build. Do not use scraped, stock, press, social-media, portfolio, source-site, screenshot-derived, copyrighted, trademarked, or otherwise third-party-controlled creative material, and do not make a trace, near-copy, style-identical imitation, or recognizable derivative of it. This applies to raster pixels, individual video frames and audio, SVG paths, canvas/WebGL/Rive artboards and textures, 3D geometry/materials/HDR environments, PDFs, icon/mark silhouettes, metadata, filenames, alt text, and hidden/preloaded assets. If provenance is uncertain, create a fresh fictional replacement.
- Stack mandate: build the site with Astro using static delivery — the build emits static HTML and all interactivity (nav, scroll-spy, hero scrub, modal, menu) runs in client-side island scripts after load; no server routes, loaders, or API endpoints; do not use jQuery anywhere; do not substitute React, Next.js, or another SPA framework for the page shell
- Styling: Tailwind CSS 4.3.2 (pinned), with three-tier design tokens in the @theme block — palette primitives (the blues, blacks, greys, yellow, sky, white), spacing geometry (nav height, gutter, stack overlap), and semantic surface roles for body and section bands; DaisyUI provides the base chrome — the nav bar shell, button and pill CTAs, the hamburger drawer, and the video-modal shell — restyled to this page's Novapay electric-blue identity; no other component library
- Animation allowlist: GSAP 3.12.5 with ScrollTrigger for scroll choreography, section pinning, and parallax synced to native document scroll; Three.js r160 with GLTFLoader and DRACOLoader for the 3D hero; the Rive canvas runtime (rive-canvas 2.26.6 or the current rive-js equivalent) for the feature-card vector animations; CSS transitions for hover and simple state changes; native html scroll-behavior smooth for anchor jumps; do not add a separate smooth-scroll engine (for example Lenis); no other animation libraries
- Icons: the footer social marks and card chevrons come from astro-icon (npm-local) or original bundled SVG files committed in /app; no icon CDN and no copied third-party icon artwork
- Forms and schema validation: lead capture remains the outbound GET ACCESS signup link (no in-page contact form is required). Sprint launch brief export and import MUST validate through a Zod or Valibot schema that mirrors the API-shaped Sprint launch brief field contract above: exported JSON always satisfies the required keys, formats, enums, bounds, and cross-field rules; Import refuses contract-invalid payloads with a named field error and no partial tray or watch-log mutation. Theme filter and Launch search controls surface their closed-enum / length bounds through the same contract
- Scratch-build and asset-originality rule: author or generate the Novapay wordmark/lockup, executive portraits, every feature-card vector animation and fallback, playable videos/posters, hero models/materials, and decorative art as new files inside /app, matching the reference's sizes, aspect ratios, depth, and layer counts. Do not copy, derive, trace, recolor, rename, decode, transcode, or redistribute a source-site, screenshot, or external reference-bundle file. Missing a media surface is not an acceptable debranding strategy, and empty, corrupt, single-frame, transparent, renamed, or unused files do not count.
- Fonts are self-hosted open-license faces served as local woff2: Inter Tight (variable), Geist Mono (variable), and a bundled open-license display face; no font CDNs
- The build must run fully offline at runtime: with all external network access blocked the page must still fully load its CSS, fonts, and images, open every video modal to a playable state on its local VP9 WebM, and run the 3D hero from the locally served scene files and Draco decoder; every font, image, video, 3D scene, decoder, and vendored JS or CSS library must be served same-origin with zero requests to any external CDN
- Vendor an original Draco-compressed desktop GLB scene and a lighter original mobile GLB variant plus the Draco decoder under /app; the hero loads the mobile scene below 768px and the desktop scene otherwise, a high-quality static WebP fallback covers WebGL failure, and no scene asset comes from an external origin. Ship full srcset variants, material textures sized for their target viewport, and every original .riv file referenced by the feature grid; heavy scene parsing must not block the nav or controls, and supported worker/offscreen rendering may be used to keep input responsive.
- The only permitted outbound destinations are fictional absolute .example signup and card-CTA links opening in a new tab; no source-site, source-company, social-platform, analytics, or tag-manager destination may appear or fire from the offline build
- Route contract (single-page only): /sprint/26 returns the one full document that contains the entire microsite; optional delivery redirects (/ to /sprint/26, /sprint/26/ 301 to /sprint/26) may resolve to that same document and must not introduce additional product pages; the six nav labels are in-page hash anchors within this one route, not separate pages or SPA client routes; deep-linking any hash anchor renders the same view as in-app navigation on that same document
- Do not use localStorage, sessionStorage, or other browser storage APIs. Shortlist, compare, theme filter, search, watch log, brief preview, command palette, and undo/redo live in in-memory client state only: after mutations, a reload coherently returns to the empty seeded baseline
- Behavioral state contracts (observable, in-memory only):
  - Pinning or unpinning a feature updates Shortlist tray count, pin marks, and the next Sprint launch brief shortlistedFeatures together without a reload
  - Compare tray, Theme filter, Launch search, and Watch log recompute from the shared session store — never disconnected copies; Export JSON/Markdown always reflects the live store
  - Undo/Redo reverse shortlist pin mutations across tray, pin marks, and brief preview together
  - End-state contract: Download novapay-sprint-26-brief.json and Copy MUST emit the session's actual shortlist, compare, theme filter, search, and watch-log mutations — an export that omits session work is invalid. Importing a previously exported contract-valid brief MUST restore the same visible trays and Watch log (round-trip)
- SEO strings: document title Novapay Sprint 2026: The Age of AI-Native Payments; meta description Novapay Sprint 2026 Unveils 100+ Launches, From AI-native Payment Upgrades to Agentic Business Banking. The Agentic Era Begins Today.; a canonical link for the /sprint/26 route; keep a WebPage JSON-LD block in the head describing the page
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon set. Zod or Valibot is installed via npm for the Sprint launch brief schema
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- command-session-v1
- entity-collection-v1
- artifact-transfer-v1

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

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Browsable entity: features
- Destinations: hero; agentic-stack; international; payment-gateway; d2c; marketing; business-banking; shortlist; compare; sprint-brief
- Filters: all; agentic-stack; international; payment-gateway; d2c; marketing; business-banking
- Session operations: start; stop; trigger_demo
- Demos: mobile-menu; command-palette
- Entity: shortlist-item
- Entity operations: create; delete; toggle
- Entity fields: feature_name; pinned
- Artifact operations: export; copy; import
- Export formats: json; markdown
- Import modes: file; sample

Mechanics exclusions:
- Preloader translateY exit stays Playwright-observed
- Three.js scroll-hero camera scrub / desktop mouse parallax stays Playwright-observed
- GSAP section pinning + parallax reveal stays Playwright-observed
- Rive lazy hydration + hover scale(1.03) stays Playwright-observed
- Word-reveal heading sequencing stays Playwright-observed
- Video-modal scroll lock stays Playwright-observed
- Command palette open/close transition stays Playwright-observed
- File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp only drives Load sample brief and its confirm dialog
- Clipboard contents and downloaded sprint-brief artifacts remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
