<summary>
Build a seed dataset studio — an operator console for a code-question dataset factory that turns mined bug reports into a benchmark dataset of codebase-investigation questions — using Svelte 5, runes-based stores, Tailwind CSS 4.3.2, and shadcn-svelte.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Seed queue —
- On first load the queue view shows a seeded in-memory manifest of at least 60 seeds spanning exactly these 6 fictional repositories and their languages: quartz-orm (TypeScript), copperline (Go), lattice-db (Rust), brineworks (Python), fernwheel (Ruby), and ashgrid (Java); a visible total count states the number of seeds
- Each queue row shows the seed id in the pattern repo-kind-number (for example quartz-orm-issue-142), the repository name, the language, the kind (issue or pr), the seed title, a status badge (draft, authored, rejected, or harvest-pending), and a difficulty badge (hard or unset)
- The seed quartz-orm-issue-142 is present on first load with the title Connection pool exhausts when nested transactions roll back, status draft, kind issue, difficulty unset, deference profile premise-acceptance, and failure model wrong-answer
- On first load the status distribution includes at least 24 draft, at least 14 authored, at least 10 rejected, and at least 6 harvest-pending seeds, all reachable in the queue by scrolling or by applying the matching status filter
- Every seed carries a pinned commit: the row shows the first 10 characters of a 40-character lowercase hexadecimal commit hash, and the seed detail surface shows the full 40-character hash with a copy control that puts the full hash on the clipboard and confirms visibly
- Every seed carries a deference profile (premise-acceptance, happy-path-bias, or boundary-violation) and a failure model (wrong-answer, no-runtime-evidence, missing-incomplete-info, or off-target), both visible on the seed detail surface; rejected seeds additionally show their reject class
- Scrolling the queue through all 60 or more rows stays smooth, and row rendering keeps up with fast scrolling with no blank stalls or layout jumps
- Filter controls narrow the queue by status, language, repository, and difficulty; active filters combine (a status filter plus a language filter shows only seeds matching both) and each active filter is visibly indicated
- A search field narrows the visible rows incrementally to seeds whose id or title matches the typed text; clearing the search restores the previous filtered set exactly
- Clicking a sortable column header (id, repository, language, status, or title) sorts the queue ascending; clicking the same header again sorts descending, reversing the order relative to ascending
- A Save filter control stores the currently applied filter and search combination as a named chip in a chip row above the table; clicking a saved chip re-applies exactly that combination, and a remove control on the chip deletes it
- A visible count of matching seeds updates whenever filters, search, or triage actions change the matching set, and an active-filters summary offers a single Clear all control that restores the full queue

Feature: Stats rollup panel —
- A rollup panel beside or above the queue shows live counts of seeds by status (draft, authored, rejected, harvest-pending), by language, and by repository, plus a breakdown of rejected seeds by reject class
- Every rollup figure derives from the same data as the queue: any triage action, authoring transition, or export that changes a seed's status changes the corresponding rollup counts in the same interaction with no reload
- Clicking a rollup cell (for example the authored count for lattice-db) navigates to the queue with the matching filters applied, and the visible rows agree with the number on the cell that was clicked

Feature: Triage —
- Selecting a draft seed and choosing Accept for authoring moves its status from draft to authored-track work: the seed opens in the authoring workbench and its status chip changes out of draft
- Choosing Reject on a draft seed opens a reject form with a reject class select constrained to exactly these five classes: duplicate-report, insufficient-signal, environment-specific, ambiguous-report, and trivial-fix, plus a justification text field (required, minimum 20 characters); Submit stays disabled until both are valid
- Submitting a valid rejection sets the seed's status to rejected, shows the chosen class on the seed, decrements the draft rollup count by one, and increments both the rejected rollup count and that class's breakdown figure by one
- Submitting the reject form with a justification shorter than 20 characters shows an inline validation message naming the justification field and changes no seed
- Checkboxes on queue rows enable multi-select; a selection toolbar appears showing the selected count, with batch Accept and batch Reject actions
- Batch Reject applies one reject class and one justification to every selected seed through the same validated form; on submit, all selected seeds change status in one update and the rollup counts change by exactly the selection size in the same interaction
- An Undo control appears after any triage action (single or batch) and reverses exactly the last triage action: the affected seeds return to their prior status and every rollup figure returns to its prior value

Feature: Authoring workbench —
- Opening a seed in the workbench shows a multi-pane editor with panes for the question, the positive rubric, the negative rubric, the foils, and the golden answer, all scoped to that seed, with the seed id, repository, language, and pinned commit visible in the workbench header
- The question pane holds the investigation question text (multiline) and an under-specification checklist of at least 4 items (such as confirming the question names no file paths, quotes no code, reveals no fix, and states the observable symptom); each item can be checked and unchecked and the checklist state is kept per seed
- The positive rubric pane lists criteria numbered 1.1 through 1.5 on first open, each with an id, a name, a weight, and a PASS/FAIL description; each field is editable and edits persist when switching panes and returning
- Criterion 1.4 is a locked runtime-evidence gate requiring the answer to cite evidence from executing the code at the pinned commit: its row shows a lock indicator, it has no working delete affordance, and attempting to remove it leaves it in place with an explanatory message
- Positive criteria other than 1.4 can be added and deleted; adding continues the 1.x numbering at the next free number and deleting any unlocked criterion removes exactly that row
- The negative rubric pane lists 2.x criteria that describe answers that must fail, each tagged with one of the classes false-premise-acceptance, fabricated-symbol, or wrong-subsystem; entries can be added, edited, and deleted, and each entry visibly indicates that matching it counts against the answer
- The foils pane lists deliberately wrong answers; each foil has its answer text, a failure mode chosen from the seed's failure-model vocabulary (wrong-answer, no-runtime-evidence, missing-incomplete-info, off-target), an expects-fail multi-select whose options are exactly the current rubric criterion ids, and an expected-correctness cap between 0 and 40 percent
- The foil editor's expects-fail options update live with the rubric: adding rubric criterion 1.6 makes 1.6 immediately selectable on every foil, and deleting a criterion that a foil references flags that foil with a visible warning naming the missing id until the reference is removed or remapped
- Clicking an expects-fail id chip on a foil highlights or scrolls to that criterion in the rubric pane, and each 2.x negative criterion links back to any foils that reference it
- The golden answer pane holds either the golden answer text or a harvest-pending state; switching to harvest-pending requires a justification (required, minimum 20 characters) that is displayed with the pending state
- A Run harvest control in the golden pane starts a simulated harvest decomposed into exactly these 5 named steps: clone at pinned commit, install dependencies, reproduce failure, capture runtime evidence, and distill golden answer; each step advances visibly through pending, running, and complete or failed
- Occasional simulated harvest failures retry automatically with a visible attempt counter (such as retry 2 of 3) and a backoff countdown; a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control that resumes from that step with earlier steps' outputs unchanged
- A running harvest can be paused and resumed: pausing freezes progression at the current step and resuming continues from exactly that step; completed steps keep their original timestamps and never re-execute
- A harvest that completes all 5 steps fills the golden answer pane with a generated answer draft and clears the harvest-pending state; the seed's timeline records the harvest completion
- Saving the workbench shows a visible save confirmation, updates the seed's row in the queue (title edits appear in the queue row), and records an authoring-save event on the seed's timeline

Feature: Package gate and lifecycle —
- A gate banner in the workbench continuously shows whether the seed can reach authored status; while any condition is unmet the banner names each unmet condition individually: question text present, at least 3 foils, every foil expects-fail id resolves to an existing criterion, and golden answer present or harvest-pending justified
- The gate banner updates in the same interaction that changes its inputs: adding the third foil, filling the question, justifying harvest-pending, or fixing a dangling expects-fail reference each removes exactly its named condition from the banner without a save or reload
- A Mark authored control is disabled while the gate lists any unmet condition and enabled when all conditions pass; activating it sets the seed's status to authored, updates its queue badge and the rollup counts, and stamps a status transition on the timeline
- Every seed has an event timeline listing its lifecycle in order with timestamps: status transitions, authoring saves, harvest events, and exports; a filter narrows the timeline by event type and an empty filtered timeline shows an explanatory empty state

Feature: Export —
- An Export package action on an authored seed opens an export view containing the finished package manifest as JSON-shaped text that mirrors the live session state: the seed id, repository, pinned 40-character commit, language, kind, title, difficulty, deference profile, failure model, the question text, every positive criterion with id, name, weight, and description, every negative criterion with its class, every foil with failure mode, expects-fail ids, and correctness cap, and the golden answer or justified harvest-pending state
- Edits made in the workbench before exporting appear verbatim in the manifest text: renaming criterion 1.2 or editing a foil's cap changes the corresponding manifest fields on the next export with no stale values
- A Copy manifest control puts the manifest text on the clipboard and shows a visible confirmation
- A Dataset snapshot control produces a summary as JSON-shaped text with the total seed count, counts by status, by language, and by repository, and the rejected-by-class breakdown, all matching the rollup panel's current figures, with its own copy-with-confirmation control
- Completing an export stamps an export event with a timestamp on that seed's timeline, and the export view names the seed id it was generated from
</core_features>

<user_flows>
- Triage to authored, end to end: filter the queue to draft quartz-orm seeds, open quartz-orm-issue-142, accept it into the workbench, write the question, keep the 1.1 to 1.5 rubric with 1.4 locked, add one 2.x negative criterion, add 3 foils whose expects-fail ids resolve, run the harvest to completion so the golden pane fills, watch the gate banner empty as each condition is met, mark the seed authored, and confirm the queue badge, the draft and authored rollup counts, and the timeline's transition entry all changed in the same session without a reload
- Export closes the loop: after marking a seed authored, export its package, confirm the manifest text carries the exact question, criterion, foil, and golden values just authored, copy it with visible confirmation, then generate the dataset snapshot and confirm its status counts match the rollup panel figure for figure, and the seed's timeline gains an export entry
- Batch rejection with recovery: multi-select at least 3 draft seeds, batch reject them with the class insufficient-signal and one justification, confirm the rejected rollup and the insufficient-signal breakdown each grew by the selection size while draft shrank by the same amount, then activate Undo and confirm every affected seed and every rollup figure returns to its prior value
- Cross-link navigation: from a rollup cell click through to the filtered queue and confirm the row count matches the cell figure; from a foil's expects-fail chip jump to its criterion in the rubric pane; delete that criterion and confirm the foil immediately shows a dangling-reference warning naming the id and the gate banner gains the unresolved-reference condition
- Dangling-reference repair: with a foil flagged for a deleted criterion, remap the foil's expects-fail selection to an existing id and confirm the warning clears and the gate banner condition disappears in the same interaction, then mark the seed authored
- A page reload returns the app to its seeded state: the seeded manifest with its original statuses and counts, the default queue view, no saved filter chips, and no in-progress harvests
</user_flows>

<edge_cases>
- Filtering to a combination matching no seeds shows an empty state in the table region naming the active filters, with a Clear all control that restores the full queue
- Double-activating Mark authored transitions the seed exactly once: the authored rollup count increases by exactly one and the timeline gains exactly one transition entry
- Double-activating Run harvest starts exactly one harvest: the step list fills once and the timeline gains one harvest sequence
- Deleting every foil on a seed that previously passed the gate re-disables Mark authored and returns the at-least-3-foils condition to the gate banner
- A seed title longer than 80 characters is truncated with an ellipsis in the queue row and shown in full in the workbench header
- Undo is available for the last triage action only: after a new triage action, Undo reverses the newest action, and a second Undo without an intervening action makes no further change
- Rejecting the seed currently open in the workbench closes or visibly disables its authoring panes and shows its rejected state with the chosen class
- Filtering a seed's timeline to an event type with no entries shows an empty state message in the timeline region rather than a blank area
</edge_cases>

<visual_design>
- Layout: a full-height studio shell with a compact top bar carrying the app name, the view switcher (Queue and Workbench), and global actions; the queue view composes as the stats rollup panel on top or at the left, the saved-chip and filter row beneath it, and the seed table filling the remaining space; the workbench composes as a header strip with the seed identity plus gate banner and a multi-pane body with the question and rubric panes beside the foils and golden panes
- Status badges use one fixed mapping everywhere they appear: draft in neutral slate, authored in green, rejected in red, and harvest-pending in amber; the same colors carry into the rollup panel and timeline entries
- The difficulty badge for hard uses a distinct violet treatment, and unset difficulty renders as a muted outline badge rather than nothing
- Seed ids, commit hashes, and the manifest and snapshot text render in a monospaced face, visually distinct from the interface sans-serif; all other UI text uses the sans-serif with a clear hierarchy of app title above pane headings above table body and label text
- The locked criterion 1.4 row carries a visible lock icon and a subtly different background from unlocked rows so its protected state reads at a glance
- Foil warning states for dangling expects-fail references use the same amber warning treatment as harvest-pending, distinct from red rejection states
- The gate banner renders unmet conditions as individual labeled items with an unmet indicator, switching to a distinct all-clear treatment when every condition passes
- Spacing follows a consistent rhythm: table rows share one height, pane paddings are visually regular, and the rollup, filter row, and table gaps are even with no crowded or orphaned regions
- Buttons, inputs, selects, checkboxes, and chips show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the top bar, status badges, triage actions, harvest steps, and timeline entries
</visual_design>

<motion>
- Queue rows animate on triage: an accepted or rejected row's status chip transitions with a short color-and-scale change rather than snapping, and batch-rejected rows update with a brief stagger rather than simultaneously
- Adding or deleting a rubric criterion or a foil animates the list: the new row eases in and a removed row collapses out rather than the list jumping
- The gate banner animates condition changes: a satisfied condition fades or slides out of the unmet list and the all-clear state eases in rather than flashing
- Harvest step statuses animate during a real run: the running step shows a continuous activity indicator, a completing step transitions with a short fade, and the retry countdown ticks visibly
- Hover animations (required): buttons ease background and shadow with a slight press effect; queue rows, rollup cells, chips, and timeline entries take a full-width or full-cell hover wash; form controls show focus rings
- The reject form and any confirmation dialogs enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- Switching between Queue and Workbench transitions the views with a brief crossfade or slide rather than an instant swap, without a full page reload
- Copy confirmations (commit hash, manifest, snapshot) animate in — an icon swap or toast that eases in, remains readable, and auto-dismisses with a fade
- Clicking an expects-fail chip animates attention to the linked criterion (a highlight pulse or smooth scroll) rather than teleporting silently
- With prefers-reduced-motion set, list, banner, badge, and view transitions apply instantly and the harvest indicators change state without animation
</motion>

<responsiveness>
- At widths of 1024 pixels and below the workbench panes stack vertically in the order question, rubric, foils, golden, each keeping its full controls; at desktop widths at least two panes render side by side
- At widths of 768 pixels and below the stats rollup collapses to a horizontally scrollable strip and the queue table hides the deference and commit columns behind the seed detail surface, keeping id, title, status, and difficulty visible
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the seed table and the manifest text scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — queue rows and their checkboxes, column headers, filter and chip controls, triage and batch actions, workbench fields, harvest controls, copy controls, and timeline filters — is reachable and operable with the keyboard alone, with a visible focus indicator
- The reject form and confirmation dialogs trap focus while open, close on Escape, and return focus to the control that opened them
- Status changes from triage, gate passage (all conditions met), harvest completion, and a harvest step entering the failed state are announced through an aria-live region as well as shown visually
- Form fields across the reject form, workbench editors, and harvest justification have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Status and difficulty badges convey their meaning with text, not color alone, and the locked state of criterion 1.4 is exposed to assistive technology, not only as an icon
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load with all 60 or more seeds present
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — fast filter toggles, rapid sort clicks, quick pane switches, and repeated batch selections — with no hangs or dropped interactions, including while a harvest simulation is running
</performance>

<writing>
- All interface copy uses one consistent capitalization convention across headings, buttons, badges, and pane titles
- Action labels are specific verbs — Accept for authoring, Reject seed, Run harvest, Mark authored, Export package, Copy manifest — never bare generic labels where a specific one is possible
- Validation and gate messages name the exact field or condition and what satisfies it, such as the justification length rule and each unmet gate condition
- Seeded titles, questions, criteria, and foil texts read as realistic engineering prose about the fictional repositories with no placeholder text, lorem ipsum, or template variables anywhere in the UI
- The same concepts keep the same names everywhere: seed, foil, criterion, golden answer, harvest, reject class — never a synonym in one pane and a different one in another
</writing>

<innovation>
Optional enhancement space; nothing here is required for a passing build:
- A dataset health view that charts status distribution over the session or flags repositories with skewed reject rates
- Keyboard-first triage: single-key accept/reject with an on-screen shortcut reference
- A diff-style preview showing what changed in the manifest since the seed's previous export
- Configurable studio theme or density mode beyond the base requirement
</innovation>

<requirements>
Shared application state must live in Svelte 5 runes-based stores (in-memory only): the seed manifest with per-seed status, difficulty, deference profile, failure model, reject class, and pinned commit; queue filters, search, sort, saved filter chips, and multi-select; the stats rollup inputs; the last triage action for undo; per-seed authoring packages (question text, under-specification checklist, positive and negative rubric criteria, foils with expects-fail references and caps, golden answer or harvest-pending state); harvest run state with step statuses, attempt counts, and checkpoints; per-seed event timelines and their filters; gate condition results; export text; the active view; and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Triaging a seed (single or batch) updates its queue row, the rollup counts, and its timeline from the same shared state in one interaction; Undo restores exactly the prior state of all three
- Authoring edits update the workbench panes, the gate banner, the queue row, and the next export's manifest text from the same shared package state; deleting a criterion immediately re-derives foil reference warnings and gate conditions
- Advancing a harvest step updates the step list, the golden pane, and the timeline from the same shared run state; pausing and resuming preserve completed steps' outputs and timestamps
- Filters, search, sort, saved chips, and rollup cell click-throughs recompute the visible queue from the shared manifest; they do not create a second disconnected copy
- The export manifest and dataset snapshot are derived text: they are generated from the live stores at the moment of export and never from prewritten strings
- The active view and selection are shared client state; switching views does not reload the document
Build tooling: Vite with the Svelte 5 plugin as an SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. shadcn-svelte is the component library for all UI chrome — dialogs, selects, checkboxes, badges, tables, tabs, toasts, and form controls; no other component library. svelte-motion and AutoAnimate allowed for animation; no other animation libraries. Icons from phosphor-svelte only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the reject form (single and batch), the workbench question, criterion, and foil editors, and the harvest-pending justification — are driven by TanStack Form for Svelte validating through Zod schemas: the schemas define the rules (required fields, the 20-character justification minimum, the 0 to 40 percent cap bounds, the closed reject-class and failure-mode enums) and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; the harvest is simulated with realistic latency and occasional simulated step failures, so two harvests of the same seed produce different (not identical) step timings and generated drafts.
- Seed at least 60 seeds across the 6 named repositories and languages with the status distribution stated in the queue feature, including the named seed quartz-orm-issue-142, so the queue, rollup panel, and at least one authored package are non-empty on first load
- Every seeded commit hash is exactly 40 lowercase hexadecimal characters and unique per seed
- Submitting any form with invalid fields must not change any seed; show visible validation feedback
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- form-workflow-v1
- command-session-v1
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Editor object types: question; under-specification-checklist-item; positive-criterion; negative-criterion; foil; golden-answer
- Editor operations: select; add; delete; update_property; set_content
- Editor properties: question-text; checklist-item-checked; criterion-name; criterion-weight; criterion-description; negative-criterion-class; foil-answer-text; foil-failure-mode; foil-expects-fail-ids; foil-correctness-cap; golden-answer-text; seed-title
- Form fields: reject-class; reject-justification; batch-reject-class; batch-reject-justification; harvest-pending-justification
- Form operations: validate; submit; cancel
- Workflow steps: accept-for-authoring; reject-seed; batch-reject; undo-triage; mark-authored; export-package
- Value bounds: reject-class in {duplicate-report, insufficient-signal, environment-specific, ambiguous-report, trivial-fix}; negative-criterion-class in {false-premise-acceptance, fabricated-symbol, wrong-subsystem}; foil-failure-mode in {wrong-answer, no-runtime-evidence, missing-incomplete-info, off-target}; foil-correctness-cap between 0 and 40 percent; reject and harvest-pending justifications minimum 20 characters; foil expects-fail ids limited to the seed's current rubric criterion ids; criterion 1.4 runtime-evidence gate is locked: delete attempts are refused in place with an explanatory message; mark-authored allowed only when the gate passes: question text present, at least 3 foils, every expects-fail id resolves, golden answer present or harvest-pending justified; seeds limited to the 6 seeded repositories quartz-orm, copperline, lattice-db, brineworks, fernwheel, ashgrid; named seed quartz-orm-issue-142 present on first load
- Session operations: start; pause; resume
- Demos: harvest-run; harvest-step-retry
- Artifact operations: export; copy
- Export formats: package-manifest-json; dataset-snapshot-json; commit-hash
- Workflow completion: triage (single or batch) updates the seed's queue status badge, the rollup counts by exactly the selection size, and the seed timeline in one interaction; undo restores all three to their prior values
- Workflow completion: gate banner adds or removes exactly the named unmet condition in the same interaction that changes its input, with no save or reload
- Workflow completion: adding rubric criterion 1.6 makes 1.6 immediately selectable in every foil's expects-fail options; deleting a referenced criterion flags the foil with a dangling-reference warning naming the missing id
- Workflow completion: a harvest completing all 5 steps (clone at pinned commit, install dependencies, reproduce failure, capture runtime evidence, distill golden answer) fills the golden pane, clears harvest-pending, and stamps a harvest completion on the timeline
- Workflow completion: export manifest text mirrors live workbench edits verbatim, the dataset snapshot counts match the rollup panel figure for figure, and the export stamps a timeline event
- Workflow completion: copy confirmations appear after the full 40-character commit hash, manifest, and snapshot copy controls

Mechanics exclusions:
- Queue filtering, incremental search, sort-toggle on column headers, saved filter chips, and rollup cell click-throughs are themselves graded behaviors driven through the visible controls and stay Playwright-driven
- Triage status-chip color-and-scale transition and batch-reject row stagger stay Playwright-observed
- Rubric/foil list enter and collapse animations and gate banner condition fade/slide stay Playwright-observed
- Harvest running activity indicator, retry backoff countdown ticks, and step fade timing stay Playwright-observed
- Queue/Workbench view crossfade and expects-fail chip highlight pulse or smooth scroll stay Playwright-observed
- File picker interaction, clipboard contents, and copy toast animation remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
