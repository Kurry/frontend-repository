<summary>
Build a frontend-only, collaborative Markdown editor with live preview using Svelte 5, Svelte stores/runes, and Tailwind CSS v4.
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
- The app opens with no authentication wall directly into a Markdown editing workspace that is recognizably a peer-to-peer collaborative Markdown editor, not a generic scaffold or unrelated dashboard: a source pane, a rendered preview, a room identifier, and share controls are all present
- The workspace opens on a seeded document so it is non-empty on first load: the source pane contains a starter Markdown note with a top-level heading, at least one subheading, a bullet list, an ordered list, a block quote, and a fenced code block
- A room identifier is visible in the top-bar breadcrumb as brand text md.uy, a slash divider, and a monospace document id, and the same id appears in the browser URL path; the id is a 10 or 20 character uppercase A-Z string
- The source pane is a live text editor: clicking into it and typing inserts the typed characters at the cursor location and the source pane immediately shows the newly entered text at that edit location
- The rendered preview follows the source: after editing the Markdown source and viewing the preview, the preview shows the latest edit rendered as HTML (heading text, list items, bold and italic, inline and fenced code) rather than the prior revision
- Making two successive edits and viewing the preview shows both edits reflected once each; the preview never keeps a stale duplicate of an earlier rendering alongside the new one
- Reloading the page after editing restores the last saved revision from local client storage: the source pane reopens with the edited text and the preview renders that same edited text; the room id in the URL and breadcrumb is unchanged
- An editor-mode control switches the workspace between Edit, Preview, and Present without a full page reload; the active mode is visually marked and the main pane swaps to show the source editor, the rendered preview, or a slideshow
- Present mode splits the source on lines containing only three dashes into slides, shows the current slide with a Slide N of M counter, and Previous and Next buttons that are disabled at the first and last slide; arrow keys move between slides
- A Copy control copies the current Markdown source to the clipboard and shows a brief confirmation; a Download control saves the source as a document.md file and shows a brief confirmation
- A Share control opens a dialog titled Share with a Live sync tab and a Static tab; the Live sync tab toggles a visible sync indicator on the Share button and, while on, reveals the room's shareable URL in a read-only field with a copy button; the Static tab generates a static import link; no live network peer is required and the connection indicator honestly reads that no users are connected
- A theme toggle switches the whole workspace between light and dark, recoloring surfaces and swapping the sun and moon icons; a profile control opens a dialog to set a display name and a color that appear on the profile chip
- No outbound navigation for in-app controls: mode switches, theme, copy, download, share, and profile all act in-place via shared client state; the app never fetches the document or app shell from another origin
</core_features>

<visual_design>
- Centered single-column editor workspace at a readable max width, framed by a thin top bar, a toolbar row, the bordered editor or preview card that fills the remaining height, a status row, and a monospace footer
- Top bar: left is the md.uy brand plus the slash-separated monospace room id; right groups the theme toggle, a monospace document-id join field with an arrow open button, and a filled plus button for a new document
- Toolbar row: left is the Edit / Preview / Present mode group where the active mode reads as a filled secondary button and the others as ghost buttons; right groups ghost Copy and Download buttons and an outlined Share button
- Source pane is a monospace, line-wrapped code editor on a card surface; the preview pane renders typographic prose (headings, lists, quotes, code) using a readable prose style; an empty document shows a muted placeholder in each pane
- Light and dark theme surfaces driven by CSS custom properties in oklch, with a primary blue accent; cards use hairline borders and a small radius; badges, dots, and buttons stay compact and dense
- Local icons only (inline SVG) and a local favicon; the profile chip shows a small colored dot next to the name
- Responsive: the join field may hide on narrow viewports; the source and preview panes and their controls stay reachable at 375 by 667 without horizontal page scrolling
</visual_design>

<motion>
- Buttons ease their background, border, and text color on hover and focus; the mode buttons, copy, download, share, theme, and new-document controls all take a hover wash and a visible focus ring
- Theme toggle: the sun and moon icons swap and the surfaces and accents recolor when the theme changes
- Copy and Download briefly swap their icon to a green check for about 0.8 seconds after a successful action, then revert
- Share button carries a small pinging dot badge while live sync is on; the share and profile dialogs open centered over a dimmed backdrop
- Preview updates live as the source changes, with no manual refresh; Present mode transitions between slides on Previous, Next, and arrow-key input
- Hover feedback is required on all interactive chrome (buttons, mode tabs, dialog controls); omitting hover states is a defect
</motion>

<requirements>
- Use Svelte 5 with Svelte stores/runes for shared client state, and Tailwind CSS v4 for styling. Build tooling is Vite or an equivalent SPA setup
- Shared application state (the document source, the active editor mode, the theme, the room identity, and dialog/sync UI state) lives in Svelte runes/stores; view and mode changes happen via that shared state without reloading the document
- Persist the document locally so a reload restores it: keep the Markdown source in localStorage or an equivalent client storage (for example IndexedDB), keyed by the room id, and restore it on load so both the source pane and the rendered preview show the last saved revision. This local persistence is a required feature, not an anti-pattern, for this app
- Seed a starter Markdown document so the workspace is non-empty on first load, and put its room id in the URL path so reloading that path reopens the same document
- Markdown rendering must support headings, bold, italic, inline code, fenced code blocks, ordered and unordered lists, and block quotes; GitHub-flavored line breaks are honored
- The room identifier shown in the breadcrumb must match the id in the URL and must remain associated with the same document across edits, mode switches, and reloads
- Editor-mode contract: switching to Edit shows the source editor, Preview shows the rendered HTML of the current source, Present shows the slideshow; the active mode is marked and only one pane is shown at a time
- Share is frontend-only chrome: toggling live sync updates a visible indicator and exposes the room URL, but the app must not claim a connected peer it does not have and must not depend on a live backend or signaling server
- Keep the implementation frontend-only and self-contained: no backend, no authentication, and no fetching the app or document from another origin
- Allowed libraries: a Markdown parser (for example marked), a code-editor component (for example CodeMirror), a CRDT/text library and its IndexedDB persistence (for example Yjs with y-indexeddb), and an id generator (for example nanoid). No other external UI component frameworks
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
