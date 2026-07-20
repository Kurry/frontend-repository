<summary>
Build a frontend-only, personal expense and budget tracker using Angular, NgRx, Tailwind CSS 4.3.2, and Angular Material. The app produces the operator's portable budget files — a BudgetDocument JSON pack and a period expenses CSV — compiled live from the store so every mutation the session makes leaves with the user.
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

Feature: Workspace shell —
- The app opens with no authentication wall directly into the primary workspace: a top bar shows the account name and a reporting-period control, and a bottom navigation switches between Dashboard, Expenses, and Settings — recognisably a personal expense and budget tracker, not a generic dashboard or starter page
- The workspace opens non-empty: at least 10 seeded expenses across at least 5 categories (Food, Shopping, Entertainment, Transport, Cloths) are visible for the initial reporting period, and a second seeded period with its own expenses exists so changing the period is observable
- Undo and Redo controls sit in the chrome; after any reversible mutation (add, edit, or delete an expense; bulk categorize; bulk delete; add, rename, or delete a category; edit the display name; change the spending threshold; add, edit, or delete a recurring rule; or a committed import) Undo is enabled and reverses that whole mutation in one step, restoring the prior Expenses rows, Dashboard totals, variance figures, categories, and settings; Redo re-applies that mutation; performing a new mutation after an Undo clears the Redo stack; both controls stay disabled when their stack is empty

Feature: Expense field contract (API-shaped request body) —
- Expense record field contract (all keys required unless marked optional; example values illustrative only): value is a number greater than 0 with at most 2 decimal places and at most 1000000; datetime is an ISO calendar date YYYY-MM-DD; categoryId is a non-empty string naming an existing category id; counterparty is a string of 0 to 80 characters after trim (empty string allowed); period is an object with month an integer from 1 through 12 and year a four-digit integer. Cross-field rules: period.month and period.year must match the calendar month and year of datetime; categoryId must refer to a category that currently exists. A valid create or edit produces a record matching this contract; the created or updated record IS the would-be expenses API request body
- The Add control opens an add-expense dialog with Amount, Date, Category (select), and Counterparty fields; the submit action stays disabled or rejects until every required field is valid against the expense field contract, and each invalid field shows an inline error message naming that field before submit
- Submitting a valid expense closes the dialog and inserts exactly one new row into the Expenses table for its period; the new row shows the submitted date, counterparty, category, and value
- The edit action on an expense row opens the same dialog pre-filled with that expense's values; applying the change updates the same row in place rather than adding a second row
- The delete action on an expense row removes that row immediately

Feature: Category and account field contracts —
- Category field contract: name is a required trimmed string length 1 to 40, unique among categories case-insensitively. Adding or renaming with an empty, whitespace-only, over-40-character, or duplicate name shows validation naming the name field and does not change the Categories list
- Account displayName field contract: displayName is a required trimmed string length 1 to 60. An empty or over-length name shows inline validation and does not update the top-bar account name
- Settings has an Account tab (editable display name under that contract, plus the spending threshold percent), a Categories tab where a new category can be added by name and an existing category can be renamed or deleted from an expandable row (each change reflected immediately in the category filter and the Dashboard's per-category list), and a Recurring tab listing the recurring rules

Feature: Recurring rules —
- Recurring rule field contract (all keys required; example values illustrative only): name is a trimmed string of 1 to 60 characters (used as the generated expense's counterparty); value is a number greater than 0 with at most 2 decimal places and at most 1000000; categoryId names an existing category; dayOfMonth is an integer from 1 through 28
- The Settings Recurring tab lists existing rules and an Add recurring rule control; the rule form has Name, Amount, Category (select), and Day of month fields, each validating inline against the recurring rule field contract before the rule can be saved (for example an amount not greater than 0, or a day of month outside 1 through 28, shows a message naming that field and blocks save)
- Each listed rule can be edited (the same form pre-filled) and deleted; adding, editing, or deleting a rule is a single reversible mutation on the Undo stack
- For every reporting period the user views, each active rule contributes exactly one generated expense instance to that period, dated the rule's day of month in that period's month, carrying the rule's value and category and the rule name as counterparty; the generated instance appears as a row in the Expenses table marked as rule-generated with a visible badge or icon distinct from manually added rows
- Every generated instance counts in that period's Dashboard totals, per-category spent, progress bars, variance, projection, and chart exactly like a manually added expense
- Deleting a rule removes its generated instances from every period, except an instance the user has edited (amount, date, or category changed), which detaches into a standalone manual expense and remains after the rule is deleted
- Generated instances appear in exports like any expense with an added recurring marker field set true; manually added expenses carry the recurring marker false

Feature: Dashboard derived surfaces —
- Dashboard shows a Total budget / Total expenses / Total left summary and a "Budgets by category" list where each category shows its name, a progress bar filled to its spent/limit ratio, the spent-of-limit amount, and the amount left
- Any category whose spent amount exceeds its budget limit shows a distinct over-budget treatment on its Dashboard row (label or border distinct from under-budget rows) that updates live when spent crosses the limit
- Dashboard also renders a spending-breakdown chart whose segments or bars correspond to the current period's per-category totals; hovering a segment shows a tooltip naming the category and its amount

Feature: Budget variance, projection, and thresholds —
- The Dashboard shows a per-category variance surface: for each category its budget limit, its actual spent, and its variance (limit minus spent, shown with a sign so an over-spent category reads negative) for the current reporting period
- Each category also shows a projected end-of-period total, computed as (spent divided by days elapsed in the period) times the number of calendar days in the period's month; days elapsed is the day-of-month of the most recent expense in that period (the largest datetime day across the period's expenses; the current date's day-of-month when viewing the live current month), and the number of days in the month is that month's calendar length, so the math is verifiable from the seeded amounts; when the period has no expenses, days elapsed is 0 and the projected total is 0 (no division by zero)
- A category whose projected total exceeds its budget limit shows a "Projected overage" flag on its Dashboard row; the flag appears and clears live as spending or the reporting period changes
- A single spending threshold percent (an integer from 0 to 100, default 80) is set in Settings and inline-validated so a value below 0, above 100, or non-integer is rejected with a message naming the threshold field and is not saved; when a category's spent reaches or exceeds that percent of its budget limit, the category's Dashboard row shows an "Over threshold" text label in addition to any color treatment, and the label clears when spent falls back below the threshold
- The threshold percent persists across reloads and appears in the exported Budget report JSON; a category whose spent is exactly the threshold percent of its limit (the boundary) counts as over threshold

Feature: Expenses table and bulk tray —
- Expenses view lists every expense for the current reporting period in a table with Date, Counterparty, Category, Value, and Actions columns, plus a control to filter the visible rows by category
- Each Expenses row has a selection checkbox and a select-all control sits in the table header; selecting at least two rows reveals a bulk action tray showing the number of selected rows plus Bulk categorize and Bulk delete; Bulk categorize reassigns every selected row to the chosen category and recomputes Dashboard totals and variance; Bulk delete removes every selected row in one step and lowers those categories' spent amounts by exactly the deleted totals; with no rows selected the tray is hidden or its actions are disabled
- Changing the reporting period (previous/next) swaps which expenses are visible in the Expenses table and recomputes the Dashboard's per-category totals, progress bars, chart, and Total budget / Total expenses / Total left summary from that period's expenses only

Feature: Budget export and import (useful end state) —
- The app produces the operator's budget files: an Export control opens a drawer with CSV and JSON format tabs compiled LIVE from the current store
- BudgetDocument JSON field contract (all top-level keys and nesting REQUIRED; example values illustrative only): displayName (string, length 1 to 60), activePeriod (object with month integer 1–12 and year four-digit integer), categories (array of objects each with id non-empty string, name string length 1–40, maxExpenses number greater than 0), expenses (array of objects each matching the expense field contract above, including nested period). Cross-field rules: every expense.categoryId must equal an existing categories[].id in the same document; every expense.period must match that expense.datetime's calendar month and year; activePeriod.month must be 1–12. The live JSON preview, Download, Copy, and Import all conform to this same shape
- CSV export shows a header line Date, Counterparty, Category, Value, Period and one data line per expense in the current reporting period (Category is the category name; Period is month/year). After adding a valid expense, a data line contains that expense's YYYY-MM-DD date, counterparty, category name, and value
- Export offers CSV and JSON formats each with Copy (clipboard write plus brief confirmation such as Copied) and Download (a real file whose contents match the open preview). Suggested filenames: budget-document.json and expenses.csv
- Export content must reflect every mutation the session made — a create, edit, delete, bulk categorize, bulk delete, category rename, or display-name edit that is visible in the UI must appear in the compiled export text before copy or download; an export that omits session work or lacks required BudgetDocument keys is incorrect
- An Import JSON control accepts a previously exported BudgetDocument only when it passes the field contract; on success it restores displayName, activePeriod, categories (with maxExpenses), and expenses so the Expenses table, Dashboard totals, and export previews match the imported document. Malformed JSON, or parseable JSON that violates the contract (missing required keys, activePeriod.month outside 1–12, expense value not greater than 0, datetime not YYYY-MM-DD, period/datetime mismatch, or unknown categoryId), shows an inline import error naming the offending field or rule and leaves expenses, categories, display name, and totals unchanged
- The Export drawer's JSON tab is the Budget report JSON (the BudgetDocument) and its CSV tab is the Transactions CSV; a control toggles the CSV between the current reporting period only and all periods (every seeded and session period), while the JSON always compiles the full document
- Budget report JSON extended field contract (in addition to the required displayName, activePeriod, categories, and expenses keys above; all keys REQUIRED; example values illustrative only): meta is an object with exportedAt (an ISO 8601 timestamp string), period (the active period label such as "3/2020"), and expenseCount (an integer equal to the number of entries in expenses); totals is an object with budget, spent, and left numbers equal to the Dashboard's Total budget, Total expenses, and Total left; each entry in categories additionally carries limit (equal to maxExpenses), spent, variance, projected, and overThreshold (a boolean, true when spent reaches the spending threshold percent of limit); recurringRules is an array of objects each with name, value, categoryId, and dayOfMonth; each entry in expenses additionally carries recurring (a boolean, true for rule-generated instances); settings is an object with thresholdPercent (integer 0 to 100) and accountName (equal to displayName). The live preview, Copy, Download, and Import all conform to this extended shape
- Import JSON also restores the recurring rules and the spending threshold percent from a Budget report JSON so the Recurring list, the Settings threshold, the Dashboard variance, and the export previews match the imported document; a document missing meta, totals, recurringRules, or settings, or whose totals or per-category spent disagree with its own expenses, is rejected with an inline error naming the offending key and changes nothing
- Import Transactions CSV: an Import CSV control accepts a Transactions CSV whose header is exactly date,counterparty,category,value; on selection the app shows a diagnostic screen — a per-row table marking each row valid or invalid and, for each invalid row, naming the failing field (a date not YYYY-MM-DD, a category not matching an existing category, a value not greater than 0, or a missing counterparty) — before anything is written to the store
- On the diagnostic screen the user can exclude a row or inline-fix its cells (rows re-validate live), and a Commit control applies only the currently valid rows as new expenses, each routed to the reporting period matching its row date; a summary states how many rows were imported and how many skipped; until Commit is pressed the Expenses table, Dashboard totals, and export previews are unchanged, and a committed import is a single reversible mutation on the Undo stack
</core_features>

<user_flows>
- After adding a valid expense through the add dialog, the Expenses table gains exactly one row for that period, the Dashboard's Total expenses figure rises by exactly the entered amount, that category's progress bar advances accordingly, the spending-breakdown chart redraws to include the new amount, and switching to the Dashboard and back to Expenses shows the same new row without a reload
- Deleting one expense from the Expenses table removes its row immediately and lowers its category's Dashboard total, that category's progress bar, and its chart segment by exactly that expense's amount; other categories and other periods are unaffected
- Editing an existing expense's amount, date, or category updates the same row in place and recomputes both the old and the new category's totals, progress bars, and chart segments to reflect the move
- Changing the reporting period swaps the visible Expenses rows and recomputes every Dashboard total, progress bar, and chart segment from that period's expenses only, never mixing periods; stepping back to the prior period restores exactly the rows and totals it showed before
- Renaming a category in Settings updates that category's name in the category filter, in the Dashboard's per-category list, and in existing expense rows without a reload
- Reloading the page restores the reporting period, the full expense list (including any additions, edits, or deletions made in the session), and category edits from local client storage — nothing resets to the original seed
- Export flow: after adding a valid expense, open Export; the JSON tab shows required keys displayName, activePeriod, categories, and expenses and includes the new expense's value, datetime, categoryId, counterparty, and period; the CSV tab includes a data line for that expense; Copy shows confirmation; Download JSON then Import that BudgetDocument reconstructs the same visible rows, categories, display name, and Dashboard totals
- Bulk categorize then undo: select at least two expenses in different categories, bulk-categorize them to one category, confirm both rows and Dashboard totals update; Undo restores the prior categories and totals exactly
- Bulk delete then undo: select at least two rows, Bulk delete, confirm the rows disappear and the affected categories' totals, progress bars, variance figures, and chart segments drop; Undo restores every deleted row and every one of those figures in one step
- Recurring flow: add a recurring rule (for example Rent, 1200, an existing category, day 1); switch to a reporting period and confirm exactly one rule-generated row dated that day appears marked as recurring, the period's Total expenses and that category's spent, progress, and variance include the rule's value, and opening Export shows that instance in expenses with recurring true and the rule in recurringRules
- CSV import flow: choose Import CSV with a file mixing valid and invalid rows; the diagnostic screen lists each row's validity and names the failing field on invalid rows while the Expenses table and Dashboard totals stay unchanged; pressing Commit adds only the valid rows to the periods matching their dates, shows an imported-versus-skipped summary, and only then do the Dashboard totals and export previews reflect the added rows; Undo reverses the whole committed import in one step
- Projection sensitivity: note a category's projected total, add a valid expense to that category in the current period, and confirm the projected total changes rather than staying identical; two categories with different spent-so-far show different projected totals
- Threshold flow: set the spending threshold to a percent a seeded category already exceeds and confirm that category's row gains the Over threshold label and the exported settings.thresholdPercent and that category's overThreshold reflect it; raising the threshold above the category's ratio clears the label
</user_flows>

<edge_cases>
- Submitting the add/edit expense dialog with an empty or non-positive amount, a missing or non-YYYY-MM-DD date, or no category shows a visible validation message naming each invalid field and adds or changes no row
- Double-activating the dialog's confirm action creates or applies exactly one change: the Expenses row count changes by at most one
- Selecting a category filter that matches no expenses in the current period shows an empty-state message in the table region rather than a blank area, and clearing the filter restores the full row set for that period
- Navigating to a reporting period with no expenses shows a zeroed Total expenses figure, empty progress bars, an empty Expenses table with a visible empty-state message, and no console errors
- Deleting the last expense in a category drops that category's spent amount to zero: its progress bar empties and its chart segment disappears, while the category itself remains listed on the Dashboard and in the filter
- Importing malformed or empty JSON shows an inline error naming the problem and leaves the current expenses, categories, and totals unchanged
- Importing parseable JSON that fails the BudgetDocument field contract — missing displayName, activePeriod, categories, or expenses; activePeriod.month outside 1–12; expense value not greater than 0 or datetime not YYYY-MM-DD; period/datetime mismatch; or unknown categoryId — shows an inline error naming the offending field and leaves expenses, categories, and totals unchanged
- Adding or renaming a category with an empty, whitespace-only, over-40-character, or duplicate name shows validation naming the name field and does not change the Categories list
- Undo at an empty undo stack or Redo at an empty redo stack changes neither the Expenses table nor Dashboard totals
- Bulk delete with no rows selected is unavailable (tray hidden or actions disabled)
- Committing a CSV import when no row is valid (every row excluded or failing) changes nothing: the Expenses table, Dashboard totals, and export previews stay exactly as before and the summary reports zero imported
- A recurring rule whose day of month falls in an otherwise empty reporting period makes that period non-empty: its generated instance appears in the Expenses table and the period's Total expenses is no longer zero
- A category whose spent is exactly the threshold percent of its limit shows the Over threshold label; a reporting period with no expenses shows every category's projected total as 0 with no Projected overage flag and no console error
- Importing a Budget report JSON missing meta, totals, recurringRules, or settings, or whose totals disagree with its own expenses, shows an inline error naming the offending key and leaves expenses, categories, rules, threshold, and totals unchanged
- Adding, editing, or deleting a recurring rule with an out-of-bounds field (empty name, non-positive amount, unknown category, or day of month outside 1 through 28) shows validation naming that field and does not add or change a rule
</edge_cases>

<visual_design>
- Mobile-app-style single-column layout capped at a readable width: a solid-color top bar (account name left, "‹ month/year ›" period control right), a scrollable content area, and a fixed bottom navigation bar with Dashboard / Expenses / Settings
- Dashboard: a summary card (Total budget, Total expenses, Total left as label/value rows) above a "Budgets by category" card; each category row shows its name and "left $X.XX" on one line and a filled progress bar with the "$spent / $limit" amount overlaid on the bar; over-budget rows use a distinct treatment from under-budget rows
- Dashboard chart card: the spending-breakdown chart sits with the summary and category cards, uses one consistent color per category, and labels or legends each category so segments are identifiable without interaction
- Expenses: a category filter control above a dense data table (Date, Counterparty, Category, Value, Actions with edit and delete controls per row); a circular floating action button in the bottom-right corner opens the add-expense dialog; when two or more rows are selected a bulk action tray appears with Bulk categorize and Bulk delete
- Add/Edit expense dialog: a modal dialog with Amount, Date, Category (select), and Counterparty fields and Cancel/Add(or Update) actions; invalid fields show inline error text beneath the field naming the field-contract problem (for example that the amount must be a positive number, or the date must be YYYY-MM-DD) rather than a bare Invalid
- Export drawer: format tabs for the Transactions CSV and the Budget report JSON, a monospaced preview block, a current-period / all-periods toggle for the CSV, Copy and Download actions, an Import JSON control, and an Import CSV control; Undo and Redo sit in the chrome near Export
- CSV import diagnostic screen: a per-row table with a valid/invalid status column, an inline error naming the failing field on invalid rows, Exclude and inline-fix controls per row, an imported-versus-skipped summary, and a Commit action, presented as a Material surface consistent with the Export drawer
- Bulk action tray: when two or more Expenses rows are selected, a tray shows the selected-row count with Bulk categorize and Bulk delete actions in the same Material card language as the dialogs and drawer; row selection checkboxes and a header select-all sit in the table
- Dashboard variance surface: each category row shows its budget limit, spent, and signed variance plus a projected end-of-period figure, and distinct "Projected overage" and "Over threshold" text labels (readable as text, not color alone) styled in the card language
- Settings: a three-tab layout (Account, Categories, Recurring); Account holds the display name and the spending threshold percent, Categories renders each category as a collapsible row that expands into an editable name field with Update/Delete actions plus an "Add new category" card, and Recurring lists rules with name, amount, category, and day of month and edit/delete controls; rule-generated rows in the Expenses table carry a distinct recurring badge or icon
- A single brand accent color (pink/magenta) used consistently for the top bar, the floating action button, active bottom-nav item, progress-bar fill, and primary buttons; light neutral surfaces elsewhere; cards with subtle elevation and rounded corners throughout
- One consistent icon style across the app: bottom-nav items, table row actions, dialog controls, and the floating action button all draw from the same icon set
</visual_design>

<motion>
- Buttons, bottom-nav items, table action icons, and dialog actions show a hover wash and a pressed/ripple feedback when actually hovered or clicked; hover feedback is required, not optional
- The add/edit expense dialog and its backdrop animate in and out rather than appearing or disappearing instantly
- The export drawer enters and exits with a short opacity and slide transition rather than snapping open or closed
- Adding an expense animates its new row into the Expenses table, and deleting an expense animates its row out, rather than the table snapping to the new state
- Snackbar confirmations (add, update, delete, bulk actions, export copy, import) slide in from the bottom edge and auto-dismiss after a short delay
- Budget progress bars animate their fill when the underlying spent amount changes (on add, edit, delete, or period change) rather than jumping instantly to the new value
- The spending-breakdown chart animates its segments to their new proportions when the underlying data changes rather than redrawing abruptly
- Settings category rows expand and collapse with a smooth height/opacity transition when toggled
- Switching between Dashboard, Expenses, and Settings swaps the main content without a full page reload; the active bottom-nav item is visually distinguished from the inactive ones
- The bulk action tray slides or fades in when the first two rows are selected and out when selection is cleared, rather than snapping into place
- The CSV import diagnostic screen animates in and out rather than appearing instantly, and a row's status updates with a brief transition when it is excluded or inline-fixed
- Projected overage and Over threshold labels fade or slide in when a category crosses the line and out when it crosses back, driven by the real spending or threshold change rather than a snap
</motion>

<responsiveness>
- The single-column layout stays centered and capped at a readable width on desktop viewports, with the top bar and bottom navigation spanning the app column rather than stretching content edge to edge
- At 375 pixel width every view fits without horizontal scrolling or clipped content, the bottom navigation remains fixed and tappable, and the Expenses table remains readable
- The add/edit expense dialog and the export drawer fit within the viewport at narrow widths with all fields and both actions reachable without content being cut off
- Undo, Redo, Export, and Import JSON controls remain fully visible and operable at 375 pixel width rather than rendering off-screen
- The bulk action tray, CSV import diagnostic table, recurring rule list and its form, and the Dashboard variance and projection figures remain fully visible and operable at 375 pixel width without horizontal scrolling or clipped controls
</responsiveness>

<accessibility>
- Every interactive control (bottom-nav items, period arrows, filter, table actions, dialog fields and buttons, settings controls, Export, Import JSON, Undo, Redo, bulk actions) is reachable and operable with the keyboard alone, with a visible focus indicator
- The add/edit expense dialog and the export drawer behave as modal overlays: focus moves into them when they open, stays trapped inside while open, closes on Escape, and returns to the triggering control when they close
- Validation and import errors are shown visually and associated with their fields so assistive technology announces which field is invalid
- Each budget progress bar exposes its spent-of-limit value as text, not through fill color alone; over-budget state is named in text, not color alone
- The active bottom-navigation item is distinguishable programmatically as well as visually
- Snackbar confirmations and Copied feedback are announced via a polite live region as well as shown visually
- The Expenses row selection checkboxes and the header select-all are reachable and operable with the keyboard alone, and the bulk action tray's selected-row count and its actions are focusable and announced when the tray appears
- CSV import and JSON export/import outcomes (the diagnostic summary, imported-versus-skipped counts, Copied confirmation, and import errors) are announced via a polite live region as well as shown visually
- Projected overage, Over threshold, and rule-generated states expose an accessible name or text and are not conveyed by color or icon alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (adding, editing, deleting expenses, bulk actions, switching periods and views, opening Export, importing, editing settings)
- Period switches, view switches, filter changes, and export preview regeneration update the visible content immediately, and the UI stays responsive under rapid repeated input with no hangs or dropped interactions
- Loading a Transactions CSV of roughly 200 rows into the diagnostic screen validates and renders the per-row table without freezing the UI, and scrolling, excluding, or inline-fixing rows stays responsive
</performance>

<writing>
- Primary actions use specific verbs (Add expense, Bulk delete, Export, Import JSON, Undo, Redo, Copy, Download) rather than generic Submit or OK when a specific label is possible
- Empty states explain what belongs in the region and how to add an expense or clear the filter
- Validation and import errors name the field and the problem (for example Amount must be a positive number) rather than only saying Invalid
- Snackbar confirmations state what happened (Expense added, Expense deleted, Copied) rather than vague affirmations
- The two export formats are named consistently as Transactions CSV and Budget report JSON wherever the drawer, tabs, and download filenames refer to them
- CSV import validation copy names the failing field and the fix (for example that the date must be YYYY-MM-DD, or that the category is unknown) rather than a bare Invalid, and the import summary states the imported and skipped counts
</writing>

<innovation>
Beyond the required budget tracker, reward a polished finance-ops touch that helps an operator trust the exportable artifact — for example a structured export summary strip naming expense count and Total expenses above the preview, or a compact last-mutation chip — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
- Use Angular, NgRx, Tailwind CSS 4.3.2 (pinned), and Angular Material; Angular Material provides the dialogs, data table, tabs, selects, snackbars, expansion panels, and progress bars, while Tailwind owns layout, spacing, and custom surfaces with design tokens defined in @theme
- No authentication wall — open directly into the primary workspace; there is no login or logout control
- Shared application state (expenses, categories, budget definitions, recurring rules, the spending threshold percent, the active reporting period, the active view, the category filter, row selection, undo/redo stacks, export drawer state, and the pending CSV import staging — the parsed rows and their per-row validity before Commit) lives in an NgRx store; view switches and period changes read and write that shared state, not a disconnected local copy, and the Dashboard summary, progress bars, variance, chart, and export previews all derive from that same store; rule-generated expense instances are derived from the rules and the viewed period, and the pending CSV import staging never enters the committed expense collection until Commit
- State contracts (behavioral): adding a valid expense increases its category's current-period total and progress by exactly its amount and appears in the Expenses table for that period; editing an expense recomputes both its old and new category's totals; deleting an expense decreases its category's current-period total and progress by exactly its amount and removes its row; changing the reporting period recomputes every derived total, progress bar, chart segment, and visible row set from that period's expenses only, never mixing periods
- Persist expenses, categories, budget definitions, recurring rules, the spending threshold percent, the reporting period, and the display name to localStorage (or equivalent client storage) so a reload restores the exact prior state, including any edits made in the session
- Seed at least 10 sample expenses spanning at least 2 reporting periods and at least 5 categories so the primary workflow (dashboard totals, expenses table, period switch) is non-empty and non-trivial on first load
- Render the Dashboard spending-breakdown chart with ngx-echarts, driven by the same store data as the totals and progress bars
- AutoAnimate and Angular animations are allowed for animation; no other animation libraries
- Material Symbols icons only, installed via npm; no other icon sets and no icon fonts or SVGs fetched at runtime
- All forms (add/edit expense, account display name, spending threshold, category management, recurring rule, and import commit) are built on Angular Reactive Forms and validate through a Zod schema layer that mirrors the expense, category, displayName, recurring rule, threshold, and BudgetDocument field contracts above: the schema defines the rules and inline per-field errors appear before submit; the record a valid form creates IS the would-be request body; Export and Import compile and validate against those same schemas; submitting the add/edit expense form with an empty or non-positive amount, a missing date, or no category must show visible validation feedback and must not add or change any row
- Transactions CSV parsing (header date,counterparty,category,value) and CSV export are implemented without any additional third-party library — parse, validate row-by-row against the expense field contract, and serialize in application code
- End-state contract: Export must produce schema-valid Budget report JSON (BudgetDocument with the required and extended keys: meta, totals, categories with variance/projected/overThreshold, recurringRules, expenses with the recurring marker, and settings) and a Transactions CSV that reflect every mutation made in the session and conform to the field contracts; Import JSON round-trips a contract-valid Budget report JSON (restoring expenses, categories, recurring rules, threshold, and display name) and refuses contract-invalid payloads without partial mutation; Import CSV stages parsed rows on a diagnostic screen and commits only valid rows, never mutating the store before Commit
- All libraries installed via npm and bundled locally; no CDN imports
- Keep the implementation frontend-only and self-contained; do not depend on a live backend, and do not fetch the app or its data from another origin
- package.json must define npm scripts named exactly start (serves the built app on port 3000) and verify:build (exits 0 when the Angular build succeeds)
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
- entity-collection-v1
- form-workflow-v1
- browse-query-v1
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
- Entity: expense
- Entity operations: create; select; update; delete
- Entity fields: value; datetime; categoryId; counterparty
- Form fields: amount; date; category
- Form operations: validate; submit; cancel; reset
- Destinations: dashboard; expenses; settings; export
- Filters: reporting-period; category
- Artifact operations: export; import; copy
- Export formats: csv; json
- Import modes: budget-json

Mechanics exclusions:
- Material dialog + snackbar + progress-bar fill + expansion-panel transitions stay Playwright-observed
- Raw file paths/blobs must not appear in WebMCP args; clipboard and download contents stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
