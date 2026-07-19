<summary>
Build a coding-agent fleet management console using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Agent registry —
- The main panel is a data table listing registered agents with columns: name, type (Aster / Boreal / Cinder), editor integration, status (idle / running / paused / error / offline), and last-seen timestamp; all seeded agents are visible without pagination
- Status cells render as colored badges: blue for running, green for idle, teal for paused, red for error, gray for offline, consistent everywhere a status appears
- Agents in error status render the status cell in the error treatment and show a Retry control in the row; activating Retry transitions the agent status to idle and appends a matching entry to that agent's event timeline
- A summary strip above the table shows live rollup counts per status (for example 3 running, 2 idle, 1 error) plus a total; every count derives from the agent collection and updates in the same interaction as any status change

Feature: Register agent —
- Clicking Register Agent opens a modal with: agent name (required), agent type (select, required, options Aster / Boreal / Cinder), editor integration (select: Codedeck / Nimbus / Quill / Vector / none), and access key field (required); submitting a valid form closes the modal and adds the agent to the registry with idle status and a fresh last-seen timestamp
- Submitting with an empty name, missing type, or empty access key shows an inline error naming each invalid field and does not add a row; the submit control stays disabled until required fields are valid

Feature: Agent detail panel —
- Clicking a row opens a right-docked side panel for that agent with three tabs: Configuration, History, and Activity; the panel names the agent and shows its current status badge
- The Configuration tab shows the agent's full configuration values (name, type, editor integration, masked access key, status)
- The History tab shows the agent's status history: the last 10 events with timestamps in reverse chronological order, each naming the transition (for example running to error)
- The Activity tab lists the prompts executed by this agent today, each with a timestamp and a short label, and shows a designed empty state when the agent has executed none
- An Edit button in the side panel opens the registration modal pre-filled with the agent's current values; saving updates the registry row and the panel in place without a reload; a Remove action in the row's overflow menu deletes the agent from the table after an explicit confirm step

Feature: Simulated work runs —
- Each agent row and detail panel exposes a Start run control (enabled when the agent is idle); starting a run sets the agent's status to running and opens a task progress list in the Activity tab showing at least 5 named steps
- Each step shows a status that advances visibly during the simulation: pending, then running, then complete or failed or retrying; step statuses tick forward every few seconds while the run is active, and an overall progress indicator (n of m steps complete) updates with each tick
- At least one seeded run scenario includes a simulated step failure: the failing step shows retrying with a visible attempt counter and a backoff countdown (for example waiting 5s before retry 2 of 3) that counts down on screen before the retry attempt begins
- A step that exhausts its retries is marked failed with an inline error summary and a manual retry control; activating manual retry resumes the run from that step, not from the start, and previously completed steps keep their original timestamps and outputs unchanged
- When all steps complete, the run is marked complete, the agent's status returns to idle, and the run's total duration is shown

Feature: Pause and resume —
- A running agent can be paused from its row or detail panel; pausing sets the status badge to paused and freezes the step list exactly where it is, recording a visible checkpoint on the step that was in progress
- Resuming a paused agent returns it to running and continues from the exact checkpointed step; steps completed before the pause never re-execute and their timestamps stay frozen
- Selecting multiple agents via table row checkboxes enables Pause All and Resume All toolbar controls; Pause All pauses every selected running agent, Resume All resumes every selected paused agent, and each affected row's badge and the rollup strip update together in one action

Feature: Event timeline —
- The History tab includes an ordered event timeline for the agent: every status transition, retry attempt, checkpoint, and manual action appends an entry with a timestamp; entries appear in the timeline in the same interaction as the change that caused them
- The timeline can be filtered by status kind via a filter control; clearing the filter restores all entries; selecting a timeline entry that refers to a run step highlights that step in the Activity tab

Feature: Current-work summary —
- Each agent row exposes a collapsible current-work summary region, collapsed by default; activating it expands a short description of what the agent is doing now, with a rotation cue on its chevron, and the region remembers its open state per agent while the app is open
- While the agent is running, the expanded summary shows an active indicator and the name of the step in progress; when the last run is complete it shows a duration summary line instead

Feature: Status filter —
- A filter toolbar above the table allows filtering to show only agents matching one or more selected statuses; combining multiple statuses shows the union; clearing the filter restores all agents, and the rollup strip continues to reflect the full collection while a filter is active
- When the active filter matches zero agents, the table region shows a designed empty state naming the active filter and a clear-filter control
</core_features>

<user_flows>
- Registration flow: submit Register Agent with valid values, confirm exactly one new row appears with idle status, the total in the rollup strip increases by one, and opening the new row's detail panel shows the submitted configuration
- Run flow: start a run on an idle agent, watch its badge flip to running and at least two steps advance in the progress list with the n of m indicator updating, then let the run finish and confirm the badge returns to idle and the timeline gained matching entries
- Failure and recovery flow: on the seeded failure scenario, watch a step enter retrying with an attempt counter and visible backoff countdown, let retries exhaust, then use the manual retry control and confirm the run resumes from the failed step while earlier steps' timestamps stay unchanged
- Pause flow: pause a running agent mid-run, confirm the step list freezes with a visible checkpoint and the badge shows paused, resume it, and confirm progression continues from the checkpointed step without re-running completed steps
- Bulk flow: select three agents by checkbox, activate Pause All, and confirm every selected running agent flips to paused and the rollup strip counts shift in the same action; Resume All returns them to running
</user_flows>

<edge_cases>
- Submitting the registration form with all fields empty shows an inline error for each required field and the table row count does not change
- Cancel on the register or edit modal leaves the registry unchanged; double-activating the submit control creates exactly one agent
- Removing an agent that is part of a checkbox selection also drops it from the selection, and the bulk controls disable when the selection becomes empty
- Removing the last agent (or filtering to zero matches) shows an empty state in the table region rather than a bare table
- Pause All with only idle or offline agents selected changes nothing visibly except leaving statuses as they are; no agent gains an inconsistent badge
</edge_cases>

<visual_design>
- Console layout: a full-width data table with checkbox selection, per-row overflow menus for Edit / Remove, a toolbar carrying Register Agent, the bulk controls, and the status filter, and a 320 pixel right-docked detail panel with tabs for Configuration / History / Activity
- Status badges use one consistent color mapping everywhere: blue running, green idle, teal paused, red error, gray offline; the error treatment on the status cell is visibly distinct from a plain badge
- The rollup strip renders as compact stat tiles sharing one visual treatment; timeline entries and progress steps use consistent iconography for each status kind
- A clear type hierarchy: page title above panel headings above table body and timeline text, consistent across the table and detail panel
- Spacing follows one consistent rhythm across the toolbar, table, and detail panel; hairline dividers separate timeline entries and step rows
- One consistent icon set is used throughout; interactive controls show distinct default, hover, focus (visible ring), and disabled treatments
</visual_design>

<motion>
- Hover animations (required): toolbar buttons ease background and shadow with a slight press effect; table rows take a full-width hover wash; overflow menu items highlight on hover and focus; form controls show focus rings
- New agent rows animate in from opacity 0 over roughly 200 milliseconds; removed rows animate out rather than snapping
- Status badge transitions animate the background color change over roughly 300 milliseconds when a status changes through the real controls
- Step status changes tick with a short transition: the status icon swaps with a small scale or fade, and the overall progress indicator fills smoothly rather than jumping
- The backoff countdown updates visibly each second; the retrying state pulses subtly while waiting
- The detail panel slides in from the right and slides out on close; tab switches cross-fade their content without layout jumps
- The current-work summary expands and collapses with a smooth height transition and a rotating chevron cue
- The register and edit modal enters and exits with a short opacity and scale transition of roughly 200 to 300 milliseconds; confirmation toasts after register, remove, and bulk actions slide in and auto-dismiss with a fade
- With prefers-reduced-motion set, all transitions apply instantly and every surface remains fully usable
</motion>

<responsiveness>
- At desktop widths the detail panel is docked at 320 pixels beside the table; at widths of 768 pixels and below the panel opens as an overlay covering the table and is dismissible
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the data table scrolls within its own container
</responsiveness>

<accessibility>
- Every interactive control — table checkboxes, row actions, overflow menus, tabs, filter controls, run and pause controls, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator
- The register and edit modal traps focus while open, closes on Escape, and returns focus to the control that opened it; the detail panel is dismissible from the keyboard
- Status changes and run completions are announced through an aria-live polite region as well as shown visually
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including active simulated runs
- The table and detail panel stay responsive while multiple agents run simultaneously; rapid repeated filtering and selection changes cause no hangs or dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the agent collection, per-agent run state (step statuses, attempt counts, checkpoints), event timelines, selection, status filters, panel and tab state, expanded summary flags, and modal state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Registering a valid agent grows the one collection; the table, rollup strip, and detail panel all derive from it
- A status change from any path — retry, run progression, pause, resume, bulk action, edit — updates the row badge, the rollup strip, the detail panel, and the event timeline in the same interaction; no surface shows a stale status another surface already updated
- Run steps, attempt counts, checkpoints, and timeline entries live in the one store; the Activity progress list and the History timeline are two derivations of the same run state, never independent copies
- Filters and selection recompute the visible rows from the shared collection; they do not create a second disconnected copy
- Panel, tab, and expanded-summary state are shared client state; changing them never reloads the document
- A page reload returns the app to its seeded state: the seeded agents, no active filter, and no open panel
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for the data table, modals, side panel, tabs, tags, notifications, and form controls; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons via @carbon/icons-react only — no raw copy-pasted SVG icon sets. All forms — the register and edit modal and any filter forms — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; agent status changes and runs are simulated in memory.
- Seed at least 8 agents across at least 3 editor integrations covering idle, running, error, and offline statuses on first load, with at least one seeded agent mid-run and one seeded run scenario that will hit the simulated step failure
- Seed each agent's status history with events so the History tab is non-empty on first open
- Simulated runs must produce visibly different step timings and outcomes across repeated runs, never an identical hardcoded outcome every time
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
- Browsable entity: agents
- Destinations: agent-registry; detail-configuration; detail-history; detail-activity
- Filters: status; timeline-status-kind
- Entity: agent
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; agent-type; editor-integration; access-key; status; summary-expanded
- Value bounds: {"agent-type":["aster","boreal","cinder"],"editor-integration":["codedeck","nimbus","quill","vector","none"],"status":["idle","running","paused","error","offline"]}
- Form fields: name; agent-type; editor-integration; access-key
- Form operations: validate; submit; cancel
- Session operations: start; pause; resume; restart
- Demos: work-run; seeded-failure-retry-scenario
- Workflow completion: rollup-strip-counts
- Workflow completion: run-progress-n-of-m
- Workflow completion: timeline-entry-appended

Mechanics exclusions:
- Backoff countdown ticking and retrying pulse are timed visuals — Playwright-observed live, never asserted from tool output
- Step-status tick animation, badge color transitions, panel slide-in, and chevron rotation stay Playwright-observed
- Bulk Pause All / Resume All button mechanics graded via the real toolbar controls; state parity checkable via session pause/resume per selected agent

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
