<summary>
Build a evaluation-rubric authoring and versioning studio for an evaluation platform using Vue 3, Pinia, Tailwind CSS 4.3.2, and PrimeVue.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Rubric library rail —
- The app opens into a two-pane shell: a left rail listing seeded rubric files and a main canvas showing the opened rubric; the rail seeds exactly 4 rubric files on first load — Response Quality, Code Review Depth, Safety Screening, and Summarization Fidelity — each rail entry showing the rubric name, a semantic-version badge (for example 2.1.0), and its criteria count
- Clicking a rail entry opens that rubric in the main canvas without a full page reload; the active rail entry carries a visibly distinct selected treatment
- The seeded default rubric (Response Quality, opened on first load) contains at least 6 criteria; every other seeded rubric contains at least 4

Feature: Rubric header card —
- The opened rubric shows a header card with the rubric name, its current semantic version, a arbiter model select offering exactly three fictional models (quartz-arbiter-2, sable-jury-9, cinder-panel-1), and an aggregation mode select offering exactly three modes (weighted mean, required-pass, all-pass); changing either select updates the header immediately without a reload
- The header card shows a derived rollup line that recomputes live: total criteria count, count of load-bearing criteria (weight of 3 or more), and the sum of all weights

Feature: Criteria list —
- Criteria render as a vertical list of expandable accordion rows; each collapsed row shows the criterion id, name, a type badge reading binary, or likert with its min and max values (for example likert 1-5), the weight value, and an importance label (must have or nice to have)
- Expanding an accordion row reveals the full multiline description plus a collapsed rationale disclosure labeled Rationale notes; activating the disclosure expands it with a rotating chevron cue and it stays open for that criterion while the app remains open
- Every criterion with weight 3 or higher renders with a distinct load-bearing accent treatment (accent border or badge) that lower-weight criteria do not have

Feature: Criterion CRUD and the version gate (API-shaped CriterionUpsert) —
- An Add criterion control opens a form that submits exactly a CriterionUpsert payload; the record a successful create produces IS the would-be criterion API request body; edit, export, and import share this same criterion object shape. CriterionUpsert field contract (all keys required unless marked optional; example values illustrative only):
  - id: required trimmed string, length 1 to 64, matching lowercase letters, digits, and hyphens only (pattern like clarity-check), unique among criteria in the opened rubric
  - name: required trimmed string, length 1 to 80
  - description: required trimmed string, length 1 to 2000
  - type: required closed enum exactly one of binary, likert
  - likertMin: required integer from 1 to 10 inclusive when type is likert; must be absent or null when type is binary
  - likertMax: required integer from 1 to 10 inclusive when type is likert; must be strictly greater than likertMin; must be absent or null when type is binary
  - weight: required number from 0.5 to 5 inclusive in steps of 0.5
  - importance: required closed enum exactly one of must-have, nice-to-have
  - Cross-field: choosing likert without both likertMin and likertMax, or with likertMin greater than or equal to likertMax, shows inline messages naming the range fields; a duplicate id shows an inline message naming id as already in use; empty or out-of-bounds fields keep submit disabled, show inline errors naming the field and the fix, and leave the criteria count unchanged
- Submitting a valid Add criterion form appends exactly one new accordion row whose visible id, name, type, weight, and importance match that payload and increases the header criteria count by one
- Editing a criterion opens the same form prefilled with its current CriterionUpsert values; saving a change to only weight, importance, or name requires at least a patch bump of the rubric version (third number increases) before the save control enables
- Changing a criterion's description or type marks the pending save as a minor change: the save control stays disabled and an inline explanation states that the version must be bumped by at least a minor increment (middle number increases, third number resets) before saving
- Deleting a criterion asks for confirmation and marks the pending save as a major change: the save control stays disabled with an inline explanation until the version field shows a major bump (first number increases, others reset)
- Attempting to save with a version that does not satisfy the pending change shows a violation message naming the violation kind by name — minor bump required or major bump required — and the rubric remains unchanged
- Entering a correctly bumped version enables save; saving applies the change, updates the rail entry's version badge, and shows a confirmation toast

Feature: Rubric metadata field contract (API-shaped RubricDocument header) —
- The header card's editable metadata submits as the would-be rubric document header. RubricDocument field contract for the opened rubric (all keys required; example values illustrative only):
  - name: required trimmed string, length 1 to 120
  - version: required semantic version string of exactly three non-negative integers separated by dots (MAJOR.MINOR.PATCH)
  - arbiterModel: required closed enum exactly one of quartz-arbiter-2, sable-jury-9, cinder-panel-1
  - aggregationMode: required closed enum exactly one of weighted-mean, required-pass, all-pass
  - criteria: required array of CriterionUpsert objects (may be empty only after deliberate deletes)
- Changing arbiterModel or aggregationMode updates the header immediately without a reload; an out-of-enum value is not selectable from the UI controls

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

Feature: Undo and redo —
- Undo and Redo controls in the studio chrome revert and reapply the most recent mutations: criterion add, edit save, delete save, arbiter-model change, aggregation-mode change, labelled-case include toggles, likert pass-threshold edits, and sample-submission verdict flips; each undo visibly restores the prior state everywhere it appears (accordion, header rollup, Tune, preview, export previews), and both controls disable when their stacks are empty
- Undoing a saved Add criterion removes that row and restores the prior criteria count and rollups; redo re-adds it identically
- Undoing a case include toggle or verdict flip restores the prior Tune bars or aggregate exactly

Feature: Export center and schema-mirrored artifacts (API-shaped RubricDocument and RubricPackage) —
- The app produces the user's rubric artifacts: an Export control opens an Export center with three live-derived format tabs — structured text, rubric JSON, and package JSON — regenerated from the current store without a reload; creating, editing, deleting, or version-gated saving updates all three previews
- Structured text: a plain monospaced serialization of the opened rubric that includes its name, version, arbiter model, aggregation mode, and every criterion's id, name, type, weight, and importance
- RubricDocument JSON field contract (Copy, Download, and the opened-rubric export preview conform; field names and enum values are visible in the JSON preview text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly rubric-document-v1), name, version, arbiterModel, aggregationMode, and criteria (array of CriterionUpsert objects matching the create/edit field contract). Every required key above is visible in the JSON preview
- RubricPackage JSON field contract (Copy, Download, and Import all conform to this same shape; all keys and nesting REQUIRED; example values illustrative only): schemaVersion (required string exactly rubric-package-v1), library (required string exactly Rubric Studio), rubrics (required array of RubricDocument objects in rail order, each conforming to the RubricDocument field contract including schemaVersion rubric-document-v1), and generatedAt (required ISO-8601 datetime ending in Z)
- Each format offers Copy (writes the exact preview text to the clipboard with visible confirmation such as an icon swap or toast) and Download (triggers a real file download of that format)
- An export that omits a session create, edit, delete, or version-gated save is invalid

Feature: Import package round-trip —
- An Import control accepts a previously exported RubricPackage JSON (file pick or paste). A valid import that conforms to the RubricPackage field contract replaces the in-memory rubric collection so the rail (names, version badges, criteria counts), opened canvas, history entries present in the package, Tune cases remaining in session chrome, and a fresh export match the imported document without a reload
- Import rejects non-conforming payloads without mutating the collection: malformed JSON, missing required schemaVersion/library/rubrics/generatedAt keys, schemaVersion not exactly rubric-package-v1, library not exactly Rubric Studio, a rubrics element that fails the RubricDocument field contract, or any criterion that fails the CriterionUpsert field contract shows a visible validation message naming the offending field (or that the package is invalid) and leaves the studio unchanged
- Exporting then re-importing a package reconstructs the same visible rail membership, versions, and criteria; an export that omits session mutations or fails the field contract is incorrect
</core_features>

<user_flows>
- Version-gated edit end to end: open the default rubric at its seeded version, edit one criterion's description, observe save disabled with the minor-bump explanation, enter a version with only the patch number increased and observe the violation message minor bump required, then enter a correct minor bump and save; the rail badge shows the new version, exactly one new history entry appears at the top naming that criterion, and selecting it shows the description marked as changed with before and after values — all without a reload
- Delete with major bump: delete a criterion, confirm, observe the major-bump explanation, enter a correct major bump and save; the criteria count decreases by exactly one, the rail badge shows the major version, and the new history entry's diff view shows that criterion in the removed treatment
- Tune sensitivity: in the Tune view, note one criterion's F1 value, exclude two labelled cases and observe the bars and summary strip change, then re-include them and observe the original values restored exactly
- Preview mode sensitivity: in the sample submission panel set a mix of pass and fail verdicts, record the weighted-mean aggregate, switch the aggregation mode to all-pass and observe the aggregate change to 0 percent, then set all verdicts to pass via the All pass chip and observe 100 percent
- CriterionUpsert create flow: open Add criterion, submit a valid payload whose id matches the allowed pattern, type is binary or likert with a valid range when likert, weight in 0.5 to 5, and importance is must-have or nice-to-have; confirm the new row shows those field values and the header count increases by one
- Export session flow: add a valid criterion, open Export center, confirm structured text, rubric JSON, and package JSON previews include that criterion's id and name and that rubric JSON shows schemaVersion rubric-document-v1 with name, version, arbiterModel, aggregationMode, and criteria from the RubricDocument field contract while package JSON shows schemaVersion rubric-package-v1, library exactly Rubric Studio, rubrics, and generatedAt; Download or Copy the active format, then delete the criterion with a major bump and confirm the next export omits it
- Import round-trip flow: export the package after a create, note the rubrics length and a criterion id, delete criteria or switch versions to diverge, Import the JSON, and confirm the rail counts, opened criteria, and a fresh export reconstruct to match the imported package
- Undo round-trip: add a valid criterion (or flip a preview verdict), then Undo and confirm the prior criteria count or aggregate returns everywhere it appears; Redo restores the mutation
- A page reload returns the app to its seeded state: 4 rubrics at their seeded versions, the default rubric open, all seeded history entries present, and empty undo history
</user_flows>

<edge_cases>
- Submitting the criterion form with an empty name or description, an id longer than 64 characters or containing spaces/uppercase/punctuation outside the allowed pattern, a weight outside 0.5 to 5, or an importance outside must-have|nice-to-have shows inline messages naming those fields and adds no criterion; the criteria count is unchanged
- Entering a duplicate criterion id shows an inline message naming the id field as already in use and the submit control stays disabled
- Choosing likert with min greater than or equal to max, or omitting likertMin/likertMax while type is likert, shows an inline message on the range fields and blocks submit
- Cancel on the criterion form, and Cancel on a pending version bump, leave the rubric, its version, and its history unchanged
- Deleting all criteria from a rubric (each with its major bump) leaves an empty state in the criteria list naming what belongs there and offering the Add criterion control; the Tune view and preview panel show their own empty states instead of broken bars
- Excluding every labelled case in the Tune view shows an empty state in place of the bars rather than zero-division artifacts
- Undo with an empty history and Redo with an empty redo stack are disabled, not silent no-ops
- Importing malformed package JSON shows an inline parse error naming the import problem and leaves the rubric collection unchanged
- Importing parseable JSON that fails the RubricPackage field contract — missing required schemaVersion/library/rubrics/generatedAt keys, schemaVersion not exactly rubric-package-v1, library not exactly Rubric Studio, a RubricDocument that fails its field contract, or a criterion that fails CriterionUpsert — leaves the studio unchanged and shows validation naming the offending field
- Export with an empty criteria list still opens Export center and shows artifacts that still include schemaVersion rubric-document-v1 / rubric-package-v1 and the required keys rather than crashing; Download and Copy remain available
</edge_cases>

<visual_design>
- Studio composition: a fixed-width left rail, a main canvas with the header card above the criteria list, and the history panel as a distinct right-hand or below-header surface; the three regions are separated by hairline borders or elevation, never run together
- One accent color marks selection and primary actions; a second, visually distinct load-bearing accent marks weight-3-or-higher criteria and the load-bearing rollup count; the two accents are never the same hue
- Type badges (binary, likert with range) and importance labels are visually distinct chip treatments, consistent across every criterion row
- Diff view color language is consistent: green-tinted added, red-tinted removed with strikethrough, amber-tinted changed, each readable against its tint
- Typography hierarchy: the rubric name is visibly larger than section headings, which are larger than criterion names, which are larger than body and metadata text; Export center previews render in a monospaced face distinct from the UI face
- Buttons, selects, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments; the disabled save control is visibly muted next to its inline explanation; Undo and Redo appear disabled when their stacks are empty
- Spacing follows a consistent rhythm across the rail, criteria rows, history entries, and Tune bars, with no crowded or orphaned regions
- Export center presents format tabs and a monospace code preview with Copy and Download; Import sits as a clear companion control rather than a buried secondary action
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; rail entries, criteria rows, and history entries take a full-width hover wash; chips lift subtly on hover; form controls show focus rings
- Accordion rows expand and collapse with an animated height transition and a rotating chevron; the Rationale notes disclosure animates the same way at its own level
- A newly added criterion's row animates into the list and a deleted row animates out; reordering surfaces never snap
- Tune bars animate their width changes when cases are toggled or a threshold moves, easing to the new values rather than jumping
- The aggregate score in the preview panel animates its transition (count-up or eased change) when verdicts or the aggregation mode change
- The criterion form dialog enters and exits with a short opacity and scale transition of roughly 200 to 300 milliseconds; the diff view transitions in without a full page repaint
- Confirmation toasts after save, delete, and copy slide in, remain readable, and auto-dismiss with a fade
- The Export center and Import surface enter and exit with a short opacity transition rather than a hard cut; Undo and Redo state restores update list and bar surfaces with the same easing language as add/delete when motion is allowed
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow remains available
</motion>

<responsiveness>
- At widths of 1024 pixels and below the left rail collapses behind a toggle control that opens it as an overlay; at desktop widths the rail is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the Tune bars and diff view reflow to stacked layouts and Export center code blocks scroll within their own containers; Undo, Redo, Export, and Import remain fully visible and operable
</responsiveness>

<accessibility>
- Every interactive control — rail entries, header selects, accordion headers, form fields, verdict toggles, case toggles, history entries, Undo, Redo, Export, Import, and copy controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The criterion form dialog, Export center, and Import surface trap focus while open, close on Escape, and return focus to the control that opened them
- Accordion headers and disclosures expose their expanded or collapsed state to assistive technology, and form validation messages (criterion, version bump, and import) are associated with their fields so each message names the field it belongs to
- Diff states are not conveyed by color alone: added, removed, and changed entries also carry a text label or icon
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including export, import, and undo/redo
- Recomputing Tune bars, the preview aggregate, and Export center previews responds instantly with no visible lag, and the UI stays responsive under rapid repeated verdict toggling with no hangs
</performance>

<writing>
- Headings, controls, and labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Add criterion, Export, Import, Undo, Redo, and Copy rather than generic Submit or OK where a specific label is possible
- Validation and import error messages name the field or problem and the fix, including the field-contract rule when validation fails (for example allowed id pattern, weight bounds, importance enum, schemaVersion, or library); empty states explain what belongs there and how to restore content; no placeholder text such as TODO or Lorem appears in the shipped UI
</writing>

<innovation>
- Optional enhancements the builder may add, none required for a passing build: a bump-kind chip or suggested next version beside the version gate; coordinated before/after storytelling in the diff view; a brief first-run coachmark for Export center; a confusion-matrix mini-view beside Tune bars; keyboard power shortcuts for Add criterion or mode switching
</innovation>

<requirements>
Shared application state must live in Pinia (in-memory only): the rubric collection with criteria, versions, and history entries, the active rubric and active view, arbiter model and aggregation selections, labelled cases and their include flags, thresholds, sample-submission verdicts, pending-change tracking for the version gate, undo/redo stacks, export artifact text, expanded/collapsed flags, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Adding a valid criterion grows the opened rubric's criteria list and header counts; derived rollups and Export center previews update
- Saving a version-gated edit updates the criterion everywhere it appears (accordion row, Tune bars, preview panel, structured-text / rubric-json / package-json previews) and appends exactly one history entry
- Deleting a criterion removes it from the list, the Tune view, the preview panel, derived counts, and subsequent exports
- Tune metrics and the preview aggregate recompute from the shared collection, cases, and verdicts; they never render from a second disconnected copy
- Active rubric, active view, and selections are shared client state; switching them does not reload the document
- Undo and redo operate on the same shared state the visible controls mutate; export artifacts regenerate from that state on open
- Import replaces the shared rubric collection so rail, canvas, history present in the package, and export previews update together
- WebMCP tool handlers, where required by delivery, invoke the same store commands as the visible controls
- A page reload returns the app to its seeded state
- End-state contract: Download structured text / rubric JSON / package JSON and Copy MUST reflect the session's actual rubrics and criteria under the field contracts above — an export that omits session work or fails the contracts is invalid; Import of a previously exported RubricPackage MUST restore the same visible collection (round-trip). Persistence for this good-app genre is the portable RubricPackage plus the MCP query surface — never browser storage
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. PrimeVue is the component library for the accordions, dialogs, selects, toggles, chips, toasts, and form controls; no other component library. Motion for Vue and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons only, installed via its npm Vue package — no raw copy-pasted SVG icon sets. All forms — the CriterionUpsert form, the version bump field, and Import package when presented as a form — are driven by VeeValidate validating through a Zod schema: schemas are API-shaped and mirror the CriterionUpsert, RubricDocument, and RubricPackage field contracts above (the record each form creates IS the would-be request body; structured-text / rubric-json / package-json exports and Import package conform to those same contracts). Inline per-field errors render before submit; submit stays disabled while required fields are invalid. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed exactly 4 rubrics (the default with at least 6 criteria and at least 3 history entries; the others with at least 4 criteria each; every seeded criterion conforms to the CriterionUpsert field contract) and at least 10 labelled cases so every view is non-empty on first load
- Invalid criterion submissions, wrong version bumps, and non-conforming imports must not change the rubric collection; show visible validation feedback
- Empty criteria lists, empty Tune case sets, and empty panels show designed empty states
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- All model and arbiter names are fictional; no real product, company, or model names appear anywhere in the UI
- The exportable end state is the RubricPackage JSON (with RubricDocument and structured-text companions) compiled live from the session; packages must conform to the declared field contracts
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
