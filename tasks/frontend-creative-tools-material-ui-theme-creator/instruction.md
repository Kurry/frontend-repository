<summary>
Build a Material UI theme creator using React, Zustand, Tailwind CSS 4.3.2, and MUI.
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
Feature: Shell and navigation —
- The app header shows the product title Material-UI Theme Creator with a version affordance reading @material-ui/core@^4.11.0, a Tutorial control that opens an in-page modal/flow, and a GitHub icon; the version chip and GitHub icon look interactive but never navigate
- Main tabs Preview / Components / Saved Themes switch the workspace in-app; selecting a tab never leaves the page
- Two interaction modes: Preview/Editor mode (device preview plus code editor plus tools) and Saved Themes mode (list/cards with load and delete, plus an empty state)
- A Command palette control (and keyboard shortcut Cmd+K / Ctrl+K) opens an in-page command list that fuzzy-matches main tabs, Palette / Fonts / Typography / Shape / Snippets / Export tools, saved theme names, and Components gallery sections; choosing a result navigates or focuses that target without leaving the page
Feature: Preview workspace —
- The Preview tab shows a device-framed sample site whose Phone / Tablet / Desktop toggles reframe the chrome without reload, and the framed site carries its own nested tabs (Instructions, Sign Up, Dashboard, Blog, Pricing, Checkout) rendering themed sample templates
- Sample sites and component demos reflect the live theme options at all times
- A Color blindness control on the preview stage offers Off / Protanopia / Deuteranopia / Tritanopia; selecting a mode applies a visible simulation filter over the framed sample site without mutating the theme options, and Off restores the unfiltered preview
- A Before / After compare control toggles the framed preview between the current live options and the last saved snapshot (or the loaded saved theme's payload when no snapshot exists); the editor source and tool controls stay on the live options while Before is shown
Feature: Theme source editor —
- A code editor pane displays the current theme options as TypeScript source; editing valid source updates the live preview and the tool controls, and editing tool controls writes back into the editor source (bi-directional sync); invalid source surfaces diagnostics without crashing the shell
- The editor toolbar exposes Editor Settings, Copy theme code (copies the current source to the clipboard with visible confirmation), undo and redo (disabled when history is empty), a history timeline scrubber that moves the active options through recorded edit states with the current position labeled, and a save control whose status text reads All changes saved when the source matches the active theme
Feature: Theme tools —
- The Palette tool is an accordion with rows Type, Background, Text, primary, secondary, error, warning, info, success, and Divider; expanding a row reveals its color swatches/pickers, and changing a color updates preview surfaces and the editor source live
- The Type row (also surfaced as a Light/Dark toggle) flips the palette type between light and dark, immediately recoloring preview surfaces and the editor source
- A Presets strip offers at least four one-click packs — Material Blue, Ocean, Forest, and High Contrast — each applying a multi-token palette (and Light/Dark type where the pack defines it) to the live options; applying a pack updates the editor source, preview, Components demos, contrast matrix, and export text without reload
- The Fonts tool adds a font by name from the locally bundled font set so it becomes available to Typography and preview text; the Typography tool configures font families/sizes for preview variants; the Shape tool sets border radius values that restyle preview corners and write into the editor source; the Snippets tool applies built-in global-style/default-option snippets into the theme
- A Contrast matrix panel lists at least primary-on-background, secondary-on-background, text-on-background, and primary-on-primary-contrast pairings; each row shows a computed contrast ratio and an AA / AAA / Fail badge that updates live when palette colors or Light/Dark type change
Feature: Components gallery —
- The Components tab shows a searchable left drawer/jump list plus a scrollable gallery of themed component demos (Accordion, App Bar, Avatar, Badge, Buttons, Card, Checkboxes, Chip, Dialog, List, Menu, Select, Slider, Snackbar, Stepper, Switch, Table, Tabs, TextField, Tooltip, Typography, and more); typing in search narrows the sections, jump links scroll to a section via same-document hash without leaving the page, and per-component Docs affordances are inert
Feature: Saved themes —
- Primary collection is saved themes: seed at least 3 so Saved Themes is non-empty on first load; each saved theme record is API-shaped like a Material theme create/update request body and carries the Theme package field contract below; the list supports create (New Theme), rename/edit, save-options, and delete
- Theme package field contract (the record New Theme, rename, and save-options produce IS the would-be request body; forms, Palette/Typography/Shape tools, Theme Files JSON, and Import all enforce the same rules):
  - name: required trimmed non-empty string, at most 64 characters; must be unique among saved themes (case-sensitive after trim); empty, whitespace-only, over-length, or duplicate name shows an inline error naming the name field and does not create or rename
  - paletteType: required closed enum exactly light or dark
  - themeOptions: required object
  - themeOptions.palette.type: required closed enum exactly light or dark, and must equal paletteType (cross-field rule)
  - themeOptions.palette intent colors primary, secondary, error, warning, info, and success: each requires main as a #RRGGBB hex color string (hash plus exactly six hexadecimal digits, case-insensitive); a missing main or non-hex value shows an inline error naming that field path (e.g. primary.main) and is not applied
  - Optional themeOptions.palette background.default, background.paper, text.primary, text.secondary, and divider: when present each uses the same #RRGGBB format
  - Optional themeOptions.typography.fontFamily: when present, a non-empty string; empty string is rejected with an inline error naming fontFamily
  - Optional themeOptions.typography.fontSize: when present, a number from 10 through 24 inclusive; values outside that range show an inline error naming fontSize and are not applied
  - themeOptions.shape.borderRadius: required number from 0 through 24 inclusive; values outside that range show an inline error naming borderRadius and are not applied
  - Cross-field: paletteType, themeOptions.palette.type, and the Light/Dark Type control must agree; New Theme and save-options write a record where those three surfaces match; Import rejects a payload that would leave them disagreeing
- The New Theme and rename forms validate inline before submit against the name rules above: the name field shows a per-field error naming the field when it is empty, over-length, or duplicates an existing theme, and the submit control stays disabled until the name is valid; submitting a valid name creates exactly that would-be request body (name, paletteType from the current Light/Dark type, themeOptions from the live options)
- Search/filter over saved theme names narrows the list; clearing the search restores the full list exactly
- Snapshot field contract: each snapshot is a payload with required name (trimmed non-empty string, at most 64 characters) and themeOptions (the same ThemeOptions rules as the Theme package field contract, including palette.type, #RRGGBB mains, optional typography bounds, and required shape.borderRadius); a Snapshot control on a loaded theme saves the current live options under a valid name into that theme's snapshot list; selecting a snapshot restores those options into the editor/preview; an empty, whitespace-only, or over-length snapshot name shows inline validation naming the name field and saves nothing
- Former external affordances (version chip, GitHub icon, font catalog / editor vendor / hosting CTA / per-component Docs) keep an interactive look but never navigate
Feature: Theme files export and import —
- The app produces the user's theme files: an Export control opens a Theme Files drawer/modal with two live-generated artifacts compiled from the current store — (1) a JSON theme package and (2) a CSS custom-properties block derived from the same options
- The JSON theme package is API-shaped like a real Material theme create/update payload — a single object (not an array) whose field names and values are visible in the preview text and must conform to the Theme package field contract: name, paletteType (light or dark), themeOptions with palette.type matching paletteType, each intent main as #RRGGBB, optional typography.fontFamily / fontSize (10–24 when present), and required shape.borderRadius (0–24); after editing those fields, the JSON preview contains the session's actual values under those field names
- The record each form creates (New Theme, save-options, Snapshot) is exactly the object that appears in the matching export/import shape — same field names, same bounds, same enums — and form validation enforces the same contracts the export shape declares, always naming the offending field inline
- Both artifacts regenerate on every edit: changing a palette color, typography, shape, Light/Dark type, or loading a saved theme changes the export text so it contains the session's actual customizations; an export that omits the current session mutations is incorrect, and the JSON preview must still show every required key from the Theme package field contract
- Each artifact offers Copy (clipboard with visible confirmation) and Download controls that transfer the exact previewed text
- An Import control accepts a declared-theme JSON package (paste or file pick) that must conform to the same Theme package field contract; a valid package replaces the live options and updates the editor source, tools, preview, Components demos, contrast matrix, and export text; a package that is malformed, missing required keys, has paletteType outside light/dark, has themeOptions.palette.type disagreeing with paletteType, has a color that is not #RRGGBB, has fontSize outside 10–24 when present, or has shape.borderRadius outside 0–24 shows visible validation feedback naming the field and leaves the live theme unchanged
</core_features>

<user_flows>
- Submitting New Theme with a valid name adds exactly one saved theme: the list count increases by one, the new card shows the entered name, and switching to Preview and back to Saved Themes still shows it without a reload
- Loading a saved theme writes its options into the shared editor/preview state so the editor source, tool controls, framed sample site, Components gallery demos, contrast matrix, and Theme Files export all reflect it immediately, and it stays active when switching between the main tabs
- Changing a palette color from the Palette tool recolors the preview surfaces, rewrites the matching value in the editor source, updates the contrast matrix badges, and the same change is visible in the Components tab demos and in the Theme Files JSON/CSS export text without a reload
- Applying a Preset pack mutates multiple palette tokens at once: the editor source, preview, contrast matrix, and both export artifacts all show the pack's values; undoing once restores the pre-pack options across those surfaces
- Toggling the palette type between light and dark recolors preview surfaces and the editor source immediately, and the chosen type remains applied while switching Preview / Components / Saved Themes
- Renaming a saved theme updates that same card in the list without creating a duplicate; saving options updates both the active theme and the saved payload so reloading that theme later reproduces the edited options
- Deleting the theme that is currently loaded removes its card, decreases the list count by one, and clears it from active selection
- Export end-to-end: edit primary to a unique color, open Theme Files, and confirm both JSON and CSS artifacts contain that color; Copy shows confirmation; Download transfers the same text that the drawer previews
- Import round-trip: export the current theme as JSON, change a palette color so the live preview differs, then Import the earlier JSON and confirm editor, preview, contrast matrix, and export text return to the exported options including the same name, paletteType, and themeOptions.palette.primary.main values
- Snapshot compare: save a Snapshot, change a palette color, toggle Before / After and confirm the framed preview flips between the snapshot colors and the live colors while the editor stays on the live options
- Command palette jump: open the command palette, choose a Components section result, and land on that gallery section without leaving the page
- Theme package field contract: open Theme Files after editing primary.main and shape.borderRadius and confirm the JSON preview shows keys name, paletteType, and themeOptions with palette.type equal to paletteType, primary.main as a #RRGGBB hex matching the live swatch, and shape.borderRadius as a number from 0 through 24 matching the Shape tool
- Schema validation on create: attempting New Theme with a duplicate of a seeded theme name, or a name longer than 64 characters, leaves the card count unchanged and shows an inline error naming the name field; submitting a unique valid name then succeeds and increases the count by exactly one
- A page reload returns the app to its seeded state: the seeded saved themes are present and unsaved edits, snapshots from the session, import drafts, and undo history are gone
</user_flows>

<edge_cases>
- Submitting New Theme with an empty or whitespace-only name shows visible validation feedback naming the name field and adds no saved theme; the saved themes count does not change
- Submitting New Theme or rename with a name that already exists on another saved theme (after trim), or a name longer than 64 characters, must not change the collection; a visible inline validation message names the name field
- Editing the theme source into invalid TypeScript surfaces diagnostics in the editor region while the shell, tabs, and tool controls keep working with the last valid options
- Deleting all saved themes shows an empty state in the Saved Themes region that explains the region is empty and how to create a theme
- A saved-themes search that matches nothing shows an empty result state; clearing the search restores the full list
- Undo and redo controls are disabled when their history direction is empty and never throw when activated at a boundary; the history timeline scrubber at the oldest position matches a fully undone state
- Double-activating the New Theme submit control creates exactly one saved theme: the count increases by one and one new card appears
- Importing malformed declared-theme JSON shows visible validation feedback and does not replace the live theme options
- Importing a declared-theme package whose paletteType is not exactly light or dark, whose themeOptions.palette.type disagrees with paletteType, whose themeOptions.palette.primary.main is not a #RRGGBB hex, whose themeOptions.typography.fontSize is outside 10–24 when present, or whose themeOptions.shape.borderRadius is outside 0–24 shows visible validation naming the offending field and does not replace the live theme options
- Saving a Snapshot with an empty, whitespace-only, or over-length (over 64 characters) name shows inline validation naming the name field and adds no snapshot
- A Shape borderRadius or Typography fontSize outside its field-contract bounds shows an inline error naming that field and is not applied to the editor source, preview, or Theme Files export
- Color blindness modes never permanently alter theme options: switching Off after Protanopia restores the same unfiltered preview colors that match the live editor options
- A command palette query with no matches shows an empty result state; Escape closes the palette and returns focus to the control that opened it
</edge_cases>

<visual_design>
- Dark studio shell (near-black surfaces, light shell text, indigo/Material primary accent) with Roboto and Material iconography
- Header brand lockup above main tabs; full-viewport tool density — not a marketing landing
- Preview tab: device toggles plus framed sample site on one side; the code editor plus stacked tool panels on the other
- Saved Themes mode: dense list/cards of saved themes with load/delete actions and empty state
- Sample sites and component demos reflect the live theme options
- Contrast matrix rows show ratio numerals plus AA / AAA / Fail badges with distinct treatments so status is not color-only
- Theme Files drawer shows two labeled artifact panes (JSON and CSS) with monospace preview text, Copy, and Download
- Before / After and Color blindness controls sit as compact preview-stage chrome without covering the sample site content
- Component states: buttons, inputs, and accordion rows show distinct default, hover, focus (visible ring), and disabled treatments
</visual_design>

<motion>
- Main tabs: primary-colored indicator slides when switching Preview / Components / Saved Themes; tab labels ease opacity and background on hover/selection
- Hover animations (required): buttons and icon buttons brightness lift on hover; accordion summaries take a subtle hover wash; saved theme rows take a hover wash; inert link-like controls underline on hover
- Palette tool: accordion rows expand/collapse with an animated chevron and smooth height transition; color swatches stay live with the editor
- Preview stage: Phone / Tablet / Desktop toggles reframe the sample site chrome without reload; Before / After cross-fades the framed preview; color-blindness mode changes ease the filter on rather than snapping
- Tutorial control opens an in-page modal/flow with a short enter/exit transition; action toasts for save/apply/copy/export/import slide in and auto-dismiss with a fade
- Creating a saved theme animates the new card into the list; deleting a saved theme animates the card out rather than snapping
- Command palette enters with a brief opacity/scale; Theme Files drawer slides or fades in
- Preset pack application briefly highlights changed Palette swatches; contrast matrix badges update with a short settle
- Light/Dark palette type toggle updates preview surfaces immediately
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At widths of 1024 pixels and below, the Preview workspace stacks vertically: the device preview sits above the editor and tool panels, and every control remains reachable
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears
- Theme Files drawer, Tutorial modal, and Command palette remain fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control (tabs, device toggles, accordion rows, editor toolbar, saved theme actions, Export/Import, Command palette, Before/After, Color blindness, Presets, Snapshot) is reachable and operable with the keyboard alone, with a visible focus indicator
- The Tutorial modal, Theme Files drawer, and Command palette each use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them
- Palette accordion rows expose their expanded/collapsed state to assistive technology and toggle with Enter or Space
- New Theme validation messages, Import validation, and Snapshot name validation are shown visually and announced via an aria-live region
- Contrast matrix AA / AAA / Fail status is exposed as text (not color alone); Copy and Download confirmations are announced via aria-live
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (tab switches, palette edits, source edits, saved theme create/load/delete, export/import, presets, snapshots, command palette)
- Rapid palette changes, continuous typing in the source editor, and history timeline scrubbing stay responsive with no hangs or dropped interactions
- Theme Files export text regenerates without blocking the UI when palette colors change
</performance>

<writing>
- Headings, buttons, and tab labels use one consistent capitalization convention throughout the app
- The save status text reads All changes saved when the source matches the active theme; validation messages name the field and the fix
- Empty states explain what belongs in the region and how to add it; no placeholder or lorem-ipsum text appears anywhere in the shipped UI
- Theme Files panes are labeled JSON and CSS; Contrast matrix badges use the exact tokens AA, AAA, and Fail; Preset packs use the names Material Blue, Ocean, Forest, and High Contrast
- Theme package JSON preview and Import validation copy use the field names name, paletteType, and themeOptions (and nested palette.type / primary.main / shape.borderRadius) rather than vague labels alone
</writing>

<innovation>
Optional enhancements the builder may add; none are required for a passing build:
- A guided coachmark tour that highlights Preview, Palette, Export, and Saved Themes on first open
- Linked primary/secondary harmony suggestions when a palette color is far from Material tonal guidance
- Keyboard shortcuts sheet listing Cmd+K, undo/redo, and export shortcuts
</innovation>

<requirements>
Shared application state must use Zustand, the state library named in summary (in-memory only): the saved themes collection (including per-theme snapshots), active theme/options, tab selection, device/template, editor UI flags, undo/redo history and timeline position, contrast matrix derivations, color-blindness mode, before/after compare flag, command palette query, and Theme Files export text. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid saved theme increases the collection and shows it under Saved Themes
- Editing/renaming a saved theme updates that same record; saving options updates the active and saved payload
- Deleting a saved theme removes it from the list and from active selection if it was loaded
- Loading a saved theme writes its options into the shared editor/preview state
- Editing a palette/typography/shape control and editing the source pane stay bi-directionally synced through the same shared options; neither keeps a private disconnected copy
- Theme Files JSON and CSS artifacts, the contrast matrix, and Components demos derive from the same shared options; export text always reflects the latest mutations
- Importing a valid declared-theme JSON replaces the shared options so every surface updates together; malformed or schema-invalid import leaves shared options unchanged
- Snapshots store and restore options for a saved theme as name + themeOptions payloads; Before/After compares against the last snapshot or loaded payload without inventing a second disconnected theme
- Tab, active device/template, Light/Dark type, color-blindness mode, and compare flag are shared client state; toggling them does not reload the document
- Undo, redo, and the history timeline operate on the same shared options the visible controls mutate
Stack: React with Vite or an equivalent SPA setup. Tailwind CSS 4.3.2 (pinned) is the styling base with design tokens in the @theme layer; MUI is the sole component library, used for studio chrome and the themed previews (its bundled styling engine is part of MUI), while Tailwind owns layout, spacing, and custom surfaces. No other external component libraries (Chakra, Ant Design, Mantine).
Monaco Editor is required for the theme options source pane.
Motion for React is the animation library; AutoAnimate may be added for list add/remove microinteractions; no other animation libraries.
Material Symbols icons only, installed via the npm package; one icon set used consistently.
All forms (New Theme, rename/edit, Editor Settings, Snapshot name, Import) are driven by React Hook Form with a Zod schema: the schema defines the rules and inline per-field errors appear before submit, with submit disabled until valid. Schemas are API-shaped: they mirror the Theme package field contract above (required trimmed unique name at most 64 characters, paletteType exactly light or dark, themeOptions.palette with #RRGGBB main colors for primary through success, optional typography.fontSize from 10 to 24 inclusive when present, required shape.borderRadius from 0 to 24 inclusive, and the paletteType ↔ themeOptions.palette.type ↔ Light/Dark Type cross-field rule), the record a form creates is the would-be request body, and Theme Files export/import compile and validate against those same schemas. Field contracts are enforceable in the UI (named field errors), not only declared in schema code.
Roboto and every user-addable font ship as locally bundled font files in /app; no font CDNs. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 3 saved themes so Saved Themes is non-empty on first load; every seeded theme conforms to the Theme package field contract
- Empty, duplicate, or over-length required name on create must not increase the saved themes count; show visible validation feedback naming the name field
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
