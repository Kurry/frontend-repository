<summary>
Build a Sleep Recovery Variance Lab using React, Tailwind CSS 4.3.2, and dnd-kit. The app must allow users to manage sleep sessions in a bounded local workflow, featuring a Constraint Canvas where users can drag a selected record across constraint lanes and resolve a conflict. The app produces the user's session artifact: a downloadable and interoperable JSON document containing the sleep sessions, derived metrics, and history. All libraries must be npm-local (no CDNs).
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Sleep Sessions collection —
- Create, edit, archive, and filter sleep sessions with explicit domain statuses (empty, draft, ready, changed, archived).
- Filter or reorder records by domain state.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state/artifact effect: Mutates records array and status fields in the export artifact.
Feature: Constraint Canvas surface —
- Drag a selected record across constraint lanes and resolve a conflict.
- Undo the last mutation and inspect the linked representation.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state/artifact effect: Updates constraint-canvas geometry/selection, derived summaries, and event history.
Feature: Portable work artifact —
- Export the current artifact and download it as sleep-recovery-v1-constraint-canvas.json.
- Clear the workspace and import the artifact with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- Shared-state/artifact effect: Produces sleep-recovery-v1-constraint-canvas.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<user_flows>
- The user drags a selected record across constraint lanes and resolves a conflict, watches linked views react, then exports the completed artifact.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- A conflicting or incomplete mutation is rejected without partial updates.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD. Mutate a record and use the linked representation to make the next decision.
</innovation>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Persistence: In-memory only; no localStorage or other persistence mechanisms are allowed.
- Export/import is the only persistence boundary.
- The useful end artifact must be an interoperable sleep sessions session artifact named sleep-recovery-v1-constraint-canvas.json.
- The export JSON schema must contain schemaVersion (set to shapeshift-session-v1 or task-specific v1 enum), exportedAt, records, derived state, and history.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
</integrity>

<delivery>
- The solution must run on port 3000 via `npm start`.
- No page or console errors should occur during normal usage.
</delivery>

<webmcp_action_contract>
{
  "window.webmcp_session_info": {
    "task_id": "eval-intelligence/frontend-data-tracking-sleep-recovery-variance-lab-constraint-canvas-rn-linear-views",
    "capabilities": ["entity-collection-v1", "artifact-transfer-v1"]
  },
  "window.webmcp_list_tools": "returns the standard schema for list_tools",
  "window.webmcp_invoke_tool": "implements handlers for entity_create_record, entity_update_record, artifact_export_session_json, artifact_import_session_json"
}
</webmcp_action_contract>
