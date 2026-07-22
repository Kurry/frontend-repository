<summary>
Manage air readings through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery. The state must be entirely in-memory. NO localStorage or remote network calls. All assets must be loaded locally without CDNs. Use Tailwind CSS 4.3.2.
</summary>

<core_features>
The user can create, edit, archive, and filter air readings with explicit domain statuses.
The user can attach evidence to a selected record and resolve an audit discrepancy.
The user can undo the last mutation and inspect the linked representation.
The user can export the current artifact and import it with field-level validation.
</core_features>

<visual_design>
The visual hierarchy makes current state and next action clear.
The desktop primary surface plus summary and inspector present intentional density on a focused canvas.
</visual_design>

<motion>
Motion connects the acted-on item to its new state.
A reduced-motion equivalent is provided.
</motion>

<requirements>
The app is built with Vite, React, and Tailwind CSS v4 without any CDNs or external assets. All assets must be installed via npm and bundled locally.
The state is stored strictly in-memory. LocalStorage is prohibited.
All required fields, numeric/date bounds, and cross-record references validate together using schema-driven form validation.
Invalid imports make no state change.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Commit the working solution directly to the application directory.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1

Module specs:
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
- Entity: air-reading
- Entity operations: create; select; update; delete
- Entity fields: evidence; status; audit_discrepancy
- Artifact operations: export; import; copy
- Export formats: air-quality-v1-audit-lens.json
- Import modes: air-quality-v1-audit-lens.json

Mechanics exclusions:
- Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters
- File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities
</webmcp_action_contract>
