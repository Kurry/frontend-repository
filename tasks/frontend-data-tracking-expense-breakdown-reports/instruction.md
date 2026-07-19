<summary>
Build a personal finance expense breakdown reports page using React, Zustand, and Styled Components.
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
Core features:
- Direct reports entry — Ledger reports shell (sidebar, summary metrics, chart card, transactions); no login, signup, or bank-linking gate
- App sidebar — branded Ledger nav of roughly a dozen items (Dashboard, Accounts, Transactions, Cash Flow, Reports, Budget, Recurring, Goals, Investments, Forecasting, Advice) with Reports the active item; a "Shared demo report" eyebrow, "Demo mode"/"Sample data" chips, notification and settings icons, and an Alex Rivera profile; every other item is an inert demo control that does not navigate away
- Summary metrics — Total Income, Total Expenses, Total Net Income, and Savings Rate cards derived from the transactions collection; Net Income equals income minus expenses and Savings Rate shows net divided by income as a percentage
- Primary collection — transactions: seed at least 8 transactions; each has date, payee, category, account, amount (signed), and optional status; income amounts render with a leading + and a distinct positive (green) color while expenses render neutral; the list supports create, edit, and delete
- At least two interaction modes: Breakdown/Trends chart mode (toggle between sankey/breakdown and pie/trends) and Transactions list mode (table with filters)
- Breakdown view — a sankey-style flow where income-source nodes feed an Income hub that splits into a Net Income node plus expense-category nodes, with node labels showing amounts and a flow legend listing each expense category with its amount and share percentage
- Trends view — a doughnut/pie chart of expense categories with a matching legend, where each category's amount and percentage of total expenses is shown and hovering a slice reveals a tooltip with that amount and percentage
- Transaction summary — below the table, a strip of tiles derived from the collection: total transaction count, largest transaction, average transaction, total income, and first/last transaction dates
- Domain behavior beyond CRUD: category filter; income vs expense filter; chart aggregates (sankey flows, pie slices, legends, summary tiles) recompute from the shared collection; bulk categorize or bulk delete selected rows; empty list when filters match nothing or all transactions deleted
- Invalid create: empty payee or missing amount must not add a row; show visible validation feedback
- Demo toasts confirm inert chrome actions (Filters, Date, Save, Sort, Columns, Export CSV) and chart-tab switches, but must not replace real create/edit/delete
- Zero outbound navigation — in-app controls only
</core_features>

<visual_design>
- Soft mint finance UI: light page/sidebar wash, brand teal (#0F3D3E), accent mint (#7BC4B8); Ledger mark in sidebar
- Persistent left sidebar + main column: page chrome actions (Filters / Date / Save), four statistic cards, chart card, transactions table/list, and a transaction summary tile strip
- Breakdown sankey renders income-source, Income hub, Net Income, and expense-category nodes as colored bars with curved proportional links and node labels showing amounts; Trends renders a multi-hue doughnut with a category legend
- Legends and pie tooltips display each category's currency amount and its percentage of total; income amounts read as positive (green / leading +), expenses neutral
- Breakdown sankey and Trends pie use multi-hue category fills; Reports workspace density — not a marketing landing
- Surfaces and chrome styled with Styled Components (CSS-in-JS), not Tailwind utility classes as the primary system
</visual_design>

<motion>
- Chart tabs — Breakdown / Trends pill toggle swaps panels in place; active pill gains stronger weight
- Mode awareness — switching emphasis between chart panel and transactions list does not reload the page
- Demo toast — status enters from below with a short ease, holds briefly (roughly 1.5s), then exits; switching chart tabs and clicking inert chrome also fire a toast
- Trends pie — hovering a slice reveals a tooltip showing that category's amount and percentage; hovered slice may lift/offset slightly
- Hover animations (required): sidebar/nav and action controls use pointer cursor and hover wash; transaction rows take a light mint wash; chart sectors keep pointer cursor; focus-visible rings on interactive controls
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): transactions collection, chart tab mode, filters/selection, toast timer, and derived totals. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid transaction increases the collection, updates KPIs, and participates in chart aggregates
- Editing a transaction updates that same record in the list and recomputed totals/charts
- Deleting a transaction removes it from the list, selection, KPIs, and charts
- Filters recompute the visible list from the shared collection; chart mode toggles shared tab state without inventing a second ledger
Stack: React + Zustand + Styled Components (Vite or equivalent SPA); frontend-only. Chart.js is the only allowed chart dependency (vendored or npm). No Tailwind-first utility sheet as the primary styling system.
- Seed at least 8 transactions so the list and charts are non-empty on first load; span enough expense categories (roughly 8-10) that the breakdown legend, pie slices, and sankey nodes are visibly multi-category
- Breakdown must show the income-source → Income hub → Net Income / expense-category flow with a per-category legend (amount + percentage); Trends must show a doughnut with a legend and hover tooltips (amount + percentage of total expenses)
- The transaction summary strip (total count, largest, average, total income, first/last transaction dates) must reflect the current collection
- Empty required fields on create must not increase the transactions count; show visible validation feedback
- After deleting all transactions (or filtering to zero matches), show an empty state in the list region; KPIs reflect zero/empty
- Document title MUST be Ledger | Reports
- Zero navigational outbound links; synthetic demo data only
- Desktop layout: persistent left sidebar + main reports column
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
