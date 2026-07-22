# Task: Music Practice Loop Composer — Spatial Composer — Evidence Artifact Provenance

<summary>
Manage practice segments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The signature interaction is to place a selected record in a spatial composer and rebalance capacity. An evidence artifact inspector with redaction, source lineage, downloadable files, and explicit upload failures ensures a clean round trip of the practice-loop-v1.json artifact. State must be entirely in-memory using React state (no browser storage).
</summary>

<core_features>
- Practice Segments collection: Create, edit, archive, and filter practice segments with explicit domain statuses like empty, draft, ready, changed, and archived. Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery. Mutates records array and status fields in the artifact.
- Spatial Composer surface: The user can place a selected record in a spatial composer and rebalance capacity. Visual states include idle, selected, changed, conflict, and resolved. A conflicting or incomplete mutation is rejected without partial updates. Users can undo the last mutation and inspect the linked representation. Updates spatial-composer geometry and selection, derived summaries, and event history.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact to practice-loop-v1.json. Clear the session and import an artifact with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The layout features a desktop primary surface plus summary and inspector. On mobile, secondary surfaces transform into drawers or stacked steps.
- The visual hierarchy makes the current state and next action clear across the primary work surface, linked summary, and detail panel.
- Semantic controls, focus management, live updates, and sufficient contrast ensure an accessible experience.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state during the spatial composer mutation.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
- The application must use React for state management, keeping all state in-memory only. Do not use localStorage, sessionStorage, or external databases.
- All styles must use Tailwind CSS 4.3.2. All assets and libraries must be loaded locally without CDNs.
- The exported artifact must be an interoperable JSON format named practice-loop-v1-spatial-composer.json.
- The JSON schema must represent a MusicPracticeLoopComposerSession with schemaVersion (a task-specific v1 enum), exportedAt (RFC3339), records array, derived object, and history array. Each record is an API-shaped request body.
- Record IDs must be unique and status values must be explicit enums. Required fields, numeric bounds, and cross-record references must validate together.
- Importing an invalid file must be a no-op that preserves the previous valid state and shows an explicit error.
- The application must support keyboard and touch-equivalent controls for the signature mutation, producing identical state changes.
- Performance must remain responsive when exercising a seeded collection of at least 100 records. Unrelated rows must stay stable.
- Copy must accurately name the domain consequence and recovery action precisely (e.g., explicit labels for domain statuses, errors, and empty states).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
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
  "restrictions": ["No arbitrary coordinate, DOM, or storage mutation via WebMCP."]
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
  "restrictions": ["Closed entity and field enums only."]
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
  "restrictions": ["No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."]
}
</module_spec>

Bindings:
- Editor object types: spatial-composer
- Editor operations: select; update_property; set_content
- Entity: practice-segment
- Entity operations: create; select; update; delete; reorder
- Entity fields: id; status; capacity
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json
</webmcp_action_contract>
