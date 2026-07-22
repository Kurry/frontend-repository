<summary>
You are building the Community Fridge Restock Planner, a frontend-only React web application designed for users who manage restock tasks in a bounded local workflow. The application features a "Scenario Weaver" surface that allows users to branch a selected restock task into a scenario and compare linked outcomes. All state must remain entirely in-memory (no localStorage, no external APIs). The application will support creating, editing, archiving, and filtering tasks, branching tasks to compare scenarios, and exporting/importing the full session state as a JSON artifact.
</summary>

<reference_screenshots>
None provided.
</reference_screenshots>

<core_features>
The user can view, create, edit, and delete restock tasks.
The user can filter or reorder tasks by domain state (draft, ready, changed, archived).
The user can branch a selected record into a scenario using the Scenario Weaver to compare linked outcomes.
The user can undo the last mutation and inspect the linked representation.
The user can export the current artifact containing the session work in a fresh state.
The user can clear the current state and import an artifact with field-level validation.
</core_features>

<user_flows>
Flow 1: Create a Restock Task.
1. The user clicks "New Task".
2. The user fills out the name, item category, quantity, and unit.
3. The user saves the task, and it appears in the collection with a 'draft' status.

Flow 2: Branch into a Scenario (Signature Interaction).
1. The user selects a restock task.
2. The user clicks "Branch Scenario".
3. The scenario weaver interface opens, allowing the user to modify the branched task's attributes.
4. The derived summary (total items, draft count, etc.) updates live to reflect the proposed changes.
5. The user confirms the scenario, linking the changes to the primary record and updating the status to 'changed'.

Flow 3: Export and Import Workspace.
1. The user clicks "Export Workspace".
2. A JSON file (fridge-restock-v1-scenario-weaver.json) is downloaded.
3. The user clicks "Clear Data", resetting the workspace to empty.
4. The user imports the previously downloaded JSON file, which restores the exact state, including history and derived values.
</user_flows>

<edge_cases>
The application rejects invalid cross-field values (e.g., negative quantities) with field-level validation messages.
A conflicting or incomplete mutation in the Scenario Weaver is rejected without partial updates.
Malformed schema, duplicate IDs, unknown references, and invalid bounds on import make no state change.
Undoing a mutation restores ordering, selection, and derived values.
</edge_cases>

<visual_design>
The layout consists of a desktop primary surface (the task list) plus a summary and inspector panel.
The application uses clear state tokens and intentional density for a focused canvas.
The visual hierarchy makes the current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state when transitioning.
A reduced-motion equivalent is provided (e.g., simple fade or instant transition) when preferred.
</motion>

<responsiveness>
Narrow layouts change the interaction model, preserving touch targets and avoiding horizontal clipping.
The desktop surface becomes a usable stack, drawer, or stepper without horizontal overflow on mobile devices.
</responsiveness>

<accessibility>
The application uses semantic controls and maintains full keyboard parity for all interactions.
Focus management is applied, and live updates are announced for screen readers.
Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
The signature interaction remains responsive when a seeded collection contains at least 100 records.
Unrelated rows and surfaces stay stable and do not rebuild unnecessarily during local edits.
</performance>

<writing>
Copy for labels, statuses, errors, and empty-state text names the domain consequence and recovery action precisely.
</writing>

<innovation>
Mutating a record and using the linked representation to make the next decision provides domain utility beyond standard CRUD operations.
</innovation>

<requirements>
Use Tailwind CSS 4.3.2.
Do not use external CDNs; install all dependencies locally via npm.
The state must be entirely in-memory; do not use localStorage, sessionStorage, or remote network calls.
The app must run cleanly with no console errors or warnings.
Use React, Vite, and Tailwind CSS.
Run the application on port 3000.
</requirements>

<integrity>
Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
The solution must be built in `app/`. Include all necessary components, styles, and logic to fully satisfy the documented behaviors. Ensure `npm install` and `npm start` launch the application correctly on port 3000.
</delivery>

<webmcp_action_contract>
This task utilizes WebMCP, a capability evaluation protocol where a secondary agent can independently interact with the application using specific deterministic tools without relying on computer vision or navigating the UI directly. The application must expose `window.webmcp_session_info`, `window.webmcp_list_tools()`, and `window.webmcp_invoke_tool(tool_name, tool_arguments)` allowing the agent to read and mutate the application state. These interactions must reliably update the live React state without requiring page reloads or DOM traversal, while adhering to the validation constraints and data schemas documented above.
</webmcp_action_contract>
