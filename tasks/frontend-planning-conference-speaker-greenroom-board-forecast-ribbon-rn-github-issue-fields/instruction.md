<summary>
Build a conference speaker greenroom forecast board using React, Zustand, Tailwind CSS 4.3.2, and Radix UI. Its signature Forecast Ribbon adjusts a selected GitHub-linked speaker slot, compares projected outcomes, and produces a portable speaker-greenroom-v1-forecast-ribbon.json artifact.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Speaker Slots collection —
- The first load shows exactly eight deterministic speaker slots across draft and ready states, with no authored history, changed forecast, conflict, archive, export confirmation, validation receipt, or success state pre-seeded
- Selecting a slot highlights the same stable ID in the slot navigator, Forecast Ribbon, issue-field inspector, derived summary, and artifact preview without a reload
- Add slot opens a labeled dialog and creates exactly one API-shaped ConferenceSpeakerGreenroomBoardSession record after valid submit; Edit updates that stable record everywhere; Delete requires confirmation and removes it everywhere; Archive retains the record and history but removes it from active totals
- Every record has exactly these authored fields: id; speakerName; sessionTitle; track; room; startMinute; durationMinutes; status; issueNumber; releaseTag; forecastOffsetMinutes; duplicateOf; forecastRibbonState with state and order; provenance with source and release
- Exact field contract: speakerName is 2 through 80 trimmed characters; sessionTitle is 5 through 120; track is keynote, product, design, engineering, or community; room is Main Hall, Studio A, or Studio B; startMinute is an integer 480 through 1080 in five-minute steps; durationMinutes is 15 through 90 in five-minute steps; status is draft, ready, changed, or archived; issueNumber is integer 1 through 999999; releaseTag matches vMAJOR.MINOR.PATCH; forecastOffsetMinutes is -30 through 30 in five-minute steps; projected end stays at or before minute 1140
- Search supports plain speaker, title, or ID text and the bounded advanced terms status:value, track:value, and release:value; saved Ready, Keynotes, and Release 2.4 queries use the same live filter command; clearing search and filters restores the exact current collection order
- Sorting projected start ascending then descending reverses the live data order; Earlier and Later controls change the exact forecastRibbonState order without changing a stable ID
- Duplicate merge chooses one different existing source record, preserves its GitHub issue and release provenance, archives it with duplicateOf naming the selected target, and creates one canonical event
- Loading the performance fixture replaces the collection with exactly 104 deterministic non-completed records while keeping selection, search, forecast, export, and import usable

Feature: Forecast Ribbon —
- The selected record shows baseline window, projected window, GitHub issue and release lineage, current offset, and a text outcome stating clear or room conflict
- The range control accepts pointer and keyboard input from -30 through 30 minutes in five-minute steps; the exact number field, minus-five button, plus-five button, and range all call one canonical forecast command
- Applying a changed offset updates projected time, status, ribbon state, conflict count, on-time count, selected inspector, and artifact preview immediately, creates exactly one stable history event, and preserves the record ID
- The canonical event has contiguous sequence, stable eventId, forecast-adjust type, recordId, full before and after record snapshots, deterministic occurredAt, and a summary naming the input path; equivalent pointer, keyboard, button, exact-value, and WebMCP paths converge on the same field and event semantics
- An overlapping projected interval in the same room visibly enters conflict state; a non-overlapping projection enters changed state; resolving the offset recomputes the outcome from live records
- Undo and Ctrl or Cmd plus Z restore the complete prior snapshot including record values, ordering, selection, search, filters, derived summary, and history; redo reapplies it; a new mutation after undo discards the abandoned redo branch
- Cancel, range release at the existing value, invalid value, out-of-bounds value, rapid double activation, and unavailable reorder create zero additional events and leave every state facet unchanged

Feature: Portable artifact —
- Export JSON downloads exactly speaker-greenroom-v1-forecast-ribbon.json; Copy JSON copies the exact visible preview; every export regenerates exportedAt as an RFC3339 timestamp
- The artifact top level contains exactly schemaVersion, exportedAt, records, derived, and history; schemaVersion is speaker-greenroom-v1; records are stably sorted by forecastRibbonState.order then ID and retain the API-shaped fields above
- derived contains activeCount, changedCount, conflictCount, projectedOnTimeCount, projectedMinutes, and selectedId; every value equals the current visible summary and selected stable ID
- Clear session empties records, selection, summary, and authored history after confirmation while leaving Add slot and Import JSON available
- Import accepts pasted text or a selected JSON file and validates the complete document before committing; malformed JSON, wrong schema, unknown top-level keys, unknown enums, exact-bound violations, wrong steps, duplicate IDs or orders, dangling duplicate or history references, noncontiguous sequence or event IDs, cross-field contradictions, provenance mismatch, and stale derived values are all reported together
- Invalid import is atomic: it lists every record index, field, rejected rule, and correction while records, selection, order, filters, derived values, and history remain byte-for-byte unchanged
- Valid import restores authored records, stable ribbon ordering, selection, derived values, and authored history exactly; exporting, clearing, importing, and re-exporting is semantically identical except for regenerated exportedAt
</core_features>

<user_flows>
- Select slot-maya, adjust it from 0 to 15 minutes through the Forecast Ribbon, and confirm exactly one event, the same stable ID, changed projected time, changed or conflict outcome, derived count update, and matching export record; Undo restores every prior facet and the alternate exact-value path produces the same canonical event shape
- Add a valid slot tied to a new GitHub issue and release, edit its duration, apply a negative forecast, reorder it, then archive it; every linked surface and the artifact track the same stable record through the sequence
- Apply status:ready, switch to the saved Release 2.4 query, reverse projected-start sort, and clear all query state; each view derives from the current collection and returns to exact ribbon order
- Export the mutated session, clear it, import the exported JSON, select the same stable ID, and confirm record values, forecast ordering, selection, derived summary, and authored history match; only exportedAt differs on re-export
- Reload returns the good-app to exactly eight seeded records, slot-maya selected, zero authored events, zero changed forecasts, default order, and no confirmation because browser storage is unused
</user_flows>

<edge_cases>
- Exact minima and maxima are accepted for every bounded field, including offsets -30 and 30; each just-outside value and every wrong five-minute step is rejected with the field, rule, and correction named
- Projected time before 08:00 or ending after 19:00, a self or dangling duplicate target, duplicate stable ID or ribbon order, an archived selected contradiction, release/provenance mismatch, and overlapping intervals all have explicit visible outcomes rather than partial silent state
- Import diagnostics aggregate all defects in one report; correcting one field does not hide unrelated remaining defects
- Filtering to no results or clearing the session shows recovery copy and working Clear filters, Add slot, and Import JSON controls; active and projected totals are zero only when the collection is actually empty
- Rapid Add, Edit, Delete, Archive, Merge, Forecast, Import, Clear, Undo, and Export interactions never duplicate records, transactions, sequence numbers, or event IDs
</edge_cases>

<visual_design>
- The desktop workbench uses an intentional three-surface composition: a 280-pixel typed slot navigator, broad forecast canvas, and 320-pixel issue-field and artifact inspector under a compact six-value summary ribbon
- The Forecast Ribbon is the visual anchor: a pale layered forecast editor above horizontally ordered record cards, each with release badge, non-color status label, baseline-to-projected times, offset, outcome, and stable actions
- Palette uses ink #17211B, warm paper #F4F0E8, moss #3C6E57, amber #D99B45, failure coral #C95E55, mint #D7E9DD, and release blue #315F78; every status pairs color with text
- Typography uses a high-contrast display title, compact uppercase operational labels, legible workbench copy, and monospaced issue, release, event, time, and artifact values
- Selected, changed, conflict, archived, disabled, validation, hover, press, and focus states are visually distinct within one spacing, border, radius, and shadow system
- The interface reads as a conference release-planning instrument rather than a generic CRUD dashboard, using forecast vocabulary, GitHub issue lineage, timeline evidence, and exact before-versus-after comparison
</visual_design>

<motion>
- Applying a forecast through the real range, nudge, or exact-value control animates the selected ribbon card and changed outcome over roughly 180 to 240 milliseconds while summary values update immediately
- Add, delete, archive, duplicate merge, reorder, filter, undo, and import animate affected cards and surrounding layout rather than flashing or reloading
- Dialogs enter with a short opacity and scale transition; toasts slide in, remain readable, and fade without blocking controls
- Hover is required: buttons, filter chips, slot rows, ribbon cards, event rows, and artifact actions ease border, background, shadow, or translation; press feedback differs from hover
- With prefers-reduced-motion set, every timed transition and transform is removed while text labels, outlines, summary updates, and announcements preserve complete causal feedback
</motion>

<responsiveness>
- At 1440 pixels the navigator, forecast canvas, and inspector are simultaneously usable without page-level horizontal scrolling; only the ribbon card track scrolls within its surface
- At 900 pixels the workbench becomes three labeled Slots, Forecast, and Artifact steps; selection is retained between steps and the full signature flow stays available
- At 375 by 812 pixels every target is at least 44 by 44 pixels, cards stack without clipped content, forms use one column, dialogs fit the viewport, and no page-level horizontal overflow occurs
</responsiveness>

<accessibility>
- A skip link reaches the main workbench; headings and landmarks follow logical order; every interactive control has an accessible name and a visible focus indicator
- Pointer range input has keyboard arrow support; exact number and minus or plus buttons provide alternate paths that invoke the same canonical forecast command
- Add, edit, delete, clear, import, and export dialogs use dialog semantics, trap focus, close with Escape, and return focus to their opener
- Status, selection, conflict, validation, import diagnostics, summary changes, copy, forecast, undo, and import outcomes never rely on color alone and are announced through a polite live region
- Ctrl or Cmd plus Z invokes Undo outside text fields; focus remains on a meaningful control after slot, forecast, dialog, import, clear, and mobile-step actions
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load with no layout jump, console error, page error, non-local request, or browser-storage write
- With exactly 104 fixture records, a direct selection or forecast command acknowledges within 100 milliseconds, linked records and derived values settle within 500 milliseconds, and import or export completes within 2 seconds
- Rapid search, filter, selection, nudge, exact-value, undo, reorder, export, and import interactions remain responsive without stale surfaces, duplicate events, or unrelated cards rebuilding visibly
</performance>

<writing>
- Headings, actions, states, and errors use consistent sentence-case Conference forecast, Speaker slots, Forecast ribbon, GitHub issue, Release lineage, and Portable artifact terminology
- Action labels use domain verbs such as Add slot, Apply forecast, Compare outcomes, Merge into selected, Archive slot, Export JSON, and Validate and import rather than generic Submit or OK
- Errors name the field, rejected rule, and correction; empty states explain what is absent and the next action; no lorem, placeholder, copied brand, automation-directed, or criteria-mirroring text appears
</writing>

<innovation>
- Optional enhancements may add genuinely useful linked planning utility such as accessible conflict grouping, release comparison, guided saved queries, or alternate outcome visualization, provided they preserve the exact canonical state and artifact contract
</innovation>

<requirements>
Shared application state must use Zustand in memory only: records, forecastRibbonState order, selected ID, status filter, advanced query, saved query, sort, mobile step, dialogs, derived values, undo and redo snapshots, authored history, validation diagnostics, and artifact preview. Do not use localStorage, sessionStorage, IndexedDB, cookies, service-worker caches, URL persistence, or any other browser storage API.
State contracts:
- Visible controls and WebMCP tools invoke the same domain commands; stable IDs, typed fields, forecast values, derived values, selection, history, and export bytes agree after normalization
- Create, edit, delete, archive, duplicate merge, reorder, forecast adjust, import, clear, undo, and redo are atomic; invalid, cancelled, duplicate, and no-op actions mutate no facet
- Undo snapshots include records, order, selected ID, filters, advanced query, sort, derived-state inputs, and history anchor; a new branch after undo discards redo
- Import validates the full ConferenceSpeakerGreenroomBoardSession document before commit and never partially applies valid records from an invalid document
Stack and tooling:
- React with a Vite SPA setup, Zustand for shared state, Tailwind CSS 4.3.2 for layout and tokens, and Radix UI as the only component library for dialogs, selects, tabs, tooltips, and toasts
- React Hook Form paired with Zod drives every add, edit, forecast, duplicate merge, and import form; schemas model the API-shaped record and artifact contracts above and surface inline field errors before commit
- Motion for React and AutoAnimate are allowed for animation; no other animation libraries
- TanStack Table and TanStack Virtual support live sorting and the 104-record list; Phosphor icons through @phosphor-icons/react are the only icon set
- All libraries install from npm and bundle locally; no CDN, backend, authentication, external API, analytics, outbound navigation, or non-local runtime request
- Document title is Greenroom Forecast Board; all conference records and copy are original
- npm start serves on port 3000 and npm run verify:build creates a committed dist build before serving
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed; /app/package.json MUST define scripts exactly named start, serving on port 3000, and verify:build, which exits 0 only after the app build succeeds; do not iframe, proxy, or fetch the product from another origin.
- Before finishing, run npm run verify:build and npm start and confirm the app serves cleanly on port 3000. A failed build is not judged.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the action contract below in the same visible tab and invoke the same domain commands as visible controls. Mechanics exclusions remain browser-graded.
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
{"id":"browse-query-v1","contract_version":"zto-webmcp-v1","title":"Browse / query","purpose":"Content sites, catalogs, feeds, dashboards, and navigation.","permitted_operations":["open","search","apply_filter","clear_filter","sort","set_locale","set_theme"],"binding_keys":{"required_any_of":[["destinations"]],"optional":["browsable_entity","filters","sorts","locales","themes","visible_postconditions"]},"restrictions":["No arbitrary URL, selector, or undeclared route.","Destinations and filters come from bounded PRD declarations.","Visible navigation state must update via the same handlers as UI controls."],"tool_name_prefix":"browse"}
</module_spec>
<module_spec id="entity-collection-v1">
{"id":"entity-collection-v1","contract_version":"zto-webmcp-v1","title":"Entity collection","purpose":"Carts, records, favorites, calendar events, list items, and local entities.","permitted_operations":["create","select","update","delete","toggle","quantity","reorder"],"binding_keys":{"required_any_of":[["entity"],["entity_operations"]],"optional":["entity_fields","value_bounds","visible_postconditions"]},"restrictions":["Closed entity and field enums only.","Bounded string and numeric values.","No generic state setter or arbitrary patch object.","Invokes the same domain command used by the visible control.","Delete requires explicit confirm=true.","Reorder only when gesture mechanics are not being evaluated."],"tool_name_prefix":"entity"}
</module_spec>
<module_spec id="form-workflow-v1">
{"id":"form-workflow-v1","contract_version":"zto-webmcp-v1","title":"Form workflow","purpose":"Forms, setup flows, authentication shells, and multi-step workflows.","permitted_operations":["validate","submit","cancel","reset","advance","return"],"binding_keys":{"required_any_of":[["form_fields"],["form_operations"]],"optional":["workflow_steps","value_bounds","visible_postconditions"]},"restrictions":["Declared fields only.","Normal validation and visible errors remain active.","Cannot manufacture authentication or bypass guarded routes.","Backend-free apps must surface honest unavailable state through product handlers."],"tool_name_prefix":"form"}
</module_spec>
<module_spec id="artifact-transfer-v1">
{"id":"artifact-transfer-v1","contract_version":"zto-webmcp-v1","title":"Artifact transfer","purpose":"Import, export, copy, print, and conversion workflows.","permitted_operations":["import","export","copy","print_preview","convert"],"binding_keys":{"required_any_of":[["artifact_operations"]],"optional":["import_modes","export_formats","conversion_modes","visible_postconditions"]},"restrictions":["No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.","File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."],"tool_name_prefix":"artifact"}
</module_spec>

Bindings:
- Destinations: slots; forecast-ribbon; artifact; import
- Browsable entity: conference-speaker-slot
- Filters: all; draft; ready; changed; archived
- Sorts: ribbon-order; start-asc; start-desc
- Entity: conference-speaker-slot
- Entity operations: create; select; update; delete; toggle; quantity; reorder
- Entity fields: speakerName; sessionTitle; track; room; startMinute; durationMinutes; status; issueNumber; releaseTag; forecastOffsetMinutes; duplicateOf; forecastRibbonState
- Value bounds: {"forecastOffsetMinutes":{"min":-30,"max":30,"step":5},"startMinute":{"min":480,"max":1080,"step":5},"durationMinutes":{"min":15,"max":90,"step":5},"status":["draft","ready","changed","archived"]}
- Form fields: speakerName; sessionTitle; track; room; startMinute; durationMinutes; status; issueNumber; releaseTag; forecastOffsetMinutes; duplicateOf; import
- Form operations: validate; submit; cancel; reset
- Artifact operations: export; import; copy; print_preview
- Export formats: speaker-greenroom-v1-forecast-ribbon
- Import modes: speaker-greenroom-v1-forecast-ribbon
- Workflow completion: projected-window
- Workflow completion: forecast-outcome
- Workflow completion: derived-summary
- Workflow completion: event-history
- Workflow completion: artifact-preview

Mechanics exclusions:
- Range pointer movement, keyboard arrow operability, nudge press feedback, and forecast transition timing are graded through real Playwright actions; WebMCP update proves only state parity
- Dialog focus trapping, Escape close, opener focus return, hover, reduced motion, and mobile target size are real browser mechanics
- Clipboard contents, selected file contents, and downloaded artifact bytes remain Playwright responsibilities
- Import diagnostics are exercised through the visible pasted-text or file form so validation cannot be bypassed by a generic state setter

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound only to the declared values above.
- Tool handlers call the same application logic as visible controls in the visible tab.
- Do not invent extra modules, destinations, entity fields, filters, sorts, operations, formats, or import modes.
- WebMCP is not graded; missing tools must never create fabricated visible success.
</webmcp_action_contract>
