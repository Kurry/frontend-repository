<summary>
Build an execution kanban board for an AI prompt-engineering workspace using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Board columns and cards —
- The board displays exactly four fixed columns: Backlog, In Progress, Review, and Done; each column header shows the column name and a live count of the cards currently visible in that column
- On first load the board is seeded with at least 12 cards spread across all four columns so that no seeded column is empty: at least 4 in Backlog, exactly 3 in In Progress, exactly 3 in Review, and at least 2 in Done
- Every card shows its title, its assignee avatar or initials when an assignee is set, a status chip whose label matches the card's execution state, and a compact progress indicator reading n of m when the card has task items
- Dragging a card to another column moves it there and updates both column counts immediately without a reload
- Drop position is exact: dropping a card between two cards inserts it at exactly that position; dropping it below the last card appends it at the bottom; dropping onto an empty column places it as the only card
- Dragging a card within its own column reorders it to the exact drop position

Feature: Keyboard card movement —
- Every card exposes a move control (an overflow menu or equivalent) offering Move to Backlog, Move to In Progress, Move to Review, Move to Done, Move up, and Move down; activating one moves the card and updates both column counts exactly as the equivalent drag would
- The move control is reachable and operable with the keyboard alone

Feature: Create card —
- Clicking Add Card in a column opens a modal dialog with fields: title (required), description (optional), attached prompt (a select populated from the seeded prompt library, optional), and assignee (a select of the seeded assignees, optional)
- Field contract for a card record (API-shaped, same shape the board JSON export uses): title is required after trim, length 1 to 120 characters; description is optional up to 2000 characters; attached prompt must be empty or exactly one seeded prompt id; assignee must be empty or exactly one seeded assignee id; column is the Add Card target and must be exactly one of backlog, in-progress, review, or done; position is a zero-based integer within that column
- The Submit control stays disabled until the title field is non-empty after trim; submitting with an empty, whitespace-only, or over-long title shows an inline validation message that names the title field and adds no card; an attached prompt or assignee outside the seeded options shows an inline validation message naming that field and adds no card
- Submitting a valid card closes the modal, inserts the new card at the top of the target column, increments that column's count by exactly one, and the new card's fields in the board JSON export match the submitted values under the same field names
- Double-activating the Submit control creates exactly one card

Feature: Prompt attachment —
- A card with an attached prompt shows a prompt icon and the prompt title as a distinct chip in the card body
- Clicking the prompt chip on a card opens a side panel showing the prompt title and its full prompt text in read-only form; the panel closes from a visible close control and from the Escape key
- The seed data includes a prompt library of at least 5 prompts, and at least 3 seeded cards carry an attached prompt

Feature: Card detail —
- Clicking a card (anywhere other than its drag handle, move control, selection checkbox, or prompt chip) opens a modal detail view showing the title, description, attached prompt, assignee, a comment thread area, the card's task item checklist, and a status badge matching the card's current column
- Editing the title, description, or assignee in the detail view and clicking Save updates the card on the board in place without a reload
- Typing a comment and submitting it appends the comment to the thread with a visible timestamp; the card's comment count, where shown, updates immediately
- Cancel or closing the detail view without saving leaves the card unchanged

Feature: Filter and search —
- A toolbar above the board provides an assignee filter and a search input; active filters narrow all four columns simultaneously to matching cards while preserving the four-column structure
- Column header counts always reflect the currently visible cards, so filtering changes the counts
- Typing in the search input narrows cards incrementally by title match; clearing the search restores the full board exactly
- When the active filter and search match nothing in a column, that column shows a designed empty message rather than a bare gap; a visible Clear filters control restores the full board

Feature: Card execution —
- Every seeded card carries a task item checklist of 3 to 6 sub-items, each with its own status; unstarted items show a pending state
- A Run control on each card (visible on the card and in its detail view) starts a simulated execution: sub-items advance one at a time in order, each visibly switching pending, then running, then complete, with a short simulated duration per item so the progression is watchable
- While a card is executing its status chip reads running with an active indicator, and the card's n of m progress indicator increments live as each sub-item completes
- At least one seeded card in In Progress is configured so that one of its sub-items fails on its first two attempts and succeeds on the third: while retrying, the sub-item shows a retrying state with a visible attempt counter and a live backoff countdown in the form waiting Ns before retry 2 of 3
- A sub-item that exhausts its retries shows a failed state with a short inline error summary, the card's status chip reads failed, and a Retry control appears; activating Retry resumes execution from exactly the failed sub-item — sub-items already complete keep their checked state and do not re-run
- When every sub-item completes the card's status chip reads complete and the progress indicator reads m of m
- Executions on different cards produce different progressions matching each card's own sub-item list, and the same card can be run only once at a time

Feature: WIP limits —
- The In Progress and Review column headers each show a WIP limit of 3 beside the live count
- When a column's visible card count exceeds its WIP limit, that column's background shifts to a deep amber warning state and a breach label appears beside the count
- Moving or creating a card into a column past its WIP limit is still allowed (soft guard): the amber breach state appears immediately without blocking the move; moving cards out until the count is at or below 3 clears the amber state and the breach label

Feature: Multi-select and bulk move —
- Each card exposes a selection checkbox; selecting one or more cards reveals a bulk action bar with Move to Backlog, Move to In Progress, Move to Review, and Move to Done
- Confirming a bulk move relocates every selected card to the target column in selection order (appended at the bottom), updates all four column counts immediately, clears the selection, and dismisses the bar
- With zero cards selected the bulk action bar stays hidden

Feature: Undo and redo —
- Undo and Redo controls sit in the toolbar and also respond to Ctrl+Z and Ctrl+Shift+Z (Cmd on macOS); both controls are disabled when their stack is empty
- Undo reverses the most recent mutating action — create, detail edit, single-card move (drag or keyboard), bulk move, comment submit, or board import — and restores the prior column membership, order, counts, WIP breach state, and export preview
- Redo reapplies the most recently undone action with the same completeness; performing a new mutating action after an undo clears the redo stack and disables Redo

Feature: Board export (useful end state) —
- The app produces the user's board files: an Export control opens an Export drawer that compiles LIVE from the current store into two formats — board JSON and a markdown card digest — each regenerating whenever the board changes
- Board JSON is API-shaped like a real kanban-service payload: a board object with id and name; a columns array where each entry has id (exactly one of backlog, in-progress, review, done), name, wip_limit (integer or null), and ordered card_ids; a cards array where each card has id, title, description, column (same four-id enum), position (zero-based integer), assignee (string or null), attached_prompt (string id or null), status (exactly one of pending, running, retrying, failed, complete), tasks (array of objects each with id, title, status exactly one of pending, running, complete, retrying, failed, and attempts as a non-negative integer), and comments (array of objects each with id, body, and created_at as an ISO-8601 timestamp); plus prompts and assignees arrays mirroring the libraries — these field names and enum values are visible in the preview text
- The markdown digest is a human-readable document grouped by column listing each card's title, status, assignee, progress n of m, and task titles
- Export content must reflect every mutation the session made — a create, edit, move, bulk move, run that changes status or progress, undo, redo, or import that is visible on the board must appear (or disappear) in the compiled export text before download or copy
- Each format tab shows a monospaced preview; Copy writes the exact visible preview text to the clipboard and shows a brief copied confirmation; Download starts a file download of that same preview text
- Import accepts a previously exported board JSON: after a successful import the board shows the imported cards in their columns with titles, assignees, tasks, comments, and order matching the file, and the export preview's JSON matches that imported state; malformed JSON or a payload that violates the field contract shows an inline error naming the import field and leaves the board unchanged
</core_features>

<user_flows>
- Create then move: submitting Add Card with a valid title in Backlog adds exactly one card at the top of Backlog and increases its count by one; dragging that card into In Progress moves it there, decreases the Backlog count by one, and increases the In Progress count by one — and the board JSON export preview lists the new card under in-progress with the submitted title — all without a reload
- Execute a card end to end: pressing Run on a card in In Progress advances its sub-items sequentially to complete, its progress indicator counts up live, and its status chip finishes reading complete; the board JSON export for that card shows status complete and tasks all complete; the board still shows the same columns and counts afterward
- Recover a failed run: on the seeded failing card, watch a sub-item retry with attempt counter and backoff countdown; after the run reaches a failed state (or by exhausting retries), pressing Retry resumes from the failed sub-item and previously completed sub-items stay checked with their original state
- Filter round trip: selecting an assignee in the filter narrows every column to that assignee's cards and updates every column count; clearing the filter restores the exact prior board and counts
- Bulk move then undo: selecting three cards across columns, bulk-moving them to Done, confirms Done's count rises by three and the export preview lists those three under done; Undo restores their prior columns, counts, and export preview
- Export then import round-trip: after mutating the board (create or move at least one card), Download or Copy the board JSON, then Import that same JSON text — the board's visible titles, columns, order, and task progress match the pre-export mutated state, and the export preview matches again
- A page reload returns the app to its seeded state: the seeded cards in their seeded columns, no active filters, empty undo/redo stacks, no selection, Export closed, and all card executions back at their initial statuses
</user_flows>

<edge_cases>
- Dragging a card and dropping it back in its original position leaves the board and all counts unchanged
- Moving the last card out of a column leaves that column showing a designed empty state with a message and an Add Card control that opens the create flow targeting that column
- A card title longer than 80 characters is truncated with an ellipsis on the board card and shown in full in the detail view and in the export preview
- The Run control on a card that is already running is disabled or absent until the run finishes or fails
- Submitting the create form with only whitespace in the title counts as empty: a validation message naming title appears and no card is added; a title longer than 120 characters is rejected the same way
- Filling In Progress past its WIP limit of 3 shows the amber breach state immediately; moving cards out until the count is 3 or fewer clears the amber state
- Bulk move with zero selected cards does nothing and the bulk action bar stays hidden
- Importing malformed board JSON or a payload missing required card fields shows an inline error naming the import field, leaves column counts and titles unchanged, and does not treat the failed import as an undoable success
- After Undo restores a moved card, Redo moves it again; after a new create following an undo, Redo is disabled and cannot resurrect the cleared redo stack
</edge_cases>

<visual_design>
- The board is a horizontal scrolling container; each column is a fixed-width tile with its own internally scrollable card list, so long columns scroll inside themselves rather than stretching the page
- Cards render as tiles with a left accent border color-coded by column: gray for Backlog, blue for In Progress, yellow for Review, green for Done; moving a card updates its accent to the destination column's color
- Column count badges render as compact rounded tags adjacent to the column names; WIP limit and breach labels sit beside the count on In Progress and Review
- The Export drawer shows format tabs, a monospaced preview block, and Copy / Download / Import actions; the bulk action bar is a compact tray when multi-select is active; undo and redo sit in the toolbar
- Execution status chips use one consistent palette across the app: pending in neutral gray, running in blue with an active indicator, retrying in amber, failed in red, complete in green; the chip label always names the state in text, never color alone
- While dragging, the dragged card raises with a visible shadow and a ghost placeholder indicates the exact insertion position in the target column
- One consistent icon set is used throughout (prompt chips, move menus, run and retry controls, toolbar); no mixed icon styles
- Typography keeps a clear hierarchy: the board title larger than column headers, which are larger than card titles, which are larger than metadata text
- Buttons, selects, and inputs show distinct default, hover, focus (visible ring), disabled, and error treatments; no bare browser-default controls appear
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; cards lift subtly on hover; toolbar controls and menu rows take a visible hover wash; form controls show focus rings
- A dropped card settles into its new position with a transition of roughly 200 milliseconds rather than snapping; surrounding cards in both columns animate to their new positions
- A card moved via the keyboard move control animates to its destination with the same settle motion as a drag
- A newly created card animates in from opacity 0 over roughly 150 milliseconds at the top of its column
- Modal dialogs (create, detail) enter and exit with a short opacity and scale transition of roughly 200 to 300 milliseconds; the prompt side panel slides in from the edge and slides out on close
- Each sub-item completion animates its check state (a tick or fill transition) rather than flipping instantly, and the card progress indicator animates its increment
- Status chip changes (pending to running, running to complete, retrying to failed) transition their color rather than hard-swapping
- The retry backoff countdown visibly ticks down once per second until the next attempt starts
- Feedback toasts after create, save, failed runs, copy export, and successful import slide in, remain readable, and auto-dismiss with a fade
- The Export drawer and bulk action bar enter and exit with a short opacity transition of roughly 150 to 250 milliseconds
- WIP breach on a column fades the amber background in rather than hard-swapping
- With prefers-reduced-motion set, card movements, modal transitions, and check animations apply instantly while all state changes and countdown text still occur
</motion>

<responsiveness>
- At desktop widths all four columns are visible or reachable by horizontally scrolling the board container; the page itself never scrolls horizontally
- At 768 pixels and below the toolbar stacks its filter, search, undo/redo, Export, and actions without clipping; the board remains horizontally scrollable with fixed-width columns
- At 375 pixels wide no content clips or overflows the viewport, no page-level horizontal scrollbar appears, and every control remains tappable — including Export, undo/redo, and the bulk action bar when selection is active
</responsiveness>

<accessibility>
- Every interactive control — cards, selection checkboxes, move controls, Add Card, toolbar filter and search, undo/redo, Export, bulk move actions, modal fields, run and retry controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The keyboard move control is a first-class alternative to drag: a keyboard-only user can move any card to any column and reorder within a column
- Modal dialogs and the Export drawer use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them
- Validation messages are associated with their fields so each message names the field it belongs to, and are announced via an aria-live region
- Card execution state changes (running, retrying, failed, complete) and WIP breach announcements are announced via an aria-live region as well as shown visually
- Status is never conveyed by color alone: every status chip carries a text label, and WIP breach uses a text breach label in addition to the amber background
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the board, including drags, runs, filtering, export, and bulk moves
- Dragging cards stays smooth with no visible jank, and the UI stays responsive under rapid repeated input (rapid drags, rapid filter toggling) with no hangs
</performance>

<writing>
- Column headers, toolbar actions (Add Card, Export, Undo, Redo, Clear filters), and bulk move labels use one consistent capitalization convention throughout
- Action labels are specific verbs such as Add Card, Run, Retry, Export, and Move to Done rather than generic Submit or OK where a specific label is possible
- Validation and import errors name the field and the problem; empty column and empty filter states explain what belongs there and how to add or clear; no placeholder lorem text appears in the shipped UI
</writing>

<requirements>
Shared application state must live in Zustand (in-memory only): the card collection and per-column order, the prompt library, assignees, active filters and search text, per-card execution state (sub-item statuses, attempt counts, backoff timers, run status), comments, selection set, undo/redo stacks, WIP limit config, export/import draft text, and UI chrome (open modals, panels, and the Export drawer). Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid card grows the collection and the target column count together; moving a card updates both column counts from the same shared collection
- Editing a card in the detail view updates that same record on the board card in place
- Filters and search recompute the visible board from the shared collection; they never create a second disconnected copy, and column counts derive from the filtered view
- Execution state (statuses, attempts, progress rollups) lives in the same store the board renders from, so ticking sub-items update chips, progress indicators, announcements, and the board JSON export from one source
- Undo, redo, bulk move, and import operate on that same shared store so every dependent surface — column counts, WIP breach, export preview — reverts or updates together
- WebMCP tool handlers, where the action contract is attached, invoke the same store commands as the visible controls, so a contract-driven card move or export opens the same surfaces as the toolbar
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the component library for all chrome — modals, side panels, tags, buttons, selects, notifications, and toolbars; no other component library. @dnd-kit/core for drag-and-drop. Motion for React and AutoAnimate allowed for animation — card moves, column reorders, and list microinteractions; no other animation libraries. @carbon/icons-react only for icons, installed via npm — no raw copy-pasted SVG icon sets. All forms — Add Card, the detail edit form, the comment form, and board import — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Schemas are API-shaped: each form's schema models the payload a real kanban API would accept (the card record with title 1–120, optional description ≤2000, column enum, optional assignee and attached_prompt from seeded ids; the board import schema matches the board JSON export field contract), and the record a form creates is exactly the object that appears in the board JSON under the same field names. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles while Tailwind owns layout and custom surfaces. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; execution is simulated entirely client-side.
- Seed at least 12 cards across all four columns per the distribution above, a prompt library of at least 5 prompts, at least 4 distinct assignees, at least 3 cards with attached prompts, at least 8 cards with assignees, and 3 to 6 task sub-items on every card
- Seed exactly one In Progress card configured to fail a sub-item on its first two attempts and succeed on the third, so retry behavior is observable on every run
- Seed In Progress with exactly 3 cards (at the WIP limit) and Review with exactly 3 cards so a single added or moved card can demonstrate WIP breach
- Zero navigational outbound links for app chrome; all view and panel changes happen via shared client state
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
- entity-collection-v1
- form-workflow-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
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
- Entity: card
- Entity operations: create; select; update; delete; reorder; toggle
- Entity fields: title; description; column; position; assignee; attached-prompt; comment; status
- Value bounds: {"column":["backlog","in-progress","review","done"],"status":["pending","running","retrying","failed","complete"]}
- Form fields: title; description; attached-prompt; assignee; comment; import
- Form operations: validate; submit; cancel
- Session operations: start; restart
- Demos: card-execution; seeded-failing-run
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: board-json
- Workflow completion: column-counts
- Workflow completion: card-progress-n-of-m
- Workflow completion: status-chip-label
- Workflow completion: export-preview
- Workflow completion: wip-breach

Mechanics exclusions:
- Card moves ARE state changes and go through entity update(column)/reorder, but drag gesture fidelity — raised shadow, ghost placeholder, exact drop-position insertion, settle animation — is graded via real Playwright drags only
- Keyboard move-control operability is graded via real Playwright keyboard interaction; WebMCP entity update only proves state parity
- Assignee filter and search narrowing are graded via real Playwright interaction; no browse-query module is assigned
- Retry backoff countdown ticking and sub-item check animations are timed visuals, Playwright-observed live
- Toast and modal enter/exit transitions stay Playwright-observed
- Download file picker / clipboard contents stay Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
