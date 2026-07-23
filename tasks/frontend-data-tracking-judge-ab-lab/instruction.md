<summary>
Build a rescore A/B lab for an agent-benchmark platform — a dashboard for rescoring completed benchmark trials under alternative scorer configurations and comparing the labeled results — using React, Zustand, Tailwind CSS 4.3.2, and Mantine.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Seeded dataset —
- The app opens into an Experiments view seeded with exactly 12 completed trials spread across 4 benchmark tasks (3 trials per task, each task named, for example canvas-paint-studio, expense-dashboard, trip-planner, markdown-notes); every trial row shows its trial id and task name
- Exactly 4 result labels exist at load: Baseline (the original scoring) plus three rescore labels named Quartz Swap, Rubric v2, and Harness r8; every trial carries a Baseline result, and each trial carries results for at least 2 of the three rescore labels
- Every trial-label result carries: four dimension scores (correctness, visual, motion, technical, each between 0 and 1 shown to two decimals), a total reward between 0 and 1, a pass or fail state at the stated threshold of 0.70 total reward, a scorer model name drawn from the fictional set Sable 4, Quartz Mini, and Onyx Pro, a scoring cost in dollars, a tool-call count, and a duration in seconds
- Every trial-label result also carries exactly 16 per-criterion verdicts (4 per dimension), each verdict a pass or fail with a one-to-two-sentence reasoning snippet

Feature: Experiment table —
- The Experiments view renders the 12 trials as rows with switchable label columns: a label picker controls which labels appear as columns, and each cell shows that label's total reward for the trial together with a pass or fail badge
- Each label column header shows the label name, its scorer model, its config note, its mean reward across the shown trials, and its total scoring cost; these header numbers derive from the underlying results
- Switching which labels are shown as columns swaps the cells and headers without a full page reload
- A sort control orders rows by task name, by a chosen label's reward, or by the size of the delta between the two most recently selected labels; sorting one way then the other reverses the order, and rows recompute from the shared collection
- Filters narrow the rows by task and by pass/fail state under a chosen label; a delta-size filter limits rows to those whose absolute delta between the selected pair exceeds a chosen value; clearing filters restores all 12 rows exactly
- A horizontal row of suggestion chips above the table (at least 3, for example Failing on Baseline, Big deltas, one per-task chip) applies its named filter exactly when clicked; the active chip is visibly marked and clicking it again clears that filter

Feature: Comparison view —
- A Compare view lets the user pick any two distinct labels as A and B; before both are picked the region shows a designed empty state naming what to pick
- With a pair picked, a paired table lists every trial that has results under both labels, showing A's reward, B's reward, and a per-trial delta column colored by direction (improvement in one hue, regression in another) with a direction glyph so direction is never conveyed by color alone
- A summary strip above the paired table derives live from the visible pairs: mean delta, win / loss / tie counts, total scoring cost under each label, and the cost delta; changing the selected pair or the filters changes these numbers accordingly
- A chart plots label A's reward against label B's reward per trial (scatter or dumbbell form); hovering a mark with the pointer shows a tooltip naming the trial and both scores
- Each of the summary strip's cost totals is a sources-style disclosure: activating it opens a list of the contributing trials with their per-trial costs, and choosing an entry highlights or scrolls to that trial's row in the paired table without leaving the app

Feature: Criterion drill-down —
- Opening a trial from the paired table shows that trial's per-criterion verdict diff for the selected pair, grouped by the four dimensions, with three visibly distinct groups: criteria failing only under A, criteria failing only under B, and agreements
- Each flip row (a criterion whose verdict differs between A and B) expands on activation to show both labels' reasoning snippets side by side, labeled with their label names; collapsing hides them again
- For the Baseline and Rubric v2 pair at least one trial has zero flips, and opening it shows a designed no-flips state saying the two labels fully agree on that trial

Feature: Attribution workflow (API-shaped create payload) —
- Each flip row carries an attribution control opening a form whose submitted record IS the would-be attribution API request body and must conform to this field contract: cause (required closed enum string, exactly one of scorer noise, rubric change effect, harness change effect) and note (optional string of at most 200 characters, empty string allowed)
- Submitting with no cause selected, or with a note longer than 200 characters, shows an inline message naming the offending field and saves nothing
- Saving a valid attribution tags the flip with its cause, visible on the flip row, and can be changed later by reopening the form; the saved record's cause and note match the submitted payload shape
- An attribution rollup for the selected label pair summarizes tagged flips by cause (for example 7 flips: 4 rubric, 2 noise, 1 harness) and updates immediately when an attribution is saved or changed, without a reload

Feature: Rescore runner (API-shaped create payload) —
- A Rescore with new label control opens a form whose submitted record IS the would-be rescore-run API request body and must conform to this field contract: labelName (required non-empty string, unique among existing labels case-insensitively), scorerModel (required closed enum string, exactly one of Sable 4, Quartz Mini, Onyx Pro), and configNote (optional string of at most 120 characters, empty string allowed)
- Submitting a labelName that duplicates an existing label, an empty labelName, a missing scorerModel, or a configNote longer than 120 characters shows an inline message naming the offending field and starts no run
- Submitting a valid form starts a simulated rescore run: all 12 trials render as steps that advance visibly from pending to running to complete, an overall progress indicator shows n of 12 complete, and the whole run finishes in under 20 seconds
- Exactly one trial's step fails on its first simulated attempt, shows a retrying state with an attempt counter (for example retry 2 of 3) and a visible wait before the retry, then completes; completed steps never re-run
- An event timeline beside the run lists step transitions in order with timestamps, is filterable by status, and selecting a timeline entry highlights its step
- Run-level rollups (steps complete, failures encountered, elapsed time) derive from the step states and update as steps advance
- When the run completes, the new label appears with derived results in the experiment table's label picker, in both Compare pickers, and in the cost analytics chart

Feature: Cost analytics —
- A Cost view charts cumulative scoring cost per label across the ordered rescore events, one series per label; a legend control toggles each series on and off, and each series' end value equals that label's total cost shown elsewhere
- Each label in the Cost view also shows a config summary rendered as a monospaced code-style block with a copy control; activating copy gives visible confirmation and places exactly the block's text on the clipboard

Feature: Pass-rate radial wheel —
- In the Compare view, beside the summary strip, a radial pass/fail wheel renders two rings — one for label A and one for label B — showing the share of visible paired trials that pass under each label at the 0.70 threshold; a legend maps each ring to its label name
- Changing the selected pair or the experiment filters that narrow the paired table immediately redraws both rings to match the newly visible set

Feature: Saved comparison pairs (API-shaped create payload) —
- A Save pair control captures the current A and B labels under a required unique name; the submitted record IS the would-be saved-pair API request body and must conform to this field contract: name (required non-empty string, at most 40 characters, unique among saved pairs case-insensitively), labelA and labelB (required distinct strings naming two existing labels, matching the current pickers)
- Submitting an empty name, a duplicate name, a name longer than 40 characters, or a payload where labelA equals labelB shows an inline message naming the offending field and saves nothing
- Saved pairs list in a menu; applying one restores exactly those two labels into the A and B pickers and regenerates the paired table, summary strip, chart, attribution rollup, and pass-rate wheel without a reload
- A delete action on a saved pair asks for confirmation; confirming removes it from the menu; canceling leaves it intact

Feature: Undo and redo —
- Header Undo and Redo controls apply to attribution saves and attribution cause or note changes; each control is disabled when there is nothing to undo or redo
- Undoing an attribution save removes that tag from the flip row and decrements the pair rollup exactly as before the save; Redo restores the tag and the prior rollup counts

Feature: Command palette —
- Pressing Command-K or Control-K opens a command palette overlay with a search field that fuzzy-matches at least the three view destinations (Experiments, Compare, Cost), the Rescore with new label action, the Export lab results action, and every existing label name
- Choosing a view destination switches to that view and closes the palette; choosing Rescore with new label opens the rescore form; choosing Export lab results opens the export panel; choosing a label name offers A or B assignment into the Compare pickers
- Escape closes the palette and returns focus to the control that had it; with an empty search and no matches the palette shows a designed empty state naming what to type

Feature: Export and import lab results (useful end state; API-shaped payload) —
- The app PRODUCES the operator's lab results pack: an Export lab results control opens a panel showing a structured JSON document compiled live from session state, with Download JSON, Copy, and Import controls
- The JSON IS the would-be request/response body for a lab-results API: it is compiled and validated against an API-shaped field contract so every export and every successful import is a complete, schema-valid payload — not an ad-hoc bag of strings
- Lab results field contract (all top-level keys REQUIRED; no undeclared top-level keys):
  - schemaVersion: string, exactly rescore-ab-lab-v1
  - labels: array of objects; each object requires name (non-empty string), scorerModel (exactly one of Sable 4, Quartz Mini, Onyx Pro), configNote (string, maximum 120 characters, may be empty), meanReward (number from 0 to 1 inclusive), totalCost (non-negative number)
  - trials: array listing every trial in the current collection; each trial requires id (non-empty string), taskName (non-empty string), and results (object keyed by label name); each per-label result requires totalReward (number from 0 to 1 inclusive), pass (boolean), dimensions (object with correctness, visual, motion, and technical each a number from 0 to 1 inclusive), scorerCost (non-negative number), and criteria (array of exactly 16 objects each requiring id non-empty string, dimension exactly one of correctness, visual, motion, technical, verdict exactly one of pass or fail, and reasoning a non-empty string)
  - attributions: array of objects; each requires trialId (non-empty string), criterionId (non-empty string), labelA and labelB (distinct non-empty strings), cause (exactly one of scorer-noise, rubric-change-effect, harness-change-effect), and note (string, maximum 200 characters, may be empty)
  - compareSummary: null when no compare pair is selected; otherwise an object requiring labelA, labelB (distinct existing label names), meanDelta (number), wins, losses, ties (non-negative integers), costA, costB (non-negative numbers), passRateA, passRateB (numbers from 0 to 1 inclusive)
  - savedPairs: array of objects; each requires name (non-empty string, maximum 40 characters), labelA and labelB (distinct non-empty strings naming labels that exist in labels)
  - generatedAt: string in ISO-8601 datetime form (for example 2026-07-19T18:00:00.000Z) that updates whenever the exported document is regenerated
- Cross-field rules: every attributions.trialId equals a trials.id present in the document; every attributions.cause is inside the closed enum; every key inside a trial's results equals a labels.name present in the document; pass is true exactly when totalReward is at least 0.70; every savedPairs.labelA and labelB equals a labels.name present in the document; when compareSummary is not null its labelA and labelB are distinct and exist in labels
- The attribution, rescore, and saved-pair forms create records that match the corresponding nested objects in this same field contract; form validation enforces the same required fields, enums, and bounds the export shape declares, always naming the offending field inline
- The export reflects session mutations: after a completed rescore the new label and its results appear under labels and trials.results; after saving an attribution that attribution appears under attributions; after saving a comparison pair that name appears under savedPairs; an export that omits those session changes is incorrect; the open JSON preview must still show every required top-level key from the field contract
- Activating Copy places exactly the panel's JSON text on the clipboard and shows visible confirmation; Download offers the same JSON as a downloadable file named lab-results.json
- An Import control accepts a previously exported lab-results JSON only when it passes the field contract; on success it restores attributions and savedPairs so flip tags, the attribution rollup, and the saved-pair menu match the imported document, and regenerates the export preview; a payload that violates the field contract (missing schemaVersion or attributions, schemaVersion not rescore-ab-lab-v1, cause outside the closed enum, note longer than 200 characters, savedPairs name longer than 40 characters, pass inconsistent with totalReward, or non-array values for array fields) does not apply any partial state; the panel shows an inline import error that names the offending field or rule, and attributions and saved pairs stay unchanged
</core_features>

<user_flows>
- Compare end to end: pick Baseline as A and Rubric v2 as B, read the summary strip and pass-rate wheel, open a trial with flips, expand a flip to read both reasoning snippets, attribute it to rubric change effect, watch the pair's attribution rollup increment by one, then Undo and confirm the tag and rollup revert — all without a reload
- Rescore end to end: open the rescore form, get rejected inline for a duplicate label name, correct the name to a unique one, pick a scorer model, submit, watch the 12 steps advance with one retry, and after completion select the new label as B in Compare and see its paired deltas
- Filter chain: click the Big deltas suggestion chip, confirm the experiment table narrows to matching rows and the chip is marked active, add a task filter, sort by delta size, then clear all filters and confirm exactly 12 rows return in the default order
- Cost audit: in Compare, open the cost disclosure for label B, pick a contributing trial from the list, confirm the paired table highlights that trial, then switch to the Cost view and confirm B's series end value equals the disclosed total
- Saved pair round trip: pick Baseline and Quartz Swap, save the pair under a unique name, switch both pickers away, apply the saved pair, and confirm A, B, summary strip, chart, and pass-rate wheel restore to that pair
- Export after mutations: complete a rescore with a unique label, attribute one flip under Baseline versus that label, open Export lab results, and confirm the JSON shows schemaVersion rescore-ab-lab-v1, names the new label under labels with its scorerModel, includes its trial results, and lists the attribution with cause in the closed enum; Copy places that exact JSON on the clipboard
- Import round trip: attribute one flip under Baseline versus Rubric v2, save that pair under a unique name, Download lab-results.json, reload to seeded state, Import that file, and confirm the attribution tag, rollup, and saved-pair menu entry return; a second Import of a payload with schemaVersion other than rescore-ab-lab-v1 or cause outside the enum leaves attributions and saved pairs unchanged and shows a named-field import error
- Command palette jump: open the palette with Control-K or Command-K, type enough to match Cost, choose it, and land on the Cost view with the palette closed
- A page reload returns the app to its seeded state: 12 trials, the 4 seeded labels, default view, and no in-session labels, attributions, saved pairs, or undo history remaining
</user_flows>

<edge_cases>
- Submitting the rescore form with a label name matching an existing label (case-insensitive), an empty labelName, a missing scorerModel, or a configNote longer than 120 characters shows an inline message naming the offending field, creates no label, and starts no run
- Submitting the attribution form with no cause or with a note longer than 200 characters shows an inline message naming the offending field and saves nothing
- Saving a comparison pair with an empty name, a duplicate name, a name longer than 40 characters, or with labelA equal to labelB shows an inline message naming the offending field and adds no menu entry
- Selecting the same label for both A and B in Compare is blocked: the already-chosen label is disabled or the selection is rejected with a visible message, and no self-comparison ever renders
- A trial pair with zero flips shows the designed agreement state instead of an empty region; the attribution rollup for a pair with no tagged flips shows a designed zero state naming how to tag one
- Double-activating the rescore submit control starts exactly one run and creates exactly one label
- Deselecting every series in the Cost view legend leaves a designed empty chart state, and re-enabling a series restores it
- With Undo disabled (nothing to undo), activating Undo changes no attribution state; after one undo, Redo restores exactly the prior tag
- Opening Export lab results before any in-session rescore or attribution still produces valid JSON for the seeded 12 trials and 4 labels with schemaVersion rescore-ab-lab-v1 and every required top-level key; the panel never shows an empty or broken region
- Importing malformed JSON, or parseable JSON that fails the lab results field contract (missing schemaVersion, schemaVersion not rescore-ab-lab-v1, cause outside the closed enum, note longer than 200 characters, savedPairs name longer than 40 characters, or pass inconsistent with totalReward), leaves attributions and saved pairs unchanged and shows validation naming the offending field
- Closing the command palette with Escape while a Compare drill-down is open leaves the drill-down intact
</edge_cases>

<visual_design>
- Dense analytics register: a persistent header with the app name, view navigation (Experiments / Compare / Cost), the Rescore with new label control, Undo and Redo, Export lab results, and a light/dark theme toggle; the main canvas renders view-specific tables, strips, charts, and the pass-rate wheel with regular spacing and card surfaces with hairline borders
- Pass and fail render as distinct badges (not plain text), and delta values pair a directional hue with a direction glyph; the same encodings are used everywhere deltas and pass states appear, including the pass-rate wheel legend
- Typography keeps a clear hierarchy — view titles larger than section headings, which are larger than table body and label text — and numbers align consistently in table columns with matching decimal precision
- One consistent icon set is used throughout the chrome; the light and dark themes both render coherent surface, border, and text colors with readable contrast
- The command palette and export panel use the same surface and border language as the rest of the app rather than unstyled browser defaults
- All rendered copy is real product copy: no lorem ipsum or placeholder text anywhere; validation messages name the field and the fix; empty states explain what belongs in the region and what action produces it
</visual_design>

<motion>
- Hover animations (required): buttons and chips ease background and shadow with a slight press effect; table rows take a full-width hover wash; nav items and legend entries show a visible hover state; form controls show focus rings
- During a rescore run, each step's running state shows an animated indicator and the transition to complete swaps in a check with a short transition; the overall progress indicator fills smoothly rather than jumping
- Flip rows expand and collapse with a height transition and a rotating chevron cue rather than snapping open
- After saving an attribution and after a run completes, a toast slides in, remains readable, and auto-dismisses with a fade; the newly completed label's column animates into the experiment table rather than appearing instantly
- Chart marks respond to hover with a highlighted state while the tooltip is shown
- The pass-rate wheel rings sweep to their percentages when a pair is first selected and ease to new values when filters or the pair change
- The command palette and export panel enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- With prefers-reduced-motion set, animations are removed or reduced to instant state changes and every flow remains fully usable
</motion>

<responsiveness>
- At 1440 pixel width all three views render their full layout with the header navigation visible
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the experiment and paired tables scroll horizontally within their own containers, and the header navigation collapses into a compact menu that still reaches all three views
</responsiveness>

<accessibility>
- Every interactive control — nav items, chips, table sorting and row actions, label pickers, flip expanders, attribution and rescore form fields, legend toggles, copy controls, Undo and Redo, Export, Import, saved-pair actions, and command palette results — is reachable and operable with the keyboard alone, with a visible focus indicator
- Dialogs, the command palette, and the export panel close on Escape and return focus to the control that opened them; the command palette and export panel trap focus while open
- Form fields have visible labels, and each validation message names the field it belongs to and is associated with that field
- Pass/fail state and delta direction are never conveyed by color alone; each carries a text or glyph cue
- Completing a rescore run and saving an attribution are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a complete rescore run, command palette use, and export
- The UI stays responsive under rapid repeated input — fast pair switching, filter and chip toggling, theme flips, palette open/close — with no hangs and no view showing stale data another view already updated
- Opening Export lab results regenerates the JSON from live state without freezing the UI for more than a brief moment
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the trials collection with per-label results and criterion verdicts, the label list, the selected comparison pair, experiment-table filters, sort, and active chips, attributions, saved comparison pairs, rescore run state (per-trial step statuses, attempts, and the event log), the active view, and theme. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Completing a rescore run adds one label whose results appear in the experiment table, both Compare pickers, and the cost chart without a reload
- Saving or changing an attribution updates the flip row and the pair rollup everywhere they appear
- Filters, chips, and sort recompute the visible rows from the shared collection; they do not create a second disconnected copy
- Summary strips, header metadata, rollups, and cost totals derive from the same results the tables show; changing the selected pair or filters changes them accordingly
- Theme and active view are shared client state; toggling them does not reload the document
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Mantine is the component library for tables, selects, modals, badges, tabs, popovers, and notifications; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Tabler icons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — the rescore form, the attribution form, and the saved-pair form — are driven by React Hook Form validating through a Zod schema that mirrors the lab-results API field contracts above: the schema defines the rules (required cause enum, unique case-insensitive labelName, scorerModel enum, note and configNote length caps, saved-pair name bounds) and inline per-field errors render before submit; the record a valid form creates IS the would-be request body, and Export and Import compile and validate against those same schemas. Recharts for the comparison and cumulative-cost charts. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- All scorer model names and benchmark task names are fictional; do not use real product, company, or model names anywhere in the UI or seed data
- Seed exactly 12 trials across 4 tasks and exactly 4 labels as specified so every view is non-empty on first load
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- The useful end state is the lab results pack: Export must produce schema-valid JSON that reflects every rescore, attribution, and saved-pair mutation made in the session and conforms to the API-shaped field contract (schemaVersion rescore-ab-lab-v1 plus labels, trials, attributions, compareSummary, savedPairs, generatedAt with the formats, enums, bounds, and cross-field rules above); Import round-trips a contract-valid pack back into attributions and saved pairs and refuses contract-invalid payloads without partial mutation
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Value bounds: cause in {scorer-noise, rubric-change-effect, harness-change-effect}; note max 200 chars; labelName unique case-insensitive non-empty; scorerModel in {Sable 4, Quartz Mini, Onyx Pro}; configNote max 120 chars; savedPair name max 40 chars unique case-insensitive
- Session operations: start
- Demos: rescore-run
- Artifact operations: export; import; copy
- Export formats: lab-results-json; config-summary-text
- Workflow completion: new label appears in label picker, both Compare pickers, and cost chart after run completes
- Workflow completion: attribution rollup increments when an attribution is saved
- Workflow completion: export JSON shows schemaVersion rescore-ab-lab-v1 with session attributions and labels
- Workflow completion: import of contract-valid lab-results JSON restores attributions and saved pairs
- Import modes: lab-results-json

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
