<summary>
Build a goal decomposition and roadmap tool called FocusPath using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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

Feature: Goals overview —
- The app opens directly at / into a goals overview with no login wall; a persistent FocusPath header exposes + New Goal, Undo, Redo, Export, Import, and a command-palette trigger.
- + New Goal opens an inline styled form (never a native prompt) that creates a Goal payload matching the field contract below; the submit control stays disabled until required fields are valid, and submitting with a blank title shows an inline Goal title is required message next to the title field and adds no goal.
- Every form in the app (goal create and edit, milestone add, step add and edit, Import) validates its fields before submit and shows inline per-field error messages that name the field, rendered next to the offending field rather than as a browser alert.
- The goals overview lists every active goal as a card sorted by nearest target date, with goals that have no target date sorted last; each card shows the goal accent color, an overall completion percentage as both a number and a progress-bar fill, a steps-completed count, and a Needs Attention badge when the goal is stalled.
- With zero goals the overview shows Set your first goal to start building a path together with a + New Goal call to action.

Feature: Goal and milestone field contracts (API-shaped payloads) —
- A Goal create or edit form submits an API-shaped Goal payload whose required and optional fields are: title (required string, 1 to 80 characters), targetDate (optional string that is either empty or a calendar date formatted YYYY-MM-DD; dates before 1970-01-01 or after 2100-12-31 are rejected), accentColor (required; chosen from a fixed palette of exactly these 8 swatches, not a free-form color picker: #2b6f6e, #c98a3d, #3f9d6b, #4a6fa5, #8b5a8c, #c1483f, #6b7268, #d9a441), motivation (optional string, at most 280 characters), and createdAt (ISO-8601 date-time string set by the app on create and visible in Path Pack export).
- A Milestone create or edit form submits an API-shaped Milestone payload: title (required string, 1 to 80 characters), targetDate (optional empty or YYYY-MM-DD with the same bounds as Goal.targetDate), and createdAt (ISO-8601 date-time set on create).
- A Step create or edit form submits an API-shaped Step payload: title (required string, 1 to 120 characters), completed (boolean, default false), and createdAt (ISO-8601 date-time set on create); completing a step also records lastCompletedAt as an ISO-8601 date-time.
- Violations show an inline message naming the offending field and its rule (for example Goal title is required, Title must be at most 80 characters, Accent color must be one of the 8 palette swatches, Target date must be YYYY-MM-DD); invalid submit leaves the last valid state untouched.
- Records created by forms ARE the would-be request bodies: the same field names, types, bounds, and enums appear in the live Path Pack JSON export and are required again on Import.

Feature: Goal detail and milestone path —
- Opening a goal shows its detail view: the goal title, target date, motivation note, a completion percentage and progress bar, and its milestones rendered as numbered nodes connected by a line in order.
- In the milestone path, completed milestones render as filled solid nodes with a solid connector, the current active milestone (the first not-yet-complete milestone in order) renders visually highlighted, and later milestones render as outlined dashed nodes; node and connector fill match the completion the overview progress bar reports.
- + Add Milestone appends a milestone (title required, optional target date) to the end of the path; a new goal starts with zero milestones and a new milestone starts with zero steps; a goal with zero milestones shows Add your first milestone to build this path in place of the roadmap.
- Up and down reorder controls move a milestone earlier or later in the path, but they are disabled the moment that milestone or any earlier milestone is complete, and an inline note explains why (Reordering disabled — this milestone is complete, or Reordering disabled — an earlier milestone is complete).
- Each milestone owns an ordered checklist of action steps that can be added, toggled complete, edited inline, and deleted; a milestone auto-completes the instant every one of its steps is checked, and reverts to incomplete if a step is later unchecked; a milestone with zero steps shows Add a step to make progress and offers no way to mark it complete.
- A goal's completion percentage is completed steps divided by total steps aggregated across all its milestones, shown as a number and a progress bar and recalculated live as steps toggle (for example 2 of 4 steps reads 50%, then 3 of 4 reads 75%).

Feature: Today's Focus and velocity —
- Any action step from any goal or milestone can be toggled Focus Today; a Today's Focus panel lists up to 3 focused steps with quick-complete checkboxes.
- Toggling a 4th step into Today's Focus is rejected with an inline message asking to complete or unfocus one first, and the panel keeps showing exactly the existing 3.
- The Today's Focus panel stores a focusDate (YYYY-MM-DD) with the selections; whenever the stored focusDate differs from the current local calendar date, the panel clears the stale selections without altering the underlying steps' complete or incomplete state.
- A Daily Velocity readout beside Today's Focus shows focused-steps-completed today versus the focus cap of 3 (for example 1 of 3) and updates live as focused steps are quick-completed or unfocused.

Feature: Needs Attention and goal completion —
- A goal shows a Needs Attention badge on its overview card and at the top of its detail view when it has at least one incomplete milestone whose most recent step completion (lastCompletedAt), or createdAt if no step has been completed, is more than 7 days in the past; completing a fresh step dated today clears the badge.
- When a goal reaches 100%, a Mark Goal Complete action appears; confirming it records a completionDate (YYYY-MM-DD), removes the goal from the active list, and moves it into a Completed Goals section that is toggle-visible from the overview and renders the goal's path read-only.

Feature: Inline edit, delete, undo, and redo —
- Goal title, target date, and motivation, and milestone and step titles, are all editable inline; deleting a goal, milestone, or step requires an inline confirm step, and deleting a goal or milestone also removes its nested milestones and steps.
- Undo and Redo controls in the header (also driven by Ctrl+Z and Ctrl+Shift+Z, or Cmd on macOS) step backward and forward through goal, milestone, and step creates, edits, deletes, reorders, focus toggles, step completions, and Mark Goal Complete; both controls are visibly disabled when their stack is empty.
- Undo restores the exact prior visible state including overview cards, detail path, Today's Focus, Daily Velocity, and Completed Goals; a new mutation after Undo clears the redo stack and disables Redo.

Feature: Command palette —
- Activating the command-palette trigger or pressing Ctrl+K (Cmd+K on macOS) opens a palette that fuzzy-matches against active goal titles and milestone titles; choosing a goal opens its detail view, and choosing a milestone opens that goal's detail view with that milestone scrolled into view; Escape closes the palette.

Feature: Path Pack export and import (the app produces the user's roadmap files) —
- Export opens a drawer or modal with two format tabs regenerated live from the current store: Path Pack JSON and Markdown report.
- Path Pack JSON is a single document whose top-level field contract is: format (exactly the string focuspath-path-pack-v1), exportedAt (ISO-8601 date-time), activeGoals (array of Goal objects), completedGoals (array of Goal objects that include completionDate), and todaysFocus (object with focusDate as YYYY-MM-DD or empty string, and stepIds as an array of step id strings).
- Each Goal object in the pack must include: id (string), title, targetDate, accentColor (one of the 8 palette values), motivation, createdAt, completionPercent (number 0 to 100), milestones (array). Each Milestone object must include: id, title, targetDate, createdAt, completed (boolean), steps (array). Each Step object must include: id, title, completed, createdAt, and lastCompletedAt (ISO-8601 date-time or empty string when never completed).
- The Markdown report is a human-readable progress document listing every active and completed goal with its percentage, each milestone title with completion state, and each step as a checked or unchecked line; after session mutations the report text must contain the session's actual titles and completion marks.
- Both tabs derive from live state: editing a title, toggling a step, or changing Today's Focus and reopening Export changes the visible export text accordingly. Export content that omits the session's actual work is invalid.
- Copy places the visible tab's text on the clipboard and shows a visible confirmation; Download saves the visible tab as a file (path-pack.json or progress.md).
- Import reads a Path Pack JSON file; after an explicit confirmation that warns the current session will be replaced, a document that conforms to the Path Pack field contract replaces active goals, completed goals, and Today's Focus so the overview, detail paths, focus panel, Daily Velocity, and a fresh Export all match the imported pack; malformed JSON or a document that fails the field contract (wrong format string, missing required keys, accentColor outside the 8-swatch enum, title over its max length, targetDate not YYYY-MM-DD when present) shows validation naming the offending field and changes nothing.

Feature: Live activity stream —
- A local deterministic live activity stream exposes Start, Pause, Disconnect, Reconnect, and Deliver Out of Order controls with a visible stream status and an applied-event ledger; events carry stable IDs and logical timestamps, so duplicates are ignored, out-of-order delivery resolves by logical time, and Reconnect catches up applying each missed event exactly once.
</core_features>

<user_flows>
End-to-end flows the finished app must sustain without a reload except where a reload is the point:
- Creating a goal from the header form adds exactly one card to the goals overview in its correct target-date sort position, opens cleanly into a detail view showing the same title, date, motivation note, and accent color, and a page reload returns the app to an empty overview (in-memory session) with no revived goals.
- Adding a milestone with two steps and checking both steps in the detail view fills that milestone's node solid, raises the goal's detail progress bar and percentage, and returning to the overview shows the same raised percentage and steps-completed count on that goal's card without a reload; Export Path Pack JSON contains that goal with both steps marked completed and the matching completionPercent.
- Toggling three steps from two different goals into Today's Focus shows all three in the Today's Focus panel and updates Daily Velocity; ticking one focused step's quick-complete checkbox marks the same step complete in its milestone checklist, updates that goal's percentage on both the detail view and its overview card, and the Path Pack todaysFocus.stepIds and Markdown report both reflect the remaining focus selections and the completed step.
- Checking the final remaining step of a goal's last incomplete milestone auto-completes that milestone, brings the goal to 100%, and reveals Mark Goal Complete; confirming it decreases the active-goal card count by exactly one, shows the goal inside the toggle-visible Completed Goals section with a recorded completionDate and a read-only path; Undo restores the goal to the active list at 100% with Mark Goal Complete available again.
- Artifact round trip: create a goal with milestones and steps, toggle Focus Today on one step, Download Path Pack JSON, delete the goal so the overview is empty, then Import that same file and confirm; the goal, milestones, step completion states, Today's Focus selection, and Export previews all reconstruct to match the pack.
- Deleting a goal through its inline confirm step removes its card from the overview and removes any of its steps from Today's Focus; Undo brings the goal and its focus selection back; a page reload after delete leaves the overview empty with no revived data.
- Command palette jump: with at least two goals, open the palette with Ctrl+K or Cmd+K, type part of a milestone title, and choose it; the detail view for that goal opens with that milestone visible.
</user_flows>

<edge_cases>
- A milestone with zero steps shows Add a step to make progress and offers no way to mark it complete.
- Toggling a 4th step into Today's Focus is rejected with an inline message asking to complete or unfocus one first, and the panel keeps showing exactly the existing 3; unfocusing one then allows a different step to be focused.
- When todaysFocus.focusDate in the store differs from the current local calendar date (for example after Importing a Path Pack whose focusDate is yesterday), the Today's Focus panel clears stale selections without altering the underlying steps' complete or incomplete state.
- With zero goals the overview shows Set your first goal to start building a path together with a + New Goal call to action; a goal with zero milestones shows Add your first milestone to build this path in place of the roadmap.
- Double-submitting any create form (rapid repeated activation of its submit control) creates exactly one record: the relevant count increases by one and one new item appears.
- Invalid or extreme input (blank required titles, titles over max length, targetDate not YYYY-MM-DD, accentColor outside the 8 swatches, absurdly long motivation) is rejected with a specific inline message naming the field and leaves the last valid state untouched.
- Undo and Redo are disabled at empty-stack boundaries and never throw or corrupt goals when activated there; performing a new edit after Undo clears the redo stack and disables Redo.
- Importing malformed Path Pack JSON, or parseable JSON that fails the field contract, leaves goals, focus, and Export unchanged and shows validation naming the offending field.
- On the live activity stream, delivering the same event twice changes the applied-event ledger only once, and delivering events out of order settles the ledger into the same final state as in-order delivery.
</edge_cases>

<visual_design>
- Calm productivity palette: teal #2b6f6e primary for path lines and primary buttons, warm gold #c98a3d accent for the active milestone highlight, off-white #f6f5f0 app background, white #ffffff card and panel surfaces, green #3f9d6b for completed milestones and steps, amber #d9a441 for the Needs Attention badge, red #c1483f for delete confirmations, near-black #232823 primary text, muted #6b7268 secondary text.
- Goal and milestone titles use Fraunces, Georgia, serif from 1.6rem for the goal title down to about 1.1rem for milestone titles at weight 600; body text and UI chrome use Inter, system-ui, sans-serif at about 0.95rem weight 400; target dates use SFMono-Regular, monospace at about 0.75rem.
- Base spacing unit is 4px. Milestone nodes are fully rounded circles. Goal cards and step rows use 8px rounded corners. Form fields use 6px rounded corners.
- Primary buttons (+ New Goal, + Add Milestone, Mark Goal Complete, Export Download) use the teal primary background, white text, 6px rounded corners, a subtle small shadow, and no border. Secondary buttons (reorder arrows, Focus Today toggle, Undo, Redo, Import) use a transparent or white surface, primary-text color, a 1px muted-gray border, and 6px rounded corners. Delete controls use the red error color for their text.
- Buttons, form fields, badges, progress bars, and inline alerts share one consistent component language across all views, restyled to this palette rather than left in any default library theme.
- Icons come from a single consistent icon set used across the header, buttons, badges, and stream controls; no mixed icon styles and no emoji standing in for icons.
- The milestone path is built entirely from divs and borders — nodes as bordered circles, connectors as thin bars, dashed styling for upcoming milestones — with no charting or diagramming library and no SVG path element.
- Node fill and connector state (solid versus dashed) accurately reflect completion at all times and stay consistent between the overview progress bar and the detail path.
- Delete confirmations, the Today's Focus limit message, Export, Import, and the command palette render as inline styled UI, never as a browser alert or confirm dialog.
- The layout is a single / page; the goals overview, a goal's detail path view, and the Completed Goals section are views within that page, not separate routes.
- Export appears as a drawer or modal with format tabs (Path Pack JSON / Markdown report), a scrollable text preview, Copy and Download affordances, and a short hint line.
</visual_design>

<motion>
- Completing a milestone's final step animates its node filling in as the node transitions to the completed solid state.
- Navigating between the overview and a goal's detail view transitions smoothly rather than cutting abruptly.
- Adding a goal card, milestone, or step animates the new item into place rather than snapping; deleting one animates it out; reordering a milestone slides it to its new position instead of teleporting.
- Inline feedback (validation messages, the Today's Focus limit message, delete confirms) appears with a brief transition rather than popping in instantly.
- Milestone nodes, checklist rows, and Focus Today toggles each show a visible hover state and a visible keyboard focus outline.
- The completion progress bar animates its fill width as steps toggle.
- The Export drawer or modal and the command palette enter and exit with a brief opacity and scale transition; Copy and Download show a short confirmation before resetting.
- With prefers-reduced-motion set, animations are removed or reduced to near-instant while every state change still lands correctly.
</motion>

<responsiveness>
- At about 375px wide the roadmap switches from a horizontal to a vertical stacked path with no horizontal scrolling, and the Today's Focus panel moves below the path rather than beside it.
- No content clips or overflows the viewport at 375px width; all controls remain reachable and tappable.
- At desktop widths of 1024px and above the detail view shows the milestone path and the Today's Focus panel side by side.
- Export, Import, and the command palette stay fully visible and operable at small widths rather than rendering off-screen.
</responsiveness>

<accessibility>
- Every interactive control (buttons, checkboxes, reorder arrows, Focus Today toggles, stream controls, Undo, Redo, Export, Import, command palette) is reachable and operable with the keyboard alone, with a visible focus indicator.
- Form fields carry visible labels, and inline validation messages are rendered in the DOM adjacent to the field they describe.
- Checked and unchecked step states, disabled reorder controls, and the read-only completed path are distinguishable without relying on color alone.
- Export, Import confirmation, and the command palette use dialog semantics: focus moves in on open, stays trapped while open, Escape closes, and focus returns to the invoking control; Undo and Redo expose their disabled state to assistive technology.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- No console errors or warnings appear during a full exercise of the app: creating, editing, reordering, focusing, completing, deleting, exporting, importing, undoing, and driving the live stream controls.
- The UI stays responsive under rapid repeated input with no hangs, blank screens, or dropped interactions.
</performance>

<writing>
- Headings, buttons, and badges use one consistent capitalization convention throughout the app.
- Action labels are specific (+ New Goal, + Add Milestone, Mark Goal Complete, Focus Today, Export, Import, Undo, Redo) rather than generic labels like OK or Go.
- Error and limit messages name the problem and the fix; empty states explain what belongs there and how to add it; no placeholder or lorem text appears anywhere in the shipped UI.
</writing>

<requirements>
- Framework and state: build the app with Qwik components and resumable event handlers, and hold all shared app state (goals, milestones, steps, active view, active goal, Today's Focus selections with their focusDate, completed-goals visibility, undo and redo stacks, live export artifact texts, command-palette open state, and the live-stream ledger) in Qwik stores as the single source of truth; every view, count, badge, progress bar, Daily Velocity readout, and export preview derives from that one store, and a change made in one view echoes in every other view without a reload. Target Node 20. This is a frontend-only client-rendered Vite SPA: no backend, no server, no database, no API calls, and no authentication.
- Persistence contract (good-app, in-memory only): do not use localStorage, sessionStorage, IndexedDB, cookies, or other browser storage APIs. Session work survives through Export (Path Pack JSON and Markdown report) and through the WebMCP artifact and entity surfaces; a full page reload returns the app to an empty overview with empty undo and redo stacks. Deleting a goal, milestone, or step removes it from the in-memory store immediately so it does not reappear without Import or Undo.
- Styling: Tailwind CSS 4.3.2 (pinned) with design tokens in @theme, plus DaisyUI as the single component library for buttons, cards, badges, form fields, checkboxes, progress bars, and inline alerts, restyled to the task palette. Do not hand-roll components DaisyUI provides.
- Library allowlist: @builder.io/qwik 1.20.0, tailwindcss 4.3.2 with @tailwindcss/vite, daisyui, @formkit/auto-animate, @modular-forms/qwik with valibot, @iconify/tailwind4 for icons, vite 7.3.6, and http-server for serving the build. AutoAnimate is allowed for animation; no other animation libraries. Iconify CSS icons only — one icon set, no raw copy-pasted SVGs. All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon. Do not add charting or diagramming libraries; the milestone path must be built from divs and borders only.
- Forms and field contracts: every form (goal create and edit, milestone add, step add and edit, Import) is driven by the form library with a Valibot schema defining the validation rules; the schemas mirror the API-shaped Goal, Milestone, Step, and Path Pack payloads declared in core features (required fields, YYYY-MM-DD dates, the closed 8-swatch accentColor enum, title and motivation length bounds, format exactly focuspath-path-pack-v1). The form surfaces inline per-field errors before submit and keeps the submit control disabled while required fields are invalid. Created records ARE those payloads; Path Pack export and Import validate against the same schemas.
- Progress and status rules are exact and observable: goal completion percentage is completed steps divided by total steps aggregated across all milestones (50% at 2 of 4, 75% at 3 of 4); a milestone auto-completes the instant its last step is checked and reverts if a step is unchecked; a zero-step milestone shows Add a step to make progress and cannot be completed; Today's Focus caps at 3 with an inline message on a 4th attempt and clears stale selections when the stored focusDate is not the current local date; Daily Velocity shows focused completions out of 3; Needs Attention appears when a goal has an incomplete milestone whose most recent lastCompletedAt or createdAt is more than 7 days ago; Mark Goal Complete appears only at 100% and moves the goal to the read-only Completed Goals section with a recorded completionDate.
- Reorder controls are disabled once the milestone or any earlier milestone is complete, with an inline note explaining why; because reordering is driven by up/down buttons rather than drag gestures, it remains available.
- Useful end state: the app produces the user's roadmap files — Path Pack JSON and Markdown report — compiled live from the store, offered with Copy confirmation and Download, importable for round-trip reconstruction, and readable through the WebMCP artifact-transfer export surface. An export that omits session mutations is invalid.
- Advanced interaction depth: in one uninterrupted session a user can create, edit, organize, and remove goals, milestones, and steps across the overview and detail views, exercise domain state (completion, focus, velocity, stalled detection, goal completion), undo and redo mutations, export and import the Path Pack, and use the command palette to jump to a goal or milestone. The primary collection controls must withstand 25 rapid deterministic repetitions with an exact final count, responsive controls, and no blank screen, uncaught error, or sustained freeze. Invalid or extreme input is rejected with specific visible feedback without damaging the last valid state, and duplicate submissions are idempotent rather than creating duplicate records.
- Deterministic live-event scenario: provide visible Start, Pause, Reconnect, and Deliver Out of Order controls for a local event stream that updates the workflow view. Events carry stable IDs and logical timestamps; duplicates are ignored, out-of-order delivery resolves deterministically by logical time, and reconnect catches up without double-applying updates. The stream is local and deterministic with no network access.
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
- browse-query-v1
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
- Entity: goal; milestone; step
- Entity operations: create; select; update; delete; toggle; reorder
- Entity fields: title; target-date; accent-color; motivation; completed; focus-today; created-at; last-completed-at; completion-date
- Destinations: goals-overview; goal-detail; completed-goals; export-drawer; command-palette
- Session operations: start; pause; resume; connect; disconnect
- Demos: deliver-out-of-order
- Artifact operations: export; import; copy
- Export formats: path-pack-json; markdown-report
- Import modes: path-pack

Mechanics exclusions:
- Milestone-complete node fill-in animation stays Playwright-observed
- Overview-detail view transition stays Playwright-observed
- Narrow-viewport horizontal-vertical path reflow stays Playwright-observed
- Hover/focus washes on nodes, rows, and toggles stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args; clipboard and download verification stay Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
