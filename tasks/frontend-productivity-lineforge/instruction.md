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
Feature: Study shell and opening library —
- The app opens at / directly into the study interface with no login, registration, or backend call; a header reads LineForge, offers a Board theme selector, Undo and Redo controls, a command-palette affordance, an Export center control, and a View saved lines button showing the current saved-line count
- The Opening Library lists at least 12 bundled named openings grouped under family headings (Open Games, Semi-Open Games, Closed Games, Flank Openings); each opening shows its name, a short code label (e.g. C50, B20), and its bundled main-line move sequence in algebraic notation
- Typing in the library search field narrows the list to openings whose name, code, or family matches, each match still showing its name, code, and move preview; an empty search shows the full grouped list
- Selecting an opening loads it: the move tree renders as an indented, clickable structure showing a Main line row of move chips plus labeled branch variations (e.g. Giuoco Piano, Najdorf, Dragon), and the exploration board shows that opening's position
- Clicking any non-root move-tree node jumps the board to that exact position and marks the clicked node as selected; only one node is marked selected at a time
Feature: Board exploration —
- The exploration board enforces legal chess rules: clicking an own piece highlights its legal destination squares, then clicking a highlighted square moves the piece
- Beside the board a running captured-piece tally lists pieces captured by White and by Black and increments cumulatively as capturing moves are played
- Playing a legal move that matches a bundled continuation advances the selected node along the tree; playing a legal move that matches no bundled continuation shows a New Line badge and appends the move to the tree under a distinct Your Line branch labeled session-only for the current session
- For the selected node the Statistics panel shows a single horizontal stacked bar of three proportional segments (White win / Draw / Black win) whose widths track their percentages, the numeric White/Draw/Black figures, a Games in database count, and a visible Illustrative sample data label
- Each opening lists 3 bundled notable games showing Players, Event, Year, and Result; Loading one replays it move-by-move on the board via the Previous move and Next move controls
- Flip board reverses the board orientation, Reset to start returns the board to the opening's first position, and the Previous move / Next move scrubber steps through the currently loaded line move-by-move
- The Board theme selector offers at least 3 distinct themes (Classic, Forest, Slate) that instantly re-skin the board squares with no page reload
Feature: Practice —
- Practice this line hides the upcoming moves and shows a Your move prompt; playing the correct next move flashes the board green, shows a Correct! toast, and advances, while an incorrect but legal move flashes red, shows a Try again message, and reverts the board so the move can be retried
- Practice mode shows a running streak counter and a session accuracy percentage that update after each attempt
Feature: Saved lines with API-shaped field contract —
- Save this line opens a save form whose fields mirror a SavedLine request payload; every created or renamed saved line IS that payload shape, and the Study pack export and Import study pack paths conform to the same shape
- SavedLine field contract (required fields, formats, bounds, and enums are visible in the form and in the Study pack JSON preview): name (required string, length 1 to 80 after trim), openingCode (required string matching a bundled opening code currently in the library), moves (required array of one or more SAN move strings from the currently displayed sequence), ply (required integer from 0 through moves length inclusive, recording the selected tree depth), tags (optional array of zero to 8 strings, each tag length 1 to 24 after trim, drawn from a closed chip set of at least study, sharp, solid, trap, endgame when the user adds tags), notes (optional string, length 0 to 280), sideToMove (required exactly white or black, derived from ply so an even ply is white and an odd ply is black)
- The save form surfaces inline per-field errors naming the offending field and its rule before submit (empty name, name longer than 80, empty moves, ply outside 0 through moves length, more than 8 tags, a tag outside the closed set or longer than 24, notes longer than 280); the submit control stays disabled until the form is valid, and an invalid submit saves nothing
- Submitting a valid save stores the SavedLine under My Saved Lines; each saved entry can be Loaded back into the explorer (restoring its exact ply and highlighted node), Renamed (same field contract on name), or Deleted
- Each saved entry shows a selection checkbox; selecting one or more reveals a bulk action bar with a live selected count offering Add tag (from the closed tag set), Remove tag, and Delete selected (Delete selected requires a confirmation naming the count); each bulk action applies to every selected entry at once, then clears the selection
Feature: Favorites —
- A star toggle on each opening marks or unmarks it as a Favorite, and a Favorites Only filter narrows the library to starred openings, updating live as stars are toggled
Feature: Undo and redo —
- Undo and Redo controls in the header, plus Ctrl+Z and Ctrl+Shift+Z (Cmd on macOS), step backward and forward through save, rename, delete, bulk tag/delete, favorite toggle, and board-theme changes; both controls are disabled when their stack is empty
- Undo restores the exact prior state across My Saved Lines, the header saved-line count, Favorites, the Favorites Only filter membership, and the Board theme; performing a new mutation after an undo clears the redo stack and disables Redo
Feature: Command palette —
- Pressing Ctrl+K (Cmd+K on macOS) or activating the command-palette control opens a palette overlay with a focused search input; typing fuzzy-matches bundled opening names and codes, saved-line names, board themes, Export center, Practice this line, and View saved lines; arrow keys move a highlight, Enter activates the highlighted command (loading an opening or saved line, switching theme, or opening Export center / Practice / Saved lines), and Escape closes the palette and returns focus
Feature: Export center and study artifacts —
- The app produces the user's study files: an Export center panel shows two live-compiled artifacts derived from session state — Study pack JSON (a StudyPackDocument payload) and Current line PGN (standard PGN text for the currently displayed move sequence)
- StudyPackDocument field contract (the live Study pack JSON preview, Download study pack file, Copy study pack text, and Import study pack payload all conform to this same shape; field names and enum values are visible in the preview text): required top-level keys formatVersion (exactly the string 1), boardTheme (exactly one of classic, forest, slate), favorites (array of bundled openingCode strings), savedLines (array of SavedLine records conforming to the SavedLine field contract above), and generatedAt (ISO-8601 timestamp string that updates when the pack is regenerated)
- Both artifact previews recompute from live store state without a reload: after saving a line, starring an opening, changing Board theme, bulk-tagging, or exploring to a new ply, reopening or viewing Export center shows those mutations under the StudyPackDocument / PGN fields; an export that omits the session's actual saved lines, favorites, boardTheme, or current-line moves is invalid
- A Copy control on each artifact puts the exact visible preview text on the clipboard and shows a visible confirmation that reverts after a moment; Download study pack downloads a .json file whose contents match the Study pack JSON preview; Download PGN downloads a .pgn file whose contents match the Current line PGN preview
- Import study pack accepts a previously exported Study pack JSON file or pasted JSON that matches the StudyPackDocument field contract; a successful import replaces favorites, boardTheme, and My Saved Lines from that payload and updates the header saved-line count and Export center previews to match; malformed JSON, formatVersion other than 1, boardTheme outside classic/forest/slate, favorites entries that are not bundled opening codes, or savedLines entries that violate the SavedLine field contract show a visible error naming the offending field (or the payload when JSON is unparseable) and change nothing
Feature: Live relay —
- A Live relay panel exposes Start, Pause, Disconnect, Reconnect, and Deliver out of order controls with a visible stream status; events carry stable ids and logical timestamps so duplicates are ignored and out-of-order delivery resolves into logical-timestamp order, and Reconnect catches up buffered events exactly once
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- Saving a line end to end: after exploring an opening to a chosen ply, activating Save this line and submitting a valid SavedLine (name, derived openingCode, moves, ply, sideToMove) adds exactly one entry to My Saved Lines, increases the header saved-line count by exactly one, and Loading it restores the board to that exact ply with the matching tree node highlighted
- Favorites round-trip: starring an opening in the library immediately fills that opening's star, the Favorites Only filter now includes it without a reload; unstarring it while Favorites Only is active removes it from the filtered list immediately and the visible opening count decreases by exactly one
- Practice session lifecycle: entering Practice this line and playing a correct move increments the streak counter by one and raises the session accuracy, an incorrect legal move resets the streak to zero and lowers the accuracy, and loading a different opening returns both the streak and accuracy readouts to their starting values
- Deviation lifecycle: playing an off-book legal move on the exploration board shows the New Line badge, adds a Your Line branch to the move tree, and updates the board position; the Export center Current line PGN includes the off-book moves from the displayed sequence
- Theme continuity: choosing a different Board theme re-skins the board squares immediately, and the Study pack JSON boardTheme field shows that same theme value without a reload
- Export pipeline: after starring an opening, saving a named line with a closed-set tag, and choosing Forest theme, opening Export center shows those exact favorites, that savedLines name/tag/openingCode/moves/ply, and boardTheme forest in the Study pack JSON, and the Current line PGN contains the displayed SAN moves; Copy on Study pack shows a confirmation
- Import round-trip: after exporting a Study pack from a session with at least one favorite and one saved line, clearing favorites and deleting saved lines, then Import study pack of that JSON reconstructs the same favorites, boardTheme, and My Saved Lines entries including tags and notes, and the header saved-line count matches
- Undo round-trip: saving a line then Undo removes that entry and restores the prior saved-line count; Redo brings it back; starring then Undo restores the unstarred state across the star and Favorites Only filter
- Bulk tag then undo: selecting 2 saved lines, applying Add tag with study, shows study on both; a single Undo restores both entries without that tag
- Command palette flow: open the palette with Ctrl+K or Cmd+K, type part of a bundled opening name, press Enter — that opening loads into the explorer; reopening and choosing Export center opens that panel
- A page reload returns the app to its seeded baseline: empty Favorites, empty My Saved Lines, default Board theme Classic, no Your Line branch, practice streak and accuracy at their starting values, empty undo and redo stacks, and Export center Study pack JSON showing empty favorites and savedLines
</user_flows>

<edge_cases>
- Clicking a square that is not a legal destination for the picked-up piece is rejected with a visible message, the piece stays on its original square, and the position remains uncorrupted
- Submitting the save-line form with an empty name shows an inline validation message naming the name field and saves nothing; the save control stays disabled until the name is non-empty and within 1 to 80 characters
- Renaming a saved entry to an empty name is rejected with the same inline message naming the name field and the entry keeps its previous name
- Submitting a save with notes longer than 280 characters or more than 8 tags shows an inline message naming notes or tags and saves nothing
- Double-activating the save control creates exactly one saved entry: the header saved-line count increases by exactly one and one new entry appears
- With nothing favorited, enabling the Favorites Only filter shows a friendly empty-state message explaining how to star an opening
- With no saved lines, opening My Saved Lines shows an empty-state message explaining how to save one; deleting the last saved entry returns the panel to that empty state
- A library search that matches no opening shows an empty-state message in the list region; clearing the search restores the full grouped list exactly
- Importing malformed Study pack JSON shows a visible error naming the problem, leaves favorites and saved lines unchanged, and does not alter boardTheme
- Bulk Delete selected with zero checkboxes checked keeps the bulk bar hidden or its actions disabled so nothing is deleted
- Undo with an empty undo stack and Redo with an empty redo stack are disabled; activating them changes nothing and causes no errors
</edge_cases>

<visual_design>
- Study-desk aesthetic on a parchment page background (--color-background #F4F1EA) with white panel and card surfaces (--color-surface #FFFFFF) and near-black body text (--color-text-primary #1B1B1B)
- Deep navy primary (--color-primary #1E3A5F) for the header bar and the board frame; warm brass gold accent (--color-accent #C9A24B) for the active tree node, primary buttons, and the Favorite star toggle
- Serif headings evoking a printed chess manual (Georgia / Iowan Old Style) at 1.5rem or larger, paired with a legible sans-serif (Inter / Segoe UI) at 16px base for tree nodes, statistics, and body copy
- Shape system: approximately 10px corner radius on cards, panels, and the saved-lines drawer; approximately 6px on buttons and move chips
- The currently selected tree node keeps a persistent accent-colored left border so its position in the tree is always identifiable; the Your Line deviation branch and its New Line badge use a color visibly distinct from bundled main-line and branch styling
- Light and dark board squares stay clearly legible and distinguishable under every one of the 3 board themes
- One consistent icon set is used across the header, board controls, saved-lines actions, Export center, command palette, and the star toggle, sized and aligned uniformly
- The correct-move flash uses --color-success (#2F8F4E) and the incorrect-move flash uses --color-danger (#C0392B), clearly distinct from each other
- Opening family groups (Open Games, Semi-Open Games, Closed Games, Flank Openings) are visually separated with clear headers so browsing by family is easy at a glance
- Inline validation messages render in the danger color directly beside the field they name
- Export center uses monospaced preview blocks for Study pack JSON and Current line PGN with clear tab or section labels; the bulk action bar appears above My Saved Lines when any entry is selected
- The command palette is a centered overlay with a search field, kind labels (Opening, Saved line, Theme, Action) on result rows, and a highlighted keyboard selection
</visual_design>

<motion>
- Correct practice move: the board briefly flashes green (about 0.65s) and a Correct! toast slides in; incorrect legal move: the board briefly flashes red (about 0.65s) and a Try again message appears before the board reverts
- Toasts enter with a short slide-in (about 0.25s) and clear on their own without trapping interaction
- Saving a line animates the new entry into the My Saved Lines list; deleting an entry animates it out; the surrounding entries slide smoothly into place rather than snapping
- Narrowing the library by search or by the Favorites Only filter animates list items in and out instead of instantly swapping the list
- A newly captured piece animates into the captured-piece tally rather than appearing abruptly
- Selecting a tree node moves the persistent accent left border to the newly selected node
- Picking up a board piece lifts it and reveals target markers on its legal destination squares; the moved piece and last-move squares are highlighted after a move
- Required hover feedback: buttons, the star toggle, opening list items, move-tree chips, board controls, Export center controls, and command-palette rows each show a visible hover change distinct from their resting state
- Board theme changes re-skin the squares instantly with no reload
- The command palette overlay enters with a brief opacity and scale transition; Copy confirmation on Export center shows a short confirmation before resetting
- The bulk action bar slides in when the first saved line is selected and slides away when the selection clears
- With prefers-reduced-motion set, list and toast motion is reduced or removed and state changes still apply instantly and correctly
</motion>

<responsiveness>
- At approximately 375px wide the board, move tree, and statistics panel stack vertically without horizontal scrolling and without truncating data-dense text
- At desktop widths the library, board, and tree/statistics panels present side by side; no content clips or overflows the viewport at any width between 375px and 1440px
- Board controls, move chips, and the star toggle remain comfortably tappable at the 375px layout
- Export center previews and the command palette reflow to fit the column at 375px with no page-level horizontal scrolling
</responsiveness>

<accessibility>
- Every interactive control is reachable and operable with the keyboard alone, and shows a clearly visible focus ring on Tab focus
- The save and rename forms, Export center dialogs, import confirmation, bulk delete confirmation, and command palette trap focus while open and return focus to the control that opened them when closed
- Practice feedback (Correct! and Try again) is announced through an aria-live polite region as well as shown visually
- Inline form validation messages, import errors, and Copy confirmation are announced as well as rendered beside the field or control they name
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app
- Rapid stepping through a line with the Previous move / Next move scrubber stays responsive with no hangs or dropped interactions
- Switching board themes applies instantly with no reload and no layout shift
- Opening Export center or regenerating Study pack JSON and PGN previews after mutations stays responsive with no hangs
</performance>

<writing>
- Headings, buttons, and labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Save this line, Practice this line, Flip board, Export center, Download study pack, and Import study pack rather than generic labels
- Empty states explain what belongs there and how to add it; validation and rejection messages name the problem and the fix; no placeholder text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional beyond-spec polish that still fits a chess study desk: coachmarks that tour Practice this line, Save this line, and Export center on first visit; a printable study sheet layout preview; or keyboard move-entry for the board
</innovation>

<requirements>
- Shared application state must use Preact Signals as the single store (in-memory only): the opening library, selected opening and tree node, board position, captured-piece tally, practice streak and accuracy, Favorites, My Saved Lines with multi-selection, Board theme, live-relay status, undo and redo stacks, Export center preview buffers, command palette state, and UI chrome all live there, and every view derives from that one store with no second disconnected copy. Do not use localStorage, sessionStorage, or other browser storage APIs.
- State contracts (behavioral, not storage keys): creating, renaming, deleting, or bulk-tagging a saved line updates My Saved Lines, the header saved-line count, and the Study pack JSON from the same records; favorite toggles update the library star, Favorites Only filter, and Study pack favorites array together; board theme changes update the board squares and Study pack boardTheme together; undo and redo mutate that same shared state; Export center Study pack JSON and Current line PGN compile live from session state — an export that omits the session's actual mutations is invalid; a page reload returns the app to its seeded baseline
- Framework Preact 10 (client-rendered Vite SPA); styling Tailwind CSS 4.3.2 (pinned) with the Vite plugin and design tokens defined in @theme
- DaisyUI is the single allowed component library, used for the app chrome: the header bar, the saved-lines drawer, dialogs, selects, badges, and toasts; the chessboard is a DOM-based grid, not a Canvas, and the board rules engine and move tree are hand-rolled for this stack
- AutoAnimate is allowed for animation (list, tree, and tally microinteractions) alongside plain CSS transitions; no other animation libraries
- Phosphor icons only, delivered through the Iconify Tailwind plugin as an npm package; no other icon sets and no raw copy-pasted SVG icon collections
- All forms (saving a line, renaming a saved entry, bulk tag entry, import confirmation) are driven by TanStack Form paired with a Zod schema: the schema defines the SavedLine and StudyPackDocument field contracts and the form surfaces inline per-field errors before submit, with the submit control disabled until the form is valid
- Saved lines and study packs are modeled as API-shaped payloads: the record a form creates IS the would-be request body, and exports and imports conform to those same schemas; every violation message names the offending field and its rule
- Session-only state (the temporary Your Line deviation branch, Practice streak and accuracy, notable-game replay position) resets when a different opening is loaded and does not survive a page reload
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
- artifact-transfer-v1

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
- Browsable entity: openings
- Destinations: library; explorer; practice; notable-games; saved-lines; export-center
- Filters: favorites; family
- Themes: classic; forest; slate
- Entity: saved-line
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; opening-code; moves; ply; tags; notes; side-to-move
- Session operations: start; pause; resume; disconnect; restart; advance; trigger_demo
- Demos: deliver-out-of-order
- Artifact operations: export; import; copy
- Export formats: study-pack-json; pgn
- Import modes: study-pack

Mechanics exclusions:
- Board move animation, piece-lift, and practice green/red flash timing stay Playwright-observed (gesture/transient mechanics)
- Native file-picker / download interaction stays Playwright-driven
- Command-palette open gesture and keyboard navigation stay Playwright-observed when mechanism matters
- Clipboard contents and downloaded artifact bytes remain Playwright responsibilities per artifact-transfer restrictions

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
