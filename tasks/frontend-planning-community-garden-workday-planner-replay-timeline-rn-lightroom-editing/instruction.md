# Community Garden Workday Planner — Replay Timeline — Lightroom Editing

<summary>
Manage work tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Release-derived concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized. Tailwind CSS 4.3.2 must be used for styling.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Work Tasks collection: Create, edit, archive, and filter work tasks with explicit domain statuses.
Replay Timeline surface: scrub a selected record through its timeline and restore a prior checkpoint. Undo the last mutation and inspect the linked representation.
Portable work artifact: Export the current artifact, clear and import it with field-level validation.
</core_features>

<user_flows>
complete_user_flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
boundaries_recovery: Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
visual_hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
causal_motion: scrub a selected record through its timeline and restore a prior checkpoint. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
mobile_mode: Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
alternate_input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
large_collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
domain_copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
linked_utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
In-memory only; export/import is the persistence boundary. No localStorage.
The export artifact garden-workday-v1.json must include schemaVersion, exportedAt, records, derived, and history.
Seed a deterministic collection with empty, boundary, valid, and conflict states.
Do not use external CDNs; all assets must be npm-local. Tailwind CSS 4.3.2 must be used.
</requirements>

<integrity>
Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
    "Do NOT duplicate operations across independent modules.",
    "Do NOT use external identifiers to mutate private layout structures."
  ]
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Management of tables, boards, feeds, and directories.",
  "permitted_operations": ["create_record", "read_record", "update_record", "delete_record", "list_records", "query_records"],
  "binding_keys": {
    "required_any_of": [["entity_schema"], ["entity_operations"]],
    "optional": ["sortable_fields", "filterable_fields", "pagination_strategy", "default_sort"]
  },
  "restrictions": [
    "Do NOT expose mutable internal IDs.",
    "Do NOT provide bypass hooks for domain business logic."
  ]
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import and export of standardized file formats.",
  "permitted_operations": ["export_session_json", "import_session_json", "export_resource", "import_resource"],
  "binding_keys": {
    "required_any_of": [["artifact_schema"], ["artifact_format"]],
    "optional": ["supported_extensions", "max_file_size", "transfer_direction"]
  },
  "restrictions": [
    "Do NOT bypass local validation rules during import."
  ]
}
</module_spec>

Bindings:
<binding module="entity-collection-v1">
{
  "entity_schema": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "title": { "type": "string" },
      "status": { "type": "string", "enum": ["draft", "ready", "changed", "archived"] },
      "description": { "type": "string" }
    }
  },
  "entity_operations": ["create_record", "read_record", "update_record", "delete_record", "list_records"]
}
</binding>

<binding module="structured-editor-v1">
{
  "editor_operations": ["select", "update_property"],
  "editor_object_types": ["timeline_event"],
  "visible_postconditions": ["Linked views and artifact state match timeline selection"]
}
</binding>

<binding module="artifact-transfer-v1">
{
  "artifact_schema": {
    "type": "object",
    "properties": {
      "schemaVersion": { "type": "string" },
      "exportedAt": { "type": "string" },
      "records": { "type": "array" },
      "derived": { "type": "object" },
      "history": { "type": "array" }
    }
  },
  "artifact_format": "json",
  "transfer_direction": ["import", "export"]
}
</binding>
</webmcp_action_contract>
