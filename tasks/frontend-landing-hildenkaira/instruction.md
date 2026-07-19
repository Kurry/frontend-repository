<summary>
Build a fully fictional Cinder & Bloom social-media agency homepage using Astro, Tailwind CSS 4.3.2, DaisyUI, and GSAP, preserving the reference's editorial composition and interaction system without its identity or proprietary media.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate their composition, proportions, density, and motion. Any legible
source agency/client name, logo, letterform, typeface, photograph, or video is
composition-only reference material and must be replaced with the fictional
system below. Do not copy, crop, trace, recolor, rename, or ship screenshot
pixels or source-site files.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- The page loads a single long-form English (en-GB) homepage at / that returns HTTP 200; no other route is built — this is the homepage only; the fictional brand name is consistently Cinder & Bloom, and the document title reads Cinder & Bloom
- A fixed top nav overlays the page with an original placeholder brand wordmark on the left, centered links Our approach, Story, Work, and Blog, a locale dropdown showing EN, and a right-side contact call-to-action button; the centered nav links, the CTA, Show case controls, service and about buttons, and the locale switcher are plain clickable chrome with no working destination page — clicking them stays on / and never opens a second page, and the /fi locale never resolves to a separate page
- The page presents these sections in this exact top-to-bottom order: hero with editorial headline and floating case thumbnails; statement/manifesto band; client flick-card deck carousel; services trio; testimonials carousel; about/self-esteem band with the H2 "Does your brand have self-esteem issues?"; call-to-action block; full-height footer (sitemap, podcast, social, and legal links live in the footer, not as a separate mid-page section)
- The hero shows the exact H1 "If you can't reach a million people with 0€ ad spend, your branding sucks." with the exact lead "We will 10x your social presence or work for free until it's done." beneath it, an animated brand lettermark assembled from twelve individual original letterform images, and case thumbnails that continuously drift upward on the left and right edges
- The statement section shows the H2 lead "Content only you can post because it's built around your people." over a dark media band
- The client deck is a centered carousel of five fictional client cards — Loom House, Second Circle, New Current, Roadkind, and Motive Lab — each card carrying a client title with a newly drawn client mark, a Show case control, a stacked flick-card deck of short vertical videos, and two live stat tiles labelled Organic views and Likes
- Each client's flick-card deck has Previous and Next controls that reshuffle the stacked cards, and only the front card's video player is ever interactive
- The Organic views and Likes counters begin below their seeded totals and tick upward on their own shortly after load, formatting large numbers with a space as the thousands separator (for example 2 148 665)
- The active client card embeds a custom video player with a big play control, a play/pause button, a mute button, a fullscreen button, a draggable timeline with elapsed and total time, and likes/views captions
- The services section shows a stacked trio — Organic content, Ads for social, and Training — each with its own number, heading, description, background video, and its own call-to-action button; scrolling through the pinned section throws the top card away to reveal the next
- The testimonials section is a rotator of at least five client quotes with the client's name and role; advancing shows the next quote with its author details, and the current-position indicator updates
- The about/self-esteem band shows the H2 "Does your brand have self-esteem issues?" with supporting copy and two call-to-action controls over a dark media band with flanking images
- The call-to-action block shows the H2 "Ready to work with us?" with two choice cards: "We'll call you" (which opens the contact form) and "Contact us"
- Choosing "We'll call you" opens a contact popup containing an email field, an optional phone field, and a Privacy Policy agreement checkbox (terms); the submission is posted to a local endpoint only — never to an external form service
- Contact lead request-body field contract (a successful submit record IS the would-be request body): required email (trimmed string at most 254 characters with exactly one @ and a dotted domain), optional phone (null/empty or at most 40 characters of digits, spaces, +, -, (, )), required terms (boolean true). Cross-field: empty or invalid email, terms false, or phone outside bounds keeps the popup open, shows named inline errors naming the field and the fix, shows no Thanks for your submission!, and does not write contactEmail into the discovery brief
- A cookie consent banner appears shortly after load with an Accept action and a preferences path exposing four categories — Essential (required, locked on), Marketing, Analytics, and Personalization
- Cookie consent request-body field contract (Accept and a valid preferences save each produce a cookieCategories object that IS the would-be consent payload): required keys essential, marketing, analytics, and personalization as booleans; essential must be true (locked on — it cannot be turned off). Accept writes all four true and dismisses the banner. A valid preferences save writes the four booleans as toggled and dismisses the banner. essential false, a missing key, or a non-boolean value keeps preferences open, shows named field errors, leaves the banner visible, and leaves discovery-brief cookieCategories unchanged
- Each of the five client cards exposes a Shortlist control; shortlisting a client raises a fixed-nav shortlist count, marks that control active, and lists the client title in a Shortlist panel; removing a title from the panel drops the count and clears only that client's control; shortlisting the same client twice does not duplicate the title or inflate the count; Undo reverses the most recent shortlist or cookie-category mutation and Redo reapplies it
- An Export brief control opens a discovery brief panel with JSON and Markdown tabs, Download, Copy, and Import. The live JSON compiles from the in-memory session store and rewrites when shortlist, locale, cookie categories, carousel, flick decks, counters, testimonials, or contact state change — without a reload
- Discovery brief JSON field contract (Download JSON, Copy, and Import share this schema — an export that omits session work is invalid): required top-level keys schemaVersion (number exactly 1), brand (exactly Cinder & Bloom), shortlistedClients (array of distinct client titles from Loom House, Second Circle, New Current, Roadkind, Motive Lab), activeClient (one of those five titles), flickIndexByClient (object with all five client titles as keys and non-negative integer indices), locale (exactly en or fi), cookieCategories (object with required boolean keys essential, marketing, analytics, personalization and essential true), contactSubmitted (boolean), contactEmail (null when contactSubmitted is false; equal to the submitted contact lead email when contactSubmitted is true), activeOrganicViews (string), activeLikes (string), and testimonialIndex (non-negative integer). The Markdown tab is headed Discovery brief — Cinder & Bloom and summarizes the same session values. Cross-field: when contactSubmitted is false, contactEmail must be null; when contactSubmitted is true, contactEmail must equal the lead email; cookieCategories.essential must be true
- Download offers the live JSON file whose text matches the visible JSON tab; Copy writes the exact visible tab text to the clipboard and shows a brief copied confirmation that reverts after a moment. Import (paste or file, mode discovery-brief) accepts a schema-conforming discovery brief and restores shortlistedClients, locale, cookie toggles (essential stays on), centered activeClient, and flickIndexByClient together; malformed JSON or a non-conforming payload (missing required keys, schemaVersion not 1, locale outside en/fi, broken contactSubmitted/contactEmail pairing, cookieCategories.essential false, or shortlistedClients membership outside the five titles) shows a visible import error naming the problem and leaves shortlist, locale, cookie, carousel, and flick state unchanged
- Pressing Ctrl+K (Cmd+K on macOS) opens a command palette with a focused search input; choosing Export brief opens the discovery brief panel and closes the palette; choosing Jump to services scrolls to the services trio without leaving /; Escape or backdrop click closes the palette
- The footer fills at least the viewport height, re-assembles the Cinder & Bloom lettermark from its twelve individual original letterforms, and lists a sitemap, Podcast links (Audio, Video, Episodes), Social links (Photos, Clips, Community), legal links, and a fictional designer credit line
- No in-app control performs a real outbound navigation or full page reload; every nav link, locale option, case/service/about link, and social/legal/sitemap link that has no in-scope destination is present and clickable but non-navigating chrome that leaves the user on /
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Contact flow: choosing "We'll call you" opens the contact popup; submitting a payload that passes the contact lead field contract reveals the form's own success state ("Thanks for your submission!") in place of the fields while the rest of the page — the carousel position and the ticking counters — is unaffected; the submission goes only to the local endpoint; Export brief then shows contactSubmitted true with contactEmail equal to that lead email
- Flick-deck flow: clicking a client deck's Next control elastically reshuffles the stacked cards, promotes a new card to the active/front position, updates each card's visible status, and leaves only the new front card's video player interactive; clicking Previous restores the prior front card the same way, and the other four clients' decks are untouched throughout
- Client-carousel flow: advancing the client carousel centers a new client card at full scale while its neighbors shrink; the newly centered client's deck controls and stat tiles become the active ones, and paging back re-centers the previous client in the same state it was left in
- Locale flow: clicking the locale dropdown opens a small EN / FI list; choosing FI updates the dropdown's visible label to FI and choosing EN returns it to EN, all without leaving the homepage or triggering a reload, and the page copy stays English throughout
- Playback flow: pressing play on the front card's player starts the video and the elapsed time begins advancing; pausing halts the elapsed time; dragging the timeline seeks the video and the elapsed readout matches the new position immediately
- Cookie flow: the consent banner appears shortly after load; opening preferences shows the four categories with Essential locked on; Accept writes cookieCategories all true and dismisses the banner; on a fresh load, saving preferences with Marketing off writes marketing false with essential true; a full page reload returns the page to its seeded state and the banner appears again
- Shortlist flow: shortlisting Loom House raises the nav count from 0 to 1; shortlisting Second Circle raises it to 2; the Shortlist panel lists both; removing Loom House drops the count to 1 and clears only Loom House while Second Circle stays shortlisted
- Discovery brief export flow: after shortlisting at least one client, setting locale to FI, saving a cookie preferences payload with Marketing off, advancing the carousel, and completing a valid contact submit under the contact field contract, Export brief JSON satisfies the Discovery brief field contract (schemaVersion 1) and matches those session facts including cookieCategories and contactEmail; Download and Copy emit that exact text
- Discovery brief round-trip flow: export a brief with a non-empty shortlist and FI locale, clear the shortlist and return locale to EN, Import that JSON, and confirm nav count, Shortlist controls, locale label, cookie toggles, centered client, and flick indices restore to the exported brief values
- Command palette flow: Ctrl+K opens the palette; confirming Export brief opens the discovery brief panel; Jump to services scrolls to the services trio without leaving /
- Undo flow: shortlist Loom House then Undo clears it; Redo restores it; Marketing off then Undo restores Marketing without altering the shortlist
- Cookie validation flow: open preferences and force an invalid draft (essential false or a missing boolean category); saving keeps preferences open, shows named field errors, leaves the banner visible, and leaves discovery-brief cookieCategories unchanged
</user_flows>

<edge_cases>
- Submitting the contact form with an empty or invalid email, with terms unchecked, or with a phone value outside the phone field contract does not reveal Thanks for your submission!, marks and names the offending field while the popup stays open, and never sets discovery-brief contactSubmitted true or writes a contactEmail
- A contact submission attempted within the first few seconds after load is silently ignored as anti-spam: no success state appears and no request is sent
- Only the front flick card's video player responds to input; the partially visible rear cards never start playback
- Every client deck has at least three distinct local VP9 WebM/poster pairs, and all five client marks are newly authored; no video is reused across different client identities and no slot references a nonexistent file or shows a broken-media indicator
- Advancing the testimonials rotator repeatedly cycles through all quotes and the current-position indicator always matches the visible quote
- Opening Export brief with an empty shortlist still produces valid JSON whose schemaVersion is 1, shortlistedClients is an empty array, and other keys satisfy the Discovery brief JSON field contract for the live session, without crash or placeholder text
- Importing a malformed or schema-invalid discovery-brief JSON (missing schemaVersion, brand, or shortlistedClients; schemaVersion not 1; locale outside en/fi; broken contactSubmitted/contactEmail pairing; cookieCategories.essential false; or shortlistedClients membership outside the five titles) leaves shortlist count, locale, cookie toggles, carousel, and flick decks unchanged and shows an inline import error naming the problem
- On a fresh load with empty undo/redo stacks, Undo and Redo do nothing visible: shortlist count stays 0 and cookie categories stay at seeded defaults
- Activating Shortlist twice on the same client does not duplicate that title in shortlistedClients or inflate the nav count past the number of distinct shortlisted clients
- Opening cookie preferences and dismissing without saving leaves the banner visible with Accept still operable and does not write a consent payload into cookieCategories
- Essential cannot be turned off in cookie preferences; attempting to toggle it leaves it on, and a save that would set essential false is rejected with a named field error
- A failed empty or invalid contact submit followed immediately by a valid submit under the contact field contract reveals success exactly once — the invalid attempt never sets contactSubmitted true or writes contactEmail into the discovery brief
</edge_cases>

<visual_design>
- Complete debranding is part of the visible design: only Cinder & Bloom and the five fictional clients may appear. Source agency/client names, source letter shapes or logos, social-service marks, identifiable people, recognizable case footage, licensed typefaces, and real designer credits are prohibited even inside video frames, image pixels, SVGs, metadata rendered in the UI, or tiny footer text.
- Editorial, high-contrast agency aesthetic: the home body default surface renders off-white rgb(234, 233, 230) (#eae9e6) with near-black rgb(24, 24, 24) (#181818) text, and dark media bands, lime, turquoise, chrome-metallic, and dark-grey theme surfaces swap per section as the page scrolls
- Color scarcity on this brand (not a lime-everywhere theme): lime rgb(236, 253, 173) is reserved for the Organic views tile, theme-media headings, text selection, primary button fills, and the page-load veil; turquoise rgb(63, 174, 134) is reserved for the Training service card and primary-button hover fills; red rgb(255, 69, 69) appears only as the nav link dot; chrome-metallic is reserved for the Likes tile, contact popup, and footer theme
- The statement and about bands (theme-media) render black rgb(24, 24, 24) with lime rgb(236, 253, 173) (#ecfdad) headings; the footer (theme-chrome) renders a dark-grey rgb(43, 43, 43) (#2b2b2b) base with white text
- Three-tier design tokens drive surfaces: raw swatches (lime, turquoise, black, off-white, red, dark-grey) resolve into per-theme role tokens (background, body-text, heading, button fills) that sections and chrome consume — swapping a section theme recolors its role tokens from the same swatch set rather than inventing one-off hex values
- Oversized editorial display headings render in the bundled open-license editorial display face at weight 400 (hero H1 about 62.8px at 1440 with a tight ~0.9em line-height and negative letter-spacing; statement and about H2 about 57.6px to 84px depending on tier), paired with the bundled open-license grotesque at weight 500 for body, eyebrow, and nav text (paragraph-m about 15.7px, nav links about 13.1px at 1440); both faces resolve from self-hosted files; Inter is used only for ancillary UI and cookie-consent copy; no external font requests
- Fluid, viewport-bound type scaling via a clamp-based root size: the body font-size resolves to about 10.5px at 1440 and scales continuously with viewport width (about 16px near 991 and below), so headline and body px grow and shrink smoothly across breakpoints rather than snapping at fixed sizes
- Broken-grid editorial composition: the hero places a full-width lettermark along the top edge, centers the H1 and lead toward the lower third, and lets case thumbnails drift through left and right zones that cross the headline plane; the about band overlays large display type on a media field with flanking images that break the content column; spacing and offsets stay on a consistent fluid em baseline (multiples of 0.5em / 1em / 2em / 8em that track the root size, equivalent to a 4/8px discipline at the measured root)
- The client deck cards are dense: a newly authored fictional client mark and title, a stacked flick deck of vertical video cards, caption chips (age and view count), and two stat tiles — a lime Organic views tile and a chrome Likes tile with a metallic heart
- The services trio uses full-bleed card faces in contrasting themes (lime, white, turquoise) with large index numbers and background video
- The contact popup uses a chrome-metallic panel with floating-label fields; the cookie banner uses a dark theme
- Shortlist controls, the Shortlist panel, Export brief chrome, the discovery brief panel, and the command palette use the page's token-driven editorial surfaces (off-white/near-black or chrome/dark cookie language) rather than unstyled browser-default dialog chrome that breaks the Cinder & Bloom system
- Text selection shows a lime-on-black highlight; scrollbars are hidden; buttons reset their native chrome
- Replacement-asset craft is mandatory. Create or generate roughly from scratch inside /app: twelve separate Cinder & Bloom letterform images; at least four distinct drifting hero case thumbnails; five different fictional client marks; at least three short vertical VP9 WebM/poster pairs per client deck; three distinct service-background VP9 WebM/poster pairs; five testimonial author portraits or marks; two flanking about-band images; contact/footer decorative artwork; and every utility icon. Each asset must be purposeful, nonempty, and visibly used; gradients, emoji, repeated thumbnails, plain typed names posing as logos, or omitted media do not count.
- The broken-grid hero, drifting edge thumbnails, dense stacked flick deck, pinned three-card services throw, and flanking-image about band must retain their reference-true asymmetry on a fluid 4/8px-equivalent baseline. Display sizes use rem-bounded clamp() formulas with viewport-relative preferred values, and split/letter-assembled headings preserve the full phrase as the parent's accessible name while fragments are aria-hidden.
</visual_design>

<motion>
- Signature interaction (scroll storytelling): scrolling through the pinned services region throws the top service card away with rotation to reveal the next card in the Organic content / Ads for social / Training trio, driven by real scroll progress; scrolling back reverses the throw sequence
- On a fresh load a lime page-load veil covers the hero then lifts to reveal it in one timeline with the brand lettermark rising into place letter by letter and the nav settling in — intro stages are orchestrated together rather than firing as unrelated tweens
- Headings and paragraphs reveal with a line-by-line upward mask wipe (each line rising from fully below its mask to its resting position) the first time each element scrolls to about 80% of the viewport, and stay revealed; headings run 0.8s with a 0.08s per-line stagger and paragraphs 0.6s with a 0.04s stagger, both with a pronounced ease-out
- Desktop smooth scrolling (768px and wider) stays synchronized with scroll-triggered motion: line reveals, the pinned services throw, nav theme sync, and parallax keep locked to scroll position without visible lag or desync as the page settles
- The nav's theme class swaps to match whichever section sits under a small sample point near the top of the viewport as the page scrolls, recoloring the nav in step with the section beneath it
- Nav link dots scale up from nothing on hover and for the current link with a slight overshoot, running transform over 0.525s with the back-ish easing cubic-bezier(0.175, 0.885, 0.32, 1.275)
- Hovering a primary button (fine-pointer devices) slides its label upward, rotates its icon backing, translates its arrow across, and wipes the button background; each animated target transitions transform over 0.525s with the primary-motion easing cubic-bezier(0.625, 0.05, 0, 1)
- Clicking a client deck's Next or Previous control animates the stacked flick cards to new offset/rotation/scale positions per the flick coordinate table (active 0/1 scale, +/-1 at +/-25% and +/-10deg scale 0.9, +/-2 at +/-45% and +/-15deg scale 0.8) with an elastic, springy overshoot settle running about 0.6s, and the active card's caption chips slide up into view
- Signature interactive motion uses inertial or springy easing (button primary-motion curve, nav-dot back ease, flick elastic settle, CTA-card inertia throws) — those gestures do not start and stop on purely linear tweens
- Reduced motion: under prefers-reduced-motion, smooth scrolling, drifting thumbnails, autoplaying decorative video, marquee motion, and pinned throw transforms stop; every card, heading, control, and form remains visible and operable in its settled state.
- The client carousel keeps the active slide at scale(1) and shrinks neighboring slides to scale(0.94), transitioning over roughly 600ms
- Hero case thumbnails drift on continuous 12–15 second bottom-to-top loops in left and right zones, fading in at the start and out near the top of each loop
- The Organic views and Likes counters tick upward continuously beginning about half a second after load
- The custom video player's interface fades and lifts out of view while playing and returns on hover, transitioning over 0.6s with the primary-motion easing cubic-bezier(0.625, 0.05, 0, 1), with a paused/hover dark overlay
- Eligible cards throw with momentum/inertia when the pointer enters and leaves them (desktop fine-pointer only)
- The cookie banner eases into view shortly after load; the mobile lime menu slides in from the top when opened
- On the real UI path, the command palette and discovery brief panel enter and exit with a brief opacity/scale transition; the Copy confirmation appears briefly then reverts
- Hover feedback is required on interactive chrome: buttons, nav links, locale options, form controls (focus ring), Shortlist controls, Export brief, and carousel controls all give a visible hover/focus response
- The footer's brand lettermark animates its individual letters into place
</motion>

<responsiveness>
- Smooth (inertial) scrolling is active on viewports 768px and wider and is disabled below 768px, where native scrolling applies; below 768px touch scrolling keeps native platform physics and is not hijacked
- On narrow viewports (about 479px and below) the centered nav links are replaced by a hamburger button; tapping it opens a full-screen lime menu and locks page scrolling until it is closed
- The fluid type scale tracks the viewport: the hero H1 measures about 62.8px at 1440, 76px at 991, 60px at 767, and 52px at 479, with no abrupt size jumps between breakpoints; at about 479px the hero re-composes (lettermark and content stack tighter) rather than merely shrinking a desktop layout
- On wide and tablet viewports the full centered nav is shown; below roughly 479px the type scale tightens alongside the hamburger navigation
- No content clips or overflows the viewport and no horizontal scrollbar appears at 1440, 768, or 479 widths
- At about 479 width, the command palette, Shortlist panel, and discovery brief panel stay fully visible and operable without rendering off-screen or requiring page-level horizontal scroll; Download, Copy, Import, Undo, and Redo remain tappable without clipping
</responsiveness>

<accessibility>
- Markup stays HTML-first: landmarks (nav, main, footer), real headings, buttons, and labelled form controls — interactive chrome is not anonymous divs without roles
- Every interactive control — nav links, locale options, deck and carousel controls, video player buttons, form fields, cookie banner actions, Shortlist controls, Export brief, Download, Copy, Import, Undo, Redo, and command palette items — is reachable and operable with the keyboard alone, and buttons reveal a visible focus outline on keyboard focus
- Text and control labels meet WCAG AA contrast against their surfaces, including lime headings on black media bands, near-black body on off-white, and white text on dark-grey/chrome footer and cookie surfaces
- The contact popup behaves as a modal dialog: focus moves into it when opened, stays trapped while it is open, and returns to the triggering control when it closes
- Contact form validation errors and the success state are exposed to assistive technology as well as shown visually; cookie preference validation errors are likewise announced through a polite live region
- The command palette, Shortlist panel, and discovery brief panel behave as dialogs: focus moves in on open, stays trapped while open, returns to the trigger on close, and Escape dismisses each
- Shortlist controls, Export brief, Download, Copy, Import, Undo, and Redo are reachable and operable with the keyboard alone and show a visible focus outline
- Split and letter-assembled headings keep their full text accessible: split heading containers carry the complete phrase as an accessible name while per-line fragments are hidden from the accessibility tree, and the brand lettermark carries an accessible label reading Cinder & Bloom with per-letter fragments hidden or decorative
- The video player's play/pause, mute, fullscreen, and timeline controls carry accessible labels
- While the mobile full-screen menu is open, background scrolling stays locked and the menu can be closed from the keyboard
</accessibility>

<performance>
- The page is interactive within 2 seconds of a local cold load; hero content appears without waiting for below-the-fold video to load
- No console errors or warnings appear on load or during a full scroll-through, deck, carousel, form, player, cookie-banner, shortlist, discovery-brief, and command-palette exercise
- No visible layout shift occurs as fonts, images, or videos finish loading; media regions reserve their space from first paint
- Continuous scrolling from top to bottom holds a smooth frame rate through the pinned services throw, the line reveals, the thumbnail drift loops, and the ticking counters
- Opening the command palette, regenerating the discovery brief after shortlist and contact mutations, and rapid Undo/Redo never freeze the page or drop chrome responsiveness
</performance>

<writing>
- All mandated copy strings render exactly as specified, including Cinder & Bloom wherever the fictional agency name appears; no lorem ipsum, TODO, or template placeholder text appears anywhere on the page
- Headings, buttons, and captions keep the reference's casing and terminology consistently across sections
- The footer designer credit uses an invented generic name and does not credit the reference site's real designer or agency; placeholder client marks do not reproduce real third-party logos
- Shortlist, export, palette, and undo chrome labels stay specific (Shortlist, Export brief, Download, Copy, Import, Undo, Redo, Discovery brief) rather than generic Submit/OK alone
- The Markdown discovery brief tab heading reads Discovery brief — Cinder & Bloom
- Contact and cookie preference validation errors name the problem field (email, phone, terms/Privacy Policy, essential, marketing, analytics, or personalization) and the rule rather than only saying Invalid
</writing>

<innovation>
Optional enhancements that are not required to pass: coachmarks for first-time Shortlist use, keyboard shortcut hints inside the command palette, or richer Discovery brief Markdown styling. Do not substitute these for the required contact lead, cookie consent, and Discovery brief field contracts, Export brief Download/Copy/Import round-trip, or undo/redo behaviors above.
</innovation>

<requirements>
- Copyright and rights-clearance prohibition: apart from required npm dependency code and explicitly specified open-license fonts or generic utility icons used under their licenses, every creative asset and every piece of visible editorial copy must be newly authored or generated specifically for this fictional build. Do not use scraped, stock, press, social-media, portfolio, source-site, screenshot-derived, copyrighted, trademarked, or otherwise third-party-controlled creative material, and do not make a trace, near-copy, style-identical imitation, or recognizable derivative of it. This applies to raster pixels, individual video frames and audio, SVG paths, canvas/WebGL/Rive artboards and textures, 3D geometry/materials/HDR environments, PDFs, icon/mark silhouettes, metadata, filenames, alt text, and hidden/preloaded assets. If provenance is uncertain, create a fresh fictional replacement.
Stack: build the homepage with Astro, Tailwind CSS 4.3.2 through @tailwindcss/vite (design tokens in the theme layer), and DaisyUI for base chrome (buttons, form controls, dropdown and modal primitives, restyled by the page's own tokens). Animation runtime: GSAP with ScrollTrigger, SplitText, and InertiaPlugin, Lenis for the desktop smooth scroll, and Swiper for the client-deck carousel; no other animation libraries. Icons are bundled original SVGs or the Iconify Tailwind plugin; no icon CDN. The contact form, cookie preferences, and Import brief surfaces validate through Zod schemas that mirror the API-shaped contact lead, cookie consent, and Discovery brief JSON field contracts above: inline per-field errors name the field, a successful contact submit record IS the would-be request body, Accept/preferences save writes the cookieCategories request body, and Download/Copy/Import validate through the same Discovery brief schema. End-state contract: Download and Copy MUST emit the session's actual discovery brief under that field contract — an export that omits session work is invalid; Import of a previously exported conforming brief MUST restore the same visible shortlist, locale, cookie toggles, centered client, and flick indices (round-trip); Import MUST reject non-conforming JSON without mutating the current session. All libraries are installed via npm and bundled locally; do not load any font, image, video, or script from an external CDN — the build must run fully offline.
Author or generate every letterform, client mark, portrait, photograph, video, poster, texture, and decorative file as a new Cinder & Bloom replacement inside /app, matching the reference's counts, placements, dimensions, aspect ratios, and layer counts. Do not copy, derive, trace, recolor, rename, transcode, or redistribute a source-site, screenshot, or reference-bundle file, and do not omit a surface because its source cannot be reused. In place of the reference's licensed editorial serif and grotesque, self-host an open-license editorial display face of similar width and contrast at weight 400 and an open-license grotesque at weight 500, plus Inter for ancillary UI and cookie-consent copy.
Delivery and behavioral contracts:
- package.json must define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the build succeeds); the homepage must be served on port 3000 and / must return HTTP 200
- The contact form must POST to a local API route within the app and reveal the app's own success state on success; it must never call an external form endpoint
- Video must be served locally with HTTP range support (206 Partial Content) so the player timeline can seek and scrub
- Domain state lives in in-memory client state only: the locale label, the active flick-deck index per client, the client carousel position, the contact form's validation and success state, the cookie consent visibility and category toggles, the live counters, the active video's play/seek state, the nav's per-section theme, the mobile menu open/scroll-lock state, the shortlist set and nav count, the discovery brief live preview text, the command palette open/query state, and the undo/redo stacks. Mutating shortlist, locale, cookies, carousel, flick decks, or contact updates the Export brief JSON without a reload; a full page reload coherently resets shortlist to empty, locale to EN, cookie banner to seeded visibility, and empty undo/redo — never a mixed partial survival. Do not use localStorage, sessionStorage, or any other browser storage API; session work survives through Download / Copy / Import and the WebMCP artifact and form surfaces
- Homepage-only scope in English only: implement the single route /; other nav destinations, case/service/about targets, and the /fi locale are present as clickable chrome with no working destination page — the locale dropdown updates its label but choosing FI must not navigate away from /, and no second marketing page is built
- Express colors as three-tier CSS custom properties (swatch tokens, theme role tokens, component consumption) so section theme swaps recolor through shared tokens rather than scattered literal hex
- Seed the five client decks, the services trio, at least five testimonials, the about band, and the four cookie categories so every section is non-empty on first load
- The counters must animate upward from below their seeded totals; the flick deck must reshuffle only via its Previous/Next (or card) controls; the carousel must keep exactly one centered active slide
- Ship newly drawn marks for all five fictional clients and enough authored video/poster pairs to keep at least three deck faces per client visually distinct; do not recycle one or two clips across every slot
- No backend beyond the local contact endpoint, and no authentication; all navigation stays on the homepage with no full page reloads and no outbound navigation from chrome links
- This is a pixel-fidelity build: match exactly the computed theme colors (lime #ecfdad, turquoise #3fae86, red #ff4545, near-black #181818, off-white #eae9e6, dark-grey #2b2b2b), all verbatim copy (including the hero lead), the section order (hero, statement, client deck, services, testimonials, about/self-esteem, CTA, footer), the theme-per-section mapping, the breakpoint behaviors (hamburger only at 479 and below; smooth scroll 768 and up), the flick coordinate table, the carousel scale ratio (1 / 0.94), and the bundled faces' weights and type tiers. Font antialiasing, exact px at odd viewports (the fluid type scale makes px viewport-dependent), subpixel positions, and the deterministic-but-looping hero thumbnail positions only need to match closely
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
- Browsable entity: clients
- Destinations: hero; statement; client; services; testimonials; about; cta; footer
- Locales: en; fi
- Form fields: email; phone; terms; essential; marketing; analytics; personalization
- Form operations: validate; submit; cancel; reset
- Session operations: start; pause; resume; stop
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: discovery-brief
- Value bounds: {"email":"required non-empty email with local@domain.tld shape","phone":"optional; null/empty or <=40 chars of digits spaces + - ( )","terms":"required boolean true","essential":"required boolean true (locked on)","marketing":"boolean","analytics":"boolean","personalization":"boolean"}

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
- Command palette open/close transition stays Playwright-only
- Discovery-brief download bytes and clipboard contents stay Playwright-only per artifact-transfer restrictions

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
