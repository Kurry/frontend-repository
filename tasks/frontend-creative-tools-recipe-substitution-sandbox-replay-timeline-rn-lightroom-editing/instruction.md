<summary>
Create a Recipe Substitution Sandbox with a Replay Timeline. The application must manage recipe ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core workflow allows users to scrub a selected record through its timeline and restore a prior checkpoint. It is a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized. The application uses React, Zustand for state management, and Tailwind CSS 4.3.2.
</summary>

<core_features>
The user can create, edit, archive, and filter recipe ingredients with explicit domain statuses empty, draft, ready, changed, and archived. The user can filter or reorder records by domain state. Invalid required fields preserve the prior valid record and explain recovery. The user can scrub a selected record through its timeline and restore a prior checkpoint, observing the idle, selected, changed, conflict, and resolved states. A conflicting or incomplete mutation is rejected without partial updates. The user can export the current session work to recipe-substitution-v1.json and import it with field-level validation. Malformed schema or unknown references make no state change.
</core_features>

<visual_design>
The visual hierarchy makes current state and next action clear. The desktop layout includes a primary surface plus a summary and inspector. Narrow layouts transform secondary surfaces into drawers or stacked steps without horizontal clipping. Copy names the domain consequence and recovery action precisely. The visual and interaction thesis provides a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
Motion connects the acted-on item to its new state when the user scrubs a selected record through its timeline. The transition morphs the item smoothly into its new state. Reduced motion preserves feedback without transforms.
</motion>

<requirements>
The state must be managed in memory using Zustand without using localStorage or sessionStorage. The application is built using React, Vite, and Tailwind CSS 4.3.2. All dependencies must follow the npm-local/no-CDN rule. The application must run on port 3000. It must include a downloadable interoperable artifact recipe-substitution-v1.json which conforms to an API-shaped data schema. The application must include WebMCP tool bindings. The session work product must contain exportedAt and schemaVersion fields.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
- Editor object types: recipe-ingredient
- Editor properties: timeline-state; quantity; substitution
- Editor modes: replay; edit
- Editor operations: select; update_property; switch_mode; preview
- Entity: record
- Entity operations: create; select; update; delete; reorder
- Entity fields: status; timelineState
- Artifact operations: export; import; copy
- Export formats: recipe-substitution-v1.json
- Import modes: recipe-substitution-v1.json

Mechanics exclusions:
- Drag/scrub gestures for the timeline stay Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
