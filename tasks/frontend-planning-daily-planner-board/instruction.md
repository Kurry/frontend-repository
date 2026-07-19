<summary>
Build a Cadence multi-day daily planner board using Vue 3 with Nuxt static-site delivery, Pinia, Tailwind CSS 4.3.2, and shadcn-vue.
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
- The app opens straight onto the Home board — a left global-nav rail, a central multi-day board, and a right calendar rail — with no login, signup, or onboarding gate
- The central board renders 21 day columns from Monday July 6 through Sunday July 26, laid out left to right and horizontally scrollable; each column header shows its weekday and date (for example Monday and July 6) and a per-column action label that reads Reflect for the past days July 6 through 17, Shutdown for July 18, and Plan for the future days July 19 through 26
- The board opens non-empty with four seeded tasks: Set up Cadence and Weekly planning in the July 18 column, Daily planning in the July 19 column, and Work in the July 20 column; every seeded task shows an unchecked completion checkbox and a #work channel tag
- The Set up Cadence task shows a planned-time chip reading 0:20, a notes indicator, and an expanded subtask checklist of exactly Add a task, Complete daily planning, Add integrations, and Add channels, and Add recurring tasks; the Work task shows a scheduled start reading 9:00 am and a planned-time chip reading 1:00
- Tasks are the primary collection: each day column has an Add task control that appends a new task to that column, and each task can be opened and edited (title, channel, planned time, scheduled start), completed, and deleted; adding, editing, or deleting tasks updates the board from shared application state without a full page reload
- The Add task and task edit forms validate inline: an invalid field shows an error message naming that field before submit, and the submit control stays disabled until every required field is valid
- Each day column shows a planned-time footer total that recomputes from that column's tasks: July 18 reads 0:20 and July 20 reads 1:00 on first load
- Two interaction modes read from the same task collection: the multi-day board and a calendar day panel in the right rail; the calendar panel titled Calendars shows a 1x zoom control, a day header reading Sat 18, an all-day event reading Automatic Bill Payment - Sallie Mae, and an hour ruler listing every hour from 12 AM through 11 PM; a task that carries a scheduled start appears on the selected day's hour grid, and selecting a different day updates the calendar panel in place without a reload
- On the calendar day panel, dragging a scheduled task's block to a different hour slot updates that task's scheduled start, and the task's board card shows the new start time without a reload
- The left nav rail shows the Cadence wordmark, primary items Home (rendered active), Today, and Focus, a Daily rituals group (Daily planning, Daily shutdown, Daily highlights), a Weekly rituals group (Weekly planning, Weekly review), Backlog, and the controls Add folder and Invite someone, plus an account footer reading Alex Rivera and alex.rivera@example.com
- The right rail also shows a utility strip of Search, GitHub, Backlog, Archive, Objectives, and Calendar buttons, and the board header shows Today, Filter, and Board controls
- Chrome-only controls never navigate to another origin: clicking any left-nav item other than the active Home, the board Filter control, the right-rail Search, GitHub, Backlog, Archive, or Objectives buttons, Add folder, Invite someone, or the help button shows a brief demo toast and keeps the board in view
- A help button in the bottom corner shows a demo toast rather than opening any external chat widget
- Zero outbound navigation — in-app controls only; no backend routes exist
</core_features>

<user_flows>
- Submitting Add task on the July 19 column with a valid title appends exactly one card to that column, increases that column's card count by exactly one, recomputes the column's planned-time footer total when a planned time is entered, and, when a scheduled start is entered, shows the same task on the July 19 calendar day panel without a reload
- Clicking the Work task's checkbox on the board marks that card completed, and the same task's block on the July 20 calendar day reflects the completed state without a reload; clicking the checkbox again clears the completed state in both places
- Editing a task's title and planned time from its edit form updates the board card text, recomputes that column's planned-time footer total, and updates the task's calendar panel block when it carries a scheduled start, all without a reload
- Deleting a scheduled task removes its card from the column, removes its block from the calendar day panel, and reduces that column's planned-time footer total by the deleted task's planned time
- A page reload returns the app to its seeded state: exactly the four seeded tasks, the July 18 column total reading 0:20, the July 20 column total reading 1:00, and the other 18 columns empty at 0:00
</user_flows>

<edge_cases>
- Submitting Add task with an empty required title shows visible validation feedback naming the title field and adds no task; the column's card count and planned-time total do not change
- Double-activating a valid Add task submit creates exactly one task: the column's card count increases by exactly one
- Deleting every task in a column, or a column that started empty, shows an empty column that still offers Add task and reads a 0:00 planned-time total
- A task with no planned time contributes nothing to its column's footer total, and a task with no scheduled start never appears on the calendar hour grid
</edge_cases>

<visual_design>
- Calm productivity-app composition on a light surface: a fixed left nav rail, a central board of dense day columns, and a fixed right calendar rail, with a single accent color used for the active nav item, the Today control, planned-time chips, and channel tags
- Day columns are narrow, equal-height cards with a header (weekday, date, action label), a scrollable task area, an Add task affordance, and a planned-time footer; the July 18 column is visually marked as today
- Task cards are compact: a circular completion checkbox at left, the title, a #work channel tag, optional scheduled-start and planned-time chips, an optional notes indicator, and an optional subtask checklist
- The calendar panel uses a titled header with a 1x zoom pill, a highlighted all-day event row, and a full 24-row hour ruler from 12 AM to 11 PM
- The right utility strip stacks six icon buttons (Search, GitHub, Backlog, Archive, Objectives, Calendar); density reads as a planner workspace, not a marketing landing
- Icons across the nav rail, utility strip, board header, and task chips come from one consistent icon set with a uniform visual weight
</visual_design>

<motion>
- Task add and remove: a newly created task card animates into its column, a deleted card animates out, and the surrounding cards slide smoothly to close the gap
- Task completion: toggling a checkbox animates the checked state with a short transition and the task's appearance updates immediately
- Calendar drag: while dragging a scheduled task's block on the hour grid, the block follows the pointer and settles into its new slot with a short ease
- Planned-time totals: a column's footer total updates immediately when its tasks change
- Calendar panel: selecting a different day swaps the panel contents in place without a page reload
- Demo toast: chrome-only controls show a toast that enters with a short ease, holds briefly, then exits
- Hover animations (required): nav items, board and header buttons, task cards, Add task affordances, and right-rail buttons take a visible hover wash or border or shadow change and use a pointer cursor
- With prefers-reduced-motion set, animations are removed and state changes apply instantly
</motion>

<responsiveness>
- At 1440 pixels wide all three regions are visible: the fixed left nav rail, the central multi-day board, and the fixed right calendar rail
- The board scrolls horizontally inside its own region; the page body never scrolls horizontally and no content clips outside the viewport at desktop widths
- At narrower desktop widths the central board region shrinks while remaining horizontally scrollable; the nav rail and calendar rail never overlap board content
</responsiveness>

<accessibility>
- Every interactive control — nav items, Add task controls, task checkboxes, board header buttons, and right-rail buttons — is reachable and operable with the keyboard alone and shows a visible focus indicator
- The task edit dialog uses dialog semantics with aria-modal, traps focus while open, and returns focus to the control that opened it on close
- Each task's completion checkbox exposes an accessible name that includes the task title
- The demo toast is announced through an aria-live polite region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- The console stays clean during a full exercise of the app: no errors, no warnings, and no hydration mismatch messages on first load or after in-app interaction
- Loading the app URL directly renders the complete board with its seeded tasks; pre-rendered content does not visibly flash or get replaced by different content after the page becomes interactive
- Rapidly toggling checkboxes and adding tasks keeps the UI responsive with no hangs or dropped interactions
</performance>

<writing>
- Headings, buttons, and nav labels keep one consistent capitalization convention throughout the app
- Validation and empty-state messages name the problem and the fix in plain language; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must use Pinia, the state library named in summary (in-memory only): the tasks collection, per-task fields (title, done, channel, planned time, day, scheduled start, subtasks), the selected calendar day, and the toast timer. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid task appends it to the chosen day column and recomputes that column's planned-time total
- Editing a task updates that same task in the board and in the calendar panel when it is scheduled
- Deleting a task removes it from its column, the calendar panel, and that column's planned-time total
- Toggling a task's completion updates the same task's state everywhere it appears
- The calendar day panel is derived from the shared tasks collection for the selected day; it is not a second disconnected copy
- Per-column planned-time totals are derived from each column's tasks, not hardcoded captions
Stack: Vue 3 delivered through Nuxt as a static export or SSR with client hydration; all interactivity lives in client state after load — no server API routes, no server actions, no backend, and no authentication. Frontend-only.
- Tailwind CSS 4.3.2 (pinned) is the styling base; design tokens live in the Tailwind theme
- shadcn-vue is the component library: use it for the task edit dialog, selects, form inputs, dropdown menus, and toasts; no other component or UI-kit libraries
- Motion for Vue and AutoAnimate are allowed for animation; no other animation libraries
- Phosphor icons via the @phosphor-icons/vue package only; no other icon sets and no icon CDNs
- The calendar day panel is built on @event-calendar/core
- All forms (Add task and the task edit form) validate through VeeValidate paired with a Zod schema: the schema defines the rules and the form renders inline per-field errors before submit
- All libraries are installed via npm and bundled locally; no CDN imports of scripts, styles, fonts, or icons
- Seed exactly the four tasks above so the July 18, July 19, and July 20 columns are non-empty on first load; the other 18 columns start empty with a 0:00 total
- Document title MUST be Cadence
- Zero navigational outbound links; synthetic demo data only
- Desktop layout: fixed left nav rail, central multi-day board, fixed right calendar rail
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

Bindings:
- Browsable entity: tasks
- Destinations: board; calendar-day-panel
- Entity: task
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; done; channel; planned-time; day; start-time

Mechanics exclusions:
- Calendar panel day-scroll / hour-grid gestures stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
