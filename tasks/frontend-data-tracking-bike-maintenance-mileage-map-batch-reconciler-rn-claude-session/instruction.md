<summary>
Build a Bike Maintenance Mileage Map and Batch Reconciler using React, Tailwind CSS 4.3.2, and local state management. The app allows users to manage bike service records, group selected records into a batch, and reconcile aggregate totals. The app produces the operator's session artifact: a downloadable and copyable Session JSON document compiled live from the collection state, derived summary, and event history, conforming to API-shaped field contracts, with Import that round-trips that JSON. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Bike Service Records collection —
A main list or grid view displaying bike service records with explicit domain statuses (e.g., draft, ready, changed, archived)
Create, edit, and delete single records
Invalid required fields during edit or create preserve the prior valid record state and show an inline validation message naming the required recovery action
Exact field boundaries (e.g., numeric bounds) are accepted while adjacent out-of-range values show field-level recovery validation
Filter or reorder the collection of records by domain state

Feature: Batch Reconciler surface —
A dedicated interaction to "group selected records into a batch and reconcile aggregate totals"
The interaction allows selecting multiple records from the collection
Upon mutation (reconciliation), the primary records, the linked summary view, and the status update together
A conflicting or incomplete mutation is rejected without partial updates, showing an error
An Undo action reverts the last mutation and restores ordering, selection, and derived values

Feature: Portable work artifact (useful end state) —
An Export control that outputs bike-maintenance-v1.json, which represents the actual session work
A Clear action to reset the state
An Import control that accepts bike-maintenance-v1.json with field-level validation
Session field contract for bike-maintenance-v1.json:
schemaVersion: exactly v1
exportedAt: RFC3339 timestamp regenerated on export
records: array of record objects with unique IDs and explicit enum status values
derived: object containing derived summary state
history: array of event history
Malformed schema, duplicate IDs, unknown references, and invalid bounds during import make no state change and show validation
A valid import restores authored structure, derived state, and history
</core_features>

<visual_design>
Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
The visual hierarchy makes the current state and next action clear, linking the primary work surface, linked summary, and detail panel
Component states show distinct default, hover, focus, disabled, and error treatments
</visual_design>

<motion>
Motion connects the acted-on item to its new state (e.g., when grouping records)
Reduced motion preserves feedback without transforms when prefers-reduced-motion is active
</motion>

<responsiveness>
Narrow layouts change the interaction model, preserving touch targets and avoiding horizontal clipping
The desktop primary surface transforms into a usable stack, drawer, or stepper on mobile viewports
</responsiveness>

<accessibility>
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation as mouse interactions
Ctrl/Cmd+Z or an accessible undo button undoes the last action
Semantic controls, focus management, live updates, contrast, and reduced-motion support
</accessibility>

<performance>
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces
The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records
</performance>

<writing>
Copy names the domain consequence and recovery action precisely
Inspect labels, statuses, errors, and empty-state text to ensure clarity
</writing>

<requirements>
All assets must be loaded locally without CDNs. Use Tailwind CSS 4.3.2.
In-memory state only. No localStorage or external network calls.
The canonical mutation must update the primary record, linked view, and status together.
The end-to-end job must be recoverable without reload.
The visual and interaction thesis must be coherent without copying unrelated screens.
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
- Entity operations: create; update; delete; select
- Entity fields: title; mileage; status
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
