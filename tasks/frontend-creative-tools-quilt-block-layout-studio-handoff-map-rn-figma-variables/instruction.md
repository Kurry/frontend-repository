# Quilt Block Layout Studio — Handoff Map — Figma Variables

<summary>
Quilt Block Layout Studio is a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core workflow centers on connecting a selected quilt block record to a handoff owner and updating its readiness state. This connected user job is observable in one frontend-only product, adapting Figma's pattern of variable modes, expressions, conditionals, and code-to-canvas design-system synchronization into a self-contained local artifact (a visual token/prototype editor where variable changes update modes, preview states, and export tokens).
</summary>

<core_features>
- Create, edit, archive, and filter quilt blocks with explicit domain statuses (empty, draft, ready, changed, archived).
- The signature interaction: Connect a selected record to a handoff owner and update its readiness via the Handoff Map surface. This mutation updates the primary record, linked view, and status together.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation and inspect the linked representation; undo restores ordering, selection, and derived values.
- Invalid required fields preserve the prior valid record and explain recovery.
- A shared-state architecture where mutating records updates the handoff-map geometry/selection, derived summaries, and event history.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive design: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps without horizontal clipping.
- Export and import a portable work artifact (quilt-layout-v1-handoff-map.json) with strict field-level validation (schemaVersion, exportedAt, records, derived state, and history).
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes the current state and next action clear across the primary work surface, linked summary, and detail panel.
- Semantic controls with visible focus and live feedback.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state (causal motion).
- A reduced-motion equivalent is provided that preserves feedback without transforms.
</motion>

<requirements>
- Shared application state must use Zustand (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- State contracts (behavioral, not storage keys):
  - Mutating a record updates the handoff-map geometry/selection, derived summaries, and event history.
  - Undo restores ordering, selection, and derived values.
- Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2, framer-motion (frontend-only).
- Validation: Forms driven by Zod schema; inline per-field errors appear, submit is disabled until valid. The record matches the API-shaped QuiltBlockLayoutStudioSession shape.
- Seed a deterministic collection (at least 5 records) with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- Useful end state: Interoperable quilt blocks session artifact (quilt-layout-v1-handoff-map.json) containing schemaVersion (quilt-layout-v1), exportedAt (RFC3339), records, derived, and history.
- Export/Import validates schema, enums, bounds, unique IDs, and cross-record references, regenerating exportedAt on import. Invalid import is a no-op.
- All libraries installed via npm-local/no-CDN rule. explicit "type": "module" in package.json.
- Product naming: Quilt Block Layout Studio; serve over local HTTP for verification.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds). run via `npm start` on port 3000.
- WebMCP is a required delivery step. Implement exactly the `<webmcp_action_contract>` below.
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
- Editor object types: handoff-map
- Editor properties: owner; readiness; status
- Editor modes: edit; view; export
- Editor operations: select; update_property; set_content; preview
- Entity: quilt-block
- Entity operations: create; select; update; delete
- Entity fields: name; owner; readiness; status
- Artifact operations: export; import; copy
- Export formats: quilt-layout-v1-handoff-map.json
- Import modes: quilt-layout-v1-handoff-map.json

Mechanics exclusions:
- Drag/drop geometry stays Playwright (gesture mechanics)
- File picker interaction, clipboard contents, and downloaded artifacts remain Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
