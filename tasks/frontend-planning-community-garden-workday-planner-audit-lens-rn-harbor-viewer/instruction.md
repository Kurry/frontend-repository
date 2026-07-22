# Community Garden Workday Planner - Audit Lens - Viewer

<summary>
Manage work tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery. Must use Tailwind CSS 4.3.2.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
1. Work Tasks collection: Create, edit, archive, and filter work tasks with explicit domain statuses (draft, ready, changed, archived).
2. Audit Lens surface: Use the audit lens interaction to attach evidence to a selected record and resolve an audit discrepancy. Undo the last mutation and inspect the linked representation.
3. Portable work artifact: Export and restore the actual session work in a fresh state. Clear and import it with field-level validation.
</core_features>

<user_flows>
1. Create, edit, archive, and filter work tasks.
2. Select a work task and use the audit lens to attach evidence and resolve an audit discrepancy.
3. Undo the mutation to restore prior ordering, selection, and derived values.
4. Export the entire session as an interoperable JSON artifact (garden-workday-v1.json).
5. Clear the current session and import a valid JSON artifact to restore state.
</user_flows>

<edge_cases>
1. Invalid required fields preserve the prior valid record and explain recovery.
2. Exact field boundaries are accepted while adjacent out-of-range values are rejected.
3. A conflicting or incomplete mutation is rejected without partial updates.
4. Malformed schema, duplicate IDs, unknown references, and invalid bounds on import make no state change.
</edge_cases>

<visual_design>
1. Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
2. Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
1. The acted-on item moves or morphs into its new state.
2. Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
1. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. Secondary surfaces become drawers or stacked steps.
</responsiveness>

<accessibility>
1. Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
2. Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
</accessibility>

<performance>
1. Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
1. Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
</writing>

<innovation>
1. Linked utility: Mutate a record and use the linked representation to make the next decision. The audit lens surface, derived summary, and artifact query share one state.
</innovation>

<requirements>
1. Data persistence is strictly in-memory (no localStorage). Export/import is the persistence boundary.
2. Schema for garden-workday-v1.json: includes schemaVersion, exportedAt (RFC3339), records[] (unique IDs, explicit enums), derived{}, and history[].
3. Validation rules are strictly enforced upon artifact import and interactions.
4. Dependencies must be installed locally via npm (e.g. npm install tailwindcss); no CDNs are permitted.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
# WebMCP action contract

The system will verify the UI via an injected `window.webmcp` contract.
You must mount `window.webmcp_session_info`, `window.webmcp_list_tools`, and `window.webmcp_invoke_tool`
matching the standard `zto-webmcp-v1` shape. Implement standard operations: `entity_create_record`, `entity_update_record`, `artifact_export_session_json`, `artifact_import_session_json`.
</webmcp_action_contract>
