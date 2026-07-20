<summary>
Build an evaluation job queue monitor using React, Zustand, Tailwind CSS 4.3.2, and Chakra UI. The app produces the operator's queue snapshot: a structured Queue Snapshot JSON document compiled live from jobs, trials, provider lanes, aggregates, and the completions timeline, downloadable and copyable, reflecting every session mutation.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit). The product is a queue monitor for a cloud evaluation platform: jobs run agent trials against datasets on model providers, with provider-aware scheduling and automatic retries. All providers, datasets, agents, and models are fictional and every job is simulated in the client.

Feature: Jobs table —
- The app opens into a Jobs view seeded with at least 10 jobs; every row shows a job id, dataset name, agent name, model name (all fictional, for example datasets orchard-qa and ledgerline-suite, agents scouthand and forgeline, models cobalt-4, meridian-xl, willow-mini), a trial count, a status of queued, running, completed, failed, or cancelled, a progress readout of n of m trials, and a submitted time
- The seeded jobs include at least two running, at least two completed, at least one failed, at least one queued, and at least one cancelled job
- Filter controls narrow the table by status, by model, and by dataset; filters combine, and clearing them restores the full table exactly
- A live simulation advances running jobs while the app is open: a running job's completed-trial count visibly increases over time without any user interaction, and its progress readout tracks the count

Feature: Job detail and trial grid —
- Selecting a job opens its detail without a full page reload, showing a per-trial grid where each cell or row shows the trial id, status, reward value when complete, duration, and retry count, with statuses distinguished by a consistent color treatment plus a readable label
- A failed trial shows an error category chip and, while automatic retries remain, an automatic-retry indicator with the attempt count and a visible backoff countdown that counts down in seconds; when the countdown reaches zero the trial visibly flips back to running
- A trial that exhausts its automatic retries stays failed with its final attempt count, and a manual retry control on that trial resumes just that trial: it returns to running while every other trial's status and results stay unchanged

Feature: Provider lanes —
- A provider lanes panel shows at least 3 fictional providers (for example Northgale Compute, Bluefjord Cloud, Skylark Systems); each lane shows its current queue depth, its in-flight trial count, and a rate-limit state chip reading exactly one of normal, throttled, or paused
- A throttled lane visibly slows the progress of its jobs relative to a normal lane, and queued jobs in any lane display their position in that lane's queue
- A lane can be paused from a toggle that first asks for confirmation; pausing freezes that lane's running trials at their current checkpoint (their completed counts and durations stop advancing), and resuming the lane continues those trials from the same checkpoint — trials that already completed never re-run and their results never change

Feature: Submit job (API-shaped create payload) —
- A Submit job control opens a form whose submitted record is exactly the create-job payload the console would POST to an evaluation-queue API: dataset, agent, model, trialCount, and optional sweepModel
- Field contract for that payload, enforced with inline errors that name the offending field before submit, and with the submit control disabled until every required field is valid:
  - dataset: required, closed set orchard-qa / ledgerline-suite
  - agent: required, closed set scouthand / forgeline
  - model: required, closed set cobalt-4 / meridian-xl / willow-mini
  - trialCount: required, whole numbers from 1 to 10 inclusive
  - sweepModel: optional; when set, must be one of cobalt-4 / meridian-xl / willow-mini and must differ from model
- Submitting with a value outside those rules — missing dataset, agent, or model; trialCount of 0, 11, or non-numeric; sweepModel equal to model — shows an inline message naming each invalid field and creates no job
- An optional sweep section offers the sweepModel select; submitting with a valid sweepModel creates one job per selected model (primary model plus sweepModel), and each created job appears in the jobs table and in its model's provider lane with status queued
- A configuration preview panel beside the form renders a structured, YAML-like text block that derives live from the current form values using the same field names as the create payload (dataset, agent, model, trialCount, and sweepModel when set) — changing any field updates the preview immediately — with a copy control that places the exact preview text on the clipboard and shows visible confirmation

Feature: Aggregates dashboard —
- An aggregates view renders mean reward per model across completed jobs as grouped bars; hovering a bar with the pointer shows a tooltip with the underlying value, and toggling a model's series in the legend hides and restores that series without a reload
- A total cost figure derives live from the shared data and increases as running jobs complete more trials
- A completions event timeline lists ordered, timestamped entries for job and trial completions, filterable by status; clearing the filter restores the full timeline

Feature: Cancel flow —
- A cancel control on a queued or running job first asks for confirmation; confirming flips the job's status to cancelled, stops its progress from advancing, and keeps its already-completed trial results visible in the job detail
- Declining the confirmation leaves the job unchanged

Feature: Queue snapshot export (useful end state) —
- An Export queue control opens a drawer or modal with a live JSON preview of the queue snapshot compiled from the store at that moment
- The snapshot is API-shaped like a real evaluation-queue list response and MUST include these required keys and nesting (field names visible in the preview text): schemaVersion exactly equal to eval-queue-v1; exportedAt as an ISO-8601 timestamp string; jobs (array); providers (array); aggregates (object); timeline (array)
- Each jobs array entry carries the create-payload fields dataset, agent, model, and trialCount, plus id (string), status (exactly one of queued, running, completed, failed, cancelled), progressComplete and progressTotal (non-negative integers), submittedAt (ISO-8601), and trials (array). Each trial carries id (string), status (exactly one of queued, running, completed, failed, cancelled), reward (number when complete, otherwise null), duration (number of seconds when complete, otherwise null), retryCount (non-negative integer), and errorCategory (non-empty string when failed, otherwise null)
- Each providers array entry carries id (string), name (string), queueDepth and inFlight (non-negative integers), and rateLimit (exactly one of normal, throttled, paused)
- The aggregates object carries meanRewardByModel (object mapping each model id to a number) and totalCost (number greater than or equal to 0)
- Each timeline array entry carries id (string), timestamp (ISO-8601), status (exactly one of queued, running, completed, failed, cancelled), kind (exactly one of job or trial), and label (non-empty string)
- The preview derives from live session state: submitting, cancelling, pausing a lane, resuming, or manually retrying before reopening Export changes the JSON to include those mutations; an export that omits a session mutation is incorrect
- Copy places the exact visible preview text on the clipboard and shows a visible confirmation; Download starts a .json file download of that same text

Feature: Queue snapshot import —
- An Import queue control accepts pasted Queue Snapshot JSON text matching the export field contract
- A valid import replaces the jobs, providers, aggregates, and timeline so the jobs table, lanes panel, aggregates view, timeline, and the next Export preview match the imported document
- Malformed JSON, or JSON that violates the field contract (schemaVersion not eval-queue-v1, missing required keys, status or rateLimit outside the closed sets, trialCount outside 1 to 10 on a job's create fields, dataset/agent/model outside their closed sets, negative progress or cost figures), shows an inline error naming the import problem, leaves the queue unchanged, and does not treat the attempt as a successful mutation
</core_features>

<user_flows>
- Submitting a job end to end: open the submit form, watch the configuration preview update as each field changes with the create-payload field names, submit with values that satisfy the field contract, and confirm exactly one new queued row appears in the jobs table and in the chosen model's provider lane, then confirm the job later starts running and its trial count advances — all without a reload — and reopening Export queue shows that job in the jobs array with matching dataset, agent, model, and trialCount
- Sweep submission: choose a sweepModel that differs from model and submit once; confirm one job per selected model appears, each in its own model's lane, and the jobs table count increases by exactly the number of models chosen
- Retry lifecycle: watch a failed trial's backoff countdown tick down and flip the trial back to running; on a trial that exhausted retries, activate manual retry and confirm only that trial returns to running
- Pause and resume: pause a lane through its confirm dialog, note a running trial's completed count, wait, confirm the count has not advanced, then resume and confirm the same trial continues from the same count with completed trials untouched
- Mutation-to-export: submit a valid job, open Export queue, and confirm the JSON preview contains that job's dataset, agent, model, and trialCount under jobs, that schemaVersion is eval-queue-v1, and that providers and timeline keys are present; Copy and Download controls are available
- Export then import round-trip: after a queue mutation (submit or cancel at least one job), Copy or Download the Queue Snapshot JSON, Import that same text, and confirm the visible jobs, lane depths, and timeline match the pre-export mutated state and the next Export preview matches again
- A page reload returns the app to its seeded state: the seeded jobs, lanes, and timeline with the default view active, and closed export and import surfaces
</user_flows>

<edge_cases>
- Submitting the job form with no dataset, agent, or model selected shows inline messages naming each missing field and creates no job
- A trialCount of 0, 11, or a non-numeric value shows the bounds message naming trialCount and keeps submit disabled; the jobs count is unchanged
- Choosing a sweepModel equal to model shows an inline error naming sweepModel and creates no job
- Double-activating the submit control creates exactly one job (or exactly one job per sweep model)
- Filters that match no jobs show an empty state message with a control that clears the filters
- Cancelling a job that is mid-trial keeps every completed trial's reward and duration visible in the detail; only unfinished trials stop
- Importing malformed Queue Snapshot JSON or a document that breaks the field contract shows an inline import error, leaves job count and lane depths unchanged, and does not update the Export preview as if a successful import occurred
</edge_cases>

<visual_design>
- Monitor composition: a header with the app name, the Submit job control, and Export queue / Import queue controls, a main jobs table with the filter toolbar above it, a provider lanes panel visible alongside or above the table, and Aggregates and Timeline reachable as views or tabs without a reload
- Status color system applied identically in the jobs table, the trial grid, the lanes, and the timeline: queued in muted neutral, running in an animated accent, completed in green, failed in red, cancelled in gray — always paired with a readable status label, never color alone
- Rate-limit chips visually distinct per state: normal quiet, throttled in a warning treatment, paused in a strong muted treatment
- Typography hierarchy: page title larger than section headings, which are larger than table body text; ids, counts, rewards, and durations render in an aligned, tabular numeric style
- The configuration preview and the export JSON preview each render on a visually distinct monospaced surface with an indented, key-value structure; the import surface uses the same visual language; cards and panels use consistent borders, radii, and subtle shadows
- One consistent icon set across the header, chips, lane controls, and row actions
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows take a full-width hover wash; chips, legend entries, and lane controls show hover treatments; form controls show focus rings
- The submit form, export drawer, import surface, and confirmation dialogs enter and exit with a short opacity and scale transition of roughly 200 to 300 milliseconds
- Progress microinteractions through the real controls: a newly submitted job's row animates into the table, running jobs' progress readouts and bars advance smoothly rather than jumping, and new timeline entries animate in
- The backoff countdown visibly ticks down second by second, and the flip from failed to running animates the status change rather than swapping instantly
- Toasts after submitting, cancelling, copying the preview, exporting, and importing slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes while every flow remains fully usable
</motion>

<responsiveness>
- The layout adapts from 1440 pixel desktop down to 375 pixel mobile: at 768 pixels and below the lanes panel stacks above or below the table and the filter toolbar wraps
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the jobs table, trial grid, and export preview scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — filters, table rows and row actions, lane toggles, legend entries, form fields, export and import controls, and copy controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The submit form, export drawer, import surface, and both confirmation dialogs use a dialog role, trap focus while open, close on Escape, and return focus to the control that opened them
- Form fields have visible labels; each validation message names the field it belongs to and is associated with it
- Job, trial, and lane statuses are conveyed by text or accessible labels in addition to color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including while the live simulation advances multiple running jobs and while opening Export or Import
- The UI stays responsive while the simulation runs and under rapid repeated input (fast filter changes, view switches, export reopen) with no hangs; async-feeling surfaces show a deliberate loading affordance rather than a blank region
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app
- Validation and import errors name the field and the rule broken; empty states explain what belongs in the region and how to clear the filters or submit a job
- Action labels use specific verbs such as Submit job, Export queue, Import queue, Copy, and Download rather than generic labels where a specific one is possible
- No placeholder or filler text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional: a compact queue activity feed listing the last several submits, cancels, and trial completions with timestamps, derived from the same store as the timeline
- Optional: a printable queue summary layout reachable from the export drawer that restates job counts by status and lane depths without changing store state
- Optional: a short coachmarks tour that highlights the jobs table, Export queue, and Submit job on first visit, dismissible and never blocking the primary workflow
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the jobs and trials collections, per-trial statuses, attempt counts, backoff timers and checkpoints, provider lane states, filters and selection, form drafts, active view, export preview text, import draft, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Queue Snapshot JSON plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Submitting a valid job appends it to the jobs collection and its model's lane from the same shared state; the jobs table, lane queue depths, timeline, and export preview all reflect it without a reload
- Simulation ticks, retries, pauses, and cancellations mutate the one shared collection; the table row, the trial grid, the lane panel, the aggregates, and the next export snapshot always agree on a job's status and progress
- Filters recompute the visible table from the shared collection; they never create a second disconnected copy
- Mean reward per model, total cost, and lane queue depths are derived live from the collections, never stored as independent figures that can drift
- The configuration preview derives from the live form draft using the create-payload field names; Queue Snapshot JSON export and a successful import conform to the same field contract; active view and dialog state are shared client state and switching views does not reload the document
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Chakra UI is the component library for tables, dialogs, selects, tabs, chips/badges, progress indicators, and toasts, with Tailwind owning layout and custom surfaces; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons only, installed via @phosphor-icons/react — no raw copy-pasted SVG icon sets. All forms — the submit-job form, the import surface, and any filter or settings forms — are driven by React Hook Form validating through a Zod schema that models the create-job and queue-snapshot payloads: the schema defines the field contract above and inline per-field errors render before submit. The record a successful submit creates is exactly that create-job payload; the Queue Snapshot JSON export and a successful import conform to the same field names, enums, and bounds. Recharts for the grouped mean-reward bars. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; all scheduling, progress, and retry behavior is simulated in the client.
- Seed at least 10 jobs across at least 3 providers and at least 3 models, with the status spread stated in core features, so every view is non-empty on first load
- Invalid submissions must not create jobs; show visible validation feedback
- When filters match nothing, show an empty state with a clear-filters control
- Queue Snapshot JSON export must be compiled live from the current store; after any session mutation that changes jobs, lanes, aggregates, or timeline, reopening Export queue must include that mutation
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- All fictional names (providers, datasets, agents, models) must not reference real products or companies
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
- Destinations: jobs; job-detail; provider-lanes; aggregates; timeline; export-queue; import-queue
- Filters: status; model; dataset; timeline-status
- Form fields: dataset; agent; model; trial-count; sweep-model
- Form operations: validate; submit; cancel
- Value bounds: {"dataset":["orchard-qa","ledgerline-suite"],"agent":["scouthand","forgeline"],"model":["cobalt-4","meridian-xl","willow-mini"],"trial-count":"whole numbers 1 to 10","status":["queued","running","completed","failed","cancelled"]}
- Session operations: pause; resume; stop; restart
- Workflow completion: pausing a lane (northgale-compute, bluefjord-cloud, skylark-systems) freezes its running trials at their checkpoint; resume continues from the same counts
- Workflow completion: stop (cancel) flips the job to cancelled and keeps completed trial results visible
- Workflow completion: restart (manual retry) returns only the exhausted trial to running
- Artifact operations: export; import; copy
- Export formats: yaml-config-preview; queue-snapshot-json
- Import modes: queue-snapshot-json

Mechanics exclusions:
- Backoff countdown ticking and the failed-to-running flip animation stay Playwright-observed (timing mechanics)
- Live simulation progress advancement of running jobs is timing behavior observed via Playwright
- Grouped-bar hover tooltips and legend series toggling stay Playwright-only (chart mechanics)
- Cancel and pause confirmation dialogs are graded through the real dialog path when the confirmation itself is the criterion; clipboard contents of the preview copy verified via Playwright
- Clipboard contents and downloaded Queue Snapshot JSON remain Playwright responsibilities
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
