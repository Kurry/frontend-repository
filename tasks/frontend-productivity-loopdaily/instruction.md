<summary>
Build LoopDaily, a frontend-only habit-tracking app using React, Jotai, Tailwind CSS 4.3.2, and shadcn/ui. The app produces the operator's portable Workspace JSON artifact — a downloadable document compiled live from habits, categories, completion history, and the active category filter — conforming to the same API-shaped field contracts as create forms, with Import that round-trips that document. All data persists to localStorage and recovers gracefully from corrupted persisted data.
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
Feature: Habit field contract (API-shaped HabitUpsert) —
- Creating a habit submits exactly a HabitUpsert payload; the record a successful create produces IS the would-be habit API request body; edit fields, Export as JSON, and Import share this same habit object shape. HabitUpsert field contract (all keys required unless marked optional; example values illustrative only): name (required string after trim, 1 to 80 characters), icon (required string that is exactly one emoji from the fixed emoji palette), targetType (required closed enum string, exactly one of once or count), targetCount (required integer from 1 through 100 inclusive; when targetType is once, targetCount must be exactly 1), categoryId (string id of an existing category, or null when unassigned), reminder (optional string after trim, at most 40 characters; empty string allowed). Cross-field rules: once forces targetCount to 1; count requires a chosen integer in 1–100. App-assigned fields present on the stored record and in export: id (non-empty string), paused (boolean), completions (object mapping YYYY-MM-DD date strings to non-negative integers), order (non-negative integer list position), createdAt (ISO-8601 datetime string)
- A New Habit form collects name, icon from the fixed emoji palette, targetType (Once a day or Daily count), targetCount when Daily count is chosen, a category dropdown, and an optional Remind me at field; each invalid field under the HabitUpsert field contract shows an inline error message naming that field before submit, and no phantom habit is added on an invalid submit
- The New Habit form includes a category dropdown so each habit is assigned to one category at creation time when a category is chosen
Feature: Category field contract (API-shaped CategoryUpsert) —
- Creating a named category submits exactly a CategoryUpsert payload; the record a successful create produces IS the would-be category API request body. CategoryUpsert field contract (all keys required unless marked optional; example values illustrative only): name (required string after trim, 1 to 40 characters). App-assigned fields present on the stored record and in export: id (non-empty string). Blank, whitespace-only, or over-40-character names show an inline error naming the name field and add no category
Feature: Check-ins —
- A Once a day habit shows a single one-tap complete control: tapping it marks today done with a distinct filled/checked treatment; tapping it again the same day undoes the completion
- A numeric-target habit shows a plus-one and minus-one stepper plus an n/target fraction (e.g. 3/8) that updates immediately with each tap; the habit reaches a distinct complete treatment only once the day's count reaches the target, and reverts out of that treatment the moment a minus-one tap drops the count below target
- Each habit shows a flame icon whose treatment changes at three streak milestones: plain below a 7-day streak, bright at 7 to 29 days, and a distinct gold treatment at 30 or more days; the flame updates its treatment the instant a streak crosses 7 or 30 days, without a page refresh
Feature: Categories and filtering —
- The user can create named categories (e.g. Health, Work); a category filter bar shows All plus one chip per category, and selecting a chip narrows the visible habit list to that category while the active chip stays visibly highlighted; selecting All restores every habit
Feature: History views —
- Each habit row shows a compact 7-day grid covering today and the six previous days; each cell visually distinguishes done, missed, and not-yet-elapsed days, and today's cell is visually marked
- A Heatmap view, opened per habit, renders a full calendar month as a grid of day cells; each cell's shading intensity reflects that day's completion — fully done, partially done for stepper habits, or not done — and future days in the month render as a distinct not-yet-elapsed shade
- Hovering a day cell in the Heatmap view shows a tooltip naming that date and its completion state
Feature: Reminders, ordering, pause —
- Each habit has an optional free-text Remind me at field (e.g. 7:00 AM) shown as a label on its card; it is a static self-reminder note, not a real system notification, and it persists across refresh
- Habits can be dragged by a handle into a new order; the new order persists across reloads and is not disturbed by completing a check-in
- A Pause control excludes a habit from streak calculations and from the main habit list while paused, without deleting its history; a Resume control returns it to the main list with its prior streak value intact
Feature: Stats —
- A Stats view shows, across all habits: the number of active current streaks, the single longest streak ever recorded across any habit, and total completions in the current calendar month
- The Stats view renders a completions trend chart covering recent days; recording or undoing a check-in changes the plotted values for today the next time the chart is viewed, without a reload
Feature: Workspace JSON export and import (useful end state; API-shaped Workspace document) —
- An Export as JSON control downloads a single Workspace JSON document compiled live from the store via a Blob and an anchor download attribute. Workspace JSON field contract (Copy preview when present, Download, and Import all conform; field names and enum values are visible in the downloaded JSON text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly loopdaily.workspace.v1), exportedAt (required ISO-8601 datetime string), habits (required array of habit objects each matching the HabitUpsert field contract plus the app-assigned id, paused, completions, order, and createdAt fields, in list order), categories (required array of category objects each matching the CategoryUpsert field contract plus id, in creation order), activeCategoryFilter (required string category id matching an existing category, or null when All is selected). Cross-field rules: every habit.categoryId that is not null must equal an id present in the categories array; every completions key must be a YYYY-MM-DD date string; targetType and targetCount obey the HabitUpsert cross-field rules. After creating a habit, assigning a category, recording a check-in, or changing the active filter, a fresh Export as JSON contains those session mutations under the field-contract keys — an export that omits session work is incorrect
- An Import control reads a previously exported Workspace JSON file via FileReader and, after an explicit confirmation step that warns the current data will be replaced, replaces the current data only when the document passes the Workspace JSON field contract; on success the habit list, category chips, check-in history, Stats numbers, and active filter match the imported document without a reload
- Import rejection: malformed JSON or a payload that violates the Workspace JSON field contract (schemaVersion not exactly loopdaily.workspace.v1, missing habits or categories or schemaVersion or exportedAt or activeCategoryFilter, targetType outside once|count, targetCount outside 1–100 or mismatched with once, icon outside the fixed palette, name over 80 characters, category name over 40 characters, completion keys not YYYY-MM-DD, or a habit.categoryId that does not resolve to an imported category) leaves habits, categories, Stats, and history unchanged and shows visible validation naming the offending field
- A visible control literally labeled Load Malformed Sample exercises a soft-recovery drill distinct from Import's strict field-contract gate: it feeds a deliberately malformed data payload through guarded recovery logic, skips or repairs what it can, and reports the outcome in a live region with role alert without blanking the app
Feature: Date integrity —
- All streak, weekly-grid, heatmap, and trend calculations are computed from the real device date; there is no manual advance-day control anywhere in the app
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- After submitting a valid New Habit form, the habit list count increases by exactly one, the new habit appears under its assigned category when that category's chip is selected, and after a full page reload the habit is still present with the same name, icon, target, and category
- Completing a Once a day habit fills today's cell in that habit's 7-day grid, updates its streak and flame treatment, increases the Stats view's total completions for the current month by one, and updates the trend chart's value for today — all without a reload; a full page reload then restores the identical completed state
- Tapping plus-one on a numeric-target habit until the count reaches the target switches the card to its complete treatment, marks today done in the 7-day grid and the Heatmap view, and increments the Stats monthly completions; a minus-one tap that drops the count below target reverts the card, the grids, and the Stats numbers together
- Pausing a habit removes it from the main list and from the Stats active-streak count without deleting its history; resuming returns it with its prior streak value intact, and both the paused state and the restored state survive a full page reload
- Selecting a category chip narrows the habit list to that category, and the active filter itself survives a full page refresh, restored from localStorage along with all habits, categories, completion history, reminder notes, and habit order
- Dragging a habit to a new position reorders the list, the new order is unchanged after completing a check-in on another habit, and a full page reload shows the same order
- Mutation-to-export: after creating a habit with a distinctive name, assigning a category, recording a check-in, and selecting that category's chip, Export as JSON yields Workspace JSON with schemaVersion exactly loopdaily.workspace.v1, that habit's name, categoryId, today's completion entry, and activeCategoryFilter matching the selected category
- Artifact round-trip: Export as JSON then Import of that same Workspace JSON after confirmation reconstructs the same visible habits, category chips, check-in state, active filter, and Stats numbers
</user_flows>

<edge_cases>
- Submitting the New Habit form with a blank name is blocked and explained with a visible inline error naming the name field plus a shake or equivalent motion cue, not merely a silently disabled button, and no habit is added
- Double-activating the New Habit submit control creates exactly one habit: the list count increases by exactly one
- A minus-one tap when a stepper habit's count for today is already zero leaves the count at zero rather than going negative
- Before any habit exists, the main list shows a friendly empty-state message inviting the user to create the first habit rather than a blank area
- The Stats view with no habits created yet shows its own short message instead of blank numbers
- If the persisted data cannot be parsed or fails validation, the app recovers to the last valid snapshot instead of showing a blank screen, and shows a specific recovery notice in a live region with role alert; Retry re-applies the last valid snapshot and Reset clears to a defined empty state, and both controls produce a visible, deterministic result
- Importing a file only replaces the current data after an explicit confirmation step that warns the current data will be replaced; cancelling the confirmation leaves the current data untouched
- Importing parseable JSON that fails the Workspace JSON field contract — wrong schemaVersion, missing required keys, targetType outside once|count, unresolved categoryId, illegal completions keys, or over-length name — leaves habits, categories, Stats, and history unchanged and shows validation naming the offending field
- Submitting New Habit or category create with values outside their field contracts (blank or over-80-character habit name, targetCount outside 1–100 or once with targetCount not 1, reminder over 40 characters, blank or over-40-character category name) shows inline errors naming the offending field and adds nothing
- Load Malformed Sample runs its deliberately malformed payload through soft-recovery logic distinct from Import's strict reject gate and reports what was skipped or repaired in the role alert live region, without crashing or blanking the app
</edge_cases>

<visual_design>
- Heading font is Manrope with fallback Segoe UI, system-ui, -apple-system, sans-serif, used for habit names and view titles; top-level headings render at roughly 28px-equivalent size and section headings at roughly 20px
- Body font is Manrope with the same fallback stack, at a 16px base size for list text, counts, and helper copy
- Canvas background computed color is #F4F7F6; habit card surface computed background is #FFFFFF; primary text ink is #1B2430 and muted secondary text is #64748B
- Primary accent color is #0F9D74, used for primary buttons, the active category filter, and the done fill on completion controls; secondary accent color is #FFB020, used for milestone flame accents
- Spacing follows a 4px base unit: padding and gaps between elements are multiples of 4px
- Cards, inputs, and buttons render with 8px border-radius consistently
- The primary button has a solid #0F9D74 background, white text, 8px border-radius, and no shadow
- The secondary button is transparent with a 1px solid #64748B border, #1B2430 text, 8px border-radius, and no shadow
- Icons across the app chrome come from one consistent icon set used at consistent sizes, alongside the fixed emoji palette used for habit icons
- The three flame treatments — plain, bright, gold — are visually distinguishable from each other as a distinct graphic element, never a placeholder or absent icon
- The active category filter chip is visually highlighted distinctly from the inactive chips
- Heatmap cells visibly differ in shading intensity between fully done, partially done, and not-done days in the same month
- A paused habit renders with a visibly muted or dimmed treatment (for example reduced opacity or desaturation) distinct from active habits, wherever it appears
- Buttons, category filter chips, and habit rows show a visible hover state
- The recovery notice, when active, is visually distinct from ordinary toasts or banners, and its Retry and Reset controls are visually distinguishable from ordinary actions
</visual_design>

<motion>
- Creating a habit, completing a check-in, exporting data, and importing data each produce a transient visible confirmation (a toast or equivalent) immediately after the action; toasts slide or fade in and auto-dismiss smoothly
- A newly created habit animates into the list rather than appearing instantly, and a paused habit animates out of the main list; remaining rows settle into place with a smooth transition
- Buttons ease their background and border on hover and show a brief press effect on click; category filter chips and habit rows take a visible hover wash
- A numeric-target habit's stepper progress bar and fraction animate their update immediately on each tap rather than jumping with no transition
- Submitting the New Habit form with a blank name triggers a visible shake or equivalent motion cue alongside the inline error text
- The milestone flame's treatment change on crossing a 7-day or 30-day threshold is driven by the real check-in/stepper action, not a hidden shortcut, and is immediately visible after that action completes
- Crossing a 7-day or 30-day streak milestone through a real check-in triggers a brief celebratory confetti-style particle burst near the habit card; the effect fires only on that milestone action, never ambiently
- Habit reorder via the drag handle shows a lift/drag affordance while dragging and settles into its new position with a smooth transition on drop
- The recovery banner and its Retry/Reset controls appear as soon as a recovery condition is detected, without requiring focus to move to them
- With prefers-reduced-motion set, decorative animations and the celebration effect are removed or reduced and state changes still apply instantly and correctly
</motion>

<responsiveness>
- At roughly 375px viewport width the app renders with no horizontal scrolling; habit rows stack in a single column and the New Habit form remains fully usable
- At narrow width the Heatmap month grid and the 7-day grid remain fully visible without clipping, and the Stats numbers and trend chart fit the viewport
- The recovery notice remains legible at narrow width with its Retry and Reset controls reachable
</responsiveness>

<accessibility>
- Every interactive control — buttons, chips, steppers, the drag handle, form fields, and the import/export controls — is reachable with keyboard Tab and shows a clearly visible focus indicator
- Inline form validation errors are rendered adjacent to the field they name and are programmatically associated with that field
- The recovery notice and the Load Malformed Sample outcome are announced through the role alert live region without requiring focus to move to them
- Dialogs opened by the app (such as the import confirmation) trap focus while open and return focus to the invoking control on close
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app, including the malformed-data recovery path
- Rapid repeated stepper taps stay responsive with no hangs, and every tap is reflected in the fraction and progress bar
</performance>

<writing>
- Headings, buttons, and chips use one consistent capitalization convention throughout the app
- Action labels are specific verbs or verb phrases such as Add habit, Export as JSON, and Load Malformed Sample rather than generic labels
- Error messages and the recovery notice name the problem and the fix; field-contract validation errors name the offending field and the rule (for example name must be non-empty, targetCount must be 1–100, schemaVersion must be loopdaily.workspace.v1); empty states explain what belongs there and how to add it; no placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
Build with React 19 functional components, Jotai atoms for all shared app state (habits, categories, completion history, habit order, active category filter, and UI chrome — views derive from this one store, never a second disconnected copy), and Tailwind CSS 4.3.2 (pinned) with design tokens in @theme. Use shadcn/ui components for the app's dialogs, dropdowns/selects, tabs, and toasts. Motion for React and AutoAnimate are allowed for animation, and canvas-confetti for the streak-milestone celebration; no other animation libraries. Recharts renders the heatmap and completions trend charts. Phosphor icons (@phosphor-icons/react) only for app chrome icons; the habit icon picker keeps its fixed emoji palette. All forms — the New Habit form, category creation, and Import when presented as a form — are driven by React Hook Form with a Zod schema defining the validation rules, surfacing inline per-field errors before submit. Those schemas are API-shaped and mirror the HabitUpsert, CategoryUpsert, and Workspace JSON field contracts in Feature sections: the record a successful create produces IS that request-body payload, and Export as JSON plus a successful Import conform to the same field names, enums, bounds, and cross-field rules. All libraries are installed via npm and bundled locally; no CDN imports.
Use localStorage for persistence, guarded so that malformed or unreadable stored data never crashes the production build.
Persistence and recovery contract (the app's core difficulty — spec exactly):
- All habits, categories, streak/completion history, habit order, category assignments, reminder notes, and the active category filter survive a full page refresh, restored purely from localStorage.
- When persisted data cannot be parsed or fails structural validation, the app recovers to the last valid snapshot it has, without ever rendering a blank screen, and shows a specific recovery notice in a live region with role alert; a Retry control and a Reset control are both present with visible, deterministic effects — Retry re-applies the last valid snapshot (or reports none is available), Reset clears to the app's defined empty state.
- A control literally labeled Load Malformed Sample exercises soft-recovery on demand from the Data view: it runs a deliberately malformed payload through guarded skip-or-repair logic distinct from Import's strict Workspace JSON field-contract gate, and reports the outcome in the same role alert live region.
- Import replaces the current habits and categories only after an explicit confirmation step that warns the user their current data will be replaced, and only when the payload passes the Workspace JSON field contract; Export as JSON downloads the current Workspace JSON document via a Blob and an anchor download attribute. Import and Export make no network requests.
- The useful end state is the portable Workspace JSON document: Export as JSON must contain the session's actual mutations under the field-contract keys with schemaVersion exactly loopdaily.workspace.v1, Import of a valid document reconstructs the same visible state, and the store remains MCP-queryable through the artifact-transfer and entity bindings.
All streak and calendar behavior (weekly grid, heatmap, trend chart, stats) must be computed from the real device date; never add a manual advance-day control.
No backend, no authentication, and no routes other than the app's single root path are required.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
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
