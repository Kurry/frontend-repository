<summary>
Build a frontend-only ATC-client theme and icon patcher using SolidJS, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
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

Feature: Patching wizard shell —
- The app opens directly into a four-step patching wizard for a EuroScope air-traffic-control client, recognisable as a colour and icon patcher and not a generic dashboard or starter page. A progress bar shows the four ordered stages by name: Upload EuroScope executable, Update theme colours, Update embedded bitmaps, Download new executable. The current stage is highlighted with its full text label, completed stages show a check mark, and upcoming stages show a muted number
- The wizard supports moving forward and backward between adjacent steps. Every step past the first shows a Back control that returns to the previous step; every step before the last shows a Continue or Generate control that advances

Feature: Upload step —
- A sample scope is seeded so the workflow is non-empty on first load. Step one (Upload EuroScope executable) shows the loaded sample by name (EuroScope.exe), an optional file input that accepts .exe, and a Continue button. Continue always advances to step two without requiring the user to pick a file

Feature: Theme colours step —
- Step two (Update theme colours) lets the user choose a replacement colour set from a Base theme control listing exactly five named sets in order: EuroScope, Grey, Primer, Ayu, Solarised. Selecting a base set replaces all six working colours with that set's palette and updates a live Preview immediately
- Six named swatch rows (Backdrop darkest, Backdrop darker, Backdrop main, Backdrop lighter, Backdrop lightest, Foreground secondary) each expose a colour picker and a hex text field showing the current value; editing one swatch updates the Preview live and leaves the other five swatches unchanged
- Typing an invalid value into a swatch's hex field (for example, not-a-colour) shows an inline validation message naming that swatch before any submit or step change, and the Preview keeps its last valid colour; correcting the value clears the message and applies the colour

Feature: Embedded bitmaps step —
- Step three (Update embedded bitmaps) lets the user choose a replacement icon set from a Base icon set control with two options: None (keep as-is) and Vector. A preview grid of at least ten seeded bitmap tiles recolours to the chosen theme when Vector is selected and shows muted originals when None is selected. Changing the icon set updates every tile immediately and does not reset the colour choice made in step two. A status line reports how many bitmaps are set to Vector (for example, 10 of 10)

Feature: Download step —
- Choosing a replacement colour set and then advancing through the steps to the final stage generates the patched result: step four (Download new executable) shows a Patched result generated confirmation plus a summary of the chosen replacements (the selected colour set name, a swatch strip, a live preview, and the selected icon set with its replaced count). The current wizard step and the chosen visual replacements together make completion apparent
- A Download control writes an EuroScope.exe file and its label reflects that the download occurred
Feature: Export center (patch-recipe API payload) —
- Step four hosts an Export center with three tabs — Patch recipe JSON, Theme CSS, and Summary — whose active preview text is compiled live from the session: after a swatch edit or icon-set change the visible preview updates without a reload to reflect the session's actual replacements
- Copy export puts the visible preview text on the clipboard and shows a confirmation that reverts after a moment; Download recipe downloads a .json file whose contents match the Patch recipe JSON preview
- The Patch recipe JSON IS the would-be request body describing the patch. It is a single object with no undeclared top-level keys. All keys below are REQUIRED. Example values are illustrative only. Valid exports and imports MUST conform exactly:
  - schemaVersion: required string, exactly euroscope-patch-v1
  - target: required object with product exactly EuroScope and executableName a string ending in .exe
  - baseTheme: required; exactly one of EuroScope, Grey, Primer, Ayu, Solarised
  - colours: required object keyed exactly backdropDarkest, backdropDarker, backdropMain, backdropLighter, backdropLightest, foregroundSecondary — each a #RRGGBB hex string matching ^#[0-9A-Fa-f]{6}$
  - iconSet: required; exactly none or vector
  - bitmaps: required; one entry for every seeded bitmap id, each carrying a boolean keepOriginal
- Cross-field rules: baseTheme and iconSet must agree with the visible Base theme and Base icon set controls; every colours value must equal the matching working swatch; the bitmaps keepOriginal map must reflect the current per-tile overrides. An export that omits a session swatch, icon-set, or keep-original mutation is invalid
- The Theme CSS tab previews a :root block whose custom-property names are exactly --es-backdrop-darkest, --es-backdrop-darker, --es-backdrop-main, --es-backdrop-lighter, --es-backdrop-lightest, and --es-foreground-secondary, each assigned the matching working swatch's current #RRGGBB value
- Import recipe accepts a conforming Patch recipe JSON and restores baseTheme, all six colours, iconSet, and the keep-original map so the Preview, tile grid, and step four previews regenerate to match; importing parseable JSON that fails the field contract (missing schemaVersion or target, an undeclared top-level key, baseTheme or iconSet outside their closed enums, a colours key missing, extra, or not #RRGGBB, a bitmaps entry missing a seeded id or boolean keepOriginal, or a cross-field mismatch) changes nothing and shows validation naming the offending field

Feature: Undo and redo —
- Undo and Redo controls sit in the wizard chrome; both are visibly disabled while their stacks are empty, and activating a disabled one changes nothing and produces no console errors
- Undo reverses the most recent mutation (base-theme select, swatch edit, icon-set change, snapshot restore, keep-original toggle, or batch keep-original action) and restores every dependent surface together — swatches, Preview, contrast matrix, tile grid, replaced count, and export previews; Redo reapplies it; a new mutation after Undo clears and disables Redo; Ctrl+Z (or Cmd+Z) also triggers Undo

Feature: ATC contrast matrix —
- The Update theme colours step shows a live ATC contrast matrix listing at least three pairings — Backdrop darkest on Foreground secondary, Backdrop main on Foreground secondary, and Backdrop lightest on Backdrop darkest — each with its contrast ratio and a Pass or Fail mark against WCAG AA 4.5:1; editing a swatch recomputes the ratios and marks immediately

Feature: Colour-blindness simulation —
- A colour-blindness control offers None, Protanopia, and Deuteranopia; choosing Protanopia or Deuteranopia visibly shifts the rendered colours of both Preview panels while all six swatch hex field values stay unchanged; choosing None removes the filter

Feature: Palette snapshots with before/after compare —
- Save snapshot stores the current six working colours under a required non-empty name; a valid save adds exactly one snapshot row whose payload matches the Palette snapshot field contract: name (required non-empty string) plus a colours object with the same six camelCase keys as the recipe, each #RRGGBB; saving with an empty or whitespace-only name adds no row and shows validation naming the snapshot name field
- Selecting a saved snapshot restores its six colours into the working swatches and retints the Preview and contrast matrix
- A Before / After toggle compares a saved snapshot against the current edit: Before shows the snapshot colours in the Preview and After shows the current edited colours, without mutating the working swatches or the undo stack

Feature: Per-bitmap keep-original overrides and batch actions —
- An advanced per-bitmap list expands from the Update embedded bitmaps step and shows one row per seeded bitmap with a Keep original toggle; with Vector selected, turning Keep original on a tile mutes that tile and decrements the replaced-count status line by exactly one
- Bitmap tiles support multi-select; with tiles selected, Keep original selected mutes every selected tile at once, decrements the replaced count by the selection size, and clears the selection; Use Vector selected reverses the override on the selected tiles and restores their share of the replaced count

Feature: Command palette —
- Pressing Ctrl+K (or Cmd+K) opens a centered command palette overlay with a search field and result rows labelled by kind (Stage or Theme); typed queries filter the results, arrow keys move a highlighted selection, and Enter activates it
- Activating a Stage result jumps the wizard to that step; activating a Theme result applies that base theme's palette to the working swatches; when no stage or theme matches the query, an empty state explains that nothing matched

Feature: Reset to base —
- After editing swatches away from the selected base theme, Reset to base restores all six working swatches to that base theme's palette and retints the Preview

Feature: Frontend-only operation —
- The whole flow is frontend-only: no backend, no authentication wall, and no outbound navigation. Every control drives shared client state in place
</core_features>

<user_flows>
- Selecting the Ayu base theme in step two replaces all six swatch values at once, retints both live Preview panels immediately, and after advancing to step three with Vector selected the bitmap tiles render in the Ayu colours; the step four summary names Ayu as the selected colour set — all without a reload
- Editing a single swatch in step two changes that swatch row, retints the live Preview, leaves the other five swatch rows unchanged, and the edited colour appears in the step four swatch strip after advancing to the final stage
- Switching the icon set in step three between None and Vector updates every preview tile and the replaced-count status line immediately, leaves the step two colour choice intact when returning via Back, and the step four summary reports the currently selected icon set with its replaced count
- Moving backward one step shows the earlier replacement choice still selected exactly as it was left; moving backward and forward through the wizard repeatedly shows each step exactly once with its own choices retained
- Revising an earlier choice is supported: after generating the patched result the user can return to an earlier step, pick a different colour set or icon set, and the revised choice replaces the earlier preview at that step and in the final summary
- Reloading the page restores the exact wizard step and all chosen replacements: the progress bar highlights the same stage, the base theme control shows the same selection, all six swatches hold their edited values, and the icon set choice and replaced count match their pre-reload state
- Recipe export flow: edit at least one swatch, set the Vector icon set, and toggle Keep original on one tile; open the Export center and confirm the Patch recipe JSON preview shows schemaVersion euroscope-patch-v1, baseTheme and iconSet matching the controls, all six colours values including the edit, and that bitmap's keepOriginal true, and the Theme CSS tab shows all six --es-* tokens equal to the same values
- Recipe import round-trip: after configuring theme, icon set, and a keep-original override, Download recipe, Reset to base, then Import recipe — the six swatches, icon set, keep-original map, Preview colours, and both export previews reconstruct to match the pre-reset configuration without a reload
- Batch override then undo: with Vector active and zero overrides, select three tiles and choose Keep original selected — the three tiles mute and the replaced count drops by exactly three; pressing Ctrl+Z restores the prior keep-original map, tile appearance, and replaced count
- Snapshot before/after: save a snapshot named Night ops, edit two swatches, toggle Before to see the Night ops colours in the Preview and After to see the edited colours; restoring Night ops returns all six swatches to the saved values
- Command palette flow: press Ctrl+K, type part of Update embedded bitmaps, press Enter, and land on step three; reopen the palette and activate the Ayu theme result — the working swatches and Preview change to the Ayu palette
- Reloading the page restores the saved snapshots list and the per-tile keep-original overrides with the matching replaced count, alongside the wizard step and chosen replacements
</user_flows>

<edge_cases>
- Continuing from step one without picking a file advances to step two using the seeded EuroScope.exe sample; no error appears
- Moving backward and forward through the wizard repeatedly shows each step exactly once and each step retains its own choices; no step is duplicated and no selection is lost
- Submitting or advancing while a swatch hex field holds an invalid value does not apply the invalid colour; the inline message naming the swatch remains until the value is corrected
- Double-activating the Generate control produces exactly one patched result: one confirmation block and one summary appear, not two
- With the icon set on None, the step four summary reports zero replaced bitmaps while the colour set summary still reflects the chosen theme
- Undo with an empty history and Redo with an empty redo stack are disabled controls; activating them does nothing and produces no console errors
- Saving a snapshot with an empty or whitespace-only name adds no row and shows validation naming the snapshot name field
- Selecting every bitmap and choosing Keep original selected while Vector is active drops the replaced count to zero; Use Vector selected on the same tiles restores the full replaced count
- With Protanopia selected, the six swatch hex field values stay identical to their unfiltered values while only the Preview panels' rendered colours shift
- Importing parseable JSON that fails the Patch recipe field contract leaves swatches, icon set, and keep-original overrides unchanged and shows validation naming the offending field
</edge_cases>

<visual_design>
- A single centered column, roughly 600 pixels wide on desktop, holding a compact header (a squared EuroScope badge, the title Custom EuroScope, and a theme and icon patcher caption), the progress bar, and the active step body stacked with consistent spacing
- A step-based patching wizard is the primary visual focus: numbered progress circles with the active stage labelled, colour swatch rows, a live colour preview, and a bitmap icon preview grid. This is not a set of generic equal-weight dashboard cards; the patcher colour and icon patching dominates and any secondary metadata (hex values, bitmap dimensions, helper text) stays visually subordinate
- Light neutral surfaces with a single blue accent for the active progress step and primary buttons, plus a soft radial accent wash behind the content. Bordered white boxes group each control cluster with hairline borders and subtle shadow on hover
- The colour Preview renders two side-by-side panels (Primary and Secondary) tinted live from the working swatches. The bitmap preview renders a grid of tiles that fill with the chosen theme colours when the Vector icon set is active and show muted grey placeholders when None is active
- Information, Caution, and Warning alert blocks are colour-coded (blue, amber, red) with a leading icon and a bold heading, used for the patcher's guidance copy
- Icons come from one consistent set used throughout the chrome: the same stroke weight and style on the header badge, alert icons, check marks, and control icons
- The contrast matrix uses compact ratio readouts with clear pass (green-tinted) and fail (amber or red-tinted) marks; the colour-blindness control is a segmented choice with a visible active selection; both sit with the swatch and Preview cluster on the theme-colours step rather than as disconnected panels
- The command palette is a centered overlay with a search field, kind labels (Stage or Theme) on result rows, and a highlighted keyboard selection
- The Export center tabs render their Patch recipe JSON and Theme CSS previews as monospaced text; empty Undo/Redo and disabled export actions read as non-interactive while their labels stay legible
- Component states: buttons and form controls show distinct default, hover, focus (visible ring), and disabled treatments
</visual_design>

<motion>
- Progress circles transition their fill colour when a step becomes active or complete
- Buttons ease their border, shadow, and scale on hover, focus, and press: hovering a button shifts its border and adds a slight shadow, and pressing it nudges it down slightly. Every interactive control shows a visible focus ring when focused by keyboard
- Swatch rows and per-bitmap rows take a hover wash across their full width
- Advancing or returning between steps swaps the active step body in place with a brief eased transition of roughly 200 to 300 milliseconds, without a full page reload; the progress bar updates to match the current step
- The live colour Preview and the bitmap tiles recolour immediately as swatches or the icon set change, with no reload
- Revealing the advanced per-bitmap options expands the list in place with an animated height change rather than an instant jump
- The Patched result generated confirmation on step four enters with a short fade-and-rise transition when the result is generated
- The command palette overlay enters with a brief opacity and scale transition when opened via the keyboard shortcut rather than an instant hard cut, and exits smoothly on close
- With prefers-reduced-motion set, transitions are removed and state changes apply instantly
</motion>

<responsiveness>
- On a narrow viewport (around 375 pixels) the controls needed to choose a colour set and generate the patched result stay reachable without horizontal scrolling, the layout reflows to a single stacked column, and the progress bar keeps its numbered steps visible while the active label truncates rather than overflowing
- No content clips or overflows the viewport at 375 pixel width; the two Preview panels and the bitmap grid reflow to fit the column
- At 375 pixel width the contrast matrix and the Export center previews reflow to fit the column without clipping or forcing page-level horizontal scrolling, and the command palette overlay stays fully visible and operable
</responsiveness>

<accessibility>
- Every interactive control — the base theme control, icon set control, swatch pickers and hex fields, Back, Continue, Generate, and Download — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Base theme and Base icon set controls are operable with arrow keys and Enter or Space, and expose their selected option to assistive technology
- Each swatch colour picker and hex field is labelled with its swatch role name (for example, Backdrop darkest) so the label is programmatically associated with the control
- Inline validation messages and the replaced-count status line are announced via an aria-live polite region as well as shown visually
- The progress bar conveys the current step to assistive technology, not only by colour
- Undo, Redo, snapshot controls, colour-blindness options, bitmap checkboxes and batch actions, export tabs, Copy export, and Import recipe are reachable and operable with the keyboard alone, each with a visible focus indicator
- The command palette behaves as a modal dialog: it exposes dialog semantics with aria-modal, traps focus while open, closes on Escape, and returns focus to the control or shortcut context that opened it
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the wizard, including generating and downloading the patched result
- Rapidly editing swatches or toggling the icon set keeps the Preview and tile grid responsive with no hangs or dropped updates
- Rapidly toggling keep-original flags or switching colour-blindness modes keeps the Preview, tile grid, contrast matrix, and export previews responsive with no hangs or dropped updates
- No console errors or warnings appear while copying exports, importing a recipe, undoing, or opening the command palette; none of those actions hangs the UI for multiple seconds
</performance>

<writing>
- Headings, stage names, and button labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs matching the wizard vocabulary (Continue, Back, Generate, Download) rather than generic labels
- The Information, Caution, and Warning alert copy names the situation and what the user should do; no placeholder text appears anywhere in the shipped UI
- Undo, snapshot, and export actions use specific verbs (Undo, Redo, Save snapshot, Copy export, Import recipe) rather than generic Submit or OK; the command palette empty state explains that no stage or theme matched the query
- Import and snapshot validation errors name the field or problem rather than a bare Invalid rejection; each concept keeps one name across surfaces (the Base theme control is never also called Palette)
</writing>

<requirements>
- Use SolidJS, Solid stores, and Tailwind CSS 4.3.2 (pinned).
- Kobalte components for the base theme and icon set select controls, the progress indicator, alerts, and any dialogs or tooltips; no other external component libraries.
- Motion (the vanilla motion.dev library) allowed for animation; no other animation libraries.
- Tabler icons only, via the @tabler/icons-solidjs package.
- All forms validate through a schema: the swatch hex fields, the file input, the snapshot name field, and Import recipe are driven by a form library (Felte) paired with a Zod schema that mirrors the API-shaped Patch recipe and Palette snapshot field contracts above (#RRGGBB colour rules, closed baseTheme/iconSet enums, target and bitmaps keepOriginal completeness, no undeclared top-level keys); inline per-field errors naming the field appear before submit; a generated recipe IS the would-be request body; Download/Copy/Import validate through the same schema. End-state contract: Download EuroScope.exe, Download recipe, the Theme CSS preview, and Copy export MUST reflect the session's actual replacements including keep-original overrides — an export that omits session work is invalid; Import MUST restore the same visible wizard choices (round-trip).
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Shared application state (the current wizard step, the loaded file name, the selected base colour set, the six working swatch colours, the selected icon set, per-bitmap keep-original overrides and tile selection, the saved palette snapshots, the before/after compare state, the colour-blindness mode, the undo/redo stacks, the command-palette open state, and whether the patched result has been generated) must live in a Solid store as the single reactive source of truth; every view — including the contrast matrix and the Export center previews — derives from that one store and WebMCP tool handlers invoke the same store commands as the visible controls.
- Persist relevant state in localStorage (or equivalent client storage) so a full reload restores the exact wizard step, all chosen replacements, the saved palette snapshots, and the per-tile keep-original overrides with their replaced count. This persistence is required for this task.
- No authentication wall — open directly into the primary patching workspace.
- Seed enough local sample data for the primary workflow to be non-empty on first load: a sample scope is loaded so step one can advance without a user-supplied file, and at least ten sample bitmaps back the icon preview.
- Keep the implementation frontend-only and self-contained; do not depend on a live backend and do not fetch the product from another origin.
- State contracts (behavioral, not storage keys):
  - Selecting a base colour set replaces all six working swatches with that set's palette and updates the live preview
  - Editing one swatch updates the preview and leaves the other swatches unchanged
  - Selecting an icon set recolours the bitmap previews and does not reset the colour choice
  - Advancing to the final step generates the patched result and marks completion in the current step and the chosen-replacements summary
  - Moving backward one step retains the earlier replacement choice exactly as selected
  - Moving backward and forward repeatedly never duplicates a step and never loses a selection
  - Reloading the document restores the current step and every chosen replacement
- Base theme control must list exactly EuroScope, Grey, Primer, Ayu, Solarised; the six swatch roles must be Backdrop darkest, Backdrop darker, Backdrop main, Backdrop lighter, Backdrop lightest, Foreground secondary; the icon set control must offer None (keep as-is) and Vector.
- Zero navigational outbound links for app chrome — in-app controls only; step changes via shared client state.
- Provide required hover and focus feedback on buttons, swatch rows, and bitmap rows.
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
- form-workflow-v1
- structured-editor-v1
- artifact-transfer-v1

Module specs:
<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
}
</module_spec>

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
- Workflow steps: upload-euroscope-executable; update-theme-colours; update-embedded-bitmaps; download-new-executable
- Form operations: advance; return; reset
- Editor object types: base-theme; base-icon-set; palette-snapshot; bitmap-tile
- Editor operations: select; update_property; switch_mode; preview; add; delete
- Editor properties: backdrop-darkest; backdrop-darker; backdrop-main; backdrop-lighter; backdrop-lightest; foreground-secondary; keep-original; colour-blindness; compare-mode
- Editor modes: theme-colours; embedded-bitmaps; export-center
- Artifact operations: export; import; copy
- Export formats: patched-executable; patch-recipe-json; theme-css
- Import modes: patch-recipe

Mechanics exclusions:
- Native file-picker / download interaction stays Playwright-driven
- Command-palette open gesture and keyboard navigation stay Playwright-observed when mechanism matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
