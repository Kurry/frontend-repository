<summary>
Build a falling-tile word game called LetterDrop using React, Zustand, and Tailwind CSS.
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
- The app opens directly at / with no login or backend, showing the title LetterDrop, a HUD, view tabs (Game, History, Achievements), and a canvas game board that reads "Press Start game to begin!" before a run starts.
- Pressing Start game begins a run: letter tiles spawn at the top of the canvas board and fall downward through six columns at a steady rate; the board fills over time as more tiles spawn on a repeating interval.
- Falling accelerates gradually: as the score crosses fixed thresholds the fall speed and spawn rate increase, and a status readout shows the current tier as Tier 1, Tier 2, Tier 3, and so on.
- Clicking or tapping a falling tile selects it and appends its letter to a current-word tray shown beneath the board; clicking an already selected tile toggles it back off.
- Pressing Submit Word validates the tray letters against a bundled in-browser dictionary word list (never an external dictionary API); a valid word clears those tiles from the board and awards points scaled by word length, shown as a transient confirmation such as +30 for "CAT"!.
- Submitting letters that do not form a dictionary word does not silently reject: the word tray shakes and an inline "Not a word" style message appears, and the streak resets.
- Fully clearing every tile on the board through valid submissions triggers a Board Cleared! confirmation and a bonus multiplier that is applied to the next scored word.
- A visible horizontal danger line sits across the board; any uncleared tile whose body crosses that line ends the run and shows a Game Over screen with the final score and a Play again control.
- Consecutive valid submissions without an invalid attempt build a visible streak meter; reaching streak thresholds of 3, 5, and 8 grants a temporary score-multiplier badge shown next to the score, and an invalid submission resets the streak to zero.
- Distinctly styled Bomb tiles and Slow tiles spawn occasionally: including a Bomb tile in a submitted word clears that tile's whole column and shows a named toast such as "Bomb! Column cleared"; including a Slow tile temporarily reduces fall speed for a few seconds and shows a named "Slow" toast.
- An Undo Last Tile control removes the most recently tapped tile from the current-word tray without submitting the word.
- A Pause control freezes tile fall and the run timer and dims the board with a Paused overlay; a Resume control continues from the exact same state.
- A Best Score is tracked and displayed at all times, updating when a run's final score beats the previous best.
- A Match History panel lists past runs most recent first, each showing that run's score, tiles-cleared count, and duration; before any run has finished it shows a friendly empty-state message.
- An Achievements panel shows every named achievement with a locked or unlocked state: Clean Sweep unlocks on clearing the board at least once, Marathon on a run lasting three or more minutes, Combo Master on reaching a streak of eight or more, plus additional milestone badges; locked badges are muted or grayscale and turn to full color when unlocked, and unlocking one shows a transient confirmation.
- Best score, match history, and unlocked achievements survive a full page refresh via localStorage; deleting or never-creating data is not revived on reload.
</core_features>

<visual_design>
- Light UI on a #F5F5F7 background with the vivid blue accent #007AFF reserved for the primary call to action (Submit Word), links, and key highlights such as the active streak badge and the current difficulty tier readout.
- Color tokens: primary #E6EEF7, secondary #54C3FA, accent #007AFF, background #F5F5F7, text-primary #1D1D1E, link #007AFF.
- Typography uses an Arial-based stack (-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif); H1 is 34px, H2 is 17px, and body text is 17px.
- Base spacing unit is 4px; panels and cards use a 6px border radius.
- Primary buttons (Submit Word, Pause) use background #007AFF, text #FEFEFE, a full pill shape (border radius 1000px), and no shadow.
- Secondary buttons (Undo Last Tile, Resume) use background #E6EEF7, text #007AFF, a full pill shape, and no shadow.
- Bomb and Slow power tiles are visually distinct from ordinary letter tiles and from each other in shape and color, and remain readable at normal fall speed.
- The danger line is always visible and reads as a hazard (a warning-toned line or gradient) distinct from the rest of the board background.
- The active streak badge and difficulty tier are visually highlighted so the player can read their current state at a glance.
- Match History shows a friendly empty state before any run completes; locked achievements use a muted or grayscale treatment that turns to full color once unlocked.
- All buttons (Submit Word, Undo Last Tile, Pause, Resume) show a visible hover state, and keyboard Tab focus is visible on every interactive control.
- Submitting a valid word, triggering a power tile, and unlocking an achievement each show a transient confirmation (toast or equivalent) that does not block further play.
- At roughly 375px wide the board and HUD scale to fit without horizontal scrolling and tiles stay large enough to tap comfortably.
</visual_design>

<motion>
- Tiles animate downward continuously via a hand-rolled requestAnimationFrame fall loop driving the canvas; motion is smooth and the fall rate increases gradually rather than snapping.
- The combo streak meter fills or animates as consecutive valid submissions accrue and resets visibly on an invalid submission.
- An invalid submission shakes the word tray as its inline rejection feedback.
- Power-tile activations (Bomb, Slow), valid-word scoring, Board Cleared, and achievement unlocks each surface a transient on-screen toast that fades on its own without blocking play.
- Pausing dims the board with a Paused overlay and freezes all tile motion and the timer; resuming restarts motion from the frozen state.
- Buttons show hover and focus-visible transitions on the real controls.
</motion>

<requirements>
- Stack mandate (preserve exactly): React 19 with functional components as a client-rendered Vite single-page app; Zustand for shared app state; Tailwind CSS for styling; HTML5 Canvas 2D for the falling-tile board driven by hand-written TypeScript. Runtime is Node 20. xstate and @xstate/react are available. Do not pull in a game engine or physics library; the fall loop is a hand-rolled requestAnimationFrame update driving canvas rendering.
- No backend, no database, no network calls, and no authentication; the app opens directly into the interface at /. Word validity is checked entirely against a bundled in-browser word list, never an external dictionary API. The bundled list must contain enough common short words that an attentive player can regularly clear tiles.
- Persistence: use localStorage so that Best Score, Match History, and unlocked Achievements survive a full page refresh; guard all storage access so the production build does not crash when storage is unavailable. On reload the exact committed state is restored, and data that was never created is not fabricated.
- Single player, single board, single route /. In-app panels (Match History, Achievements) are shown and hidden within the single page.
- Real-time simulation correctness is the core of the task and must be observable: tiles spawn at the top and fall at a steady, gradually accelerating rate; tapping tiles builds the current-word tray; Submit Word validates against the bundled dictionary and, if valid, clears those tiles and awards points scaled by word length; clearing every tile triggers a Board Cleared! bonus multiplier applied to the next scored word; a tile crossing the danger line uncleared ends the run into Game Over with the final score; streak thresholds 3, 5, and 8 grant a temporary multiplier badge next to the score; Bomb tiles clear their whole column when submitted and Slow tiles temporarily reduce fall speed, each with a named toast; fall speed and spawn rate increase as score crosses thresholds with the current tier shown in a status readout; non-dictionary submissions shake the tray and show inline Not a word rather than silently rejecting; Undo Last Tile removes the most recent tapped tile without submitting; Pause freezes fall and timer and dims the board while Resume continues from the same state.
- Application depth: expose mutable game entities (falling tiles, the current-word tray, run history) and multi-phase state transitions across at least two modes (for example setup/play and play/history). In one uninterrupted session the run crosses at least five legal state transitions including start, an active-state change, a terminal Game Over or checkpoint, restart, and pause/resume. Stale input from an earlier phase must never mutate the current run.
- Rapid-use robustness: the main run and its controls must withstand at least 25 rapid deterministic repetitions through the normal user controls with the final visible state exact, controls still responsive, and no blank screen, uncaught error, or sustained freeze.
- Adversarial baseline: reject illegal or unavailable actions with specific visible feedback, ignore stale input from an earlier phase, and handle rapid repeated activation without duplicating transitions or corrupting the last valid game state.
- Branching history (advanced): model edits to the run as explicit transitions and provide Undo and Redo controls plus a visible history panel. Provide a normal visible Apply Scenario Change action and expose the current snapshot in a region labelled History state. Invalid transitions are disabled. Undoing and then making a different change must create a selectable branch rather than corrupting or silently flattening history, and restoring a full branch restores the exact prior visible state.
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
- command-session-v1
- browse-query-v1

Module specs:
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

Bindings:
- Session operations: start; pause; resume; restart
- Destinations: game-board; match-history; achievements

Mechanics exclusions:
- Falling-tile canvas physics/timing and gradual acceleration stay Playwright-observed
- Tile tap selection and word-tray build stay Playwright-observed
- Danger-line crossing to Game Over stays Playwright-observed
- Combo streak meter animation, power-tile toasts, invalid-word tray shake stay Playwright-observed
- Undo Last Tile and narrow-viewport canvas scaling stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
