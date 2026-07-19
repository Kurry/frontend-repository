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
- The app opens directly into a document template editor with no authentication wall: a top bar (Docuseal wordmark, an editable template-name field, a Build/Preview mode switch, a signing-status pill, and a Send for signing action), a left rail (templates list, submitters list, and a field-type palette), a center document canvas showing the open template as one or more page sheets, and a right properties panel. The initial surface is recognisably PDF form building, submitter assignment and document signing, not a generic dashboard or starter page
- The left rail lists at least 3 seeded templates, each showing its field count; clicking a template opens it into the canvas, swapping the template name, the document sheets, and the placed fields without a full page reload. One template is open on first load with seeded fields so the workspace is non-empty
- The field-type palette offers at least the following distinct field types: Text, Signature, Initials, Date, Number, Checkbox, Radio, Select, Image, File, Phone, Cells, Stamp. Clicking a palette type places one field of that type onto the open document, assigned to the currently active submitter
- Clicking a palette type makes a new field box appear on the document canvas in the active submitter's colour, that field becomes the selected field (the right properties panel switches to a field editor showing its type, name, assigned submitter and required toggle), and the submitter assignment is visible on both the field box and the panel
- The submitters list shows at least 2 seeded submitters (First Party, Second Party), each with a distinct colour swatch; an Add submitter control appends another party with its own colour; clicking a submitter row makes it active so subsequently placed fields adopt that submitter's colour
- Placing fields for two different submitters keeps each field in its own submitter's colour: a field assigned to First Party and a field assigned to Second Party render in visibly different colours and each retains its assignment
- Renaming the selected field in the properties panel updates the field's label on the canvas immediately, and the canvas and the property panel stay synchronized as properties change; toggling the required checkbox updates the field's required state in the same step
- The field editor in the properties panel validates inline per field: clearing the name input to empty shows a validation message that names the name field next to the control, before any submit-style action, and the message clears when a non-empty name is restored
- Removing the selected field via the panel's Delete field control (or the Delete key while it is selected) removes only that field from the document
- The properties panel, when no field is selected, summarises the open template (document title, field count, page count, signing status) and a per-submitter field-count breakdown that tracks the placed fields
- A Send for signing action validates the open template (at least one field, every field assigned to a submitter) and, on success, moves the status pill to an awaiting-first-submitter state and reveals an Advance control that steps the signing status through each submitter to Completed. A Build/Preview mode switch flips the canvas into a signing preview that shows the placed fields as fillable
- No outbound navigation exists for app chrome; every control acts on in-app client state
</core_features>

<user_flows>
- Place a field end to end: after clicking a palette type, a new field box appears on the canvas in the active submitter's colour, the open template's field count increases by exactly one in the left rail's template row and in the panel summary, the per-submitter field-count breakdown adds one to the active submitter, and after a full page reload the placed field is still on the canvas with the same type, name, and submitter assignment
- Reassign a field end to end: with a field selected, choosing a different submitter in the properties panel recolours the field box on the canvas to the new submitter's colour in the same step the panel control updates, moves one count between the two parties in the per-submitter breakdown, and after a full page reload the field still renders in the new submitter's colour
- Delete a field end to end: removing the selected field takes exactly one field box off the canvas, decreases the open template's field count by one in the rail row and the panel summary, updates the per-submitter breakdown, leaves every other placed field and both submitter definitions unchanged, and the removal survives a full page reload
- Send for signing end to end: on a template that passes validation, activating Send for signing moves the status pill to awaiting the first submitter and reveals an Advance control; stepping Advance once per submitter walks the status through each party and ends at Completed with the pill in its completed treatment, and the current signing status is restored after a full page reload
- Switch templates end to end: clicking another template in the rail swaps the template name, the document sheets, and the placed fields without a full page reload; returning to the first template shows its fields exactly as they were left
- After a full page reload the workspace restores the open template, its placed fields and their submitter assignments, the submitters, and the signing status
</user_flows>

<edge_cases>
- Clearing a selected field's name to empty shows a visible validation message at the field editor naming the name field and does not remove the field; the field keeps rendering on the canvas while the message is shown
- Activating Send for signing on a template with no placed fields, or with any field left unassigned to a submitter, surfaces visible feedback describing the problem and leaves the status pill unchanged
- Deleting the last remaining field leaves the document sheets rendered with the panel summary showing a field count of zero, and the palette still places new fields afterwards
- Adding several submitters keeps every party's colour swatch visibly distinct from the others already in the list
</edge_cases>

<visual_design>
- A three-pane document-editor composition at desktop width: a left tool rail, a center document canvas, and a right properties panel, under a full-width top bar. This is a document canvas with a field palette, submitter colours, property controls and a signing preview, not a grid of equal-weight dashboard cards
- The document canvas is the primary visual focus: page sheets render as white pages with a faint page label, a faux document body (title, subtitle, and grey text-line placeholders), and colour-tinted field boxes positioned on the page. Secondary metadata (template summary, counts) stays visually subordinate in the side panels
- Each submitter owns one colour; placed fields are tinted with their submitter's colour (fill, border and label), so a field's owner is readable at a glance. Submitter swatches in the rail use the same colours
- The selected field is visually distinguished from unselected fields through a stronger outline / selection ring and a resize handle
- Field-type palette buttons pair a small type glyph with the type label, drawn from one consistent icon set used across the whole app; the properties panel uses labelled inputs, a type badge, a submitter select with a colour dot, a required checkbox, and a destructive Delete field button
- Cards and panels use hairline borders and subtle shadows; the status pill changes colour by state (neutral draft, amber awaiting, green completed)
</visual_design>

<motion>
- Buttons, template rows, submitter rows and palette buttons take a hover wash (background/border easing) and a slight press-down on click; interactive controls show a visible focus ring on keyboard focus that is distinct from hover
- Placing a field animates the new field box into place with a brief entrance (fade/scale) rather than popping in; deleting a field animates it out; the canvas updates in place without a full page reload
- Adding a submitter animates the new row into the submitters list rather than appearing instantly
- Selecting a field applies a selection ring and reveals its resize handle; hovering a field box shows a soft colour halo in the field's submitter colour
- Reassigning a selected field to another submitter recolours the field box on the canvas at the same moment the panel control updates
- Action feedback appears in a short-lived toast (added, assigned, deleted) that fades in and out
- The mode switch and the status pill update in place; switching to Preview changes the field boxes to a dashed fillable affordance
- Hover feedback is required on all interactive chrome (top-bar buttons, template rows, submitter rows, palette buttons, field boxes, panel controls); omitting hover feedback is a defect
</motion>

<responsiveness>
- At desktop widths the three panes sit side by side under the full-width top bar
- At narrow widths (around 375 pixels wide) the panes stack into a single scrollable column with the palette and the canvas reachable without horizontal scrolling, preserving the primary-before-secondary order
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width
</responsiveness>

<accessibility>
- Every interactive control (top-bar actions, template rows, submitter rows, palette buttons, panel inputs and buttons) is reachable and operable with the keyboard alone, with a visible focus indicator distinct from hover
- The action-feedback toast is an aria-live status region so placements, reassignments and deletions are announced as well as shown
- Inline validation messages in the field editor are visible text associated with their input, not colour alone
- The selected field can be removed with the Delete key while it is selected
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (placing, editing, reassigning, deleting fields, switching templates, sending for signing, switching modes)
- Placing, selecting, reassigning and deleting fields update the canvas immediately, and the UI stays responsive under rapid repeated field placement with no hangs or dropped interactions
</performance>

<requirements>
- Use Vue 3 Composition API, Pinia, Tailwind CSS 4.3.2 (pinned), and Reka UI.
- Reka UI provides the interactive component primitives — the submitter select, the required checkbox/toggle, the mode switch, popovers or dialogs, and the toast surface; Tailwind CSS 4.3.2 owns layout, spacing, and all custom surfaces, with design tokens in the theme layer.
- Motion for Vue is allowed for animation (field entrance/exit, toast motion, panel transitions); no other animation libraries.
- Phosphor icons via the @phosphor-icons/vue package only — one icon set used consistently for the palette glyphs, panel controls, and chrome; no other icon sets, no raw copy-pasted SVGs.
- All forms validate through VeeValidate paired with a Zod schema — the field-properties editor (name required and non-empty), the editable template-name field, and any add-submitter input; the schema defines the rules and the form layer surfaces inline per-field errors, naming the field, before submit.
- Shared application state must live in a Pinia store: the templates and their placed fields, the submitters and the active submitter, the active template, the selected field, the editor mode, and the signing status. UI controls and any programmatic surface must mutate this one shared store, not disconnected local copies.
- No authentication wall — open directly into the primary workspace.
- Persist relevant state in localStorage (or equivalent client storage) so a reload restores it: the open template, the placed fields and their submitter assignments, the submitters, and the signing status must survive a full page reload. This persistence is a required part of this task (it overrides the usual in-memory-only rule).
- Seed at least 3 templates with at least one template open and non-empty on first load, and at least 2 submitters with distinct colours, so the primary workflow is exercisable immediately.
- State contracts (behavioral, not storage keys):
  - Placing a field adds it to the open template's field set, assigns it to the active submitter, selects it, and updates the per-submitter counts
  - Selecting a field opens its editor in the properties panel; the canvas and panel stay synchronized as properties change
  - Reassigning a field's submitter recolours the field on the canvas and updates the panel and the per-submitter counts in the same step
  - Deleting a field removes only that field; other fields and all submitter definitions remain
  - Editing a field name to empty shows visible validation at the field and does not delete the field
  - Opening a template swaps the canvas to that template's document and fields without a reload
- Keep the implementation frontend-only and self-contained; do not depend on a live backend or authentication service. Build tooling: Vite or an equivalent SPA setup. No backend routes.
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Zero navigational outbound links for app chrome — in-app controls only.
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
- form-workflow-v1

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

Bindings:
- Editor object types: text; signature; initials; date; number; checkbox; radio; select; image; file; phone; cells; stamp
- Editor properties: name; required; submitter
- Editor operations: add; select; delete; update_property; preview; switch_mode
- Entity: submitter
- Entity operations: create; select; update; delete
- Entity fields: name; color
- Form operations: validate; submit; advance

Mechanics exclusions:
- Field drag-to-reposition gesture on the canvas stays Playwright when mechanism matters
- Hover halo / press feedback and toast fade timing stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
