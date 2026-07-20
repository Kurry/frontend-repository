<summary>
Build a MindThread thought-capture and idea-threading app using Vue 3 Single-File Components, Pinia, Tailwind CSS 4.3.2, and Reka UI. The app produces the operator's portable Workspace JSON artifact — a downloadable document compiled live from sparks, threads, reflections, tags, statuses, pins, and archive membership — conforming to the same API-shaped field contracts as create forms, with Import that round-trips that document. Session state is in-memory only; Export plus Import and the WebMCP artifact surface are the survival path.
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
- On first load the app opens on the Home view showing a capture bar titled Capture a spark, an Unthreaded inbox whose empty state reads Capture your first spark, and a threads column whose empty state reads No threads yet
- Typing text into the capture textarea and pressing Enter, or selecting Add Spark, creates a timestamped spark that appears at the top of the Unthreaded inbox with a Captured timestamp when the submit passes the SparkUpsert field contract
- The inbox header shows a live count such as 3 sparks; newly captured sparks sort most-recent-first
- Each unthreaded spark can be edited in place via Edit (updating its text everywhere under the same SparkUpsert text bounds) and removed via Delete (which also removes its reflections)
Feature: Spark field contract (API-shaped SparkUpsert) —
- Creating a spark submits exactly a SparkUpsert payload; the record a successful create produces IS the would-be spark API request body; Edit, Export Workspace JSON, and Import share this same spark object shape. SparkUpsert field contract (all keys required unless marked optional; example values illustrative only): text (required string after trim, length 1 to 2000 inclusive). App-assigned fields present on the stored record and in export: id (non-empty string), tags (array of TagAdd strings), threadId (string id of an existing thread, or null when unthreaded), createdAt (ISO-8601 datetime string). Cross-field rules: empty or whitespace-only text is rejected; text longer than 2000 characters is rejected naming the text field; neither case adds a record
- Empty or whitespace-only capture shows the inline message Enter a thought to add a spark; over-length text shows an inline error naming the text field; both leave existing data untouched
Feature: Threads —
- Selecting + New Thread with a title that passes the ThreadUpsert field contract creates a thread card showing the title, a spark count such as 0 sparks, and an updated Xh ago relative time
- Each unthreaded spark has an Assign to Thread selector listing every existing thread plus a New Thread… option; choosing a thread moves the spark out of the inbox into that thread, and choosing New Thread… creates a thread named from the spark text (truncated to 40 characters with an ellipsis) and assigns the spark to it
- Opening a thread shows a thread-detail view with a Back control, the title, a status badge, a live stats line reading N sparks · N reflections · N days active, and a Timeline listing the thread's sparks in chronological (oldest-first) order each with a Captured timestamp
- The thread-detail header stats update live: total spark count, total reflection count, and days active computed as the inclusive calendar-day span between the thread's first and most recent spark
- A thread's status is set through an Active / Dormant / Resolved segmented control in the detail header; the chosen status renders as a colored badge that reads the same status and color on the thread card, the detail header, the Today digest, the Archived screen, and search results
- Merge Into… on a thread opens a dialog to pick a different target thread; it requires a two-step confirm (Continue then Confirm Merge) before it moves all of the source thread's sparks and reflections into the target in chronological order and removes the now-empty source thread
- Each thread has a Pin toggle; pinned threads render in a separate Pinned section above the regular thread list, ordered most-recently-pinned first, and Unpin returns a thread to the regular list
- An Archive control moves a thread off the Home list into a separate Archived view reachable from the top nav, where each archived thread keeps its status badge and stats and an Unarchive control restores it to Home
Feature: Thread field contract (API-shaped ThreadUpsert) —
- Creating a thread submits exactly a ThreadUpsert payload; the record a successful create produces IS the would-be thread API request body; Export Workspace JSON and Import share this same thread object shape. ThreadUpsert field contract (all keys required unless marked optional; example values illustrative only): title (required string after trim, length 1 to 80 inclusive). App-assigned fields present on the stored record and in export: id (non-empty string), status (exactly one of Active, Dormant, or Resolved), pinned (boolean), archived (boolean), pinnedAt (ISO-8601 datetime string when pinned, otherwise null), createdAt (ISO-8601 datetime string), updatedAt (ISO-8601 datetime string). Empty or whitespace-only title shows Enter a title to create a thread; a title longer than 80 characters is rejected naming the title field; neither case creates a thread
Feature: Reflections —
- Each spark in the timeline has an Add Reflection control that opens a rich-text reflection editor; saving appends a dated reflection note beneath that spark, visually indented and tinted differently from the original spark, when the submit passes the ReflectionUpsert field contract
- The reflection editor shows a formatting toolbar: applying bold to selected text renders it bold in the editor and in the saved reflection, activating bold again on the same selection removes it, and a bulleted-list control renders the selected lines as a list
- While editing a reflection, an undo control (or the standard undo keyboard shortcut) reverses the most recent edit, and redo restores it
Feature: Reflection field contract (API-shaped ReflectionUpsert) —
- Saving a reflection submits exactly a ReflectionUpsert payload; the record a successful save produces IS the would-be reflection API request body; Export Workspace JSON and Import share this same reflection object shape. ReflectionUpsert field contract (all keys required unless marked optional; example values illustrative only): content (required string after trim of visible text, length at least 1; may carry committed bold and bulleted-list formatting). App-assigned fields present on the stored record and in export: id (non-empty string), sparkId (non-empty string equal to an existing spark id), createdAt (ISO-8601 datetime string). Empty content is rejected with the empty-reflection message specified under writing and appends nothing
Feature: Tags, Today, and search —
- Sparks carry zero or more free-text tags added through a Tags input reading Add Tag when the tag passes the TagAdd field contract; a Filter by tag panel lists every tag in use as a chip with a live count such as #idea (2), and selecting one or more chips filters the visible sparks and threads down to matches, with a Clear Filters control to reset
- TagAdd field contract (API-shaped tag payload; the tag a successful Add Tag produces IS this request body; Export and Import enforce the same rules; all keys required; example values illustrative only): tag (required string after trim, length 1 to 32 inclusive, with no whitespace and no punctuation — letters, digits, and hyphen only). A tag with spaces, punctuation, or length over 32 characters is rejected naming the tag field and adds nothing
- A Today view groups every spark captured on the current calendar day by its thread, with an Unthreaded group for inbox items, and shows No sparks captured yet today when none exist
- A Search field filters across all spark text, reflection text, and thread titles at once; matching substrings are highlighted, results are grouped as Matching threads / Matching sparks / Matching reflections, and a no-results message appears when nothing matches
Feature: Bulk select and domain undo —
- Each unthreaded spark exposes a checkbox; selecting one or more raises a bulk tray showing the live selected count plus bulk Add Tag and bulk Delete actions
- Bulk Add Tag applies a TagAdd-valid tag to every selected spark and updates Filter by tag counts immediately; bulk Delete opens a confirmation that names the selected count, and confirming removes those sparks and their reflections
- Domain Undo and Redo controls reverse and reapply workspace mutations (capture, delete, assign, tag, status, pin, archive, merge, bulk tag, bulk delete, and successful Import); after a capture then an assignment, Undo restores the spark to the inbox and prior counts and enables Redo; Redo reapplies the assignment; a new mutation after undo clears the redo stack; with empty stacks Undo and Redo are disabled
Feature: Command palette —
- Opening the command palette with Ctrl+K or Cmd+K lists Home, Today, Archived, focus capture, Export, and Import actions; arrow keys move the highlight, Enter runs the highlighted action through the same handlers as the visible controls, and Escape closes the palette
Feature: Workspace JSON export and import (useful end state; API-shaped Workspace document) —
- An Export control opens an Export drawer with format tabs Workspace JSON and Today digest, a scrollable code preview regenerated live from the store whenever sparks, threads, reflections, tags, statuses, pins, or archive membership change, plus Copy and Download controls
- Workspace JSON field contract (Copy preview, Download, and Import all conform; field names and enum values are visible in the downloaded JSON text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly mindthread-workspace-v1), exportedAt (required ISO-8601 datetime string), sparks (required array of spark objects each matching the SparkUpsert field contract plus the app-assigned id, tags, threadId, and createdAt fields), threads (required array of thread objects each matching the ThreadUpsert field contract plus the app-assigned id, status, pinned, archived, pinnedAt, createdAt, and updatedAt fields), reflections (required array of reflection objects each matching the ReflectionUpsert field contract plus the app-assigned id, sparkId, and createdAt fields). Cross-field rules: every spark.threadId that is not null must equal an id present in threads; every reflection.sparkId must equal an id present in sparks; every thread.status is exactly one of Active, Dormant, or Resolved; every tag string obeys the TagAdd field contract. After capturing a spark, creating a thread, assigning, tagging, adding a reflection, or setting status, a fresh Export contains those session mutations under the field-contract keys — an export that omits session work is incorrect
- Today digest is a markdown document listing today's sparks grouped by thread (with an Unthreaded group), regenerated live; after the same mutations the digest names those sparks
- Copy places the visible tab text on the clipboard with a visible confirmation; Download starts a real file download whose contents match the preview for the active tab (Workspace JSON or Today digest) via a Blob and an anchor download attribute
- An Import control accepts a previously exported Workspace JSON file (file pick or paste). After an explicit confirmation step that warns the current data will be replaced, a document that passes the Workspace JSON field contract replaces the in-memory workspace so Home, Today, Archived, thread detail, Filter by tag, search, and Export previews match the imported document without a reload
- Import rejection: malformed JSON or a payload that violates the Workspace JSON field contract (schemaVersion not exactly mindthread-workspace-v1, missing schemaVersion or sparks or threads or reflections or exportedAt, status outside Active|Dormant|Resolved, text over 2000 characters, title over 80 characters, tag outside the TagAdd rules, unresolved threadId, or unresolved sparkId) leaves the workspace unchanged and shows visible validation naming the offending field
Feature: Forms and large lists —
- Every form (the capture bar, the thread-title form, the tag input, the reflection editor, and Import when presented as a form) validates its input against the field contracts above before anything is recorded: invalid input shows an inline error message naming the field, adds no record, and leaves existing data untouched
- A Virtualized items panel with a Load 10,000 Items control generates a deterministic 10,000-row sample collection and renders only the visible window plus a small overscan buffer; a Rendered item count label reports the number of rows present in the DOM (far fewer than 10,000), a Filter items field narrows the list live, and arrow-key navigation with Enter selection preserves focus, selection, and scroll position as rows enter and leave the DOM
</core_features>

<user_flows>
- After capturing a spark through the capture bar, the inbox count increases by exactly one, the new spark renders at the top of the inbox with its Captured timestamp, and switching to the Today view shows the same spark in the Unthreaded group without a reload
- Assigning that spark to a thread decreases the inbox count by one, increases that thread card's spark count by one, places the spark in the thread's Timeline in chronological position, and regroups it under that thread in the Today view without a reload
- Setting a thread's status through the segmented control immediately updates the status badge to the same wording and color on the thread card, the detail header, the Today digest, the Archived screen, and search results, all without a reload
- Adding a tag to a spark makes the matching chip appear in the Filter by tag panel with its live count increased by one; selecting that chip narrows the visible sparks and threads to matches, and Clear Filters restores the full lists exactly
- Merging one thread into another moves every spark and reflection into the target in chronological order, raises the target's spark count to the sum of both threads' counts, removes the source thread from the thread list and from search results, and updates the target's stats line immediately
- Mutation-to-export: after capturing a spark with distinctive text, creating a thread, assigning the spark, adding a tag, saving a reflection, and setting status, opening Export yields Workspace JSON with schemaVersion exactly mindthread-workspace-v1 plus those sparks, threads, and reflections under the field-contract keys, and the Today digest markdown names the same sparks
- Artifact round-trip: Download Workspace JSON, mutate the workspace away, then Import that same document after confirmation reconstructs the same visible sparks, threads, reflections, statuses, pins, and archive membership in Home, Today, Archived, and Export previews
- Batch then undo: select three unthreaded sparks, bulk Add Tag with a valid tag, confirm the Filter by tag count rises accordingly, then Undo restores prior tags and counts; Redo reapplies the bulk tag
- Command palette: open via Ctrl+K or Cmd+K, highlight Export or Import, press Enter, and confirm the Export drawer or Import dialog opens through the same handlers as the chrome controls
- A full page refresh returns the blank first-load state: empty inbox, empty threads, empty undo history, and the Capture your first spark / No threads yet empty states — every facet coherently resets, never a mix of surviving and reset facets
</user_flows>

<edge_cases>
- Submitting empty or whitespace-only text in the capture bar creates nothing and shows the inline message Enter a thought to add a spark; repeated rapid submission of empty input creates no records
- Submitting an empty thread title creates nothing and shows the inline message Enter a title to create a thread
- Saving a reflection with empty content is rejected with the empty-reflection message specified under writing and appends nothing
- Spark text longer than 2000 characters is rejected naming the text field; a thread title longer than 80 characters is rejected naming the title field; a tag with spaces, punctuation, or length over 32 characters is rejected naming the tag field — none of these mutations add a record
- Choosing New Thread… from a spark whose text exceeds 40 characters names the new thread from the first 40 characters followed by an ellipsis
- Deleting the last spark in the inbox restores the Capture your first spark empty state, and removing the last thread restores the No threads yet empty state
- A tag filter with zero matches shows No matching sparks rather than a blank panel; a search with zero matches shows its no-results message
- Cancelling the Merge Into… dialog at either confirm step leaves both threads untouched
- Importing a file only replaces the current data after an explicit confirmation step that warns the current data will be replaced; cancelling the confirmation leaves the current data untouched
- Importing malformed JSON, or parseable JSON that fails the Workspace JSON field contract — wrong schemaVersion, missing required keys, status outside Active|Dormant|Resolved, over-length text or title, illegal tag, unresolved threadId, or unresolved sparkId — leaves the workspace unchanged and shows validation naming the offending field
- With empty undo and redo stacks, Undo and Redo are both disabled and do not change the workspace
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
- The Export drawer shows Workspace JSON / Today digest format tabs, a scrollable code block, Copy and Download controls, and uses surface #ffffff with primary indigo accents consistent with the rest of the chrome
- The bulk tray and command palette use the same surface, primary accents, and rounded-md controls as the rest of the app rather than an unrelated visual system
</visual_design>

<motion>
- Every interactive control (nav tabs, Add Spark, + New Thread, Assign to Thread, Pin, the status segmented control, tag chips, Merge Into…, Archive, tag remove buttons, Export, Import, Undo, Redo, bulk tray actions, command palette rows) shows a visible hover state
- Buttons depress slightly on press and ease their background and border color on hover; secondary buttons wash to a light hover tint
- A newly captured spark animates into the top of the inbox rather than appearing instantly, a deleted spark animates out, and a spark leaving the inbox on assignment animates away instead of snapping
- Pinning or unpinning a thread animates the thread card to its new position in the list
- Assigning a spark, creating a thread, setting a status, pinning, merging, archiving, copying export text, and completing Import each surface a brief confirmation toast that slides in from the right and auto-dismisses
- The Merge Into… action opens a modal dialog with a brief enter transition and requires an explicit two-step confirm (Continue, then Confirm Merge) before it executes
- Opening the Export drawer and the command palette via the real UI controls shows a brief opacity or scale enter transition rather than an instant hard cut
- Selecting sparks raises the bulk tray with a slide-in rather than an instant hard cut
- Thread cards and spark cards raise their shadow on hover; the active nav tab is filled with the primary color while inactive tabs take a hover wash
- With prefers-reduced-motion set, spark enter/exit, pin reorder, drawer enter, and toast slide transitions become instant or minimal while state changes still apply correctly
</motion>

<responsiveness>
- At roughly 375px wide the capture bar, thread cards, timeline, Export drawer, bulk tray, and command palette stay fully usable without horizontal scrolling; long spark text wraps rather than overflowing
- No content clips or overflows the viewport at any width between 375px and 1440px
</responsiveness>

<accessibility>
- Keyboard Tab reaches every interactive control (nav tabs, Add Spark, + New Thread, Assign to Thread, Pin, the status segmented control, tag chips, Merge Into…, Archive, Export, Import, Undo, Redo, bulk checkboxes and tray actions) and each shows a visible focus ring while focused
- The Merge Into… dialog, Export drawer, Import dialog, and command palette use role dialog, trap focus while open, close on Escape, and return focus to the control that opened them
- The Assign to Thread selector and the status segmented control are operable with the keyboard alone using arrow keys and Enter
- Inline validation messages render as visible text adjacent to their field, never as a color change alone
- Capture textarea, thread title, tag input, reflection editor, and Import field have visible labels or accessible names associated with the control
- Copy confirmation, bulk apply results, and Import success or failure are announced through a polite live region as well as shown visually
</accessibility>

<performance>
- The main capture workflow withstands at least 25 rapid consecutive submissions through the capture bar: the final spark count is exact, controls stay responsive, and the burst produces no blank screen, uncaught error, or freeze
- Scrolling the 10,000-item virtualized panel stays smooth with no blank gaps, and the rendered DOM row count stays far below 10,000 throughout
- Opening Export after many mutations regenerates Workspace JSON and Today digest without freezing the UI
- Rapid capture, tag filter toggles, and undo/redo keep controls interactive with no hang
- No uncaught errors appear in the console during a full exercise of the app, including export and import
</performance>

<writing>
- Empty states, inline errors, and headers use the exact copy this instruction specifies (Capture a spark, Capture your first spark, No threads yet, Enter a thought to add a spark, Enter a title to create a thread, Enter some text to save the reflection, No sparks captured yet today, No matching sparks)
- Buttons and headings use one consistent capitalization convention, and action labels are specific verbs such as Add Spark, Add Reflection, Export, Import, Copy, and Download rather than generic labels
- Field-contract validation errors name the offending field and the rule (for example text must be 1 to 2000 characters, title must be at most 80 characters, tag must omit spaces and punctuation, schemaVersion must be mindthread-workspace-v1)
- No placeholder or lorem text appears anywhere in the shipped UI
</writing>

<innovation>
Optional enhancements beyond the required specification (not required to pass): denser command-palette keyboard map, first-run coachmark pointing at the capture bar, richer relative-time phrasing, Export drawer affordances such as a line-wrap toggle, or bulk-tray selection summary chips — as long as they stay on-brand with MindThread and do not write workspace state to browser storage or replace the required Workspace JSON package.
</innovation>

<requirements>
- Stack: Vue 3 Single-File Components with the Composition API, shared application state in Pinia stores, styling with Tailwind CSS 4.3.2 (pinned) with the design tokens defined in an @theme block. Client-rendered Vite SPA, no backend, no authentication, opens directly at /
- Component library: Reka UI primitives for the Merge Into… dialog, the Assign to Thread select, the status segmented control, tab navigation, toasts, Export drawer, Import dialog, and command palette; style them with Tailwind to the visual design above
- Rich text: the reflection editor is built on TipTap with bold, bulleted-list, and undo/redo support; the capture bar and thread-title inputs stay plain text inputs
- Forms: every form (capture bar, thread title, tag input, reflection save, and Import when presented as a form) validates through VeeValidate with a Zod schema; the schema defines the rules and inline per-field errors appear before any record is added. Those schemas are API-shaped and mirror the SparkUpsert, ThreadUpsert, ReflectionUpsert, TagAdd, and Workspace JSON field contracts in Feature sections: the record a successful create produces IS that request-body payload, and Export plus a successful Import conform to the same field names, enums, bounds, and cross-field rules
- Animation: @vueuse/motion and AutoAnimate allowed for animation; no other animation libraries
- Icons: Phosphor icons via @phosphor-icons/vue only; no raw pasted SVGs and no icon CDNs
- Virtualized list: @tanstack/vue-virtual drives the Virtualized items panel
- All libraries installed via npm and bundled locally; no CDN imports of any script, style, font, or icon
- Persistence: shared Pinia state is in-memory only for this good-app task — do not use localStorage, sessionStorage, IndexedDB, or other browser persistence APIs for sparks, threads, reflections, tags, statuses, pins, or archive state; a full page reload returns to the blank first-load empty states. The useful end-state survival path is Export plus Import and the WebMCP artifact surface, not browser storage
- All shared application state (the spark and thread collections, reflections, tags, active view, filters, search text, selection, undo/redo stacks, export artifact texts, and toast state) lives in the Pinia stores; every view derives from that single source; WebMCP tool handlers invoke the same store commands as the visible controls
- Creating a valid spark increases the inbox count and shows the new spark; creating a valid thread adds a thread card; both reject empty or whitespace-only input and out-of-bounds field-contract values with a visible inline message and add no record
- Editing a spark updates its text everywhere it appears; deleting a spark removes it from the inbox, its thread timeline, search, and the Today digest, and removes its reflections
- Assigning, status changes, pinning, archiving, tagging, merging, bulk actions, undo/redo, and Import all mutate the single shared collection so every view (Home, thread detail, Today, Archived, search, Export) recomputes from that same source rather than a second disconnected copy
- Tag filters and search recompute the visible lists from the shared collection; a filter or search matching nothing shows an explicit no-match message
- New sparks default to no tags and land in the Unthreaded inbox; a thread title is required and non-empty within the ThreadUpsert bounds
- Seed nothing: the app starts blank with the empty states rendered; the user creates all data through the UI
- Observable field contracts the schema must enforce (judgeable without reading source): SparkUpsert text 1–2000; ThreadUpsert title 1–80; ReflectionUpsert non-empty content; TagAdd 1–32 with no whitespace or punctuation; Workspace JSON schemaVersion exactly mindthread-workspace-v1 with sparks, threads, reflections, exportedAt, and the cross-field id and status rules from Feature: Workspace JSON export and import
- The useful end state is the portable Workspace JSON document: Export must contain the session's actual mutations under the field-contract keys with schemaVersion exactly mindthread-workspace-v1, Import of a valid document reconstructs the same visible state, Today digest markdown names the same session sparks, and the store remains MCP-queryable through the artifact-transfer and entity bindings; an export that omits session mutations is invalid
- Import replaces the current workspace only after an explicit confirmation step that warns the user their current data will be replaced, and only when the payload passes the Workspace JSON field contract; Export Download uses a Blob and an anchor download attribute; Import and Export make no network requests
- Allowed libraries are only Vue, Pinia, Tailwind CSS, Reka UI, @vueuse/motion, AutoAnimate, TipTap, VeeValidate, Zod, @phosphor-icons/vue, and @tanstack/vue-virtual; no other component or UI libraries and no drag-and-drop library
- The Today digest, thread detail, Archived screen, Export drawer, Import dialog, and command palette are views or states within the single page at /, not separate URLs; there are zero outbound navigation links
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Browsable entity: sparks
- Destinations: home; today; archived; thread-detail; export-drawer
- Filters: tag
- Entity: spark
- Entity operations: create; select; update; delete; toggle
- Entity fields: text; tags; thread; status; pinned; archived
- Form fields: spark-text; thread-title
- Form operations: validate; submit; cancel
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: workspace-json

Mechanics exclusions:
- Merge-confirm and toast animation stay Playwright-observed
- Virtualized scroll stays Playwright-observed
- Badge-color and reflection-tint treatments stay Playwright-observed
- Export drawer clipboard contents and downloaded artifact bytes stay Playwright-observed
- Command palette open animation stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
