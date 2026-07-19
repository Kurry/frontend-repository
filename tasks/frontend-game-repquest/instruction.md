<summary>
Build a fitness-quest game-sim called RepQuest using Svelte 5 in runes mode, shared $state and $derived stores, and Tailwind CSS, rendering the quest map and the weekly summary chart with hand-written HTML5 Canvas 2D.
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
- The app opens into a Quest tab showing a canvas-rendered quest map: a horizontal path with numbered waypoint markers; a character sprite sits on the path at a position derived from lifetime reps logged so far
- A Log Reps form (a number input plus a Log reps button) accepts a positive whole number; submitting it adds that count to today's total and to lifetime reps, and the character visibly advances along the canvas path toward the next waypoint without a page reload
- Submitting the Log Reps form with an empty field, zero, a negative number, or a non-integer value shows a visible inline error and does not change today's total, lifetime reps, or the character position
- A Daily Goal setting in the Settings tab (a target rep count, editable and saved with its own Save control) drives a progress indicator on the Quest tab showing today's logged reps against that goal; the indicator's fill color is visually distinct below half of goal, at or above half, and at or above the full goal
- A Current Streak counter on the Quest tab increases by one for each consecutive calendar day the daily goal is met (compared using the browser's local date) and resets to zero the first day the goal is missed
- Reaching a waypoint unlocks its zone (Foothills, Canyon, Summit); the quest map canvas background (sky and ground colors) switches to that zone's own distinct palette, and a one-time "Zone Unlocked" notification appears the first time each zone is reached, never again after
- Specific waypoints render as a Boss Challenge marker, visibly larger and differently colored than normal waypoints; clearing one requires logging a single set with at least that boss's stated minimum rep count once lifetime reps have reached the waypoint. A qualifying set permanently marks the boss defeated (the marker switches to a defeated treatment) and awards bonus Quest Points
- A Gear tab (Gear Shop) lists cosmetic character outfits, each showing its Quest Point cost and a locked or unlocked state; spending enough Quest Points unlocks an outfit, and selecting an unlocked outfit equips it, immediately changing the character's appearance on the quest map canvas
- A History tab lists every logged set (rep count plus date/time), most recent first, each with its own Delete control; deleting an entry removes it and recalculates today's total, lifetime reps, quest points, unlocked zones, defeated bosses, and the streak from the remaining entries. Before any set is logged, the History tab shows a placeholder message instead of an empty list
- A canvas-rendered weekly summary bar chart on the Quest tab shows total reps logged per day for the last 7 calendar days, with a visible goal reference line; days with zero reps still render a visible zero-height tick, never a blank chart area
- A Daily Reminder on/off toggle and a reminder-hour selector live in Settings; when the toggle is on and the configured hour has passed on the current day with today's goal still unmet, an in-app banner appears; it does not appear when the toggle is off or once the goal is met
- A Reset Quest control in Settings opens a confirmation dialog before acting; confirming wipes lifetime reps, streak, quest points, unlocked zones and gear, and the full rep history back to a fresh start; canceling leaves all state untouched
- Lifetime reps, current waypoint position, streak, quest points, unlocked zones and gear, equipped gear, and the full rep history all survive a full page refresh
- A Game Mode control switches between two distinct modes: Quest mode (the map, Log Reps form, progress panel, and weekly chart) and Challenge mode (a dedicated Boss Challenge panel). Switching modes does not lose any data from the other mode
- In Challenge mode, Start run / Pause / Resume / End run controls drive an explicit run lifecycle (idle to active, active to paused, paused to active, active or paused to ended, and restart back to idle); each transition is only available from its legal predecessor state and unavailable transitions are disabled controls, not silently ignored ones. Logging reps while a challenge run is not active shows visible feedback and does not advance the run
- Logging 25 rep sets back to back in immediate succession (rapid deterministic repetitions of the same Log Reps action) leaves lifetime reps, today's total, and the History list exactly matching the sum of what was entered, with no dropped, duplicated, or corrupted entries and no frozen or blank screen
- A "History state" region on the Quest tab shows the label of the current history snapshot plus the current lifetime reps, streak, and quest points; Undo and Redo controls step backward and forward through a recorded sequence of state snapshots (logging a set, deleting a set, buying gear, equipping gear, updating the daily goal, and an "Apply scenario change" action each record a snapshot). Undo followed by a different action creates a new selectable branch in a branch list rather than overwriting or silently discarding the redo-able snapshots; selecting an older branch restores its exact prior visible state (lifetime reps, streak, quest points, history list). Undo and Redo controls are disabled, not merely ignored, when there is nothing to undo or redo. An "Apply scenario change" button in this region visibly mutates state (rotating through a small set of scenario effects) and is recorded in the same history
</core_features>

<visual_design>
- Zone identity: each unlocked zone (Foothills, Canyon, Summit) paints the quest map canvas with its own distinct sky/ground palette so the current region is identifiable at a glance
- Boss marker distinction: Boss Challenge waypoints render visibly larger and in a different color than normal waypoints, with a clearly different "defeated" treatment once cleared
- Goal-progress color coding: the daily-goal progress fill uses a clear color threshold (below half, at/above half, at/above goal) so progress reads without checking the numbers
- Locked vs. unlocked gear: locked outfits in the Gear Shop show a muted/grayscale treatment that turns to full color once unlocked; the equipped outfit is clearly marked as selected among the unlocked options
- Empty states: before any set is logged, the History tab shows a friendly placeholder message, and the weekly summary chart shows all-zero bars rather than a blank area
- Narrow viewport: at about 375px wide, the quest map canvas, forms, and weekly chart scale to fit their container without introducing horizontal scrolling
- Legible at narrow width: at about 375px, today's/lifetime rep totals, the Current Streak count, History entry labels, and Settings labels stay legible and reflow or scale to fit rather than truncating or overflowing
- Tab navigation (Quest / History / Gear / Settings) is visually distinct for the active tab versus inactive tabs
</visual_design>

<motion>
- All buttons (Log Reps, Gear Shop Equip/Unlock, Reset Quest, History Delete controls, Settings Save/toggle controls, Game Mode buttons, Start/Pause/Resume/End run, Undo/Redo/Apply scenario change) show a visible hover state and a visible focus ring when reached by keyboard Tab
- The character sprite advances smoothly (glides, not teleports) along the quest map canvas path when a new set is logged
- Zone transitions on the quest map canvas swap the background palette as soon as a new zone is reached
- A transient notification banner slides/fades in when a zone unlocks, a boss is defeated, gear is bought, or the quest is reset, and dismisses itself shortly after
- The Daily Reminder banner uses a noticeable attention treatment (e.g. a pulse) while visible
- History Delete controls reveal on row hover/focus on wider viewports
</motion>

<requirements>
Build with Svelte 5 in runes mode: shared application state lives in $state and $derived runes (a single store class or module is expected). Style with Tailwind CSS via the pre-installed Vite plugin. Render the quest map and the weekly summary bar chart with hand-written HTML5 Canvas 2D — do not add a game engine, physics library, or charting library.
Persistence: use localStorage so lifetime reps, current waypoint, streak, quest points, unlocked zones and gear, equipped gear, and the full rep history survive a full page refresh; guard every localStorage access so a production build never crashes when storage is unavailable. Losing this state on refresh is a functional defect, not an acceptable simplification.
State contracts (behavioral):
- Logging a set is the single source of truth for lifetime reps, today's total, quest points, zone unlocks, and boss clears; every panel that shows these numbers reads the same shared state
- Deleting a history entry recomputes lifetime reps, quest points, unlocked zones, defeated bosses, and the streak from the remaining entries rather than only adjusting a running total
- Quest mode and Challenge mode share the same underlying quest state; switching modes never discards logged reps, history, or quest points
- The undo/redo history and its "History state" region track every state-changing action (log reps, delete set, buy gear, equip gear, update daily goal, apply scenario change); branching after an undo preserves the abandoned branch as a separate, selectable entry rather than deleting it
No backend, no authentication, and no routes other than the single page. Rep counts are entered manually by the user; there is no camera, motion sensor, or device API integration. "Today" and streak comparisons use the browser's local date.
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

Bindings:
- Destinations: quest; history; gear; settings
- Entity: rep-set
- Entity operations: create; delete; select; toggle
- Entity fields: reps; setId; gearId
- Value bounds: {"reps":{"min":1,"max":9999}}
- Session operations: start; pause; resume; stop; restart; trigger_demo

Mechanics exclusions:
- Undo/Redo branch restoration and History-state panel stay Playwright-observed
- Character glide animation stays Playwright-observed
- Zone-unlock palette and boss-defeated marker stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
