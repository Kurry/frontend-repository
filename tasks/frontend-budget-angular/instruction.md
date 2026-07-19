<summary>
Build a frontend-only, personal expense and budget tracker using Angular, NgRx, and Angular Material.
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
Core features (each line is an observable behavior the finished app must exhibit):
- The app opens with no authentication wall directly into the primary workspace: a top bar shows the account name and a reporting-period control, and a bottom navigation switches between Dashboard, Expenses, and Settings — recognisably a personal expense and budget tracker, not a generic dashboard or starter page
- The workspace opens non-empty: at least 10 seeded expenses across at least 5 categories (Food, Shopping, Entertainment, Transport, Cloths) are visible for the initial reporting period, and a second seeded period with its own expenses exists so changing the period is observable
- Dashboard shows a Total budget / Total expenses / Total left summary and a "Budgets by category" list where each category shows its name, a progress bar filled to its spent/limit ratio, the spent-of-limit amount, and the amount left
- Expenses view lists every expense for the current reporting period in a table with Date, Counterparty, Category, Value, and Actions columns, plus a control to filter the visible rows by category
- Adding an expense (amount, date, category, and optionally a counterparty) through the Add control inserts a new row into the Expenses table for its period, raises that category's total on the Dashboard by exactly the entered amount, and advances that category's budget progress bar accordingly; submitting with an empty or non-positive amount, a missing date, or no category is rejected with a visible validation message and adds no row
- Changing the reporting period (previous/next) swaps which expenses are visible in the Expenses table and recomputes the Dashboard's per-category totals, progress bars, and Total budget / Total expenses / Total left summary from that period's expenses only
- Deleting one expense from the Expenses table removes its row immediately and lowers its category's Dashboard total, and that category's progress bar, by exactly that expense's amount; other categories and other periods are unaffected
- Editing an existing expense's amount, date, or category updates the same row in place and recomputes the old and new category totals and progress bars to reflect the move
- Settings has an Account tab (an editable display name) and a Categories tab where a new category can be added by name and an existing category can be renamed or deleted from an expandable row, each change reflected immediately in the category filter and the Dashboard's per-category list
- Reloading the page restores the reporting period, the full expense list (including any additions, edits, or deletions made in the session), and category edits from local client storage — nothing resets to the original seed
</core_features>

<visual_design>
- Mobile-app-style single-column layout capped at a readable width: a solid-color top bar (account name left, "‹ month/year ›" period control right), a scrollable content area, and a fixed bottom navigation bar with Dashboard / Expenses / Settings
- Dashboard: a summary card (Total budget, Total expenses, Total left as label/value rows) above a "Budgets by category" card; each category row shows its name and "left $X.XX" on one line and a filled progress bar with the "$spent / $limit" amount overlaid on the bar
- Expenses: a category filter control above a dense data table (Date, Counterparty, Category, Value, Actions with edit and delete controls per row); a circular floating action button in the bottom-right corner opens the add-expense dialog
- Add/Edit expense dialog: a Material dialog with Amount, Date, Category (select), and Counterparty fields and Cancel/Add(or Update) actions; invalid fields show inline Material error text
- Settings: a two-tab layout (Account, Categories); Categories renders each category as a collapsible row that expands into an editable name field with Update/Delete actions, plus an "Add new category" card with a name field and Add action
- A single brand accent color (pink/magenta) used consistently for the top bar, the floating action button, active bottom-nav item, progress-bar fill, and primary buttons; light neutral surfaces elsewhere; Material cards with subtle elevation and rounded corners throughout
</visual_design>

<motion>
- Buttons, bottom-nav items, table action icons, and dialog actions show a hover wash and a pressed/ripple feedback when actually hovered or clicked; hover feedback is required, not optional
- The add/edit expense dialog and its backdrop animate in and out (Material dialog open/close transition) rather than appearing or disappearing instantly
- Snackbar confirmations (add, update, delete) slide in from the bottom edge and auto-dismiss after a short delay
- Budget progress bars animate their fill when the underlying spent amount changes (on add, edit, delete, or period change) rather than jumping instantly to the new value
- Settings category rows expand and collapse with a smooth height/opacity transition (Material expansion panel animation) when toggled
- Switching between Dashboard, Expenses, and Settings swaps the main content without a full page reload; the active bottom-nav item is visually distinguished from the inactive ones
</motion>

<requirements>
- Use Angular, NgRx, and Angular Material
- No authentication wall — open directly into the primary workspace; there is no login or logout control
- Shared application state (expenses, categories, budget definitions, the active reporting period, the active view, and the category filter) lives in an NgRx store; view switches and period changes read and write that shared state, not a disconnected local copy
- State contracts (behavioral): adding a valid expense increases its category's current-period total and progress by exactly its amount and appears in the Expenses table for that period; editing an expense recomputes both its old and new category's totals; deleting an expense decreases its category's current-period total and progress by exactly its amount and removes its row; changing the reporting period recomputes every derived total, progress bar, and visible row set from that period's expenses only, never mixing periods
- Persist expenses, categories, budget definitions, the reporting period, and the display name to localStorage (or equivalent client storage) so a reload restores the exact prior state, including any edits made in the session
- Seed at least 10 sample expenses spanning at least 2 reporting periods and at least 5 categories so the primary workflow (dashboard totals, expenses table, period switch) is non-empty and non-trivial on first load
- Submitting the add/edit expense form with an empty or non-positive amount, a missing date, or no category must show visible validation feedback and must not add or change any row
- Keep the implementation frontend-only and self-contained; do not depend on a live backend, and do not fetch the app or its data from another origin
- package.json must define npm scripts named exactly start (serves the built app on port 3000) and verify:build (exits 0 when the Angular build succeeds)
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
- browse-query-v1

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

Bindings:
- Entity: expense
- Entity operations: create; update; delete
- Entity fields: value; datetime; categoryId; counterparty
- Form fields: amount; date; category
- Form operations: validate; submit; cancel; reset
- Destinations: dashboard; expenses; settings
- Filters: reporting-period

Mechanics exclusions:
- Material dialog + snackbar + progress-bar fill + expansion-panel transitions stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
