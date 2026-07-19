<summary>
Build a repository sourcing console that feeds a benchmark build queue using Svelte 5, runes-based Svelte stores, Tailwind CSS 4.3.2, and Carbon Components Svelte.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Candidates table —
- The app opens into a candidates view seeded with at least 25 candidate repositories with fictional two-part names in the form org slash repo; each row shows the name, language, star count, a difficulty score from 0 to 10 shown to one decimal, a category, a cluster id, a license chip reading one of Permissive, Weak copyleft, Strong copyleft, or Unlicensed, and a status chip
- Status chips read exactly one of Candidate, Scored, Selected, Rejected, Pinned, or Queued; rejected rows additionally show their rejection reason
- Clicking a sortable column header (name, stars, difficulty) sorts the table by that column; clicking it again reverses the order, and an indicator on the header shows the active sort and direction
- Filter controls narrow the table by language, by difficulty band (Easy for scores 0 to 3.9, Medium for 4 to 6.9, Hard for 7 to 10), by license, and by status; active filters combine, and a clear control restores the full table exactly
- When the active filters match no candidates, the table region shows an empty state naming the active filters and offering the clear control

Feature: Status transitions —
- A Score action on a Candidate row moves it to Scored and reveals its difficulty score; a Select action on a Scored row moves it to Selected; both update the row's chip, the rollups, and the event timeline in the same interaction
- A Reject action on a Scored row opens a small form whose reason control is a constrained select offering exactly license-blocked, gui-heavy, network-dependent, duplicate-cluster, and too-large; the form validates before submit and free-typed reasons are impossible
- Submitting a rejection with no reason chosen shows an inline message naming the reason field and changes no status; submitting with a reason moves the row to Rejected and shows the chosen reason on the row
- Every status change appends one entry to the event timeline recording the time, the repository name, the old status, the new status, and the rejection reason when there is one; the timeline view lists entries newest first

Feature: Quota dashboard —
- A quota view renders a grid of language rows by difficulty-band columns (Easy, Medium, Hard); each cell shows its achieved count against its seeded target in the form achieved of target with a horizontal fill bar proportional to achieved over target, where achieved counts candidates whose status is Selected, Pinned, or Queued in that language and band
- Cells whose achieved count is below target carry a visible unfilled highlight distinct from filled cells
- A cell whose achieved count exceeds 1.5 times its target shows an oversubscription indicator naming the excess
- Activating a quota cell switches to the candidates view with the language and difficulty-band filters set to that cell, so the table shows exactly the matching rows; the active filters are visible and clearable
- Selecting or unqueueing candidates re-derives the affected cell's count and fill bar live, without a reload

Feature: Diversity guards —
- Attempting to Select a Scored candidate whose cluster id already has a candidate in Selected, Pinned, or Queued status is blocked: the row's status does not change and an inline explanation appears naming the cluster guard, the cluster id, and the already-holding repository
- Attempting to Select a candidate whose org (the part of the name before the slash) already has 3 candidates in Selected, Pinned, or Queued status is blocked the same way, with the explanation naming the org cap of 3 and the org
- These guards are real constraints, not warnings: after a blocked attempt the status chip, the rollups, the quota grid, and the timeline are all unchanged

Feature: Pinning and the build queue —
- A Pin action on a Selected row opens a confirm dialog showing the repository name, an automatically generated fictional 12-character commit hash, and an optional notes field; the dialog validates before submit and its confirm control is disabled until the dialog is in a valid state
- Confirming the pin moves the row to Pinned and the row thereafter shows the frozen 12-character hash with a copy control; activating copy places the exact hash on the clipboard and shows a visible confirmation
- A Queue action on a Pinned row moves it to Queued and appends it to the build-queue panel, an ordered list where each entry shows its position number, repository name, difficulty score, and cluster id
- Queue entries can be reordered by dragging an entry to a new position or by per-entry move-up and move-down controls operable from the keyboard; after a reorder the position numbers renumber contiguously from 1 and the new order persists while navigating between views
- A Remove action on a queue entry takes the candidate out of the queue and returns its status to Selected; the queue renumbers and the quota grid and rollups follow

Feature: Rollups —
- A rollup strip visible on the candidates view shows one count per status (Candidate, Scored, Selected, Rejected, Pinned, Queued), the overall quota fill percentage (total achieved across all cells over total target, to the nearest whole percent), and the queue length; every value re-derives live from the same store as the table and never disagrees with it

Feature: Fetch-more run —
- A Fetch more candidates control starts a simulated sourcing run rendered as a progress list with exactly three steps labeled Querying, Scoring, and Classifying; each step advances visibly from pending to running to complete in order, with a per-step status indicator, and the control is disabled while the run is in progress
- When the run completes, exactly 6 new fictional candidates append to the table in Candidate or Scored status, the rollup counts and quota grid update to include them, a completion notice appears, and the timeline records the run's completion
- The run is repeatable: a second run appends 6 further distinct candidates and every dependent view stays coherent
</core_features>

<user_flows>
- Sourcing flow end to end: score a Candidate row, select it, pin it through the confirm dialog, queue it, and confirm at each step that the status chip, the rollup strip, the quota cell for its language and band, and the event timeline all update in the same interaction without a reload
- Quota drill-down: on the quota view, activate an unfilled cell, confirm the candidates view opens filtered to exactly that language and band, select an eligible Scored row from the results, return to the quota view, and confirm that cell's achieved count and fill bar increased by exactly one
- Guard flow: select a Scored candidate, then attempt to select a second Scored candidate with the same cluster id; the second attempt is blocked with the inline cluster-guard explanation and no count anywhere changes; rejecting the second candidate with duplicate-cluster then succeeds and the timeline records it
- Queue management: queue three pinned candidates, move the third entry to position one using either drag or the keyboard move controls, confirm positions renumber 1 to 3 in the new order, then remove the entry at position two and confirm the queue renumbers to 1 and 2 and the removed candidate's chip reads Selected again
- A page reload returns the app to its seeded state: the seeded candidates with their seeded statuses, an empty build queue unless seeded otherwise, default filters, and the seeded timeline baseline
</user_flows>

<edge_cases>
- Cancelling the pin confirm dialog or the rejection form leaves the candidate's status, the queue, and the timeline unchanged
- Double-activating the pin confirm control pins exactly once: one timeline entry, one Pinned chip, and rollups shift once
- Move-up on the first queue entry and move-down on the last are disabled or inert; positions never leave a contiguous 1 to N sequence
- Starting a fetch-more run while one is already running is impossible: the control stays disabled until the run completes
- Filters that exclude a row a guard explanation refers to do not break the explanation: guard messages always name the holding repository even when it is filtered out of view
</edge_cases>

<visual_design>
- Sourcing-console register: a header bar with the product name and view navigation for candidates, quota, and timeline, a persistent build-queue side panel or equivalent dedicated queue region, and dense data surfaces throughout
- The status chips use six visually distinct treatments so Candidate, Scored, Selected, Rejected, Pinned, and Queued are distinguishable without reading the labels; license chips are visually lighter than status chips so the two chip families do not read as one
- The quota grid reads as a matrix: language labels on one axis, the three band labels on the other, uniform cell sizing, fill bars sharing one visual treatment, unfilled cells clearly highlighted, and the oversubscription indicator visually distinct from the unfilled highlight
- Typography hierarchy: view titles visibly larger than section headings, which are larger than row and label text, consistent across views; repository names and commit hashes render in a monospaced face
- Spacing follows a consistent rhythm: table rows, grid cells, and queue entries keep visually regular gaps with no crowded or orphaned regions
- Component states: buttons, selects, table headers, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
- Guard explanations and blocked-action messages render in a caution treatment distinct from validation errors and from success notices
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows and queue entries take a full-width hover wash; navigation items and quota cells show a hover treatment; form controls show focus rings
- The pin confirm dialog enters and exits with a short opacity and scale transition of roughly 200 to 300 milliseconds
- A newly appended candidate row animates into the table, a queued entry animates into the build-queue panel, and a removed queue entry animates out rather than vanishing instantly
- Reordering the queue animates entries sliding to their new positions rather than snapping, whether the reorder came from dragging or from the keyboard move controls
- The fetch-more progress list animates each step's transition from pending to running to complete, and the running step shows an animated activity indicator
- Status chip changes transition their color rather than hard-swapping, and a confirmation toast after pinning, queueing, and copy actions slides in, remains readable, and auto-dismisses with a fade
- With prefers-reduced-motion set, transitions are removed and every state change applies instantly while all functionality remains available
</motion>

<responsiveness>
- At 1440 pixel width the build-queue region is visible alongside the candidates table; at widths of 768 pixels and below it collapses into a toggleable panel reachable from the header, and the quota grid scrolls within its own container if needed
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the candidates table scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — navigation, sortable headers, filter controls, row actions, the rejection select, dialog fields, queue move and remove controls, and the copy control — is reachable and operable with the keyboard alone, with a visible focus indicator
- The pin confirm dialog traps focus while open, closes on Escape, and returns focus to the control that opened it
- Queue reordering is fully achievable without a pointer via the move-up and move-down controls, and a reorder is announced via a polite live region naming the entry and its new position
- Form validation messages are associated with their fields so each message names the field it belongs to; sortable headers expose their sort state programmatically; status is never conveyed by chip color alone — the label text is always present
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Sorting, filtering, and the fetch-more append stay smooth with the full seeded table plus appended candidates; no interaction hangs the UI
- The UI stays responsive under rapid repeated input — fast filter changes, quick view switches, rapid queue reorders — with no dropped interactions or stale counts
</performance>

<requirements>
Shared application state must live in runes-based Svelte stores (in-memory only): the candidates collection with statuses, scores, clusters, and frozen hashes, the build-queue order, quota targets, filters and sort, the fetch-more run state, the event timeline, the active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- A status change made anywhere updates the same record everywhere it appears: table chip, rollup counts, quota cell, queue panel, and timeline
- The quota grid, rollup strip, and queue positions derive live from the one collection; they never disagree with the table
- The cluster and org guards evaluate against the live collection, so a rejection or unqueue immediately changes what the guards allow
- Queue reorder and removal recompute contiguous positions from the shared order; navigating views does not lose the order
- The fetch-more run appends to the same collection every view reads; filters and sort recompute the visible table from it, never from a second disconnected copy
- The active view is shared client state; switching views does not reload the document
Build tooling: Vite with the Svelte 5 plugin or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Carbon Components Svelte is the component library for the header, data table, tags/chips, selects, modals, progress indicators, notifications/toasts, and form controls; no other component library. AutoAnimate and svelte-motion allowed for animation; no other animation libraries. Tabler icons via the @tabler/icons-svelte package only — no raw copy-pasted SVG icon sets. All forms — the rejection form and the pin confirm dialog — are driven by TanStack Form for Svelte validating through a Zod schema: the schema defines the rules (reason restricted to the five fixed values, notes optional) and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- All data is fictional: repository and org names, star counts, categories, cluster ids, and commit hashes must not reference real products, companies, or people; commit hashes are generated 12-character strings, not real commits
- Seed at least 25 candidates spanning at least 5 languages, all three difficulty bands, all four license chips, at least one shared cluster id between two candidates, and at least one org with 3 candidates; seed quota targets so at least one cell starts unfilled and at least one exceeds 1.5 times its target
- Each fetch-more run appends exactly 6 new distinct fictional candidates
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Icon set bundled locally
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
- entity-collection-v1
- form-workflow-v1
- command-session-v1

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

Bindings:
- Browsable entity: candidates
- Destinations: candidates; quota; timeline; build-queue
- Filters: language; difficulty-band; license; status
- Sorts: name; stars; difficulty
- Entity: candidate
- Entity operations: select; update; reorder
- Entity fields: status; rejection-reason; queue-position
- Value bounds: {"status":["candidate","scored","selected","rejected","pinned","queued"],"rejection-reason":["license-blocked","gui-heavy","network-dependent","duplicate-cluster","too-large"],"difficulty-band":["easy","medium","hard"],"license":["permissive","weak-copyleft","strong-copyleft","unlicensed"]}
- Form fields: rejection-reason; pin-notes
- Form operations: validate; submit; cancel
- Session operations: start
- Workflow completion: fetch-more run advances Querying, Scoring, Classifying in order and appends exactly 6 new candidates
- Workflow completion: status changes update chip, rollup strip, quota cell, queue panel, and timeline together
- Workflow completion: cluster and org guards block ineligible Select attempts with an inline explanation and no state change

Mechanics exclusions:
- Commit-hash copy control and its clipboard confirmation stay Playwright (clipboard contents are a Playwright responsibility)
- Drag-reorder gesture and the sliding reorder animation are graded via the real drag/keyboard move controls; WebMCP reorder is for setup only
- Fetch-more per-step pending-to-running-to-complete animation timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
