<summary>
Build a review workbench for an agent-benchmark trials platform using React, Zustand, Tailwind CSS 4.3.2, and React Aria headless components styled with Tailwind.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Task table and trial selection —
- The app opens into a task list showing exactly 3 seeded benchmark tasks; selecting a task shows its definition (instruction text rendered as formatted rich text, a config summary, an environment file tree, and a test listing with at least 3 named tests) and a trial table listing that task's 3 trials with columns: model (fictional names such as Fernhollow-2, Opaline-6, and Cindergraph-1), reward, pass or fail outcome, duration, step count, and an adjudication badge that reflects the trial's review progress
- Clicking a trial row opens the review workspace for that trial without a full page reload

Feature: Split review layout —
- The review workspace presents two trajectories: the agent trajectory and the scorer trajectory, shown in switchable panes with a persistent pane switcher, or side by side at wide viewports; the currently focused trajectory is always visibly indicated
- Each trajectory is an ordered step timeline: every agent trajectory has at least 12 steps of mixed types (reasoning, tool call, observation, terminal output, screenshot) and every scorer trajectory has at least 8 steps of inspection actions with tool invocation panels showing name, status, input summary, and expandable output, observation text, and placeholder screenshot frames
- Clicking any step in either trajectory makes it that trajectory's active step: the entry highlights and a detail panel shows the step's message, an expandable reasoning region collapsed by default with a rotating chevron, its tool panels, and observations
- With a trajectory's timeline focused, the arrow keys move its active step to the previous or next step and the newly active entry scrolls into view
- The agent trajectory side includes the trial's evolving file tree as of its active step, with per-file change badges reading Added, Modified, Deleted, or Truncated that accumulate as steps advance and recompute when stepping backward, and inline file rendering by type: markdown as formatted rich text, code in a monospaced block with syntax-aware coloring, a language label, and a copy control with visible confirmation, images scaled to fit, and tabular files as a grid with column headers
- A terminal panel streams the agent trajectory's active-step terminal output progressively with a status affordance distinguishing streaming from complete

Feature: Verdict table and linked highlighting —
- Each trial carries a per-criterion verdict table grouped by rubric dimension (four fictional dimensions with at least 3 criteria each, at least 12 criteria total per trial); every row shows the criterion id, title, weight, a yes or no verdict, and the scorer reasoning text with an evidence link
- Clicking a verdict row's evidence link jumps the scorer trajectory to the inspection step that produced it and highlights that step
- Selecting a criterion row also highlights any implicated agent step: the agent trajectory scrolls to and outlines the linked step at the same time as the scorer step, and clearing the selection removes both highlights
- A dimension rollup bar above the verdict table shows each dimension's score derived live from the verdicts and weights currently displayed; the rollup and the table always agree

Feature: Rescore labels and comparison —
- Every trial holds at least 2 named scoring results (at least one trial holds 3), each with a label name, per-dimension scores, a total, and a cost figure; a label switcher lists them and shows the active label at all times
- Switching the active label swaps the verdict table's verdicts and reasoning and recomputes the dimension rollup bar without a reload; at least one criterion differs between two labels of the same trial
- A comparison strip lets the user pick any two labels of the trial and shows per-dimension deltas and the total delta between them, signed and visibly distinguishing improvement from regression
- Criteria whose verdict flipped between the two compared labels are visually flagged in the verdict table, and a flips-only filter control narrows the table to only flipped criteria and back

Feature: Adjudication —
- Each flipped or failed criterion row exposes an adjudicate control opening a form whose submit payload is API-shaped like a review-service adjudication create body and must conform to this field contract:
  - Required criterionId: non-empty string matching a criterion id currently shown in the trial's verdict table
  - Required classification: exactly one of the closed enum values agent-bug, rubric-bug, or scorer-error
  - Required rationale: trimmed string of at least 20 and at most 2000 characters
  - Required reviewedAt: ISO-8601 timestamp string assigned on successful submit
  - Optional evidenceStepIds: array of one or more non-negative integers naming scorer and/or agent step indices implicated by the review; when present, every index must exist on that trial's trajectories
- Submitting with the classification select unset, the rationale shorter than 20 characters or longer than 2000 characters, or an evidenceStepIds entry that is not a valid step index on the trial shows inline per-field messages naming each invalid field and records nothing
- The record a successful adjudicate submit creates IS that adjudication create body — same field names, enums, and bounds — and form validation enforces the same contracts the Review Package JSON declares
- Submitting a valid adjudication marks that criterion row with its classification and adds it to a summary panel showing counts per classification for the trial; counts derive live from the recorded adjudications
- Re-adjudicating the same criterion replaces its previous record rather than double-counting
- The trial's adjudication badge in the task's trial table reflects review progress (for example none, in review with a count, or fully adjudicated) and updates as adjudications are recorded

Feature: Batch adjudication and undo —
- With the flips-only filter active, each flipped criterion row exposes a checkbox; a bulk bar appears when at least one flipped row is selected and offers Apply classification to selected with a classification select limited to agent-bug, rubric-bug, and scorer-error plus a shared rationale field that must satisfy the same 20-to-2000 character rationale contract
- Submitting a valid bulk apply writes one adjudication per selected flipped criterion using that classification and rationale, updates every selected row mark, increases the summary panel counts by the number of newly classified criteria (re-adjudications replace rather than double-count), and updates the trial badge in the same interaction
- Submitting bulk apply with the classification unset or the rationale outside the field contract shows inline per-field messages, records nothing, and leaves selection unchanged
- Undo and Redo controls sit in the review workspace chrome (also driven by Ctrl+Z and Ctrl+Shift+Z, or Cmd on macOS); both are visibly disabled when their stack is empty
- Recording, replacing, or bulk-applying an adjudication pushes an undoable history entry; Undo restores the prior adjudication set, summary counts, row marks, and trial badge; Redo reapplies the undone mutation; pane focus, label choice, filter state, and step selection are not undo steps

Feature: Review package artifacts (the app produces the reviewer's package) —
- An Export review package control opens a drawer or modal with two format tabs — Review Package JSON and Review Memo Markdown — each regenerated live from the active trial's store state whenever adjudications, the active label, or the compared labels change
- The Review Package JSON is API-shaped like a review-service package response — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: the exact string "review-package/v1"
  - Required exportedAt: ISO-8601 timestamp string
  - Required taskId and trialId: non-empty strings matching the open task and trial
  - Required model: non-empty fictional model name shown for the trial
  - Required activeLabel and comparedLabels: activeLabel is a non-empty scoring-label name from the trial; comparedLabels is an array of exactly two distinct scoring-label names from the trial
  - Required dimensionRollup: object whose keys are the four fictional dimension ids and whose values are numbers matching the on-screen rollup bar for the active label
  - Required adjudications: array of adjudication objects, each conforming to the adjudication create field contract above (criterionId, classification, rationale, reviewedAt, and optional evidenceStepIds)
  - Required summaryCounts: object with integer keys agent-bug, rubric-bug, and scorer-error that always equal the on-screen summary panel counts and the tallies derived from adjudications
  - Required flipCriterionIds: array of criterion ids currently flagged as flipped between the compared labels
- The Review Memo Markdown tab previews a human-readable report that includes the task id, trial id, model, active label, per-classification counts, and one bullet per recorded adjudication naming criterionId, classification, and the first line of the rationale
- Export content that omits session adjudications is invalid: after recording or bulk-applying at least one adjudication, reopening Export must show that adjudication in both the JSON adjudications array and the Markdown memo, and summaryCounts must match the on-screen panel
- Each format tab offers Copy (writes that format's text to the clipboard with visible confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)

Feature: Review package import —
- An Import review package control accepts pasted Review Package JSON text matching the export field contract
- A valid import replaces the open trial's adjudication set so row marks, summary panel counts, the trial badge, and the next Export preview match the imported adjudications array and summaryCounts
- Malformed JSON, or JSON that violates the field contract (schemaVersion not exactly "review-package/v1", missing required keys, classification outside the closed enum, rationale outside 20–2000 characters, summaryCounts that disagree with adjudications, dimensionRollup keys that do not match the four seeded dimensions, or comparedLabels that are not exactly two distinct labels of the trial), shows visible validation feedback naming the offending field, leaves adjudications unchanged, and does not treat the attempt as a successful undoable mutation

Feature: Command palette —
- Pressing Ctrl+K or Cmd+K opens a command palette overlay with a search field listing Jump to trial entries for the active task's trials, plus Export review package, Import review package, Undo, Redo, and Toggle flips-only
- Choosing a Jump to trial entry opens that trial's review workspace and closes the palette; choosing an action runs the same handler as the matching visible control and closes the palette
- Escape closes the palette without changing adjudications
</core_features>

<user_flows>
- Reviewing a verdict end to end: open a task, open a trial, select a failed criterion in the verdict table, follow its evidence link to the highlighted scorer inspection step, see the implicated agent step outlined in the agent trajectory, and read both step details without a reload
- Comparing rescores: switch the active label and watch the verdict table and rollup bar change, pick two labels in the comparison strip, read the per-dimension deltas, enable the flips-only filter, and see only flipped criteria remain with their flags
- Adjudicating a flip: open the adjudicate form on a flipped criterion, submit with an empty rationale and see per-field messages, complete the form as rubric-bug with a rationale of at least 20 characters, and see the row marked, the summary panel count increase by one, and the trial's badge update in the task's trial table
- Batch then export: with flips-only on, select at least two flipped criteria, Apply classification to selected as agent-bug with a valid shared rationale, confirm every selected row is marked and summary counts move by the number of newly classified criteria, open Export review package, and confirm Review Package JSON lists those adjudications with matching summaryCounts and the Review Memo Markdown names the same criterion ids
- Mutation-to-export: after one valid adjudication, reopen Export and confirm the JSON adjudications array and Markdown memo contain that criterionId and classification; Copy and Download are available on the active tab
- Undo after adjudicate: record a valid adjudication, confirm the row mark and summary count, Undo once, and confirm the mark, counts, badge, and Export preview restore the prior state; Redo restores the adjudication again
- Export then import round-trip: after adjudicating at least one criterion, Copy or Download the Review Package JSON, clear adjudications via Undo or a fresh path that empties them, Import that same JSON text, and confirm row marks, summary counts, badge, and the next Export preview match the pre-export package
- Walking the agent trajectory: arrow through agent steps, confirm the file tree badges track the active step, open a changed code file and copy its content with visible confirmation, and watch a terminal step stream progressively
- Command palette jump: open the palette with Ctrl+K or Cmd+K, choose Export review package, and confirm the export drawer opens with live previews
- A page reload returns the app to its seeded state: the 3-task list, default labels active, no adjudications recorded, and empty undo and redo stacks
</user_flows>

<edge_cases>
- Selecting a criterion whose evidence links to a scorer step with a screenshot shows the placeholder screenshot frame in that step's detail
- With the flips-only filter active, switching to a label pair with no flips shows a designed empty state naming that no criteria flipped, with a control that clears the filter
- Double-activating the adjudication submit control records exactly one adjudication for that criterion
- Scorer trajectory steps with no observation text show the panel without a blank gap; verdict reasoning longer than its row truncates with an ellipsis and expands on activation to show the full text
- Arrow-key navigation in either trajectory stops at its first and last steps without wrapping or console errors
- Bulk apply with an empty selection bar hidden, or with classification unset / rationale under 20 characters, records nothing and shows field-named validation when the bulk form was submitted invalid
- Importing malformed Review Package JSON or a document that breaks the field contract shows visible validation naming the offending field, leaves adjudication counts unchanged, and does not clear undo history as if a successful import occurred
- Undo with an empty history leaves adjudications unchanged and the Undo control stays disabled; Redo with an empty forward stack stays disabled
- Opening the command palette, pressing Escape, and confirming no adjudication was added or removed
- A rationale longer than 2000 characters is rejected with validation naming the rationale field and records nothing
</edge_cases>

<visual_design>
- The review workspace reads as a split instrument: two trajectory panes with a strong vertical divider and a persistent header naming each side (agent and scorer), the verdict table and rollup docked below or beside them, all separated by hairline borders with subtle panel shadows
- Two type families with strict roles: a monospaced face for code, terminal output, file paths, criterion ids, step indices, and the export JSON preview; a UI sans for everything else, with page titles visibly larger than section headings, which are larger than body and label text
- One status and verdict color system used consistently: green for yes/pass, red for no/fail, amber for running or in-review, one accent for the active step and selected criterion; every colored state also carries a text label or glyph so color is never the only indicator
- Flip flags, adjudication classifications, and change badges each have a distinct visual treatment that always includes its word (Flipped, agent-bug, rubric-bug, scorer-error, Added, Modified, Deleted, Truncated)
- The dimension rollup bar renders one segment per dimension with its score, visually proportional to the score, and restyles when the active label changes
- Dense review register: compact table rows, tight timelines, full-width hover washes; a bulk selection bar and Undo/Redo/Export/Import controls sit in the workspace chrome without breaking the split instrument; the export drawer shows format tabs, a scrollable monospaced preview, and Copy/Download; the command palette is a focused overlay with a search field and result list
- One consistent icon set across the chrome; deliberately designed loading and empty surfaces
- Headings, buttons, and labels follow one consistent capitalization convention, and action labels are specific verbs such as Adjudicate criterion, Compare labels, Export review package, Import review package, and Apply classification to selected rather than generic labels
</visual_design>

<motion>
- Hover animations (required): verdict rows, trial table rows, timeline entries, and tree rows take a full-width hover wash; buttons ease background and shadow with a slight press effect; form controls show focus rings
- Selecting a criterion eases the highlight onto the linked scorer and agent steps — the trajectories scroll smoothly to the steps and the outline fades in rather than snapping
- Switching the active label cross-fades the verdict table content and animates the rollup bar segments to their new proportions over roughly 200 to 300 milliseconds
- Enabling the flips-only filter animates non-flipped rows out and back in when disabled, rather than the table snapping between states
- Reasoning regions and tool output panels expand with an eased height transition and a chevron rotating over roughly 0.2 seconds; terminal output streams incrementally with a streaming indicator that changes when complete
- Submitting a valid adjudication animates the classification mark onto the row and the summary panel count updates with a brief emphasis transition
- Bulk apply animates classification marks onto every selected flipped row in the same interaction rather than snapping silently
- The export drawer and command palette enter and exit with a brief opacity or scale transition; Copy shows a short confirmation before resetting
- Pane switching between agent and scorer trajectories transitions with a short slide or cross-fade, never a full reload
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow — adjudication, bulk apply, undo/redo, export, and import included — remains complete and usable
</motion>

<responsiveness>
- At 1440 pixel width the two trajectories can be shown side by side; at widths of 1024 pixels and below the workspace collapses to one pane at a time with the pane switcher always visible, and selections persist across switches
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the verdict table, code blocks, terminal, export drawer, import surface, and command palette scroll or reflow within their own containers and stay fully operable
</responsiveness>

<accessibility>
- Every interactive control — task and trial rows, the pane switcher, timeline entries, tree rows, disclosure toggles, verdict rows, evidence links, the label switcher, comparison pickers, the flips filter, flip-row checkboxes, bulk apply controls, Undo, Redo, Export, Import, adjudication form fields, and the command palette — is reachable and operable with the keyboard alone, with a visible focus indicator at each stop
- Both trajectory timelines are keyboard operable: arrow keys move the active step, Home and End jump to the first and last steps, and the active entry is programmatically marked as current
- Opening the adjudication form, export drawer, import surface, or command palette moves focus into that surface; closing returns focus to the control that opened it; overlays and expanded panels close on Escape
- Validation messages are associated with their fields so each names the field it belongs to, and placeholder screenshot frames carry descriptive alternative text
- Export copy confirmation and successful import are announced through an aria-live polite region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including export, import, bulk apply, and undo
- Rapidly switching labels, toggling the flips filter, arrowing through both trajectories, and reopening Export stays smooth with no hangs and no surface showing data from a previously active label or step
- Terminal streaming never blocks interaction with the verdict table, either timeline, or the export drawer
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app
- Validation and import errors name the field and the rule broken; empty states explain what belongs in the region and how to clear the flips filter or start adjudicating
- Action labels use specific verbs such as Adjudicate criterion, Export review package, Import review package, Apply classification to selected, Copy, and Download rather than generic labels where a specific one is possible
- No placeholder or filler text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional: a short coachmarks tour that highlights the verdict table, Export review package, and the flips-only filter on first visit, dismissible and never blocking the primary review workflow
- Optional: a compact review activity feed listing the last several adjudication mutations with timestamps, derived from the same store as the summary panel
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the tasks, trials, trajectories, verdicts, and scoring-label collections, the active task and trial, each trajectory's active step, the focused pane, the active scoring label, the two comparison labels, the flips-only filter, flip-row selection, criterion selection and linked highlights, disclosure open flags, terminal streaming status, adjudication records, undo and redo stacks, export preview text, import draft, and command palette state. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Review Package JSON plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Selecting a criterion drives the scorer step highlight, the agent step highlight, and the detail panels from the same shared record; clearing the selection clears all of them
- Switching the active label recomputes the verdict table, rollup bar, and flip flags from the same stored results; the comparison strip and export dimensionRollup read the same records
- Recording, replacing, bulk-applying, undoing, redoing, or importing an adjudication updates the criterion row marks, the summary panel counts, the trial's badge in the task's trial table, and the next Export preview in the same interaction
- Undo and redo mutate the same adjudication collection the verdict table, summary panel, badge, and export read; pane, filter, label, palette, and modal state are shared client state; changing them never reloads the document
- A page reload returns the app to its seeded state: the 3-task list, default labels active, no adjudications recorded, and empty undo and redo stacks
Build tooling: Vite or an equivalent SPA setup. React Aria headless components (tables/grids, tabs, listboxes, selects, dialogs, toggle buttons) styled entirely with Tailwind CSS 4.3.2 (pinned, design tokens in the theme layer) are the component layer; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Tabler icons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — the adjudication form, the bulk apply form, the import surface, and any filter or comparison forms — are driven by React Hook Form validating through a Zod schema that models the adjudication create body and Review Package JSON payloads: the schema defines the field contracts above and inline per-field errors render before submit. The record a successful adjudicate creates is exactly that adjudication create body; Review Package export and a successful import conform to the same field names, enums, and bounds. A markdown rendering library and a syntax highlighting library are allowed for the file renderers and the Review Memo Markdown preview. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed exactly 3 benchmark tasks with 3 trials each; every trial has an agent trajectory of at least 12 mixed-type steps, a scorer trajectory of at least 8 inspection steps with tool panels and placeholder screenshots, a verdict table of at least 12 criteria grouped into four fictional rubric dimensions, and at least 2 named scoring results (one trial has 3) with per-dimension scores, totals, and costs; at least one label pair per trial differs on at least one criterion, and at least 2 flipped criteria exist in the seeded data overall
- Seed every agent trajectory with file changes covering all four badge kinds, and every trial with at least one failed criterion so the adjudicate control is exercisable
- Review Package JSON export must be compiled live from the current store; after any session mutation that changes adjudications, reopening Export review package must include that mutation
- All model, scorer, task, and label names in seed data are fictional; no real product, company, or model-vendor names anywhere
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
- Destinations: task-list; task-detail; review-workspace; agent-trajectory-pane; scorer-trajectory-pane; verdict-table; export-drawer; import-surface; command-palette
- Filters: active-label; comparison-labels; flips-only
- Entity: adjudication
- Entity operations: create; update; select
- Entity fields: criterion-id; classification; rationale; reviewed-at; evidence-step-ids
- Value bounds: {"classification":["agent-bug","rubric-bug","scorer-error"]}
- Form fields: classification; rationale
- Form operations: validate; submit
- Workflow completion: dimension-rollup-scores
- Workflow completion: adjudication-summary-counts
- Workflow completion: trial-adjudication-badge
- Workflow completion: active-step-index
- Workflow completion: review-package-export-preview
- Artifact operations: export; import; copy
- Export formats: review-package-json; review-memo-markdown
- Import modes: review-package

Mechanics exclusions:
- Terminal progressive streaming and its streaming-vs-complete affordance are observed live via Playwright
- Linked-highlight easing, smooth scroll-to-step, rollup-bar segment animation, and flips-filter row enter/exit animations are motion criteria — Playwright-observed; the underlying selection state changes via the bound tools
- Verdict cross-fade on label switch and pane slide transitions stay Playwright-observed
- Evidence-link and criterion-row hover washes and copy-control confirmation stay Playwright-only
- Clipboard contents and downloaded Review Package files remain Playwright responsibilities per artifact-transfer restrictions
- Export drawer enter/exit, Copy confirmation, and command palette open animation stay Playwright-observed
- Bulk checkbox selection and Apply classification to selected use the real toolbar controls; WebMCP entity create/update covers single adjudication parity
- Trajectory step advance and arrow-key scrubbing stay Playwright-observed; active step selection remains entity/browse state

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
