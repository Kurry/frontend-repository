# Home Energy Peak Observatory — Provenance Atlas — Slack Canvas

<summary>
Manage energy readings through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence.
</summary>

<core_features>
Energy Readings collection: Create, edit, archive, and filter energy readings with explicit domain statuses.
Provenance Atlas surface: Trace a selected record to source evidence and quarantine a bad lineage. Undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation must be rejected without partial updates.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact; clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job must be recoverable without reload.
Signature Interaction: Trace a selected record to source evidence and quarantine a bad lineage. The provenance atlas mutation changes the primary record, linked view, and status together.
Artifact Round Trip: Export, clear, import, and inspect the edited variant record and derived state. Authored order, selection, geometry and domain state survive; invalid import is a no-op.
</user_flows>

<edge_cases>
Boundaries and recovery: Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
Visual hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
Design fidelity: The visual and interaction thesis is coherent without copying unrelated screens. A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Layout includes a desktop primary surface plus summary and inspector.
</visual_design>

<motion>
Causal motion: Trace a selected record to source evidence and quarantine a bad lineage. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
Mobile mode: Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
Alternate input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
Large collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Domain copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Linked utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
The application must use Tailwind CSS 4.3.2. All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
</integrity>

<delivery>
- The oracle implementation serves on port 3000 via `npm start` with zero console/page errors.
- Commits include `dist/` if it serves build output.
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
- Entity: energy_reading
- Entity operations: create; select; update; delete; filter; quarantine
- Entity fields: id; value; timestamp; status; lineage
- Artifact operations: export; import
- Export formats: energy-peak-v1.json
- Import modes: energy-peak-v1.json

Mechanics exclusions:
- Drag, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
