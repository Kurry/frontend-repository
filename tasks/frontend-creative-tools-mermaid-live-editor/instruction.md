<summary>
Build a live diagram source editor with preview using Svelte 5 with SvelteKit static delivery, Svelte stores/runes, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens directly into a diagram-editing workspace with no authentication wall: a header reading Mermaid Live Editor, a source editor on the left, and a live diagram preview on the right. The primary screen is recognizably a Mermaid diagram source editor with preview, not a generic scaffold, starter template, or unrelated dashboard
- The editor is a text area seeded on first load with a non-empty Mermaid flowchart (the default has an A[Christmas] node branching through Go shopping, Let me think, Laptop, iPhone and Car). The preview renders that seeded diagram immediately, so both panes are non-empty before any interaction
- Typing new Mermaid syntax into the source editor updates the editor contents to show exactly what was typed, and after a brief settle the preview re-renders so the rendered diagram reflects the latest source edit — not a cached earlier diagram. Making two edits in sequence leaves the preview showing only the most recent source
- The editor exposes two tabs, Code and Config: Code holds the diagram source, Config holds a Mermaid JSON configuration (seeded with a theme value). Switching tabs swaps which document the text area edits without a full page reload
- When the source contains invalid Mermaid syntax, an inline error region appears beneath the editor with a Syntax error heading and the parser's message, and the preview visibly de-emphasizes (dims) while keeping the last valid render rather than going blank. Correcting the source clears the error region and renders the corrected diagram
- A Sample diagrams panel offers at least six one-click samples labelled Flowchart, Class, Sequence, Entity Relationship, State and Mindmap (Pie and Gantt are also present). Clicking one replaces the source with that sample and re-renders the preview as that diagram type, with a header badge naming the current diagram type; no marks from the previously rendered diagram remain
- An Actions panel exports the current diagram. Clicking SVG downloads the rendered diagram as an SVG file whose name identifies it as a Mermaid diagram and ends in the .svg extension (the pattern is mermaid-diagram-YYYY-MM-DD-HHmmss.svg). A PNG action downloads the equivalent .png, and a Copy image action copies the diagram. Export and copy controls are unavailable while the source has a syntax error
- A theme toggle in the header switches the whole app between light and dark; the preview recolors with the theme
- Reloading the page restores the last-edited source, the active tab, the config, and the theme, so work is not lost across a refresh
- No backend and no outbound navigation: every control acts on in-app client state; there are no links that navigate away from the workspace
</core_features>

<visual_design>
- A two-region workspace: a narrower left column stacking the tabbed source editor, the Sample diagrams panel, and the Actions panel; a wider right region devoted to the diagram preview. The editor and preview clearly read as one linked pair
- The source editor is a monospace text area with a two-tab strip (Code, Config); the active tab is visually distinguished from the inactive one
- The preview sits on a subtle grid backdrop and centers the rendered SVG; the current diagram type is surfaced as a small badge in the header
- Light and dark theme surfaces; the header, editor card, panels, and preview all recolor coherently on theme change, and the rendered diagram's own palette follows the theme
- Cards with hairline borders and soft shadows separate editor, samples, and actions; the error region uses a dark banner with a clearly destructive-colored icon and a readable monospace message body
- Primary emphasis is given to the source editor and preview over header chrome and secondary metadata; the controls that edit the source are grouped with the editor they affect, and export controls are grouped in their own Actions panel
- Responsive: at a narrow phone width (around 375 pixels) the two regions reflow into a single readable column with no clipped text or overlapping controls, and the export controls stay reachable without horizontal page scrolling
</visual_design>

<motion>
- Live preview: after a source edit the preview re-renders in place; on a syntax error the preview cross-fades to a dimmed state and returns to full opacity when the source becomes valid again
- Theme toggle: surfaces and the rendered diagram recolor together when the theme flips
- Buttons and tabs take a hover wash and show a visible focus ring on keyboard focus; the active editor tab and any pressed sample button read as a distinct state
- Switching sample diagrams or diagram types replaces the preview content without a full page reload; the header diagram-type badge updates to match
- No motion should depend on a backend round trip; all transitions are local
</motion>

<requirements>
- Use Svelte 5 with SvelteKit static delivery and Svelte stores/runes. Shared application state (the diagram source, the Mermaid config, the active editor tab, the current diagram type, the parse-error state, and the theme) must live in Svelte runes/stores; UI regions read from that shared state so the editor, preview, header badge, and export all stay consistent
- Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Use DaisyUI components for tabs, cards, buttons, alerts, toggles, and action controls; no other external component library. Svelte transitions and AutoAnimate are allowed for preview, error, tab, and control transitions; no other animation libraries. Phosphor icons via phosphor-svelte only; no raw pasted SVG icon sets and no icon CDNs. All forms, including configuration editing, validate through a Zod schema driven by Felte or TanStack Form for Svelte and render inline per-field errors before submit. All libraries are installed via npm and bundled locally; no CDN imports
- Use CodeMirror 6 for the source and configuration editor panes. Render real Mermaid diagrams from the source text with the mermaid library; the preview must reflect the actual parsed source, not a static image
- No authentication wall — open directly into the primary workspace
- Persist relevant state in localStorage (or equivalent client storage) so a reload restores the last-edited source, active tab, config, and theme. This persistence is a required behavior for this task
- Seed the editor with a non-empty default diagram and provide at least six selectable sample diagrams so the primary workflow is non-empty on first load
- State contracts (behavioral, not storage keys):
  - Editing the source updates the editor contents and re-renders the preview to the latest source; two consecutive edits leave only the most recent diagram rendered
  - Invalid syntax shows a visible error region and dims the preview without discarding the last valid render; correcting the source clears the error and renders the corrected diagram
  - Selecting a sample or otherwise changing diagram type re-renders the preview as the new type with no residual marks from the prior diagram, and updates the diagram-type badge
  - Exporting SVG downloads a file whose name identifies the diagram and ends in .svg; export is blocked while the source is in a syntax-error state
  - Toggling the theme recolors the app and the rendered diagram without reloading the document
- Keep the implementation frontend-only and self-contained; do not depend on a live backend, and do not iframe, proxy, or fetch the diagram from another origin
- Zero navigational outbound links for app chrome — in-app controls only
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
- browse-query-v1
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
- Editor object types: diagram
- Editor operations: set_content; switch_mode; preview
- Editor modes: code; config
- Destinations: flowchart; class; sequence; entity-relationship; state; mindmap; pie; gantt
- Themes: light; dark
- Artifact operations: export; copy
- Export formats: svg; png

Mechanics exclusions:
- Preview pan/zoom and rendered-diagram hover stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
