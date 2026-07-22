<summary>
Build a Classroom Lesson Arc Planner using React and Tailwind CSS 4.3.2. The app manages lesson blocks in a bounded local workflow where one meaningful mutation updates linked views and an interoperable artifact. The signature interaction allows the user to scrub a selected record through its timeline and restore a prior checkpoint. The concept adapts a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized into a self contained frontend job. The application must operate entirely in memory with no local storage or backend persistence. The final output is an interoperable lesson blocks session artifact named lesson-arc-v1.json that preserves authored state and derived consequences for a clean round trip.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots/: overview.png is a full-page desktop-layout overview. They are part of this instruction: recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features must be observable in the finished app.

Lesson Blocks collection. Create, edit, archive, and filter lesson blocks with explicit domain statuses. The user must be able to create, edit, or delete one record, and filter or reorder records by domain state. Visible states include empty, draft, ready, changed, and archived. Exact field boundaries are accepted while adjacent out of range values are rejected. Invalid required fields preserve the prior valid record and explain recovery. The mutation affects the records array and status fields in the exportable session artifact.

Replay Timeline surface. Use the replay timeline interaction to derive a decision about the collection. The signature interaction is to scrub a selected record through its timeline and restore a prior checkpoint. The user can also undo the last mutation and inspect the linked representation. Visible states include idle, selected, changed, conflict, and resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. This interaction updates replay timeline geometry and selection, derived summaries, and event history.

Portable work artifact. Export and restore the actual session work in a fresh state. The user can export the current artifact and clear or import it with field level validation. Visible states include unsaved, exported, validated, and replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates the exported timestamp. This produces a JSON file containing schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<user_flows>
End-to-end flows:
- Create and filter flow: create multiple lesson blocks, then use the filter to show only those in specific states (e.g. draft, ready). The collection must update immediately.
- Replay timeline flow: scrub a selected record through its timeline to view past states. Restore a prior checkpoint. The linked view and summary must update to reflect the restored state.
- Undo flow: perform a mutation, then undo it. The ordering, selection, and derived values must return to their prior state.
- Export and import flow: create and edit lesson blocks, use the timeline, then export the session. Clear the current session, then import the exported file. The application must restore the exact authored structure, derived state, and history.
</user_flows>

<edge_cases>
- Submitting incomplete or invalid fields during creation or edit preserves the prior valid record and displays field level recovery messages.
- A conflicting or incomplete timeline mutation is rejected and no partial updates are applied.
- Attempting to import malformed JSON or an invalid schema fails with no state change.
- Duplicate IDs, unknown references, or invalid numeric bounds in an imported artifact result in rejection without mutation.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout consists of a primary surface plus a summary and inspector panel.
- Clear visual hierarchy that makes the current state and next action obvious.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without layout transforms or continuous animation.
</motion>

<responsiveness>
- Narrow layouts change the interaction model, transforming secondary surfaces into drawers or stacked steps.
- Touch targets are preserved, and horizontal clipping is avoided.
</responsiveness>

<accessibility>
- Semantic controls and keyboard parity for all actions, including the timeline scrub.
- Proper focus management and live updates for screen readers.
- High contrast and support for reduced motion preferences.
</accessibility>

<performance>
- The signature interaction remains responsive on collections with 100 or more records.
- Unrelated surfaces do not rebuild unnecessarily during mutations.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Labels, statuses, errors, and empty state text are clear and contextually relevant.
</writing>

<innovation>
- Linked views provide domain utility beyond basic CRUD operations by keeping selections, batch edits, ranges, and sequence exports synchronized in a unified frontend experience.
</innovation>

<requirements>
Data contract. The schema shape is ClassroomLessonArcPlannerSession with schemaVersion, exportedAt, an array of records, a derived object, and a history array. Each record is an API shaped would be request body. The schemaVersion must be exactly lesson-arc-v1 and exportedAt must be an RFC3339 formatted string. Record IDs must be unique and status values must be explicit enums. Required fields, numeric and date bounds, and cross record references validate together.

Persistence. The state must be entirely in memory. Export and import act as the sole persistence boundary. Do not use local storage or external backend syncing.

Dependencies. All dependencies must be strictly local (npm install). Do not use CDNs or external network links for scripts, styles, or assets.

Import and export validation. The artifact uses the replay timeline schema for export and import, rejects invalid records without any partial mutation, and regenerates exportedAt upon successful import.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- The implementation must be self-contained within the provided directory.
- Start script must serve the application on port 3000.
</delivery>

<webmcp_action_contract>
<module_spec id="entity-record-v1">
{
  "id": "entity-record-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity Record Management",
  "purpose": "Domain-native CRUD and batch operations.",
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
- Entity: lesson-block
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; status; duration
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag-paint / timeline scrub geometry stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
