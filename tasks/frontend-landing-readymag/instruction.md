<summary>
Build a design-first marketing homepage using Astro with React islands, Nanostores, Tailwind CSS 4.3.2, and Radix UI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets, and where
a screenshot shows a brand asset (logo, wordmark, licensed typeface, brand
thumbnails, photography, or video), recreate only its size, position, and
role with an original stand-in per the requirements.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- On load the page renders one uninterrupted vertical homepage with a sticky white header at the top, and the sections appear in this exact order: an oversized hero, a workflow section with four feature cards and a rotating slideshow, a "Teams of all sizes" use-case tile section, a dark support band, a traveling use-case marquee, a closing call-to-action, and a multi-column footer.
- The sticky header stays fixed to the top of the viewport on scroll and shows an original placeholder wordmark in the logo position on the left (the wordmark swaps to a distinct hover mark on hover), a primary navigation group with a Solutions control plus Pricing, Examples, Templates, and Learn links, and account actions on the right: a "Log in" text link and a "Sign up" pill button.
- The Solutions control is a real keyboard-operable menu trigger, not a decorative link: clicking it (or pressing Enter/Space while focused) opens a menu listing Portfolios, Presentations, Editorials, Companies, Freelancers, and Students; pressing Escape closes it and returns focus to the trigger; clicking outside also closes it.
- The hero shows three animated marquee gallery rows of original placeholder project thumbnails scrolling continuously across the top, the dominant headline "Design and launch outstanding websites", the subtitle "Design, prototype, collaborate, publish.", and a CTA pair: a dark "Try Readymag" pill button followed by an underlined "or choose your subscription plan" link.
- The hero also contains a floating media card (rounded, shadowed, gently tilting) on the right playing an original local placeholder clip, and an oversized playful accent cluster reading "Hello!" in orange followed by "Ready" and "?" in purple.
- The workflow section opens with the heading "Enjoy easy workflow" and an intro paragraph about the drag-and-drop interface, then presents four feature cards that reveal on scroll (fade and rise into place, staggered) with these exact titles and bodies: "Enjoy easy workflow" ("The intuitive drag-and-drop interface gives you everything you need. Designers can switch to Readymag seamlessly, and marketers quickly get used to it."), "Streamline teamwork" ("Collaborate in real time — comment, iterate, and ship without leaving the canvas."), "Attract with interactivity" ("Scroll animations, hover states, custom cursors, video, and vector animation — built into the Viewer."), and "Expand functionality to infinity" ("Integrate embeds, forms, e-commerce, analytics, and code snippets when you need them.").
- Below the cards a horizontal six-image project slideshow of original placeholder frames advances on its own every 2200ms: the active frame is fully opaque and its neighbors sit at 0.35 opacity, and the opacity changes with a 0.35s ease-in-out transition as the active frame moves along.
- The use-case section shows the heading "Teams of all sizes create websites with Readymag" and six rounded, color-coded tiles with white text, each a link, in this order and these labels: Portfolios, Landing pages, Editorials, Company websites, Design studios, and by Readymag team.
- The support band is a full-width dark #282828 panel with centered white text: the heading "Get the best support" and the sentence "Our agents offer around-the-clock support on business days and treat you with care." with "around-the-clock support on business days" emphasized in orange, plus an animated orange circular orb that travels along a curved path below the copy.
- A traveling use-case marquee row of oversized non-wrapping labels moves horizontally and cycles through Company websites, Landing pages, Editorials, Presentations, Design studios, and Portfolios.
- The closing call-to-action is centered with the heading "Try for free", the line "or choose your subscription plan", a dark "Try Readymag" pill button, and an underlined "View pricing" link.
- The footer is a dark multi-column layout with four groups and these exact link labels: company (about, careers, reviews, terms of service, privacy policy, cookie policy); product (pricing, templates, product updates, affiliate program, referral program, npo discount); resources (examples, design almanac, design stories, help, forum, status, blog); solutions (portfolios, presentations, editorials, companies, freelancers, students). It ends with "© 2026 Readymag Inc." and "support@readymag.com".
- A 43px custom image cursor (original cursor art) follows the pointer on fine-pointer devices and swaps to a hover image when it is over links, buttons, role=button elements, hotspots, and animated hover elements; the cursor never captures pointer events (it is pointer-transparent so clicks pass through to the elements beneath it).
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Solutions menu flow: activating the Solutions trigger opens its panel with all six labels (Portfolios, Presentations, Editorials, Companies, Freelancers, Students) visible and the trigger's expanded state flipped on; pressing Escape closes the panel, restores the collapsed state, and returns focus to the trigger; clicking outside the open panel closes it without activating anything beneath; the cycle repeats cleanly any number of times with no orphaned panels.
- Mobile menu flow: narrowing the viewport to 768px hides the desktop navigation and the "Log in" link and shows a compact "Menu" button in the header; activating it opens a mobile menu panel listing the navigation and account links; dismissing the panel (or widening back to desktop width) removes it and the appropriate header layout returns, with the page's scroll position unchanged throughout.
- Slideshow flow: leaving the page idle advances the six-frame slideshow on its own timer every 2200ms — the newly active frame becomes fully opaque while its neighbors drop to 0.35 opacity — and after the sixth frame it wraps back to the first; the advancing continues without any manual control being touched.
- Scroll-reveal flow: on a fresh page load the four workflow feature cards start unrevealed; scrolling the workflow section into view fades and raises them into place with an 80ms stagger; they remain in their revealed resting state while scrolling onward; reloading the page restores the unrevealed starting state until the section is scrolled into view again.
- Zoom-to-fit flow: resizing the viewport from 1440px down to 390px continuously rescales the whole 1024px design artboard to fit the viewport width, the scroll wrapper's height tracks the scaled document height, and at every intermediate width the full design width stays visible with no horizontal scrollbar and no cropped right edge.
</user_flows>

<edge_cases>
- Pressing Escape while the Solutions menu is closed does nothing: no error, no visual change, and focus stays where it was.
- The slideshow wraps seamlessly: advancing past the sixth frame returns to the first with the same opacity treatment (active 1.0, neighbors 0.35) and no blank or double-active frame across the wrap.
- Clicks pass through the custom cursor: clicking any link or button while the cursor image overlaps it activates the element beneath, never the cursor layer.
- On coarse-pointer devices the custom cursor is absent and the system cursor is fully visible; the system pointer is never hidden without a visible replacement.
- Reloading the page returns it to its initial state: menus closed, the slideshow back on its first frame, and scroll-reveal sections unrevealed until scrolled into view.
</edge_cases>

<visual_design>
- Color (measured computed values in parentheses): the canvas and inverse text are #FFFFFF (rgb(255, 255, 255)); primary text and dark surfaces (including the support band and footer backgrounds) are #282828 (rgb(40, 40, 40)) with solid black rgba(0, 0, 0, 1) for the hero title; secondary text is rgba(0, 0, 0, 0.392) and #8C8C8C; neutral surfaces are #A2A2A2 and #F4F4F4; the primary orange is #FF6600 (rgb(255, 102, 0), used on the support-band emphasis and orb) and the secondary orange is #EC520B.
- The six use-case tiles use these exact background colors (measured computed values in parentheses) with white text (computed rgb(255, 255, 255)), 16px radius, and 88px min-height: Portfolios #FF88BA (rgb(255, 136, 186)), Landing pages #FFCB00 (rgb(255, 203, 0)), Editorials #008BFF (rgb(0, 139, 255)), Company websites #A6A6A6 (rgb(166, 166, 166)), Design studios #4AAC54 (rgb(74, 172, 84)), and by Readymag team #EC520B (rgb(236, 82, 11)).
- Muted underlines use linear-gradient(to right, rgba(0, 0, 0, 0.31) 0%, rgba(0, 0, 0, 0.31) 100%) 0 90% / 1px 2px repeat-x, and the active black underline uses the same pattern at 0 100% / 1px 1px.
- Typography: display copy renders in a bundled open-license grotesque display face (similar width and weight character to the reference's display type) and compact UI copy in an Inter stack; these two faces must stay visibly distinct. Measured type scale at the 1024px design: hero title 60px / computed line-height 54px (the 0.9 ratio) / -2px tracking / weight 400; closing title 60px / line-height 57px (0.95) / -2px tracking; section heading 40px / 38px / -1.8px; card heading 28px / 28px / -1px; large body 21px / 24px / -1px; standard body 18px / 20px / -0.8px; header/footer utility text 12px (nav line-height 14px, footer line-height 16px) at variable weight 550; primary button text Inter 14px at variable weight 550. On smaller viewports the hero and closing titles scale down via clamp() (hero clamp(40px, 8vw, 60px), closing clamp(32px, 6vw, 60px)).
- The design is composed on a 1024px-wide coordinate system. Main sections use 28px horizontal padding; standard sections use 96px vertical padding and the closing CTA uses 120px. Cards and tiles use 10px to 24px corner radii.
- The floating hero media card uses a 24px radius and a 0 24px 80px rgba(0, 0, 0, 0.12) shadow. Slideshow frames are 276px by 180px with 12px radii.
- The header is a sticky white bar with a subtle hairline bottom border; primary and ghost buttons are dark #282828 pills; the support band and footer are dark #282828 surfaces with white and orange text.
</visual_design>

<motion>
- Hero reveal: the hero title, subtitle, and CTA row each rise upward from 24px and fade in over 0.8s (measured 800ms) cubic-bezier(.56,.86,.59,1), staggered with 0s, 0.08s, and 0.16s delays (measured 0 / 80 / 160ms); the "Hello!" accent uses a 0.6s (measured 600ms) reveal of the same kind.
- Feature-card reveal: the four feature cards animate opacity and translateY(28px) to their resting state via a transition measured as opacity 0.45s cubic-bezier(.56,.86,.59,1), transform 0.45s cubic-bezier(.56,.86,.59,1) when the workflow section scrolls into view, staggered by 80ms per card. This reveal must be triggered by scrolling the section into view, not shown pre-revealed.
- Hero gallery marquee: three rows of thumbnails travel along CSS offset-path motion paths and loop seamlessly and linearly (measured infinite linear durations 40s, 46s, 52s). The three rows end at 1496px, 1655px, and 1696px of offset-distance and follow the paths M 1489.01 109.5 C 1489.01 109.5 -6.995 109.5 -6.995 109.5, M 1649.5 80 C 1649.5 80 -5.5 80 -5.5 80, and M 1690.5 60.5 C 1690.5 60.5 -5.5 60.5 -5.5 60.5.
- Lower use-case marquee: the oversized label row follows path('M 0 40 L 2000 40'), travels from 0px to 1496px of offset-distance, and loops every 28 seconds linearly.
- Tilt accents animate from a zero transform to a tilted transform with ease-in-out and alternate: the floating hero media card tilts toward -6deg (translate about -8px/-15px) over 4.5 seconds, the orange/purple "Ready" accent tilts toward 6deg (translate about 8px/-16px) over 3.2 seconds, and the "?" mark tilts toward -6deg (translate about -6px/-6px) over 3.2 seconds.
- Support orb: an orange orb follows path('M 0 0 C 120 80, 240 -40, 480 60 S 820 20, 960 80'), traveling 1561px of offset-distance over 18 seconds linearly.
- Slideshow: the six-image project slideshow advances every 2200ms; the active slide is opacity 1.0, its neighbors are 0.35, and the change animates with opacity 0.35s ease-in-out. This must advance on its own timer (letting it run advances it), not only on a manual control.
- Hover feedback (required): buttons lift by 1 to 2px and shift their background from #282828 to orange on hover; the use-case tiles rotate -2deg and scale to 1.02 on hover; nav and footer links shift their underline/opacity on hover; the header wordmark swaps to its hover mark. These hover states must be reachable by hovering the real control.
- The Solutions menu panel and the mobile menu panel each enter with a short fade-and-settle transition and leave cleanly; opening and closing never snaps content elsewhere on the page.
- Custom cursor: the 43px cursor follows fine pointers, swaps to its hover image over interactive elements, and uses pointer-events: none.
- Reduced motion: under prefers-reduced-motion: reduce, all offset-path travel, tilt, and reveal animation stops, every section shows in its final resting state (fully visible and correctly placed), and the system cursor is restored (the custom cursor is disabled).
</motion>

<responsiveness>
- Zoom-to-fit is the responsive model: the homepage is a 1024px-wide design artboard that scales down to the viewport instead of cropping. At 1440px the artboard's computed transform is none (scale 1); at 390px the measured transform is matrix(0.380859, 0, 0, 0.380859, 0, 0) (390/1024); the scaled layers stay unclipped so the entire design width is visible at 768px and at 390px, and no unintended horizontal scrollbar appears at any width.
- On viewports 768px and narrower the desktop navigation and the account "Log in" link are hidden and a compact "Menu" button appears in the header; activating it opens a mobile menu panel listing the navigation and account links.
- At 768px and below the floating hero media card is hidden, the feature cards stack in one column, the use-case tiles form two columns, and the footer collapses to two columns, with the header and CTA controls remaining usable without horizontal scrolling.
- At coarse-pointer sizes the system cursor is used (the custom cursor is disabled) and the system pointer is never hidden.
</responsiveness>

<accessibility>
- The page uses semantic header, nav, main, section, article, and footer landmarks with one page-level heading and ordered section headings.
- The Solutions control is a button with the accessible name "Solutions menu", aria-haspopup="menu", aria-controls pointing at its panel, and aria-expanded that flips to true when the menu opens and back to false when it closes; focus order through the header and menu is logical and Escape closes the open menu.
- Every interactive item is a real link or button with a visible keyboard focus indicator and a useful accessible name; the slideshow region carries an accessible label.
- The floating hero art, the path-traveling orb, the marquee decoration, and the custom cursor are marked aria-hidden, and the cursor keeps pointer-events: none.
- Text meets WCAG AA contrast on the white canvas and on the dark support-band and footer surfaces, including the orange emphasis text.
</accessibility>

<performance>
- The page is interactive within 2 seconds of a local cold load; media regions hold their space from first paint so no visible layout shift occurs as fonts, images, or the media card finish loading.
- No console errors or warnings appear on load or during a full scroll-through, menu exercise, and slideshow observation; the console stays free of hydration errors, and loading the homepage directly shows no post-hydration content flash.
- Continuous scrolling from top to bottom holds a smooth frame rate through the marquee rows, tilt accents, orb travel, and reveals.
- The page issues zero outbound network requests at any point: every font, image, video, style, and script resolves from the local origin.
</performance>

<writing>
- All mandated copy strings (the hero headline and subtitle, the four card titles and bodies, the section headings, the support sentence, the tile and marquee labels, the footer link labels, the copyright line, and the support email) render exactly as specified and free of typos; no lorem ipsum, TODO, or template placeholder text appears anywhere on the page.
- Headings, links, and buttons keep the reference copy's casing and phrasing consistently across sections.
- The placeholder wordmark, hover mark, cursor art, and placeholder thumbnails and clip use invented identities and do not reference real third-party brands, sites, or agencies.
</writing>

<requirements>
- Stack mandate: build the homepage with Astro 7, Tailwind CSS 4.3.2 through @tailwindcss/vite with the page's design tokens declared in @theme, and React 19 islands for the interactive chrome (header menus, mobile menu, slideshow, scroll reveals, custom cursor); shared island state (menu open state, slideshow index, reveal state, artboard scale) lives in Nanostores as one store, and every view of that state derives from it. Radix UI primitives inside the React islands implement the Solutions menu and the mobile menu panel. GSAP and Motion are allowed for animation, alongside CSS keyframes, transitions, and offset-path/offset-distance; no other animation libraries. Icons and cursor art are bundled original SVGs (or the Iconify Tailwind plugin); no icon font or icon CDN. All libraries are installed via npm and bundled locally; no CDN imports.
- Delivery mode: build as a static Astro site whose interactivity lives entirely in client state after load; loading the homepage URL directly renders the same complete page as any in-page navigation, with no hydration errors in the console.
- No copyrighted assets: this recreation must not contain the reference site's brand assets. Do not ship its logo files, wordmarks, project thumbnails, photography, or video; ship original placeholder marks, thumbnails, and clips at the same sizes, aspect ratios, placements, and layer counts. Do not bundle licensed fonts: self-host a bundled open-license grotesque display face (similar width and weight character) in place of the reference's licensed display faces, plus Inter from local font files. Where a reference screenshot shows a brand asset, recreate its size, position, and role with an original stand-in; the screenshot never licenses the asset itself.
- Fully offline is a hard requirement: load the display face and Inter from local font files, and resolve all imagery, cursor art, video, poster, CSS, and scripts from same-origin paths. Analytics, consent, maps, telemetry, and account integrations must be absent or inert. The page must issue zero remote font, image, video, script, analytics, consent, or telemetry requests and must render completely with external networking unavailable.
- Responsive zoom-to-fit contract: treat the homepage as a 1024px design (the page artboard computes width 1024px, transform-origin 0 0) that zooms down to the viewport rather than cropping at the desktop width. Compute scale = min(1, viewportWidth / 1024) and apply it as a top-left-origin transform, and set the scroll-wrapper height to the scaled document height (offsetHeight multiplied by scale; the design figure is 3690px at scale 1). The artboard and scroll-wrapper layers must remain unclipped while scaled; never leave a horizontally cut-off 1024px canvas, and keep the page free of an unintended horizontal scrollbar at every width.
- Behavioral state contracts (in-memory client state only): the Solutions menu and mobile menu track their open state; the slideshow tracks its active index on a timer and wraps past the last frame; scroll-reveal state initializes unrevealed on every fresh load; the artboard scale derives from the viewport width; none of these state changes reloads the document, and a reload returns the page to its initial state.
- Do not use localStorage, sessionStorage, or any other browser storage API.
- SEO and metadata: set the document language, the title "Readymag – the design tool for outstanding websites", the description "Design, prototype, collaborate, publish.", matching social title/description, a large social image (original placeholder art), a Twitter summary_large_image card, and a favicon; decorative media must not create duplicate announcements.
- Only the homepage route "/" is required to render. Header and footer links (Pricing, Examples, Templates, Learn, the Solutions destinations, account entry points, and the footer groups) should look and behave like real navigation, but the linked pricing, examples, templates, account, editorial, and company destinations do not need to be implemented; they are chrome-only outbound links and must never be promoted into features.
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
- Destinations: hero; workflow; teams; support; closing
- Session operations: advance
- Demos: solutions-menu

Mechanics exclusions:
- Offset-path gallery marquees stay Playwright-observed
- Tilt accents (hero card / Ready / question mark) stay Playwright-observed
- Support orb path travel stays Playwright-observed
- Slideshow 2200ms timing stays Playwright-observed
- Reveal-on-scroll (feature cards) stays Playwright-observed
- Custom cursor follow / hover-swap stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
