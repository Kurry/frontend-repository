<summary>
Build a benchmark task factory dashboard using React, Zustand, Tailwind CSS 4.3.2, and shadcn/ui.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit). The product is an internal dashboard for a benchmark task factory: it watches merged pull requests on a code-hosting platform, converts qualifying ones into agent evaluation tasks, validates each task, and analyzes trial outcomes. All platform, repository, and check data is fictional and simulated in the client.

Feature: Repositories view —
- The app opens into a Repositories view seeded with at least 4 fictional repositories (for example quartz-orm, copperline, fernweh-gateway, lattice-db); each repository entry shows its name, primary language, the count of pull requests processed, the count of tasks produced, and a yield percentage that equals tasks produced divided by pull requests processed, rounded to a whole percent
- Selecting a repository swaps the main canvas to that repository's pull-request pipeline view without a full page reload, and a visible control returns to the Repositories view

Feature: Pull-request pipeline view —
- Each repository's pipeline view lists at least 8 seeded pull requests; every row shows the pull-request number, title, source-file count, and a linked-issue chip when an issue is linked (rows without a linked issue show a visible no-linked-issue marker instead)
- Every pull-request row renders a stage strip of exactly 5 named stages in fixed order — Fetch, Evaluate, Skeleton, Generate, Validate — and each stage displays exactly one of the statuses pending, running, complete, failed, or skipped with visually distinct treatments and a readable status label or tooltip
- Rejected pull requests display a rejection reason chip whose text is one of exactly five values: docs-only, formatting-only, too-few-files, too-many-files, no-linked-issue; no other rejection reason text appears anywhere in the app
- The seeded data includes, in at least one repository, at least one pull request in each of these situations: fully complete and accepted, rejected with a reason chip, and mid-pipeline with at least one stage still pending or running

Feature: Validation detail —
- Opening a pull request that reached the Validate stage shows a task detail with two paired check cards presented side by side: a baseline check described as tests must fail on the reproduced bug, and a reference check described as tests must pass with the fix applied
- Each check card shows its own status, an attempt count, and an expandable log excerpt that is collapsed by default and expands and collapses on activation
- A task shows an accepted badge only when both the baseline check and the reference check show a passing status; a task where either check is failing or pending shows no accepted badge, and the badge appears or disappears when the underlying check states change

Feature: Trial analysis —
- An accepted task's detail shows a trial analysis panel seeded with at least 6 trials, each classified with exactly one verdict from: good-success, bad-success, good-failure, bad-failure, infrastructure-error
- The panel renders a distribution bar whose segments are proportional to the verdict counts, and activating a verdict (in the bar or its legend) filters the trial list below to only trials with that verdict; a clear control restores the full trial list
- When any trial on an accepted task carries the bad-success verdict, a needs-review banner is visible on that task's detail; a task with zero bad-success trials shows no such banner

Feature: Create-task flow —
- A Create task control opens a form with a repository select, a pull-request number field, and minimum and maximum source-file bound fields; submitting with an empty or non-numeric pull-request number shows an inline message naming the pull-request number field and starts no run
- Entering a minimum file bound greater than the maximum file bound shows a cross-field validation message that names both bounds, and the submit control stays disabled while the form is invalid
- Create-task request-body field contract (a successful submit record IS the would-be request body that seeds the simulated run): required repository (exactly one seeded repository id/name from the select), required pullRequestNumber (positive integer string of 1–6 digits), required minFiles and maxFiles (integers 1–500). Cross-field: minFiles must be less than or equal to maxFiles. Violations keep submit disabled with named field errors and start no run.
- Submitting a valid form starts a simulated pipeline run for that pull request: a new row appears in the chosen repository's pipeline view, and its stage strip advances visibly through Fetch, Evaluate, Skeleton, Generate, and Validate, each stage moving from pending to running to complete over a perceivable interval rather than snapping instantly to done
- Every simulated run includes at least one stage failure: the failing stage shows a failed or retrying status with a visible attempt count that increments on each retry, and when a retry succeeds the run resumes from that stage — stages that already completed keep their completed status and timestamps and are never re-run from the start
- When the run's Validate stage completes with both checks green, the new task gains the accepted badge and the owning repository's tasks-produced count and yield percentage update without a reload

Feature: Factory event timeline —
- A factory event timeline lists ordered, timestamped entries for stage transitions (stage started, stage completed, stage failed, retry scheduled, task accepted); entries from a newly created run append at the top or bottom consistently while the run advances, without a reload
- The timeline can be filtered by event status, and filtering never removes entries from the underlying record: clearing the filter restores the full timeline

Feature: Factory analytics charts —
- An analytics area renders three charts from the shared data: a tasks-per-week timeline, a language distribution breakdown, and a difficulty histogram; hovering a bar, slice, or point with the pointer shows a tooltip containing the underlying value
- When a created run completes and its task is accepted, the tasks-per-week chart and the language distribution chart change to include the new task without a reload

Feature: Task manifest —
- An accepted task's detail renders its task manifest in a monospaced code block with a format label, a Copy control, and a Download task-manifest.json control. The manifest updates live when the run completes without a reload.
- Task-manifest field contract (Copy and Download share this schema — export reflects the accepted task's actual create request plus outcomes): required keys schemaVersion (number exactly 1), id (non-empty string), repository (matches the create request), pullRequestNumber (same positive integer), minFiles, maxFiles (same integers with minFiles ≤ maxFiles), checks (object with required boolean keys skeleton and validate, both true on accepted tasks), stages (array of five objects in order Fetch, Evaluate, Skeleton, Generate, Validate each with required status one of pending|running|complete|failed and attemptCount integer ≥ 1), and generatedAt (ISO-8601 datetime ending in Z). An export that omits the session-created task or its completed stages is invalid. A factory-wide Export accepted tasks control (when present on Timeline/Analytics) emits a JSON array of those manifests for every accepted task in the session; creating a new accepted task increases that array length by one.
</core_features>

<user_flows>
- Creating a task end to end: submit the create form with valid values, watch the new row's stage strip advance through all five stages including one visible failure-and-retry, and confirm that on completion the repository's tasks-produced count increases by exactly one, its yield percentage recomputes, the tasks-per-week chart includes the new task, and the event timeline contains that run's stage entries — all without a page reload
- Retry and resume: during a created run, observe the failing stage's attempt count increment, then observe the run resume from that stage while every earlier stage keeps its completed status and timestamp unchanged
- Verdict filtering: on an accepted task, activate the bad-success verdict, confirm the trial list shows only bad-success trials and the needs-review banner is visible, then clear the filter and confirm the full trial list returns
- Navigation round trip: move from Repositories to a repository pipeline to a task detail and back; the previously applied filters and expanded log excerpts in the detail keep their state while the app stays open
- A page reload returns the app to its seeded state: the seeded repositories, pull requests, trials, and timeline, with the default view active
- Manifest export flow: complete a create-task run to accepted, open the task detail, confirm the monospaced manifest includes that pullRequestNumber and file bounds, Copy and Download emit the same text, and a second create that reaches accepted increases any factory-wide export length by one
</user_flows>

<edge_cases>
- Submitting the create form with an empty pull-request number, a non-numeric value, or minimum greater than maximum shows the corresponding inline messages and starts no run; the pipeline row count is unchanged
- Double-activating the create form's submit control starts exactly one run: exactly one new row appears
- When a verdict filter or timeline filter matches nothing, the filtered region shows an empty state message with a control that clears the filter, never a blank or broken panel
- Cancel or close on the create form leaves all collections unchanged
- A pull-request title longer than 60 characters is truncated with an ellipsis in the row and shown in full in the detail
</edge_cases>

<visual_design>
- Operations dashboard composition: a fixed left navigation listing Repositories, Timeline, and Analytics destinations plus the Create task control, and a main canvas that changes per destination; the pipeline view uses a dense table register with the stage strip inline per row
- Stage status color system applied consistently everywhere a status appears: pending in muted neutral, running in an animated accent, complete in green, failed in red, skipped in a hatched or dimmed treatment — always paired with a readable label or tooltip, never color alone
- Verdict color coding: the five verdicts use five distinct hues, and the distribution bar segments, verdict chips, and legend swatches use the same hue per verdict
- Typography hierarchy: page titles visibly larger than section headings, which are larger than table body and chip text; numeric rollups (counts, yield percentages) render in a tabular, aligned style
- Cards with hairline borders and subtle shadows for check cards, trial panels, and chart cards; the manifest and log excerpts render on a visually distinct monospaced surface
- One consistent icon set across nav, chips, status markers, and controls
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows and nav items take a full-width hover wash; chips and interactive segments show a hover treatment; form controls show focus rings
- The create form dialog enters and exits with a short opacity and scale transition of roughly 200 to 300 milliseconds
- During a simulated run the currently running stage carries a visible animated indicator (pulse or spinner) that settles when the stage completes; a newly created run's row animates into the pipeline table, and new timeline entries animate in rather than popping
- Log excerpt disclosures expand and collapse with a smooth height transition and a chevron that rotates on open and close
- Filtering trial verdicts animates the distribution bar segments and the list rows to their new arrangement rather than snapping
- Feedback toasts after starting a run, on run completion, and after copying the manifest slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes while every flow remains fully usable
</motion>

<responsiveness>
- The layout adapts from 1440 pixel desktop down to 375 pixel mobile: at 768 pixels and below the left navigation collapses behind a menu control that opens an overlay drawer
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; dense tables and stage strips scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — nav items, repository entries, stage strips' focusable rows, disclosures, filters, form fields, and the copy control — is reachable and operable with the keyboard alone, with a visible focus indicator
- The create form dialog uses a dialog role, traps focus while open, closes on Escape, and returns focus to the control that opened it
- Form fields have visible labels; each validation message names the field (or the pair of bound fields) it belongs to and is associated with it
- Stage statuses, verdicts, and rejection reasons are conveyed by text or accessible labels in addition to color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including while simulated runs are advancing
- The UI stays responsive during simulated runs and under rapid repeated input (fast view switches, filter toggling) with no hangs; async-feeling surfaces show a deliberate loading affordance rather than a blank region
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the repositories and pull-request collections, per-run stage statuses, attempt counts and timestamps, check states, trial verdicts, event timeline entries, filters and selection, expanded-disclosure flags, active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Starting a run appends its row and every stage transition appends a timeline entry from the same shared state; run rollups (tasks produced, yield percentage) derive live from the collections
- A completed accepted run updates every derived surface — repository counts, all three charts, and the timeline — without a reload
- Verdict and timeline filters recompute the visible lists from the shared collections; they never create a second disconnected copy
- The accepted badge and the needs-review banner are derived from check states and trial verdicts respectively, never stored as independent flags that can drift
- Active view and expanded/collapsed flags are shared client state; switching views does not reload the document
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. shadcn/ui is the component library for dialogs, selects, tables, tabs, badges, chips, disclosures, and toasts; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Tabler icons only, installed via @tabler/icons-react — no raw copy-pasted SVG icon sets. All forms — the create-task form and any filter or settings forms — are driven by React Hook Form validating through a Zod schema that mirrors the API-shaped create-task request-body and task-manifest field contracts above, including the cross-field minimum/maximum bounds rule; inline per-field errors render before submit; a successful create record IS the would-be request body; Copy/Download manifests validate through the same schemas. End-state contract: Download task-manifest.json and Copy MUST emit the session's actual accepted task under that field contract — an export that omits session work is invalid. Recharts for the tasks-per-week, language distribution, and difficulty charts. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; all pipeline behavior is simulated in the client.
- Seed at least 4 repositories with at least 8 pull requests each, at least one accepted task with at least 6 classified trials, and enough timeline and chart data that every view is non-empty on first load
- Invalid create-form submissions must not add rows or start runs; show visible validation feedback
- When any filter matches nothing, show an empty state with a clear-filter control
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- All fictional names (repositories, platform, checks) must not reference real products or companies
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
- Browsable entity: pull-requests
- Destinations: repositories; repository-pipeline; task-detail; timeline; analytics
- Filters: trial-verdict; event-status
- Form fields: repository; pull-request-number; min-file-bound; max-file-bound
- Form operations: validate; submit; cancel
- Value bounds: {"repository":["quartz-orm","copperline","fernweh-gateway","lattice-db"],"trial-verdict":["good-success","bad-success","good-failure","bad-failure","infrastructure-error"],"min-max-rule":"min-file-bound must not exceed max-file-bound (cross-field)"}
- Artifact operations: copy
- Export formats: task-manifest
- Workflow completion: a valid submission starts exactly one simulated run whose stage strip advances Fetch, Evaluate, Skeleton, Generate, Validate
- Workflow completion: an accepted run updates tasks-produced count, yield percentage, charts, and timeline without a reload

Mechanics exclusions:
- Simulated stage advancement, failure-and-retry attempt counts, and resume-from-stage timing are run output observed via Playwright; no session controls exist beyond starting the run through the create form
- Check-card and log-excerpt disclosure expand/collapse mechanics stay Playwright-observed
- Chart hover tooltips and distribution-bar segment geometry stay Playwright-only
- Clipboard contents of the manifest copy are verified via Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
