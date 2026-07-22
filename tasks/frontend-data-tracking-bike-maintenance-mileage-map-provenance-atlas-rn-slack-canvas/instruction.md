<summary>
Build a Bike Maintenance Mileage Map with a Provenance Atlas using React, Vite, Zustand, and Tailwind CSS 4.3.2. The app manages bike service records in a bounded local workflow where a selected record is traced to source evidence and a bad lineage is quarantined. This creates an interoperable session artifact (bike-maintenance-v1-provenance-atlas.json) capturing authored state and derived consequences for a clean round trip.
</summary>

<core_features>
Bike Service Records collection: Create, edit, archive, and filter bike service records with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields preserve the prior valid record and explain recovery. Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Provenance Atlas surface: A canonical domain mutation traces a selected record to source evidence and quarantines a bad lineage. This updates the provenance-atlas geometry/selection, derived summaries, and event history together. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the session work. Export produces bike-maintenance-v1-provenance-atlas.json matching the API-shaped schema (schemaVersion, exportedAt, records, derived state, and history). Import with field-level validation regenerates exportedAt and restores authored structure. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Layout includes a desktop primary surface plus summary and inspector. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state. A reduced-motion equivalent preserves feedback without transforms.
</motion>

<responsiveness>
Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack, drawer, or stepper without horizontal overflow at mobile widths.
</responsiveness>

<accessibility>
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard and touch-equivalent) produces identical state with visible focus and live feedback.
</accessibility>

<performance>
Keep edits responsive on a seeded collection with at least 100 records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Copy names the domain consequence and recovery action precisely. Inspect labels, statuses, errors, and empty-state text.
</writing>

<requirements>
State must use Zustand (in-memory only); no localStorage or other browser storage APIs. A page reload returns the app to its seeded state (at least 100 seeded records including empty, boundary, valid, and conflict states, with no target outcome pre-completed).
Stack: React with Zustand and Tailwind CSS 4.3.2 (pinned), frontend-only.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
Product naming: Bike Maintenance Mileage Map; serve over local HTTP for verification on port 3000.
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
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview", "trace", "quarantine", "undo"],
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
- Editor object types: provenance-atlas
- Editor operations: select; trace; quarantine; undo
- Entity: record
- Entity operations: create; select; update; delete; filter
- Entity fields: status
- Artifact operations: export; import
- Export formats: bike-maintenance-v1-provenance-atlas.json
- Import modes: bike-maintenance-v1-provenance-atlas.json

Mechanics exclusions:
- Gesture mechanics and alternate input remain Playwright-observed.
</webmcp_action_contract>
