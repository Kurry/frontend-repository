<summary>
Build a Dare Night party card game using Astro with hydrated Svelte islands, Svelte runes, and Tailwind CSS.
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
- The app opens on a setup screen titled Dare Night with a players panel, category toggles, an intensity selector, a round-timer switch, a custom-card form, and a Start game control; if a saved record exists it shows a Dare Night record line naming the record holder and their points
- The players panel starts with two empty name fields; the user adds 2 to 8 player names, each name is required, and adding a name that duplicates an existing one (case-insensitive) is rejected with a visible inline error next to the player list rather than being added
- The Start game control is disabled until at least 2 non-empty unique names exist and at least one category is selected; attempting to start while invalid shows a visible inline error next to the offending control, and a silently disabled button alone is never the only feedback
- Adding a 9th player is refused so the roster caps at 8, and an empty or whitespace-only name is never added to the roster
- Four category chips labeled Icebreaker, Truth, Dare and Wild toggle which categories are in play; toggling a chip flips it between selected and unselected, a live count of selected categories is shown, and if every category is deselected a visible inline explanation appears and Start is disabled
- Three intensity buttons labeled Mild, Spicy and Wild choose the deck intensity; exactly one is active at a time and the active one is visually filled while the others stay outlined; Wild decks favor Wild-tagged cards, Spicy decks favor spicier cards, and Mild decks favor milder cards
- Starting a game with a single category selected and then drawing several cards in a row yields only cards whose category label matches that selected category, proving the toggles filter the deck rather than being cosmetic
- Pressing Start game switches to the play screen without a full page reload; the play screen shows whose turn it is above the card area, a Draw card control, a Start new game control, and a View scores control
- Pressing Draw card reveals the next card as a white panel showing its category label, an intensity badge, and prompt text at least 18px and centered; the current player's name stays shown above the card at all times
- After a card is on screen, a Done button and a Skip button appear; pressing Done awards the current player one point, pressing Skip logs one forfeit for the current player and awards no point, and either one immediately advances to the next player in the fixed join order and reveals whose turn it is
- With 3 or more players, resolving turns repeatedly rotates through players in a fixed repeating order that returns to the first player after the last, and the rotation stays stable across re-renders
- The custom-card form takes prompt text, a category and an intensity; submitting it adds a custom card that is mixed into the deck and can be drawn during play, and shows a transient confirmation; before any custom card is added the custom-card list shows a friendly empty-state message
- Each saved custom card is listed with a Delete control; pressing Delete requires a confirmation step before the card is removed, and cancelling the confirmation leaves the card in place
- A scoreboard, opened from View scores, lists every player with their points and forfeits sorted by points descending, and updates immediately after each resolved turn
- Turning on the round-timer switch and drawing a card starts a 15-second countdown shown on the card; if it reaches zero before Done or Skip is pressed, the card is logged as a forfeit for the current player and the turn advances exactly as a Skip would
- Drawing cards until every card in the selected categories has been drawn reshuffles the deck automatically, shows a Deck reshuffled confirmation, and never draws the same card twice in a row across the reshuffle boundary
- The highest single-player point total ever reached is saved and shown on the setup screen as the Dare Night record; it survives refreshes and survives a New game reset even though players and scores are cleared
- The Start new game control asks for confirmation, then returns to the setup screen with players and scores cleared while preserving the saved Dare Night record
- An Undo last turn control reverts the most recent Done, Skip, or timer-triggered forfeit: it restores that player's points and forfeits to their prior values, returns the turn to that player, and re-shows the exact card that was on screen rather than drawing a new one; Undo is unavailable at the start of a game and once it has already been used for the latest action
- A live event feed panel on the play screen shows Start, Pause, Reconnect and Deliver out of order controls, a visible stream status, a per-player live-bonus total, and an applied-event log; delivered values change while the stream is active, duplicate deliveries are ignored, delivering events out of order resolves to the same totals, and Reconnect catches up any missed events exactly once without double-applying
- The app rejects illegal or stale actions during play and withstands rapid repeated activation of its controls without duplicating a transition, blanking the screen, or corrupting the last valid game state
</core_features>

<visual_design>
- A single-column, centered layout on a bright cyan background using the color tokens: background cyan #34CDE3, white #FFFFFF card and panel surfaces, black #000000 primary text, white #FFFFFF inverse text, near-black #010101 accent for primary buttons and headings, and light cyan #AEEBF4 for secondary text
- Typography uses the Poppins family with a system-font fallback: h1 headings at 32px bold, h2 section headings at 20px semibold, body text at 14px, and card prompt text visibly larger at least 18px and centered
- A 10px base spacing unit governs paddings and margins as multiples of 10px; cards and panels use a 10px corner radius; all buttons are fully rounded pills with a radius of at least 24px
- Primary buttons such as Draw card, Done and Start game use a near-black background with white text, a pill shape and a subtle drop shadow; secondary buttons such as Skip, Start new game and unselected category chips use a white background with black text, a black border and a pill shape
- Each category has its own distinguishable chip color: Icebreaker blue, Truth teal, Dare orange, Wild magenta; each intensity has its own distinguishable badge color: Mild green, Spicy amber, Wild red, all legible at a glance on every drawn card
- The selected intensity button and every toggled-on category chip are visually distinguished by a filled or inverted treatment from the unselected outlined ones
- The live event feed shows a status pill whose dot color and label distinguish the idle, active, paused, disconnected and caught-up states
- At about 375px wide the app renders without horizontal scrolling and the card, scoreboard, setup form and live event feed stay fully usable and readable
</visual_design>

<motion>
- Drawing a card animates the card panel in with a short flip-and-fade transition of roughly 0.2 to 0.4 seconds rather than snapping into place instantly, triggered by pressing the Draw card control
- Awarding a point, logging a forfeit, reshuffling the deck, and adding or deleting a custom card each show a transient toast confirmation that slides in and disappears on its own after a few seconds without blocking play
- Every button, category chip, intensity button and the card show a visible hover state distinct from their resting state, and pressing a button gives immediate pressed feedback
- Keyboard Tab focus is visibly indicated on every interactive control
- When the round timer is on, the countdown updates every second and visibly pulses as it nears zero
- The active category chips and the active intensity button transition their fill and border when toggled
</motion>

<requirements>
- Build the app with Astro static output and hydrated Svelte islands, using Svelte runes ($state and $derived) for shared client state and Tailwind CSS for styling; target Node 22 or newer. No backend, no authentication, and the app opens directly at the root path
- Persist across page refresh via localStorage, guarding all storage access so the production build does not crash: saved custom cards restore into the custom-card list and remain drawable; the Dare Night record restores onto the setup screen; and an in-progress game restores the same players in the same order with each player's points and forfeits and the same current turn
- Deleting a custom card persists so the card does not reappear after a refresh
- State contracts (behavioral, not storage keys): resolving a turn updates that player's points or forfeits and the scoreboard everywhere they appear; the deck is filtered by the selected categories and weighted by the selected intensity from one shared collection, not a second disconnected copy; the current turn, selected categories and intensity, timer setting and record are shared client state; toggling views or resolving turns does not reload the document
- Seed a fixed built-in deck spanning all four categories and all three intensities so play works before any custom card is added; do not require pre-seeded players — the roster is created through the setup form
- Validation and empty states: fewer than 2 players, a duplicate name, or zero categories selected each show a visible inline error next to the offending control; the custom-card list shows a friendly empty-state message before any card is added; a custom-card prompt that is too short is rejected with a visible message
- Player order is fixed at game start in the order players were added and rotates predictably; it stays stable across re-renders and refreshes mid-game
- The deterministic live event feed uses events carrying a stable id and a logical timestamp; duplicate delivery is ignored, out-of-order delivery resolves to the same final totals, and Reconnect catches up missed events exactly once without double-applying
- No component or animation libraries are required; hand-rolled styling and CSS transitions provide the card and toast effects. Single browser tab, single active game session, only the root path
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
- entity-collection-v1
- form-workflow-v1

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

<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
}
</module_spec>

Bindings:
- Session operations: start; pause; resume; stop; restart; advance; trigger_demo; connect; disconnect
- Demos: deliver-out-of-order
- Entity operations: create; select; update; delete; toggle
- Entity fields: prompt; category; intensity; name; outcome
- Form operations: validate; submit; cancel; reset
- Form fields: player-name; card-prompt; card-category; card-intensity
- Workflow steps: player-setup; start-game; add-custom-card

Mechanics exclusions:
- Card-flip / toast / timer-pulse animation timing stays Playwright-observed
- Live-stream tick timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
