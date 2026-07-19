<summary>
Build a batch job runner for an AI inference platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Job composer —
- Clicking New Job opens a modal dialog with: job name (required), prompt template selector (required, choosing from the at least 5 seeded prompt templates), model selector (required, choosing from the 4 seeded models — atlas-40b, lyra-8b, quasar-mini, and helix-2 — each shown with its per-1,000-token rate), and a concurrency limit control accepting 1 through 5 with a default of 3
- The dataset area of the composer offers two paths: picking one of the at least 2 seeded dataset slices, or pasting a JSON array or CSV text into a text area; either path renders a preview table below with columns mapped from the detected dataset fields and a row count badge showing the number of detected input rows
- When the chosen dataset includes an expected-output field, the preview notes that expected outputs were detected; datasets without that field preview without it
- The composer's Submit control stays disabled until the job name, prompt template, and model are valid and at least one dataset row is detected
- Submitting with zero detected dataset rows shows an inline validation message naming the dataset field and creates no job
- Pasting malformed JSON or CSV shows an inline parse error describing the problem, and no rows are committed to the preview
- The composer validates against one job payload shape with per-field messages: a job name longer than 80 characters is rejected with a message naming the 80 character limit, a concurrency value outside 1 through 5 is rejected inline, and a pasted dataset row missing the required input field is listed by row number in the dataset error
- Submitting a valid composer form closes the modal, adds exactly one job to the sidebar in a Ready state, and increases the visible job count by one
- A job's scheduled window, when one is configured, is visible in the composer when editing that job

Feature: Launch and execution grid —
- Clicking Launch on a Ready job starts the simulated batch and renders a per-item execution grid with one row per dataset row, showing: row index, input summary (first 60 characters), status, attempt count, latency in milliseconds, and accumulated item cost
- Item statuses advance visibly through pending, running, and complete or failed; an item that is retrying shows a retrying status with its attempt counter
- At most the job's configured concurrency limit of items are in the running state at any moment; a concurrency guard strip shows the current running count against the limit (for example 3 of 3 running) and takes an amber treatment while the limit is saturated
- A deterministic subset of items fails on its first attempt, and the same items fail on every launch of the same job configuration; a failing item retries automatically with a visible backoff countdown and attempt counter (for example, waiting before retry 2 of 3)
- An item that exhausts its retries is marked failed with an inline error summary; items that succeed record their simulated output, latency, and cost
- The execution grid is virtualized: the seeded large job has at least 200 items, and scrolling the grid during an active run stays smooth with no rendering lag
- A full-width progress bar above the grid fills proportionally as items complete, with a live fraction label (for example 42 of 200)

Feature: Pause, resume, and retry —
- Pausing a running job freezes item progression at a checkpoint: no new items start, running items settle, and completed items keep their outputs, timestamps, and costs unchanged
- Resuming continues from exactly the checkpoint: only items that were pending or interrupted proceed, and previously completed items never re-execute
- A Retry failed items control re-queues only the failed items of the selected run; completed items keep their original outputs and timestamps, and the rollups update as the retried items resolve
- The Retry failed items control is disabled (or explains there is nothing to retry) when the selected run has no failed items

Feature: Bulk run macros —
- Start All, Pause All, and Stop All controls act on the whole grid optimistically: item statuses flip immediately in the grid, affected rows show a brief reconciling indicator, and each row settles into its confirmed state within a moment
- Stop All marks pending and running items as stopped without discarding the outputs of items that already completed

Feature: Pending-queue priority reordering —
- A pending-queue panel lists the items not yet started in their launch order; dragging an entry to a new position reorders the queue, and each entry also has keyboard-operable move up and move down controls
- Queue order governs launch order: after moving an item ahead of others, that item enters the running state before the items it passed

Feature: Live rollups —
- A rollup strip derives live from item states: completed count out of total (n of m), failure rate as a percentage, estimated time remaining, and accumulated simulated cost computed from each item's model rate and token usage; all four update as items advance
- Pausing the run freezes the estimated-remaining value until resume

Feature: Result inspector —
- Clicking an item row opens an inspector panel with the full input text, the full simulated output, and an attempts log listing each attempt with its timestamp and outcome
- When the item's dataset row includes an expected output, the inspector adds a comparison view that marks matching and differing segments between the expected and actual output with visually distinct treatments plus a match or mismatch badge; the distinction is carried by more than color alone

Feature: Run history, timeline, and comparison —
- Each job keeps a run history list showing each run's start timestamp and outcome counts (complete, failed, stopped); selecting a history entry loads that run's grid, rollups, and timeline
- Each run has an event timeline: an ordered log of item status transitions with timestamps, filterable by status; selecting a timeline entry highlights the corresponding grid row
- A Compare runs view lets the user pick two runs of the same job and shows per-item outcomes side by side, one row per item; items whose outcome differs between the two runs are flagged with a distinct flip marker, and a summary line counts the flips
- The flip flags in the comparison view agree with the underlying data: a flagged item genuinely shows different statuses in the two runs' grids

Feature: Off-hours scheduling and calendar export —
- A Schedule control on a job opens a form with a window start time and end time (both required); saving marks the job scheduled, shows a schedule badge with the window on the job's sidebar entry, and the badge disappears when the schedule is removed
- Submitting the schedule form with a missing time or an end time not after the start time shows inline validation messages naming the offending field and does not save
- A Simulate window start control triggers the scheduled jobs as if their window began: each scheduled Ready job launches and its grid begins advancing
- A Copy schedule as calendar text control opens a monospaced text block containing an ICS-format calendar (a BEGIN:VCALENDAR block with one VEVENT per scheduled job carrying its name and window times) and a copy control that gives visible confirmation and places the exact text on the clipboard

Feature: Export run report —
- Download JSON and Download CSV controls export the selected run as a report containing the job configuration (name, prompt template, model, concurrency), per-item outcomes (status, attempts, latency, cost, and output), the rollup values, and the event timeline
- The export derives from live session state: outcomes changed in this session — retried items, a pause and resume, stopped items, reordered launches — appear in the report exactly as the grid and rollups currently show them
- The JSON report conforms to the same job payload shape the composer validates: its configuration object carries exactly the name, prompt template, model, concurrency, and schedule fields, and each item entry carries index, input, output, status, attempts, latency, and cost, with status drawn from the closed set pending, running, complete, failed, retrying, stopped

Feature: Undo and redo —
- Toolbar Undo and Redo controls apply to state edits: job creation, job edits, job deletion, queue reorders, and schedule changes; each control is disabled when there is nothing to undo or redo
- Undoing a job deletion restores the job together with its run history; redo re-applies the deletion

Feature: Job sidebar —
- A left sidebar lists every job with its name, created date, row count, and current status; selecting a job loads its detail into the main panel and highlights the active entry
- A job's Delete action opens a confirmation dialog; confirming removes the job and its runs, and canceling leaves it intact
</core_features>

<user_flows>
- Durable pipeline end to end: composing a job from pasted CSV, launching it, watching the deterministic failures retry with countdowns, letting one item exhaust retries into failed, activating Retry failed items, pausing mid-run, resuming from the same checkpoint, and letting the run finish produces an export whose per-item statuses, attempt counts, and costs match the grid exactly and whose rollup values match the rollup strip
- Reordering mid-run: moving a pending item to the front of the queue while a run is active results in that item entering the running state before the items it passed
- Comparing runs: launching the same job twice and opening Compare runs flags exactly the items whose outcomes differ between the two runs
- Undo round trip: deleting a job, undoing the deletion, and selecting the job shows its runs and results intact; redo removes it again
- A page reload returns the app to its seeded state: the seeded jobs and their run history, the default view, and no schedules
</user_flows>

<edge_cases>
- Double-activating Launch starts exactly one run: the grid fills once and one new run history entry appears
- Double-activating the composer's Submit control creates exactly one job
- Deleting the selected job clears the main panel to an empty state with a message and a control to select or create a job
- An input longer than 60 characters is truncated with an ellipsis in the grid row and shown in full in the inspector
- Exporting after Stop All records the stopped items as stopped, not as complete
- Filtering the event timeline to a status with no entries shows an empty state message rather than a blank region
</edge_cases>

<visual_design>
- Layout: a left sidebar with the job list, and a main area with the rollup strip and progress bar on top, the execution grid in the center, and the inspector opening as a side panel; the pending queue and event timeline render alongside the grid while a run is active or selected
- Item statuses are visually distinct at a glance: pending in a neutral treatment, running with a blue active indicator, retrying in amber, failed in red, complete in green, and stopped in a distinct muted treatment — consistent between the grid, the pending queue, the timeline, and the comparison view
- The concurrency guard strip is visually calm below the limit and switches to a clearly amber saturated treatment while the running count equals the limit
- Costs render with one consistent currency format (dollar sign and a fixed number of decimal places) in the grid, rollup strip, inspector, and exports
- The active sidebar job is highlighted with a selected-layer background distinct from hover
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than grid body and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the sidebar, rollup strip, grid, queue, and inspector are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the toolbar, sidebar entries, status cells, and row actions
- The ICS calendar text renders in a monospaced block visually distinct from surrounding UI text
</visual_design>

<motion>
- Newly completed items animate into their settled state one at a time as the simulation finishes them, roughly 60 milliseconds apart, driven by the real Launch control
- The progress bar advances smoothly with an eased width transition rather than jumping between fractions
- Status changes animate: the running indicator shows continuous activity, a completing item's status transitions with a short fade rather than snapping, and the retry backoff countdown ticks visibly second by second
- Queue reordering animates: a dragged entry settles into its slot with a short transition, and a keyboard move slides the entry rather than teleporting it
- The optimistic macros animate the flip: rows transition to their new status together and the reconciling indicator resolves with a subtle fade
- Hover animations (required): buttons ease background and shadow with a slight press effect; sidebar entries, grid rows, queue entries, and timeline entries take a full-width hover wash; form controls show focus rings
- The composer, schedule, and confirmation modals enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- The inspector panel slides in from the side when a row is clicked and slides out when closed
- Feedback toasts after creating, deleting, exporting, copying the calendar text, and completing a run slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, rows and statuses appear immediately, the bar jumps to its current value, and all transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the job sidebar collapses behind a toggle control that opens it as an overlay; at desktop widths the sidebar is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the execution grid and comparison view scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — sidebar entries, toolbar controls, macros, grid rows, queue reorder controls, retry and pause/resume controls, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator; queue reordering is fully achievable with the keyboard move controls
- Modals trap focus while open, close on Escape, and return focus to the control that opened them
- Run completion, an item entering the failed state, and pause/resume transitions are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Status and diff distinctions are carried by more than color alone (icons, text labels, or markers accompany the color)
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive while the 200-item seeded job runs: scrolling the grid, opening the inspector, and reordering the queue mid-run show no hangs or dropped interactions
- Rapid repeated input — quick job switches, rapid macro clicks, fast timeline filtering — causes no freezes or dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the jobs collection, per-job dataset rows, run history, per-item statuses with attempt counts, checkpoints, and costs, the pending-queue order, concurrency state, rollups, the event timeline and its status filter, comparison selections, schedules, the undo/redo history, inspector and sidebar selection, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid job adds it to the sidebar and updates the visible job count
- An item advancing updates the grid, the progress bar, the rollup strip, and the event timeline from the same shared run state; pausing and resuming preserve completed items' outputs and timestamps
- Retry failed items re-runs only failed items; completed items are never re-executed by retry, resume, or a second Launch guard
- Queue reorders change the shared launch order that the running simulation consumes
- Undo and redo replay the same store commands the visible controls use; undone state is reflected everywhere the affected job appears
- Exports derive from the same shared run state the grid and rollups render; they do not use a second disconnected copy
- Schedules and the timeline filter are shared client state; changing them does not reload the document
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, data tables, tags/badges, progress bars, toolbar controls, notifications, and form controls; no other component library. Papa Parse for CSV parsing. TanStack Virtual for the virtualized execution grid. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the job composer and the schedule form — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. All forms validate one shared job payload schema — name (1 to 80 characters), prompt template and model from their seeded sets, concurrency (integer 1 through 5), dataset rows each carrying a required input field and an optional expected field, and an optional schedule whose end is after its start — and the JSON export serializes that same shape, so field names, bounds, and enums match between the composer, the grid, and the report. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; inference is simulated with randomized outputs, latencies, and token counts, while the subset of items that fails on first attempt is deterministic per job configuration, so two launches of the same job differ in outputs but fail on the same items.
- Seed 4 models named atlas-40b, lyra-8b, quasar-mini, and helix-2, each with a visible per-1,000-token rate; seed at least 5 prompt templates and at least 2 dataset slices, at least one slice including expected outputs
- Seed at least 2 completed jobs with at least 30 rows each and run history, plus 1 Ready job with at least 200 rows, so the sidebar, grids, and history are non-empty on first load
- Submitting the composer with empty required fields or zero rows must not increase the job count; show visible validation feedback
- When the selected job is deleted, show an empty state in the main panel
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
- browse-query-v1
- form-workflow-v1
- command-session-v1
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
- Browsable entity: jobs
- Destinations: job-sidebar; job-detail; execution-grid; pending-queue; event-timeline; run-history; compare-runs; result-inspector; export
- Filters: timeline-status; run-history-selection; compare-run-pair
- Form fields: job-name; prompt-template; model; concurrency; dataset-slice; dataset-paste; schedule-window-start; schedule-window-end
- Form operations: validate; submit; cancel
- Value bounds: {"job-name":"1 to 80 characters; over 80 rejected naming the limit","model":["atlas-40b","lyra-8b","quasar-mini","helix-2"],"prompt-template":"one of the at least 5 seeded prompt templates","concurrency":"integer 1 to 5, default 3","dataset":"at least one detected row; each row requires an input field, optional expected field; malformed JSON/CSV rejected with a parse error and rows missing input listed by row number","item-status":["pending","running","complete","failed","retrying","stopped"],"schedule":"start and end both required; end must be after start"}
- Session operations: start; pause; resume; stop; restart; trigger_demo
- Demos: simulate-window-start
- Artifact operations: export; copy
- Export formats: run-report-json; run-report-csv; ics-calendar-text
- Workflow completion: a valid composer submit adds exactly one Ready job to the sidebar and increments the visible job count by one
- Workflow completion: Launch (start) fills the per-item grid once; the same deterministic subset of items fails first-attempt on every launch of the same configuration
- Workflow completion: pause freezes items at a checkpoint; resume proceeds only pending/interrupted items and never re-executes completed items
- Workflow completion: restart (Retry failed items) re-queues only failed items of the selected run and the rollup strip follows as they resolve
- Workflow completion: stop (Stop All) marks pending and running items stopped while completed outputs, timestamps, and costs stay unchanged
- Workflow completion: simulate-window-start launches every scheduled Ready job and their grids begin advancing
- Workflow completion: run-report-json carries the composer's job payload shape (name, prompt template, model, concurrency, schedule) plus per-item index, input, output, status, attempts, latency, cost with status from the closed six-value set, matching the grid and rollups exactly
- Workflow completion: ics-calendar-text is a BEGIN:VCALENDAR block with one VEVENT per scheduled job carrying its name and window times

Mechanics exclusions:
- Backoff countdown ticking, attempt-counter progression, and the ~60 ms per-item settle stagger are timing mechanics observed via Playwright
- Pending-queue drag reordering, its slot-settle animation, and the keyboard move-up/move-down slide are gesture/animation mechanics driven through the real controls (queue-order-governs-launch-order is then observed in the grid)
- Optimistic macro flips and the reconciling-indicator fade are timing behavior observed via Playwright
- Virtualized-grid scroll smoothness on the 200-item job and progress-bar eased fill stay Playwright-observed
- Job Delete and its confirmation dialog are graded through the real dialog path when the confirmation is the criterion
- Undo/Redo toolbar controls are graded through the real controls so disabled-state and restore semantics are observable
- Clipboard contents of the calendar copy and downloaded JSON/CSV files remain Playwright responsibilities; no raw file paths or blobs in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
