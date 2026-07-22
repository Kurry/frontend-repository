# Home Air Quality Trendbook — Constraint Canvas — Linear Filtered Views

<summary>
Manage air readings through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: drag a selected record across constraint lanes and resolve a conflict. Release-derived concept: a shareable filtered workflow view whose grouping, context, and generated update remain linked.
Stack: React 18, Vite, Tailwind CSS 4.3.2, @dnd-kit/core, React Hook Form with Zod, and local reducer state.
</summary>

<core_features>
- Users can view a list of home air quality records representing readings from different rooms or sensors.
- Records have a domain status such as Draft, Ready, Changed, or Archived.
- Users can create, edit, archive, and filter air readings.
- A Constraint Canvas surface allows users to group and organize records into different lanes (e.g., status lanes or assigned constraint lanes).
- Users can drag a selected record across constraint lanes and resolve a conflict. A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation and inspect the linked representation. Undo restores ordering, selection, and derived values.
</core_features>

<user_flows>
- To update a record's status, a user drags it from its current lane and drops it into a target lane on the Constraint Canvas. If the transition is valid, the record's status updates, moving it into the new lane.
- If a user drags a record into an invalid lane causing a conflict, the UI indicates a conflict state and allows the user to resolve it (e.g., by confirming a secondary action or reverting).
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
</edge_cases>

<visual_design>
- The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- The acted-on item moves or morphs into its new state.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile devices.
</responsiveness>

<accessibility>
- Alternate input produces identical state with visible focus and live feedback.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD. Mutate a record and use the linked representation to make the next decision.
</innovation>

<requirements>
- In-memory state only; NO localStorage or other persistence mechanisms are allowed.
- The artifact air-quality-v1.json preserves authored state and derived consequences for a clean round trip.
- Record shape: HomeAirQualityTrendbookSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Export and import must validate against this schema.
- Implement window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool.
- Use only standard WebMCP modules: entity-collection-v1, artifact-transfer-v1.
- All libraries must be npm-local (no CDNs).
- The application must use Tailwind CSS 4.3.2.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
- Entity operations: create; select; update; delete
- Entity fields: id; status; reading; room; timestamp
- Artifact operations: export; import; copy
- Export formats: air-quality-v1.json
- Import modes: air-quality-v1.json
- Editor object types: constraint-canvas
- Editor operations: select; update_property
- Editor properties: lane; position

Mechanics exclusions:
- Drag-and-drop gestures across lanes stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
