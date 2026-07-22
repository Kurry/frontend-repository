<summary>
Create a React and Tailwind CSS 4.3.2 frontend for a Classroom Lesson Arc Planner where the user can manage lesson blocks through a domain native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core workflow requires users to group selected records into a batch and reconcile aggregate totals. It must include a local session ledger that exposes save health tool output retention safe resume and recovery states. State must be entirely in memory.
</summary>

<reference_screenshots>
None
</reference_screenshots>

<core_features>
The application must provide a Lesson Blocks collection allowing users to create edit archive and filter lesson blocks with explicit domain statuses.
The application must provide a Batch Reconciler surface allowing users to group selected records into a batch and reconcile aggregate totals.
The application must allow users to undo the last mutation and inspect the linked representation.
The application must allow exporting the current artifact to a JSON file named lesson-arc-v1-batch-reconciler.json.
The application must allow clearing the session and importing the artifact with field level validation.
</core_features>

<user_flows>
- Users can create, edit, mutate, undo, and complete one record, and the end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- The visual hierarchy makes current state and next action clear.
- A distinctive domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- The acted-on item moves or morphs into its new state.
</motion>

<responsiveness>
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
- Alternate input produces identical state with visible focus and live feedback.
- Keyboard and touch-equivalent controls produce the identical canonical mutation.
</accessibility>

<performance>
- The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Inspect labels, statuses, errors, and empty-state text.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD.
- The visual and interaction thesis is coherent without copying unrelated screens.
</innovation>

<requirements>
The app must be a single page application built with React, Vite, and Tailwind CSS 4.3.2.
All dependencies including Tailwind CSS must be installed locally via npm. Use of CDNs is strictly prohibited.
All state must be in memory with no persistence to localStorage or external APIs.
The artifact schema must include schemaVersion exportedAt records derived and history.
schemaVersion must be a task specific v1 enum and exportedAt must be RFC3339.
Record IDs must be unique and status values must be explicit enums.
Export clear import and inspect the edited variant record and derived state authored order selection geometry and domain state survive.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The application must be served on port 3000.
</delivery>

<webmcp_action_contract>
# Action Contract

The oracle MUST implement a standard `<ActionContract />` rendering `<ActionContractItem />` per capability. Use `import type { ActionContractConfig } from '@zto/webmcp-contracts'` if building a React application.

## Tool Definitions

The oracle must define the following tools via the `webmcp_list_tools` capability:

- `entity_create_record`: Create a new lesson block record.
- `entity_update_record`: Update an existing lesson block record.
- `artifact_export_session_json`: Export the current artifact to `lesson-arc-v1-batch-reconciler.json`.
- `artifact_import_session_json`: Clear the session and import the provided JSON artifact.

Each tool must have a `name`, `description`, and `inputSchema` detailing the expected parameters.

## Tool Implementations

The oracle must implement the tools via the `webmcp_invoke_tool` capability. Each tool implementation must match the visual UI logic, execute the requested action, update the application state, and return a result according to the WebMCP specification.
</webmcp_action_contract>
