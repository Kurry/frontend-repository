<summary>
Build a Hildén & Kaira social-media agency homepage using Astro, Tailwind CSS, and GSAP.
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
Core features (each line is an observable behavior the finished app must exhibit):
- The homepage route / returns HTTP 200 and renders the English (en-GB) Hildén & Kaira homepage; the brand name always keeps its accent (Hildén & Kaira, with é), and the document title reads Hildén & Kaira
- A fixed top nav overlays the page with the brand wordmark logo on the left, centered links Our approach, Story, Work, and Blog, a locale dropdown showing EN, and a right-side contact call-to-action button; the centered nav links, the CTA, and the locale switcher are plain clickable chrome with no working destination page — clicking them navigates nowhere real, and the /fi locale never resolves to a separate page
- Clicking the locale dropdown opens a small EN / FI list; choosing FI updates the dropdown's visible label to FI and choosing EN returns it to EN, all without leaving the homepage
- The page presents these sections in order: a hero with the editorial headline and floating case thumbnails, a statement/manifesto band, a client flick-card deck carousel, a services trio, a testimonials carousel, a call-to-action block, a contact-and-social area, and a full-height footer
- The hero shows the exact H1 "If you can't reach a million people with 0€ ad spend, your branding sucks." with the brand promise lead beneath it, an animated brand lettermark assembled from individual letterforms, and case thumbnails that continuously drift upward on the left and right edges
- The statement section shows the H2 lead "Content only you can post because it's built around your people." over a dark media band
- The client deck is a centered carousel of five client cards — Finlayson, Kierrätyskeskus, Uusi Juttu, Autoliitto, and Liikku — each card carrying a client title, a Show case control, a stacked flick-card deck of short vertical videos, and two live stat tiles labelled Organic views and Likes
- Each client's flick-card deck has Previous and Next controls; clicking Next or Previous elastically reshuffles the stacked cards, promoting a new card to the active/front position and updating each card's status while only the front card's video player stays interactive
- The Organic views and Likes counters begin below their seeded totals and tick upward on their own shortly after load, formatting large numbers with a space as the thousands separator (for example 2 148 665)
- The active client card embeds a custom video player with a big play control, a play/pause button, a mute button, a fullscreen button, a draggable timeline with elapsed and total time, and likes/views captions; the video plays and pauses on demand and the timeline supports seeking
- The services section shows a stacked trio — Organic content, Ads for social, and Training — each with its own number, heading, description, background video, and its own call-to-action button; scrolling through the pinned section throws the top card away to reveal the next
- The testimonials section is a rotator of at least five client quotes with the client's name and role; advancing shows the next quote with its author details, and the current-position indicator updates
- The call-to-action block shows the H2 "Ready to work with us?" with two choice cards: "We'll call you" (which opens the contact form) and "Contact us"; a separate band shows the line "Does your brand have self-esteem issues?"
- Choosing "We'll call you" opens a contact popup containing an email field, an optional phone field, and a Privacy Policy agreement checkbox; submitting with a valid email and the checkbox ticked reveals the form's own success state ("Thanks for your submission!") in place of the form, and the submission is posted to a local endpoint only — never to an external form service
- Submitting the contact form with an empty or invalid email, or with the agreement checkbox unchecked, does not reveal the success state and marks the offending field; a submission attempted within the first few seconds after load is silently ignored as anti-spam
- A cookie consent banner appears shortly after load with an Accept action and a preferences path exposing four categories — Essential (required), Marketing, Analytics, and Personalization; clicking Accept dismisses the banner
- The footer fills at least the viewport height, re-assembles the brand lettermark from its individual letters, and lists a sitemap, Podcast links (Spotify, YouTube, Apple Podcasts), Social links (Instagram, TikTok, Facebook), legal links, and a designer credit
- On narrow viewports (about 479px and below) the centered nav links are replaced by a hamburger button; tapping it opens a full-screen lime menu and locks page scrolling until it is closed
- No in-app control performs a real outbound navigation or full page reload; every nav link, locale option, and social/legal link that has no in-scope destination is present and clickable but non-navigating chrome
</core_features>

<visual_design>
- Editorial, high-contrast agency aesthetic: the home body default surface renders off-white rgb(234, 233, 230) (#eae9e6) with near-black rgb(24, 24, 24) (#181818) text, and dark media bands, lime, turquoise, chrome-metallic, and dark-grey theme surfaces swap per section as the page scrolls
- The statement band (theme-media) renders black rgb(24, 24, 24) with lime rgb(236, 253, 173) (#ecfdad) headings; the footer (theme-chrome) renders a dark-grey rgb(43, 43, 43) (#2b2b2b) base with white text; the Organic views tile renders lime rgb(236, 253, 173); the Training service card renders turquoise rgb(63, 174, 134) (#3fae86); the nav link dot renders red rgb(255, 69, 69) (#ff4545)
- Oversized editorial display headings render in PP Editorial New at weight 400 (hero H1 about 62.8px at 1440 with a tight ~0.9em line-height and negative letter-spacing; statement and CTA H2 about 57.6px), paired with PP Neue Montreal at weight 500 for body, eyebrow, and nav text (paragraph-m about 15.7px, nav links about 13.1px at 1440); both faces resolve from self-hosted files; Inter is used only for ancillary UI and cookie-consent copy; no external font requests
- Fluid, viewport-bound (Osmo) type scaling: the body font-size resolves to about 10.5px at 1440 and clamps up to 16px at 991 and below, so headline and body px grow and shrink smoothly across breakpoints rather than snapping at fixed sizes (the hero H1 measures about 62.8px at 1440, 76px at 991, 60px at 767, and 52px at 479)
- The hero pairs a large editorial headline with a brand lettermark built from twelve individual letterform images and thumbnails floating in left and right zones
- The client deck cards are dense: a client mark and title, a stacked flick deck of vertical video cards, caption chips (age and view count), and two stat tiles — a lime Organic views tile and a chrome Likes tile with a metallic heart
- The services trio uses full-bleed card faces in contrasting themes (lime, white, turquoise) with large index numbers and background video
- The contact popup uses a chrome-metallic panel with floating-label fields; the cookie banner uses a dark theme
- Two of the five clients (Finlayson and Autoliitto) have no dedicated client image asset, and only two case videos exist for the deck's slots; the missing client marks are substituted with an existing mark, placeholder, or text-only treatment and the two videos are reused across slots, rather than referencing files that do not exist
- Text selection shows a lime-on-black highlight; scrollbars are hidden; buttons reset their native chrome and reveal a focus outline on keyboard focus
- Responsive: full centered nav and smooth scrolling on wide and tablet viewports; below roughly 479px the nav collapses to a lime full-screen hamburger menu and the type scale tightens
</visual_design>

<motion>
- On load a lime page-load veil covers the hero then lifts to reveal it, the brand lettermark rises into place letter by letter, and the nav settles in
- Smooth (inertial) scrolling is active on viewports 768px and wider and is disabled below 768px
- Headings and paragraphs reveal with a line-by-line upward mask wipe (yPercent 110 to 0) the first time each element scrolls to about 80% of the viewport, and stay revealed; headings run 0.8s with a 0.08s per-line stagger and paragraphs 0.6s with a 0.04s stagger, both power3.out
- The nav's theme class swaps to match whichever section sits under a small probe near the top of the viewport as the page scrolls, recoloring the nav in step with the section beneath it
- Nav link dots scale up from nothing on hover and for the current link with a slight overshoot, running transform over 0.525s with the back-ish easing cubic-bezier(0.175, 0.885, 0.32, 1.275)
- Hovering a primary button (fine-pointer devices) slides its label upward, rotates its icon backing, translates its arrow across, and wipes the button background; each animated target transitions transform over 0.525s with the primary-motion easing cubic-bezier(0.625, 0.05, 0, 1)
- Clicking a client deck's Next or Previous control animates the stacked flick cards to new offset/rotation/scale positions per the flick coordinate table (active 0/1 scale, +/-1 at +/-25% and +/-10deg scale 0.9, +/-2 at +/-45% and +/-15deg scale 0.8) with an elastic settle running about 0.6s at elastic.out(1.2, 1), and the active card's caption chips slide up into view
- The client carousel keeps the active slide at scale(1) and shrinks neighboring slides to scale(0.94), transitioning over roughly 600ms
- Hero case thumbnails drift on continuous 12–15 second bottom-to-top loops in left and right zones, fading in at the start and out near the top of each loop
- The Organic views and Likes counters tick upward continuously beginning about half a second after load
- The custom video player's interface fades and lifts out of view while playing and returns on hover, transitioning over 0.6s with the primary-motion easing cubic-bezier(0.625, 0.05, 0, 1), with a paused/hover dark overlay
- Eligible cards throw with momentum/inertia when the pointer enters and leaves them (desktop fine-pointer only)
- The cookie banner eases into view shortly after load; the mobile lime menu slides in from the top when opened
- Hover feedback is required on interactive chrome: buttons, nav links, locale options, form controls (focus ring), and carousel controls all give a visible hover/focus response
- The footer's brand lettermark animates its individual letters into place
</motion>

<requirements>
Stack: build the app with Astro, Tailwind CSS, and GSAP (ScrollTrigger, SplitText, InertiaPlugin). Use Lenis for the desktop smooth scroll and Swiper for the client-deck carousel. Self-host the brand faces PP Editorial New and PP Neue Montreal plus Inter; do not load any font, image, video, or script from an external CDN — the build must run fully offline.
Delivery and behavioral contracts:
- package.json must define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the build succeeds); the homepage must be served on port 3000 and / must return HTTP 200
- The contact form must POST to a local API route within the app and reveal the app's own success state on success; it must never call an external form endpoint
- Video must be served locally with HTTP range support (206 Partial Content) so the player timeline can seek and scrub
- Domain state lives in in-memory client state only: the locale label, the active flick-deck index per client, the client carousel position, the contact form's validation and success state, the cookie consent visibility and category toggles, the live counters, the active video's play/seek state, the nav's per-section theme, and the mobile menu open/scroll-lock state. Do not use localStorage, sessionStorage, or any other browser storage API
- Scope is the homepage only, in English only; other nav destinations and the /fi locale are present, clickable chrome with no working destination — the locale dropdown updates its label but /fi need not resolve to a page
- Seed the five client decks, the services trio, at least five testimonials, and the four cookie categories so every section is non-empty on first load
- The counters must animate upward from below their seeded totals; the flick deck must reshuffle only via its Previous/Next (or card) controls; the carousel must keep exactly one centered active slide
- Substitute the two missing client images (Finlayson, Autoliitto) and reuse the two available case videos across the deck's slots rather than referencing nonexistent files
- No backend beyond the local contact endpoint, and no authentication; all navigation stays in-app with no full page reloads
- This is a pixel-fidelity build: match exactly the computed theme colors (lime #ecfdad, turquoise #3fae86, red #ff4545, near-black #181818, off-white #eae9e6, dark-grey #2b2b2b), all verbatim copy, the section order, the theme-per-section mapping, the breakpoint behaviors (hamburger only at 479 and below; smooth scroll 768 and up), the flick coordinate table, the Swiper scale ratio (1 / 0.94), and the font families and weights. Font antialiasing, exact px at odd viewports (Osmo fluid scaling makes px viewport-dependent), subpixel positions, and the deterministic-but-looping hero thumbnail positions only need to match closely
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
- form-workflow-v1
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

<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
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
- Browsable entity: clients
- Destinations: hero; statement; client; services; testimonials; cta; footer
- Locales: en; fi
- Form fields: email; phone; terms
- Form operations: validate; submit; reset
- Session operations: start; pause; resume; stop

Mechanics exclusions:
- Flick-card elastic reshuffle coordinate transforms stay Playwright-only
- Swiper client/testimonial scale (1 / 0.94) and paging stay Playwright-observed
- Hero floating letterform/thumbnail loops stay Playwright-only
- Nav-theme scroll-sync class swap stays Playwright-observed
- Bunny player timeline drag/scrub and interface hide-show stay Playwright-only
- Momentum/inertia hover stays Playwright-only
- Dynamic counter ticking stays Playwright-observed
- Mobile lime menu open animation stays Playwright-only
- SplitText line-mask reveals stay Playwright-only

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
