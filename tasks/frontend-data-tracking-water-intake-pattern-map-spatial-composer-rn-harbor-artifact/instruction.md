<summary>
Build a Water Intake Pattern Map using React, Tailwind CSS 4.3.2, and local state management. The app manages intake events, places them in a spatial composer to rebalance capacity, and produces an interoperable JSON artifact containing authored state and derived consequences. All state is strictly in-memory (no localStorage).
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Intake Events collection —
- A collection view of water intake events showing their domain statuses (draft, ready, changed, archived)
- Create, edit, archive, and delete single records with explicit domain statuses
- Filter or reorder records explicitly by their domain state
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
Feature: Spatial Composer surface —
- A spatial composer interaction where the operator places a selected record to rebalance capacity
- Changing the primary record in the spatial composer immediately updates the linked summary view and changes the item's status
- Conflicting or incomplete mutations in the spatial composer are rejected without partial updates
- An Undo action reverts the last spatial mutation, restoring ordering, selection, and derived values
Feature: Portable work artifact —
- An Export tool that generates a downloadable JSON artifact (hydration-pattern-v1.json) of the current session
- A Clear tool that resets all in-memory state back to the seeded default
- An Import tool that accepts the JSON artifact, validates schema, unique IDs, explicit enums, and numeric/date bounds, and restores the authored structure and derived state
- Import of malformed schema, duplicate IDs, unknown references, or invalid bounds makes no state change and shows field-level errors
Feature: Data and artifact contract —
- The session JSON artifact uses schemaVersion: "v1" and includes exportedAt, records array, derived object, and history array
- Exporting, clearing, and importing the edited artifact round-trips the exact authored order, selection, geometry, and domain state, while regenerating the exportedAt timestamp
</core_features>

<user_flows>
End-to-end flows (each chain must hold without a page reload unless the step says otherwise):
- Create and Filter: Create a new intake record, observe it appear in the collection, filter the collection by its state to see only matching records.
- Spatial Rebalance: Select a record, place it in the spatial composer to rebalance capacity; verify the item moves to its new state, the derived summary updates, and the record's status changes.
- Undo: After a spatial rebalance, press Undo; verify the record returns to its previous position, the summary reverts, and the status changes back.
- Export and Import Round Trip: Perform a spatial rebalance, export the artifact, clear the session, then import the artifact; verify the exact authored state, spatial composer selection, derived summary, and history are restored.
</user_flows>

<edge_cases>
- Submitting an intake record with values just outside the allowed boundaries shows a field-level error and preserves the valid state.
- Attempting to import an artifact with a malformed schema or out-of-bounds fields shows specific validation errors and makes zero state mutation.
- A conflicting spatial mutation is completely rejected, preventing partial updates.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens and intentional density.
- A calm focused canvas for the spatial composer.
- Desktop layout features a primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- Clear visual hierarchy makes current state and next action obvious.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state in the spatial composer.
- With prefers-reduced-motion set, the transform animation is removed but causal feedback remains.
</motion>

<responsiveness>
- At narrow viewports, the desktop surface becomes a usable stack, drawer, or stepper without horizontal overflow or sub-44px targets.
- The signature interaction (place record to rebalance) remains usable at a narrow viewport.
</responsiveness>

<accessibility>
- All interactive elements are fully operable via keyboard.
- Alternate input (keyboard and touch-equivalent controls) produces the identical canonical mutation as pointer actions.
- Focus is visibly managed, especially during modal or drawer transitions.
- Live announcements occur for state changes (e.g., when a rebalance is complete).
</accessibility>

<performance>
- The spatial composer acknowledges direct manipulation within 100ms.
- Linked and derived views settle within 500ms.
- Export and import complete within 2 seconds.
- Seeding a collection with at least 100 records leaves the signature interaction responsive and unrelated rows stable.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely (e.g., status labels, errors, empty states).
</writing>

<innovation>
Optional enhancements the builder may add, none required for a passing build:
- An evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
- A before/after flip that compares the current spatial composer to the prior state.
</innovation>

<requirements>
- Strictly in-memory state only; NO localStorage or other persistence mechanisms.
- Stack: React, Tailwind CSS 4.3.2 (pinned), frontend-only.
- All libraries must be npm-local (no CDNs).
- Seed a deterministic collection with empty, boundary, valid, and conflict states on load (no target outcome pre-completed).
- Real browser mechanics for graded interactions: standard pointer actionability, keyboard traversal, modal focus traps, etc.
- No arbitrary DOM mutation or generic state setter exposed to WebMCP.
</requirements>

<integrity>
- Work only from this instruction and `/app`.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`.
- `package.json` MUST define npm scripts `start` (serves the app on port 3000) and `verify:build` (exits 0 when build succeeds).
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
  "permitted_operations": ["select", "update_property"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]]
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
  "permitted_operations": ["create", "update", "delete", "select"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Invokes the same domain command used by the visible control."
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
  "permitted_operations": ["import", "export"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: intake-record
- Editor properties: capacity; position
- Editor operations: select; update_property
- Entity: intake-event
- Entity operations: create; select; update; delete
- Entity fields: status; amount; date
- Artifact operations: export; import

Mechanics exclusions:
- Drag/drop gestures and layout shifts stay Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
