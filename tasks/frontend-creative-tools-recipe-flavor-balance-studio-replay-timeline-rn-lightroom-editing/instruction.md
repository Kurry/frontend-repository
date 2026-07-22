<summary>
Build a Recipe Flavor Balance Studio with a Replay Timeline and Lightroom style editing using React 19 Vite Zustand Tailwind CSS 4.3.2 npm-local/no-CDN and Framer Motion. The app allows users to manage flavor components scrub a selected record through its timeline and restore a prior checkpoint and export a session artifact flavor-balance-v1.json. The app must expose WebMCP tooling contracts for state queries and actions.
</summary>

<core_features>
Core features each line is an observable behavior the finished app must exhibit
Feature: Flavor Components collection —
- Display a list or grid of flavor components, allowing users to create, edit, archive, and delete records.
- Each record must include a name, flavor profile/details, and a domain status (empty, draft, ready, changed, archived).
- Provide a filter to view records by domain state.
- Form validation: Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Feature: Replay Timeline surface —
- Implement a Replay Timeline for a selected flavor component.
- The user can scrub a selected record through its timeline (history of edits) and restore a prior checkpoint.
- The UI should indicate timeline states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation and inspect the linked representation: undo restores ordering, selection, and derived values.
Feature: Portable work artifact —
- Provide an Export button that serializes the current session into flavor-balance-v1.json with schemaVersion, exportedAt, records, derived, and history.
- Provide an Import button that clears current state and restores from a selected JSON file, with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps.
- Visual hierarchy makes current state and next action clear.
- Typography and contrast should emphasize status and current checkpoint on the timeline.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
- Smooth transitions for timeline scrubbing and restoring checkpoints.
</motion>

<requirements>
- Built with React 19 Vite Zustand Tailwind CSS 4.3.2 npm-local/no-CDN and Framer Motion.
- Pure frontend application with no backend or localStorage. State must reside in-memory.
- Implements window.webmcp_list_tools and window.webmcp_invoke_tool conforming to the WebMCP contract.
- The timeline mutation changes the primary record, linked view, and status together.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Performance: Keep edits responsive on 100 plus records and avoid rebuilding unrelated surfaces.
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
- Editor object types: flavor-component
- Editor properties: flavor-profile; timeline-checkpoint
- Editor modes: replay; edit
- Editor operations: select; update_property; set_content; switch_mode
- Entity: flavor-component
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; status; details
- Artifact operations: export; import
- Export formats: flavor-balance-v1-json
- Import modes: flavor-balance-v1-json

Mechanics exclusions:
- Drag-scrubbing timeline mechanics stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args
- File picker interaction stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
