<summary>
Build LoopDaily, a frontend-only habit-tracking app using React, Jotai, and Tailwind CSS, with all data persisted to localStorage and recovered gracefully from corrupted persisted data.
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
- A New Habit form collects a required name, an icon chosen from a fixed emoji palette, and a target of either Once a day or a numeric daily count (e.g. 8); submitting with a blank name is blocked and explained with a visible inline error or shake/hint, not merely a silently disabled button, and no phantom habit is added
- A Once a day habit shows a single one-tap complete control: tapping it marks today done with a distinct filled/checked treatment; tapping it again the same day undoes the completion
- A numeric-target habit shows a plus-one and minus-one stepper plus an n/target fraction (e.g. 3/8) that updates immediately with each tap; the habit reaches a distinct complete treatment only once the day's count reaches the target, and reverts out of that treatment the moment a minus-one tap drops the count below target
- Each habit shows a flame icon whose treatment changes at three streak milestones: plain below a 7-day streak, bright at 7 to 29 days, and a distinct gold treatment at 30 or more days; the flame updates its treatment the instant a streak crosses 7 or 30 days, without a page refresh
- The user can create named categories (e.g. Health, Work) and assign each habit to one category via a dropdown on the New Habit form; a category filter bar shows All plus one chip per category, and selecting a chip narrows the visible habit list to that category while the active chip stays visibly highlighted; selecting All restores every habit
- Each habit row shows a compact 7-day grid covering today and the six previous days; each cell visually distinguishes done, missed, and not-yet-elapsed days, and today's cell is visually marked
- A Heatmap view, opened per habit, renders a full calendar month as a grid of day cells; each cell's shading intensity reflects that day's completion — fully done, partially done for stepper habits, or not done — and future days in the month render as a distinct not-yet-elapsed shade
- Each habit has an optional free-text Remind me at field (e.g. 7:00 AM) shown as a label on its card; it is a static self-reminder note, not a real system notification, and it persists across refresh
- Habits can be dragged by a handle into a new order; the new order persists across reloads and is not disturbed by completing a check-in
- A Pause control excludes a habit from streak calculations and from the main habit list while paused, without deleting its history; a Resume control returns it to the main list with its prior streak value intact
- A Stats view shows, across all habits: the number of active current streaks, the single longest streak ever recorded across any habit, and total completions in the current calendar month; with no habits created yet it shows its own short message instead of blank numbers
- An Export as JSON control downloads all habits, categories, and completion history as a JSON file via a Blob and an anchor download attribute; an Import control reads a previously exported JSON file via FileReader and, after an explicit confirmation step that warns the current data will be replaced, replaces the current data with the imported data
- All habits, categories, completion history, category assignments, reminder notes, habit order, and the active category filter survive a full page refresh, restored purely from localStorage
- If the persisted data cannot be parsed or fails validation, the app recovers to the last valid snapshot instead of showing a blank screen, and shows a specific recovery notice in a live region with role alert; Retry re-applies the last valid snapshot and Reset clears to a defined empty state, and both controls produce a visible, deterministic result
- A visible control literally labeled Load Malformed Sample exercises this same guarded recovery path on demand: it feeds a deliberately malformed data payload through the same import logic used for real files, skips or repairs what it can, and reports the outcome in the same role alert live region
- All streak, weekly-grid, and heatmap calculations are computed from the real device date; there is no manual advance-day control anywhere in the app
</core_features>

<visual_design>
- Heading font is Manrope with fallback Segoe UI, system-ui, -apple-system, sans-serif, used for habit names and view titles; top-level headings render at roughly 28px-equivalent size and section headings at roughly 20px
- Body font is Manrope with the same fallback stack, at a 16px base size for list text, counts, and helper copy
- Canvas background computed color is #F4F7F6; habit card surface computed background is #FFFFFF; primary text ink is #1B2430 and muted secondary text is #64748B
- Primary accent color is #0F9D74, used for primary buttons, the active category filter, and the done fill on completion controls; secondary accent color is #FFB020, used for milestone flame accents
- Spacing follows a 4px base unit: padding and gaps between elements are multiples of 4px
- Cards, inputs, and buttons render with 8px border-radius consistently
- The primary button has a solid #0F9D74 background, white text, 8px border-radius, and no shadow
- The secondary button is transparent with a 1px solid #64748B border, #1B2430 text, 8px border-radius, and no shadow
- The three flame treatments — plain, bright, gold — are visually distinguishable from each other as a distinct graphic element, never a placeholder or absent icon
- The active category filter chip is visually highlighted distinctly from the inactive chips
- Heatmap cells visibly differ in shading intensity between fully done, partially done, and not-done days in the same month
- A paused habit renders with a visibly muted or dimmed treatment (for example reduced opacity or desaturation) distinct from active habits, wherever it appears
- Buttons, category filter chips, and habit rows show a visible hover state; keyboard Tab focus shows a clearly visible focus indicator on every interactive control
- Before any habit exists, the main list shows a friendly empty-state message inviting the user to create the first habit rather than a blank area; the Stats view with no habits shows its own short message rather than blank numbers
- At roughly 375px viewport width the app renders with no horizontal scrolling; habit rows stack in a single column and the New Habit form remains fully usable
- The recovery notice, when active, is visually distinct from ordinary toasts or banners, remains legible at narrow width, and its Retry and Reset controls are visually distinguishable from ordinary actions
</visual_design>

<motion>
- Creating a habit, completing a check-in, exporting data, and importing data each produce a transient visible confirmation (a toast or equivalent) immediately after the action
- Buttons ease their background and border on hover and show a brief press effect on click; category filter chips and habit rows take a visible hover wash
- A numeric-target habit's stepper progress bar and fraction animate their update immediately on each tap rather than jumping with no transition
- Submitting the New Habit form with a blank name triggers a visible shake or equivalent motion cue alongside the inline error text
- The milestone flame's treatment change on crossing a 7-day or 30-day threshold is driven by the real check-in/stepper action, not a hidden shortcut, and is immediately visible after that action completes
- Habit reorder via the drag handle shows a lift/drag affordance while dragging and settles into its new position with a smooth transition on drop
- The recovery banner and its Retry/Reset controls appear and are announced through the role alert live region as soon as a recovery condition is detected, without requiring focus to move to them
</motion>

<requirements>
Build with React 19 functional components, Jotai atoms for shared app state, and Tailwind CSS with the pre-installed Vite plugin. Use localStorage for persistence, guarded so that malformed or unreadable stored data never crashes the production build.
Persistence and recovery contract (the app's core difficulty — spec exactly):
- All habits, categories, streak/completion history, habit order, category assignments, reminder notes, and the active category filter survive a full page refresh, restored purely from localStorage.
- When persisted data cannot be parsed or fails structural validation, the app recovers to the last valid snapshot it has, without ever rendering a blank screen, and shows a specific recovery notice in a live region with role alert; a Retry control and a Reset control are both present with visible, deterministic effects — Retry re-applies the last valid snapshot (or reports none is available), Reset clears to the app's defined empty state.
- A control literally labeled Load Malformed Sample exercises this same guarded import path on demand from the Data view: it runs a deliberately malformed payload through the same validation and recovery logic used for a real imported file, and reports the outcome in the same role alert live region.
- Import replaces the current habits and categories only after an explicit confirmation step that warns the user their current data will be replaced; Export downloads the current data as a JSON file via a Blob and an anchor download attribute. Import and Export make no network requests.
All streak and calendar behavior (weekly grid, heatmap, stats) must be computed from the real device date; never add a manual advance-day control.
No backend, no authentication, and no routes other than the app's single root path are required.
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
- form-workflow-v1
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
- Destinations: habits; stats; import; heatmap
- Filters: category
- Entity: habit
- Entity operations: update; delete; toggle; quantity
- Entity fields: name; reminder; paused
- Secondary Entity: category
- Secondary Entity Operations: create; delete
- Form fields: name; icon; target-type; target-count; category; reminder
- Form operations: validate; submit; cancel
- Artifact operations: import; export
- Import modes: file; malformed-sample
- Export formats: json

Mechanics exclusions:
- Habit drag-handle reorder stays Playwright-observed (no reorder tool exposed)
- File-picker Import stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp only drives Load Malformed Sample and its confirm dialog
- Toast/hover/focus timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
