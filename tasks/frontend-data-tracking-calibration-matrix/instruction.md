<summary>
Build an inter-harness calibration and agreement dashboard for eval runs called Meridian Calibration using Vue 3, Pinia, Tailwind CSS 4.3.2, and Vuetify.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Calibration heatmap —
- The app opens into a heatmap grid of at least 6 fictional model rows (for example Quillfox-7, Marlin-XL, Cobaltine-2, Peregrine-Lite, Sagebrush-9, Tundra-Mini) by at least 4 fictional harness columns (for example driftbench, quarry, lanternctl, mosaic-eval); every cell is colored on a red to amber to green scale by its mean score and shows the mean score to 2 decimal places plus the trial count
- Hovering a cell with the pointer shows a tooltip listing that cell's per-trial rewards
- Clicking a cell opens a side drawer showing the cell's model and harness names, a trial list with one row per trial (trial id, reward, runtime, cost), and a mini distribution chart of the rewards; the drawer closes from its close control and by clicking outside it

Feature: Variance view —
- A variance view lists per-task rows, each showing the task name, its category, the per-harness mean scores, and the coefficient of variation across harnesses to 2 decimal places
- A stated sigma gate threshold is shown beside a slider; each row carries a classification chip — stable when its coefficient of variation is at or below the threshold, divergent when above — and moving the slider reclassifies rows immediately
- A divergent-count rollup above the rows shows the count of currently divergent rows; moving the threshold slider updates the rollup in the same interaction with no reload

Feature: Fairness triage —
- Each divergent row offers a Classify control that opens a form whose submit payload is a Classification record; an inline message names each offending field while invalid, and submit stays disabled until the form is valid
- Classification field contract (the Classify form and bulk Apply classification submit exactly this payload; the record created IS the would-be triage-API request body; all keys required; example values illustrative only): task (required non-empty string naming the variance row's task, at most 80 characters after trim), classification (required closed enum exactly one of capability-gap or spec-defect), rationale (required trimmed string of at least 15 and at most 500 characters)
- Cross-field rules: classification outside the closed enum is invalid; rationale shorter than 15 characters after trim is invalid; whitespace-only rationale is invalid; task empty or over 80 characters is invalid
- Submitting a valid Classification badges the row with the chosen classification and increments the matching count in a triage summary panel (capability-gap total, spec-defect total, unclassified divergent total); reclassifying a row moves it between totals rather than double-counting
- Rows classified while divergent keep their badge visible; the triage summary panel always sums to the current divergent count

Feature: Filters —
- Filter controls for model, harness, and task category narrow both the heatmap and the variance view from the same shared data: filtering out a harness removes its column from the heatmap and removes its scores from every coefficient-of-variation computation in the same interaction
- Clearing all filters restores the full grid and full variance rows exactly; when filters match nothing, each affected region shows a designed empty state with a clear-filters control instead of a blank area

Feature: Simulated re-run —
- Any heatmap cell offers a Re-run control; starting it walks the visible status vocabulary queued, then running with a progress list showing one line per trial that ticks complete as each simulated trial finishes, then complete
- While a re-run is running, the affected cell shows an in-progress indicator, and a loading affordance renders wherever that cell's data is displayed
- After a re-run completes, the cell's mean score and trial count update, the cell's hover tooltip lists the new per-trial rewards, the drawer trial list for that cell shows the new trials, and every variance row that includes that model and harness recomputes its coefficient of variation and classification coherently
- Each completed re-run appends one entry to an event timeline (newest first, timestamp, model, harness, and resulting mean); the timeline is visible from a panel or tab

Feature: Score-by-harness chart —
- A chart panel renders grouped bars of score by harness for a selected model, with a model selector; changing the selected model redraws the bars from that model's data
- Each harness series in the chart can be toggled on and off from a legend control, and hovering a bar shows a tooltip with the harness name and score; toggling a series off removes its bars and toggling it back restores them

Feature: Baseline pin —
- A Pin baseline control captures the current per-cell mean scores as a baseline snapshot; while a baseline is pinned, every heatmap cell whose mean differs from its baseline shows a signed delta to 2 decimal places beside the live mean
- Clear baseline removes the snapshot and all delta readouts in the same interaction; pinning again replaces the prior snapshot with the current means

Feature: Bulk triage —
- Variance rows that are currently divergent expose a row checkbox; selecting two or more divergent rows reveals a bulk action bar with Apply classification
- Apply classification opens the same Classification form and validates against the Classification field contract; submitting a valid form badges every selected row with that classification (task set per selected row) and shifts the triage summary totals by exactly the number of newly classified or reclassified rows rather than double-counting
- Clearing the selection hides the bulk action bar; rows that are stable cannot be selected for bulk triage

Feature: Undo and redo —
- Toolbar Undo and Redo controls reverse and reapply session edits: threshold slider moves, single-row classifications, bulk classifications, and baseline pin or clear; each control is disabled when there is nothing to undo or redo
- Undoing a classification restores the prior badge state and every triage summary total exactly; undoing a threshold move restores the prior chips and divergent rollup exactly

Feature: Command palette —
- Pressing Command-K or Control-K opens a command palette overlay listing at least the destinations heatmap, variance, chart, timeline, and export, plus filter-clear and pin-baseline actions; choosing an entry navigates or runs that action and closes the palette
- Escape and clicking the backdrop close the palette without changing state; typing filters the listed commands to matching labels

Feature: Export calibration pack —
- An Export control opens a drawer with JSON and CSV tabs compiled live from the store; Download JSON, Download CSV, and Copy controls are available; Copy writes the active tab's text to the clipboard and shows a brief copied confirmation; Download triggers a real file download of that tab's content
- CalibrationPack JSON field contract (the JSON tab preview, Download JSON, and Copy MUST conform; all keys and nesting required unless marked optional; example values illustrative only): schemaVersion (required integer 1), document (required string meridian-calibration), sigmaThreshold (required number equal to the live slider value), models (required array of model name strings), harnesses (required array of harness name strings), cells (required array of objects each with model, harness, mean as a number, trialCount as a non-negative integer, and trials as an array of objects each with id, reward, runtime, and cost), varianceRows (required array of objects each with task, category, means as an object mapping each harness name to a number, coefficientOfVariation as a number, stability exactly one of stable or divergent, and triage either null or a Classification payload matching the Classification field contract), timeline (required array of objects each with timestamp, model, harness, and mean), baseline (null when no baseline is pinned; otherwise an object with cells as an array of objects each with model, harness, and mean), filters (required object with model, harness, and taskCategory arrays naming currently applied filter values — empty arrays when none), triage (required array of Classification payloads for every currently classified task)
- Variance CSV field contract (the CSV tab preview, Download CSV, and Copy MUST conform): the first line is a header naming task, category, then one column per current harness in harness order, then coefficientOfVariation, stability, and classification; each subsequent line is one variance task with values matching the live variance view; the classification cell is empty when unclassified or exactly capability-gap or spec-defect when classified
- Export content reflects every session mutation: a completed re-run, a saved classification, a moved threshold, and active filters all appear in the exported text exactly as the live surfaces show them; an export that omits session work or violates the CalibrationPack or Variance CSV field contracts is incomplete

Feature: Import triage pack —
- An Import control accepts pasted or file-picked JSON that is either a TriagePack or a CalibrationPack; a valid import applies Classification payloads to matching divergent rows, updates badges and triage summary totals, and is itself undoable
- TriagePack field contract (all keys required; example values illustrative only): schemaVersion (required integer 1), document (required string meridian-triage), entries (required array of Classification payloads matching the Classification field contract)
- When the pasted document is a CalibrationPack, Import applies its triage array using the same Classification rules; when it is a TriagePack, Import applies its entries array
- Exporting CalibrationPack JSON after classifying rows, then importing that same JSON into a fresh session that has the same divergent rows, restores the same badges and summary totals (round-trip)
- An invalid pack — empty, unparseable, schemaVersion not 1, document outside meridian-triage or meridian-calibration, missing entries/triage, or any Classification payload that breaks the Classification field contract — shows an inline error naming the offending field (or the payload when JSON is unparseable) and applies no classifications
</core_features>

<user_flows>
- Investigating a divergent cell: hover a low-scoring cell to read its per-trial rewards, click it to open the drawer, read the trial list and distribution chart, then close the drawer and find the same task rows in the variance view showing a divergent chip — all without a reload
- Re-running a cell end to end: start a re-run, watch the queued state, watch the per-trial progress list tick each trial, and on completion confirm the cell's score and trial count changed, the tooltip and drawer show the new trials, dependent variance rows recomputed, and the timeline gained exactly one entry
- Triaging a divergent task: move the threshold slider until a target row turns divergent, open its Classify form, submit a Classification payload with classification spec-defect and a rationale of at least 15 characters, and confirm the row badges and the triage summary shifts by one in the matching total
- Filter coherence: apply a harness filter, confirm the heatmap column disappears and the variance coefficients recompute in the same interaction, then clear filters and confirm the original grid and rows return exactly
- Baseline then re-run: pin a baseline, complete a re-run on a cell, confirm that cell shows a signed mean delta versus the pinned baseline, then clear the baseline and confirm every delta disappears
- Bulk classify then undo: select at least two divergent rows, apply one classification through the bulk form, confirm both badges and the summary shift by that count, then Undo once and confirm both rows and every summary total return to their exact prior values
- Export after session work: classify a divergent row, complete a re-run, move the threshold, open Export, and confirm the JSON preview still shows every required CalibrationPack key (schemaVersion, document, sigmaThreshold, models, harnesses, cells, varianceRows, timeline, baseline, filters, triage) with the new classification, updated cell mean and trial rewards, and current threshold — then Copy confirms and Download produces a file
- Import round-trip: after classifying at least two divergent rows, export CalibrationPack JSON, reload to seeded state, re-create the divergent set with the threshold if needed, import that same JSON, and confirm the same badges and summary totals return
- Command palette jump: open the palette with Control-K or Command-K, choose Export, and confirm the export drawer opens without a reload
- A page reload returns the app to its seeded state: the seeded grid, default threshold, no classifications, empty re-run timeline, no baseline, empty undo history, and no open export drawer
</user_flows>

<edge_cases>
- Submitting the triage form with a rationale under 15 characters, an empty task, or a classification outside capability-gap and spec-defect shows an inline message naming the offending field and applies no classification; the summary totals are unchanged
- Cancel on the triage form leaves the row and summary totals unchanged
- Starting a re-run on a cell disables that cell's Re-run control until the run completes; double-activating it starts exactly one run and appends exactly one timeline entry
- Moving the threshold slider to its extremes classifies all rows stable at the maximum and all (or nearly all) rows divergent at the minimum, and the divergent rollup matches the visible chip counts at every position
- Toggling every chart series off shows a designed empty-chart message rather than a blank panel
- Undo and Redo stay disabled until at least one undoable edit exists; activating Undo at the bottom of the stack changes nothing
- Selecting fewer than two divergent rows never shows the bulk Apply classification action as enabled
- Importing an unparseable or empty pack, or JSON that violates the TriagePack or CalibrationPack field contract (wrong schemaVersion, document outside meridian-triage/meridian-calibration, missing entries/triage, or a Classification entry that breaks the Classification field contract), shows an inline error naming the offending field and leaves badges and summary totals unchanged
- Opening Export with every harness filtered out still produces designed empty-table copy in the CSV tab rather than a blank drawer
</edge_cases>

<visual_design>
- Analytics-console register: the heatmap is the visual anchor of the default view, with the variance view, triage summary, chart panel, and timeline reachable as tabs or panels around it; dense data surfaces with generous section padding
- Heatmap cells use one continuous red to amber to green color ramp mapped to mean score, with the score and trial count set in a compact two-line cell layout; cell text keeps readable contrast against every ramp color
- Classification chips use one consistent chip system: a calm tint for stable, a warning tint for divergent, and distinct labeled badges for capability-gap and spec-defect that read as related but different from the stable/divergent pair
- Typography hierarchy: view titles largest, panel headings next, cell and row text smallest; numbers align in tabular figures so score columns line up
- The drawer presents its trial list as a dense table with right-aligned numeric columns and the distribution chart above or below it, visually consistent with the main surfaces
- One consistent icon set across chrome; the threshold slider shows its current numeric value beside it at all times
- Cards, drawer, and panels share consistent corner radii, shadow depth, and border treatments
</visual_design>

<motion>
- Hover animations (required): heatmap cells lift with a subtle scale or shadow on hover; buttons ease background and shadow with a slight press; variance rows and timeline entries take a full-width hover wash; form controls show focus rings
- The drawer slides in from the edge with a short transition of roughly 200 to 300 milliseconds and slides out on close rather than snapping
- Re-run motion: the queued badge crossfades to running, each progress-list line ticks complete with a check animation, and the completed cell's new score counts to its value rather than swapping instantly
- Moving the threshold slider animates chips that change classification (a short crossfade between stable and divergent) and the divergent rollup number transitions rather than snapping
- Chart bars animate on model change and on series toggle: entering bars grow in and leaving bars shrink out
- A new timeline entry slides in at the top of the list; triage summary totals tick to their new values when a classification lands
- Toasts confirm a completed re-run and a saved classification: slide in, remain readable, auto-dismiss with a fade
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow remains complete
</motion>

<responsiveness>
- At desktop widths of 1024 pixels and above, the heatmap and its side panels share the canvas; below 1024 pixels panels stack vertically and the drawer becomes full-width
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the heatmap grid scrolls horizontally within its own container with the model-name column staying legible
</responsiveness>

<accessibility>
- Every interactive control — heatmap cells, filters, the threshold slider, Classify and Re-run controls, chart legend toggles, drawer chrome — is reachable and operable with the keyboard alone, with a visible focus indicator; the slider responds to arrow keys
- The drawer traps focus while open, closes on Escape, and returns focus to the cell that opened it
- Cell state and classifications are never conveyed by color alone: scores and trial counts are rendered as text in every cell, and chips carry text labels
- Inline validation messages are associated with the fields they name, and the divergent rollup change is announced through a polite live region when the threshold moves
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a complete re-run and rapid slider movement
- Moving the threshold slider reclassifies all rows without perceptible lag, and the UI stays responsive during a running re-run with no hangs
</performance>

<writing>
- Validation and import errors name the offending field and the fix (for example rationale must be at least 15 characters, classification must be capability-gap or spec-defect, schemaVersion must be 1)
- Empty filter and empty-chart states explain what matched nothing and how to recover with clear-filters or series toggles
- Export drawer tab labels read JSON and CSV; primary actions read Classify, Re-run, Pin baseline, Export, and Import
- No placeholder text such as lorem ipsum or TODO appears anywhere in the shipped UI
</writing>


<innovation>
- Beyond the required calibration console, reward a polished operator touch that helps trust the session artifact — for example a compact CalibrationPack summary strip naming cell count and divergent count above the export preview, keyboard shortcuts for Undo/Redo, or a live schemaVersion badge on the export drawer — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
Shared application state must live in Pinia (in-memory only): the models, harnesses, tasks, and per-cell trial collections, active filters, the sigma threshold, triage classifications, re-run statuses and per-trial progress, the event timeline, the selected chart model and series visibility, drawer state, active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- The heatmap, tooltips, drawer, variance rows, triage summary, and chart all derive from the one trial collection in the store; a completed re-run changes that collection once and every dependent surface recomputes from it, never from a second disconnected copy
- Filters narrow the heatmap and the variance computations from the same shared data in one interaction
- Threshold, classifications, and the divergent rollup are shared state: moving the slider or saving a classification updates chips, rollups, and summary totals together without a reload
- Re-run status, per-trial progress, and timeline entries live in the store; UI-triggered and contract-triggered runs produce the same visible trail
- Active view, drawer state, and chart series visibility are shared client state; changing them never reloads the document
- WebMCP tool handlers, where present, invoke the same store commands as the visible controls
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Vuetify is the component library for the drawer, tabs, sliders, chips, tooltips, data tables, form controls, and toasts, keeping its component styles while Tailwind owns layout and custom surfaces; no other component library. @vueuse/motion and AutoAnimate allowed for animation; no other animation libraries. One icon set only, installed on demand through a local icon build pipeline from npm — no raw copy-pasted SVG icon sets. All forms — the triage form, bulk Apply classification, and Import paste — are driven by VeeValidate validating through a Zod schema: schemas are API-shaped and mirror the Classification, CalibrationPack, and TriagePack field contracts above; the record a valid Classify submit creates IS the Classification request body; Export JSON/CSV and Import conform to those same schemas; inline per-field errors render before submit. ECharts through its Vue wrapper renders the distribution chart and the score-by-harness grouped bars. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 6 fictional models, at least 4 fictional harnesses, at least 12 tasks across at least 3 categories, and 3 to 6 trials per cell with varied rewards so both stable and divergent rows exist at the default threshold
- All simulated timing (queued delay, per-trial ticks) runs client-side; re-run rewards must be re-randomized so repeated runs produce different scores
- Invalid triage submissions must not change any total; show visible validation feedback
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
- Browsable entity: cells
- Destinations: heatmap; variance; chart; timeline; cell-drawer; export; import
- Filters: model; harness; task-category; sigma-threshold; chart-model; chart-series
- Value bounds: models from seeded set (Quillfox-7, Marlin-XL, Cobaltine-2, Peregrine-Lite, Sagebrush-9, Tundra-Mini); harnesses from seeded set (driftbench, quarry, lanternctl, mosaic-eval)
- Entity: classification
- Entity operations: create; select; update
- Entity fields: classification; rationale
- Session operations: start
- Demos: cell-re-run
- Workflow completion: completed re-run updates cell mean/trial count, drawer trial list, dependent variance rows, and appends one timeline entry
- Workflow completion: saving a classification badges the row and shifts exactly one triage summary total
- Workflow completion: export JSON preview includes schemaVersion 1 and document meridian-calibration
- Workflow completion: import of a valid CalibrationPack triage array restores classification badges
- Artifact operations: export; import; copy
- Export formats: calibration-json; variance-csv
- Import modes: calibration-json; triage-json

Mechanics exclusions:
- Heatmap cell hover tooltips and red-amber-green ramp color reads stay Playwright-observed
- Chart bar hover tooltips, legend toggle grow/shrink animations stay Playwright-observed
- Re-run tick animation, score count-up, and chip crossfade on threshold moves stay Playwright-observed
- Clipboard contents and downloaded CalibrationPack or Variance CSV bytes stay Playwright-observed
- File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp may drive paste-mode Import confirm only

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
