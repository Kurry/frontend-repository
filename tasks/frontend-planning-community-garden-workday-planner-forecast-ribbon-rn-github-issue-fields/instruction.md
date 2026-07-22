<summary>
Build the Community Garden Workday Planner using React and Tailwind CSS 4.3.2. This frontend-native application manages work tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The signature interaction is to adjust a selected record on a forecast ribbon and compare projected outcomes.
</summary>

<core_features>
Feature: Work Tasks collection —
- Create, edit, archive, and filter work tasks with explicit domain statuses.
- Direct manipulation path: Create, edit, delete one record.
- Filter or reorder records by domain state.
- Display visible states for records: empty, draft, ready, changed, archived.
- Maintain field boundaries: exact field boundaries are accepted while adjacent out-of-range values are rejected.
- On invalid required fields, preserve the prior valid record and explain recovery.
- Mutates records array and status fields in the shared state for the final artifact.

Feature: Forecast Ribbon surface —
- Use the forecast ribbon interaction to derive a decision about the collection.
- Signature interaction: adjust a selected record on a forecast ribbon and compare projected outcomes.
- Undo the last mutation and inspect the linked representation.
- Display visible states for the ribbon: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Updates forecast-ribbon geometry/selection, derived summaries, and event history in the shared state.

Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state.
- Export the current artifact as garden-workday-v1.json.
- Clear the current state and import a new artifact with field-level validation.
- Display visible states: unsaved, exported, validated, replayed.
- Invalid imports (malformed schema, duplicate IDs, unknown references, and invalid bounds) make no state change and display an error.
- A valid import restores authored structure and regenerates exportedAt.
- Produces an artifact matching the schema: CommunityGardenWorkdayPlannerSession with schemaVersion, exportedAt, records array, derived object, and history array; each record is an API-shaped would-be request body.
</core_features>

<user_flows>
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Adjust a selected record on a forecast ribbon and compare projected outcomes. The forecast ribbon mutation changes the primary record, linked view, and status together.
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- Compare the implementation with the cited source interaction vocabulary. The visual and interaction thesis is coherent without copying unrelated screens.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Adjust a selected record on a forecast ribbon and compare projected outcomes. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Serve the application on port 3000 via npm start.
- The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
- The useful end state is an interoperable downloadable artifact (garden-workday-v1.json) of the session's actual work.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in summary; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

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
- Editor object types: forecast-ribbon-record
- Editor properties: status; outcome
- Editor modes: adjust; compare
- Editor operations: select; update_property; preview
- Entity: record
- Entity operations: create; select; update; delete; filter
- Entity fields: id; title; status; assignedDate; effort
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag, resize, and complex visual interaction remain Playwright (gesture mechanics)
- File paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
