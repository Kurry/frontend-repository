<summary>
Build a personal finance expense breakdown reports page using Angular, NgRx, Tailwind CSS 4.3.2, and PrimeNG.
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
Core features:
- Direct reports entry — Ledger reports shell (sidebar, summary metrics, chart card, transactions); no login, signup, or bank-linking gate
- App sidebar — branded Ledger nav of roughly a dozen items (Dashboard, Accounts, Transactions, Cash Flow, Reports, Budget, Recurring, Goals, Investments, Forecasting, Advice) with Reports the active item; a "Shared demo report" eyebrow, "Demo mode"/"Sample data" chips, notification and settings icons, and an Alex Rivera profile; every other item is an inert demo control that does not navigate away
- Summary metrics — Total Income, Total Expenses, Total Net Income, and Savings Rate cards derived from the transactions collection; Net Income equals income minus expenses and Savings Rate shows net divided by income as a percentage
- Primary collection — transactions: seed at least 8 transactions; each has date, payee, category, account, amount (signed), and optional status; income amounts render with a leading + and a distinct positive (green) color while expenses render neutral; the list supports create, edit, and delete
- At least two interaction modes: Breakdown/Trends chart mode (toggle between sankey/breakdown and pie/trends) and Transactions list mode (table with filters)
- Breakdown view — a sankey-style flow where income-source nodes feed an Income hub that splits into a Net Income node plus expense-category nodes, with node labels showing amounts and a flow legend listing each expense category with its amount and share percentage
- Trends view — a doughnut/pie chart of expense categories with a matching legend, where each category's amount and percentage of total expenses is shown and hovering a slice reveals a tooltip with that amount and percentage
- Transaction summary — below the table, a strip of tiles derived from the collection: total transaction count, largest transaction, average transaction, total income, and first/last transaction dates
- Create and edit forms — the transaction form presents date, payee, category, account, and amount fields; the submit control stays disabled until every required field is valid, and each invalid field shows an inline message naming that field before submit
- Domain behavior beyond CRUD: category filter; income vs expense filter; chart aggregates (sankey flows, pie slices, legends, summary tiles) recompute from the shared collection; bulk categorize or bulk delete selected rows
- Chart output tracks its inputs — any change to the transactions collection or active filters redraws the sankey node labels, pie slices, legends, and summary tiles to the new totals without a page reload
- Demo toasts confirm inert chrome actions (Filters, Date, Save, Sort, Columns, Export CSV) and chart-tab switches, but must not replace real create/edit/delete
- Zero outbound navigation — in-app controls only
</core_features>

<user_flows>
- After creating a valid transaction, the transactions table gains exactly one row, the four summary metric cards recompute to include its amount, the transaction summary strip updates its count and averages, and switching to the Breakdown or Trends chart shows that transaction's category reflected in the node labels, slices, and legend amounts without a reload
- Editing a transaction's amount updates that same row in the table, changes the summary metric cards by the difference, and updates the matching category's amount and percentage in both the pie legend and the sankey flow legend without a reload
- Deleting a transaction removes its row from the table and from any selection, decreases the summary strip count by exactly one, and drops its amount from the summary metric cards and every chart legend
- Applying the category filter narrows the visible table rows to that category and clearing the filter restores the full list exactly; the income vs expense filter narrows and restores the same way
- A page reload returns the app to its seeded state: the seeded transactions, default chart tab, and cleared filters
</user_flows>

<edge_cases>
- Invalid create: submitting with an empty payee or missing amount adds no row; the transactions count is unchanged and inline validation messages name the offending fields
- Double-activating the create form's submit control creates exactly one transaction: the row count increases by one and one new row appears
- After deleting all transactions, the list region shows an empty state message and the summary metric cards and summary strip reflect zero/empty
- When active filters match no transactions, the list region shows an empty state instead of a blank table, and clearing the filters restores the full list
</edge_cases>

<visual_design>
- Soft mint finance UI: light page/sidebar wash, brand teal (#0F3D3E), accent mint (#7BC4B8); Ledger mark in sidebar
- Persistent left sidebar + main column: page chrome actions (Filters / Date / Save), four statistic cards, chart card, transactions table/list, and a transaction summary tile strip
- Breakdown sankey renders income-source, Income hub, Net Income, and expense-category nodes as colored bars with curved proportional links and node labels showing amounts; Trends renders a multi-hue doughnut with a category legend
- Legends and pie tooltips display each category's currency amount and its percentage of total; income amounts read as positive (green / leading +), expenses neutral
- Breakdown sankey and Trends pie use multi-hue category fills; Reports workspace density — not a marketing landing
- One icon set is used consistently across the sidebar, chrome actions, and table controls; no mixed icon styles
</visual_design>

<motion>
- Chart tabs — Breakdown / Trends pill toggle swaps panels in place; active pill gains stronger weight
- Mode awareness — switching emphasis between chart panel and transactions list does not reload the page
- List microinteractions — a newly created transaction row animates into the table, a deleted row animates out, and bulk deleting selected rows animates each removed row rather than snapping the list
- Demo toast — status enters from below with a short ease, holds briefly (roughly 1.5s), then exits; switching chart tabs and clicking inert chrome also fire a toast
- Trends pie — hovering a slice reveals a tooltip showing that category's amount and percentage; hovered slice may lift/offset slightly
- Hover animations (required): sidebar/nav and action controls use pointer cursor and hover wash; transaction rows take a light mint wash; chart sectors keep pointer cursor; focus-visible rings on interactive controls
</motion>

<responsiveness>
- Desktop layout: at widths of 1024 pixels and above, the left sidebar stays persistently visible beside the main reports column
- At narrower widths the main column content (metric cards, chart card, table, summary strip) stacks vertically with no horizontal scrolling and no clipped content
</responsiveness>

<accessibility>
- Every interactive control (sidebar items, chrome actions, chart tabs, table controls, form fields) is reachable and operable with the keyboard alone, with a visible focus indicator
- The transaction create/edit form uses dialog semantics when presented as a modal: focus moves into it on open, stays trapped while open, and returns to the invoking control on close
- Validation messages are announced via a polite live region as well as shown visually
- Chart content is readable without hover: the legends list every expense category with its currency amount and percentage as text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app (create, edit, delete, filters, chart tab switches, bulk actions)
- Chart redraws and tab switches apply in place without a full page reload and without visible jank
- The UI stays responsive under rapid repeated input with no hangs or dropped interactions
</performance>

<writing>
- Headings, buttons, and nav labels use one consistent capitalization convention throughout the app
- Currency values are formatted consistently (same symbol and decimal treatment) across the metric cards, table, legends, tooltips, and summary strip
- Toasts name the action they confirm; empty states explain what belongs in the region and how to add it; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): transactions collection, chart tab mode, filters/selection, toast timer, and derived totals. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid transaction increases the collection, updates KPIs, and participates in chart aggregates
- Editing a transaction updates that same record in the list and recomputed totals/charts
- Deleting a transaction removes it from the list, selection, KPIs, and charts
- Filters recompute the visible list from the shared collection; chart mode toggles shared tab state without inventing a second ledger
Stack: Angular single-page app with NgRx for all shared state; frontend-only. Tailwind CSS 4.3.2 (pinned) is the styling base and owns layout, spacing, and custom surfaces, with design tokens declared in the Tailwind theme. PrimeNG is the component library, used for the transactions table, dialogs, selects, and toasts; it keeps its own component styles. ngx-echarts is the only allowed chart dependency and renders the sankey and doughnut charts. AutoAnimate and Angular animations are allowed for animation; no other animation libraries. PrimeIcons only for icons. All forms (transaction create and edit) are built with Angular Reactive Forms and validate through a Zod schema; the schema defines the rules and the form surfaces inline per-field errors before submit, with submit disabled until valid. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least 8 transactions so the list and charts are non-empty on first load; span enough expense categories (roughly 8-10) that the breakdown legend, pie slices, and sankey nodes are visibly multi-category
- Breakdown must show the income-source → Income hub → Net Income / expense-category flow with a per-category legend (amount + percentage); Trends must show a doughnut with a legend and hover tooltips (amount + percentage of total expenses)
- The transaction summary strip (total count, largest, average, total income, first/last transaction dates) must reflect the current collection
- Empty required fields on create must not increase the transactions count; show visible validation feedback
- After deleting all transactions (or filtering to zero matches), show an empty state in the list region; KPIs reflect zero/empty
- Document title MUST be Ledger | Reports
- Zero navigational outbound links; synthetic demo data only
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

Bindings:
- Browsable entity: expenses
- Destinations: breakdown-overview; expense-list; category-filter
- Filters: category
- Sorts: amount; date
- Entity: expense
- Entity operations: create; select; update; delete
- Entity fields: label; amount; category

Mechanics exclusions:
- Chart hover stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
