<summary>
Build a single-player Texas hold'em poker table called FeltRun using Vue 3, Pinia, and Tailwind CSS.
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
- The app opens directly at / into the poker table with no login, registration, or backend call; before any hand is dealt the table shows a "Deal first hand" prompt rather than an empty board
- Clicking "Deal first hand" seats one human player plus 3 AI opponents (4 seats total), each starting with a 1000-chip stack, deals two hole cards to every seat, posts the blinds, and begins a hand
- When it is the human's turn, Fold, Check or Call (whichever is legal), Raise, and All-in controls are all visible, along with quick-bet shortcuts "1/2 pot" and "Pot" and a raise-amount input plus slider; using "1/2 pot" populates the raise amount to half the current pot and "Pot" populates it to the full current pot, and the two set distinct values
- Raising by a specific chip amount immediately increases the pot by that amount and decreases the human's visible stack by the same amount, with no page reload
- A live hand-equity percentage sits next to the human's hole cards and recalculates to a new value after each dealt street (preflop to flop, flop to turn, turn to river), reflecting the current board
- Each of the 3 AI seats shows a labeled play-style badge — Aggressive, Tight, or Bluffer — and the labeled styles visibly influence behavior: the Aggressive seat raises noticeably more often than the Tight seat, which folds or calls conservatively, while the Bluffer raises even on weak holdings
- A tournament blind-level indicator shows the level number and the current small/big blind amounts together (for example "Level 1 — blinds 5/10"); after every 8 completed hands the level advances by one and both blind amounts increase
- A persistent Session stats panel shows hands played, hands won, win rate as a percentage, biggest pot won, and a rebuys count, updating after every completed hand; the win rate stays consistent with hands won divided by hands played
- At showdown with two or more players remaining, every remaining player's hole cards are revealed face-up and the winning 5-card hand is highlighted together with its hand-type label (for example "Two pair", "Flush")
- A toggleable Hand history panel lists completed hands most-recent-first with pot size, winner, and winning hand type, and shows "No hands played yet" while empty
- When the human's chip stack reaches 0, a Rebuy control appears; using it resets the stack to 1000 chips and increments the visible rebuys counter in the stats panel by 1
- Achievement badges (for example "First win", "First bluff win", "Felted an opponent", "Comeback kid") unlock during play: each surfaces as a transient toast the moment it is earned and is then listed in a Badges panel, where earlier badges persist as later ones are added
- "Deal next hand" starts a fresh hand once the current one resolves; "Start new session" opens a confirmation prompt and, once confirmed, resets the table, chip stacks, stats, hand history, and badges to their initial state, while cancelling leaves everything unchanged
- The primary game loop withstands rapid repeated use through its normal controls without producing a blank screen, an uncaught error, a frozen table, or a wrong final count; illegal or stale actions (acting when it is not the human's turn, an out-of-range raise) are rejected with specific visible feedback rather than silently mutating the hand
- A visible "Collaboration scenario" section provides a "Shared editor" input, a "Shared content" list, "Go Offline"/"Go Online" controls, and peer-simulation controls; changes authored while offline queue locally, reconnecting offers a delivery-order choice, applying the queued changes in either order converges to the same "Shared content", and two edits to the same note surface an explicit keep-mine / keep-peer conflict choice rather than silently overwriting
</core_features>

<visual_design>
- Near-black felt aesthetic: the page background uses the color token --color-background (#02070C), a near-black felt tone, with light-on-dark contrast throughout so card faces, chip-stack amounts, and seat badges read clearly against it — no dark text on the dark background
- The human seat highlight and key call-to-action buttons use --color-primary (#FFFF7D); links and secondary highlights use --color-accent (#FFFE68)
- Typography uses the Poppins font stack for both headings and body text; a section heading renders large at approximately 34.56px and body text at approximately 24.84px
- Shape system: a 2px base spacing unit (paddings, margins, and gaps are small, tight multiples of 2px rather than large default browser spacing) and an approximately 5px border radius on cards and panels
- The three AI play-style badges (Aggressive, Tight, Bluffer) are visually distinct from one another at a glance — by color and/or icon, not distinguishable by their text label alone
- The hand-equity percentage changes with a visible transition (a fade or animated move, not an instant jarring snap) each time a new community card is dealt
- Idle and empty states are designed rather than blank: the table shows the "Deal first hand" prompt before the first hand, and the Hand history panel shows "No hands played yet" when empty
- Every betting control and panel toggle shows a visible hover state distinct from its resting state, and keyboard focus is clearly visible on every interactive control, legible against the dark felt
- At approximately 375px wide the table and betting controls stay usable with no horizontal page scroll, and the stats and history panels collapse into a toggleable drawer rather than being clipped; data-dense text (chip amounts, equity percentage, stats numbers) stays legible and unclipped
- At showdown the winning hand's highlight (border or glow) is clearly distinguishable at a glance from the other revealed hands, and the badge-unlock toast is legible against the felt
</visual_design>

<motion>
- The hand-equity meter animates its value change on each new street rather than snapping instantly, driven by the real deal/betting flow
- Unlocking an achievement badge shows a transient toast that appears at the moment it is earned and clears on its own after a few seconds without blocking the betting controls
- All betting controls and panel toggles ease their background/border on hover and show a focus ring on keyboard focus
- The showdown reveal flips remaining hole cards face-up and applies the winning-hand highlight as the hand resolves
- On narrow viewports the stats/history/badges drawer opens and closes without obstructing the table
</motion>

<requirements>
- Shared game state must live in Pinia stores; the app is a client-rendered Vite SPA with no backend, no server, no database, and no authentication
- Persistence uses localStorage so state survives a full page refresh: chip stacks, tournament blind level, hand count, win-rate stats (hands played, hands won, biggest pot, rebuys), hand history, and unlocked badges must all restore exactly after a reload. Guard storage access so the production build never crashes when storage is unavailable
- The card deck, shuffling, hand evaluation, hand-equity estimation, and AI decision logic are fully client-side with no external randomness and no API or network service; there must be no same-origin 4xx/5xx requests during normal play
- State contracts (behavioral, observable, not storage keys): dealing a hand seats 4 players at 1000 chips and posts blinds; a raise moves chips from the human's stack into the pot by exactly the raised amount; completing a hand increments hands played and, on a human win, hands won and possibly biggest pot; every 8 completed hands advances the blind level and increases both blinds without resetting stats or history; a rebuy resets the human stack to 1000 and increments the rebuys counter; New Session resets the table, stats, history, and badges only after explicit confirmation; a page refresh restores the persisted progress above
- Stale input from a resolved or earlier phase must never mutate the current hand, and illegal actions must be rejected with specific visible feedback
- Collaboration merge contract: the "Collaboration scenario" section exposes visible controls named "Go Offline" and "Go Online", an editor labelled "Shared editor", and a converged region labelled "Shared content"; changes are merged by stable operation identity so both delivery orders converge to identical "Shared content" without dropping either non-conflicting change, and a same-note conflict surfaces an explicit user choice instead of silently overwriting
- Library allowlist: Vue 3, Pinia, Tailwind CSS (with @tailwindcss/vite), and yjs are permitted. No backend, no authentication, and no additional component libraries; hand-roll the table felt, cards, and chips
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
- structured-editor-v1

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

Bindings:
- Session operations: start; advance; restart; trigger_demo; connect; disconnect
- Destinations: table; stats; hand-history; badges; collaboration
- Editor operations: add; update_property
- Editor object types: shared-note

Mechanics exclusions:
- Hand-equity meter transition on each new street stays Playwright-observed
- Badge-unlock toast and showdown reveal stay Playwright-observed
- Concurrent-merge delivery ordering and same-note conflict resolution stay Playwright-driven

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
