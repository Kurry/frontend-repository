<summary>
Household Waste Diversion Tracker is a frontend-native application to manage waste events through a constraint canvas where one meaningful mutation updates linked views and an interoperable artifact. It tracks waste diversion records, featuring constraint lanes to resolve conflicts, and exports a shareable filtered workflow view.
</summary>

<core_features>
- Create, edit, archive, and filter waste events with explicit domain statuses.
- The constraint canvas surface: drag a selected record across constraint lanes and resolve a conflict.
- Linked views: The constraint canvas surface, derived summary, and artifact query share one state.
- Undo the last mutation and inspect the linked representation.
- Export and import a portable work artifact (waste-diversion-v1.json) containing the session's work in a fresh state.
</core_features>

<user_flows>
- Complete User Flow: Create, edit, mutate via drag-and-drop on constraint canvas, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds during import make no state change.
</edge_cases>

<visual_design>
- Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector.
- Visual hierarchy: Makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state (causal motion).
- Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Mobile mode: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack/drawer/stepper.
</responsiveness>

<accessibility>
- Alternate input: Repeat the signature interaction (drag across lanes) with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Domain copy: Copy names the domain consequence and recovery action precisely (inspect labels, statuses, errors, and empty-state text).
</writing>

<innovation>
- Linked utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- Source fidelity: The visual and interaction thesis is coherent without copying unrelated screens.
</innovation>

<requirements>
- Stack: React, Vite, Tailwind CSS 4.3.2 (or equivalent).
- State: In-memory only state. NO localStorage, sessionStorage, or other persistence mechanisms.
- All libraries must be npm-local (no CDNs).
- The application must seed a deterministic collection with empty, boundary, valid, and conflict states.
- The useful end state is an interoperable downloadable artifact (waste-diversion-v1.json) of the session's actual work.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`.
- `package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- App must be accessible on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

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
- Editor object types: constraint-canvas
- Editor properties: lane, conflict_status
- Editor operations: select; update_property
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: name, weight, status, lane
- Artifact operations: export; import; copy
- Export formats: waste-diversion-v1.json
- Import modes: waste-diversion-v1.json

Mechanics exclusions:
- Drag-and-drop on the canvas stays Playwright-observed.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
</webmcp_action_contract>
