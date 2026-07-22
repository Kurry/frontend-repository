<summary>
Build the Recipe Flavor Balance Studio, a single-page React application for managing flavor components in a bounded local workflow. This is a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree, reimagined for a recipe domain. The core job is to branch a selected record into a scenario and compare linked outcomes. The UI requires a primary desktop surface plus summary and detail panels, converting to stacked/drawer views on mobile. The domain tracks flavor components through lifecycle states (draft, ready, changed, archived). A central mutation (Scenario Weaver) alters a record, its linked views, and a downloadable interoperable artifact (flavor-balance-v1.json) instantly. Built with React 19, Vite, Zustand (for in-memory state only, no localStorage), Tailwind CSS 4.3.2 (no CDNs, local npm only), Lucide React for icons.
</summary>

<core_features>
- Flavor Components Collection: Create, edit, archive, and filter flavor components with explicit domain statuses (draft, ready, changed, archived).
- Scenario Weaver Mutation: Select a record and branch it into a new scenario. This canonical mutation must immediately update the primary record, linked summary charts/views, and the domain status together.
- Connected Derived State: The collection view, the scenario weaver surface, derived summary charts, and the artifact query must share one deterministic in-memory state.
- Undo Support: Revert the last Scenario Weaver mutation. Undo must restore ordering, selection, and derived values.
- Artifact Export/Import: Export the session to flavor-balance-v1.json. Clear the collection, then import the file with strict field-level validation. Valid import restores authored structure and regenerates exportedAt. Invalid import is rejected without partial updates.
</core_features>

<visual_design>
- Visual Hierarchy: The interface must establish a clear domain-specific workbench. Current state tokens and the next available action must be distinctly visible.
- Layout Strategy: Desktop presents a primary surface alongside a summary and inspector.
- Source Fidelity: The visual thesis is coherent and domain-focused, ensuring intentional density and a calm, focused canvas, inspired by collaborative track management.
</visual_design>

<motion>
- Causal Motion: The acted-on item moves or morphs into its new state during the Scenario Weaver mutation (using causal motion).
- Reduced Motion: Respect prefers-reduced-motion to preserve state feedback without transforms or disruptive animation.
</motion>

<requirements>
- State Management: All state (records, undo history, derived summaries, selected items) must use in-memory Zustand. NO localStorage, sessionStorage, or IndexedDB. A page reload must reset to a seeded deterministic state.
- Seeded Data: The application must start with at least 100 deterministic seeded records across various states (empty, boundary, valid, conflict) to demonstrate performance. Target outcomes must not be pre-completed.
- Tech Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2 (pinned), Framer Motion, Lucide React,  Installed via npm, no CDNs.
- Validation: Schemas must validate both user inputs and JSON imports. Schema must include schemaVersion: "v1", an RFC3339 exportedAt, unique IDs, and explicit enum statuses.
- Boundaries & Edge Cases: Exact field boundaries are accepted; adjacent out-of-range values are rejected. Invalid actions (e.g., malformed import, invalid required fields) preserve prior state and provide field-level recovery explanations.
- Alternate Input: All mutations, specifically the signature Scenario Weaver branch, must be achievable via keyboard and touch-equivalent controls, producing identical state with visible focus and live feedback.
- Responsiveness: Narrow mobile layouts must transform the desktop surface into a usable stack, drawer, or stepper without horizontal overflow, while preserving touch targets.
- Performance: The signature interaction and filtering must remain responsive on the 100+ record seeded collection, and unrelated rows must stay stable without unnecessary rebuilds.
- Domain Copy: All labels, statuses, errors, and empty-state text must use precise domain copy (e.g., "Draft", "Archived", "Scenario Conflict").
</requirements>

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
- Entity: component
- Entity operations: create; select; update; delete
- Entity fields: id; name; status
- Editor object types: scenario
- Editor operations: select; update_property; switch_mode
- Editor properties: branched_from; status
- Artifact operations: export; import
- Export formats: flavor-balance-v1.json
- Import modes: flavor-balance-v1.json

Mechanics exclusions:
- Drag-and-drop ordering or gesture mechanics stay Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args.
</webmcp_action_contract>
