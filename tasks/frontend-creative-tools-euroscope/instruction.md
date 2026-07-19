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
- Patch-recipe request-body field contract (Copy recipe / Download patch-recipe.json / Import recipe share this schema — the generated recipe IS the would-be request body describing the patch): required schemaVersion (number exactly 1), required baseTheme (exactly one of EuroScope, Grey, Primer, Ayu, Solarised), required swatches (object with exactly the six keys Backdrop darkest, Backdrop darker, Backdrop main, Backdrop lighter, Backdrop lightest, Foreground secondary, each a #RRGGBB hex string), required iconSet (exactly None or Vector), required replacedBitmapCount (integer 0 when iconSet is None, else equal to the seeded bitmap count ≥ 10), required generatedAt (ISO-8601 datetime ending in Z). Cross-field: every swatch value must match ^#[0-9A-Fa-f]{6}$; invalid hex keeps Continue/Generate from applying that colour and shows a named swatch error. Download patch-recipe.json and Copy recipe emit JSON matching the session's current theme, swatches, and icon set; Download theme.css emits CSS custom properties for those six swatches. An export that omits a session swatch or icon-set mutation is invalid. Import recipe accepts a conforming recipe and restores baseTheme, swatches, and iconSet so step four regenerates to match; malformed payloads show a visible error and change nothing.

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
- Recipe export flow: edit at least one swatch and set iconSet to Vector, advance to step four, confirm Download patch-recipe.json / Copy recipe include those six hex values and replacedBitmapCount ≥ 10, and confirm Download theme.css lists the same hex values
- Recipe import round-trip: export a recipe after edits, change a swatch so the preview diverges, Import the recipe JSON, and confirm swatches and a fresh recipe export reconstruct to match
</user_flows>

<edge_cases>
- Continuing from step one without picking a file advances to step two using the seeded EuroScope.exe sample; no error appears
- Moving backward and forward through the wizard repeatedly shows each step exactly once and each step retains its own choices; no step is duplicated and no selection is lost
- Submitting or advancing while a swatch hex field holds an invalid value does not apply the invalid colour; the inline message naming the swatch remains until the value is corrected
- Double-activating the Generate control produces exactly one patched result: one confirmation block and one summary appear, not two
- With the icon set on None, the step four summary reports zero replaced bitmaps while the colour set summary still reflects the chosen theme
</edge_cases>

<visual_design>
- A single centered column, roughly 600 pixels wide on desktop, holding a compact header (a squared EuroScope badge, the title Custom EuroScope, and a theme and icon patcher caption), the progress bar, and the active step body stacked with consistent spacing
- A step-based patching wizard is the primary visual focus: numbered progress circles with the active stage labelled, colour swatch rows, a live colour preview, and a bitmap icon preview grid. This is not a set of generic equal-weight dashboard cards; the patcher colour and icon patching dominates and any secondary metadata (hex values, bitmap dimensions, helper text) stays visually subordinate
- Light neutral surfaces with a single blue accent for the active progress step and primary buttons, plus a soft radial accent wash behind the content. Bordered white boxes group each control cluster with hairline borders and subtle shadow on hover
- The colour Preview renders two side-by-side panels (Primary and Secondary) tinted live from the working swatches. The bitmap preview renders a grid of tiles that fill with the chosen theme colours when the Vector icon set is active and show muted grey placeholders when None is active
- Information, Caution, and Warning alert blocks are colour-coded (blue, amber, red) with a leading icon and a bold heading, used for the patcher's guidance copy
- Icons come from one consistent set used throughout the chrome: the same stroke weight and style on the header badge, alert icons, check marks, and control icons
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
- With prefers-reduced-motion set, transitions are removed and state changes apply instantly
</motion>

<responsiveness>
- On a narrow viewport (around 375 pixels) the controls needed to choose a colour set and generate the patched result stay reachable without horizontal scrolling, the layout reflows to a single stacked column, and the progress bar keeps its numbered steps visible while the active label truncates rather than overflowing
- No content clips or overflows the viewport at 375 pixel width; the two Preview panels and the bitmap grid reflow to fit the column
</responsiveness>

<accessibility>
- Every interactive control — the base theme control, icon set control, swatch pickers and hex fields, Back, Continue, Generate, and Download — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Base theme and Base icon set controls are operable with arrow keys and Enter or Space, and expose their selected option to assistive technology
- Each swatch colour picker and hex field is labelled with its swatch role name (for example, Backdrop darkest) so the label is programmatically associated with the control
- Inline validation messages and the replaced-count status line are announced via an aria-live polite region as well as shown visually
- The progress bar conveys the current step to assistive technology, not only by colour
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the wizard, including generating and downloading the patched result
- Rapidly editing swatches or toggling the icon set keeps the Preview and tile grid responsive with no hangs or dropped updates
</performance>

<writing>
- Headings, stage names, and button labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs matching the wizard vocabulary (Continue, Back, Generate, Download) rather than generic labels
- The Information, Caution, and Warning alert copy names the situation and what the user should do; no placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
- Use SolidJS, Solid stores, and Tailwind CSS 4.3.2 (pinned).
- Kobalte components for the base theme and icon set select controls, the progress indicator, alerts, and any dialogs or tooltips; no other external component libraries.
- Motion (the vanilla motion.dev library) allowed for animation; no other animation libraries.
- Tabler icons only, via the @tabler/icons-solidjs package.
- All forms validate through a schema: the swatch hex fields, the file input, and Import recipe are driven by a form library (Felte) paired with a Zod schema that mirrors the API-shaped patch-recipe request-body field contract above (colour-value rules, closed baseTheme/iconSet enums, replacedBitmapCount cross-field); inline per-field errors naming the field appear before submit; a generated recipe IS the would-be request body; Download/Copy/Import validate through the same schema. End-state contract: Download EuroScope.exe, Download patch-recipe.json, Download theme.css, and Copy recipe MUST reflect the session's actual replacements — an export that omits session work is invalid; Import MUST restore the same visible wizard choices (round-trip).
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Shared application state (the current wizard step, the loaded file name, the selected base colour set, the six working swatch colours, the selected icon set, per-bitmap overrides, and whether the patched result has been generated) must live in a Solid store as the single reactive source of truth; every view derives from that one store and WebMCP tool handlers invoke the same store commands as the visible controls.
- Persist relevant state in localStorage (or equivalent client storage) so a full reload restores the exact wizard step and all chosen replacements. This persistence is required for this task.
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
