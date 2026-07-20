<summary>
Build a trajectory viewer for an agent-benchmark trials platform using React, Zustand, Tailwind CSS 4.3.2, and Radix UI headless primitives styled with Tailwind. The app produces the reviewer's package: a structured Review Package JSON (plus Review Markdown) compiled live from the open trial's annotations and failure classification, downloadable and copyable, reflecting every session mutation.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Task catalog and trial table —
- The app opens into a task catalog listing exactly 3 seeded benchmark tasks; each entry shows the task name, a one-line description, the number of trials (3 each), and the best reward among its trials
- Selecting a task opens that task's page showing the task definition: the full instruction text rendered as formatted rich text, a config summary panel, the reference environment file tree, and a test listing with at least 3 named tests
- The task page lists all 3 of that task's trials in a comparison table with columns: model (fictional model names such as Larkspur-9, Quillon-2, and Basalt-Mini), reward (a number between 0 and 1 with two decimals), pass or fail outcome, duration, and step count
- Clicking the reward column header sorts the trial table by reward; clicking again reverses the order relative to ascending
- A two-position toggle above the file tree switches between the reference filesystem and the selected trial's final agent filesystem; switching swaps the visible tree contents without a full page reload, and the active side is always visibly indicated
- Clicking a trial row opens the trial viewer; while the trial loads, a simulated ingest checklist (with at least 4 items such as parsing steps, indexing files, and building the timeline) ticks items complete one by one with per-item status icons and an overall progress indicator before the viewer content appears

Feature: Trial viewer layout and timeline —
- The trial viewer opens as a three-pane workspace: a left rail step timeline, a center file workspace, and a right rail step detail panel; a header strip shows the trial's model name, reward, pass or fail badge, and duration
- Every trial's timeline lists at least 12 ordered steps of mixed types — reasoning, tool call, observation, terminal output, and screenshot steps all appear at least once per trial — and each timeline entry shows its step index, a type glyph, a one-line summary, a timestamp, and a status marker
- Clicking any timeline entry makes that step active: the entry is visibly highlighted, and both the center file workspace and the right rail update to reflect that step in the same interaction
- With the timeline focused, pressing the arrow keys moves the active step to the previous or next step; the newly active entry scrolls into view and the center and right panes follow
- A scrubber control spanning the timeline lets the user drag through the trial; dragging it updates the active step continuously as the handle moves, not only on release
- A step-type filter above the timeline offers All plus reasoning, tool-call, observation, terminal, and screenshot; activating tool-call narrows the visible timeline to tool-call steps only, and choosing All restores the full ordered list; when a filter matches no steps, a designed empty timeline state names the active filter and offers a control that clears it

Feature: File workspace and renderers —
- The center pane shows the trial's evolving file tree as of the active step: every file changed at or before the active step carries a change badge reading Added, Modified, Deleted, or Truncated, and stepping forward accumulates badges while stepping backward recomputes them so badges reflect only the steps up to the active one
- Selecting a file in the tree renders its content inline by type: markdown files render as formatted rich text, code files render in a monospaced block with syntax-aware coloring, a visible language label, and a copy control that gives visible confirmation and places the exact text on the clipboard, image files render scaled to fit their pane, and tabular data files render as a grid with column headers
- Selecting a file whose badge is Deleted shows a deleted-file notice in the content pane instead of stale content

Feature: Step detail and terminal —
- The right rail shows the active step's message text, an expandable reasoning region collapsed by default that opens and closes on activation with a rotating chevron cue and remembers its open state per step while the app is open, tool invocation panels showing the tool name, a status of pending, running, complete, or error, an input summary, and an expandable output, and the step's observation text where one exists
- A terminal panel renders the active step's terminal output progressively — text appears incrementally rather than all at once — with a status affordance that distinguishes streaming from complete; while streaming, the panel auto-follows the latest line, scrolling up pauses the auto-follow and reveals a jump-to-latest control, and activating that control resumes following
- Activating a step with no terminal output shows a designed empty state in the terminal panel naming that this step produced no terminal output

Feature: Annotations (API-shaped note create body) —
- An annotate control on the active step opens a note form whose submit payload is API-shaped like a review-service annotation create body and must conform to this field contract (all keys required unless marked optional; example values illustrative only):
  - Required note_text: trimmed non-empty string of at most 500 characters
  - Required step_index: integer step index present on the active trial (assigned from the active step on open; the form must reject an index that does not exist on the trial)
- The record a successful Add note creates IS that annotation create body — same field names, bounds, and nesting — and form validation enforces the same contracts the Review Package JSON annotations array declares
- Submitting with empty or whitespace-only note_text, note_text longer than 500 characters, or a step_index that is not on the active trial shows an inline validation message naming each invalid field (for example note_text or step_index) and attaches nothing
- Submitting a valid note attaches it to that step and it appears immediately in an annotations list showing the note_text and its step_index
- Each annotation has an edit control that updates that entry's note_text in place under the same note_text bounds, and a remove control that deletes exactly that note from the list
- Clicking an entry in the annotations list jumps the viewer to that note's step: the timeline highlight, center workspace, and right rail all move to that step without a reload
- When a trial has no annotations yet, the annotations region shows a designed empty state explaining that notes attach to steps and naming the annotate control

Feature: Failure classification (API-shaped report create body) —
- Each trial has a failure classification form whose submit payload is API-shaped like a review-service failure-report create body and must conform to this field contract (all keys required; example values illustrative only):
  - Required stage: exactly one of planning, tool-use, verification, recovery
  - Required root_cause: exactly one of wrong-tool, missing-context, hallucinated-path, timeout
  - Required behavior: exactly one of loops, abandons, invents-files, ignores-errors
  - Required impact: exactly one of score-zero, partial-credit, flaky-pass, false-pass
  - Required evidence: trimmed string of at least 20 and at most 2000 characters
  - Required implicated_steps: array of one or more integer step indices that exist on the active trial
- The record a successful Classify failure creates IS that failure-report create body — same field names, enums, and bounds — and form validation enforces the same contracts the Review Package JSON failure_report object declares
- Submitting the form with any select unset, evidence outside 20 to 2000 characters, or implicated_steps empty or containing an index not on the trial shows inline per-field messages naming each invalid field (stage, root_cause, behavior, impact, evidence, or implicated_steps), and no report is created; the messages appear without a page reload
- Submitting a valid classification renders a report card on the trial showing all four chosen classifications, the evidence text, and one link per implicated step; clicking an implicated-step link jumps the viewer to that step
- Re-submitting the form updates the existing report card in place rather than adding a second card
- Double-activating the classification submit control produces exactly one report card

Feature: Undo and redo —
- Undo and Redo controls sit in the trial viewer chrome (also driven by Ctrl+Z and Ctrl+Shift+Z, or Cmd on macOS); both are visibly disabled when their stack is empty
- Annotation create, edit, and delete, and classification submit and update, each push an undoable history entry; Undo restores the prior annotations list, report card, and export preview together; Redo reapplies the undone mutation
- Timeline selection, scrubber position, step-type filter, filesystem toggle, and command-palette open state are not undo steps
- Undo with an empty stack and Redo with an empty redo stack stay disabled and produce no console errors

Feature: Review package export (useful end state) —
- An Export panel control opens a drawer or modal with two format tabs labelled Review JSON and Review markdown, each regenerated live from the open trial's store state whenever annotations or the failure report change
- Review JSON is API-shaped like a review-service package response — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: the exact string trajectory-viewer.review-package.v1
  - Required exportedAt: ISO-8601 timestamp string that updates when the preview regenerates
  - Required trial_id and task_id: non-empty strings matching the open trial and task
  - Required model: non-empty fictional model name shown for the trial
  - Required reward: number between 0 and 1 matching the trial header
  - Required outcome: exactly one of pass or fail
  - Required duration: non-empty string matching the trial header duration
  - Required step_count: positive integer matching the trial's step count
  - Required annotations: array of annotation objects, each conforming to the annotation create field contract above (note_text and step_index)
  - Required failure_report: either null when no classification exists for the trial, or an object conforming to the failure-report create field contract above (stage, root_cause, behavior, impact, evidence, implicated_steps)
- The Review markdown tab previews a human-readable report that includes the task_id, trial_id, model, outcome, one bullet per annotation naming step_index and note_text, and when failure_report is non-null the four classification values plus the evidence text
- The preview derives from live session state: adding, editing, or removing an annotation, or submitting or undoing a classification, before reopening Export changes the JSON and markdown to include those mutations; an export that omits a session mutation is incorrect
- Each format tab offers Copy export (writes that format's exact preview text to the clipboard with visible confirmation) and Download export (triggers a real file download whose contents match the previewed text for that format)

Feature: Review package import —
- An Import review package control accepts pasted Review JSON text matching the export field contract
- A valid import that targets the open trial (trial_id matches) replaces that trial's annotations and failure_report so the annotations list, report card, and the next Export preview match the imported package
- Malformed JSON, or JSON that violates the field contract (schemaVersion not exactly trajectory-viewer.review-package.v1, missing required keys, note_text empty or longer than 500 characters, stage or root_cause or behavior or impact outside their closed enums, evidence outside 20 to 2000 characters, implicated_steps empty or containing an index not on the open trial, outcome outside pass or fail, or trial_id that does not match the open trial), shows an inline error naming the import problem (for example schemaVersion or trial_id), leaves annotations and the report unchanged, and does not treat the attempt as a successful undoable mutation

Feature: Command palette —
- Pressing Ctrl+K or Cmd+K opens a command palette overlay with search focused; typing part of a step summary on the open trial narrows results, and activating a step result makes that step active with timeline, workspace, and detail in sync
- The palette also lists actions for Export panel, Import review package, Undo, and Redo that run the same handlers as the matching visible controls
- Escape closes the palette without changing annotations or the failure report
</core_features>

<user_flows>
- Comparing and opening a trial end to end: open a task from the catalog, sort its trial table by reward descending, click the top row, watch the ingest checklist complete, and land in the viewer with step 1 active and the header showing that trial's model, reward, outcome, and duration
- Scrubbing and inspecting files: drag the scrubber to a mid-trial step, confirm the file tree badges reflect only changes up to that step, select a badged code file and see it rendered with coloring and a working copy control, then advance one step and see any new change badge appear
- Annotating and returning: activate a late step, attach a note whose note_text includes a distinct token, navigate back to an early step, then click the note in the annotations list and land back on the annotated step with all three panes in sync
- Classifying a failure: submit the classification form with fields missing and see per-field messages naming the invalid fields, correct every field using the declared enum values and evidence of at least 20 characters, submit, and see the report card with implicated-step links that jump the viewer when clicked
- Filtering the timeline: choose the tool-call step-type filter, confirm only tool-call steps remain, activate one, then clear the filter and confirm the full ordered timeline returns with the same step still active when it is still in range
- Command palette jump: press Ctrl+K or Cmd+K, type part of a step summary, activate the match, and land on that step with timeline, workspace, and detail in sync
- Mutation-to-export: after annotating at least one step and submitting a valid classification, open the Export panel, confirm Review JSON shows schemaVersion exactly trajectory-viewer.review-package.v1 and carries the exact note_text, step_index, stage, root_cause, behavior, impact, evidence, and implicated_steps just entered under annotations and failure_report, and confirm Review markdown names the same trial_id and note_text; Copy export and Download export are available on the active tab
- Export closes the loop: after a valid annotation and classification, open Export and confirm Review JSON carries those values, Copy export with visible confirmation, then Undo the classification and confirm the preview's failure_report becomes null while annotations remain until undone
- Export then import round-trip: after annotating and classifying on a trial, Copy or Download the Review JSON, clear those session edits (Undo or remove until empty), Import that same JSON text, and confirm the annotations list, report card, and the next Export preview match the imported package
- A page reload returns the app to its seeded state: the task catalog with 3 tasks, no annotations, no classification reports, empty undo history, and a default export preview with empty annotations and a null failure_report
</user_flows>

<edge_cases>
- A trial containing a failed step shows an error status on that step in the timeline and an error-styled output in its tool invocation panel, and the viewer keeps working when that step is activated
- When a trial has no annotations yet, the annotations region shows a designed empty state explaining that notes attach to steps and naming the annotate control
- Double-activating the classification submit control produces exactly one report card
- File names longer than their tree row truncate with an ellipsis in the tree and show the full name in the content pane header when selected
- Arrow-key navigation stops at the first and last visible steps without wrapping or throwing errors
- Choosing a step-type filter that matches no steps shows a designed empty timeline state naming the active filter and a control that clears it
- Submitting the note form with empty note_text or text longer than 500 characters shows an inline message naming note_text and attaches nothing
- Importing a Review JSON whose trial_id does not match the open trial shows an inline error naming trial_id and changes no annotations or report
- Importing malformed Review JSON or a document that breaks the field contract (wrong schemaVersion, missing required keys, out-of-enum stage or root_cause, evidence outside 20 to 2000 characters) shows an inline import error, leaves annotation count and report card unchanged, and does not update the Export preview as if a successful import occurred
- Undo with an empty stack and Redo with an empty redo stack are disabled and produce no console errors
- Opening the command palette, pressing Escape, and confirming no annotation or classification was added or removed
</edge_cases>

<visual_design>
- The trial viewer composes as a fixed three-pane workspace: the left timeline rail roughly one fifth of the width, the center file workspace the widest pane, and the right detail rail roughly one quarter, separated by hairline borders; the panes read as one instrument, not stacked cards
- Two type families with strict roles: a monospaced face for code, terminal output, file paths, step indices, and the export preview, and a UI sans for everything else, with page titles visibly larger than section headings, which are larger than body and label text
- One status color system used consistently everywhere a status appears — timeline markers, tool panels, and outcome badges: a single accent for the active step, green for complete and pass, red for error and fail, amber for running and streaming; every status also carries a text label or glyph so color is never the only indicator
- Change badges are visually distinct per kind — Added, Modified, Deleted, and Truncated each get their own treatment — and always render their word, not a color chip alone
- Dense data register throughout: the trial table, timeline, and tree use compact rows with full-width hover washes; cards and panels carry subtle shadows and hairline borders rather than heavy outlines
- The Export panel shows a monospaced preview with clear format tabs, and the command palette is a centered overlay with a distinct search field and ranked results, reading as first-class surfaces rather than afterthought dialogs; Undo and Redo sit in the viewer chrome without breaking the three-pane instrument
- One consistent icon set is used across the chrome, and every loading and empty surface (ingest checklist, empty terminal, empty annotations, empty filtered timeline) is deliberately designed rather than blank
- Headings, buttons, and labels follow one consistent capitalization convention, and action labels are specific verbs such as Add note, Classify failure, Copy export, and Import review package rather than generic labels
</visual_design>

<motion>
- Hover animations (required): timeline entries, trial table rows, and file tree rows take a full-width hover wash; buttons ease background and shadow with a slight press effect; form controls show focus rings
- Changing the active step through the timeline or arrow keys eases the highlight to the new entry and cross-fades the center and right pane content over roughly 150 to 250 milliseconds rather than snapping
- The reasoning region and tool output panels expand and collapse with an eased height transition, and the disclosure chevron rotates over roughly 0.2 seconds
- Terminal output streams visibly: characters or lines appear incrementally with a cursor or streaming indicator while active, and the indicator changes when streaming completes; the output never pops in as one finished block when a step is first activated
- A newly added annotation animates into the annotations list and a removed one animates out rather than appearing or vanishing instantly
- Ingest checklist items tick complete with an animated check transition as the simulation advances
- The copy control and Copy export swap to a confirmation state briefly after copying, and the classification report card enters with a short opacity and scale transition
- The command palette opens with a short opacity and scale transition, and filtered timeline rows animate out and back when the step-type filter changes rather than snapping
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every surface and flow remains complete and usable
</motion>

<responsiveness>
- At widths of 1024 pixels and below, the three panes collapse into a tabbed arrangement where the timeline, workspace, and detail panes are switchable one at a time, and the active step stays consistent across tab switches
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; code blocks, the terminal, and the export preview scroll horizontally within their own containers; the command palette overlay fits the viewport with a reachable search field and scrollable results
</responsiveness>

<accessibility>
- Every interactive control — catalog entries, table rows, the filesystem toggle, timeline entries, the scrubber, tree rows, disclosure toggles, form fields, annotation links, step-type filter, undo and redo, export format tabs, copy and download, import, and the command palette — is reachable and operable with the keyboard alone, with a visible focus indicator at each stop
- The timeline is fully keyboard operable: arrow keys move the active step, Home and End jump to the first and last visible steps, and the active entry is programmatically marked as current
- Opening the note form or command palette moves focus to its first field; closing it returns focus to the control that opened it; overlays and expanded panels close on Escape
- Validation messages are associated with their fields so each message names the field it belongs to (including note_text, stage, root_cause, behavior, impact, evidence, and implicated_steps), and images rendered in the file workspace carry descriptive alternative text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including scrubbing, annotating, classifying, palette use, undo, and export
- Rapidly scrubbing back and forth across all steps of a trial stays smooth, with no hangs, no dropped interactions, and no pane showing a step other than the active one
- Terminal streaming never blocks interaction: the timeline, tree, forms, undo, and export preview remain responsive while output is streaming
- Opening the command palette and typing to narrow results stays responsive with no dropped keystrokes
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app
- Validation and import errors name the field and the rule broken (for example note_text, evidence, schemaVersion, trial_id); empty states explain what belongs in the region and which control fills it
- Action labels use specific verbs such as Add note, Classify failure, Copy export, and Import review package rather than generic labels where a specific one is possible
- No placeholder or filler text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional: a guided first-run tour of annotate-classify-export or an on-screen shortcut reference for the command palette
- Optional: a step bookmark strip that lets reviewers pin and jump between bookmarked steps beyond the required annotation list
- Optional: a side-by-side before and after file diff for Modified badges beyond the required single-file renderer
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the tasks, trials, and steps collections, the active task, active trial, and active step, the filesystem toggle side, per-step disclosure open flags, terminal streaming status and follow flag, annotations, classification reports, ingest progress, trial table sort, step-type filter, undo and redo stacks, export preview text, import draft, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Review Package JSON plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Changing the active step from any control (timeline click, arrow keys, scrubber, annotation link, report link, command palette) updates the timeline highlight, file tree badges, and right rail from the same shared state in one interaction
- Adding, editing, or removing an annotation updates the annotations list and the export preview immediately; annotations survive navigating between steps and trials while the app is open
- Submitting a valid classification creates or updates exactly one report per trial; the report card and the export preview's failure_report read the same record
- Undo and redo mutate the shared annotations and failure_report collections; the annotations list, report card, and export preview always agree after Undo or Redo
- The filesystem toggle, sort order, step-type filter, streaming status, and export format tab are shared client state; changing them never reloads the document
- A page reload returns the app to its seeded state
Build tooling: Vite or an equivalent SPA setup. Radix UI primitives (dialogs, popovers, tabs, select, toggle groups) styled entirely with Tailwind CSS 4.3.2 (pinned, design tokens in the theme layer) are the component layer; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — the note form, the failure classification form, and the import surface — are driven by React Hook Form validating through a Zod schema that models the annotation create body, failure-report create body, and Review Package JSON payloads: the schema defines the field contracts above and inline per-field errors render before submit. The record a successful Add note or Classify failure creates is exactly that create body; Review Package JSON export and a successful import conform to the same field names, enums, bounds, and nesting. A markdown rendering library and a syntax highlighting library are allowed for the file renderers. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed exactly 3 benchmark tasks with 3 trials each; every trial has at least 12 steps including at least one reasoning, tool call, observation, terminal output, and screenshot step, and at least one trial contains a failed step; screenshots may be seeded placeholder images bundled locally
- Seed every trial with file changes covering all four badge kinds across its steps, and every task with a reference file tree containing at least one markdown, one code, one image, and one tabular file
- All model names, task names, and agent names in seed data are fictional
- Review Package JSON export must be compiled live from the current store; after any session mutation that changes annotations or the failure report on the open trial, reopening Export must include that mutation under schemaVersion trajectory-viewer.review-package.v1
- Importing a valid Review Package JSON reconstructs the same visible review state the JSON export produced for that trial_id
- Zero navigational outbound links for app chrome; view changes via shared client state
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
- browse-query-v1
- entity-collection-v1
- form-workflow-v1
- artifact-transfer-v1

Module specs:
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
- Browsable entity: trials
- Destinations: task-catalog; task-page; trial-viewer; reference-filesystem; trial-filesystem; annotations-list; classification-report; export-panel; command-palette
- Filters: step-type
- Sorts: reward-asc; reward-desc
- Entity: annotation
- Entity operations: create; select; update; delete
- Entity fields: note-text; step-index
- Form fields: note-text; stage; root-cause; behavior; impact; evidence; implicated-steps
- Form operations: validate; submit
- Value bounds: {"stage":["planning","tool-use","verification","recovery"],"root-cause":["wrong-tool","missing-context","hallucinated-path","timeout"],"behavior":["loops","abandons","invents-files","ignores-errors"],"impact":["score-zero","partial-credit","flaky-pass","false-pass"],"note-text":"non-empty string, at most 500 characters","evidence":"string of at least 20 and at most 2000 characters","implicated-steps":"one or more step indices that exist on the active trial","step-index":"integer step index present on the active trial","step-type":["reasoning","tool-call","observation","terminal","screenshot","all"]}
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: review-package
- Workflow completion: active-step-index
- Workflow completion: file-change-badges
- Workflow completion: report-card-present
- Workflow completion: export-preview-present
- Workflow completion: annotation-count

Mechanics exclusions:
- Scrubber continuous-drag updating is a gesture-fidelity criterion — Playwright-only; timeline clicks and arrow keys cover discrete step state
- Terminal progressive streaming, auto-follow, and jump-to-latest visuals are streaming mechanics observed live via Playwright
- Ingest checklist tick animation and per-item pacing stay Playwright-observed when a trial row is opened
- File renderer visuals — syntax coloring, copy-to-clipboard confirmation, image scaling, markdown rendering — are Playwright/clipboard observations; no file contents in WebMCP results
- Cross-fade pane transitions and reasoning-disclosure chevron animation stay Playwright-observed
- Command-palette open gesture, typeahead narrowing, and keyboard highlight movement stay Playwright-observed when mechanism matters
- Clipboard contents and download of the review-package export stay Playwright responsibilities; no raw file paths, blobs, or base64 in WebMCP args or results
- Undo and redo timeline microinteractions stay Playwright-observed
- Step-playback scrubbing and continuous advance visuals stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
