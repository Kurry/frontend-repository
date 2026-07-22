# Character Costume Continuity Board — Scenario Weaver

<summary>
A Character Costume Continuity Board application centered around a Scenario Weaver feature. The application allows users to manage a collection of costume looks branch a selected record into a scenario compare linked outcomes and export or import the session state as an interoperable JSON artifact. This is a local-only application with in-memory state no data is persisted to localStorage or other browser storage APIs. A page reload must return the application to its seeded state. Genre is good-app. Target users are People who manage costume looks in a bounded local workflow.
</summary>

<core_features>
Costume Looks collection to Create edit archive and filter costume looks with explicit domain statuses empty draft ready changed archived. Validation boundaries enforce correct data rejecting adjacent out-of-range values and explaining recovery.
Scenario Weaver surface as the signature interaction. Branch a selected record into a scenario and compare linked outcomes. This action mutates the primary record linked views and status together. Includes an Undo action that restores ordering selection and derived values. Conflicting or incomplete mutations are rejected without partial updates.
Portable work artifact to Export and import the session work as a clean JSON artifact. An invalid import must make no state changes. A valid import restores the authored structure and regenerates the exportedAt timestamp.
</core_features>

<visual_design>
Visual hierarchy makes the current state and next action clear across the primary work surface linked summary and detail panel.
Source fidelity shows the visual and interaction thesis is coherent and distinctive as a focused domain workbench. Uses clear state tokens intentional density and a calm canvas drawing on the interaction vocabulary of collaborative reorder folders queue reshuffle and background-download progress.
Design system uses Tailwind CSS v4 for styling.
</visual_design>

<motion>
Causal motion connects the acted-on item to its new state.
Reduced motion equivalent must exist that preserves feedback without transforms when prefers-reduced-motion is active.
</motion>

<requirements>
State Management must be in-memory. Do NOT use localStorage or sessionStorage.
Interoperable Artifact must export and import costume-continuity-v1-scenario-weaver.json. The exported JSON must contain schemaVersion set to a v1 enum exportedAt RFC3339 timestamp records array of costume looks derived summary object and history event history.
Validation Rules require schemaVersion is a task-specific v1 enum. Record IDs are unique. Status values are explicit enums. Required fields numeric and date bounds and cross-record references must validate together.
Stack is React 19 Vite Tailwind CSS 4.3.2.
All libraries installed via npm and bundled locally no CDN imports of any library font or icon set.
Alternate Input Parity requires keyboard and touch-equivalent controls must produce the identical canonical mutation as mouse interactions. Ctrl/Cmd+Z undoes the mutation.
Responsive Behavior for narrow layouts must transform the interaction model while preserving touch targets and avoiding horizontal overflow.
Performance must ensure edits remain responsive with a seeded collection of at least 100 records.
Writing Domain Copy for labels statuses errors and empty-state text must name the domain consequence and recovery action precisely.
Seeding requires the application is seeded with deterministic fixtures including empty boundary valid and conflict states ensuring no target outcome is pre-completed totaling at least 100 records for performance testing.
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
- Entity: record
- Entity operations: create; select; update; delete; reorder
- Entity fields: status
- Editor object types: scenario
- Editor properties: state
- Editor modes: idle; selected; changed; conflict; resolved
- Editor operations: select; update_property; switch_mode; preview
- Artifact operations: export; import; copy
- Export formats: costume-continuity-v1-scenario-weaver-json
- Import modes: costume-continuity-v1-scenario-weaver-json

Mechanics exclusions:
- Gesture mechanics stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
