<summary>
Build a LineForge chess opening study app using Preact, Preact Signals, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens at / directly into the study interface with no login, registration, or backend call; a header reads LineForge, offers a Board theme selector, and a View saved lines button showing the current saved-line count
- The Opening Library lists at least 12 bundled named openings grouped under family headings (Open Games, Semi-Open Games, Closed Games, Flank Openings); each opening shows its name, a short code label (e.g. C50, B20), and its bundled main-line move sequence in algebraic notation
- Typing in the library search field narrows the list to openings whose name, code, or family matches, each match still showing its name, code, and move preview; an empty search shows the full grouped list
- Selecting an opening loads it: the move tree renders as an indented, clickable structure showing a Main line row of move chips plus labeled branch variations (e.g. Giuoco Piano, Najdorf, Dragon), and the exploration board shows that opening's position
- Clicking any non-root move-tree node jumps the board to that exact position and marks the clicked node as selected; only one node is marked selected at a time
- The exploration board enforces legal chess rules: clicking an own piece highlights its legal destination squares, then clicking a highlighted square moves the piece
- Beside the board a running captured-piece tally lists pieces captured by White and by Black and increments cumulatively as capturing moves are played
- Playing a legal move that matches a bundled continuation advances the selected node along the tree; playing a legal move that matches no bundled continuation shows a New Line badge and appends the move to the tree under a distinct Your Line branch labeled session-only for the current session
- For the selected node the Statistics panel shows a single horizontal stacked bar of three proportional segments (White win / Draw / Black win) whose widths track their percentages, the numeric White/Draw/Black figures, a Games in database count, and a visible Illustrative sample data label
- Each opening lists 3 bundled notable games showing Players, Event, Year, and Result; Loading one replays it move-by-move on the board via the Previous move and Next move controls
- Practice this line hides the upcoming moves and shows a Your move prompt; playing the correct next move flashes the board green, shows a Correct! toast, and advances, while an incorrect but legal move flashes red, shows a Try again message, and reverts the board so the move can be retried
- Practice mode shows a running streak counter and a session accuracy percentage that update after each attempt
- Flip board reverses the board orientation, Reset to start returns the board to the opening's first position, and the Previous move / Next move scrubber steps through the currently loaded line move-by-move
- Save this line opens a save form with a name field prefilled with an editable name and stores the currently displayed move sequence under that name into My Saved Lines; each saved entry can be Loaded back into the explorer (restoring its exact ply and highlighted node), Renamed, or Deleted
- A star toggle on each opening marks or unmarks it as a Favorite, and a Favorites Only filter narrows the library to starred openings, updating live as stars are toggled
- The Board theme selector offers at least 3 distinct themes (Classic, Forest, Slate) that instantly re-skin the board squares with no page reload
- A Live relay panel exposes Start, Pause, Disconnect, Reconnect, and Deliver out of order controls with a visible stream status; events carry stable ids and logical timestamps so duplicates are ignored and out-of-order delivery resolves into logical-timestamp order, and Reconnect catches up buffered events exactly once
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- Saving a line end to end: after exploring an opening to a chosen ply, activating Save this line and submitting a valid name adds exactly one entry to My Saved Lines, increases the header saved-line count by exactly one, and after a full page refresh the entry is still listed and Loading it restores the board to that exact ply with the matching tree node highlighted
- Favorites round-trip: starring an opening in the library immediately fills that opening's star, the Favorites Only filter now includes it without a reload, and after a full page refresh the star remains filled; unstarring it while Favorites Only is active removes it from the filtered list immediately and the visible opening count decreases by exactly one
- Practice session lifecycle: entering Practice this line and playing a correct move increments the streak counter by one and raises the session accuracy, an incorrect legal move resets the streak to zero and lowers the accuracy, and loading a different opening returns both the streak and accuracy readouts to their starting values
- Deviation lifecycle: playing an off-book legal move on the exploration board shows the New Line badge, adds a Your Line branch to the move tree, and updates the board position; after a full page refresh the Your Line branch is gone while the last-opened opening, Favorites, My Saved Lines, and the selected Board theme are all restored exactly as they were
- Theme continuity: choosing a different Board theme re-skins the board squares immediately, and after a full page refresh the same theme is still applied to the board
</user_flows>

<edge_cases>
- Clicking a square that is not a legal destination for the picked-up piece is rejected with a visible message, the piece stays on its original square, and the position remains uncorrupted
- Submitting the save-line form with an empty name shows an inline validation message naming the name field and saves nothing; the save control stays disabled until the name is non-empty
- Renaming a saved entry to an empty name is rejected with the same inline message naming the name field and the entry keeps its previous name
- Double-activating the save control creates exactly one saved entry: the header saved-line count increases by exactly one and one new entry appears
- With nothing favorited, enabling the Favorites Only filter shows a friendly empty-state message explaining how to star an opening
- With no saved lines, opening My Saved Lines shows an empty-state message explaining how to save one; deleting the last saved entry returns the panel to that empty state
- A library search that matches no opening shows an empty-state message in the list region; clearing the search restores the full grouped list exactly
</edge_cases>

<visual_design>
- Study-desk aesthetic on a parchment page background (--color-background #F4F1EA) with white panel and card surfaces (--color-surface #FFFFFF) and near-black body text (--color-text-primary #1B1B1B)
- Deep navy primary (--color-primary #1E3A5F) for the header bar and the board frame; warm brass gold accent (--color-accent #C9A24B) for the active tree node, primary buttons, and the Favorite star toggle
- Serif headings evoking a printed chess manual (Georgia / Iowan Old Style) at 1.5rem or larger, paired with a legible sans-serif (Inter / Segoe UI) at 16px base for tree nodes, statistics, and body copy
- Shape system: approximately 10px corner radius on cards, panels, and the saved-lines drawer; approximately 6px on buttons and move chips
- The currently selected tree node keeps a persistent accent-colored left border so its position in the tree is always identifiable; the Your Line deviation branch and its New Line badge use a color visibly distinct from bundled main-line and branch styling
- Light and dark board squares stay clearly legible and distinguishable under every one of the 3 board themes
- One consistent icon set is used across the header, board controls, saved-lines actions, and the star toggle, sized and aligned uniformly
- The correct-move flash uses --color-success (#2F8F4E) and the incorrect-move flash uses --color-danger (#C0392B), clearly distinct from each other
- Opening family groups (Open Games, Semi-Open Games, Closed Games, Flank Openings) are visually separated with clear headers so browsing by family is easy at a glance
- Inline validation messages render in the danger color directly beside the field they name
</visual_design>

<motion>
- Correct practice move: the board briefly flashes green (about 0.65s) and a Correct! toast slides in; incorrect legal move: the board briefly flashes red (about 0.65s) and a Try again message appears before the board reverts
- Toasts enter with a short slide-in (about 0.25s) and clear on their own without trapping interaction
- Saving a line animates the new entry into the My Saved Lines list; deleting an entry animates it out; the surrounding entries slide smoothly into place rather than snapping
- Narrowing the library by search or by the Favorites Only filter animates list items in and out instead of instantly swapping the list
- A newly captured piece animates into the captured-piece tally rather than appearing abruptly
- Selecting a tree node moves the persistent accent left border to the newly selected node
- Picking up a board piece lifts it and reveals target markers on its legal destination squares; the moved piece and last-move squares are highlighted after a move
- Required hover feedback: buttons, the star toggle, opening list items, move-tree chips, and board controls each show a visible hover change distinct from their resting state
- Board theme changes re-skin the squares instantly with no reload
</motion>

<responsiveness>
- At approximately 375px wide the board, move tree, and statistics panel stack vertically without horizontal scrolling and without truncating data-dense text
- At desktop widths the library, board, and tree/statistics panels present side by side; no content clips or overflows the viewport at any width between 375px and 1440px
- Board controls, move chips, and the star toggle remain comfortably tappable at the 375px layout
</responsiveness>

<accessibility>
- Every interactive control is reachable and operable with the keyboard alone, and shows a clearly visible focus ring on Tab focus
- The save and rename forms trap focus while open and return focus to the control that opened them when closed
- Practice feedback (Correct! and Try again) is announced through an aria-live polite region as well as shown visually
- Inline form validation messages are announced as well as rendered beside the field they name
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app
- Rapid stepping through a line with the Previous move / Next move scrubber stays responsive with no hangs or dropped interactions
- Switching board themes applies instantly with no reload and no layout shift
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Save this line, Practice this line, and Flip board rather than generic labels
- Empty states explain what belongs there and how to add it; validation and rejection messages name the problem and the fix; no placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
- Shared application state must use Preact Signals as the single store: the opening library, selected opening and tree node, board position, captured-piece tally, practice streak and accuracy, Favorites, My Saved Lines, Board theme, live-relay status, and UI chrome all live there, and every view derives from that one store with no second disconnected copy
- Framework Preact 10 (client-rendered Vite SPA); styling Tailwind CSS 4.3.2 (pinned) with the Vite plugin and design tokens defined in @theme
- DaisyUI is the single allowed component library, used for the app chrome: the header bar, the saved-lines drawer, dialogs, selects, badges, and toasts; the chessboard is a DOM-based grid, not a Canvas, and the board rules engine and move tree are hand-rolled for this stack
- AutoAnimate is allowed for animation (list, tree, and tally microinteractions) alongside plain CSS transitions; no other animation libraries
- Phosphor icons only, delivered through the Iconify Tailwind plugin as an npm package; no other icon sets and no raw copy-pasted SVG icon collections
- All forms (saving a line, renaming a saved entry) are driven by TanStack Form paired with a Zod schema: the schema defines the rules and the form surfaces inline per-field errors before submit, with the submit control disabled until the form is valid
- Persistence uses localStorage and must survive a full page refresh for exactly these: the Favorites list, My Saved Lines, the last-selected Board theme, and the last-opened opening; guard storage access so the production build does not crash when storage is unavailable
- Session-only state (the temporary Your Line deviation branch, Practice streak and accuracy, notable-game replay position) must NOT persist across a refresh and must reset when a different opening is loaded
- The board must enforce legal chess rules: only legal moves are accepted, illegal targets are rejected with visible feedback and leave the position uncorrupted, and the captured-piece tally reflects the true position
- All opening names, move trees, statistics, and notable games are original bundled sample content invented for this app; the statistics card must carry an Illustrative sample data label and they need not represent real historical games
- No backend, no authentication, and no outbound navigation for app chrome; the app operates entirely at / with in-app state
- Seed nothing into the user's saved data on first load — Favorites and My Saved Lines start empty and the user creates their own entries through the UI
- The library must expose at least 12 openings across the family groups, each with 3 notable games; provide at least 3 board themes
- All libraries, fonts, and icons are installed via npm and bundled locally; no CDN imports
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
- browse-query-v1
- entity-collection-v1
- command-session-v1

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

Bindings:
- Browsable entity: openings
- Destinations: library; explorer; practice; notable-games; saved-lines
- Filters: favorites; family
- Themes: classic; forest; slate
- Entity: saved-line
- Entity operations: create; select; update; delete; toggle
- Entity fields: name
- Session operations: start; pause; resume; disconnect; restart; advance; trigger_demo
- Demos: deliver-out-of-order

Mechanics exclusions:
- Board move animation, piece-lift, and practice green/red flash timing stay Playwright-observed (gesture/transient mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
