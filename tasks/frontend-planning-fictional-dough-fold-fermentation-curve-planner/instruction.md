<summary>
Fictional Dough-Fold & Fermentation-Curve Planner
A browser-native planning workbench where a home-bake rehearsal organizer arranges a fictional test loaf against a deterministic activity model. Moving timed dough-fold cards across an activity-band timeline updates a cumulative readiness curve, rest-interval braid, and downstream shape-buffer diagnostic. It supports selective undo of fictional collaborator actions, plan validation/approval, and export to a portable schedule packet. Stack includes React, Vite, and Tailwind CSS 4.3.2. (In-memory state only; NO localStorage).
</summary>

<core_features>
Drag EV-F02 from 09:20 to 09:35; exactly one H-001 appears, gaps become 55/30, net credit at 10:30 becomes 165, target becomes 11:55, buffer becomes 5, and DG-SHAPE-BUFFER appears across timeline, curve, braid, inspector, rail, and export preview.
Render a desktop timeline with aligned lanes for activity bands, events, fold recovery windows, target crossing, and the shape-buffer bracket. Five-minute major snaps are labeled.
Render a cumulative step/line curve sampled every five minutes, with the 250-credit target, first-crossing marker, event verticals, activity-band background, and recovery exclusions. Brushing the curve changes the timeline viewport and sample inspector.
Diagnostics cover fold gaps, band coverage, target reachability, shape buffer, event containment, five-minute alignment, duplicate ids, and stale derived values on import.
History shows system anchor plus Ari and Sol actions. Selective undo targets the most recent active action by the chosen actor while replaying later non-conflicting actions.
Download exactly moonrise-test-loaf-plan.zip with exactly nine root entries: manifest.json, plan.json, view-state.json, events.csv, activity-bands.csv, credit-curve.csv, diagnostics.json, schedule.ics, timeline.svg.
</core_features>

<user_flows>
Complete move, inspect brush/impact, Sol correction, selective undo Ari, redo Ari, validate, approve, export, open a fresh clean session, import; the final plan is approved at EV-F02 09:35, EV-S01 12:05, target 11:55, buffer 10, zero active diagnostics, and selection restored.
</user_flows>

<edge_cases>
Try 09:40, repeat 09:35, cancel a preview, import a package with both a 25-minute gap and stale curve value, and cancel import; invalid/no-op/canceled actions add zero history, all import errors appear together, and the prior plan/selection/viewport/brush/focus remain exact.
</edge_cases>

<visual_design>
At 1440x900, inspect the initial, selected, warning, and approved states; the bench-notebook hierarchy, aligned axes, tabular numbers, band/event distinction, non-color states, and readable contrast remain coherent without overlapping controls or decorative obstruction.
</visual_design>

<motion>
Sample before, early, and settled frames of the canonical pointer move; the card travels from its origin, the curve redraw starts at the affected time, the crossing marker moves, and the warning enters causally. Under reduced motion, transforms/path drawing disappear while final geometry, changed-value outline, text, and announcement remain.
</motion>

<responsiveness>
At 390x844, perform the same canonical mutation through the event route and bottom sheet; selection, H-001, curve values, warning, and artifacts match desktop, while no desktop timeline is squeezed, no page-level horizontal overflow appears, and all targets are at least 44x44.
</responsiveness>

<accessibility>
Focus EV-F02, press M, enter 09:35, and confirm; the result is identical to pointer H-001, the dialog traps/restores focus, selected/invalid/warning states are not color-only, exact announcement text is emitted, and selective undo/redo shortcuts preserve Sol's action.
</accessibility>

<performance>
Load 120 events, 48 bands, 61 visible samples, and 25-entry anchored history; interaction feedback appears within 100 ms, linked views settle within 500 ms, packet export/import completes within two seconds, and no input, frame-critical state, or layout position is lost.
</performance>

<writing>
Inspect fixture disclaimer, band/event labels, canonical warning, invalid-gap error, import diagnostics, undo conflict copy, fresh-session import state, and approval summary; language is concise, fictional, actionable, grammatically consistent, and never presents readiness credits as real advice.
</writing>

<innovation>
Move EV-F02 once and brush the changed curve area; timeline geometry, excluded-area ghost, target crossing, interval braid, buffer bracket, diagnostic, history, and packet preview all remain one linked selectable state rather than independent dashboard widgets. Note that innovation catchall covers anything not covered by other criteria with evidence.
</innovation>

<requirements>
The fixture may be illustrative, but no canonical move, collaborator correction, undo/redo, validation, approval, export, or success credit is preseeded.
Equivalent action orders converge: move the fold then move the shape, or move the shape then make the same fold move.
Export reflects actual session work. It has exact filenames, schemas, column order, units, precision, stable sorting, relationships, hashes, and regenerated timestamps.
Committed state promised by the PRD survives reload. Drag ghosts, open dialogs, etc., never persist.
Every numeric and count bound is exercised at its minimum, maximum, just-inside, and just-outside value.
The app must visibly state that its readiness credits are fictional planning units and not culinary, food-safety, fermentation, temperature, or timing advice.
See instructions for initial seeded bands (AB-01, AB-02, AB-03) and events (EV-M01, EV-F01, EV-F02, EV-F03, EV-S01, EV-C01).
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
In-memory state only, NO localStorage.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- artifact-transfer-v1
- entity-collection-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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

Bindings:
- Editor operations: select; update_property; set_content; preview
- Editor object types: event; history
- Editor properties: time; actor; active
- Entity: diagnostic
- Entity operations: select; update; toggle
- Entity fields: active; resolved
- Artifact operations: import; export; copy
- Export formats: zip; plan-json; events-csv; activity-bands-csv; credit-curve-csv; diagnostics-json; schedule-ics; timeline-svg
- Import modes: zip; plan-json

Mechanics exclusions:
- Drag movement and exact-value dialog interaction remain Playwright (gesture/keyboard mechanics)
- File download parsing and parsing artifacts are verified by Playwright logic

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
