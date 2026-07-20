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
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Reports workspace —
- Direct reports entry — Ledger reports shell (sidebar, summary metrics, chart card, transactions); no login, signup, or bank-linking gate
- App sidebar — branded Ledger nav of roughly a dozen items (Dashboard, Accounts, Transactions, Cash Flow, Reports, Budget, Recurring, Goals, Investments, Forecasting, Advice) with Reports the active item; a "Shared demo report" eyebrow, "Demo mode"/"Sample data" chips, notification and settings icons, and an Alex Rivera profile; every other item is an inert demo control that does not navigate away
- Summary metrics — Total Income, Total Expenses, Total Net Income, and Savings Rate cards derived from the transactions collection; Net Income equals income minus expenses and Savings Rate shows net divided by income as a percentage
Feature: Transactions collection and field contract —
- Primary collection — transactions: seed at least 8 transactions; each has date, payee, category, account, amount (signed), and optional status; income amounts render with a leading + and a distinct positive (green) color while expenses render neutral; the list supports create, edit, and delete
- Transaction record field contract (API-shaped payload; all keys required unless marked optional; example values illustrative only): date is an ISO calendar date YYYY-MM-DD; payee is a non-empty string of 1 to 80 characters; category is one of the closed set Groceries, Restaurants, Transport, Housing, Utilities, Entertainment, Healthcare, Shopping, Salary, Freelance; account is one of Checking, Savings, Credit Card, Cash; amount is a signed number that is not zero, absolute value at most 1000000, with at most 2 decimal places; status is optional and when present is one of cleared, pending, or reconciled. Cross-field rule: categories Salary and Freelance require a positive amount; every other category requires a negative amount. A valid create or edit produces a record matching this contract; the create and edit forms present date, payee, category, account, amount, and optional status
- Create and edit forms — the submit control stays disabled until every required field is valid against the field contract, and each invalid field shows an inline message naming that field before submit
Feature: Charts and filters —
- At least two interaction modes: Breakdown/Trends chart mode (toggle between sankey/breakdown and pie/trends) and Transactions list mode (table with filters)
- Breakdown view — a sankey-style flow where income-source nodes feed an Income hub that splits into a Net Income node plus expense-category nodes, with node labels showing amounts and a flow legend listing each expense category with its amount and share percentage
- Trends view — a doughnut/pie chart of expense categories with a matching legend, where each category's amount and percentage of total expenses is shown and hovering a slice reveals a tooltip with that amount and percentage
- Transaction summary — below the table, a strip of tiles derived from the collection: total transaction count, largest transaction, average transaction, total income, and first/last transaction dates
- Category filter and income vs expense filter narrow the visible table; a date-range filter with start and end date controls further narrows rows to dates inside the inclusive range; clearing any filter restores the wider list; chart aggregates, legends, and summary tiles recompute from the filtered collection without a page reload
- Instant payee search — a search field filters visible rows to payees whose text contains the query (case-insensitive); clearing the query restores the prior filter stack
- Chart output tracks its inputs — any change to the transactions collection or active filters redraws the sankey node labels, pie slices, legends, and summary tiles to the new totals without a page reload
- Domain behavior beyond CRUD: bulk categorize or bulk delete selected rows updates the table and every derived surface
Feature: Monthly burn rate —
- A Burn rate panel shows daily expense totals for the current calendar month as a bar series against an editable monthly expense ceiling; a projection line or label shows projected month-end spend from the month-to-date daily average
- When projected month-end spend exceeds the ceiling, the panel shows a visible over-burn treatment and names the projected overage amount; editing the ceiling or changing expense transactions recomputes the bars, projection, and over-burn state live
- A zero or negative ceiling is rejected with an inline validation message naming the ceiling field, and the previous ceiling remains in effect
Feature: Command palette —
- Pressing Cmd+K on macOS or Ctrl+K elsewhere opens a command palette overlay listing at least: New transaction, Switch to Breakdown, Switch to Trends, Export report, Import CSV, Focus payee search, and Clear filters
- Choosing a command closes the palette and performs that action through the same handlers as the visible controls; Escape closes the palette without changes; with the palette open, typing filters the command list by title
Feature: Breakdown report export and CSV import (useful end state) —
- An Export report control opens a drawer with JSON and Markdown tabs compiled LIVE from the session store. Both tabs MUST reflect every create, edit, delete, bulk categorize, and bulk delete mutation — an export that omits session work is a failure
- Normative JSON shape (all keys and nesting required; example values illustrative only): {"version":1,"reportTitle":"Expense Breakdown","generatedAt":"","filters":{"category":null,"type":null,"dateStart":null,"dateEnd":null,"payeeQuery":""},"totals":{"income":0,"expenses":0,"net":0,"savingsRate":0,"count":0},"burnRate":{"ceiling":0,"monthToDate":0,"projectedMonthEnd":0,"over":false},"categoryBreakdown":[{"category":"","amount":0,"share":0}],"transactions":[{"date":"","payee":"","category":"","account":"","amount":0,"status":""}]}. totals match the four summary cards and the summary strip count for the current filter scope; categoryBreakdown lists every expense category with amount and share of total expenses; transactions lists every row in the current filtered collection matching the field contract; burnRate mirrors the Burn rate panel; filters mirrors the active filter controls. After two different creates with distinct payees, a fresh export must contain both payees in transactions
- The Markdown tab shows a readable report with a title line Expense Breakdown Report, a Totals section naming income, expenses, net, savings rate, and count, a Category breakdown section with one line per expense category (name, amount, share percent), and a Burn rate section naming ceiling, month-to-date, projected month-end, and over status
- Download JSON offers a real file download named expense-breakdown-report.json whose body matches the JSON tab. Download Markdown offers expense-breakdown-report.md whose body matches the Markdown tab. Copy on the active tab puts that tab's text on the clipboard and shows a visible Copied confirmation that clears within about 3 seconds
- An Import CSV control opens a diagnostic panel: paste or choose a CSV with header date,payee,category,account,amount,status. Each data row is validated against the transaction field contract before commit. Rows that fail show in a mismatch list naming the row number and the offending field; only valid rows can be committed. Committing replaces or appends per an Import mode control (Replace all or Append) and updates the table, KPIs, charts, burn rate, and a subsequent export. Malformed header or empty paste shows a visible inline error and changes nothing
- Demo toasts confirm inert chrome actions (Filters, Date, Save, Sort, Columns) and chart-tab switches, but must not replace real create/edit/delete/export/import
- Zero outbound navigation — in-app controls only
</core_features>

<user_flows>
- After creating a valid transaction, the transactions table gains exactly one row, the four summary metric cards recompute to include its amount, the transaction summary strip updates its count and averages, and switching to the Breakdown or Trends chart shows that transaction's category reflected in the node labels, slices, and legend amounts without a reload
- Editing a transaction's amount updates that same row in the table, changes the summary metric cards by the difference, and updates the matching category's amount and percentage in both the pie legend and the sankey flow legend without a reload
- Deleting a transaction removes its row from the table and from any selection, decreases the summary strip count by exactly one, and drops its amount from the summary metric cards and every chart legend
- Applying the category filter narrows the visible table rows to that category and clearing the filter restores the full list exactly; the income vs expense filter and the date-range filter narrow and restore the same way; payee search narrows by substring and clears the same way
- Bulk flow: checking 3 rows and applying bulk categorize moves each checked row to the chosen category and shifts chart aggregates; bulk delete removes every checked row and the summary strip count drops by exactly that number
- Burn rate flow: lowering the monthly ceiling below the current projected month-end spend shows the over-burn treatment and names the overage; raising it above the projection clears the treatment
- Command palette flow: open with Cmd+K or Ctrl+K, choose Switch to Trends, and the Trends panel is active; choose Export report and the export drawer opens
- Export flow: after creating a transaction with payee Ada Books and a second with payee Evening Market, open Export report; the JSON tab transactions array contains both payees and totals.count equals the live strip count for the current filter scope; the Markdown tab names both payees or both categories as present in the breakdown lines; Download JSON and Download Markdown offer expense-breakdown-report.json and expense-breakdown-report.md; Copy shows Copied
- Import round-trip flow: export JSON after mutations to confirm the session state, delete all transactions so the empty state shows, then Import CSV built from those same transaction rows (header date,payee,category,account,amount,status) with Replace all — the table, cards, strip, charts, and burn rate reconstruct to match, and a fresh export's transactions array matches
- A page reload returns the app to its seeded state: the seeded transactions, default chart tab, cleared filters and search, seeded burn-rate ceiling, and closed drawers
</user_flows>

<edge_cases>
- Invalid create: submitting with an empty payee, missing amount, amount of zero, absolute amount above 1000000, a non-ISO date, a category outside the closed set, or a Salary row with a negative amount adds no row; the transactions count is unchanged and inline validation messages name the offending fields
- Double-activating the create form's submit control creates exactly one transaction: the row count increases by one and one new row appears
- After deleting all transactions, the list region shows an empty state message and the summary metric cards and summary strip reflect zero/empty
- When active filters or search match no transactions, the list region shows an empty state instead of a blank table, and clearing the filters restores the full list
- Bulk categorize and bulk delete with no rows checked perform no destructive change
- With an empty collection, Export report still produces JSON with version 1, totals all zero, an empty transactions array, categoryBreakdown empty or all-zero shares, and burnRate reflecting the ceiling with monthToDate 0; Markdown still shows the title and zero totals; Copy still shows Copied
- Import CSV with a bad header or a row that violates the field contract lists the mismatch and commits nothing when every row is invalid; mixed valid and invalid rows commit only the valid ones when the user confirms Commit valid rows
- A date range with end before start shows an inline validation message naming the range and does not apply
- A zero or negative burn-rate ceiling is rejected with an inline message naming the ceiling field
</edge_cases>

<visual_design>
- Soft mint finance UI: light page/sidebar wash, brand teal (#0F3D3E), accent mint (#7BC4B8); Ledger mark in sidebar
- Persistent left sidebar + main column: page chrome actions (Filters / Date / Save plus Export report, Import CSV, and Burn rate), four statistic cards, chart card, burn-rate panel, transactions table/list, and a transaction summary tile strip
- Breakdown sankey renders income-source, Income hub, Net Income, and expense-category nodes as colored bars with curved proportional links and node labels showing amounts; Trends renders a multi-hue doughnut with a category legend
- Legends and pie tooltips display each category's currency amount and its percentage of total; income amounts read as positive (green / leading +), expenses neutral
- Over-burn treatment uses a consistent error color family distinct from ordinary row hover; the command palette and export drawer are elevated overlays with clear scrim
- Breakdown sankey and Trends pie use multi-hue category fills; Reports workspace density — not a marketing landing
- One icon set is used consistently across the sidebar, chrome actions, and table controls; no mixed icon styles
</visual_design>

<motion>
- Chart tabs — Breakdown / Trends pill toggle swaps panels in place; active pill gains stronger weight
- Mode awareness — switching emphasis between chart panel and transactions list does not reload the page
- List microinteractions — a newly created transaction row animates into the table, a deleted row animates out, and bulk deleting selected rows animates each removed row rather than snapping the list
- Export drawer and command palette — enter with a short opacity and slide transition rather than snapping open, and exit the same way
- Demo toast — status enters from below with a short ease, holds briefly (roughly 1.5s), then exits; switching chart tabs and clicking inert chrome also fire a toast; Copied confirmation follows the same toast language
- Trends pie — hovering a slice reveals a tooltip showing that category's amount and percentage; hovered slice may lift/offset slightly
- Hover animations (required): sidebar/nav and action controls use pointer cursor and hover wash; transaction rows take a light mint wash; chart sectors keep pointer cursor; focus-visible rings on interactive controls
- With prefers-reduced-motion set, entry/exit animations are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- Desktop layout: at widths of 1024 pixels and above, the left sidebar stays persistently visible beside the main reports column
- At narrower widths the main column content (metric cards, chart card, burn-rate panel, table, summary strip) stacks vertically with no horizontal scrolling and no clipped content
- The export drawer, command palette, and import diagnostic panel stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control (sidebar items, chrome actions, chart tabs, table controls, form fields, Export report, Import CSV, Burn rate ceiling, command palette) is reachable and operable with the keyboard alone, with a visible focus indicator
- The transaction create/edit form uses dialog semantics when presented as a modal: focus moves into it on open, stays trapped while open, and returns to the invoking control on close
- The export drawer and command palette trap focus while open, close on Escape, and return focus to the invoking control
- Validation messages are announced via a polite live region as well as shown visually
- Chart content is readable without hover: the legends list every expense category with its currency amount and percentage as text
- Over-burn status is not color-only: the panel also names the projected overage in text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app (create, edit, delete, filters, search, chart tab switches, bulk actions, burn rate edits, command palette, export, import)
- Chart redraws and tab switches apply in place without a full page reload and without visible jank
- The UI stays responsive under rapid repeated input with no hangs or dropped interactions
</performance>

<writing>
- Headings, buttons, and nav labels use one consistent capitalization convention throughout the app
- Currency values are formatted consistently (same symbol and decimal treatment) across the metric cards, table, legends, tooltips, summary strip, burn-rate panel, and export preview
- Toasts name the action they confirm; empty states explain what belongs in the region and how to add it; export and import labels are specific (Export report, Import CSV, Download JSON, Download Markdown, Copy, Commit valid rows); no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<innovation>
Optional enhancements (not required to pass): guided first-run coachmarks on Export report and the burn-rate panel; a printable stylesheet for the Markdown report preview; denser keyboard shortcuts listed inside the command palette footer.
</innovation>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): transactions collection, chart tab mode, filters/selection/search, burn-rate ceiling, toast timer, export drawer state, command palette state, import diagnostic rows, and derived totals. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid transaction increases the collection, updates KPIs, and participates in chart aggregates, burn rate, and exports
- Editing a transaction updates that same record in the list and recomputed totals/charts/burn rate/exports
- Deleting a transaction removes it from the list, selection, KPIs, charts, burn rate, and exports
- Filters and payee search recompute the visible list from the shared collection; chart mode toggles shared tab state without inventing a second ledger
- Export JSON and Markdown are compiled live from the shared store; Import CSV commits validated rows into that same store
- The breakdown report export is the session's useful end state: Download and Copy must emit live-compiled JSON or Markdown that reflects every mutation
Stack: Angular single-page app with NgRx for all shared state; frontend-only. Tailwind CSS 4.3.2 (pinned) is the styling base and owns layout, spacing, and custom surfaces, with design tokens declared in the Tailwind theme. PrimeNG is the component library, used for the transactions table, dialogs, selects, drawers, and toasts; it keeps its own component styles. ngx-echarts is the only allowed chart dependency and renders the sankey, doughnut, and burn-rate bar charts. AutoAnimate and Angular animations are allowed for animation; no other animation libraries. PrimeIcons only for icons. All forms (transaction create and edit, burn-rate ceiling, import commit) are built with Angular Reactive Forms and validate through a Zod schema that mirrors the transaction field contract and burn-rate ceiling rules; the schema defines the rules and the form surfaces inline per-field errors before submit, with submit disabled until valid. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least 8 transactions so the list and charts are non-empty on first load; span enough expense categories (roughly 8-10) that the breakdown legend, pie slices, and sankey nodes are visibly multi-category; seed a positive monthly burn-rate ceiling
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
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
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
- Browsable entity: expenses
- Destinations: breakdown-overview; expense-list; category-filter; export-drawer; burn-rate; import-diagnostic; command-palette
- Filters: category; type; date-range; payee
- Sorts: amount; date
- Entity: expense
- Entity operations: create; select; update; delete
- Entity fields: date; label; category; account; amount; status
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: transactions-csv
- Workflow completion: export drawer JSON preview updates after create/edit/delete and totals.count matches the live summary strip count
- Workflow completion: importing transactions-csv with Replace all updates table rows, KPIs, charts, and burn-rate to match committed valid rows

Mechanics exclusions:
- Chart hover and burn-rate bar hover stay Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Clipboard contents of Copy are verified via Playwright, never returned in WebMCP results
- Command palette open shortcut and list filtering animation stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
