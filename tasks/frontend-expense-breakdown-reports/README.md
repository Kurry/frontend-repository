# ExpenseBreakdownReports — PRD

Clean-room rebuild of the Ledger personal-finance **Reports** demo (source: `FinanceReports/`). Sidebar + summary cards + sankey/pie toggle + transaction list. No SavePage/vendor capture reuse.

## Goal

Single-page reports UI branded **Ledger**. Users view income/expense metrics, switch **Breakdown** (sankey) vs **Trends** (pie), and browse sample transactions. All former outbound links are inert controls with demo toasts.

## Non-goals

- No backend, auth, bank linking, or live APIs
- No Monarch / original-brand restoration
- No edits to `FinanceReports/` or sibling variants

## Hard constraints

- Zero navigational `<a href>` elements
- Inert controls use `<button type="button">` (class `inert-nav` or `data-demo-action`)
- Synthetic demo data only (Alex Rivera, Northwind Labs, generic payees)
- Title: `Ledger | Reports`

## Stack & layout

| Path | Role |
|---|---|
| `index.html` | Page shell |
| `css/styles.css` | Layout + chrome |
| `js/app.js` | Tabs, sankey SVG, Chart.js pie, toasts, tx table |
| `assets/logo.svg` / `favicon.svg` | Ledger marks |

CDN: Chart.js 4 for Trends doughnut.

## Serve

```bash
cd variants/ExpenseBreakdownReports && python3 -m http.server 9311
# open http://127.0.0.1:9311/
```

## Acceptance

- Breakdown sankey + Trends pie toggle works
- Filters/Save/Sort/Columns/Export/sidebar show demo toasts and do not navigate
- Summary cards and transactions show synthetic amounts/labels
