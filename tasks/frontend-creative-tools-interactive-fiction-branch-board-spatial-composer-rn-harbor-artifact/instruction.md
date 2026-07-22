<summary>
Build an Interactive Fiction Branch Board with a Spatial Composer using React, Vite, and Tailwind CSS 4.3.2. The application manages story nodes in a bounded local workflow where placing a selected record in a spatial composer updates linked views and an interoperable JSON artifact (fiction-branches-v1.json). All state is kept strictly in-memory (no localStorage). All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Story Nodes collection: Create, edit, archive, and filter story nodes with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields must preserve the prior valid record and explain recovery. Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Spatial Composer surface: The canonical mutation is placing a selected record in a spatial composer and rebalancing capacity. A conflicting or incomplete mutation is rejected without partial updates. Provide an undo action that restores ordering, selection, and derived values. Updates spatial-composer geometry/selection, derived summaries, and event history.
- Portable work artifact: Export and restore the actual session work in a fresh state via fiction-branches-v1.json. It includes schemaVersion (fiction-branches-v1), exportedAt (RFC3339), records (each record is an API-shaped would-be request body), derived state, and history. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps without horizontal clipping.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state. Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Tailwind CSS 4.3.2 is required. All assets must be loaded locally without CDNs.
- Built strictly as an in-memory application; do NOT use localStorage or remote network calls.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The spatial composer surface, derived summary, and artifact query share one state.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI.
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
  "permitted_operations": ["list", "add", "remove", "update", "clear", "set_status", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity_type"], ["collection_name"]],
    "optional": ["entity_properties", "sort_fields", "filter_fields", "status_enums", "identity_fields"]
  },
  "restrictions": [
    "Does not execute remote sync.",
    "Does not emit DOM events; updates state layer only."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Export and import of session state, files, and bundles.",
  "permitted_operations": ["export", "import", "clear_and_import", "validate", "get_status"],
  "binding_keys": {
    "required_any_of": [["artifact_type"], ["format"]],
    "optional": ["schema_version", "validation_rules", "size_limits"]
  },
  "restrictions": [
    "Does not interact with OS clipboard or file system directly.",
    "WebMCP import replaces the in-memory document state seamlessly; real file-picker and clipboard edge cases are left to browser-driven checks."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
<binding module="structured-editor-v1">
{
  "editor_operations": ["select", "update_property", "switch_mode"],
  "editor_object_types": ["spatial_composer_record"],
  "editor_properties": ["x", "y", "capacity_balance", "linked_decision"],
  "editor_modes": ["idle", "selected", "changed", "conflict", "resolved"],
  "visible_postconditions": ["linked_summary_updates", "artifact_history_append", "motion_feedback"]
}
</binding>

<binding module="entity-collection-v1">
{
  "entity_type": "story_node",
  "collection_name": "interactive_fiction_nodes",
  "entity_properties": ["id", "title", "content", "capacity_weight", "status"],
  "status_enums": ["empty", "draft", "ready", "changed", "archived"],
  "identity_fields": ["id"]
}
</binding>

<binding module="artifact-transfer-v1">
{
  "artifact_type": "fiction_branches_session",
  "format": "json",
  "schema_version": "fiction-branches-v1",
  "validation_rules": [
    "exportedAt is valid RFC3339",
    "record IDs are unique",
    "statuses match enums",
    "spatial composer references are known IDs"
  ]
}
</binding>
</webmcp_action_contract>
