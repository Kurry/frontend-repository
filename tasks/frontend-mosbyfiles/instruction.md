<summary>
Build a Mosby's Files American Modernist architecture editorial archive using Nuxt 3 with Vue 3 server-side rendering, Storyblok-modelled content served from local fixtures, Pinia state, and a GSAP plus Lenis plus Plyr motion layer, reproducing a filing-cabinet metaphor across ten routes.
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
- The app resolves ten routes with no full page reload between them: the home route, the about route, and eight architect case routes at cases frank-lloyd-wright, cases irving-gill, cases frank-gehry, cases louis-kahn, cases i-m-pei, cases paul-rudolph, cases louis-sullivan, and cases mary-colter; each case route reaches its architect exactly the same way, by clicking that architect's tag on the home stack
- The home route shows a fixed centered header whose left element is a Mosby's Files logo that returns to home and whose right element is a single About navigation item; the header background is a translucent dark bar with a hairline bottom border and a blurred backdrop
- The home route hero shows the display title American modernism and a supporting paragraph describing early twentieth century American architects who built Modernism independently of Europe; the document title of the home route is exactly Mosby's Files—American Modernist Architecture
- The home route shows a stack of four category groups, in this top to bottom order with these exact names, cover colors, and architect tags: Organic & Early Modernism with cover color hex 1E4BD7 and tags Frank Lloyd Wright and Irving Gill; Expressive with cover color hex 0C7866 and tag Frank Gehry; Monumental Modernism with cover color hex 581E70 and tags Louis Kahn, I. M. Pei, and Paul Rudolph; Place / culture continuity with cover color hex D71E1E and tags Louis Sullivan and Mary Colter; every architect name appears on a physical paper tag tab attached to its category cover, so all eight architect names are present across the four groups
- Each category group shows a short category thesis line and a chevron affordance; clicking a category cover header unfolds that group, and the fourth category cover reveals the footer content when unfolded
- Clicking any architect tag opens that architect's case route: the visible route swaps to a case page without a full page reload, the fixed home header hides, and a case sub-header appears showing a link back to home and the architect's category name
- Every case route shows the architect name as the largest heading, a colored folder whose cover uses that architect's category color, and a portrait sheet in portrait proportion carrying the architect's photo, a born and died line, and a short biography essay; the folder cover opens to reveal the sheet
- Every case route shows rotated sibling tags linking to the other architects in the same category (Louis Kahn, I. M. Pei, and Paul Rudolph link to each other; Frank Lloyd Wright and Irving Gill link to each other; Louis Sullivan and Mary Colter link to each other; Frank Gehry, being alone in its category, shows only its own tag), and clicking a sibling tag swaps to that sibling case route
- Every case route shows a scrapbook region of loose items positioned at rotated offsets, drawn from these item types: research notes, photographs, a paperclip graphic, a plan or drawing preview, and depending on the architect a video poster, a PDF preview, or an audio card; each scrapbook item can be dragged with the pointer to a new position within the scrapbook region and stays where it is released
- Every case route shows an overscroll affordance at the bottom labelled to open the next case; triggering it lifts the current folder upward and swaps to the next architect case route in sequence
- The case document title of each architect matches exactly: Frank Lloyd Wright—Mosby's Files; Irving Gill—Mosby's Files; Frank Gehry—Mosby's Files; Louis Kahn—Mosby's Files; I. M. Pei—Mosby's Files; Paul Rudolph—Mosby's Files; Louis Sullivan—Mosby's Files; Mary Colter—Mosby's Files
- Case routes that have a video (Frank Gehry, Frank Lloyd Wright, I. M. Pei, Irving Gill, Paul Rudolph) show a video poster scrapbook item that opens a media popup playing a local video with a local poster image; the popup never embeds a live external video player
- The Louis Kahn case route shows an audio scrapbook item that opens a waveform audio player offering two parts, louis_kahn_part_1 and louis_kahn_part_2, each drawing waveform bars from local waveform data and each playing local audio with a working play and pause control
- Opening any media popup dims the page behind it and disables background scroll; a red circular close button and clicking the dimmed backdrop both close the popup and stop any playing media
- The about route shows a long form essay that rejects a Bauhaus only origin story for Modernism, situates the archive in a Ukrainian architectural education, states the selection principles of industrial materials, integration with nature, and bold functional form, deliberately includes the late figures I. M. Pei and Frank Gehry, and closes with a line that the folder is open; the about document title is exactly About Mosby's Files—The Archive & The Idea; the fixed home header is forced hidden on the about route
- The about route shows a gallery of large architecture photographs with captions naming Louis Kahn's Salk Institute, Louis Kahn's National Assembly Building in Dhaka, Paul Rudolph's Art and Architecture Building at Yale, and I. M. Pei's East Building of the National Gallery of Art, plus a signature crediting Sergii Valiukh of Tubik Studio and a red circular close button that returns to home
- The footer, revealed inside the unfolded home stack cover, shows two rotating wind rose graphics, an architectural scale graphic, a signature rendered through a CSS mask rather than an image tag, and a Tubik Studio credit mark that is the one link allowed to navigate outbound to tubikstudio.com
- No route performs a backend fetch for its own content, fonts, imagery, audio, or video; every asset resolves from the candidate origin, with content imagery under local media storyblok f paths, audio and waveform data under local media blob audio paths, and videos under local media videos paths
</core_features>

<visual_design>
- The default page background computes to the near black dark tone rgb(25, 25, 25), which is hex 191919, with cream light text rgb(253, 250, 247), which is hex fdfaf7; body gray text computes to rgb(120, 122, 127), which is hex 787a7f; the four category covers compute their exact fills rgb(30, 75, 215) for Organic & Early Modernism, rgb(12, 120, 102) for Expressive, rgb(88, 30, 112) for Monumental Modernism, and rgb(215, 30, 30) for Place / culture continuity, which are hex 1E4BD7, 0C7866, 581E70, and D71E1E, all with white text rgb(255, 255, 255); an accent yellow hex FFE927 appears as a case and stack page background variant
- The fixed header is a translucent dark bar whose background computes to rgba(25, 25, 25, 0.8), which is hex 191919 at eighty percent alpha, with a one pixel hairline bottom border computing to rgba(255, 255, 255, 0.1) and a blurred backdrop of blur 100 pixels; its height computes to 3.75rem, which is 60 pixels at the desktop root font size, its z index is 1000, and the case sub-header shares the same 60 pixel height
- Display titles, meaning the hero title and the about title and the case architect names, use the Founders Grotesk condensed family at weight 700, uppercase, with a tight line height near 0.8; at a 1440 pixel width the hero title renders around 145 pixels, a case architect name around 120 pixels, and the about title at 52 pixels which is 3.25rem; body and tag text use Signifier at weight 400 and render at 20 pixels for the hero paragraph and the tags at a 1440 pixel width; navigation, footer, captions, and monospace copy use IBM Plex Mono, with the nav item at 16 pixels and a 32 pixel line height, the footer at 12 pixels uppercase, and gallery captions at 14 pixels; the three families are self hosted and resolve to Signifier, Founders Grotesk, and IBM Plex Mono without any web font service request
- The root font size scales by viewport: twelve pixels at or below 320 pixels, thirteen pixels through 768 pixels (measured 13 pixels at a 390 pixel width with a container offset of 18 pixels), fourteen pixels through 1024 pixels, fifteen pixels above 1024 pixels, sixteen pixels at or above 1440 pixels (measured 16 pixels with a container offset of 34 pixels), and eighteen pixels at or above 1920 pixels; the required breakpoints are 320, 480, 768, 900, 1024 and 1025, 1440, and 1920 pixels; at a 390 pixel width the hero paragraph drops to a 16 pixel override and the tags reduce in size
- The home stack is a vertically stacked set of four colored folder covers with a three dimensional perspective of 3000 pixels, a stack border radius of four pixels, and rotation tokens of negative three degrees and a one rem offset; on large screens the stack is full height, and on tablet and mobile the category group heights reduce to twenty and fifteen viewport units
- Each architect tag is a tag shaped tab in Signifier at 1.625rem on desktop, reduced to 1.25rem at or below 1024 pixels and fifteen pixels at or below 480 pixels; tags start invisible and become visible as part of the stack reveal
- Case pages present the folder as a portrait sheet whose computed aspect ratio is 210 by 297, a measured ratio of about 0.707, carrying the portrait photo, a monospace born and died line, the architect name, and biography text, with a texture overlay layered at forty percent opacity in exclusion blend mode; the colored cover sits over the sheet in the same category color, for example the Louis Kahn cover computing rgb(88, 30, 112), and opens away from the sheet
- The scrapbook items are visually distinct ephemera: cream sticky notes at ninety seven percent opacity, white bordered photographs at slight rotations, a small paperclip, plan and PDF and video previews on white cards, and an audio card; items carry small monospace type labels
- The about route is a two column layout on desktop, the essay on the left and the gallery on the right, collapsing to a single column on narrow viewports; gallery captions are IBM Plex Mono at fourteen pixels at sixty percent opacity
- The footer is IBM Plex Mono at 0.75rem uppercase with a 3.75rem gap between its wind roses, scale graphic, signature mask, and Tubik credit
</visual_design>

<motion>
- The folder open transition, triggered by clicking an architect tag on the home stack, morphs the folder from its stack slot into the case layout and rotates the colored cover in three dimensions on the Y axis from closed to one hundred eighty degrees open, revealing the sheet beneath; the opened cover computes a transform of matrix3d starting negative one, a three dimensional rotateY, over a transition of transform 0.8 seconds with the primary easing cubic-bezier(0.33, 1, 0.68, 1); it is a three dimensional rotation and position morph, not a flat opacity crossfade; the architect name reveals character by character with a horizontal stagger, sibling tags rise into view, and scrapbook items rise from below and fade in
- The folder close transition, triggered by returning from a case to home, rotates the cover back toward closed and fades the scrapbook out
- The page turn control on a case flips the folder cover in three dimensions again, re-closing or re-opening the cover over the sheet
- The sibling folder navigation, triggered by clicking a rotated sibling tag, slides to the sibling case with the architect name re-splitting into characters and the folder and sheet re-entering
- The overscroll to next affordance, triggered at the bottom of a case, lifts the current folder upward by roughly three quarters of the viewport and swaps to the next case; this is a scroll linked lift, observable only by triggering the affordance, not by a snap navigation
- On the home stack, hovering a category group lifts and rotates its cover on the X axis by negative three degrees with a one rem translation and fades in a cover overlay; clicking a cover header unfolds the group and rotates its chevron from ninety degrees to zero
- Hovering an architect tag lifts it upward toward ten pixels through a translateY transform and casts a drop shadow; this is observable only by hovering a real tag, not by a route swap
- Hovering the About navigation item raises its opacity from a rest value of 0.8 toward 1 through an opacity transition of 0.65 seconds; the active route navigation item stays at opacity 1
- The circular close button, a 54 pixel red circle computing rgb(215, 30, 30), scales to a transform of 0.970 on hover through a transform transition of 0.325 seconds, and its icon scales up on hover and further on press
- The hero title American modernism reveals by splitting into lines and characters that rise from a two rem offset and fade from zero to full opacity in a staggered sequence on load
- The about gallery crossfades between its photographs by fading images and captions in and out, the images computing a transition of opacity 0.65 seconds with the primary easing cubic-bezier(0.33, 1, 0.68, 1), with the active caption at full opacity and inactive captions hidden
- Media popups enter and leave with the dimmed background fading over a transition of opacity 0.7 seconds, the info box and box rising a short distance while fading in over a transition of 0.15 seconds, the media fading in, and the close button scaling up from half size
- Video playback uses a Plyr style control surface with controls that fade; audio playback drives a waveform whose canvas opacity computes 0.4 at rest and brightens to 1 while playing
- Scrapbook notes and photographs are draggable with the pointer and follow the pointer to a released position; this gesture is observable only by dragging a real item
- The footer wind roses rotate continuously as ambient motion through a keyframe animation of duration 40 seconds and infinite iteration
- The fixed header hides by translating upward when the reader scrolls down on the home route and returns when scrolling up, and it is forced hidden on the about route
- A reduced motion mode is provided as an accessibility enhancement beyond the live site: when the reader prefers reduced motion, smooth scrolling is disabled, the folder open and close and hero split timelines collapse to their end state immediately, and essential opacity states are retained for readability
</motion>

<requirements>
Tech stack mandate (builder facing, not a scoring criterion): the application must be built as a Nuxt 3 app with Vue 3 and server side rendering, Vue Router file based routing for the ten routes, Pinia stores for shared client state, GSAP 3 with ScrollTrigger, Flip, and Draggable plus a SplitText equivalent for the character and line reveals, Lenis for smooth scrolling with a freeze and unfreeze contract during transitions, Plyr for the video control surface, and Iconify custom icons; Storyblok is the content model, but because the build runs fully offline the architect cases, home stack groups, and about essay must ship as local content fixtures rather than calling the Storyblok delivery or preview API at runtime. Forbidden substitutions: do not rebuild in Next.js, Remix, Astro, SvelteKit, WordPress, Webflow, Framer, or static only HTML; do not replace GSAP with Framer Motion or a CSS only approximation for the folder and stack transitions; do not replace Storyblok with Contentful, Sanity, or MDX as the primary content model.
Shared application state must live in Pinia (in memory only): the active route and active case, stack hover and unfold state, popup open and closed state, video and audio play state, gallery active slide, and overscroll progress. Do not use localStorage, sessionStorage, or any other browser storage API.
State and behavior contracts (observable, not storage keys):
- Opening a case swaps the visible route and renders that architect's name, folder, sheet, sibling tags, and scrapbook without a full page reload
- Clicking a sibling tag swaps to the sibling case using the same navigation path as a home tag
- The overscroll affordance advances to the next architect case in sequence
- Opening a media popup shows the media and disables background scroll; closing it stops playing media and restores scroll
- The video and audio play state is shared client state that the play and pause controls update, and playing state is reflected in the visible player
- The about gallery active slide advances on a timer and is reflected by which image and caption are visible
All ten routes must render without error, the eight case routes must never fail to render, and category colors must match the exact hex values. Fonts Signifier, Founders Grotesk, and IBM Plex Mono are self hosted and load locally. The build must run fully offline: the network log for the home route, the about route, and every case route must contain only candidate origin asset requests plus data and about URLs, with zero requests to a Storyblok host, a Vercel Blob host, a video hosting host, a web font service, or an icon service. Content imagery resolves under local media storyblok f paths, audio and waveform data under local media blob audio paths, and videos under local media videos paths. The popup video player shows a local poster and a local video and must not embed a live external video iframe. Outbound navigation links such as the Tubik Studio footer credit are navigation, not asset fetches, and may remain external. The known specification gaps of the smooth scroll constructor precision and the wind rose rotation rate are acceptable implementation notes, not defects.
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
- Destinations: home; about; frank-lloyd-wright; irving-gill; frank-gehry; louis-kahn; i-m-pei; paul-rudolph; louis-sullivan; mary-colter
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
