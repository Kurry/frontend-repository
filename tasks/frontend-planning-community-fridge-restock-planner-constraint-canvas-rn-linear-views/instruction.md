<summary>
Build the Community Fridge Restock Planner, a "good-app" genre React application for managing restock tasks in a bounded local workflow. The application features a Constraint Canvas surface where users manage restock tasks with explicit domain statuses, resolve conflicts by dragging records across constraint lanes, and export/import interoperable Session JSON artifacts.
</summary>

<reference_screenshots>
Screenshots of the reference application are not provided for this generative task. Create a distinct visual design based on the instructions.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Restock Tasks collection —
- Create, edit, and archive restock tasks with explicit domain statuses
- A restock task record includes: ID (unique), title (required, max 40 chars), description, quantity (integer > 0), domain state (empty, draft, ready, changed, archived)
- Filter or reorder records by domain state in the main task list view
Feature: Constraint Canvas surface —
- A visual board with constraint lanes representing the domain states
- Users can drag a selected record across constraint lanes and resolve a conflict
- Constraint rules: certain lane movements might require resolving a conflict (e.g., missing required fields like quantity before moving to 'ready')
- A conflicting or incomplete mutation is rejected without partial updates
- Undo the last mutation (restores ordering, selection, and derived values) and inspect the linked representation
Feature: Portable work artifact —
- Live derived summary updating dynamically based on the current canvas state and lane counts
- Export the current artifact as fridge-restock-v1-constraint-canvas.json (Session JSON)
- The exported artifact conforms to CommunityFridgeRestockPlannerSession schema: schemaVersion, exportedAt, records, derived, and history
- Clear the current session and import it back with field-level validation
- Import completely restores authored structure, updates linked views, and regenerates exportedAt
- Malformed schema, duplicate IDs, unknown references, and invalid bounds during import make no state change
</core_features>

<user_flows>
End-to-end flows:
- Create and edit flow: A user creates a new task in the 'draft' state, edits its quantity, and the derived summary updates to reflect the new count.
- Canvas drag and conflict flow: A user drags a selected record from 'draft' to 'ready' across the constraint lanes. If a conflict occurs (e.g., missing fields), a resolution dialog or inline error appears. The user resolves it, and the record updates its status.
- Undo flow: After a successful mutation, the user clicks Undo. The mutation reverses, the record returns to its previous lane, selection is restored, and the event history reflects the reversal.
- Export and import flow: The user exports the artifact. They clear the board, creating an empty state. They import the previously exported JSON file, and the exact state (lanes, derived summary, history) is fully restored.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted (e.g., exactly 40 chars for title), while adjacent out-of-range values are rejected with explicit field-level error copy.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete drag-and-drop mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values precisely.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- Distinctive domain-specific workbench with clear state tokens and intentional density.
- Layout: Desktop primary surface (canvas) plus summary and inspector.
- Clear visual hierarchy making current state and next action clear.
- Constraint lanes visually distinguish their domain states (empty, draft, ready, changed, archived).
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state during the constraint canvas mutation.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent (no transforms).
</motion>

<responsiveness>
- Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping.
- Mobile mode transforms the desktop surface into a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Screen-reader live announcements for state changes and validation errors.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s.
</performance>

<writing>
- Domain copy: Copy names the domain consequence and recovery action precisely.
- Explicit field-level error messages identifying the rejected value or rule and the recovery action.
</writing>

<innovation>
- A shareable filtered workflow view whose grouping, context, and generated update remain linked.
</innovation>

<requirements>
- The application must use React, Tailwind CSS 4.3.2, and be built with Vite.
- All libraries must be npm-local (no CDNs).
- In-memory only state; NO localStorage, sessionStorage, or other persistence mechanisms. A page reload returns the app to its seeded state.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
</requirements>

<integrity>
- Work only from this instruction and `/solution/app`; do not use external resources or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/solution/app`.
- `/solution/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- Implement exactly the `<webmcp_action_contract>` below.
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
- Editor object types: constraint-canvas, lane
- Editor properties: status
- Editor modes: edit
- Editor operations: select; update_property; switch_mode
- Entity: restock-task
- Entity operations: create; select; update; delete
- Entity fields: id; title; description; quantity; status
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag-and-drop geometric intersection logic stays Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
