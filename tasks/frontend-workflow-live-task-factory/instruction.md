<summary>
Build a live task factory console — a dual-mode workbench that turns merged GitHub pull requests into downloadable evaluation task packages — using React, Zustand, Tailwind CSS 4.3.2, and shadcn/ui. The useful end state is the portable task package: every completed run produces a TaskPackageBundle JSON the user can copy, download, re-import, and query through WebMCP, conforming to the field contracts below.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Connections panel and dual mode —
- A Connections control in the top bar opens a slide-over panel with two credential sections: a GitHub token field, and an AI endpoint section with a base URL field prefilled with https://api.openai.com and an API key field; both key fields are masked by default and each has a show/hide toggle that reveals the value only while active
- On first load, with no credentials entered, the app runs in demo mode on seeded fixture data: a clearly visible mode indicator in the top bar reads Demo data, and every screen is fully populated and exercisable without any credential
- Entering a GitHub token and activating its Connect control performs a single lightweight account check against the GitHub API; while the check runs the credential row shows a checking status, on success it shows Connected with the account login, and on failure it shows a visible error carrying the failure status or message and remains Disconnected
- Entering an AI API key and activating its Connect control performs one lightweight check against the configured base URL, with the same checking, Connected, and Disconnected-with-error presentation
- With credentials connected, the same screens and controls operate on live data fetched from the connected services; the only visible differences are the mode indicator reading Live and the connection statuses — no screen, control, or flow appears, disappears, or changes shape between demo and live mode
- A failed credential check leaves the app fully functional on demo data: the fixture repositories, PRs, and packages remain in place and every flow still works
- Disconnecting a credential clears it immediately: its status returns to Disconnected, and the mode indicator returns to Demo data once no credential remains connected
- Credentials are never persisted: after a page reload both credentials show Disconnected and the mode indicator reads Demo data until keys are re-entered

Feature: Repositories and candidate PRs —
- The Candidates view lists 3 seeded repositories — nimbusworks/driftline (TypeScript), cobalt-labs/loomdb (Rust), and fernfield/petrel (Python) — each entry showing the repository name, primary language, and merged-PR count
- AddRepository field contract (API-shaped create payload; the submitted record IS this request body): repository (required string matching the owner/name shape with exactly one slash and non-empty owner and name segments). Submitting an empty or malformed value shows an inline error naming the repository field and adds nothing
- In live mode, submitting a valid AddRepository payload fetches that repo's merged pull requests from the GitHub API and adds the repo to the list; in demo mode the same form shows a visible notice that adding repositories requires a GitHub connection, and the fixture repositories remain available
- Selecting a repository lists its merged pull requests — each seeded repository ships at least 8 — showing per PR: the number, title, merged date, a linked-issue indicator, the changed-file count, and a source-file count that excludes test files
- The PR list loads in pages of 5 with a visible control to load the next page and a running count of loaded versus total PRs; in live mode paging fetches the next page from the GitHub API
- A source-file filter with minimum and maximum bounds (defaults 3 and 10) narrows the list to PRs whose non-test source-file count falls inside the bounds, and a require-linked-issue toggle further narrows to PRs with a linked issue; active filters render as removable chips and clearing them restores the full list exactly
- Selecting a PR opens its detail: the full title and body text, the linked issue with its number and title or an explicit No linked issue notice, and a changed-files table listing each filename with its additions and deletions; files recognized as tests (paths containing a test, tests, or __tests__ directory, or filenames ending in .test or .spec before the extension, or starting with test_) are visibly tagged as test files and excluded from the source-file count

Feature: Triage board —
- A Triage view presents candidate PRs as cards in three columns: Inbox, Accepted, and Rejected; an Accept action moves the card to Accepted
- RejectAction field contract (API-shaped request body; a successful reject produces this payload on the card): reason (required closed enum string, exactly one of too-few-files, too-many-files, docs-only, no-linked-issue). Reject requires a chosen reason matching this contract before it completes; rejecting without a reason is blocked with an inline message naming the missing reason
- Rejected cards display their reject reason as a labeled badge, and the Rejected column can be filtered by reason
- Board header stats derive live from the cards: total candidates, accepted count, rejected count, and a per-reason rejected breakdown; every triage action updates these counts immediately without a reload
- Each accept or reject surfaces an Undo affordance (toast or inline control) that restores the card to its previous column and reverts the stats exactly; undo covers at least the most recent triage action
- Triage placements persist: after a page reload, every card sits in the column it was placed in with its reject reason intact

Feature: Pipeline runner —
- From an accepted PR, a Run pipeline control starts a staged run with four visible stages in order: Fetch, Evaluate, Generate, Package; each stage shows a status advancing visibly through pending, running, and complete or failed, and a retrying stage shows a retrying status with an attempt counter (for example attempt 2 of 3)
- The Fetch stage summarizes the PR data it gathered: title, linked issue, base commit SHA, and the source-file list it will feed forward
- The Evaluate stage streams its output progressively — the substantiality assessment text appears incrementally, not all at once — and ends with a visible verdict of substantial or trivial plus a one-line reason citing the PR's non-test source-file count against the 3-to-10 window
- The Generate stage streams the task instruction text as it is produced, derived from the PR's linked issue and title; its final streamed text becomes the package's instruction document
- In live mode the Evaluate and Generate stages call the configured chat-completions endpoint and stream the model's output; in demo mode the same stages stream deterministic text derived from the selected PR's fixture data — stage layout, statuses, streaming behavior, and controls are identical in both modes
- A stage failure surfaces inline with its status code and message and a Retry control; retrying resumes from the failed stage, and completed stages keep their outputs and timestamps and never re-execute
- A rate-limited response shows a visible reset countdown that ticks down to zero and then retries automatically, incrementing the attempt counter
- A running pipeline can be paused and resumed: pausing freezes stage progression at the current stage, and resuming continues from exactly that stage with earlier outputs unchanged
- Every run has an event timeline: an ordered log of stage transitions with timestamps, filterable by status; selecting a timeline entry highlights the corresponding stage in the stage list
- In demo mode two seeded failure paths exist and all other seeded PRs run clean: nimbusworks/driftline PR 58 hits a simulated rate limit on Evaluate's first attempt — a 429 status with a 20 second reset countdown — and succeeds on the automatic second attempt; fernfield/petrel PR 31 fails its Generate stage across 3 attempts with visible backoff, is marked failed with an inline error summary, and completes after a manual Retry
- Evaluating a PR whose verdict is trivial ends the run after Evaluate with a visible trivial outcome and no package; the verdict text names the reason (for example a docs-only change or a source-file count outside 3 to 10)

Feature: Task package output (useful end state) —
- A completed run PRODUCES the user's task package: presented in a package viewer with four parts — the instruction document (the Generate stage's actual streamed text), a TOML-shaped task config, a metadata summary (repository, PR number, base commit SHA, language, difficulty, source-file count), and a bug-patch placeholder note naming the PR's non-test source files that the patch step would revert
- Difficulty derives from the PR's non-test source-file count: 3 to 4 files is easy, 5 to 7 is medium, 8 to 10 is hard; the metadata shows both the count and the derived difficulty
- TaskPackageBundle field contract (API-shaped task-create / package payload; the record a completed run creates IS this request body; Copy, Download bundle, Library re-export, and Import all conform; field names and enum values are visible in the JSON; all keys REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly live-task-package-v1), repo (required owner/name string with exactly one slash), pr_number (required positive integer), base_sha (required 40-character lowercase hex), language (required non-empty string), difficulty (required closed enum exactly one of easy, medium, hard), source_file_count (required integer from 3 to 10 inclusive), created_at (required ISO 8601 date-time), instruction (required non-empty string — the Generate stage's final streamed text), task_config (required non-empty TOML-shaped string), patch_note (required non-empty string naming the non-test source files)
- The package viewer offers per-part copy controls with a visible copied confirmation, individual file downloads for the instruction document and the task config, and a Download bundle control that downloads one TaskPackageBundle JSON file
- Package content always reflects the session's run: the viewer text, the copied text, and the downloaded files contain the same instruction text that streamed during that run's Generate stage, and the metadata matches the PR the run was started from — an export that omits session work or violates the field contract is incorrect

Feature: Batch runs and run report —
- A batch composer lets the user queue 2 or more accepted PRs and start the batch; queued items run sequentially, each with its own visible stage progression, under an overall progress indicator counting n of m complete
- BatchRunReport field contract (API-shaped report payload; Download report conforms): total (required non-negative integer), packaged (required non-negative integer), trivial (required non-negative integer), failed (required non-negative integer), skipped (required non-negative integer), items (required array of objects each with repo owner/name, pr_number positive integer, and outcome exactly one of packaged, trivial, failed, skipped); packaged + trivial + failed + skipped MUST equal total, and total MUST equal the queued batch size
- A finished batch produces a run report placing every queued PR in exactly one outcome bucket with per-bucket counts that sum to the batch total; the report is downloadable as BatchRunReport JSON
- Packages produced by a batch appear in the library as individual TaskPackageBundle entries, identical in structure to single-run packages

Feature: Library —
- A Library view lists every produced package plus at least 2 seeded example packages, each entry showing repository, PR number, difficulty, language, and created date
- Library filters narrow by repository, difficulty, and language; filters combine, render as removable chips, and a filter combination matching nothing shows an empty state naming the active filters with a clear-filters control
- Opening a library entry reopens the full package viewer with all four parts and working copy and download controls; deleting an entry asks for confirmation and removes exactly that entry; re-export from the library downloads the same TaskPackageBundle content the package was stored with
- An Import bundle control accepts a TaskPackageBundle JSON file: a valid bundle matching the field contract adds its package to the library; an invalid bundle (missing required keys, schemaVersion not exactly live-task-package-v1, difficulty outside the closed set, base_sha not 40-character lowercase hex, non-positive pr_number, empty instruction/task_config/patch_note, or source_file_count outside 3–10) is rejected with per-field errors naming each offending field and adds nothing
- Export then re-import round-trip: downloading a produced bundle and importing that same JSON reconstructs a library entry whose viewer shows the same instruction, task_config, metadata, and patch_note
- The library persists: after a page reload every package, including ones produced this session, is still present with its content intact

Feature: Command palette and coachmarks —
- Pressing Cmd+K (or Ctrl+K) opens a command palette with a search field spanning repositories, PRs (matched by number or title), and library packages; results group by kind, selecting a result navigates to that item, and Escape closes the palette
- On first run, dismissible coachmark tips point out the Connections panel, the Triage board, and the pipeline runner; each tip dismisses individually, dismissals survive a reload, and a Reset tips control in the Connections panel restores all tips
</core_features>

<user_flows>
- Demo end to end: with no credentials entered, filter driftline's PR list to source-file bounds 3 to 10 with linked issues required, accept a PR on the triage board, run its pipeline through Fetch, Evaluate, Generate, and Package while the Evaluate and Generate text streams, then download the bundle — the downloaded JSON contains the same instruction text that streamed during Generate and metadata naming that repository and PR number, all without any credential
- Live parity: after connecting a GitHub token and an AI key, the identical screens and controls carry the same flow on live data; the steps, layout, and controls are unchanged and only the mode indicator and connection statuses differ
- Batch flow: queue 2 accepted PRs, run the batch, and open the run report — each PR lands in exactly one bucket, the bucket counts sum to 2, every packaged PR's package appears in the library, and the report downloads as a JSON file
- Failure recovery: run petrel PR 31, watch Generate exhaust 3 attempts and be marked failed, activate its Retry control, and observe the run resume at Generate with the Fetch and Evaluate outputs and timestamps unchanged, ending in a complete package
- Triage with undo: reject a PR with the docs-only reason, confirm the rejected count and the docs-only breakdown each increment by one, undo, and confirm the card returns to Inbox and both counts revert exactly
- Reload rules: after producing a package, placing triage cards, and dismissing a coachmark, a page reload keeps the packages, the triage placements, and the dismissed coachmarks, while both credentials return to Disconnected and the mode indicator returns to Demo data
- Export then import round-trip: after a completed demo pipeline run, Download bundle the TaskPackageBundle JSON, delete that library entry (or note a distinctive instruction substring), Import the downloaded JSON, and confirm the library entry returns with the same instruction text, repo, pr_number, difficulty, and patch_note as before the delete
</user_flows>

<edge_cases>
- Entering an invalid GitHub token and connecting shows a visible authentication error with the failure status or message on that credential row, the status stays Disconnected, and the app keeps operating on demo data
- A rate-limited pipeline response never silently hangs: the stage shows the reset countdown ticking to zero before the automatic retry (driftline PR 58 exercises this in demo mode)
- An AI endpoint failure mid-generation freezes the streamed text at the failure point, marks Generate failed with a status and message, and offers a stage Retry; a successful retry resumes from Generate without re-running earlier stages
- A repository whose PR list matches none of the active filters shows an empty state naming the active filters with a clear-filters control rather than a blank list
- Attempting to run the pipeline on a PR whose non-test source-file count exceeds the maximum bound (loomdb seeds one PR with more than 10 source files) is blocked with a visible message naming the count and the bound, and no run starts
- Rejecting a card without choosing a reject reason is blocked with an inline message naming the missing reason; the card stays in place until a reason is chosen or the action is cancelled
- Double-activating Run pipeline starts exactly one run: one stage sequence, one event timeline, and at most one package produced
- Importing a bundle JSON that is missing required fields, has schemaVersion other than live-task-package-v1, or violates field formats (base_sha not 40-character lowercase hex, difficulty outside easy/medium/hard, non-positive pr_number, empty instruction) lists every offending field by name and adds nothing to the library
</edge_cases>

<visual_design>
- Layout: a fixed top bar carrying the app name, the mode indicator, the credential status chips, and the Connections control; a left navigation rail with entries for Candidates, Triage, Runs, and Library; the main area renders the active view
- The mode indicator is unmistakable at a glance: a filled chip reading Demo data in a neutral treatment and Live in an accent treatment, always visible in the top bar
- Stage statuses are visually distinct: pending, running, retrying, failed, and complete each carry a distinct color or icon treatment, consistent between the stage list and the event timeline
- Reject-reason badges use one consistent badge treatment with a distinct hue per reason, identical on triage cards, the rejected-column filter, and the stats breakdown
- The instruction document and the TOML-shaped task config render in a monospaced block with a visible part label and their copy and download controls adjacent
- Verdict presentation is explicit: substantial renders with a success treatment and trivial with a warning treatment, in both the Evaluate stage output and the run report buckets
- Typography shows a clear hierarchy: the app title larger than view headings, which are larger than card, table, and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the rail, the board columns, the stage list, and the package viewer panels are visually regular with no crowded or orphaned regions
- Buttons, inputs, selects, toggles, and cards show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used across the navigation rail, credential rows, stage statuses, triage actions, and package controls
</visual_design>

<motion>
- Streaming text in Evaluate and Generate advances smoothly with an active streaming affordance (such as a pulsing cursor or indicator) that stops when the stage completes
- Stage status changes animate: the running indicator shows continuous activity, a completing stage's status transitions with a short fade rather than snapping, and the rate-limit countdown ticks visibly second by second
- Triage cards animate between columns: accepting or rejecting moves the card with a short transition rather than teleporting, and undo animates it back
- List changes animate: PR rows loading in, library entries appearing after a run, and filter chips appearing and clearing each use a brief enter or exit transition
- The command palette and the Connections slide-over open with a short opacity and translate transition of roughly 150 to 250 milliseconds and close the same way
- Hover animations (required): buttons ease background and shadow with a slight press effect; repo entries, PR rows, triage cards, and library rows take a full-width hover wash; form controls show focus rings
- Toasts for copied confirmations, undo, and run completion slide in, remain readable, and auto-dismiss with a fade
- The overall batch progress indicator fills continuously as items complete rather than jumping
- With prefers-reduced-motion set, streaming text still appears but all transitions apply instantly and nothing pulses or slides
</motion>

<responsiveness>
- At widths of 768 pixels and below, the navigation rail collapses behind a toggle control that opens it as an overlay, and the triage columns stack vertically while retaining all actions
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the changed-files table and the monospaced package parts scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — navigation entries, credential fields and toggles, filter chips, triage actions, stage retry and pause and resume controls, package copy and download controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Connections slide-over, the reject-reason chooser, the delete confirmation, and the command palette trap focus while open, close on Escape, and return focus to the control that opened them
- Credential inputs have visible labels, their show/hide toggles carry accessible names, and validation and connection errors are associated with their fields
- A stage entering the failed state, a run completing, and a credential's connection status changing are each announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive while a run is streaming: switching views, filtering lists, and opening the palette work without hangs or dropped interactions during an active run
- Rapid repeated input — quick filter toggles, fast column moves, repeated palette open and close — causes no freezes or dropped state
</performance>

<writing>
- Headings, navigation entries, and buttons use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Run pipeline, Download bundle, and Reject PR rather than generic labels where a specific one is possible
- Error messages name the problem and the fix, such as naming the repository field and the required owner/name shape; empty states explain what belongs there and which control fills it; no placeholder text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional, non-blocking: enhancements beyond this specification are welcome — for example richer diff previews in the PR detail, a package comparison view, keyboard-driven triage, or a themed dark mode — provided nothing here replaces or degrades a specified behavior
</innovation>

<requirements>
Shared application state must live in Zustand (client state): the repository and PR collections, filters and pagination, triage placements with reject reasons and undo history, run and stage statuses with attempt counts and checkpoints, streamed stage text, event timelines, batch queues and reports, the package library, the selected view and detail selections, credential connection statuses, coachmark dismissals, and UI chrome. Views derive from the one store; a change made in one view is immediately reflected everywhere it appears without a reload.
Persistence: produced and imported packages, triage placements, the source-file filter settings, the configured AI base URL, and coachmark dismissals persist in localStorage and survive a reload. Credentials are the exception: the GitHub token and the AI API key are held in memory only — they must never be written to localStorage, sessionStorage, cookies, IndexedDB, or any other storage, never appear in any exported file or copied text, and never appear in a URL.
Network rules:
- With no credential entered, the app performs zero outbound network requests: demo mode runs entirely on bundled fixtures
- After the user enters credentials, outbound requests are permitted only to api.github.com and to the user-configured AI base URL; no request goes to any other host in any mode
- Entering and connecting a credential is what triggers its first request (the lightweight validation call); no request is sent on the user's behalf before that
Dual-mode contract: demo and live mode share the same components, screens, and flows; the mode changes only the data source. Demo fixtures conform to the same schemas as live responses.
API-shaped schemas (Zod, surfaced through React Hook Form where a form exists) — forms mirror real domain API payloads; the record a form or completed run creates IS the would-be request body; exports and imports conform to the same schemas:
- PullRequest field contract (GitHub PR object shape): number (positive integer), title (non-empty string), body (string), merged_at (ISO 8601 date-time), base.sha (40-character lowercase hex), files array of { filename, status, additions, deletions } with additions and deletions non-negative integers; fixture PRs validate against this schema
- ChatCompletionsRequest field contract: model (non-empty string), messages (array of { role, content } pairs), stream (boolean exactly true); streamed output is consumed as incremental content deltas; the demo simulator produces the same incremental shape
- AddRepository, RejectAction, TaskPackageBundle, and BatchRunReport field contracts are as stated under Features; every key and closed enum is REQUIRED unless marked optional
- The Add repository form, the reject-reason chooser, the connection panel, and the Import bundle surface validate through these schemas with inline per-field errors before submit or accept
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. shadcn/ui provides the UI chrome — dialogs, slide-over, command palette, tables, badges, toasts, tabs, and form controls; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @phosphor-icons/react only, installed via npm — no raw copy-pasted SVG icon sets. All forms are driven by React Hook Form validating through Zod schemas that model the field contracts above, with inline per-field errors. All libraries installed via npm and bundled locally; no CDN imports. No backend of the app's own and no authentication UI beyond the credential panel.
- Seed 3 fictional repositories (nimbusworks/driftline, cobalt-labs/loomdb, fernfield/petrel) with at least 8 merged PRs each carrying realistic titles, bodies, merged dates, base SHAs, linked issues for most, and changed-file lists with additions and deletions; include at least one PR per reject-taxonomy condition (a docs-only PR, a PR with fewer than 3 source files, a PR with more than 10 source files, and a PR without a linked issue) and seed at least 2 example packages in the library that already conform to the TaskPackageBundle field contract (schemaVersion live-task-package-v1)
- Demo-mode pipeline output is deterministic: running the same fixture PR twice streams the same evaluation and instruction text
- The useful end state is the portable task package: Copy, Download bundle, Library re-export, Import round-trip, and WebMCP artifact/entity tools must surface TaskPackageBundle JSON that contains the session's actual run output and conforms to the declared field contract
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
- entity-collection-v1
- form-workflow-v1
- command-session-v1
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
- Entity: library-package
- Entity operations: select; delete
- Entity fields: repository; pr-number; difficulty; language; created-date
- Form fields: repository; github-token; ai-base-url; ai-api-key; reject-reason
- Form operations: validate; submit; cancel; reset
- Workflow steps: accept-pr; reject-pr; undo-triage; queue-batch; disconnect-credential; reset-coachmarks
- Value bounds: reject-reason in {too-few-files, too-many-files, docs-only, no-linked-issue}; repository field must match the owner/name shape with exactly one slash; seeded repositories limited to nimbusworks/driftline (TypeScript), cobalt-labs/loomdb (Rust), fernfield/petrel (Python); difficulty derives from non-test source-file count: 3-4 easy, 5-7 medium, 8-10 hard; runs blocked when the count exceeds 10 (loomdb seeds one such PR); TaskPackageBundle field contract: schemaVersion exactly live-task-package-v1, repo owner/name, pr_number positive integer, base_sha 40-character lowercase hex, language non-empty, difficulty in {easy, medium, hard}, source_file_count integer 3-10, created_at ISO 8601, non-empty instruction, task_config, and patch_note; BatchRunReport field contract: total, packaged, trivial, failed, skipped non-negative integers with packaged+trivial+failed+skipped equal total; items each with repo, pr_number, and outcome in {packaged, trivial, failed, skipped}; delete requires explicit confirm=true; credential submit validates field shape only; without a real credential the check fails visibly, the status stays Disconnected, and the app remains in Demo data mode on fixtures
- Session operations: start; pause; resume
- Demos: demo-pipeline-run; rate-limit-retry-driftline-pr-58; generate-failure-retry-petrel-pr-31; trivial-verdict-run; batch-run
- Artifact operations: export; copy; import
- Export formats: instruction-document-text; task-config-toml; package-bundle-json; batch-run-report-json
- Import modes: package-bundle-json
- Workflow completion: with no credentials the top-bar mode indicator reads Demo data and every screen is fully populated and exercisable from the seeded fixtures
- Workflow completion: triage actions immediately update the board header stats and per-reason rejected breakdown; undo restores the card's previous column and reverts the stats exactly; placements survive a reload
- Workflow completion: a completed demo pipeline run produces a TaskPackageBundle whose viewer text, copied text, and downloaded JSON all carry schemaVersion live-task-package-v1, the Generate stage's actual streamed instruction text, and metadata matching the source PR; demo runs of the same fixture PR are deterministic
- Workflow completion: a finished batch places every queued PR in exactly one of packaged, trivial, failed, or skipped with bucket counts summing to the batch total, and packaged entries appear in the library as TaskPackageBundle records
- Workflow completion: importing a valid TaskPackageBundle adds its package to the library; an invalid bundle lists every offending field by name and adds nothing; export-then-import reconstructs the same visible package content
- Workflow completion: disconnecting a credential returns its status to Disconnected and the mode indicator to Demo data; after a reload both credentials show Disconnected while packages, triage placements, and coachmark dismissals persist

Mechanics exclusions:
- Live GitHub and AI-endpoint calls (account checks, live PR fetching and paging, live chat-completions streaming) are network behaviors the judge grades by observation only — the judge has no credentials and no tool may simulate a successful connection or Live mode
- Candidates/Triage/Runs/Library navigation, PR source-file bound filters, require-linked-issue toggle, and library filter chips are simple visible controls the judge drives directly via Playwright
- Credential masked-field show/hide toggles and the Connections slide-over transition stay Playwright-driven
- Evaluate/Generate streaming cadence, the pulsing streaming affordance, and the rate-limit reset countdown ticking stay Playwright-observed
- Triage card column-move and undo-return animations stay Playwright-observed
- Command palette Cmd+K/Ctrl+K gesture and keyboard navigation stay Playwright-driven
- File downloads, file-picker import interaction, and clipboard contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
