<summary>
Build a model marketplace routing monitor using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and Recharts.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Model catalog —
- The main panel displays a data table listing all discovered models with columns: model name, provider, context window, cost per 1k tokens input, cost per 1k tokens output, free/paid badge, and a pin control; all seeded models are reachable in the table (scrolling within the table container counts as reachable)
- A search input above the table filters the list to models whose name or provider contains the query as it is typed; clearing the field restores the full list exactly
- A provider filter select narrows the list to one provider; combining search and provider filter applies both constraints at once, and the visible row count reflects the combined result
- A horizontal row of suggestion chips sits above the table (at least 4 chips, such as popular provider names and the term free); clicking a chip fills the search input or applies the matching provider filter exactly as if the user had typed or selected it, and the table narrows accordingly; when the chip row overflows it scrolls horizontally without shifting the vertical layout
- A visible count near the table always states the number of models currently shown out of the total (for example 12 of 24 models) and updates with every search, filter, pin filter, or refresh change
- When search and filter combine to match zero models, the table region shows a designed empty state naming what was searched and a clear-filters control that restores the full list
- Each row's pin control toggles that model onto a routing watchlist; pinned models show a filled pin treatment in the name column, and a Pinned-only filter chip narrows the table to pinned models only

Feature: Free model alerts —
- Models currently available at zero cost display a green Free badge in the cost column and a star icon in the name column; paid models display a gray Paid badge
- A bell icon button in the toolbar opens a modal to configure free-model alerts; the modal contains a form with an alerts on/off toggle and a minimum context window field
- Alert field contract (observable): alerts enabled is a boolean; minimum context window is a required non-negative integer (0 or greater, whole numbers only). An invalid context window value shows an inline message naming the field before submit, and the save control stays disabled until the form is valid
- With alerts toggled on, whenever a model that meets the minimum context window transitions to free status during a simulated refresh or simulation event, a notification toast appears inside the app naming the model that became free, remains readable, and auto-dismisses; with alerts off no toast appears for the same transition

Feature: Cost tracker —
- A sidebar panel docked to the right shows total estimated session cost broken down by model; each row shows model name, requests made, and cost subtotal, and the panel header shows the session total and total request count
- A pie chart in the sidebar visualizes cost distribution by model; hovering a slice with the pointer shows a tooltip with that model's name and dollar amount
- The chart has a legend of contributing models; clicking a legend entry toggles that model's slice out of and back into the chart, and the remaining slices redraw to fill the circle
- Each cost row exposes a sources-style disclosure: a count trigger showing the number of usage events that contributed to that row; activating it opens a list of that model's contributing usage events (timestamp, request label, prompt tokens, completion tokens, cost), and each entry links to the model's row in the catalog table, highlighting it in-app without any outbound navigation

Feature: Session budget ceiling —
- A session budget control in the toolbar or cost sidebar sets a dollar ceiling for the session; the remaining budget (ceiling minus session total) is visible at all times and updates live as usage events arrive
- When the session total exceeds the ceiling, the remaining-budget readout switches to an over-budget treatment with a 2 pixel error-colored border and an Over budget label, and returns to normal when the ceiling is raised above the total or costs drop via undo
- Budget field contract (observable): session budget is a required number strictly greater than 0 with at most 2 decimal places and at most 100000; a zero, negative, non-numeric, or more-than-2-decimal value shows an inline message naming the budget field and leaves the previous ceiling in effect

Feature: Manual usage log —
- A Log usage control opens a modal form that appends one usage event to the shared stream using the same shape the feed, cost rollups, and export use
- Usage event field contract (observable, mirrors an inference usage API body): model is required and must exactly match a name currently in the catalog; request label is a required non-empty string of 1 to 80 characters; prompt tokens is a required integer greater than or equal to 0; completion tokens is a required integer greater than or equal to 0. Cost is computed from the selected model's catalog rates as (prompt tokens × input cost per 1k / 1000) + (completion tokens × output cost per 1k / 1000), shown as a read-only preview that updates when model or token fields change, and is written onto the event at submit — the user cannot override cost to a different number
- Submitting a valid log appends the event at the top of the event feed with timestamp, model, request label, prompt tokens, completion tokens, and cost; the affected model's request count and subtotal, the session total, the total request count, the pie chart, and the remaining-budget readout all recompute in the same interaction without a reload
- Invalid fields show inline messages naming each invalid field before submit; the submit control stays disabled until every field is valid; cancel closes without appending

Feature: Usage simulation —
- A simulation control in the toolbar starts and pauses a simulated usage event stream; while running, new usage events arrive every few seconds and appear at the top of a visible event feed with timestamp, model name, request label, prompt tokens, completion tokens, and cost
- As each simulated usage event arrives, the affected model's request count and cost subtotal, the session total, the total request count, the pie chart, and the remaining-budget readout all recompute live in the same interaction, without a reload
- Pausing the simulation freezes the feed and all totals at their current values; resuming continues appending events; the control's label and icon reflect the running or paused state at all times
- The event feed shows a visible loading affordance while the next event is pending during an active simulation, and a designed empty state before any events exist naming how to start the simulation or log usage

Feature: Model auto-discovery —
- A Refresh button in the toolbar triggers a simulated model list refresh with a brief visible loading affordance on the table; new models not previously in the list animate into the table; removed models are marked with a strikethrough and reduced emphasis for 5 seconds before being removed
- Each refresh changes the catalog in a visible way (at least one model added, removed, or flipped between free and paid), and the shown-of-total count updates to match
- A model removed by refresh while pinned is dropped from the watchlist; a model removed while selected for comparison is dropped from the selection

Feature: Model comparison —
- Selecting two or more model rows via row checkboxes enables a Compare control that is disabled with fewer than two selections; clicking it opens a modal with a side-by-side attribute comparison table showing name, provider, context window, input cost, output cost, free/paid state, and pinned state for every selected model
- Deselecting rows below two while the compare control is visible disables it again; closing the comparison modal returns to the table with selections intact

Feature: Undo and redo —
- Toolbar Undo and Redo controls apply to mutating edits: alert configuration saves, session budget changes, pin toggles, and successful manual usage logs; each control is disabled when there is nothing to undo or redo
- Undoing a manual usage log removes that event from the feed and restores the prior session total, per-model subtotals, pie chart, and remaining-budget readout exactly; Redo reapplies the undone step with the same completeness
- Performing a new mutating action after an undo clears the redo stack and disables Redo

Feature: Command palette —
- Pressing Command-K or Control-K opens a command palette overlay with a search field that fuzzy-matches at least the destinations model catalog, cost sidebar, event feed, alert settings, log usage, export panel, and the actions start simulation, pause simulation, refresh catalog, and export session
- Choosing a destination focuses or opens that surface and closes the palette; choosing an action runs it and closes the palette
- Escape closes the palette and returns focus to the control that had it; with no matches the palette shows a designed empty state naming what to type

Feature: Export routing session report (useful end state) —
- The app produces the operator's routing session files: an Export session control opens an export panel with two format tabs — Session JSON and Usage CSV — compiled LIVE from the current store
- Session JSON conforms to schema version routing-session-report-v1 and includes: exported_at as an ISO-8601 timestamp; catalog as an array of model records each with name, provider, context_window (positive integer), input_cost_per_1k, output_cost_per_1k, pricing_tier (exactly free or paid), and pinned (boolean); usage_events as an array of records each with timestamp (ISO-8601), model, request_label, prompt_tokens, completion_tokens, and cost; cost_rollups as an array of model, requests, and subtotal; session_total; total_requests; alert_config with alerts_enabled and min_context_window; session_budget_usd; compare_selected as an array of selected model names; pinned_models as an array of pinned model names
- Usage CSV is CSV-shaped text with a header line naming timestamp, model, request_label, prompt_tokens, completion_tokens, cost and one data line per usage event in the shared stream (seeded plus simulated plus manually logged)
- Export content must reflect every mutation the session made — a manual log, simulation event, pin toggle, alert save, budget change, or import that is visible in the UI must appear (or disappear) in the compiled export text before copy or download; an export that omits those session changes is incorrect
- Each tab shows a monospaced preview; Copy writes the visible preview text to the clipboard and shows a brief copied confirmation; Download starts a file download of that same preview text
- Import accepts a previously exported Session JSON that matches routing-session-report-v1: after a successful import the catalog pins, usage feed, cost rollups, session total, alert configuration, session budget, compare selection, and both export previews match the imported document; malformed JSON or a document missing required keys or violating field contracts shows an inline error naming the import field and leaves the session unchanged
</core_features>

<user_flows>
- Monitoring flow: start the simulation, watch at least two usage events arrive in the feed, and confirm the session total, the affected models' subtotals, the pie chart, and the remaining-budget readout all change together without a reload; pause the simulation and confirm totals freeze
- Filtering flow: type a provider fragment into search, then apply a provider filter, confirm both constraints combine and the shown-of-total count matches the visible rows, then clear both and confirm the full seeded list returns exactly
- Alert flow: enable alerts in the bell modal with a valid minimum context window, trigger a refresh or simulation event that flips a qualifying model to free, and confirm a toast names that model; disable alerts and confirm an equivalent transition produces no toast
- Comparison flow: select three models by checkbox, open Compare, confirm all three appear side by side with their catalog values including pinned state, close the modal, and confirm the three rows are still selected
- Drill-down flow: open a cost row's contributing-events list, activate one entry's model link, and confirm the catalog highlights that model's row in the same session without navigation
- Manual log to export: open Log usage, submit a valid event for a catalog model, confirm the feed, rollups, pie chart, and remaining budget update together, open Export session, and confirm Session JSON usage_events and Usage CSV both contain that request_label and cost
- Undo round trip: log a usage event, note the session total, Undo, confirm the event is gone and the total restores, Redo, confirm the event and total return
- Budget breach: lower the session budget below the current session total and confirm the Over budget treatment appears; raise it above the total and confirm the treatment clears
- Pin watchlist: pin two models, activate the Pinned-only chip, confirm only those two rows remain, and confirm Session JSON pinned_models lists both names
- Export then import round-trip: after mutating the session (manual log plus at least one pin), Copy or Download the Session JSON, then Import that same JSON — the feed labels, session total, pins, budget, and both export previews match the pre-export mutated state
- Command palette jump: open the palette with Control-K or Command-K, type enough to match Export session, choose it, and land on the export panel with the palette closed
- A page reload returns the app to its seeded state: the seeded catalog, seeded session usage, alerts off, default session budget, simulation paused, empty undo/redo stacks, and no import errors
</user_flows>

<edge_cases>
- Submitting the alert configuration form with a negative or non-numeric context window value shows an inline message naming the field and saves nothing
- Submitting Log usage with a model name absent from the catalog, an empty request label, or negative tokens shows inline messages naming each invalid field and appends nothing
- Submitting a session budget of 0, a negative number, or a value with more than 2 decimal places shows an inline message naming the budget field and leaves the prior ceiling unchanged
- Toggling a legend entry off for the model with the largest cost share redraws the chart from the remaining models rather than showing an empty or broken chart; toggling every model off shows a designed empty chart state
- Rapidly clicking Refresh twice runs a single coherent refresh: no duplicate rows appear and the shown-of-total count stays consistent with the visible rows
- A model removed by refresh while selected for comparison is dropped from the selection; the Compare control disables if fewer than two selections remain
- Importing malformed Session JSON or a document that omits schema_version routing-session-report-v1 or required arrays shows an inline error naming the import field, leaves the session total and feed unchanged, and does not clear undo history as if the import succeeded
- With Undo disabled (nothing to undo), activating Undo changes no session state; after one undo, Redo restores exactly the prior step
- Opening Export session before any in-session mutations still produces valid Session JSON and Usage CSV for the seeded catalog and seeded usage; the panel never shows an empty or broken region
- Double-activating a valid Log usage submit appends exactly one event
</edge_cases>

<visual_design>
- Full-width data table with a sticky header row that stays visible while the table body scrolls; sidebar panel docked to the right at 280 pixels on desktop
- Free badges render in green and paid badges in gray, visually consistent across the table, comparison modal, and cost sidebar
- The cost sidebar list uses structured rows with hairline dividers between entries; the session total row is visually heavier than per-model rows; the over-budget remaining readout uses the same error color family as Free/Paid contrast is not alone for state
- Pie chart slices use a consistent brand accent palette drawn from the app's design tokens, matching the accent colors used on badges and chips
- A clear type hierarchy: the app title is larger than panel headings, which are larger than table body and event feed text, consistent across all surfaces
- Spacing follows one consistent rhythm across the toolbar, table, chips row, and sidebar; no crowded or orphaned regions
- One consistent icon set is used across the toolbar, badges, feed, and disclosure triggers
- Interactive controls show distinct default, hover, focus (visible ring), and disabled treatments
- The export panel shows format tabs, a monospaced preview block, and Copy / Download / Import actions; currency values use one consistent format (dollar sign, two decimal places for totals, four for per-1k rates) across sidebar, feed, budget, and exports
</visual_design>

<motion>
- Hover animations (required): toolbar buttons and chips ease background and border on hover with a slight press effect; table rows take a full-width hover wash; form controls show focus rings
- New model rows animate in from opacity 0 over roughly 200 milliseconds on refresh; departing rows fade to reduced opacity, gain a strikethrough style, then collapse over 5 seconds
- New usage events slide into the top of the event feed rather than snapping, and existing entries shift down smoothly
- The alerts modal, log-usage modal, comparison modal, command palette, and export panel enter and exit with a short opacity and scale transition of roughly 200 to 300 milliseconds
- Notification toasts slide in, remain readable, and auto-dismiss with a fade
- The sources disclosure expands and collapses with a smooth height transition and a rotation cue on its chevron
- Pie chart slices animate when the distribution changes or a legend entry is toggled, rather than redrawing instantly
- With prefers-reduced-motion set, all transitions apply instantly and every surface remains fully usable
</motion>

<responsiveness>
- At desktop widths the sidebar is docked at 280 pixels; at widths of 768 pixels and below the sidebar collapses into a toggleable panel reachable from a toolbar control
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the data table scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — search, filter, chips, table checkboxes, pin controls, toolbar buttons, legend entries, disclosure triggers, Undo, Redo, Export, Log usage, command palette results — is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals, the command palette, and the export panel trap focus while open, close on Escape, and return focus to the control that opened them
- Alert toasts, new-event announcements, over-budget transitions, and successful import or copy confirmations are exposed through an aria-live polite region as well as shown visually
- Form fields in the alert modal, log-usage modal, budget control, and import control have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a running simulation, export regeneration, and import
- The table, feed, and chart stay responsive while the simulation is running; rapid repeated filtering during an active simulation causes no hangs or dropped interactions
- Opening Export session regenerates the JSON and CSV from live state without freezing the UI for more than a brief moment
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the model catalog with pin flags, search and filter state, row selection, alert configuration, the usage event stream, per-model cost rollups, chart legend toggles, disclosure open flags, simulation running state, session budget, undo/redo history, export panel open state and active format tab, and command palette open state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- A simulated or manually logged usage event appends to the one event stream, and the feed, per-model rows, session totals, pie chart, remaining-budget readout, and exports all derive from that same stream; no surface keeps a second disconnected copy
- A refresh mutates the one model collection, and the table, shown-of-total count, comparison selection, pin watchlist, and free-model alerting all derive from it
- Search, provider filter, chips, and the pinned-only filter recompute the visible list from the shared catalog
- Legend toggles, disclosure open state, selection, simulation running state, export panel state, and command palette state are shared client state; changing them never reloads the document
- Undo and redo replay the same store commands the visible controls use, and every derived surface follows
- A page reload returns the app to its seeded state: the seeded catalog, seeded session usage, alerts off, default session budget, simulation paused, and empty undo/redo stacks
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for the data table, modals, notifications, tags, structured lists, and form controls; no other component library. Recharts for the cost chart; no other charting library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons via @carbon/icons-react only — no raw copy-pasted SVG icon sets. All forms — the alert configuration form, the log-usage form, the session budget control, and the import control — are driven by React Hook Form validating through a Zod schema: the schema defines the field contracts above (required fields, bounds, enums free|paid and pricing_tier, cross-field model-must-exist-in-catalog, derived cost) and inline per-field errors render before submit. Catalog records, usage events, alert configuration, session budget, and both export formats conform to those same schemas so field names and enums match between the table, the forms, the feed, and the export. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; model data, refreshes, and cost tracking are fully simulated in memory.
- Seed at least 20 models from at least 5 providers on first load with at least 4 marked as currently free and at least 2 pre-pinned
- Seed session usage so the cost sidebar opens non-empty: at least 6 usage events across at least 3 models, each carrying prompt_tokens and completion_tokens, with the pie chart rendering their distribution
- Seed a default session budget strictly above the seeded session total so the remaining-budget readout opens without the Over budget treatment
- The simulated refresh and the usage simulation must each produce visibly different results across repeated triggers, never an identical hardcoded outcome every time
- Zero navigational outbound links for app chrome; all navigation and panel changes go through shared client state
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
- command-session-v1
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
- Browsable entity: models
- Destinations: model-catalog; cost-sidebar; event-feed; alert-settings-modal; comparison-modal; log-usage-modal; export-panel; command-palette
- Filters: provider; search; free; pinned
- Entity: model
- Entity operations: create; select; update; toggle
- Entity fields: compare-selected; legend-visible; events-disclosure-open; pinned; alerts-enabled; min-context-window; model; request-label; prompt-tokens; completion-tokens; session-budget-usd
- Value bounds: min-context-window >= 0 integer; request-label 1..80 chars; prompt-tokens >= 0 integer; completion-tokens >= 0 integer; session-budget-usd > 0 max 2 decimals max 100000; pricing_tier in {free, paid}
- Session operations: start; pause; resume; trigger_demo
- Demos: usage-simulation; catalog-refresh
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: replace
- Workflow completion: shown-of-total-count
- Workflow completion: session-total
- Workflow completion: per-model-subtotals
- Workflow completion: session-budget-remaining
- Workflow completion: export-preview-text
- Workflow completion: pinned-count

Mechanics exclusions:
- Pie-chart slice hover tooltip stays Playwright-only (computed while hovering)
- Toast slide-in/auto-dismiss timing and event-feed slide-in animations stay Playwright-observed
- Refresh row enter/strikethrough-collapse animations stay Playwright-observed; refresh state change itself goes through session trigger_demo
- Streaming feed pacing (events every few seconds) is observed live, never batched via WebMCP
- Command-palette open animation and clipboard contents after Copy stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
