<summary>
Build a semantic search workspace for a prompt-and-document knowledge library using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System. The app produces the operator's portable artifacts: a downloadable and copyable search-report JSON compiled live from the current query ranking, and a library-package JSON of the document corpus that round-trips through Import — both conforming to the same API-shaped field contracts as the create and save forms.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Semantic query —
- A full-width search input at the top of the main panel accepts natural-language queries; pressing Enter or clicking the Search control runs the query
- Results appear as a ranked list of document cards; each card shows the document title, a type tag, its topic tags, a similarity score badge showing a monospace numeric value between 0.00 and 1.00, and a two-line excerpt in which the most relevant passage is highlighted with a distinct background
- The result list is sorted by similarity score descending; re-running the same query with the same corpus, threshold, and feedback state returns the same ranked order
- Two different queries produce visibly different rankings and different similarity scores — the scores are computed from the query, not constant per document
- Above the results, a visible count states the exact number of matching results; the count updates whenever the query, threshold, or filters change
- The full result list scrolls smoothly with no visible frame drops even when a broad query matches most of the seeded corpus

Feature: Search syntax chips —
- Typing structured tokens in the query — tag:, type:, and before: followed by a value — turns each token into a removable filter chip rendered above the results when the query runs; the free-text remainder is used as the semantic query
- Tokens combine: a query containing tag:react type:guide before:2026-01-01 applies all three filters together and the result count reflects the combination
- Removing a chip re-runs the query without that filter and the visible result count updates; removing all chips restores unfiltered results for the free-text query
- A token with an unknown tag or type value shows an inline notice naming the unmatched value while still applying the remaining valid tokens

Feature: Threshold and relevance controls —
- A similarity threshold slider from 0.0 to 1.0 in 0.05 increments sits above the results; moving it hides cards whose similarity score is below the selected value and the visible result count updates immediately as the slider moves
- Each result card carries thumbs-up and thumbs-down feedback controls; giving a thumbs-up visibly boosts that document's position and score in the current query's ranking, and a thumbs-down demotes it; the affected card shows a feedback marker
- Feedback is remembered per query while the app is open: re-running a query with recorded feedback reproduces the adjusted ranking, and a Reset Feedback control on the query restores the unadjusted order

Feature: Score explanation —
- Each result card includes a Why this ranks disclosure that is collapsed by default; expanding it reveals the matched terms with a per-term contribution bar and value, plus a line showing any feedback adjustment applied
- The disclosure expands and collapses on activation with a rotating chevron cue and remembers its open state per result while the app is open
- Expanding the explanation for two different results shows different matched terms and contributions consistent with their excerpts

Feature: Keyword fallback —
- When a query returns zero semantic results with similarity at or above 0.2, the results section falls back to keyword matching and is labeled Keyword results (no semantic matches above threshold)
- Keyword-fallback cards still show which words matched via the highlighted excerpt

Feature: Result clustering —
- A Group by topic toggle above the results regroups the ranked list into expandable topic groups, each with a header showing the topic name and its result count; group counts sum to the total result count
- Expanding or collapsing a group shows or hides only that group's cards; toggling grouping off restores the flat ranked order

Feature: Document detail and related panel —
- Clicking a result card (or pressing Enter on a focused card) opens a side panel showing the document's full body, type, tags, and a Related section listing the three next-most-similar documents from the library as compact linked rows with their similarity values
- Clicking a related row shows that document in the same side panel and pushes a breadcrumb trail; clicking an earlier breadcrumb navigates back to that document, and the panel closes with its close control or Escape
- The related rows differ per document — two different documents show different related lists

Feature: Command palette and keyboard-first navigation —
- Pressing Cmd+K (or Ctrl+K) opens a command palette overlay with a scoped search input; typing fuzzy-matches across document titles, saved searches, and app commands, with matches updating on every keystroke and no perceptible lag
- Arrow keys move the palette highlight, Enter activates the highlighted entry (opening a document, running a saved search, or invoking a command), and Escape closes the palette
- With results on screen, ArrowDown and ArrowUp move a visible selection highlight through the result cards without scrolling the page abruptly; Enter opens the selected card's detail panel

Feature: Saved searches and history —
- Every executed query appends an entry to a history timeline showing the query text, its chips, a timestamp, and the result count at execution; entries appear newest first
- SavedSearch field contract (API-shaped create payload; a successful Save record IS the would-be saved-search request body; all keys required; example values illustrative only): name is a trimmed string length 1 to 80 and must be unique among saved searches; query is the free-text remainder string at save time; filters is an array of objects each with kind exactly one of tag|type|before and value a non-empty string, one entry per active chip; threshold is a number from 0.0 to 1.0 in 0.05 increments matching the slider. Cross-field: empty or whitespace-only name, or a name that duplicates an existing saved search, keeps Save disabled with an inline error naming name and stores nothing
- A Save search control opens a form that submits exactly that SavedSearch payload with the captured query, chips, and threshold; the Save control stays disabled until the name is valid and unique, and submitting adds the search to a Saved list showing the name
- Clicking a saved search or a history entry re-runs that query, restoring its chips and threshold; a saved search's Delete action asks for confirmation before removing it
- History entries support bulk selection via checkboxes; a contextual action bar appears when any are selected, offering Delete selected (with a confirmation naming the count) and Clear selection; deleting removes exactly the selected entries

Feature: Query comparison —
- A Compare queries view lets the user pick two queries from history or saved searches and shows their result sets side by side
- Documents appearing in both result sets are visually marked as overlap in both columns; documents unique to one side carry a distinct unique marker; a summary line shows the overlap count and each side's unique count
- Changing either selected query updates the comparison columns and the overlap summary without a reload

Feature: Index management —
- An index panel shows live statistics: total documents indexed, stale (unindexed or changed) document count, last build time, and distinct term count; the statistics derive from the library and update when documents change
- DocumentUpsert field contract (API-shaped create/update payload; the record a successful Add produces IS the would-be document request body; library-package export and Import share this document object shape; all keys required unless marked optional; example values illustrative only): title is a trimmed string length 1 to 200; body is a trimmed string length 20 to 20000; type is exactly one of guide|reference|prompt|checklist|paper|note from a closed select; tags is an array of 0 to 12 non-empty trimmed strings with no duplicates case-insensitively; optional id is a non-empty string assigned on create and stable thereafter. Cross-field: empty title, body shorter than 20 characters after trim, type outside the closed list, or a duplicate tag keeps Add disabled with inline errors naming the offending field and adds nothing
- An Add document form submits exactly that DocumentUpsert payload and validates inline — the Add control stays disabled until required fields are valid, and submitting with an empty title or too-short body shows a message naming the field and adds nothing
- A newly added document appears in the index panel's document list immediately but does not appear in search results until the index is rebuilt; the stale count increases by one and the status bar reflects the stale state
- The index panel's document list supports bulk selection; a contextual action bar offers Delete selected (with confirmation naming the count) and Mark stale; bulk deleting removes exactly the selected documents from the library and updates the index statistics
- An Index Now control starts a simulated re-index run decomposed into visible per-document ingest steps: each step shows the document title and a status advancing through pending, running, and complete or failed; the status bar shows Indexing followed by the running progress M/N while active and Indexed N documents on completion
- Occasional simulated ingest failures retry automatically with a visible backoff countdown and an attempt counter (for example, waiting before retry 2 of 3); a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control that resumes the run from that step — completed steps keep their original timestamps and never re-execute
- A running re-index can be paused and resumed: pausing freezes progression at the current document; resuming continues from exactly that step
- A run-level rollup derives live from the step states — documents ingested out of total, elapsed time, and failure count — and the run has an ordered event timeline of step transitions with timestamps, filterable by status
- After the rebuild completes, previously stale documents appear in matching search results and the stale count returns to zero

Feature: Undo and redo —
- Undo and Redo controls in the toolbar revert and reapply library and search mutations — adding or deleting documents, bulk deletions, feedback marks, and saved-search changes; each control shows the label of the action it will affect and disables when its stack is empty
- Undoing a document deletion restores the document to the library and to the index statistics; redoing removes it again

Feature: Search report and library package export —
- An Export control opens a modal with two format tabs that regenerate live from shared state without a reload: Search report and Library package. Download and Copy emit the visible text for the active tab; an export that omits session mutations is invalid
- SearchReport field contract (API-shaped search-service exchange; Download and Copy share this schema; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion is a number exactly 1; generatedAt is an ISO-8601 datetime ending in Z; request is an object with query (string, the free-text remainder), filters (array of objects each with kind exactly one of tag|type|before and value a non-empty string, one per active chip), and threshold (number 0.0 to 1.0 in 0.05 increments); results is an array of hit objects each with id (non-empty string), title (string), type (exactly one of guide|reference|prompt|checklist|paper|note), score (number rendered with exactly two decimals between 0.00 and 1.00), snippet (string), highlights (array of matched term strings), and feedback (exactly one of up|down|none). The results array order matches the on-screen ranked order after threshold filtering, and each hit's score and feedback match the visible card
- LibraryPackage field contract (API-shaped library document; Download, Copy, and Import share this schema; all keys and nesting REQUIRED; example values illustrative only): schemaVersion is a number exactly 1; library is exactly the string Semantic Search Library; documents is an array of DocumentUpsert objects in library order (each conforming to the DocumentUpsert field contract, including id); savedSearches is an array of SavedSearch objects (each conforming to the SavedSearch field contract); generatedAt is an ISO-8601 datetime ending in Z
- The Search report tab derives live: changing the threshold or adding feedback and reopening the export reflects the change in the matching fields, and the JSON parses without error when read
- The Library package tab derives live: adding or deleting a document or saving a search and reopening the export updates documents and savedSearches accordingly
- A Download control offers the visible preview as a downloadable file whose contents match the preview text; a Copy control places the exact preview text on the clipboard and shows a visible confirmation
- Import library package accepts a previously exported LibraryPackage JSON (file pick or paste). A valid import replaces the document corpus and saved-searches collection so the index list, saved list, counts, and a fresh Library package export match the imported document without a reload; the stale count rises to the imported document count until Index Now completes. Malformed JSON, schemaVersion other than 1, library not exactly Semantic Search Library, or any document or saved search that fails its field contract shows a visible error naming the offending field (or that the package is invalid) and changes nothing
</core_features>

<user_flows>
- Searching end to end: entering a query and pressing Enter renders the ranked list with scores descending, moving the threshold slider hides low-scoring cards and updates the count, giving one result a thumbs-up moves it up the ranking with a feedback marker, and opening the Search report export shows the same query, threshold, ranked order, and feedback marker under the SearchReport field contract — all without a reload
- Indexing a new document end to end: adding a valid DocumentUpsert increases the stale count, running Index Now advances per-document steps while the status bar shows M/N, and after completion a query matching the new document's content returns it with a similarity score while the stale count reads zero; the Library package export then lists that document under the DocumentUpsert shape
- Export session flow: after a search with feedback and a threshold change, open Export on Search report, confirm schemaVersion is 1 and the request and results match the cards, Download or Copy the JSON; switch to Library package and confirm documents and savedSearches reflect the session
- Import round-trip flow: export a Library package after adding a document and saving a search, note the documents length, delete documents to diverge, Import the JSON, and confirm the index list count, saved list, and a fresh Library package export reconstruct to match the imported package
- Recovering from an ingest failure: when a step exhausts its retries and is marked failed, the rollup's failure count increases; activating that step's Retry control resumes the run from that step and earlier steps' timestamps remain unchanged
- Comparing two queries: running two different queries, then selecting both in the Compare view, shows overlap and unique markers whose counts sum consistently with the two result sets; changing one selection updates the overlap summary
- Navigating the related trail: opening a result, following two related rows, and clicking the first breadcrumb returns the panel to the original document with its full body visible
- A page reload returns the app to its seeded state: the seeded corpus, an empty query, no history entries, no saved searches, no feedback, and a fully built index
</user_flows>

<edge_cases>
- A query matching nothing even by keyword shows an empty state explaining that no documents matched and suggesting removing filters or lowering the threshold, with a control that clears chips and resets the threshold
- Setting the threshold above the top result's score hides every card and shows the same empty state; lowering it restores the cards without re-running the query
- Double-activating the Search control runs exactly one query: one new history entry appears
- Double-activating Index Now starts exactly one re-index run
- Deleting a document that appears in the current results removes its card from the results, the count decreases by one, and the index statistics update
- A document title longer than 80 characters is truncated with an ellipsis on its result card and shown in full in the detail panel
- Undo with an empty history and Redo with an empty redo stack are disabled, not silent no-ops
- Saving a search with a name that duplicates an existing saved search shows an inline message naming name and does not create a second entry
- Submitting Add document with body shorter than 20 characters after trim, or a type outside guide|reference|prompt|checklist|paper|note, shows an inline error naming the field and adds nothing
- Importing malformed LibraryPackage JSON, schemaVersion other than 1, library other than Semantic Search Library, or a document or saved search that fails its field contract leaves the corpus and saved list unchanged and shows a visible error naming the problem
</edge_cases>

<visual_design>
- Layout: a main search column with the query input, chips row, threshold slider, and results; a right side panel area for document detail; and a left rail with tabs or sections for history, saved searches, compare, and the index panel
- Result cards carry a left accent bar whose opacity scales with the similarity score — a score of 1.0 renders the accent at full strength and a score of 0.5 at visibly half strength — so ranking is readable at a glance
- Similarity badges render their numeric value in a monospace face inside a compact tag; feedback markers, overlap markers, and unique markers are visually distinct chips
- The highlighted excerpt passage uses a warm highlight background distinct from the card background, applied only to the matching span
- The index status bar uses an informational treatment while indexing and a success treatment when the index is current; the stale count renders in a warning treatment whenever it is above zero
- Step statuses in the re-index run are visually distinct at a glance: pending, running, retrying, failed, and complete each carry a distinct color or icon treatment, consistent between the step list and the event timeline
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than card titles, which are larger than body and metadata text
- Spacing follows a consistent rhythm: gaps between the rail, results column, and side panel are visually regular, with no crowded or orphaned regions
- Buttons, inputs, sliders, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used across the toolbar, cards, status bar, and panels
</visual_design>

<motion>
- On a new search, result cards animate in staggered at roughly 40 milliseconds per card, fading and translating up from about 8 pixels below their final position
- The document detail side panel slides in from the right over roughly 200 milliseconds on open and slides out on close
- The command palette enters with a short opacity and scale transition and its match list updates without flicker as the user types
- Re-ranking after feedback animates: cards slide to their new positions rather than snapping, so the boost or demotion is visible as movement
- The score-explanation disclosure expands with its chevron rotating; contribution bars grow from zero width when first revealed
- The retry backoff countdown ticks visibly, and a completing ingest step's status transitions with a short fade rather than snapping
- Hover animations (required): buttons ease background and shadow with a slight press effect; result cards, history entries, and related rows take a full-width hover wash; form controls show focus rings
- Toasts for saves, deletions, copies, and index completion slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, all cards appear immediately, the panel and palette appear instantly, and re-ranking applies without movement
</motion>

<responsiveness>
- At widths of 768 pixels and below, the left rail collapses behind a toggle control that opens it as an overlay, and the detail panel becomes a full-width overlay; at desktop widths both are docked
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; chips rows wrap or scroll within their own container
</responsiveness>

<accessibility>
- Every interactive control — the search input, slider, chips, feedback controls, disclosures, palette entries, history checkboxes, and run controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The command palette and modals trap focus while open, close on Escape, and return focus to the control that opened them
- Completion of a re-index run, and a step entering the failed state, are announced through an aria-live region as well as shown visually
- Result-count changes from threshold or filter changes are announced politely so keyboard users hear the narrowed count
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- Query results, palette matches, and threshold filtering render with no perceptible lag — updates land within roughly 100 milliseconds of input
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — fast typing in the palette, rapid slider drags, quick feedback clicks — with no hangs, including while a re-index run is advancing
</performance>

<writing>
- Headings, panel titles, and buttons use one consistent capitalization convention throughout
- Action labels are specific verbs such as Save search, Index now, Download report, and Copy report rather than generic labels
- Validation and empty-state copy names the problem and the fix; the no-results state explains what to loosen; no placeholder text appears anywhere in the shipped UI
- Similarity scores render with two decimals everywhere; timestamps use one consistent format across history, steps, and the event timeline
</writing>

<innovation>
- Optional enhancements the builder may add, none required for a passing build: a per-topic color coding carried between clusters and tags; a keyboard-shortcut reference overlay; a spark-line of result-count history per saved search; query suggestions derived from the corpus
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the document corpus, the index state (built and stale sets, statistics), the active query with its parsed chips and threshold, ranked results and per-query feedback, per-result disclosure and selection state, cluster grouping state, history and saved searches with bulk-selection state, the compare view's selections, re-index run state (per-step statuses, attempts, checkpoints, event timeline, rollups), undo and redo stacks, palette state, export modal state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Running a query computes rankings from the current corpus, feedback, and filters; the results, count, clusters, compare view, and Search report export all derive from the same ranked data
- Adding, deleting, bulk-deleting, or importing documents updates the corpus, the index statistics, the stale count, and any visible results from the one shared collection
- Feedback, threshold, chips, and grouping recompute the visible list from shared state; they do not create a second disconnected copy
- Advancing an ingest step updates the step list, the event timeline, the rollup, and the status bar from the same shared run state; pause and resume preserve completed steps
- Undo and redo operate on the same shared state the visible controls mutate
- End-state contract: Download and Copy for Search report and Library package MUST reflect the session's actual query ranking, feedback, documents, and saved searches under the field contracts above — an export that omits session work is invalid; Import of a previously exported Library package MUST restore the same visible corpus and saved list (round-trip). Persistence for this good-app genre is the portable Library package plus the MCP query surface — never browser storage
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — tiles, tags, sliders, modals, notifications, data displays, and form controls; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — Save search, Add document, and Import library package — are driven by React Hook Form validating through a Zod schema: the schema defines the API-shaped field contracts (DocumentUpsert, SavedSearch, SearchReport, LibraryPackage) and inline per-field errors render before submit. The record each form creates is exactly the object shape that appears in the matching export for that entity — same field names and nesting. Similarity is computed client-side (TF-IDF cosine similarity or equivalent) over the seeded corpus — no external embedding API, no backend, no authentication. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least 120 documents on first load, spanning at least 6 topics and using all six closed document types (guide, reference, prompt, checklist, paper, note), with realistic multi-sentence bodies and tags, so searches return meaningfully varied results and the full list exercises smooth scrolling
- Simulated re-indexing uses realistic per-document latency and occasional simulated failures, so two runs are not byte-identical in timing
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- Browsable entity: documents
- Destinations: results; document-detail; history; saved-searches; compare; index-panel; export-report
- Filters: tag; type; before; similarity-threshold; group-by-topic; timeline-status
- Sorts: similarity-desc
- Entity: document
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; body; type; tags; feedback; saved-search-name; history-selection; compare-selection
- Session operations: start; pause; resume
- Demos: reindex-run
- Artifact operations: export; copy
- Export formats: search-report-json
- Value bounds: similarity threshold 0.0-1.0 in 0.05 increments; feedback in {up, down, none}; score rendered with two decimals between 0.00 and 1.00; document title and body required; type from the seeded type select; saved-search name non-empty and unique; keyword fallback engages when no semantic result reaches 0.2; delete and bulk delete require confirm=true
- Workflow completion: running a query renders cards sorted by descending score with a matching result count; chips from tag:/type:/before: tokens render above the results and removing one re-runs without it
- Workflow completion: thumbs-up visibly boosts a card's position and score with a feedback marker; Reset Feedback restores the unadjusted order
- Workflow completion: adding a document raises the stale count and it appears in search results only after the re-index run completes, when the stale count returns to zero
- Workflow completion: pause freezes the re-index at the current document and resume continues there; the rollup and event timeline track the same steps
- Workflow completion: compare view marks overlap and unique documents with counts consistent with both result sets
- Workflow completion: the export report JSON parses, and its request (query, filters, threshold) and results (id, title, type, score, snippet, highlights, feedback) match the on-screen state

Mechanics exclusions:
- Command palette Cmd+K, per-keystroke fuzzy matching, and ArrowUp/ArrowDown result-card selection are keyboard mechanics graded via Playwright
- Why-this-ranks disclosure chevron rotation and contribution-bar grow-from-zero animations stay Playwright-observed
- Result-card staggered animate-in and feedback re-rank slide movement stay Playwright-observed — a WebMCP feedback call may set state but the movement is graded through the real controls
- Detail side-panel slide, breadcrumb trail navigation clicks, and smooth scrolling of the full 120-document result list stay Playwright-observed
- Undo/redo are graded through the real toolbar controls; clipboard contents of Copy report are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
