<summary>
Build an Avalanche network marketing homepage using Astro, Tailwind CSS 4.3.2, DaisyUI, and GSAP.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets, and where
a screenshot shows a brand asset (logo, wordmark, partner mark, licensed
typeface, brand imagery or video), recreate only its size, position, and
role with an original stand-in per the requirements.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished homepage must exhibit):
- The page loads a single long-form marketing homepage at / and renders every section in this exact order: fixed Navigation, Hero, Why Avalanche, quick links, trusted-business marquee, Developer Hub, Network activity, News, Solutions, Community, Events and support, Newsletter and builder panels, Contact, and Footer. No other route is built; this is the homepage only.
- The fixed navigation bar shows an original placeholder wordmark in the logo position, four hover mega-menus labelled Build, Solutions, Community, and About, a separate Grants link, a light/dark theme toggle, and a Start Building call to action. Hovering a desktop menu label fades and translates its panel of links into view; the mega-menu links and Start Building/Grants point at external destinations and are chrome only.
- Below 1025px the navigation collapses to logo, theme toggle, and a hamburger; tapping the hamburger opens an overlay drawer with four accordions and updates aria-expanded, and opening the drawer locks background scrolling.
- The theme toggle flips the whole page between light and dark: clicking it adds or removes a dark state on the document root and every surface, text, and accent recolors; the sun and moon icons cross-fade as it switches.
- The hero fills the viewport height with a Payments Collective promo card, the supporting brand statement, a live-updating local time and full date that refresh every four seconds, a scroll cue, an animated center panel, and two HUD overlays.
- Why Avalanche shows a sticky Why / Avalanche heading followed by four sticky full-height cards numbered 01 to 04 titled Fast. Powerful. Secure., Infinitely Scalable by Design, Customizable Layer 1s, and Global Community.
- The quick-links region shows three cards for wallet setup, the AVAX token, and ecosystem exploration, followed by the statement Avalanche is Trusted by Businesses Worldwide and a horizontal marquee of at least ten distinct original placeholder partner logos that loops continuously and pauses on hover.
- The Developer Hub shows the heading Build on the Network Designed for Big Ideas, explanatory copy, image cards for Academy, Builder Console, Documentation, Integrations, and tools, and a final Start Building tile.
- The Network section shows an oversized Avalanche / Network / In Action title, a Live Stats badge, the transaction total 60,932,291 formatted with US thousands separators, a Latest blocks table of seven seeded rows, and a Latest transactions table of seven seeded rows; the total is read from a local prerendered endpoint and the table rows stay fixed.
- The News section shows the heading News & Stories from the Avalanche Network, Featured and News labels, and seven horizontally scrollable cards whose titles are, in order: Avalanche Payments Collective: How a Payments Ecosystem Took Shape on Avalanche; NEC Signs MOU to Explore Biometric-Verified On-Chain Services on Avalanche; Progmat is Now on Avalanche; Retro9000 C-Chain Round 4: New Mechanics, Rewards and Opportunities for Builders; Avalanche Team1 Applications Are Now Open; The Avalanche Foundation Introduces Call For Research Program Selection Committee; and The Avalanche Foundation Opens Up To $50,000 In Research Grants On Avalanche Network Economics. Previous and next controls page the carousel and a View More call to action follows.
- The Solutions section shows supporting copy and six two-column cards for Institutions and Capital Markets, Gaming, Enterprise and Consumer Apps, DeFi, NFTs, Arts, and Culture, and Infrastructure and Tooling.
- The Community section shows Join The Best Community in web3, supporting copy, X / Arena / Discord / YouTube / Reddit / LinkedIn buttons, a Follow @avax control, and an empty feed track whose previous and next arrows are disabled and stay disabled.
- The Events and support region shows Avalanche Global Events copy, a View All Events control, an Avalanche Summit New York card dated Sep 16-17, 2026 in NYC, and three cards: Questions about Avalanche?, Avalanche Team1, and The Community Hub.
- The Newsletter region shows a Start building On Avalanche image panel beside a Join the Email List panel containing a five-step email form; the contact region below shows a Contact us heading, a prompt, and a two-column form.
- The footer shows the original placeholder mark, six link columns, a fast repeating white placeholder-wordmark marquee, and a studio credit line in the same position and style (generic text; do not credit the reference site's real agency).
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Newsletter flow: starting on step 1 of 5, clicking Next advances exactly one step and the step counter and progress bar both reflect the new step; clicking Back retreats one step with the same two surfaces updating; navigation never blocks on per-step validity; submitting on step 5 shows the message Thank you for subscribing after a brief delay, and the step state does not reset while merely scrolling the page.
- Contact flow: filling all required fields and submitting shows Success! We'll be in touch. after a brief delay, then clears every field; choosing project type Other reveals the conditional Other detail field, and switching away from Other hides it again with its value discarded.
- Theme flow: toggling the theme adds or removes the dark state on the document root, recolors every surface, text, and accent across all sections in the same pass, swaps the sun and moon icons, and the choice persists as page state while scrolling and interacting anywhere on the page; toggling back restores the exact prior palette.
- Carousel flow: paging the news carousel forward updates the visible cards and the arrows' enabled state at the track ends; scrolling above the carousel and back resets it to the first slide with the previous arrow disabled again.
- Drawer flow: below 1025px, tapping the hamburger opens the overlay drawer, locks background scrolling, and sets the control's expanded state; closing it restores scrolling and the collapsed state, and the page position is unchanged.
</user_flows>

<edge_cases>
- Submitting the contact form with required fields empty shows inline messages naming each missing field, shows no success message, and clears nothing.
- The newsletter submit action exists only on step 5; steps 1 through 4 offer Next (and Back from step 2 onward) and never show the subscription confirmation.
- The community feed track is empty by design: its previous and next arrows are disabled on load and remain disabled after clicking, hovering, and scrolling.
- At the news carousel's first slide the previous arrow is disabled; at the last slide the next arrow is disabled; neither click wraps around.
</edge_cases>

<visual_design>
- Long-form editorial marketing layout. At 1440x900 the html/root background computes rgb(10, 10, 10) and the visible fixed nav bar surface is rgb(255, 255, 255) in light and rgb(21, 20, 19) in dark; body text is rgb(0, 0, 0) in light and rgb(255, 255, 255) in dark. Content spans the full width with fluid padding (no fixed max-width container).
- The Avalanche red accent on calls to action, active states, and .text-red elements computes rgb(255, 57, 74) (token #ff394a); the placeholder logo mark uses a distinct red #E6212F.
- Custom cut-corner button and panel frames rather than plain rectangles, rounded large-radius section containers; primary CTA buttons render about 53.78px tall at 1440x900 (clamp height token).
- Uppercase display headings render in the bundled open-license display face (a wide grotesque of similar width and weight character to the reference); Inter body copy; headings render antialiased. The computed heading and nav family is the bundled display face and the body family is Inter.
- Type tiers at 1440x900: the oversized Why Avalanche and Network / In Action display titles render at 145px with 116px line-height in the display face, uppercase; section headings render at about 47.9px in the display face, uppercase; body copy renders at about 15.7px / 21.2px in Inter; nav links render at about 12.9px, weight 600, in the display face.
- The hero composes three regions on desktop (Payments Collective lower left, animated center in the middle columns, clock/date and scroll cue on the right) and reflows to stacked rows on smaller screens.
- Why Avalanche uses a sticky heading with four full-height stacked cards; Solutions and Developer Hub use dense multi-column card grids; the block and transaction tables use compact rows with repeated avatars.
- The trusted-business strip renders each partner logo twice to form a seamless marquee; the footer renders repeated white wordmarks moving on a loop.
</visual_design>

<motion>
- Theme swap: toggling light/dark cross-fades the sun/moon icons and transitions surface, text, border, and accent colors together; the .transition-mode transition-duration computes 0.3s, and body text moves between rgb(0, 0, 0) and rgb(255, 255, 255) rather than snapping.
- Hover feedback (required): navigation labels shift toward the red accent, mega-menu link rows take a hover wash, buttons ease their fill and cut-corner frame, social buttons invert their surface on hover, and the logo and footer marquees pause on hover.
- Hero sequence: after the document mounts the hero panels enter with a clipped-panel reveal; the center renders nine stacked placeholder video layers on desktop and only the first five below 1025px, the first layer starts after about 1.5s and each layer advances when the previous one ends, wrapping past layer one after the first pass; both looping HUD overlays fade in after about 4s.
- Scroll reveals: each major section reveals as it scrolls into view, its split paragraphs rise line by line (split-line reveal duration about 2000ms with ease-out-cubic), and its split headings flash each character through random glyphs before settling to the final uppercase letters; scrolling back above a section allows its entrance to replay. The hero clipped-panel entrance runs about 2000ms with ease-in-out-quart.
- On desktop the quick-link cards scrub through a stacked-to-spread transform as the region scrolls, and the trusted-business logos above rise; below 1025px these use a static stacked layout.
- Smooth scrolling is active only above 1024px; hash and anchor navigation eases over about two seconds; below 1025px native scrolling is used and the smooth-scroll engine stays off.
- The trusted-logo marquee cycles about every 31500ms and the footer wordmark marquee about every 5000ms, both linear and infinite, pausing on hover.
- The blog carousel pages with its previous/next arrows whose enabled state follows the start and end of the track, and scrolling back up above the carousel resets it to the first slide; the community feed stays empty with its arrows disabled.
- The newsletter progress bar and step counter animate as Next/Back move between the five steps; form chips, floating labels, and the custom selects animate their open/selected states.
- Under reduced-motion preference the smooth-scroll, line reveals, heading flashes, and marquees are suppressed while section triggers and the hero sequence still run.
</motion>

<responsiveness>
- The product breakpoint is 1025px: at 1025px and wider the hover mega-menus, Start Building button, desktop hero column split, and desktop card/table spacing appear; below 1025px the drawer navigation, stacked hero, and mobile spacing apply.
- Measured nav height is about 67px at 1440, 88px at 1024, and 80px at 390; the desktop mega-menu row is visible down to 1024 and hidden at 390; the fixed nav background stays rgb(10, 10, 10) before and after scrolling past the hero (no scroll-triggered recolor).
- No content clips or overflows the viewport and no horizontal scrollbar appears at 1440, 1024, or 390 widths; images and video panels keep their aspect ratios at every width.
</responsiveness>

<accessibility>
- Every interactive control (nav links, theme toggle, hamburger, accordions, form fields, carousel arrows, social buttons) is reachable and operable with the keyboard alone, with a visible focus indicator.
- The hamburger control reflects its expanded state via aria-expanded, and the open drawer contains keyboard-operable accordions while background scrolling stays locked.
- The newsletter and contact success messages and inline validation errors are announced through a polite live region as well as shown visually.
- All placeholder imagery, logos, and video panels carry descriptive alt text or accessible labels; decorative marquee duplicates are hidden from the accessibility tree.
- Text over imagery and all control labels meet WCAG AA contrast in both light and dark themes.
</accessibility>

<performance>
- The page is interactive within 2 seconds of a local cold load, with hero imagery eager-loaded and editorial imagery lazy-loaded.
- No console errors or warnings appear on load or during a full scroll-through, theme toggle, form completion, and carousel exercise.
- No visible layout shift occurs as fonts, images, or video panels finish loading; media regions reserve their space from first paint.
- Continuous scrolling from top to bottom holds a smooth frame rate through every reveal, scrub, and marquee; rapid theme toggling never freezes the page.
</performance>

<writing>
- All mandated copy strings render exactly as specified and free of typos; no lorem ipsum, TODO, or template placeholder text appears anywhere on the page.
- Headings keep the reference's uppercase display treatment consistently; body copy uses consistent sentence casing and terminology across sections.
- Placeholder partner logos and the studio credit use invented names that read as plausible copy and do not reference real third-party brands or agencies.
</writing>

<requirements>
Build the homepage with Astro 7 and @astrojs/node, Tailwind CSS 4.3.2 through @tailwindcss/vite, DaisyUI 5 for base chrome (buttons, form controls, drawer and accordion primitives, restyled by the page's own tokens), GSAP 3 with ScrollTrigger and SplitText, Lenis 1, and Swiper 14. Compose the page from .astro components and small client scripts; do not substitute another framework or a single monolithic SPA. Icons are bundled original SVGs or the Iconify Tailwind plugin; no icon CDN. The newsletter and contact forms validate through Zod schemas client-side: the contact form shows inline per-field errors naming the field, and the newsletter form validates its collected fields on final submit without blocking step navigation. Use Tailwind utilities alongside CSS-first theme variables.
All shipped assets must be original or open-licensed - this recreation must not contain copyrighted brand assets: do not include the reference site's logo files, wordmarks, partner logos, brand photography, or brand video; ship original placeholder marks, logos, and media at the same sizes, aspect ratios, placements, and layer counts. Do not bundle licensed fonts: self-host a bundled open-license display face at weights 400, 500, 700, and 900 in place of the reference's licensed display font, and Inter at weights 400 and 600. Where a reference screenshot shows a brand asset, recreate its size, position, and role with an original stand-in; the screenshot never licenses the asset itself.
The homepage must render fully offline with zero outbound requests: all fonts, images, SVGs, video, and built JavaScript resolve locally, and the only data request is the local prerendered transaction-total endpoint. External destinations (build.avax.network, Core, social networks, the Summit site, CoinMarketCap) may remain ordinary links but must not supply any render-critical content.
Behavioral state contracts (observable, in-memory only):
- The theme is client state: toggling light/dark recolors the whole document without a reload and the choice persists as the page state.
- The five-step newsletter form tracks its current step in client state; Next and Back move between steps without blocking on per-step validity, and the final Submit shows Thank you for subscribing after roughly 500ms.
- The contact form validates required fields client-side; a valid submit shows Success! We'll be in touch. after roughly 600ms and resets the form; choosing project type Other reveals the conditional detail field.
- The blog carousel tracks its slide position and resets to slide 0 when the viewport scrolls back above it; the community feed is empty and its arrows are permanently disabled.
- Section reveal state is driven by scroll position: entering a section marks it visible and initializes its text splits; leaving above it allows the entrance to replay.
- The mobile drawer open/closed state toggles the overlay, background scroll lock, and aria-expanded.
Homepage-only scope: the navigation mega-menus, Grants, Start Building, and footer columns link to other Avalanche routes as chrome, but no non-homepage route is implemented for this task.
Responsive rules: the product breakpoint is 1025px; JavaScript checks mirror innerWidth > 1024 and matchMedia (max-width: 1024px). At and above 1025px show hover mega-menus, the Start Building button, the 3/6/3 hero column split, Lenis, and the desktop quick-link scrub; below 1025px use the drawer navigation, five hero video layers, stacked hero, and mobile spacing.
Keep render-critical media local, eager-load hero imagery, lazy-load editorial imagery, and preserve explicit image dimensions and responsive aspect ratios to avoid layout shift. Do not fetch remote content at runtime.
Fidelity tolerance: match EXACTLY the exact copy strings (text only - never brand asset files), the section order, the accent red rgb(255, 57, 74), the light/dark surface and text colors, the responsive breakpoint behaviors (mega-menu vs drawer, Lenis on above 1024 and off at or below 1024), the seven news titles, the counts (four Why cards, six solution cards, seven blocks, seven transactions), and the image aspect ratios. Match CLOSELY (small deviation acceptable) font antialiasing, exact fractional pixel sizes at intermediate or odd viewports (the type scale uses fluid clamps so px values differ by viewport), subpixel positions, and exact animation millisecond timings within a small tolerance.
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

Bindings:
- Destinations: hero; solutions-insights; links; companies; developers-hub; numbers; blog; solutions; community; event; questions; newsletter; contact-us; footer
- Themes: light; dark
- Form fields: firstname; lastname; email; twitterhandle; country; vertical; project_type; avalanche_contact_message; gdpr; marketing_consent; newsletter
- Form operations: validate; submit; cancel; reset; advance; return
- Workflow steps: step-1; step-2; step-3; step-4; step-5

Mechanics exclusions:
- Hero clipped-panel entrance + layered alpha video sequence + HUD reveal stay Playwright-observed
- Scroll-reveal line reveals and split-heading character flash stay Playwright-observed (real scroll path only)
- Blog Swiper drag/arrow paging and reset-to-slide-0 on upward exit stay Playwright-observed
- Logo marquee (31.5s) and footer wordmark marquee (5s) pause-on-hover stay Playwright-observed
- Theme cross-fade timing (~0.3s) stays Playwright-observed
- Desktop links card scrub / companies rise stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
