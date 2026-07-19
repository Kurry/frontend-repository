<summary>
Build a Field Notes Archive American Modernist architecture editorial archive using Nuxt 3 with Vue 3 server-side rendering, Pinia state, Tailwind CSS 4.3.2, and Reka UI, with Storyblok-modelled content served from local fixtures and a GSAP plus Lenis plus Plyr motion layer, reproducing a filing-cabinet metaphor across ten routes.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They define composition, density,
crop, proportions, and motion; this text wins on identity and content. Create
all visible identity and media for Field Notes Archive from scratch. Do not
copy, trace, recolor, rename, crop, decode, or otherwise derive screenshot or
source-site assets, and do not copy the screenshots into /app.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- The app is a multi-route archive, not a single-page shell: it resolves ten distinct routes with no full page reload between in-app navigations — the home route, the about route, and eight architect case routes at cases ada-mercer, cases elias-north, cases mara-voss, cases julian-kade, cases imani-vale, cases pavel-rowan, cases lucian-shore, and cases mae-calder; each case route is reachable the same way, by clicking that architect's tag on the home stack, and each route remains loadable directly by its own URL
- The home route shows a fixed centered header whose left element is a newly authored Field Notes Archive wordmark that returns to home and whose right element is a single About navigation item; the header background is a translucent dark bar with a hairline bottom border and a blurred backdrop
- The home route hero shows the display title American modernism and a supporting paragraph describing early twentieth century American architects who built Modernism independently of Europe; the document title of the home route is exactly Field Notes Archive—American Modernist Architecture
- The home route shows a stack of four category groups, in this top to bottom order with these exact names, cover colors, and architect tags: Organic & Early Modernism with cover color hex 1E4BD7 and tags Ada Mercer and Elias North; Expressive with cover color hex 0C7866 and tag Mara Voss; Monumental Modernism with cover color hex 581E70 and tags Julian Kade, Imani Vale, and Pavel Rowan; Place / culture continuity with cover color hex D71E1E and tags Lucian Shore and Mae Calder; every architect name appears on a physical paper tag tab attached to its category cover, so all eight architect names are present across the four groups
- Each category group shows a short category thesis line and a chevron affordance; clicking a category cover header unfolds that group, and the fourth category cover reveals the footer content when unfolded
- Every case route shows the fictional architect name as the largest heading, a colored folder whose cover uses that architect's category color, and a portrait sheet in portrait proportion carrying a distinct newly authored portrait, a fictional born and died line, and a short biography essay; the folder cover opens to reveal the sheet
- Every case route shows rotated sibling tags linking to the other architects in the same category (Julian Kade, Imani Vale, and Pavel Rowan link to each other; Ada Mercer and Elias North link to each other; Lucian Shore and Mae Calder link to each other), and clicking a sibling tag swaps to that sibling case route
- Every case route shows a scrapbook region of loose items positioned at rotated offsets, drawn from these item types: research notes, photographs, a paperclip graphic, a plan or drawing preview, and depending on the architect a video poster, a PDF preview, or an audio card; each scrapbook item can be dragged with the pointer to a new position within the scrapbook region and stays where it is released
- Every case route shows an overscroll affordance at the bottom labelled to open the next case; triggering it lifts the current folder upward and swaps to the next architect case route in sequence
- The case document title of each architect matches exactly: Ada Mercer—Field Notes Archive; Elias North—Field Notes Archive; Mara Voss—Field Notes Archive; Julian Kade—Field Notes Archive; Imani Vale—Field Notes Archive; Pavel Rowan—Field Notes Archive; Lucian Shore—Field Notes Archive; Mae Calder—Field Notes Archive
- Case routes that have a video (Mara Voss, Ada Mercer, Imani Vale, Elias North, Pavel Rowan) show a distinct video-poster scrapbook item that opens a locally bundled newly authored VP9 WebM with a matching local poster image; the popup never embeds a live external video player
- The Julian Kade case route shows an audio scrapbook item that opens a waveform audio player offering two parts, julian_kade_part_1 and julian_kade_part_2, each drawing waveform bars from local waveform data and each playing locally bundled original or generated placeholder audio with a working play and pause control
- Opening any media popup dims the page behind it and disables background scroll; a red circular close button and clicking the dimmed backdrop both close the popup and stop any playing media
- The about route shows a long form essay that rejects a Bauhaus only origin story for Modernism, situates the archive in a Ukrainian architectural education, states the selection principles of industrial materials, integration with nature, and bold functional form, deliberately includes the late figures Imani Vale and Mara Voss, and closes with a line that the folder is open; the about document title is exactly About Field Notes Archive—The Archive & The Idea; the fixed home header is forced hidden on the about route
- The about route shows a gallery of four large newly authored architecture photographs with captions naming Julian Kade's Tide Court, Julian Kade's River Assembly Hall, Pavel Rowan's Northline Arts Building, and Imani Vale's East Archive Pavilion, plus a newly authored archivist signature graphic and a red circular close button that returns to home
- The footer, revealed inside the unfolded home stack cover, shows two newly authored rotating wind rose graphics, an architectural scale graphic, a newly authored signature rendered through a CSS mask rather than an image tag, and a fictional studio credit mark that is the one link allowed to present outbound navigation
- No route performs a backend fetch for its own content, fonts, imagery, audio, or video; every asset resolves locally from the candidate origin
</core_features>

<user_flows>
- Opening a case from home: clicking an architect tag on the home stack swaps the visible route to that architect's case without a full page reload; in the same flow the fixed home header hides, a case sub-header appears showing a link back to home and the architect's category name, the document title changes to that architect's exact case title, and the case renders the architect's name, category-colored folder, portrait sheet, sibling tags, and scrapbook; clicking the sub-header home link returns to the home route with all four category groups and their eight tags still present
- Sibling navigation: from the Julian Kade case, clicking the Imani Vale sibling tag swaps to the Imani Vale case using the same navigation path as a home tag; the largest heading, the folder color, and the document title all update to Imani Vale's values, and the sibling tag region recomputes to link to Julian Kade and Pavel Rowan
- Overscroll advance: triggering the overscroll affordance at the bottom of a case swaps to the next architect case in sequence; the case sub-header category name, the largest heading, the folder color, and the document title all update to the new architect without a full page reload
- Media round trip: on a video case, clicking the video poster opens the popup, dims the page, and disables background scroll; pressing play shows visible playing state in the player; closing through the red circular close button or the dimmed backdrop stops the media and restores background scroll, and the case beneath is unchanged
- Deep-link parity: loading any of the ten routes directly by its URL renders the same view as reaching it through in-app navigation, including the same header or sub-header state and the same exact document title
- In-memory baseline: after dragging scrapbook items to new positions on a case, reloading that case route returns every scrapbook item to its seeded position, because all client state lives in memory
</user_flows>

<edge_cases>
- Mara Voss, being alone in its category, shows only its own tag in the sibling tag region, and that tag does not navigate away from the Mara Voss case
- While a media popup is open the page behind it cannot scroll; every close path of the popup, the red circular close button and the dimmed backdrop alike, stops any audio or video that is still playing
- A scrapbook item released at the boundary of the scrapbook region stays within the region and remains draggable afterward
- Triggering the overscroll affordance once advances exactly one case in the sequence, never two
</edge_cases>

<visual_design>
- Complete debranding is mandatory: Field Notes Archive and its eight fictional architects are the only visible archive identity. No source-site name or domain, real architect or building name, source logo silhouette, recognizable source photograph, distinctive source copy, source metadata, or source destination appears anywhere in the rendered UI or shipped asset filenames.
- Required scratch-authored asset inventory: one Field Notes Archive wordmark; eight distinct fictional architect portraits; a complete, visibly populated scrapbook for every case; five distinct VP9 WebM videos and five matching poster images; two local Julian Kade audio files plus both waveform-data sets; four about-gallery architecture images; an archivist signature; two wind roses; an architectural scale; a CSS-mask signature; a fictional studio credit mark; paperclip, plan/drawing, PDF-preview, chevron, close, and media-control artwork. Each item must be visibly used in the reference role, crop, density, and layer count—no omitted surface, empty card, generic repeated image, or unused dummy file satisfies the inventory.
- The color system is three-tier CSS custom properties: surface tokens for the near black page background rgb(25, 25, 25) which is hex 191919 and the translucent header bar; text tokens for cream light text rgb(253, 250, 247) which is hex fdfaf7 and body gray rgb(120, 122, 127) which is hex 787a7f; scarce accent tokens for the four category covers at exact fills rgb(30, 75, 215) Organic & Early Modernism, rgb(12, 120, 102) Expressive, rgb(88, 30, 112) Monumental Modernism, and rgb(215, 30, 30) Place / culture continuity, which are hex 1E4BD7, 0C7866, 581E70, and D71E1E, all with white text rgb(255, 255, 255), plus accent yellow hex FFE927 reserved only as a case or stack page background variant — category colors and yellow do not flood general chrome
- Cream text on the dark surface and white text on the four category covers meet WCAG AA contrast; body gray on the dark surface stays legible as secondary copy
- The fixed header is a translucent dark bar whose background computes to rgba(25, 25, 25, 0.8), which is hex 191919 at eighty percent alpha, with a one pixel hairline bottom border computing to rgba(255, 255, 255, 0.1) and a blurred backdrop of blur 100 pixels; its height computes to 3.75rem, which is 60 pixels at the desktop root font size, its z index is 1000, and the case sub-header shares the same 60 pixel height
- Display titles, meaning the hero title and the about title and the case architect names, use a bundled open-license condensed grotesque display face with similar width and weight character to the reference, at weight 700, uppercase, with a tight line height near 0.8; at a 1440 pixel width the hero title renders around 145 pixels, a case architect name around 120 pixels, and the about title at 52 pixels which is 3.25rem; body and tag text use a bundled open-license serif text face at weight 400 and render at 20 pixels for the hero paragraph and the tags at a 1440 pixel width; navigation, footer, captions, and monospace copy use IBM Plex Mono, with the nav item at 16 pixels and a 32 pixel line height, the footer at 12 pixels uppercase, and gallery captions at 14 pixels; all three families are self hosted and resolve locally without any web font service request
- Display, body, and caption sizes use fluid clamp scales so resizing between 390 and 1440 pixels changes type continuously rather than only jumping at breakpoint thresholds
- Spacing, header height, stack offsets, and scrapbook placements align to a consistent rem baseline unit at the desktop root, with offsets landing on multiples of 0.25rem rather than arbitrary one-off pixel values
- The home stack is a vertically stacked set of four colored folder covers with a three dimensional perspective of 3000 pixels, a stack border radius of four pixels, and rotation tokens of negative three degrees and a one rem offset; on large screens the stack is full height
- Each architect tag is a tag shaped tab in the serif text face at 1.625rem on desktop; tags start invisible and become visible as part of the stack reveal
- Case pages compose as a controlled broken grid: the oversized display architect name sits behind and around the portrait folder sheet, sibling tags sit at rotated vertical offsets beside the sheet, and scrapbook items sit at irregular rotated positions while remaining fully legible and operable; the composition is asymmetric on purpose, not an equal-width card stack
- Case pages present the folder as a portrait sheet whose computed aspect ratio is 210 by 297, a measured ratio of about 0.707, carrying the portrait image, a monospace born and died line, the architect name, and biography text, with a texture overlay layered at forty percent opacity in exclusion blend mode; the colored cover sits over the sheet in the same category color, for example the Julian Kade cover computing rgb(88, 30, 112), and opens away from the sheet
- The scrapbook items are visually distinct ephemera: cream sticky notes at ninety seven percent opacity, white bordered photographs at slight rotations, a small paperclip, plan and PDF and video previews on white cards, and an audio card; items carry small monospace type labels
- The about route is a two column layout on desktop, the essay on the left and the gallery on the right; gallery captions are IBM Plex Mono at fourteen pixels at sixty percent opacity
- The footer is IBM Plex Mono at 0.75rem uppercase with a 3.75rem gap between its wind roses, scale graphic, signature mask, and studio credit mark
</visual_design>

<motion>
- Signature interaction: the folder open transition, triggered by clicking an architect tag on the home stack, is one orchestrated timeline — it morphs the folder from its stack slot into the case layout and rotates the colored cover in three dimensions on the Y axis from closed to one hundred eighty degrees open, revealing the sheet beneath; the opened cover computes a transform of matrix3d starting negative one, a three dimensional rotateY, over a transition of transform 0.8 seconds with the primary inertial easing cubic-bezier(0.33, 1, 0.68, 1); it is a three dimensional rotation and position morph, not a flat opacity crossfade; then the architect name reveals character by character with a horizontal stagger, sibling tags rise into view, and scrapbook items rise from below and fade in, in that choreographed order rather than as four unrelated fades
- Primary motion across folder open and close, hero split reveal, gallery crossfade, hover lifts, and popup enter uses inertial easing cubic-bezier(0.33, 1, 0.68, 1) or an equally springy non-linear curve; signature transitions do not start and stop at constant linear speed
- The folder close transition, triggered by returning from a case to home, rotates the cover back toward closed and fades the scrapbook out
- The page turn control on a case flips the folder cover in three dimensions again, re-closing or re-opening the cover over the sheet
- The sibling folder navigation, triggered by clicking a rotated sibling tag, slides to the sibling case with the architect name re-splitting into characters and the folder and sheet re-entering
- The overscroll to next affordance, triggered at the bottom of a case, lifts the current folder upward by roughly three quarters of the viewport and swaps to the next case; this is a scroll linked lift synchronized with the smooth-scroll driver, observable only by triggering the affordance, not by a snap navigation
- Smooth scrolling on desktop eases with inertia and settles naturally after wheel or trackpad input stops; during folder open, folder close, and sibling navigation transitions, smooth scrolling freezes and then unfreezes so scroll position does not fight the folder morph; native touch scrolling physics stay intact on narrow viewports
- On the home stack, hovering a category group lifts and rotates its cover on the X axis by negative three degrees with a one rem translation and fades in a cover overlay; clicking a cover header unfolds the group and rotates its chevron from ninety degrees to zero
- Hovering an architect tag lifts it upward toward ten pixels through a translateY transform and casts a drop shadow; this is observable only by hovering a real tag, not by a route swap
- Hovering the About navigation item raises its opacity from a rest value of 0.8 toward 1 through an opacity transition of 0.65 seconds; the active route navigation item stays at opacity 1
- The circular close button, a 54 pixel red circle computing rgb(215, 30, 30), scales to a transform of 0.970 on hover through a transform transition of 0.325 seconds, and its icon scales up on hover and further on press
- The hero title American modernism reveals by splitting into lines and characters that rise from a two rem offset and fade from zero to full opacity in a staggered sequence on load
- The about gallery crossfades between its photographs by fading images and captions in and out, the images computing a transition of opacity 0.65 seconds with the primary easing cubic-bezier(0.33, 1, 0.68, 1), with the active caption at full opacity and inactive captions hidden
- Media popups enter and leave with the dimmed background fading over a transition of opacity 0.7 seconds, the info box and box rising a short distance while fading in over a transition of 0.15 seconds, the media fading in, and the close button scaling up from half size
- Video playback uses a themed media control surface whose controls fade after playback starts; audio playback drives a waveform whose canvas opacity computes 0.4 at rest and brightens to 1 while playing
- Scrapbook notes and photographs are draggable with the pointer and follow the pointer to a released position; this gesture is observable only by dragging a real item
- The footer wind roses rotate continuously as ambient motion through a keyframe animation of duration 40 seconds and infinite iteration
- The fixed header hides by translating upward when the reader scrolls down on the home route and returns when scrolling up, and it is forced hidden on the about route
- A reduced motion mode is provided as an accessibility enhancement beyond the live site: when the reader prefers reduced motion, smooth scrolling is disabled, the folder open and close and hero split timelines collapse to their end state immediately, and essential opacity states are retained for readability
</motion>

<responsiveness>
- The root font size scales by viewport: twelve pixels at or below 320 pixels, thirteen pixels through 768 pixels (measured 13 pixels at a 390 pixel width with a container offset of 18 pixels), fourteen pixels through 1024 pixels, fifteen pixels above 1024 pixels, sixteen pixels at or above 1440 pixels (measured 16 pixels with a container offset of 34 pixels), and eighteen pixels at or above 1920 pixels; the required breakpoints are 320, 480, 768, 900, 1024 and 1025, 1440, and 1920 pixels
- Between those breakpoints, display and body type continue to scale through fluid clamp values rather than locking to a single fixed pixel size until the next breakpoint fires
- At a 390 pixel width the hero paragraph drops to a 16 pixel override and the architect tags reduce in size
- Architect tags render at 1.625rem on desktop, reduce to 1.25rem at or below 1024 pixels, and reduce to fifteen pixels at or below 480 pixels
- On tablet and mobile widths the home stack category group heights reduce to twenty and fifteen viewport units respectively
- The about route collapses from its desktop two column layout to a single column on narrow viewports, with the essay above the gallery and both fully readable
- At narrow widths the case broken-grid recomposes: the oversized architect name scales down but keeps its layered relationship with the folder sheet, sibling tags remain operable, and scrapbook items stay inside the viewport rather than collapsing into a plain static stack that loses the filing-cabinet metaphor
- No content clips or overflows the viewport and no horizontal scroll bar appears at 320, 390, 768, 1024, 1440, or 1920 pixel widths on any of the ten routes
</responsiveness>

<accessibility>
- The character-split display headings, including the hero title and the case architect names, keep their full phrase available to assistive technology through a label on the heading container while the individual character spans stay out of the accessibility tree
- Interactive controls use semantic HTML buttons and links with accessible names; the media popup is a dialog that traps focus while open
- The header wordmark and About item, the architect tags, the sibling tags, the overscroll affordance, and every red circular close button are reachable and operable with the keyboard alone, each with a visible focus indicator
- Opening a media popup moves focus into the popup, and closing it returns focus to the element that opened it
- Cream primary text on the dark surface and white text on saturated category covers meet WCAG AA contrast
</accessibility>

<performance>
- Every route is interactive within roughly 2 seconds of a local cold load
- No console errors, warnings, or hydration mismatch messages appear on any of the ten routes, on first load or after in-app navigation
- After the server-rendered content appears there is no post-hydration content flash: text, folders, and media regions hold their space and do not re-render visibly or shift the layout as the client takes over
- After first paint, no visible layout jumps occur as fonts, portraits, or scrapbook media finish loading; folder and media regions reserve their space from the start
- Continuous scrolling and the folder open and close transitions hold a smooth frame rate with no visible hitching or dropped frames; smooth-scroll inertia settles without input lag between wheel or trackpad movement and the page response
- Rapid repeated navigation between cases stays responsive with no hangs and no stuck transition states
</performance>

<writing>
- The hero paragraph, category thesis lines, architect biographies, and the about essay read as edited long form editorial prose, with no lorem ipsum and no placeholder filler text anywhere in the shipped UI
- Navigation, footer, and monospace scrapbook labels keep one consistent uppercase convention
- The document titles of the home route, the about route, and the eight case routes match the exact strings given in core features
</writing>

<requirements>
- Copyright and rights-clearance prohibition: apart from required npm dependency code and explicitly specified open-license fonts or generic utility icons used under their licenses, every creative asset and every piece of visible editorial copy must be newly authored or generated specifically for this fictional build. Do not use scraped, stock, press, social-media, portfolio, source-site, screenshot-derived, copyrighted, trademarked, or otherwise third-party-controlled creative material, and do not make a trace, near-copy, style-identical imitation, or recognizable derivative of it. This applies to raster pixels, individual video frames and audio, SVG paths, canvas/WebGL/Rive artboards and textures, 3D geometry/materials/HDR environments, PDFs, icon/mark silhouettes, metadata, filenames, alt text, and hidden/preloaded assets. If provenance is uncertain, create a fresh fictional replacement.
Tech stack mandate (builder facing, not a scoring criterion): the application must be built as a Nuxt 3 app with Vue 3 and server side rendering, Vue Router file based routing for the ten routes, and Pinia stores for shared client state. Styling is Tailwind CSS 4.3.2, pinned, with the design tokens for the category colors, dark surfaces, cream text, and the viewport-scaled type scale defined in the theme layer. Reka UI is the component library and supplies the base chrome primitives, in particular the media popup dialog behavior and its focus handling. The animation and media allowlist is GSAP 3 with ScrollTrigger, Flip, and Draggable plus a SplitText equivalent for the character and line reveals, Lenis for smooth scrolling synchronized with scroll-linked motion and with a freeze and unfreeze contract during folder and sibling transitions, and Plyr for the video control surface; no other animation libraries. CSS three-dimensional transforms handle the folder cover rotateY — there is no WebGL or canvas three-dimensional scene to initialize or fall back from. Icons come from Iconify sets delivered through unplugin-icons or from original SVG assets bundled in the app; no icon CDN and no icon font service. Any form control the app ships validates through VeeValidate with a Zod schema and shows inline per-field errors before submit. Storyblok is the content model, but because the build runs fully offline the architect cases, home stack groups, and about essay must ship as local content fixtures rather than calling the Storyblok delivery or preview API at runtime. All libraries are installed via npm and bundled locally; no CDN imports. Forbidden substitutions: do not rebuild in Next.js, Remix, Astro, SvelteKit, WordPress, Webflow, Framer, or static only HTML; do not replace GSAP with Framer Motion or a CSS only approximation for the folder and stack transitions; do not replace Storyblok with Contentful, Sanity, or MDX as the primary content model.
Shared application state must live in Pinia (in memory only): the active route and active case, stack hover and unfold state, popup open and closed state, video and audio play state, gallery active slide, and overscroll progress. Do not use localStorage, sessionStorage, or any other browser storage API.
State and behavior contracts (observable, not storage keys):
- Opening a case swaps the visible route and renders that architect's name, folder, sheet, sibling tags, and scrapbook without a full page reload
- Clicking a sibling tag swaps to the sibling case using the same navigation path as a home tag
- The overscroll affordance advances to the next architect case in sequence
- Opening a media popup shows the media and disables background scroll; closing it stops playing media and restores scroll
- The video and audio play state is shared client state that the play and pause controls update, and playing state is reflected in the visible player
- The about gallery active slide advances on a timer and is reflected by which image and caption are visible
- Views derive from the one shared store: the header hidden state, the sub-header category name, and the document title all follow the same active case the route shows, never a second disconnected copy
All ten routes must render without error, the eight case routes must never fail to render, and category colors must match the exact hex values. The three type families are self hosted open-license faces bundled in the app — a condensed grotesque display face, a serif text face, and IBM Plex Mono — and load locally with no web font service request. Scratch-build every item in the required inventory above; do not copy, trace, crop, recolor, rename, decode, transcode, or otherwise derive any source asset, and do not omit an item or substitute an empty box. No real person, building, company, agency, or social platform is named or credited. The build runs fully offline: every route's network log contains only candidate-origin asset requests plus data and about URLs, with zero requests to a content-management, blob-storage, video-hosting, web-font, or icon host. Images, audio, waveform data, posters, and VP9 WebM videos resolve locally and produce no 404 or decode errors. Outbound navigation from the fictional studio credit mark is inert or fictional rather than a source destination. The known specification gaps of the smooth scroll constructor precision and the wind rose rotation rate are acceptable implementation notes, not defects.
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
- Destinations: home; about; ada-mercer; elias-north; mara-voss; julian-kade; imani-vale; pavel-rowan; lucian-shore; mae-calder
- Session operations: play-video; pause-video; play-audio; pause-audio; open-popup; close-popup; advance-case

Mechanics exclusions:
- Folder-open/close Flip transition stays Playwright-observed
- Scrapbook Draggable stays Playwright-observed
- Stack hover/unfold and tag hover lift stay Playwright-observed
- Gallery crossfade and hero SplitText reveal stay Playwright-observed
- Overscroll scroll-linked motion stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
