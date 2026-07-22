# Music Practice Loop Composer — Batch Reconciler — Claude Session

<summary>
Manage practice segments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: group selected records into a batch and reconcile aggregate totals. Release-derived concept: a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states.

The application must serve entirely in-memory using local React state, with no localStorage or external network requests. Tailwind CSS 4.3.2 is strictly used for styling. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Practice Segments collection: Create, edit, archive, and filter practice segments with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields preserve the prior valid record and explain recovery.
- Batch Reconciler surface: Group selected records into a batch and reconcile aggregate totals. Undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation is rejected without partial updates.
- Portable work artifact: Export and restore the actual session work in a fresh state. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- WebMCP Contract: Expose window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool conforming to the standard shape for deterministic seed, query, and import setup.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The desktop primary surface has a summary and inspector, while mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- No network or storage: All application state is in-memory only. Do not use localStorage or external APIs.
- Styling: Use Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
- Data Shape: The artifact is practice-loop-v1-batch-reconciler.json, following the shape: { schemaVersion: "v1", exportedAt: "RFC3339", records: [...], derived: {...}, history: [...] }.
- Validation: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums.
- WebMCP Integration: Must expose standard window.webmcp_ hooks to programmatically control records, derived state, undo, export and import, and queries.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- The oracle app MUST be in solution/app.
- Start it using npm start on port 3000.
</delivery>
