<summary>
Build a Lando Norris Formula 1 driver homepage using Astro with static delivery and Svelte islands for interactive chrome, Svelte stores for in-memory client state, Tailwind CSS 4.3.2, and Bits UI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate the composition, layout, and motion they show, substituting original
placeholder media and marks wherever the source images carry brand-owned
assets. Where a screenshot and the text conflict, the text wins. Do not copy
the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished homepage must exhibit):
- The homepage serves route / and the browser tab title reads exactly 2025 McLaren Formula 1 Driver — Lando Norris.
- On load a full-bleed lime page-transition preloader covers the viewport showing the word LOAD NORRIS, then clears within about one to two seconds to reveal the homepage underneath; it does not remain on screen blocking content.
- A fixed navigation bar stays pinned to the top over all sections and contains, left to right, a stacked LANDO NORRIS text wordmark (LANDO above NORRIS), a centered original placeholder monogram mark of the same size and placement as the reference monogram, a lime Store button labelled STORE, and a square hamburger button.
- Clicking the hamburger opens a full-screen menu overlay that covers the viewport in dark green with a faint topographic line pattern; the overlay lists the menu items HOME, ON TRACK, OFF TRACK, and CALENDAR, a social row of TikTok, Instagram, YouTube, and Twitch, the business contact business@landonorris.com, and an image grid of original placeholder photos.
- Inside the open menu the HOME item is the current item and shows a lime telemetry-stroke line drawn through its label; the other three items do not show that stroke.
- The menu overlay closes when the X control inside it is clicked; after closing, the overlay is no longer visible and the homepage is interactive again.
- The hero fills at least the first full viewport height and shows an off-white blob-and-topographic field with an original driver-silhouette placeholder image behind the chrome; a NEXT RACE widget sits at the lower left showing the eyebrow NEXT RACE, a circuit outline graphic, the label SPA GP, a laurel graphic, and the team line MCLAREN F1 SINCE 2019.
- A horizontal media strip holds a row of at least six landscape placeholder photo cards that translate sideways as the page is scrolled vertically through that pinned section, so later cards come into view without the page navigating away.
- An impact statement section between the media strip and the helmet grid renders an oversized display headline in the lime-off color.
- A helmet grid shows at least three tall portrait cards masked to a helmet silhouette and built from original placeholder imagery, each carrying a visible index label.
- A collaborators strip shows a horizontal marquee of at least five distinct original placeholder partner logos.
- A social video card shows a still placeholder image on top of a muted looping locally served placeholder video.
- The footer shows a large split-text brand statement, a second marquee of the same original placeholder partner logos, the LANDO NORRIS wordmark, a newsletter signup form, and a row of legal links (Privacy Policy, Terms, Cookies).
- The newsletter signup form has one email field and a Subscribe control; the Subscribe control stays disabled until the field holds a validly formatted email address.
- Submitting the newsletter form with a valid email shows an inline confirmation message in the footer and clears the field, without any document reload or navigation.
- All navigation chrome (wordmark, monogram mark, menu items, socials, business contact, legal links, Store button) stays inside the single homepage: activating any of them either scrolls to a homepage region or performs a no-op, and none of them reload the document or navigate to another origin.
</core_features>

<user_flows>
- Menu flow: clicking the hamburger opens the overlay covering the viewport with the HOME item showing its current-item stroke; activating a menu item or the X control closes the overlay; after closing, the fixed navigation bar is still pinned, the page scroll position and section content are unchanged, and no document reload has occurred at any step.
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
- The page reads as a dark, cinematic F1 brand site: the base background computes to rgb(40, 44, 32) which is hex #282c20, section text is the off-white #f4f4ed which computes to rgb(244, 244, 237), and the single loud accent is lime #d2ff00 which computes to rgb(210, 255, 0), used on the Store button, the current-menu-item stroke, and hover states. The menu overlay and footer backgrounds both compute to rgb(40, 44, 32).
- The hero is a lighter off-white cream band whose background computes to rgb(239, 239, 229) (hex #efefe5), carrying a faint topographic contour pattern and soft organic blobs, deliberately contrasting with the dark rgb(40, 44, 32) sections that follow it.
- The stacked LANDO NORRIS wordmark pairs a serif display treatment for LANDO (the bundled serif display face, weight 400, about 32px at 1440) with a heavy sans treatment for NORRIS (the bundled variable sans face, weight 900, about 32px at 1440), both dark rgb(17, 17, 18); large display copy (the impact statement, menu items, footer statement) renders in the serif display face while body and labels use the variable sans face.
- The impact statement renders in the display face at roughly 132px with a line-height near 109px in the lime-off color rgb(178, 199, 58) at 1440, and the footer statement renders in the display face at roughly 72px in the off-white rgb(244, 244, 237) with its characters filling into lime-off.
- The Store button is a solid lime pill (background rgb(210, 255, 0)) with dark text rgb(17, 17, 18), a small bag icon, a rounded radius near 0.74rem (about 12px), and a label in the variable sans face at weight 800 near 20px; the hamburger and the menu close control are square outlined buttons about 60px by 60px with rounded corners.
- The full-screen menu is a dark-green overlay (rgb(40, 44, 32)) with a topographic line texture, oversized uppercase display-face menu items on the left (roughly 96px at 1440) over a staggered placeholder photo grid on the right, with the current HOME item de-emphasized to the muted green rgb(180, 184, 165) and marked by a lime stroke.
- Media sections use rounded-corner image cards; the helmet cards are tall portrait cards (about 445 by 594 at 1440, three across) masked to a helmet silhouette; marquees are edge-faded so the placeholder logos dissolve at the left and right margins.
- The newsletter form matches the footer treatment: the email field is a dark input with off-white text and a visible focus ring, the Subscribe control uses the lime accent with dark text, and the inline error renders in a clearly distinct warning treatment.
- Brand tokens must compute to their exact values, including lime #d2ff00, dark-green #282c20, white #f4f4ed, black #111112, lime-off #b2c73a, green-off-white-1 #dde1d2, green-off-white-2 #b4b8a5, and orange #ff6b00.
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
- Split text: the impact statement and the footer statement fill their characters into the highlight color in sequence when scrolled into view, one after another rather than all at once.
- Newsletter feedback: the inline confirmation message animates in with a short fade or slide of roughly 200 to 300 milliseconds rather than appearing instantly.
- Required hover feedback: the Store button, the hamburger, the menu close control, nav and footer links, helmet cards, the Subscribe control, and the video card must each give a visible hover response; a completely static pointer response is a failure.
- Reduced motion: under prefers-reduced-motion reduce the page settles immediately rather than hanging on scroll-linked animation, the preloader does not block content, and the continuous marquees do not run.
</motion>

<responsiveness>
- At desktop widths at or above 992px the nav is a single row about 100px tall with the wordmark left, the monogram mark centered, and Store plus hamburger right.
- At 390px mobile the nav wraps to about 140px tall, the monogram mark and a centered LANDO NORRIS wordmark (about 24px) with the MCLAREN F1 SINCE 2019 sub-line become visible and stacked, the helmet grid collapses to a single column (card about 326 by 435), the impact heading drops to about 48px, and the menu photo grid is hidden.
- Breakpoints act at 992, 991, 767, and 479 pixels and type scales fluidly rather than jumping between adjacent widths.
- No content clips or overflows the viewport and no horizontal scrollbar appears at 390px width.
</responsiveness>

<accessibility>
- The menu overlay behaves as a modal dialog: it also closes when the Escape key is pressed, traps focus while open, and returns focus to the hamburger button on close.
- Every interactive control (Store button, hamburger, menu items, socials, legal links, the email field, Subscribe) is reachable and operable with the keyboard alone and shows a visible focus indicator.
- Icon-only controls (the hamburger and the menu close control) expose descriptive accessible names.
- Split-text headlines keep the original phrase as an aria-label on the heading container while the individual character spans are hidden from the accessibility tree.
- The newsletter inline error and confirmation are announced through an aria-live region as well as shown visually.
- The social video is muted and never plays audio.
</accessibility>

<performance>
- The homepage is interactive within about 2 seconds of a local cold load, and stays interactive while heavier media, 3D, and vector-animation assets finish streaming in without shifting the layout.
- Loading and exercising the full page (preloader dismiss, menu open and close, hover states, scroll-linked sections, hover-to-play video, marquees, newsletter submit) emits no console errors, hydration warnings, or unhandled promise rejections.
- Continuous scrolling from top to bottom shows no visible hitching or dropped frames through every animated section.
- After first paint no visible layout jumps occur as fonts, images, or the hero scene finish loading; media regions hold their space from the start.
</performance>

<writing>
- Rendered copy matches these exact strings: the tab title 2025 McLaren Formula 1 Driver — Lando Norris; the preloader word LOAD NORRIS; the menu items HOME, ON TRACK, OFF TRACK, CALENDAR; the social labels TikTok, Instagram, YouTube, Twitch; the business contact business@landonorris.com; the hero widget copy NEXT RACE, SPA GP, and MCLAREN F1 SINCE 2019; the legal links Privacy Policy, Terms, Cookies.
- Navigation, menu, and button labels keep the reference's uppercase convention; supporting body copy uses one consistent sentence-case convention.
- The newsletter error names the email field and states the fix; the confirmation states that the signup succeeded; no lorem or filler placeholder text appears anywhere in the shipped UI.
</writing>

<requirements>
- Stack: build the homepage as a static-first Astro site. Interactive chrome (the menu overlay, the Store button, the social video card, and the newsletter form) is implemented as Svelte islands, with Bits UI providing the overlay/dialog and button primitives; all shared client state (preloader visible or hidden, menu open or closed, the active or focused homepage region, video play state, newsletter form state) lives in memory in Svelte stores shared by the islands. Do not model a users or records CRUD collection; this is a content homepage. Do not substitute React, Next, WordPress, or any other framework for the page build.
- Styling: Tailwind CSS 4.3.2, pinned, as the styling base with the brand design tokens declared in the Tailwind theme layer; Tailwind owns layout, spacing, and custom surfaces.
- Animation allowlist: GSAP (including its scroll and split-text plugins) for timelines and scroll choreography, Lenis for smooth scroll, Three.js with locally bundled Draco and KTX2 decoders for the WebGL hero layer, and the Rive runtime with its WASM binary served same-origin for vector animation. No other animation libraries.
- Forms: the newsletter form is driven by a form library paired with a schema validator (Zod or Valibot); the schema defines the rules and validation is fully client-side with inline per-field errors before submit.
- Icons and marks: all icons, logos, monograms, and decorative marks are original bundled SVG assets shipped in /app or installed from an npm icon package; no icon CDN and no third-party brand marks.
- Asset originality: all photography, video, partner logos, the monogram mark, and 3D or vector-animation files are original or generated placeholders matching the reference's aspect ratios, dimensions, and layer counts; do not ship any brand-owned media.
- Fonts: self-host the open-license Mona Sans Variable for sans text and a bundled open-license serif display face with similar width and weight character to the reference display type; rendered text must resolve to these bundled faces, not a Times or system fallback. No font CDNs.
- Do not use localStorage, sessionStorage, cookies, or any other browser storage API for state; nothing may be written to browser storage while the homepage is exercised.
- Offline and local-asset contract: the homepage must run fully offline. Every font, image, video, stylesheet, script, vector-animation file, WASM binary, and GL asset must load from the same origin; no runtime requests may go to any CDN, font host, video host, or analytics host.
- The social video card must use a plain local video element sourced from a bundled placeholder video file; it must never contact any remote video host.
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
