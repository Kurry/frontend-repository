<summary>
Build a personal finance reports page using Preact, Signals, and Tailwind CSS.
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
- The app opens straight onto the Ledger reports workspace — persistent left sidebar, four summary cards, chart card, and a transactions table — with no login, signup, or bank-linking gate
- The sidebar shows a branded Ledger lockup, named nav items (Dashboard, Accounts, Transactions, Cash Flow, Reports, Budget) with Reports rendered active, and a profile reading Alex Rivera; clicking any non-active nav item shows a demo toast and keeps the current view (never navigates away)
- Four summary cards (Total Income, Total Expenses, Total Net Income, Savings Rate) read from the transactions collection; creating, editing, or deleting a transaction recomputes every card, and Savings Rate is net income divided by income
- Primary collection is transactions: seed at least 8 rows so the table and charts are non-empty on first load; each row carries date, payee, category, account, a signed amount, and optional status, and the list supports create, edit, and delete
- The chart card carries a "By category & group" subtitle and a Breakdown / Trends pill toggle: clicking a pill swaps the panel in place with no page reload and gives the active pill stronger weight
- Breakdown renders the inspiration's flow graph as a sankey: named income-source nodes (e.g. Paychecks, Business Income, Interest, Other Income) feed a central Income hub that splits into a Net Income node plus one node per expense category (emoji-prefixed labels such as Groceries, Restaurants & Bars, Gas), with curved links whose thickness is proportional to amount and node labels showing category name and amount; all flows aggregate live from the transactions collection
- Trends renders a category pie/doughnut with a legend, aggregating live from the same collection
- A summary strip below the table reports total transaction count, largest transaction, average amount, and covered date range, each recomputed from the current transactions
- Two interaction modes: chart mode (Breakdown/Trends aggregates) and transactions-list mode (table with category filter and income-vs-expense filter)
- Domain behavior beyond CRUD: the category filter and the income-vs-expense filter recompute the visible list from the shared collection; bulk categorize and bulk delete apply to checkbox-selected rows; chart aggregates, summary cards, and summary strip all follow the same collection
- Submitting create with empty payee or missing amount shows visible validation feedback and adds no row; a valid submit adds exactly one row and updates KPIs, both charts, and the summary strip
- Editing a transaction updates that same record in the table, KPIs, charts, and summary strip; deleting removes it from the list, selection, KPIs, charts, and summary strip
- Deleting all transactions, or filtering to zero matches, shows an empty state in the list region and KPIs read zero/empty
- Demo chrome controls (Filters, Save, Sort, Columns, Export CSV, Bulk edit) show a brief toast that enters and clears, and never navigate or replace real create/edit/delete
- Zero outbound navigation — in-app controls only
</core_features>

<visual_design>
- Soft mint finance UI: light page/sidebar wash, brand teal, accent mint; Ledger mark in sidebar
- Persistent left sidebar + main column: page chrome actions, a row of four statistic cards, chart card, transactions table/list, and a summary strip beneath the table
- Breakdown sankey and Trends pie use multi-hue category fills; Reports workspace density — not a marketing landing
- Layout and surfaces styled with Tailwind utility classes
</visual_design>

<motion>
- Chart tabs — Breakdown / Trends pill toggle swaps panels in place; active pill gains stronger weight
- Mode awareness — switching emphasis between chart panel and transactions list does not reload the page
- Demo toast — status enters from below with a short ease, holds briefly, then exits
- Hover animations (required): sidebar/nav and action controls use pointer cursor and hover wash; transaction rows take a light mint wash; chart sectors keep pointer cursor; focus-visible rings on interactive controls
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): transactions collection, chart tab mode, filters/selection, toast timer, and derived totals. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid transaction increases the collection, updates KPIs, and participates in chart aggregates
- Editing a transaction updates that same record in the list and recomputed totals/charts
- Deleting a transaction removes it from the list, selection, KPIs, and charts
- Filters recompute the visible list from the shared collection; chart mode toggles shared tab state without inventing a second ledger
- The transactions summary strip (count, largest, average, date range) is derived from the shared collection, not a hardcoded caption
Stack: Preact + Signals + Tailwind CSS (Vite or equivalent SPA); frontend-only. Static Recharts SVG markup (or equivalent baked chart surfaces) is allowed for sankey/pie; no unrelated external UI kits.
- Seed at least 8 transactions so the list and charts are non-empty on first load
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
- Destinations: reports-overview; category-breakdown; transaction-list
- Filters: category; range
- Sorts: amount; date
- Entity: expense
- Entity operations: create; select; update; delete
- Entity fields: label; amount; category; date

Mechanics exclusions:
- Chart geometry / pie segment hover stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
