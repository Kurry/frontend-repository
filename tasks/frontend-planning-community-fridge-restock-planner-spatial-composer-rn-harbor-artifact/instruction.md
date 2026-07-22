<summary>
Build a Community Fridge Restock Planner featuring a Spatial Composer using React, Tailwind CSS 4.3.2, and Lucide React icons. The application manages restock tasks and provides a visual spatial composer to rebalance fridge capacity by placing selected tasks. It must produce a portable work artifact fridge-restock-v1-spatial-composer.json containing the authored state, derived summary, and history, which can be exactly restored via import.
</summary>

<core_features>
- Restock Tasks collection: Create, edit, archive, and filter restock tasks.
  - Each record has an ID, name, status (draft, ready, changed, archived), and capacity value (numeric bounded 1-100).
  - List displays records. Filter by domain state. Empty state shows when no records match.
  - Invalid required fields or out-of-bounds capacity during edit/create preserve the prior valid state and show an inline error message explaining the recovery.
- Spatial Composer surface:
  - The signature mutation: place a selected record in a spatial composer and rebalance capacity. Selecting a task and moving it to the spatial composer updates its status to 'ready' or 'changed' and recalculates the fridge's remaining capacity.
  - Rebalancing capacity: The spatial composer has a total capacity (e.g., 1000). Placing a record reduces the remaining capacity. Removing it restores capacity.
  - A conflicting or incomplete mutation (e.g. exceeding capacity) is rejected without partial updates.
  - Undo: A button to undo the last mutation, restoring ordering, selection, and derived capacity values.
- Portable work artifact:
  - Export: Generates fridge-restock-v1-spatial-composer.json containing schemaVersion ("v1"), exportedAt (RFC3339 timestamp), records (array of restock tasks), derived (summary object with total, used, and remaining capacity), and history (array of action logs).
  - Import: Clear current state and import an exported artifact with field-level validation.
  - Invalid import: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. Valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
- Complete user flow: Create a restock task, edit its capacity, mutate by placing it in the spatial composer to rebalance capacity, undo the action, and then complete the task. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Boundaries and recovery: Try exact bounds (1 and 100 capacity), an invalid cross-field value, an empty state, and a malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Visual hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear. A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Causal motion: When placing a selected record in a spatial composer and rebalancing capacity, motion connects the acted-on item to its new state (e.g., sliding or morphing into the composer).
- Reduced motion: Respects prefers-reduced-motion to preserve feedback without transforms.
</motion>

<responsiveness>
- Mobile mode: At a narrow viewport (mobile), the desktop surface becomes a usable stack/drawer/stepper without horizontal overflow, preserving the signature interaction.
</responsiveness>

<accessibility>
- Alternate input: The signature interaction (place a selected record in a spatial composer and rebalance capacity) can be performed with keyboard (e.g., using Tab and Enter/Space) and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Large collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive (acknowledges within 100ms) and unrelated rows stay stable without layout jumps.
</performance>

<writing>
- Domain copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely (e.g., "Capacity exceeds limit", "Must be between 1 and 100").
</writing>

<innovation>
- Linked utility: Mutate a record and use the linked representation (derived capacity summary) to make the next decision. Linked views provide domain utility beyond basic CRUD.
</innovation>

<requirements>
- The application must use React, Tailwind CSS 4.3.2, and Lucide React icons.
- All libraries must be npm-local (no CDNs).
- The state must be completely in-memory (no localStorage, sessionStorage, or other persistence). A page reload returns the app to its seeded state (or empty state).
- Use framer-motion for animations.
- The UI must be fully functional and run on port 3000 via npm start.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

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

Bindings:
- Entity: record
- Entity operations: create; update; delete; select
- Entity fields: id; name; status; capacity
- Artifact operations: export; import
- Export formats: json
- Import modes: json
- Editor object types: composer-slot
- Editor operations: add; delete; select

Mechanics exclusions:
- Drag/drop geometry stays Playwright (gesture mechanics)
- File selection stays Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
