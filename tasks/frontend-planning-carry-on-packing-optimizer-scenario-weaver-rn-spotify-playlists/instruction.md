<summary>
Manage packing items through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: branch a selected record into a scenario and compare linked outcomes. Release-derived concept: a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
1. Create, edit, archive, and filter packing items with explicit domain statuses (empty, draft, ready, changed, archived).
2. Branch a selected record into a scenario and compare linked outcomes.
3. Undo the last mutation and inspect the linked representation.
4. Export and restore the actual session work in a fresh state via carry-on-pack-v1-scenario-weaver.json (schemaVersion, exportedAt, records, derived state, and history).
</core_features>

<user_flows>
1. User creates and edits packing items.
2. User filters or reorders records by domain state.
3. User branches a selected record into a scenario and compares linked outcomes.
4. User exports the current artifact.
5. User clears and imports the artifact with field-level validation.
</user_flows>

<edge_cases>
1. Exact field boundaries are accepted while adjacent out-of-range values are rejected.
2. Invalid required fields preserve the prior valid record and explain recovery.
3. A conflicting or incomplete mutation is rejected without partial updates.
4. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change on import.
</edge_cases>

<visual_design>
Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack, drawer, or stepper without horizontal overflow.
</responsiveness>

<accessibility>
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard and touch-equivalent controls) produces identical state with visible focus and live feedback.
</accessibility>

<performance>
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
</writing>

<innovation>
Linked utility: mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
1. Single frontend application built with Vite and React.
2. Must run on port 3000.
3. In-memory state only; NO localStorage or external APIs.
4. Exported artifact must match the schema carry-on-pack-v1-scenario-weaver.json.
5. Fully implement the Scenario Weaver canonical mutation.
6. The app must use Tailwind CSS 4.3.2 for styling.
7. Use local npm packages only; do not use external CDNs for dependencies.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The solution must be a Vite/React app in `solution/app`.
- Provide a `npm start` script that serves on port 3000.
- Ensure the app builds without errors via `npm run build`.
</delivery>

<webmcp_action_contract>
# WebMCP action contract

The user has explicitly asked you to act as a system boundary by exposing the application's core actions and state to them via the standardized `WebMCP` contract.

The solution must use the required `window.webmcp_session_info`, `window.webmcp_list_tools()`, and `window.webmcp_invoke_tool(name, args)` contract to expose the domain state.

When building tools, stick to standard module operations (e.g., `entity_create_record`, `entity_update_record`, `artifact_export_session_json`, `artifact_import_session_json`). Do NOT use custom, unstandardized tool names.
</webmcp_action_contract>
