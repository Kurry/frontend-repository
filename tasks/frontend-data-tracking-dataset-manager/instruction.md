<summary>
Build a dataset manager for an AI evaluation workspace using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System. The app produces the operator's dataset package files — Rows CSV and Dataset Package JSON compiled live from the selected dataset — so session work leaves with the user.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Dataset collection (API-shaped create payload) —
- The left sidebar lists the seeded datasets (at least 3 on first load); each entry shows the dataset name, its live row count, and a created date; clicking an entry loads that dataset's rows into the main grid and the entry shows a visibly selected treatment
- Clicking New Dataset opens a modal dialog whose submit produces a would-be dataset-create API body and must conform to this field contract (all keys required unless marked optional; example values illustrative only): name is a non-empty string of 1 to 80 characters after trim; description is optional and when present is a string of at most 500 characters; schema is a non-empty array of schema-field objects
- Schema-field field contract (each schema row IS one would-be schema-field record): name is a non-empty string of 1 to 40 characters matching letters, digits, and underscores only; type is exactly one of text, number, or category; allowedValues is required when type is category and must be a non-empty array of unique non-empty strings each at most 40 characters, and must be an empty array when type is text or number; schema field names must be unique within the dataset case-insensitively
- The modal presents name, description, and a repeating schema-field editor (field name, type select, and — when category is chosen — the allowed-values list); Submit stays disabled until every required field satisfies the field contracts above; the saved schema is the dataset's record contract, and every later row mutation validates against it
- Submitting a valid New Dataset form closes the modal, adds exactly one entry to the sidebar with a row count of 0, and selects the new dataset; the created record's name, description, and schema match the submitted payload
- Submitting with an empty name, a schema field name outside the allowed pattern, a category field with an empty allowedValues list, duplicate schema field names, or a description longer than 500 characters shows an inline validation message naming the offending field and adds no entry

Feature: Virtualized data grid (API-shaped row payload) —
- The flagship seeded dataset contains at least 500 rows; the grid renders through virtualization so only a window of rows exists in the DOM at once, and scrolling from the first row to the last is smooth with no blank flashes or dropped frames
- The grid shows one column per schema field, an expected output column, a verified column, and a split column; a header row labels every column
- Row record field contract (Add Row, Edit Row, and inline cell commits produce would-be row API bodies; all keys required unless marked optional; example values illustrative only): values is an object whose keys are exactly the dataset's schema field names; each text field value is a string of at most 2000 characters; each number field value is a finite number; each category field value is exactly one string from that field's allowedValues; expectedOutput is a string of at most 4000 characters (empty string allowed); verified is a boolean; split is optional and when present is exactly one of train, validation, or test
- Double-clicking a cell opens an inline editor in place; pressing Enter commits the new value only when it satisfies the row record field contract and the change is reflected everywhere that value feeds (stats, flags, pivot, export); pressing Escape cancels and restores the prior value
- Committing a cell value that violates the field contract — non-numeric text in a number field, a value outside a category field's allowed list, or text longer than the bound — is rejected with an inline error naming the field and the violated rule, and the prior value stays in place; the same contract validation applies in the Add Row and Edit Row forms
- Clicking Add Row opens a modal with one input per schema field plus an expected output textarea; a valid submit appends a row matching the field contract, increments the sidebar row count by one, and the new row is reachable in the grid
- Clicking a row's Edit action opens the same modal pre-filled; saving updates that row in place without a reload under the same field contract
- Clicking a row's Delete action opens a confirmation dialog; confirming removes the row and decrements the sidebar row count by one; canceling leaves the row intact

Feature: CSV import with mapping and diagnostics —
- An Import CSV control above the grid opens an import wizard; the wizard's source step offers a file picker accepting .csv files, a drag-and-drop dropzone that accepts a dropped .csv file with a visible drag-over treatment, and a paste tab where raw CSV text can be pasted; at least 2 seeded sample CSV fixtures can also be chosen directly inside the wizard
- After a source is provided, the mapping step shows a table with one row per detected CSV column: the column header name, a preview of its first values, and a select assigning it to a schema field, to the expected output, or to Ignore; columns whose header matches a schema field name arrive pre-assigned to that field
- The mapping step's Continue control stays disabled until at least one CSV column is assigned to a schema field or the expected output; an inline message explains what is missing
- Confirming the mapping opens the diagnostic step: a row-by-row review where every incoming row appears with its mapped cells, cells that violate the record contract — non-numeric text mapped to a number field, a value outside a category field's allowed list, or an empty cell for a required mapping — are individually highlighted with a message naming the field and the violated rule, exactly as an ingestion API would report them
- Each flagged cell in the diagnostic step can be edited in place; fixing a cell clears its highlight immediately, and a summary line showing the ready-row count and the unresolved-issue count updates as fixes are made
- Each diagnostic row has an Exclude toggle; excluded rows are skipped at commit and the ready count updates; the Commit control stays disabled while any included row still has an unresolved issue
- Activating Commit imports every included row: the sidebar row count increases by exactly the committed row count, the imported rows appear in the grid immediately, and a success toast states the exact committed row count

Feature: Ground truth tagging —
- Each row has a Verified toggle; toggled-on rows render a checkmark icon in the verified column and toggled-off rows render a dash icon; a Verified count badge in the panel header shows the exact verified-row count for the dataset and updates immediately on every toggle
- A Show unverified only filter above the grid hides verified rows; turning it off restores the full set exactly

Feature: Formula bar —
- A formula input above the grid evaluates =SUM(column), =AVERAGE(column), =MIN(column), =MAX(column), and =COUNT(column) over a named numeric column, with an optional row range such as =SUM(score, 1:100); submitting shows the computed result next to the input
- The displayed formula result recomputes when the data it reads changes: editing a cell inside the evaluated column changes the shown result without re-entering the formula
- Submitting an invalid formula (unknown function, unknown column, or a numeric function over a text column) shows an inline error naming the problem and no result value

Feature: Threshold alerts (API-shaped create payload) —
- A threshold rules panel lists the active rules and lets the user add a rule whose submit IS the would-be threshold-rule API body and must conform to this field contract: column is a required non-empty string naming an existing numeric schema field; comparator is exactly one of above or below; cap is a required finite number. All three are required with inline validation naming the offending field
- Rows breaching any active rule show a flagged treatment on the offending cell and a flag icon on the row; a Flagged count badge shows the exact count of rows that currently breach any rule
- Editing a cell across a rule's cap adds or clears that row's flag immediately, and deleting a rule clears every flag it caused

Feature: Duplicate detection and merge —
- A Scan for duplicates control runs a visible scan decomposed into named stages (scanning rows, grouping matches, done); each stage shows a status that advances from pending through running to complete, with an overall progress indicator
- The scan result lists duplicate groups — rows whose input field values are identical — with the member rows shown side by side; the seeded flagship dataset contains at least 2 such groups so a first scan finds them
- Opening a group's Merge flow lets the user pick the surviving value per column where members differ; confirming merges the group into one row, the dataset row count decreases by the group size minus one, and the group leaves the result list
- A group's Not duplicates action dismisses that group without changing any rows

Feature: Pivot builder —
- A Pivot view toggle switches the main area to a pivot builder: every schema column appears as a draggable chip, and Rows, Columns, and Values buckets accept dropped chips; the Values bucket carries an aggregation select (count, sum, average)
- Dropping or removing a chip recomputes the pivot table immediately; with two chips in the Rows bucket the table shows nested row summaries grouped by the first field then the second
- The pivot derives from live data: returning to the grid, editing a cell that feeds the pivot, and reopening the pivot shows changed summary values

Feature: Snapshots and diff (API-shaped create payload) —
- A Save Snapshot control captures the dataset's current rows; the submitted record IS the would-be snapshot-create API body and must conform to this field contract: name is a required non-empty string of 1 to 80 characters after trim, unique among the dataset's snapshots case-insensitively. An empty or duplicate name shows an inline message naming the name field and saves nothing; a valid save stores the rows under that name with a timestamp and the dataset's snapshot list shows every saved snapshot
- Selecting two snapshots opens a row-level diff: rows present only in the newer snapshot are marked added, rows present only in the older are marked removed, and rows whose cells changed show each changed cell with its old and new value side by side
- The diff derives from the actual snapshot contents: taking a snapshot, editing one cell, taking a second snapshot, and diffing the two shows exactly that one changed cell

Feature: Split management (API-shaped apply payload) —
- A Splits panel provides train, validation, and test percentage inputs; the submitted apply payload must conform to this field contract: train, validation, and test are each integers from 0 to 100 inclusive and the three must sum to exactly 100. The form shows an inline validation error naming the percentages when they do not sum to 100 and the Apply control stays disabled
- Applying a valid split assigns every row a split label shown in the grid's split column, and a segmented proportion bar shows the actual assigned distribution across the three splits
- A stratification readout under the bar shows, for each split, its verified and unverified row counts; adding, deleting, or re-splitting rows updates the bar and the readout

Feature: Bulk mutation tray —
- Each grid row has a selection checkbox and the header has a select-all-visible checkbox; selecting at least one row raises a bulk action tray showing the live selected count
- The tray offers Mark verified, Mark unverified, Assign split (with a split select), and Delete (with a confirmation dialog); applying an action updates every selected row and all derived counts, then clears the selection
- Changing the selection while the tray is open updates its count immediately

Feature: Undo and redo —
- Toolbar Undo and Redo controls, plus Ctrl+Z and Ctrl+Shift+Z, step backward and forward through cell edits, row additions and deletions, merges, bulk actions, committed CSV imports, and successful Import package operations
- Undo restores the exact prior values including every derived surface (row counts, verified badge, flags, splits, export previews); redo reapplies them; both controls are disabled when their stack is empty

Feature: Export and import dataset package (useful end state; API-shaped payload) —
- The app PRODUCES the operator's dataset package: an Export control opens a drawer with two tabs compiled LIVE from the store — Rows CSV and Dataset Package JSON — plus Copy, Download, and Import package controls
- The Rows tab shows CSV-shaped text of the currently visible rows (a header line plus one line per row covering every schema field plus expectedOutput, verified, and split) honoring the active unverified-only filter
- Dataset Package JSON is API-shaped like a dataset-service package response — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract (all top-level keys REQUIRED unless marked optional; example values illustrative only):
  - schemaVersion: required string, exactly dataset-manager.package/v1
  - generatedAt: required ISO-8601 datetime string that updates whenever the package is regenerated
  - dataset: required object with id (non-empty string), name (1 to 80 characters), description (string at most 500 characters, empty string allowed), createdAt (ISO-8601 datetime), schema (non-empty array of schema-field records matching the schema-field field contract above), rows (array of row records matching the row record field contract above, including verified and split), thresholdRules (array of objects each requiring column, comparator in {above, below}, and numeric cap), snapshots (array of objects each requiring name, createdAt ISO-8601 datetime, and rows array), splitPercentages (object with train, validation, and test integers that sum to 100), and attachedSuiteId (string or null)
  - stats: required object with totalRows (non-negative integer equal to dataset.rows.length), verifiedCount (non-negative integer), flaggedCount (non-negative integer), numericSummaries (array of objects each requiring field, min, max, and mean for every numeric schema field), splitDistribution (object with train, validation, and test counts), and snapshotCount (non-negative integer equal to dataset.snapshots.length)
- Cross-field rules: every row.values key set equals the schema field names; every category value is inside its field's allowedValues; every thresholdRules.column names a numeric schema field; stats.totalRows equals dataset.rows.length; stats.verifiedCount equals the count of rows with verified true; stats.snapshotCount equals dataset.snapshots.length; splitPercentages sum to 100
- Both tabs derive from live state: editing a cell, toggling verified, applying a split, saving a snapshot, or toggling the unverified-only filter and reopening the drawer changes the exported text; an export that omits session mutations or that violates the Dataset Package JSON field contract is incomplete; the open JSON preview must still show every required top-level key
- A Copy control places the visible export text on the clipboard and shows a visible confirmation; Download offers the visible tab as a file — rows.csv for the Rows tab and dataset-package.json for the Dataset Package JSON tab
- An Import package control accepts pasted or file-picked Dataset Package JSON matching the export field contract; a valid import replaces the selected dataset's schema, rows, threshold rules, snapshots, split percentages, and attached suite so the sidebar count, grid, badges, panels, and a subsequent export match the imported package; malformed JSON or a document that fails the field contract (schemaVersion not exactly dataset-manager.package/v1, missing dataset or stats, schema field type outside text|number|category, category allowedValues empty, row values breaking the row contract, splitPercentages not summing to 100, or stats.totalRows disagreeing with dataset.rows.length) shows visible validation naming the offending field and changes nothing

Feature: Capacity instrumentation —
- An instrumentation panel shows a workspace capacity gauge: total rows and an estimated size across all datasets against a displayed mock capacity, plus a per-dataset breakdown of rows and estimated size
- Importing, adding, or deleting rows updates the gauge and the breakdown immediately

Feature: Attach to eval suite —
- A Use in Eval Suite control in the panel header opens a select modal listing the seeded eval suites (at least 3); confirming attaches the dataset to the chosen suite, shows a success toast naming the suite, and renders the attached suite as a chip on the dataset header; the chip's remove affordance detaches it
</core_features>

<user_flows>
- Import pipeline end to end: choosing a seeded sample CSV, adjusting one column's mapping, fixing a flagged cell in the diagnostic step, excluding one bad row, and committing raises the sidebar row count by exactly the included row count, shows the new rows in the grid, grows the capacity gauge, changes the pivot's summaries, and changes both export tabs — all without a reload
- Edit ripple: editing a numeric cell through the inline grid editor updates the formula bar result that reads that column, adds or clears a threshold flag when the value crosses a cap, changes the Dataset Package JSON stats for that column, and appears as a changed cell in a diff against a snapshot taken before the edit
- Dedup round trip: running the duplicate scan surfaces the seeded groups; merging one group decreases the row count by the group size minus one and re-running the scan no longer lists that group
- Bulk then undo: selecting 5 rows and applying Mark verified raises the Verified badge by exactly the number newly verified; a single Undo restores every one of those rows and the badge to their prior values
- Split coherence: applying an 80/10/10 split labels every row, the proportion bar and stratification readout match the grid's split column, and deleting rows updates both
- Export after mutations: add a row with a distinctive expectedOutput token, toggle it verified, save a uniquely named snapshot, open Export, and confirm Dataset Package JSON shows schemaVersion exactly dataset-manager.package/v1, contains that expectedOutput under dataset.rows, shows verifiedCount reflecting the toggle, lists the new snapshot name, and keeps every required top-level key; Copy places that JSON on the clipboard; Download offers dataset-package.json
- Import package round trip: after the export-after-mutations steps, note the package JSON, make a further cell edit so the live state differs, Import the earlier package, and confirm the grid, verified badge, snapshot list, and a fresh export return to the imported package's contents; importing JSON with schemaVersion other than dataset-manager.package/v1 leaves state unchanged and shows a named-field error
- Sorting or filtering never mutates data: toggling Show unverified only and back restores the identical full row set
- A page reload returns the app to its seeded state: the seeded datasets and row counts, no snapshots beyond the seeded ones, no threshold rules beyond the seeded ones, and an empty undo history
</user_flows>

<edge_cases>
- Deleting every row of a dataset shows an empty state in the grid region naming the dataset and offering Add Row and Import CSV controls
- Enabling Show unverified only when every row is verified shows an empty-filter message with a control that clears the filter
- Double-activating the Add Row Submit control appends exactly one row; double-activating Commit in the import wizard imports the rows exactly once
- A cell value longer than 80 characters renders truncated with an ellipsis in the grid and is shown in full in the inline editor and the row Edit modal
- Running the duplicate scan when no duplicates exist completes the stages and shows an empty result message rather than a blank region
- Submitting split percentages that do not sum to 100 keeps Apply disabled and shows a message naming the required total
- Pasting CSV text with no parseable rows shows an inline wizard error and the mapping step is not offered
- The formula bar given a numeric function over a category column shows an error naming the column's type rather than a result
- Submitting New Dataset with a schema field name containing spaces or punctuation, a category field with empty allowedValues, or a description longer than 500 characters shows inline validation naming the field and creates no dataset
- Submitting Add Row with non-numeric text in a number field, a category value outside allowedValues, or expectedOutput longer than 4000 characters shows inline validation naming the field and appends no row
- Saving a snapshot with an empty name or a duplicate name shows inline validation naming the name field and adds no snapshot
- Importing malformed Dataset Package JSON, or parseable JSON that fails the field contract (wrong schemaVersion, missing dataset or stats, type outside text|number|category, stats.totalRows disagreeing with rows.length), leaves the selected dataset unchanged and shows validation naming the offending field
- Opening Export before any in-session edits still produces Dataset Package JSON for the selected seeded dataset with schemaVersion dataset-manager.package/v1 and every required top-level key; the drawer never shows an empty or broken region
</edge_cases>

<visual_design>
- Layout: a left sidebar with the dataset list above the instrumentation panel, a main area with a toolbar (import, export, pivot toggle, undo/redo, formula bar) above the grid, and side panels for thresholds, splits, and snapshots reachable from the toolbar
- The active dataset entry in the sidebar uses a visibly selected layer background distinct from hover; inactive entries show the hover wash only while hovered
- Verified rows show a checkmark icon in the success color in the verified column; unverified rows show a dash icon in the secondary text color; the two states are distinguishable by icon shape, not color alone
- Cells flagged by a threshold rule carry a warning-tinted background and the row carries a flag icon; diagnostic-step problem cells use the error color with the message adjacent
- Diff coloring: added rows carry a green-tinted treatment, removed rows a red-tinted treatment, and changed cells show old and new values with the old value struck through
- The mapping step renders as a table with one select per CSV column row; pre-assigned matches show their assignment already selected
- The grid is dense and legible: fixed header row, consistent row height, right-aligned numeric cells, and column headers visually distinct from data cells
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than grid body and label text, consistent across views
- Spacing follows a consistent rhythm across the sidebar, toolbar, grid, and panels, with no crowded or orphaned regions
- Buttons, inputs, selects, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the toolbar, sidebar, row actions, and status indicators
- The export drawer shows tabs labeled Rows CSV and Dataset Package JSON, a monospaced preview block, and Copy, Download, and Import package actions
</visual_design>

<motion>
- Imported rows animate into the grid in batches of 10, each batch fading in over roughly 100 milliseconds, driven by the real Commit control
- A newly added single row slides in from opacity 0 over roughly 200 milliseconds
- Modals (New Dataset, Add Row, Edit Row, merge, attach) enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- The bulk action tray slides up when the first row is selected and slides away when the selection clears
- The export drawer and the threshold, splits, and snapshot panels slide in from the side rather than snapping open
- The verified toggle animates its state change with a short tick transition; a newly flagged threshold cell transitions its background rather than snapping
- The duplicate-scan stage indicators animate their status changes, and the running stage shows continuous activity
- The capacity gauge animates toward its new value when rows change rather than jumping
- Hover animations (required): buttons ease background and shadow with a slight press effect; sidebar entries, grid rows, and panel list items take a full-width hover wash; form controls show focus rings
- Feedback toasts after CSV import, package import, merge, bulk apply, attach, and copy slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, all rows and batches appear instantly and every transition applies immediately
</motion>

<responsiveness>
- At widths of 768 pixels and below, the sidebar collapses behind a toggle control that opens it as an overlay; at desktop widths the sidebar is open by default
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the grid, mapping table, and diff scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — sidebar entries, toolbar controls, grid cells and row actions, wizard steps, panel forms, tray actions — is reachable and operable with the keyboard alone, with a visible focus indicator; a focused cell opens its inline editor with Enter and cancels with Escape
- Modals and the export drawer trap focus while open, close on Escape, and return focus to the control that opened them
- Import commit completion, bulk apply results, and merge completion are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Verified, flagged, and split states are conveyed by icon or text in addition to color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Scrolling the 500-row flagship dataset end to end stays smooth with no hangs, and the UI stays responsive under rapid repeated input — quick dataset switches, fast toggles, rapid undo/redo — with no dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the datasets collection with rows and schemas, the selected dataset, grid selection and inline-edit state, the import wizard's source, mapping, and diagnostic state, verified flags, the unverified-only filter, formula input and result, threshold rules and derived flags, duplicate-scan stages and groups, pivot bucket assignments and aggregation, snapshots and diff selection, split percentages and assignments, the undo/redo history, export drawer state including Dataset Package JSON and Rows CSV previews, capacity totals, eval-suite attachments, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a dataset adds it to the sidebar and the capacity breakdown under the dataset-create field contract; deleting rows updates the sidebar count, the gauge, and every derived surface
- Editing a cell updates that value everywhere it appears or feeds: the grid, formula results, threshold flags, pivot summaries, Dataset Package JSON stats, and both export tabs
- The verified filter, pivot, diff, and both export tabs recompute from the shared collection; they never operate on a second disconnected copy
- Undo and redo operate on the same shared state the visible controls mutate, restoring derived counts exactly
- The import wizard commits through the same append logic as Add Row under the row record field contract, so committed rows behave identically to manually added rows
- Dataset Package JSON export and a successful Import package round-trip through the same field contract; import rejection leaves shared state untouched
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, data tables, tags, toolbar controls, notifications, toggles, and form controls; no other component library. Papa Parse for CSV parsing. TanStack Virtual for grid virtualization and TanStack Table allowed for grid structure. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — New Dataset, Add Row, Edit Row, threshold rules, splits, snapshot name, attach, and Import package — are driven by React Hook Form validating through a Zod schema that mirrors the field contracts above: the schema defines the rules and inline per-field errors render before submit. The record a successful create produces IS the would-be request body for that contract; Dataset Package JSON export and a successful import conform to the same field names, enums, bounds, and cross-field rules. Each dataset's record contract is itself schema-shaped: per-field types, required rules, and category allowed-values are enforced identically wherever rows enter the system — the Add Row and Edit Row forms, inline cell editing, and the import diagnostics — and every violation message names the field and the violated rule. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; import sources, scan results, and all data are client-side.
- Seed at least 3 datasets: one flagship with at least 500 rows including at least 2 duplicate groups and a mix of text, number, and category fields conforming to the field contracts, and the others with at least 20 rows each; roughly half of each dataset's rows verified; seed at least 2 sample CSV fixtures selectable in the import wizard, at least 1 snapshot on the flagship dataset, at least 1 threshold rule, and at least 3 eval suites
- Submitting any form with invalid required fields must not mutate the collection; show visible validation feedback naming the offending field
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- End-state contract: Export must produce Rows CSV and Dataset Package JSON that contain the session's actual rows, schema, verified flags, threshold rules, snapshots, splits, and stats under schemaVersion dataset-manager.package/v1, with Copy and Download; an export that omits session mutations or fails the field contract is invalid. Importing a previously exported conforming package MUST restore the same visible dataset state (round-trip); Import MUST reject non-conforming JSON without mutating the current session
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
- Entity: dataset-row
- Entity operations: create; select; update; delete; toggle
- Entity fields: schema-field-values; expected-output; verified; split; bulk-selection; unverified-only-filter; merge-surviving-values; dismiss-duplicate-group; pivot-rows-bucket; pivot-columns-bucket; pivot-values-bucket; pivot-aggregation; snapshot-selection; eval-suite-attachment
- Form fields: dataset-name; dataset-description; schema-field-editor (name, type, allowed-values); add-row-fields; edit-row-fields; threshold-rule (column, comparator, cap); split-percentages (train, validation, test); snapshot-name; attach-suite-select; formula-input
- Form operations: validate; submit; cancel; reset; advance; return
- Workflow steps: import-source; import-mapping; import-diagnostics; import-commit
- Session operations: start
- Demos: duplicate-scan
- Artifact operations: import; export; copy
- Import modes: sample-csv-fixture; pasted-csv
- Export formats: rows-csv; dataset-card-text
- Value bounds: schema field type in {text, number, category}; category fields require an allowed-values list; cell commits validate against the dataset's record contract everywhere rows enter (grid inline edit, Add Row, Edit Row, import diagnostics); threshold comparator in {above, below} with a numeric cap; all three rule fields required; split percentages must sum to 100; split label in {train, validation, test}; formula in {SUM, AVERAGE, MIN, MAX, COUNT} over a named numeric column, optional row range like 1:100; pivot aggregation in {count, sum, average}; row delete, bulk delete, and dataset delete require confirm=true
- Workflow completion: committing an import raises the sidebar row count by exactly the included row count, shows the rows in the grid, grows the capacity gauge, and changes the pivot and both export tabs
- Workflow completion: editing a numeric cell recomputes the formula result, adds or clears threshold flags across the cap, updates the dataset card stats, and appears as a changed cell in a snapshot diff
- Workflow completion: the duplicate scan advances scanning-rows, grouping-matches, done stages and lists the seeded groups; merging one shrinks the row count by group size minus one and re-scanning omits it
- Workflow completion: toggling verified updates the Verified badge immediately; the unverified-only filter hides and restores rows without mutating data
- Workflow completion: applying a valid split labels every row, and the proportion bar and stratification readout match the grid's split column
- Workflow completion: attaching an eval suite renders the suite chip on the dataset header and its remove affordance detaches it

Mechanics exclusions:
- The file picker and drag-and-drop CSV dropzone (drag-over treatment) are Playwright responsibilities; WebMCP import uses the seeded fixtures or pasted-CSV modes and never carries raw file bytes
- Virtualized-grid scroll smoothness across the 500-row flagship dataset (windowed DOM, no blank flashes) stays Playwright-observed
- Pivot chip drag-into-bucket gesture fidelity stays Playwright-observed; bucket assignment as state goes through the pivot bindings
- Undo/redo Ctrl+Z / Ctrl+Shift+Z and inline-cell Enter/Escape keyboard mechanics are graded through the real controls via Playwright
- Import batch fade-in, bulk-tray slide, capacity-gauge animation, scan-stage activity, modal/drawer transitions, and toasts stay Playwright-observed
- Clipboard contents of the export Copy control are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
