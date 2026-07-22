<summary>
Build a local Community Workshop Toolboard using React, Tailwind CSS 4.3.2, and dnd-kit. The app must let an operator manage workshop stations and drag a selected record across constraint lanes to resolve conflicts. It must produce a portable workshop-toolboard-v1-constraint-canvas Session artifact that compiles authored state, derived summary, and history, supporting a full export and import round-trip.
</summary>

<reference_screenshots>
Reference screenshots are not provided for this task. You must implement the application following the descriptions of layout, behavior, and visual hierarchy defined in the specification.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Workshop Stations collection —
Provide a primary side-panel or list surface to create, edit, and delete workshop stations
Stations have explicit fields for name, capacity, status (empty, draft, ready, changed, archived) and a lane assignment
A filter toggle switches the view between all, draft, and changed stations
Feature: Constraint Canvas surface —
Provide a drag-and-drop canvas displaying backlog, in-progress, review, and done lanes
Dragging a selected record across constraint lanes immediately updates its status to changed and recalculates the derived summary
Each lane enforces a strict capacity limit: moving a record into an over-capacity lane rejects the drop and shows a visible conflict error message, leaving the item in its original lane
Feature: Linked Views and Undo —
A derived summary panel shows the count of active stations per lane and immediately recalculates upon any canvas mutation
An Undo button reverts the last move or mutation, restoring the prior lane, selection, and derived summary state
Feature: Portable work artifact —
An Export Session button downloads a JSON artifact containing schemaVersion, an ISO-8601 exportedAt, records, derived, and history arrays
An Import Session button accepts a JSON file, validates the schemaVersion, regenerates exportedAt, and fully restores the canvas state and history
</core_features>

<user_flows>
User flows (each line is an observable behavior the finished app must exhibit):
Create, edit, mutate, undo, and complete one record: The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
Edge cases (each line is an observable behavior the finished app must exhibit):
Try exact bounds, an invalid cross-field value, an empty state, and malformed import: Each invalid action gives field-level recovery and preserves prior valid state.
A conflicting or incomplete mutation is rejected without partial updates.
</edge_cases>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
Inspect the primary work surface, linked summary, and detail panel: The visual hierarchy makes current state and next action clear.
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
Drag a selected record across constraint lanes and resolve a conflict: Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
Responsiveness (each line is an observable behavior the finished app must exhibit):
Use the signature interaction at a narrow viewport: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
Accessibility (each line is an observable behavior the finished app must exhibit):
Repeat the signature interaction with keyboard and touch-equivalent controls: Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
Performance (each line is an observable behavior the finished app must exhibit):
Exercise a seeded collection with at least 100 records: The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Writing (each line is an observable behavior the finished app must exhibit):
Inspect labels, statuses, errors, and empty-state text: Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Innovation (each line is an observable behavior the finished app must exhibit):
Mutate a record and use the linked representation to make the next decision: Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
Requirements (each line is an observable behavior the finished app must exhibit):
The solution must be fully self-contained and run locally in the browser with no external network calls or backend services.
Application state must reside only in memory; localStorage or other persistent browser storage mechanisms are strictly prohibited.
schemaVersion must exactly equal workshop-toolboard-v1 in the exported artifact.
All dependencies must be installed locally via npm; CDN links are strictly prohibited.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Deliver the React application inside `/app`. Use standard npm commands (`npm install`, `npm start` for Vite development server, `npm run build` for production).
</delivery>

<webmcp_action_contract>
# WebMCP action contract

The user is working in an environment that has an external WebMCP integration. You must expose the following global objects on the `window` to allow the environment to query state and execute actions.

1. `window.webmcp_session_info`: A JSON-serializable object containing:
   - `task_name`: "mercor-intelligence/frontend-planning-community-workshop-toolboard-constraint-canvas-rn-linear-views" (MUST be exactly this string).
   - `state_summary`: A brief string summarizing the current state.
   - `last_exported_at`: An ISO-8601 string of the most recent modification.
2. `window.webmcp_list_tools`: A function returning a JSON string of tool definitions. Tools must follow standard naming (`entity_create_record`, `entity_update_record`, `artifact_export_session_json`, `artifact_import_session_json`).
3. `window.webmcp_invoke_tool`: A function `(tool_name: string, kwargs_json: string) => Promise<string>` that performs the requested mutation and returns a JSON result.
</webmcp_action_contract>
