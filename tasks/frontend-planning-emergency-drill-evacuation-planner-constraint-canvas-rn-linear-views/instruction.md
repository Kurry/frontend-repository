<summary>
Build an Emergency Drill Evacuation Planner with a Constraint Canvas using React and Tailwind CSS. Manage drill checkpoints through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: drag a selected record across constraint lanes and resolve a conflict. The app produces a shareable filtered workflow view whose grouping, context, and generated update remain linked in an in-memory application without a backend or localStorage.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Drill Checkpoints collection —
- Create, edit, archive, and filter drill checkpoints with explicit domain statuses (e.g., draft, ready, changed, conflict, archived).
- The records are seeded with a deterministic collection with empty, boundary, valid, and conflict states, but no target outcome is pre-completed.
- Invalid required fields preserve the prior valid record and explain recovery. Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Feature: Constraint Canvas surface —
- Drag a selected record across constraint lanes and resolve a conflict.
- A conflicting or incomplete mutation is rejected without partial updates. If a record is dropped into a lane but lacks required constraints for that lane, it enters a conflict state, and its details must be resolved.
- Undo the last mutation (Ctrl/Cmd+Z) and inspect the linked representation, which restores ordering, selection, and derived values.
Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state.
- Clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
- The user drags a selected record across constraint lanes and resolves a conflict, watches linked views react, then exports the completed artifact.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- A conflicting or incomplete mutation is rejected without partial updates.
- Duplicate IDs on import are rejected.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Mobile transforms secondary surfaces into drawers or stacked steps.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile viewports.
</responsiveness>

<accessibility>
- Keyboard and touch-equivalent controls produce the identical canonical mutation. Alternate input produces identical state with visible focus and live feedback.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Modal focus trap and opener return, live announcements, non-color evidence.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD. Mutate a record and use the linked representation to make the next decision.
</innovation>

<requirements>
The application must use React, Tailwind CSS 4.3.2, and Vite.
All libraries must be npm-local (no CDNs).
Must not use localStorage; state must be entirely in-memory.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
</integrity>

<delivery>
Deliver the application in `solution/app` configured to run on port 3000 via `npm start`.
Produce `evidence.webm` demonstrating the full end-to-end task.
</delivery>

<webmcp_action_contract>
The WebMCP contract must expose `window.webmcp_session_info`, `window.webmcp_list_tools`, and `window.webmcp_invoke_tool`.
Tools must wrap the canonical state mutation, validation, and export/import exactly as they are performed in the UI.
Modules used should match standard WebMCP contracts (e.g., `entity-collection-v1`, `artifact-transfer-v1`).
</webmcp_action_contract>
