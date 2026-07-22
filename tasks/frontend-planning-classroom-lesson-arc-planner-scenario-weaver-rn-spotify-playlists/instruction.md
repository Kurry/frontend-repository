# Classroom Lesson Arc Planner — Scenario Weaver

<summary>
Manage lesson blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: branch a selected record into a scenario and compare linked outcomes. This concept adapts collaborative reorder, bulk actions, and queue state patterns into a self-contained frontend job. The application must use Tailwind CSS 4.3.2.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
1. Lesson Blocks collection: Create, edit, archive, and filter lesson blocks with explicit domain statuses (empty, draft, ready, changed, archived).
2. Scenario Weaver surface: Branch a selected record into a scenario and compare linked outcomes, with undo support.
3. Portable work artifact: Export and restore the session work in a fresh state (lesson-arc-v1-scenario-weaver.json).
</core_features>

<user_flows>
1. Lesson Blocks collection: User creates, edits, filters, and deletes records.
2. Scenario Weaver surface: User uses the scenario weaver interaction to derive a decision about the collection. User undoes the last mutation and inspects the linked representation.
3. Portable work artifact: User exports the current artifact. User clears the session and imports a valid artifact.
</user_flows>

<edge_cases>
1. Invalid fields during create/edit preserve the prior valid record and explain recovery.
2. A conflicting or incomplete scenario weaver mutation is rejected without partial updates.
3. Malformed schema, duplicate IDs, unknown references, and invalid bounds during import make no state change.
</edge_cases>

<visual_design>
1. A distinctive, domain-specific workbench with clear state tokens.
2. Intentional density and a calm focused canvas.
3. The visual hierarchy makes current state and next action clear.
4. Desktop layout uses primary surface plus summary and inspector.
</visual_design>

<motion>
1. The acted-on item moves or morphs into its new state.
2. Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
1. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
2. Mobile transforms secondary surfaces into drawers or stacked steps.
</responsiveness>

<accessibility>
1. Semantic controls, keyboard parity, focus management.
2. Keyboard and touch-equivalent controls produce the identical canonical mutation.
3. Live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
1. Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
1. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
1. Linked utility: Mutate a record and use the linked representation to make the next decision, providing domain utility beyond CRUD.
</innovation>

<requirements>
1. The application must be a React frontend using only in-memory state. No localStorage or backend synchronization is permitted.
2. The UI must support branching a selected lesson block into a scenario and comparing the derived summary outcomes.
3. The UI must export and import a lesson-arc-v1.json (or lesson-arc-v1-scenario-weaver.json) file matching the schema.
4. The schema includes schemaVersion (v1 enum), exportedAt (RFC3339), records (array of records), derived (object), and history (array).
5. The application must be self-contained; no external CDNs are permitted. Use only npm-local dependencies.
6. The application must use Tailwind CSS 4.3.2.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Please deliver a complete React application that implements the Classroom Lesson Arc Planner. The application must run locally on port 3000 without errors. Ensure all features are thoroughly tested.
</delivery>

<webmcp_action_contract>
```javascript
/**
 * Executes a tool using the standard WebMCP module contract.
 * Tools available: entity_create_record, entity_update_record, artifact_export_session_json, artifact_import_session_json
 */
window.webmcp_invoke_tool = async (tool_name, tool_arguments) => {
  // Application will implement these handlers
  return { success: true };
}
```
</webmcp_action_contract>
