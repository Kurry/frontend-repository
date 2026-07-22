<summary>
Create a standalone Household Waste Diversion Tracker using React and Tailwind CSS. The app features a Scenario Weaver to branch a selected record into a scenario and compare linked outcomes. It manages waste events in-memory, provides a linked utility summary, and allows exporting/importing work as a portable artifact.
</summary>

<core_features>
- Create, edit, and archive waste events with explicit domain statuses (e.g., draft, ready, changed, archived)
- Branch a selected record into a scenario and compare linked outcomes via the Scenario Weaver surface
- Undo the last scenario mutation and inspect the restored linked representation
- Export the current artifact, clear it, and import it with field-level validation
</core_features>

<user_flows>
- The user can create, edit, mutate, undo, and complete one record
- The end-to-end job is recoverable without reload
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery
- A conflicting or incomplete mutation is rejected without partial updates
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change during import
- Undo restores ordering, selection, and derived values
</edge_cases>

<visual_design>
- The visual hierarchy makes current state and next action clear in the primary work surface, linked summary, and detail panel
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
- The visual and interaction thesis is coherent without copying unrelated screens
</visual_design>

<motion>
- Motion connects the acted-on item to its new state
- A reduced-motion equivalent preserves feedback without transforms
</motion>

<responsiveness>
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports
- Narrow layouts change interaction model and preserve touch targets
</responsiveness>

<accessibility>
- Alternate input (keyboard and touch-equivalent controls) produces identical state with visible focus and live feedback
- Semantic controls, keyboard parity, focus management, and contrast are implemented
</accessibility>

<performance>
- The signature interaction remains responsive on a seeded collection of at least 100 records
- Unrelated rows stay stable and do not rebuild
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely
- Error copy identifies the field, rejected value or rule, and recovery action
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD
- The scenario weaver mutation changes the primary record, linked view, and status together
</innovation>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- State must be in-memory only; NO localStorage or other persistence mechanisms are allowed.
- The useful end state is an interoperable artifact waste-diversion-v1-scenario-weaver.json.
- The portable artifact must conform to the HouseholdWasteDiversionTrackerSession schema with schemaVersion, exportedAt, records[], derived{}, and history[].
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- A valid import restores authored structure and regenerates exportedAt.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility.
- WebMCP is a required delivery step. Register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
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
- Entity operations: create; select; update; delete; toggle
- Entity fields: id; status; scenarioState
- Artifact operations: export; import; copy
- Export formats: waste-diversion-v1-scenario-weaver.json
- Import modes: waste-diversion-v1-scenario-weaver.json

Mechanics exclusions:
- Drag, drawing, and raw file interactions stay Playwright-driven.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
