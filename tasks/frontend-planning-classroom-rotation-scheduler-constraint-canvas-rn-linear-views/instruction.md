<summary>
Manage stations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: drag a selected record across constraint lanes and resolve a conflict. Release-derived concept: a shareable filtered workflow view whose grouping, context, and generated update remain linked.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
- Create, edit, archive, and filter stations with explicit domain statuses.
- Filter or reorder records by domain state.
- Drag a selected record across constraint lanes and resolve a conflict.
- Undo the last mutation and inspect the linked representation.
- Export the current artifact.
- Clear and import it with field-level validation.
</core_features>

<user_flows>
- Create/edit/delete one record.
- Filter or reorder records by domain state.
- Drag a selected record across constraint lanes and resolve a conflict.
- Undo the last mutation and inspect the linked representation.
- Export the current artifact.
- Clear and import it with field-level validation.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The constraint canvas mutation changes the primary record, linked view, and status together.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The constraint canvas surface, derived summary, and artifact query share one state.
- In-memory only; export/import is the persistence boundary.
- Interoperable format: classroom-rotations-v1-constraint-canvas.json
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Record IDs are unique and status values are explicit enums.
- Required fields, numeric/date bounds, and cross-record references validate together.
- Dependencies: Use local npm dependencies only; do not load scripts or styles from remote CDNs.
- Styling: Use Tailwind CSS 4.3.2.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Complete this task to create a fully working app serving on port 3000.
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
  "purpose": "Lists, boards, tables, grids, galleries, and queues.",
  "permitted_operations": ["create_record", "read_record", "update_record", "delete_record", "list_records", "query_records", "batch_update"],
  "binding_keys": {
    "required_any_of": [["entity_operations"], ["entity_types"]],
    "optional": ["entity_properties", "query_parameters", "sort_keys", "filter_keys"]
  },
  "restrictions": [
    "Sorting, filtering, pagination, and multi-selection UI/animations remain Playwright-driven when mechanism matters.",
    "WebMCP focuses on record lifecycle and semantic query over DOM scraping."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Save, load, import, export, upload, download.",
  "permitted_operations": ["export_session_json", "import_session_json", "export_image_blob", "import_image_blob", "export_text", "import_text", "clear_session"],
  "binding_keys": {
    "required_any_of": [["transfer_formats"], ["transfer_operations"]],
    "optional": ["schema_versions", "blob_types", "text_encodings", "validation_rules", "clear_semantics"]
  },
  "restrictions": [
    "System file dialogs, clipboard, drag-drop events, and visual loading states remain Playwright-driven when mechanism matters.",
    "WebMCP exchanges schema-valid JSON, raw text, or base64 blobs bypassing the OS dialog layer."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Feature: Stations collection
  Module: entity-collection-v1
  Parameters:
    entity_operations: ["create_record", "read_record", "update_record", "delete_record", "list_records", "query_records"]
    entity_types: ["station"]

- Feature: Linked decision surface
  Module: structured-editor-v1
  Parameters:
    editor_operations: ["select", "update_property"]
    editor_object_types: ["station"]

- Feature: Portable work artifact
  Module: artifact-transfer-v1
  Parameters:
    transfer_formats: ["classroom-rotations-v1-constraint-canvas.json"]
    transfer_operations: ["export_session_json", "import_session_json", "clear_session"]

Restrictions:
- Real gesture, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
</webmcp_action_contract>
