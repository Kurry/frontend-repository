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
- A visible horizontal danger line sits across the board; any uncleared tile whose body crosses that line ends the run and shows a Game Over screen with the final score, a decided result label Game Over, and a Play again control that starts a clean new run with score and streak reset while prior History and Best Score remain.
- Consecutive valid submissions without an invalid attempt build a visible streak meter; reaching streak thresholds of 3, 5, and 8 grants a temporary score-multiplier badge shown next to the score, and an invalid submission resets the streak to zero.
- Distinctly styled Bomb tiles and Slow tiles spawn occasionally: including a Bomb tile in a submitted word clears that tile's whole column and shows a named toast such as "Bomb! Column cleared"; including a Slow tile temporarily reduces fall speed for about three seconds and shows a named "Slow" toast.
- An Undo Last Tile control removes the most recently tapped tile from the current-word tray without submitting the word.
- A Pause control freezes tile fall and the run timer and dims the board with a Paused overlay; a Resume control continues from the exact same state.
- A Best Score is tracked and displayed at all times, updating when a run's final score beats the previous best.
- A Match History panel lists past runs most recent first; each History entry IS a game-result record and shows that run's score, tilesCleared count, durationSec, playerName, tierReached, and endedAt.
- An Achievements panel shows every named achievement with a locked or unlocked state: Clean Sweep unlocks on clearing the board at least once, Marathon on a run lasting three or more minutes, Combo Master on reaching a streak of eight or more, plus additional milestone badges; unlocking one shows a transient confirmation.
Feature: Player settings form (API-shaped settings payload) —
- A Settings control opens a settings form whose schema models a settings request body with exactly two fields: playerName (required string, length 2 to 20 inclusive) and startingTier (required enum whose only legal values are the integers 1, 2, and 3). The saved settings record IS that request body. The Save control stays disabled until every field is valid.
- The starting tier control exposes the three enum choices as Tier 1, Tier 2, and Tier 3 in the UI while the underlying value remains 1, 2, or 3.
- Typing a one-character playerName shows an inline validation message directly under the name field that names the field playerName and the 2-to-20 length rule, before any submit; correcting the name clears the message and enables Save. An empty playerName or a name longer than 20 characters keeps Save disabled with the same named inline rule.
- Saving valid settings closes the form; each Match History game-result recorded afterwards carries that playerName, and a run started afterwards begins at the chosen startingTier shown in the tier readout.
Feature: Match History game-result records (PGN-style API payload) —
- When a run ends, the app appends one game-result record that mirrors a real game-result API payload (the LetterDrop analogue of a chess PGN game object). Required fields on every record, with names visible in the History row and in any export preview text: format (exactly the literal string letterdrop-game-v1), schemaVersion (integer exactly 1), score (non-negative integer final score), tilesCleared (non-negative integer count of tiles removed that run), durationSec (non-negative integer run duration in whole seconds), playerName (the settings playerName at end-of-run, 2 to 20 characters), tierReached (positive integer highest tier reached that run), endedAt (an ISO-8601 timestamp string such as YYYY-MM-DDTHH:mm:ss.sssZ), result (exactly the enum string game_over), and words (an array, possibly empty, of submitted-word objects).
- Each entry in words is an object with required fields word (uppercase A-Z letters only, length 2 to 15) and points (positive integer awarded for that submit). The words array lists every valid submission from that run in order; the export preview shows those word and points values.
- The History list is most-recent-first; the top entry after Game Over matches the Game Over final score and shows the same tilesCleared, durationSec, playerName, tierReached, and endedAt values that the export of that run contains.
Feature: Run export and import (useful end state — the app produces the user's game record) —
- From Game Over or a History entry, Export Run opens a preview of the single-run result JSON whose top-level object IS that game-result record (format, schemaVersion, score, tilesCleared, durationSec, playerName, tierReached, endedAt, result, words). The preview is compiled live from the finished run. Download triggers a real file download whose contents match the preview; Copy writes the same JSON text to the clipboard and shows a brief Copied confirmation. An export that omits the session's actual score or submitted words is invalid.
- Export History produces a downloadable and copyable run-history JSON: a top-level object with required fields format (exactly letterdrop-history-v1), schemaVersion (integer exactly 1), and runs (an array whose every element is a game-result record conforming to the letterdrop-game-v1 field contract). With at least one finished run, the archive includes that run's actual score, tilesCleared, durationSec, playerName, tierReached, endedAt, result, and words.
- Import accepts a previously exported single-run result JSON or a run-history JSON. A valid single-run import appends one Match History entry whose visible fields match the imported record, including words when present. A valid history import reconstructs the History list from the runs array so exported-then-reimported records reappear with the same score, tilesCleared, durationSec, playerName, tierReached, endedAt, and words. Malformed JSON, a wrong format literal, a schemaVersion other than 1, or a payload missing any required field shows a visible rejection naming that the file is invalid and changes nothing.
Feature: Save and resume in-progress run —
- During an active or paused run after at least one valid word, Save Progress shows a Saved confirmation and writes a schema-shaped checkpoint payload with required fields format (exactly letterdrop-checkpoint-v1), schemaVersion (integer exactly 1), score (non-negative integer), streak (non-negative integer), tier (positive integer), trayLetters (string of the current-word tray letters in order), tiles (array of board tiles each with letter, column integer 0 to 5, y as a non-negative number, and kind enum letter or bomb or slow), durationSec (non-negative integer so far), playerName (2 to 20 characters), and startingTier (enum 1, 2, or 3). The same field names appear in any checkpoint preview or resume confirmation surface.
- After a full page reload, Resume Saved Run restores the checkpoint so score, tray, streak, tier, and tile layout match what was saved. Save Progress is unavailable or clearly disabled when no run is active; Resume Saved Run is unavailable when no checkpoint exists.
- Play again from Game Over starts a fresh falling-tile run with score and streak reset for the new run while prior History entries and Best Score remain listed.
</core_features>

<user_flows>
User flows (each chain must hold without a page reload except where a reload is named):
- Full run round-trip: pressing Start game begins a run; submitting one valid word raises the score in the HUD and increments the streak meter; letting a tile cross the danger line shows Game Over with that run's final score; switching to the History tab shows exactly one new entry at the top listing the same final score, tilesCleared, and durationSec; if the final score beat the previous best, the Best Score readout shows the new value; after a full page reload the History entry and Best Score are still present.
- Achievement echo: fully clearing the board during a run shows the Board Cleared! confirmation, switching to the Achievements tab shows Clean Sweep flipped from locked to unlocked in full color without a reload, and the unlock confirmation toast appears at the moment of the clear; after a full page reload Clean Sweep remains unlocked.
- Streak build and reset: three consecutive valid submissions show the streak meter at 3 and a multiplier badge next to the score; one invalid submission then resets the meter to zero, removes the badge, and the next valid word scores without the streak multiplier.
- Settings round-trip: saving a new playerName in the settings form, finishing a run, and opening the History tab shows the new game-result carrying that playerName; entries recorded before the change keep their original playerName.
- Pause integrity: pausing mid-run freezes the timer value and all tile positions; resuming continues the timer from the frozen value and tiles from the frozen positions, and the score is unchanged by the pause itself.
- Artifact end state: finish a run that scored at least one valid word, open Export Run from Game Over or that History entry, and confirm the preview JSON contains format letterdrop-game-v1, schemaVersion 1, that final score, and each submitted word with its points; Copy confirms; Download then Import of that same run-json appends a History entry matching those fields; Export History lists that same run among the archived entries under format letterdrop-history-v1.
- Save and resume across reload: start a run, submit at least one valid word, press Save Progress, fully reload, then press Resume Saved Run and confirm score, tray, streak, tier, and tile layout match the checkpoint while Best Score and committed History remain coherent.
- Clean restart: after Game Over, Play again starts a fresh run with live score and streak reset while Match History and Best Score from prior runs remain listed.
</user_flows>

<edge_cases>
- Submitting letters that do not form a dictionary word does not silently reject: the word tray shakes, an inline "Not a word" style message appears, and the streak resets to zero.
- Pressing Submit Word with an empty tray does not end the run, deduct points, or reset the streak; it shows a visible rejection or the control is disabled.
- Activating Undo Last Tile when the tray is empty changes nothing and causes no error.
- Before any run has finished, the Match History panel shows a friendly empty-state message instead of a blank region.
- Rapidly activating Start game, Pause, Resume, or Submit Word multiple times in quick succession triggers each transition exactly once: no duplicate runs, no duplicate history entries, and no corrupted score.
- Input from an earlier phase is ignored: clicks on the board after Game Over, or tile taps issued while paused, do not mutate the current run.
- Deleting or never-creating persisted data is not revived on reload: with no prior runs, a reload still shows the empty history state and a zero Best Score.
- Importing malformed JSON, a payload with the wrong format literal, schemaVersion other than 1, or missing required fields shows a visible rejection naming that the file is invalid and does not corrupt Match History or the live run.
- Save Progress is unavailable or clearly disabled when no run is active; Resume Saved Run is unavailable when no checkpoint exists.
- A settings form with playerName of length 1 or greater than 20, or with startingTier outside 1 to 3, keeps Save disabled and shows the named inline rule rather than writing an invalid settings payload.
</edge_cases>

<visual_design>
- Light UI on a #F5F5F7 background with the vivid blue accent #007AFF reserved for the primary call to action (Submit Word), links, and key highlights such as the active streak badge and the current difficulty tier readout.
- Color tokens: primary #E6EEF7, secondary #54C3FA, accent #007AFF, background #F5F5F7, text-primary #1D1D1E, link #007AFF.
- Typography uses an Arial-based stack (-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif); H1 is 34px, H2 is 17px, and body text is 17px.
- Base spacing unit is 4px; panels and cards use a 6px border radius.
- Primary buttons (Submit Word, Pause, Export Run, Save Progress) use background #007AFF, text #FEFEFE, a full pill shape (border radius 1000px), and no shadow.
- Secondary buttons (Undo Last Tile, Resume, Resume Saved Run, Copy, Import, Export History) use background #E6EEF7, text #007AFF, a full pill shape, and no shadow.
- Bomb and Slow power tiles are visually distinct from ordinary letter tiles and from each other in shape and color, and remain readable at normal fall speed.
- The danger line is always visible and reads as a hazard (a warning-toned line or gradient) distinct from the rest of the board background.
- The active streak badge and difficulty tier are visually highlighted so the player can read their current state at a glance.
- Locked achievements use a muted or grayscale treatment that turns to full color once unlocked.
- HUD panels, view tabs, dialogs, toasts, export preview, and the settings form use one consistent component style throughout the chrome; every icon in the chrome comes from a single icon set applied consistently.
- Export Run and Export History surfaces show a monospaced JSON preview with the required field names readable in the text, plus Copy and Download affordances.
- All buttons (Submit Word, Undo Last Tile, Pause, Resume, Save, Save Progress, Export Run, Export History, Copy, Import, Play again) show a visible hover state.
- Submitting a valid word, triggering a power tile, unlocking an achievement, saving a checkpoint, and copying an export each show a transient confirmation (toast or equivalent) that does not block further play.
- Inline validation messages in the settings form and Import rejection messages render in a clearly distinct error treatment directly under the field or control they name.
</visual_design>

<motion>
- Tiles animate downward continuously on the canvas board with smooth, eased motion; the fall rate increases gradually as tiers rise rather than snapping between speeds.
- The combo streak meter fills or animates as consecutive valid submissions accrue and resets visibly on an invalid submission.
- An invalid submission shakes the word tray as its inline rejection feedback.
- Power-tile activations (Bomb, Slow), valid-word scoring, Board Cleared, achievement unlocks, Saved, and Copied each surface a transient on-screen toast that fades on its own without blocking play.
- Fully clearing the board and unlocking an achievement each fire a celebratory particle burst tied to that exact moment, triggered only by the real winning action and never looping ambiently.
- A new Match History entry animates into the top of the list when a run ends rather than appearing instantly.
- Pausing dims the board with a Paused overlay and freezes all tile motion and the timer; resuming restarts motion from the frozen state.
- The settings form and export preview open and close with a short transition, and buttons show hover and focus-visible transitions on the real controls.
</motion>

<responsiveness>
- At roughly 375px wide the board and HUD scale to fit without horizontal scrolling and tiles stay large enough to tap comfortably.
- At desktop widths (1440px) and at 375px, no content clips or overflows the viewport and the view tabs, HUD, settings form, Save Progress, Export Run, Resume Saved Run, and export preview remain fully usable.
</responsiveness>

<accessibility>
- Keyboard Tab focus is visible on every interactive control, including the view tabs, game controls, Save Progress, Resume Saved Run, Export Run, Export History, Import, Copy, Download, and settings form fields.
- Start game, Pause, Resume, Submit Word, Undo Last Tile, Save Progress, Resume Saved Run, Export Run, Play again, and the settings form are all operable with the keyboard alone.
- Where Export Run, Export History, or Import opens a dialog, it takes focus when open, traps focus while open, closes on Escape, and returns focus to the control that opened it.
- Transient toasts never steal keyboard focus from the current control.
- Locked versus unlocked achievement states are distinguishable by a text or shape cue in addition to color.
- Validation and Import rejection messages are associated with their controls so assistive technology can announce them.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- No console errors appear during a full session covering start, play, pause, resume, save/resume, export/import, Game Over, restart, and the History and Achievements tabs.
- Tile fall motion stays smooth without visible hitching while tiles spawn, fall, and clear at the highest reached tier.
- The UI stays responsive under rapid repeated input on the run controls with no hangs, blank screens, or dropped interactions.
</performance>

<requirements>
- Stack mandate: Qwik with a client-rendered Vite single-page setup; all shared application state lives in Qwik stores (the run state, score, streak, tier, current-word tray, match history, achievements, settings, checkpoint, export preview, and active view derive from one shared store — never a second disconnected copy); Tailwind CSS 4.3.2 (pinned) for styling with design tokens defined in the theme; DaisyUI as the sole component library for all chrome (HUD panels, view tabs, dialogs, toasts, buttons, export surfaces, and the settings form); HTML5 Canvas 2D for the falling-tile board. Runtime is Node 20. Do not pull in a game engine or physics library.
- Animation allowlist: GSAP drives the tile fall, easing, and clearing timelines on the canvas; canvas-confetti provides the celebration bursts for Board Cleared and achievement unlocks; no other animation libraries.
- Icons: Iconify CSS icons via the @iconify/tailwind4 plugin only; one icon set used consistently; no other icon libraries and no raw pasted SVG icon sets.
- Forms: every form, including the settings form and import validation, is driven by Modular Forms for Qwik paired with a Valibot schema; the schema defines the rules and the form surfaces inline per-field errors before submit, with the submit control disabled until valid. Schemas model API payloads: the settings record, each letterdrop-game-v1 game-result (including words), the letterdrop-history-v1 archive, and the letterdrop-checkpoint-v1 save payload — export and import conform to those same schemas.
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- No backend, no database, no network calls, and no authentication; the app opens directly into the interface at /. Word validity is checked entirely against a bundled in-browser word list, never an external dictionary API. The bundled list must contain enough common short words that an attentive player can regularly clear tiles.
- Persistence: use localStorage so that Best Score, Match History, unlocked Achievements, saved settings, and any mid-run checkpoint survive a full page refresh; guard all storage access so the production build does not crash when storage is unavailable. On reload the exact committed state is restored, and data that was never created is not fabricated.
- Exportable end state: Export Run and Export History compile live from the store; an export that omits session mutations is invalid. Export then re-import reconstructs the same visible History fields for conforming payloads.
- Single player, single board, single route /. In-app panels (Match History, Achievements, Settings, export preview) are shown and hidden within the single page via shared client state without reloading the document.
- WebMCP tool handlers invoke the same store commands as the visible controls, so contract-driven changes and UI-driven changes are indistinguishable in the rendered app.
- Real-time simulation correctness is the core of the task and must be observable: tiles spawn at the top and fall at a steady, gradually accelerating rate; tapping tiles builds the current-word tray; Submit Word validates against the bundled dictionary and, if valid, clears those tiles and awards points scaled by word length; clearing every tile triggers a Board Cleared! bonus multiplier applied to the next scored word; a tile crossing the danger line uncleared ends the run into Game Over with the final score; streak thresholds 3, 5, and 8 grant a temporary multiplier badge next to the score; Bomb tiles clear their whole column when submitted and Slow tiles temporarily reduce fall speed, each with a named toast; fall speed and spawn rate increase as score crosses thresholds with the current tier shown in a status readout; non-dictionary submissions shake the tray and show inline Not a word rather than silently rejecting; Undo Last Tile removes the most recent tapped tile without submitting; Pause freezes fall and timer and dims the board while Resume continues from the same state; Save Progress and Resume Saved Run round-trip a mid-run checkpoint across reload; Export Run produces the letterdrop-game-v1 game record of the finished session.
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
- artifact-transfer-v1

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
- Session operations: start; pause; resume; restart
- Destinations: game-board; match-history; achievements
- Artifact operations: export; import; copy
- Export formats: run-json; history-json
- Import modes: run-json; history-json

Mechanics exclusions:
- Falling-tile canvas physics/timing and gradual acceleration stay Playwright-observed
- Tile tap selection and word-tray build stay Playwright-observed
- Danger-line crossing to Game Over stays Playwright-observed
- Combo streak meter animation, power-tile toasts, invalid-word tray shake stay Playwright-observed
- Undo Last Tile and narrow-viewport canvas scaling stay Playwright-observed
- File-picker Import bytes stay Playwright-only per artifact-transfer no-raw-file-contents restriction

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
