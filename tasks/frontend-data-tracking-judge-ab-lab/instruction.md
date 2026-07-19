<summary>
Build a judge A/B lab for an agent-benchmark platform — a dashboard for rescoring completed benchmark trials under alternative judge configurations and comparing the labeled results — using React, Zustand, Tailwind CSS 4.3.2, and Mantine.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Seeded dataset —
- The app opens into an Experiments view seeded with exactly 12 completed trials spread across 4 benchmark tasks (3 trials per task, each task named, for example canvas-paint-studio, expense-dashboard, trip-planner, markdown-notes); every trial row shows its trial id and task name
- Exactly 4 result labels exist at load: Baseline (the original scoring) plus three rescore labels named Quartz Swap, Rubric v2, and Harness r8; every trial carries a Baseline result, and each trial carries results for at least 2 of the three rescore labels
- Every trial-label result carries: four dimension scores (correctness, visual, motion, technical, each between 0 and 1 shown to two decimals), a total reward between 0 and 1, a pass or fail state at the stated threshold of 0.70 total reward, a judge model name drawn from the fictional set Sable 4, Quartz Mini, and Onyx Pro, a judge cost in dollars, a tool-call count, and a duration in seconds
- Every trial-label result also carries exactly 16 per-criterion verdicts (4 per dimension), each verdict a pass or fail with a one-to-two-sentence reasoning snippet

Feature: Experiment table —
- The Experiments view renders the 12 trials as rows with switchable label columns: a label picker controls which labels appear as columns, and each cell shows that label's total reward for the trial together with a pass or fail badge
- Each label column header shows the label name, its judge model, its config note, its mean reward across the shown trials, and its total judge cost; these header numbers derive from the underlying results
- Switching which labels are shown as columns swaps the cells and headers without a full page reload
- A sort control orders rows by task name, by a chosen label's reward, or by the size of the delta between the two most recently selected labels; sorting one way then the other reverses the order, and rows recompute from the shared collection
- Filters narrow the rows by task and by pass/fail state under a chosen label; a delta-size filter limits rows to those whose absolute delta between the selected pair exceeds a chosen value; clearing filters restores all 12 rows exactly
- A horizontal row of suggestion chips above the table (at least 3, for example Failing on Baseline, Big deltas, one per-task chip) applies its named filter exactly when clicked; the active chip is visibly marked and clicking it again clears that filter

Feature: Comparison view —
- A Compare view lets the user pick any two distinct labels as A and B; before both are picked the region shows a designed empty state naming what to pick
- With a pair picked, a paired table lists every trial that has results under both labels, showing A's reward, B's reward, and a per-trial delta column colored by direction (improvement in one hue, regression in another) with a direction glyph so direction is never conveyed by color alone
- A summary strip above the paired table derives live from the visible pairs: mean delta, win / loss / tie counts, total judge cost under each label, and the cost delta; changing the selected pair or the filters changes these numbers accordingly
- A chart plots label A's reward against label B's reward per trial (scatter or dumbbell form); hovering a mark with the pointer shows a tooltip naming the trial and both scores
- Each of the summary strip's cost totals is a sources-style disclosure: activating it opens a list of the contributing trials with their per-trial costs, and choosing an entry highlights or scrolls to that trial's row in the paired table without leaving the app

Feature: Criterion drill-down —
- Opening a trial from the paired table shows that trial's per-criterion verdict diff for the selected pair, grouped by the four dimensions, with three visibly distinct groups: criteria failing only under A, criteria failing only under B, and agreements
- Each flip row (a criterion whose verdict differs between A and B) expands on activation to show both judges' reasoning snippets side by side, labeled with their label names; collapsing hides them again
- For the Baseline and Rubric v2 pair at least one trial has zero flips, and opening it shows a designed no-flips state saying the two labels fully agree on that trial

Feature: Attribution workflow —
- Each flip row carries an attribution control opening a form with a cause select (required, exactly three options: judge noise, rubric change effect, harness change effect) and an optional note of at most 200 characters; submitting with no cause selected shows an inline message naming the cause field and saves nothing
- Saving a valid attribution tags the flip with its cause, visible on the flip row, and can be changed later by reopening the form
- An attribution rollup for the selected label pair summarizes tagged flips by cause (for example 7 flips: 4 rubric, 2 noise, 1 harness) and updates immediately when an attribution is saved or changed, without a reload

Feature: Rescore runner —
- A Rescore with new label control opens a form with a label name (required and unique among existing labels), a judge model select (required, offering Sable 4, Quartz Mini, and Onyx Pro), and an optional config note of at most 120 characters; submitting a name that duplicates an existing label shows an inline message naming the label field and starts no run
- Submitting a valid form starts a simulated rescore run: all 12 trials render as steps that advance visibly from pending to running to complete, an overall progress indicator shows n of 12 complete, and the whole run finishes in under 20 seconds
- Exactly one trial's step fails on its first simulated attempt, shows a retrying state with an attempt counter (for example retry 2 of 3) and a visible wait before the retry, then completes; completed steps never re-run
- An event timeline beside the run lists step transitions in order with timestamps, is filterable by status, and selecting a timeline entry highlights its step
- Run-level rollups (steps complete, failures encountered, elapsed time) derive from the step states and update as steps advance
- When the run completes, the new label appears with derived results in the experiment table's label picker, in both Compare pickers, and in the cost analytics chart

Feature: Cost analytics —
- A Cost view charts cumulative judge cost per label across the ordered rescore events, one series per label; a legend control toggles each series on and off, and each series' end value equals that label's total cost shown elsewhere
- Each label in the Cost view also shows a config summary rendered as a monospaced code-style block with a copy control; activating copy gives visible confirmation and places exactly the block's text on the clipboard
</core_features>

<user_flows>
- Compare end to end: pick Baseline as A and Rubric v2 as B, read the summary strip, open a trial with flips, expand a flip to read both reasoning snippets, attribute it to rubric change effect, and watch the pair's attribution rollup increment by one — all without a reload
- Rescore end to end: open the rescore form, get rejected inline for a duplicate label name, correct the name to a unique one, pick a judge model, submit, watch the 12 steps advance with one retry, and after completion select the new label as B in Compare and see its paired deltas
- Filter chain: click the Big deltas suggestion chip, confirm the experiment table narrows to matching rows and the chip is marked active, add a task filter, sort by delta size, then clear all filters and confirm exactly 12 rows return in the default order
- Cost audit: in Compare, open the cost disclosure for label B, pick a contributing trial from the list, confirm the paired table highlights that trial, then switch to the Cost view and confirm B's series end value equals the disclosed total
- A page reload returns the app to its seeded state: 12 trials, the 4 seeded labels, default view, and no in-session labels or attributions remaining
</user_flows>

<edge_cases>
- Submitting the rescore form with a label name matching an existing label (case-insensitive) shows an inline message naming the label field, creates no label, and starts no run
- Selecting the same label for both A and B in Compare is blocked: the already-chosen label is disabled or the selection is rejected with a visible message, and no self-comparison ever renders
- A trial pair with zero flips shows the designed agreement state instead of an empty region; the attribution rollup for a pair with no tagged flips shows a designed zero state naming how to tag one
- Double-activating the rescore submit control starts exactly one run and creates exactly one label
- Deselecting every series in the Cost view legend leaves a designed empty chart state, and re-enabling a series restores it
</edge_cases>

<visual_design>
- Dense analytics register: a persistent header with the app name, view navigation (Experiments / Compare / Cost), the Rescore with new label control, and a light/dark theme toggle; the main canvas renders view-specific tables, strips, and charts with regular spacing and card surfaces with hairline borders
- Pass and fail render as distinct badges (not plain text), and delta values pair a directional hue with a direction glyph; the same encodings are used everywhere deltas and pass states appear
- Typography keeps a clear hierarchy — view titles larger than section headings, which are larger than table body and label text — and numbers align consistently in table columns with matching decimal precision
- One consistent icon set is used throughout the chrome; the light and dark themes both render coherent surface, border, and text colors with readable contrast
- All rendered copy is real product copy: no lorem ipsum or placeholder text anywhere; validation messages name the field and the fix; empty states explain what belongs in the region and what action produces it
</visual_design>

<motion>
- Hover animations (required): buttons and chips ease background and shadow with a slight press effect; table rows take a full-width hover wash; nav items and legend entries show a visible hover state; form controls show focus rings
- During a rescore run, each step's running state shows an animated indicator and the transition to complete swaps in a check with a short transition; the overall progress indicator fills smoothly rather than jumping
- Flip rows expand and collapse with a height transition and a rotating chevron cue rather than snapping open
- After saving an attribution and after a run completes, a toast slides in, remains readable, and auto-dismisses with a fade; the newly completed label's column animates into the experiment table rather than appearing instantly
- Chart marks respond to hover with a highlighted state while the tooltip is shown
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes and every flow remains fully usable
</motion>

<responsiveness>
- At 1440 pixel width all three views render their full layout with the header navigation visible
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the experiment and paired tables scroll horizontally within their own containers, and the header navigation collapses into a compact menu that still reaches all three views
</responsiveness>

<accessibility>
- Every interactive control — nav items, chips, table sorting and row actions, label pickers, flip expanders, attribution and rescore form fields, legend toggles, copy controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- Dialogs and popovers close on Escape and return focus to the control that opened them
- Form fields have visible labels, and each validation message names the field it belongs to and is associated with that field
- Pass/fail state and delta direction are never conveyed by color alone; each carries a text or glyph cue
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a complete rescore run
- The UI stays responsive under rapid repeated input — fast pair switching, filter and chip toggling, theme flips — with no hangs and no view showing stale data another view already updated
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the trials collection with per-label results and criterion verdicts, the label list, the selected comparison pair, experiment-table filters, sort, and active chips, attributions, rescore run state (per-trial step statuses, attempts, and the event log), the active view, and theme. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Completing a rescore run adds one label whose results appear in the experiment table, both Compare pickers, and the cost chart without a reload
- Saving or changing an attribution updates the flip row and the pair rollup everywhere they appear
- Filters, chips, and sort recompute the visible rows from the shared collection; they do not create a second disconnected copy
- Summary strips, header metadata, rollups, and cost totals derive from the same results the tables show; changing the selected pair or filters changes them accordingly
- Theme and active view are shared client state; toggling them does not reload the document
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Mantine is the component library for tables, selects, modals, badges, tabs, popovers, and notifications; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Tabler icons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — the rescore form and the attribution form — are driven by React Hook Form validating through a Zod schema: the schema defines the rules (required cause, unique case-insensitive label name, note length caps) and inline per-field errors render before submit. Recharts for the comparison and cumulative-cost charts. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- All judge model names and benchmark task names are fictional; do not use real product, company, or model names anywhere in the UI or seed data
- Seed exactly 12 trials across 4 tasks and exactly 4 labels as specified so every view is non-empty on first load
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
- Browsable entity: trials
- Destinations: experiments; compare; cost; trial-criterion-diff
- Filters: task; pass-fail; delta-size; label-columns; compare-pair; suggestion-chip
- Sorts: task-name; label-reward; delta-size
- Themes: light; dark
- Entity: attribution
- Entity operations: create; select; update
- Entity fields: cause; note
- Value bounds: cause in {judge-noise, rubric-change-effect, harness-change-effect}; note max 200 chars
- Session operations: start
- Demos: rescore-run
- Artifact operations: copy
- Export formats: config-summary-text
- Workflow completion: new label appears in label picker, both Compare pickers, and cost chart after run completes
- Workflow completion: attribution rollup increments when an attribution is saved

Mechanics exclusions:
- Scatter/dumbbell chart mark hover and tooltip reads stay Playwright-observed
- Rescore step running/retry animation timing and progress-fill smoothness stay Playwright-observed
- Toast slide/fade and new-label-column animate-in stay Playwright-observed
- Cost chart legend hover states stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
