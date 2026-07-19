<summary>
Build a frontend-only, collaborative Markdown editor with live preview using Svelte 5 with SvelteKit static delivery, Svelte stores/runes, Tailwind CSS 4.3.2, and Bits UI.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Workspace and identity —
- The app opens with no authentication wall directly into a Markdown editing workspace that is recognizably a peer-to-peer collaborative Markdown editor, not a generic scaffold or unrelated dashboard: a source pane, a rendered preview, a room identifier, and share controls are all present
- The workspace opens on a seeded document so it is non-empty on first load: the source pane contains a starter Markdown note with a top-level heading, at least one subheading, a bullet list, an ordered list, a block quote, and a fenced code block
- A room identifier is visible in the top-bar breadcrumb as brand text md.uy, a slash divider, and a monospace document id, and the same id appears in the browser URL path; the id is a 10 or 20 character uppercase A-Z string
Feature: Editing and live preview —
- The source pane is a live text editor: clicking into it and typing inserts the typed characters at the cursor location and the source pane immediately shows the newly entered text at that edit location
- Pressing the platform undo shortcut in the source pane restores the source text to its state before the most recent edit, and the preview follows that restored text
- The rendered preview follows the source: after editing the Markdown source and viewing the preview, the preview shows the latest edit rendered as HTML (heading text, list items, bold and italic, inline and fenced code) rather than the prior revision
- Making two successive edits and viewing the preview shows both edits reflected once each; the preview never keeps a stale duplicate of an earlier rendering alongside the new one
Feature: Editor modes —
- An editor-mode control switches the workspace between Edit, Preview, and Present without a full page reload; the active mode is visually marked and the main pane swaps to show the source editor, the rendered preview, or a slideshow
- Present mode splits the source on lines containing only three dashes into slides, shows the current slide with a Slide N of M counter, and Previous and Next buttons that are disabled at the first and last slide; arrow keys move between slides
Feature: Sharing and export —
- A Copy control copies the current Markdown source to the clipboard and shows a brief confirmation; a Download control saves the source as a document.md file and shows a brief confirmation
- A Share control opens a dialog titled Share with a Live sync tab and a Static tab; the Live sync tab toggles a visible sync indicator on the Share button and, while on, reveals the room's shareable URL in a read-only field with a copy button; the Static tab generates a static import link; no live network peer is required and the connection indicator honestly reads that no users are connected
Feature: Appearance and profile —
- A theme toggle switches the whole workspace between light and dark, recoloring surfaces and swapping the sun and moon icons
- A profile control opens a dialog to set a display name and a color; the display name field validates inline before submit — leaving it empty shows a message naming the display name field, and the save control stays disabled until the name is non-empty
- Saving a valid profile updates the profile chip to show the chosen name and a dot in the chosen color
- No outbound navigation for in-app controls: mode switches, theme, copy, download, share, and profile all act in-place via shared client state; the app never fetches the document or app shell from another origin
</core_features>

<user_flows>
- Edit, echo, reload: with the app in Edit mode, typing a distinctive new line into the source pane, then switching to Preview shows that line rendered as HTML while the breadcrumb room id stays unchanged; reloading the page reopens the same room and restores the last saved revision from local client storage, with the source pane and preview both showing the edited text and the room id in the URL and breadcrumb unchanged
- Slide-count delta: appending a line containing only three dashes plus one new heading line to the source in Edit mode, then switching to Present, increases the M in the Slide N of M counter by exactly one; pressing Next until the last slide shows the new heading and disables the Next button, and switching back to Edit shows the same source including the added delimiter and heading
- Profile echo: saving a display name and color in the profile dialog updates the profile chip's name and colored dot immediately without a reload; reopening the dialog shows the saved values pre-filled, and the chip keeps the same name and color across Edit, Preview, and Present mode switches
- Deep-link parity: opening the room's URL path directly in a fresh tab renders the same document workspace as reaching it through in-app controls — the same room id in the breadcrumb, the same source text in the editor, and the same rendered preview content
</user_flows>

<edge_cases>
- Selecting all source text and deleting it leaves an empty document: the source pane and the preview each show a muted placeholder instead of stale content
- In Present mode with no three-dash delimiter in the source, the counter reads Slide 1 of 1 and both Previous and Next are disabled; pressing arrow keys past the first or last slide changes nothing
- Double-activating the Copy control shows a single confirmation state rather than stacked or repeated confirmations
- Submitting the profile dialog with an empty display name saves nothing: the chip keeps its previous name and color and an inline message names the display name field
- With live sync toggled on and no peer present, the connection indicator reads that zero users are connected; the app never claims a connected peer it does not have
- A very long unbroken line in the source wraps within the source pane and renders in the preview without causing horizontal page scrolling
</edge_cases>

<visual_design>
- Centered single-column editor workspace at a readable max width, framed by a thin top bar, a toolbar row, the bordered editor or preview card that fills the remaining height, a status row, and a monospace footer
- Top bar: left is the md.uy brand plus the slash-separated monospace room id; right groups the theme toggle, a monospace document-id join field with an arrow open button, and a filled plus button for a new document
- Toolbar row: left is the Edit / Preview / Present mode group where the active mode reads as a filled secondary button and the others as ghost buttons; right groups ghost Copy and Download buttons and an outlined Share button
- Source pane is a monospace, line-wrapped code editor on a card surface; the preview pane renders typographic prose (headings, lists, quotes, code) using a readable prose style; an empty document shows a muted placeholder in each pane
- Light and dark theme surfaces driven by design tokens in oklch, with a primary blue accent; cards use hairline borders and a small radius; badges, dots, and buttons stay compact and dense
- Icons come from one consistent icon set shipped with the app, plus a local favicon; the profile chip shows a small colored dot next to the name
</visual_design>

<motion>
- Buttons ease their background, border, and text color on hover and focus; the mode buttons, copy, download, share, theme, and new-document controls all take a hover wash and a visible focus ring
- Switching between Edit, Preview, and Present animates the incoming pane with a brief fade or slide of roughly 150 to 250 milliseconds while the top bar and toolbar stay fixed in place
- Theme toggle: the sun and moon icons swap and the surfaces and accents recolor when the theme changes
- Copy and Download briefly swap their icon to a green check for about 0.8 seconds after a successful action, then revert
- Share button carries a small pinging dot badge while live sync is on; the share and profile dialogs open centered over a dimmed backdrop with a short opacity and scale transition and exit the same way
- Preview updates live as the source changes, with no manual refresh; Present mode transitions between slides on Previous, Next, and arrow-key input
- Hover feedback is required on all interactive chrome (buttons, mode tabs, dialog controls); omitting hover states is a defect
- With prefers-reduced-motion set, pane and dialog transitions are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- At 375 by 667 the source and preview panes and their controls stay reachable without horizontal page scrolling; the document-id join field may hide on narrow viewports
- At desktop widths around 1440 pixels the workspace stays centered at its readable max width with the editor card filling the remaining vertical space
- Resizing between desktop and narrow widths never clips the toolbar controls; the mode group, Copy, Download, and Share remain visible and operable at both extremes
</responsiveness>

<accessibility>
- Every interactive control is reachable and operable with the keyboard alone, with a visible focus indicator; the mode group can be operated with the keyboard to switch Edit, Preview, and Present
- The share and profile dialogs use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them
- The copy and download confirmations are exposed to assistive technology through a polite live region as well as shown visually
- Text and controls keep readable contrast against their surfaces in both the light and dark themes
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on any route during a full exercise of the app, including no hydration errors after load
- After first paint the workspace does not visibly flash, jump, or re-render as client code takes over; the layout is stable from the start
- The preview keeps up with continuous typing in the source pane without visible lag or dropped characters
</performance>

<writing>
- Buttons, tabs, dialog titles, and status text use one consistent capitalization convention throughout the app
- Confirmations and indicators are specific and honest: the sync indicator states the real number of connected users, and confirmations name the completed action
- Empty states explain what belongs there; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
- Use Svelte 5 with SvelteKit static delivery (adapter-static) and Svelte stores/runes for shared client state, styled with Tailwind CSS 4.3.2 (pinned). All interactivity lives in client state after load: no server loaders, server actions, or API routes; the built site serves as static files via npm start on port 3000
- Shared application state (the document source, the active editor mode, the theme, the room identity, and dialog/sync UI state) lives in Svelte runes/stores; view and mode changes happen via that shared state without reloading the document
- Bits UI provides the interactive chrome primitives — the share and profile dialogs, the mode tab group, and toggle controls. No other external UI component frameworks
- Svelte transitions and AutoAnimate are allowed for animation; no other animation libraries
- Phosphor icons via the phosphor-svelte package only; no other icon sets and no icon CDNs
- All forms validate through a Zod schema using sveltekit-superforms with Formsnap in client-side validation mode: the schema defines the rules and the form surfaces inline per-field errors before submit; this covers the profile dialog and the document-id join field
- The source pane is built on CodeMirror 6 as the code editor component
- Allowed domain libraries: a Markdown parser (for example marked), a CRDT/text library and its IndexedDB persistence (for example Yjs with y-indexeddb), and an id generator (for example nanoid)
- Persist the document locally so a reload restores it: keep the Markdown source in localStorage or an equivalent client storage (for example IndexedDB), keyed by the room id, and restore it on load so both the source pane and the rendered preview show the last saved revision. This local persistence is a required feature, not an anti-pattern, for this app
- Seed a starter Markdown document so the workspace is non-empty on first load, and put its room id in the URL path so reloading that path reopens the same document
- Markdown rendering must support headings, bold, italic, inline code, fenced code blocks, ordered and unordered lists, and block quotes; GitHub-flavored line breaks are honored
- The room identifier shown in the breadcrumb must match the id in the URL and must remain associated with the same document across edits, mode switches, and reloads; deep-linking the room path renders the same workspace as in-app navigation
- Editor-mode contract: switching to Edit shows the source editor, Preview shows the rendered HTML of the current source, Present shows the slideshow; the active mode is marked and only one pane is shown at a time
- Share is frontend-only chrome: toggling live sync updates a visible indicator and exposes the room URL, but the app must not claim a connected peer it does not have and must not depend on a live backend or signaling server
- Keep the implementation frontend-only and self-contained: no backend, no authentication, and no fetching the app or document from another origin
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- package.json must define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the build succeeds)
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
- structured-editor-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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
- Editor object types: markdown-document
- Editor operations: set_content; switch_mode; preview
- Editor modes: edit; preview; presentation
- Artifact operations: export; copy
- Export formats: markdown

Mechanics exclusions:
- Live-sync/peer collaboration stays chrome-only and Playwright-observed; Present-mode slide gestures stay Playwright-driven

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
