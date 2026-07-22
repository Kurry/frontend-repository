<summary>
Build a home air-quality trendbook with a forecast-ribbon decision surface using React, Zustand, Tailwind CSS 4.3.2, and Radix UI.
</summary>

<core_features>
Feature: Air Readings collection —
- The first load is genuinely clean: zero readings, zero history events, zero selected records, derived totals of zero, and no exported or completed milestone; the empty state explains how to create the first reading.
- Creating or editing a reading uses one API-shaped field contract: optional stable ID matching aq-[a-z0-9-] with 6 through 31 characters, label 2 through 64 trimmed characters, status exactly draft, ready, changed, or archived, AQI integer 0 through 500, observed date in YYYY-MM-DD form, projected AQI integer 0 through 500, forecast horizon exactly 6, 12, or 24 hours, confidence 0 through 1 inclusive, release version matching AQ-YYYY.MM, source issue matching HAQ- followed by 3 through 5 digits, and an optional duplicate-of stable ID.
- Every field shows an inline message naming the rejected value or rule and the recovery action; exact bounds 0 and 500 for AQI and 0 and 1 for confidence are accepted while adjacent out-of-range values are rejected, and correcting one field clears only that field's error.
- A valid create adds exactly one row, selects its stable ID, increments the active count by one, updates both AQI summaries, and appends exactly one stable history event; cancelled, invalid, unchanged, and double-activated actions append no event.
- Editing a reading updates the row, forecast ribbon, evidence inspector, derived summary, saved-query membership, history, and live artifact preview without a reload.
- Archiving a reading changes its status to archived, sets projected AQI equal to current AQI, removes it from active calculations, and appends exactly one event; deleting asks for confirmation, removes the record and dangling duplicate references, and updates counts exactly once.
- The saved queries All readings, Needs attention, Ready, and Archived, text search over label, ID, and source issue, and Manual order, AQI low-to-high, AQI high-to-low, and Newest observed sorts all derive from the one live collection; clearing search and query restores the complete order.
- When a reading names a valid duplicate target, Merge duplicate combines the larger current and projected AQI and confidence into the target, removes exactly one duplicate, selects the target, and appends one merge event; missing, self, and dangling duplicate targets are rejected without mutation.

Feature: Forecast Ribbon surface —
- Selecting a reading opens a forecast ribbon showing the same stable ID in the selected row, ribbon context, evidence inspector, and artifact view, plus current AQI, projected AQI, delta, horizon, confidence, status, issue, and release provenance.
- Dragging the range thumb, pressing its arrow keys, or typing an exact projected AQI changes one transient preview; activating Apply canonical forecast commits the same projected AQI and horizon through one canonical mutation, changes the status to changed, updates the linked summary and inspector, and appends exactly one stable event.
- Projected AQI accepts exact integers 0 and 500 and rejects non-integers and adjacent values below 0 or above 500; horizon accepts only 6, 12, or 24, archived readings cannot be forecast-edited, and an unchanged Apply creates no event.
- Cancelling or navigating away before Apply leaves records, selection, saved query, sort, derived values, artifact bytes, and history unchanged; Apply is protected from double activation.
- Undo from the visible control or Ctrl/Cmd+Z restores the complete prior record order, selected ID, saved query, sort mode, derived values, and history anchor; editing after undo creates a new canonical branch without resurrecting the undone event.
- Loading the explicit performance fixture creates 120 deterministic readings only after the user asks for it, without claiming authored completion; selecting and applying a forecast in that fixture acknowledges input within 100 milliseconds and settles linked surfaces within 500 milliseconds.

Feature: Portable work artifact —
- Export opens a live formatted preview and offers Copy JSON and Download JSON for air-quality-v1-forecast-ribbon.json; the document contains exactly schemaVersion, exportedAt, records, derived, history, and view, preserves stable record and event order, uses AQI units with one-decimal derived precision, and regenerates the RFC3339 exportedAt on each export.
- Each records entry contains id, label, status, aqi, observedOn, forecast with projectedAqi, horizonHours, and confidence, and provenance with releaseVersion, sourceIssue, and duplicateOfId; derived contains activeCount, archivedCount, currentAverage, projectedAverage, changedCount, and attentionCount; view contains selectedId, query, and sort.
- Import parses the same strict schema as create, edit, and export, validates every record and field before commit, and reports every file, record, and field diagnostic together for malformed JSON, extra or missing keys, unknown enums, exact-boundary violations, duplicate IDs, self or dangling duplicate references, dangling selections, invalid history snapshots, cross-field contradictions, stale derived values, and corrupted metadata.
- Any invalid import is an atomic no-op for records, selection, saved query, sort, derived values, and history; a valid import restores every authored and derived field in one commit, and its re-export is semantically identical except for regenerated exportedAt.
- Clear session returns to the clean initial state; export, clear, import, re-open the edited reading, and export again preserves authored order, selected ID, forecast geometry, typed fields, derived summary, and history.
</core_features>

<user_flows>
- Starting from zero readings, create a Ready reading at AQI 42 with a 12-hour projection of 58, then select it and apply an exact projection of 112; the row status becomes changed, the Needs attention count increases, the projected average becomes 112, the inspector shows the same ID and source issue, and one forecast event is appended without reload.
- Create a second reading that marks the first reading as its duplicate, merge the duplicate into the first, undo the merge, then edit the duplicate before merging again; each action changes the record and event counts by the exact expected delta, undo restores selection and derived values, and the branched merge converges on the selected target.
- Export the changed session, clear to zero records, import the exported JSON, re-open the previously selected reading, and export again; records, typed fields, forecast state, order, selection, query, sort, derived summary, and history match while only exportedAt is regenerated.
- Submit one import containing at least two independent errors such as a duplicate ID and AQI 501; both diagnostics appear together, state is unchanged, and correcting only AQI leaves the duplicate-ID diagnostic until it is also fixed.
</user_flows>

<edge_cases>
- With zero records, the collection and ribbon show actionable empty states, all six derived values are zero, Export produces an empty but valid schema document, and Undo is disabled.
- Search or a saved query with zero matches shows a Clear query action that restores the full collection without changing any record.
- A no-op edit, no-op forecast, cancelled form, cancelled import, and rejected import create zero extra records or history events and preserve the previous selected stable ID.
- Deleting a record selected by the inspector clears the selection; deleting a duplicate target clears surviving duplicateOfId references so the exported artifact has no dangling IDs.
- Archived records must have projected AQI equal to current AQI in both visible state and imported artifacts; a contradictory archived projection is diagnosed and rejected atomically.
</edge_cases>

<visual_design>
- The desktop workbench uses a calm air-monitoring palette: deep ink header and inspector accents, white and mist surfaces, teal primary actions, cyan selection, semantic green, yellow, orange, and rose AQI bands, and non-color status labels.
- The composition is an intentional three-column evidence workspace with a 238-pixel query rail, a flexible central workbench, and a 286-pixel linked inspector; the forecast ribbon is the visual center above the dense reading table.
- Type hierarchy distinguishes the large decision headline, section titles, eyebrow labels, tabular values, stable IDs, field labels, and helper copy; spacing and borders follow a consistent compact evidence-console rhythm.
- Selected rows use both a teal inset marker and background, statuses use text plus bordered pills, forecast markers remain legible across all AQI bands, and every interactive control has distinct hover, pressed, focus-visible, disabled, and error states.
</visual_design>

<motion>
- Moving the real range control makes the forecast marker follow with a short spring-like settle, while Apply connects the marker to changed status, summary, and history feedback; this causal motion is graded through the real pointer or keyboard path.
- Created, deleted, filtered, sorted, and merged rows animate into their new positions over approximately 160 to 260 milliseconds, and buttons use short hover and press feedback without delaying the action.
- Dialogs fade and scale in, the overlay fades, and the live announcement enters without blocking controls; there is no perpetual or decorative animation.
- With reduced motion requested, all transforms and smooth scrolling become effectively instant while selection, marker position, status, summary, history, and live announcement evidence remain complete.
</motion>

<responsiveness>
- At widths above 1180 pixels the query rail, central workbench, and linked inspector are simultaneous; from 821 through 1180 pixels the inspector becomes a full-width panel below the workbench; at 820 pixels and below the query controls become a two-column band above a stacked workbench.
- At 560 pixels and below, query controls, forecast exact-value controls, dialog fields, and artifact actions become single-column steps while the reading table remains available in its labeled horizontal scroll region; the page itself never overflows horizontally.
- Every mobile button, input, select, row selector, and icon action has a touch target of at least 44 by 44 pixels, and the complete select, exact forecast, Apply, undo, export, clear, and import flow works at 375 pixels wide.
</responsiveness>

<accessibility>
- A Skip to workbench link, semantic header, navigation, main, asides, sections, table, headings, labels, and buttons provide a logical landmark and heading order.
- Every control is reachable and operable with Tab, Shift+Tab, Enter, Space, or native arrow keys; focus rings are visible, Ctrl/Cmd+K focuses search, and Ctrl/Cmd+Z invokes the same undo command as the visible control.
- Reading and artifact dialogs trap focus, Escape and Cancel close without mutation, and closing returns focus to the opener; every icon-only action has a reading-specific accessible name.
- Validation errors and the canonical mutation result are visibly rendered and announced through live regions; AQI, status, selection, errors, and focus never rely on color alone, and text and controls meet WCAG AA contrast.
</accessibility>

<performance>
- The app becomes interactive within 2 seconds of a local cold load with no layout jump, console error, page error, unhandled rejection, or non-local request.
- At the explicit 120-record fixture, search, query, sorting, selection, and exact forecast input acknowledge within 100 milliseconds, linked views settle within 500 milliseconds, and export or import completes within 2 seconds without dropped interactions or stale rows.
- Rapid no-op and double activation do not duplicate records or events, scrolling the table stays responsive, and unrelated row values remain stable while one selected reading changes.
</performance>

<writing>
- Labels consistently use the domain terms reading, AQI, forecast, saved query, source issue, release provenance, duplicate, history event, and artifact across the rail, table, ribbon, inspector, dialogs, errors, and success feedback.
- Actions use specific verbs such as Create reading, Apply canonical forecast, Merge into, Validate and import, Copy JSON, and Download JSON rather than generic Submit or OK.
- Every field and import error names the offending field or record, rejected value or rule, and a recovery action; empty states name what belongs in the region and the next available action.
</writing>

<innovation>
- Optional enhancements may add a useful domain explanation, comparison aid, or accessible keyboard convenience beyond this specification, provided it uses the same canonical state and interoperable artifact rather than a disconnected demonstration.
</innovation>

<requirements>
Shared application state must live in Zustand and remain in memory only: records, selection, saved query, search, sort, derived summary inputs, history, and artifact state. Do not use localStorage, sessionStorage, IndexedDB, cookies, URL persistence, a backend, authentication, or external data APIs. Reload returns every facet to the genuinely clean zero-record state.
Build tooling: React with Vite or an equivalent SPA setup; Tailwind CSS 4.3.2 for layout, design tokens, and custom surfaces; Radix UI for accessible dialog primitives; React Hook Form with Zod for every create, edit, and import schema; Motion for React and CSS transitions are allowed for animation and no other animation libraries; Phosphor icons only. All libraries are installed through npm and bundled locally with no CDN imports.
The browser download, clipboard, and file or paste import paths are the persistence boundary. The app must serve on port 3000 and package.json must provide start and verify:build scripts.
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
- Browsable entity: air-readings
- Destinations: collection; forecast-ribbon; evidence-inspector; artifact-export; artifact-import
- Filters: saved-query with all, needs-attention, ready, and archived values
- Sorts: manual; aqi-asc; aqi-desc; observed-desc
- Entity: air-reading
- Entity operations: create; select; update; delete
- Entity fields: label; status; aqi; observedOn; forecast; provenance
- Value bounds: AQI and projected AQI integer 0 through 500; horizonHours 6, 12, or 24; confidence 0 through 1 inclusive; statuses draft, ready, changed, or archived
- Artifact operations: export; import; copy
- Export formats: air-quality-v1-json
- Import modes: air-quality-v1-json
- Visible postcondition: entity create, update, and delete return the stable ID, event ID where applicable, and derived summary that also renders in the workbench
- Visible postcondition: select makes the same stable ID visible in the table, forecast ribbon, and evidence inspector
- Visible postcondition: artifact operations open the visible preview or transactional import form; bytes, paste, clipboard, and download remain Playwright-driven

Mechanics exclusions:
- Forecast range drag, native arrow-key movement, exact-number typing, causal marker motion, and double activation stay Playwright-observed
- Real keyboard traversal, shortcuts, dialog focus trap and opener return, hover computed styles, reduced-motion parity, and 375-pixel interaction stay Playwright-observed
- Clipboard contents, pasted JSON, downloaded bytes, and semantic artifact comparison stay Playwright-observed per artifact-transfer restrictions

Implementation:
- Register browser WebMCP tools for every permitted operation used in the selected module specs, bound only to the product values above.
- Tool handlers must call the same Zustand commands as the visible controls and wait two animation frames before returning.
- Do not invent extra modules, destinations, filters, entity fields, formats, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
