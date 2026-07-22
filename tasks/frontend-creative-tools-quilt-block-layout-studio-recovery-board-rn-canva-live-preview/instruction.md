<summary>
Create a Quilt Block Layout Studio focusing on a Recovery Board interaction. Users manage quilt blocks where moving a failed record into a recovery path repairs its downstream consequences. The workspace includes a primary desktop surface with a linked summary and inspector, a mobile preview, and timing notes. The application is in-memory only and generates a portable JSON artifact. It uses React, Vite, Tailwind CSS 4.3.2, and Zustand.
</summary>

<core_features>
Users can create, edit, archive, and filter quilt blocks with explicit domain statuses like draft, ready, changed, and archived.
The recovery board allows users to move a failed record into a recovery path and repair its downstream consequences.
Users can undo the last mutation, which restores ordering, selection, and derived values.
A conflicting or incomplete mutation is rejected without partial updates.
The signature mutation updates the primary record, linked view, and status together.
The linked views include a summary and inspector that react to the shared state.
The application supports importing and exporting a quilt-layout-v1-recovery-board.json artifact containing schemaVersion, exportedAt, records, derived state, and history.
Invalid imports are rejected without state change, preserving the prior valid state.
</core_features>

<visual_design>
The visual hierarchy clearly indicates the current state and next available actions.
The design represents a domain-specific workbench with clear state tokens and intentional density.
Desktop layout features a primary surface with a summary and inspector.
Mobile layout transforms secondary surfaces into drawers or stacked steps without horizontal overflow.
Hover, active, and focus states are distinct and accessible.
</visual_design>

<motion>
Motion connects the acted-on item to its new state during the recovery board mutation.
All animations have a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
The app must be built with React, Vite, Zustand (for state management), and Tailwind CSS 4.3.2 (pinned).
All application state must be stored in-memory using Zustand. Do not use localStorage or other browser storage APIs.
The state includes the quilt blocks collection, recovery board geometry/selection, derived summaries, and event history.
The exported artifact quilt-layout-v1-recovery-board.json must validate against a strict schema.
The app must seed a deterministic collection with empty, boundary, valid, and conflict states on load.
The app must be fully accessible, including keyboard navigation parity, focus management, and screen reader support.
Alternate input (keyboard/touch) must produce identical state to pointer interactions.
The application must support at least 100 records while keeping the signature interaction responsive.
WebMCP tools must be implemented and bound to the application state as defined in the contract.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in /app.
/app/package.json MUST define npm scripts named exactly start and verify:build.
Implement exactly the webmcp_action_contract below. Register tools yourself using the same handlers as the visible UI.
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
- Editor object types: recovery-board
- Editor properties: status
- Editor operations: select; update_property; preview
- Entity: block
- Entity operations: create; select; update; delete
- Entity fields: name; status; dimensions
- Artifact operations: export; import
- Export formats: json
- Import modes: json

Mechanics exclusions:
- Drag/drop geometry stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
