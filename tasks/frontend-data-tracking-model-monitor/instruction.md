<summary>
Build a model marketplace routing monitor using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and Recharts.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Model catalog —
- The main panel displays a data table listing all discovered models with columns: model name, provider, context window, cost per 1k tokens input, cost per 1k tokens output, and a free/paid badge; all seeded models are reachable in the table (scrolling within the table container counts as reachable)
- A search input above the table filters the list to models whose name or provider contains the query as it is typed; clearing the field restores the full list exactly
- A provider filter select narrows the list to one provider; combining search and provider filter applies both constraints at once, and the visible row count reflects the combined result
- A horizontal row of suggestion chips sits above the table (at least 4 chips, such as popular provider names and the term free); clicking a chip fills the search input or applies the matching provider filter exactly as if the user had typed or selected it, and the table narrows accordingly; when the chip row overflows it scrolls horizontally without shifting the vertical layout
- A visible count near the table always states how many models are currently shown out of the total (for example 12 of 24 models) and updates with every search, filter, or refresh change
- When search and filter combine to match zero models, the table region shows a designed empty state naming what was searched and a clear-filters control that restores the full list

Feature: Free model alerts —
- Models currently available at zero cost display a green Free badge in the cost column and a star icon in the name column; paid models display a gray Paid badge
- A bell icon button in the toolbar opens a modal to configure free-model alerts; the modal contains a form with an alerts on/off toggle and a minimum context window field (must be a non-negative number); an invalid context window value shows an inline message naming the field before submit, and the save control stays disabled until the form is valid
- With alerts toggled on, whenever a model transitions to free status during a simulated refresh or simulation event, a notification toast appears inside the app naming the model that became free, remains readable, and auto-dismisses; with alerts off no toast appears for the same transition

Feature: Cost tracker —
- A sidebar panel docked to the right shows total estimated session cost broken down by model; each row shows model name, requests made, and cost subtotal, and the panel header shows the session total and total request count
- A pie chart in the sidebar visualizes cost distribution by model; hovering a slice with the pointer shows a tooltip with that model's name and dollar amount
- The chart has a legend of contributing models; clicking a legend entry toggles that model's slice out of and back into the chart, and the remaining slices redraw to fill the circle
- Each cost row exposes a sources-style disclosure: a count trigger showing how many usage events contributed to that row; activating it opens a list of that model's contributing usage events (timestamp, request label, token count, cost), and each entry links to the model's row in the catalog table, highlighting it in-app without any outbound navigation

Feature: Usage simulation —
- A simulation control in the toolbar starts and pauses a simulated usage event stream; while running, new usage events arrive every few seconds and appear at the top of a visible event feed with timestamp, model name, token count, and cost
- As each simulated usage event arrives, the affected model's request count and cost subtotal, the session total, the total request count, and the pie chart all recompute live in the same interaction, without a reload
- Pausing the simulation freezes the feed and all totals at their current values; resuming continues appending events; the control's label and icon reflect the running or paused state at all times
- The event feed shows a visible loading affordance while the next event is pending during an active simulation, and a designed empty state before any events exist naming how to start the simulation

Feature: Model auto-discovery —
- A Refresh button in the toolbar triggers a simulated model list refresh with a brief visible loading affordance on the table; new models not previously in the list animate into the table; removed models are marked with a strikethrough and reduced emphasis for 5 seconds before being removed
- Each refresh changes the catalog in a visible way (at least one model added, removed, or flipped between free and paid), and the shown-of-total count updates to match

Feature: Model comparison —
- Selecting two or more model rows via row checkboxes enables a Compare control that is disabled with fewer than two selections; clicking it opens a modal with a side-by-side attribute comparison table showing name, provider, context window, input cost, output cost, and free/paid state for every selected model
- Deselecting rows below two while the compare control is visible disables it again; closing the comparison modal returns to the table with selections intact
</core_features>

<user_flows>
- Monitoring flow: start the simulation, watch at least two usage events arrive in the feed, and confirm the session total and the affected models' subtotals and the pie chart all change together without a reload; pause the simulation and confirm totals freeze
- Filtering flow: type a provider fragment into search, then apply a provider filter, confirm both constraints combine and the shown-of-total count matches the visible rows, then clear both and confirm the full seeded list returns exactly
- Alert flow: enable alerts in the bell modal, trigger a refresh or simulation event that flips a model to free, and confirm a toast names that model; disable alerts and confirm an equivalent transition produces no toast
- Comparison flow: select three models by checkbox, open Compare, confirm all three appear side by side with their catalog values, close the modal, and confirm the three rows are still selected
- Drill-down flow: open a cost row's contributing-events list, activate one entry's model link, and confirm the catalog highlights that model's row in the same session without navigation
</user_flows>

<edge_cases>
- Submitting the alert configuration form with a negative or non-numeric context window value shows an inline message naming the field and saves nothing
- Toggling a legend entry off for the model with the largest cost share redraws the chart from the remaining models rather than showing an empty or broken chart; toggling every model off shows a designed empty chart state
- Rapidly clicking Refresh twice runs a single coherent refresh: no duplicate rows appear and the shown-of-total count stays consistent with the visible rows
- A model removed by refresh while selected for comparison is dropped from the selection; the Compare control disables if fewer than two selections remain
</edge_cases>

<visual_design>
- Full-width data table with a sticky header row that stays visible while the table body scrolls; sidebar panel docked to the right at 280 pixels on desktop
- Free badges render in green and paid badges in gray, visually consistent across the table, comparison modal, and cost sidebar
- The cost sidebar list uses structured rows with hairline dividers between entries; the session total row is visually heavier than per-model rows
- Pie chart slices use a consistent brand accent palette drawn from the app's design tokens, matching the accent colors used on badges and chips
- A clear type hierarchy: the app title is larger than panel headings, which are larger than table body and event feed text, consistent across all surfaces
- Spacing follows one consistent rhythm across the toolbar, table, chips row, and sidebar; no crowded or orphaned regions
- One consistent icon set is used across the toolbar, badges, feed, and disclosure triggers
- Interactive controls show distinct default, hover, focus (visible ring), and disabled treatments
</visual_design>

<motion>
- Hover animations (required): toolbar buttons and chips ease background and border on hover with a slight press effect; table rows take a full-width hover wash; form controls show focus rings
- New model rows animate in from opacity 0 over roughly 200 milliseconds on refresh; departing rows fade to reduced opacity, gain a strikethrough style, then collapse over 5 seconds
- New usage events slide into the top of the event feed rather than snapping, and existing entries shift down smoothly
- The alerts modal and comparison modal enter and exit with a short opacity and scale transition of roughly 200 to 300 milliseconds
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
- Every interactive control — search, filter, chips, table checkboxes, toolbar buttons, legend entries, disclosure triggers — is reachable and operable with the keyboard alone, with a visible focus indicator
- Both modals trap focus while open, close on Escape, and return focus to the control that opened them
- Alert toasts and new-event announcements are exposed through an aria-live polite region as well as shown visually
- Form fields in the alert modal have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a running simulation
- The table, feed, and chart stay responsive while the simulation is running; rapid repeated filtering during an active simulation causes no hangs or dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the model catalog, search and filter state, row selection, alert configuration, the usage event stream, per-model cost rollups, chart legend toggles, disclosure open flags, and simulation running state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- A simulated usage event appends to the one event stream, and the feed, per-model rows, session totals, and pie chart all derive from that same stream; no surface keeps a second disconnected copy
- A refresh mutates the one model collection, and the table, shown-of-total count, comparison selection, and free-model alerting all derive from it
- Search, provider filter, and chips recompute the visible list from the shared catalog
- Legend toggles, disclosure open state, selection, and simulation running state are shared client state; changing them never reloads the document
- A page reload returns the app to its seeded state: the seeded catalog, seeded session usage, alerts off, and simulation paused
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for the data table, modals, notifications, tags, structured lists, and form controls; no other component library. Recharts for the cost chart; no other charting library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons via @carbon/icons-react only — no raw copy-pasted SVG icon sets. All forms, including the alert configuration form, are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; model data, refreshes, and cost tracking are fully simulated in memory.
- Seed at least 20 models from at least 5 providers on first load with at least 4 marked as currently free
- Seed session usage so the cost sidebar opens non-empty: at least 6 usage events across at least 3 models, with the pie chart rendering their distribution
- The simulated refresh and the usage simulation must each produce visibly different results across repeated triggers, never an identical hardcoded outcome every time
- Zero navigational outbound links for app chrome; all navigation and panel changes go through shared client state
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
- form-workflow-v1
- command-session-v1

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

Bindings:
- Browsable entity: models
- Destinations: model-catalog; cost-sidebar; event-feed; alert-settings-modal; comparison-modal
- Filters: provider; search; free
- Entity: model
- Entity operations: select; toggle
- Entity fields: compare-selected; legend-visible; events-disclosure-open
- Form fields: alerts-enabled; min-context-window
- Form operations: validate; submit; cancel
- Session operations: start; pause; resume; trigger_demo
- Demos: usage-simulation; catalog-refresh
- Workflow completion: shown-of-total-count
- Workflow completion: session-total
- Workflow completion: per-model-subtotals

Mechanics exclusions:
- Pie-chart slice hover tooltip stays Playwright-only (computed while hovering)
- Toast slide-in/auto-dismiss timing and event-feed slide-in animations stay Playwright-observed
- Refresh row enter/strikethrough-collapse animations stay Playwright-observed; refresh state change itself goes through session trigger_demo
- Streaming feed pacing (events every few seconds) is observed live, never batched via WebMCP

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
