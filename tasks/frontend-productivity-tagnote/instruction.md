<summary>
Build a TagNote personal note-timeline app using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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

Feature: Timeline shell —
- The app opens at / into a single-column timeline shell: a sticky top bar titled TagNote with Calendar, Archived, History, Export, Import, Apply Scenario Change, Undo, and Redo controls, a search field, a horizontal tag rail, the scrolling note timeline, and a composer pinned to the bottom of the screen; no backend routes exist and no navigation leaves the page
- Before any note exists the timeline shows a friendly empty-state prompt inviting the user to send the first note, not a blank area

Feature: Composer and note create field contract —
- The bottom composer is a single-line text editing surface with Bold and Italic formatting toggles and a visible Send control; typing text and clicking Send OR pressing Enter appends the note to today's section of the timeline and clears the input for the next note
- Note create field contract (the record Send produces IS this payload; the composer schema, note bubbles, and Session JSON export all enforce the same rules; all keys required unless marked optional; example values illustrative only):
  - Required text: trimmed non-empty string at most 2000 characters; blank, whitespace-only, or over-length values fail validation naming the text field, append no note, and leave the last valid timeline unchanged
  - Required tags: array of lowercase tag strings derived from hash-word tokens in text (case-insensitive, deduplicated), each tag 1 to 32 characters of letters, digits, or hyphens; tags are never typed as a separate form field — they are parsed from text
  - Optional marks: array of formatting spans each with start (non-negative integer), end (integer strictly greater than start and at most text length), and style exactly one of bold or italic
  - On create, pinned is false, archived is false, done is false, createdAt is an ISO-8601 timestamp for now, and attachment is null until a file is attached
- Selecting text in the composer and activating Bold renders that span bold in the composer and in the sent note bubble; applying Italic works the same way; activating the same toggle again on the same span removes the formatting, and formatting never changes which hash-word tags are parsed from the note's plain text
- Pressing the standard undo keyboard shortcut while typing in the composer reverts the last typing or formatting change inside the composer only, without touching the timeline's own Undo and Redo history
- Submitting a blank or whitespace-only note is prevented AND explained: no note is appended and the composer shows a visible inline error message naming the text field, plus a brief shake animation on the input row; a silently disabled Send control alone is not sufficient

Feature: Tags, links, and rail —
- Any hash-word token typed inside a note (for example writing call mom #family #todo) is parsed into tag chips shown beneath that note bubble; that example produces exactly two chips reading family and todo, and a note may carry any number of tags
- Tag matching is case-insensitive and deduplicated: a note containing #Work and a note containing #work both count toward one single work tag, and the tag rail lists work once with a usage count of 2
- If a note's text contains a URL starting with http:// or https://, the app automatically adds a link tag to that note in addition to any typed tags and renders the URL as a clickable anchor inside the note bubble
- A horizontal tag rail above the timeline lists every distinct tag currently used on non-archived notes with its usage count; clicking a tag filters the timeline to only notes carrying that tag and reveals a Clear filter control, and clicking the same tag again (or Clear filter) removes the filter and restores the full timeline
- Each tag chip in the tag rail has a Make TODO control; once a tag is marked as a TODO tag, every note carrying that tag shows a checkbox before its text, and that tag's filtered view splits into an Open section (unchecked notes) and a Done section (checked notes) based on each note's checkbox state

Feature: Note actions —
- Each note has a Pin control; pinned notes appear in a Pinned section rendered above the chronological timeline, and an Unpin control returns the note to its original chronological position
- Each note has an Archive control that removes it from the main timeline into a separate Archived view opened from the Archived control; an Unarchive control restores it to its original chronological position in the main timeline
- Each note has an Edit control that loads its text, with any bold or italic formatting preserved, back into the composer (the composer switches to an Editing note mode with a Save control and a Cancel control); saving re-derives tags and links from the edited text from scratch under the same note create field contract, so a tag removed from the text no longer applies and a newly typed tag or URL is added; editing never changes the note's createdAt date grouping
- Each note has a Delete control that opens a confirmation dialog; the note is permanently removed only after confirming, and canceling leaves it in place
- Each note has an Attach File control that opens the file picker; once a file is chosen the note shows a chip with the file's name and human-readable size and automatically receives a file tag; attachment metadata in the note record is an object with required name (non-empty string at most 255 characters) and required sizeBytes (non-negative integer)

Feature: Search and syntax chips —
- A search field filters the currently visible list (main timeline, an active tag filter, or the Archived view) by keyword matched across both note text and tag names; searching within an active tag filter narrows within that filter rather than ignoring it
- A horizontal row of search syntax chips below the search field offers at least four chips: tag:family, tag:todo, done:open, and done:done; clicking a chip fills the search field with that exact token and narrows the visible list to notes matching the token (tag:NAME requires that lowercase tag; done:open matches unchecked notes that carry any TODO-designated tag; done:done matches checked notes that carry any TODO-designated tag); when chips overflow the row scrolls horizontally without breaking the vertical layout
- Combining a syntax chip with additional typed keywords applies both constraints simultaneously

Feature: Date groups and calendar —
- The timeline groups notes under date headers reading Today, Yesterday, or the full weekday-month-day-year date for older notes, keyed to each note's original creation timestamp; editing a note's text does not move it to a new date group
- A Calendar control opens a month-grid view with Previous and Next controls to move between months; each day cell that has one or more notes shows a marker dot, clicking a marked day filters the timeline to only the notes created that day, and clicking the same day again clears the filter; the currently selected day is highlighted distinctly from other days

Feature: Bulk selection —
- Each note bubble exposes a selection checkbox; selecting one or more notes raises a bulk tray showing the live selected count and actions Archive selected, Pin selected, and Delete selected (Delete selected requires a confirmation dialog naming the count)
- Applying a bulk action updates every selected note and every derived surface (timeline, tag rail counts, Archived view, export previews) immediately, then clears the selection
- Select all visible / Clear selection controls toggle every currently visible note checkbox; the tray count matches the checked notes exactly

Feature: History —
- Undo and Redo controls plus an Apply Scenario Change control model note edits as an explicit transition history; the History panel exposes a region labelled History state showing the current snapshot, lists past and future states that can be jumped to, and when the user undoes and then makes a different change the abandoned redo path becomes a separately selectable branch rather than being silently discarded

Feature: Session artifacts (the app produces the user's TagNote package) —
- An Export control opens an artifact panel with two format tabs — Session JSON and Timeline Markdown — each regenerated live from the current notes, TODO-tag designations, pin/archive/done state, attachment metadata, and formatting marks whenever those change
- Session JSON is API-shaped like a notes-service export payload — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: exactly the string tagnote-session/v1
  - Required exportedAt: non-empty ISO-8601 timestamp string
  - Required todoTags: array of lowercase tag strings (the set of tags currently marked TODO)
  - Required notes: array of note objects; each requires id (non-empty string), text (same text contract as create), tags (array of lowercase strings), marks (array of bold/italic span objects as in the create contract), pinned (boolean), archived (boolean), done (boolean), createdAt (ISO-8601 string), and attachment (null or an object with name and sizeBytes as above)
- Timeline Markdown previews a human-readable report grouped by the same date headers as the timeline, listing each note's plain text, its tags as hash-words, and pin/archive/done markers; the report content must reflect the session's actual notes
- The composer create/edit schema and the Session JSON shape share those field contracts; every violation message names the offending field
- Each format tab offers Copy (writes that format's text to the clipboard with a brief copied confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
- Export content that omits the session's actual work is invalid: after sending a distinctive note, pinning it, marking a tag TODO, and checking done, both export formats must contain that note text and matching pin/done/todoTags state, and Session JSON must still show every required key from the field contract
- An Import control accepts a pasted or file-picked Session JSON payload matching the field contract: a valid payload replaces the shared notes collection and todoTags so the timeline, tag rail, filters, and both export previews show the imported state; malformed JSON or a document that fails the field contract (wrong schemaVersion, missing notes or todoTags, a mark style outside bold|italic, text longer than 2000 characters, or a non-boolean pinned/archived/done) shows visible validation feedback naming the offending field and changes nothing
</core_features>

<user_flows>
- After typing call mom #family #todo and sending, exactly one new bubble appears under the Today header, the timeline's visible note count increases by exactly one, and the tag rail shows family and todo chips whose usage counts each increase by one (appearing with count 1 when new) — all without a reload
- Bolding a word in the composer, sending, then editing that note and toggling the bold off round-trips the formatting: the sent bubble first renders the word bold, the saved edit renders it plain, and both states appear correctly in the Session JSON marks array when Export is opened after each step
- Archiving a note removes its bubble from the main timeline (the visible count decreases by one), immediately decreases its tags' usage counts in the rail (a tag used only by that note leaves the rail), and the Archived view lists that note; Unarchive returns it to its original chronological position and restores the rail counts, all without a page reload
- Marking work as a TODO tag adds a checkbox to every note carrying work in the timeline; checking one of those notes inside the work filtered view moves it from the Open section to the Done section immediately, and the Session JSON export lists that tag under todoTags and that note's done true
- Bulk then undo: selecting 2 notes and applying Archive selected moves both into the Archived view and decreases the main timeline count by exactly 2; a single Undo restores both notes and the prior rail counts
- Artifact end state: send a note with distinctive text including #family, pin it, open Export, and confirm Session JSON and Timeline Markdown both contain that text and family tag, Session JSON shows schemaVersion tagnote-session/v1 plus exportedAt, todoTags, and notes keys, Copy confirms on the active tab, and Download of Session JSON then Import of that same document reconstructs the same visible bubble, pin state, and rail counts
- Search syntax chip: clicking tag:family fills the search field and narrows the list to family-tagged notes; clearing the field restores the prior unfiltered list
- A page reload returns the app to its empty seeded baseline: empty timeline with the first-note empty-state prompt, empty tag rail, empty undo/redo stacks, no active filters, and no export or import panel open
</user_flows>

<edge_cases>
- Submitting a blank or whitespace-only note is prevented AND explained: no note is appended and the composer shows a visible inline error message naming the text field, plus a brief shake animation on the input row; a silently disabled Send control alone is not sufficient
- A search or filter combination matching nothing shows an explicit no results message rather than a blank region
- The Archived view shows a short empty message when nothing is archived
- A note whose text is one long unbroken URL wraps inside its bubble rather than overflowing or stretching the column
- Canceling the delete confirmation dialog leaves the note in place in every view and changes no counts
- Double-activating Send on the same composer text appends exactly one note: the visible count increases by one and one new bubble appears
- Submitting composer text longer than 2000 characters shows validation naming the text field and appends no note
- Delete selected with zero checkboxes selected starts no deletion; Archive selected and Pin selected with zero selection are disabled or no-ops
- Importing malformed Session JSON leaves notes, todoTags, rail counts, and Export unchanged and shows visible validation feedback
- Importing parseable JSON that fails the Session JSON field contract — wrong schemaVersion, missing notes or todoTags, mark style outside bold|italic, text over 2000 characters, or non-boolean pinned/archived/done — leaves state unchanged and shows validation naming the offending field
- Undo and Redo are disabled at empty-stack boundaries and never throw or corrupt notes when activated there
</edge_cases>

<visual_design>
- Single centered column (max width around 42rem) over a light canvas colored #F5F5F7, with primary ink #1D1D1E; the top bar and composer are sticky so the composer stays reachable at the bottom while the timeline scrolls between them
- Note bubbles are white cards with a 7px border radius and a subtle shadow that deepens on hover; a pinned note carries a small pin indicator badge in the secondary accent color #FFCC00
- Primary calls to action (Send, Apply Scenario Change, Export, Import, and the active states of Calendar/Archived/tag chips) use background #007AFF with near-white text and a full pill radius (1000px) and no shadow; secondary controls (Pin, Archive, Edit, Attach File, Make TODO, inactive tag chips, bulk tray actions) use background #E6EEF7 with #007AFF text, the same full pill radius, and no shadow
- A given tag renders with identical chip styling everywhere it appears: in the note bubble, in the tag rail, and in the TODO split view. The currently selected tag in the rail shows a distinct filled-accent treatment (accent background, white text) versus the unselected chips
- Typography uses the SF Pro family with an -apple-system, BlinkMacSystemFont fallback stack; the h1 title renders at 34px, section h2 headers at 17px, and body/note text at 17px. Spacing and gaps follow a 4px-multiple scale
- Bold and italic spans inside note bubbles render visibly heavier or slanted than the surrounding 17px note text while keeping the same size and color
- Links inside note bubbles render in the #007AFF link color, visually distinct from surrounding note text
- Calendar day cells with notes are visually distinguishable from empty days by a marker; the active-filter day is highlighted distinctly from both empty and today's cell
- Export appears as a panel or modal with format tabs (Session JSON / Timeline Markdown), a scrollable code/preview block, and Copy and Download affordances; the bulk tray slides up above the composer when any note is selected
- Search syntax chips render as a horizontal chip row with the same pill language as secondary controls
- Every control that shows an icon draws it from one consistent icon set at a consistent optical size; no mismatched icon styles appear across the top bar, note actions, and composer
- Empty states are explicit and friendly: the first-note prompt, a no results message for empty filters/searches, and a short message for an empty Archived view
</visual_design>

<motion>
- Sending a note animates the new bubble into the timeline rather than snapping in; deleting or archiving a note animates the bubble out; pinning a note animates it into the Pinned section, so every list add, remove, and move carries visible motion
- Sending, pinning/unpinning, archiving/unarchiving, attaching a file, bulk applying, and deleting a note each surface a transient toast confirmation that animates in immediately and auto-dismisses with a fade after about 2.5 seconds
- Submitting a blank note plays a short shake animation (about 0.3s) on the composer input row alongside the inline error
- The Send control and other buttons ease their background color on hover and depress slightly (scale down) on active press; tag chips, note action controls, search syntax chips, and note bubbles show a visible hover state distinct from their resting state
- The bulk tray slides up when the first note is selected and slides away when the selection clears; the Export panel enters and exits with a short opacity-and-scale transition of roughly 200 milliseconds
- Selecting a tag, opening Calendar or Archived, and switching views update the timeline in place without a full page reload; the active view's control reflects the current state
- With prefers-reduced-motion set, the shake, bubble, toast, tray, and export animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At approximately 375px wide the app renders with no page-level horizontal scrolling; the tag rail and search syntax chips scroll horizontally inside their own containers rather than breaking the layout, long note text and URLs wrap rather than overflow, and the composer stays pinned and legible at the bottom; Export tabs, Copy, Download, and the bulk tray stay fully visible and operable
- At desktop widths the single centered column keeps its maximum width while the canvas background fills the remaining space on both sides
</responsiveness>

<accessibility>
- Keyboard Tab focus is clearly visible on interactive controls (an accent outline/ring) and follows a logical reading order from the top bar through the tag rail, search syntax chips, timeline, bulk tray, and composer
- The delete confirmation dialog, Export panel, and Import panel trap focus while open, close without committing when Escape is pressed, and return focus to the control that opened them
- The composer's inline validation error and Import validation messages are announced through an aria-live polite region as well as shown visually
- Icon-only controls expose accessible names describing their action; note selection checkboxes and bulk tray actions are reachable and operable with the keyboard alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app's features, including export, import, bulk actions, and rapid sends
- The UI stays responsive during rapid repeated sends, with no hangs, dropped interactions, or blank screens
</performance>

<writing>
- Headings, buttons, chips, and toasts use one consistent capitalization convention throughout the app
- Action labels are specific verbs — Send, Export, Import, Copy, Download, Archive selected, Pin selected, Delete selected — rather than generic labels where a specific one is possible
- Empty states explain what belongs in the region and how to add it; error messages name the problem and the fix; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<innovation>
Optional enhancements beyond the required specification (not required to pass): a command palette jumping to tags or export, richer Timeline Markdown styling controls, or coachmarks for the first TODO-tag setup that stay on-brand with the TagNote shell.
</innovation>

<requirements>
Shared application state must live in Qwik stores (useStore, in-memory only): the notes collection, per-note tags/pin/archive/done/marks/attachment state, the set of TODO-designated tags, the active tag/date/search filters, row selection for bulk actions, the active view (timeline, calendar, archived, export, import), the live export artifact texts, and the undo/redo transition history. Views derive from this one store, never a second disconnected copy. Do not use localStorage, sessionStorage, or other browser storage APIs. Do not stand up a backend or authentication. WebMCP tool handlers invoke the same store commands the visible controls use, so a contract-driven create, filter, export, or import produces the same visible state as a UI-driven one.
State and parsing contracts (behavioral, not storage keys):
- Sending a valid note appends exactly one note under today's date header under the note create field contract; the parsed tag chips equal the deduplicated case-insensitive set of hash-word tokens in the text, plus a link tag when the text contains an http(s) URL, plus a file tag when a file is attached
- Editing a note re-derives its tags and links entirely from the new text (removed tokens drop their tags; added tokens/URLs add theirs) and preserves the note's original creation date grouping
- Deleting a note requires an explicit confirmation step and removes it from the timeline, any filtered views, and derived tag counts
- Pin/Unpin, Archive/Unarchive, and the TODO checkbox toggle only the targeted note's state and immediately update every view that reflects it, including export previews
- Tag filter, calendar-day filter, search, and search syntax chips recompute the visible list from the single shared collection; search narrows within an active tag filter rather than replacing it, and search matches across both note text and tag names
- Marking a tag as a TODO tag adds a checkbox to every note carrying that tag and splits that tag's filtered view into Open and Done sections
- Bulk Archive selected, Pin selected, and Delete selected mutate every selected note through the same store commands as the per-note controls
- Undo and Redo restore the immediately adjacent history states, Apply Scenario Change commits a new visible transition, the History panel exposes the current snapshot under a History state label, and undoing then making a different change creates a separately selectable branch rather than flattening history
- Export Session JSON and Timeline Markdown are compiled live from the shared store; Import of a valid Session JSON payload writes through the same store so timeline, rail, filters, and export previews agree
- The useful end state is the TagNote package: Export must produce Session JSON and Timeline Markdown that contain the session's actual notes, tags, marks, pin/archive/done flags, todoTags, and attachment metadata, with Copy and Download, and Session JSON must round-trip through Import while conforming to the declared field contract
Adversarial and rapid-use robustness:
- A blank/whitespace-only or over-length submission adds no note and shows visible feedback; the last valid state is never damaged
- The primary send workflow must withstand at least 25 rapid deterministic submissions through the Send control with the final visible count exact, controls responsive, and no blank screen, uncaught error, or sustained freeze
Seeds and empties: the app starts with an empty timeline and shows the first-note empty-state prompt; empty filters/searches and an empty Archived view show explicit messages rather than blank regions; a page reload returns to that empty seeded baseline
Observable field contracts the schema must enforce (judgeable without reading source):
- Note text, tags, marks, pinned, archived, done, createdAt, and attachment shape from Feature: Composer and note create field contract and Feature: Note actions
- Session JSON schemaVersion, exportedAt, todoTags, and notes shape from Feature: Session artifacts
Stack and libraries: Build tooling is Vite (Qwik City). Styling is Tailwind CSS 4.3.2, pinned, with design tokens defined in the theme layer. DaisyUI is the component library and provides the buttons, tag chips/badges, the delete confirmation dialog, toasts, export/import chrome, the bulk tray, and the calendar and history chrome. AutoAnimate is allowed for animation (list add/remove/move and view microinteractions); no other animation libraries. The composer's formatted-text editing surface is built on ProseKit (vanilla core), and its formatting commands operate on the same note text the tag parser reads. Icons come from one Iconify set delivered through the @iconify/tailwind4 plugin; no raw pasted SVGs and no icon CDN. All forms, including the composer, its Editing note mode, and Import Session JSON validation, validate through a Valibot schema via Modular Forms for Qwik, surfacing inline per-field errors before submit. The schemas are API-shaped: they model the note create payload and the Session JSON package a real notes API would accept — the record Send creates IS that request body; Session JSON export and import use the same field names, enums, bounds, and cross-field rules. All libraries are installed via npm and bundled locally; no CDN imports.
Chrome and safety: zero outbound navigational links for app chrome (in-app controls only); render note text safely (escape user input before inserting parsed links).
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
- entity-collection-v1
- browse-query-v1
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
- Browsable entity: notes
- Destinations: timeline; calendar; archived; export-panel
- Filters: tag; day
- Entity: note
- Entity operations: create; select; update; delete; toggle
- Entity fields: text; tags; pinned; archived; done
- Artifact operations: export; import; copy
- Export formats: session-json; timeline-markdown
- Import modes: session-json

Mechanics exclusions:
- Attach File native OS file picker stays Playwright-observed
- Make-TODO tag-rail toggle and Open/Done split stays Playwright-observed
- Calendar day-marker selection and month navigation stays Playwright-observed
- Toast auto-dismiss and blank-submit shake animation timing stays Playwright-observed
- Undo/Redo branch traversal in the History panel stays Playwright-observed
- Bulk tray slide and Export panel enter/exit motion stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
