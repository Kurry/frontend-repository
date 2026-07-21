<summary>
Build a PaneCraft dashboard builder using Svelte 5 in runes mode, shared runes state ($state/$derived), Tailwind CSS 4.3.2, and shadcn-svelte. The app produces the operator's workspace artifact: a downloadable and copyable Workspace JSON document (plus a Markdown report) compiled live from pages, panes, date range, and saved analyses, conforming to the same API-shaped field contracts as create/edit forms, with Import that round-trips that JSON.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
On load with empty storage the workspace opens directly at the root with no login: a dark navy header reading PaneCraft, a row of page tabs, a Data Source Library, and a default page named Dashboard already holding three panes (a Traffic trend line chart, a Revenue by category bar chart, and an Open support volume counter). Nothing starts empty.
The app ships three bundled mock data sources that are present immediately and never depend on storage. Each source has a closed API id used in every create payload and export: website-analytics labeled Website Analytics (90 daily rows with date, pageViews, sessions, bounceRatePct), sales-sheet labeled Sales Sheet (60 order rows with orderId, product, category one of Hardware/Software/Services, unitsSold, revenue, orderDate), and support-tickets labeled Support Tickets (50 rows with ticketId, category one of Billing/Bug/Feature Request/Account, status one of Open/In Progress/Resolved, createdDate, and resolutionHours present only when status is Resolved).
Clicking a source in the Data Source Library opens a preview modal listing that source's raw rows in a table with the column headers; a Filter preview rows text input narrows the visible rows to those matching the typed text as the user types, and a counter shows the matching-row count out of the source total.
Create Pane opens a three-step wizard whose finished submit creates a PaneConfig record that IS the would-be pane-definition request body a dashboard API would accept. Step 1 choose a data source; step 2 choose a pane type from exactly five options (Line Chart, Bar Chart, Donut Chart, Data Table, Counter); step 3 configure metric, optional dimension, size, and refresh interval. Completing the wizard adds the finished pane to the current page rendering that source's data; the new pane's visible type, source, metric, dimension, size, and refresh match the submitted PaneConfig, and the same field names and enum values appear for that pane in the Workspace JSON export.
PaneConfig field contract (API-shaped create/update payload; all keys required unless marked optional; example values illustrative only; enforced with inline errors naming the offending field before submit, and with advance/submit disabled until the current step is valid):
- source: required closed enum website-analytics / sales-sheet / support-tickets
- type: required closed enum line / bar / donut / table / counter (UI labels Line Chart, Bar Chart, Donut Chart, Data Table, Counter map to these values)
- metric: required non-empty string naming a column that exists on the chosen source
- dimension: required non-empty string naming a column on the chosen source when type is line, bar, or donut; must be null when type is table or counter
- size: required closed enum small / medium / large (UI Small / Medium / Large; small spans one grid column, medium two, large four)
- refreshInterval: required closed enum off / 30s / 5m (UI Off / Every 30s / Every 5m)
Cross-field rules: metric and any required dimension must belong to the chosen source's columns; a chart type with a missing or non-source dimension is invalid; a table or counter with a non-null dimension is invalid; values outside the closed enums are invalid.
Each pane exposes an Edit control that reopens its configuration against the same PaneConfig field contract (source, type, metric, dimension, size, refreshInterval) and applies changes in place without deleting the pane or losing its grid position.
Each pane exposes a Delete control that asks for confirmation first; cancelling keeps the pane, confirming removes it from the page.
Add Page creates a new named page tab and makes it active; each page holds its own independent set of panes. A page can be renamed inline and deleted after a confirmation. Page field contract: name is a required string of 1 to 40 characters after trim; empty or over-length names show an inline error naming name and create or rename nothing.
Each pane exposes labeled Move Up, Move Down, Move Left, and Move Right controls that reposition it within a four-column grid; a direction's control is disabled when the pane is already at that grid boundary.
Each pane exposes a Small / Medium / Large size toggle that immediately changes the pane's grid column span (small one column, medium two, large the full four) and writes the matching size enum on the pane record.
Each pane exposes a Refresh dropdown with Off, Every 30s, and Every 5m. When set to a non-Off value the pane shows a Last updated Xs ago label that counts up on its own, and on each simulated refresh tick recomputes its displayed value with a small deterministic jitter (documented in-app as a simulated refresh, not a live network fetch); returning it to Off stops the label and the value changes. The control writes refreshInterval as off, 30s, or 5m on the pane record.
The simulated jitter is deterministic, derived from the pane's tick count as round(value * (1 + ((tick*7+13) mod 11 - 5)/100)), so repeated refreshes stay consistent rather than random.
A Share control opens a panel showing a read-only mock link of the form panecraft.local/view/<page-id> rendered in a monospace bordered box, a Public/Private access toggle, and a Copy Link control that copies the link to the clipboard and shows a transient Copied! confirmation that clears on its own.
A shared date-range control offers Today Only, Last 7 Days, Last 30 Days, and Last 90 Days and filters every time-series chart/table pane on the current page simultaneously; changing it recomputes all affected panes at once, not one in isolation. The stored and exported dateRange value is exactly one of today / last-7-days / last-30-days / last-90-days matching those four labels.
Hovering a data point or bar in a chart pane shows a tooltip with that point's label and value, and the tooltip follows to the newly hovered point rather than sticking to the first one.
A Saved analysis collection workspace supports creating, editing, and deleting named saved analyses, with two views (Overview cards and Table) and combined Search, Source filter, Sort, and single-selection drill-down controls plus a Clear controls action that restores the unfiltered list. SavedAnalysis field contract (API-shaped create/update payload; all keys required): name is a required string of 1 to 60 characters after trim and must be unique among saved analyses; source is the same closed source enum as PaneConfig; metric is a required non-empty string naming a column on that source. A valid submit creates a record whose visible fields match that payload; a duplicate name is rejected with inline feedback naming name.
A visible Collaboration Scenario control opens a modal with a Go Offline / Go Online toggle, a Shared editor labeled textarea for Author A, an independent editor for Author B, and a Shared content region where queued offline changes merge on reconnect.
Export center (useful end state): an Export control opens a center or drawer with live previews of two formats compiled from the current store — Workspace JSON and Markdown report — with format tabs or section labels, plus Copy and Download on the active format. Copy places the exact visible preview text on the clipboard and shows a transient Copied! confirmation; Download starts a real file download of that same text.
Workspace JSON is a single WorkspaceDocument object API-shaped like a dashboard workspace upsert payload. Normative shape (all keys and nesting required; example values illustrative only; field names must be visible in the preview text): schemaVersion exactly panecraft-workspace-v1; activePageId (non-empty string); dateRange exactly one of today, last-7-days, last-30-days, last-90-days; pages (array of Page objects each with id, name, and panes); savedAnalyses (array of SavedAnalysis objects each with name, source, and metric). Each pane entry in pages[].panes is a PaneConfig plus id (stable non-empty string) and carries source, type, metric, dimension (null for table/counter), size, and refreshInterval from their closed enums. Array order of panes is the grid order. The preview derives live from session state: after creating or renaming a page, adding or editing a pane, changing the shared date range, or creating a saved analysis, reopening Export shows those values under the field-contract keys; an export that omits a session mutation is incorrect.
Markdown report is a human-readable document compiled from the same store: it names each page, lists each pane's type/source/metric (and dimension when present), states the active dateRange label, and lists each saved analysis by name — enough that a reader can reconstruct what the workspace contains without opening the JSON.
Import workspace: an Import control accepts pasted or file-picked Workspace JSON matching the WorkspaceDocument field contract. A valid import replaces pages, panes, active page, date range, and saved analyses so the UI and the next Export previews match the imported document without a reload. Malformed JSON, or JSON that fails the field contract (schemaVersion not panecraft-workspace-v1, missing required keys, dateRange or pane enums outside their closed sets, chart pane missing dimension, table/counter with non-null dimension, metric/dimension not on the source, duplicate saved-analysis names), shows a visible inline error naming the offending field, leaves pages, panes, date range, and saved analyses unchanged, and rejects the whole document rather than applying a partial subset of entities.
</core_features>

<user_flows>
Starting from the visible pane count on the active page, completing the Create Pane wizard with a valid PaneConfig adds exactly one pane rendering the chosen source's data: the pane count increases by exactly one immediately, the pane's visible fields match the submitted PaneConfig, switching to another page tab and back still shows the new pane, and a full page reload restores it with the same type, source, metric, dimension, size, and grid position.
After creating a new page, renaming it, adding a pane to it, moving that pane, resizing it to Large, and setting its refresh to Every 30s, switching between page tabs shows each page's own independent panes, and a full reload restores the page list, the active tab, and every pane facet (type, source, metric, dimension, size, order, refresh interval) together rather than a partial mix.
With at least two time-series panes on the current page, switching the shared date range from Last 30 Days to Today Only recomputes every affected pane at once with visibly different marks or values, and switching back to Last 30 Days restores the wider rendering without recreating any pane.
Creating a valid named saved analysis increases the saved-analysis count by exactly one and the same item appears in both the Overview cards view and the Table view without a reload; editing it updates both views, deleting it removes it from both and decreases the count by one, and a full reload restores the remaining saved analyses exactly.
In the Collaboration Scenario, going offline, queueing one non-conflicting change from Author A and one from Author B, then reconnecting merges both into the converged Shared content; applying the two queued changes in either offered order (Apply A then B, Apply B then A) converges to the same visible result with neither change dropped, and replaying an already-applied operation is ignored as a duplicate rather than applied twice.
Deleting a pane after confirmation decreases the active page's pane count by exactly one, the pane no longer appears after switching tabs and back, and a full reload does not resurrect it.
Mutation-to-export: after creating or renaming a page, adding or editing a pane with a distinctive metric, changing the shared date range, and creating a saved analysis, open Export — Workspace JSON shows schemaVersion panecraft-workspace-v1 and those session values under the field-contract keys, and the Markdown report names the same page, metric, and saved analysis; Copy on the active format shows a Copied! confirmation.
Export then import round-trip: after a workspace mutation, Download or Copy the Workspace JSON, change the workspace further if desired, then Import that same document — pages, panes, date range, and saved analyses reconstruct to match the export, and both Export previews match the restored state without a reload.
</user_flows>

<edge_cases>
A page with zero panes shows the empty-state message Create your first pane to build this page.
A pane whose metric/dimension/date-range combination yields no matching rows shows No data for this range centered inside the pane instead of a blank chart, and widening the range back to one with real rows restores the chart without recreating the pane.
Deleting the last remaining page is not allowed: the app blocks the action with the delete control disabled or a visible explanation, and the page survives.
A saved analysis with a duplicate name is rejected with inline feedback naming the problem, creates no duplicate record, and leaves the bundled source data unchanged.
Double-activating a create or submit control creates exactly one record: the relevant count increases by one and exactly one new item appears.
Invalid or extreme input in any form is rejected with specific visible feedback and the last valid state stays intact and rendered.
Submitting Create Pane or Edit with a PaneConfig that breaks the field contract (out-of-enum type, size, refreshInterval, or source; metric or required dimension not on the source; missing dimension on a chart type; non-null dimension on table or counter) leaves the pane count unchanged and shows an inline error naming the offending field.
Importing malformed Workspace JSON, or JSON that fails the WorkspaceDocument field contract, leaves pages, panes, date range, and saved analyses unchanged and shows a visible error naming the offending field — it must reject the whole document rather than applying a partial subset of pages, panes, or saved analyses.
When persistent storage is unavailable, the root still renders the bundled sources and a usable seeded workspace, mutations keep working for the session, and a specific visible warning explains that changes will not persist, with no crash or blank screen.
</edge_cases>

<visual_design>
Color tokens are defined as CSS custom properties on :root: --color-primary #E8536B (primary actions), --color-secondary #051441 (dark navy header/nav), --color-accent #1ABF68 (success and Resolved badges), --color-background #FFFFFF, --color-surface #F7F8FC (pane card background), --color-border #E3E6F0, --color-text-primary #051441, --color-text-secondary #677294. Radius base is 6px; spacing unit 4px.
Typography uses the Poppins family with system fallbacks. The app title is 26 to 32px at weight 600 in text-primary; pane titles are 15px at weight 600; body and table text are 14px at weight 400 in text-secondary; a counter pane's big number is 30px at weight 700 in text-primary; the Last updated label is 12px in text-secondary.
Primary actions (Add Page, Create Pane, Copy Link, Export, Import) use a primary background with white text and 6px corners. Secondary and utility controls (Edit, Share, Refresh dropdown) use a white background, a 1px border in border color, and text-primary text.
Each pane renders on a surface card with 6px corners and a 1px border; its control row (Edit/Move/Resize/Delete) becomes visible on hover or focus.
Support Tickets status values render as colored pill badges that are distinguishable at a glance: Resolved uses the accent green, Open uses the primary pink, In Progress uses a neutral amber.
The active page tab is visually distinguished from inactive tabs by a bottom border in the primary color and bold text.
The Share panel's mock link renders in a monospace font inside a bordered box distinct from the rest of the panel so it reads as a copyable value.
The Export center shows monospaced Workspace JSON and Markdown report preview blocks with clear format tabs or section labels and visible Copy and Download controls distinct from the rest of the workspace chrome; the Import surface uses the same visual language for its paste or file area.
A page with zero panes shows Create your first pane to build this page; a pane with no rows for the current range shows No data for this range centered inside it.
</visual_design>

<motion>
Every interactive control (buttons, page tabs, table rows, dropdowns, Data Source Library cards, pane cards) shows a visible hover response.
A pane's control row is hidden at rest on wider viewports and fades in on hover or keyboard focus of the pane.
A newly created pane animates into the grid rather than appearing instantly, and a deleted pane animates out rather than vanishing in a single frame; the surrounding panes settle into their new positions smoothly.
The preview modal, pane wizard, Share panel, Export center, and confirmation dialogs enter and exit with a brief opacity and scale transition of roughly 200 to 300 milliseconds.
The active page tab transition and the primary-action opacity shift on hover give immediate feedback.
Clicking Copy Link or Export Copy shows a transient Copied! confirmation (the button briefly turns accent green) that clears on its own after about two seconds without trapping the user in the panel.
When a pane's refresh interval is non-Off, the Last updated Xs ago label advances on its own and the recomputed value updates in place without a layout jump or a manual reload.
Changing a pane's source, metric, dimension, or the shared date range transitions the chart's marks to the new data rather than snapping through a blank or stale frame.
Status pill badges and the size-toggle selected state give an at-a-glance visual change when their state changes.
With prefers-reduced-motion enabled, pane, dialog, tab, feedback, and chart transitions are removed or substantially reduced while every final state remains clear and reachable.
</motion>

<responsiveness>
At roughly 375px wide the pane grid collapses to a single column, the page tabs stay scrollable and usable, and nothing scrolls horizontally at the page level.
At 375px wide the preview modal, pane wizard, Share panel, Export center, and saved-analysis views remain readable and operable without clipped controls.
At desktop widths of 1024px and above, the four-column grid, the Data Source Library, and the header controls are all visible without overlap.
</responsiveness>

<accessibility>
Every interactive control, including each pane's Edit, Move, Resize, Delete, Refresh, and Share controls plus Export and Import, is reachable and operable with the keyboard alone; keyboard Tab focus is visible as a 2px outline in the primary color on every interactive control.
Keyboard focus on a pane reveals its control row without requiring a pointer hover.
The source preview modal, pane wizard, Share panel, Export center, and confirmation dialogs trap focus while open, close on Escape, and return focus to the control that opened them.
The transient Copied! confirmation and inline validation errors are announced through an aria-live polite region as well as shown visually.
</accessibility>

<performance>
The app is interactive within 2 seconds of a local cold load.
No console errors or warnings appear during a full exercise of the app, including opening Export and Import.
Simulated refresh ticks and date-range recomputes update pane content in place without shifting surrounding panes or the page layout.
The UI stays responsive under rapid repeated input with no hangs or dropped interactions.
</performance>

<writing>
Headings, buttons, and tab labels use one consistent capitalization convention throughout the app.
Action labels are specific verbs such as Add Page, Create Pane, Copy Link, Export, and Import rather than generic labels like OK or Go where a specific one is possible.
Error messages for PaneConfig, Page, SavedAnalysis, and WorkspaceDocument field-contract failures name the offending field and the fix; empty states use the exact specified messages and make the next action clear.
No placeholder text, lorem ipsum, or debugging copy appears anywhere in the shipped UI.
</writing>

<innovation>
Optional enhancements the builder may add, none required for a passing build: a brief coachmark that points at Export after the first pane edit; a printable one-page workspace summary layout reachable from the Export center; crosshair sync across chart panes on hover.
</innovation>

<requirements>
Framework and state: Svelte 5 components in runes mode; shared application state lives in a single runes-based store module using $state and $derived (pages, active page, panes, date range, dialog visibility, export preview text, import draft, and the collaboration offline flag), imported by every component so all views stay coherent. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme and its Vite plugin. Use shadcn-svelte components for dialogs, the pane wizard, tabs, toggles, selects, tables, confirmations, Export center, Import, and transient feedback; no other external component library. Use LayerChart for line, bar, donut, and other chart panes, with d3 available for scales and helpers, and yjs for collaboration merge helpers; no other charting or collaboration libraries may be added. svelte-motion is allowed for pane, control-row, tab, feedback, and state-change transitions; no other animation libraries. Phosphor icons via phosphor-svelte only; no raw pasted SVG icon sets and no icon CDNs. All forms — pane create/edit, page naming, saved analyses, collaboration conflict resolution, and Workspace JSON import — validate through a Zod schema driven by Felte or TanStack Form for Svelte and render inline per-field errors before submit. Those schemas model the PaneConfig, Page, SavedAnalysis, and WorkspaceDocument field contracts above: the record a successful create or edit produces IS that request-body payload, and Workspace JSON export plus a successful import conform to the same field names, enums, bounds, and cross-field rules. All libraries are installed via npm and bundled locally; no CDN imports.
Persistence: user-configured state persists to localStorage under the key panecraft-state — the list of pages, and for each page its panes with their type, source, metric, dimension, size, order, and refresh-interval, plus the active page id and dateRange. Saved analyses persist under panecraft-saved-analyses and the collaboration shared content under panecraft-collaboration. A full page reload restores the exact configuration. The three bundled mock data sources are always present from the app's source and are never persisted; localStorage access is guarded so the build does not crash when storage is unavailable. The portable end-state artifact is the Workspace JSON (and Markdown report) export; MCP artifact tools expose the same export/import surfaces.
Create/edit/delete: creating a pane appends a PaneConfig-shaped record to the active page; editing updates it in place preserving grid position; deleting removes it after a confirmation. Pages can be created, renamed, and deleted (with confirmation, never the last one). Panes reorder through Move controls within a four-column grid with boundary controls disabled, and resize through the Small/Medium/Large toggle.
Filtering and views: the shared date-range control filters every time-series pane on the current page at once; the data-source preview has its own independent row filter; the saved-analysis workspace offers two views and combined search/filter/sort/selection with a clear action.
Export and import: Workspace JSON must be compiled live from the current store and must include schemaVersion panecraft-workspace-v1 plus every session mutation under the field-contract keys; Import of a valid document reconstructs the same visible workspace; schema-invalid imports must reject without mutating state.
Seed and empty rules: Website Analytics seeds 90 daily rows, Sales Sheet 60 order rows across all three categories, Support Tickets 50 rows across all categories and statuses; every source has enough volume that any offered metric/dimension/date-range combination renders non-empty for at least the default range. Empty states show the specified messages instead of blank areas.
Robustness: the primary pane and saved-analysis workflows withstand 25 rapid deterministic repetitions through the normal controls with an exact final count, responsive controls, and no blank screen or uncaught error; invalid or extreme input is rejected with specific visible feedback without damaging the last valid state; duplicate submissions are idempotent rather than creating duplicate records. The Collaboration Scenario merges queued changes by stable operation identity so both delivery orders converge to the same visible result with no dropped non-conflicting change, ignores duplicate replays of an operation, and surfaces conflicts with an explicit user choice (Keep Author A, Keep Author B, Merge Both) instead of silently overwriting.
Navigation: single user, single route at the root; any other route may redirect home; the app performs no outbound network navigation and makes no backend or external API calls.
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
- Entity: pane
- Entity operations: create; select; update; delete; reorder
- Entity fields: source; type; metric; dimension; size; refresh-interval
- Value bounds: {"size":["small","medium","large"],"refresh-interval":["off","30s","5m"],"type":["line","bar","donut","table","counter"],"source":["website-analytics","sales-sheet","support-tickets"]}
- Form fields: data-source; pane-type; metric-column; dimension-column
- Form operations: validate; submit; cancel; advance; return
- Workflow steps: choose-source; choose-type; configure
- Session operations: start; pause; stop; connect; disconnect; advance
- Demos: refresh-tick; collaboration-scenario; go-offline; go-online
- Artifact operations: export; import; copy
- Export formats: workspace-json; markdown-report
- Import modes: workspace

Mechanics exclusions:
- Date-range recompute and chart hover stay Playwright-observed
- Refresh-tick timing stays Playwright-observed
- Merge convergence visuals stay Playwright-observed
- Page-tab reorder/scroll stays Playwright-driven
- File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities.
- Command-palette open gesture and keyboard navigation stay Playwright-observed when mechanism matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
