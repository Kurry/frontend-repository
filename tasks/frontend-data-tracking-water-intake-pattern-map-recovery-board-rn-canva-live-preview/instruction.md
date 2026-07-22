<summary>
Water Intake Pattern Map — Recovery Board — Canva Live Preview good-app eval. Manage intake events through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences.
</summary>

<core_features>
- Intake Events collection: Create, edit, archive, and filter intake events with explicit domain statuses (empty, draft, ready, changed, archived).
- Recovery Board surface: Move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact; clear and import it with field-level validation.
- Linked views: The recovery board surface, derived summary, and artifact query share one state. The recovery board mutation changes the primary record, linked view, and status together.
</core_features>

<user_flows>
- Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Boundaries and recovery: Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- A conflicting or incomplete mutation is rejected without partial updates.
</edge_cases>

<visual_design>
- Visual Hierarchy: The visual hierarchy makes current state and next action clear. Inspect the primary work surface, linked summary, and detail panel.
- Distinctive workbench: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Causal motion: Move a failed record into a recovery path and repair its downstream consequences. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Mobile mode: Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Alternate input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Large collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Domain copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- In-memory state only; NO localStorage or other persistence mechanisms are allowed.
- Downloadable Artifact: hydration-pattern-v1-recovery-board.json matches the shape WaterIntakePatternMapSession with schemaVersion, exportedAt, records, derived, and history; each record is an API-shaped would-be request body.
- Validation: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric bounds, date bounds, and cross-record references validate together.
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
- Editor object types: recovery-board
- Editor properties: status
- Editor modes: view; edit
- Editor operations: select; update_property
- Entity: event
- Entity operations: create; select; update; delete; toggle
- Entity fields: id; title; amount; status
- Artifact operations: export; import
- Export formats: hydration-pattern-v1-recovery-board.json
- Import modes: json

Mechanics exclusions:
- Drag, resize, hover remain Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
