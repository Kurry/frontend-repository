<summary>
Build a PDF form builder and document signing workspace using Vue 3 Composition API, Pinia, Tailwind CSS 4.3.2, and Reka UI.
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
Feature: Document workspace —
- The app opens directly into a document template editor with no authentication wall: a top bar (Docuseal wordmark, an editable template-name field, a Build/Preview mode switch, a signing-status pill, Undo and Redo controls, Export and Import actions, and a Send for signing action), a left rail (templates list, submitters list, and a field-type palette), a center document canvas showing the open template as one or more page sheets, and a right properties panel. The initial surface is recognisably PDF form building, submitter assignment and document signing, not a generic dashboard or starter page
- The left rail lists at least 3 seeded templates, each showing its field count; clicking a template opens it into the canvas, swapping the template name, the document sheets, and the placed fields without a full page reload. One template is open on first load with seeded fields so the workspace is non-empty
- Undo and Redo sit in the top bar (also driven by Ctrl+Z and Ctrl+Shift+Z, or Cmd on macOS); both controls are visibly disabled when their stacks are empty. Placing a field, renaming it, toggling required, reassigning its submitter, deleting it, duplicating it, and batch-reassigning selected fields each push an undoable history entry that restores the prior canvas, counts, and selection when undone
Feature: Field palette and submitters —
- The field-type palette offers at least the following distinct field types: Text, Signature, Initials, Date, Number, Checkbox, Radio, Select, Image, File, Phone, Cells, Stamp. Clicking a palette type places one field of that type onto the open document, assigned to the currently active submitter
- Clicking a palette type makes a new field box appear on the document canvas in the active submitter's colour, that field becomes the selected field (the right properties panel switches to a field editor showing its type, name, assigned submitter and required toggle), and the submitter assignment is visible on both the field box and the panel
- The submitters list shows at least 2 seeded submitters (First Party, Second Party), each with a distinct colour swatch; an Add submitter control appends another party with its own colour; clicking a submitter row makes it active so subsequently placed fields adopt that submitter's colour
- Placing fields for two different submitters keeps each field in its own submitter's colour: a field assigned to First Party and a field assigned to Second Party render in visibly different colours and each retains its assignment
Feature: Field editor and canvas sync —
- Renaming the selected field in the properties panel updates the field's label on the canvas immediately, and the canvas and the property panel stay synchronized as properties change; toggling the required checkbox updates the field's required state in the same step
- The field editor in the properties panel validates inline against the Field record contract: clearing the name input to empty, whitespace-only, or longer than 80 characters shows a validation message that names the name field next to the control, before any submit-style action, and the message clears when a valid non-empty name is restored; the invalid value is not applied
- A Duplicate field control on the selected field adds exactly one new field of the same type, name suffix, required flag, and submitter colour offset slightly on the canvas, selects the duplicate, and leaves the source field intact
- Shift-clicking a second field (or an equivalent multi-select affordance) keeps both fields selected; a Batch reassign control then assigns every selected field to a chosen submitter in one step, recolours all selected boxes to that submitter's colour, and updates the per-submitter breakdown accordingly
- Removing the selected field via the panel's Delete field control (or the Delete key while it is selected) removes only that field from the document
- The properties panel, when no field is selected, summarises the open template (document title, field count, page count, signing status) and a per-submitter field-count breakdown that tracks the placed fields
Feature: Signing workflow —
- A Send for signing action validates the open template (at least one field, every field assigned to a submitter, every field name valid under the Field record contract) and, on success, moves the status pill to an awaiting-first-submitter state and reveals an Advance control that steps the signing status through each submitter to Completed. A Build/Preview mode switch flips the canvas into a signing preview that shows the placed fields as fillable
Feature: Template package artifacts (the app produces the user's template package) —
- Export opens a centered artifact drawer or dialog with two format tabs — Template JSON and Signing summary — each regenerated live from the open template's current name, submitters, placed fields, and signing status whenever those values change
- Template JSON is API-shaped like a real document-signing / DocuSeal-style template payload — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required name: trimmed non-empty string, at most 120 characters (empty, whitespace-only, or over-length fails validation naming the name field)
  - Required status: exactly one of the closed enum draft, pending, completed (maps from the signing-status pill: draft before Send for signing, pending while awaiting any submitter, completed when the pill shows Completed)
  - Required submitters: a non-empty array of objects, each with required name (trimmed non-empty, at most 64 characters) and required color (a CSS hex color string matching #RRGGBB)
  - Required fields: an array of Field records; each Field record requires name (trimmed non-empty, at most 80 characters), type (exactly one of the closed enum text, signature, initials, date, number, checkbox, radio, select, image, file, phone, cells, stamp), required (boolean), submitter (trimmed non-empty string that must equal one of the submitters[].name values — a cross-field rule), page (integer greater than or equal to 0), and x, y, w, h (each a finite number with w and h greater than 0)
- The record a field-properties form, template-name edit, or add-submitter form produces IS that Template JSON / Field / submitter payload for the open template — same field names, bounds, enums, and cross-field rules — and form validation enforces the same contracts the export shape declares, always naming the offending field inline
- Signing summary is a plain-text or markdown report listing the template name, status, each submitter with its field count, and every placed field as type, name, required flag, and submitter — reflecting the session's actual fields, not a static sample
- Each format tab offers Copy (writes that format's text to the clipboard with a brief copied confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
- Export content that omits the session's actual work is invalid: after placing a field, renaming it, and reassigning its submitter, both open export formats must contain that field's type, name, and submitter, and Template JSON must still show every required key from the field contract
- Import accepts a Template JSON document: a valid import replaces or merges into the open template so the canvas, submitters list, per-submitter counts, status pill, and both export previews show the imported name, submitters, and fields; malformed JSON or a document that fails the field contract (missing required keys, status outside draft|pending|completed, type outside the closed field-type enum, submitter name that matches no submitters[].name, empty or over-length names, non-positive w/h) shows visible validation feedback naming the offending field and changes nothing
- No outbound navigation exists for app chrome; every control acts on in-app client state
</core_features>
<user_flows>
- Place a field end to end: after clicking a palette type, a new field box appears on the canvas in the active submitter's colour, the open template's field count increases by exactly one in the left rail's template row and in the panel summary, the per-submitter field-count breakdown adds one to the active submitter, and after a full page reload the placed field is still on the canvas with the same type, name, and submitter assignment
- Reassign a field end to end: with a field selected, choosing a different submitter in the properties panel recolours the field box on the canvas to the new submitter's colour in the same step the panel control updates, moves one count between the two parties in the per-submitter breakdown, and after a full page reload the field still renders in the new submitter's colour
- Delete a field end to end: removing the selected field takes exactly one field box off the canvas, decreases the open template's field count by one in the rail row and the panel summary, updates the per-submitter breakdown, leaves every other placed field and both submitter definitions unchanged, and the removal survives a full page reload
- Duplicate then undo: with a field selected, Duplicate field increases the open template's field count by exactly one with a matching type and submitter; Undo removes that duplicate and restores the prior selection and counts; Redo restores the duplicate again
- Batch reassign end to end: with two fields selected, Batch reassign to Second Party recolours both boxes to Second Party's colour in the same step, moves both counts into Second Party in the per-submitter breakdown, and Undo restores the prior assignments
- Send for signing end to end: on a template that passes validation, activating Send for signing moves the status pill to awaiting the first submitter and reveals an Advance control; stepping Advance once per submitter walks the status through each party and ends at Completed with the pill in its completed treatment, and the current signing status is restored after a full page reload
- Artifact end state: place a field, rename it to a unique name, reassign it to Second Party, open Export, and confirm Template JSON and Signing summary each contain that field's type, name, and Second Party assignment and that Template JSON still shows the required name, status, submitters, and fields keys from the field contract; Copy confirms on the active tab; Download of Template JSON then Import of that same document reconstructs the same visible fields, submitters, and status on the canvas and in Export
- Switch templates end to end: clicking another template in the rail swaps the template name, the document sheets, and the placed fields without a full page reload; returning to the first template shows its fields exactly as they were left
- After a full page reload the workspace restores the open template, its placed fields and their submitter assignments, the submitters, the signing status, and the undo/redo stacks reset to empty while the persisted document state remains
</user_flows>

<edge_cases>
- Clearing a selected field's name to empty or whitespace-only shows a visible validation message at the field editor naming the name field and does not remove the field; the field keeps rendering on the canvas while the message is shown
- A field name longer than 80 characters, or a template name longer than 120 characters, is rejected with validation naming the name field and is not applied
- Activating Send for signing on a template with no placed fields, or with any field left unassigned to a submitter, surfaces visible feedback describing the problem and leaves the status pill unchanged
- Deleting the last remaining field leaves the document sheets rendered with the panel summary showing a field count of zero, and the palette still places new fields afterwards
- Adding three or more submitters keeps every party's colour swatch visibly distinct from the others already in the list
- Undo and Redo are disabled at empty-stack boundaries and never throw or corrupt fields when activated there
- Performing a new field edit after an Undo clears the redo stack and disables Redo
- Importing malformed Template JSON leaves the canvas, submitters, status, and Export unchanged and shows visible validation feedback
- Importing parseable JSON that fails the Template JSON field contract — missing required keys, status outside draft|pending|completed, a field type outside the closed enum, a submitter string that matches no submitters[].name, empty or over-length names, or non-positive w/h — leaves the workspace unchanged and shows validation naming the offending field
</edge_cases>
<visual_design>
- A three-pane document-editor composition at desktop width: a left tool rail, a center document canvas, and a right properties panel, under a full-width top bar. This is a document canvas with a field palette, submitter colours, property controls and a signing preview, not a grid of equal-weight dashboard cards
- The document canvas is the primary visual focus: page sheets render as white pages with a faint page label, a faux document body (title, subtitle, and grey text-line placeholders), and colour-tinted field boxes positioned on the page. Secondary metadata (template summary, counts) stays visually subordinate in the side panels
- Each submitter owns one colour; placed fields are tinted with their submitter's colour (fill, border and label), so a field's owner is readable at a glance. Submitter swatches in the rail use the same colours
- The selected field is visually distinguished from unselected fields through a stronger outline / selection ring and a resize handle; multi-selected fields share a selection treatment distinct from unselected boxes
- Field-type palette buttons pair a small type glyph with the type label, drawn from one consistent icon set used across the whole app; the properties panel uses labelled inputs, a type badge, a submitter select with a colour dot, a required checkbox, Duplicate field and destructive Delete field buttons, and Batch reassign when multiple fields are selected
- Export appears as a centered modal or drawer with format tabs (Template JSON / Signing summary), a scrollable preview block, and Copy and Download affordances
- Cards and panels use hairline borders and subtle shadows; the status pill changes colour by state (neutral draft, amber awaiting, green completed); Undo and Redo show a disabled treatment when their stacks are empty
</visual_design>

<motion>
- Buttons, template rows, submitter rows and palette buttons take a hover wash (background/border easing) and a slight press-down on click; interactive controls show a visible focus ring on keyboard focus that is distinct from hover
- Placing a field animates the new field box into place with a brief entrance (fade/scale) rather than popping in; deleting a field animates it out; the canvas updates in place without a full page reload
- Adding a submitter animates the new row into the submitters list rather than appearing instantly
- Selecting a field applies a selection ring and reveals its resize handle; hovering a field box shows a soft colour halo in the field's submitter colour
- Reassigning a selected field to another submitter recolours the field box on the canvas at the same moment the panel control updates
- Action feedback appears in a short-lived toast (added, assigned, deleted, duplicated, exported, imported) that fades in and out
- The mode switch and the status pill update in place; switching to Preview changes the field boxes to a dashed fillable affordance
- The Export modal enters and exits with a brief opacity/scale transition; Copy and Download show a short confirmation before resetting
- Hover feedback is required on all interactive chrome (top-bar buttons including Undo, Redo, Export and Import, template rows, submitter rows, palette buttons, field boxes, panel controls); omitting hover feedback is a defect
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes while every flow — place, delete, undo/redo, export, and import included — remains completable
</motion>

<responsiveness>
- At desktop widths the three panes sit side by side under the full-width top bar
- At narrow widths (around 375 pixels wide) the panes stack into a single scrollable column with the palette and the canvas reachable without horizontal scrolling, preserving the primary-before-secondary order
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width
- The Export modal (including format tabs, Copy, and Download), Undo/Redo, and Import stay fully visible and operable at small widths rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control (top-bar actions including Undo, Redo, Export and Import, template rows, submitter rows, palette buttons, panel inputs and buttons) is reachable and operable with the keyboard alone, with a visible focus indicator distinct from hover
- The Export modal uses a dialog role with aria-modal true, traps focus while open, closes on Escape, and returns focus to the control that opened it
- The action-feedback toast is an aria-live status region so placements, reassignments, deletions, duplicates, exports and imports are announced as well as shown
- Inline validation messages in the field editor, template-name field, add-submitter input, and Import are visible text associated with their input, not colour alone
- The selected field can be removed with the Delete key while it is selected; Undo and Redo expose their disabled state to assistive technology
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (placing, editing, reassigning, duplicating, batch-reassigning, deleting fields, undoing, switching templates, sending for signing, switching modes, exporting both formats, and importing Template JSON)
- Placing, selecting, reassigning and deleting fields update the canvas immediately, and the UI stays responsive under rapid repeated field placement with no hangs or dropped interactions
</performance>

<writing>
- Chrome labels, panel titles, and buttons use one consistent capitalization convention throughout
- Action labels are specific — Send for signing, Advance, Duplicate field, Batch reassign, Export, Import, Copy, Download, Delete field — rather than generic labels where a specific one is possible
- Empty document and validation copy name the field and the fix; Import failures name the offending field; no placeholder or lorem text appears anywhere in the shipped UI
</writing>
<requirements>
- Use Vue 3 Composition API, Pinia, Tailwind CSS 4.3.2 (pinned), and Reka UI.
- Reka UI provides the interactive component primitives — the submitter select, the required checkbox/toggle, the mode switch, the Export dialog, popovers or dialogs, and the toast surface; Tailwind CSS 4.3.2 owns layout, spacing, and all custom surfaces, with design tokens in the theme layer.
- Motion for Vue is allowed for animation (field entrance/exit, toast motion, panel transitions, export modal); no other animation libraries.
- Phosphor icons via the @phosphor-icons/vue package only — one icon set used consistently for the palette glyphs, panel controls, and chrome; no other icon sets, no raw copy-pasted SVGs.
- All forms validate through VeeValidate paired with a Zod schema — the field-properties editor, the editable template-name field, any add-submitter input, and Import. Schemas are API-shaped: they model the payload a real document-signing template API would accept (the Template JSON object with required name bounds, status enum draft|pending|completed, submitters array with name and #RRGGBB color, and Field records with name bounds, closed type enum, required boolean, submitter cross-field match, page >= 0, and positive w/h; the Field record a properties form edits IS that would-be request body), and Template JSON export/import compile and validate against that same schema. The form layer surfaces inline per-field errors, naming the field, before submit.
- Shared application state must live in a Pinia store: the templates and their placed fields, the submitters and the active submitter, the active template, the selected fields (including multi-select), the editor mode, the signing status, the undo and redo stacks, and the live export artifact texts. UI controls and any programmatic surface must mutate this one shared store, not disconnected local copies.
- No authentication wall — open directly into the primary workspace.
- Persist relevant state in localStorage (or equivalent client storage) so a reload restores it: the open template, the placed fields and their submitter assignments, the submitters, and the signing status must survive a full page reload. Undo and redo stacks reset on reload. This persistence is a required part of this task (it overrides the usual in-memory-only rule).
- Seed at least 3 templates with at least one template open and non-empty on first load, and at least 2 submitters with distinct colours, so the primary workflow is exercisable immediately.
- State contracts (behavioral, not storage keys):
  - Placing a field adds it to the open template's field set, assigns it to the active submitter, selects it, updates the per-submitter counts, and pushes an undoable history entry
  - Selecting a field opens its editor in the properties panel; the canvas and panel stay synchronized as properties change
  - Reassigning a field's submitter recolours the field on the canvas and updates the panel and the per-submitter counts in the same step
  - Duplicating a field adds exactly one matching field and selects it; batch reassign updates every selected field together
  - Deleting a field removes only that field; other fields and all submitter definitions remain
  - Editing a field name to empty, whitespace-only, or over 80 characters shows visible validation at the field and does not delete the field
  - Opening a template swaps the canvas to that template's document and fields without a reload
  - Undo restores the prior field/editor state and enables Redo; Redo reapplies it; a new edit after undo clears the redo stack
  - Export texts for Template JSON and Signing summary are derived live from the open template; Import of valid Template JSON mutates the same shared store the UI shows
- Keep the implementation frontend-only and self-contained; do not depend on a live backend or authentication service. Build tooling: Vite or an equivalent SPA setup. No backend routes.
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Zero navigational outbound links for app chrome — in-app controls only.
- The useful end state is the template package: Export must produce Template JSON and Signing summary texts that contain the session's actual field and submitter edits, with Copy and Download, and Template JSON must round-trip through Import while conforming to the declared field contract
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- form-workflow-v1
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
- Editor object types: text; signature; initials; date; number; checkbox; radio; select; image; file; phone; cells; stamp
- Editor properties: name; required; submitter
- Editor operations: add; select; delete; update_property; preview; switch_mode
- Editor modes: build; preview
- Entity: submitter
- Entity operations: create; select; update; delete
- Entity fields: name; color
- Form operations: validate; submit; advance
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: template-package

Mechanics exclusions:
- Field drag-to-reposition gesture on the canvas stays Playwright when mechanism matters
- Hover halo / press feedback and toast fade timing stay Playwright-observed
- Raw file paths, blobs, and base64 artifact bytes stay Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
