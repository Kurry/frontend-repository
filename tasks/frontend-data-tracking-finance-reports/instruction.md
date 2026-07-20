<summary>
Build a personal finance reports page using Preact, Signals, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens straight onto the Ledger reports workspace — persistent left sidebar, four summary cards, chart card, thresholds panel, and a transactions table — with no login, signup, or bank-linking gate
- The sidebar shows a branded Ledger lockup, named nav items (Dashboard, Accounts, Transactions, Cash Flow, Reports, Budget) with Reports rendered active, and a profile reading Alex Rivera; clicking any non-active nav item shows a demo toast and keeps the current view (never navigates away)
- Four summary cards (Total Income, Total Expenses, Total Net Income, Savings Rate) read from the transactions collection in the active display currency; creating, editing, or deleting a transaction recomputes every card, and Savings Rate is net income divided by income
Feature: Transactions collection and field contract —
- Primary collection is transactions: seed at least 8 rows so the table and charts are non-empty on first load; each row carries date, payee (UI label for the record's label field), category, account, a signed amount, optional status, and optional note; the list supports create, edit, and delete
- Transaction record field contract (API-shaped payload; all keys required unless marked optional; example values illustrative only): date is an ISO calendar date YYYY-MM-DD; label is a non-empty string of 1 to 80 characters (shown as payee in the UI); category is one of the closed set Groceries, Restaurants, Transport, Housing, Utilities, Entertainment, Healthcare, Shopping, Salary, Freelance; account is one of Checking, Savings, Credit Card, Cash; amount is a signed number that is not zero, absolute value at most 1000000, with at most 2 decimal places; status is optional and when present is one of cleared, pending, or reconciled; note is optional and when present is a string of at most 200 characters. Cross-field rule: categories Salary and Freelance require a positive amount; every other category requires a negative amount. A valid create or edit produces a record matching this contract; the create and edit forms present date, payee/label, category, account, amount, and optional status and note
- Create and edit forms validate before submit: each invalid field shows an inline message naming that field, and the submit control stays disabled until every required field is valid against the field contract
Feature: Charts, filters, and display currency —
- The chart card carries a "By category & group" subtitle and a Breakdown / Trends pill toggle: clicking a pill swaps the panel in place with no page reload and gives the active pill stronger weight
- Breakdown renders a sankey: named income-source nodes (e.g. Paychecks, Business Income, Interest, Other Income) feed a central Income hub that splits into a Net Income node plus one node per expense category (emoji-prefixed labels such as Groceries, Restaurants & Bars, Gas), with curved links whose thickness is proportional to amount and node labels showing category name and amount; all flows aggregate live from the transactions collection
- Trends renders a category pie/doughnut with a legend, aggregating live from the same collection
- Both chart panels are data-driven, not baked images: creating, editing, or deleting a transaction visibly changes the sankey link widths and node amounts and the doughnut segment proportions the next time each panel is shown
- A summary strip below the table reports total transaction count, largest transaction, average amount, and covered date range, each recomputed from the current filtered transactions
- Two interaction modes: chart mode (Breakdown/Trends aggregates) and transactions-list mode (table with category filter, income-vs-expense filter, and inclusive date-range filter)
- Category filter, income-vs-expense filter, and date-range filter recompute the visible list from the shared collection; clearing filters restores the full current collection; chart aggregates, summary cards, and summary strip follow the filtered collection
- Display currency control: a workspace currency selector with closed set USD, EUR, GBP. Amounts in cards, table, legends, thresholds, and export previews convert using fixed mock FX rates relative to a USD base (EUR = amount × 0.92, GBP = amount × 0.78, USD = identity). Switching currency recomputes every money surface without mutating stored transaction amounts. Seeded amounts are stored as USD base values
- Bulk categorize and bulk delete apply to checkbox-selected rows; chart aggregates, summary cards, and summary strip all follow the same collection
Feature: Category thresholds —
- A Thresholds panel lists editable monthly spend ceilings for at least four expense categories from the closed category set. Each threshold row shows category, ceiling amount (in the active display currency), month-to-date spend for that category, and a status of under, near, or over
- Threshold record field contract (API-shaped; all keys required; example values illustrative only): category is one of the expense categories from the transaction closed set excluding Salary and Freelance; ceiling is a number greater than 0 and at most 1000000 with at most 2 decimal places. A zero or negative ceiling is rejected with an inline message naming the ceiling field and the previous ceiling stays in effect
- Status rules: under when month-to-date spend is below 80 percent of ceiling; near when at least 80 percent and at most 100 percent; over when above 100 percent. Over rows show a visible over-threshold treatment that names the overage amount in text. Creating or editing expense transactions, changing a ceiling, or switching display currency recomputes statuses live
Feature: Undo and redo —
- After a successful create, edit, delete, bulk categorize, or bulk delete, Undo restores the prior transactions collection and derived surfaces; Redo reapplies the undone mutation. Undo and Redo controls are disabled when their stacks are empty. Threshold ceiling edits also participate in the same undo/redo timeline
Feature: Ledger export and ledger-json import (useful end state) —
- An Export control (labeled Export or Export report — not a demo toast) opens a drawer with JSON and CSV tabs compiled LIVE from the session store. Both tabs MUST reflect every create, edit, delete, bulk categorize, bulk delete, threshold edit, filter, and display-currency choice — an export that omits session work is a failure
- Normative ledger JSON shape (all keys and nesting required; example values illustrative only): {"schemaVersion":1,"reportTitle":"Finance Reports","generatedAt":"","displayCurrency":"USD","filters":{"category":null,"type":null,"dateStart":null,"dateEnd":null},"totals":{"income":0,"expenses":0,"net":0,"savingsRate":0,"count":0},"thresholds":[{"category":"","ceiling":0,"monthToDate":0,"status":"under"}],"transactions":[{"date":"","label":"","category":"","account":"","amount":0,"status":"","note":""}]}. totals match the four summary cards and the summary strip count for the current filter scope in the active display currency; thresholds lists every threshold row with category, ceiling, monthToDate, and status; transactions lists every row in the current filtered collection matching the transaction field contract (label equals the UI payee). After two different creates with distinct payees, a fresh export must contain both labels in transactions
- The CSV tab shows a header row date,label,category,account,amount,status,note followed by one data row per filtered transaction; amounts are the stored base amounts (USD), not display-converted values
- Download JSON offers a real file download named finance-reports-ledger.json whose body matches the JSON tab. Download CSV offers finance-reports-ledger.csv whose body matches the CSV tab. Copy on the active tab puts that tab's text on the clipboard and shows a visible Copied confirmation that clears within about 3 seconds
- An Import control opens a panel that accepts paste or file of a ledger-json document matching the normative JSON shape. The document is validated against the transaction and threshold field contracts before commit. Invalid documents show a visible error naming the offending path or field and change nothing. A valid import with Replace mode replaces transactions and thresholds from the document, updates table, cards, strip, charts, thresholds, and a subsequent export. Import mode is ledger-json only
- Demo chrome controls (Filters, Save, Sort, Columns, Bulk edit) show a brief toast that enters and clears, and never navigate or replace real create/edit/delete/export/import/undo/redo
- Zero outbound navigation — in-app controls only
</core_features>

<user_flows>
- Create flow: after submitting a valid new transaction, the table gains exactly one row, all four summary cards recompute to include the new amount, the active chart panel redraws with the changed aggregate, the summary strip count increases by exactly one, and thresholds statuses recompute when the category is an expense — all without a page reload
- Edit flow: changing an existing transaction's amount updates that same row in the table, moves the affected summary cards, changes the corresponding sankey link thickness and doughnut segment when each panel is viewed, updates the summary strip largest and average figures, and updates matching threshold month-to-date — without a reload
- Delete flow: deleting a transaction removes its row from the table, drops it from any checkbox selection, decreases the summary strip count by exactly one, shrinks the matching chart aggregate the next time the panel is shown, and recomputes thresholds
- Filter round-trip: applying the category filter narrows the visible rows to that category, stacking the income-vs-expense filter and a date range narrows them further, and clearing all filters restores exactly the full current collection with the summary cards recomputed for the restored scope
- Bulk flow: checking 3 rows and applying bulk categorize moves each checked row to the chosen category in the table and shifts the chart aggregates and thresholds accordingly; bulk delete removes every checked row and the summary strip count drops by exactly that number
- Currency flow: switching display currency from USD to EUR (or GBP) changes the money figures on cards, table amounts, legends, and threshold ceilings/spend to the converted values while row count stays the same; switching back to USD restores the base figures
- Thresholds flow: lowering a category ceiling below that category's month-to-date spend shows the over status and names the overage; raising it above the spend clears over
- Undo/redo flow: create a transaction, activate Undo — the row disappears and cards/charts/thresholds revert; activate Redo — the row and derived surfaces return
- Export flow: after creating a transaction with payee Ada Books and a second with payee Evening Market, open Export; the JSON tab transactions array contains both labels and totals.count equals the live strip count for the current filter scope; the CSV tab includes both labels; Download JSON and Download CSV offer finance-reports-ledger.json and finance-reports-ledger.csv; Copy shows Copied
- Import round-trip flow: export JSON after mutations, delete all transactions so the empty state shows, then Import the same ledger-json with Replace — the table, cards, strip, charts, and thresholds reconstruct to match, and a fresh export's transactions array matches
- A page reload returns the app to its seeded state: the seeded transactions, default filters, default chart tab, seeded thresholds, default display currency USD, empty undo/redo stacks, and closed drawers
</user_flows>

<edge_cases>
- Submitting create with an empty payee/label, a missing amount, amount of zero, absolute amount above 1000000, a non-ISO date, a category outside the closed set, or a Salary row with a negative amount shows visible inline validation naming the offending field and adds no row; the transactions count is unchanged
- Double-activating a valid submit creates exactly one transaction: the row count increases by one and one new row appears
- Deleting all transactions, or filtering to zero matches, shows an empty state in the list region with a message; summary cards and the summary strip read zero/empty
- Bulk categorize and bulk delete with no rows checked perform no destructive change: the collection and charts stay as they were
- With an empty collection, Export still produces JSON with schemaVersion 1, totals all zero, an empty transactions array, and thresholds reflecting current ceilings with monthToDate 0; CSV still shows the header row; Copy still shows Copied
- Import of malformed JSON, wrong schemaVersion, or a document whose transactions or thresholds violate the field contracts shows a visible error and changes nothing
- A date range with end before start shows an inline validation message naming the range and does not apply
- A zero or negative threshold ceiling is rejected with an inline message naming the ceiling field
- Undo with an empty undo stack and Redo with an empty redo stack leave the collection unchanged and keep the controls disabled
</edge_cases>

<visual_design>
- Soft mint finance UI: light page/sidebar wash, brand teal, accent mint; Ledger mark in sidebar
- Persistent left sidebar + main column: page chrome actions (including Export, Import, Undo, Redo, and display currency), a row of four statistic cards, chart card, thresholds panel, transactions table/list, and a summary strip beneath the table
- Breakdown sankey and Trends pie use multi-hue category fills; Reports workspace density — not a marketing landing
- Over-threshold treatment uses a consistent error color family distinct from ordinary row hover; the export drawer is an elevated overlay with clear scrim
- One consistent icon set across sidebar, chrome actions, and table controls, rendered inline at text-compatible sizes
- Component states are visibly distinct: buttons and inputs show default, hover, focus (visible ring), disabled, and error treatments
- Currency values use one consistent symbol and decimal treatment across cards, table, legends, thresholds, and export preview for the active display currency
</visual_design>

<motion>
- Chart tabs — Breakdown / Trends pill toggle swaps panels in place; active pill gains stronger weight
- Mode awareness — switching emphasis between chart panel and transactions list does not reload the page
- List microinteractions — a newly created transaction row animates into the table, a deleted row animates out, and bulk delete animates each removed row rather than snapping the list
- Export drawer — enters with a short opacity and slide transition rather than snapping open, and exits the same way
- Demo toast — status enters from below with a short ease, holds briefly, then exits; Copied confirmation follows the same toast language
- Hover animations (required): sidebar/nav and action controls use pointer cursor and hover wash; transaction rows take a light mint wash; chart sectors keep pointer cursor; focus-visible rings on interactive controls
- With prefers-reduced-motion set, entry/exit animations are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- At desktop widths (1024 pixels and above) the left sidebar stays persistently visible beside the main reports column
- Below 1024 pixels the sidebar collapses behind a visible toggle control that opens it as an overlay drawer; all nav items remain reachable
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the transactions table scrolls within its own container if it exceeds the width; the export drawer, import panel, and thresholds panel stay fully visible and operable
</responsiveness>

<accessibility>
- Every interactive control — nav items, chart pills, filters, row checkboxes, form fields, bulk actions, Export, Import, Undo, Redo, display currency, and threshold ceiling inputs — is reachable and operable with the keyboard alone, with a visible focus indicator
- Form inputs in the create and edit flows have programmatically associated labels, and inline validation messages are announced via an aria-live polite region as well as shown visually
- The export drawer traps focus while open, closes on Escape, and returns focus to the invoking control
- Toasts are announced through an aria-live polite region and never trap focus
- Each chart panel exposes a text alternative: node/segment labels and amounts are readable as text in or alongside the chart region
- Over-threshold status is not color-only: the panel also names the overage in text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (create, edit, delete, filters, bulk actions, chart toggles, thresholds, currency switch, undo/redo, export, import, toasts)
- Chart tab switches, filter changes, currency switches, and undo/redo apply without visible freezing, and the UI stays responsive under rapid repeated input with no hangs or dropped interactions
</performance>

<writing>
- Headings, nav items, and buttons use one consistent capitalization convention throughout the app
- Validation messages name the field and the fix; empty states explain what belongs in the region and how to add it
- Export and import labels are specific (Export, Import, Download JSON, Download CSV, Copy); no placeholder or filler text appears anywhere in the shipped UI; all seeded payees, categories, and amounts read as plausible synthetic finance data
</writing>

<innovation>
Optional enhancements (not required to pass): a printable stylesheet for the CSV/JSON preview; coachmarks pointing at Export and Thresholds on first load; a keyboard shortcut legend for Undo/Redo.
</innovation>

<requirements>
Shared application state must use Signals, the state library named in summary (in-memory only): transactions collection, chart tab mode, filters/selection, display currency, thresholds, undo/redo stacks, toast timer, export drawer state, import panel state, and derived totals. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid transaction increases the collection, updates KPIs, participates in chart aggregates, thresholds, and exports
- Editing a transaction updates that same record in the list and recomputed totals/charts/thresholds/exports
- Deleting a transaction removes it from the list, selection, KPIs, charts, thresholds, and exports
- Filters recompute the visible list from the shared collection; chart mode toggles shared tab state without inventing a second ledger
- Display currency converts money surfaces via mock FX without mutating stored amounts
- Export JSON and CSV are compiled live from the shared store; Import ledger-json commits a validated document into that same store
- Undo/redo restores prior collection and threshold snapshots from the shared timeline
- The ledger export is the session's useful end state: Download and Copy must emit live-compiled JSON or CSV that reflects every mutation
Stack and libraries:
- Preact + Signals + Tailwind CSS 4.3.2 (pinned), Vite or an equivalent SPA setup; frontend-only, no backend or authentication
- DaisyUI is the component library for page chrome: cards, table, buttons, form controls, dropdowns, drawers, and toasts; no other component library
- AutoAnimate allowed for list add/remove/reorder microinteractions and CSS transitions for simple state changes; no other animation libraries
- Chart.js renders both chart panels — the Breakdown sankey (via a Chart.js sankey chart type plugin) and the Trends pie/doughnut — re-rendered live from shared state, not static baked markup; no other chart libraries
- Iconify icons only (via the Tailwind icon plugin or on-demand Vite icon imports); no raw copy-pasted SVGs and no icon CDN
- All forms (create and edit transaction, threshold ceiling, import commit) validate through a Zod schema that mirrors the transaction and threshold field contracts, surfaced by a form library (React Hook Form via preact/compat, or TanStack Form) with inline per-field errors before submit
- All libraries installed via npm and bundled locally; no CDN imports
- Seed at least 8 transactions so the list and charts are non-empty on first load; seed at least four category thresholds with positive ceilings; default display currency is USD
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
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Destinations: reports-overview; category-breakdown; transaction-list; export-drawer; thresholds
- Filters: category; range; currency
- Sorts: amount; date
- Entity: expense
- Entity operations: create; select; update; delete
- Entity fields: label; amount; category; date; account; status
- Artifact operations: export; import; copy
- Export formats: csv; json
- Import modes: ledger-json
- Workflow completion: export drawer preview updates after create/edit/delete and matches live totals.count
- Workflow completion: importing ledger-json replaces table rows, thresholds, and summary cards to match the imported document

Mechanics exclusions:
- Chart geometry / pie segment hover stays Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Clipboard contents of Copy are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
