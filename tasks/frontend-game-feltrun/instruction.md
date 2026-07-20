<summary>
Build a single-player Texas hold'em poker table called FeltRun using Vue 3, Pinia, Tailwind CSS 4.3.2, and Reka UI.
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

Feature: Table and dealing —
- The app opens directly at / into the poker table with no login, registration, or backend call; before any hand is dealt the table shows a "Deal first hand" prompt rather than an empty board
- Clicking "Deal first hand" seats one human player plus 3 AI opponents (4 seats total), each starting with a 1000-chip stack, deals two hole cards to every seat, posts the blinds, and begins a hand
- "Deal next hand" starts a fresh hand once the current one resolves
- Every hand reaches a decided end state announced on the table: either a fold win naming the winner, or a showdown naming the winner and the winning hand type — never a silent freeze with chips still contested

Feature: Betting controls —
- When it is the human's turn, Fold, Check or Call (whichever is legal), Raise, and All-in controls are all visible, along with quick-bet shortcuts "1/2 pot" and "Pot" and a raise-amount input plus slider; using "1/2 pot" populates the raise amount to half the current pot and "Pot" populates it to the full current pot, and the two set distinct values
- Raising by a specific chip amount immediately increases the pot by that amount and decreases the human's visible stack by the same amount, with no page reload
- Entering a raise amount below the legal minimum raise or above the human's stack shows an inline validation message next to the raise-amount input naming the violated limit, and the raise confirm control stays disabled until the amount is legal
- The raise-amount field models a raise-action request body: amount is a required integer chip count; it must be at least the legal minimum raise for the current street and at most the human's stack; fractional or non-numeric values are rejected with an inline message naming amount

Feature: Hand equity —
- A live hand-equity percentage sits next to the human's hole cards and recalculates to a new value after each dealt street (preflop to flop, flop to turn, turn to river), reflecting the current board

Feature: AI opponents —
- Each of the 3 AI seats shows a labeled play-style badge — Aggressive, Tight, or Bluffer — and the labeled styles visibly influence behavior: the Aggressive seat raises noticeably more often than the Tight seat, which folds or calls conservatively, while the Bluffer raises even on weak holdings
- A difficulty control offers Easy, Standard, and Hard; switching difficulty observably changes AI strength across subsequent hands — Hard opponents call or raise more often and fold less often than Easy opponents under comparable spots

Feature: Tournament blinds —
- A tournament blind-level indicator shows the level number and the current small/big blind amounts together (for example "Level 1 — blinds 5/10"); after every 8 completed hands the level advances by one and both blind amounts increase

Feature: Session stats —
- A persistent Session stats panel shows hands played, hands won, win rate as a percentage, biggest pot won, and a rebuys count, updating after every completed hand; the win rate stays consistent with hands won divided by hands played

Feature: Showdown —
- At showdown with two or more players remaining, every remaining player's hole cards are revealed face-up and the winning 5-card hand is highlighted together with its hand-type label (for example "Two pair", "Flush")

Feature: Hand history —
- A toggleable Hand history panel lists completed hands most-recent-first with pot size, winner, and winning hand type
- Each completed hand record carries the fields of a hand-history entry: handNumber (positive integer), pot (non-negative integer chips), winnerSeat (integer 0 through 3), winnerName (non-empty string), handType (non-empty string such as "Two pair"), board (array of 0 to 5 card codes like Ah or Kd), and actions (array of street action objects each with seat, street one of preflop/flop/turn/river, action one of fold/check/call/raise/all-in, and amount as a non-negative integer)

Feature: Rebuy —
- When the human's chip stack reaches 0, a Rebuy control appears; using it resets the stack to 1000 chips and increments the visible rebuys counter in the stats panel by 1

Feature: Achievement badges —
- Achievement badges (for example "First win", "First bluff win", "Felted an opponent", "Comeback kid") unlock during play: each surfaces as a transient toast the moment it is earned and is then listed in a Badges panel

Feature: Undo last action —
- An "Undo last action" control reverses the human's most recent betting action on the current street (fold, check/call, raise, or all-in) when that action has not yet been followed by an AI response that advanced the street, restoring the human's stack, the pot, and the turn indicator to their prior values
- Undo is disabled before the human has acted on the current street and after a street advances or the hand resolves; attempting Undo when disabled does not change stacks or pot

Feature: Save and resume —
- A "Save table" control persists the full in-progress table state (seat stacks, hole cards, community board, street, side to act, pot, blind level, session stats, hand history, badges, and difficulty) so play can continue later
- After a full page reload, or after using "Load saved table" when a save exists, the table resumes exactly where it left off: same stacks, same board, same street, same side to act, and the same pot — with no state leaking from a later hand that was never saved

Feature: Session export (useful end state) —
- The app produces the user's FeltRun session artifact: an Export panel compiles LIVE from the current store a session JSON document and offers Copy and Download controls for that same text
- The session JSON conforms to schemaVersion exactly "feltrun-session-v1" and includes required top-level keys session, stacks, handHistory, and inProgressHand; session contains handsPlayed, handsWon, biggestPot, rebuys, blindLevel, smallBlind, bigBlind, difficulty (one of Easy/Standard/Hard), and badges (array of badge name strings); stacks is an array of four seat objects each with seat (0 through 3), chips (non-negative integer), and style (human, Aggressive, Tight, or Bluffer); handHistory is an array of hand-history entries matching the field contract above; inProgressHand is null when no hand is active, otherwise an object with street, pot, sideToAct (seat index), board, and holeCards for the human
- Export content must reflect every mutation the session made — completed hands, updated stats, unlocked badges, current stacks and blind level, and any in-progress hand — so an export taken after play differs from an export taken before that play; an export that omits session work is invalid
- Copy writes the visible preview text to the clipboard and shows a brief copied confirmation; Download starts a file download of that same preview text
- Import accepts a previously exported feltrun-session-v1 JSON: after a successful import the table, Session stats, Hand history, badges, difficulty, and in-progress hand match the imported document, and the export preview matches that imported state; malformed JSON or a document missing required keys or using a different schemaVersion shows an inline error naming the import field and leaves the table unchanged

Feature: Session controls —
- "Start new session" opens a confirmation prompt and, once confirmed, resets the table, chip stacks, stats, hand history, badges, undo availability, and saved-table checkpoint to their initial state, while cancelling leaves everything unchanged

Feature: Collaboration scenario —
- A visible "Collaboration scenario" section provides a "Shared editor" input, a "Shared content" list, "Go Offline"/"Go Online" controls, and peer-simulation controls; changes authored while offline queue locally and reconnecting offers a delivery-order choice
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says reload):
- Raising by a specific chip amount moves exactly that amount from the human's visible stack into the pot; when that hand completes, the Session stats panel's hands-played count increases by exactly one and the completed hand appears at the top of the Hand history panel with the pot size, winner, and winning hand type of the hand just played, and the Export panel's session JSON preview lists that same hand in handHistory with matching pot, winnerName, and handType
- Completing the 8th hand of a blind level advances the blind-level indicator by exactly one level and increases both the small and big blind amounts, while the Session stats totals and the Hand history list carry over unchanged, and the export preview's session.blindLevel, smallBlind, and bigBlind match the advanced values
- When the human's stack reaches 0, using the Rebuy control restores the stack display to 1000 chips and increases the rebuys counter in the stats panel by exactly 1; after a full page reload the restored stack and the incremented rebuys count are both still shown
- Earning a badge shows its toast at the moment it is earned, then lists it in the Badges panel; earlier badges remain listed as later ones are added, and after a full page reload the same badges are still listed
- After at least 3 completed hands, a full page reload restores the chip stacks, tournament blind level, Session stats numbers, Hand history entries, unlocked badges, and difficulty exactly as they were before the reload
- Mid-hand save and resume: during an active hand after the flop is dealt, use Save table, note the board, pot, stacks, and side to act, then reload the page — the table resumes with the same board, pot, stacks, street, and side to act
- Undo then continue: on the human's turn, raise a specific amount, then use Undo last action — the stack and pot return to their pre-raise values and it is the human's turn again; completing a different legal action afterward advances the hand normally
- Export then import round-trip: after mutating the session (complete at least one hand so stats and handHistory change), Copy or Download the session JSON, then Import that same JSON text — the table's visible stacks, Session stats, Hand history entries, badges, and difficulty match the pre-export mutated state, and the export preview matches again
- Confirming "Start new session" resets the table, chip stacks, stats, hand history, and badges to their initial state across every panel at once, including clearing the export preview's handHistory to empty and inProgressHand to null; cancelling the confirmation leaves every panel unchanged
- In the Collaboration scenario, changes authored while offline queue locally; reconnecting offers a delivery-order choice, and applying the queued changes in either order converges to the same "Shared content" list without dropping either non-conflicting change
- In the Collaboration scenario, two edits to the same note surface an explicit keep-mine / keep-peer conflict choice rather than silently overwriting, and the chosen version is what "Shared content" shows afterward
</user_flows>

<edge_cases>
- Before the first hand the table shows the "Deal first hand" prompt rather than an empty board, and the Hand history panel shows "No hands played yet" while empty
- Illegal or stale actions (acting when it is not the human's turn, an out-of-range raise, input left over from a resolved hand) are rejected with specific visible feedback rather than silently mutating the current hand
- The primary game loop withstands rapid repeated use through its normal controls without producing a blank screen, an uncaught error, a frozen table, or a wrong final count
- Rapidly double-activating "Deal next hand" starts exactly one new hand, and the hands-played count increases by exactly one when it completes
- Importing malformed session JSON or a document whose schemaVersion is not feltrun-session-v1 shows an inline error naming the import field, leaves stacks and stats unchanged, and does not clear hand history
- Undo last action is unavailable before the human has acted on the current street and after the street advances; activating it when disabled does not change the pot or stacks
- Save table with no prior deal still produces a restorable checkpoint that reloads to the pre-deal "Deal first hand" prompt rather than inventing a mid-hand board
- Switching difficulty mid-session does not reset chip stacks, stats, or hand history
</edge_cases>

<visual_design>
- Near-black felt aesthetic: the page background uses the color token --color-background (#02070C), a near-black felt tone, with light-on-dark contrast throughout so card faces, chip-stack amounts, and seat badges read clearly against it — no dark text on the dark background
- The human seat highlight and key call-to-action buttons use --color-primary (#FFFF7D); links and secondary highlights use --color-accent (#FFFE68)
- Typography uses the Poppins font stack for both headings and body text; a section heading renders large at approximately 34.56px and body text at approximately 24.84px
- Shape system: a 2px base spacing unit (paddings, margins, and gaps are small, tight multiples of 2px rather than large default browser spacing) and an approximately 5px border radius on cards and panels
- The three AI play-style badges (Aggressive, Tight, Bluffer) are visually distinct from one another at a glance — by color and/or icon, not distinguishable by their text label alone
- Icons across the chrome (panel toggles, badges, controls) come from one consistent icon set with a uniform stroke and sizing, not a mix of styles
- Idle and empty states are designed rather than blank: the table shows the "Deal first hand" prompt before the first hand, and the Hand history panel shows "No hands played yet" when empty
- Every betting control and panel toggle shows a visible hover state distinct from its resting state
- At showdown the winning hand's highlight (border or glow) is clearly distinguishable at a glance from the other revealed hands, and the badge-unlock toast is legible against the felt
- The Export panel shows a monospaced session JSON preview with Copy and Download actions, and the difficulty control and Save table / Load saved table controls read as part of the same chrome rather than a disconnected gadget strip
</visual_design>

<motion>
- The hand-equity percentage changes with a visible transition (a fade or animated move, not an instant jarring snap) each time a new community card is dealt, driven by the real deal/betting flow
- Unlocking an achievement badge shows a transient toast that appears at the moment it is earned and clears on its own after about 3 seconds without blocking the betting controls
- Winning a hand at showdown fires a brief celebratory confetti burst over the table, triggered only by a real hand resolving in the human's favor
- All betting controls and panel toggles ease their background/border on hover
- The showdown reveal flips remaining hole cards face-up and applies the winning-hand highlight as the hand resolves
- A newly completed hand animates into the top of the Hand history list rather than appearing instantly
- On narrow viewports the stats/history/badges drawer opens and closes with a smooth transition without obstructing the table
- Export Copy shows a brief copied confirmation that clears on its own; the Export panel preview updates without a full page reload when the session mutates
- With prefers-reduced-motion set, decorative animations (equity transition, confetti, list entrance) are removed and state changes apply instantly
</motion>

<responsiveness>
- At approximately 375px wide the table and betting controls stay usable with no horizontal page scroll, and the stats and history panels collapse into a toggleable drawer rather than being clipped; data-dense text (chip amounts, equity percentage, stats numbers) stays legible and unclipped
- At approximately 375px wide the Export panel, Save table / Load saved table, Undo last action, and difficulty controls remain reachable without covering the betting controls permanently
</responsiveness>

<accessibility>
- Every betting control, panel toggle, slider, Undo last action, Save table, Load saved table, difficulty control, and Export Copy/Download/Import control is reachable and operable with the keyboard alone, and keyboard focus is clearly visible on every interactive control, legible against the dark felt
- The "Start new session" confirmation prompt behaves as a modal dialog: it traps focus while open and returns focus to the control that opened it on close
- The badge-unlock toast and the export copied confirmation are announced to assistive technology via a polite live region as well as shown visually
- Raise-amount and import validation errors are rendered next to the field they describe and are announced to assistive technology when they appear
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or uncaught exceptions appear during a full session of dealing, betting, showdown, rebuy, undo, save/load, export/import, and panel toggling
- The UI stays responsive under rapid repeated input on the betting controls with no hangs or dropped interactions
</performance>

<requirements>
- Shared game state must live in Pinia stores; the app is a client-rendered Vite SPA with no backend, no server, no database, and no authentication
- Styling is Tailwind CSS 4.3.2 (pinned, via @tailwindcss/vite) with the design tokens defined in an @theme block; Tailwind owns layout, spacing, and custom surfaces
- Reka UI provides the table chrome — the new-session confirmation dialog, panel/drawer toggles, the raise slider, toasts, and the stats/history/badges/export panels; hand-roll the table felt, cards, and chips themselves
- Motion for Vue and canvas-confetti are the only animation libraries allowed; no other animation libraries. Framework-native transitions alone do not satisfy the motion requirements
- Icons come from @phosphor-icons/vue only; no raw copy-pasted SVGs and no icon CDNs
- All form input — the raise-amount entry, session import, and any settings/session controls with fields — validates through a Zod schema wired via VeeValidate, surfacing inline per-field errors before submit; schemas are API-shaped: the raise schema models a raise-action request body with required integer amount bounded by the legal minimum raise and the human's stack; the session import schema requires schemaVersion exactly feltrun-session-v1 plus session, stacks, handHistory, and inProgressHand with the field contracts stated in core features; export and import use that same session document shape
- Persistence uses localStorage so state survives a full page refresh: chip stacks, tournament blind level, hand count, win-rate stats (hands played, hands won, biggest pot, rebuys), hand history, unlocked badges, difficulty, the saved-table checkpoint, and any in-progress hand must all restore exactly after a reload. Guard storage access so the production build never crashes when storage is unavailable
- The card deck, shuffling, hand evaluation, hand-equity estimation, and AI decision logic are fully client-side with no external randomness and no API or network service; there must be no same-origin 4xx/5xx requests during normal play
- State contracts (behavioral, observable, not storage keys): dealing a hand seats 4 players at 1000 chips and posts blinds; a raise moves chips from the human's stack into the pot by exactly the raised amount; completing a hand increments hands played and, on a human win, hands won and possibly biggest pot, and appends a hand-history entry that the export preview reads from the same store; every 8 completed hands advances the blind level and increases both blinds without resetting stats or history; a rebuy resets the human stack to 1000 and increments the rebuys counter; Undo restores the prior street state for the human's last action when still legal; Save table / reload / Load saved table restore the same mid-hand position; New Session resets the table, stats, history, badges, and exportable session document only after explicit confirmation; a page refresh restores the persisted progress above; export text is compiled live from the store so it always mirrors visible session state
- Stale input from a resolved or earlier phase must never mutate the current hand, and illegal actions must be rejected with specific visible feedback
- Collaboration merge contract: the "Collaboration scenario" section exposes visible controls named "Go Offline" and "Go Online", an editor labelled "Shared editor", and a converged region labelled "Shared content"; changes are merged by stable operation identity so both delivery orders converge to identical "Shared content" without dropping either non-conflicting change, and a same-note conflict surfaces an explicit user choice instead of silently overwriting
- Library allowlist: Vue 3, Pinia, Tailwind CSS 4.3.2 (with @tailwindcss/vite), Reka UI, Motion for Vue, canvas-confetti, VeeValidate, Zod, @phosphor-icons/vue, and yjs are permitted. All libraries are installed via npm and bundled locally; no CDN imports. No backend, no authentication, and no additional component libraries
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- command-session-v1
- browse-query-v1
- structured-editor-v1
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

<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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
- Session operations: start; advance; restart; pause; resume; trigger_demo; connect; disconnect
- Destinations: table; stats; hand-history; badges; export; collaboration
- Editor operations: add; update_property
- Editor object types: shared-note
- Artifact operations: export; import; copy
- Export formats: json
- Import modes: session-json

Mechanics exclusions:
- Hand-equity meter transition on each new street stays Playwright-observed
- Badge-unlock toast and showdown reveal stay Playwright-observed
- Concurrent-merge delivery ordering and same-note conflict resolution stay Playwright-driven
- Export Download bytes and clipboard contents stay Playwright-only per artifact-transfer restrictions
- File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp only drives Load sample / import mode without file bytes
- Undo last action and mid-hand Save table / Load saved table stay Playwright-driven via the real controls

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
