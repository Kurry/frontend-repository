<summary>
Conference Speaker Greenroom Board eval. A domain-native browser surface to manage speaker slots where a signature interaction connects a selected record to a handoff owner and updates readiness. This single mutation updates linked views and an interoperable artifact. It adapts a visual token and prototype editor pattern into a self contained frontend job.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Create edit archive and filter speaker slots with explicit domain statuses.
Connect a selected record to a handoff owner and update readiness.
Undo the last mutation and inspect the linked representation.
Export the current artifact.
Clear and import the artifact with field level validation.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record
- Filter or reorder records by domain state
- Connect a selected record to a handoff owner and update readiness
- Undo the last mutation and inspect the linked representation
- Export the current artifact
- Clear and import it with field-level validation
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery
- A conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
- Desktop primary surface plus summary and inspector
- Visual hierarchy makes current state and next action clear
- The visual and interaction thesis is coherent without copying unrelated screens
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state
- Reduced motion preserves feedback without transforms
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support
- Alternate input produces identical state with visible focus and live feedback
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely
- Inspect labels, statuses, errors, and empty-state text
</writing>

<innovation>
Optional enhancements: linked views provide domain utility beyond CRUD. If not covered, evidence should be provided.
</innovation>

<requirements>
- Tailwind CSS 4.3.2 is required
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
Shared application state must be entirely in memory.
Do not use localStorage or sessionStorage.
Speaker slots session artifact shape is ConferenceSpeakerGreenroomBoardSession with schemaVersion exportedAt records derived and history.
schemaVersion is a task specific v1 enum and exportedAt is RFC3339.
Record IDs are unique and status values are explicit enums.
Required fields numeric bounds date bounds and cross record references validate together.
Persistence is in memory only export and import is the persistence boundary.
Interoperable format is speaker-greenroom-v1-handoff-map.json.
Round trip export clear import and re open the edited record must match authored structure derived state and history.
Served on port 3000 via npm start.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`.
- `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build`.
- Run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
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
- Editor properties: owner; readiness
- Editor modes: view; edit
- Editor operations: select; update_property
- Entity: record
- Entity operations: create; select; update; delete; toggle
- Entity fields: id; status; owner; readiness
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag, resize, keyboard movement, and DOM interaction remain Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
</webmcp_action_contract>