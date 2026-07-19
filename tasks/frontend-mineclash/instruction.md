<summary>
Build a dueling minefield puzzle game called MineClash using Qwik, Qwik stores, and Tailwind CSS.
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
- Direct entry: the app opens at / into a setup screen titled MineClash with a difficulty selector and a Start match control — no login, no admin gate, no routing shell
- Difficulty selector on setup offers exactly three choices: Easy (8x8 grid, 10 mines), Medium (10x10 grid, 16 mines), and Hard (12x12 grid, 24 mines); the chosen difficulty is highlighted and applies to every round of the match that is started
- Starting a match resets both sides to score 0 and 0 strikes, builds a fresh board at the selected difficulty, and opens Round 1 of a best-of-3 match in the playing phase
- Shared board: one grid of covered tiles is shared by both sides; hidden mines and per-tile ore values sit under the tiles; the Player and the Rival AI alternate turns and the current turn is always shown unambiguously (a "Your turn" indicator when it is the Player's turn, a "Rival's turn" / "Rival is thinking" indicator during the Rival's turn)
- Reveal mechanic: on the Player's turn the Player reveals exactly one covered tile; a safe tile shows a mined ore icon with an ore value of 1, 2, or 3 and that value is added directly to the revealing side's score, and the tile also shows its count of adjacent mines (standard minesweeper adjacency, 0 through 8) when that count is greater than 0
- Mine hit: revealing a mine ends the revealing side's turn immediately, subtracts 5 points from that side's score with a floor of 0 (the score never goes negative), adds one Strike to that side, and the mine tile is marked with a distinct mine icon and stays revealed for both sides for the rest of the round (it never reverts to covered)
- Turn alternation: after the Player reveals a safe tile the turn passes to the Rival; after a mine hit the turn also passes to the other side; the Rival then automatically takes its turn after a visible thinking delay, and control returns to the Player afterwards
- Rival AI heuristic: the Rival chooses among covered, unflagged tiles, prefers tiles adjacent to already-revealed low-number safe tiles (revealed tiles showing 0 are weighted highest), avoids tiles it can deduce are mines (a revealed number whose count of adjacent mines equals its count of still-covered neighbors marks those neighbors as deduced mines), and only falls back to a deduced-mine tile when no safe candidate remains; its move is paced by a visible thinking delay rather than resolving instantly and silently
- Flag Mode: a Flag Mode toggle lets the Player mark a covered tile as a suspected mine instead of revealing it; while Flag Mode is active it is visually obvious (an active toggle state and a changed tile cursor) and clicking a covered tile flags or unflags it; a flagged tile shows a flag marker and cannot be revealed by a normal reveal click until it is unflagged; right-clicking a covered tile also toggles its flag
- Hint: a Hint control may be used at most 2 times per round; using it costs the Player 3 points (floored at 0) and lets the Player pick one covered tile to learn whether it is safe or a mine WITHOUT revealing it (the tile shows a safe or mine hint marker but stays covered); the Hint counter shows the remaining uses and the control is disabled once 2 hints have been spent that round
- Live score and strike display: score counters for the Player (labelled You) and the Rival are always visible during a round, each shown against the Target Score, and each side has a row of 3 Strike icons that fill in distinctly as strikes accrue, with a visible difference between 0, 1, 2, and 3 strikes (the 2-strike near-loss state is warning-colored)
- Round end conditions, checked after every reveal: a round ends the instant either side reaches the Target Score of 50 ore (that side wins), OR the instant a side accumulates 3 Strikes (that side loses the round and the other side wins), OR when every non-mine tile has been revealed (in which case the higher score wins, or it is a draw on an equal score); the outcome is shown in a Round Result overlay that names the winner, the reason, and both final scores
- Match structure: a match is best-of-3 rounds; the first side to win 2 rounds wins the match; from the Round Result overlay the Player advances to the next round until a side reaches 2 round wins, at which point a Match Complete screen shows the round-by-round scores, the overall winner, and Rematch and New match controls
- Rematch restarts the match at the same difficulty with scores and strikes reset to 0 for Round 1; New match returns to the setup screen
- Pause and Resume: during a round a Pause control freezes the round — the board stops accepting reveals, the Rival does not take its turn, and a paused indicator is shown — and the control toggles to Resume, which unfreezes the round and lets play continue
- Stats view: a Stats view shows, broken down by each of the three difficulties, the matches played, matches won (with win rate), total ore mined, and best single-round score; all four figures persist; before any match has been played the Stats view shows a friendly "No matches played yet" message rather than blank or zero rows
- Sound toggle: a Sound on/off control (default on) mutes and unmutes the reveal, mine-hit, and round-end tones, which are generated with the Web Audio API; the setting persists across sessions
- Branching move history: during a round a history panel exposes Undo and Redo controls and a visible list of history states; a normal visible "Apply Scenario Change" action re-applies a selected history state; a region labelled "History state" shows the snapshot (both sides' score and strikes and whose turn it is) for the selected node; undoing and then making a different change creates a new selectable branch rather than silently flattening or corrupting history; invalid transitions are disabled (Undo is disabled at the root, Redo is disabled with no child, Apply is disabled when the selected node is already current); selecting a branch node and applying it restores the exact prior visible board and score state
</core_features>

<visual_design>
- Dark stone theme throughout: page background is a dark stone (#1C1917), panels and the grid sit on a slightly lighter surface (#292524), and text is near-white (#FAFAF9) with muted secondary text (#A8A29E)
- Amber (#F59E0B) is the ore / primary accent used for headings, ore values, and primary buttons; sky blue (#38BDF8) is the Player identity color used for the You panel border, flag markers, and turn accents; the Rival identity color is a warm orange used for the Rival panel and turn accents
- Success green (#4ADE80) marks safe hints and round wins, warning yellow (#FACC15) marks the 2-strike near-loss state and mine hints, and error red (#EF4444) marks mine hits and round losses
- Headings use a Segoe UI / Arial sans-serif stack (h1 about 30px, h2 about 22px); body text is the same stack at 16px; grid numbers, coordinates, and scores use a Courier New monospace stack
- Grid tiles use a small 4px radius for a sharp mine-grid feel, buttons use an 8px radius, and panels use a 12px radius; base spacing is a 4px unit
- Primary buttons (Start match, Rematch, Apply Scenario Change) have an amber background, near-black text, 8px radius, and a soft drop shadow; secondary buttons (Flag mode, Hint, Pause, New match) are transparent with an amber border and amber text and no shadow
- The two score panels (You and Rival) each show the side label, the live score against the target, and a row of 3 Strike icons; the active side's panel is outlined and softly glows in that side's identity color
- Whose turn it is is unmistakable at all times via a dedicated turn banner; the Rival's thinking state shows an animated thinking indicator rather than an instant silent jump
- A revealed mine tile is visibly marked with a distinct mine icon and a red-tinted background for the rest of the round; Flag Mode being active changes the tile cursor so it is never confused with normal reveal mode
- The Stats empty state shows an icon plus the heading "No matches played yet" and an explanatory line, not blank zero rows
- At a narrow viewport around 375px wide the grid scales down (smaller tiles, roughly a 28px minimum) and stays tappable without horizontal scrolling, with the score and strike panels stacking above the grid
</visual_design>

<motion>
- The turn banner and each side's score panel transition their color and glow when the active side changes, rather than snapping
- The Rival's thinking delay is visibly animated: a pulsing "Rival is thinking" indicator is shown for roughly 0.9 to 1.6 seconds before the Rival's tile resolves, so its move never appears as an instant silent jump
- Tiles have a hover response while they are actionable (a lift and brightness change on hover) and a short background transition when they resolve from covered to revealed
- Strike icons animate their fill as they accrue, with a distinct filled state and a distinct warning state at 2 strikes
- The Round Result overlay slides in over a blurred backdrop rather than appearing instantly
- Buttons show hover and active feedback (primary buttons lift on hover, secondary buttons take a tinted wash) and focus-visible outlines
- Animations must respect prefers-reduced-motion by collapsing to near-instant
</motion>

<requirements>
- Stack: Qwik (client-rendered Vite SPA, resumable event handlers) with shared app state held in Qwik stores, styled with Tailwind CSS; Node 20 runtime. The state-machine library xstate 5.32.4 is available if used for lifecycle logic. Do not add a component library, a separate state-management library, an AI or game-engine library, or an audio-asset library.
- The Rival AI turn-taking heuristic must be hand-written in TypeScript (no AI or game-engine library) and paced with setTimeout or requestAnimationFrame for its thinking delay.
- Reveal, mine-hit, and round-end feedback tones must be produced with the Web Audio API (an AudioContext oscillator), not external audio files; guard AudioContext creation so the build does not crash where it is unavailable.
- Persistence uses localStorage and must be guarded so the production build does not crash when storage is unavailable. The following must all survive a full page refresh: the per-difficulty match win/loss record (matches played and matches won per difficulty), the total ore mined per difficulty, the best single-round score per difficulty, the Sound on/off setting, and the remembered Difficulty selection for the next match. After a refresh the Stats view must show the exact previously committed figures, and stats that were never earned must not appear.
- Difficulty applies to every round of a match: Easy is an 8x8 grid with 10 mines, Medium a 10x10 grid with 16 mines, Hard a 12x12 grid with 24 mines.
- Exact scoring and lifecycle constants: safe tiles are worth ore of 1, 2, or 3 added to the revealing side's score; a mine hit subtracts 5 points floored at 0 and adds 1 Strike; 3 Strikes ends the round as a loss for that side; the Target Score is 50 ore; a Hint costs 3 points floored at 0 and is limited to 2 uses per round.
- Turn discipline: only the side whose turn it is may act; the Player cannot reveal, flag, or hint during the Rival's turn or thinking delay or while paused; a covered flagged tile cannot be revealed by a normal reveal click until unflagged; starting a new match always resets both sides' score and strikes to 0 for Round 1; only one match is active at a time.
- Adversarial and rapid-use robustness: illegal or unavailable actions (acting out of turn, revealing an already-revealed or flagged tile, using a hint past the limit, revealing while paused) must be rejected with specific visible feedback and must not mutate the current run; the game must withstand at least 25 rapid deterministic reveal/turn repetitions through the normal controls with an exact final visible state, responsive controls, and no blank screen, uncaught error, or sustained freeze; stale input from an earlier phase or round must never mutate the current round.
- Branching history contract: game moves are modelled as explicit history transitions with Undo and Redo controls and a visible history panel; the current snapshot is exposed in a region labelled "History state"; a normal visible "Apply Scenario Change" action re-applies a selected node; undoing and then making a different change creates a new selectable branch rather than silently flattening history; invalid transitions are disabled; and applying a branch restores the exact prior visible board and score state.
- Routing: the app runs entirely at / with no other routes required; setup, playing, round result, match complete, and stats are in-app views, not separate URLs.
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
- Session operations: start; pause; resume; restart; stop
- Destinations: game-board; stats
- Filters: difficulty

Mechanics exclusions:
- Tile reveal click + adjacency/ore reveal stays Playwright-observed
- Flag Mode toggle + flagged-tile behavior stays Playwright-observed
- Rival AI thinking-delay animation + heuristic timing stays Playwright-observed
- Hint reveal, Strike-icon fill animation, and Web Audio tones stay Playwright-observed
- Narrow-viewport grid scaling stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
