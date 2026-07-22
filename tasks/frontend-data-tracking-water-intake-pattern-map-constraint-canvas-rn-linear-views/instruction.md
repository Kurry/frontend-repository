<summary>
Create a React-based single-page application for a Water Intake Pattern Map and Constraint Canvas. The application manages intake events in a bounded local workflow, heavily inspired by Linear's shareable filtered views, reordered groups, and project updates. The app is frontend-only with strictly in-memory state; no localStorage or other persistence mechanisms. It must provide a Constraint Canvas surface where users can drag a selected record across constraint lanes and resolve a conflict, with linked views updating synchronously.
</summary>

<core_features>
- Intake Events collection: Create, edit, archive, and filter intake events with explicit domain statuses (e.g., draft, ready, changed, archived).
- Constraint Canvas surface: Drag a selected record across constraint lanes and resolve a conflict. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact as hydration-pattern-v1-constraint-canvas.json. Clear and import it with field-level validation.
- A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change during import. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile viewports.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
The whole job must be implemented with in-memory state only. NO localStorage, sessionStorage, or IndexedDB.
- All libraries must be npm-local (no CDNs).
- Stack: React, Vite, Tailwind CSS (Tailwind CSS 4.3.2 pinned if needed, or 3.x), frontend-only.
- The application must use Tailwind CSS 4.3.2.
- Data shape WaterIntakePatternMapSession: schemaVersion (must be v1), exportedAt (RFC3339), records, derived, history.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- Seed at least 100 records for performance evaluation.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed.
- `package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below.
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
- Entity: record
- Entity operations: create; select; update; delete; reorder
- Entity fields: id; status; amount; time
- Artifact operations: export; import
- Export formats: hydration-pattern-v1-constraint-canvas.json
- Import modes: json

Mechanics exclusions:
- Drag-and-drop gesture mechanics stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
</webmcp_action_contract>
