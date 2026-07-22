<summary>
Build a Classroom Lesson Arc Planner using a Constraint Canvas and Linear Filtered Views pattern. The application allows users to manage lesson blocks in a bounded local workflow. The core interaction is dragging a selected record across constraint lanes and resolving conflicts.

The application must be a frontend-only tool with strictly in-memory state. No localStorage or network persistence is allowed.
</summary>

<core_features>
Lesson Blocks Collection: Users can create, edit, archive, and filter lesson blocks. Lesson blocks have explicit domain statuses such as draft, ready, changed, and archived. Required fields and boundary validations must be enforced.

Constraint Canvas Surface: A dedicated interface where users drag a selected lesson block across constraint lanes. If a conflict occurs, the user must resolve it. Supported states include idle, selected, changed, conflict, and resolved.

Linked Views and Derived Consequences: The primary constraint canvas, a derived summary view, and an artifact query view must share the exact same state. A mutation in the canvas must immediately update the derived summary.

Portable Work Artifact: Users can export their session to a JSON file and clear or import it.

Undo Capability: Users must be able to undo the last mutation, restoring ordering, selection, and derived values.
</core_features>

<user_flows>
Create and Edit: User creates a new lesson block, filling out details like title, description, constraints, and sets its initial status to draft.

Constraint Canvas Interaction: User filters the list to see ready blocks, drags a record across constraint lanes. A conflict arises. User edits the record or the canvas lane to resolve the conflict.

Artifact Round Trip: User exports the current state, clears the workspace, and imports the file back to restore the full authored state, derived summary, and history.
</user_flows>

<edge_cases>
Exact field boundaries are accepted; out-of-range values are immediately rejected with field-level recovery hints.

Dropping a record in an invalid constraint lane triggers a conflict state without partial updates.

Importing a malformed schema, duplicate IDs, or invalid bounds results in no state change.
</edge_cases>

<visual_design>
Layout: Desktop layout features a primary surface, a linked summary, and a detail panel or inspector.

State Tokens: Distinct visual tokens and intentional density map to different states for records and canvas.

Focus: The application presents a calm, focused workbench suitable for domain-native planning.
</visual_design>

<motion>
Causal Motion: An acted-on item moves or morphs into its new state smoothly.

Reduced Motion: If prefers-reduced-motion is active, visual feedback is preserved but without transforms or animations.
</motion>

<responsiveness>
Mobile Mode: Narrow layouts transform secondary surfaces into drawers or stacked steps. Touch targets must remain actionable and horizontal overflow must be avoided.
</responsiveness>

<accessibility>
Alternate Input: The signature drag-and-drop interaction must have a keyboard equivalent.

Focus Management: Modals or drawers trap focus and return focus to the opener.

Live Announcements: State changes and conflicts must be announced to screen readers.
</accessibility>

<performance>
The signature interaction remains responsive and settles within 100ms. Linked views settle within 500ms even with 100 seeded records.
</performance>

<writing>
Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
A shareable filtered workflow view whose grouping, context, and generated update remain linked.
</innovation>

<requirements>
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
State must be strictly in-memory.
</requirements>

<integrity>
A CRUD table alone is insufficient; the signature interaction, causal motion, and exact artifact round trip must be implemented to pass.
</integrity>

<delivery>
Serve the application on port 3000 via npm start.
No console or page errors allowed.
The dist directory must be committed if served from build output.
</delivery>

<webmcp_action_contract>
The application must expose a WebMCP contract on the `window` object to enable automated grading and observation.

```typescript
export interface ClassroomLessonArcPlannerSession {
  schemaVersion: "v1";
  exportedAt: string; // RFC3339
  records: LessonBlock[];
  derived: { summary: Record<string, any> };
  history: any[];
}

export interface LessonBlock {
  id: string;
  title: string;
  description: string;
  status: "draft" | "ready" | "changed" | "archived";
  duration: number; // bounded field, e.g. 10 to 120
  lane: string;
}
```

The WebMCP session info function:
```typescript
window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-planning-classroom-lesson-arc-planner-constraint-canvas-rn-linear-views",
  version: "1.0",
  capabilities: ["entity-collection-v1", "artifact-transfer-v1"]
});
```

The `window.webmcp_list_tools` and `window.webmcp_invoke_tool` must implement the standard WebMCP module tools to read/write state without using the UI (e.g., `artifact_export_session_json`, `artifact_import_session_json`, `entity_create_record`, `entity_update_record`).
</webmcp_action_contract>
