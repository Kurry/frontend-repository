<summary>
Build a media history timeline explorer using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
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
Feature: Timeline stage —
- The app opens directly onto the timeline exploration stage (axis, era bands, event pins) with a year scrubber and filter controls; no marketing landing, login, or backend
- Two interaction modes: Scrub/Explore mode (drag to pan the stage, wheel to zoom the year window around its midpoint, Shift+wheel or a dominant horizontal wheel to translate the window) and Library/Filter mode (search + category filters + create/edit forms)
- A dual-handle year scrubber sets the from/to window with a formatted BCE/CE readout; numeric year from/to inputs set the same window; a fit-all/reset control returns to the full span or the default window
- Named era bands wash the stage behind the axis using exactly these five labels: Oral Tradition, Manuscript Age, Print Revolution, Broadcast Era, and Network Age; a current-era label reflects the era at the window midpoint and updates as the window moves
- Event pins carry their category color at year positions; hovering an unclustered pin reveals a label with title, place, and BCE/CE year, and same-year or overlapping pins offset so each stays individually clickable
- Clicking a pin opens an in-page detail (panel/popup) showing kicker (year · place), title, type, category, mediaRefs, and body; Previous/Next controls and the left/right arrow keys step through the currently filtered events, and Escape or a close control returns to the stage without leaving the page
- An About/help overlay opens in-page with how-to copy and no outbound links
- Zero outbound navigation — exploration stays on the local app

Feature: TimelineEvent request-body field contract —
- Primary collection is timeline events: seed a dense corpus on the order of ~60 events spanning the ten closed categories and the five named eras below; create, edit, and delete are supported for at least the user-managed events (the seeded corpus may stay read-only alongside them)
- TimelineEvent field contract (API-shaped media-event / timeline-entry payload; the record a successful create/edit produces IS the would-be request body; Timeline JSON export and import share this event object shape; all keys required unless marked optional; example values illustrative only):
  - title: trimmed non-empty string of 1 to 120 characters
  - type: exactly one of Milestone, Invention, Release, Publication, Broadcast
  - timestamp: ISO-8601 datetime string ending with Z (example shape 1455-01-01T00:00:00.000Z)
  - mediaRefs: non-empty array of 1 to 8 strings; each entry is a trimmed non-empty media reference label of 1 to 64 characters (catalog keys or asset ids the operator would send to a media API)
  - year: integer from -4000 through 2100 inclusive (negative for BCE); this is the timeline-axis year used by the scrubber and pins
  - place: trimmed non-empty string of 1 to 80 characters
  - categories: non-empty array of one or more labels drawn only from the closed set Print, Broadcast, Photography, Cinema, Computing, Networks, Audio, Typography, Publishing, Telecom
  - summary: trimmed non-empty string of 1 to 2000 characters
  - source: non-empty string on every stored event (seeded events carry a corpus source label; user-managed creates default source to user when the form omits it)
- Cross-field rules: categories must contain only closed-enum labels and at least one entry; mediaRefs must contain at least one entry and at most eight; type must be exactly one closed-enum value; when year is greater than or equal to 1, the UTC calendar year of timestamp MUST equal year; when year is less than 1 (BCE), timestamp MUST be exactly 0001-01-01T00:00:00.000Z while year carries the BCE axis value
- Category filters expose exactly those ten closed enum labels (all enabled by default) plus a free-text search over title/place/summary; a clear-filters control restores every category and the default year range
- The create and edit forms validate every TimelineEvent field before submit: an empty title, a type outside the closed enum, a timestamp that is not an ISO-8601 string ending with Z or that breaks the year cross-field rule, empty or over-limit mediaRefs, year outside -4000..2100 or non-integer, empty place, empty summary, or zero categories shows an inline error message naming that field next to it, and the submit control stays disabled or rejects submission until the contract is satisfied; create/edit forms collect title, type, timestamp, mediaRefs, year, place, categories, and summary (source may default as above)
- An event-count readout (N events in view) and a result note (Showing N of M catalogued events, or a search-matched count) track the visible set
- A category density strip lists each enabled category with a live count of events currently in view; narrowing the year window, toggling a category, searching, creating, editing, deleting, bulk actions, undo, or redo recomputes those counts in the same interaction
- Library/Filter supports Year ascending and Year descending sorts that reverse visible row order; the Library/Filter event list scrolls smoothly through the full seeded corpus with no blank gaps or stutter while scrolling rapidly from top to bottom

Feature: Bulk library actions —
- In Library/Filter mode, user-managed rows support multi-select checkboxes; selecting two or more reveals a selection tray with Batch categorize and Batch delete
- Batch categorize applies one chosen closed-enum category to every selected user-managed event at once, replacing that event's categories with exactly that one label, and updates list badges, pin colors, density counts, and the Timeline JSON export preview
- Batch delete, after an explicit confirmation naming the selected count, removes every selected user-managed event; seeded read-only events are never rewritten or removed by bulk actions
- Bulk actions with zero selected rows do nothing and show no confirmation; the tray stays hidden until at least one row is selected

Feature: Undo and redo —
- Toolbar Undo and Redo step through create, edit, delete, batch categorize, batch delete, and import mutations; each control is disabled when its stack is empty
- After deleting a user-managed event, Undo restores that event's row, pin, and counts; Redo deletes it again; after a new create following an undo, Redo is disabled

Feature: Timeline pack export and import (useful end state) —
- The app produces the operator's timeline pack: an Export timeline control opens an export drawer with three live-derived format tabs — Timeline JSON, Events CSV, and Window Markdown — compiled LIVE from the current store
- Normative Timeline JSON shape (all keys and nesting REQUIRED; example values illustrative only): {"version":1,"document":"media-timeline","window":{"fromYear":1450,"toYear":1920},"enabledCategories":[""],"eras":[{"name":"","fromYear":0,"toYear":0}],"events":[{"title":"","type":"Milestone","timestamp":"1455-01-01T00:00:00.000Z","mediaRefs":[""],"year":1455,"place":"","categories":[""],"summary":"","source":""}]}. document is exactly media-timeline; window.fromYear and window.toYear match the live scrubber bounds; enabledCategories matches the live enabled category filters; eras lists the five named eras with their fromYear/toYear bounds; events lists every event in the current collection conforming to the TimelineEvent field contract including type, timestamp, mediaRefs, and source
- Events CSV shows CSV-shaped text with header line title,type,timestamp,mediaRefs,year,place,categories,summary,source and one data line per current event; categories on a line are joined with a pipe character; mediaRefs on a line are joined with a semicolon
- Window Markdown shows a markdown document whose heading names the live year window in BCE/CE form, lists the enabled categories, and lists every currently in-view event by title, type, and year; narrowing the window or toggling a category changes this preview
- All three tabs MUST reflect every create, edit, delete, batch categorize, batch delete, undo, redo, and import made in the session — an export that omits session work is a failure. After two creates with distinct titles, a fresh Timeline JSON and Events CSV must contain both titles, and each events entry must carry type, timestamp ending with Z, and mediaRefs
- Copy on the active tab puts that tab's exact preview text on the clipboard and shows a brief confirmation; Download starts a real file download of the same preview text (timeline-pack.json, timeline-events.csv, or timeline-window.md matching the active tab)
- An Import timeline control accepts a previously exported Timeline JSON (file pick or paste). A successful import replaces the events collection and restores window and enabledCategories from the document so library titles, types, years, mediaRefs, pins, density counts, year window, and a subsequent export match the imported pack. Malformed JSON, document not exactly media-timeline, missing required keys, or any events entry that breaks the TimelineEvent field contract (including type enum, timestamp ISO/Z, mediaRefs bounds, or year/timestamp cross-field) shows a visible inline error naming the offending field and changes nothing
</core_features>

<user_flows>
User flows (end-to-end state coherence across views):
- Creating a valid event in Library/Filter mode (title, type, timestamp, mediaRefs, year, place, categories, summary satisfying the TimelineEvent contract) adds exactly one row to the event list showing title and type, increases the Showing N of M catalogued events readout by one, increments the matching density count, includes the new title with type, timestamp, and mediaRefs in Timeline JSON and Events CSV previews, and switching to Scrub/Explore mode shows the new event's pin at its year position (when in the visible window) without a page reload
- Editing a user-managed event's title, type, timestamp, mediaRefs, or year updates that same record in the library list row, in its stage pin position and hover label, in any open detail panel, and in Timeline JSON / Events CSV export previews, all without a reload
- Deleting a user-managed event removes its list row, removes its pin from the stage, clears it from any open detail or selection, decreases both the event count readout and the in-view count by one, and removes it from the export previews
- Disabling a category filter removes that category's pins from the stage, drops the same events from the library list, lowers the N events in view readout, and updates the density strip immediately; re-enabling or using clear-filters restores the pins, rows, counts, and density exactly
- Narrowing the year window with the scrubber lowers the N events in view readout to only events inside the window, updates the current-era label to the era at the new midpoint, updates Window Markdown, and the numeric from/to inputs show the same bounds the scrubber set
- Switching Library year sort from Year ascending to Year descending reverses visible row order; switching back restores the prior order
- Stepping through events with Previous/Next in the detail panel follows the currently filtered order: after applying a category filter, stepping never lands on an event from a disabled category
- Batch categorize flow: selecting two user-managed events and Batch categorizing them to Photography sets both categories to Photography only in list badges, density counts, and the Timeline JSON preview; Undo restores prior categories
- Batch delete then undo flow: selecting two user-managed events, confirming Batch delete, then Undo restores both events and the prior catalogued count; Redo deletes both again
- Export flow: after creating an event titled Signal Tower Demo with type Milestone, timestamp 1920-01-01T00:00:00.000Z, mediaRefs containing signal-tower-demo, and a second titled Evening Broadcast with type Broadcast, open Export timeline; the Timeline JSON events array contains both titles with matching type/timestamp/mediaRefs, window matches the scrubber, and Events CSV contains both title strings under the contract header; Copy shows confirmation and Download offers the active format file
- Import round-trip flow: after mutating the collection, Copy or Download Timeline JSON then Import that same JSON reconstructs library titles, types, years, mediaRefs, enabled categories, year window, density counts, and export previews to the pre-export mutated state
- A page reload returns the app to its seeded state: the seeded corpus, default year window, all categories enabled, empty undo/redo stacks, no selection, and no user-created events
</user_flows>

<edge_cases>
- Submitting the create form with an empty title, a type outside the closed enum, a timestamp that is not ISO-8601 ending with Z or that breaks the year cross-field rule, empty mediaRefs, year outside -4000..2100, empty place, empty summary, or zero categories shows visible per-field validation feedback naming the failing fields and adds no event; the collection count does not change
- An empty state appears in the list/stage region when filters or the year window match nothing, or when all user-managed events are deleted, with a message and a control that restores filters or opens the create flow
- Same-year or overlapping pins offset so each remains individually hoverable and clickable
- Double-activating the create form's submit control adds exactly one event: the count increases by one and one new row appears
- Zooming fully out or using fit-all always shows the full seeded span; zooming keeps the window midpoint stable so events do not jump sides
- Batch delete or Batch categorize with zero selected rows does nothing; the tray stays hidden until at least one row is selected
- Bulk categorize and bulk delete never rewrite or remove seeded read-only events even when those rows are visible
- Importing malformed Timeline JSON or an events entry that breaks the TimelineEvent contract (bad type, non-Z timestamp, empty mediaRefs, or year/timestamp mismatch) shows an inline error naming the failing field and leaves events count and titles unchanged
- With only seeded events remaining (or an emptied user-managed set), Export timeline still produces Timeline JSON with document media-timeline, the live window/enabledCategories, and events covering remaining rows each carrying type, timestamp, and mediaRefs; Copy still shows confirmation
- Undo with nothing to undo leaves the collection unchanged; Redo with nothing to redo leaves the collection unchanged
- After Undo restores a deleted event, Redo deletes it again; after a new create following an undo, Redo is disabled
</edge_cases>

<visual_design>
- Product name MediaTimeline with History of Media and Communication as the brand signal; first viewport is the timeline tool itself
- Expressive typography (not Inter/Roboto/system defaults); warm or cool paper stage atmosphere with CSS variables
- Primary composition: full-bleed or primary stage viewport plus scrubber/footer; Library/Filter is a distinct panel or mode, not a competing marketing hero
- Event pins or list rows show category color; detail uses clear hierarchy (kicker, title, type, mediaRefs, category, body)
- A single icon set is used consistently across chrome controls (mode switch, filters, close, navigation, undo/redo, export); no mixed icon styles
- The export drawer shows Timeline JSON, Events CSV, and Window Markdown tabs with a monospaced preview and Copy / Download actions; the selection tray appears in Library/Filter when multi-select is active; the category density strip reads as a compact tally near filters or scrubber
- Empty filter/collection state is visually present in the list region
- Component states: buttons, inputs, and scrubber thumbs show distinct default, hover, focus, and disabled treatments; Undo and Redo show a disabled treatment when their stacks are empty
</visual_design>

<motion>
- Stage pan/scrub updates the year window and pin positions live without page reload
- Event detail opens/closes with short opacity/transform settle
- Mode switch between Scrub/Explore and Library/Filter updates the canvas without full reload
- Creating an event animates its list row in; deleting an event animates its row out rather than snapping; bulk Delete animates removed rows
- The export drawer opens via the real Export timeline control with a short slide rather than snapping open
- Validation errors and the empty state appear with a short fade or slide rather than popping in
- Feedback toasts after create, delete, bulk actions, export copy, or import slide in, remain readable, and auto-dismiss with a fade
- Hover animations (required): pins or list rows scale/glow or take a hover wash; scrubber thumbs and chrome buttons brighten on hover
- Respect prefers-reduced-motion by shortening non-essential fades while keeping pan/scrub/filter functional
</motion>

<responsiveness>
- At widths of 768 pixels and below, the stage and Library/Filter stack or the library becomes a drawer/sheet; both modes stay reachable and usable
- No content clips or overflows the viewport and no horizontal page scrolling appears at 375 pixel width; the scrubber remains operable at that width
- Export drawer, undo/redo, selection tray, and density strip stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control (mode switch, scrubber thumbs, year inputs, filters, pins or their list equivalents, detail navigation, undo/redo, export drawer controls, selection checkboxes, bulk actions) is reachable and operable with the keyboard alone, with a visible focus-visible ring
- The detail panel/popup, About overlay, export drawer, and batch-delete confirmation behave as dialogs: Escape closes them and focus returns to the control that opened them; the export drawer traps focus while open
- Left/right arrow keys step Previous/Next through the filtered events while the detail is open
- Create, delete, bulk actions, export copy, and import completion are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during load or a full exercise of scrubbing, zooming, filtering, creating, editing, deleting, bulk actions, undo/redo, exporting, and importing
- Rapid wheel zoom and continuous scrubbing update pins and readouts without hangs, visible hitching, or dropped interactions
- Opening the export drawer and switching among Timeline JSON, Events CSV, and Window Markdown regenerates the preview without freezing the UI
</performance>

<writing>
- Years render consistently in BCE/CE format everywhere they appear (scrubber readout, pins' hover labels, detail kicker, list rows, and Window Markdown headings)
- Validation messages name the field and the fix (title, type, timestamp, mediaRefs, year, place, categories, or summary); empty states explain what matched nothing and how to recover; import errors name the offending field
- Action labels use specific verbs such as Batch categorize, Batch delete, Export timeline, Copy, Download, Undo, and Redo
- Export drawer tab labels read exactly Timeline JSON, Events CSV, and Window Markdown
- The About/help copy explains both interaction modes in complete sentences with no placeholder text anywhere in the shipped UI
</writing>

<innovation>
- Beyond the required timeline tool, reward a polished curator touch that helps trust the session pack — for example a compact export summary naming event count and the active year window above the preview, keyboard shortcuts for Undo/Redo discoverable in the UI or About, or a last-mutation chip naming the most recent create/edit/delete — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
Shared application state must use Solid stores (in-memory only): events collection, visible year window, filters/selection, active mode, detail open state, undo/redo history, export drawer state, and import diagnostic state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid event increases the collection and shows it in Library/Filter and on the stage when in range; the record matches the TimelineEvent field contract including type, timestamp, and mediaRefs
- Editing an event updates that same record in list, pins, detail, and exports
- Deleting an event removes it from list, stage, selection, counts, and exports
- Filters and year window recompute visible events from the shared collection; they never create a second disconnected copy
- Active mode and selection are shared client state; switching modes does not reload the document
- Export Timeline JSON, Events CSV, and Window Markdown are compiled live from the shared store; Import replaces that same store and window/filter fields
- End-state contract: Download and Copy MUST emit the session's actual timeline pack under the field contracts above — an export that omits session work or drops type/timestamp/mediaRefs is invalid; Import of a previously exported conforming Timeline JSON MUST restore the same visible library, stage, window, categories, density, and a fresh export (round-trip)
Stack: Solid.js + Solid stores + Tailwind CSS 4.3.2 (pinned; design tokens in @theme), built with Vite or an equivalent SPA setup.
- Kobalte components for the app's dialogs/popovers (event detail, About overlay, export drawer, batch confirmation), selects, tooltips, and other primitive chrome
- Motion (motion.dev vanilla) allowed for animation; no other animation libraries
- Tabler icons via @tabler/icons-solidjs only; one set, used consistently; no raw copy-paste SVGs and no icon CDN
- All forms (create, edit, and import paste) are driven by TanStack Form for Solid or Felte paired with a Zod schema: the schema defines the validation rules mirroring the API-shaped TimelineEvent and Timeline JSON field contracts above (including type enum, ISO-8601 timestamp ending with Z, mediaRefs bounds, and year/timestamp cross-field); the form surfaces inline per-field errors before submit; a successful create/edit record IS the would-be request body; export and import validate through the same schemas
- The Library/Filter event list is virtualized with virtua so scrolling the full corpus stays smooth
- All libraries installed via npm and bundled locally; no CDN imports; fonts bundled locally
- Seed a dense corpus on the order of ~60 events across the ten closed categories and five named eras so first load is useful across zoom levels; seed enough user-editable events or allow create from an empty user set with a clear empty state; every seeded event conforms to the TimelineEvent field contract including type, timestamp, mediaRefs, and source
- Wheel zoom and Shift/horizontal-wheel pan recompute the year window; the current-era label, event-count readout, density strip, and Window Markdown follow the shared window and filters
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all user-managed events (or filtering to zero matches), show an empty state in the list region
- Zero outbound navigational links; document title reflects MediaTimeline
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
- Browsable entity: timeline-events
- Destinations: timeline; library; event-detail; filters; export-drawer
- Filters: category; search
- Sorts: year-asc; year-desc
- Entity: event
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; type; timestamp; media-refs; year; place; categories; summary; source
- Artifact operations: export; import; copy
- Export formats: timeline-json; events-csv; window-markdown
- Import modes: timeline-json
- Workflow completion: events-in-view-count
- Workflow completion: showing-of-total-count
- Workflow completion: current-era-label

Mechanics exclusions:
- Scroll-linked parallax / scrub timing stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard contents and downloaded artifact bytes stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
