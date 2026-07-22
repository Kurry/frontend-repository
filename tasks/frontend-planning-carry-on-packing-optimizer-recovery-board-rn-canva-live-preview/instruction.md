<summary>
Build a Carry-On Packing Optimizer application with a Recovery Board feature using React and Tailwind CSS 4.3.2. The application is an in-memory design workspace where desktop edits update mobile previews and portable artifacts. It manages packing items and allows users to move a failed record into a recovery path and repair its downstream consequences.
</summary>

<core_features>
- Packing Items collection: Create, edit, archive, and filter packing items with explicit domain statuses (empty, draft, ready, changed, archived). Validation enforces exact boundaries.
- Recovery Board surface: Move a failed record into a recovery path and repair its downstream consequences. Includes undo/retry for the last mutation.
- Portable work artifact: Export and import the session state to a JSON file (carry-on-pack-v1-recovery-board.json). Schema is validated on import.
</core_features>

<user_flows>
- Complete User Flow: Create an item, edit it, mutate it via the recovery board, undo the action, and then export the finalized artifact.
</user_flows>

<edge_cases>
- Boundary recovery: Ensure exact bounds, invalid cross-field values, and empty states reject gracefully with field-level recovery and preserve prior valid state.
- Malformed Import: Importing a malformed schema, duplicate IDs, unknown references, or invalid bounds results in no state change.
</edge_cases>

<visual_design>
- A distinctive domain-specific workbench with clear state tokens and a calm, focused canvas.
- Visual hierarchy clearly distinguishes current state and next action between the primary surface, linked summary, and detail panel.
</visual_design>

<motion>
- Causal motion: The acted-on item moves or morphs into its new state.
- Reduced motion equivalent preserves feedback without transform animations.
</motion>

<responsiveness>
- Mobile Mode: Desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports.
</responsiveness>

<accessibility>
- Alternate input: Keyboard and touch-equivalent controls produce the identical canonical mutation as mouse gestures.
- Focus is visibly managed, and live feedback is provided via announcements.
</accessibility>

<performance>
- Exercise a seeded collection of at least 100 records: The signature interaction must acknowledge within 100ms and remain responsive without rebuilding unrelated surfaces.
</performance>

<writing>
- Domain copy precisely names the domain consequence and recovery actions in labels, statuses, errors, and empty-state text.
</writing>

<innovation>
- Linked utility: Mutating a record leverages a linked representation to aid in the next decision, providing domain utility beyond standard CRUD.
</innovation>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Persistence must be strictly in-memory; no localStorage allowed.
</requirements>

<integrity>
- Begin from a clean state. No preseeded evidence of success.
- Artifact Export/Import must preserve authored order, selection, and history exactly. Invalid import is a no-op.
</integrity>

<delivery>
- Provide a working React app built with Vite serving on port 3000.
</delivery>

<webmcp_action_contract>
# WebMCP action contract

- Module: `entity-collection-v1`
- Entity: `record`
- Entity operations: `create`, `update`, `delete`, `query`
- Module: `artifact-transfer-v1`
- Artifact operations: `export`, `import`

Implementation:
- The UI and WebMCP handlers must update the same shared in-memory state.
- Expose `window.webmcp_session_info`, `webmcp_list_tools`, and `webmcp_invoke_tool`.
</webmcp_action_contract>
