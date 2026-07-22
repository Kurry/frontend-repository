# Board Game Scenario Builder — Spatial Composer — Artifact Provenance

<summary>
Manage scenario cards through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.

Existing tools split scenario cards editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts shipped patterns of scrubbed API keys, source labels, trial downloads, plain JSON, and explicit upload failures into a self-contained frontend job.

Stack: React with Zustand (in-memory state only), Tailwind CSS 4.3.2 (pinned), and framer-motion.
</summary>

<core_features>
- Scenario Cards collection: Create, edit, archive, and filter scenario cards with explicit domain statuses (empty, draft, ready, changed, archived).
  - Exact field boundaries are accepted while adjacent out-of-range values are rejected.
  - Invalid required fields preserve the prior valid record and explain recovery.
  - Mutates records array and status fields in the artifact.
- Spatial Composer surface: Place a selected record in a spatial composer and rebalance capacity.
  - Undo the last mutation and inspect the linked representation.
  - States: idle, selected, changed, conflict, resolved.
  - A conflicting or incomplete mutation is rejected without partial updates.
  - Undo restores ordering, selection, and derived values.
- Portable work artifact: Export and restore the actual session work in a fresh state.
  - Clear and import the artifact with field-level validation.
  - States: unsaved, exported, validated, replayed.
  - Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
  - A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- Visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout: primary surface plus summary and inspector.
- Mobile layout: secondary surfaces become drawers or stacked steps without horizontal clipping.
- Accessible semantic controls, focus management, live updates, contrast.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- The acted-on item moves or morphs into its new state. Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Shared application state must use Zustand (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- The data schema contract is BoardGameScenarioBuilderSession with schemaVersion, exportedAt, records, derived, and history fields.
- Each record is an API-shaped would-be request body with unique IDs, explicit enum status values.
The interoperable format is scenario-builder-v1-spatial-composer.json.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The spatial composer surface, derived summary, and artifact query share one state.
- Performance: Keep edits responsive on 100+ seeded records (seed at least 100 for testing).
- Provide explicit error states and domain copy.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step.
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
- Editor object types: scenario-card
- Editor properties: position; capacity; status
- Editor modes: composer; default
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: record
- Entity operations: create; select; update; delete; toggle
- Entity fields: id; name; description; capacity; status
- Artifact operations: export; import; copy
- Export formats: scenario-builder-v1-spatial-composer.json
- Import modes: scenario-builder-v1-spatial-composer.json

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
