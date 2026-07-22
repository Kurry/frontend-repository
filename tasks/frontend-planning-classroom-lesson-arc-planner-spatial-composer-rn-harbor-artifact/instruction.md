<summary>
Build a Classroom Lesson Arc Planner and Spatial Composer app using React, Zustand, and Tailwind CSS 4.3.2. All libraries must be npm-local (no CDNs). The app serves as an interactive workbench where users can manage a collection of lesson blocks and place a selected record in a spatial composer and rebalance capacity. It uses purely in-memory state (no localStorage) and produces an interoperable downloadable artifact of the session's work.
</summary>

<reference_screenshots>
There are no reference screenshots for this task. The design must be distinct and domain-specific.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Lesson Blocks collection —
- Create, edit, archive, and filter lesson blocks with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state/artifact effect: Mutates records and status fields in lesson-arc-v1.json.
Feature: Spatial Composer surface —
- Use the spatial composer interaction to derive a decision about the collection.
- Canonical mutation: place a selected record in a spatial composer and rebalance capacity.
- Visible states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation and inspect the linked representation; undo restores ordering, selection, and derived values.
- Shared-state/artifact effect: Updates spatial-composer geometry/selection, derived summaries, and event history.
Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state.
- Visible states: unsaved, exported, validated, replayed.
- Export the current artifact to lesson-arc-v1-spatial-composer.json containing schemaVersion, exportedAt, records, derived, and history.
- Clear the session and import an artifact with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
- The user can view the primary work surface, linked summary, and detail panel (Lesson Blocks list).
- The user can select a lesson block and place a selected record in a spatial composer and rebalance capacity.
- The user can undo the last mutation and see the prior state restored.
- The user can export the completed session artifact to a JSON file.
- The user can import a valid JSON file and see the state restored exactly, with a new exportedAt timestamp.
</user_flows>

<edge_cases>
- Trying exact bounds, an invalid cross-field value, an empty state, and a malformed import must show field-level recovery and preserve the prior valid state.
- Attempting to place a record that exceeds the track/composer capacity is rejected.
</edge_cases>

<visual_design>
- The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state (causal motion).
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop primary surface becomes a usable stack/drawer/stepper on mobile viewports without horizontal overflow.
</responsiveness>

<accessibility>
- Repeat the signature interaction with keyboard and touch-equivalent controls.
- Alternate input produces identical state with visible focus and live feedback.
- Uses semantic controls, keyboard parity, focus management, and contrast.
</accessibility>

<performance>
- Exercise a seeded collection with at least 100 records.
- The signature interaction remains responsive (direct manipulation under 100ms, linked views under 500ms, import under 2s).
- Unrelated rows and surfaces stay stable and do not aggressively rebuild.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text.
- Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- The interaction thesis is coherent and deeply connected to the spatial composer.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Good-app genre means in-memory state only, NO localStorage.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit.
- Reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Separate sessions/import attempts must not silently share or overwrite state.
</integrity>

<delivery>
- The oracle implementation must serve on port 3000 via npm start.
- No console or page errors allowed.
- The UI must implement all states, error handlers, boundaries, responsive transforms, and accessible alternatives.
</delivery>

<webmcp_action_contract>
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "CRUD and query operations on the underlying records.",
  "permitted_operations": ["create", "read", "update", "delete", "list", "query"],
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
  "tool_name_prefix": "artifact"
}
</module_spec>

<module_spec id="spatial-composer-v1">
{
  "id": "spatial-composer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Spatial Composer",
  "purpose": "Domain mutations for the spatial composer.",
  "permitted_operations": ["place_record", "undo_mutation"],
  "tool_name_prefix": "spatial"
}
</module_spec>

Bindings:
- Entity: record
- Entity operations: create; read; update; delete; list
- Entity fields: id, title, capacity, status
- Artifact operations: import; export
- Export formats: session-json
- Import modes: session-json
- Spatial operations: place_record, undo_mutation

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
