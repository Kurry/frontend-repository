<summary>
Build a Community Garden Workday Planner with a Handoff Map using React and Tailwind CSS 4.3.2. The application manages work tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core feature connects a selected record to a handoff owner and updates readiness. The app adapts a visual token/prototype editor concept where variable changes update modes, preview states, and export tokens into a self-contained frontend job. The state must be entirely in-memory with no localStorage or backend. The application produces a portable work artifact named garden-workday-v1.json.
</summary>

<reference_screenshots>
Screenshots of the reference application are not provided for this task. Implement the visual design based on the textual requirements.
</reference_screenshots>

<core_features>
Feature: Work Tasks collection
Create, edit, archive, and filter work tasks with explicit domain statuses.
Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
Support filtering and reordering records by domain state.
Visible states include empty, draft, ready, changed, and archived.
Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Invalid required fields preserve the prior valid record and explain recovery.
Mutates records array and status fields in the artifact.

Feature: Handoff Map surface
Use the handoff map interaction to derive a decision about the collection.
Connect a selected record to a handoff owner and update readiness.
Undo the last mutation and inspect the linked representation.
Visible states include idle, selected, changed, conflict, and resolved.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Updates handoff-map geometry/selection, derived summaries, and event history.

Feature: Portable work artifact
Export and restore the actual session work in a fresh state.
Export the current artifact to garden-workday-v1.json.
Clear and import the artifact with field-level validation.
Visible states include unsaved, exported, validated, and replayed.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates the exportedAt timestamp.
Produces an artifact with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<user_flows>
The user can create, edit, mutate, undo, and complete one record, with the end-to-end job being recoverable without reload.
The user connect a selected record to a handoff owner and update readiness, watches linked views react, then exports the completed artifact.
</user_flows>

<edge_cases>
Try exact bounds, an invalid cross-field value, an empty state, and malformed import; each gives field-level recovery and preserves prior valid state.
Attempt to import an invalid JSON file; it should be rejected gracefully.
</edge_cases>

<visual_design>
The visual hierarchy makes current state and next action clear on the primary work surface, linked summary, and detail panel.
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop layout has a primary surface plus summary and inspector.
</visual_design>

<motion>
Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
Alternate input produces identical state with visible focus and live feedback.
Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Semantic controls, focus management, contrast, and reduced-motion support.
</accessibility>

<performance>
Exercise a seeded collection with at least 100 records; the signature interaction remains responsive and unrelated rows stay stable.
Keep edits responsive and avoid rebuilding unrelated surfaces.
</performance>

<writing>
Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Linked views provide domain utility beyond CRUD. Mutate a record and use the linked representation to make the next decision.
</innovation>

<requirements>
Build a React application using Vite.
Use Tailwind CSS 4.3.2 for styling.
All dependencies must be installed locally via npm. Do not use CDNs.
Maintain state entirely in-memory. Do not use localStorage or any backend services.
Implement the core Handoff Map interaction and ensure linked views update synchronously.
Provide an Export to JSON feature that produces garden-workday-v1.json.
Provide an Import from JSON feature that validates the imported file.
Implement undo functionality for the handoff map mutation.
Provide an initial seed of at least 100 records for performance testing.
Expose window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool for automated testing.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Deliver the application in the `app` directory. Ensure `npm start` serves the application on port 3000. Provide a built version in `dist` if necessary.
</delivery>

<webmcp_action_contract>
<module_spec id="structured-editor-v1">
</module_spec>
<module_spec id="entity-collection-v1">
</module_spec>
<module_spec id="artifact-transfer-v1">
</module_spec>
</webmcp_action_contract>
