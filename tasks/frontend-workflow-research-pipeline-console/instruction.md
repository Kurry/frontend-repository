<summary>
Build a research pipeline console for training small agentic models using React, Zustand, Tailwind CSS 4.3.2, and Mantine.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Pipeline board —
- The app opens into the Pipeline board view seeded with at least 6 runs; every run renders as a horizontal strip of three connected phase cards in fixed order — Data generation, Fine-tuning, Evaluation — joined by visible connectors, and every phase card carries a status chip reading exactly one of Pending, Running, Complete, Failed, or Skipped
- The seed distribution is visible on first load without any interaction: at least one run has a phase currently Running, at least one run has a Failed phase, and at least two runs are Complete across all three phases
- Every phase card shows a config summary for that phase: the dataset name, the model name, the epoch or trial count, and the cluster name it is assigned to
- A phase whose chip reads Running shows live progress that advances on its own without a reload: a Running data-generation card shows a tasks-generated counter that increments; a Running fine-tuning card shows a loss curve chart that gains a new point as each simulated epoch completes plus a label reading epoch n of m; a Running evaluation card shows a label reading trial n of m plus a running mean score that updates as trials complete
- Clicking a run strip opens that run's detail panel containing the per-phase outputs, timestamps, and the run's event timeline

Feature: Job submission —
- A Submit job control opens a submission panel with fields: job type (select with exactly three options: Data generation, Fine-tune, Evaluate), dataset (select), model (select), a bounded numeric count field (epochs for Fine-tune, trials for Data generation; values 1 through 50), and cluster (select with three options: aurora, basalt, cinder)
- The field set is conditional on job type: choosing Evaluate reveals a benchmark select (Switchboard, Cartographer, Ledger) and a repetition count field that defaults to 3; the benchmark fields are absent for the other two job types
- Each invalid or empty required field shows an inline message naming that field before submit, an out-of-range count (0, negative, or above 50) shows a message stating the allowed range, and the submit control stays disabled until every required field is valid
- A config preview panel beside the form derives live from the current field values: it renders the assembled job configuration as a monospaced code block that updates as any field changes, with a Copy control and a Download job-config.json control that emit the exact preview text (clipboard confirmation on Copy)
- Job-config request-body field contract (the live preview, Copy, Download, and a successful submit record share this schema — the created run's config IS the would-be request body): required jobType (exactly Data generation, Fine-tune, or Evaluate), required dataset (non-empty string from the gated select), required model (non-empty string from the gated select), required count (integer 1–50), required cluster (exactly aurora, basalt, or cinder). When jobType is Evaluate, required benchmark (exactly Switchboard, Cartographer, or Ledger) and required repetitions (integer 1–10, default 3) must be present; those keys must be absent for the other job types. Optional autoEvaluate (boolean) only on Fine-tune. Cross-field: dataset for Fine-tune must be from a Complete data-generation phase; model for Evaluate must be a Complete fine-tune checkpoint; out-of-range count or missing gated fields keeps submit disabled with named errors and adds no run.
- A row of suggestion chips above the form offers at least 3 common configurations; clicking a chip fills the form fields with exactly that configuration and the config preview updates to match
- Submitting a valid job closes the panel, adds exactly one new run strip to the Pipeline board, and increases the active jobs rollup by one. An Export runs control compiles research-pipeline-export.json with required keys schemaVersion (number exactly 1), runs (array of objects each including the job-config request body plus runId and phase statuses in board order), and generatedAt (ISO-8601 datetime ending in Z); it updates after submit/complete/fail without a reload. An export that omits a session-submitted run is invalid. Import job-config / export JSON (when offered) rejects non-conforming payloads with a visible error and changes nothing; a conforming import restores submitted configs into the board so a fresh export matches.

Feature: Chaining rules —
- The dataset select for a Fine-tune job lists only datasets whose data-generation phase is Complete; datasets from incomplete or failed generation runs are absent from the options, and an inline note under the select states that only datasets from completed generation runs can be selected
- The model select for an Evaluate job lists only checkpoints produced by a Complete fine-tuning phase, with an equivalent inline note; base models without a completed fine-tune are absent from the options
- The Fine-tune submission form includes a toggle labeled to start evaluation automatically when training completes; when a run submitted with this toggle on finishes its fine-tuning phase, its evaluation phase flips from Pending to Running without any user action, and the run's event timeline records an entry naming the automatic trigger

Feature: Failure handling and checkpoints —
- A Failed phase card shows an error category label, an attempt count, and an automatic-retry indicator with a visible backoff countdown that counts down second by second (for example retrying in 5s, attempt 2 of 3); when retries are exhausted the card settles on Failed with an inline error summary and a manual Retry control
- Activating manual Retry resumes the run from the failed phase, not from the start: the earlier Complete phases keep their existing outputs and timestamps unchanged while only the failed phase returns to Running
- A Running phase offers a Pause control that freezes its progress at a checkpoint (the counter, epoch, or trial number stops advancing); Resume continues from exactly the value where it stopped, never restarting from zero

Feature: Datasets catalog —
- A Datasets view lists at least 5 seeded datasets; each dataset card shows its name, its size as a task count, its provenance (the name of the generation run and the config that produced it), and a mini-chart of its task-type distribution
- Selecting a dataset filters the Pipeline board to only the runs that used it, with a visible active-filter chip and a clear control that restores the full board; when the selected dataset matches no runs, the board region shows an empty state message with the clear control instead of a blank area

Feature: Results dashboard —
- A Results view renders a leaderboard table of models by benchmarks; every populated cell shows the mean score over its repetitions, a spread indicator, a simulated cost, and a trial count, and the table is sortable — activating a column header sorts by it and activating it again reverses the order of the same rows
- A comparison picker accepts exactly two models; picking them renders paired bars per benchmark for the two models plus a delta strip showing the per-benchmark difference, and swapping either picked model updates the bars and deltas immediately without a reload
- Clicking a populated leaderboard cell opens a trial drill-down list for that model-benchmark pair showing trial id, score, and duration per row; expanding a trial's detail disclosure reveals a short simulated trace excerpt that appears progressively (text streams in rather than rendering all at once) the first time it is opened

Feature: Event timeline —
- Each run's detail panel shows an ordered, timestamped event timeline of its phase transitions, retries, pauses, resumes, and automatic triggers; the timeline is filterable by phase and by status, and selecting a timeline entry visibly highlights the phase card it belongs to

Feature: Live rollups —
- A rollup strip visible from every view shows the count of active jobs, the queue depth per cluster (all three clusters listed), the total simulated cost, and the mean benchmark score per model; all four derive live from the shared run data and update as runs are submitted, advance, complete, or fail
</core_features>

<user_flows>
- Submitting an evaluation end to end: open Submit job, choose Evaluate, pick an eligible checkpoint, a benchmark, and keep the repetition default of 3, then submit; a new run strip appears on the board, the active jobs rollup increases by one, the evaluation phase advances trial by trial, and when it completes the matching leaderboard cell's trial count and mean score update — all without a reload
- Automatic chaining: submit a Fine-tune job with the automatic-evaluation toggle on and watch it train; the moment the fine-tuning phase turns Complete, the evaluation phase flips from Pending to Running with no user action, and opening the run's timeline shows the trigger entry between the two phase transitions
- Failure recovery: on the seeded run with a Failed phase, watch the backoff countdown tick down, then use manual Retry after retries are exhausted; the failed phase returns to Running while the completed earlier phases keep their original timestamps and outputs, and the timeline records the retry
- Dataset tracing: from the Datasets view select a dataset to filter the board to the runs that used it, then clear the filter to restore all seeded runs; the active-filter chip appears and disappears accordingly
- A page reload returns the app to its seeded state: the seeded runs, datasets, leaderboard values, and the default Pipeline board view
- Job-config export flow: fill a valid Evaluate job, confirm the monospaced preview includes jobType, benchmark, and repetitions, Download job-config.json and Copy emit that exact text, submit, then confirm Export runs includes the new runId and config
</user_flows>

<edge_cases>
- Submitting the job form with an out-of-range count or an empty required field adds no run: the board's strip count is unchanged and the inline messages remain visible
- Double-activating the submit control on a valid form creates exactly one run: the board gains exactly one strip and the active jobs rollup increases by exactly one
- When no dataset has a completed generation phase available for the chosen job type, the gated select shows its inline note and the submit control stays disabled rather than offering an ineligible option
- Pausing a Running phase and resuming it continues from the frozen counter value; the counter never resets to zero on resume
- Filtering the board or timeline to zero matches shows an empty state message naming what was filtered and offering the clear control, never a blank region
</edge_cases>

<visual_design>
- Console composition: a left sidebar with three view entries — Pipeline board, Datasets, Results — plus a persistent rollup strip across the top; the main canvas swaps per view while sidebar and rollups stay in place
- One status color system used identically everywhere it appears (phase chips, strip connectors, timeline entries): Pending in neutral gray, Running in blue, Complete in green, Failed in red, Skipped as a muted outline — and every status chip carries its text label so status is never conveyed by color alone
- Run strips read as connected pipelines: the connector between two phase cards renders in the completed color once the earlier phase is Complete, so a strip's progress is scannable at a glance
- Charts share one accent palette across the loss curves, task-type distribution mini-charts, and comparison bars; the config preview renders as a monospaced code block visually distinct from surrounding UI text
- Component states: buttons, selects, and chips show distinct default, hover, focus (visible ring), and disabled treatments; the disabled submit control is visibly muted
- Typography keeps a clear hierarchy: view titles larger than card titles, which are larger than body, labels, and timeline metadata
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; run strips, dataset cards, table rows, and sidebar items take a visible hover wash; form controls show focus rings
- A newly submitted run's strip animates into the board and a strip filtered out animates away rather than snapping; leaderboard rows animate to their new positions when the sort changes
- Phase status changes animate: the status chip cross-fades to its new label and color, the connector fills toward the next phase when a phase completes, and a Running chip carries a subtle pulse while active
- The submission panel enters and exits with a short opacity and slide transition of roughly 200 to 300 milliseconds
- Feedback toasts after submitting a job, a retry, and a completed run slide in, remain readable, and auto-dismiss with a fade
- The trial trace excerpt streams in progressively on first open with a visible in-progress indicator until it finishes
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while all progress information remains visible
</motion>

<responsiveness>
- At desktop widths of 1024 pixels and above the sidebar is open by default; at 768 pixels and below it collapses to a hamburger control that opens an overlay drawer
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; run strips and the leaderboard table scroll horizontally within their own containers
</responsiveness>

<accessibility>
- Every interactive control — sidebar items, submit and retry controls, form fields, table headers, timeline filters, disclosures — is reachable and operable with the keyboard alone, with a visible focus indicator
- The submission panel traps focus while open, closes on Escape, and returns focus to the Submit job control
- Form fields have visible labels and each validation message names the field it belongs to and renders in association with that field
- Toast notifications and the automatic-trigger event are announced through a polite live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including while phases are advancing
- The UI stays responsive while the simulation runs: rapid view switches, filter changes, and form input cause no hangs, and advancing counters and charts never block interaction
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the runs collection with per-phase statuses, attempts, checkpoints, and event logs; the datasets catalog; leaderboard trial data; the active view; filters and selections; form-driven submission state; and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Submitting a valid job adds one run to the shared collection; the board, active jobs rollup, and cluster queue depth all update from that one change
- Simulated phase advancement mutates the same run record everywhere it appears: the board strip, the detail panel, the event timeline, the rollups, and — for evaluations — the leaderboard cell, all without a reload
- Retry, pause, and resume act on the run's stored checkpoint; completed phase outputs and timestamps are frozen and never recomputed
- The dataset filter and timeline filters recompute their visible lists from the shared collection; they do not create a second disconnected copy
- The comparison picker and delta strip derive from the same trial data as the leaderboard cells
- The active view is shared client state; switching views does not reload the document
Build tooling: Vite or an equivalent SPA setup. Mantine is the component library for the shell, tables, selects, modals or drawers, chips, toggles, disclosures, and toasts; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Tabler icons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — the job submission form and any filter or settings forms — are driven by React Hook Form validating through a Zod schema that mirrors the API-shaped job-config request-body field contract above, including the cross-field rules (job-type-conditional required fields, count bounds, gated dataset and checkpoint eligibility): the schema defines the rules, inline per-field errors render before submit, a successful submit record IS the would-be request body, and Copy/Download/Export/Import validate through the same schemas. End-state contract: Download job-config.json, Copy, and Export runs MUST emit the session's actual configs and runs — an export that omits session work is invalid. Recharts for the loss curves, distribution mini-charts, and comparison bars. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; all pipeline activity is simulated client-side on a visible tick so progress is observable within seconds.
- Seed at least 6 runs (including at least one Running phase, one Failed phase, and two fully Complete runs), at least 5 datasets, at least 4 fictional models, the three benchmarks, and the three clusters, so every view is non-empty on first load
- Invalid submissions must not add a run; show visible per-field validation feedback
- When a filter matches nothing, show an empty state in the affected region
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- All model, dataset, benchmark, and cluster names are fictional
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
- Browsable entity: runs
- Destinations: pipeline-board; run-detail; datasets; results; trial-drill-down
- Filters: dataset; phase; status; comparison-model
- Sorts: mean-score; spread; cost; trial-count
- Form fields: job-type; dataset; model; count; cluster; benchmark; repetitions; auto-evaluate
- Form operations: validate; submit; cancel
- Value bounds: {"job-type":["data-generation","fine-tune","evaluate"],"cluster":["aurora","basalt","cinder"],"benchmark":["switchboard","cartographer","ledger"],"count":"whole numbers 1 to 50","repetitions":"defaults to 3","dataset":"only datasets whose data-generation phase is Complete (gated)","model":"for Evaluate, only checkpoints from a Complete fine-tuning phase (gated)"}
- Session operations: pause; resume; restart
- Workflow completion: manual retry (restart) resumes from the failed phase only; earlier Complete phases keep outputs and timestamps
- Workflow completion: pause freezes the counter/epoch/trial checkpoint; resume continues from the exact frozen value
- Workflow completion: a valid submission adds exactly one run strip and increments the active jobs rollup
- Artifact operations: copy
- Export formats: job-config

Mechanics exclusions:
- Live phase progress (tasks-generated counter, loss-curve points, trial-by-trial mean) is simulation timing observed via Playwright
- Backoff countdown ticking and the automatic Pending-to-Running chain flip are timing behaviors observed via Playwright after real setup
- Suggestion-chip fill and the streamed trace excerpt's progressive rendering stay Playwright-observed
- Chart geometry (loss curves, distribution mini-charts, comparison bars/deltas) stays Playwright-only; clipboard contents of the config copy verified via Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
