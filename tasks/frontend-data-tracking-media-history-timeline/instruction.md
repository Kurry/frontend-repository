<summary>
Build a media history timeline explorer using React, Jotai, Tailwind CSS 4.3.2, and Mantine.
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
- The app opens directly on the timeline stage — a brand header, a canvas year axis with event pins, and a footer scrubber — with no marketing landing, login, or backend request
- The stage plots pins by year across a wide span (roughly 3200 BCE to 2024 CE), positioning each pin from the visible year window; the initial window opens on a bounded default range (for example ~1450–1920) rather than the full span
- Panning the stage by drag shifts the pins, wheel-zoom widens or narrows the visible year window about its midpoint, and shift-scroll (or horizontal scroll) slides the window earlier or later in time — all live, without reload
- A dual-handle footer scrubber sets the visible from/to years (the handles cannot cross and keep a minimum gap) and a Full span control fits the entire corpus; a readout shows the current year range in BCE/CE form
- The canvas axis draws era bands (about seven labelled eras across the span) and adaptive year ticks; pins carry their category color and are culled when scrolled off-screen
Feature: Timeline events collection (API-shaped records) —
- Primary collection — timeline events: seed a substantial corpus (on the order of dozens; target roughly 60), each event carrying the fields of a timeline-event API record: title (required non-empty string), year (required integer; negative for BCE; must be between -3200 and 2024 inclusive), place (required non-empty string), categories (required array of one or more tags drawn from the seeded category set of about a dozen), summary (required non-empty string), and detail (required non-empty string)
- The collection supports create, edit, and delete of at least a user-managed set (the seeded corpus may stay read-only beside user events, or all events may be editable)
- The create and edit forms validate per field against that contract: an inline error message naming the field appears next to an empty title, an empty place, an empty summary, an empty detail, a missing categories selection, or an out-of-bounds/non-integer year before submit, and the submit control stays disabled until every required field is valid
- A valid create produces a record whose visible fields match the submitted payload shape (title, year, place, categories, summary, detail) in the Library row and detail panel
Feature: Modes, library, and filters —
- At least two interaction modes: Scrub/Explore mode (pan, year window, pins on the stage) and Library/Filter mode (a searchable, filterable event list with create/edit forms)
- The Library list scrolls smoothly through the full seeded corpus with no blank gaps or hitching, and rows appear as they enter the viewport while scrolling fast through the list
- Filtering combines a category/band filter (toggling roughly a dozen categories, where an event shows when any of its categories is active), a live text search across title/place/summary/detail, and the year window — all recomputing the visible pins and list from the shared collection, sorted chronologically
- A live category tally strip (or equivalent readout) shows counts per active category for the currently visible filtered set and recomputes when filters, search, year window, create, edit, delete, bulk actions, undo, or redo change the set
- Chrome controls: Filters opens a drawer, About opens an in-page modal, and Reset filters restores the default categories, clears the search, and returns to the default year window
Feature: Detail panel —
- Selecting a pin opens an in-page detail panel with a kicker (year · place), title, category pills, summary, and detail, plus Previous/Next controls that step through the sorted, filtered events with wraparound; closing returns to the stage without leaving the page
Feature: Bulk library actions —
- In Library/Filter mode, each row has a checkbox; a select-all control targets the currently filtered rows; bulk Set category applies one chosen category to every checked row (merging into each event's categories array without removing unrelated tags); bulk Delete removes every checked row after an explicit confirm step
- Bulk actions update the Library list, stage pins, category tally, and any open selection or detail in the same session without a reload
Feature: Undo and redo —
- Toolbar Undo and Redo controls step through create, edit, delete, bulk Set category, and bulk Delete mutations; each control is disabled when there is nothing to undo or redo
- Undoing a create removes that event and restores Library rows, stage pins, and the category tally to the prior values; redoing reapplies the mutation
Feature: Timeline pack export and import (useful end state) —
- The app produces the operator's timeline pack: an Export timeline control opens a drawer with Timeline JSON and Events CSV tabs compiled LIVE from the current store
- Normative Timeline JSON shape (all keys and nesting required; example values illustrative only): {"version":1,"yearWindow":{"from":1450,"to":1920},"activeCategories":[""],"search":"","events":[{"title":"","year":0,"place":"","categories":[""],"summary":"","detail":""}],"totals":{"eventCount":0,"byCategory":[{"category":"","count":0}]}}. yearWindow matches the live scrubber bounds; activeCategories and search match the live filters; events lists every event in the current collection with the API field contract above; totals.eventCount equals the collection length; totals.byCategory lists every seeded category with its live count across the full collection (not only the filtered view)
- The Events CSV tab shows CSV-shaped text with header line title,year,place,categories,summary,detail and one data line per current event; categories on a line are joined with a pipe character
- Both tabs MUST reflect every create, edit, delete, bulk Set category, bulk Delete, undo, and redo made in the session — an export that omits session work is a failure. After two creates with distinct titles, a fresh export must contain both titles
- Download JSON offers a real file download named timeline-pack.json whose body matches the JSON tab. Download CSV offers timeline-events.csv whose body matches the CSV tab. Copy on the active tab puts that tab's text on the clipboard and shows a visible Copied confirmation that clears within 3 seconds
- An Import timeline control accepts a previously exported Timeline JSON (file picker or paste). A successful import replaces the events collection and restores yearWindow, activeCategories, and search from the document; the Library list, stage pins, scrubber readout, filters, category tally, and a subsequent export all match the imported pack. Malformed JSON or a document missing required keys/fields shows a visible inline error naming the import field and changes nothing
- Zero outbound navigation — exploration stays on the local app
</core_features>

<user_flows>
End-to-end flows (state stays coherent across the stage, the Library list, derived readouts, and export previews, without any reload):
- Create flow: submitting a valid new event from Library/Filter mode adds exactly one row to the Library list, increases any visible event count by exactly one, updates the category tally for that event's categories, and — when the event's year lies inside the current year window and its category is active — a new pin for it appears on the stage after switching back to Scrub/Explore mode, all without a reload
- Edit flow: editing an event's title or year updates the same record everywhere it appears — the Library row text, the pin position on the stage when the year changed, the open detail panel when that event is selected, and a subsequent export's matching event object — without a reload
- Delete flow: deleting an event removes its Library row, removes its pin from the stage, clears it from any open selection or detail panel, decreases the visible count by exactly one, and drops it from the next export
- Filter flow: toggling a category off removes that category's pins from the stage and its rows from the Library list at the same time; toggling it back on restores both; narrowing the year window with the scrubber drops out-of-range events from both surfaces simultaneously; the category tally recomputes with each change
- Detail stepping flow: with a search or category filter active, opening a detail and pressing Next steps only through the currently filtered, chronologically sorted events and wraps from the last back to the first; the stage highlight follows the stepped selection
- Bulk flow: checking at least 2 Library rows and applying bulk Set category adds the chosen category to each checked event's categories in the list and on the stage; bulk Delete with confirm removes every checked row and the visible count drops by exactly that number
- Undo flow: after creating an event, Undo removes that row, decrements the visible count by exactly one, and restores the category tally; Redo restores the created event and prior derived numbers
- Export flow: after creating an event titled Signal Tower Demo and a second titled Evening Broadcast, open Export timeline; the JSON tab's events array contains both titles, totals.eventCount equals the live collection length, and yearWindow matches the scrubber readout; the CSV tab contains both title strings; Download JSON and Download CSV offer timeline-pack.json and timeline-events.csv; Copy shows Copied
- Import round-trip flow: export JSON after mutations, delete all user-managed events (or clear to empty where allowed) so the empty state shows, then Import that JSON — the Library list, stage pins, year window, filters, and category tally reconstruct to match the export, and a fresh export's events array matches
- A page reload returns the app to its seeded state: the seeded corpus, the default categories, an empty search, the default year window, and empty undo/redo stacks
</user_flows>

<edge_cases>
- Empty state: when the filters, search, and year window match nothing — or when all user-managed events are deleted — the list/stage region shows a visible empty state with a message and a control to reset filters or create an event
- Invalid create: an empty title, empty place, empty summary, empty detail, missing categories, or invalid year must not add an event — the visible count is unchanged — and visible validation feedback names the offending field
- Year bounds: a year below -3200 or above 2024, or a non-integer year, is rejected with an inline error naming year and does not change the collection
- Double-activating the create form's submit control adds exactly one event: the count increases by one and one new row appears
- The scrubber handles cannot cross: dragging one handle into the other stops at the minimum gap, and the range readout never shows an inverted range
- The Full span control always fits the entire corpus, even after the window was zoomed to a narrow slice
- A very long event title is truncated with an ellipsis in the Library row and shown in full in the detail panel
- Bulk Set category and bulk Delete with no rows checked perform no destructive change: the collection and pins stay as they were
- With an empty user-managed set (or empty collection where allowed), Export timeline still produces JSON with version 1, the live yearWindow/filters, an events array covering remaining seeded rows (or empty if none remain), and totals that match; Copy still shows Copied
- Importing malformed JSON or a pack missing required event fields shows an inline error naming the import field and leaves the collection, filters, and stage unchanged
- Undo with nothing to undo leaves the collection unchanged; Redo with nothing to redo leaves the collection unchanged
</edge_cases>

<visual_design>
- Product name MediaHistoryTimeline with History of Media and Communication as the brand signal; first viewport is the timeline tool itself
- Expressive typography (not Inter/Roboto/system defaults); warm or cool paper stage atmosphere with CSS variables
- Primary composition: full-bleed or primary stage viewport plus scrubber/footer; Library/Filter is a distinct panel or mode, not a competing marketing hero
- Event pins or list rows show category color; detail uses clear hierarchy (kicker, title, body)
- Icons across the chrome (mode switch, filters, about, undo/redo, export/import, form controls) come from one consistent icon set with a uniform stroke style
- Component states: buttons, inputs, and scrubber thumbs show distinct default, hover, focus, and disabled treatments; form fields show a distinct error treatment; Undo and Redo show a disabled treatment when their stacks are empty
- The export drawer shows Timeline JSON and Events CSV tabs with a scrollable preview, Download, and Copy affordances
- Empty filter/collection state is visually present in the list region
- The category tally strip is visually distinct from the Library rows and updates without layout jump that obscures the list
</visual_design>

<motion>
- Stage pan/scrub updates the year window and pin positions live without page reload
- Event detail opens/closes with short opacity/transform settle
- Mode switch between Scrub/Explore and Library/Filter updates the canvas without full reload
- Creating an event animates its row into the Library list, and deleting an event animates the row out rather than snapping; the surrounding rows slide smoothly into place; bulk Delete animates each removed row rather than snapping the list
- The Filters drawer, About modal, and Export drawer enter and exit with a short slide/fade transition rather than appearing instantly
- Feedback messages (validation errors, Copied confirmation, import errors) appear with visible motion — a short slide or fade — and dismiss the same way
- Hover animations (required): pins or list rows scale/glow or take a hover wash; scrubber thumbs and chrome buttons brighten on hover; focus-visible rings on interactive controls
- Respect prefers-reduced-motion by shortening non-essential fades while keeping pan/scrub/filter functional
</motion>

<responsiveness>
- At desktop widths (1024 pixels and up) the stage, scrubber, and chrome controls are all visible without horizontal scrolling
- At widths of 768 pixels and below, the chrome reflows — the header controls stack or collapse and the Library/Filter surface uses the full width — while the stage, scrubber, filtering, detail panel, and export drawer all remain usable
- No content clips or overflows the viewport, and no horizontal page scrolling appears at 375 pixel width
- The export drawer and import control stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Keyboard: Escape closes the topmost of About, the Filters drawer, the Export drawer, or the detail panel; ArrowLeft/ArrowRight step Previous/Next while a detail is open (suppressed while typing in a field)
- Every chrome control (mode switch, Filters, About, Reset filters, Undo, Redo, Export timeline, Import timeline, form fields, scrubber thumbs, bulk actions) is reachable and operable with the keyboard alone, with a visible focus indicator
- The About modal, Filters drawer, and Export drawer use dialog semantics, trap focus while open, and return focus to the control that opened them on close
- Form validation messages and import errors are exposed to assistive technology as well as shown visually
- Copied confirmations are announced through an aria-live polite region and never trap focus
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app — panning, zooming, filtering, creating, editing, deleting, bulk actions, undo/redo, exporting, importing, and stepping through details
- Panning and scrubbing the stage stay smooth with no visible hitching while the pins reposition, and scrolling the Library list fast stays smooth through the full corpus
- Opening the export drawer and switching between Timeline JSON and Events CSV regenerates the preview without freezing the UI
</performance>

<writing>
- Headings, buttons, and category labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Add event, Reset filters, Export timeline, Import timeline, Undo, and Redo rather than generic labels where a specific one is possible
- Validation messages name the field and the fix; import errors name the import field; the empty state explains what matched nothing and how to recover; no placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<innovation>
- Beyond the required timeline tool, reward a polished archive-operator touch that helps trust the session pack — for example a compact export summary naming eventCount and the active year window above the preview, keyboard shortcuts for Undo/Redo, or a last-mutation chip naming the most recent create/edit/delete — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
Shared application state must use Jotai, the state library named in summary (in-memory only): events collection, visible year window, filters/selection, active mode, detail open state, undo/redo history, export drawer state, and import diagnostic state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid event increases the collection and shows it in Library/Filter and on the stage when in range; the record matches the timeline-event API field contract
- Editing an event updates that same record in list, pins, detail, and exports
- Deleting an event removes it from list, stage, selection, counts, and exports
- Filters and year window recompute visible events from the shared collection; they never create a second disconnected copy
- Active mode and selection are shared client state; switching modes does not reload the document
- Export JSON and CSV are compiled live from the shared store; Import replaces that same store and filter window fields
- The timeline pack export is the session's useful end state: Download and Copy must emit live-compiled JSON or CSV that reflects every mutation; Import round-trips a valid Timeline JSON back into the visible surfaces
Stack: React + Jotai + Tailwind CSS 4.3.2 (pinned; Vite or equivalent SPA). Mantine is the component library for the chrome — the Filters drawer, About modal, Export drawer, form inputs and selects, category pills, and feedback toasts; Mantine keeps its component styles while Tailwind owns layout, spacing, and the custom stage surfaces.
- Motion for React and AutoAnimate are allowed for animation; no other animation libraries
- Tabler icons via @tabler/icons-react only; no other icon sets, no raw copy-pasted SVG icons
- All forms (event create and edit, import paste) are driven by React Hook Form with a Zod schema: the schema defines the validation rules mirroring the timeline-event API payload and the form surfaces inline per-field errors before submit
- The Library event list is virtualized with TanStack Virtual so scrolling the full corpus stays smooth
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- Seed a substantial corpus (on the order of dozens, target roughly 60 events) spanning roughly 3200 BCE to 2024 CE, categorized under about a dozen color-coded categories and grouped by about seven labelled eras; seed enough user-editable events or allow create from an empty user set with a clear empty state
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all user-managed events (or filtering to zero matches), show an empty state in the list region
- Zero outbound navigational links; document title reflects MediaHistoryTimeline
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
- Destinations: timeline; event-detail; filters; library; export-drawer
- Filters: category; search
- Entity: event
- Entity operations: create; select; update; delete
- Entity fields: title; year; place; categories; summary; detail
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: timeline-json
- Workflow completion: export drawer preview updates after create/edit/delete and includes the mutated event title
- Workflow completion: importing timeline-json replaces the events collection so Library list and stage pins match the imported document

Mechanics exclusions:
- Scroll/scrub timing stays Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Clipboard contents of Copy are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
