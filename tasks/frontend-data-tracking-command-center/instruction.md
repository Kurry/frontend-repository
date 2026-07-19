<summary>
Build a command center dashboard for a prompt-engineering platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: KPI metrics strip —
- The header row displays at minimum four KPI tiles: total prompts, active agents, evaluations run, and cost this month; each tile shows the current numeric value and a trend indicator arrow pointing up or down
- Each KPI tile renders a small trend sparkline of its recent values; hovering a sparkline point shows a tooltip with the underlying value for that point
- Clicking a KPI tile navigates to the detail view for that metric without a full page reload; the detail view shows a larger chart of the same series plus a breakdown table of at least 6 rows, and a Back control returns to the dashboard with all prior dashboard state intact
- The active agents KPI value always equals the number of agents currently in the running state in the agent panel; connecting or disconnecting an agent moves the KPI and the panel together in the same interaction

Feature: Agent status panel —
- A panel lists all connected coding agents with their current state (idle, running, error); each row shows agent name, model, current state chip, and last-active timestamp
- A running agent's row shows its current step by name with a live status progression: steps advance visibly from pending to running to complete during the simulated run, and the row shows an n-of-m steps-complete summary that updates as steps advance
- Clicking an agent row expands an inline detail area listing that agent's named steps with per-step status indicators; clicking again collapses it; each row's expanded or collapsed state is remembered while the app stays open
- An agent row in error state renders with the danger color treatment and shows a Retry control; activating Retry resets that agent's state to idle in the panel immediately and appends a corresponding event to the activity feed
- A Connect agent control opens a dialog with fields: agent name (required), model (select, required), and description (optional); the submit control stays disabled until required fields are valid, and each invalid field shows an inline message naming that field before submit
- Submitting a valid Connect agent form closes the dialog, adds exactly one row to the agent panel, and appends an agent-connected event to the activity feed
- Each agent row offers Rename and Disconnect actions; Rename edits the agent name in place and the new name appears everywhere the agent is referenced; Disconnect asks for confirmation and then removes the row, updates the active agents KPI if the agent was running, and appends a disconnected event to the feed

Feature: Activity feed —
- A scrollable feed displays the last 50 events (prompt created, eval finished, agent action) newest-first with relative timestamps; each feed item shows an icon, a description, a status chip (info, success, or error), and elapsed time
- Clicking a feed item opens the related resource in its view (an agent event opens that agent expanded in the panel; a metric event opens that metric's detail view) without a full page reload
- A row of filter chips above the feed filters events by type; selecting chips narrows the visible feed to matching events, the visible event count updates, and a Clear filters control restores the full feed exactly
- A Simulate activity control appends a new randomized event to the top of the feed; the new event carries the newest relative timestamp and the feed length never exceeds 50 visible events
- While new events arrive, the feed keeps the newest event in view; if the user scrolls down into older events, auto-follow stops and a jump-to-latest control appears; activating it scrolls back to the newest event and resumes following

Feature: Suggestions row —
- A horizontal row of suggestion chips sits above the activity feed (for example Show errors only, Show agent events); clicking a chip applies exactly the filter it names to the feed, and the row scrolls horizontally without vertical layout shift when it overflows

Feature: Night-mode schedule indicator —
- A status badge in the header shows whether night mode is active, scheduled, or disabled; the badge color distinguishes active (blue) from scheduled (gray) from disabled (neutral)
- Clicking the badge opens a popover with a schedule form: an enable toggle, a start time, and an end time; entering an invalid or empty time while enabled shows an inline message naming the field, and saving is blocked until the form is valid
- Saving the schedule form with the enable toggle on and the current simulated time inside the window switches the badge to active and recolors the app into the dark night theme without a page reload; disabling returns the badge to neutral and the light theme
</core_features>

<user_flows>
- Connecting an agent end to end: submitting Connect agent with valid fields adds exactly one row to the agent panel, increases the visible agent count by one, appends an agent-connected event at the top of the feed, and the new agent is present after switching to a metric detail view and back — all without a reload
- Recovering an errored agent: activating Retry on an error-state row flips its state chip to idle, removes the danger treatment, and a retry event appears at the top of the activity feed in the same interaction
- Investigating from the feed: clicking an agent event in the feed opens the agent panel with that agent's step detail expanded; clicking a metric event opens that metric's detail view; the Back control returns to the dashboard with the feed filter selection unchanged
- Filtering the feed: selecting the error filter chip narrows the feed to only error-chip events and the visible count matches; selecting Clear filters restores the full feed with the same items and order as before
- A page reload returns the app to its seeded state: at least 12 feed events, at least 4 agents, the default theme, and the dashboard view
</user_flows>

<edge_cases>
- Submitting Connect agent with an empty name shows a visible message naming the name field and adds no row; the agent count is unchanged
- Double-activating the Connect agent submit control creates exactly one agent: the panel row count increases by one and one new row appears
- When feed filters match no events, the feed region shows an empty state message with a Clear filters control instead of a blank area
- Disconnecting every agent shows an empty state in the agent panel naming what belongs there and offering the Connect agent control
- An agent name longer than 40 characters is truncated with an ellipsis in the panel row and shown in full in the expanded detail area
</edge_cases>

<visual_design>
- Layout uses a 16-column grid: a full-width KPI metrics strip at the top, a two-thirds main panel (agent status panel above the activity feed controls) and a one-third sidebar column holding the activity feed below
- Typography follows a clear productive hierarchy: panel titles are visibly larger and heavier than table rows and feed items, and feed items and agent rows share one compact body size
- KPI tiles are elevated cards with a top accent border in the primary brand blue for primary metrics; the four tiles share identical anatomy, spacing, and alignment
- Component states: all interactive controls show a visible focus ring on keyboard focus; error states (agent error rows, invalid form fields) use one consistent danger red treatment
- Status chips use one consistent chip language across the app: agent state chips and feed status chips share shape and size, with color distinguishing idle, running, error, info, and success
- One icon set is used consistently across KPI tiles, feed items, agent rows, and header controls, with no mixed icon styles
- The night theme recolors all surfaces, text, chips, and chart accents to dark equivalents with readable contrast; no region stays light while the rest of the app is dark
</visual_design>

<motion>
- KPI numeric values count up from zero to their current value over roughly 800 milliseconds on first render
- New activity feed items slide in from the top with a roughly 200 millisecond ease-out; older items shift down smoothly to make room rather than snapping
- Agent step status changes animate: a step's indicator transitions visibly from pending to running to complete rather than swapping instantly, and the expanding agent detail area opens with a short height-and-opacity transition with a rotating chevron cue
- The night-mode popover and the Connect agent dialog enter and exit with a short opacity-and-scale transition of roughly 200 milliseconds
- A newly connected agent's row animates into the panel and a disconnected row animates out rather than appearing or vanishing instantly
- Hover animations (required): buttons ease background and shadow with a slight press effect; agent rows, feed items, and filter chips take a visible hover wash; form controls show focus rings
- Switching the theme via the night-mode schedule recolors surfaces with a short transition rather than an instant hard swap
- With prefers-reduced-motion set, count-up is instant, feed items appear without animation, and dialogs, popovers, and step transitions apply instantly
</motion>

<responsiveness>
- At 1024 pixels and above, the KPI strip shows all four tiles in one row and the two-thirds/one-third split holds; below 1024 pixels the KPI tiles wrap to two per row and the feed stacks below the agent panel full-width
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the suggestions row scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — KPI tiles, agent rows and actions, feed items, filter chips, header controls, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Connect agent dialog uses role dialog with aria-modal true, traps focus while open, closes on Escape, and returns focus to the Connect agent control on close; the night-mode popover closes on Escape and returns focus to its badge
- Form validation messages are associated with their fields so each message names the field it belongs to, and status is never conveyed by color alone: state chips carry visible text labels
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — repeatedly activating Simulate activity or toggling filters causes no hangs, dropped interactions, or frozen animations
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the agents collection with per-agent step statuses and expanded flags, the activity feed events, the KPI series, the active view, feed filters and suggestion selection, the feed auto-follow flag, the night-mode schedule and resulting theme, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Views derive from the one store — the KPI strip, agent panel, feed, and detail views never keep a second disconnected copy of the data — and WebMCP tool handlers invoke the same store commands the visible controls use, so contract-driven changes and UI-driven changes are indistinguishable in the rendered app.
State contracts (behavioral, not storage keys):
- Connecting a valid agent grows the collection, shows the new row, and updates derived counts and the feed
- Renaming an agent updates that record everywhere it appears (panel, expanded detail, feed references)
- Disconnecting an agent removes it from the panel and from derived counts in the same interaction
- Feed filters and suggestion chips recompute the visible feed from the shared event list; Clear filters restores it exactly
- Retry, step advancement, and simulated events mutate the same store the views render from; no view shows stale state another view already updated
- Theme and active view are shared client state; changing them does not reload the document
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the one component library for all UI components — tiles, data table, dialogs, popovers, toggles, tags, notifications, and form controls; no other component library. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles and Tailwind owns layout and custom surfaces. Motion for React and AutoAnimate are the allowed animation libraries; no other animation libraries. Icons come from @carbon/icons-react only — no raw copy-pasted SVG icon sets. Every form — Connect agent and the night-mode schedule form — is driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Recharts renders the KPI sparklines and detail charts. All libraries are installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 12 activity feed events and at least 4 agents on first load, with at least one agent in each of the idle, running, and error states so every state treatment is visible without setup
- Seed each KPI with a numeric value and a sparkline series of at least 7 points so tiles and detail views are non-empty on first load
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
- form-workflow-v1

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

Bindings:
- Destinations: dashboard; total-prompts-detail; active-agents-detail; evaluations-run-detail; cost-this-month-detail
- Browsable entity: activity-events
- Filters: event-type
- Themes: light; night
- Entity: agent
- Entity operations: create; select; update; delete
- Entity fields: name; model; description; state
- Session operations: connect; disconnect; trigger_demo
- Demos: simulate-activity
- Form fields: agent-name; model; description; night-enable; night-start-time; night-end-time
- Form operations: validate; submit; cancel

Mechanics exclusions:
- KPI metrics strip: sparkline point hover tooltip and count-up animation stay Playwright-observed
- Activity feed: auto-follow scroll behavior and jump-to-latest scroll mechanics stay Playwright-observed
- Agent status panel: live step-status progression animation during a simulated run stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
