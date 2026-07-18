<summary>
Build a Material UI theme creator using React, Zustand, and Tailwind CSS.
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
Core features:
- The app header shows the product title Material-UI Theme Creator with a `@material-ui/core@^4.11.0` version affordance, a Tutorial control that opens an in-page modal/flow, and a GitHub icon; the version chip and GitHub icon look interactive but never navigate
- Main tabs Preview / Components / Saved Themes switch the workspace in-app with a primary-colored indicator that slides to the selection; selecting a tab never leaves the page
- The Preview tab shows a device-framed sample site whose Phone / Tablet / Desktop toggles reframe the chrome without reload, and the framed site carries its own nested tabs (Instructions, Sign Up, Dashboard, Blog, Pricing, Checkout) rendering themed sample templates
- A Monaco editor displays the current ThemeOptions as TypeScript; editing valid source updates the live preview and the tool controls, and editing tool controls writes back into the Monaco source (bi-directional sync); invalid source surfaces diagnostics without crashing the shell
- The editor toolbar exposes Editor Settings, Copy theme code (copies the current source to the clipboard), undo and redo (disabled when history is empty), and a save control whose status text reads "All changes saved" when the source matches the active theme
- The Palette tool is an accordion with rows Type, Background, Text, primary, secondary, error, warning, info, success, and Divider; expanding a row reveals its color swatches/pickers, and changing a color updates preview surfaces and the editor source live
- The Type row (also surfaced as a Light/Dark toggle) flips palette.type between light and dark, immediately recoloring preview surfaces and the editor source
- The Fonts tool adds a Google Font by name via Web Font Loader so it becomes available to Typography and preview text; the Typography tool configures font families/sizes for preview variants; the Snippets tool applies built-in global-style/default-option snippets into the theme
- The Components tab shows a searchable left drawer/jump list plus a scrollable gallery of themed Material-UI demos (Accordion, App Bar, Avatar, Badge, Buttons, Card, Checkboxes, Chip, Dialog, List, Menu, Select, Slider, Snackbar, Stepper, Switch, Table, Tabs, TextField, Tooltip, Typography, and more); typing in search narrows the sections, jump links scroll to a section via same-document hash without leaving the page, and per-component Docs affordances are inert
- Primary collection is saved themes: seed at least 3 so Saved Themes is non-empty on first load; each has a name, palette type (light/dark), and a ThemeOptions payload, and the list supports create (New Theme), rename/edit, save-options, and delete
- Two interaction modes: Preview/Editor mode (device preview + Monaco + tools) and Saved Themes mode (list/cards with load and delete, plus an empty state)
- Loading a saved theme writes its options into the shared editor/preview state so the Monaco source, tool controls, and preview all reflect it; deleting the theme that is loaded also clears it from active selection
- Submitting New Theme with an empty name shows visible validation feedback and adds no saved theme; a valid name adds exactly one, and search/filter over saved theme names narrows the list
- Deleting all saved themes shows an empty state in the Saved Themes region
- Former external affordances (version chip, GitHub icon, Google Fonts / Monaco / Web Font Loader / Gitlab CTA / per-component Docs) keep an interactive look but never navigate
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
- Editing a palette/typography/shape control and editing the Monaco source stay bi-directionally synced through the same shared options; neither keeps a private disconnected copy
- Tab, active device/template, and Light/Dark type are shared client state; toggling them does not reload the document
Stack triad: React + Zustand + Tailwind CSS. Material UI + Emotion are allowed as the component library for studio chrome and themed previews. Monaco Editor is required for ThemeOptions editing. Google Fonts Roboto (and Web Font Loader for user-added fonts) allowed. No unrelated external component libraries (Chakra/Ant Design).
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
