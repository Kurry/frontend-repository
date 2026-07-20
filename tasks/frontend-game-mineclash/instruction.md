<summary>
Build a dueling minefield puzzle game called MineClash using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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
- Direct entry: the app opens at / into a setup screen titled MineClash with a difficulty selector and a Start match control — no login, no admin gate, no routing shell
- Difficulty selector on setup offers exactly three choices: Easy (8x8 grid, 10 mines), Medium (10x10 grid, 16 mines), and Hard (12x12 grid, 24 mines); the chosen difficulty is highlighted and applies to every round of the match that is started
- The setup screen is a validating form whose schema models a match-setup request body with exactly two required fields: playerName (string, length 2 to 20 inclusive) and difficulty (enum whose only legal values are easy, medium, and hard). The started match carries that request body. Start match stays disabled until both fields are valid. An empty or one-character playerName shows an inline message that names the field playerName and the 2-to-20 length rule; missing difficulty shows an inline message that names the difficulty field; neither invalid submit starts a match
- Starting a match resets both sides to score 0 and 0 strikes, builds a fresh board at the selected difficulty, records the playerName on the live match, and opens Round 1 of a best-of-3 match in the playing phase
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
- Stats view: a Stats view shows, broken down by each of the three difficulties, the matches played, matches won (with win rate), total ore mined, and best single-round score; all four figures persist across sessions
- Sound toggle: a Sound on/off control (default on) mutes and unmutes the synthesized reveal, mine-hit, and round-end tones; the setting persists across sessions
- Branching move history: during a round a history panel exposes Undo and Redo controls and a visible list of history states; a normal visible "Apply Scenario Change" action re-applies a selected history state; a region labelled "History state" shows the snapshot (both sides' score and strikes and whose turn it is) for the selected node; undoing and then making a different change creates a new selectable branch rather than silently flattening or corrupting history; invalid transitions are disabled (Undo is disabled at the root, Redo is disabled with no child, Apply is disabled when the selected node is already current); selecting a branch node and applying it restores the exact prior visible board and score state
Feature: Match log records (API-shaped match payload) —
- When a match completes, the app appends one match-result record that mirrors a real match-result API payload. Required fields on every record, with names visible in the Match log row and in any export preview text: playerName (2 to 20 characters), difficulty (easy, medium, or hard), playerRoundWins (non-negative integer), rivalRoundWins (non-negative integer), playerTotalOre (non-negative integer sum of ore scored across the match), rivalTotalOre (non-negative integer), winner (exactly one of player, rival, or draw), rounds (array of round summaries; each round object requires roundNumber as a positive integer, playerScore, rivalScore, playerStrikes, rivalStrikes as non-negative integers, and outcomeReason as a non-empty string), and endedAt (an ISO-8601 timestamp string, or an equivalent observable timestamp format such as YYYY-MM-DDTHH:mm:ss.sssZ)
- The Match log list is most-recent-first; the top entry after Match Complete shows the same playerName, difficulty, winner, round-win counts, and total ore values that the export of that match contains
Feature: Match export and import (useful end state) —
- From Match Complete or a Match log entry, Export Match produces a downloadable and copyable single-match JSON whose top-level object is that match-result record. Copy shows a brief Copied confirmation. The JSON is compiled live from the finished match, not a blank stub or hardcoded sample
- Export Archive produces a downloadable and copyable match-archive JSON: a top-level object with a matches array whose every element is a match-result record conforming to the same field contract. With at least one finished match, the archive includes that match's actual playerName, difficulty, winner, round wins, totals, rounds, and endedAt
- Import accepts a previously exported single-match JSON or a match-archive JSON. A valid single-match import appends one Match log entry whose visible fields match the imported record. A valid archive import reconstructs the Match log from the matches array so exported-then-reimported records reappear with the same playerName, difficulty, winner, round wins, totals, and endedAt. Malformed JSON or a payload missing required fields shows a visible rejection naming that the file is invalid and changes nothing
Feature: Save and resume in-progress match —
- During an active or paused round after at least one reveal has occurred, Save Progress shows a Saved confirmation and writes a schema-shaped checkpoint payload that includes at least playerName, difficulty, roundNumber, playerScore, rivalScore, playerStrikes, rivalStrikes, sideToMove, hintsRemaining, playerRoundWins, rivalRoundWins, and a board snapshot of covered, revealed, and flagged tiles — the same field names appear in any checkpoint preview or resume confirmation surface
- After a full page reload, Resume Saved Match restores the checkpoint so scores, strikes, turn, hints remaining, round wins, and the visible board match what was saved. Save Progress is unavailable or clearly disabled when no match is in progress; Resume Saved Match is unavailable when no checkpoint exists
</core_features>

<user_flows>
End-to-end flows the finished app must support, with state tracked across surfaces at every step:
- Safe-reveal flow: on the Player's turn, revealing a safe tile increases the You score in the score panel by exactly the ore value shown on the tile, the turn banner hands over to the Rival without a reload, and the history panel appends a new selectable state whose "History state" snapshot shows the updated score and the Rival as the side to move
- Mine-hit flow: revealing a mine drops the revealing side's score by 5 (never below 0) in that side's score panel, fills exactly one more Strike icon in that side's strike row, passes the turn banner to the other side, and the newest history snapshot shows the increased strike count — all without a reload
- Match-completion flow: winning 2 rounds opens the Match Complete screen with the round-by-round scores and overall winner; opening the Match log afterwards shows a new top match-result entry with the same playerName, difficulty, winner, and round-win counts; opening the Stats view shows matches played for the played difficulty increased by exactly one, total ore mined increased by the ore earned in that match, and best single-round score updated when it was beaten — all reflecting the match just played without a reload
- Persistence round-trip: after completing at least one match, changing the Sound setting, and selecting a difficulty, a full page refresh restores the exact previously committed Stats figures for every difficulty, the Match log entries, the same Sound on/off state, and the remembered difficulty and playerName on the setup screen; figures that were never earned do not appear after the refresh
- Undo-and-branch flow: revealing a tile, using Undo, and then revealing a different tile creates a new branch in the history panel; selecting the earlier branch node and using Apply Scenario Change restores the exact prior visible board, both scores, both strike rows, and the turn indicator to that snapshot
- Export after play: finishing a match, opening Export Match from Match Complete or that Match log entry, and confirming the downloaded or copied JSON contains that match's playerName, difficulty, winner, playerRoundWins, rivalRoundWins, playerTotalOre, rivalTotalOre, rounds, and endedAt; Export Archive then lists that same match among the matches array entries
- Save and resume across reload: starting a match, revealing at least one tile, pressing Save Progress, fully reloading, then pressing Resume Saved Match restores scores, strikes, turn, hints remaining, round wins, and the visible board to the checkpoint
- Import round-trip: exporting a finished match as single-match JSON, importing that file, and confirming a Match log entry appears with the same playerName, difficulty, winner, round wins, totals, and endedAt as the export
</user_flows>

<edge_cases>
- Illegal or unavailable actions — acting out of turn, revealing an already-revealed or flagged tile, using a hint past the limit, or revealing while paused — are rejected with specific visible feedback naming why, and the board, scores, strikes, and history are left unchanged
- A flagged tile cannot be revealed by a normal reveal click until it is unflagged; unflagging restores it to a normal covered tile that can be revealed
- The Hint control is disabled once 2 hints have been spent in the round, and using a hint at a score below 3 floors the score at 0 rather than going negative
- When every non-mine tile has been revealed with both sides on an equal score, the Round Result overlay declares a draw rather than naming a winner
- While paused, the board accepts no reveals, flags, or hints and the Rival does not act; Resume returns play exactly where it left off
- Stale input from an earlier phase or round (for example a Rival move scheduled before a pause, undo, or round end) never mutates the current round's state
- Before any match has been played the Stats view and the Match log show friendly empty-state messages ("No matches played yet" for Stats) rather than blank or zero rows
- Save Progress is unavailable or clearly disabled when no match is in progress; Resume Saved Match is unavailable when no checkpoint exists
- Import of malformed JSON or a payload missing required match-result fields shows a visible rejection naming that the file is invalid and leaves the Match log unchanged
</edge_cases>

<visual_design>
- Dark stone theme throughout: page background is a dark stone (#1C1917), panels and the grid sit on a slightly lighter surface (#292524), and text is near-white (#FAFAF9) with muted secondary text (#A8A29E)
- Amber (#F59E0B) is the ore / primary accent used for headings, ore values, and primary buttons; sky blue (#38BDF8) is the Player identity color used for the You panel border, flag markers, and turn accents; the Rival identity color is a warm orange used for the Rival panel and turn accents
- Success green (#4ADE80) marks safe hints and round wins, warning yellow (#FACC15) marks the 2-strike near-loss state and mine hints, and error red (#EF4444) marks mine hits and round losses
- Headings use a Segoe UI / Arial sans-serif stack (h1 about 30px, h2 about 22px); body text is the same stack at 16px; grid numbers, coordinates, and scores use a Courier New monospace stack
- Grid tiles use a small 4px radius for a sharp mine-grid feel, buttons use an 8px radius, and panels use a 12px radius; base spacing is a 4px unit
- Primary buttons (Start match, Rematch, Apply Scenario Change, Export Match, Save Progress) have an amber background, near-black text, 8px radius, and a soft drop shadow; secondary buttons (Flag mode, Hint, Pause, New match, Export Archive, Import, Resume Saved Match) are transparent with an amber border and amber text and no shadow
- The two score panels (You and Rival) each show the side label, the live score against the target, and a row of 3 Strike icons; the active side's panel is outlined and softly glows in that side's identity color
- Icons across the app (ore, mine, flag, strike, sound, and empty-state icons) come from one consistent icon set with a uniform stroke and weight — no mismatched glyph styles
- Whose turn it is is unmistakable at all times via a dedicated turn banner; the Rival's thinking state shows an animated thinking indicator rather than an instant silent jump
- A revealed mine tile is visibly marked with a distinct mine icon and a red-tinted background for the rest of the round; Flag Mode being active changes the tile cursor so it is never confused with normal reveal mode
- The Stats empty state shows an icon plus the heading "No matches played yet" and an explanatory line, not blank zero rows
- The Match log empty state shows a friendly heading and explanatory line rather than a blank region; Match log rows show playerName, difficulty, winner, and round-win counts at a glance
- Copying an export shows a brief Copied confirmation; saving a checkpoint shows a brief Saved confirmation; both are transient and do not block play
</visual_design>

<motion>
- The turn banner and each side's score panel transition their color and glow when the active side changes, rather than snapping
- The Rival's thinking delay is visibly animated: a pulsing "Rival is thinking" indicator is shown for roughly 0.9 to 1.6 seconds before the Rival's tile resolves, so its move never appears as an instant silent jump
- Tiles have a hover response while they are actionable (a lift and brightness change on hover) and a short background transition when they resolve from covered to revealed
- Strike icons animate their fill as they accrue, with a distinct filled state and a distinct warning state at 2 strikes
- History panel entries animate in as new states are appended and animate out when a branch is discarded, rather than the list snapping between lengths
- The Round Result overlay slides in over a blurred backdrop rather than appearing instantly
- Winning the match triggers a brief celebratory particle burst over the Match Complete screen; it fires only when the Player actually wins the match through play — never on a loss, on setup, or ambiently
- Rejection feedback for illegal actions animates in briefly and fades out rather than appearing and vanishing instantly
- Buttons show hover and active feedback (primary buttons lift on hover, secondary buttons take a tinted wash)
- Animations must respect prefers-reduced-motion by collapsing to near-instant
</motion>

<responsiveness>
- At a narrow viewport around 375px wide the grid scales down (smaller tiles, roughly a 28px minimum) and stays tappable without horizontal scrolling, with the score and strike panels stacking above the grid
- No content clips or overflows the viewport at 375px width: the setup screen, HUD, history panel, overlays, Match log, export controls, and Stats view all reflow to a single column without horizontal scrolling
</responsiveness>

<accessibility>
- Every button and toggle (Start match, Flag Mode, Hint, Pause/Resume, Sound, Undo, Redo, Apply Scenario Change, Rematch, New match, Export Match, Export Archive, Import, Save Progress, Resume Saved Match) is reachable and operable with the keyboard alone, with a visible focus indicator on every focused control
- The Round Result overlay and Match Complete screen present as dialogs: they take focus when they open and return focus to the game controls when play continues
- Turn changes are announced through a polite live region so the active side is conveyed without relying on color alone; strike counts are also exposed as text, not only as filled icons
- The "History state" region exposes its snapshot as readable text, and disabled controls (Undo at the root, Redo with no child, a spent Hint, Save Progress with no match, Resume Saved Match with no checkpoint) are exposed as disabled rather than silently ignoring activation
- The setup form fields playerName and difficulty have visible labels, and inline validation messages are associated with the fields they name
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load, opening directly into the setup screen
- No console errors or uncaught exceptions appear during a full exercise of the app: setup, several rounds, pause/resume, hints, flags, undo/redo, match completion, export/import, save/resume, the Match log, and the Stats view
- The game withstands at least 25 rapid deterministic reveal/turn repetitions through the normal controls with an exact final visible state, responsive controls, and no blank screen, uncaught error, or sustained freeze
- The board, score panels, and history panel stay responsive during the Rival's thinking delay; queued Player input never fires during the Rival's turn
</performance>

<writing>
- Control labels use one consistent capitalization convention and specific verbs (Start match, Apply Scenario Change, Rematch, Export Match, Save Progress, Resume Saved Match) rather than generic labels
- Rejection messages for illegal actions name what was attempted and why it is unavailable; the Round Result overlay states the winner and the reason in plain language; import rejections name that the file is invalid
- The Stats and Match log empty states explain that no matches have been played yet and how to start one; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
- Stack: Qwik (client-rendered Vite SPA, resumable event handlers) with shared app state held in Qwik stores, styled with Tailwind CSS 4.3.2 (pinned) with design tokens defined in the Tailwind theme; Node 20 runtime. The state-machine library xstate 5.32.4 is available if used for lifecycle logic. Do not add a separate state-management library, an AI or game-engine library, or an audio-asset library.
- Component library: DaisyUI provides the game chrome — the setup panel and difficulty form, the HUD score panels, the Flag Mode / Sound / Pause toggles, the Round Result and Match Complete overlays, the history panel, the Match log, export/import controls, and the Stats view. The play grid itself is custom-built. No other component library.
- Animation: AutoAnimate and canvas-confetti are the only animation libraries allowed (AutoAnimate for list and panel microinteractions, canvas-confetti for the match-win celebration); CSS transitions may supplement; no other animation libraries.
- Icons: one Iconify icon set delivered through the @iconify/tailwind4 plugin only — no raw copy-pasted SVGs, no other icon packages, no icon CDN.
- Forms: every form validates through a schema — the setup form is driven by Modular Forms for Qwik with a Valibot schema that models the match-setup request body (required playerName length 2 to 20, required difficulty enum easy|medium|hard), surfacing inline per-field errors before submit and keeping Start match disabled until the form is valid. Match-result and checkpoint payloads conform to the same field contracts described in core features; import validates against those contracts before mutating the Match log.
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon asset.
- The Rival AI turn-taking heuristic must be hand-written in TypeScript (no AI or game-engine library) and paced with setTimeout or requestAnimationFrame for its thinking delay.
- Reveal, mine-hit, and round-end feedback tones must be produced with the Web Audio API (an AudioContext oscillator), not external audio files; guard AudioContext creation so the build does not crash where it is unavailable.
- Persistence uses localStorage and must be guarded so the production build does not crash when storage is unavailable. The following must all survive a full page refresh: the per-difficulty match win/loss record (matches played and matches won per difficulty), the total ore mined per difficulty, the best single-round score per difficulty, the Match log of match-result records, any saved match checkpoint, the Sound on/off setting, and the remembered playerName and Difficulty selection for the next match. After a refresh the Stats view and Match log must show the exact previously committed figures, and stats that were never earned must not appear. Live board state outside an explicit checkpoint lives in the shared client-side stores only.
- Difficulty applies to every round of a match: Easy is an 8x8 grid with 10 mines, Medium a 10x10 grid with 16 mines, Hard a 12x12 grid with 24 mines.
- Exact scoring and lifecycle constants: safe tiles are worth ore of 1, 2, or 3 added to the revealing side's score; a mine hit subtracts 5 points floored at 0 and adds 1 Strike; 3 Strikes ends the round as a loss for that side; the Target Score is 50 ore; a Hint costs 3 points floored at 0 and is limited to 2 uses per round.
- Turn discipline: only the side whose turn it is may act; the Player cannot reveal, flag, or hint during the Rival's turn or thinking delay or while paused; a covered flagged tile cannot be revealed by a normal reveal click until unflagged; starting a new match always resets both sides' score and strikes to 0 for Round 1; only one match is active at a time.
- Branching history contract: game moves are modelled as explicit history transitions with Undo and Redo controls and a visible history panel; the current snapshot is exposed in a region labelled "History state"; a normal visible "Apply Scenario Change" action re-applies a selected node; undoing and then making a different change creates a new selectable branch rather than silently flattening history; invalid transitions are disabled; and applying a branch restores the exact prior visible board and score state.
- Routing: the app runs entirely at / with no other routes required; setup, playing, round result, match complete, and stats are in-app views, not separate URLs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Session operations: start; pause; resume; restart; stop
- Destinations: game-board; stats; match-log; export-center
- Filters: difficulty
- Artifact operations: export; import; copy
- Export formats: match-json; match-archive-json
- Import modes: match-json; match-archive-json

Mechanics exclusions:
- Tile reveal click + adjacency/ore reveal stays Playwright-observed
- Flag Mode toggle + flagged-tile behavior stays Playwright-observed
- Rival AI thinking-delay animation + heuristic timing stays Playwright-observed
- Hint reveal, Strike-icon fill animation, and Web Audio tones stay Playwright-observed
- Narrow-viewport grid scaling stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
