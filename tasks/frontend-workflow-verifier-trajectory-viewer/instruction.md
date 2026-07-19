<summary>
Build a verifier review workbench for an agent-benchmark trials platform using React, Zustand, Tailwind CSS 4.3.2, and React Aria headless components styled with Tailwind.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Task table and trial selection —
- The app opens into a task list showing exactly 3 seeded benchmark tasks; selecting a task shows its definition (instruction text rendered as formatted rich text, a config summary, an environment file tree, and a test listing with at least 3 named tests) and a trial table listing that task's 3 trials with columns: model (fictional names such as Fernhollow-2, Opaline-6, and Cindergraph-1), reward, pass or fail outcome, duration, step count, and an adjudication badge that reflects the trial's review progress
- Clicking a trial row opens the review workspace for that trial without a full page reload

Feature: Split review layout —
- The review workspace presents two trajectories: the agent trajectory and the judge trajectory, shown in switchable panes with a persistent pane switcher, or side by side at wide viewports; the currently focused trajectory is always visibly indicated
- Each trajectory is an ordered step timeline: every agent trajectory has at least 12 steps of mixed types (reasoning, tool call, observation, terminal output, screenshot) and every judge trajectory has at least 8 steps of probe actions with tool invocation panels showing name, status, input summary, and expandable output, observation text, and placeholder screenshot frames
- Clicking any step in either trajectory makes it that trajectory's active step: the entry highlights and a detail panel shows the step's message, an expandable reasoning region collapsed by default with a rotating chevron, its tool panels, and observations
- With a trajectory's timeline focused, the arrow keys move its active step to the previous or next step and the newly active entry scrolls into view
- The agent trajectory side includes the trial's evolving file tree as of its active step, with per-file change badges reading Added, Modified, Deleted, or Truncated that accumulate as steps advance and recompute when stepping backward, and inline file rendering by type: markdown as formatted rich text, code in a monospaced block with syntax-aware coloring, a language label, and a copy control with visible confirmation, images scaled to fit, and tabular files as a grid with column headers
- A terminal panel streams the agent trajectory's active-step terminal output progressively with a status affordance distinguishing streaming from complete

Feature: Verdict table and linked highlighting —
- Each trial carries a per-criterion verdict table grouped by rubric dimension (four fictional dimensions with at least 3 criteria each, at least 12 criteria total per trial); every row shows the criterion id, title, weight, a yes or no verdict, and the judge's reasoning text with an evidence link
- Clicking a verdict row's evidence link jumps the judge trajectory to the probe step that produced it and highlights that step
- Selecting a criterion row also highlights any implicated agent step: the agent trajectory scrolls to and outlines the linked step at the same time as the judge step, and clearing the selection removes both highlights
- A dimension rollup bar above the verdict table shows each dimension's score derived live from the verdicts and weights currently displayed; the rollup and the table always agree

Feature: Rescore labels and comparison —
- Every trial holds at least 2 named scoring results (at least one trial holds 3), each with a label name, per-dimension scores, a total, and a cost figure; a label switcher lists them and shows the active label at all times
- Switching the active label swaps the verdict table's verdicts and reasoning and recomputes the dimension rollup bar without a reload; at least one criterion differs between two labels of the same trial
- A comparison strip lets the user pick any two labels of the trial and shows per-dimension deltas and the total delta between them, signed and visibly distinguishing improvement from regression
- Criteria whose verdict flipped between the two compared labels are visually flagged in the verdict table, and a flips-only filter control narrows the table to only flipped criteria and back

Feature: Adjudication —
- Each flipped or failed criterion row exposes an adjudicate control opening a form with a classification select offering exactly agent-bug, rubric-bug, and judge-error, and a rationale text field; submitting with the select unset or the rationale shorter than 20 characters shows inline per-field messages naming each invalid field and records nothing
- Submitting a valid adjudication marks that criterion row with its classification and adds it to a summary panel showing counts per classification for the trial; counts derive live from the recorded adjudications
- Re-adjudicating the same criterion replaces its previous record rather than double-counting
- The trial's adjudication badge in the task's trial table reflects review progress (for example none, in review with a count, or fully adjudicated) and updates as adjudications are recorded
</core_features>

<user_flows>
- Reviewing a verdict end to end: open a task, open a trial, select a failed criterion in the verdict table, follow its evidence link to the highlighted judge probe step, see the implicated agent step outlined in the agent trajectory, and read both step details without a reload
- Comparing rescores: switch the active label and watch the verdict table and rollup bar change, pick two labels in the comparison strip, read the per-dimension deltas, enable the flips-only filter, and see only flipped criteria remain with their flags
- Adjudicating a flip: open the adjudicate form on a flipped criterion, submit with an empty rationale and see per-field messages, complete the form as rubric-bug, and see the row marked, the summary panel count increase by one, and the trial's badge update in the task's trial table
- Walking the agent trajectory: scrub or arrow through agent steps, confirm the file tree badges track the active step, open a changed code file and copy its content with visible confirmation, and watch a terminal step stream progressively
- A page reload returns the app to its seeded state: the 3-task list, default labels active, and no adjudications recorded
</user_flows>

<edge_cases>
- Selecting a criterion whose evidence links to a judge step with a screenshot shows the placeholder screenshot frame in that step's detail
- With the flips-only filter active, switching to a label pair with no flips shows a designed empty state naming that no criteria flipped, with a control that clears the filter
- Double-activating the adjudication submit control records exactly one adjudication for that criterion
- Judge trajectory steps with no observation text show the panel without a blank gap; verdict reasoning longer than its row truncates with an ellipsis and expands on activation to show the full text
- Arrow-key navigation in either trajectory stops at its first and last steps without wrapping or console errors
</edge_cases>

<visual_design>
- The review workspace reads as a split instrument: two trajectory panes with a strong vertical divider and a persistent header naming each side (agent and judge), the verdict table and rollup docked below or beside them, all separated by hairline borders with subtle panel shadows
- Two type families with strict roles: a monospaced face for code, terminal output, file paths, criterion ids, and step indices; a UI sans for everything else, with page titles visibly larger than section headings, which are larger than body and label text
- One status and verdict color system used consistently: green for yes/pass, red for no/fail, amber for running or in-review, one accent for the active step and selected criterion; every colored state also carries a text label or glyph so color is never the only indicator
- Flip flags, adjudication classifications, and change badges each have a distinct visual treatment that always includes its word (Flipped, agent-bug, rubric-bug, judge-error, Added, Modified, Deleted, Truncated)
- The dimension rollup bar renders one segment per dimension with its score, visually proportional to the score, and restyles when the active label changes
- Dense review register: compact table rows, tight timelines, full-width hover washes; one consistent icon set across the chrome; deliberately designed loading and empty surfaces
- Headings, buttons, and labels follow one consistent capitalization convention, and action labels are specific verbs such as Adjudicate criterion and Compare labels rather than generic labels
</visual_design>

<motion>
- Hover animations (required): verdict rows, trial table rows, timeline entries, and tree rows take a full-width hover wash; buttons ease background and shadow with a slight press effect; form controls show focus rings
- Selecting a criterion eases the highlight onto the linked judge and agent steps — the trajectories scroll smoothly to the steps and the outline fades in rather than snapping
- Switching the active label cross-fades the verdict table content and animates the rollup bar segments to their new proportions over roughly 200 to 300 milliseconds
- Enabling the flips-only filter animates non-flipped rows out and back in when disabled, rather than the table snapping between states
- Reasoning regions and tool output panels expand with an eased height transition and a chevron rotating over roughly 0.2 seconds; terminal output streams incrementally with a streaming indicator that changes when complete
- Submitting a valid adjudication animates the classification mark onto the row and the summary panel count updates with a brief emphasis transition
- Pane switching between agent and judge trajectories transitions with a short slide or cross-fade, never a full reload
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow remains complete and usable
</motion>

<responsiveness>
- At 1440 pixel width the two trajectories can be shown side by side; at widths of 1024 pixels and below the workspace collapses to one pane at a time with the pane switcher always visible, and selections persist across switches
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the verdict table, code blocks, and terminal scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — task and trial rows, the pane switcher, timeline entries, tree rows, disclosure toggles, verdict rows, evidence links, the label switcher, comparison pickers, the flips filter, and adjudication form fields — is reachable and operable with the keyboard alone, with a visible focus indicator at each stop
- Both trajectory timelines are keyboard operable: arrow keys move the active step, Home and End jump to the first and last steps, and the active entry is programmatically marked as current
- Opening the adjudication form moves focus to its first field; closing it returns focus to the control that opened it; overlays and expanded panels close on Escape
- Validation messages are associated with their fields so each names the field it belongs to, and placeholder screenshot frames carry descriptive alternative text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Rapidly switching labels, toggling the flips filter, and arrowing through both trajectories stays smooth with no hangs and no surface showing data from a previously active label or step
- Terminal streaming never blocks interaction with the verdict table or either timeline
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the tasks, trials, trajectories, verdicts, and scoring-label collections, the active task and trial, each trajectory's active step, the focused pane, the active scoring label, the two comparison labels, the flips-only filter, criterion selection and linked highlights, disclosure open flags, terminal streaming status, and adjudication records. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Selecting a criterion drives the judge step highlight, the agent step highlight, and the detail panels from the same shared record; clearing the selection clears all of them
- Switching the active label recomputes the verdict table, rollup bar, and flip flags from the same stored results; the comparison strip reads the same records
- Recording an adjudication updates the criterion row mark, the summary panel counts, and the trial's badge in the task's trial table in the same interaction
- Pane, filter, and label choices are shared client state; changing them never reloads the document
- A page reload returns the app to its seeded state
Build tooling: Vite or an equivalent SPA setup. React Aria headless components (tables/grids, tabs, listboxes, selects, dialogs, toggle buttons) styled entirely with Tailwind CSS 4.3.2 (pinned, design tokens in the theme layer) are the component layer; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Tabler icons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — the adjudication form and any filter or comparison forms — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. A markdown rendering library and a syntax highlighting library are allowed for the file renderers. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed exactly 3 benchmark tasks with 3 trials each; every trial has an agent trajectory of at least 12 mixed-type steps, a judge trajectory of at least 8 probe steps with tool panels and placeholder screenshots, a verdict table of at least 12 criteria grouped into four fictional rubric dimensions, and at least 2 named scoring results (one trial has 3) with per-dimension scores, totals, and costs; at least one label pair per trial differs on at least one criterion, and at least 2 flipped criteria exist in the seeded data overall
- Seed every agent trajectory with file changes covering all four badge kinds, and every trial with at least one failed criterion so the adjudicate control is exercisable
- All model, judge, task, and label names in seed data are fictional; no real product, company, or model-vendor names anywhere
- Zero navigational outbound links for app chrome; view changes via shared client state
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
- command-session-v1
- entity-collection-v1
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

Bindings:
- Browsable entity: trials
- Destinations: task-list; task-detail; review-workspace; agent-trajectory-pane; judge-trajectory-pane; verdict-table
- Filters: active-label; comparison-labels; flips-only
- Session operations: advance
- Demos: agent-step-playback; judge-step-playback
- Entity: adjudication
- Entity operations: create; update; select
- Entity fields: criterion-id; classification; rationale
- Value bounds: {"classification":["agent-bug","rubric-bug","judge-error"]}
- Form fields: classification; rationale
- Form operations: validate; submit
- Workflow completion: dimension-rollup-scores
- Workflow completion: adjudication-summary-counts
- Workflow completion: trial-adjudication-badge
- Workflow completion: active-step-index

Mechanics exclusions:
- Terminal progressive streaming and its streaming-vs-complete affordance are observed live via Playwright
- Linked-highlight easing, smooth scroll-to-step, rollup-bar segment animation, and flips-filter row enter/exit animations are motion criteria — Playwright-observed; the underlying selection state changes via the bound tools
- Verdict cross-fade on label switch and pane slide transitions stay Playwright-observed
- Evidence-link and criterion-row hover washes and copy-control confirmation stay Playwright-only

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
