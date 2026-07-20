<summary>
Build a Material theme design studio using React, Redux Toolkit, Tailwind CSS 4.3.2, and MUI.
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
- The header shows the product title Material-UI Theme Creator, an inert version chip (e.g. @material-ui/core@^4.11.0), a Tutorial control that opens an in-page modal, and an inert GitHub icon that never navigates
- A main tab bar switches between four panels — Preview, Components, Saved Themes, and Export — entirely in-app, swapping the workspace without a document navigation
- A command palette opens with Ctrl+K (Cmd+K on macOS), fuzzy-matches main tabs, Palette / Fonts / Typography / Snippets tools, saved theme names, sample templates, and Components gallery sections; Enter on a highlighted theme result loads that theme and closes the palette; Escape closes the palette and returns focus
Feature: Preview workspace —
- Preview panel puts a device-framed sample site on one side and a code editor over stacked tool panels on the other; Phone / Tablet / Desktop toggles reframe the sample chrome to roughly 375px / 768px / full width without reload
- The device frame cycles through at least six sample templates (e.g. Instructions, Sign Up, Dashboard, Blog, Pricing, Checkout), each with its own internal anatomy and recolored live by the active theme options
- A color-blindness control on the preview chrome offers None / Protanopia / Deuteranopia / Tritanopia; choosing a mode applies an SVG filter overlay to the framed sample site only without mutating theme options; None removes the filter — both without reload
- A Before / After compare control toggles the framed sample between the current ThemeOptions and the last saved version snapshot of the active theme while the editor and tool panels keep showing the current editable options
Feature: Theme source editor —
- The code editor shows the theme as ThemeOptions TypeScript and stays bi-synced with the tool panels: editing a tool rewrites the source, editing valid source updates the tools and preview, and invalid source surfaces an invalid-options status instead of applying while the preview keeps rendering the last valid theme
- Editor actions row: Editor Settings (toggles the editor color theme), Copy theme code (copies the generated TypeScript to the clipboard with a toast), Undo and Redo over the bounded edit history, and a Save control whose status text reflects saved / unsaved / editing state
Feature: Theme tools —
- The Palette tool lists expandable accordion rows — a Light/Dark Type toggle, Background, Text, Divider, and the six intent colors primary, secondary, error, warning, info, success — and each intent row expands to main / light / dark / contrastText color fields kept live with the editor
- Each Palette intent color row shows a live WCAG contrast readout for main versus contrastText labeled exactly Pass AA, Pass AAA, or Fail; changing either color recomputes the label immediately
- Harmonics suggestions (Analogous, Complementary, Triadic) derived from primary main write a derived hex into secondary main, rewrite the editor source, and recolor the preview without a reload
- Toggling Type between Light and Dark recolors the preview surfaces (background, paper, text, divider) and updates the editor source immediately, without reload
- The Fonts tool adds a Google font by name (loading the family) and removes a font — while keeping the base Roboto family protected from removal
- The Typography tool sets typography.fontFamily from the loaded fonts and typography.fontSize as an integer from 8 through 24 inclusive; shape.borderRadius is a number from 0 through 24 inclusive kept live with the editor; entering a size outside 8 through 24 or a borderRadius outside 0 through 24 is rejected or clamped with visible feedback naming the fontSize or borderRadius field
- The Snippets tool offers a small fixed set of one-click presets (e.g. Dense spacing, Rounded shapes, Button casing) that patch the options and toast confirmation; Rounded shapes updates shape.borderRadius within 0 through 24
Feature: Components gallery —
- The Components panel renders a searchable gallery of roughly two dozen themed component demos (App Bar, Buttons, Card, Chip, Slider, Table, and the like) with a filterable drawer nav that jumps to a section via same-document anchors only
Feature: Saved themes —
- Primary collection — saved themes: seed at least three saved themes (e.g. a default light theme, a dark starter, and a colored variant), each conforming to the ThemeOptions field contract below; Saved Themes lists them as cards showing swatches with load and delete controls and marks the active theme
- ThemeOptions field contract (the record New Theme, rename, save-options, Export JSON, and Import produce and enforce — the created record IS the would-be request body):
  - name: required trimmed non-empty string, at most 64 characters; must be unique among saved themes (case-sensitive after trim); empty, whitespace-only, over-length, or duplicate name shows an inline error naming the name field and does not create or rename
  - palette.type: required closed enum exactly light or dark, and must agree with the Light/Dark Type control (cross-field rule)
  - Intent colors primary, secondary, error, warning, info, and success: each requires main, light, dark, and contrastText as #RRGGBB hex color strings (hash plus exactly six hexadecimal digits, case-insensitive); a missing channel or non-hex value shows an inline error naming that field path (e.g. primary.main) and is not applied
  - Optional background.default, background.paper, text.primary, text.secondary, and divider: when present each uses the same #RRGGBB format
  - typography.fontFamily: required non-empty string when set through Typography; empty string is rejected with an inline error naming fontFamily
  - typography.fontSize: required number from 8 through 24 inclusive; values outside that range show an inline error naming fontSize and are not applied
  - shape.borderRadius: required number from 0 through 24 inclusive; values outside that range show an inline error naming borderRadius and are not applied
  - Cross-field: the Light/Dark Type control and palette.type must agree; New Theme and save-options write a record where those surfaces match; Import rejects a payload that would leave them disagreeing
- Saved Themes supports create (New Theme), edit (rename plus save-options), and delete; deleting a theme removes it from the list and from active selection when it was loaded
- The theme create and rename forms validate inline before submit against the name rules: the name field shows a per-field error naming the field when it is empty, over-length, or duplicates an existing theme, and the submit control stays disabled until the name is valid; submitting a valid name creates exactly that would-be request body (name plus ThemeOptions from the live options with palette.type matching the current Type)
- Loading a saved theme — from its card, Load control, or command palette — writes its options into the shared editor/preview state and resets the dirty/undo state
- Search/filter over saved theme names recomputes the visible cards from the collection, restoring the full card set when the query is cleared
- Versions: a Save version control with a valid name adds exactly one snapshot under Versions for the active theme; Restore on a selected snapshot writes those options into editor, tools, and preview and marks the theme unsaved; an empty version name adds nothing and shows an inline error naming the name field
Feature: Theme files export and import —
- The app produces the user's theme files: the Export tab shows live-compiled ThemeOptions JSON and CSS variables format tabs, regenerated on every edit from the shared store
- The JSON artifact is API-shaped like a Material theme create/update payload — a single object whose field names and values are visible in the preview text and must conform to the ThemeOptions field contract: name, palette.type (light or dark agreeing with the Type toggle), each of primary/secondary/error/warning/info/success with main/light/dark/contrastText #RRGGBB values, typography.fontFamily, typography.fontSize (8–24), and shape.borderRadius (0–24); after editing those fields, the JSON preview contains the session's actual values under those field names
- Both artifacts regenerate on every edit: changing a palette color, typography, shape.borderRadius, Light/Dark type, or loading a saved theme changes the export text so it contains the session's actual customizations; an export that omits the current session mutations is incorrect
- Export offers Download JSON, Download CSS, and Copy export: Download triggers a real file download of the visible format text, and Copy writes that exact visible text to the clipboard with a confirmation toast
- Import ThemeOptions accepts a declared-theme JSON package (paste or file pick) that must conform to the same ThemeOptions field contract; a valid package replaces the live options and updates the editor source, tools, Type toggle, preview, Components demos, and Export text and flips save status to unsaved; a package that is malformed, missing required keys, has palette.type outside light/dark, has a color that is not #RRGGBB, has fontSize outside 8–24, has borderRadius outside 0–24, or breaks the Type↔palette.type cross-field rule shows visible validation feedback naming the field and leaves the live theme unchanged
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- Creating a saved theme: activating New Theme and submitting a valid name closes the form, increases the saved-themes card count by exactly one, shows the new card with its swatches and meta line, and loading that card immediately rewrites the editor source and recolors the framed sample site without a reload
- Editing a palette color: changing the primary main color in the Palette tool recolors the sample site's primary surfaces immediately, rewrites the ThemeOptions source in the editor to the new hex, flips the save status to unsaved, recomputes that intent's WCAG contrast label, and updates the Export panel's JSON and CSS text to include the new hex; after activating Save, the status returns to saved and the active theme's card under Saved Themes shows the updated swatch without a reload
- Light/Dark round-trip: toggling Type to Dark recolors the preview background, paper, text, and divider surfaces, updates the editor source, and switching to the Components panel shows the same dark surfaces across the component demos; toggling back to Light restores the light surfaces on every panel without a document navigation
- Undo round-trip: after a tool edit, activating Undo restores the previous value in the tool field, the editor source, the preview, and the Export preview text together; activating Redo reapplies the edit across all four surfaces
- Deleting the loaded theme: confirming delete removes its card, decreases the card count by exactly one, and clears the active-theme marker so no card is marked active until another theme is loaded
- Export then import: after editing primary main to a distinct #RRGGBB hex and shape.borderRadius to a distinct in-range value, open Export and confirm the ThemeOptions JSON preview contains that hex under primary.main along with palette.type, typography.fontFamily, typography.fontSize, and shape.borderRadius; after changing the color and radius away, Import that same payload — editor, tools, Type toggle, preview, and Export text all return to the imported options including that hex and borderRadius without a reload
- Command palette jump: open with Ctrl+K, type part of a seeded theme name, press Enter on the highlighted theme result — that theme loads into editor and preview and the palette closes
- Version restore: after editing palette values, Save version with a valid name adds one snapshot; editing again then Restoring the snapshot returns editor, tools, preview, and Export text to the snapshotted options
- Schema validation on create: attempting New Theme with a duplicate of a seeded theme name leaves the card count unchanged and shows an inline error naming the name field; submitting a unique valid name then succeeds and increases the count by exactly one
- ThemeOptions field contract: open Export after editing primary.main and shape.borderRadius and confirm the JSON preview shows name, palette.type equal to the Type toggle, primary.main as a #RRGGBB hex matching the live swatch, typography.fontSize from 8 through 24, and shape.borderRadius from 0 through 24
- A page reload returns the app to its seeded state: the three seeded themes are listed, the default theme is active, and any unsaved edits, versions from the session, import drafts, and undo history from before the reload are gone
</user_flows>

<edge_cases>
- Submitting the theme create or rename form with an empty name must not add or change a saved theme and must not change the card count; a visible inline validation message names the name field
- Submitting create or rename with a name that already exists on another saved theme (after trim), or a name longer than 64 characters, leaves the collection unchanged and shows an inline validation message naming the name field
- Adding a font whose family name is already loaded is rejected with visible feedback and does not add a duplicate entry to the fonts list
- The base Roboto family cannot be removed: its remove control is absent or disabled, and the fonts list always contains Roboto
- Editing the theme source into invalid options surfaces an invalid-options status, applies nothing, and the preview keeps rendering the last valid theme
- A typography.fontSize outside 8 through 24, or a shape.borderRadius outside 0 through 24, is rejected or clamped with visible feedback naming the fontSize or borderRadius field instead of being applied verbatim
- Entering a non-#RRGGBB value into an intent color channel (e.g. primary.main) shows an inline error naming that field path and does not update editor source, preview, or Export text
- Deleting every saved theme shows an empty saved-themes state with a message and a way to create a new theme; a search query that matches no theme names shows an empty result state and clearing it restores all cards
- Importing ThemeOptions JSON that omits a required intent channel, sets palette.type outside light|dark, uses fontSize outside 8 through 24, uses borderRadius outside 0 through 24, or breaks the Type↔palette.type cross-field rule shows a visible error naming the offending field and leaves editor/preview/Export unchanged
- Importing unparseable JSON (not an object) shows a visible payload error and leaves editor, tools, preview, save status, and Export text unchanged
- Saving a version with an empty name adds no snapshot, leaves the Versions count unchanged, and shows an inline validation message naming the name field
- Double-activating Copy export or Download produces exactly one clipboard write or download with a single confirmation — not a stuck or duplicated toast storm
- Color-blindness modes never permanently alter theme options: switching None after Protanopia restores the same unfiltered preview colors that match the live editor options
- A command palette query with no matches shows an empty result state; Escape closes the palette and returns focus to the control that opened it
</edge_cases>

<visual_design>
- Dark studio shell (near-black surfaces, light shell text, indigo/Material primary accent) with Roboto and Material iconography
- Header brand lockup above a four-tab bar (Preview / Components / Saved Themes / Export) carrying a cyan Material logo mark; full-viewport tool density — not a marketing landing
- Preview tab: device toggles + framed sample site on one side; the code editor plus stacked Palette / Fonts / Typography / Snippets tool panels on the other, with a bottom tool-nav to switch panels
- Saved Themes mode: dense cards, each previewing the theme's swatches (e.g. primary / secondary / paper) with a type-and-updated meta line and load/delete actions; a visible empty state when the collection is emptied
- Export mode shows a monospaced live preview block with JSON / CSS format tabs, Download and Copy controls, and an Import ThemeOptions affordance as a dense tool surface — not a marketing CTA card
- Sample sites and component demos recolor from the live ThemeOptions via CSS variables, so palette/typography edits are reflected across every preview surface
- WCAG contrast labels and harmonic suggestion chips read as compact meta beside Palette fields, not large promo cards competing with the editor
- Before / After and color-blindness controls sit as compact preview-stage chrome without covering the sample site content
- Component states: buttons, inputs, and accordion controls show distinct default, hover, focus (visible ring), and disabled treatments
</visual_design>

<motion>
- Main tabs: primary-colored indicator slides when switching Preview / Components / Saved Themes / Export; tab labels ease opacity and background on hover/selection
- Hover animations (required): buttons and icon buttons brightness lift on hover; accordion summaries take a subtle hover wash; saved theme rows take a hover wash; inert link-like controls underline on hover
- Palette tool: accordion rows expand/collapse with chevron rotation and an eased height transition; color swatches stay live with the editor
- Preview stage: Phone / Tablet / Desktop toggles reframe the sample site chrome without reload; Before / After cross-fades the framed preview; color-blindness mode changes ease the filter on rather than snapping
- Saved theme cards animate: a newly created card eases in, and a deleted card animates out rather than vanishing instantly
- Tutorial and theme-form modals enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way; command palette enters with a brief opacity/scale
- Action toasts (copy, save, snippet applied, export copied) slide in, remain readable, and auto-dismiss with a fade
- Harmonics application briefly highlights the secondary swatch; WCAG labels settle when contrast recomputes
- Light/Dark palette type toggle updates preview surfaces immediately
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow stays completable
</motion>

<responsiveness>
- At desktop widths of 1280 pixels and above, the Preview panel shows the device frame and the editor/tool stack side by side as in the reference layout
- Below roughly 1024 pixels the Preview panel stacks its regions vertically with every tool panel still reachable; no content clips and no horizontal viewport scrolling appears at 768 pixel width
- At 768 pixel width, the Export preview block with JSON/CSS tabs, Versions list, Tutorial modal, theme forms, and command palette remain fully visible and operable rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control — Preview/Components/Saved Themes/Export tabs, Phone/Tablet/Desktop toggles, Palette accordion rows, tool fields, editor actions (Copy, Undo, Redo, Save), Export Download/Copy/Import, command palette results, and saved-theme card Load/Delete — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Tutorial modal, theme create/rename forms, Export import overlay when present, and command palette each use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them
- Palette accordion rows expose their expanded/collapsed state to assistive technology and toggle with Enter or Space
- Validation and status messages (invalid name, duplicate name, invalid #RRGGBB field paths, fontSize/borderRadius bounds, Type↔palette.type cross-field errors, invalid options, save status, import field errors, WCAG Fail labels) are announced via an aria-live polite region as well as shown visually
- WCAG Pass AA / Pass AAA / Fail status is exposed as text (not color alone); Copy and Download confirmations are announced via aria-live
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (tab switches, palette edits, source edits, theme CRUD, font add/remove, export/import, command palette)
- Palette and typography edits repaint the preview and regenerate Export text without visible hangs, and the UI stays responsive under rapid repeated input
- Theme Export text regenerates without blocking the UI when palette colors change
</performance>

<writing>
- Headings, buttons, and tab labels (Preview, Components, Saved Themes, Export) use one consistent capitalization convention throughout the app
- Action labels use specific verbs such as New Theme, Save, Copy theme code, Download JSON, Download CSS, Import ThemeOptions, Save version, Restore, Undo, Redo, Load, and Delete rather than generic Submit/OK
- Theme-name validation messages name the name field and the fix; Export and import error copy names the offending field (e.g. name, primary.main, fontSize, palette.type, borderRadius) or the payload/cross-field problem
- Empty states explain what belongs in the region and how to add it; no placeholder or lorem-ipsum text appears anywhere in the shipped UI
- WCAG contrast readout labels use the exact tokens Pass AA, Pass AAA, or Fail; Harmonics chips use Analogous, Complementary, and Triadic
- ThemeOptions JSON preview and Import validation copy use the field names name, palette.type, primary.main (and other intent channels), typography.fontFamily, typography.fontSize, and shape.borderRadius rather than vague labels alone
</writing>

<innovation>
Optional enhancements the builder may add; none are required for a passing build:
- A guided coachmark tour that highlights Preview tools, Palette, Saved Themes, and Export on first open
- An extra interactive contrast graphic beyond the required Pass AA / Pass AAA / Fail readout
- Keyboard nudging of a focused hex value or paste-into-swatch for Palette color editing
- A coordinated preview flash when a Harmonics suggestion applies
</innovation>

<requirements>
Shared application state must use Redux Toolkit (the state library named in summary), in-memory only: the saved themes collection (including per-theme Versions snapshots), active theme/options, tab selection, device/template selection, edit history, editor UI flags, color-blindness mode, before/after compare flag, command palette query, and Export JSON/CSS text. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid saved theme increases the collection and shows it under Saved Themes
- Editing/renaming a saved theme updates that same record; saving options updates the active and saved payload
- Deleting a saved theme removes it from the list and from active selection if it was loaded
- Loading a saved theme writes its options into the shared editor/preview state
- Editing a palette/typography/shape control and editing the source pane stay bi-directionally synced through the same shared options; neither keeps a private disconnected copy
- Search/filter recomputes the visible cards from the shared collection; it does not create a second disconnected copy
- Export JSON and CSS artifacts, WCAG contrast labels, Harmonics derivations, Components demos, and Versions restore all derive from the same shared options; export text always reflects the latest mutations
- Importing a valid declared-theme JSON replaces the shared options so every surface updates together; malformed or schema-invalid import leaves shared options unchanged
- Versions store and restore options for a saved theme; Before/After compares against the last saved version without inventing a second disconnected theme
- Tab, Light/Dark type, color-blindness mode, and compare flag are shared client state; toggling them does not reload the document
- Undo and redo operate on the same shared options the visible controls mutate
Stack: React + Redux Toolkit + Tailwind CSS 4.3.2 (pinned; Vite or equivalent SPA); frontend-only. Tailwind owns layout, spacing, and custom surfaces with design tokens in the theme layer.
MUI is the component library for the studio shell — tabs, accordions, dialogs, selects, buttons, and toasts/snackbars — and keeps its component styles; no other component library.
Motion for React and CSS transitions allowed for animation; no other animation libraries.
Material Symbols icons only, installed via the npm package; no raw pasted SVG icon sets.
All forms — theme create/rename, font add, typography settings, version name, and Import — validate through a schema using React Hook Form with Zod: the schema defines the rules and the form surfaces inline per-field errors before submit. Schemas are API-shaped: they mirror the ThemeOptions field contract above (required trimmed unique name at most 64 characters, palette.type exactly light or dark, intent colors with #RRGGBB main/light/dark/contrastText channels, typography.fontSize from 8 to 24 inclusive, shape.borderRadius from 0 to 24 inclusive, and the Type ↔ palette.type cross-field rule), the record a form creates is the would-be request body, and Export/Import compile and validate against those same schemas. Field contracts are enforceable in the UI (named field errors), not only declared in schema code.
Monaco Editor is required for the theme source pane.
Roboto is bundled locally (Fontsource package or vendored woff2). All libraries, fonts, and icons are installed via npm and bundled locally; no CDN imports.
- Seed at least 3 saved themes so Saved Themes is non-empty on first load; every seeded theme conforms to the ThemeOptions field contract
- Empty, duplicate, or over-length required name on create must not increase the saved themes count; show visible validation feedback naming the name field
- Zero navigational outbound links after settle; same-document hashes for component jumps allowed
- Document title Material UI Theme Creator; product header shows Material-UI Theme Creator
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
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
