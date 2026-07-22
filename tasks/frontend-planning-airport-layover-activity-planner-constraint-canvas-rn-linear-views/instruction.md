<summary>
Airport Layover Activity Planner (Constraint Canvas). Manage layover activities through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: drag a selected record across constraint lanes and resolve a conflict. Release-derived concept: a shareable filtered workflow view whose grouping, context, and generated update remain linked.
</summary>

<core_features>
- Create, edit, archive, and filter layover activities with explicit domain statuses.
- Use the constraint canvas interaction to derive a decision about the collection: drag a selected record across constraint lanes and resolve a conflict.
- Export and restore the actual session work in a fresh state via a portable work artifact (layover-plan-v1-constraint-canvas.json).
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Mutate a record and use the linked representation to make the next decision.
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
- Desktop primary surface plus summary and inspector.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. Desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile viewports.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
</writing>

<innovation>
- Linked utility: Linked views provide domain utility beyond CRUD. (Optional enhancements)
</innovation>

<requirements>
- The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- The whole job must be operable through real browser mechanics (normal pointer actionability, keyboard traversal).
- The useful end state is an interoperable downloadable artifact (layover-plan-v1-constraint-canvas.json).
- Schema format includes schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records array, derived object, and history array.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in summary; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the webmcp_action_contract below.
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
- Editor object types: activity
- Editor properties: lane; status
- Editor modes: view
- Editor operations: select; update_property
- Entity: activity
- Entity operations: create; select; update; delete
- Entity fields: id; title; status; lane; duration
- Artifact operations: export; import; copy
- Export formats: layover-plan-v1-constraint-canvas.json
- Import modes: layover-plan-v1-constraint-canvas.json

Mechanics exclusions:
- Drag across constraint lanes stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
</webmcp_action_contract>
