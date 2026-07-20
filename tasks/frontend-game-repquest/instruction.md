<summary>
Build a fitness-quest game-sim called RepQuest using Svelte 5 in runes mode, shared $state and $derived stores, Tailwind CSS 4.3.2, and Skeleton for the meta screens, rendering the quest map and the weekly summary chart with hand-written HTML5 Canvas 2D.
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
Feature: Quest map and rep logging (API-shaped rep-set payload) —
- The app opens into a Quest tab showing a canvas-rendered quest map: a horizontal path with numbered waypoint markers; a character sprite sits on the path at a position derived from lifetime reps logged so far
- A Log Reps form accepts a create-rep-set request body with required field reps (positive whole number integer from 1 through 9999 inclusive) and optional field note (string, max 120 characters). Submitting a valid form adds that set to today's total and lifetime reps; the character visibly advances along the canvas path toward the next waypoint without a page reload; when note is present it appears on the matching History row
- The Log Reps form validates before submit: while reps is empty, zero, negative, non-integer, or outside 1 through 9999, or while note exceeds 120 characters, an inline error message names the field (reps or note) and the rule it breaks, and the Log reps control is disabled or rejects the submission without mutating totals
- Each successful Log Reps submit creates a rep-set record whose visible fields match that request body plus generated fields setId (stable id string) and loggedAt (ISO-8601 timestamp or equivalent YYYY-MM-DDTHH:mm:ss.sssZ / local timestamp format shown on the History row)
Feature: Daily goal, streak, reminders, and settings payload —
- A Settings form models a settings request body with required fields dailyGoal (positive whole number integer from 1 through 9999), reminderEnabled (boolean on/off), and reminderHour (integer hour from 0 through 23 inclusive). Saving writes that record; the saved settings ARE that request body
- The Daily Goal drives a progress indicator on the Quest tab showing today's logged reps against that goal; the indicator's fill color is visually distinct below half of goal, at or above half, and at or above the full goal
- Editing dailyGoal, reminderEnabled, or reminderHour with an invalid value shows an inline error naming the field before submit, and Save does not apply the invalid value
- A Current Streak counter on the Quest tab increases by one for each consecutive calendar day the daily goal is met (compared using the browser's local date) and resets to zero the first day the goal is missed
- When reminderEnabled is on and reminderHour has passed on the current day with today's goal still unmet, an in-app banner appears; it does not appear when reminderEnabled is off or once the goal is met
Feature: Zones and bosses —
- Reaching a waypoint unlocks its zone (Foothills, Canyon, Summit); the quest map canvas background (sky and ground colors) switches to that zone's own distinct palette, and a one-time Zone Unlocked notification appears the first time each zone is reached, never again after
- Specific waypoints render as a Boss Challenge marker, visibly larger and differently colored than normal waypoints; clearing one requires logging a single set with at least that boss's stated minimum rep count once lifetime reps have reached the waypoint. A qualifying set permanently marks the boss defeated (the marker switches to a defeated treatment) and awards bonus Quest Points
Feature: Challenge mode competitive loop —
- A Game Mode control switches between Quest mode (the map, Log Reps form, progress panel, and weekly chart) and Challenge mode (a dedicated Boss Challenge panel)
- In Challenge mode, a Difficulty control offers exactly three levels — Easy, Normal, Hard — and changing difficulty observably changes the active boss target's minimum-rep requirement (Hard requires more reps than Normal, Normal more than Easy) shown as a visible target number before the run starts
- Start run / Pause / Resume / End run controls drive an explicit run lifecycle (idle to active, active to paused, paused to active, active or paused to ended, and restart back to idle); each transition is only available from its legal predecessor state and unavailable transitions are disabled controls, not silently ignored ones
- Every challenge run reaches a decided end state announced visibly: Victory when the run's logged reps meet or exceed the difficulty-adjusted boss minimum before End run, or Defeat when the player ends the run without meeting that target. The result panel names Victory or Defeat and shows the run's logged reps versus the target; Restart or New run returns to a clean idle starting position with no reps, timer, or result leaking from the previous run
Feature: Save and resume challenge —
- During an active or paused challenge run after at least one set has been logged in that run, Save Progress shows a Saved confirmation and writes a schema-shaped checkpoint with fields runStatus (active or paused), bossWaypointId, difficulty (Easy, Normal, or Hard), repsLogged, targetReps, and savedAt (timestamp)
- After a full page reload, Resume Saved Run restores that checkpoint so runStatus, boss target, difficulty, repsLogged, and targetReps match what was saved. Save Progress is unavailable or clearly disabled when no run is active or paused; Resume Saved Run is unavailable when no checkpoint exists
Feature: Gear shop —
- A Gear tab (Gear Shop) lists cosmetic character outfits, each showing its Quest Point cost and a locked or unlocked state; spending enough Quest Points unlocks an outfit, and selecting an unlocked outfit equips it, immediately changing the character's appearance on the quest map canvas
Feature: History, personal records, and streak heat-map —
- A History tab lists every logged set (reps, optional note, and date/time), most recent first, each with its own Delete control
- A Personal Records panel on the Quest or History tab shows live-derived readouts for bestSingleSet (highest reps in any one set) and bestDayTotal (highest calendar-day sum); logging a new set that beats either record updates that readout immediately without a reload
- A streak heat-map on the Quest or History tab shows the last 28 local calendar days as cells whose fill intensity reflects that day's total reps relative to the daily goal (empty/zero, below goal, and at-or-above goal are visually distinct); logging reps for today updates today's cell without a reload
- A canvas-rendered weekly summary bar chart on the Quest tab shows total reps logged per day for the last 7 calendar days, with a visible goal reference line
Feature: Quest log export and import (useful end state) —
- The app produces the user's Quest Log — the portable artifact of the session. An Export Quest Log control compiles live from current state a downloadable and copyable JSON document whose top-level object includes required fields schemaVersion (string), exportedAt (timestamp), dailyGoal (integer), streak (integer), lifetimeReps (integer), questPoints (integer), unlockedZones (array of zone name strings), unlockedGearIds (array of gear id strings), equippedGearId (string), defeatedBossIds (array of waypoint id numbers or strings), and sets (array of rep-set records each with setId, reps, loggedAt, and note when present). Copy shows a brief Copied confirmation. With at least one logged set, the sets array contains that session's actual reps and timestamps — not a blank stub or hardcoded sample
- An Export Workout CSV control downloads a CSV-shaped text file with a header row date,reps,note and one data row per logged set in chronological order, reflecting the same session sets as the JSON export
- An Import Quest Log control accepts a previously exported Quest Log JSON. A valid import reconstructs lifetime reps, streak, quest points, unlocked zones and gear, equipped gear, defeated bosses, daily goal, and the History list so exported-then-reimported values match. Malformed JSON or a payload missing required fields shows a visible rejection naming that the file is invalid and changes nothing
Feature: Reset and undo/redo —
- A Reset Quest control in Settings opens a confirmation dialog before acting; confirming wipes lifetime reps, streak, quest points, unlocked zones and gear, the full rep history, personal records, heat-map day cells, and any challenge checkpoint back to a fresh start
- A History state region on the Quest tab shows the label of the current history snapshot plus the current lifetime reps, streak, and quest points, alongside Undo, Redo, and Apply scenario change controls; the Apply scenario change button visibly mutates state (rotating through a small set of scenario effects) and is recorded in the same snapshot history as other state-changing actions
</core_features>

<user_flows>
User flows (end-to-end chains the finished app must exhibit; each step names its visible state evidence):
- Logging a valid set from the Quest tab increases today's total and lifetime reps by exactly the entered count, glides the character forward on the quest map, grows today's bar in the weekly summary chart, updates today's heat-map cell and personal records when broken, and switching to the History tab shows the new entry at the top of the list with its rep count, optional note, and timestamp, all without a page reload; after a full page refresh, today's total, lifetime reps, the character position, and the History entry all show the same values
- Deleting a history entry removes exactly that entry from the History list and recalculates today's total, lifetime reps, quest points, unlocked zones, defeated bosses, the streak, personal records, and heat-map cells from the remaining entries; returning to the Quest tab shows the recomputed totals, character position, and weekly chart without a reload, and a page refresh preserves the recomputed state
- Unlocking an outfit in the Gear Shop decreases the visible Quest Point balance by exactly the outfit's cost and flips its card from locked to unlocked; equipping it immediately changes the character's appearance on the quest map canvas, and after a page refresh the balance, the unlocked state, and the equipped appearance are all preserved
- Saving a new Daily Goal in Settings immediately re-scales the Quest tab progress indicator and moves the goal reference line on the weekly summary chart to the new target, without a reload
- Challenge Victory path: switching to Challenge mode, choosing a difficulty, starting a run, logging enough reps during the active run to meet the shown target, then ending or auto-resolving shows a Victory result with logged reps at or above the target; Restart returns to idle with zero run reps and no Victory banner leftover
- Challenge Defeat path: starting a run and ending it before the target is met shows a Defeat result naming Defeat and the shortfall; a new run starts clean
- Save and resume: during an active challenge run after logging at least one set, Save Progress confirms Saved; after a full page refresh, Resume Saved Run restores the same difficulty, target, and repsLogged
- Export then import: after logging at least two distinct sets and unlocking one gear item, Export Quest Log produces JSON whose sets array includes those exact reps and whose unlockedGearIds and lifetimeReps match the UI; Import Quest Log after Reset Quest reconstructs the same History list, lifetime reps, streak, quest points, unlocked gear, and equipped appearance; the Workout CSV download's data rows match the same sets
- Switching from Quest mode to Challenge mode and back preserves all data from both modes: lifetime reps, today's total, quest points, the History list, and any in-progress challenge run state are identical before and after the round trip
- Undo and Redo step backward and forward through a recorded sequence of state snapshots (logging a set, deleting a set, buying gear, equipping gear, updating the daily goal, and an Apply scenario change action each record a snapshot); each Undo or Redo updates the History state region's snapshot label and the displayed lifetime reps, streak, and quest points to that snapshot's values
- Undo followed by a different action creates a new selectable branch in a branch list rather than overwriting or silently discarding the redo-able snapshots; selecting an older branch restores its exact prior visible state (lifetime reps, streak, quest points, History list)
- Lifetime reps, current waypoint position, streak, quest points, unlocked zones and gear, equipped gear, the full rep history, personal records, heat-map day totals, settings, and any challenge checkpoint all survive a full page refresh
</user_flows>

<edge_cases>
- Submitting the Log Reps form with an empty field, zero, a negative number, a non-integer value, or reps outside 1 through 9999 shows a visible inline error naming the reps field and does not change today's total, lifetime reps, or the character position
- Submitting with a note longer than 120 characters shows an inline error naming the note field and does not create a History entry
- Before any set is logged, the History tab shows a placeholder message that explains what will appear there instead of an empty list
- Days with zero reps in the weekly summary chart still render a visible zero-height tick, never a blank chart area; heat-map cells for days with zero reps use the empty treatment
- Canceling the Reset Quest confirmation dialog leaves all state untouched
- Logging reps while a challenge run is not active shows visible feedback and does not advance the run
- Undo and Redo controls are disabled, not merely ignored, when there is nothing to undo or redo
- Logging 25 rep sets back to back in immediate succession (rapid deterministic repetitions of the same Log Reps action) leaves lifetime reps, today's total, and the History list exactly matching the sum of what was entered, with no dropped, duplicated, or corrupted entries and no frozen or blank screen
- Importing a malformed Quest Log JSON leaves lifetime reps, History, gear, and settings unchanged and shows a visible invalid-file rejection
- Export Quest Log with zero logged sets still downloads a valid JSON document whose sets array is empty and whose lifetimeReps is 0, never a crash or blank download
- Resume Saved Run is disabled when no checkpoint exists; Save Progress is disabled when the challenge run is idle or already ended
- Changing difficulty while a run is active is disabled or rejected with visible feedback and does not alter the in-progress target mid-run
</edge_cases>

<visual_design>
- Zone identity: each unlocked zone (Foothills, Canyon, Summit) paints the quest map canvas with its own distinct sky/ground palette so the current region is identifiable at a glance
- Boss marker distinction: Boss Challenge waypoints render visibly larger and in a different color than normal waypoints, with a clearly different defeated treatment once cleared
- Goal-progress color coding: the daily-goal progress fill uses a clear color threshold (below half, at/above half, at/above goal) so progress reads without checking the numbers
- Locked vs. unlocked gear: locked outfits in the Gear Shop show a muted/grayscale treatment that turns to full color once unlocked; the equipped outfit is clearly marked as selected among the unlocked options
- Empty states: before any set is logged, the History tab shows a friendly placeholder message, and the weekly summary chart shows all-zero bars rather than a blank area
- Tab navigation (Quest / History / Gear / Settings) is visually distinct for the active tab versus inactive tabs
- Meta screens (tab bar, Settings forms, Gear Shop cards, History list, dialogs, notification banners, Export/Import controls, Personal Records, and the streak heat-map) share one cohesive component styling with consistent surfaces, borders, and spacing, visually distinct from the hand-rendered canvas play surfaces
- Victory and Defeat result panels are visually distinct from each other (success-toned vs warning/defeat-toned) so the decided outcome reads at a glance
- Heat-map cells for empty, below-goal, and at-or-above-goal days are visually distinct by fill intensity or color
- Icons appear from a single consistent icon set across tabs, buttons, and status indicators; no mismatched icon styles
</visual_design>

<motion>
- All buttons (Log Reps, Gear Shop Equip/Unlock, Reset Quest, History Delete controls, Settings Save/toggle controls, Game Mode buttons, Start/Pause/Resume/End run, Undo/Redo/Apply scenario change, Export Quest Log, Export Workout CSV, Import Quest Log, Save Progress, Resume Saved Run, Difficulty controls) show a visible hover state and a visible focus ring when reached by keyboard Tab
- The character sprite advances smoothly (glides, not teleports) along the quest map canvas path when a new set is logged
- Zone transitions on the quest map canvas swap the background palette as soon as a new zone is reached
- A transient notification banner slides/fades in when a zone unlocks, a boss is defeated, gear is bought, the quest is reset, a Quest Log is exported or imported, or a challenge resolves to Victory or Defeat, and dismisses itself shortly after
- Defeating a boss or achieving Challenge Victory triggers a brief one-time confetti-style particle celebration over the quest map or challenge panel, tied to the qualifying action itself; it does not loop ambiently and does not fire for ordinary sets or Defeat
- Adding a set animates the new entry into the top of the History list, and deleting an entry animates it out rather than snapping
- The Daily Reminder banner uses a noticeable attention treatment (e.g. a pulse) while visible
- History Delete controls reveal on row hover/focus on wider viewports
- The Victory and Defeat result panels animate in (fade or slide) when the run resolves rather than appearing with no transition
</motion>

<responsiveness>
- At about 375px wide, the quest map canvas, forms, weekly chart, heat-map, and export controls scale to fit their container without introducing horizontal scrolling
- At about 375px, today's/lifetime rep totals, the Current Streak count, History entry labels, Settings labels, Victory/Defeat result text, and Personal Records readouts stay legible and reflow or scale to fit rather than truncating or overflowing
</responsiveness>

<accessibility>
- Every interactive control (tabs, form fields, buttons, toggles, Export/Import, Difficulty, Save Progress, Resume Saved Run) is reachable and operable with the keyboard alone, with a visible focus indicator
- The Reset Quest confirmation dialog traps focus while open, closes on Escape, and returns focus to the Reset Quest control on close
- Transient notification banners (zone unlocked, boss defeated, gear bought, quest reset, daily reminder, export/import feedback, Victory, Defeat) are announced through an aria-live region as well as shown visually
- Each canvas surface (quest map, weekly summary chart) carries an accessible label describing what it shows, and the numbers it visualizes (today's total, lifetime reps, per-day totals) are also available as visible text outside the canvas
- Victory versus Defeat is distinguishable by text (the words Victory and Defeat), not by color alone
- The streak heat-map exposes a text summary of recent day totals or an accessible description so the pattern is not color-only
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app: logging, deleting, gear purchases, mode switches, challenge Victory and Defeat, save/resume, export/import, undo/redo, and reset
- Canvas rendering stays smooth during character movement and chart updates, with no visible freezes or blanked frames
- Export Quest Log and Export Workout CSV complete without freezing the UI for multi-second hangs on a history of at least 25 sets
</performance>

<writing>
- Headings, tab labels, and buttons use one consistent capitalization convention throughout the app
- Validation and feedback messages name the problem and the fix (e.g. which field is invalid and what a valid value looks like); the History empty state explains what belongs there and how to log a first set; import rejection names that the file is invalid
- Victory and Defeat copy uses those exact outcome words so the decided result is unambiguous
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Build with Svelte 5 in runes mode: shared application state lives in $state and $derived runes (a single store class or module is expected). Style with Tailwind CSS 4.3.2 (pinned) via the Vite plugin, with design tokens in @theme. Use Skeleton as the component library for the meta screens — the tab navigation, Settings forms, Gear Shop cards, History list chrome, the Reset confirmation dialog, notification banners/toasts, Export/Import controls, Personal Records, and the streak heat-map — while the quest map and weekly chart remain hand-rendered canvas.
Render the quest map and the weekly summary bar chart with hand-written HTML5 Canvas 2D — do not add a game engine, physics library, or charting library.
Animation: the hand-written canvas loop drives map motion; Svelte transitions and CSS handle UI motion; @neoconfetti/svelte is allowed for the boss-defeat and Challenge Victory celebration. No other animation libraries.
Icons: phosphor-svelte icons only, installed via npm; no raw copy-pasted SVGs and no icon CDN.
Forms: every form (Log Reps, Daily Goal / reminder settings, and any import confirmation fields) is driven by Felte paired with Zod schemas — the schemas define the validation rules as API-shaped payloads (create-rep-set body, settings body, Quest Log document) and the form surfaces inline per-field errors before submit.
Persistence: use localStorage so lifetime reps, current waypoint, streak, quest points, unlocked zones and gear, equipped gear, the full rep history, settings, personal-record highs, heat-map day totals, and any challenge checkpoint survive a full page refresh; guard every localStorage access so a production build never crashes when storage is unavailable. Losing this state on refresh is a functional defect, not an acceptable simplification.
State contracts (behavioral):
- Logging a set is the single source of truth for lifetime reps, today's total, quest points, zone unlocks, and boss clears; every panel that shows these numbers reads the same shared state
- Deleting a history entry recomputes lifetime reps, quest points, unlocked zones, defeated bosses, the streak, personal records, and heat-map day totals from the remaining entries rather than only adjusting a running total
- Quest mode and Challenge mode share the same underlying quest state; switching modes never discards logged reps, history, or quest points
- Challenge runs always resolve to a visible Victory or Defeat before a new clean run; difficulty changes the target observably and cannot silently rewrite an active run's target
- Export Quest Log and Export Workout CSV are compiled live from the store; an export that omits sets the session actually logged is a functional defect
- Importing a valid Quest Log reconstructs the same visible state; malformed import leaves state unchanged
- The undo/redo history and its History state region track every state-changing action (log reps, delete set, buy gear, equip gear, update daily goal, apply scenario change); branching after an undo preserves the abandoned branch as a separate, selectable entry rather than deleting it
All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
No backend, no authentication, and no routes other than the single page. Rep counts are entered manually by the user; there is no camera, motion sensor, or device API integration. Today and streak comparisons use the browser's local date.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
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
- Destinations: quest; history; gear; settings
- Entity: rep-set
- Entity operations: create; delete; select; toggle
- Entity fields: reps; setId; gearId; note
- Value bounds: {"reps":{"min":1,"max":9999}}
- Session operations: start; pause; resume; stop; restart; trigger_demo
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: quest-log

Mechanics exclusions:
- Undo/Redo branch restoration and History-state panel stay Playwright-observed
- Character glide animation stays Playwright-observed
- Zone-unlock palette and boss-defeated marker stay Playwright-observed
- File-picker Import and download/clipboard artifact bytes stay Playwright-only per artifact-transfer restrictions
- Challenge Victory/Defeat celebration and character confetti stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
