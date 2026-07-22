# Appliance Service History — Scenario Weaver

<summary>
Manage appliance records through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: branch a selected record into a scenario and compare linked outcomes. A collection editor where multi-select ordering, folders, queue state, and progress artifacts agree.
</summary>

<core_features>
- Create, edit, archive, and filter appliance records with explicit domain statuses (empty, draft, ready, changed, archived)
- Branch a selected record into a scenario and compare linked outcomes, with undo support
- Export and import session work in a fresh state (interoperable appliance-service-v1-scenario-weaver.json)
- The scenario weaver surface, derived summary, and artifact query share one state
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Bounded local workflow (in-memory state only, NO localStorage, NO external APIs, NO backend sync)
- State MUST NOT persist across page reloads
- Record shape: ApplianceServiceHistorySession with schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[] (unique IDs, explicit enum statuses), derived{}, and history[]
- Validation: Exact field boundaries accepted, adjacent out-of-range rejected; required fields, numeric/date bounds, and cross-record references validate together
- Invalid required fields preserve the prior valid record and explain recovery
- Scenario Weaver: A conflicting or incomplete mutation is rejected without partial updates; Undo restores ordering, selection, and derived values
- Artifact: appliance-service-v1.json uses the scenario-weaver schema for export and import, rejects invalid records without mutation, and regenerates exportedAt
- Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it
- Mobile mode: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow
- Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2 (pinned), npm-local/no-CDN
- Seed at least 100 deterministic records with empty, boundary, valid, and conflict states; no target outcome is pre-completed
- Useful downloadable end state: appliance-service-v1-scenario-weaver.json with API-shaped data schemas
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- scenario-weaver-v1

Module specs:
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder", "filter"],
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

<module_spec id="scenario-weaver-v1">
{
  "id": "scenario-weaver-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Scenario weaver",
  "purpose": "Branching states, scenario comparison, and derived outcomes.",
  "permitted_operations": ["branch_scenario", "compare_scenarios", "resolve_conflict", "undo_mutation", "inspect_derived"],
  "binding_keys": {
    "required_any_of": [["scenario_operations"]],
    "optional": ["scenario_states", "visible_postconditions"]
  },
  "restrictions": [
    "Must preserve causal lineage of mutations."
  ],
  "tool_name_prefix": "scenario"
}
</module_spec>

Bindings:
- Entity: record
- Entity operations: create; select; update; delete; archive; filter
- Entity fields: status (empty, draft, ready, changed, archived); id
- Artifact operations: export; import
- Export formats: appliance-service-v1-scenario-weaver.json
- Import modes: appliance-service-v1-scenario-weaver.json
- Scenario operations: branch_scenario; compare_scenarios; undo_mutation; inspect_derived

Mechanics exclusions:
- Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters
- Raw file paths/blobs forbidden in WebMCP args
- File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
