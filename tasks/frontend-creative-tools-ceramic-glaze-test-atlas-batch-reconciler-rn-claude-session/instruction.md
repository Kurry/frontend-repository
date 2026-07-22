# Ceramic Glaze Test Atlas — Batch Reconciler

<summary>
Manage glaze tests through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. You will build a bounded local workflow for ceramists to track glaze tests, group selected records into a batch, and reconcile aggregate totals. The application must feature a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states—a concept derived from Claude Code's workspace isolation and resume handling but reinterpreted as a frontend-native artifact. Stack: Vite, React, Tailwind CSS 4.3.2.
</summary>

<core_features>
Glaze Tests collection: Create, edit, archive, and filter glaze tests with explicit domain statuses (empty, draft, ready, changed, archived). Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Batch Reconciler surface (Signature Interaction): Group selected records into a batch and reconcile aggregate totals. The mutation changes the primary record, linked view, and status together. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear it, and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
</core_features>

<visual_design>
Visual hierarchy: The visual hierarchy must make the current state and next action clear, presenting a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
Causal motion: Motion connects the acted-on item to its new state (e.g., when grouping items). Reduced motion preserves feedback without transforms.
</motion>

<requirements>
The application must be fully functional and run entirely in the browser using in-memory state. DO NOT use localStorage, sessionStorage, or external databases. Exporting and importing glaze-atlas-v1-batch-reconciler.json is the sole persistence boundary.
Record shape (CeramicGlazeTestAtlasSession): Includes schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[], derived{}, and history[].
Linked Views: The batch reconciler surface, derived summary, and artifact query share one state.
WebMCP Contract: Expose window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool.
Alternate input: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Responsive behavior: Narrow layouts change the interaction model (e.g., stacked steps or drawers) and preserve touch targets without horizontal clipping.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
All frontend code and styling must be locally bundled using npm/Vite. You may not use external CDNs or remote scripts.
Use Tailwind CSS 4.3.2 for styling.
</requirements>

<webmcp_action_contract>
- listTests: returns all glaze tests
- createTest: create a new test
- updateTest: update a test
- deleteTest: delete a test
- reconcileBatch: groups selected tests into a batch
- exportSession: exports session data as JSON
- importSession: imports session data from JSON
</webmcp_action_contract>
