<summary>
Build a fully fictional Avery Vale elite-motorsport driver homepage using Astro with static delivery and Svelte islands for interactive chrome, Svelte stores for in-memory client state, Tailwind CSS 4.3.2, and Bits UI. Reproduce the reference's composition and interaction ambition, but not its people, teams, logos, sponsors, copy, or proprietary media.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate the composition, layout, density, and motion they show while replacing
every identifiable person, team, logo, sponsor, signature, monogram, helmet
livery, circuit drawing, photograph, video, and proprietary type treatment with
a newly authored fictional equivalent. The screenshots are composition-only
references: any legible source branding or copy in them is explicitly out of
scope. Where a screenshot and the text conflict, the text wins. Do not copy,
crop, trace, recolor, rename, or ship the screenshot pixels or source-site files.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished homepage must exhibit):
- The page loads a single long-form driver homepage at route / only; no other route is built. The browser tab title reads exactly 2025 Apex Grand Prix Driver — Avery Vale. Every labelled region (hero, horizontal media, impact statement, helmet grid, collaborators, social video, footer, and the menu overlay) lives on this one page.
- On load a full-bleed lime page-transition preloader covers the viewport showing the words LOAD VALE, then clears within about one to two seconds to reveal the homepage underneath; it does not remain on screen blocking content.
- A fixed navigation bar stays pinned to the top over all sections and contains, left to right, a stacked AVERY VALE text wordmark (AVERY above VALE), a centered original AV monogram of the same size and placement as the reference mark, a lime Store button labelled STORE, and a square hamburger button.
- Clicking the hamburger opens a full-screen menu overlay that covers the viewport in dark green with a faint topographic line pattern; the overlay lists the menu items HOME, ON TRACK, OFF TRACK, and CALENDAR, a social row labelled CLIPS, PHOTOS, VIDEO, and LIVE, the business contact hello@averyvale.example, and an image grid of original fictional editorial photos.
- Inside the open menu the HOME item is the current item and shows a lime telemetry-stroke line drawn through its label; the other three items do not show that stroke.
- Activating a menu item scrolls within the same homepage without leaving /: HOME to the hero, ON TRACK to the horizontal media strip, OFF TRACK to the social video section, and CALENDAR to the helmet grid; the overlay closes as part of that activation and no second document or route loads.
- The menu overlay closes when the X control inside it is clicked; after closing, the overlay is no longer visible and the homepage is interactive again.
- The hero fills at least the first full viewport height and shows an off-white blob-and-topographic field with a newly created fictional racer portrait/silhouette behind the chrome; a NEXT RACE widget sits at the lower left showing the eyebrow NEXT RACE, an original circuit outline graphic, the label ALPINE GP, an original laurel graphic, and the fictional team line NOVA RACING SINCE 2019.
- A horizontal media strip holds a row of at least six visually distinct landscape editorial cards made from newly generated or authored fictional-racer imagery; the cards translate sideways as the page is scrolled vertically through that pinned section, so later cards come into view without the page navigating away.
- An impact statement section between the media strip and the helmet grid renders an oversized display headline in the lime-off color.
- A helmet grid shows at least three tall portrait cards masked to a helmet silhouette; each card uses a different newly authored fictional helmet/livery design, contains both base and reveal artwork, and carries a visible index label.
- A collaborators strip shows a horizontal marquee of at least five distinct newly drawn fictional partner symbols or wordmarks; typed company names with no mark treatment do not count.
- A social video card shows an original poster image on top of a muted looping, locally served VP9 WebM video with visibly changing frames.
- The footer shows a large split-text brand statement, a second marquee of the same fictional partner marks, the AVERY VALE wordmark, a newsletter signup form, and a row of legal links (Privacy Policy, Terms, Cookies).
- The newsletter signup form has one email field and a Subscribe control; the Subscribe control stays disabled until the field holds a validly formatted email address.
- Submitting the newsletter form with a valid email shows an inline confirmation message in the footer and clears the field, without any document reload or navigation.
- All navigation chrome (wordmark, monogram mark, menu items, socials, business contact, legal links, Store button) stays inside the single homepage: activating any of them either scrolls to a homepage region or performs a no-op, and none of them reload the document or navigate to another origin.
</core_features>

<user_flows>
- Menu flow: clicking the hamburger opens the overlay covering the viewport with the HOME item showing its current-item stroke; activating ON TRACK (or another menu item) closes the overlay and scrolls within the same homepage to that section without leaving /; activating the X control closes the overlay while leaving scroll position unchanged; after either close path, the fixed navigation bar is still pinned and no document reload has occurred at any step.
- Newsletter flow: typing an invalid email leaves Subscribe disabled and shows an inline error naming the email field; correcting to a valid email clears the error and enables Subscribe; submitting shows the confirmation message and empties the field; no navigation or reload occurs at any step of the flow.
- Video flow: hovering the social video card starts playback and fades the placeholder away; moving the pointer off pauses playback and restores the placeholder to fully opaque; repeated hover-and-leave cycles keep working with no stuck intermediate state.
- Reload baseline: reloading the document returns the homepage to its initial state — the preloader plays again, the menu is closed, the newsletter field is empty with no confirmation shown, and no state from the previous visit persists.
</user_flows>

<edge_cases>
- Rapidly clicking the hamburger and the X control in succession never leaves the overlay stuck half-open or the page inert; the menu always settles fully open or fully closed.
- Pressing Escape while the menu is closed changes nothing on the page.
- Submitting the newsletter form with an empty field is blocked: an inline message names the email field and no confirmation appears.
- Double-activating the Subscribe control on one valid email shows exactly one confirmation message.
- Moving the pointer off the video card mid-fade restores the placeholder image to fully opaque and pauses the video.
- If WebGL rendering is unavailable, the hero shows a static composition of the same artwork and every section, control, and flow remains present and usable.
</edge_cases>

<visual_design>
- Complete debranding is part of the design, not a legal footnote: the only identity shown is the fictional Avery Vale / Nova Racing system. No source person or team name, initials, signature, number, logo silhouette, sponsor, social handle, photographic likeness, recognizable helmet livery, or source-site asset may appear, including inside images, video frames, canvas/WebGL textures, metadata exposed in the UI, or tiny footer copy.
- Dual-tone scarcity: the page is a dark cinematic elite-motorsport profile built from a slate-black dark-green base and a cream hero band, with a single loud neon lime accent. The base background computes to rgb(40, 44, 32) (hex #282c20), section text is the off-white #f4f4ed which computes to rgb(244, 244, 237), and lime #d2ff00 which computes to rgb(210, 255, 0) is reserved for the Store button, the current-menu-item stroke, and hover/highlight states — it does not flood large section backgrounds. The menu overlay and footer backgrounds both compute to rgb(40, 44, 32).
- Three-tier CSS custom properties drive the look: surface tokens (dark-green #282c20, cream #efefe5, off-white #f4f4ed), text tokens (black #111112, off-white #f4f4ed, muted greens #dde1d2 / #b4b8a5), and accent tokens (lime #d2ff00, lime-off #b2c73a, orange #ff6b00). Brand tokens must compute to those exact values.
- The hero is a lighter cream band whose background computes to rgb(239, 239, 229) (hex #efefe5), carrying a faint topographic contour pattern and soft organic blobs, deliberately contrasting with the dark rgb(40, 44, 32) sections that follow it.
- Asymmetric broken-grid composition: the hero is not an equal-column stack — the driver silhouette anchors the center field, the NEXT RACE widget sits lower-left, and the fixed nav chrome occupies the top edge; section spacing and card gaps align to a consistent baseline unit of 1.25rem (20px) and its multiples rather than arbitrary one-off offsets.
- The stacked AVERY VALE wordmark pairs a serif display treatment for AVERY (the bundled open-license serif display face, weight 400, about 32px at 1440) with a heavy sans treatment for VALE (the bundled Mona Sans Variable face, weight 900, about 32px at 1440), both dark rgb(17, 17, 18); large display copy (the impact statement, menu items, footer statement) renders in the serif display face while body and labels use Mona Sans Variable.
- Display type uses fluid clamp() sizing: the impact statement, menu item labels, footer brand statement, and preloader word scale continuously with viewport width rather than jumping at breakpoints. At 1440 the impact statement renders in the display face at roughly 132px with a line-height near 109px in the lime-off color rgb(178, 199, 58), and the footer statement renders in the display face at roughly 72px in the off-white rgb(244, 244, 237) with its characters filling into lime-off.
- The Store button is a solid lime pill (background rgb(210, 255, 0)) with dark text rgb(17, 17, 18), a small bag icon, a rounded radius near 0.74rem (about 12px), and a label in the variable sans face at weight 800 near 20px; the hamburger and the menu close control are square outlined buttons about 60px by 60px with rounded corners.
- The full-screen menu is a dark-green overlay (rgb(40, 44, 32)) with a topographic line texture, oversized uppercase display-face menu items on the left (roughly 96px at 1440) over a staggered four-image fictional editorial grid on the right, with the current HOME item de-emphasized to the muted green rgb(180, 184, 165) and marked by a lime stroke.
- Media sections use rounded-corner image cards; the helmet cards are tall portrait cards (about 445 by 594 at 1440, three across) masked to a helmet silhouette; marquees are edge-faded so the fictional partner marks dissolve at the left and right margins.
- Replacement-asset craft is mandatory. Create or generate the replacement files roughly from scratch inside /app; do not omit a surface because the reference asset cannot be reused. The visible asset set must include: one layered hero racer portrait/cutout; at least six distinct horizontal-strip images; a separate set of at least four menu photos; three distinct two-state helmet artworks; five distinct fictional partner marks; one poster plus one VP9 WebM loop; and original SVG artwork for the AV monogram, contour field, circuit outline, laurels, telemetry stroke, bag, menu, and close icons. Flat color blocks, repeated stock thumbnails, emoji, text-only stand-ins, CSS rectangles posing as logos, or one image reused across roles do not satisfy this requirement.
- The hero artwork is a composed depth scene, not a lone rectangle: the original racer cutout/portrait is independently layered with contour lines, translucent organic blobs, soft shadow or reflection planes, and the race widget. At desktop size these layers overlap with intentional depth while keeping the face/silhouette and widget legible.
- The three helmet cards preserve the reference's object-study quality without copying its liveries: each fictional helmet has a recognizably different surface system (for example geometric, iridescent, and typographic), shaped masking, highlight/shadow modelling, and a distinct hover-reveal state. The fictional partner marks likewise vary in symbol and wordmark construction while sharing one monochrome optical weight.
- The WebGL and interactive vector-animation layers also use newly authored debranded files: render an original local GLB racing sculpture or helmet with original base-color, roughness, and metallic textures under a local HDR environment, and use at least one original local vector-animation asset for the AV monogram, telemetry, button, or transition motif. The 3D scene shows visibly different matte, glossy, and reflective material responses; the vector motif stays crisp and visibly reacts to hover, press, or progress rather than looping as an unrelated decoration.
- The newsletter form matches the footer treatment: the email field is a dark input with off-white text and a visible focus ring, the Subscribe control uses the lime accent with dark text, and the inline error renders in a clearly distinct warning treatment.
</visual_design>

<motion>
- Signature interaction: scrolling vertically through the pinned horizontal media section drives the media row sideways so later cards scroll into view as a scroll-linked transform tied to scroll progress; scrolling back reverses the travel. This is the page's primary scroll-storytelling beat and must not be a static non-pinned row.
- Scroll storytelling sequence on a fresh load: after the preloader clears, vertical scroll moves through the cream hero, the pinned horizontal media chapter, the impact statement character fill, the helmet grid, the collaborators marquee, the social video card, and the footer statement fill — each section advances the narrative rather than appearing as an unrelated stacked block.
- Page transition: the lime LOAD VALE preloader starts covering the viewport and animates out (fading and clearing) to reveal the page; it can be replayed and must never permanently block content.
- Menu open and close: opening the menu expands the dark-green overlay from a clipped ellipse to full-screen; the overlay transitions clip-path and visibility over 0.75s on the cubic-bezier(0.65, 0.05, 0, 1) easing (getAnimations on the real element reports a 750ms duration with that easing), and closing collapses it back. This must animate on the real hamburger and X and Escape controls, not snap instantly.
- Inertial easing system: interactive chrome (menu overlay, Store split reveal, helmet reveal, text-hover color shifts) uses the shared non-linear cubic-bezier(0.65, 0.05, 0, 1) default rather than mechanical linear tweens that start and stop at constant speed.
- Store button hover: hovering the Store button runs a split-text reveal where the STORE label slides up to expose an identical copy, over about 0.4s on the default cubic-bezier(0.65, 0.05, 0, 1) easing.
- Text-hover links: hovering any nav or footer text link (ON TRACK, OFF TRACK, CALENDAR, the socials, the legal links) shifts its color toward lime or lime-off.
- Helmet grid hover: hovering a helmet card scales its base image about 1.1x, wipes in the masked reveal image via a clip-path change (the reveal image transitions clip-path and transform over 0.75s on cubic-bezier(0.65, 0.05, 0, 1)), and turns the card index label lime.
- Social hover-to-play: hovering the social video card plays the muted looping video and fades its placeholder image opacity from 1 to 0 over a 0.3s opacity transition; leaving the card pauses and restores the placeholder.
- Marquees: the collaborator and footer partner marquees translate continuously via the translateXLeft and translateXRight keyframes on a 30-second linear infinite loop and stay animation-play-state paused until their strip is in view.
- Split text: the impact statement and the footer statement fill their characters into the highlight color in sequence when scrolled into view, one after another rather than all at once.
- Interactive vector motif: the original local vector-animation mark responds to a real hover, press, menu state, or scroll-progress change with a crisp vector state transition; it is not a static image and not an autoplay-only loop disconnected from the interface.
- Native smooth scroll for in-page jumps: activating HOME, ON TRACK, OFF TRACK, CALENDAR, or the wordmark eases the page to the target section while the horizontal pin's position:sticky relationship stays intact; a smooth-scroll helper must stay synchronized with the scroll-linked horizontal track and must not fight the user's scroll direction or break sticky pinning.
- Newsletter feedback: the inline confirmation message animates in with a short fade or slide of roughly 200 to 300 milliseconds rather than appearing instantly.
- Required hover feedback: the Store button, the hamburger, the menu close control, nav and footer links, helmet cards, the Subscribe control, and the video card must each give a visible hover response; a completely static pointer response is a failure.
- Reduced motion: under prefers-reduced-motion reduce the page settles immediately rather than hanging on scroll-linked animation, the preloader does not block content, in-page jumps use instant scroll, and the continuous marquees do not run.
</motion>

<responsiveness>
- At desktop widths at or above 992px the nav is a single row about 100px tall with the wordmark left, the monogram mark centered, and Store plus hamburger right.
- At 390px mobile the nav wraps to about 140px tall, the AV monogram and a centered AVERY VALE wordmark (about 24px) with the NOVA RACING SINCE 2019 sub-line become visible and stacked, the helmet grid collapses to a single column (card about 326 by 435), the impact heading drops to about 48px, and the menu photo grid is hidden.
- Breakpoints act at 992, 991, 767, and 479 pixels; display and body type use fluid clamp()/vw scaling so sizes change continuously rather than jumping between adjacent widths.
- No content clips or overflows the viewport and no horizontal scrollbar appears at 390px width.
</responsiveness>

<accessibility>
- Prefer semantic HTML landmarks and native controls (header, nav, main, footer, button, label) for the page chrome; custom overlays expose the matching ARIA roles only where native elements cannot carry the behavior.
- The menu overlay behaves as a modal dialog: it also closes when the Escape key is pressed, traps focus while open, and returns focus to the hamburger button on close.
- Every interactive control (Store button, hamburger, menu items, socials, legal links, the email field, Subscribe) is reachable and operable with the keyboard alone and shows a visible focus indicator.
- Icon-only controls (the hamburger and the menu close control) expose descriptive accessible names.
- Split-text headlines keep the original phrase as an aria-label on the heading container while the individual character spans are hidden from the accessibility tree.
- Text over the cream hero and dark-green sections, and all control labels, meet WCAG AA contrast; lime accents on dark text for the Store button stay high-contrast.
- The newsletter inline error and confirmation are announced through an aria-live region as well as shown visually.
- The social video is muted and never plays audio.
- The hero canvas or WebGL layer is treated as decorative or labelled (role img with a descriptive aria-label, or aria-hidden when a static silhouette sibling already conveys the artwork).
</accessibility>

<performance>
- The homepage is interactive within about 2 seconds of a local cold load, and stays interactive while heavier media, 3D, and vector-animation assets finish streaming in without shifting the layout.
- Loading and exercising the full page (preloader dismiss, menu open and close, hover states, scroll-linked sections, hover-to-play video, marquees, newsletter submit) emits no console errors, hydration warnings, or unhandled promise rejections.
- Continuous scrolling from top to bottom shows no visible hitching or dropped frames through every animated section.
- After first paint no visible layout jumps occur as fonts, images, or the hero scene finish loading; media regions hold their space from the start.
</performance>

<writing>
- Rendered copy matches these exact strings: the tab title 2025 Apex Grand Prix Driver — Avery Vale; the preloader words LOAD VALE; the menu items HOME, ON TRACK, OFF TRACK, CALENDAR; the social labels CLIPS, PHOTOS, VIDEO, LIVE; the business contact hello@averyvale.example; the hero widget copy NEXT RACE, ALPINE GP, and NOVA RACING SINCE 2019; the legal links Privacy Policy, Terms, Cookies.
- Navigation, menu, and button labels keep the reference's uppercase convention; supporting body copy uses one consistent sentence-case convention.
- The newsletter error names the email field and states the fix; the confirmation states that the signup succeeded; no lorem or filler placeholder text appears anywhere in the shipped UI.
</writing>

<requirements>
- Copyright and rights-clearance prohibition: apart from required npm dependency code and explicitly specified open-license fonts or generic utility icons used under their licenses, every creative asset and every piece of visible editorial copy must be newly authored or generated specifically for this fictional build. Do not use scraped, stock, press, social-media, portfolio, source-site, screenshot-derived, copyrighted, trademarked, or otherwise third-party-controlled creative material, and do not make a trace, near-copy, style-identical imitation, or recognizable derivative of it. This applies to raster pixels, individual video frames and audio, SVG paths, canvas/WebGL/Rive artboards and textures, 3D geometry/materials/HDR environments, PDFs, icon/mark silhouettes, metadata, filenames, alt text, and hidden/preloaded assets. If provenance is uncertain, create a fresh fictional replacement.
- Stack: build the homepage as a static-first Astro site. Interactive chrome (the menu overlay, the Store button, the social video card, and the newsletter form) is implemented as Svelte islands, with Bits UI providing the overlay/dialog and button primitives; all shared client state (preloader visible or hidden, menu open or closed, the active or focused homepage region, video play state, newsletter form state) lives in memory in Svelte stores shared by the islands. Do not model a users or records CRUD collection; this is a content homepage. Do not substitute React, Next, WordPress, or any other framework for the page build.
- Styling: Tailwind CSS 4.3.2, pinned, as the styling base with the brand design tokens declared in the Tailwind theme layer; Tailwind owns layout, spacing, and custom surfaces.
- Animation allowlist: GSAP (including its scroll and split-text plugins) for timeline orchestration and scroll choreography synchronized with native or Lenis smooth scroll, Lenis for inertial smooth scroll that preserves position:sticky and native touch physics, Three.js with locally bundled Draco and KTX2 decoders for the WebGL hero layer, and the Rive runtime with its WASM binary served same-origin for vector animation. No other animation libraries. In-page section jumps must remain smooth-scroll synchronized with the pinned horizontal track.
- Forms: the newsletter form is driven by a form library paired with a schema validator (Zod or Valibot); the schema defines the rules and validation is fully client-side with inline per-field errors before submit.
- Icons and marks: author the AV identity and all decorative marks as original bundled SVG assets shipped in /app; generic utility icons may come from an installed npm icon package, but no icon CDN or third-party brand mark is allowed.
- Asset originality and scratch-build rule: author or generate every photography, video, fictional partner mark, monogram, 3D model, texture, HDR environment, and vector-animation file as a new replacement inside /app. Match the reference's aspect ratios, visual density, and layer counts, but do not copy, derive, trace, recolor, rename, decode, transcode, or redistribute any file from the source site, /reference-screenshots, or an externally supplied reference-asset bundle. A missing asset is not an acceptable debranding strategy.
- Required authored files: ship at minimum the raster/editorial and SVG set enumerated in <visual_design>, one original .glb, original material texture maps (including base-color, roughness, and metallic data), one local .hdr environment, and one original .riv file plus its locally served runtime WASM. These files must load successfully and contribute visibly to the rendered page; empty, corrupt, transparent, single-frame, renamed, or unused files do not count.
- Fonts: self-host the open-license Mona Sans Variable for sans text and a bundled open-license serif display face with similar width and weight character to the reference display type; rendered text must resolve to these bundled faces, not a Times or system fallback. No font CDNs.
- Do not use localStorage, sessionStorage, cookies, or any other browser storage API for state; nothing may be written to browser storage while the homepage is exercised.
- Offline and local-asset contract: the homepage must run fully offline. Every font, image, video, stylesheet, script, vector-animation file, WASM binary, and GL asset must load from the same origin; no runtime requests may go to any CDN, font host, video host, or analytics host.
- The social video card must use a plain local video element whose first source is a bundled VP9 .webm created for this fictional page; it must contain changing frames, loop muted, and never contact any remote video host. An optional fallback may follow the WebM source.
- If WebGL rendering is unavailable the hero must fall back to a static composition of the same artwork without breaking any section or flow.
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon set.
- Serve the built homepage on port 3000.
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
- Destinations: hero; horizontal-media; helmet-grid; collabs; social-stream; footer; menu
- Session operations: start; pause; restart

Mechanics exclusions:
- Menu overlay open/close slide stays Playwright-observed
- Horizontal-track and helmet-grid scroll-linked motion stays Playwright-observed
- Social hover-to-play and placeholder fade stays Playwright-observed
- WebGL / Rive rendering stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
