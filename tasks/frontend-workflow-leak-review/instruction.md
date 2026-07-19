<summary>
Build a contamination and leak review console for benchmark submissions using Svelte 5, runes-based Svelte stores, Tailwind CSS 4.3.2, and Flowbite Svelte.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Submissions queue —
- The app opens into a queue view seeded with at least 12 submission rows, ranked by similarity score from highest to lowest; every seeded row is visible without pagination
- Each queue row shows the similarity score as a number between 0.00 and 1.00, the fictional benchmark task name, the fictional submitter name, and a review-state chip reading exactly one of Unreviewed, Review triggered, Confirmed clean, or Confirmed leak
- Each row's score renders on a three-band color scale: scores below 0.40 in the low-band color, scores from 0.40 up to the current threshold in the mid-band color, and scores at or above the current threshold in the high-band color; moving the threshold re-bands the affected scores immediately
- A state filter above the queue narrows the visible rows to one review state; a Review triggered option shows only rows whose state is currently Review triggered, and clearing the filter restores the full queue exactly
- Switching between the queue, canary, mutation, and audit views swaps the main region without a full page reload

Feature: Threshold control —
- A threshold slider labeled with its current value (range 0.50 to 0.95, seeded at 0.75) sits above the queue; dragging it re-derives which Unreviewed rows carry the Review triggered state live: rows whose score is at or above the threshold and which have no confirmed decision show Review triggered, rows below it show Unreviewed
- Moving the slider never changes any row whose state is Confirmed clean or Confirmed leak; those states only ever change through the reviewer decision form
- A persistent banner near the slider states in plain language that the threshold only flags submissions for review and that a human reviewer makes every confirm decision
- The rollup strip and the Review triggered filter results update in the same interaction as the slider moves, with no reload

Feature: Evidence view —
- Selecting a queue row opens that submission's evidence view: two side-by-side panes labeled Submission excerpt and Reference excerpt, a visible match count stating the total number of matched snippet pairs (every triggered submission seeds at least 3 pairs), and a per-match similarity value for the pair currently in focus
- Within each matched pair, the overlapping tokens are visually highlighted in both panes with the same highlight treatment, so the shared text is identifiable at a glance
- Previous and Next controls step through the matched pairs; each step scrolls both panes so the focused pair's highlighted regions are in view in both panes at once, and a position label updates in the form current of total; Previous disables on the first pair and Next disables on the last

Feature: Reviewer decision —
- The evidence view carries a decision form with a verdict choice offering exactly Confirm clean and Confirm leak, and a rationale text field; the form validates before submit with inline per-field messages, and the rationale must be at least 20 characters
- Submitting with a rationale shorter than 20 characters shows an inline message naming the rationale field and the minimum length, and records no decision
- The submit control stays disabled until a verdict is chosen and the rationale is valid
- Submitting a valid decision updates that row's state chip to the chosen confirmed state in the queue, removes the row from the Review triggered filter results, and appends exactly one new entry to the audit timeline — all without a reload
- Cancelling the decision form leaves the submission's state and the audit timeline unchanged

Feature: Audit timeline —
- The audit view shows an ordered timeline of decision events, newest first; each entry shows a timestamp, the submitter, the task, the verdict, and the recorded rationale
- A verdict filter narrows the timeline to Confirm clean or Confirm leak entries; when the filter matches no entries, the timeline region shows an empty state explaining that no decisions of that verdict exist yet
- Before any decision has been made, the timeline shows an empty state explaining that decisions will appear here once a reviewer confirms a submission

Feature: Canary panel —
- The canary view lists each of the at least 4 seeded benchmark tasks with its seeded canary tokens and two derived checklists per task: Placement coverage, showing for each token a pass or fail chip and a count in the form present in N of M generated files, and Post-strip verification, showing for each token a pass or fail chip for absence from the visible surface
- At least one seeded task ships with a failing post-strip check, and the canary view renders an alert banner for it that names the exact file where the token survived
- Expanding a task's canary section is a disclosure: collapsed by default, it opens on activation to reveal the two checklists and closes on a second activation

Feature: Mutation track —
- The mutation view shows, for each of the at least 2 seeded tasks that have a behavior-mutated twin, a comparison card listing the same test suite's per-test results on the original and on the mutant side by side, with at least 8 tests per suite
- Tests whose result flips from pass on the original to fail on the mutant are visually highlighted, and the card shows a flip count
- Each test row has an include toggle; toggling tests in or out re-derives the flip count live to count only included flipped tests, and toggling back restores the prior count exactly

Feature: Rollup strip and export —
- A rollup strip visible on the queue view shows the count of Review triggered rows, the count of Confirmed clean rows, the count of Confirmed leak rows, and the mean similarity score across all submissions to two decimals; all four values re-derive live when the threshold moves or a decision is submitted
- An Export summary control opens a monospaced code block containing a plain-text summary of the rollup values and per-task decision counts, with a copy control; activating copy places the exact block text on the clipboard and shows a visible confirmation
</core_features>

<user_flows>
- Triage flow: on the queue, note the Review triggered count in the rollup strip, drag the threshold slider from 0.75 down to 0.60, and confirm additional Unreviewed rows at or above 0.60 flip to Review triggered, the rollup count rises to match, and the Review triggered filter shows exactly those rows — with no confirmed row changing state and no reload
- Review flow end to end: open a Review triggered submission, step through its matched pairs with Next until the last pair (both panes scrolling in sync), choose Confirm leak, enter a rationale of at least 20 characters, and submit; the queue row's chip reads Confirmed leak, the row leaves the Review triggered filter, the Confirmed leak rollup count increases by exactly one, and the audit timeline gains exactly one entry carrying that rationale
- Canary flow: open the canary view, expand the task carrying the failing post-strip check, and confirm the alert banner names the file where the token survived while the placement checklist for the same task still shows its per-token N of M counts
- Mutation flow: on a comparison card, note the flip count, toggle off one included test that flipped, and confirm the flip count decreases by exactly one; toggle it back on and the original count is restored
- A page reload returns the app to its seeded state: at least 12 submissions with their seeded states, the threshold at 0.75, and an audit timeline empty of user-made decisions
</user_flows>

<edge_cases>
- Submitting the decision form with no verdict chosen or a rationale under 20 characters shows inline messages naming the invalid fields and changes no state; the audit timeline gains no entry
- Double-activating the decision submit control records exactly one decision: the timeline gains exactly one entry and the rollup counts shift once
- When every triggered submission has been decided, the Review triggered filter shows an empty state explaining that nothing currently needs review
- Dragging the threshold to its extremes works: at 0.95 only scores at or above 0.95 are triggered, and at 0.50 every undecided score at or above 0.50 is triggered; the rollup strip tracks both extremes correctly
- Stepping past the ends of the matched pairs is impossible: Previous stays disabled on the first pair and Next on the last, and the position label never leaves the valid range
</edge_cases>

<visual_design>
- Review-console register: a fixed top bar with the product name and view navigation, a main region per view, and dense data surfaces — table rows, chips, checklists — rather than sparse marketing spacing
- The three score bands use three clearly distinct colors applied consistently in the queue rows and anywhere a score renders; the review-state chips use four visually distinct treatments so Unreviewed, Review triggered, Confirmed clean, and Confirmed leak are distinguishable without reading the labels
- The evidence panes sit side by side at desktop width with equal widths, a visible divider, and pane headers; highlighted overlapping tokens use one consistent highlight treatment in both panes
- Alert banners (the human-review banner and the failing canary banner) are visually prominent and distinct from ordinary cards
- Typography hierarchy: view titles visibly larger than section headings, which are larger than row and label text, consistent across all views; matched-excerpt text renders in a monospaced face
- Spacing follows a consistent rhythm: gaps between cards, rows, and sections are visually regular with no crowded or orphaned regions
- Component states: buttons, sliders, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
- Pass and fail chips in the canary checklists pair their color with a visible icon or label so state is never conveyed by color alone
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; queue rows and timeline entries take a full-width hover wash; navigation items and chips show a hover treatment; form controls show focus rings
- Canary task disclosures animate open and closed with a height transition of roughly 200 to 300 milliseconds and a chevron that rotates on open and close, never snapping
- Submitting a decision animates the row's state chip change, and when the Review triggered filter is active the decided row animates out of the list rather than vanishing instantly
- A new audit timeline entry animates into the top of the timeline
- Stepping matched pairs scrolls both panes smoothly to the focused pair rather than jumping instantly
- Dragging the threshold slider updates row bands, triggered chips, and rollup numbers live during the drag with no visible jank
- A confirmation toast after submitting a decision and after copying the export slides in, remains readable, and auto-dismisses with a fade
- With prefers-reduced-motion set, transitions are removed and every state change applies instantly while all functionality remains available
</motion>

<responsiveness>
- At 1440 pixel width the evidence panes render side by side; at widths of 768 pixels and below they stack vertically while keeping the synced stepping behavior
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the queue table scrolls within its own container if needed
- The view navigation remains reachable at all widths; on small viewports it may collapse into a menu control that opens on activation
</responsiveness>

<accessibility>
- Every interactive control — navigation items, the threshold slider, queue rows, filter controls, disclosure headers, pair-stepping controls, form fields, toggles, and the copy control — is reachable and operable with the keyboard alone, with a visible focus indicator
- The threshold slider is adjustable with arrow keys and exposes its current value to assistive technology
- The decision form's validation messages are associated with their fields so each message names the field it belongs to, and submitting a decision announces the result via a polite live region
- Disclosure headers expose their expanded or collapsed state programmatically, and pass or fail chips carry text labels in addition to color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Dragging the threshold slider rapidly across its whole range keeps the queue, chips, and rollup strip responsive with no hangs or lagging counters
- The UI stays responsive under rapid repeated input — fast view switches, quick filter changes, rapid disclosure toggling — with no dropped interactions
</performance>

<requirements>
Shared application state must live in runes-based Svelte stores (in-memory only): the submissions collection with scores and review states, the threshold value, the active view, filters, the evidence focus index, canary and mutation seed data with their include toggles, the audit timeline, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Moving the threshold re-derives triggered states, score bands, and rollup counts from the one shared collection; it never mutates a confirmed decision
- Submitting a valid decision updates the same record everywhere it appears: queue chip, filter membership, rollup counts, and the audit timeline
- Toggling a mutation test's inclusion re-derives the flip count from the same suite data; toggling back restores the prior value
- The canary checklists and their alert banner derive from the same seeded canary data the task rows render
- Filters recompute the visible lists from the shared collection; they do not create a second disconnected copy
- The active view is shared client state; switching views does not reload the document
Build tooling: Vite with the Svelte 5 plugin or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Flowbite Svelte is the component library for navigation, tables, chips/badges, alerts, accordions/disclosures, sliders, modals, form controls, and toasts; no other component library. svelte-motion and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons via the phosphor-svelte package only — no raw copy-pasted SVG icon sets. All forms — the reviewer decision form and any filter forms — are driven by Felte validating through a Zod schema: the schema defines the rules (verdict required, rationale at least 20 characters) and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- All data is fictional: benchmark task names, submitter names, code excerpts, canary tokens, file names, and test names must not reference real products, companies, or people
- Seed at least 12 submissions across at least 4 fictional benchmark tasks, with at least 3 submissions at or above the seeded 0.75 threshold and at least 3 matched snippet pairs on every triggered submission; seed at least one failing post-strip canary check and at least 2 mutation comparison suites of at least 8 tests each
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
- form-workflow-v1
- entity-collection-v1
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
- Browsable entity: submissions
- Destinations: queue; evidence-view; canary; mutation; audit
- Filters: review-state; audit-verdict
- Form fields: verdict; rationale
- Form operations: validate; submit; cancel
- Value bounds: {"verdict":["confirm-clean","confirm-leak"],"rationale":"min 20 characters","review-state":["unreviewed","review-triggered","confirmed-clean","confirmed-leak"]}
- Entity: mutation-test
- Entity operations: toggle
- Entity fields: included
- Artifact operations: export; copy
- Export formats: summary-text
- Workflow completion: a submitted decision updates the queue chip, Review triggered filter membership, rollup counts, and appends exactly one audit entry
- Workflow completion: toggling a mutation test re-derives the flip count live

Mechanics exclusions:
- Threshold slider stays Playwright-driven: the graded behavior is live re-banding and rollup updates during the drag (and arrow-key adjustment); a WebMCP setter would snap state past the graded derivation
- Matched-pair Previous/Next stepping with synced two-pane scrolling is scroll-mechanics, graded via the real controls
- Canary disclosure open/close height transition and chevron rotation stay Playwright-observed
- Clipboard contents of the export-summary copy are verified via Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
