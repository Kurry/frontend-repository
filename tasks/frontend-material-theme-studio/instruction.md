<summary>
Build a Material theme design studio using React, Redux Toolkit, and Tailwind CSS.
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
- The header shows the product title Material-UI Theme Creator, an inert version chip (e.g. @material-ui/core@^4.11.0), a Tutorial control that opens an in-page modal, and an inert GitHub icon that never navigates
- A main tab bar switches between three panels — Preview, Components, and Saved Themes — entirely in-app, swapping the workspace without a document navigation
- Preview panel puts a device-framed sample site on one side and a Monaco editor over stacked tool panels on the other; Phone / Tablet / Desktop toggles reframe the sample chrome to roughly 375px / 768px / full width without reload
- The device frame cycles through at least six sample templates (e.g. Instructions, Sign Up, Dashboard, Blog, Pricing, Checkout), each with its own internal anatomy and recolored live by the active theme options
- The Monaco editor shows the theme as ThemeOptions TypeScript and stays bi-synced with the tool panels: editing a tool rewrites the source, editing valid source updates the tools and preview, and invalid source surfaces an invalid-options status instead of applying
- Editor actions row: Editor Settings (toggles the Monaco color theme), Copy theme code (copies the generated TypeScript to the clipboard with a toast), Undo and Redo over the bounded edit history, and a Save control whose status text reflects saved / unsaved / editing state
- The Palette tool lists expandable accordion rows — a Light/Dark Type toggle, Background, Text, Divider, and the six intent colors primary, secondary, error, warning, info, success — and each intent row expands to main / light / dark / contrastText color fields kept live with the editor
- Toggling Type between Light and Dark recolors the preview surfaces (background, paper, text, divider) and updates the editor source immediately, without reload
- The Fonts tool adds a Google font by name (loading the family), rejects a duplicate with feedback, and removes a font — while keeping the base Roboto family protected from removal
- The Typography tool sets the font family from the loaded fonts and a base font size within a bounded numeric range; the Snippets tool offers a small fixed set of one-click presets (e.g. Dense spacing, Rounded shapes, Button casing) that patch the options and toast confirmation
- The Components panel renders a searchable gallery of roughly two dozen themed component demos (App Bar, Buttons, Card, Chip, Slider, Table, and the like) with a filterable drawer nav that jumps to a section via same-document anchors only
- Primary collection — saved themes: seed at least three saved themes (e.g. a default light theme, a dark starter, and a colored variant), each with a name, palette type (light/dark), and a ThemeOptions payload; Saved Themes lists them as cards showing swatches with load and delete controls and marks the active theme
- Saved Themes supports create (New Theme), edit (rename plus save-options), and delete; deleting a theme removes it from the list and from active selection when it was loaded, and deleting every theme shows an empty saved-themes state
- Loading a saved theme — from its card or Load control — writes its options into the shared editor/preview state and resets the dirty/undo state
- Domain behavior beyond CRUD: load a saved theme into the editor/preview; the Light/Dark type toggle; save-status feedback; and a search/filter over saved theme names that recomputes the visible cards from the collection
- Invalid create: an empty theme name must not add a saved theme and must surface visible validation feedback
</core_features>

<visual_design>
- Dark studio shell (near-black surfaces, light shell text, indigo/Material primary accent) with Roboto and Material iconography
- Header brand lockup above a three-tab bar (Preview / Components / Saved Themes) carrying a cyan Material logo mark; full-viewport tool density — not a marketing landing
- Preview tab: device toggles + framed sample site on one side; Monaco plus stacked Palette / Fonts / Typography / Snippets tool panels on the other, with a bottom tool-nav to switch panels
- Saved Themes mode: dense cards, each previewing the theme's swatches (e.g. primary / secondary / paper) with a type-and-updated meta line and load/delete actions; a visible empty state when the collection is emptied
- Sample sites and component demos recolor from the live ThemeOptions via CSS variables, so palette/typography edits are reflected across every preview surface
- Layout and chrome styled with Tailwind utility classes
</visual_design>

<motion>
- Main tabs: primary-colored indicator slides when switching Preview / Components / Saved Themes; tab labels ease opacity and background on hover/selection
- Hover animations (required): buttons and icon buttons brightness lift on hover; accordion summaries take a subtle hover wash; saved theme rows take a hover wash; inert link-like controls underline on hover
- Palette tool: accordion rows expand/collapse with chevron; color swatches stay live with the editor
- Preview stage: Phone / Tablet / Desktop toggles reframe the sample site chrome without reload
- Tutorial control opens an in-page modal/flow; action toasts may appear for save/apply
- Light/Dark palette type toggle updates preview surfaces immediately
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): saved themes collection, active theme/options, tab selection, device/template, and editor UI flags. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid saved theme increases the collection and shows it under Saved Themes
- Editing/renaming a saved theme updates that same record; saving options updates the active and saved payload
- Deleting a saved theme removes it from the list and from active selection if it was loaded
- Loading a saved theme writes its options into the shared editor/preview state
- Tab and Light/Dark type are shared client state; toggling them does not reload the document
Stack: React + Redux Toolkit + Tailwind CSS (Vite or equivalent SPA); frontend-only. Styling must use Tailwind utility classes. Monaco Editor is required. Roboto + Material Icons allowed. No MUI/Chakra/Ant Design runtime component libraries as the studio shell kit.
- Seed at least 3 saved themes so Saved Themes is non-empty on first load
- Empty required name on create must not increase the saved themes count; show visible validation feedback
- After deleting all saved themes, show an empty state in the Saved Themes region
- Zero navigational outbound links after settle; same-document hashes for component jumps allowed
- Document title Material UI Theme Creator; product header shows Material-UI Theme Creator
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
- entity-collection-v1
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
- Editor object types: material-theme
- Editor properties: palette; typography; shape
- Editor operations: select; update_property; preview
- Entity: theme
- Entity operations: create; select; update; delete
- Entity fields: name; palette
- Artifact operations: export; import; copy
- Export formats: json; css
- Import modes: declared-theme

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
