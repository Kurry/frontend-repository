<summary>
Build a cost analytics dashboard for an AI inference platform using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and Recharts.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Spend overview strip —
- The top row shows four KPI tiles: total spend this month, spend today, projected month-end spend, and remaining budget against the monthly cap; each tile shows a trend arrow comparing against the previous period
- A budget cap input in the header sets the monthly cap; when projected spend exceeds the cap, the remaining-budget tile switches to an error treatment with a 2 pixel error-colored border and an over-budget label, and returns to normal when the cap is raised above the projection
- When compare mode is on, each KPI tile also shows a delta chip with the signed percentage change versus the previous period of equal length
- Monthly budget-cap request-body field contract (a successful Save IS the would-be request body; all keys required unless marked optional; example values illustrative only): capUsd is a number greater than 0 with at most 2 decimal places; note is optional and when present is a string of at most 200 characters. Cross-field: capUsd less than or equal to 0 keeps Save disabled with an inline validation message naming the capUsd field, and the previous cap remains in effect

Feature: Spend over time —
- A line chart shows cumulative daily spend for the selected range; hovering a point with the real pointer shows a tooltip with the date and exact dollar amount
- A date-range picker above the chart selects custom start and end dates; the chart re-renders to only the selected range, and an invalid range (end before start) shows an inline validation message and does not apply
- Date-range request-body field contract (Apply IS the would-be request body; all keys required): from and to are ISO calendar dates YYYY-MM-DD. Cross-field: when to is before from, Apply stays disabled with an inline message naming the range, and the previously applied range remains in effect
- A period-compare toggle overlays the previous period of equal length as a second, visually distinct series, and delta chips appear on the KPI tiles while it is on

Feature: Dimension breakdown chart —
- A breakdown bar chart plots per-day spend split by a selectable dimension — model, feature, team — with one color series per member and a legend mapping series to names
- A stacked/grouped toggle switches the same data between stacked bars and grouped side-by-side bars without changing totals
- Clicking a legend entry toggles that series off and on; a toggled-off series is removed from the bars and its legend entry takes a muted treatment
- Clicking a bar segment drills down: the event table below filters to exactly that day and dimension member, and an applied-filter chip describing the drill-down appears above the table with a control to clear it

Feature: Team budgets and burn rate —
- A team budget panel lists each seeded team with its monthly ceiling, spend to date, a burn-rate projection bar showing projected month-end spend against the ceiling, and an overage highlight in the error treatment when the projection exceeds the ceiling
- A radial budget-attainment wheel renders one ring per team showing percent of ceiling consumed; rings animate to their value and the wheel's legend maps rings to teams
- Editing a team's ceiling in the panel immediately re-renders that team's projection bar, overage state, and wheel ring
- Team-ceiling request-body field contract (a successful Save IS the would-be request body; all keys required): team is exactly one seeded team name; ceilingUsd is a number greater than 0 with at most 2 decimal places. Cross-field: when a save would make the sum of all team ceilings exceed the monthly capUsd, an inline message names the excess amount and the edit is not saved; ceilingUsd less than or equal to 0 is rejected with a named field error and the previous ceiling stays in effect

Feature: Anomaly flags —
- Days whose spend exceeds twice the trailing 7-day average are flagged: the spend chart marks them with a distinct anomaly marker and an anomaly list panel names each flagged day with its spend and the percentage above trend
- Each anomaly entry has an explanation disclosure, collapsed by default, that expands to list the top contributing events (model, team, and cost) for that day; a View events control applies that day as a table filter and scrolls to the filtered event table

Feature: Event table drill-down —
- A virtualized event table lists every seeded usage event with columns: timestamp, model, feature, team, prompt tokens, completion tokens, cost, and tag; with at least 1,000 seeded events the table scrolls smoothly, rendering only visible rows
- Usage-event field contract (API-shaped record; all keys required unless marked optional; example values illustrative only): timestamp is an ISO-8601 datetime string ending in Z; model is exactly one of aurora-70b, quasar-mini, helix-2, cobalt-8b, meridian-pro; feature is exactly one seeded feature; team is exactly one seeded team; promptTokens and completionTokens are non-negative integers; cost is a number greater than or equal to 0 with at most 6 decimal places; tag is a string of at most 40 characters. Every seeded row and every exported event row matches this contract
- Clicking any column header sorts ascending; clicking again sorts descending, reversing the order relative to ascending
- Row checkboxes and a select-all control select events; a bulk action bar appears with the selection count and Recategorize controls for team and feature
- Recategorize request-body field contract (Apply IS the would-be request body): team is optional and when present is exactly one seeded team; feature is optional and when present is exactly one seeded feature; at least one of team or feature must be present. The Recategorize selects offer only those closed sets so an edit can never assign a value outside them; Apply with neither field set stays disabled with a named error
- Applying a bulk recategorization updates every selected event and immediately re-aggregates the KPI tiles, both charts, the team budget panel, and the anomaly list to reflect the change
- Applied filters (drill-down, anomaly day, saved view) render as removable chips above the table; removing a chip restores the wider dataset everywhere

Feature: Undo and redo —
- Toolbar Undo and Redo controls apply to state edits: bulk recategorizations, budget ceiling edits, saved-view changes, and report-schedule changes; each control is disabled when there is nothing to undo or redo
- Undoing a bulk recategorization restores every affected event's prior tags, and the charts, KPI tiles, and budget panel return to their exact prior values

Feature: Saved views —
- A Save view control captures the current filters, breakdown dimension, and date range under a required name; saved views list in a menu, applying one restores exactly that combination, and a delete action removes it after confirmation
- Saved-view request-body field contract (a successful Save IS the would-be request body; all keys required): name is a trimmed string of 2 to 60 characters; dimension is exactly one of model, team, or feature; range is an object with from and to as ISO calendar dates YYYY-MM-DD where from is less than or equal to to. Cross-field: empty or too-short name, a dimension outside the closed set, or from after to keeps Save disabled with inline messages naming the offending fields; no saved-view entry is created

Feature: Unit-cost explorer and what-if repricing —
- A unit-cost panel lists the 5 seeded models — aurora-70b, quasar-mini, helix-2, cobalt-8b, and meridian-pro — each with its cost per 1,000 tokens
- Each model has a what-if rate slider; dragging it reprices history live — the KPI tiles, both charts, the budget panel, and the event table costs recompute from the adjusted rate as the slider moves — and a what-if active indicator appears
- A Revert control restores all rates to their originals, and every derived number returns exactly to its pre-what-if value
- A cost estimator box accepts sample text; as the user types, it shows a live estimated token count and the estimated cost for each of the 5 models at current rates, updating per keystroke

Feature: Formula box —
- A formula input above the event table accepts expressions of the form =SUM(cost), =AVG(cost), =COUNT(), =SUM(prompt_tokens), and =SUM(completion_tokens), evaluated over the currently filtered events, and renders the result with its label
- Changing the active filters re-evaluates the formula result against the new filtered set
- An unrecognized formula shows an inline error naming the accepted forms and renders no result

Feature: Capacity gauge —
- A records gauge in the header shows the number of stored records (usage events plus saved views plus generated report snapshots) against a simulated capacity of 2,000, with a proportional fill; generating a report or saving a view visibly moves the gauge

Feature: Scheduled reports —
- A report schedule form sets a frequency (daily, weekly, monthly) and which sections to include (totals, per-dimension tables, anomalies); saving shows the active schedule summary
- Report-schedule request-body field contract (a successful Save IS the would-be request body; all keys required): frequency is exactly one of daily, weekly, or monthly; sections is a non-empty array whose members are drawn only from totals, per-dimension-tables, and anomalies with no duplicates. Cross-field: an empty sections array or a frequency outside the closed set keeps Save disabled with an inline message naming the field, and no schedule is saved
- A Run schedule now control simulates the trigger: it generates a report snapshot listed in a report history with its generation timestamp, and opening a snapshot shows totals that match the live dashboard at the moment of generation
- Submitting the schedule form with no sections selected shows an inline validation message and does not save

Feature: Export cost report (useful end state) —
- Download JSON and Download CSV controls, plus a Copy control on the JSON body, compile LIVE from the session store a cost report of the user's analytics work product. End-state contract: every export MUST reflect session recategorizations, team-ceiling edits, monthly-cap edits, active filters, and active what-if rates exactly as the dashboard shows — an export that omits session work is invalid
- Cost-report JSON field contract (Download JSON and Copy share this schema; all keys and nesting required unless marked optional; example values illustrative only): {"schemaVersion":1,"generatedAt":"","filters":{"from":"","to":"","dimension":"model","team":null,"feature":null,"compare":false},"totals":{"cost":0,"promptTokens":0,"completionTokens":0,"eventCount":0},"byModel":[{"name":"","cost":0,"share":0}],"byTeam":[{"name":"","cost":0,"share":0}],"byFeature":[{"name":"","cost":0,"share":0}],"anomalies":[{"date":"","spend":0,"percentAboveTrend":0}],"events":[{"timestamp":"","model":"","feature":"","team":"","promptTokens":0,"completionTokens":0,"cost":0,"tag":""}],"budget":{"capUsd":0,"projectedMonthEnd":0,"remainingUsd":0},"teamCeilings":[{"team":"","ceilingUsd":0,"spendToDate":0,"projectedMonthEnd":0}]}. schemaVersion is the number exactly 1; generatedAt is an ISO-8601 datetime ending in Z; filters.from and filters.to are ISO calendar dates; filters.dimension is exactly model, team, or feature; filters.team and filters.feature are null or a seeded member; filters.compare is a boolean; totals match the live KPI and filtered table; byModel, byTeam, and byFeature use the same seeded names the dashboard renders; each events item matches the usage-event field contract; budget and teamCeilings mirror the live cap and panel
- Download CSV is a tabular projection of the events array with header timestamp,model,feature,team,promptTokens,completionTokens,cost,tag and one data row per exported event using those exact column names
- Download JSON offers a real file download named cost-analytics-report.json whose body matches the JSON field contract. Download CSV offers cost-analytics-report.csv. Copy puts the JSON text on the clipboard and shows a visible Copied confirmation
- After a bulk recategorization that moves events between two teams, a fresh Download JSON shows those teams' costs shifted in byTeam and the mutated team values inside events; after an active what-if rate change, totals.cost matches the repriced dashboard
</core_features>

<user_flows>
- Recategorization ripple: selecting events from one team, bulk-recategorizing them to another team, and watching the KPI tiles, breakdown chart, team budget panel, anomaly list, and formula result all shift consistently — then Undo returns every one of those surfaces to its exact prior value
- What-if round trip: dragging a model's rate slider changes the KPI totals, chart heights, and table costs live; Revert restores every derived number exactly; exporting during an active what-if produces totals matching the repriced dashboard
- Drill-down to export: clicking a bar segment filters the table, the formula result recomputes for the filtered set, and the exported report's filters object names the applied drill-down with filtered-consistent tables and events
- Anomaly investigation: expanding an anomaly's explanation lists its top contributing events, and View events shows exactly those events in the table
- Saved-view round trip: configuring a drill-down plus dimension plus range, saving a valid saved-view request body, clearing everything, then applying the saved view restores the same charts and table state
- Export field-contract flow: after recategorizing selected events and editing a team ceiling, Download JSON produces schemaVersion 1 with generatedAt ending in Z, events rows matching the usage-event field contract, byTeam reflecting the recategorization, teamCeilings reflecting the edited ceiling, and Download CSV carries the same event rows under the header timestamp,model,feature,team,promptTokens,completionTokens,cost,tag; Copy shows Copied
- Invalid request-body flow: submitting a zero capUsd, a team ceiling that exceeds the monthly cap, a saved-view with a one-character name, a schedule with empty sections, or a date range with to before from shows named inline errors and creates or applies nothing
- A page reload returns the app to its seeded state: seeded events, original rates and ceilings, no saved views, no report snapshots, and the default range
</user_flows>

<edge_cases>
- Toggling off every series in the breakdown chart shows an empty-chart message rather than a blank plot region
- A filter combination matching zero events shows an empty state in the table region with a control to clear filters, and the formula box shows a zero-events result rather than an error
- Setting the budget cap to a value below current spend shows the over-budget treatment immediately
- Double-activating Run schedule now generates exactly one report snapshot
- The bulk action bar disappears when the selection is emptied, and select-all across a filtered table selects only the filtered events
- Deleting a saved view that is currently applied keeps the current filters active but removes the view from the menu
- Invalid request bodies are rejected with no state change: capUsd of 0 or negative, ceilingUsd of 0 or negative, a ceiling save whose sum would exceed monthly capUsd, a saved-view name shorter than 2 characters, a schedule with empty sections, a recategorize Apply with neither team nor feature, and a date range with to before from each show a named inline error and leave prior state intact
- With a zero-event filter scope, Download JSON still produces schemaVersion 1, totals with eventCount 0 and cost 0, empty or zero-share dimension tables as appropriate, and an empty events array; Download CSV still carries the header row
</edge_cases>

<visual_design>
- Layout: a header with the app title, budget cap input, capacity gauge, and undo/redo controls; a KPI strip below it; the spend chart and breakdown chart in a main chart region; the team budget panel and anomaly list alongside; and the event table with its formula box and filter chips below
- KPI tiles show a bold numeric value, a label, and a 16 pixel trend arrow icon; the over-budget tile carries the 2 pixel error border and an over-budget label
- Chart series use one consistent categorical palette with the same member-to-color mapping in the breakdown chart legend, the team budget wheel, and the delta chips; the compare-mode overlay series is visually distinct from the primary series
- Anomaly markers and overage highlights use the same error color family, distinct from the categorical series palette
- Currency values render with one consistent format (dollar sign, two decimal places for totals, four for unit rates) across tiles, charts, tables, and exports
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than table body and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the KPI strip, charts, panels, and table are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, sliders, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the header, tiles, panel controls, and row actions
</visual_design>

<motion>
- KPI values count up from zero to their current value over roughly 600 milliseconds on first render
- Chart lines and bars grow from zero over roughly 500 milliseconds on initial render, driven by the real page load and range changes
- The radial attainment rings sweep to their percentage when the wheel first renders and animate to new values when a ceiling or recategorization changes them
- Dragging a what-if slider animates the dependent numbers and bars smoothly rather than snapping once on release
- The anomaly explanation disclosure expands and collapses with a smooth height transition and a rotating chevron cue
- Filter chips animate in when applied and out when removed; the bulk action bar slides in when a selection starts
- The capacity gauge fill eases to its new value when a report or view is added
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows, legend entries, and anomaly entries take a full-width hover wash; form controls show focus rings
- Modals and the schedule form enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way; feedback toasts after exports, recategorizations, and report generation slide in and auto-dismiss with a fade
- With prefers-reduced-motion set, count-ups, chart growth, ring sweeps, and transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the chart region stacks vertically and the team budget panel and anomaly list move below the charts; the header controls collapse into a menu
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the event table scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — tiles, range picker, legend entries, sliders, table headers, row checkboxes, bulk actions, disclosures, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator; the what-if sliders are adjustable with arrow keys
- Modals and menus trap focus while open, close on Escape, and return focus to the control that opened them
- Crossing the budget cap, completing a bulk recategorization, and generating a report are announced through an aria-live region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Series, anomaly, and over-budget distinctions are carried by more than color alone (labels, icons, or patterns accompany the color)
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Scrolling the 1,000-plus-row event table, dragging a what-if slider, and typing in the estimator stay smooth with no hangs or dropped frames
- Rapid repeated input — quick dimension switches, rapid legend toggling, fast chip removal — causes no freezes or dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the usage-event collection and tags, model rates and what-if overrides, team ceilings, the budget cap, the selected range and compare mode, breakdown dimension and series toggles, applied filters and drill-downs, saved views, anomaly computations' inputs, the formula expression, selection state, report schedules and snapshots, the undo/redo history, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Every derived surface — KPI tiles, both charts, the budget panel, the wheel, the anomaly list, the formula result, the gauge, and exports — recomputes from the one shared event collection and rate table; no surface holds a disconnected copy
- A bulk recategorization updates the events once and every derived surface follows without a reload
- What-if rate changes reprice all derived costs live and Revert restores originals exactly
- Undo and redo replay the same store commands the visible controls use, and every derived surface follows
- Filters, sorts, saved views, and series toggles recompute what is visible from shared state; toggling them does not reload the document
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — tiles, data tables, tags/chips, modals, notifications, sliders, and form controls; no other component library. Recharts for the spend, breakdown, and radial charts. date-fns for date arithmetic and formatting. TanStack Virtual for the virtualized event table. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the budget-cap, date-range, team-ceiling, save-view, report-schedule, and recategorize forms — are driven by React Hook Form validating through Zod schemas that mirror the request-body field contracts above; the record a form creates or updates IS the would-be request body, and inline per-field errors render before submit with submit disabled until valid. Cost-report JSON and CSV export conform to those same schemas and the usage-event field contract so field names and enums match between the table, the forms, and the export. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; all usage data is seeded.
- Seed at least 90 days of usage events totaling at least 1,000 events across the 5 models named aurora-70b, quasar-mini, helix-2, cobalt-8b, and meridian-pro, at least 4 teams, and at least 5 features, including at least 2 days that qualify as anomalies under the twice-trailing-7-day-average rule
- Seed per-team monthly ceilings and per-model rates so the budget panel, wheel, and unit-cost explorer are non-empty on first load
- Submitting the save-view or schedule forms with missing required fields must not create an entry; show visible validation feedback
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- Browsable entity: usage-events
- Destinations: spend-overview; spend-over-time; dimension-breakdown; team-budgets; anomaly-list; event-table; unit-cost-explorer; report-history
- Filters: date-range; breakdown-dimension; series-toggle; drill-down-chip; anomaly-day; saved-view; period-compare-toggle
- Sorts: timestamp; model; feature; team; prompt-tokens; completion-tokens; cost
- Entity: usage-event
- Entity operations: select; update; create; delete
- Entity fields: team; feature; tag; team-ceiling; what-if-rate; budget-cap; saved-view-name; formula-expression; report-frequency; report-sections
- Value bounds: model in {aurora-70b, quasar-mini, helix-2, cobalt-8b, meridian-pro}; recategorization team and feature only from the seeded closed sets the events carry; prompt tokens and completion tokens non-negative integers; budget cap must be positive; zero or negative rejected inline and the previous cap stays in effect; a team-ceiling save is rejected with the excess amount named when the sum of ceilings would exceed the monthly cap; date range end must not precede start; breakdown dimension in {model, feature, team}; formula in {=SUM(cost), =AVG(cost), =COUNT(), =SUM(prompt_tokens), =SUM(completion_tokens)}; report-frequency in {daily, weekly, monthly}; report-sections a non-empty subset of {totals, per-dimension-tables, anomalies}; saved-view name required; delete requires confirm=true
- Session operations: trigger_demo
- Demos: run-schedule-now
- Artifact operations: export
- Export formats: cost-report-json; cost-report-csv
- Workflow completion: a bulk recategorization updates every selected event and re-aggregates KPI tiles, both charts, the team budget panel, anomaly list, and formula result in one pass; Undo returns each surface to its exact prior value
- Workflow completion: a what-if rate change reprices KPI tiles, chart heights, table costs, and the estimator live with a what-if active indicator; Revert restores every derived number exactly
- Workflow completion: editing a team ceiling re-renders its projection bar, overage state, and attainment ring immediately
- Workflow completion: run-schedule-now appends exactly one report snapshot to report history whose totals match the live dashboard at generation, and the capacity gauge fill advances
- Workflow completion: applying a saved view restores exactly its captured filters, dimension, and range; deleting an applied view keeps the filters active
- Workflow completion: cost-report-json serializes each event with exactly timestamp, model, feature, team, prompt tokens, completion tokens, cost, tag, uses the seeded model/team/feature names, and reflects recategorizations, budget edits, and any active what-if rate as currently displayed

Mechanics exclusions:
- Line-chart point hover tooltips, monitoring of the tooltip's date and dollar amount, and legend-entry hover states stay Playwright-observed chart mechanics
- KPI count-up (~600 ms), chart grow-from-zero, radial ring sweeps, and capacity-gauge fill easing are animation timing observed via Playwright on real load/range changes
- What-if slider scrubbing when smoothness-while-dragging is the criterion stays a real-pointer Playwright gesture (rates may still be set via entity update for setup)
- Cost-estimator per-keystroke updates and formula-box typing are typed-input render behaviors driven via Playwright
- Anomaly disclosure height transition and chevron rotation, filter-chip animate in/out, and bulk-bar slide stay Playwright-observed
- Undo/Redo toolbar controls are exercised through the real controls so disabled states and exact-restore behavior are observable

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
