<summary>
Build a fully fictional Canvasly design-tool marketing homepage using Astro with React islands, Nanostores, Tailwind CSS 4.3.2, and Radix UI, preserving the reference's playful composition and motion without its product identity or proprietary media.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate their composition, proportions, density, and motion. Any source
product/company name, wordmark, licensed typeface, thumbnail, photograph, or
video is composition-only reference material and must be replaced by the
fictional Canvasly system below. Do not copy, crop, trace, recolor, rename, or
ship screenshot pixels or source-site files.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- This task is a single-page homepage only: on load the app renders one uninterrupted vertical homepage at route "/" with a sticky white header at the top, and the sections appear in this exact order: an oversized hero, a workflow section with four feature cards and a rotating slideshow, a "Teams of all sizes" use-case tile section, a dark support band, a traveling use-case marquee, a closing call-to-action that embeds the trial brief builder, and a multi-column footer. No Pricing, Examples, Templates, Learn, Join, Login, About, or other secondary routes are built or graded.
- The sticky header stays fixed to the top of the viewport on scroll and shows an original placeholder wordmark in the logo position on the left (the wordmark swaps to a distinct hover mark on hover), a primary navigation group with a Solutions control plus Pricing, Examples, Templates, and Learn links, and account actions on the right: a "Log in" text link and a "Sign up" pill button.
- Header, footer, CTA, tile, and Solutions-menu chrome links look and behave like real navigation, but they must keep the user on the homepage (same-page hash targets to homepage sections are fine); activating them must never land on a blank, error, or "Not found" page, and secondary destinations must never be promoted into separate features.
- The Solutions control is a real keyboard-operable menu trigger, not a decorative link: clicking it (or pressing Enter/Space while focused) opens a menu listing Portfolios, Presentations, Editorials, Companies, Freelancers, and Students; pressing Escape closes it and returns focus to the trigger; clicking outside also closes it.
- The hero shows three animated marquee gallery rows of newly authored fictional project thumbnails scrolling continuously across the top, the dominant headline "Design and launch outstanding websites", the subtitle "Design, prototype, collaborate, publish.", and a CTA pair: a dark "Try Canvasly" pill button followed by an underlined "or choose your subscription plan" link.
- The hero also contains a floating media card (rounded, shadowed, gently tilting) on the right playing an original local placeholder clip, and an oversized playful accent cluster reading "Hello!" in orange followed by "Ready" and "?" in purple.
- The workflow section opens with the heading "Enjoy easy workflow" and an intro paragraph about the drag-and-drop interface, then presents four feature cards that reveal on scroll (fade and rise into place, staggered) with these exact titles and bodies: "Enjoy easy workflow" ("The intuitive drag-and-drop interface gives you everything you need. Designers can switch to Canvasly seamlessly, and marketers quickly get used to it."), "Streamline teamwork" ("Collaborate in real time — comment, iterate, and ship without leaving the canvas."), "Attract with interactivity" ("Scroll animations, hover states, custom cursors, video, and vector motion — built into the Viewer."), and "Expand functionality to infinity" ("Integrate embeds, forms, e-commerce, analytics, and code snippets when you need them.").
- Below the cards a horizontal six-image project slideshow of original placeholder frames advances on its own every 2200ms: the active frame is fully opaque and its neighbors sit at 0.35 opacity, and the opacity changes with a 0.35s ease-in-out transition as the active frame moves along.
- The use-case section shows the heading "Teams of all sizes create websites with Canvasly" and six rounded, color-coded tiles with white text, each a link, in this order and these labels: Portfolios, Landing pages, Editorials, Company websites, Design studios, and by Canvasly team.
- The support band is a full-width dark #282828 panel with centered white text: the heading "Get the best support" and the sentence "Our agents offer around-the-clock support on business days and treat you with care." with "around-the-clock support on business days" emphasized in orange, plus an animated orange circular orb that travels along a curved path below the copy.
- A traveling use-case marquee row of oversized non-wrapping labels moves horizontally and cycles through Company websites, Landing pages, Editorials, Presentations, Design studios, and Portfolios.
- The closing call-to-action is centered with the heading "Try for free", the line "or choose your subscription plan", a dark "Try Canvasly" pill button, and an underlined "View pricing" link.
- The footer is a dark multi-column layout with four groups and these exact link labels: company (about, careers, reviews, terms of service, privacy policy, cookie policy); product (pricing, templates, product updates, affiliate program, referral program, npo discount); resources (examples, design almanac, design stories, help, forum, status, blog); solutions (portfolios, presentations, editorials, companies, freelancers, students). It ends with "© 2026 Canvasly Studio" and "support@canvasly.example".
- A 43px custom image cursor (original cursor art) follows the pointer on fine-pointer devices and swaps to a hover image when it is over links, buttons, role=button elements, hotspots, and animated hover elements; the cursor never captures pointer events (it is pointer-transparent so clicks pass through to the elements beneath it).
- The closing section embeds a trial brief panel headed "Build your Canvasly trial brief" with Name, Email, Plan (Free trial / Pro / Team), Team size (1 / 2-10 / 11-50 / 51+), multi-select interest chips (Portfolios, Presentations, Editorials, Companies, Freelancers, Students), Reset (returns the empty baseline — empty name/email strings, no plan, no team_size, empty interests, Submit disabled, success/error messages cleared — as one undoable mutation so Undo can restore the pre-Reset brief), Undo, Redo, Download JSON, Copy brief, Import brief, Load sample brief, and Submit trial brief. A monospaced live preview shows pretty-printed JSON and rewrites on every field edit without a reload.
- Trial-signup request-body field contract (the live preview, Download JSON, Copy brief, and Import share this schema — a valid submit record IS the would-be request body): exactly seven required top-level keys product, name, email, plan, team_size, interests, and generated_at (no extras). product is always exactly Canvasly. name is a trimmed string length 2–80 when valid else "". email has exactly one @ and a dotted domain segment when valid else "". plan is exactly Free trial, Pro, or Team when valid else "". team_size is exactly 1, 2-10, 11-50, or 51+ when valid else "". interests is an array of unique closed-list labels in chip order (or []). generated_at is an ISO-8601 timestamp that updates on mutation. Empty baseline uses "" scalars and [] interests with product Canvasly.
- Cross-field rules on every valid payload: Free trial requires team_size exactly 1 (interests may be empty); Team requires team_size one of 2-10, 11-50, or 51+; Pro or Team requires at least one interest label. While those rules fail, Submit trial brief stays disabled and named inline errors appear naming the field and the fix. A contract-valid Submit shows "Trial brief ready — download or copy your JSON above" via a polite live region without navigating away.
- Download JSON offers canvasly-trial-brief.json whose text matches the visible preview; Copy brief writes that exact preview text to the clipboard and shows a Copied confirmation that reverts after about 1.5 seconds. An export that omits the session's current brief values is invalid. Import brief (paste or file) accepts a schema-conforming payload and restores form + preview together; malformed JSON or a non-conforming payload shows a visible error naming the import problem and leaves the brief unchanged. Load sample brief (after confirm) loads name Avery Lane, email avery@studio.example, plan Pro, team_size 2-10, and interests Portfolios and Editorials into the form and preview.
- Pressing Ctrl/Cmd+K opens a command palette with a focused search input; choosing Jump to trial brief scrolls the trial brief panel into view and closes the palette; choosing Advance slideshow advances the six-frame slideshow one step with the same active/neighbor opacity treatment as the idle timer path; Escape or backdrop click closes the palette; opening the palette while Solutions is open closes Solutions first.
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Solutions menu flow: activating the Solutions trigger opens its panel with all six labels (Portfolios, Presentations, Editorials, Companies, Freelancers, Students) visible and the trigger's expanded state flipped on; pressing Escape closes the panel, restores the collapsed state, and returns focus to the trigger; clicking outside the open panel closes it without activating anything beneath; the cycle repeats cleanly any number of times with no orphaned panels.
- Mobile menu flow: narrowing the viewport to 768px hides the desktop navigation and the "Log in" link and shows a compact "Menu" button in the header; activating it opens a mobile menu panel listing the navigation and account links; dismissing the panel (or widening back to desktop width) removes it and the appropriate header layout returns, with the page's scroll position unchanged throughout.
- Slideshow flow: leaving the page idle advances the six-frame slideshow on its own timer every 2200ms — the newly active frame becomes fully opaque while its neighbors drop to 0.35 opacity — and after the sixth frame it wraps back to the first; the advancing continues without any manual control being touched.
- Scroll-reveal flow: on a fresh page load the four workflow feature cards start unrevealed; scrolling the workflow section into view fades and raises them into place with an 80ms stagger; they remain in their revealed resting state while scrolling onward; reloading the page restores the unrevealed starting state until the section is scrolled into view again.
- Zoom-to-fit flow: resizing the viewport from 1440px down to 390px continuously rescales the whole 1024px design artboard to fit the viewport width, the scroll wrapper's height tracks the scaled document height, and at every intermediate width the full design width stays visible with no horizontal scrollbar and no cropped right edge.
- Trial brief export flow: fill a contract-valid brief (e.g. Pro, team_size 11-50, at least one interest, name 2–80, dotted-domain email); confirm the live preview shows those seven keys with the session values; Download JSON or Copy brief emits that exact preview text; Submit shows the Trial brief ready message.
- Trial brief validation flow: enter an email without a dotted domain, or choose Free trial with team_size 2-10, or choose Pro with empty interests — Submit stays disabled, named field errors appear, and Download/Copy still emit the current (invalid or incomplete) preview without a success state.
- Trial brief round-trip flow: Download or Copy a contract-valid brief, Reset to empty baseline, Import that JSON, and confirm form values and a fresh preview reconstruct to match; then Undo restores the empty baseline.
</user_flows>

<edge_cases>
- Pressing Escape while the Solutions menu is closed and the command palette is closed does nothing: no error, no visual change, and focus stays where it was.
- The slideshow wraps seamlessly: advancing past the sixth frame returns to the first with the same opacity treatment (active 1.0, neighbors 0.35) and no blank or double-active frame across the wrap.
- Clicks pass through the custom cursor: clicking any link or button while the cursor image overlaps it activates the element beneath, never the cursor layer.
- On coarse-pointer devices the custom cursor is absent and the system cursor is fully visible; the system pointer is never hidden without a visible replacement.
- Reloading the page returns it to its initial state: menus closed, command palette closed, the slideshow back on its first frame, scroll-reveal sections unrevealed until scrolled into view, and the trial brief at the empty baseline preview (product Canvasly, empty name/email/plan/team_size strings, interests [], fresh generated_at) with empty undo/redo stacks.
- A name shorter than 2 characters after trim, a name longer than 80 characters, a malformed email (missing @, missing domain dot, or more than one @), a missing plan, or a missing team_size shows inline messages naming the offending field, keeps Submit trial brief disabled or unsuccessful, shows no Trial brief ready message, and does not clear valid fields; Download JSON and Copy brief still emit the current invalid preview with all seven required keys present.
- Choosing plan Free trial while team_size is 2-10, 11-50, or 51+ — or plan Team while team_size is 1 — or plan Pro or Team with zero interests — keeps Submit trial brief disabled, shows an inline message naming the conflicting field (team_size or interests), and never shows Trial brief ready until the cross-field rule is satisfied.
- Undo with an empty undo stack and Redo with an empty redo stack are disabled; activating them does nothing and produces no console errors.
- Importing a JSON file that fails the trial-signup field contract (missing required keys, product not Canvasly, name outside 2–80, malformed email, plan or team_size outside closed enums, interests with unknown or duplicate labels, or a cross-field violation) shows a visible import error naming the problem and leaves the current brief unchanged.
- After a valid Submit shows Trial brief ready (or after named field/import errors are visible), activating Reset clears those messages along with returning the form and preview to the empty baseline.
- Opening the command palette while the Solutions menu is open closes Solutions first; Escape closes the palette without also toggling Solutions open.
</edge_cases>

<visual_design>
- Complete debranding is visible and exhaustive: Canvasly is the only product/company identity. No source name, logo silhouette, project screenshot, customer artwork, social-service mark, licensed typeface, identifiable person, or source video frame may appear in DOM text, pixels, SVGs, metadata rendered in the UI, or footer details.
- Color (measured computed values in parentheses): the canvas and inverse text are #FFFFFF (rgb(255, 255, 255)); primary text and dark surfaces (including the support band and footer backgrounds) are #282828 (rgb(40, 40, 40)) with solid black rgba(0, 0, 0, 1) for the hero title; secondary text is rgba(0, 0, 0, 0.392) and #8C8C8C; neutral surfaces are #A2A2A2 and #F4F4F4; the primary orange is #FF6600 (rgb(255, 102, 0), used on Hello!, the support-band emphasis, and the orb) and the secondary orange is #EC520B; the Ready/? accent purple is #7A24FF (rgb(122, 36, 255)).
- Color scarcity: orange and purple are reserved accents — orange appears on Hello!, support emphasis, the orb, and primary-button hover; purple appears only on the Ready/? cluster; do not wash the page with orange or purple fills. The six use-case tile fills are categorical chip colors only, not general brand washes.
- Design tokens are declared in three tiers in Tailwind @theme (and used for the surfaces above): primitive color values (white, dark #282828, oranges, purple, tile hexes, neutrals), semantic type and spacing roles (display, section, body, utility; section padding and gaps), and component tokens (pill radii, media-card shadow, slideshow frame size, motion easing cubic-bezier(.56,.86,.59,1)).
- The six use-case tiles use these exact background colors (measured computed values in parentheses) with white text (computed rgb(255, 255, 255)), 16px radius, and 88px min-height: Portfolios #FF88BA (rgb(255, 136, 186)), Landing pages #FFCB00 (rgb(255, 203, 0)), Editorials #008BFF (rgb(0, 139, 255)), Company websites #A6A6A6 (rgb(166, 166, 166)), Design studios #4AAC54 (rgb(74, 172, 84)), and by Canvasly team #EC520B (rgb(236, 82, 11)).
- Muted underlines use linear-gradient(to right, rgba(0, 0, 0, 0.31) 0%, rgba(0, 0, 0, 0.31) 100%) 0 90% / 1px 2px repeat-x, and the active black underline uses the same pattern at 0 100% / 1px 1px.
- Typography: display copy renders in a bundled open-license grotesque display face (similar width and weight character to the reference's display type) and compact UI copy in an Inter stack; these two faces must stay visibly distinct. Measured type scale at the 1024px design: hero title 60px / computed line-height 54px (the 0.9 ratio) / -2px tracking / weight 400; closing title 60px / line-height 57px (0.95) / -2px tracking; section heading 40px / 38px / -1.8px; card heading 28px / 28px / -1px; large body 21px / 24px / -1px; standard body 18px / 20px / -0.8px; header/footer utility text 12px (nav line-height 14px, footer line-height 16px) at variable weight 550; primary button text Inter 14px at variable weight 550; the Hello!/Ready cluster renders about 132px. Fluid scaling comes from the 1024px artboard zoom-to-fit transform, not separate per-heading breakpoint jumps.
- Composition is intentionally asymmetric on a broken-grid baseline, not equal-width stacked blocks: the hero gallery band sits above a left-biased headline/CTA stack, the floating media card overlaps the right edge of the hero (absolute, about 380px wide, top offset about -36px), and the oversized Hello!/Ready/? cluster breaks the section rhythm below the CTA with tilted accents; section spacing and offsets align to a 4px baseline unit (28px horizontal padding, 96px section vertical padding, 120px closing padding, gaps of 16/32/48/56px).
- The design is composed on a 1024px-wide coordinate system. Cards and tiles use 10px to 24px corner radii.
- The floating hero media card uses a 24px radius and a 0 24px 80px rgba(0, 0, 0, 0.12) shadow. Slideshow frames are 276px by 180px with 12px radii.
- The header is a sticky white bar with a subtle hairline bottom border; primary and ghost buttons are dark #282828 pills; the support band and footer are dark #282828 surfaces with white and orange text.
- Replacement-asset craft is mandatory. Create or generate roughly from scratch inside /app: default and hover Canvasly wordmarks; enough distinct project artwork to fill all three hero marquee rows without obvious repetition; a playable floating-card VP9 WebM and matching poster; four feature-card illustrations; six different slideshow frames; six use-case tile graphics; the orange orb; default and hover custom-cursor images; a local social-share image; and every utility icon. Flat blocks, emoji, screenshots of the source product, repeated thumbnails, plain text posing as a mark, broken/transparent files, or omitted media do not count.
- The reference-true structure is a playful asymmetric full-width canvas: layered hero marquees behind oversized type, a floating tilted media card, broken-grid feature cards, the rotating six-frame project strip, and large whitespace held to a consistent baseline. Display type uses rem-bounded clamp() formulas with viewport-relative preferred values where the reference scales fluidly; split animated copy preserves the complete phrase on the parent accessible name while fragments are aria-hidden.
</visual_design>

<motion>
- Signature interaction: the homepage's memorable ambient signature is the trio of continuous offset-path hero gallery marquees plus the fine-pointer custom cursor follow/hover-swap and the gentle tilt accents on the floating media card and Ready/? cluster; scrolling the page never hijacks or traps the scrollbar — native document scrolling remains in control while the sticky header stays sticky.
- Scroll storytelling: scrolling the workflow section into view is the narrative beat that reveals the four feature cards (fade and rise, staggered); the cards stay settled while scrolling onward, and a fresh load restores the unrevealed start until that scroll beat fires again.
- Hero reveal timeline: the hero title, subtitle, and CTA row each rise upward from 24px and fade in over 0.8s (measured 800ms) with inertial easing cubic-bezier(.56,.86,.59,1), staggered with 0s, 0.08s, and 0.16s delays (measured 0 / 80 / 160ms) as one orchestrated intro timeline; the "Hello!" accent uses a 0.6s (measured 600ms) reveal of the same inertial kind. Reveal and card transitions must not use purely linear tweens.
- Feature-card reveal: the four feature cards animate opacity and translateY(28px) to their resting state via a transition measured as opacity 0.45s cubic-bezier(.56,.86,.59,1), transform 0.45s cubic-bezier(.56,.86,.59,1) when the workflow section scrolls into view, staggered by 80ms per card. This reveal must be triggered by scrolling the section into view, not shown pre-revealed.
- Hero gallery marquee: three rows of thumbnails travel along CSS offset-path motion paths and loop seamlessly and linearly (measured infinite linear durations 40s, 46s, 52s). The three rows end at 1496px, 1655px, and 1696px of offset-distance and follow the paths M 1489.01 109.5 C 1489.01 109.5 -6.995 109.5 -6.995 109.5, M 1649.5 80 C 1649.5 80 -5.5 80 -5.5 80, and M 1690.5 60.5 C 1690.5 60.5 -5.5 60.5 -5.5 60.5.
- Lower use-case marquee: the oversized label row follows path('M 0 40 L 2000 40'), travels from 0px to 1496px of offset-distance, and loops every 28 seconds linearly.
- Tilt accents animate from a zero transform to a tilted transform with ease-in-out and alternate: the floating hero media card tilts toward -6deg (translate about -8px/-15px) over 4.5 seconds, the orange/purple "Ready" accent tilts toward 6deg (translate about 8px/-16px) over 3.2 seconds, and the "?" mark tilts toward -6deg (translate about -6px/-6px) over 3.2 seconds.
- Support orb: an orange orb follows path('M 0 0 C 120 80, 240 -40, 480 60 S 820 20, 960 80'), traveling 1561px of offset-distance over 18 seconds linearly.
- Slideshow: the six-image project slideshow advances every 2200ms; the active slide is opacity 1.0, its neighbors are 0.35, and the change animates with opacity 0.35s ease-in-out. This must advance on its own timer (letting it run advances it), not only on a manual control.
- Hover feedback (required): buttons lift by 1 to 2px and shift their background from #282828 to orange on hover; the use-case tiles rotate -2deg and scale to 1.02 on hover; nav and footer links shift their underline/opacity on hover; the header wordmark swaps to its hover mark. These hover states must be reachable by hovering the real control.
- The Solutions menu panel, the mobile menu panel, and the command palette each enter with a short fade-and-settle transition and leave cleanly; opening and closing never snaps content elsewhere on the page.
- Trial brief feedback: the live preview text updates immediately as fields change; the Copy brief confirmation (Copied) fades in and reverts after about 1.5 seconds; interest chips toggle with a short selected-state transition rather than snapping only.
- Custom cursor: the 43px cursor follows fine pointers, swaps to its hover image over interactive elements, and uses pointer-events: none.
- Reduced motion: under prefers-reduced-motion: reduce, all offset-path travel, tilt, and reveal animation stops, every section shows in its final resting state (fully visible and correctly placed), and the system cursor is restored (the custom cursor is disabled); palette and menu enter transitions may shorten or skip while remaining operable.
</motion>

<responsiveness>
- Zoom-to-fit is the responsive model: the homepage is a 1024px-wide design artboard that scales down to the viewport instead of cropping. At 1440px the artboard's computed transform is none (scale 1); at 390px the measured transform is matrix(0.380859, 0, 0, 0.380859, 0, 0) (390/1024); the scaled layers stay unclipped so the entire design width is visible at 768px and at 390px, and no unintended horizontal scrollbar appears at any width.
- On viewports 768px and narrower the desktop navigation and the account "Log in" link are hidden and a compact "Menu" button appears in the header; activating it opens a mobile menu panel listing the navigation and account links.
- At 768px and below the floating hero media card is hidden, the feature cards stack in one column, the use-case tiles form two columns, and the footer collapses to two columns, with the header, CTA, trial brief panel, and command palette remaining usable without horizontal scrolling.
- At coarse-pointer sizes the system cursor is used (the custom cursor is disabled) and the system pointer is never hidden.
- The trial brief panel stacks fields above the preview at 768px and below; Download JSON, Copy brief, Import brief, Reset, Undo, and Redo remain visible and tappable without clipping.
</responsiveness>

<accessibility>
- The page uses semantic header, nav, main, section, article, and footer landmarks with one page-level heading and ordered section headings.
- The Solutions control is a button with the accessible name "Solutions menu", aria-haspopup="menu", aria-controls pointing at its panel, and aria-expanded that flips to true when the menu opens and back to false when it closes; focus order through the header and menu is logical and Escape closes the open menu.
- Every interactive item is a real link or button with a visible keyboard focus indicator and a useful accessible name; the slideshow region carries an accessible label.
- The floating hero art, the path-traveling orb, the marquee decoration, and the custom cursor are marked aria-hidden, and the cursor keeps pointer-events: none.
- Text meets WCAG AA contrast on the white canvas and on the dark support-band and footer surfaces, including the orange emphasis text.
- The command palette uses role dialog with aria-modal true, traps focus while open, closes on Escape, and returns focus to the control that opened it; the search input has an accessible name such as Search commands.
- Trial brief fields use explicit labels for Name, Email, Plan, Team size, and Interests; Reset, Download JSON, Copy brief, Import brief, and Submit trial brief are real buttons with accessible names; validation errors and the Trial brief ready message are announced through a polite live region as well as shown visually; Undo and Redo expose disabled state to assistive technology when their stacks are empty.
</accessibility>

<performance>
- The page is interactive within 2 seconds of a local cold load; media regions hold their space from first paint so no visible layout shift occurs as fonts, images, or the media card finish loading.
- No console errors or warnings appear on load or during a full scroll-through, menu exercise, command-palette exercise, trial-brief edit/export, and slideshow observation; the console stays free of hydration errors, and loading the homepage directly shows no post-hydration content flash.
- Continuous scrolling from top to bottom holds a smooth frame rate through the marquee rows, tilt accents, orb travel, and reveals.
- Rapid trial-brief edits, undo/redo, and command-palette open/filter/close never freeze the page or drop pointer/keyboard input.
- The page issues zero outbound network requests at any point: every font, image, video, style, and script resolves from the local origin.
</performance>

<writing>
- All mandated copy strings (the hero headline and subtitle, the four card titles and bodies, the section headings, the support sentence, the tile and marquee labels, the footer link labels, the copyright line, the support email, and the trial brief panel heading Build your Canvasly trial brief) render exactly as specified and free of typos; no lorem ipsum, TODO, or template placeholder text appears anywhere on the page.
- Headings, links, and buttons keep the reference copy's casing and phrasing consistently across sections; trial brief action labels stay specific (Download JSON, Copy brief, Import brief, Submit trial brief, Load sample brief, Reset, Undo, Redo) rather than generic Submit/OK alone.
- Trial brief validation messages name the field and the fix (for example Email must be a valid address, Name must be at least 2 characters, Team size must be 1 for Free trial, Interests required for Pro); the success line reads Trial brief ready — download or copy your JSON above.
- The placeholder wordmark, hover mark, cursor art, and placeholder thumbnails and clip use invented identities and do not reference real third-party brands, sites, or agencies.
</writing>

<requirements>
- Copyright and rights-clearance prohibition: apart from required npm dependency code and explicitly specified open-license fonts or generic utility icons used under their licenses, every creative asset and every piece of visible editorial copy must be newly authored or generated specifically for this fictional build. Do not use scraped, stock, press, social-media, portfolio, source-site, screenshot-derived, copyrighted, trademarked, or otherwise third-party-controlled creative material, and do not make a trace, near-copy, style-identical imitation, or recognizable derivative of it. This applies to raster pixels, individual video frames and audio, SVG paths, canvas/WebGL/Rive artboards and textures, 3D geometry/materials/HDR environments, PDFs, icon/mark silhouettes, metadata, filenames, alt text, and hidden/preloaded assets. If provenance is uncertain, create a fresh fictional replacement.
- Stack mandate: build the homepage with Astro 7, Tailwind CSS 4.3.2 through @tailwindcss/vite with the page's three-tier design tokens declared in @theme (primitive colors, semantic type/spacing, component radii/shadows/easings), and React 19 islands for the interactive chrome (header menus, mobile menu, slideshow, scroll reveals, custom cursor, command palette, and trial brief builder); shared island state (menu open state, slideshow index, reveal state, artboard scale, command palette open/query, trial brief fields, live export preview text, undo/redo stacks) lives in Nanostores as one store, and every view of that state derives from it. Radix UI primitives inside the React islands implement the Solutions menu, the mobile menu panel, and the command palette dialog. GSAP and Motion are allowed for intro timeline orchestration and scroll-linked reveals, alongside CSS keyframes, transitions, and offset-path/offset-distance; scrolling itself stays native document scroll (no scroll-jacking library required). No other animation libraries. Icons and cursor art are bundled original SVGs (or the Iconify Tailwind plugin); no icon font or icon CDN. All libraries are installed via npm and bundled locally; no CDN imports.
- Delivery mode: build as a static Astro site whose interactivity lives entirely in client state after load; loading the homepage URL directly renders the same complete page as any in-page navigation, with no hydration errors in the console.
- Homepage-only scope: only route "/" is implemented. Do not build Pricing, Examples, Templates, Learn, Join, Login, About, or catalog pages. Header, footer, CTA, tile, and menu chrome must keep the user on the homepage (same-page hashes to section ids are preferred) and must never navigate to a missing page.
- Scratch-build and asset-originality rule: author or generate every wordmark, project thumbnail, illustration, cursor, photograph, video/poster, social image, and decorative file as a new Canvasly replacement inside /app. Match the reference's dimensions, aspect ratios, placements, density, and layer counts, but do not copy, derive, trace, recolor, rename, transcode, or redistribute a source-site, screenshot, or external reference-bundle file. Missing a surface is not an acceptable debranding strategy. Self-host a bundled open-license grotesque display face of similar width and weight character plus Inter from local font files; no licensed source font may ship.
- Fully offline is a hard requirement: load the display face and Inter from local font files, and resolve all imagery, cursor art, video, poster, CSS, and scripts from same-origin paths. Analytics, consent, maps, telemetry, and account integrations must be absent or inert. The page must issue zero remote font, image, video, script, analytics, consent, or telemetry requests and must render completely with external networking unavailable.
- Responsive zoom-to-fit contract: treat the homepage as a 1024px design (the page artboard computes width 1024px, transform-origin 0 0) that zooms down to the viewport rather than cropping at the desktop width. Compute scale = min(1, viewportWidth / 1024) and apply it as a top-left-origin transform, and set the scroll-wrapper height to the scaled document height (offsetHeight multiplied by scale; the design figure is 3690px at scale 1). The artboard and scroll-wrapper layers must remain unclipped while scaled; never leave a horizontally cut-off 1024px canvas, and keep the page free of an unintended horizontal scrollbar at every width.
- Behavioral state contracts (in-memory client state only): the Solutions menu and mobile menu track their open state; the slideshow tracks its active index on a timer and wraps past the last frame; scroll-reveal state initializes unrevealed on every fresh load; the artboard scale derives from the viewport width; the trial brief draft, live preview, undo/redo stacks, and command palette open state live in the same in-memory store; none of these state changes reloads the document, and a reload returns the page to its initial state (empty brief baseline, menus closed, slideshow on first frame, reveals unrevealed, palette closed).
- Do not use localStorage, sessionStorage, or any other browser storage API. Session brief work survives through Download JSON / Copy brief / Import and through the WebMCP artifact and form surfaces.
- Forms and field contracts: the trial brief form and Import surface are driven by a form library with a schema validator (Zod) that mirrors the API-shaped trial-signup request-body field contract above; the schema defines the rules, the form surfaces inline named field errors before submit, a successful submit record IS the would-be request body, and Download/Copy/Import validate through the same schema.
- End-state contract: Download JSON and Copy brief MUST emit the session's actual trial brief under the trial-signup request-body field contract — when the draft is valid that text MUST be a schema-conforming trial-signup request body; an export that omits session work or that a valid draft fails to match the field contract is invalid; Import of a previously exported conforming brief MUST restore the same visible form and preview (round-trip); Import MUST reject non-conforming JSON without mutating the current brief; Reset MUST return the form and preview to the empty baseline without a reload.
- SEO and metadata: set the document language, the title "Canvasly – the design tool for outstanding websites", the description "Design, prototype, collaborate, publish.", matching social title/description, a large local social image made for Canvasly, a summary_large_image card, and a favicon; decorative media must not create duplicate announcements.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- command-session-v1
- form-workflow-v1
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
- Destinations: hero; workflow; teams; support; closing; trial-brief
- Session operations: advance
- Demos: solutions-menu
- Form fields: name; email; plan; team_size; interests
- Form operations: validate; submit; reset
- Value bounds: {"plan":["Free trial","Pro","Team"],"team_size":["1","2-10","11-50","51+"],"interests":["Portfolios","Presentations","Editorials","Companies","Freelancers","Students"]}
- Artifact operations: export; copy; import
- Export formats: json
- Import modes: replace

Mechanics exclusions:
- Offset-path gallery marquees stay Playwright-observed
- Tilt accents (hero card / Ready / question mark) stay Playwright-observed
- Support orb path travel stays Playwright-observed
- Slideshow 2200ms timing stays Playwright-observed
- Reveal-on-scroll (feature cards) stays Playwright-observed
- Custom cursor follow / hover-swap stays Playwright-observed
- Command-palette open/close and fuzzy filter stay Playwright-observed
- File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp only drives Load sample brief and its confirm dialog

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
