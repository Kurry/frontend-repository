<summary>
Build a Dare Night party card game using Astro with hydrated Svelte islands, Svelte runes, Tailwind CSS 4.3.2, and Bits UI.
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
Feature: Setup screen —
- The app opens on a setup screen titled Dare Night with a players panel, category toggles, an intensity selector, a round-timer switch, a custom-card form, a visible win-target readout of First to 10, Export Session and Import Session controls, and a Start game control; if a saved Dare Night record exists it shows a Dare Night record line naming the record holder and their points; if a saved in-progress checkpoint exists it also shows a Resume Saved Session control
- The players panel starts with two empty name fields; the user adds 2 to 8 player names and each name is required
- The Start game control is disabled until at least 2 non-empty unique names exist and at least one category is selected; attempting to start while invalid shows a visible inline error next to the offending control naming what to fix, and a silently disabled button alone is never the only feedback
- Four category chips labeled Icebreaker, Truth, Dare and Wild toggle which categories are in play; toggling a chip flips it between selected and unselected and a live count of selected categories is shown
- Three intensity buttons labeled Mild, Spicy and Wild choose the deck intensity; exactly one is active at a time and the active one is visually filled while the others stay outlined; Wild decks favor Wild-tagged cards, Spicy decks favor spicier cards, and Mild decks favor milder cards
Feature: Player and custom-card field contracts (API-shaped payloads) —
- Adding a player submits a player payload whose required field is name: a trimmed string of length 1 to 20 inclusive that must be unique among the roster ignoring case; the Add control stays disabled until name is valid, and a name shorter than 1 character after trim, longer than 20 characters, or duplicating an existing name shows an inline validation message next to the player list that names the field name and the broken rule
- Submitting a custom card creates a custom-card payload whose required fields are prompt (trimmed string length 8 to 200 inclusive), category (exactly one of Icebreaker, Truth, Dare, Wild), and intensity (exactly one of Mild, Spicy, Wild); the Submit control stays disabled until every field is valid; a prompt under 8 characters shows an inline message naming the field prompt and the 8-to-200 length rule, and no card is added
- The player record that appears in the roster IS that player payload; the custom-card list entry IS that custom-card payload; session export and import use the same field names and bounds
Feature: Play screen and competitive loop —
- Pressing Start game switches to the play screen without a full page reload; the play screen shows whose turn it is above the card area, a Draw card control, a Start new game control, a View scores control, a Save Progress control, and Export Session and Copy Session JSON controls; a progress readout shows each player's points toward the fixed win target of 10
- Pressing Draw card reveals the next card as a white panel showing its category label, an intensity badge, and prompt text at least 18px and centered; the current player's name stays shown above the card at all times
- After a card is on screen, a Done button and a Skip button appear; pressing Done awards the current player one point, pressing Skip logs one forfeit for the current player and awards no point, and either one immediately advances to the next player in the fixed join order and reveals whose turn it is — unless that Done press reaches 10 points for that player, in which case the game ends instead of advancing
- The first player whose points reach exactly 10 wins: the play screen shows a visible Winner announcement naming that player, the scoreboard marks them as the winner, Draw card / Done / Skip become unavailable, and the session status is finished; the winner is a real decided outcome from play, not a static label
- A scoreboard, opened from View scores, lists every player with their points and forfeits sorted by points descending, and updates immediately after each resolved turn
- Turning on the round-timer switch and drawing a card starts a 15-second countdown shown on the card; if it reaches zero before Done or Skip is pressed, the card is logged as a forfeit for the current player and the turn advances exactly as a Skip would
- The Start new game control asks for confirmation in a dialog, then returns to the setup screen with players and scores cleared and no leftover Winner banner, while preserving the saved Dare Night record
- An Undo last turn control reverts the most recent Done, Skip, or timer-triggered forfeit: it restores that player's points and forfeits to their prior values, returns the turn to that player, and re-shows the exact card that was on screen rather than drawing a new one; Undo is unavailable after the game has already finished with a Winner
Feature: Custom cards —
- The custom-card form takes prompt text, a category and an intensity; submitting a valid payload adds a custom card that is mixed into the deck and can be drawn during play, and shows a transient confirmation
- Each saved custom card is listed with its prompt, category, and intensity and a Delete control; pressing Delete opens a confirmation dialog before the card is removed
Feature: Save, resume, and session export (useful end state) —
- During an active (not finished) game after at least one resolved turn, Save Progress shows a Saved confirmation and writes a schema-shaped checkpoint using the same dare-night-session-v1 field names as Export Session; Save Progress is unavailable or clearly disabled before any turn is resolved and after a Winner is declared
- After a full page reload with a checkpoint present, Resume Saved Session on the setup screen restores the same players in the same order, each player's points and forfeits, the same current turn, the same selected categories and intensity, the same round-timer setting, the same custom cards, and the same in-progress card if one was on screen
- Export Session produces a downloadable and copyable JSON document compiled live from the store. The top-level object uses schemaVersion exactly equal to dare-night-session-v1 and required fields with these names and shapes: status (exactly one of setup, playing, finished), players (array of objects each with name string, points non-negative integer, forfeits non-negative integer, in join order), categories (array of the selected category strings), intensity (exactly one of Mild, Spicy, Wild), roundTimer (boolean), currentTurnIndex (non-negative integer), winTarget (integer 10), winner (winning player name string, or null when no winner yet), customCards (array of objects each with prompt, category, and intensity matching the custom-card field contract), record (object with holder string and points non-negative integer, or null when no record exists), turnLog (array of objects each with playerName, outcome as exactly one of done, skip, timeout, cardPrompt, category, and intensity), and exportedAt (an ISO-8601 timestamp string). Copy Session JSON shows a brief Copied confirmation. After play that awarded points or logged forfeits, the export's players points and forfeits and turnLog must reflect those session mutations — a blank stub or hardcoded sample is a failure
- Import Session accepts a previously exported dare-night-session-v1 JSON. A valid import reconstructs the visible session so players, points, forfeits, current turn, categories, intensity, custom cards, winner, and turnLog match the imported document. Malformed JSON, a wrong schemaVersion, or a payload missing required fields shows a visible rejection naming that the file is invalid and changes nothing
Feature: Live event feed —
- A live event feed panel on the play screen shows Start, Pause, Reconnect and Deliver out of order controls, a visible stream status, a per-player live-bonus total, and an applied-event log; delivered values change while the stream is active
</core_features>

<user_flows>
- Completing setup with 3 players, pressing Start game, drawing a card and pressing Done updates three surfaces at once without a reload: the resolving player's points rise by exactly one on the scoreboard, the turn indicator above the card advances to the next player in join order, and the scoreboard ordering re-sorts if the new point total changes the standings
- Starting a game with a single category selected and then drawing at least 3 cards in a row yields only cards whose category label matches that selected category, proving the toggles filter the deck rather than being cosmetic; returning to setup and selecting a different single category yields only that category's cards on the next game
- Submitting a valid custom card increases the custom-card list count by exactly one, shows a transient confirmation, and the new card is drawable during play; after a page refresh the same card is still listed and still drawable, and after its delete is confirmed and the page is refreshed the card does not reappear
- With 3 or more players, resolving turns repeatedly rotates through players in a fixed repeating order that returns to the first player after the last; the rotation stays stable across re-renders, and refreshing mid-game restores the same players in the same order with each player's points and forfeits and the same current turn
- Ending a session where a player exceeds the previous best total updates the Dare Night record line on the setup screen to name that player and their points; the record survives a page refresh and survives a confirmed Start new game reset even though players and scores are cleared
- In the live event feed, duplicate deliveries are ignored, delivering events out of order resolves to the same per-player live-bonus totals as in-order delivery, and pressing Reconnect after a pause catches up any missed events exactly once without double-applying, with the applied-event log and totals agreeing
- Competitive finish: with the win target at 10, resolving Done turns until one player's points reach 10 shows the Winner announcement naming that player, disables Draw card / Done / Skip, and marks finished status; a confirmed Start new game then returns to a clean setup with no Winner banner and cleared players and scores while the Dare Night record remains
- Export after play: after at least one Done and one Skip, Export Session or Copy Session JSON yields JSON whose players points and forfeits match the scoreboard and whose turnLog includes those outcomes; schemaVersion is dare-night-session-v1 and winTarget is 10
- Save and resume across reload: starting a game, resolving at least one turn, pressing Save Progress, fully reloading, then pressing Resume Saved Session restores the same players, points, forfeits, current turn, categories, intensity, and on-screen card if one was showing
- Import round-trip: exporting a playing or finished session, importing that file on a fresh setup, and confirming players, points, forfeits, current turn or winner, custom cards, and turnLog match the export
</user_flows>

<edge_cases>
- Adding a name that duplicates an existing one (case-insensitive) is rejected with a visible inline error next to the player list rather than being added; the error names the field name
- Adding a 9th player is refused so the roster caps at 8, and an empty or whitespace-only name is never added to the roster
- A player name longer than 20 characters is rejected with an inline message naming the field name and the 1-to-20 length rule, and is not added
- If every category is deselected a visible inline explanation appears and Start game is disabled
- A custom-card prompt shorter than 8 characters is rejected with a visible message naming the field prompt and the 8-to-200 length rule, and no card is added; a prompt longer than 200 characters is likewise rejected
- Before any custom card is added the custom-card list shows a friendly empty-state message
- Cancelling the delete confirmation dialog leaves the custom card in place
- Drawing cards until every card in the selected categories has been drawn reshuffles the deck automatically, shows a Deck reshuffled confirmation, and never draws the same card twice in a row across the reshuffle boundary
- Undo last turn is unavailable at the start of a game, once it has already been used for the latest action, and after a Winner has been declared
- Save Progress is unavailable or clearly disabled when no turn has been resolved yet and after the game is finished; Resume Saved Session is unavailable when no checkpoint exists
- Importing malformed JSON, a payload whose schemaVersion is not dare-night-session-v1, or a payload missing required session fields shows a visible rejection naming that the file is invalid and does not corrupt the live session
- After a Winner is declared, Draw card, Done, and Skip do not mutate scores further
- The app rejects illegal or stale actions during play and withstands rapid repeated activation of its controls without duplicating a transition, blanking the screen, or corrupting the last valid game state; double-activating Done resolves exactly one turn
</edge_cases>

<visual_design>
- A single-column, centered layout on a bright cyan background using the color tokens: background cyan #34CDE3, white #FFFFFF card and panel surfaces, black #000000 primary text, white #FFFFFF inverse text, near-black #010101 accent for primary buttons and headings, and light cyan #AEEBF4 for secondary text
- Typography uses the Poppins family with a system-font fallback: h1 headings at 32px bold, h2 section headings at 20px semibold, body text at 14px, and card prompt text visibly larger at least 18px and centered
- A 10px base spacing unit governs paddings and margins as multiples of 10px; cards and panels use a 10px corner radius; all buttons are fully rounded pills with a radius of at least 24px
- Primary buttons such as Draw card, Done, Start game, Export Session and Save Progress use a near-black background with white text, a pill shape and a subtle drop shadow; secondary buttons such as Skip, Start new game, Import Session, Copy Session JSON, Resume Saved Session and unselected category chips use a white background with black text, a black border and a pill shape
- Each category has its own distinguishable chip color: Icebreaker blue, Truth teal, Dare orange, Wild magenta; each intensity has its own distinguishable badge color: Mild green, Spicy amber, Wild red, all legible at a glance on every drawn card
- The selected intensity button and every toggled-on category chip are visually distinguished by a filled or inverted treatment from the unselected outlined ones
- The live event feed shows a status pill whose dot color and label distinguish the idle, active, paused, disconnected and caught-up states
- Controls carry a single consistent icon set: crisp inline icons of one visual family appear on the primary play controls, the status pill, and the custom-card list actions, sized to match their labels
- Confirmation dialogs render as centered white panels over a dimmed backdrop, styled with the same pill buttons and corner radii as the rest of the app
- The Winner announcement is a prominent on-screen banner naming the winning player, visually distinct from ordinary toasts, and the scoreboard winner row is highlighted
- The win-target readout First to 10 is always visible on setup and during play
</visual_design>

<motion>
- Drawing a card animates the card panel in with a short flip-and-fade transition of roughly 0.2 to 0.4 seconds rather than snapping into place instantly, triggered by pressing the Draw card control
- Awarding a point, logging a forfeit, reshuffling the deck, and adding or deleting a custom card each show a transient toast confirmation that slides in and disappears on its own after about 3 seconds without blocking play
- Adding a custom card animates the new list entry in, and a confirmed delete animates the entry out rather than removing it abruptly
- Scoreboard rows ease to their new positions when a resolved turn changes the standings order
- Every button, category chip, intensity button and the card show a visible hover state distinct from their resting state, and pressing a button gives immediate pressed feedback
- When the round timer is on, the countdown updates every second and visibly pulses as it nears zero
- The active category chips and the active intensity button transition their fill and border when toggled
- Confirmation dialogs and the scoreboard enter with a brief fade-and-scale transition and exit the same way
- When a resolved turn sets a new all-time Dare Night record, a brief confetti burst plays over the play screen exactly once for that record moment, triggered by the real Done press and never looping ambiently
- Declaring a Winner plays a short celebration burst tied to that finishing Done press, distinct from ambient motion and never looping
- With prefers-reduced-motion set, the card flip, toasts, dialog transitions, the Winner celebration and the confetti burst are replaced by instant state changes and the game remains fully playable
</motion>

<responsiveness>
- At about 375px wide the app renders without horizontal scrolling and the card, scoreboard, setup form, export controls and live event feed stay fully usable and readable
- Between 1440px and 375px the single-column layout stays centered, buttons remain full pills at a comfortable tap size, and no control overlaps or clips at any width in between
</responsiveness>

<accessibility>
- Keyboard Tab focus is visibly indicated on every interactive control, and every control on the setup and play screens is reachable and operable with the keyboard alone
- Confirmation dialogs trap focus while open, close on Escape, and return focus to the control that opened them
- Category chips and intensity buttons expose their selected state to assistive technology, not only through color
- Inline validation errors are rendered next to the field they describe and are announced to assistive technology when they appear
- The Winner announcement is exposed to assistive technology when it appears, not only as a color change
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors, warnings, or hydration mismatch messages appear on load or during a full exercise of setup, play through a Winner, custom cards, export and import, and the live event feed
- The one-second countdown ticks and the live event feed updates never freeze the UI; controls stay responsive while the timer runs and the stream is active
</performance>

<writing>
- Headings and buttons use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Draw card, Start game, Undo last turn, Export Session, Save Progress and Resume Saved Session rather than generic labels
- Error messages name the problem and the fix, empty states explain what belongs there and how to add it, and no placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
- Build the app with Astro static output and hydrated Svelte islands, using Svelte runes ($state and $derived) for all shared client state and Tailwind CSS 4.3.2 (pinned, design tokens in @theme) for styling; target Node 22 or newer. No backend, no authentication, and the app opens directly at the root path
- Bits UI provides the component chrome: the drawn-card panel, the confirmation dialogs (Start new game, custom-card delete), the scoreboard surface, the round-timer switch, and the category and intensity toggle groups
- svelte-motion and canvas-confetti are the allowed animation libraries, alongside CSS transitions and Svelte's built-in transitions; no other animation libraries. canvas-confetti is reserved for the new-record celebration and the Winner celebration
- Phosphor icons via the phosphor-svelte package only, used inside the Svelte islands; no other icon sets, no raw copy-pasted SVGs, no icon CDNs
- All forms — the player setup panel and the custom-card form — are driven by Felte with a Zod schema defining the rules; the schemas model API-shaped payloads (the player create body and the custom-card create body) and power the inline per-field errors shown before submit; submit stays disabled until the schema passes. Required field contracts: name is a trimmed string length 1 to 20 inclusive and unique case-insensitive in the roster; prompt is a trimmed string length 8 to 200 inclusive; category is the closed enum Icebreaker, Truth, Dare, Wild; intensity is the closed enum Mild, Spicy, Wild
- Bundle the Poppins font locally (for example via its @fontsource package); all libraries are installed via npm and bundled locally, with no CDN imports of any script, style, font, or icon
- Persist across page refresh via localStorage, guarding all storage access so the production build does not crash: saved custom cards restore into the custom-card list and remain drawable; the Dare Night record restores onto the setup screen; an in-progress game or Save Progress checkpoint restores the same players in the same order with each player's points and forfeits, the same current turn, categories, intensity, round-timer setting, custom cards, and on-screen card when present; deleting a custom card persists so the card does not reappear after a refresh
- State contracts (behavioral, not storage keys): all shared game state lives in one runes-backed store; resolving a turn updates that player's points or forfeits and the scoreboard everywhere they appear; reaching 10 points for a player sets status to finished, sets winner to that player's name, and freezes further scoring; the deck is filtered by the selected categories and weighted by the selected intensity from one shared collection, not a second disconnected copy; the current turn, selected categories and intensity, timer setting, record, checkpoint and export payload are shared client state; toggling views or resolving turns does not reload the document; WebMCP tool handlers invoke the same store commands as the visible controls
- Seed a fixed built-in deck spanning all four categories and all three intensities so play works before any custom card is added; do not require pre-seeded players — the roster is created through the setup form
- The competitive loop is real end-to-end: play advances through Draw, Done or Skip (or timer forfeit), scores accumulate, the first player to 10 points produces a decided Winner outcome, and Start new game returns to a clean setup with no state leaking from the finished game except the preserved Dare Night record and custom cards
- Export Session and Import Session round-trip the dare-night-session-v1 JSON field contract described in core features; export content is compiled live from the store and must include the session's actual points, forfeits, turnLog, customCards and winner when present
- Validation and empty states: fewer than 2 players, a duplicate name, a name outside 1 to 20 characters, or zero categories selected each show a visible inline error next to the offending control; the custom-card list shows a friendly empty-state message before any card is added; a custom-card prompt outside 8 to 200 characters is rejected with a visible message naming prompt
- Player order is fixed at game start in the order players were added and rotates predictably until a Winner is declared; it stays stable across re-renders and refreshes mid-game
- The deterministic live event feed uses events carrying a stable id and a logical timestamp; duplicate delivery is ignored, out-of-order delivery resolves to the same final totals, and Reconnect catches up missed events exactly once without double-applying
- Single browser tab, single active game session, only the root path
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
- Session operations: start; pause; resume; stop; restart; advance; trigger_demo; connect; disconnect
- Demos: deliver-out-of-order
- Entity operations: create; select; update; delete; toggle
- Entity fields: prompt; category; intensity; name; outcome
- Form operations: validate; submit; cancel; reset
- Form fields: player-name; card-prompt; card-category; card-intensity
- Workflow steps: player-setup; start-game; add-custom-card
- Artifact operations: export; import; copy
- Export formats: json
- Import modes: dare-night-session

Mechanics exclusions:
- Card-flip / toast / timer-pulse animation timing stays Playwright-observed
- Live-stream tick timing stays Playwright-observed
- Winner celebration and record confetti timing stay Playwright-observed
- File picker interaction, clipboard contents, and downloaded session JSON stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
