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
- The app opens directly at / into a goals overview with no login wall; a persistent FocusPath header exposes a + New Goal button.
- + New Goal opens an inline styled form (never a native prompt) with a required title, an optional target date, an accent color chosen from a fixed palette of exactly 8 swatches (not a free-form color picker), and a short Why this matters motivation note; the submit control stays disabled until the title is non-empty, and submitting with a blank title shows an inline Goal title is required message next to the title field and adds no goal.
- Every form in the app (goal create and edit, milestone add, step add and edit) validates its fields before submit and shows inline per-field error messages that name the field, rendered next to the offending field rather than as a browser alert.
- The goals overview lists every active goal as a card sorted by nearest target date, with goals that have no target date sorted last; each card shows the goal accent color, an overall completion percentage as both a number and a progress-bar fill, a steps-completed count, and a Needs Attention badge when the goal is stalled.
- Opening a goal shows its detail view: the goal title, target date, motivation note, a completion percentage and progress bar, and its milestones rendered as numbered nodes connected by a line in order.
- In the milestone path, completed milestones render as filled solid nodes with a solid connector, the current active milestone (the first not-yet-complete milestone in order) renders visually highlighted, and later milestones render as outlined dashed nodes; node and connector fill match the completion the overview progress bar reports.
- + Add Milestone appends a milestone (title required, optional target date) to the end of the path; a new goal starts with zero milestones and a new milestone starts with zero steps.
- Up and down reorder controls move a milestone earlier or later in the path, but they are disabled the moment that milestone or any earlier milestone is complete, and an inline note explains why (Reordering disabled — this milestone is complete, or Reordering disabled — an earlier milestone is complete).
- Each milestone owns an ordered checklist of action steps that can be added, toggled complete, edited inline, and deleted; a milestone auto-completes the instant every one of its steps is checked, and reverts to incomplete if a step is later unchecked.
- Any action step from any goal or milestone can be toggled Focus Today; a Today's Focus panel lists up to 3 focused steps with quick-complete checkboxes.
- A goal's completion percentage is completed steps divided by total steps aggregated across all its milestones, shown as a number and a progress bar and recalculated live as steps toggle (for example 2 of 4 steps reads 50%, then 3 of 4 reads 75%).
- A goal shows a Needs Attention badge on its overview card and at the top of its detail view when it has at least one incomplete milestone whose most recent step completion, or creation date if no step has been completed, is more than 7 days in the past; completing a fresh step dated today clears the badge.
- When a goal reaches 100%, a Mark Goal Complete action appears; confirming it records a completion date, removes the goal from the active list, and moves it into a Completed Goals section that is toggle-visible from the overview and renders the goal's path read-only.
- Goal title, target date, and motivation, and milestone and step titles, are all editable inline; deleting a goal, milestone, or step requires an inline confirm step, and deleting a goal or milestone also removes its nested milestones and steps.
- A local deterministic live activity stream exposes Start, Pause, Disconnect, Reconnect, and Deliver Out of Order controls with a visible stream status and an applied-event ledger; events carry stable IDs and logical timestamps, so duplicates are ignored, out-of-order delivery resolves by logical time, and Reconnect catches up applying each missed event exactly once.
</core_features>

<user_flows>
End-to-end flows the finished app must sustain without a reload except where a reload is the point:
- Creating a goal from the header form adds exactly one card to the goals overview in its correct target-date sort position, opens cleanly into a detail view showing the same title, date, motivation note, and accent color, and after a full page refresh the same goal reappears with identical fields.
- Adding a milestone with two steps and checking both steps in the detail view fills that milestone's node solid, raises the goal's detail progress bar and percentage, and returning to the overview shows the same raised percentage and steps-completed count on that goal's card without a reload; reloading the page restores the same checked steps, node fill, and percentages exactly.
- Toggling three steps from two different goals into Today's Focus shows all three in the Today's Focus panel; ticking one focused step's quick-complete checkbox marks the same step complete in its milestone checklist, updates that goal's percentage on both the detail view and its overview card, and after a refresh the remaining focus selections and the completed step are all restored.
- Checking the final remaining step of a goal's last incomplete milestone auto-completes that milestone, brings the goal to 100%, and reveals Mark Goal Complete; confirming it decreases the active-goal card count by exactly one, shows the goal inside the toggle-visible Completed Goals section with a recorded completion date and a read-only path, and a refresh keeps the goal in Completed Goals without reviving it in the active list.
- Deleting a goal through its inline confirm step removes its card from the overview, removes any of its steps from Today's Focus, and a subsequent refresh does not revive the goal or any of its milestones and steps.
</user_flows>

<edge_cases>
- A milestone with zero steps shows Add a step to make progress and offers no way to mark it complete.
- Toggling a 4th step into Today's Focus is rejected with an inline message asking to complete or unfocus one first, and the panel keeps showing exactly the existing 3; unfocusing one then allows a different step to be focused.
- The Today's Focus panel clears stale selections whenever the stored focus-date differs from the current date, without altering the underlying steps' complete/incomplete state.
- With zero goals the overview shows Set your first goal to start building a path together with a + New Goal call to action; a goal with zero milestones shows Add your first milestone to build this path in place of the roadmap.
- Double-submitting any create form (rapid repeated activation of its submit control) creates exactly one record: the relevant count increases by one and one new item appears.
- Invalid or extreme input (blank required titles, out-of-range dates, absurdly long text) is rejected with a specific inline message naming the field and leaves the last valid state untouched.
- On the live activity stream, delivering the same event twice changes the applied-event ledger only once, and delivering events out of order settles the ledger into the same final state as in-order delivery.
</edge_cases>

<visual_design>
- Calm productivity palette: teal #2b6f6e primary for path lines and primary buttons, warm gold #c98a3d accent for the active milestone highlight, off-white #f6f5f0 app background, white #ffffff card and panel surfaces, green #3f9d6b for completed milestones and steps, amber #d9a441 for the Needs Attention badge, red #c1483f for delete confirmations, near-black #232823 primary text, muted #6b7268 secondary text.
- Goal and milestone titles use Fraunces, Georgia, serif from 1.6rem for the goal title down to about 1.1rem for milestone titles at weight 600; body text and UI chrome use Inter, system-ui, sans-serif at about 0.95rem weight 400; target dates use SFMono-Regular, monospace at about 0.75rem.
- Base spacing unit is 4px. Milestone nodes are fully rounded circles. Goal cards and step rows use 8px rounded corners. Form fields use 6px rounded corners.
- Primary buttons (+ New Goal, + Add Milestone, Mark Goal Complete) use the teal primary background, white text, 6px rounded corners, a subtle small shadow, and no border. Secondary buttons (reorder arrows, Focus Today toggle) use a transparent or white surface, primary-text color, a 1px muted-gray border, and 6px rounded corners. Delete controls use the red error color for their text.
- Buttons, form fields, badges, progress bars, and inline alerts share one consistent component language across all views, restyled to this palette rather than left in any default library theme.
- Icons come from a single consistent icon set used across the header, buttons, badges, and stream controls; no mixed icon styles and no emoji standing in for icons.
- The milestone path is built entirely from divs and borders — nodes as bordered circles, connectors as thin bars, dashed styling for upcoming milestones — with no charting or diagramming library and no SVG path element.
- Node fill and connector state (solid versus dashed) accurately reflect completion at all times and stay consistent between the overview progress bar and the detail path.
- Delete confirmations and the Today's Focus limit message render as inline styled UI, never as a browser alert or confirm dialog.
- The layout is a single / page; the goals overview, a goal's detail path view, and the Completed Goals section are views within that page, not separate routes.
</visual_design>

<motion>
- Completing a milestone's final step animates its node filling in as the node transitions to the completed solid state.
- Navigating between the overview and a goal's detail view transitions smoothly rather than cutting abruptly.
- Adding a goal card, milestone, or step animates the new item into place rather than snapping; deleting one animates it out; reordering a milestone slides it to its new position instead of teleporting.
- Inline feedback (validation messages, the Today's Focus limit message, delete confirms) appears with a brief transition rather than popping in instantly.
- Milestone nodes, checklist rows, and Focus Today toggles each show a visible hover state and a visible keyboard focus outline.
- The completion progress bar animates its fill width as steps toggle.
- With prefers-reduced-motion set, animations are removed or reduced to near-instant while every state change still lands correctly.
</motion>

<responsiveness>
- At about 375px wide the roadmap switches from a horizontal to a vertical stacked path with no horizontal scrolling, and the Today's Focus panel moves below the path rather than beside it.
- No content clips or overflows the viewport at 375px width; all controls remain reachable and tappable.
- At desktop widths of 1024px and above the detail view shows the milestone path and the Today's Focus panel side by side.
</responsiveness>

<accessibility>
- Every interactive control (buttons, checkboxes, reorder arrows, Focus Today toggles, stream controls) is reachable and operable with the keyboard alone, with a visible focus indicator.
- Form fields carry visible labels, and inline validation messages are rendered in the DOM adjacent to the field they describe.
- Checked and unchecked step states, disabled reorder controls, and the read-only completed path are distinguishable without relying on color alone.
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load.
- No console errors or warnings appear during a full exercise of the app: creating, editing, reordering, focusing, completing, deleting, and driving the live stream controls.
- The UI stays responsive under rapid repeated input with no hangs, blank screens, or dropped interactions.
</performance>

<writing>
- Headings, buttons, and badges use one consistent capitalization convention throughout the app.
- Action labels are specific (+ New Goal, + Add Milestone, Mark Goal Complete, Focus Today) rather than generic labels like OK or Go.
- Error and limit messages name the problem and the fix; empty states explain what belongs there and how to add it; no placeholder or lorem text appears anywhere in the shipped UI.
</writing>

<requirements>
- Framework and state: build the app with Qwik components and resumable event handlers, and hold all shared app state (goals, milestones, steps, active view, active goal, Today's Focus selections with their focus-date, completed-goals visibility, and the live-stream ledger) in Qwik stores as the single source of truth; every view, count, badge, and progress bar derives from that one store, and a change made in one view echoes in every other view without a reload. Target Node 20. This is a frontend-only client-rendered Vite SPA: no backend, no server, no database, no API calls, and no authentication.
- Styling: Tailwind CSS 4.3.2 (pinned) with design tokens in @theme, plus DaisyUI as the single component library for buttons, cards, badges, form fields, checkboxes, progress bars, and inline alerts, restyled to the task palette. Do not hand-roll components DaisyUI provides.
- Library allowlist: @builder.io/qwik 1.20.0, tailwindcss 4.3.2 with @tailwindcss/vite, daisyui, @formkit/auto-animate, @modular-forms/qwik with valibot, @iconify/tailwind4 for icons, vite 7.3.6, and http-server for serving the build. AutoAnimate is allowed for animation; no other animation libraries. Iconify CSS icons only — one icon set, no raw copy-pasted SVGs. All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon. Do not add charting or diagramming libraries; the milestone path must be built from divs and borders only.
- Forms contract: every form (goal create and edit, milestone add, step add and edit) is driven by the form library with a Valibot schema defining the validation rules; the form surfaces inline per-field errors before submit and keeps the submit control disabled while required fields are invalid.
- Persistence contract: persist all committed state to localStorage so a full page refresh restores the exact state. Goals, their milestones and action steps, every step's complete/incomplete state, Today's Focus selections together with their stored focus-date, and the Completed Goals list must all survive a refresh and be restored exactly. Deleting a goal, milestone, or step must remove it permanently so a later refresh does not revive it. Guard every localStorage read and write in try/catch and fall back to sensible defaults so a restricted-storage environment never crashes the app.
- Progress and status rules are exact and observable: goal completion percentage is completed steps divided by total steps aggregated across all milestones (50% at 2 of 4, 75% at 3 of 4); a milestone auto-completes the instant its last step is checked and reverts if a step is unchecked; a zero-step milestone shows Add a step to make progress and cannot be completed; Today's Focus caps at 3 with an inline message on a 4th attempt and clears stale selections when the stored focus-date is not the current date; Needs Attention appears when a goal has an incomplete milestone whose most recent step-completion or creation date is more than 7 days ago; Mark Goal Complete appears only at 100% and moves the goal to the read-only Completed Goals section with a recorded date.
- Reorder controls are disabled once the milestone or any earlier milestone is complete, with an inline note explaining why; because reordering is driven by up/down buttons rather than drag gestures, it remains available.
- Advanced interaction depth: in one uninterrupted session a user can create, edit, organize, and remove goals, milestones, and steps across the overview and detail views, exercise domain state (completion, focus, stalled detection, goal completion), and reload between stages to restore the exact committed state without reviving deleted data. The primary collection controls must withstand 25 rapid deterministic repetitions with an exact final count, responsive controls, and no blank screen, uncaught error, or sustained freeze. Invalid or extreme input is rejected with specific visible feedback without damaging the last valid state, and duplicate submissions are idempotent rather than creating duplicate records.
- Deterministic live-event scenario: provide visible Start, Pause, Reconnect, and Deliver Out of Order controls for a local event stream that updates the workflow view. Events carry stable IDs and logical timestamps; duplicates are ignored, out-of-order delivery resolves deterministically by logical time, and reconnect catches up without double-applying updates. The stream is local and deterministic with no network access.
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
- Entity: goal; milestone; step
- Entity operations: create; select; update; delete; toggle; reorder
- Destinations: goals-overview; goal-detail; completed-goals
- Session operations: start; pause; resume; connect; disconnect
- Demos: deliver-out-of-order

Mechanics exclusions:
- Milestone-complete node fill-in animation stays Playwright-observed
- Overview-detail view transition stays Playwright-observed
- Narrow-viewport horizontal-vertical path reflow stays Playwright-observed
- Hover/focus washes on nodes, rows, and toggles stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
