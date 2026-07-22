<summary>
Manage brew experiments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Release-derived concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized. This task makes the connected user job observable in one frontend-only product.
</summary>

<core_features>
- Brew Experiments collection: Create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived). Filter or reorder records by domain state. Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Replay Timeline surface: scrub a selected record through its timeline and restore a prior checkpoint. Undo the last mutation and inspect the linked representation. States: idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Portable work artifact: Export and restore the actual session work in a fresh state (unsaved, exported, validated, replayed). Export the current artifact; clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
- Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Visual Hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- Source Fidelity: The visual and interaction thesis is coherent without copying unrelated screens. A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Causal Motion: scrub a selected record through its timeline and restore a prior checkpoint. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Mobile Mode: Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
- Alternate Input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Large Collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Domain Copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked Utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- Note: no specific features mentioned in the prompt are "not covered" but evidence of linked utility shows innovation.
</innovation>

<requirements>
- The application must use strictly in-memory state; NO localStorage, sessionStorage, or other browser storage APIs are allowed. A page reload must return the app to its exact seeded state (with deterministic fixtures).
- React with Vite or similar modern stack (frontend-only).
- Tailwind CSS 4.3.2 must be used.
- All libraries must be npm-local (no CDNs).
- Seed a deterministic collection with empty, boundary, valid, and conflict states (at least 100 records for performance testing).
- Interoperable format: brew-experiment-v1-replay-timeline.json. Artifact round-trip (export, clear, import) must restore authored structure, derived state, and history. Invalid import is a no-op.
- Record shape: CoffeeBrewExperimentLogSession with schemaVersion ('brew-experiment-v1'), exportedAt (RFC3339), records[], derived{}, and history[]. Each record is an API-shaped would-be request body.
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
- Editor object types: timeline-checkpoint
- Editor properties: timeline-state
- Editor operations: select; update_property
- Entity: brew-experiment
- Entity operations: create; select; update; delete; reorder
- Entity fields: status; timelineState
- Artifact operations: export; import; copy
- Export formats: brew-experiment-v1-replay-timeline.json
- Import modes: brew-experiment-v1-replay-timeline.json

Mechanics exclusions:
- Drag/scrub geometry stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args
</webmcp_action_contract>
