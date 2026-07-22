<summary>
Build the Emergency Drill Evacuation Planner — Spatial Composer using React, Vite, and Tailwind CSS 4.3.2. The application is a frontend-only, in-memory tool for managing drill checkpoints. The user's primary job involves a spatial composer where they place a selected record in a spatial composer and rebalance capacity. This core canonical mutation directly impacts linked views, a derived summary, and the final interoperable work artifact.
</summary>

<reference_screenshots>
Screenshots of the reference application are not provided for this task. You must follow the visual thesis and interaction descriptions in the instructions to create a cohesive, domain-specific workbench.
</reference_screenshots>

<core_features>
Feature: Drill Checkpoints collection
- The main view displays a collection of Drill Checkpoints in a list or table.
- A user can create a new drill checkpoint, edit an existing one, delete (archive) a record, and filter records by explicit domain statuses (e.g., draft, ready, changed, archived).
- The list/table view clearly indicates the current state (empty, draft, ready, changed, archived) of each record.
- Invalid form submissions when creating/editing a checkpoint (e.g., missing required fields, exact boundaries out of range) preserve the prior valid record and explain the recovery action contextually.
- Exact field boundaries are accepted (e.g., capacity 1-1000), while adjacent out-of-range values are rejected.

Feature: Spatial Composer surface
- Selecting a record from the collection loads it into the Spatial Composer surface.
- Within the Spatial Composer, the user performs the signature interaction: "place a selected record in a spatial composer and rebalance capacity". This involves interacting with a spatial/visual representation to modify the capacity allocation of the selected drill checkpoint.
- The Spatial Composer shows visible states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation in the Spatial Composer is rejected without making partial updates.
- An "Undo" action reverts the last mutation, restoring the previous ordering, selection, and derived values.

Feature: Portable work artifact
- The application provides an "Export" action to download the current artifact. The artifact must be named evacuation-drill-v1-spatial-composer.json.
- The application provides an "Import" action to clear the current state and import a session from a JSON file.
- Field-level validation occurs during import. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates the exportedAt timestamp.
</core_features>

<user_flows>
- Complete end-to-end flow: create a drill checkpoint, select and edit it, load it into the spatial composer and mutate its capacity, use undo to revert the change, redo or apply a new valid mutation, and complete the record.
- Linked views flow: mutate a record in the spatial composer and verify that the derived summary (e.g., total capacity remaining, status changes) updates immediately.
- Schema validation flow: attempt an import with malformed JSON, verify it fails gracefully without state change. Attempt an import with a valid JSON file, verify the state is restored perfectly.
</user_flows>

<edge_cases>
- Try submitting a form with exact minimum, maximum, just-inside, and just-outside values for capacity. The app should accept valid inputs and reject out-of-bound inputs, displaying field-level error messages.
- Attempt an invalid cross-field value (if applicable based on the domain logic).
- Exercise an empty state (e.g., when all records are deleted or filtered out).
- Exercise a malformed import (e.g., missing required keys, duplicate IDs, invalid schema version).
- Verify each invalid action preserves the prior valid state and provides field-level recovery guidance.
</edge_cases>

<visual_design>
- The visual thesis is a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm, focused canvas.
- The layout must include a desktop primary surface plus a summary and inspector panel.
- On mobile, the layout transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy must make the current state and next action clear.
</visual_design>

<motion>
- The acted-on item (the selected record) moves or morphs into its new state during the signature interaction in the spatial composer.
- Motion connects the acted-on item to its new state contextually.
- With prefers-reduced-motion set, animations are removed, and state changes apply instantly while every feature remains usable. Reduced motion preserves causal parity without transforms.
</motion>

<responsiveness>
- The application must function completely at a narrow (mobile) viewport (e.g., 375px width).
- Narrow layouts change the interaction model, preserve touch targets (at least 44px), and avoid horizontal clipping (no page-level horizontal overflow).
- The desktop surface becomes a usable stack, drawer, or stepper on mobile without losing functionality.
</responsiveness>

<accessibility>
- The signature interaction must have complete keyboard and touch-equivalent controls that produce the identical canonical mutation.
- All controls must be semantic and reachable via keyboard traversal.
- Focus management must be implemented correctly, especially for modals or dialogs (focus trap and opener return).
- The application must provide live announcements for critical state changes.
- The application must support reduced-motion parity and have sufficient color contrast.
- Visual state changes must not rely solely on color.
</accessibility>

<performance>
- The signature interaction remains responsive (acknowledges within 100ms) even with a seeded collection of at least 100 records.
- Linked/derived views settle within 500ms.
- Export/import completes within 2s without dropped interactions, stale views, layout jumps, or console errors.
- Modifying a single record does not rebuild unrelated rows in the list view.
</performance>

<writing>
- Copy must be precise, naming the domain consequence and recovery action clearly.
- Error messages must identify the rejected value or rule and the required recovery action. Correcting the value must clear only the corresponding error.
- Labels, statuses, errors, and empty-state text must use consistent and professional domain copy.
</writing>

<innovation>
Optional enhancements the builder may add (none required for a passing build): a feature not covered by the core requirements that adds meaningful domain utility, verifiable through visible evidence.
</innovation>

<requirements>
- The application must use React, Vite, and Tailwind CSS 4.3.2.4.3.2 (npm-local, no CDNs).
- State must be entirely in-memory. NO localStorage, sessionStorage, IndexedDB, or other persistence mechanisms are allowed.
- The application must serve on port 3000 via npm start.
- No external network dependencies (e.g., external APIs) are allowed.
- The useful end state is an interoperable downloadable artifact (evacuation-drill-v1-spatial-composer.json) of the session's work.
- The exported artifact schema must conform to: EmergencyDrillEvacuationPlannerSession with schemaVersion: 'evacuation-drill-v1', exportedAt (RFC3339), records[], derived{}, and history[].
- All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and the standard solution/app directory. Do not use external services or pre-seed outcomes.
- Start from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
</integrity>

<delivery>
- Produce a working React/Vite implementation serving on port 3000 via npm start with zero console/page errors.
- Ensure the build output (`dist/`) is committed so it serves correctly.
- Provide a WebMCP contract implementing standard modules.
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
- Entity operations: create; select; update; delete
- Entity fields: capacity; status
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag/drop actions in the spatial composer remain Playwright-driven when mechanism matters.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
