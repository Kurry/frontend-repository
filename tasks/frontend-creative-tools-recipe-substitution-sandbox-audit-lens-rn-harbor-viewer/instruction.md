<summary>
Manage recipe ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. This frontend-only application is built with React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Lucide React. It operates entirely in-memory with no localStorage or backend sync. A page reload returns the app to its seeded state. All dependencies must be installed locally via npm without CDNs.
</summary>

<core_features>
The application centers around a Recipe Ingredients collection where users can create, edit, archive, and filter ingredients with explicit domain statuses (empty, draft, ready, changed, archived). It includes an Audit Lens surface allowing users to attach evidence to a selected record and resolve an audit discrepancy. This canonical mutation updates the linked summary, updates the artifact representation, and supports an undo action. Additionally, users can export and restore the actual session work via a Portable work artifact (recipe-substitution-v1.json). Import includes field-level validation and clears the existing session work upon a valid load.
</core_features>

<visual_design>
The visual thesis is a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The layout includes a desktop primary surface plus a summary and artifact inspector. On mobile, secondary surfaces transform into drawers or stacked steps to preserve touch targets and avoid horizontal clipping. The visual hierarchy makes the current state and next action clear, with semantic controls and visible focus for accessibility.
</visual_design>

<motion>
Motion connects the acted-on item to its new state to provide causal feedback when attaching evidence or resolving an audit discrepancy. A reduced-motion equivalent must preserve feedback without transforms.
</motion>

<requirements>
State must be managed exclusively in-memory using Zustand. No localStorage, sessionStorage, or other browser storage APIs are allowed. A page reload resets the app to its deterministic seeded state (including empty, boundary, valid, and conflict states, with at least 100 records for performance testing). The styling framework is strictly Tailwind CSS 4.3.2 (pinned locally). Icons must use Lucide React installed locally via npm; no icon fonts or CDNs. All forms must provide inline field-level errors and disable submission until valid, validating against API-shaped schemas for the recipe-substitution-v1.json contract. The portable artifact export must contain schemaVersion, exportedAt, records, derived state, and history. Import must validate structure, schemaVersion, unique IDs, and field bounds, rejecting invalid records without partial mutation. Alternate input (keyboard and touch-equivalent) must produce the identical canonical mutation. The application must expose a WebMCP contract.
</requirements>

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
- Entity: record
- Entity operations: create; select; update; delete; reorder
- Entity fields: name; quantity; unit
- Editor object types: audit-lens
- Editor operations: update_property; select
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json
</webmcp_action_contract>
