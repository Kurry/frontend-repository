# Community Fridge Restock Planner Audit Lens Provenance Viewer

<summary>
Manage restock tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.

Existing tools split restock tasks editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts shipped patterns of job viewer keyboard navigation, trial file browsing, plain JSON output, and upload/error handling into a self-contained frontend job.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Restock Tasks collection: Create, edit, archive, and filter restock tasks with explicit domain statuses.
Audit Lens surface: Use the audit lens interaction to derive a decision about the collection. Attach evidence to a selected record and resolve an audit discrepancy. Undo the last mutation and inspect the linked representation.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear and import it with field-level validation.
</core_features>

<user_flows>
Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
Audit Lens Flow: Attach evidence to a selected record and resolve an audit discrepancy. The audit lens mutation changes the primary record, linked view, and status together.
</user_flows>

<edge_cases>
Boundaries Recovery: Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
Invalid Required Fields: Invalid required fields preserve the prior valid record and explain recovery.
Rejection: A conflicting or incomplete mutation is rejected without partial updates.
Undo: Undo restores ordering, selection, and derived values.
</edge_cases>

<visual_design>
Visual Thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Visual Hierarchy: The visual hierarchy makes current state and next action clear. Inspect the primary work surface, linked summary, and detail panel.
Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
Causal Motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent. The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Mobile Mode: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
Alternate Input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
General: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
Large Collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Domain Copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Linked Utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
Use Tailwind CSS 4.3.2. Do not use CDNs; install all dependencies locally via npm.
The state must be entirely in-memory. Never use localStorage or remote network calls.
The exported format must be fridge-restock-v1-audit-lens.json and follow the CommunityFridgeRestockPlannerSession schema shape with schemaVersion, exportedAt, records, derived, and history.
Validation rules: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
The implementation must be served on port 3000.
</delivery>

<webmcp_action_contract>
To ensure automated verification can interact with your application, you must implement the standard WebMCP contract. Expose the following on the global window object:
window.webmcp_session_info: Must return a valid WebMCP session object with your task's metadata.
window.webmcp_list_tools(): Must return an array of available tools (e.g., standard module operations).
window.webmcp_invoke_tool(name, args): Must handle tool invocations and return a serialized result.
</webmcp_action_contract>
