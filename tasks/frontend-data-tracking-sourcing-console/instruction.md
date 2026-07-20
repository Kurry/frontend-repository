<summary>
Build a repository sourcing console that feeds a benchmark build queue using Svelte 5, runes-based Svelte stores, Tailwind CSS 4.3.2, and Carbon Components Svelte. The app produces the operator's sourcing pack — a structured export of the live queue, candidate statuses, quota fill, and timeline — so the session work product survives without a backend.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Candidates table —
- The app opens into a candidates view seeded with at least 25 candidate repositories with fictional two-part names in the form org slash repo; each row shows the name, language, star count, a difficulty score from 0 to 10 shown to one decimal, a category, a cluster id, a license chip reading one of Permissive, Weak copyleft, Strong copyleft, or Unlicensed, and a status chip
- Status chips read exactly one of Candidate, Scored, Selected, Rejected, Pinned, or Queued; rejected rows additionally show their rejection reason
- Clicking a sortable column header (name, stars, difficulty) sorts the table by that column; clicking it again reverses the order, and an indicator on the header shows the active sort and direction
- Filter controls narrow the table by language, by difficulty band (Easy for scores 0 to 3.9, Medium for 4 to 6.9, Hard for 7 to 10), by license, and by status; a name-search field narrows rows whose org-slash-repo name contains the typed substring case-insensitively; active filters and the search combine, and a clear control restores the full table exactly
- When the active filters and search match no candidates, the table region shows an empty state naming the active filters and offering the clear control

Feature: Status transitions —
- A Score action on a Candidate row moves it to Scored and reveals its difficulty score; a Select action on a Scored row moves it to Selected; both update the row's chip, the rollups, and the event timeline in the same interaction
- A Reject action on a Scored row opens a small form whose reason control is a constrained select offering exactly license-blocked, gui-heavy, network-dependent, duplicate-cluster, and too-large; the form validates before submit and free-typed reasons are impossible
- Submitting a rejection with no reason chosen shows an inline message naming the reason field and changes no status; submitting with a reason moves the row to Rejected and shows the chosen reason on the row
- The rejection submit payload is the record the form creates: a required reason field whose value is exactly one of the five fixed tokens above; any other value is rejected with an inline message naming the reason field
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
- A Pin action on a Selected row opens a confirm dialog showing the repository name, an automatically generated fictional 12-character commit hash made of lowercase hex digits, and an optional notes field limited to 200 characters; the dialog validates before submit and its confirm control is disabled until the dialog is in a valid state
- The pin submit payload is the record the form creates: an optional notes string of at most 200 characters; notes longer than 200 characters show an inline message naming the notes field and do not pin; the frozen commit hash is generated by the app and shown in the dialog before confirm
- Confirming the pin moves the row to Pinned and the row thereafter shows the frozen 12-character hash with a copy control; activating copy places the exact hash on the clipboard and shows a visible confirmation
- A Queue action on a Pinned row moves it to Queued and appends it to the build-queue panel, an ordered list where each entry shows its position number, repository name, difficulty score, and cluster id
- Queue entries can be reordered by dragging an entry to a new position or by per-entry move-up and move-down controls operable from the keyboard; after a reorder the position numbers renumber contiguously from 1 and the new order persists while navigating between views
- A Remove action on a queue entry takes the candidate out of the queue and returns its status to Selected; the queue renumbers and the quota grid and rollups follow

Feature: Bulk selection tray —
- Each candidate row has a selection checkbox and the table header has a select-all-visible checkbox; selecting at least one row raises a bulk action tray showing the live selected count
- The tray offers Bulk Score (applies Score to every selected Candidate row), Bulk Select (applies Select to every selected Scored row that passes the cluster and org guards), and Bulk Reject (opens the rejection form once and applies the chosen reason to every selected Scored row)
- Bulk Select skips guarded rows: each blocked row stays Scored, shows its own guard explanation, and only eligible rows move to Selected; the tray count and rollups reflect exactly the rows that changed
- Applying a bulk action updates every affected row chip, the rollup strip, the quota grid, and the timeline in the same interaction, then clears the selection; changing the selection while the tray is open updates its count immediately
- Select-all across a filtered or searched table selects only the currently visible rows

Feature: Undo and redo —
- Header Undo and Redo controls, plus Control-Z and Control-Shift-Z (or Command-Z and Command-Shift-Z on macOS), step backward and forward through status transitions, pin confirms, queue appends and removals, queue reorders, bulk tray actions, and accepted imports
- Undo restores the exact prior chips, rollups, quota cells, queue order, and timeline length from before that action; Redo reapplies them; both controls are disabled when their stack is empty
- A blocked guard attempt does not create an undo entry; cancelling the pin dialog or rejection form does not create an undo entry

Feature: Command palette —
- Pressing Control-K or Command-K opens a command palette overlay with a search field that fuzzy-matches at least the four destinations (Candidates, Quota, Timeline, Build queue), the Fetch more candidates action, the Export sourcing pack action, the Import sourcing pack action, and Score / Select / Reject / Pin / Queue actions for the currently focused or first selected candidate when one is available
- Choosing a destination switches to that view and closes the palette; choosing Fetch more, Export, or Import starts that flow; choosing a row action runs the same handler as the row control
- Escape closes the palette and returns focus to the control that had it; with no matches the palette shows a designed empty state naming what to type

Feature: Rollups —
- A rollup strip visible on the candidates view shows one count per status (Candidate, Scored, Selected, Rejected, Pinned, Queued), the overall quota fill percentage (total achieved across all cells over total target, to the nearest whole percent), and the queue length; every value re-derives live from the same store as the table and never disagrees with it

Feature: Fetch-more run —
- A Fetch more candidates control starts a simulated sourcing run rendered as a progress list with exactly three steps labeled Querying, Scoring, and Classifying; each step advances visibly from pending to running to complete in order, with a per-step status indicator, and the control is disabled while the run is in progress
- When the run completes, exactly 6 new fictional candidates append to the table in Candidate or Scored status, the rollup counts and quota grid update to include them, a completion notice appears, and the timeline records the run's completion
- The run is repeatable: a second run appends 6 further distinct candidates and every dependent view stays coherent

Feature: Export sourcing pack —
- An Export sourcing pack control opens a panel with three tabs — Queue JSON, Candidates CSV, and Sourcing report — each showing text compiled live from session state, plus Download and Copy controls on the active tab
- The Queue JSON tab shows a structured JSON document whose top-level keys are exactly schemaVersion, generatedAt, quotaFillPercent, queue, candidates, quota, and timeline; schemaVersion is the string sourcing-pack/v1; generatedAt is an ISO-8601 timestamp; quotaFillPercent is an integer from 0 to 100 matching the rollup strip
- Each queue array entry has exactly the keys position (integer starting at 1), name (org slash repo), difficulty (number 0 to 10 with one decimal), clusterId (string), and commit (exactly 12 lowercase hex characters)
- Each candidates array entry has exactly the keys name, language, stars (non-negative integer), difficulty, category, clusterId, license (one of permissive, weak-copyleft, strong-copyleft, unlicensed), and status (one of candidate, scored, selected, rejected, pinned, queued); when status is rejected the entry also includes rejectionReason (one of the five rejection tokens); when status is pinned or queued the entry also includes commit; when pin notes were provided the entry includes notes (string at most 200 characters); when status is queued the entry also includes queuePosition matching the queue panel
- Each quota array entry has exactly language, band (one of easy, medium, hard), achieved (non-negative integer), and target (positive integer), matching the quota grid cells
- Each timeline array entry has exactly at (ISO-8601), name, fromStatus, and toStatus, plus rejectionReason when the transition recorded one
- The Candidates CSV tab shows CSV-shaped text with a header line and one line per candidate currently visible under the active filters and search, with columns name, language, stars, difficulty, category, clusterId, license, status, rejectionReason, commit, notes, queuePosition
- The Sourcing report tab shows a markdown document with a title, the quota fill percentage, a numbered build-queue section matching queue order, a per-status count section matching the rollup strip, and a short unfilled-quota section naming every cell still below target
- All three tabs derive from live state: after a pin, queue reorder, rejection, bulk action, fetch-more run, or undo, reopening Export shows the updated text; an export that omits session mutations is incorrect
- Activating Copy places exactly the active tab's text on the clipboard and shows visible confirmation; Download offers that same text as a downloadable file

Feature: Import sourcing pack —
- An Import sourcing pack control opens a panel with a file picker accepting .json files, a paste area for raw JSON text, and at least one seeded sample pack choosable inside the panel
- Confirming Import validates the pasted or loaded document against the same Queue JSON field contract; a document missing a required top-level key, using a schemaVersion other than sourcing-pack/v1, or carrying a candidate status or license outside the allowed enums shows an inline message naming the violated field and changes no session state
- A valid import replaces candidate statuses, pin commits and notes, rejection reasons, and the build-queue order with the pack's contents, recomputes rollups and the quota grid from those records, appends one timeline entry recording the import, and shows a success notice naming the applied candidate count and the applied queue entry count
- Exporting the Queue JSON after a valid import, then re-importing that text, reconstructs the same visible statuses, queue order, commits, and rollup counts (round-trip)
</core_features>

<user_flows>
- Sourcing flow end to end: score a Candidate row, select it, pin it through the confirm dialog, queue it, and confirm at each step that the status chip, the rollup strip, the quota cell for its language and band, and the event timeline all update in the same interaction without a reload; then open Export sourcing pack and confirm the Queue JSON names that repository in the queue array with its frozen commit and matching queuePosition
- Quota drill-down: on the quota view, activate an unfilled cell, confirm the candidates view opens filtered to exactly that language and band, select an eligible Scored row from the results, return to the quota view, and confirm that cell's achieved count and fill bar increased by exactly one
- Guard flow: select a Scored candidate, then attempt to select a second Scored candidate with the same cluster id; the second attempt is blocked with the inline cluster-guard explanation and no count anywhere changes; rejecting the second candidate with duplicate-cluster then succeeds and the timeline records it
- Queue management: queue three pinned candidates, move the third entry to position one using either drag or the keyboard move controls, confirm positions renumber 1 to 3 in the new order, then remove the entry at position two and confirm the queue renumbers to 1 and 2 and the removed candidate's chip reads Selected again
- Bulk then undo: select 3 Scored rows that pass the guards, apply Bulk Select, confirm the Selected rollup rises by exactly 3 and the tray clears; a single Undo restores all three chips and the rollup to their prior values
- Export after mutations: pin and queue one candidate, reject another with license-blocked, open Export sourcing pack, and confirm Queue JSON lists the queued repository with its commit, the rejected repository with rejectionReason license-blocked, and quotaFillPercent matching the rollup; Copy places that exact JSON on the clipboard
- Import round trip: export Queue JSON, change a status in the UI, import the earlier JSON (or the seeded sample), and confirm statuses and queue order return to the pack's contents with rollups agreeing; exporting again and re-importing keeps the same visible state
- Command palette jump: open the palette with Control-K or Command-K, type enough to match Quota, choose it, and land on the quota view with the palette closed
- A page reload returns the app to its seeded state: the seeded candidates with their seeded statuses, an empty build queue unless seeded otherwise, default filters and search, empty undo history, and the seeded timeline baseline
</user_flows>

<edge_cases>
- Cancelling the pin confirm dialog or the rejection form leaves the candidate's status, the queue, and the timeline unchanged
- Double-activating the pin confirm control pins exactly once: one timeline entry, one Pinned chip, and rollups shift once
- Move-up on the first queue entry and move-down on the last are disabled or inert; positions never leave a contiguous 1 to N sequence
- Starting a fetch-more run while one is already running is impossible: the control stays disabled until the run completes
- Filters that exclude a row a guard explanation refers to do not break the explanation: guard messages always name the holding repository even when it is filtered out of view
- With Undo disabled (nothing to undo), activating Undo changes no candidate, queue, or timeline state; after one undo, Redo restores exactly the prior state
- Bulk Reject with no reason chosen shows the inline reason-field message and changes no selected row
- Importing JSON with schemaVersion other than sourcing-pack/v1, or with a status token outside the six allowed statuses, shows an inline validation message and leaves every surface unchanged
- Opening Export sourcing pack before any in-session mutations still produces valid Queue JSON, Candidates CSV, and Sourcing report for the seeded state; the panel never shows an empty or broken region
- Closing the command palette with Escape while the export or import panel is open leaves that panel intact
- Select-all on a filtered table that shows fewer rows than the full seed selects only the visible subset; clearing filters does not silently keep hidden rows selected
</edge_cases>

<visual_design>
- Sourcing-console register: a header bar with the product name, view navigation for candidates, quota, and timeline, Undo and Redo, Export sourcing pack, Import sourcing pack, and a persistent build-queue side panel or equivalent dedicated queue region, and dense data surfaces throughout
- The status chips use six visually distinct treatments so Candidate, Scored, Selected, Rejected, Pinned, and Queued are distinguishable without reading the labels; license chips are visually lighter than status chips so the two chip families do not read as one
- The quota grid reads as a matrix: language labels on one axis, the three band labels on the other, uniform cell sizing, fill bars sharing one visual treatment, unfilled cells clearly highlighted, and the oversubscription indicator visually distinct from the unfilled highlight
- The bulk action tray, command palette, and export/import panels use the same surface and border language as the rest of the app rather than unstyled browser defaults
- Typography hierarchy: view titles visibly larger than section headings, which are larger than row and label text, consistent across views; repository names and commit hashes render in a monospaced face
- Spacing follows a consistent rhythm: table rows, grid cells, and queue entries keep visually regular gaps with no crowded or orphaned regions
- Component states: buttons, selects, table headers, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
- Guard explanations and blocked-action messages render in a caution treatment distinct from validation errors and from success notices
- All rendered copy is real product copy: no lorem ipsum or placeholder text anywhere; validation messages name the field and the fix; empty states explain what belongs in the region and what action produces it
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows and queue entries take a full-width hover wash; navigation items and quota cells show a hover treatment; form controls show focus rings
- The pin confirm dialog, command palette, and export/import panels enter and exit with a short opacity and scale transition of roughly 200 to 300 milliseconds
- A newly appended candidate row animates into the table, a queued entry animates into the build-queue panel, and a removed queue entry animates out rather than vanishing instantly
- Reordering the queue animates entries sliding to their new positions rather than snapping, whether the reorder came from dragging or from the keyboard move controls
- The fetch-more progress list animates each step's transition from pending to running to complete, and the running step shows an animated activity indicator
- Status chip changes transition their color rather than hard-swapping, and a confirmation toast after pinning, queueing, copy, bulk, import, and export actions slides in, remains readable, and auto-dismisses with a fade
- The bulk action tray slides in when a selection starts and slides out when the selection clears
- With prefers-reduced-motion set, transitions are removed and every state change applies instantly while all functionality remains available
</motion>

<responsiveness>
- At 1440 pixel width the build-queue region is visible alongside the candidates table; at widths of 768 pixels and below it collapses into a toggleable panel reachable from the header, and the quota grid scrolls within its own container if needed
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the candidates table scrolls within its own container; header actions collapse into a compact menu that still reaches Export, Import, Undo, Redo, and the command palette
</responsiveness>

<accessibility>
- Every interactive control — navigation, sortable headers, filter and search controls, row actions and checkboxes, the rejection select, dialog fields, queue move and remove controls, bulk tray actions, Undo and Redo, Export and Import, copy controls, and command palette results — is reachable and operable with the keyboard alone, with a visible focus indicator
- The pin confirm dialog, command palette, and export/import panels trap focus while open, close on Escape, and return focus to the control that opened them
- Queue reordering is fully achievable without a pointer via the move-up and move-down controls, and a reorder is announced via a polite live region naming the entry and its new position
- Form validation messages are associated with their fields so each message names the field it belongs to; sortable headers expose their sort state programmatically; status is never conveyed by chip color alone — the label text is always present
- Completing a fetch-more run, applying a bulk action, completing an import, and a successful export copy are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including fetch-more, bulk actions, command palette use, export, and import
- Sorting, filtering, search, and the fetch-more append stay smooth with the full seeded table plus appended candidates; no interaction hangs the UI
- The UI stays responsive under rapid repeated input — fast filter changes, quick view switches, rapid queue reorders, palette open/close — with no dropped interactions or stale counts
- Opening Export sourcing pack regenerates all three tabs from live state without freezing the UI for more than a brief moment
</performance>

<requirements>
Shared application state must live in runes-based Svelte stores (in-memory only): the candidates collection with statuses, scores, clusters, frozen hashes, and notes, the build-queue order, quota targets, filters, search, and sort, selection state for the bulk tray, the undo and redo stacks, the fetch-more run state, the event timeline, the active view, export/import panel state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- A status change made anywhere updates the same record everywhere it appears: table chip, rollup counts, quota cell, queue panel, timeline, and the export text
- The quota grid, rollup strip, and queue positions derive live from the one collection; they never disagree with the table or the export
- The cluster and org guards evaluate against the live collection, so a rejection, unqueue, undo, or import immediately changes what the guards allow
- Queue reorder and removal recompute contiguous positions from the shared order; navigating views does not lose the order
- The fetch-more run appends to the same collection every view reads; filters, search, and sort recompute the visible table from it, never from a second disconnected copy
- Undo and redo replay the same shared collection mutations the visible controls perform; they never maintain a parallel disconnected history that disagrees with the table
- The active view is shared client state; switching views does not reload the document
Field contracts (observable validation and export shape, modeled as if a sourcing API existed):
- Rejection payload: required reason enum of license-blocked, gui-heavy, network-dependent, duplicate-cluster, too-large
- Pin payload: optional notes string at most 200 characters; commit is a generated 12-character lowercase hex string shown before confirm
- Sourcing pack JSON: required top-level keys schemaVersion (exactly sourcing-pack/v1), generatedAt, quotaFillPercent, queue, candidates, quota, timeline, with per-entry keys and enums as specified under Export sourcing pack; import accepts only documents that satisfy the same contract
Build tooling: Vite with the Svelte 5 plugin or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Carbon Components Svelte is the component library for the header, data table, tags/chips, selects, modals, progress indicators, notifications/toasts, and form controls; no other component library. AutoAnimate and svelte-motion allowed for animation; no other animation libraries. Tabler icons via the @tabler/icons-svelte package only — no raw copy-pasted SVG icon sets. All forms — the rejection form, the pin confirm dialog, and the import validation path — are driven by TanStack Form for Svelte validating through a Zod schema: the schema defines the field contracts above and inline per-field errors render before submit or import commit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- All data is fictional: repository and org names, star counts, categories, cluster ids, and commit hashes must not reference real products, companies, or people; commit hashes are generated 12-character lowercase hex strings, not real commits
- Seed at least 25 candidates spanning at least 5 languages, all three difficulty bands, all four license chips, at least one shared cluster id between two candidates, and at least one org with 3 candidates; seed quota targets so at least one cell starts unfilled and at least one exceeds 1.5 times its target; seed at least one sample sourcing pack for Import
- Each fetch-more run appends exactly 6 new distinct fictional candidates
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Icon set bundled locally
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
- Browsable entity: candidates
- Destinations: candidates; quota; timeline; build-queue; export-panel; import-panel; command-palette
- Filters: language; difficulty-band; license; status; name-search
- Sorts: name; stars; difficulty
- Entity: candidate
- Entity operations: select; update; reorder
- Entity fields: status; rejection-reason; queue-position
- Value bounds: {"status":["candidate","scored","selected","rejected","pinned","queued"],"rejection-reason":["license-blocked","gui-heavy","network-dependent","duplicate-cluster","too-large"],"difficulty-band":["easy","medium","hard"],"license":["permissive","weak-copyleft","strong-copyleft","unlicensed"]}
- Form fields: rejection-reason; pin-notes
- Form operations: validate; submit; cancel
- Workflow completion: fetch-more run advances Querying, Scoring, Classifying in order and appends exactly 6 new candidates
- Workflow completion: status changes update chip, rollup strip, quota cell, queue panel, and timeline together
- Workflow completion: cluster and org guards block ineligible Select attempts with an inline explanation and no state change
- Workflow completion: export queue-json includes session queue order, candidate statuses, quotaFillPercent, and timeline
- Workflow completion: valid import of sourcing-pack/v1 replaces statuses and queue order and updates rollups
- Workflow completion: bulk select applies only to guard-eligible scored rows and updates rollups by the changed count
- Artifact operations: export; import; copy
- Export formats: queue-json; candidates-csv; sourcing-report-markdown
- Import modes: sourcing-pack-json; seeded-sample

Mechanics exclusions:
- Commit-hash copy control and its clipboard confirmation stay Playwright (clipboard contents are a Playwright responsibility)
- Drag-reorder gesture and the sliding reorder animation are graded via the real drag/keyboard move controls; WebMCP reorder is for setup only
- Fetch-more run start, per-step pending-to-running-to-complete animation timing, and completion notice stay Playwright-observed
- Export Download file contents and clipboard text after Copy stay Playwright responsibilities
- Command palette open animation and focus trap stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
