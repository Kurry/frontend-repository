<summary>
Build a Bike Maintenance Mileage Map — Scenario Weaver — Spotify Playlists application using React, Vite, and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs. The genre is good-app, so state must be entirely in-memory with no localStorage. The application allows users to manage bike service records, branch a selected record into a scenario, compare linked outcomes, and export/import the session artifact (bike-maintenance-v1.json).
</summary>

<core_features>
Feature: Bike Service Records collection
- Create, edit, archive, and filter bike service records with explicit domain statuses (empty, draft, ready, changed, archived)
- Filter or reorder records by domain state
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery

Feature: Scenario Weaver surface
- Signature interaction: branch a selected record into a scenario and compare linked outcomes
- Undo the last mutation and inspect the linked representation
- A conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values

Feature: Portable work artifact
- Export the current artifact (bike-maintenance-v1.json)
- Clear and import it with field-level validation
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
- Copy names the domain consequence and recovery action precisely.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- All assets must be loaded locally without CDNs.
- The state must be entirely in-memory. Never use localStorage or remote network calls.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- The exported/imported artifact bike-maintenance-v1.json must conform to the shape: schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[] (array of objects with unique IDs and explicit domain enum statuses), derived{} (derived summary data), and history[] (event history).
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- structured-editor-v1
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
- entity-collection-v1: entity_record operations (create, update, select, delete)
- structured-editor-v1: editor_scenario operations (branch a selected record into a scenario, undo)
- artifact-transfer-v1: artifact_session operations (export, import, clear)
</webmcp_action_contract>
