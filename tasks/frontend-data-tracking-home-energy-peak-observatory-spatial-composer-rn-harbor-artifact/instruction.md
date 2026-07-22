<summary>
Build a Home Energy Peak Observatory app using Solid.js, Solid stores, and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs. The app provides a spatial composer to place selected energy readings and rebalance capacity, producing an interoperable energy readings session artifact. It manages energy readings in an in-memory database with a domain-native signature interaction, a linked derived consequence, and no localStorage.
</summary>

<core_features>
Feature: Energy Readings collection
Provide an interface to create, edit, archive, and filter energy readings. A deterministic collection must be seeded initially with empty, boundary, valid, and conflict states, without any pre-completed target outcome. Explicit domain statuses must be supported (e.g., empty, draft, ready, changed, archived). The form accepts exact field boundaries but rejects adjacent out-of-range values. If a required field is invalid, the UI must preserve the prior valid record and display an explanation for recovery.

Feature: Spatial Composer surface
Provide a spatial composer surface where a user can place a selected record and rebalance capacity. The mutation must change the primary record, linked view, and status together. The states must include: idle, selected, changed, conflict, resolved. Reject a conflicting or incomplete mutation without applying partial updates. Allow undoing the last mutation and inspect the linked representation; undo restores ordering, selection, and derived values.

Feature: Portable work artifact
Implement an Export interaction to download the actual session work in a fresh state as a JSON artifact. Implement an Import interaction to clear and import an artifact with field-level validation. The visible states for the artifact must include unsaved, exported, validated, replayed. Handle malformed schema, duplicate IDs, unknown references, and invalid bounds by making no state change. A valid import must restore the authored structure and regenerate the exportedAt timestamp.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy must make the current state and next action clear, including the primary work surface, linked summary, and detail panel.
Ensure the implementation respects the cited source interaction vocabulary without copying unrelated screens.
</visual_design>

<motion>
The acted-on item must move or morph into its new state.
Include a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
All assets must be loaded locally without CDNs.
Desktop layout is the primary surface, with mobile mode transforming secondary surfaces into usable stacks/drawers/steppers without horizontal overflow.
Ensure alternate input parity: keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Maintain responsiveness for a seeded collection of at least 100 records; the signature interaction remains responsive and unrelated rows stay stable.
Copy must precisely name the domain consequence and recovery actions.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The oracle implementation should run on port 3000.
</delivery>

<webmcp_action_contract>
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Records and local entities.",
  "permitted_operations": ["create", "select", "update", "delete"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy workflows.",
  "permitted_operations": ["import", "export"],
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
- Entity operations: create; select; update; delete
- Entity fields: status
- Artifact operations: export; import
- Export formats: energy-peak-v1-spatial-composer-json
- Import modes: energy-peak-v1-spatial-composer-json

Mechanics exclusions:
- Drag-and-drop or pointer interactions stay Playwright (gesture mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>