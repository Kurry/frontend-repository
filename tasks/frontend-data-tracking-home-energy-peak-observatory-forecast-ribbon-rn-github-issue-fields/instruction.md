<summary>
Build a Home Energy Peak Observatory app using React (with a local reducer), Vite, and Tailwind CSS 4.3.2. The app manages energy readings (draft, ready, changed, archived) and features a "Forecast Ribbon" where adjusting a selected record's projected outcomes updates linked views and derived summaries. The app's state must be completely exportable to an API-shaped JSON artifact (energy-peak-v1-forecast-ribbon.json) that preserves authored state and derived consequences for a clean round trip via Import. The architecture is frontend-only (no backend, no localStorage) and follows GitHub Issue Fields patterns for duplicate merges, saved queries, and release provenance.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Energy Readings collection —
- Create, edit, and delete energy readings records
- Records have a domain status (draft, ready, changed, archived)
- Filter or reorder records by domain state
- Exact field boundaries are accepted while adjacent out-of-range values are rejected (with field-level validation messages)
- Invalid required fields preserve the prior valid record and explain recovery
Feature: Forecast Ribbon surface —
- Signature interaction: adjust a selected record on a forecast ribbon and compare projected outcomes
- The forecast ribbon mutation changes the primary record, linked view, and status together
- A conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values (Ctrl/Cmd+Z or UI button)
Feature: Portable work artifact —
- Export the current session to energy-peak-v1-forecast-ribbon.json (contains schemaVersion, exportedAt, records[], derived{}, and history[])
- Clear the session and import it with field-level validation
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
</core_features>

<user_flows>
End-to-end flows:
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Adjust a selected record on a forecast ribbon and compare projected outcomes. The linked views and derived summary react immediately.
- Export, clear, import, and inspect the edited variant record and derived state. Authored order/selection/geometry and domain state survive; invalid import is a no-op.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- Malformed JSON import or parseable JSON that fails the schema contract leaves the state unchanged and shows an inline error naming the offending field.
</edge_cases>

<visual_design>
- Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- Adjust a selected record on a forecast ribbon and compare projected outcomes. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Use the signature interaction at a narrow viewport (e.g., 375px). The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
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

<innovation>
Optional enhancements: Add a feature to compare two different forecast projections side-by-side.
</innovation>

<requirements>
- Shared application state must use a local React/Vite reducer (in-memory only). Do not use localStorage.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed.
- `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
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
- Editor object types: forecast-ribbon
- Editor properties: forecast-value
- Editor modes: compare
- Editor operations: select; update_property; switch_mode; preview
- Entity: energy-reading
- Entity operations: create; select; update; delete
- Entity fields: status; value
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag/slider interactions on the forecast ribbon stay Playwright (gesture mechanics)
- File upload/download dialogs stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation.
- Tool handlers must call the same application logic as the visible UI.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
