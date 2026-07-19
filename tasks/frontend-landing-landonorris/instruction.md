<summary>
Build a Lando Norris Formula 1 driver homepage using a static-first Webflow-style rebuild, the OFF+BRAND GSAP and Lenis animation runtime driving in-memory client state, and self-hosted CSS with the Mona Sans Variable and Brier fonts.
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
- The homepage serves route / and the browser tab title reads exactly 2025 McLaren Formula 1 Driver — Lando Norris.
- On load a full-bleed lime page-transition preloader covers the viewport showing the word LOAD NORRIS, then clears within about one to two seconds to reveal the homepage underneath; it does not remain on screen blocking content.
- A fixed navigation bar stays pinned to the top over all sections and contains, left to right, a stacked LANDO NORRIS wordmark (LANDO above NORRIS), a centered LN4 monogram mark, a lime Store button labelled STORE, and a square hamburger button.
- Clicking the hamburger opens a full-screen menu overlay that covers the viewport in dark green with a faint topographic line pattern; the overlay lists the menu items HOME, ON TRACK, OFF TRACK, and CALENDAR, a social row of TikTok, Instagram, YouTube, and Twitch, the business contact business@landonorris.com, and an image grid of photos.
- Inside the open menu the HOME item is the current item and shows a lime telemetry-stroke line drawn through its label; the other three items do not show that stroke.
- The menu overlay closes when the X control inside it is clicked and also closes when the Escape key is pressed; after closing, the overlay is no longer visible and the homepage is interactive again.
- The hero fills at least the first full viewport height and shows an off-white blob-and-topographic field with the driver silhouette behind the chrome; a NEXT RACE widget sits at the lower left showing the eyebrow NEXT RACE, a circuit outline, the label SPA GP, a laurel mark, and the team line MCLAREN F1 SINCE 2019.
- A horizontal media strip holds a row of at least six landscape photo cards that translate sideways as the page is scrolled vertically through that pinned section, so later cards come into view without the page navigating away.
- An impact statement renders in the Brier display face in the lime-off color and, when it scrolls into view, its characters fill in one after another rather than appearing all at once.
- A helmet grid shows at least three tall masked helmet cards; hovering a card scales its base image up slightly, wipes in a second masked reveal image, and turns that card's index label lime.
- A collaborators strip shows a horizontal marquee of at least five partner logos (Mind, PS4, Quadrant, Tumi, Ralph Lauren) that scrolls continuously once the strip is in view.
- A social video card shows a still placeholder image on top of a muted looping local video; hovering the card starts the video playing and fades the placeholder image from fully opaque to fully transparent, and moving the pointer away pauses the video and restores the placeholder.
- The footer shows a large split-text brand statement whose characters fill into the lime-off highlight color, a second continuously scrolling marquee of partner logos, the LANDO NORRIS wordmark, and a row of legal links (Privacy Policy, Terms, Cookies).
- All navigation chrome (wordmark, LN4 mark, menu items, socials, business contact, legal links, Store button) stays inside the single homepage: activating any of them either scrolls to a homepage region or performs a no-op, and none of them reload the document or navigate to another origin.
</core_features>

<visual_design>
- The page reads as a dark, cinematic F1 brand site: the base background computes to rgb(40, 44, 32) which is hex #282c20, section text is the off-white #f4f4ed which computes to rgb(244, 244, 237), and the single loud accent is lime #d2ff00 which computes to rgb(210, 255, 0), used on the Store button, the current-menu-item stroke, and hover states. The menu overlay and footer backgrounds both compute to rgb(40, 44, 32).
- The hero is a lighter off-white cream band whose background computes to rgb(239, 239, 229) (hex #efefe5), carrying a faint topographic contour pattern and soft organic blobs, deliberately contrasting with the dark rgb(40, 44, 32) sections that follow it.
- The stacked LANDO NORRIS wordmark pairs a serif display treatment for LANDO (a serif face, weight 400, about 32px at 1440) with a heavy sans treatment for NORRIS (Mona Sans Variable, weight 900, about 32px at 1440), both dark rgb(17, 17, 18); large display copy (the impact statement, menu items, footer statement) renders in the Brier face while body and labels use Mona Sans Variable.
- The impact statement renders in Brier at roughly 132px with a line-height near 109px in the lime-off color rgb(178, 199, 58) at 1440, and the footer statement renders in Brier at roughly 72px in the off-white rgb(244, 244, 237) with its characters filling into lime-off.
- The Store button is a solid lime pill (background rgb(210, 255, 0)) with dark text rgb(17, 17, 18), a small bag icon, a rounded radius near 0.74rem (about 12px), and a label in Mona Sans Variable weight 800 near 20px; the hamburger and the menu close control are square outlined buttons about 60px by 60px with rounded corners.
- The full-screen menu is a dark-green overlay (rgb(40, 44, 32)) with a topographic line texture, oversized uppercase Brier menu items on the left (roughly 96px at 1440) over a staggered photo grid on the right, with the current HOME item de-emphasized to the muted green rgb(180, 184, 165) and marked by a lime stroke.
- Media sections use rounded-corner image cards; the helmet cards are tall portrait cards (about 445 by 594 at 1440, three across) masked to a helmet silhouette; marquees are edge-faded so logos dissolve at the left and right margins.
- Brand tokens must compute to their exact values, including lime #d2ff00, dark-green #282c20, white #f4f4ed, black #111112, lime-off #b2c73a, green-off-white-1 #dde1d2, green-off-white-2 #b4b8a5, and orange #ff6b00.
- Responsive: at desktop widths at or above 992px the nav is a single row about 100px tall with the wordmark left, mark centered, and Store plus hamburger right; at 390px mobile the nav wraps to about 140px, the LN4 mark and a centered LANDO NORRIS wordmark (about 24px) with the MCLAREN F1 SINCE 2019 sub-line become visible and stacked, the helmet grid collapses to a single column (card about 326 by 435), the impact heading drops to about 48px, and the menu photo grid is hidden. Breakpoints act at 992, 991, 767, and 479 pixels and type scales fluidly rather than jumping.
</visual_design>

<motion>
- Page transition: the lime LOAD NORRIS preloader starts covering the viewport and animates out (fading and clearing) to reveal the page; it can be replayed and must never permanently block content.
- Menu open and close: opening the menu expands the dark-green overlay from a clipped ellipse to full-screen; the overlay transitions clip-path and visibility over 0.75s on the cubic-bezier(0.65, 0.05, 0, 1) easing (getAnimations on the real element reports a 750ms duration with that easing), and closing collapses it back. This must animate on the real hamburger and X and Escape controls, not snap instantly.
- Store button hover: hovering the Store button runs a split-text reveal where the STORE label slides up to expose an identical copy, over about 0.4s on the default cubic-bezier(0.65, 0.05, 0, 1) easing.
- Text-hover links: hovering any nav or footer text link (ON TRACK, OFF TRACK, CALENDAR, the socials, the legal links) shifts its color toward lime or lime-off.
- Horizontal track: scrolling vertically through the pinned horizontal section drives the media row sideways so its later cards scroll into view; this is a scroll-linked transform, not a static row.
- Helmet grid hover: hovering a helmet card scales its base image about 1.1x, wipes in the masked reveal image via a clip-path change (the reveal image transitions clip-path and transform over 0.75s on cubic-bezier(0.65, 0.05, 0, 1)), and turns the card index label lime.
- Social hover-to-play: hovering the social video card plays the muted looping video and fades its placeholder image opacity from 1 to 0 over a 0.3s opacity transition; leaving the card pauses and restores the placeholder.
- Marquees: the collaborator and footer partner marquees translate continuously via the translateXLeft and translateXRight keyframes on a 30-second linear infinite loop and stay animation-play-state paused until their strip is in view.
- Split text: the impact statement and the footer statement fill their characters into the highlight color in sequence when scrolled into view.
- Required hover feedback: the Store button, the hamburger, the menu close control, nav and footer links, helmet cards, and the video card must each give a visible hover response; a completely static pointer response is a failure.
- Reduced motion: under prefers-reduced-motion reduce the page settles immediately rather than hanging on scroll-linked animation, the preloader does not block content, and the continuous marquees do not run.
</motion>

<requirements>
- Stack mandate: this is a faithful static-first rebuild of the Webflow project plus the OFF+BRAND runtime, using local asset paths only. Use GSAP for animation, Lenis for smooth scroll, the Rive @rive-app/canvas-lite@2.26.4 runtime served at /vendor/@rive-app/canvas-lite@2.26.4/, the Three.js WebGL scene served from /assets.itsoffbrand.io/lando/gl/**, jQuery, and the self-hosted Mona Sans Variable and Brier fonts. Do not substitute React, Next, Framer, WordPress, or any other framework for the page build.
- Shared interactive state is the real domain state of this site and must live in memory in the page runtime: preloader state (visible or hidden), menu state (open or closed), the active or focused homepage region, and the social video play state. Do not model a users or records CRUD collection; this is a content homepage.
- Do not use localStorage, sessionStorage, cookies, or any other browser storage API for state; nothing may be written to browser storage while the homepage is exercised.
- Offline and local-asset contract: the homepage must run fully offline. Every font, image, video, stylesheet, script, Rive file, WASM binary, and GL asset must load from the same origin. No requests may go to cdn.prod.website-files.com, assets.itsoffbrand.io, unpkg.com, cdn.jsdelivr.net, player.vimeo.com, or any analytics host at runtime. Serve the Rive WASM under /vendor/@rive-app/canvas-lite@2.26.4/ and the GL asset set under /assets.itsoffbrand.io/lando/gl/** as same-origin local paths.
- The social video card must use a plain local video element sourced from the bundled MP4; it must never contact vimeo.com or any remote video host.
- Content contract: the page title is 2025 McLaren Formula 1 Driver — Lando Norris; the preloader copy is LOAD NORRIS; the menu items are HOME, ON TRACK, OFF TRACK, CALENDAR; the socials are TikTok, Instagram, YouTube, Twitch; the business contact is business@landonorris.com; the hero widget reads NEXT RACE with SPA GP and MCLAREN F1 SINCE 2019; the current menu item is HOME.
- Fonts must resolve to Mona Sans Variable and Brier, not a Times or system fallback.
- The homepage must load and run its interaction workflows (preloader dismiss, menu open and close, hover states, scroll-linked sections, hover-to-play video, marquees) without emitting console errors or unhandled promise rejections.
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
