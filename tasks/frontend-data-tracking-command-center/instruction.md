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

Feature: Agent status panel and agent record contract —
- A panel lists all connected coding agents with their current state (idle, running, error); each row shows agent name, model, current state chip, and last-active timestamp
- Every agent record follows one closed field contract that the Connect form, the panel row, rename, export, and import all share: name (required, trimmed, 1 to 80 characters), model (required, one of gpt-4.1, claude-sonnet-4, o3-mini, gemini-2.5-pro), description (optional, at most 280 characters), and state (idle, running, or error). A newly connected agent is created as idle with a last-active timestamp set at connect time; the created record is exactly that payload shape
- A running agent's row shows its current step by name with a live status progression: steps advance visibly from pending to running to complete during the simulated run, and the row shows an n-of-m steps-complete summary that updates as steps advance
- Clicking an agent row expands an inline detail area listing that agent's named steps with per-step status indicators; clicking again collapses it; each row's expanded or collapsed state is remembered while the app stays open
- An agent row in error state renders with the danger color treatment and shows a Retry control; activating Retry resets that agent's state to idle in the panel immediately and appends a corresponding event to the activity feed
- A Connect agent control opens a dialog with fields matching the agent record contract: agent name (required), model (select offering exactly the four allowed model values, required), and description (optional); the submit control stays disabled until required fields are valid, and each invalid field shows an inline message naming that field and the violated rule before submit (empty or whitespace-only name, name longer than 80 characters, missing model, description longer than 280 characters)
- Submitting a valid Connect agent form closes the dialog, adds exactly one row whose name, model, and description match the submitted values, sets state to idle, and appends an agent-connected event to the activity feed
- Each agent row offers Rename and Disconnect actions; Rename edits the agent name in place under the same 1-to-80 trimmed rule and the new name appears everywhere the agent is referenced; Disconnect asks for confirmation and then removes the row, updates the active agents KPI if the agent was running, and appends a disconnected event to the feed
- Each agent row has a selection checkbox; a bulk Disconnect selected control removes every checked agent after one confirmation, updates the active agents KPI for any that were running, appends one disconnected event per removed agent, and clears the selection

Feature: Activity feed —
- A scrollable feed displays the last 50 events (prompt created, eval finished, agent action) newest-first with relative timestamps; each feed item shows an icon, a description, a status chip (info, success, or error), and elapsed time
- Clicking a feed item opens the related resource in its view (an agent event opens that agent expanded in the panel; a metric event opens that metric's detail view) without a full page reload
- A row of filter chips above the feed filters events by type; selecting chips narrows the visible feed to matching events, the visible event count updates, and a Clear filters control restores the full feed exactly
- A Simulate activity control appends a new randomized event to the top of the feed; the new event carries the newest relative timestamp and the feed length never exceeds 50 visible events
- While new events arrive, the feed keeps the newest event in view; if the user scrolls down into older events, auto-follow stops and a jump-to-latest control appears; activating it scrolls back to the newest event and resumes following

Feature: Suggestions row —
- A horizontal row of suggestion chips sits above the activity feed (for example Show errors only, Show agent events); clicking a chip applies exactly the filter it names to the feed, and the row scrolls horizontally without vertical layout shift when it overflows

Feature: Command palette —
- Pressing the platform modifier with K (or activating a Command palette header control) opens a command palette overlay listing at least Connect agent, Simulate activity, Export session, Clear filters, and each KPI detail destination by name
- Typing filters the list by fuzzy match on the command names; activating a result runs that command (opens the Connect dialog, appends a simulated event, opens the export drawer, clears feed filters, or navigates to that detail view) and closes the palette; Escape closes the palette without running a command

Feature: Night-mode schedule indicator —
- A status badge in the header shows whether night mode is active, scheduled, or disabled; the badge color distinguishes active (blue) from scheduled (gray) from disabled (neutral)
- Clicking the badge opens a popover with a schedule form whose fields follow one closed contract: enable (boolean toggle), start time (required when enable is on, 24-hour HH:MM), and end time (required when enable is on, 24-hour HH:MM). Entering an invalid or empty time while enabled, or a value that is not HH:MM, shows an inline message naming the field, and saving is blocked until the form is valid
- Saving the schedule form with the enable toggle on and the current simulated time inside the window switches the badge to active and recolors the app into the dark night theme without a page reload; disabling returns the badge to neutral and the light theme

Feature: Undo and redo —
- Header Undo reverses the most recent mutating action among connect, rename, disconnect, bulk disconnect, retry, night-schedule save, and successful import, restoring the prior agents collection, feed events, KPI-derived active count, night schedule, and theme
- Redo reapplies the most recently undone action with the same completeness; performing a new mutating action after an undo clears the redo stack and disables Redo
- Undo and Redo show enabled and disabled states that match whether a step is available

Feature: Session export and import (useful end state) —
- The app produces the operator's command-center session files: an Export session control opens an export drawer with two format tabs — Session JSON and Agents CSV — compiled LIVE from the current store
- Session JSON includes every agent record (name, model, description, state, last-active), the activity feed events (type, description, status, timestamp), the four KPI current values and their sparkline series, the night-mode schedule (enable, start time, end time), the active theme, the active view, and the active feed filter selection
- Agents CSV is CSV-shaped text with a header line naming name, model, description, state, last-active and one data line per agent in the current collection, using the same field contract as the Connect form
- Export content must reflect every mutation the session made — a connect, rename, disconnect, bulk disconnect, retry, night-schedule save, or import that is visible in the UI must appear (or disappear) in the compiled export text before copy or download
- Each tab shows a monospaced preview; Copy writes the visible preview text to the clipboard and shows a brief copied confirmation; Download starts a file download of that same preview text
- Import accepts a previously exported Session JSON: after a successful import the agent panel, feed, KPI strip, night badge, theme, and both export previews match the imported session; malformed JSON or records that violate the agent or schedule field contracts show an inline error naming the import field and leave the session unchanged
</core_features>

<user_flows>
- Connecting an agent end to end: submitting Connect agent with valid fields adds exactly one row to the agent panel with matching name, model, and description, increases the visible agent count by one, appends an agent-connected event at the top of the feed, and the Session JSON and Agents CSV export previews include the new agent — all without a reload
- Recovering an errored agent: activating Retry on an error-state row flips its state chip to idle, removes the danger treatment, and a retry event appears at the top of the activity feed in the same interaction
- Investigating from the feed: clicking an agent event in the feed opens the agent panel with that agent's step detail expanded; clicking a metric event opens that metric's detail view; the Back control returns to the dashboard with the feed filter selection unchanged
- Filtering the feed: selecting the error filter chip narrows the feed to only error-chip events and the visible count matches; selecting Clear filters restores the full feed with the same items and order as before
- Bulk disconnect: selecting two agent checkboxes and confirming Disconnect selected removes exactly those two rows, updates the active agents KPI for any that were running, and appends two disconnected events
- Undo after connect: connecting an agent then activating Undo removes that agent and its connected feed event and restores the prior export previews; Redo restores the agent and event
- Export then import round-trip: after mutating the session (connect or rename at least one agent), Copy or Download the Session JSON, then Import that same JSON — the agent names, feed length, KPI active-agents value, and both export previews match the pre-export mutated state
- Command palette to export: opening the palette, choosing Export session, and confirming the export drawer opens with Session JSON and Agents CSV tabs that contain the current session
- A page reload returns the app to its seeded state: at least 12 feed events, at least 4 agents, the default theme, the dashboard view, empty undo/redo stacks, and no import errors
</user_flows>

<edge_cases>
- Submitting Connect agent with an empty name, a name longer than 80 characters, a missing model, or a description longer than 280 characters shows a visible message naming the offending field and the violated rule and adds no row; the agent count is unchanged
- Double-activating the Connect agent submit control creates exactly one agent: the panel row count increases by one and one new row appears
- When feed filters match no events, the feed region shows an empty state message with a Clear filters control instead of a blank area
- Disconnecting every agent shows an empty state in the agent panel naming what belongs there and offering the Connect agent control; export previews still compile (empty agents array / header-only CSV) without errors
- An agent name longer than 40 characters is truncated with an ellipsis in the panel row and shown in full in the expanded detail area and in export previews
- Importing malformed Session JSON or a document whose agents violate the field contract shows an inline error naming the import field, leaves the agent count and names unchanged, and does not clear undo history as if the import succeeded
- Bulk Disconnect selected with zero checked rows does nothing and shows no confirmation
- After Undo restores a disconnected agent, Redo disconnects it again; after a new connect following an undo, Redo is disabled and cannot resurrect the cleared redo stack
</edge_cases>

<visual_design>
- Layout uses a 16-column grid: a full-width KPI metrics strip at the top, a two-thirds main panel (agent status panel above the activity feed controls) and a one-third sidebar column holding the activity feed below
- Typography follows a clear productive hierarchy: panel titles are visibly larger and heavier than table rows and feed items, and feed items and agent rows share one compact body size
- KPI tiles are elevated cards with a top accent border in the primary brand blue for primary metrics; the four tiles share identical anatomy, spacing, and alignment
- Component states: all interactive controls show a visible focus ring on keyboard focus; error states (agent error rows, invalid form fields) use one consistent danger red treatment
- Status chips use one consistent chip language across the app: agent state chips and feed status chips share shape and size, with color distinguishing idle, running, error, info, and success
- One icon set is used consistently across KPI tiles, feed items, agent rows, and header controls, with no mixed icon styles
- The night theme recolors all surfaces, text, chips, and chart accents to dark equivalents with readable contrast; no region stays light while the rest of the app is dark
- The export drawer shows format tabs, a monospaced preview block, and Copy / Download actions; the command palette reads as a centered overlay list with a filter field
</visual_design>

<motion>
- KPI numeric values count up from zero to their current value over roughly 800 milliseconds on first render
- New activity feed items slide in from the top with a roughly 200 millisecond ease-out; older items shift down smoothly to make room rather than snapping
- Agent step status changes animate: a step's indicator transitions visibly from pending to running to complete rather than swapping instantly, and the expanding agent detail area opens with a short height-and-opacity transition with a rotating chevron cue
- The night-mode popover, the Connect agent dialog, the export drawer, and the command palette enter and exit with a short opacity-and-scale transition of roughly 200 milliseconds
- A newly connected agent's row animates into the panel and a disconnected row animates out rather than appearing or vanishing instantly
- Hover animations (required): buttons ease background and shadow with a slight press effect; agent rows, feed items, and filter chips take a visible hover wash; form controls show focus rings
- Switching the theme via the night-mode schedule recolors surfaces with a short transition rather than an instant hard swap
- With prefers-reduced-motion set, count-up is instant, feed items appear without animation, and dialogs, popovers, drawers, palette, and step transitions apply instantly
</motion>

<responsiveness>
- At 1024 pixels and above, the KPI strip shows all four tiles in one row and the two-thirds/one-third split holds; below 1024 pixels the KPI tiles wrap to two per row and the feed stacks below the agent panel full-width
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the suggestions row scrolls within its own container
- The export drawer, command palette, Undo/Redo controls, and Connect dialog stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control — KPI tiles, agent rows and actions, checkboxes, feed items, filter chips, header controls, Undo/Redo, export drawer controls, command palette, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Connect agent dialog, export drawer, and command palette use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them; the night-mode popover closes on Escape and returns focus to its badge
- Form validation messages are associated with their fields so each message names the field it belongs to, and status is never conveyed by color alone: state chips carry visible text labels
- Connect, disconnect, bulk disconnect, export copy, and import completion are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — repeatedly activating Simulate activity or toggling filters causes no hangs, dropped interactions, or frozen animations
- Opening the export drawer and switching between Session JSON and Agents CSV regenerates the preview without freezing the UI
</performance>

<writing>
- Headings, buttons, and menu items use one consistent capitalization convention throughout the app
- Action labels are specific verbs (Connect agent, Disconnect selected, Export session, Copy, Download, Undo, Redo) rather than generic labels where a specific one is possible
- Validation messages name the field and the violated rule; empty states explain what belongs in the region and how to add it; import errors name the import field; no placeholder text appears anywhere in the shipped UI
- Export drawer tab labels read Session JSON and Agents CSV
</writing>

<innovation>
- Beyond the required command center, reward a polished ops-console touch that helps an operator trust the session artifact — for example a structured export summary strip naming agent count and active-agents KPI above the preview, keyboard shortcuts for Undo/Redo, or a compact chip showing the last mutating action — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the agents collection with per-agent step statuses, expanded flags, and selection flags, the activity feed events, the KPI series, the active view, feed filters and suggestion selection, the feed auto-follow flag, the night-mode schedule and resulting theme, undo/redo history, export drawer state, command palette state, import diagnostic state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Views derive from the one store — the KPI strip, agent panel, feed, detail views, and export previews never keep a second disconnected copy of the data — and WebMCP tool handlers invoke the same store commands the visible controls use, so contract-driven changes and UI-driven changes are indistinguishable in the rendered app.
State contracts (behavioral, not storage keys):
- Connecting a valid agent grows the collection with a record matching the agent field contract, shows the new row, and updates derived counts, the feed, and both export previews
- Renaming an agent updates that record everywhere it appears (panel, expanded detail, feed references, exports) under the same name bounds
- Disconnecting an agent or bulk-disconnecting selected agents removes them from the panel, derived counts, and exports in the same interaction
- Feed filters and suggestion chips recompute the visible feed from the shared event list; Clear filters restores it exactly
- Retry, step advancement, and simulated events mutate the same store the views render from; no view shows stale state another view already updated
- Undo and redo replay the same store commands the visible controls use, and every derived surface including export previews follows
- Theme and active view are shared client state; changing them does not reload the document
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the one component library for all UI components — tiles, data table, dialogs, popovers, toggles, tags, notifications, and form controls; no other component library. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles and Tailwind owns layout and custom surfaces. Motion for React and AutoAnimate are the allowed animation libraries; no other animation libraries. Icons come from @carbon/icons-react only — no raw copy-pasted SVG icon sets. Every form — Connect agent, Rename when it uses a form, the night-mode schedule form, and Import — is driven by React Hook Form validating through a Zod schema that mirrors the agent-registration and night-schedule field contracts above: the schema defines the rules and inline per-field errors render before submit. Recharts renders the KPI sparklines and detail charts. All libraries are installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 12 activity feed events and at least 4 agents on first load, with at least one agent in each of the idle, running, and error states so every state treatment is visible without setup
- Seed each KPI with a numeric value and a sparkline series of at least 7 points so tiles and detail views are non-empty on first load
- Seeded agents already conform to the agent field contract (allowed models, name length, description bounds)
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- browse-query-v1
- entity-collection-v1
- form-workflow-v1
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
- Destinations: dashboard; total-prompts-detail; active-agents-detail; evaluations-run-detail; cost-this-month-detail; export-drawer
- Browsable entity: activity-events
- Filters: event-type
- Themes: light; night
- Entity: agent
- Entity operations: create; select; update; delete
- Entity fields: name; model; description; state
- Form fields: agent-name; model; description; night-enable; night-start-time; night-end-time
- Form operations: validate; submit; cancel
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: session-json

Mechanics exclusions:
- KPI metrics strip: sparkline point hover tooltip and count-up animation stay Playwright-observed
- Activity feed: auto-follow scroll behavior and jump-to-latest scroll mechanics stay Playwright-observed
- Agent status panel: live step-status progression animation during a simulated run stays Playwright-observed
- Command palette open/filter keyboard timing stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard and downloaded artifact contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
