<summary>
Build a test-determinism triage queue for generated test suites using Svelte 5, Svelte stores (runes-based), Tailwind CSS 4.3.2, and Skeleton. The app produces the operator's triage report: Quarantine text and Triage report JSON compiled live from the active suite, downloadable and copyable, reflecting every reason change and re-run in the session.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Triage queue —
- The app opens into a triage queue seeded with at least 3 test suites of at least 10 tests each; a suite switcher makes every seeded suite reachable, and each suite's queue is non-empty on first load
- Each test row shows a test identifier, a 5-cell pass/fail matrix where each cell is colored by that run's result and labeled with its run index (1 through 5), a verdict chip, and the test's assigned reason identifier
- Verdicts derive from the matrix and nothing else: a test whose 5 runs all passed shows keep, a test with mixed results shows flaky, and a test whose 5 runs all failed shows fail; the chip always agrees with the visible cells
- Every inspected queue row exposes an API-shaped test record: a non-empty id, a verdict that is exactly keep, flaky, or fail agreeing with the 5-cell matrix, a reason from the closed 7-item vocabulary, and a detail schedule of exactly 5 runs each with index 1 through 5, result exactly pass or fail, and a closed condition label (CPU quota, terminal size, hostname, timezone, temp-dir length, or parallel execution)
- The reason on every row comes from a fixed 7-item vocabulary — timing-sensitive, environment-dependent, ordering-dependent, resource-quota, locale-dependent, filesystem-path, parallelism — chosen through a validated select that offers exactly those 7 options; typing an arbitrary free-text reason is impossible anywhere in the app
- Reason-update request-body field contract (a successful reason change IS the would-be request body): required testId (non-empty string matching a test in the active suite), required reason (exactly one of the 7 vocabulary entries). Choosing a different reason through the select submits that payload, updates that row immediately, and appends a reason-change entry to the suite's audit timeline

Feature: Test detail panel —
- Selecting a test row opens a detail panel without a full page reload, showing the test's full 5-run condition schedule: for each run, which condition was varied — CPU quota, terminal size, hostname, timezone, temp-dir length, or parallel execution — and that run's pass or fail result
- For flaky tests, the run (or runs) whose result diverged from the majority is visibly highlighted in the schedule together with the condition that was varied on that run
- The detail panel repeats the 5-cell matrix and verdict chip, and both always match the queue row for the same test

Feature: Filters and sort —
- Filters by verdict (keep, flaky, fail), by reason (the 7 vocabulary entries), and by suite narrow the queue; filters combine, and clearing them restores the full queue exactly
- A divergence sort orders tests by the count of their 5 runs that diverged from the majority result; activating it again reverses the order, and the visible row count never changes while sorting
- When active filters match no tests, the queue region shows an empty state message with a clear-filters control that restores the full queue

Feature: Quarantine map —
- A quarantine map panel shows two derived lists — all-fail tests and flaky tests — each with a live count in its header; membership derives from current verdicts and nothing else
- Whenever a verdict changes (through a re-run), both lists and their counts update immediately in the same session without a reload; a list with no members shows an empty state naming what belongs there

Feature: Re-run flow (API-shaped re-run request) —
- Each test offers a re-run control that opens a small form whose submitted record is exactly the re-run request payload: required runCount (exactly one of 3, 5, or 10). The runCount select offers exactly those three values; the submit control stays disabled until a run count is chosen, and submitting starts a simulated re-run for that test
- Submitting without a runCount starts nothing: the matrix is unchanged and the form shows an inline message naming the runCount field
- During a re-run, each run ticks in one at a time with its condition label and pass or fail result appearing in sequence, alongside an overall progress indicator; while runs remain, a stop control is visible
- Activating stop freezes the re-run: runs already completed keep their results on screen, remaining runs never fill in, and the re-run is marked stopped
- When a re-run completes (or is stopped with at least one result), the test's 5-cell matrix, verdict chip, quarantine list membership, and detail panel all update coherently to the new results in the same session; running the re-run twice can produce different results, and the surfaces always agree with each other

Feature: Audit timeline —
- Each suite has an audit event timeline recording verdict changes, reason changes, and re-runs (started, stopped, completed) as ordered entries, each with a timestamp and the affected test identifier
- The timeline is filterable by entry type; filtering to a type with no entries shows an empty state message, and clearing the filter restores all entries in order
- A suite with no recorded events yet shows an empty state naming what will appear there

Feature: Export triage report (useful end state) —
- An Export triage report control opens a drawer or modal with two format tabs — Quarantine text and Triage report JSON — compiled live from the store for the active suite
- Quarantine text is a monospaced block listing quarantined test identifiers grouped under all-fail and flaky headings matching the lists currently shown; Download offers flake-triage-quarantine.txt of that exact text
- Triage report JSON field contract (API-shaped flake-triage list response; Copy and Download share this schema; field names visible in the preview text): required schemaVersion exactly equal to flake-triage-report-v1; required exportedAt as an ISO-8601 timestamp string ending in Z; required suiteId (non-empty string); required suiteName (non-empty string); required tests (array of test records for the active suite); required quarantine (object with required allFail and flaky arrays of test id strings matching the on-screen quarantine lists)
- Each tests array entry carries the API-shaped test record: id (non-empty string), verdict (exactly keep, flaky, or fail), reason (exactly one of the 7 vocabulary entries), and runs (array of exactly 5 objects each with index 1 through 5, result exactly pass or fail, and condition exactly one of CPU quota, terminal size, hostname, timezone, temp-dir length, or parallel execution)
- The preview derives from live session state: changing a reason or completing a re-run before reopening Export changes the JSON to include those mutations; an export that omits a session mutation is incorrect
- Copy places the exact visible preview text on the clipboard and shows a visible confirmation (icon swap or toast) that resets after a moment; Download starts a flake-triage-report.json file download of that same Triage report JSON text (or the quarantine text file when that tab is active)

Feature: Import triage report —
- An Import triage report control accepts pasted Triage report JSON text matching the export field contract under import mode replace-suite
- A valid import replaces the active suite's tests, reasons, matrices, verdicts, and quarantine membership so the queue, detail panel, quarantine map, and the next Export preview match the imported document
- Malformed JSON, or JSON that violates the field contract (schemaVersion not flake-triage-report-v1, missing required keys tests or quarantine, verdict or reason outside the closed sets, runs length not exactly 5, result outside pass/fail, condition outside the closed condition set), shows an inline error naming the import problem, leaves the suite unchanged, and does not treat the attempt as a successful mutation
</core_features>

<user_flows>
- Triaging a flaky test end to end: filter the queue to flaky, select a test, read which varied condition diverged in the detail panel, change its reason through the select to the matching vocabulary entry, and see the row update, a reason-change entry appear in the audit timeline, and Triage report JSON show the new reason — all without a reload
- Re-running to a new verdict: open a flaky test's re-run form, choose 5 runs, watch each run tick in with its condition label and result, and when it completes see the matrix cells, verdict chip, quarantine lists, detail panel, and Triage report JSON all reflect the new outcome together in the same session
- Stopping mid-run: start a 10-run re-run, activate stop after at least 1 run has completed, and confirm the completed results stay frozen on screen, no further runs fill in, and the timeline records the stopped re-run
- Working the quarantine map: note the all-fail and flaky counts, re-run a test until its verdict changes, watch the counts and list membership shift immediately, then open Export triage report, copy the Quarantine text, and see the confirmation; the copied text matches the rendered block exactly
- Mutation-to-export: change a reason and complete a re-run, open Export triage report, and confirm Triage report JSON contains schemaVersion flake-triage-report-v1, that test's updated reason and runs or verdict, and quarantine arrays matching the on-screen lists; Copy and Download controls are available
- Export then import round-trip: after a reason change and completed re-run, Copy Triage report JSON, diverge with another reason change, Import that copied JSON, and confirm queue reasons, matrices, quarantine counts, and the next Export preview match the imported document
- A page reload returns the app to its seeded state: the seeded suites, matrices, verdicts, reasons, and an empty-or-seeded timeline baseline, with no re-run results or import mutations surviving
</user_flows>

<edge_cases>
- Submitting the re-run form without choosing a runCount starts nothing: the matrix is unchanged and the form shows an inline message naming the runCount field
- Double-activating the re-run submit control starts exactly one re-run: the timeline gains one re-run started entry, not two
- Stopping a re-run before any run completes leaves the test's previous matrix and verdict fully intact
- When every test in view is keep, both quarantine lists show their empty states and Quarantine text contains only the group headings with no identifiers while Triage report JSON has empty allFail and flaky arrays
- Importing malformed Triage report JSON or a document that breaks the field contract (wrong schemaVersion, missing tests or quarantine, reason outside the 7-item vocabulary) shows an inline import error naming the problem, leaves reasons and matrices unchanged, and does not update the Export preview as if a successful import occurred
</edge_cases>

<visual_design>
- Queue composition: a dense triage table beside a detail panel, with the quarantine map and audit timeline as distinct panels; header includes Export triage report and Import triage report controls; rows separated by hairline borders, panels as cards with subtle shadows
- One consistent result color language: pass and fail cell colors are identical in the queue matrices, the detail schedule, and the re-run ticker, and a visible legend states them
- Verdict chips are visually distinct from one another and consistent everywhere: keep, flaky, and fail each keep one treatment across queue, detail, and quarantine surfaces
- Typographic hierarchy: suite and panel titles visibly larger than test identifiers, which are larger than condition and timestamp text; test identifiers, reason identifiers, and the export previews render in a monospaced face
- The Quarantine text and Triage report JSON previews each render on a visually distinct monospaced surface; the import surface uses the same visual language
- A light/dark theme toggle in the header recolors all surfaces, chips, and matrix cells without a reload
- One consistent icon set across all chrome; buttons, selects, and inputs show distinct default, hover, focus (visible ring), disabled, and error treatments
- Headings and action labels use one consistent capitalization convention, action labels are specific verbs (Start re-run, Stop run, Export triage report, Import triage report, Copy, Download), and no placeholder text appears anywhere in the shipped UI
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; test rows, timeline entries, and quarantine list rows take a full-width hover wash; form controls show focus rings
- During a re-run driven from the real re-run control, each run's cell ticks in with a short entrance transition as its result lands, and the progress indicator advances smoothly rather than jumping
- A verdict chip that changes after a re-run transitions to its new treatment rather than swapping instantly, and a test entering or leaving a quarantine list animates in or out of that list rather than snapping
- The detail panel, the re-run form, and the export and import surfaces open with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way; new audit timeline entries animate into the list
- Feedback toasts (copy confirmation, re-run completed, re-run stopped, import success or failure) slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, animations are removed and every state change still applies instantly and completely
</motion>

<responsiveness>
- At desktop widths the queue, detail panel, and quarantine map are visible together; at widths of 768 pixels and below the detail panel and quarantine map stack below the queue or open as panels reachable from visible controls
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the queue table and export preview scroll within their own containers when they cannot fit
</responsiveness>

<accessibility>
- Every interactive control — suite switcher, test rows, reason selects, filters, sort, re-run and stop controls, Export triage report, Import triage report, and copy controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The re-run form, export drawer, and import surface close on Escape and return focus to the control that opened them; the reason select is operable with arrow keys and Enter
- Re-run completion, stop, copy confirmations, and import success or failure are announced through an aria-live region as well as shown visually
- Form fields have visible labels; each validation or import message names the field or key it belongs to and is associated with it
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a complete 10-run re-run, a stop, export copy, and an invalid import attempt
- The UI stays responsive under rapid repeated input — switching suites, toggling filters, starting re-runs, and reopening Export — with no hangs or dropped interactions; re-run progress shows a deliberate loading affordance rather than a blank region
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app
- Validation and import errors name the field and the rule broken (runCount, schemaVersion, reason, quarantine); empty states explain what belongs in the region and how to clear filters or produce timeline entries
- Action labels use specific verbs such as Start re-run, Stop run, Export triage report, Import triage report, Copy, and Download rather than generic labels where a specific one is possible
- No placeholder or filler text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional: a compact condition-correlation strip showing which varied conditions appear most often on diverging flaky runs in the active suite, derived from the same store as the detail schedules
- Optional: a printable quarantine summary layout reachable from the export drawer that restates all-fail and flaky counts without changing store state
- Optional: a short coachmarks tour that highlights the triage queue, Export triage report, and Start re-run on first visit, dismissible and never blocking the primary workflow
</innovation>

<requirements>
Shared application state must live in Svelte stores (runes-based) (in-memory only): the suites and tests collection with per-run results and condition schedules, verdicts and reasons, the selected suite and test, re-run progress and stop state, audit timeline entries, filters and sort, theme, export preview text, import draft, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Triage report JSON (and Quarantine text) plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Verdict chips, quarantine lists and counts, and both export formats all derive live from the one store of run results; they never disagree with each other or with the matrix cells
- A re-run writes results into the store one run at a time, and every surface showing that test (queue row, detail panel, quarantine map, timeline, Triage report JSON) reflects each change without a reload
- Stop freezes the store's completed results for that re-run; nothing rewrites them afterward
- Reasons are constrained to the 7-item vocabulary at the store level: no path in the UI can attach any other reason value
- Filters and sort recompute the visible queue from the shared collection; they do not create a second disconnected copy
- Theme, selected suite, and selected test are shared client state; changing them does not reload the document
- Triage report JSON export and a successful import conform to the same field contract; Quarantine text matches the quarantine lists currently shown
- Any automation or tool handlers exposed by the app invoke the same store commands the visible controls use
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Skeleton is the component library for the app shell, tables, chips, selects, tabs, drawers, and toasts; no other component library. AutoAnimate and svelte-motion allowed for animation; no other animation libraries. Tabler icons only, installed via its Svelte npm package — no raw copy-pasted SVG icon sets. All forms — the re-run form, reason selects, Import triage report, and any filter or settings forms — are driven by TanStack Form validating through a Zod schema that mirrors the API-shaped reason-update, re-run request, and triage-report JSON field contracts above: the schema defines the rules (including the closed 7-reason vocabulary and the 3/5/10 runCount choice) and inline per-field errors render before submit. The record a successful reason change or re-run submit creates is exactly that request body; Copy/Download/Import validate through the same schemas. End-state contract: Download flake-triage-report.json, Download flake-triage-quarantine.txt, and Copy MUST emit the session's actual suite mutations under those field contracts — an export that omits session work is invalid; Import MUST restore the same visible suite (round-trip). All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 3 suites of at least 10 tests each, with 5-run matrices covering all three verdicts (at least 2 keep, 2 flaky, and 2 fail tests visible across the seeded data) and a full varied-condition schedule per test
- Test identifiers, hostnames, and condition values are fictional seeded strings
- Invalid re-run submissions must not start a run or add a timeline entry; show visible validation feedback
- Triage report JSON export must be compiled live from the current store; after any session mutation that changes reasons, matrices, verdicts, or quarantine membership, reopening Export triage report must include that mutation
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Icon set and any imagery bundled locally
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
- browse-query-v1
- entity-collection-v1
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
- Browsable entity: tests
- Destinations: triage-queue; test-detail; quarantine-map; audit-timeline
- Filters: verdict; reason; suite; timeline-entry-type
- Sorts: divergence
- Themes: light; dark
- Entity: test
- Entity operations: select; update
- Entity fields: reason
- Value bounds: {"reason":["timing-sensitive","environment-dependent","ordering-dependent","resource-quota","locale-dependent","filesystem-path","parallelism"],"run-count":[3,5,10]}
- Session operations: start; stop
- Workflow completion: re-run writes results one run at a time; matrix, verdict chip, quarantine lists, and timeline update coherently
- Workflow completion: stop freezes completed run results; remaining runs never fill in
- Artifact operations: export; copy; import
- Export formats: quarantine-text; triage-report-json
- Import modes: replace-suite

Mechanics exclusions:
- Re-run form validation mechanics (runCount select required, disabled submit, inline error naming the field) and Import triage report field-contract rejection are graded through the real forms via Playwright
- Per-run tick-in entrance transitions and progress-indicator smoothness stay Playwright-observed
- Clipboard contents and downloaded file bytes of the quarantine text and triage-report JSON exports are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
