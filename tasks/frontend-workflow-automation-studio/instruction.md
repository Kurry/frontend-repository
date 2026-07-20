<summary>
Build a browser automation studio for the Ternwave platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Script library —
- The left sidebar lists all saved automation scripts (at least 3 seeded on first load); each entry shows the script name, its step count, a last-run status badge, and a last-run timestamp
- Clicking New Script opens a modal with fields: script name (required), target URL (required, must parse as a URL), and description (optional); the Create control stays disabled until name and target URL are valid, and submitting creates a blank script with one empty step and selects it
- Submitting New Script with an invalid target URL shows an inline validation message naming the URL field and creates nothing
- Each library entry has a checkbox; a bulk actions bar appears when at least one script is selected showing the live selected count, with Duplicate selected (each copy appears suffixed Copy) and Delete selected (one confirmation naming the count) applying to every selected script at once
- Deleting a script removes it from the library, its run history, and the schedule queue together

Feature: Command palette —
- Pressing Ctrl+K (Cmd+K on macOS) opens a command palette overlay with its search input focused; typing fuzzy-matches across script names, step labels within the selected script, and view names, and the result list narrows as the user types
- Arrow keys move a visible highlight and Enter activates the highlighted result: a script result selects that script, a step result scrolls to and highlights that step in the editor, and a view result switches views; Escape closes the palette and each result row shows a kind label; a query matching nothing shows an empty-state line

Feature: Step editor —
- The main panel shows the selected script as an ordered, numbered list of steps; each step has a type selector (Navigate, Click, Type, Extract, Wait, Screenshot, Assert Text) and type-specific parameter fields inline in the row
- Each step type shows only its relevant fields: Navigate shows a URL input; Click shows a CSS selector input; Type shows selector and text inputs; Extract shows selector and variable-name inputs; Wait shows a milliseconds input; Screenshot shows no extra field; Assert Text shows selector and expected-text inputs
- Step parameter fields validate inline: an empty required selector, a non-numeric wait duration, or an empty extract variable name shows a message naming the field, and a step with invalid parameters carries a visible warning marker in the list
- Clicking Add Step appends a new step at the bottom with a default type of Click; dragging a step reorders the list and the numbering updates; clicking Delete on a step removes it after an inline confirmation
- Step checkboxes enable bulk step operations from a bar showing the selected count: Disable selected (skipped at run time, rendered dimmed with a Disabled tag), Enable selected, Duplicate selected, and Delete selected (single inline confirmation)
- Editing any step or the script's name marks the script as having unsaved changes; a Save version control commits the changes as a new numbered version and clears the unsaved marker

Feature: Version history —
- A Versions panel in the script detail lists every saved version with its number, timestamp, and step count, newest first; the current version is marked
- Selecting an older version shows a read-only preview of its steps; a Restore control copies that version's steps into a new version (the version list grows by one and the editor shows the restored steps); versions are never edited in place

Feature: Simulated run and console —
- Clicking Run Script starts a simulated execution; each step highlights in sequence with a running-state border, pauses for a realistic delay, then shows a pass or fail badge; disabled steps are skipped with a visible Skipped badge
- The run console below the step list is a terminal-style pane with a dark background and monospace text streaming one line per step with a timestamp, the step type, and the pass or fail result; failed lines show the error reason in the error color and pass lines render in the success color
- A theme selector on the console offers at least 3 named terminal themes; switching themes visibly changes the console's background and text colors while preserving the log content
- A run producing at least 200 console lines (looped scripts or repeated runs accumulate) still scrolls smoothly with no dropped frames; the console auto-follows the newest line, stops following when the user scrolls up, and shows a jump-to-latest control that resumes following
- A failing step retries automatically with a visible backoff countdown and attempt counter (for example, waiting before retry 2 of 3); a step that exhausts its retries is marked failed with an inline error reason and a manual Retry control that resumes the run from that step, with earlier steps' results and timestamps unchanged
- A running script can be paused and resumed: pausing freezes progression at the current step; resuming continues from exactly that step, and completed steps never re-execute
- A run-level rollup derives live from step states — passed count out of total (n of m), elapsed duration, retry count, and failure count — and updates as steps advance
- Each run has an event timeline: an ordered log of step transitions with timestamps, filterable by status; selecting a timeline entry highlights the corresponding step
- Extract steps write rows into an extracted-values table (variable name, value, source step number) that fills as the run progresses; the simulated values vary between runs
- Screenshot steps produce a simulated placeholder screenshot image in the console; clicking the placeholder opens a modal showing the full-size image with the step label

Feature: Selector playground —
- A Playground view provides a mock HTML textarea (prefilled with a seeded snippet), a selector input, and a rendered preview of the HTML; typing a CSS selector highlights every matched element in the preview and shows a live match count
- A selector matching nothing shows a zero-match message; an invalid selector shows an inline error naming the problem without breaking the preview
- A Send to step control copies the current selector into the selector field of a chosen step in the selected script

Feature: Run history and diff —
- A Runs view lists the selected script's past runs (at least 3 seeded per seeded script) with run number, start time, duration, pass/fail totals, and a status badge; selecting a run shows its per-step results and extracted values read-only
- Choosing two runs and activating Compare opens a diff view that pairs the runs step by step and highlights differences: a changed extracted value, a step passing in one run and failing in the other, and steps present in only one run are each marked with distinct added/removed/changed treatments
- Comparing a run against itself shows an explicit no-differences state rather than an empty screen

Feature: Schedule —
- A Schedule toggle in the script detail header enables recurring runs; a time picker and repeat interval select (hourly, daily, weekly) appear when toggled on, and the sidebar entry shows a clock icon badge while scheduled
- A Scheduled queue view lists all scheduled scripts with their next simulated run time and a live countdown; a Trigger now control on a queue entry starts that script's run immediately and writes a normal run record into its history, marked as schedule-triggered
- Saving the schedule form with a missing time or no interval shows inline validation naming the field and does not enable the schedule

Feature: Undo and redo timeline —
- Undo and Redo controls in the toolbar respond to Ctrl+Z and Ctrl+Shift+Z (Cmd variants on macOS) and are disabled when their stacks are empty
- Undo reverses the most recent editing action — a step add, delete, reorder, parameter edit, bulk step operation, script create or delete, or schedule change — restoring the exact prior state including step numbering, badges, and the export preview
- A history timeline panel lists recent editing actions in order with human-readable labels; clicking an older entry rolls the workspace back to the state just after that action, and the entries after it are shown as undone until a new action clears them
- Performing a new action after an undo clears the redo stack and disables Redo

Feature: Export center —
- An Export view shows a live-compiled preview in a monospaced block with two tabs: Definition JSON (the selected script's name, target URL, steps with parameters, disabled flags, version number, and schedule) and Run report (the latest run's per-step results, retry counts, extracted values, timeline summary, and rollup totals)
- The Definition JSON is API-shaped like a real automation-service payload: a script object with id, name, target_url, version, a schedule object (enabled flag, time, and an interval that is exactly one of hourly, daily, or weekly), and a steps array where each step carries id, order, a type that is exactly one of navigate, click, type, extract, wait, screenshot, or assert_text, a params object holding only that type's typed fields (for example wait carries a positive integer ms, extract carries selector and variable), and a disabled flag — these field names and enum values are visible in the preview text
- The Run report is likewise API-shaped: a run object with run id, trigger (manual or schedule), start time, duration, totals (passed, failed, skipped, retries), and a steps array of per-step outcomes each carrying order, type, a status that is exactly one of pass, fail, or skipped, an attempts count, an error reason on failures, and the extracted name and value where the step extracted one
- The record each form creates is exactly the object that appears in the Definition JSON — same field names, bounds, and enums — and form validation enforces the same contracts the export shape declares, always naming the offending field inline
- The preview compiles from current session state: editing a step, completing a run, or changing the schedule changes the corresponding preview values without a reload
- A Copy export control puts the exact visible preview text on the clipboard and shows a visible confirmation (icon swap or toast) that reverts after a moment
- The Run report's totals always match the run console's rollup and the Runs view's figures for the same run
</core_features>

<user_flows>
- Building and running end to end: creating a script, adding a Navigate, a Type, an Extract, and an Assert Text step with valid parameters, saving a version, and clicking Run Script highlights the steps in order, streams one console line per step, fills the extracted-values table, updates the rollup to n of m, and writes one new run record into the Runs view — and the Definition JSON preview shows all four steps while the Run report shows the new run's results, all without a reload
- Recovering from failure: when a step exhausts its retries, the rollup failure count increases and the console shows the error reason; activating the step's Retry control resumes from that step, pausing and resuming freezes and continues at the same step, and the event timeline records the retry, pause, and resume transitions in order
- Selector to step: pasting HTML into the Playground, typing a selector that highlights two matched elements with a match count of 2, and using Send to step writes that selector into the chosen step's field, where it is visible when the editor is reopened
- Diffing runs: running the same script twice produces two run records whose extracted values differ; selecting both and activating Compare highlights the changed values, and comparing a run with itself shows the no-differences state
- Schedule round trip: enabling a schedule with a time and interval shows the clock badge in the sidebar and a countdown in the Scheduled queue; Trigger now produces a schedule-triggered run record in history, and the Run report tab then reflects that run's totals
- Edit with undo timeline: reordering two steps, deleting a third, then clicking the history timeline entry from before the delete restores the deleted step and its position while keeping the reorder; a page reload afterward returns the app to its seeded state — seeded scripts, seeded runs, no schedules, and empty undo history
</user_flows>

<edge_cases>
- Double-activating Run Script starts exactly one run: one set of step highlights, one new run record, and one rollup sequence
- Double-activating New Script's Create control creates exactly one script
- Deleting the currently selected script clears the editor to an empty state with a message and a control to create or select a script
- A script whose steps are all disabled runs to an immediate completion state showing all steps Skipped and a run record with zero passes and zero failures
- Undo with an empty stack and Redo with an empty redo stack are disabled and produce no console errors
- A Wait step with a non-numeric duration keeps its warning marker and the run pauses on it as failed validation rather than crashing; fixing the value clears the marker
- Removing every step from a script shows an empty-state message in the editor naming Add Step as the next action; Run Script is disabled while the script has no enabled steps
- Filtering the event timeline to a status with no entries shows an empty-state message rather than a blank area
- The console's jump-to-latest control appears only after scrolling away from the newest line and disappears once following resumes
- Copying the export mid-run copies exactly the text currently visible in the preview block
</edge_cases>

<visual_design>
- Layout: a left sidebar with the script library and bulk bar; a main area that swaps between the step editor (with console below), Playground, Runs, Scheduled queue, and Export views via a toolbar view switcher; the Versions panel renders alongside the step editor
- The step list is a numbered structured list; the active (running) step has a 2 pixel solid brand-blue left border and a pulsing background while it runs
- Step type selectors and parameter fields render inline within the step row using consistent compact controls
- The run console uses a near-black background with monospace text; pass lines render in the success green, fail lines in the error red, and each offered console theme keeps that pass/fail distinction legible
- Scheduled scripts show a small clock icon badge (around 12 pixels) on their sidebar entry
- Disabled steps render dimmed with a Disabled tag; skipped, passed, and failed step badges are visually distinct at a glance and consistent between the step list, console, timeline, and Runs view
- Diff highlights use three distinct treatments for added, removed, and changed rows, each carrying an icon or label in addition to color
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than step rows and console text, consistent across views
- Spacing follows a consistent rhythm: gaps between the sidebar, editor, console, and panels are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the toolbar, library entries, step rows, and status badges
</visual_design>

<motion>
- Each step highlights as active with a roughly 200 millisecond background fade-in and fades out when it completes
- Console lines appear one at a time with a roughly 50 millisecond stagger while a run streams
- Dragging a step to reorder animates the other steps smoothly out of the way, and the dropped step settles into place rather than snapping
- Step badges (pass, fail, skipped) transition in with a short fade; the retry countdown ticks visibly and the pulsing running background animates continuously
- The New Script modal and the screenshot modal enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- Playground selector matches highlight with a brief emphasis animation when the match set changes
- The Copy export confirmation swaps its icon with a brief transition and reverts after a moment
- Feedback toasts after version saves, bulk operations, and schedule changes slide in, remain readable, and auto-dismiss with a fade
- Hover animations (required): buttons ease background and shadow with a slight press effect; library entries, step rows, run rows, and timeline entries take a full-width hover wash; form controls show focus rings
- With prefers-reduced-motion set, steps and console lines appear without animation and all transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the script library collapses behind a toggle control that opens it as an overlay; at desktop widths the sidebar is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the console, diff view, and export preview scroll within their own containers
- The step editor's inline parameter fields wrap or stack at narrow widths without losing any field
</responsiveness>

<accessibility>
- Every interactive control — library entries and checkboxes, step type selectors and fields, drag handles, run controls, console theme selector, diff run pickers, schedule fields, undo and redo, and the palette — is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals trap focus while open, close on Escape, and return focus to the control that opened them
- Run completion, a step entering the failed state, and pause and resume are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Pass, fail, skipped, and diff states are conveyed by text or icon plus color, never color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — quick script switches, rapid step edits, fast view toggles, rapid undo/redo — with no hangs or dropped interactions, including while a run is streaming console lines
- Scrolling a console holding at least 200 lines and a Runs list holding many records stays smooth with no perceptible frame drops
</performance>

<writing>
- Headings, view names, and buttons use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Run Script, Save version, Trigger now, and Copy export rather than generic labels where a specific one is possible
- Validation messages name the offending field and the fix; empty states explain what belongs in the region and the control that fills it; no placeholder text appears anywhere in the shipped UI
- Status vocabulary is identical everywhere it appears: Pass, Fail, Skipped, Running, Retrying, and Paused, never synonyms
</writing>

<innovation>
- Optional enhancements are welcome where they do not conflict with the specified behaviors: a step template gallery, per-script run statistics sparklines, keyboard-driven step editing, or a subtle celebration when a previously failing script completes fully green
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the script collection with steps, parameters, disabled flags, and unsaved markers, version histories, run records with per-step results, retry counts, extracted values, and timelines, the live run's step statuses, checkpoints, and console lines, console theme and follow state, the playground HTML, selector, and match set, schedules and countdowns, the undo and redo stacks and history timeline, selection sets, the command palette state, the export preview text, the active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating, editing, duplicating, or deleting a script updates the library, the editor, run history, the schedule queue, and the export preview from the same shared state
- Advancing a run step updates the step list, the console, the event timeline, the extracted-values table, and the rollup from the same shared run state; pausing and resuming preserve completed steps' results and timestamps
- Completing a run updates the library entry's last-run badge and timestamp, the Runs view, and the Run report tab from the same shared results data
- Undo, redo, and history-timeline rollback operate on the same shared state the views render from, so every dependent surface reverts together
- Version restore, schedule toggles, and theme switches are shared client state; none of them reloads the document
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, structured lists, tags, selects, text inputs, notifications, and toggles; no other component library. @dnd-kit/core for step reordering. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — New Script, step parameter forms, the schedule form, and the playground selector input — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Schemas are API-shaped: each form's schema models the payload a real automation API would accept (the script record with a URL-format target_url, per-type step params with their bounds — positive integer wait ms, non-empty selectors, non-empty extract variable names — and the schedule record with its interval enum and required time when enabled), the record a form creates is the would-be request body, and the Definition JSON and Run report compile and validate against those same schemas. All libraries installed via npm and bundled locally; no CDN imports. No backend, no authentication, and no actual browser launch — all execution is simulated with scripted delays, occasional simulated failures with retries, and varied extracted values, so two runs of the same script produce different (not identical) run records. Placeholder screenshots are locally generated or bundled assets — no outbound requests.
- Seed at least 3 scripts with at least 5 steps each (covering all seven step types across the seeds, including at least one Extract and one Screenshot step), at least 3 historical runs per seeded script, and a prefilled playground HTML snippet, so the library, Runs view, and export preview are non-empty on first load
- Submitting any form with invalid required fields must not change the underlying collections; show visible validation feedback
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- structured-editor-v1
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
- Browsable entity: scripts
- Destinations: step-editor; playground; runs; scheduled-queue; export
- Filters: timeline-status; compare-pair
- Editor object types: script; step; schedule; playground
- Editor properties: name; target-url; description; step-type; url; selector; text; variable; ms; expected-text; disabled; order; schedule-enabled; schedule-time; schedule-interval; mock-html; playground-selector; console-theme
- Editor operations: select; add; delete; update_property; set_content; switch_mode; preview
- Editor modes: edit; version-preview; diff
- Session operations: start; pause; resume; restart
- Demos: script-run; trigger-now; save-version; restore-version
- Artifact operations: export; copy
- Export formats: definition-json; run-report-json
- Value bounds: step type in {navigate, click, type, extract, wait, screenshot, assert_text}; wait ms positive integer; selectors and extract variable names non-empty; target_url must parse as a URL; schedule interval in {hourly, daily, weekly}; time required when enabled; run step status in {pass, fail, skipped}; trigger in {manual, schedule}; duplicated scripts suffixed Copy; delete requires confirm=true
- Workflow completion: creating a script adds one library entry with step count and selects it; deleting removes it from the library, run history, and schedule queue together
- Workflow completion: a run highlights steps in sequence, streams console lines, fills the extracted-values table, updates the n-of-m rollup, and writes one run record into the Runs view
- Workflow completion: pause freezes at the current step and resume continues from exactly that step; completed steps' results and timestamps never change
- Workflow completion: save-version grows the Versions panel by one and clears the unsaved marker; restore copies the old steps into a new version
- Workflow completion: enabling a schedule shows the sidebar clock badge and a Scheduled-queue countdown; Trigger now writes a schedule-triggered run record
- Workflow completion: Definition JSON reflects step edits, disabled flags, version number, and schedule; Run report totals match the console rollup and the Runs view

Mechanics exclusions:
- Step drag-to-reorder gesture (@dnd-kit slide-out-of-the-way, drop settle) is graded via Playwright; the resulting order as state may be asserted afterward
- Console streaming stagger, 200-line scroll smoothness, auto-follow / jump-to-latest scroll behavior, and terminal theme rendering stay Playwright-observed
- Command palette Ctrl+K, fuzzy narrowing, arrow-key highlight, and step scroll-to-highlight are keyboard mechanics graded via Playwright
- Undo/redo shortcuts and history-timeline rollback clicks are graded through the real toolbar and timeline entries via Playwright
- Playground selector-match highlight emphasis, active-step pulsing border, retry countdown ticking, modal enter/exit transitions, and toasts stay Playwright-observed
- Clipboard contents of Copy export are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
