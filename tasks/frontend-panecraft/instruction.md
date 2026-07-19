<summary>
Build a PaneCraft dashboard builder using Svelte 5 in runes mode, shared runes state ($state/$derived), and Tailwind CSS.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
On load with empty storage the workspace opens directly at the root with no login: a dark navy header reading PaneCraft, a row of page tabs, a Data Source Library, and a default page named Dashboard already holding three panes (a Traffic trend line chart, a Revenue by category bar chart, and an Open support volume counter). Nothing starts empty.
The app ships three bundled mock data sources that are present immediately and never depend on storage: Website Analytics (90 daily rows with date, pageViews, sessions, bounceRatePct), Sales Sheet (60 order rows with orderId, product, category one of Hardware/Software/Services, unitsSold, revenue, orderDate), and Support Tickets (50 rows with ticketId, category one of Billing/Bug/Feature Request/Account, status one of Open/In Progress/Resolved, createdDate, and resolutionHours present only when status is Resolved).
Clicking a source in the Data Source Library opens a preview modal listing that source's raw rows in a table with the column headers; a Filter preview rows text input narrows the visible rows to those matching the typed text as the user types, and a counter shows how many of the total rows match.
Create Pane opens a three-step wizard: step 1 choose a data source; step 2 choose a pane type from exactly five options (Line Chart, Bar Chart, Donut Chart, Data Table, Counter); step 3 configure it by picking a metric column, and for chart panes also a grouping dimension column. Completing the wizard adds the finished pane to the current page rendering that source's data.
Each pane exposes an Edit control that reopens its configuration (source, type, metric, dimension, size, refresh interval) and applies changes in place without deleting the pane or losing its grid position.
Each pane exposes a Delete control that asks for confirmation first; cancelling keeps the pane, confirming removes it from the page.
Add Page creates a new named page tab and makes it active; each page holds its own independent set of panes. A page can be renamed inline and deleted after a confirmation, and deleting the last remaining page is not allowed.
Each pane exposes labeled Move Up, Move Down, Move Left, and Move Right controls that reposition it within a four-column grid; a direction's control is disabled when the pane is already at that grid boundary.
Each pane exposes a Small / Medium / Large size toggle that immediately changes how many grid columns the pane spans (small one column, medium two, large the full four).
Each pane exposes a Refresh dropdown with Off, Every 30s, and Every 5m. When set to a non-Off value the pane shows a Last updated Xs ago label that counts up on its own, and on each simulated refresh tick recomputes its displayed value with a small deterministic jitter (documented in-app as a simulated refresh, not a live network fetch); returning it to Off stops the label and the value changes.
The simulated jitter is deterministic, derived from the pane's tick count as round(value * (1 + ((tick*7+13) mod 11 - 5)/100)), so repeated refreshes stay consistent rather than random.
A Share control opens a panel showing a read-only mock link of the form panecraft.local/view/<page-id> rendered in a monospace bordered box, a Public/Private access toggle, and a Copy Link control that copies the link to the clipboard and shows a transient Copied! confirmation that clears on its own.
A shared date-range control offers Today Only, Last 7 Days, Last 30 Days, and Last 90 Days and filters every time-series chart/table pane on the current page simultaneously; changing it recomputes all affected panes at once, not one in isolation.
A page with zero panes shows the empty-state message Create your first pane to build this page. A pane whose metric/dimension/date-range combination yields no matching rows shows No data for this range centered inside the pane instead of a blank chart, and widening the range back to one with real rows restores the chart without recreating the pane.
A Saved analysis collection workspace supports creating, editing, and deleting named saved analyses (each a source plus metric), with two views (Overview cards and Table) and combined Search, Source filter, Sort, and single-selection drill-down controls plus a Clear controls action that restores the unfiltered list; duplicate names are rejected without creating a duplicate record and without altering the bundled source data.
A visible Collaboration Scenario control opens a modal with a Go Offline / Go Online toggle, a Shared editor labeled textarea for Author A, an independent editor for Author B, and a Shared content region. Queueing two independently authored non-conflicting changes while offline and then reconnecting merges both by stable operation identity so both appear in the converged Shared content; applying the two queued changes in either offered order (Apply A then B, Apply B then A) converges to the same visible result with neither change dropped; replaying an already-applied operation is ignored as a duplicate rather than applied twice; and a conflicting change surfaces an explicit resolution choice (Keep Author A, Keep Author B, Merge Both) instead of silently overwriting.
</core_features>

<visual_design>
Color tokens are defined as CSS custom properties on :root: --color-primary #E8536B (primary actions), --color-secondary #051441 (dark navy header/nav), --color-accent #1ABF68 (success and Resolved badges), --color-background #FFFFFF, --color-surface #F7F8FC (pane card background), --color-border #E3E6F0, --color-text-primary #051441, --color-text-secondary #677294. Radius base is 6px; spacing unit 4px.
Typography uses the Poppins family with system fallbacks. The app title is 26 to 32px at weight 600 in text-primary; pane titles are 15px at weight 600; body and table text are 14px at weight 400 in text-secondary; a counter pane's big number is 30px at weight 700 in text-primary; the Last updated label is 12px in text-secondary.
Primary actions (Add Page, Create Pane, Copy Link) use a primary background with white text and 6px corners. Secondary and utility controls (Edit, Share, Refresh dropdown) use a white background, a 1px border in border color, and text-primary text.
Each pane renders on a surface card with 6px corners and a 1px border; its control row (Edit/Move/Resize/Delete) is reachable by keyboard and becomes visible on hover or focus.
Support Tickets status values render as colored pill badges that are distinguishable at a glance: Resolved uses the accent green, Open uses the primary pink, In Progress uses a neutral amber.
The active page tab is visually distinguished from inactive tabs by a bottom border in the primary color and bold text.
The Share panel's mock link renders in a monospace font inside a bordered box distinct from the rest of the panel so it reads as a copyable value.
A page with zero panes shows Create your first pane to build this page; a pane with no rows for the current range shows No data for this range centered inside it.
At roughly 375px wide the pane grid collapses to a single column, the page tabs stay scrollable and usable, and nothing scrolls horizontally at the page level.
</visual_design>

<motion>
Every interactive control (buttons, page tabs, table rows, dropdowns, Data Source Library cards, pane cards) shows a visible hover response. Keyboard Tab focus is visible as a 2px outline in the primary color on every interactive control.
A pane's control row is hidden at rest on wider viewports and fades in on hover or keyboard focus of the pane.
The active page tab transition and the primary-action opacity shift on hover give immediate feedback.
Clicking Copy Link shows a transient Copied! confirmation (the button briefly turns accent green) that clears on its own after about two seconds without trapping the user in the panel.
When a pane's refresh interval is non-Off, the Last updated Xs ago label advances on its own and the recomputed value updates in place without a layout jump or a manual reload.
Status pill badges and the size-toggle selected state give an at-a-glance visual change when their state changes.
</motion>

<requirements>
Framework and state: Svelte 5 components in runes mode; shared application state lives in a single runes-based store module using $state and $derived (pages, active page, panes, date range, dialog visibility, and the collaboration offline flag), imported by every component so all views stay coherent. Style with Tailwind CSS and its Vite plugin. Charts are hand-rolled inline SVG with no charting library. d3 is available for scales and helpers and yjs for collaboration merge helpers; no other component or charting libraries may be added.
Persistence: user-configured state persists to localStorage under the key panecraft-state — the list of pages, and for each page its panes with their type, source, metric, dimension, size, order, and refresh-interval, plus the active page id. Saved analyses persist under panecraft-saved-analyses and the collaboration shared content under panecraft-collaboration. A full page reload restores the exact configuration. The three bundled mock data sources are always present from the app's source and are never persisted; localStorage access is guarded so the build does not crash when storage is unavailable.
Create/edit/delete: creating a pane appends it to the active page; editing updates it in place preserving grid position; deleting removes it after a confirmation. Pages can be created, renamed, and deleted (with confirmation, never the last one). Panes reorder through Move controls within a four-column grid with boundary controls disabled, and resize through the Small/Medium/Large toggle.
Filtering and views: the shared date-range control filters every time-series pane on the current page at once; the data-source preview has its own independent row filter; the saved-analysis workspace offers two views and combined search/filter/sort/selection with a clear action.
Seed and empty rules: Website Analytics seeds 90 daily rows, Sales Sheet 60 order rows across all three categories, Support Tickets 50 rows across all categories and statuses; every source has enough volume that any offered metric/dimension/date-range combination renders non-empty for at least the default range. Empty states show the specified messages instead of blank areas.
Robustness: the primary pane and saved-analysis workflows withstand 25 rapid deterministic repetitions through the normal controls with an exact final count, responsive controls, and no blank screen or uncaught error; invalid or extreme input is rejected with specific visible feedback without damaging the last valid state; duplicate submissions are idempotent rather than creating duplicate records. The Collaboration Scenario merges queued changes by stable operation identity so both delivery orders converge to the same visible result with no dropped non-conflicting change, ignores duplicate replays of an operation, and surfaces conflicts with an explicit user choice.
Navigation: single user, single route at the root; any other route may redirect home; the app performs no outbound network navigation and makes no backend or external API calls.
Responsive: at roughly 375px the grid is a single column, tabs stay usable, and nothing scrolls horizontally.
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
- entity-collection-v1
- form-workflow-v1
- command-session-v1

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

Bindings:
- Entity: pane
- Entity operations: create; select; update; delete; reorder
- Entity fields: source; type; metric; dimension; size; refresh-interval
- Value bounds: {"size":["small","medium","large"],"refresh-interval":["off","30s","5m"],"type":["line","bar","donut","table","counter"]}
- Form fields: data-source; pane-type; metric-column; dimension-column
- Form operations: validate; submit; cancel; advance; return
- Workflow steps: choose-source; choose-type; configure
- Session operations: start; pause; stop; connect; disconnect; advance
- Demos: refresh-tick; collaboration-scenario; go-offline; go-online

Mechanics exclusions:
- Date-range recompute and chart hover stay Playwright-observed
- Refresh-tick timing stays Playwright-observed
- Merge convergence visuals stay Playwright-observed
- Page-tab reorder/scroll stays Playwright-driven

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
