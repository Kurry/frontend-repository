<summary>
Build a Pantry Nutrition Stock Ledger using React and Tailwind CSS 4.3.2. The app is a domain-native workbench managing ingredients with linked views including a recovery board to repair failed records, a live mobile preview, speaker-time notes, whiteboard pan shortcuts, charts, and simulated custom short links. The app produces the operator session artifact: a downloadable JSON document compiled live from the ingredients collection, derived summaries, history, and recovery board state. Import must round-trip that JSON securely.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Ingredients collection —
- Direct entry: first load shows the ledger with a seeded collection of at least 100 ingredients (representing empty, draft, ready, changed, and archived states, plus conflict states) with no pre-completed target outcomes
- The collection supports create, edit, archive, delete, and filter/reorder by domain state
- Editing an ingredient updates its domain status and downstream consequences immediately
Feature: Recovery Board surface —
- A recovery board interaction where the user can move a failed record into a recovery path and repair its downstream consequences
- Conflicting or incomplete mutations are rejected without partial updates
- An undo shortcut (Ctrl/Cmd+Z or UI button) undoes the last mutation, restoring ordering, selection, and derived values exactly
Feature: Linked views and Live Preview —
- A design workspace layout: desktop primary surface (the recovery board/ledger), plus a live mobile preview, timing notes panel, charts (derived summaries of nutrition/stock), and simulated custom short links
- Edits in the desktop primary surface immediately update the mobile preview, charts, and timing notes without layout jumps or network dependence
- Whiteboard pan shortcuts (e.g., Space+Drag or middle-click) allow navigating the primary surface
Feature: Portable work artifact —
- Export action downloads nutrition-stock-v1-recovery-board.json containing schemaVersion ("v1"), exportedAt (RFC3339), records, derived, and history
- Import action accepts a JSON artifact, clears current state, performs field-level validation (rejecting malformed schema, duplicate IDs, cross-field contradictions, and unknown bounds without mutation), and restores authored structure, selection, geometry, and derived state while regenerating exportedAt
- Re-exporting a clean import produces semantically identical state (except exportedAt)
</core_features>

<user_flows>
- The user filters the ingredients collection to find a failed/conflict record
- The user moves the failed record into the recovery board path and edits it to repair downstream consequences
- The user observes the derived summaries (charts), timing notes, and live mobile preview react instantly
- The user exports the completed artifact, clears the application state, and imports the artifact to verify round-trip fidelity
</user_flows>

<edge_cases>
- Exact field boundaries are accepted; adjacent out-of-range values are rejected with field-level recovery text, preserving the prior valid state
- Invalid required fields or cross-field contradictions highlight the specific field, identify the rejected value, and offer recovery actions; correcting the value clears only the corresponding error
- Importing a malformed schema, duplicate IDs, unknown references, or invalid bounds results in no state mutation
- Undo after a branch or cancel after a transient preview restores the complete prior snapshot including selection, viewport, filters, focus, and history anchor
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
- The visual hierarchy makes current state and the next action clear
- Layout on desktop uses a primary surface, derived summary (charts), and inspector/live preview
- Selected, changed, conflict, and resolved states are visually distinct using non-color evidence (e.g., borders, icons, typography weight)
</visual_design>

<motion>
- The acted-on item (e.g., moving a failed record into a recovery path) moves or morphs into its new state (causal motion)
- Reduced motion preferences (prefers-reduced-motion) are respected, preserving feedback (e.g., immediate position update with opacity change) without transforms
- Linked views (charts, preview) settle within 500 ms without layout shifts
</motion>

<responsiveness>
- Narrow layouts (sub-768px) change the interaction model, transforming secondary surfaces (live preview, inspector, timing notes) into drawers or stacked steps
- Touch targets remain at least 44x44px, and there is no horizontal page-level overflow
- The canonical mutation remains fully achievable at a mobile viewport
</responsiveness>

<accessibility>
- Normal pointer actionability and semantic controls
- Full keyboard traversal and alternate-input parity: keyboard controls (and touch-equivalent controls) produce the identical canonical mutation as direct manipulation
- Modal focus trap and opener return are enforced for any dialogs
- Live announcements for state changes and validation errors
- Non-color evidence is used for all state indicators (e.g., invalid fields)
</accessibility>

<performance>
- Direct manipulation acknowledges within 100 ms
- Linked/derived views (charts, preview, notes) settle within 500 ms
- Export/import completes within 2 seconds
- Unrelated surfaces/rows stay stable (do not rebuild unnecessarily) when editing a record in a large collection of 100+ items
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely
- Error messages identify the field, the rejected rule, and how to fix it
- Empty states and status labels use domain-native terms (e.g., "Draft", "Ready", "Conflict", "Archived")
</writing>

<innovation>
- Linked decision surface: Linked views provide domain utility beyond basic CRUD by instantly reflecting the derived nutrition and stock consequences of a recovery action
- Whiteboard pan shortcuts and timing notes offer power-user enhancements inspired by Canva design workspace
</innovation>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- The application must use strictly in-memory state; NO localStorage, sessionStorage, or IndexedDB persistence mechanisms are allowed.
- Do not use external APIs or backend services.
- The useful end state is an interoperable downloadable artifact.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
</integrity>

<delivery>
Deliver a working React implementation in solution/app that serves on port 3000 via npm start. Ensure dist/ is committed if it serves build output. Provide standard WebMCP tool contracts.
</delivery>

<webmcp_action_contract>
The WebMCP contract must expose `window.webmcp_session_info` returning a promise with the task ID, and implement `window.webmcp_list_tools` and `window.webmcp_invoke_tool` to cover canonical mutations:
- `entity_create_record`: creates an ingredient record
- `entity_update_record`: edits an ingredient (including moving to recovery board)
- `artifact_export_session_json`: returns the current session JSON matching the export shape
- `artifact_import_session_json`: accepts a session JSON string, validating and replacing current state
- `entity_get_derived_summary`: queries the current derived stats (charts/notes)
- `entity_undo_last_action`: triggers the undo command
</webmcp_action_contract>
