<summary>
Build an execution kanban board for an AI prompt-engineering workspace using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Board columns and cards —
- The board displays exactly four fixed columns: Backlog, In Progress, Review, and Done; each column header shows the column name and a live count of the cards currently visible in that column
- On first load the board is seeded with at least 12 cards spread across all four columns so that no seeded column is empty: at least 4 in Backlog, at least 3 in In Progress, at least 3 in Review, and at least 2 in Done
- Every card shows its title, its assignee avatar or initials when an assignee is set, a status chip whose label matches the card's execution state, and a compact progress indicator reading n of m when the card has task items
- Dragging a card to another column moves it there and updates both column counts immediately without a reload
- Drop position is exact: dropping a card between two cards inserts it at exactly that position; dropping it below the last card appends it at the bottom; dropping onto an empty column places it as the only card
- Dragging a card within its own column reorders it to the exact drop position

Feature: Keyboard card movement —
- Every card exposes a move control (an overflow menu or equivalent) offering Move to Backlog, Move to In Progress, Move to Review, Move to Done, Move up, and Move down; activating one moves the card and updates both column counts exactly as the equivalent drag would
- The move control is reachable and operable with the keyboard alone

Feature: Create card —
- Clicking Add Card in a column opens a modal dialog with fields: title (required), description (optional), attached prompt (a select populated from the seeded prompt library, optional), and assignee (a select of the seeded assignees, optional)
- The Submit control stays disabled until the title field is non-empty; submitting with an invalid or empty title shows an inline validation message that names the title field and adds no card
- Submitting a valid card closes the modal, inserts the new card at the top of the target column, and increments that column's count by exactly one
- Double-activating the Submit control creates exactly one card

Feature: Prompt attachment —
- A card with an attached prompt shows a prompt icon and the prompt title as a distinct chip in the card body
- Clicking the prompt chip on a card opens a side panel showing the prompt title and its full prompt text in read-only form; the panel closes from a visible close control and from the Escape key
- The seed data includes a prompt library of at least 5 prompts, and at least 3 seeded cards carry an attached prompt

Feature: Card detail —
- Clicking a card (anywhere other than its drag handle, move control, or prompt chip) opens a modal detail view showing the title, description, attached prompt, assignee, a comment thread area, the card's task item checklist, and a status badge matching the card's current column
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
</core_features>

<user_flows>
- Create then move: submitting Add Card with a valid title in Backlog adds exactly one card at the top of Backlog and increases its count by one; dragging that card into In Progress moves it there, decreases the Backlog count by one, and increases the In Progress count by one — all without a reload
- Execute a card end to end: pressing Run on a card in In Progress advances its sub-items sequentially to complete, its progress indicator counts up live, and its status chip finishes reading complete; the board still shows the same columns and counts afterward
- Recover a failed run: on the seeded failing card, watch a sub-item retry with attempt counter and backoff countdown; after the run reaches a failed state (or by exhausting retries), pressing Retry resumes from the failed sub-item and previously completed sub-items stay checked with their original state
- Filter round trip: selecting an assignee in the filter narrows every column to that assignee's cards and updates every column count; clearing the filter restores the exact prior board and counts
- A page reload returns the app to its seeded state: the seeded cards in their seeded columns, no active filters, and all card executions back at their initial statuses
</user_flows>

<edge_cases>
- Dragging a card and dropping it back in its original position leaves the board and all counts unchanged
- Moving the last card out of a column leaves that column showing a designed empty state with a message and an Add Card control that opens the create flow targeting that column
- A card title longer than 80 characters is truncated with an ellipsis on the board card and shown in full in the detail view
- The Run control on a card that is already running is disabled or absent until the run finishes or fails
- Submitting the create form with only whitespace in the title counts as empty: a validation message appears and no card is added
</edge_cases>

<visual_design>
- The board is a horizontal scrolling container; each column is a fixed-width tile with its own internally scrollable card list, so long columns scroll inside themselves rather than stretching the page
- Cards render as tiles with a left accent border color-coded by column: gray for Backlog, blue for In Progress, yellow for Review, green for Done; moving a card updates its accent to the destination column's color
- Column count badges render as compact rounded tags adjacent to the column names
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
- Feedback toasts after create, save, and failed runs slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, card movements, modal transitions, and check animations apply instantly while all state changes and countdown text still occur
</motion>

<responsiveness>
- At desktop widths all four columns are visible or reachable by horizontally scrolling the board container; the page itself never scrolls horizontally
- At 768 pixels and below the toolbar stacks its filter, search, and actions without clipping; the board remains horizontally scrollable with fixed-width columns
- At 375 pixels wide no content clips or overflows the viewport, no page-level horizontal scrollbar appears, and every control remains tappable
</responsiveness>

<accessibility>
- Every interactive control — cards, move controls, Add Card, toolbar filter and search, modal fields, run and retry controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The keyboard move control is a first-class alternative to drag: a keyboard-only user can move any card to any column and reorder within a column
- Modal dialogs use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them
- Validation messages are associated with their fields so each message names the field it belongs to, and are announced via an aria-live region
- Card execution state changes (running, retrying, failed, complete) are announced via an aria-live region as well as shown visually
- Status is never conveyed by color alone: every status chip carries a text label
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the board, including drags, runs, and filtering
- Dragging cards stays smooth with no visible jank, and the UI stays responsive under rapid repeated input (rapid drags, rapid filter toggling) with no hangs
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the card collection and per-column order, the prompt library, assignees, active filters and search text, per-card execution state (sub-item statuses, attempt counts, backoff timers, run status), comments, and UI chrome (open modals and panels). Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid card grows the collection and the target column count together; moving a card updates both column counts from the same shared collection
- Editing a card in the detail view updates that same record on the board card in place
- Filters and search recompute the visible board from the shared collection; they never create a second disconnected copy, and column counts derive from the filtered view
- Execution state (statuses, attempts, progress rollups) lives in the same store the board renders from, so ticking sub-items update chips, progress indicators, and announcements from one source
- WebMCP tool handlers, where the action contract is attached, invoke the same store commands as the visible controls, so a contract-driven card move animates and updates counts identically to a drag
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the component library for all chrome — modals, side panels, tags, buttons, selects, notifications, and toolbars; no other component library. @dnd-kit/core for drag-and-drop. Motion for React and AutoAnimate allowed for animation — card moves, column reorders, and list microinteractions; no other animation libraries. @carbon/icons-react only for icons, installed via npm — no raw copy-pasted SVG icon sets. All forms — Add Card, the detail edit form, and the comment form — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles while Tailwind owns layout and custom surfaces. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; execution is simulated entirely client-side.
- Seed at least 12 cards across all four columns per the distribution above, a prompt library of at least 5 prompts, at least 4 distinct assignees, at least 3 cards with attached prompts, at least 8 cards with assignees, and 3 to 6 task sub-items on every card
- Seed exactly one In Progress card configured to fail a sub-item on its first two attempts and succeed on the third, so retry behavior is observable on every run
- Zero navigational outbound links for app chrome; all view and panel changes happen via shared client state
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
- entity-collection-v1
- browse-query-v1
- form-workflow-v1
- command-session-v1

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

Bindings:
- Entity: card
- Entity operations: create; select; update; delete; reorder
- Entity fields: title; description; column; position; assignee; attached-prompt; comment
- Value bounds: {"column":["backlog","in-progress","review","done"]}
- Browsable entity: cards
- Destinations: board; card-detail; prompt-panel
- Filters: assignee; search
- Form fields: title; description; attached-prompt; assignee; comment
- Form operations: validate; submit; cancel
- Session operations: start; restart
- Demos: card-execution; seeded-failing-run
- Workflow completion: column-counts
- Workflow completion: card-progress-n-of-m
- Workflow completion: status-chip-label

Mechanics exclusions:
- Card moves ARE state changes and go through entity update(column)/reorder, but drag gesture fidelity — raised shadow, ghost placeholder, exact drop-position insertion, settle animation — is graded via real Playwright drags only
- Keyboard move-control operability is graded via real Playwright keyboard interaction; WebMCP entity update only proves state parity
- Retry backoff countdown ticking and sub-item check animations are timed visuals, Playwright-observed live
- Toast and modal enter/exit transitions stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
