<summary>
Build a personal time-tracking productivity app using Svelte, Svelte stores, and Tailwind CSS.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- The app opens at / into a single-user time-tracking dashboard with no login: a header showing the ClockCraft wordmark, a Meaningful ratio stat, a Today's minutes stat, and a Meaningful streak stat, plus a Live timer panel, a Today's timeline, a Weekly overview chart, and an All entries list. It starts completely empty — no seeded entries and no seeded tags — so the timeline and list show friendly empty states on first load
- The Live timer takes an activity name and a required category, and clicking Start timer begins a running timer whose elapsed display increases about once per second; clicking Stop timer saves the elapsed time as a new entry that immediately appears in the timeline and the All entries list
- Only one timer runs at a time: starting a new timer while one is already running automatically stops and saves the previous timer as a completed entry with a nonzero duration, and shows a toast noting the switch, leaving only the new timer live
- An Add entry manually form logs a past activity from an activity name, a required category, a start time, and a duration in minutes without running a live timer; submitting adds the entry to the timeline and list with the specified name, category chip, and duration
- Every entry carries exactly one category — Meaningful, Neutral, or Draining — chosen from a required selector that always defaults to a valid value; each category renders as a visually distinct colored chip everywhere the entry appears
- A tag manager lets the user create reusable custom tags (for example Reading or Social Media) and one such tag can be assigned to any entry through the timer, the manual form, or the edit dialog; the assigned tag shows on or beside that entry
- The Today's timeline renders each of today's entries as a block whose size is proportional to its duration and whose color matches its category, with the activity name and duration legible in or beside each block; a 60-minute entry renders roughly twice as tall as a 30-minute entry
- The header Meaningful ratio shows the percentage of today's tracked minutes that are Meaningful versus Draining and recalculates immediately, with no reload, whenever an entry is started, stopped, added, edited, or deleted
- The Weekly overview is a seven-day stacked bar chart with one bar per day, each bar split into Meaningful, Neutral, and Draining segments sized to that day's minutes; today's bar grows a matching segment as soon as an entry is logged for today
- Clicking an entry opens an edit dialog prefilled with its current values where the name, category, tag, and duration can be changed; saving updates that entry's rendering — chip color, duration, and text — everywhere it appears and recomputes the ratio and chart
- Each entry has a labeled Delete control that opens a confirmation step; cancelling the confirmation leaves the entry in place, and confirming removes it from the timeline, the list, the ratio, and the chart
- A Meaningful streak counter shows the number of consecutive days on which Meaningful minutes exceeded Draining minutes, and reflects a multi-day streak built from prior days of tracked data
- Category filter buttons labeled All, Meaningful, Neutral, and Draining narrow the timeline and list to entries of the chosen category, and the active filter button is visibly highlighted
- A search input narrows the entry list as the user types, matching the typed text against activity name or assigned tag, and clearing the search restores the full list; a search or filter that matches nothing shows an explicit no-results message rather than a blank area
- Starting a timer, saving a manual entry, and deleting an entry each raise a transient toast confirmation that appears after the action and then dismisses on its own
- A View history control opens a history panel that models edits to the entry collection as explicit transitions: it shows Undo and Redo controls, a region labelled History state showing the current snapshot, a numbered list of snapshots, and an Apply scenario change action; Undo and Redo restore the exact adjacent visible states, and Undo or Redo is disabled when there is no adjacent state to move to
- Undoing one or more steps and then making a different change (for example Apply scenario change, or a new create, edit, or delete) creates a selectable alternate branch rather than silently discarding or flattening the abandoned states; the panel lists the alternate branches, and selecting a branch restores the exact prior visible state that branch represents
- The app never navigates away from /: all controls act through in-app state and there are no outbound navigational links in the chrome
</core_features>

<visual_design>
- Clean, airy productivity-tool composition on a light neutral background (about #F9FAFB) with white surface cards (about #FFFFFF) separated by hairline borders (about #E5E7EB); the header stats, timer, timeline, weekly chart, and entry list read as distinct rounded cards
- Three category colors that are distinguishable at a glance on both chips and chart segments: green for Meaningful (about #16A34A), slate for Neutral (about #64748B), and rose for Draining (about #E11D48)
- Body and UI text use a system sans-serif stack while the live timer digits and duration numbers use a monospace stack so they read as precise measurements, visibly distinct from surrounding text
- A 4px spacing base: cards and inputs use an 8px-scale rounded corner and buttons a slightly tighter 6px-scale corner; primary buttons are a solid dark fill with white text, and secondary buttons are outlined against the border color
- Timeline blocks are visibly proportional to duration and colored by category, with name and duration legible inside or beside each block
- The Meaningful ratio stat visually leans toward whichever side, Meaningful or Draining, currently has more minutes, using the meaningful and draining color tokens rather than a plain uncolored number
- The currently selected category filter is highlighted with a fill or underline so the active view is obvious
- Friendly empty states: before any entry exists the timeline invites the user to log a first activity, and a filter or search with no matches shows an explicit no-results message
- The weekly chart's stacked day segments stay individually legible with visible separation between days, and a small legend maps colors to categories
- Responsive down to about 375px wide: the layout reflows to a single column with no horizontal scrolling, and the Start timer and Add entry controls stay fully usable and legible
</visual_design>

<motion>
- Buttons, filter chips, and timeline entry blocks each show a visible hover state — a background, border, or shadow change — when the pointer is over them (hover feedback is required and is a common false done; do not omit it)
- Keyboard Tab focus is visibly indicated on every interactive control, including filter buttons, form fields, and entry rows
- The live timer's elapsed display updates about once per second while running and stays legible without visibly jittering or reflowing the rest of the page
- The Meaningful ratio and its colored lean bar animate their update in place when entries change, without a full reload
- Starting a timer, saving a manual entry, and deleting an entry each surface a transient toast that eases in and then dismisses on its own
- The edit dialog, delete confirmation, tag manager, and history panel appear as overlays anchored above the page and dismiss on cancel, backdrop click, or Escape
- Undo, Redo, and branch selection in the history panel update the visible timeline, list, ratio, and chart through the panel's real controls
</motion>

<requirements>
Shared application state must live in Svelte stores (writable and derived): the entries collection, custom tags, the live timer, the category filter and search text, the Meaningful streak, the transition history with its branches, and transient toasts. A change made through any control must flow through these shared stores so every view that shows it updates together without a reload.
Persistence is required: entries, tags, and the Meaningful streak must survive a full page refresh by persisting to localStorage and restoring the exact committed state on reload. Guard storage access so the production build does not crash when storage is unavailable. A reload must not revive an entry that was deleted before the reload.
State contracts (behavioral, not storage keys):
- Starting and stopping the live timer saves an entry whose duration reflects the elapsed time; starting a new timer while one runs auto-saves the previous one
- Submitting the manual form with a valid name, category, start time, and a duration of at least 1 minute adds exactly one entry; an empty name or a zero, negative, or non-numeric duration is rejected with a visible inline message and adds no entry
- Editing an entry updates that same record everywhere it appears and recomputes the ratio, streak, and chart; deleting an entry through its confirmation removes it from the list, timeline, ratio, streak, and chart
- The category filter and search recompute the visible timeline and list from the shared collection; they never create a second disconnected copy
- The Meaningful ratio, Today's minutes, weekly chart, and streak are all derived from the shared entries collection and update immediately as it changes
- Edits to the collection are recorded as explicit history transitions; Undo and Redo restore exact adjacent snapshots, invalid Undo or Redo is disabled, Apply scenario change and other changes after an Undo create a selectable branch instead of flattening history, and selecting a branch restores that branch's exact visible state
- The primary workflow must stay exact and responsive under at least 25 rapid repetitions through its normal controls, without a blank screen, uncaught error, or sustained freeze, and duplicate rapid submissions must not create duplicate records
Seeds and empty state: the app starts with no entries and no tags; the timeline and list show empty states until the user creates data.
Build tooling: a Vite single-page app built with Svelte 5 and the Tailwind CSS Vite plugin. No backend, no authentication, and no external UI component library; hand-rolled styling for the stack is expected. All controls act in-app with no outbound navigation.
Responsive: the layout reflows to a single column at about 375px wide with no horizontal scrolling and the Start timer and Add entry controls remain usable.
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
- entity-collection-v1
- browse-query-v1
- command-session-v1

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

Bindings:
- Entity: entry
- Entity operations: create; select; update; delete
- Entity fields: name; category; tag; duration; start-time
- Browsable entity: entries
- Destinations: timeline; weekly-chart; tag-manager
- Filters: category
- Session operations: start; stop; restart

Mechanics exclusions:
- Undo/Redo/branch selection and the History panel stay Playwright-driven via the real controls
- Live per-second timer tick stays Playwright-observed
- Duration-proportional timeline block sizing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
