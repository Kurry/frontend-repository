# Bike Maintenance Mileage Map — Constraint Canvas — Linear Filtered Views

<summary>
Manage bike service records through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: drag a selected record across constraint lanes and resolve a conflict. Release-derived concept: a shareable filtered workflow view whose grouping, context, and generated update remain linked.

All assets must be loaded locally without CDNs. You should use Tailwind CSS 4.3.2.
</summary>

<core_features>
Create, edit, archive, and filter bike service records with explicit domain statuses.
Use the constraint canvas interaction to derive a decision about the collection by dragging a selected record across constraint lanes and resolving a conflict.
Undo the last mutation and inspect the linked representation.
Export and restore the actual session work in a fresh state via bike-maintenance-v1.json.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes current state and next action clear.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
Motion connects the acted-on item to its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
All assets must be loaded locally without CDNs.
Persistence: In-memory only; export/import is the persistence boundary (NO localStorage).
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Linked views: The constraint canvas surface, derived summary, and artifact query share one state.
Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
Artifact: bike-maintenance-v1.json uses the constraint-canvas schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The oracle application must be served on port 3000 via `npm start`.
- No console or page errors.
</delivery>

<webmcp_action_contract>
The agent verifier will use this protocol to interact with the application. The application must implement the window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool interface to support the following tools:
1.  `seed_records`
    *   Description: Seeds the initial state with deterministic bike service records for verification.
    *   Input schema: `{ "records": [{ "id": "string", "state": "draft|ready|changed|archived|conflict", "details": "object" }] }`
2.  `query_state`
    *   Description: Returns the current state of the application for verification.
    *   Input schema: `{}`
    *   Output schema: `{ "records": [{ "id": "string", "state": "draft|ready|changed|archived|conflict", "details": "object" }], "constraintCanvasState": "object", "derivedSummary": "object", "history": "array" }`
3.  `export_artifact`
    *   Description: Triggers the download of the current session artifact.
    *   Input schema: `{}`
4.  `import_artifact`
    *   Description: Simulates a user importing an artifact.
    *   Input schema: `{ "artifact_content": "string (JSON)" }`
</webmcp_action_contract>
