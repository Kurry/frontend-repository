<summary>
Build a Material UI theme creator using React, Zustand, and Tailwind CSS.
</summary>

<core_features>
Core features:
- App header with product title Material-UI Theme Creator, inert version chip, Tutorial control (in-page modal), and inert GitHub icon
- Main tabs: Preview / Components / Saved Themes (in-app only; never leave the page)
- Monaco editor showing ThemeOptions TypeScript, bi-synced with Palette / Fonts / Typography / Snippets tool panels
- Editor actions: Editor Settings, Copy theme code, undo/redo, save control with save-status text
- Light/Dark palette Type toggle that updates preview surfaces and editor source
- Device-framed sample sites (Phone / Tablet / Desktop) with sample templates containing internal anatomy
- Searchable component gallery themed by the active options
- Primary collection — saved themes: seed at least 3 saved themes; each has name, palette type (light/dark), and ThemeOptions payload; the list supports create (New Theme), edit (rename + save options), and delete
- At least two interaction modes: Preview/Editor mode (device preview + Monaco + tools) and Saved Themes mode (collection management + load into editor)
- Domain behavior beyond CRUD: load a saved theme into the editor/preview; Light/Dark type toggle; save-status feedback; empty saved-themes state after deleting all; filters or search over saved theme names
- Invalid create: empty theme name must not add a saved theme; show visible validation feedback
- Inert former external affordances — interactive look, no navigation
</core_features>

<visual_design>
- Dark studio shell (near-black surfaces, light shell text, indigo/Material primary accent) with Roboto and Material iconography
- Header brand lockup above main tabs; full-viewport tool density — not a marketing landing
- Preview tab: device toggles + framed sample site on one side; Monaco plus stacked tool panels on the other
- Saved Themes mode: dense list/cards of saved themes with load/delete actions and empty state
- Sample sites and component demos reflect live ThemeOptions
- Studio chrome may use Material UI + Emotion for component surfaces; Tailwind utility classes may appear alongside
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
Stack triad: React + Zustand + Tailwind CSS. Material UI + Emotion are allowed as the component library for studio chrome and themed previews. Monaco Editor is required for ThemeOptions editing. Google Fonts Roboto (and Web Font Loader for user-added fonts) allowed. No unrelated external component libraries (Chakra/Ant Design).
- Seed at least 3 saved themes so Saved Themes is non-empty on first load
- Empty required name on create must not increase the saved themes count; show visible validation feedback
- After deleting all saved themes, show an empty state in the Saved Themes region
- Zero navigational outbound links after settle; same-document hashes for component jumps allowed
- Document title Material UI Theme Creator; product header shows Material-UI Theme Creator
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

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
- Editor operations: select; update_property; preview; switch_mode
- Entity: theme
- Entity operations: create; select; update; delete
- Entity fields: name; palette
- Artifact operations: export; import; copy
- Export formats: json; css
- Import modes: declared-theme

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Color picker drag stays Playwright when mechanism matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
