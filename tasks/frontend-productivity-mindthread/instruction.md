<summary>
Build a MindThread thought-capture and idea-threading app using Vue 3 Single-File Components, Pinia, Tailwind CSS 4.3.2, and Reka UI.
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
Feature: Capture and inbox —
- On first load with empty storage the app opens on the Home view showing a capture bar titled Capture a spark, an Unthreaded inbox whose empty state reads Capture your first spark, and a threads column whose empty state reads No threads yet
- Typing text into the capture textarea and pressing Enter, or selecting Add Spark, creates a timestamped spark that appears at the top of the Unthreaded inbox with a Captured timestamp
- The inbox header shows a live count such as 3 sparks; newly captured sparks sort most-recent-first
- Each unthreaded spark can be edited in place via Edit (updating its text everywhere) and removed via Delete (which also removes its reflections)
Feature: Threads —
- Selecting + New Thread with a non-empty title creates a thread card showing the title, a spark count such as 0 sparks, and an updated Xh ago relative time
- Each unthreaded spark has an Assign to Thread selector listing every existing thread plus a New Thread… option; choosing a thread moves the spark out of the inbox into that thread, and choosing New Thread… creates a thread named from the spark text (truncated to 40 characters with an ellipsis) and assigns the spark to it
- Opening a thread shows a thread-detail view with a Back control, the title, a status badge, a live stats line reading N sparks · N reflections · N days active, and a Timeline listing the thread's sparks in chronological (oldest-first) order each with a Captured timestamp
- The thread-detail header stats update live: total spark count, total reflection count, and days active computed as the inclusive calendar-day span between the thread's first and most recent spark
- A thread's status is set through an Active / Dormant / Resolved segmented control in the detail header; the chosen status renders as a colored badge that reads the same status and color on the thread card, the detail header, the Today digest, the Archived screen, and search results
- Merge Into… on a thread opens a dialog to pick a different target thread; it requires a two-step confirm (Continue then Confirm Merge) before it moves all of the source thread's sparks and reflections into the target in chronological order and removes the now-empty source thread
- Each thread has a Pin toggle; pinned threads render in a separate Pinned section above the regular thread list, ordered most-recently-pinned first, and Unpin returns a thread to the regular list
- An Archive control moves a thread off the Home list into a separate Archived view reachable from the top nav, where each archived thread keeps its status badge and stats and an Unarchive control restores it to Home
Feature: Reflections —
- Each spark in the timeline has an Add Reflection control that opens a rich-text reflection editor; saving appends a dated reflection note beneath that spark, visually indented and tinted differently from the original spark
- The reflection editor shows a formatting toolbar: applying bold to selected text renders it bold in the editor and in the saved reflection, activating bold again on the same selection removes it, and a bulleted-list control renders the selected lines as a list
- While editing a reflection, an undo control (or the standard undo keyboard shortcut) reverses the most recent edit, and redo restores it
Feature: Tags, Today, and search —
- Sparks carry zero or more free-text tags added through a Tags input reading Add Tag; a Filter by tag panel lists every tag in use as a chip with a live count such as #idea (2), and selecting one or more chips filters the visible sparks and threads down to matches, with a Clear Filters control to reset
- A Today view groups every spark captured on the current calendar day by its thread, with an Unthreaded group for inbox items, and shows No sparks captured yet today when none exist
- A Search field filters across all spark text, reflection text, and thread titles at once; matching substrings are highlighted, results are grouped as Matching threads / Matching sparks / Matching reflections, and a no-results message appears when nothing matches
Feature: Forms and large lists —
- Every form (the capture bar, the thread-title form, the tag input, and the reflection editor) validates its input against a schema before anything is recorded: invalid input shows an inline error message naming the field, adds no record, and leaves existing data untouched
- A Virtualized items panel with a Load 10,000 Items control generates a deterministic 10,000-row sample collection and renders only the visible window plus a small overscan buffer; a Rendered item count label reports how many rows are in the DOM (far fewer than 10,000), a Filter items field narrows the list live, and arrow-key navigation with Enter selection preserves focus, selection, and scroll position as rows enter and leave the DOM
</core_features>

<user_flows>
- After capturing a spark through the capture bar, the inbox count increases by exactly one, the new spark renders at the top of the inbox with its Captured timestamp, and switching to the Today view shows the same spark in the Unthreaded group without a reload
- Assigning that spark to a thread decreases the inbox count by one, increases that thread card's spark count by one, places the spark in the thread's Timeline in chronological position, and regroups it under that thread in the Today view without a reload
- Setting a thread's status through the segmented control immediately updates the status badge to the same wording and color on the thread card, the detail header, the Today digest, the Archived screen, and search results, all without a reload
- Adding a tag to a spark makes the matching chip appear in the Filter by tag panel with its live count increased by one; selecting that chip narrows the visible sparks and threads to matches, and Clear Filters restores the full lists exactly
- Merging one thread into another moves every spark and reflection into the target in chronological order, raises the target's spark count to the sum of both threads' counts, removes the source thread from the thread list and from search results, and updates the target's stats line immediately
- After any sequence of captures, edits, assignments, reflections, tags, status changes, pins, merges, and archives, a full page refresh restores the exact prior state: the same sparks, threads, reflections, tags, statuses, pin order, and archive contents render again
</user_flows>

<edge_cases>
- Submitting empty or whitespace-only text in the capture bar creates nothing and shows the inline message Enter a thought to add a spark; repeated rapid submission of empty input creates no records
- Submitting an empty thread title creates nothing and shows the inline message Enter a title to create a thread
- Saving a reflection with empty content is rejected with the message Enter some text to save the reflection and appends nothing
- Choosing New Thread… from a spark whose text exceeds 40 characters names the new thread from the first 40 characters followed by an ellipsis
- Deleting the last spark in the inbox restores the Capture your first spark empty state, and removing the last thread restores the No threads yet empty state
- A tag filter with zero matches shows No matching sparks rather than a blank panel; a search with zero matches shows its no-results message
- Cancelling the Merge Into… dialog at either confirm step leaves both threads untouched
- Invalid or extreme input is handled with specific visible feedback and without damaging the last valid state
</edge_cases>

<visual_design>
- Color tokens: primary indigo #4a5fc1 for thread accents and primary buttons; warm rose accent #e0708a for spark markers and highlights; app background cool off-white #f5f6fb; card and panel surface #ffffff; success green #359b6b for the Resolved badge; warning amber #d99a3d for the Dormant badge; error red #c4534a for destructive delete and merge confirmations; primary text #262a3d; secondary meta text #6b6f85 for timestamps, counts, and breadcrumbs
- The Active status badge uses the primary indigo, Dormant uses the warning amber, Resolved uses the success green, and each status uses that exact color everywhere it appears
- Typography: headings use a rounded sans-serif stack (Poppins, Segoe UI, Arial, sans-serif) ranging from 1.6rem thread titles down to 1.0rem inbox headers; body text and UI chrome use a sans-serif stack (Inter, Helvetica Neue, Arial, sans-serif) at 0.95rem; timestamps and tag chips use a monospace stack (JetBrains Mono, SFMono-Regular, monospace) at 0.72rem for a log-like feel
- Shape system: base spacing unit is 4px in multiples of 4; thread cards and the capture bar use rounded-xl 12px corners; status badges and tag chips are fully-rounded pills; dropdowns and search fields use rounded-md 6px; primary buttons use the primary background with white text, rounded-md, a subtle shadow, and no border; secondary buttons use a surface background, primary text, a 1px muted-gray border, and rounded-md
- The thread timeline visually distinguishes original sparks from appended reflections through indentation and a tinted primary-wash background so the evolution of a thread is easy to scan
- Bold text and bulleted lists inside saved reflections render with visibly heavier weight and real list markers, distinct from surrounding plain text
- Empty and no-match states: the Unthreaded inbox, the thread list, the thread timeline, the Today digest, and the Archived screen each show explanatory copy before any data exists, and a tag filter or search with zero matches shows an explicit no-matching-sparks message rather than a blank panel
</visual_design>

<motion>
- Every interactive control (nav tabs, Add Spark, + New Thread, Assign to Thread, Pin, the status segmented control, tag chips, Merge Into…, Archive, tag remove buttons) shows a visible hover state
- Buttons depress slightly on press and ease their background and border color on hover; secondary buttons wash to a light hover tint
- A newly captured spark animates into the top of the inbox rather than appearing instantly, a deleted spark animates out, and a spark leaving the inbox on assignment animates away instead of snapping
- Pinning or unpinning a thread animates the thread card to its new position in the list
- Assigning a spark, creating a thread, setting a status, pinning, merging, and archiving each surface a brief confirmation toast that slides in from the right and auto-dismisses
- The Merge Into… action opens a modal dialog with a brief enter transition and requires an explicit two-step confirm (Continue, then Confirm Merge) before it executes
- Thread cards and spark cards raise their shadow on hover; the active nav tab is filled with the primary color while inactive tabs take a hover wash
</motion>

<responsiveness>
- At roughly 375px wide the capture bar, thread cards, and timeline stay fully usable without horizontal scrolling; long spark text wraps rather than overflowing
- No content clips or overflows the viewport at any width between 375px and 1440px
</responsiveness>

<accessibility>
- Keyboard Tab reaches every interactive control (nav tabs, Add Spark, + New Thread, Assign to Thread, Pin, the status segmented control, tag chips, Merge Into…, Archive, tag remove buttons) and each shows a visible focus ring while focused
- The Merge Into… dialog uses role dialog, traps focus while open, closes on Escape, and returns focus to the control that opened it
- The Assign to Thread selector and the status segmented control are operable with the keyboard alone using arrow keys and Enter
- Inline validation messages render as visible text adjacent to their field, never as a color change alone
</accessibility>

<performance>
- The main capture workflow withstands at least 25 rapid consecutive submissions through the capture bar: the final spark count is exact, controls stay responsive, and the burst produces no blank screen, uncaught error, or freeze
- Scrolling the 10,000-item virtualized panel stays smooth with no blank gaps, and the rendered DOM row count stays far below 10,000 throughout
- No uncaught errors appear in the console during a full exercise of the app
</performance>

<writing>
- Empty states, inline errors, and headers use the exact copy this instruction specifies (Capture a spark, Capture your first spark, No threads yet, Enter a thought to add a spark, Enter a title to create a thread, Enter some text to save the reflection, No sparks captured yet today, No matching sparks)
- Buttons and headings use one consistent capitalization convention, and action labels are specific verbs such as Add Spark and Add Reflection rather than generic labels
- No placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
- Stack: Vue 3 Single-File Components with the Composition API, shared application state in Pinia stores, styling with Tailwind CSS 4.3.2 (pinned) with the design tokens defined in an @theme block. Client-rendered Vite SPA, no backend, no authentication, opens directly at /
- Component library: Reka UI primitives for the Merge Into… dialog, the Assign to Thread select, the status segmented control, tab navigation, and toasts; style them with Tailwind to the visual design above
- Rich text: the reflection editor is built on TipTap with bold, bulleted-list, and undo/redo support; the capture bar and thread-title inputs stay plain text inputs
- Forms: every form (capture bar, thread title, tag input, reflection save) validates through VeeValidate with a Zod schema; the schema defines the rules and inline per-field errors appear before any record is added
- Animation: @vueuse/motion and AutoAnimate allowed for animation; no other animation libraries
- Icons: Phosphor icons via @phosphor-icons/vue only; no raw pasted SVGs and no icon CDNs
- Virtualized list: @tanstack/vue-virtual drives the Virtualized items panel
- All libraries installed via npm and bundled locally; no CDN imports of any script, style, font, or icon
- Persistence: mirror all domain state (sparks, threads, reflections, tags, statuses, pin state, archive state) to localStorage and restore it on load so a full page refresh returns the exact prior state; guard every read and write in try/catch and fall back to sensible defaults so the production build never crashes on storage access
- All shared application state (the spark and thread collections, reflections, tags, active view, filters, search text, and toast state) lives in the Pinia stores; every view derives from that single source
- Creating a valid spark increases the inbox count and shows the new spark; creating a valid thread adds a thread card; both reject empty or whitespace-only input with a visible inline message and add no record
- Editing a spark updates its text everywhere it appears; deleting a spark removes it from the inbox, its thread timeline, search, and the Today digest, and removes its reflections
- Assigning, status changes, pinning, archiving, tagging, and merging all mutate the single shared collection so every view (Home, thread detail, Today, Archived, search) recomputes from that same source rather than a second disconnected copy
- Tag filters and search recompute the visible lists from the shared collection; a filter or search matching nothing shows an explicit no-match message
- New sparks default to no tags and land in the Unthreaded inbox; a thread title is required and non-empty
- Seed nothing: the app starts blank with empty localStorage and the empty states must render; the user creates all data through the UI
- Allowed libraries are only Vue, Pinia, Tailwind CSS, Reka UI, @vueuse/motion, AutoAnimate, TipTap, VeeValidate, Zod, @phosphor-icons/vue, and @tanstack/vue-virtual; no other component or UI libraries and no drag-and-drop library
- The Today digest, thread detail, and Archived screen are views or states within the single page at /, not separate URLs; there are zero outbound navigation links
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

Bindings:
- Browsable entity: sparks
- Destinations: home; today; archived; thread-detail
- Filters: tag
- Entity: spark
- Entity operations: create; select; update; delete; toggle
- Entity fields: text; tags; thread; status; pinned; archived
- Form fields: spark-text; thread-title
- Form operations: validate; submit; cancel

Mechanics exclusions:
- Merge-confirm and toast animation stay Playwright-observed
- Virtualized scroll stays Playwright-observed
- Badge-color and reflection-tint treatments stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
