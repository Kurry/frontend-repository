<summary>
Build a frontend-only wealth portfolio dashboard using React 19 with Next.js static-export or client-hydration delivery, React state and Context, Tailwind CSS 4.3.2, and shadcn/ui; the app opens directly on a portfolio overview with a net-worth summary, an allocation breakdown, a holdings table, a transactions ledger, and a detail panel, with no login, signup, or onboarding gate.
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

Feature: Portfolio overview —
- The first screen is the portfolio overview: a net-worth summary, an allocation breakdown, a holdings table, a selected-holding detail panel, and a transactions ledger region, reachable at the root URL with no login, signup, or onboarding gate.
- The holdings table lists the seeded holdings, each row showing name, symbol, asset class, quantity, currency, and market value. Seed at least four holdings across the classes Equity, ETF, Cash, and Crypto so the workspace is non-empty on first load.
- The net-worth summary shows a total that equals the sum of the market values of the currently visible holdings, plus a meta line reporting the count of visible holdings and the count of visible asset classes.
- The allocation breakdown renders one entry per asset class present in the visible holdings, each with a proportional bar and a percentage; the percentages shown for the visible classes sum to 100 percent of the visible total.

Feature: Holding field contract (API-shaped position payload) —
- A holding record is the would-be portfolio position payload. Creating or editing a holding requires every field in this contract, and a saved holding shows those same fields in the table and detail panel:
- name: required non-empty text, at most 80 characters
- symbol: required non-empty ticker text of 1 to 12 characters using letters, digits, period, or hyphen only
- asset class: required enum exactly one of Equity, ETF, Cash, Crypto
- quantity: required number strictly greater than 0
- unit price: required number greater than or equal to 0
- currency: required enum exactly one of USD, EUR, CHF
- data source: required enum exactly one of MANUAL, YAHOO, COINGECKO
- market value is derived as quantity times unit price and is never an independent editable input; every surface that shows market value uses that product, including a live market-value readout on the Add and Edit forms that updates as quantity and unit price change
- Cross-field rule: when asset class is Cash, symbol must be the same three-letter code as currency; when asset class is Crypto, data source must be COINGECKO or MANUAL; when asset class is Equity or ETF, data source must be YAHOO or MANUAL

Feature: Filter and sort —
- A class filter control narrows the holdings to a single asset class. Filtering recomputes the table, the net-worth total, the meta line, and the allocation percentages over the visible set. Clearing the filter restores the full list of holdings with no duplicates.
- Activating a sortable column header on the holdings table orders the rows by that column; activating the same header again reverses the order, and a visible indicator on the header shows the active sort column and direction.

Feature: Selection and detail —
- Selecting a holding marks it as selected in the table and shows its name, symbol, class, quantity, unit price, currency, data source, and market value in the detail panel. Selecting a different holding fully replaces every field in the detail panel with no stale values from the previous selection.

Feature: Add, edit, and delete holdings —
- An Add holding control opens a form with name, symbol, class, quantity, unit price, currency, and data source. Each field shows a persistent visible label, and the submit control stays disabled until every field is valid against the holding field contract.
- Typing an invalid value shows an inline validation message directly at that field, naming the field and the rule it breaks, before the form is submitted. Saving with an empty name or symbol, a non-positive quantity, a currency outside USD/EUR/CHF, a data source outside MANUAL/YAHOO/COINGECKO, or a broken cross-field rule is blocked with an inline message and adds no holding.
- Saving a valid holding appends it to the table; the net worth, the meta line, and the allocation percentages all update together.
- Editing the selected holding through the form and saving updates that row everywhere it appears and recomputes the totals and allocation. A delete control removes the selected holding from the table, the selection, and the derived totals.

Feature: Transactions ledger (API-shaped activity payload) —
- The overview includes a transactions ledger listing seeded activities. Seed at least four activities so the ledger is non-empty on first load.
- An activity record is the would-be import activity payload. Creating an activity requires every field in this contract, and a saved activity shows those same fields in the ledger:
- currency: required enum exactly one of USD, EUR, CHF
- data source: required enum exactly one of MANUAL, YAHOO, COINGECKO
- date: required ISO-8601 datetime string ending with Z (example shape 2021-09-15T00:00:00.000Z)
- fee: required number greater than or equal to 0
- quantity: required number strictly greater than 0
- symbol: required non-empty ticker text of 1 to 12 characters using letters, digits, period, or hyphen only
- type: required enum exactly one of BUY, SELL, DIVIDEND, FEE, INTEREST, LIABILITY
- unit price: required number greater than or equal to 0
- comment: optional text at most 200 characters
- Cross-field rules: FEE and INTEREST types require unit price to be 0; SELL quantity must not exceed the current holding quantity for that symbol when a matching holding exists; DIVIDEND quantity may be any positive number
- An Add activity control opens a form with those fields (comment optional). Invalid values show inline messages naming the field and rule; submit stays disabled until valid. Saving a valid BUY activity for a symbol that already has a holding increases that holding quantity by the activity quantity and recomputes market value and net worth; saving a valid BUY for a new symbol creates a holding row using the activity symbol, quantity, unit price, currency, and data source with a name defaulting to the symbol and an asset class the user can edit afterward; saving a valid SELL decreases the matching holding quantity or removes the holding when quantity reaches zero
- A type filter on the ledger narrows visible activities to one activity type; clearing it restores the full ledger with no duplicates

Feature: Undo —
- An Undo control reverses the most recent mutating action among holding create/edit/delete, activity create, and successful import, restoring the prior holdings, activities, selection, net worth, and allocation
- Undo shows enabled and disabled states that match whether a step is available

Feature: Portfolio export and import (useful end state) —
- The app produces the operator portfolio files: an Export portfolio control opens an export drawer with three format tabs — Portfolio JSON, Holdings CSV, and Activities CSV — compiled LIVE from the current store
- Portfolio JSON is a single object with keys meta, holdings, and activities. meta includes exportedAt as an ISO-8601 datetime string ending with Z and holdingCount and activityCount as non-negative integers matching the collections. holdings is an array of holding payloads using exactly the holding field contract keys name, symbol, assetClass, quantity, unitPrice, currency, dataSource, and marketValue. activities is an array of activity payloads using exactly the activity field contract keys currency, dataSource, date, fee, quantity, symbol, type, unitPrice, and comment (comment may be an empty string)
- Holdings CSV is CSV-shaped text with a header line naming name,symbol,assetClass,quantity,unitPrice,currency,dataSource,marketValue and one data line per holding in the current collection
- Activities CSV is CSV-shaped text with a header line naming currency,dataSource,date,fee,quantity,symbol,type,unitPrice,comment and one data line per activity in the current collection
- Export content must reflect every mutation the session made — a create, edit, delete, activity save, or import that is visible in the UI must appear or disappear in the compiled export text before copy or download; an export that omits session work is incorrect
- Each tab shows a monospaced preview; Copy writes the visible preview text to the clipboard and shows a brief copied confirmation; Download starts a file download of that same preview text
- Import accepts a previously exported Portfolio JSON, Holdings CSV, or Activities CSV. After a successful Portfolio JSON import the holdings table, transactions ledger, net worth, allocation, and all three export previews match the imported collections. After a successful Holdings CSV import only holdings and derived totals update. After a successful Activities CSV import only activities update. Malformed input or a payload that breaks the field contracts shows an inline error naming the import field and leaves the collections unchanged
</core_features>

<user_flows>
- After saving a new valid holding, the table row count increases by exactly one, the net-worth total increases by exactly the new holding's market value, the meta line's holding count increments, the allocation breakdown recomputes its percentages, and the Portfolio JSON and Holdings CSV export previews include the new holding, all in place without a reload.
- Filtering to one class, adding a holding in a different class, then returning to all classes leaves both the prior and the new holdings identifiable exactly once each, with no duplicates, and the totals and allocation recompute over the full set.
- Editing the selected holding's quantity updates the table row, the detail panel, the net-worth total, that class's allocation percentage, and the Holdings CSV and Portfolio JSON previews together without a reload; the changed market value equals the new quantity times the unit price everywhere it appears.
- Deleting the selected holding decreases the row count by exactly one, clears it from the detail panel and the selection, removes its contribution from the net-worth total and the allocation breakdown, and removes it from both holding export previews.
- Sorting the holdings by market value in one direction and then the other reverses the row order, and the net-worth total and allocation percentages stay unchanged by sorting alone.
- Adding a holding and then reloading the page restores the same holdings, the same activities, the same updated net-worth total, and the new row from client storage, with no login step.
- Saving a valid BUY activity for an existing symbol increases that holding's quantity and market value, appends one ledger row, updates net worth and allocation, and includes the new activity in the Portfolio JSON and Activities CSV previews without a reload.
- Export then import round-trip: after mutating holdings or activities, Copy or Download the Portfolio JSON, then Import that same JSON — the holdings names and quantities, activity symbols and types, net-worth total, and all three export previews match the pre-export mutated state.
- Undo after adding a holding or activity restores the prior collections, net worth, and export previews in one step.
</user_flows>

<edge_cases>
- Deleting the last remaining holding shows an empty state in the table region with a message and an Add holding control, the net-worth total reads zero, and the allocation region shows no class entries; export previews still compile with empty holdings.
- When the active class filter matches no holdings, the table region shows an empty-state message, the meta line reports zero visible holdings, and the allocation region shows no entries.
- Double-activating the save control creates exactly one holding: the row count increases by one and one new row appears.
- A holding name longer than 40 characters is truncated with an ellipsis in its table row and shown in full in the detail panel.
- Saving a holding that breaks a cross-field rule (Cash symbol not matching currency, Crypto with YAHOO data source, or Equity with COINGECKO data source) shows an inline validation message and adds no holding.
- Saving an activity with type FEE or INTEREST and a non-zero unit price is blocked with an inline message naming unit price.
- Saving a SELL whose quantity exceeds the matching holding quantity is blocked with an inline message naming quantity and leaves holdings unchanged.
- Importing malformed Portfolio JSON, Holdings CSV, or Activities CSV shows an inline error naming the import field, leaves holdings and activities unchanged, and does not clear undo history as if the import succeeded.
- When the transactions ledger is empty, the ledger region shows an empty-state message and an Add activity control; export previews still compile with empty activities.
- With an empty holdings collection, Export portfolio still produces Holdings CSV with only the header line and Portfolio JSON with an empty holdings array; Copy still shows a copied confirmation.
</edge_cases>

<visual_design>
- Calm wealth-dashboard composition on a light, slightly green-tinted background: a top brand bar, a full-width net-worth summary card, then a two-column grid of a holdings card and a selected-holding detail card, with the transactions ledger and export entry points below or beside the holdings card.
- Primary visual emphasis on the net-worth figure and the holdings table; the brand mark, subtitle, and section eyebrow labels stay secondary.
- White cards with generous padding, a large radius, hairline borders, and a soft shadow. A single teal accent hue carries the brand mark, primary buttons, selection highlight, and allocation bars over a neutral base; a red family is reserved for destructive and error states.
- The Add holding control is grouped inside the holdings card directly above the form and the table it affects. The form uses persistent, visible field labels above each input rather than placeholder-only fields.
- Holdings rows align name, symbol, class, quantity, currency, and value into consistent columns; quantity and value read as tabular numerals.
- The allocation breakdown lists class name, a proportional bar, and a right-aligned percentage per class.
- The export drawer shows format tabs, a monospaced preview block, and Copy / Download actions; the transactions ledger uses the same card language as holdings.
- Typography uses distinct roles: a large weighted net-worth figure and card titles, regular body text in the table, and small uppercase eyebrow labels for section headers.
- Icons come from one consistent icon set across the app: the brand bar, buttons, empty states, and the sort indicator share the same visual icon family at consistent sizes.
</visual_design>

<motion>
- Buttons show an immediate pressed feedback on pointer-down and a hover change in background; every interactive control shows a clearly visible focus ring that differs from its hover treatment.
- Table rows take a hover wash; the selected row is marked by more than color alone, with a teal left border in addition to the tint.
- A newly saved holding's row animates into the table rather than appearing instantly, and a deleted holding's row animates out; the remaining rows settle into place smoothly.
- Selecting, adding, editing, or deleting a holding updates the summary, allocation, table, and detail panel in place with no full page reload, and the net-worth figure transitions smoothly to its new value rather than snapping.
- Saving or deleting a holding raises a brief confirmation toast that animates in, remains readable, and dismisses with a fade.
- The class filter updates the visible holdings, totals, and allocation immediately on change without a reload, and the allocation bars animate to their new proportions.
- The export drawer slides in from the side rather than snapping open; Copy confirmation feedback appears without a full page reload.
- With prefers-reduced-motion set, animations are removed and every state change applies instantly with no loss of functionality.
</motion>

<responsiveness>
- At a narrow width around 375 pixels the two-column grid collapses to a single column and the summary stacks, with no clipped text, no overlapping controls, and no horizontal page scrolling; the holdings table and transactions ledger scroll within their own regions when needed.
- At desktop widths around 1440 pixels the holdings card and the detail card sit side by side with the net-worth summary spanning the full width above them.
- The export drawer, Undo control, and Add activity control stay fully visible and operable at 375 pixel width rather than rendering off-screen.
</responsiveness>

<accessibility>
- A core flow can be completed with the keyboard alone: fields are reachable by Tab, the form submits on Enter, and table rows can be selected with Enter or Space while focused.
- The selected table row exposes its selected state to assistive technology, not only through its visual styling.
- A visually hidden live region announces added, updated, and removed holdings and activities.
- Inline validation messages are programmatically associated with their fields and announced when they appear, as well as shown visually.
- Every interactive control shows a visible focus indicator when focused from the keyboard.
- The export drawer closes on Escape and returns focus to the control that opened it; the drawer traps focus while open.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- Loading the root URL directly renders the complete overview with no hydration warnings or errors in the console and no visible content flash or layout jump after first paint.
- No console errors or warnings appear during a full exercise of adding, editing, filtering, sorting, selecting, and deleting holdings, saving activities, and opening export.
- The UI stays responsive under rapid repeated input, with no hangs or dropped interactions.
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app.
- Validation and error messages name the field and the fix; empty states explain what belongs in the region and how to add it.
- Export and import copy names the format (Portfolio JSON, Holdings CSV, Activities CSV) rather than a vague file label.
- No placeholder or filler text appears anywhere in the shipped UI.
</writing>

<innovation>
- Beyond the required portfolio dashboard, reward a polished wealth-ops touch that helps an operator trust the exportable artifact — for example a structured export summary strip naming holding count, activity count, and net worth above the preview, or a compact last-mutation chip — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
- Use React 19 with Next.js pinned to static export or client-hydration delivery: all interactivity lives in client state after load, with no server loaders, server actions, or API routes. Use React state and Context for shared application state and Tailwind CSS 4.3.2 for styling, with design tokens defined in the theme layer.
- Use shadcn/ui components for the app chrome: buttons, inputs, selects, table chrome, drawer, and toasts. No other component library.
- Use Recharts for the allocation visualization and TanStack Table to drive the holdings table's sorting.
- Motion for React is allowed for animation; no other animation libraries.
- Phosphor icons via the React package only; no other icon sets and no ad-hoc pasted SVG icon collections.
- All forms validate through a React Hook Form + Zod schema: the holding schema and the activity schema define the field contracts above, and inline per-field errors appear before submit with the submit control disabled until the form is valid. The record a form creates is the would-be request body; Portfolio JSON, Holdings CSV, and Activities CSV export and import conform to those same schemas.
- Papa Parse is allowed for CSV import parsing. All libraries are installed via npm and bundled locally; no CDN imports for scripts, styles, fonts, or icons.
- No authentication wall: open directly into the portfolio overview.
- Seed at least four holdings across Equity, ETF, Cash, and Crypto and at least four activities so the primary workflow is non-empty on first load.
- The net-worth total must equal the sum of the market values of the visible holdings, and market value must equal quantity times unit price. The allocation percentages for the visible classes must sum to 100 percent.
- All shared state — the holdings collection, the activities collection, the class filter, the activity type filter, the sort state, the selection, undo history, export drawer state, and form-driven domain state — lives in one shared store; filtering, sorting, adding, editing, deleting, activity saves, undo, and import recompute the visible holdings, the totals, the allocation, and the export previews from that one store rather than a second disconnected copy.
- Persist the holdings and activities in localStorage or an equivalent client storage so a reload restores the current holdings, activities, and the updated net-worth total with no login step.
- Empty name or symbol, a non-positive quantity, an invalid enum, or a broken cross-field rule must block the save, show an inline message at the affected field, and add no holding or activity.
- Keep the implementation frontend-only and self-contained: no live backend, no authentication, and no navigational outbound links for app chrome.
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
- Destinations: portfolio-overview; activities; export-drawer
- Filters: asset-class; activity-type
- Entity: holding
- Entity operations: create; select; update; delete
- Entity fields: name; symbol; asset-class; quantity; unit-price; currency; data-source
- Value bounds: name required max 80 chars; symbol 1-12 letters digits period or hyphen; asset-class in {Equity, ETF, Cash, Crypto}; currency in {USD, EUR, CHF}; data-source in {MANUAL, YAHOO, COINGECKO}; quantity positive number; unit-price non-negative number
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: portfolio-json; holdings-csv; activities-csv
- Workflow completion: export drawer preview updates after create/edit/delete/activity-save and holdings/activities arrays match live tables
- Workflow completion: importing portfolio-json replaces holdings table, activities ledger, net-worth total, and allocation to match the imported document

Mechanics exclusions:
- Allocation bars and hover feedback stay Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Clipboard contents of Copy are verified via Playwright, never returned in WebMCP results
- Activity create/edit form gestures stay Playwright-observed; WebMCP entity bindings cover holdings

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
