<summary>
Build an evaluation dashboard for a prompt-engineering platform using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and Recharts.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Eval suite management  - 
- The left panel lists the seeded eval suites (at least 3 on first load); each entry shows the suite name, its prompt count, a last-run timestamp, and an average score badge
- Suite create and edit forms model an API-shaped suite request body. Normative payload (all keys required; example values illustrative only): name (string, 1 to 80 characters after trim), promptIds (array of at least one seeded prompt identifier). The visible suite-name field maps to name and the prompt multi-select maps to promptIds; a valid submit creates or updates a suite record whose fields match that payload
- Clicking New Suite opens a modal dialog with a suite name field (required) and a prompt selection multi-select (required, at least one prompt); the Submit control stays disabled until both fields are valid
- Submitting a valid New Suite form closes the modal, adds exactly one new entry to the suite list, and increases the visible suite count by one
- Submitting with an empty suite name, a name longer than 80 characters, or zero prompts selected shows an inline validation message naming the offending field and adds no entry
- Choosing a suite entry's Edit action opens the same modal prefilled with that suite's name and prompt selection; saving updates the entry's name and prompt count in the list without a reload
- Choosing a suite entry's Delete action opens a confirmation dialog; confirming removes exactly that suite from the list; canceling leaves the suite intact
- Toolbar Undo and Redo controls reverse and re-apply the last suite create, edit, or delete; Undo after a create removes that suite from the list, and Redo restores it with the same name and prompt count

Feature: Run execution with visible steps  - 
- Clicking Run Suite starts a simulated evaluation decomposed into one visible step per prompt: each step shows the prompt title and a status that advances visibly through pending, running, and complete or failed; a step that is retrying shows a retrying status
- While a step is running, an inline run log streams progressively  -  log lines appear incrementally as the simulation advances, not all at once  -  and a status affordance distinguishes waiting, running, and complete
- Occasional simulated step failures retry automatically: the step shows a visible backoff countdown and an attempt counter (for example, waiting before retry 2 of 3); a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control
- Activating a failed step's Retry control resumes the run from that step  -  steps already completed keep their original outputs and timestamps and never re-execute
- A running suite can be paused and resumed: pausing freezes step progression at the current step; resuming continues from exactly that step, with completed steps unchanged
- A run-level rollup derives live from the step states  -  completed count out of total (n of m), overall elapsed duration, and failure count  -  and updates as steps advance
- Each run has an event timeline: an ordered log of step transitions with timestamps, filterable by status; selecting a timeline entry highlights the corresponding step in the step list
- When the run finishes, the results panel populates with that run's rows, and the suite entry's last-run timestamp and average score badge update to reflect the new run

Feature: Results table  - 
- The results panel shows a data table with columns: prompt title, model, score (0 to 100), latency in milliseconds, tokens used, and a pass/fail badge; a result is marked Pass when its score is 70 or above and Fail when below 70
- Each result row models an API-shaped eval result record. Normative fields (all required): promptTitle (non-empty string), model (non-empty string), score (number from 0 to 100 inclusive), latencyMs (non-negative integer), tokens (non-negative integer), passFail (exactly pass when score is 70 or above, otherwise fail), promptText (non-empty string), response (non-empty string), scoringBreakdown (array of at least one object with dimension string and score number from 0 to 100)
- Clicking any column header sorts the table by that column ascending; clicking the same header again sorts descending, reversing the row order relative to ascending
- Clicking a result row opens a detail panel showing the full prompt text, the model response, and a scoring breakdown listing each rubric dimension with its individual score
- The scoring breakdown in the detail panel sits inside a collapsible disclosure region that is collapsed by default, expands and collapses on activation with a rotating chevron cue, and remembers its open state per result while the app is open
- Selecting a different suite in the left panel swaps the results table, the charts, and the detail panel context to that suite's latest run without a reload

Feature: Score charts  - 
- A bar chart above the results table shows the average score per model for the selected suite's latest run; hovering a bar with the real pointer shows a tooltip with the model name and the exact score
- A line chart below the bar chart shows the average-score trend over the selected suite's last 7 eval runs; the x-axis shows run dates and the y-axis shows average score
- Completing a new run appends a new point to the line chart and redraws the bar chart from the new run's results  -  both charts change when their input data changes

Feature: Model comparison  - 
- A toolbar toggle switches the main area to a comparison view: a side-by-side table with one column per model, one row per prompt, and each cell showing that prompt's score and latency for that model
- Toggling the comparison control again returns to the results view with the previously applied sort still in effect
- The score shown in any comparison cell matches the score shown for the same prompt and model in the results table

Feature: Night mode scheduling  - 
- A Night Window settings control in the toolbar opens a form that models an API-shaped night-window payload. Normative fields (all required): startTime and endTime as 24-hour HH:MM strings; endTime must be strictly after startTime on the same clock day. Saving stores the window and the toolbar shows the configured window
- Submitting the night-window form with a missing time, a value that is not HH:MM, or an end time not after the start time shows inline validation messages naming the offending field and does not save
- A Night Mode toggle on a suite entry marks that suite to run automatically during the configured night window; the entry shows a moon icon badge while scheduled and the badge disappears when the toggle is turned off

Feature: Results export and import (useful end state)  - 
- An Export results control opens a drawer with JSON and CSV tabs compiled live from the selected suite's latest run in the session store. Both tabs MUST reflect every completed run and every suite mutation that changed the selected suite's latest results  -  an export that omits session work is a failure
- Normative JSON shape (all keys and nesting required; example values illustrative only): version (exactly 1), suite object with name (string), promptCount (positive integer), nightMode (boolean), run object with id (non-empty string), startedAt (ISO-8601 datetime string), finishedAt (ISO-8601 datetime string), averageScore (number 0 to 100), passCount (non-negative integer), failCount (non-negative integer), totalLatencyMs (non-negative integer), totalTokens (non-negative integer), and results (array of eval result records matching the Results table field contract above). After completing a new run, a fresh export's results array length equals the visible results table row count, and each exported score matches the corresponding table row
- The CSV tab shows CSV-shaped text with header line promptTitle,model,score,latencyMs,tokens,passFail and one data line per result in the latest run; values match the JSON results array for the same prompts
- Download JSON offers a real file download named eval-run-results.json whose body matches the JSON tab. Download CSV offers eval-run-results.csv whose body matches the CSV tab. Copy on the active tab puts that tab's text on the clipboard and shows a visible Copied confirmation that clears within 5 seconds
- An Import results control accepts a previously exported results JSON (file picker or paste). A successful import replaces the selected suite's latest-run results with the imported document; the results table, both charts, the suite average score badge, and a subsequent export all match the imported run. Malformed JSON, a document missing required keys, a score outside 0 to 100, or a passFail that disagrees with its score shows a visible inline error naming the import field and changes nothing
</core_features>

<user_flows>
- Running a suite end to end: selecting a suite and clicking Run Suite advances the step statuses one prompt at a time while the run log streams, the rollup counts up to n of m complete, then the results table populates, the bar chart redraws with the new per-model averages, the line chart gains one new trend point, and clicking any result row opens a detail panel whose prompt title, model, and score match that row  -  all without a reload
- Recovering from a failure: when a step exhausts its retries and is marked failed, the rollup's failure count increases; activating that step's Retry control resumes the run from that step and, on success, the failure clears from the step while the earlier steps' outputs remain unchanged
- Pausing mid-run: pausing freezes the step list and rollup at the current step; resuming continues from exactly that step and the event timeline shows the pause and resume transitions in order
- Creating a suite end to end: submitting New Suite with a valid name (1 to 80 characters) and at least one prompt adds the entry to the list with its prompt count; running it produces its first results and its average score badge appears on the entry
- Sorting the results table by score ascending then descending reverses the row order relative to ascending; switching between the results view and the comparison view preserves the underlying data  -  the same prompts and models appear in both with matching scores
- Export flow: after completing a run on the selected suite, open Export results; the JSON tab's results array length matches the visible table row count and each score matches the table; the CSV tab contains those same promptTitle values; Download JSON and Download CSV offer eval-run-results.json and eval-run-results.csv; Copy shows Copied
- Import round-trip flow: export JSON after a completed run, note the exported averageScore and first promptTitle, clear or overwrite the suite's latest results so the table no longer matches, then Import that JSON  -  the table, charts, suite badge, and a fresh export reconstruct to match the imported document
- Undo flow: create a suite, then activate Undo  -  the suite disappears from the list and the count decreases by one; Redo restores that suite with the same name and prompt count
- A page reload returns the app to its seeded state: the seeded suites, their historical runs, the default view, no night-mode schedules, and no unsaved export drawer state
</user_flows>

<edge_cases>
- Running the same suite a second time replaces the latest-run results and appends one new point to the trend chart; the trend chart never shows more than the last 7 runs
- Double-activating the Run Suite control starts exactly one run: the step list fills once, one new set of results appears, and the trend chart gains exactly one point
- Double-activating the New Suite Submit control creates exactly one suite: the suite count increases by one and one new entry appears
- Deleting the currently selected suite clears the results panel and charts to an empty state with a message and a control to select or create a suite
- A prompt title longer than 60 characters is truncated with an ellipsis in the results table row and shown in full in the detail panel
- When a suite has never been run, the results panel shows an empty state explaining that running the suite will populate results, instead of an empty table; Export results in that state still opens the drawer with JSON version 1, suite metadata, an empty results array, and CSV with only the header line
- Filtering the event timeline to a status with no entries shows an empty state message in the timeline region rather than a blank area
- Importing a JSON document whose passFail is pass while score is below 70, or whose results omit promptTitle, shows an inline validation error and leaves the current results unchanged
- Undo with no prior suite mutation leaves the suite list unchanged and does not invent a delete; Redo with nothing to redo is a no-op
</edge_cases>

<visual_design>
- Layout: a left sidebar containing the suite list, and a main content area with a chart strip on top and the results table below it; the run step list and event timeline render alongside the results panel while a run is active or selected; Export results and Import results sit in the toolbar with Undo and Redo
- Score badges use semantic colors: green for scores 80 to 100, yellow for 60 to 79, red for below 60, applied consistently on suite entries and anywhere average scores appear
- Pass/fail badges use distinct success and danger colors: green for Pass, red for Fail, consistent across the results table and detail panel
- Step statuses are visually distinct at a glance: pending, running, retrying, failed, and complete each carry a distinct color or icon treatment, consistent between the step list and the event timeline
- Chart series use one consistent accent palette: the primary model uses the brand accent and each additional model uses a distinct supporting accent, with the same model-to-color mapping in the bar chart and the comparison view
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than table body and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the sidebar, chart strip, table, and detail panel are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the toolbar, suite entries, step statuses, and row actions
- The export drawer shows JSON and CSV tabs with a scrollable preview, Download, and Copy affordances, visually consistent with other Carbon overlays
</visual_design>

<motion>
- Result rows animate into the table one by one as the eval run progresses, roughly 80 milliseconds apart, driven by the real Run Suite control
- Chart bars grow from zero height over roughly 400 milliseconds when a suite's results first render
- Step status changes animate: the running indicator shows continuous activity, a completing step's status transitions with a short fade rather than snapping, and the retry countdown ticks visibly
- Hover animations (required): buttons ease background and shadow with a slight press effect; suite entries, table rows, and timeline entries take a full-width hover wash; form controls show focus rings
- The New Suite and confirmation modals enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- The detail panel slides in from the side when a row is clicked and slides out when closed; the scoring-breakdown disclosure expands with its chevron rotating
- The export drawer slides in from the side rather than snapping open, and exits the same way
- Feedback toasts after creating, deleting, and completing a run slide in, remain readable, and auto-dismiss with a fade
- The moon icon badge animates in when Night Mode is toggled on rather than appearing instantly
- With prefers-reduced-motion set, all rows and bars appear simultaneously and all transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the suite sidebar collapses behind a toggle control that opens it as an overlay; at desktop widths the sidebar is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the results and comparison tables scroll within their own containers
- The export drawer, import control, and Undo/Redo stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control  -  suite entries, toolbar controls including Export results, Import results, Undo, and Redo, table headers, row actions, step retry and pause/resume controls, form fields  -  is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals and the export drawer trap focus while open, close on Escape, and return focus to the control that opened them
- The completion of an eval run, and a step entering the failed state, are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including export, import, undo, and redo
- The UI stays responsive under rapid repeated input  -  quick suite switches, rapid sort clicks, fast view toggles, opening the export drawer  -  with no hangs or dropped interactions, including while a run is streaming
</performance>

<writing>
- Toolbar and drawer actions use specific labels: New Suite, Run Suite, Export results, Import results, Download JSON, Download CSV, Copy, Undo, and Redo
- Empty-state copy explains that running the suite populates results, and export empty-state copy still names the JSON and CSV artifacts
- Validation messages name the offending field (suite name, prompt selection, night start time, night end time, or import) and state what is required
- Pass and Fail badge text, step status labels, and chart axis labels use consistent terminology across the results table, comparison view, and export preview
</writing>

<innovation>
- Beyond the specified surfaces, polish that helps operators trust eval output is welcome: for example, a compact pass-rate sparkline on suite entries, keyboard shortcuts shown for Undo/Redo, or a run-diff highlight when import replaces results  -  optional and not required for a complete build
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the suites collection, run history and results, per-run step statuses with attempt counts and checkpoints, the streaming run log, the event timeline and its status filter, run-level rollups, per-result disclosure open flags, the selected suite, the active main view (results or comparison), table sort state, detail-panel selection, the night window and per-suite schedules, undo/redo history for suite mutations, export drawer state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid suite increases the collection and shows the new entry; the visible suite count updates; the created record matches the API-shaped suite payload (name, promptIds)
- Editing a suite updates that entry everywhere it appears (list entry, results header, comparison view, export suite metadata)
- Deleting a suite removes it from the list, the selection, and any derived surfaces
- Advancing a step updates the step list, the event timeline, and the run rollup from the same shared run state; pausing and resuming preserve completed steps' outputs and timestamps
- Completing a run updates the suite's last-run timestamp, average score badge, results table, both charts, and the export preview from the same shared results data
- Table sort, timeline status filter, and view toggles recompute what is visible from the shared collection; they do not create a second disconnected copy
- The night window and per-suite schedules are shared client state; toggling them does not reload the document
- Export JSON and CSV are compiled live from the shared store; Import replaces the selected suite's latest-run results in that same store; Undo and Redo mutate the same suites collection
- The eval-run results export is the session's useful end state: Download and Copy must emit live-compiled JSON or CSV that reflects every completed run's actual scores; Import round-trips a valid results JSON back into the visible surfaces
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome  -  modals, data tables, tags/badges, toolbar controls, notifications, and form controls; no other component library. Recharts for the score and trend charts. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm  -  no raw copy-pasted SVG icon sets. All forms  -  New Suite, Edit Suite, the night-window settings form, and import validation  -  are driven by React Hook Form validating through a Zod schema that mirrors the API-shaped payloads above: the schema defines the rules and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; eval execution is simulated with realistic latency, occasional simulated step failures, and randomized scores, so two runs of the same suite produce different (not identical) result sets.
- Seed at least 3 suites with at least 5 prompts each, and at least 7 historical run records per suite, so the suite list, results table, and both charts are non-empty on first load
- Submitting New Suite with empty required fields or out-of-bounds name length must not increase the suite count; show visible validation feedback
- When the selected suite is deleted or a suite has never been run, show an empty state in the results region
- Zero navigational outbound links for app chrome  -  in-app controls only; view changes via shared client state
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
- entity-collection-v1
- command-session-v1
- browse-query-v1
- artifact-transfer-v1

Module specs:
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
- Entity: suite
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; prompts; last-run; average-score; night-mode
- Session operations: start; pause; resume; restart
- Destinations: results; comparison; export-drawer
- Browsable entity: results
- Filters: timeline-status
- Sorts: prompt-title; model; score; latency; tokens; pass-fail
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: results-json
- Workflow completion: export drawer preview updates after a completed run and results array length matches the visible results table row count
- Workflow completion: importing results-json replaces the selected suite latest-run results table, charts, and suite average score badge to match the imported document

Mechanics exclusions:
- Score charts: bar/line hover tooltip and bar-grow animation stay Playwright-observed
- Run execution with visible steps: streaming run log incremental appearance, retry backoff countdown ticking, and step-status fade animations stay Playwright-observed
- Results table: detail-panel slide-in and disclosure chevron rotation stay Playwright-observed
- Export drawer slide-in animation stays Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Clipboard contents of Copy are verified via Playwright, never returned in WebMCP results
- Suite and night-window form field validation stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
