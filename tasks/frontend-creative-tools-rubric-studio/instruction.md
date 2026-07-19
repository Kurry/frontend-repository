<summary>
Build a grading-rubric authoring and versioning studio for an evaluation platform using Vue 3, Pinia, Tailwind CSS 4.3.2, and PrimeVue.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Rubric library rail —
- The app opens into a two-pane shell: a left rail listing seeded rubric files and a main canvas showing the opened rubric; the rail seeds exactly 4 rubric files on first load — Response Quality, Code Review Depth, Safety Screening, and Summarization Fidelity — each rail entry showing the rubric name, a semantic-version badge (for example 2.1.0), and its criteria count
- Clicking a rail entry opens that rubric in the main canvas without a full page reload; the active rail entry carries a visibly distinct selected treatment
- The seeded default rubric (Response Quality, opened on first load) contains at least 6 criteria; every other seeded rubric contains at least 4

Feature: Rubric header card —
- The opened rubric shows a header card with the rubric name, its current semantic version, a judge model select offering exactly three fictional models (quartz-arbiter-2, sable-jury-9, cinder-panel-1), and an aggregation mode select offering exactly three modes (weighted mean, required-pass, all-pass); changing either select updates the header immediately without a reload
- The header card shows a derived rollup line that recomputes live: total criteria count, count of load-bearing criteria (weight of 3 or more), and the sum of all weights

Feature: Criteria list —
- Criteria render as a vertical list of expandable accordion rows; each collapsed row shows the criterion id, name, a type badge reading binary, or likert with its min and max values (for example likert 1-5), the weight value, and an importance label (must have or nice to have)
- Expanding an accordion row reveals the full multiline description plus a collapsed rationale disclosure labeled Grading notes; activating the disclosure expands it with a rotating chevron cue and it stays open for that criterion while the app remains open
- Every criterion with weight 3 or higher renders with a distinct load-bearing accent treatment (accent border or badge) that lower-weight criteria do not have

Feature: Criterion CRUD and the version gate —
- An Add criterion control opens a form with fields: id (required, unique), name (required), description (required, multiline), type (binary or likert; choosing likert reveals required min and max fields where min must be less than max), weight (required, 0.5 to 5), and importance; each invalid field shows an inline message naming that field before submit, and the submit control stays disabled until all required fields are valid
- Submitting a valid Add criterion form appends exactly one new accordion row and increases the header criteria count by one
- Editing a criterion opens the same form prefilled with its current values; saving a change to only weight, importance, or name requires at least a patch bump of the rubric version (third number increases) before the save control enables
- Changing a criterion's description or type marks the pending save as a minor change: the save control stays disabled and an inline explanation states that the version must be bumped by at least a minor increment (middle number increases, third number resets) before saving
- Deleting a criterion asks for confirmation and marks the pending save as a major change: the save control stays disabled with an inline explanation until the version field shows a major bump (first number increases, others reset)
- Attempting to save with a version that does not satisfy the pending change shows a violation message naming the violation kind by name — minor bump required or major bump required — and the rubric remains unchanged
- Entering a correctly bumped version enables save; saving applies the change, updates the rail entry's version badge, and shows a confirmation toast

Feature: Version history and diff view —
- Each rubric has a version history panel listing its entries newest first; the default rubric seeds at least 3 history entries, each showing the version number, a timestamp, and a one-line per-change summary (for example Changed description of criterion clarity-check)
- Saving a bumped change appends exactly one new history entry at the top with a summary naming the changed criterion
- Selecting a history entry opens a read-only diff-style view of that change: added criteria render in a green-tinted added treatment, removed criteria in a red-tinted removed treatment with struck-through text, and changed criteria in an amber-tinted changed treatment showing the before and after values side by side; a Close or Back control returns to the editable criteria list

Feature: Tune view —
- A Tune view (switchable from the rubric canvas without a reload) shows, for each criterion, horizontal precision, recall, and F1 bars with their numeric values, computed against a seeded set of at least 10 labelled cases listed alongside with per-case include toggles
- Toggling a labelled case's include control immediately recomputes every criterion's precision, recall, and F1 bars and numbers; toggling it back restores the prior values exactly
- Each likert criterion in the Tune view exposes an editable pass threshold; changing the threshold immediately recomputes that criterion's bars to different values when the seeded case scores straddle the threshold
- A summary strip above the bars derives live: included-case count and macro-averaged precision, recall, and F1, updating with every toggle or threshold change

Feature: Weighted-total preview —
- A sample submission panel lists every criterion of the opened rubric with a per-criterion pass/fail verdict toggle and shows a single aggregate score; flipping any verdict recomputes the aggregate instantly without a reload
- The aggregate honors the header's selected aggregation mode: under weighted mean it is the weight-weighted share of passing criteria; under required-pass it reads 100 percent only when every must-have criterion passes and 0 percent otherwise; under all-pass it reads 100 percent only when every criterion passes; switching modes with the same verdicts set produces the correspondingly different aggregate
- A suggestions row of chips above the verdict panel offers preset verdict patterns (All pass, All fail, Must-haves only); clicking a chip applies exactly that verdict pattern to the toggles and the aggregate updates

Feature: Export —
- An Export control reveals the opened rubric serialized as plain structured text inside a monospaced code block with a language label and a copy control; activating copy places exactly the displayed text on the clipboard and shows visible confirmation (icon swap or toast)
- The exported text reflects the live rubric: exporting after adding a criterion includes the new criterion's id and name
</core_features>

<user_flows>
- Version-gated edit end to end: open the default rubric at its seeded version, edit one criterion's description, observe save disabled with the minor-bump explanation, enter a version with only the patch number increased and observe the violation message minor bump required, then enter a correct minor bump and save; the rail badge shows the new version, exactly one new history entry appears at the top naming that criterion, and selecting it shows the description marked as changed with before and after values — all without a reload
- Delete with major bump: delete a criterion, confirm, observe the major-bump explanation, enter a correct major bump and save; the criteria count decreases by exactly one, the rail badge shows the major version, and the new history entry's diff view shows that criterion in the removed treatment
- Tune sensitivity: in the Tune view, note one criterion's F1 value, exclude two labelled cases and observe the bars and summary strip change, then re-include them and observe the original values restored exactly
- Preview mode sensitivity: in the sample submission panel set a mix of pass and fail verdicts, record the weighted-mean aggregate, switch the aggregation mode to all-pass and observe the aggregate change to 0 percent, then set all verdicts to pass via the All pass chip and observe 100 percent
- A page reload returns the app to its seeded state: 4 rubrics at their seeded versions, the default rubric open, and all seeded history entries present
</user_flows>

<edge_cases>
- Submitting the criterion form with an empty name or description shows inline messages naming those fields and adds no criterion; the criteria count is unchanged
- Entering a duplicate criterion id shows an inline message naming the id field as already in use and the submit control stays disabled
- Choosing likert with min greater than or equal to max shows an inline message on the range fields and blocks submit
- Cancel on the criterion form, and Cancel on a pending version bump, leave the rubric, its version, and its history unchanged
- Deleting all criteria from a rubric (each with its major bump) leaves an empty state in the criteria list naming what belongs there and offering the Add criterion control; the Tune view and preview panel show their own empty states instead of broken bars
- Excluding every labelled case in the Tune view shows an empty state in place of the bars rather than zero-division artifacts
</edge_cases>

<visual_design>
- Studio composition: a fixed-width left rail, a main canvas with the header card above the criteria list, and the history panel as a distinct right-hand or below-header surface; the three regions are separated by hairline borders or elevation, never run together
- One accent color marks selection and primary actions; a second, visually distinct load-bearing accent marks weight-3-or-higher criteria and the load-bearing rollup count; the two accents are never the same hue
- Type badges (binary, likert with range) and importance labels are visually distinct chip treatments, consistent across every criterion row
- Diff view color language is consistent: green-tinted added, red-tinted removed with strikethrough, amber-tinted changed, each readable against its tint
- Typography hierarchy: the rubric name is visibly larger than section headings, which are larger than criterion names, which are larger than body and metadata text; the exported rubric renders in a monospaced face distinct from the UI face
- Buttons, selects, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments; the disabled save control is visibly muted next to its inline explanation
- Spacing follows a consistent rhythm across the rail, criteria rows, history entries, and Tune bars, with no crowded or orphaned regions
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; rail entries, criteria rows, and history entries take a full-width hover wash; chips lift subtly on hover; form controls show focus rings
- Accordion rows expand and collapse with an animated height transition and a rotating chevron; the Grading notes disclosure animates the same way at its own level
- A newly added criterion's row animates into the list and a deleted row animates out; reordering surfaces never snap
- Tune bars animate their width changes when cases are toggled or a threshold moves, easing to the new values rather than jumping
- The aggregate score in the preview panel animates its transition (count-up or eased change) when verdicts or the aggregation mode change
- The criterion form dialog enters and exits with a short opacity and scale transition of roughly 200 to 300 milliseconds; the diff view transitions in without a full page repaint
- Confirmation toasts after save, delete, and copy slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow remains available
</motion>

<responsiveness>
- At widths of 1024 pixels and below the left rail collapses behind a toggle control that opens it as an overlay; at desktop widths the rail is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the Tune bars and diff view reflow to stacked layouts and the code block scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — rail entries, header selects, accordion headers, form fields, verdict toggles, case toggles, history entries, copy control — is reachable and operable with the keyboard alone, with a visible focus indicator
- The criterion form dialog traps focus while open, closes on Escape, and returns focus to the control that opened it
- Accordion headers and disclosures expose their expanded or collapsed state to assistive technology, and form validation messages are associated with their fields so each message names the field it belongs to
- Diff states are not conveyed by color alone: added, removed, and changed entries also carry a text label or icon
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Recomputing Tune bars and the preview aggregate responds instantly with no visible lag, and the UI stays responsive under rapid repeated verdict toggling with no hangs
</performance>

<requirements>
Shared application state must live in Pinia (in-memory only): the rubric collection with criteria, versions, and history entries, the active rubric and active view, judge model and aggregation selections, labelled cases and their include flags, thresholds, sample-submission verdicts, pending-change tracking for the version gate, expanded/collapsed flags, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Adding a valid criterion grows the opened rubric's criteria list and header counts; derived rollups update
- Saving a version-gated edit updates the criterion everywhere it appears (accordion row, Tune bars, preview panel, export text) and appends exactly one history entry
- Deleting a criterion removes it from the list, the Tune view, the preview panel, and derived counts
- Tune metrics and the preview aggregate recompute from the shared collection, cases, and verdicts; they never render from a second disconnected copy
- Active rubric, active view, and selections are shared client state; switching them does not reload the document
- WebMCP tool handlers, where required by delivery, invoke the same store commands as the visible controls
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. PrimeVue is the component library for the accordions, dialogs, selects, toggles, chips, toasts, and form controls; no other component library. Motion for Vue and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons only, installed via its npm Vue package — no raw copy-pasted SVG icon sets. All forms — the criterion form, the version bump field, and any settings controls — are driven by VeeValidate validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed exactly 4 rubrics (the default with at least 6 criteria and at least 3 history entries; the others with at least 4 criteria each) and at least 10 labelled cases so every view is non-empty on first load
- Invalid criterion submissions and wrong version bumps must not change the rubric; show visible validation feedback
- Empty criteria lists, empty Tune case sets, and empty panels show designed empty states
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- All model and judge names are fictional; no real product, company, or model names appear anywhere in the UI
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
- Editor object types: criterion; labelled-case; sample-verdict
- Editor properties: id; name; description; type; likert-min; likert-max; weight; importance; version; judge-model; aggregation-mode; include; pass-threshold; verdict
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor modes: criteria; tune; preview
- Value bounds: weight 0.5-5; likert min < max; version must satisfy pending patch/minor/major bump; judge-model in {quartz-arbiter-2, sable-jury-9, cinder-panel-1}; aggregation-mode in {weighted-mean, required-pass, all-pass}
- Browsable entity: rubrics
- Destinations: response-quality; code-review-depth; safety-screening; summarization-fidelity; version-history; diff-view; tune-view; preview-panel; export; export-center
- Artifact operations: export; import; copy
- Export formats: structured-text; rubric-json; package-json
- Import modes: package-json
- Workflow completion: rail version badge and history entry update after a version-gated save
- Workflow completion: header rollup (criteria count, load-bearing count, weight sum) recomputes after add/delete
- Workflow completion: export package-json and rubric-json previews reflect session mutations after add or version-gated save

Mechanics exclusions:
- Accordion / Grading-notes height transition and chevron rotation timing stay Playwright-observed
- Tune bar width-easing and aggregate count-up animations stay Playwright-observed
- Row animate-in/animate-out on add/delete stays Playwright-observed
- Undo/Redo keyboard shortcuts and undo-history strip stay Playwright-observed
- Native download and file-picker import stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
