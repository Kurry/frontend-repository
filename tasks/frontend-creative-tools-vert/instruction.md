<summary>
Build VERT, a private, frontend-only local file converter, using Svelte 5 with SvelteKit static delivery, Svelte stores and runes, Tailwind CSS 4.3.2, and Bits UI. The app opens directly into a converter workspace where a user adds local image files, picks a target format per file, runs a real in-browser conversion, and downloads the result, with a visible queue and per-file status. All conversion runs on the device; there is no backend, no authentication, and no upload.
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
Feature: Converter workspace and navigation —
- The app opens directly into the converter workspace, no login or splash gate: a centered pill navbar (VERT brand, Upload, Convert, Settings, About, and a theme toggle), a hero headline "The file converter you'll love.", a labeled drop zone titled "Drop or click to convert", a conversion queue, and a "VERT supports..." catalog all render on first load without any file selected
- Navigating to Convert, Settings, or About by its own URL renders the same view as reaching it through the navbar, with the shared navbar and theme intact on every route
Feature: Adding files —
- The drop zone is a keyboard-and-pointer file affordance: clicking it opens the local file picker; dragging a file over it shows a highlighted drop target; dropping files adds them to the queue. Its helper text names the supported local inputs before any file is chosen
- Two sample-image affordances ("Add sample png", "Add sample svg") let a user add a real local file to the queue without their own file, so the primary workflow is reachable immediately
- Adding one or more image files appends a row per file to the conversion queue showing the filename, the detected source format, a "Convert to" format selector defaulting to a sensible target, the input size, and a per-file status. Supported inputs are png, jpg, jpeg, webp, gif, bmp, and svg
Feature: Conversion queue —
- Each queued file exposes a "Convert to" selector bound to the real output formats png, jpeg, jpg, and webp. Changing a file's target updates that row and, if it was already converted, returns it to a ready state so it can be reconverted
- Running Convert performs a real, in-browser transcode of every ready file to its selected target using the browser's native image codecs, moving each row through Converting and then Done, and updates the counts line ("N queued, R ready, D done"). Different inputs and different targets produce genuinely different output bytes; the output size is shown on each completed row
- Each completed row offers a Download control that saves the real converted file to disk with the correct extension; the Download control is disabled until that row is Done
- Per-file status is a first-class, distinguishable set of states: Ready, Converting, Done, Failed, and Unsupported. Each status carries a text label and a glyph, not color alone
- Removing a file drops its row from the queue and the counts; Clear queue empties the whole queue; Cancel stops an in-progress run
Feature: Format catalog —
- The "VERT supports..." catalog shows four category cards (Images, Audio, Documents, Video) each listing its real supported-format set, a local-or-server support label, and a ready status. Selecting a category marks it active; the active category is remembered across reloads
Feature: Settings and about —
- Settings exposes an output-quality control (1 to 100) that affects the bytes of jpeg and webp output, a keep-metadata toggle, and a light or dark theme choice, presented as a form whose fields validate inline: entering a quality outside 1 to 100 shows an inline message naming the quality field before submit, and the invalid value is never applied
- About and Privacy views explain that conversion is local and that files are never uploaded, and remain reachable without selecting a file
</core_features>

<user_flows>
- Adding the sample png appends exactly one row to the queue, the counts line changes from "0 files queued" to reflect one queued file, and the empty-state message disappears; running Convert moves that row through Converting to Done, updates the counts line to show one done, and enables that row's Download control — all without a page reload
- Converting the same source file twice, once to webp and once to jpeg, produces two completed rows whose output sizes differ, and each Download saves a file whose extension matches its selected target
- Changing a Done row's "Convert to" target returns that row to Ready, disables its Download control, and updates the counts line; running Convert again completes it to Done with an output size shown for the new target
- Lowering the output quality in Settings and reconverting the same file to jpeg yields a smaller output size on the completed row than the same conversion at quality 100, showing the setting flows into the conversion result
- Selecting a catalog category, switching the theme, and changing the quality setting, then reloading the page, restores the active category, the theme, and the quality value, while the conversion queue returns to a single empty state with "0 files queued" and no phantom row, progress, or download success
- Removing the only queued file restores the explicit empty state and the "0 files queued" counts line; adding a file again works immediately from that state
</user_flows>

<edge_cases>
- The conversion queue starts empty with an explicit empty state ("Your conversion queue is empty" plus guidance that a local file is needed) and a counts line reading "0 files queued". While empty it never shows progress, a checkmark, or a download-ready control
- A file whose format cannot be decoded is marked Unsupported with a plain-language reason and never shows a false success; its Download control never enables
- Cancel during an in-progress run stops the run: no row left mid-run shows Done, and the counts line matches the rows actually completed
- Double-activating Convert runs each ready file exactly once: the done count increases only by the number of ready rows, with no duplicate rows created
- A long filename is truncated with an ellipsis in its queue row without breaking the row layout, and the download still uses the full name with the correct extension
</edge_cases>

<visual_design>
- A focused single-product converter surface, not a generic dashboard: a magenta-to-blush vertical gradient page background, a floating rounded white navbar pill, a bold oversized hero headline paired with a large white drop-zone card given the most visual weight in the first viewport
- The drop zone is the visual focal point of the workspace: a rounded card with a circular magenta upload glyph, a large title, and supporting helper text, clearly more prominent than secondary metadata or the footer
- The conversion queue reads as a dense worklist: one row per file with the filename emphasized, a muted sub-line for formats and sizes, a compact format selector, a pill-shaped status indicator color-and-glyph coded (muted Ready, amber Converting, green Done, red Failed and Unsupported), and right-aligned Download and Remove actions
- The "VERT supports..." section is a four-up card grid; each card shows a category icon, a bold category name, a support label (Video reads "Server supported" in the accent color, the rest "Local supported"), a status line, and a scrollable list of real format extensions
- Icons come from one consistent glyph family across the navbar, drop zone, status pills, and category cards — no mixed icon styles
- Type hierarchy across at least three roles (oversized hero, section and card headings, body and muted captions); spacing on a consistent 4 and 8 pixel scale; one magenta accent family on a light neutral base, with green reserved for success and red for error consistently
- A light and a dark theme; every text-on-surface pairing stays legible in both
</visual_design>

<motion>
- The theme toggle swaps the whole surface between light and dark; the toggle icon reflects the current theme
- The drop zone gives immediate feedback: a highlighted border and slight scale on dragover, and a pressed feedback on click
- Adding a file animates its new row into the queue rather than snapping in; removing a file animates its row out, and Clear queue clears the rows with the same animated treatment
- Navbar items, buttons, list rows, and cards take a hover wash distinct from their focus ring; the pressed state appears immediately on pointer-down, before the action completes, so Convert never feels unresponsive in the gap before results
- Selecting a queue row marks it with an inset ring; selecting the active category card marks it with an accent ring, and both selections reverse through the same control
- Status transitions are visible as each file moves Ready to Converting to Done (or Failed): the status pill changes with a brief transition rather than an instant swap, and the counts line updates live
- Switching between Convert, Settings, and About transitions the view content with a short fade or slide rather than a hard cut
- With prefers-reduced-motion set, row and view animations are removed and state changes apply instantly while every flow remains completable
</motion>

<responsiveness>
- At narrow widths the hero stacks, the catalog collapses to one column, file rows stack, and the primary controls stay operable with no horizontal page scrolling down to 320 pixels
</responsiveness>

<accessibility>
- Every interactive control is reachable and operable with the keyboard alone, with a visible focus ring on every interactive control
- Focusing the drop zone and pressing Enter or Space opens the local file picker exactly as a pointer click does
- The active category card exposes its pressed state through aria-pressed as well as its accent ring
- Status changes are announced: the counts line and each status pill update via an aria-live region so a conversion's progress is announced without moving focus
- The full convert-and-download flow is completable with keyboard alone and with pointer alone, reaching the same result either way
- Each status carries a text label and a glyph, never color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors, warnings, or hydration mismatch messages appear on any route, on first load or after client navigation
- Converting a file keeps the page responsive: the navbar, theme toggle, and other queue rows stay interactive while a conversion runs
- After first paint no visible layout jumps occur; the queue and catalog regions hold their space as content settles
</performance>

<writing>
- Microcopy is concise UI writing in sentence case: verb-first buttons (Convert, Download, Remove, Clear queue), numeral counters ("1 queued, 0 ready, 1 done"), and second-person help text; error and unsupported messages state the problem plainly without codes or blame
</writing>

<requirements>
- Use Svelte 5 with SvelteKit static delivery (adapter-static), Svelte stores and runes for all shared state, and Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer.
- Bits UI is the component library: use it for the queue chrome — format selects, dialogs or confirmations, toggles, and menu surfaces. No other UI component libraries.
- AutoAnimate and Svelte transitions are allowed for animation; no other animation libraries.
- Phosphor icons via the phosphor-svelte package only; no other icon sets, no raw pasted SVG icon copies, no icon CDNs.
- All forms, including the Settings panel, are driven by sveltekit-superforms with Formsnap in client-side validation mode and a Zod schema: the schema defines the rules and invalid fields show inline per-field errors before submit.
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon.
- Static delivery only: no server loaders, server actions, or API routes; all interactivity lives in client state after load, and deep-linking any route serves the same client app.
- No authentication wall: open directly into the primary converter workspace.
- Keep the implementation frontend-only and self-contained; do not depend on a live backend, and do not upload files. All image conversion must run in the browser using native browser codecs (canvas re-encoding) so the app works fully offline.
- Image conversion must be real: converting the same file to two different targets, or at two different quality settings, must produce genuinely different output bytes, and the produced download must be a valid file of the selected format. Never show a Done, checkmark, or download-ready state for a conversion that did not actually run.
- Supported decodable inputs: png, jpg, jpeg, webp, gif, bmp, svg. Real output targets: png, jpeg, jpg, webp. A file whose format cannot be decoded must be marked Unsupported with a plain reason, not silently succeeded.
- Persist relevant state in localStorage (or equivalent client storage) so a reload restores it: at minimum the theme, the active conversion category, and the conversion settings (quality, keep-metadata). The in-progress file queue may remain in memory, so that a reload before any file is added restores a single empty queue with no phantom file row and no false progress or download success.
- Seed enough local sample data for the primary workflow to be non-empty and usable on first load: the drop zone, the supported-input list, the four category cards with their real format lists, and the sample-file affordances all render before any file is chosen, while the conversion queue itself starts legitimately empty.
- The queue, per-file target selection, per-file status, counts, theme, active category, and settings must all derive from one shared client store, not disconnected copies: adding, converting, removing, or clearing files updates the rows and the counts together, and no view keeps a second copy of the queue.
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
- artifact-transfer-v1
- entity-collection-v1
- command-session-v1

Module specs:
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

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
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
- Artifact operations: import; convert; export
- Conversion modes: png-to-jpeg; png-to-webp; jpeg-to-png; jpeg-to-webp; webp-to-png; webp-to-jpeg; gif-to-png; bmp-to-png; svg-to-png
- Export formats: png; jpeg; jpg; webp
- Entity: file
- Entity operations: create; select; update; delete
- Entity fields: name; from; to; status
- Session operations: start; stop

Mechanics exclusions:
- Drag-drop drop-zone and native file-picker stay Playwright-observed
- Theme recolor stays Playwright-observed
- Queue reorder is not offered

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
