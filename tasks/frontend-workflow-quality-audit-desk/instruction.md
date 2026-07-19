<summary>
Build a dataset quality-audit desk for a benchmark authoring pipeline using Vue 3, Pinia, Tailwind CSS 4.3.2, Naive UI, and ECharts. The useful end state is the portable audit package: Audit Package JSON and Audit Report Markdown compiled live from the session, conforming to the API-shaped field contracts below, with Import that round-trips a contract-valid package, and MCP-queryable export surface.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Audit queue —
- On first load the Queue view shows a table of at least 42 seeded audit task records spanning the 7 seeded repositories (meridian/copperbeam, quartzlab/hollybush, silverpine/driftnet, bluegate/ironvale, cedarworks/lanternfish, foxglove/marrowgrid, oakhaven/pebblecourt), with every repository contributing at least 4 records
- Each queue row shows the task slug in org-repo-issue-N form (for example meridian-copperbeam-issue-12), the repository, a lifecycle stage badge, a checks summary as passes out of 9, a criteria summary as passes out of 10, the feedback entry count, and a last-activity timestamp
- The seeded records cover the early lifecycle on first load: at least 6 records are in the pending stage with no check results yet, and the remainder are seeded with completed check results so the pending, checked, held, and admitted stage badges are all visible in the queue without any user action
- Clicking a column header sorts the table by that column ascending; clicking the same header again sorts descending, reversing the row order relative to ascending
- The queue can be filtered by check outcome (choose one of the nine checks plus pass or fail), by criterion outcome (choose one of the ten admission criteria plus pass or fail), by lifecycle stage, and by reviewer; each active filter appears as a removable chip above the table and the visible row count updates immediately when a filter is added or removed
- Typing in the queue search field narrows the visible rows incrementally to records whose slug or repository matches; clearing the field restores the previously filtered set exactly
- When the active filters match no records, the table region shows an empty state with a message and a Clear filters control that restores the full queue

Feature: Rollup strip —
- A rollup strip above the queue shows a pass-rate cell for each of the nine deterministic checks (package-shape, task-config, rubric-wiring, file-modes, harvest, container-parity, dependency-pinning, foils, scoring-contract), a pass-rate cell for each of the ten admission criteria, and an entry-count cell for each seeded reviewer; every cell derives live from the current records and updates without a reload when any run, verdict, or feedback entry changes the underlying data
- Clicking a check cell, criterion cell, or reviewer cell applies the matching filter to the queue and the corresponding filter chip appears
- The rollup strip includes a bar chart of pass rate per check and a bar chart ranking the ten admission criteria by failure count; hovering a bar with the real pointer shows a tooltip naming the check or criterion and its exact value, and both charts redraw when their input data changes

Feature: Task detail —
- Clicking a queue row opens that record's detail view showing the slug, repository, current stage badge, the nine check chips, the admission rubric panel, the feedback thread, and the audit timeline, without a full page reload
- The detail view renders the lifecycle as a state machine strip — pending, checked, held or admitted, escalated or re-audited, resolved — with the current stage highlighted and a timestamp shown under every stage the record has reached
- Each of the nine check chips shows its check name and one of three visible states: pass, fail, or not run; activating a failing chip reveals that check's violation detail text
- Activating any check chip after a run has completed jumps to and highlights that check's step in the run evidence log
- The audit timeline lists this record's events in order — run started, step transitions, run completed, verdict changes, feedback entries, fixes applied, escalation, resolution, and report exports — each with a timestamp

Feature: Deterministic check runner —
- Clicking Run checks on a task starts a simulated audit run decomposed into nine visible steps, one per check in the fixed order package-shape, task-config, rubric-wiring, file-modes, harvest, container-parity, dependency-pinning, foils, scoring-contract; each step shows the check name and a status that advances visibly through pending, running, and complete or failed
- During a run, occasional simulated transient failures retry automatically: the retrying step shows a visible backoff countdown and an attempt counter (for example, waiting before retry 2 of 3) before the retry executes
- Each seeded record carries a fixed set of failing checks: running checks twice on the same unfixed task produces the same final pass and fail outcomes both times, and a step that finishes failed shows an inline violation detail naming what the check found
- A running audit can be paused and resumed: pausing freezes step progression at the current step; resuming continues from exactly that step, and steps already completed keep their original outputs and timestamps and never re-execute
- A run-level rollup derives live from the step states — completed count out of 9, elapsed duration, and failure count — and updates as steps advance
- The run evidence log lists step transitions in order with timestamps and is filterable by status; selecting a log entry highlights the corresponding step
- When a run finishes, the task's check chips, its queue row checks summary, its stage badge (pending becomes checked, or held when any check failed), the rollup strip, and the audit timeline all update coherently from the same run outcome
- From the queue with filters applied, a Run checks on all filtered control starts a batch run across every visible record: a batch panel shows per-task progress as task m of n alongside the current task's nine step statuses, and each task's chips and queue row update as its portion completes
- A batch run can be paused and resumed at the current step of the current task, and when the batch finishes the rollup strip reflects every included task's new outcomes

Feature: Admission rubric review —
- The rubric panel lists the ten admission criteria by name: runtime-crux-load-bearing, premise-truthful, question-non-leaking, rubric-scope-alignment, positive-criteria-grade-meaning, negative-criteria-grounded, golden-answer-faithful, foils-discriminating, difficulty-substantive, trial-evidence-valid
- Each criterion row has a guidance disclosure that is collapsed by default, expands and collapses on activation with a rotating chevron cue, shows that criterion's guidance text when open, and remembers its open state per criterion while the app is open
- Before a task has any completed check run, the rubric panel shows a notice that checks must run first and the verdict toggles are disabled; after the first completed run the toggles become active
- CriterionFailVerdict field contract (API-shaped request body; a successful fail save produces this payload; all keys REQUIRED): criterion (exactly one of the ten admission criteria named above), verdict (exactly the string fail), rationale (trimmed string of at least 15 characters)
- Each criterion has a pass/fail verdict toggle; setting a criterion to fail opens a rationale field; saving a fail verdict succeeds only when the CriterionFailVerdict field contract is satisfied — a shorter rationale shows an inline message naming the rationale field and the verdict is not saved
- Activating a failed criterion's verdict chip reveals its saved rationale text
- A derived admission outcome banner recomputes immediately as verdicts change: when all ten criteria are set to pass (and all nine checks passed) the banner reads Admitted; when any criterion is failed the banner reads Held and names each failing criterion
- Changing a criterion verdict updates the task's criteria summary in the queue row, the criterion rollup cells and failure-ranking chart, and the stage badge, without a reload

Feature: Feedback threads —
- The feedback thread lists timestamped entries, each showing the reviewer name, a structured verdict chip — Approve, Approve with caveats, Needs edit, or Reject — and the findings text
- FeedbackEntry field contract (API-shaped request body; the record a successful submit creates IS this would-be request body; all keys REQUIRED; example values illustrative only): reviewer (exactly one of the nine seeded names Dana Whitfield, Marcus Okafor, Elena Vasquez, Priya Nair, Jonas Keller, Ruth Alvarez, Samir Haddad, Ingrid Larsen, Felix Moreau), verdict (exactly one of Approve, Approve with caveats, Needs edit, Reject), findings (trimmed string of at least 20 characters)
- The add-entry form has a reviewer select listing the nine seeded reviewers, a verdict select, and a findings field; submit stays disabled until every field is valid against the FeedbackEntry field contract, and inline messages name any invalid field before submit
- Submitting a valid entry appends exactly one entry matching that contract to the thread, increases the queue row's feedback entry count by one, updates that reviewer's rollup cell, and stamps the audit timeline
- A Reviewers view lists the nine reviewers with their entry counts; choosing a reviewer opens a reviewer detail view listing every entry they have made across tasks (each linking back to its task's detail view in-app) together with a verdict distribution summary showing counts per verdict

Feature: Escalation, fixes, and re-audit —
- Escalation field contract (API-shaped request body; a successful escalate produces this payload on the record; all keys REQUIRED): category (exactly one of Spec conflict, Tooling gap, Dataset defect, Scoring disagreement), summary (trimmed string of at least 20 characters)
- Resolution field contract (API-shaped request body; a successful resolve produces this payload; all keys REQUIRED): note (trimmed string of at least 15 characters)
- A task in the held stage shows an Escalate control that opens a form with a category select and a summary field; submitting a valid escalation matching the Escalation field contract moves the stage to escalated, shows the category and summary on the detail view, and stamps the audit timeline
- Submitting the escalation form with a missing category or a too-short summary shows inline messages naming the offending field and the stage does not change
- An escalated task shows a Resolve control with a resolution-note field; resolving only succeeds when the note matches the Resolution field contract, then moves the stage to resolved and stamps the timeline; a note shorter than 15 characters shows an inline message naming the note field and leaves the stage unchanged
- A held task shows an Apply simulated fixes control; after fixes are applied, re-running checks flips the outcome deterministically: every check that failed in the previous run now passes, every check that passed stays passing, and the stage becomes re-audited
- A re-audited task whose nine checks all pass reaches resolved once all ten criteria are set to pass — previously failed criteria must be re-reviewed to pass, and the timeline shows the fix, re-run, and verdict events in order

Feature: Audit report export —
- The Report view PRODUCES the operator's portable audit package: a format switch between Audit Package JSON and Audit Report Markdown, a monospaced live preview of the active format, Copy export, Download export, Import package, and an export history — all compiled LIVE from the shared store
- Audit Package JSON field contract (API-shaped audit-package payload; Copy, Download, and Import of the JSON format all conform; field names and enum values are visible in the preview text; all top-level keys REQUIRED unless marked optional; example values illustrative only): schemaVersion (exactly the string quality-audit-package-v1); exportedAt (ISO-8601 timestamp string ending in Z); datasetSummary (object with required integer keys admitted, held, escalated, resolved, and total); checkPassRates (array of nine objects in check order, each with required check name from the nine-check closed set, passes integer, fails integer, and passRate number); criterionFailureRanking (array of ten objects ordered by failure count descending, each with required criterion name from the ten-criterion closed set and failures integer); reviewerActivity (array of objects each with required reviewer from the nine seeded names, entryCount integer, and verdictMix object with integer counts for Approve, Approve with caveats, Needs edit, and Reject); tasks (array of session-touched task records — any run, verdict change, feedback entry, fix, escalation, or resolution — each with required slug, stage from the seven-stage closed set, checks array of nine {check, status} objects with status exactly one of pass, fail, not-run, failedCriteria array of objects each matching the CriterionFailVerdict field contract, feedback array of objects each matching the FeedbackEntry field contract, optional escalation matching the Escalation field contract or null, and optional resolution matching the Resolution field contract or null); exportHistory (array of objects each with required exportedAt ISO-8601 ending in Z and format exactly one of json or markdown)
- Audit Report Markdown mirrors the same session records as human-readable sections: dataset summary counts, check pass-rate table, criterion failure ranking, reviewer activity, and a per-task appendix whose entries carry the same slug, stage, check outcomes, failed-criterion rationales, and feedback verdicts as the matching tasks entries in the JSON
- Changing session state and returning to the Report view regenerates both previews — running more checks, failing a criterion, adding feedback, escalating, or resolving alters datasetSummary numbers, appendix/tasks content, and nested request-body fields accordingly; an export that omits session mutations or violates the field contract is incorrect
- A Copy export control puts the exact visible preview text for the active format on the clipboard with visible confirmation; a Download export control offers that same text as a downloadable file whose contents match the preview
- Copying or downloading an export appends a timestamped export-history entry naming the active format in the Report view header and stamps a report-export event on the audit timeline of every session-touched appendix record
- An Import package control accepts pasted or file-picked Audit Package JSON matching the export field contract; a valid import reconstructs records, stages, checks, criteria, feedback, escalations, resolutions, and rollups so the next JSON export preview matches the imported document; malformed JSON or a document that breaks the contract (schemaVersion not exactly quality-audit-package-v1, missing required keys, feedback findings under 20 characters, escalation summary under 20 characters, resolution note under 15 characters, or closed-enum values outside their sets) shows an inline error naming the offending field and leaves the desk unchanged
</core_features>

<user_flows>
- Auditing a clean task to admission: opening a pending record with no seeded failing checks, clicking Run checks, watching the nine steps advance with the run rollup counting to 9 of 9, then setting all ten criteria to pass moves the record through pending, checked, and admitted — the stage strip highlights each stage with timestamps, the queue row shows 9 of 9 checks and 10 of 10 criteria, and the rollup strip reflects the new passes, all without a reload
- Holding and escalating: running checks on a record with seeded failing checks marks those steps failed with violation details, the stage becomes held, failing a criterion with a typed rationale keeps the Held banner naming that criterion, and escalating with a category and summary moves the stage to escalated with the escalation shown on the detail view and stamped on the timeline
- Fix and re-audit: on a held record, applying simulated fixes and re-running checks flips every previously failing check to pass while previously passing checks stay passing, the stage becomes re-audited, and re-reviewing the failed criteria to pass carries the record to resolved with the fix, re-run, and verdict events in timeline order
- Batch run over a filtered set: filtering the queue to one repository and starting Run checks on all filtered shows task m of n progress with each task's steps advancing in turn; when the batch finishes, every included row's checks summary and stage badge have updated and the check pass-rate cells and chart reflect the new outcomes
- Feedback round-trip: adding entries with two different verdicts from two different reviewers appends both to the thread with matching verdict chips, raises the queue row's entry count by two, and the Reviewers view shows both reviewers' updated counts with the new entries and verdicts in their detail views
- Session report: after the flows above, opening the Report view shows updated admitted, held, escalated, and resolved counts in both Audit Package JSON (schemaVersion quality-audit-package-v1) and Audit Report Markdown, the check pass-rate table and criterion failure ranking matching the session's outcomes, reviewer activity reflecting the added entries, and tasks/appendix entries for every touched record including the typed rationales and escalation fields; Copy export and Download export are available for the active format and the export history gains a timestamped entry
- Export/import round-trip: after a session mutation, copy or download Audit Package JSON, then Import package that same text; the visible queue stages, rollups, and the next JSON export preview match the imported document
- A page reload returns the app to its seeded state: the seeded records with their original stages, check results, and feedback, the default Queue view, an empty export history, and a closed import surface
</user_flows>

<edge_cases>
- When the active queue filters match no records, the table region shows an empty state with a Clear filters control; activating it restores the full queue
- Double-activating Run checks starts exactly one run: the step list fills once and the timeline gains one run-started entry
- Starting a batch run when the filtered set contains a single record runs it as a batch of one, showing task 1 of 1
- A fail rationale of exactly 14 characters is rejected with a message naming the rationale field; 15 characters is accepted
- A findings entry shorter than 20 characters shows an inline message naming the findings field and adds no entry; the thread and entry count are unchanged
- Submitting the escalation form with a valid category but an empty summary shows an inline message naming the summary field and the stage stays held
- A task slug longer than 32 characters is truncated with an ellipsis in the queue row and shown in full on the detail view
- Pausing a run, navigating to another view, and returning shows the run still paused at the same step, and resuming continues from that step
- Opening the Report view before any record has been touched this session shows a Markdown appendix empty state explaining that audited records will appear there, while Audit Package JSON still shows a complete seeded package with schemaVersion quality-audit-package-v1
- Re-running checks on an unfixed held task reproduces the same final pass and fail outcomes as the previous run
- A resolution note of exactly 14 characters is rejected with a message naming the note field; 15 characters is accepted
- Importing malformed Audit Package JSON or a document that breaks the field contract shows an inline error naming the offending field and leaves record counts and stages unchanged
</edge_cases>

<visual_design>
- Layout: a left navigation rail with entries for Queue, Reviewers, and Report; the Queue view places the rollup strip and its two charts above the table; the detail view groups the state machine strip, check chips, rubric panel, feedback thread, and timeline into visually distinct panels; the Report view shows a format switch, monospaced export preview, Copy export, Download export, Import package, and export history
- Lifecycle stage badges use one consistent color mapping everywhere they appear: pending neutral gray, checked blue, admitted green, held amber, escalated red, re-audited violet, resolved teal
- Check chips are visually distinct at a glance: pass green, fail red, not run neutral outline; the same pass/fail colors carry into the rollup cells, the run steps, and the report's check table
- Verdict chips use four distinct treatments — Approve green, Approve with caveats amber, Needs edit blue, Reject red — consistent between the thread, the reviewer detail view, and the report
- Run step statuses are visually distinct: pending, running, retrying, failed, and complete each carry a distinct color or icon treatment, consistent between the step list and the run evidence log
- The two rollup charts share one accent palette, and the same check-to-position and criterion-to-position ordering is used in the cells, the charts, and the report tables
- Typography shows a clear hierarchy: the app title larger than view headings, which are larger than panel headings, which are larger than table body and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the rollup strip, table, and detail panels are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, toggles, and chips show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the navigation rail, stage badges, check chips, run steps, and row actions
</visual_design>

<motion>
- Run step status changes animate: the running indicator shows continuous activity, a completing step's status transitions with a short fade rather than snapping, and the retry backoff countdown ticks visibly
- Queue rows animate as filters change: rows entering or leaving the visible set animate in and out rather than snapping, driven by the real filter controls
- Rollup cells give a brief highlight pulse when their value changes after a run, verdict, or feedback entry
- Chart bars grow from zero height over roughly 400 milliseconds when a chart first renders, and animate to their new heights when the data changes
- The task detail view slides in when a row is clicked and slides out when closed; the guidance disclosures expand and collapse with their chevrons rotating
- The stage badge transition animates when a record changes stage — the new badge fades or scales in rather than swapping instantly — and the state machine strip highlight moves to the new stage with a short transition
- Modals and the escalation form enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- Feedback toasts after adding an entry, completing a run, escalating, resolving, and copying the report slide in, remain readable, and auto-dismiss with a fade
- Hover animations (required): buttons ease background and shadow with a slight press effect; queue rows, rollup cells, reviewer rows, and timeline entries take a full-width hover wash; form controls show focus rings
- With prefers-reduced-motion set, animations are removed and state changes apply instantly, with rows, bars, and badges appearing in place
</motion>

<responsiveness>
- At widths of 768 pixels and below, the navigation rail collapses behind a toggle control that opens it as an overlay; at desktop widths the rail is visible by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the queue table and the rollup strip scroll within their own containers
- The detail view's panels stack vertically at narrow widths in the order state machine, check chips, rubric, feedback, timeline, with every control still reachable
</responsiveness>

<accessibility>
- Every interactive control — queue rows, column headers, filter controls, rollup cells, check chips, verdict toggles, disclosures, run controls, form fields, and copy controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals and overlay forms trap focus while open, close on Escape, and return focus to the control that opened them
- The completion of a run, a step entering the failed state, and a record changing lifecycle stage are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Guidance disclosures expose their expanded or collapsed state to assistive technology, and stage badges and check chips convey their state in text, not by color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — quick filter changes, rapid sort clicks, fast view switches — with no hangs or dropped interactions, including while a run or batch run is in progress
- The queue table with all seeded records scrolls and filters without perceived lag
</performance>

<writing>
- Headings, buttons, and badges use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Run checks, Add entry, Escalate task, Copy export, Download export, and Import package rather than generic labels where a specific one is possible
- Error messages name the problem and the fix, such as naming the rationale field and its 15-character minimum or the Audit Package JSON field that failed the contract; empty states explain what belongs in the region and how to fill it; no placeholder text appears anywhere in the shipped UI
- The same concepts keep the same names everywhere: records are tasks, deterministic results are checks, admission judgments are criteria, and thread entries are feedback — never renamed between views
- Check and criterion names render identically in the chips, rollup cells, charts, run steps, and report tables
</writing>

<innovation>
Optional enhancements (nothing here is required for a passing build): a dark color mode toggle; a keyboard command palette for jumping to records or views; a what-if admission preview that shows how the outcome banner would change before saving verdicts; a celebratory flourish when a record reaches admitted or resolved; per-repository mini-summaries in the queue. Any enhancement must not interfere with the required behaviors.
</innovation>

<requirements>
Shared application state must live in Pinia (in-memory only): the audit records collection with their check results, criterion verdicts, rationales, feedback threads, stage history, and timelines; run and batch-run state including per-step statuses, attempt counts, checkpoints, and evidence logs; queue filters, search, and sort; rollup inputs; the export history; the active view and detail selection; disclosure open flags; and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Completing a run updates the task's check chips, queue row summary, stage badge, the rollup strip, both charts, and the timeline from the same shared run outcome
- Changing a criterion verdict updates the rubric panel, the admission outcome banner, the queue row, the criterion rollups, and the stage badge everywhere they appear
- Adding a feedback entry updates the thread, the queue row entry count, the reviewer rollup, and the reviewer detail view from the same shared data
- Filters, search, and sort recompute the visible queue from the shared collection; they do not create a second disconnected copy
- Pausing and resuming a run preserves completed steps' outputs and timestamps; batch progress, per-task outcomes, and the rollups derive from the same shared run state
- The report renders from the same shared records and session activity the other views show; it is never a static snapshot
- A successful feedback submit, fail-verdict save, escalate, or resolve creates exactly the request-body shape declared in the matching field contract; Audit Package JSON nests those same shapes under tasks
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Naive UI is the component library for all UI chrome — tables, modals, selects, tabs, tags/badges, toasts, and form controls; no other component library. ECharts via vue-echarts renders the rollup charts and the reviewer verdict distribution; no other chart library. @vueuse/motion and AutoAnimate allowed for animation; no other animation libraries. Icons from @phosphor-icons/vue only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the feedback entry form, the fail-rationale field, the escalation form, the resolution form, and Import package — are driven by VeeValidate validating through Zod schemas that mirror the FeedbackEntry, CriterionFailVerdict, Escalation, Resolution, and Audit Package JSON field contracts above: required fields, formats, bounds, closed enums, and cross-field rules are judgeable from those contracts; inline per-field errors render before submit; the record a valid form creates IS the would-be request body; Copy, Download, and Import compile and validate against those same schemas. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; check execution is simulated with realistic step latency and visible transient retries, while each task's final pass and fail outcomes are deterministic for its seeded (or fixed) state.
- Seed at least 42 audit records across the 7 named repositories (each contributing at least 4), at least 6 of them pending with no check results, and the remainder distributed so the checked, held, and admitted stages, failing checks with violation details, failed criteria with rationales, and feedback entries from at least 6 of the 9 reviewers are all present on first load
- Submitting any form with invalid fields must not change records, stages, or counts; show visible validation feedback naming the field
- End-state contract: Copy and Download of Audit Package JSON and Audit Report Markdown MUST reflect the session's actual mutations under the field contracts; Import of a previously exported Audit Package JSON MUST restore the same visible desk state (round-trip). Persistence for this good-app genre is the portable audit package plus the MCP query surface — never browser storage
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
- Browsable entity: audit-tasks
- Destinations: queue; task-detail; reviewers; reviewer-detail; report
- Filters: check-outcome; criterion-outcome; lifecycle-stage; reviewer
- Sorts: column-ascending; column-descending
- Form fields: reviewer; feedback-verdict; findings; criterion-verdict; fail-rationale; escalation-category; escalation-summary; resolution-note
- Form operations: validate; submit; cancel
- Workflow steps: add-feedback-entry; set-criterion-verdict; escalate-task; apply-simulated-fixes; resolve-task
- Value bounds: checks in {package-shape, task-config, rubric-wiring, file-modes, harvest, container-parity, dependency-pinning, foils, scoring-contract}; admission criteria in {runtime-crux-load-bearing, premise-truthful, question-non-leaking, rubric-scope-alignment, positive-criteria-grade-meaning, negative-criteria-grounded, golden-answer-faithful, foils-discriminating, difficulty-substantive, trial-evidence-valid}; lifecycle stage in {pending, checked, held, admitted, escalated, re-audited, resolved}; reviewers limited to the nine seeded names Dana Whitfield, Marcus Okafor, Elena Vasquez, Priya Nair, Jonas Keller, Ruth Alvarez, Samir Haddad, Ingrid Larsen, Felix Moreau; feedback verdict in {Approve, Approve with caveats, Needs edit, Reject}; escalation category in {Spec conflict, Tooling gap, Dataset defect, Scoring disagreement}; fail rationale minimum 15 characters; findings and escalation summary minimum 20 characters; resolution note minimum 15 characters; criterion verdict toggles disabled until the task's first completed check run; escalate only from held; resolve only from escalated or from a re-audited task with 9 of 9 checks and 10 of 10 criteria passing; repositories limited to the 7 seeded orgs meridian/copperbeam, quartzlab/hollybush, silverpine/driftnet, bluegate/ironvale, cedarworks/lanternfish, foxglove/marrowgrid, oakhaven/pebblecourt; Audit Package JSON field contract: schemaVersion exactly quality-audit-package-v1; exportedAt ISO-8601 ending in Z; required keys datasetSummary, checkPassRates, criterionFailureRanking, reviewerActivity, tasks, exportHistory; nested feedback matches FeedbackEntry; nested failedCriteria matches CriterionFailVerdict; nested escalation/resolution match Escalation/Resolution field contracts
- Session operations: start; pause; resume
- Demos: check-run; batch-run-filtered; re-audit-run
- Artifact operations: copy; export; import
- Export formats: audit-package-json; audit-report-markdown
- Workflow completion: a finished run coherently updates the task's nine check chips, queue row checks summary, stage badge (pending to checked, or held on any failure), the rollup strip and both ECharts bar charts, and the audit timeline from one outcome
- Workflow completion: re-running an unfixed held task reproduces the same final pass/fail outcomes; after Apply simulated fixes a re-run flips every previously failing check to pass while passing checks stay passing and the stage becomes re-audited
- Workflow completion: a valid feedback entry appends exactly one thread entry, increments the queue row entry count, updates that reviewer's rollup cell and detail view, and stamps the timeline
- Workflow completion: criterion verdicts recompute the Admitted/Held outcome banner naming each failing criterion, the queue criteria summary, and the criterion failure-ranking chart without a reload
- Workflow completion: rollup cell activation applies the matching queue filter and its removable chip
- Workflow completion: Copy or Download of the active export format gives visible confirmation, appends a timestamped export-history entry naming the format, and stamps a report-export event on the timeline of every session-touched appendix record
- Workflow completion: Import of contract-valid Audit Package JSON reconstructs records, stages, checks, criteria, feedback, and rollups so the next JSON export preview matches; contract-invalid import leaves the desk unchanged

Mechanics exclusions:
- ECharts bar growth animation and pointer-hover tooltips are graded with the real pointer and stay Playwright-observed
- Guidance disclosure expand/collapse with rotating chevron and the task-detail slide-in/out stay Playwright-driven
- Run step retry backoff countdown ticks, rollup cell highlight pulses, and stage badge fade/scale transitions stay Playwright-observed
- Queue row enter/exit animation on filter changes stays Playwright-observed
- Clipboard contents and toast timing remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
