<summary>
Build a falling-tile word game called LetterDrop using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens directly at / with no login or backend, showing the title LetterDrop, a HUD, view tabs (Game, History, Achievements), and a canvas game board that reads "Press Start game to begin!" before a run starts.
- Pressing Start game begins a run: letter tiles spawn at the top of the canvas board and fall downward through six columns at a steady rate; the board fills over time as more tiles spawn on a repeating interval.
- Falling accelerates gradually: as the score crosses fixed thresholds the fall speed and spawn rate increase, and a status readout shows the current tier as Tier 1, Tier 2, Tier 3, and so on.
- Clicking or tapping a falling tile selects it and appends its letter to a current-word tray shown beneath the board; clicking an already selected tile toggles it back off.
- Pressing Submit Word validates the tray letters against a bundled in-browser dictionary word list (never an external dictionary API); a valid word clears those tiles from the board and awards points scaled by word length, shown as a transient confirmation such as +30 for "CAT"!.
- Fully clearing every tile on the board through valid submissions triggers a Board Cleared! confirmation and a bonus multiplier that is applied to the next scored word.
- A visible horizontal danger line sits across the board; any uncleared tile whose body crosses that line ends the run and shows a Game Over screen with the final score and a Play again control.
- Consecutive valid submissions without an invalid attempt build a visible streak meter; reaching streak thresholds of 3, 5, and 8 grants a temporary score-multiplier badge shown next to the score, and an invalid submission resets the streak to zero.
- Distinctly styled Bomb tiles and Slow tiles spawn occasionally: including a Bomb tile in a submitted word clears that tile's whole column and shows a named toast such as "Bomb! Column cleared"; including a Slow tile temporarily reduces fall speed for a few seconds and shows a named "Slow" toast.
- An Undo Last Tile control removes the most recently tapped tile from the current-word tray without submitting the word.
- A Pause control freezes tile fall and the run timer and dims the board with a Paused overlay; a Resume control continues from the exact same state.
- A Best Score is tracked and displayed at all times, updating when a run's final score beats the previous best.
- A Match History panel lists past runs most recent first, each showing that run's score, tiles-cleared count, and duration.
- An Achievements panel shows every named achievement with a locked or unlocked state: Clean Sweep unlocks on clearing the board at least once, Marathon on a run lasting three or more minutes, Combo Master on reaching a streak of eight or more, plus additional milestone badges; unlocking one shows a transient confirmation.
Feature: Player settings form —
- A Settings control opens a settings form with a player name field (required, 2 to 20 characters) and a starting tier select (Tier 1, 2, or 3); the Save control stays disabled until every field is valid.
- Typing a one-character player name shows an inline validation message directly under the name field that names the field and the length rule, before any submit; correcting the name clears the message and enables Save.
- Saving valid settings closes the form; each Match History entry recorded afterwards shows the saved player name, and a run started afterwards begins at the chosen starting tier shown in the tier readout.
</core_features>

<user_flows>
User flows (each chain must hold without a page reload except where a reload is named):
- Full run round-trip: pressing Start game begins a run; submitting one valid word raises the score in the HUD and increments the streak meter; letting a tile cross the danger line shows Game Over with that run's final score; switching to the History tab shows exactly one new entry at the top listing the same final score, tiles-cleared count, and duration; if the final score beat the previous best, the Best Score readout shows the new value; after a full page reload the History entry and Best Score are still present.
- Achievement echo: fully clearing the board during a run shows the Board Cleared! confirmation, switching to the Achievements tab shows Clean Sweep flipped from locked to unlocked in full color without a reload, and the unlock confirmation toast appears at the moment of the clear; after a full page reload Clean Sweep remains unlocked.
- Streak build and reset: three consecutive valid submissions show the streak meter at 3 and a multiplier badge next to the score; one invalid submission then resets the meter to zero, removes the badge, and the next valid word scores without the streak multiplier.
- Settings round-trip: saving a new player name in the settings form, finishing a run, and opening the History tab shows the new entry carrying that name; entries recorded before the change keep their original name.
- Pause integrity: pausing mid-run freezes the timer value and all tile positions; resuming continues the timer from the frozen value and tiles from the frozen positions, and the score is unchanged by the pause itself.
</user_flows>

<edge_cases>
- Submitting letters that do not form a dictionary word does not silently reject: the word tray shakes, an inline "Not a word" style message appears, and the streak resets to zero.
- Pressing Submit Word with an empty tray does not end the run, deduct points, or reset the streak; it shows a visible rejection or the control is disabled.
- Activating Undo Last Tile when the tray is empty changes nothing and causes no error.
- Before any run has finished, the Match History panel shows a friendly empty-state message instead of a blank region.
- Rapidly activating Start game, Pause, Resume, or Submit Word multiple times in quick succession triggers each transition exactly once: no duplicate runs, no duplicate history entries, and no corrupted score.
- Input from an earlier phase is ignored: clicks on the board after Game Over, or tile taps issued while paused, do not mutate the current run.
- Deleting or never-creating persisted data is not revived on reload: with no prior runs, a reload still shows the empty history state and a zero Best Score.
</edge_cases>

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
- Locked achievements use a muted or grayscale treatment that turns to full color once unlocked.
- HUD panels, view tabs, dialogs, toasts, and the settings form use one consistent component style throughout the chrome; every icon in the chrome comes from a single icon set applied consistently.
- All buttons (Submit Word, Undo Last Tile, Pause, Resume, Save) show a visible hover state.
- Submitting a valid word, triggering a power tile, and unlocking an achievement each show a transient confirmation (toast or equivalent) that does not block further play.
- Inline validation messages in the settings form render in a clearly distinct error treatment directly under the field they name.
</visual_design>

<motion>
- Tiles animate downward continuously on the canvas board with smooth, eased motion; the fall rate increases gradually as tiers rise rather than snapping between speeds.
- The combo streak meter fills or animates as consecutive valid submissions accrue and resets visibly on an invalid submission.
- An invalid submission shakes the word tray as its inline rejection feedback.
- Power-tile activations (Bomb, Slow), valid-word scoring, Board Cleared, and achievement unlocks each surface a transient on-screen toast that fades on its own without blocking play.
- Fully clearing the board and unlocking an achievement each fire a celebratory particle burst tied to that exact moment, triggered only by the real winning action and never looping ambiently.
- A new Match History entry animates into the top of the list when a run ends rather than appearing instantly.
- Pausing dims the board with a Paused overlay and freezes all tile motion and the timer; resuming restarts motion from the frozen state.
- The settings form opens and closes with a short transition, and buttons show hover and focus-visible transitions on the real controls.
</motion>

<responsiveness>
- At roughly 375px wide the board and HUD scale to fit without horizontal scrolling and tiles stay large enough to tap comfortably.
- At desktop widths (1440px) and at 375px, no content clips or overflows the viewport and the view tabs, HUD, and settings form remain fully usable.
</responsiveness>

<accessibility>
- Keyboard Tab focus is visible on every interactive control, including the view tabs, game controls, and settings form fields.
- Start game, Pause, Resume, Submit Word, Undo Last Tile, and the settings form are all operable with the keyboard alone.
- Transient toasts never steal keyboard focus from the current control.
- Locked versus unlocked achievement states are distinguishable by a text or shape cue in addition to color.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- No console errors appear during a full session covering start, play, pause, resume, Game Over, restart, and the History and Achievements tabs.
- Tile fall motion stays smooth without visible hitching while tiles spawn, fall, and clear at the highest reached tier.
- The UI stays responsive under rapid repeated input on the run controls with no hangs, blank screens, or dropped interactions.
</performance>

<requirements>
- Stack mandate: Qwik with a client-rendered Vite single-page setup; all shared application state lives in Qwik stores (the run state, score, streak, tier, current-word tray, match history, achievements, settings, and active view derive from one shared store — never a second disconnected copy); Tailwind CSS 4.3.2 (pinned) for styling with design tokens defined in the theme; DaisyUI as the sole component library for all chrome (HUD panels, view tabs, dialogs, toasts, buttons, and the settings form); HTML5 Canvas 2D for the falling-tile board. Runtime is Node 20. Do not pull in a game engine or physics library.
- Animation allowlist: GSAP drives the tile fall, easing, and clearing timelines on the canvas; canvas-confetti provides the celebration bursts for Board Cleared and achievement unlocks; no other animation libraries.
- Icons: Iconify CSS icons via the @iconify/tailwind4 plugin only; one icon set used consistently; no other icon libraries and no raw pasted SVG icon sets.
- Forms: every form, including the settings form, is driven by Modular Forms for Qwik paired with a Valibot schema; the schema defines the rules and the form surfaces inline per-field errors before submit, with the submit control disabled until valid.
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- No backend, no database, no network calls, and no authentication; the app opens directly into the interface at /. Word validity is checked entirely against a bundled in-browser word list, never an external dictionary API. The bundled list must contain enough common short words that an attentive player can regularly clear tiles.
- Persistence: use localStorage so that Best Score, Match History, unlocked Achievements, and saved settings survive a full page refresh; guard all storage access so the production build does not crash when storage is unavailable. On reload the exact committed state is restored, and data that was never created is not fabricated.
- Single player, single board, single route /. In-app panels (Match History, Achievements, Settings) are shown and hidden within the single page via shared client state without reloading the document.
- WebMCP tool handlers invoke the same store commands as the visible controls, so contract-driven changes and UI-driven changes are indistinguishable in the rendered app.
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
