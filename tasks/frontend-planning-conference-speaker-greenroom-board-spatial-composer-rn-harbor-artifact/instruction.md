# Conference Speaker Greenroom Board — Spatial Composer — Provenance Artifact Provenance

<summary>
Manage speaker slots through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
</summary>

<core_features>
- Speaker Slots collection: Create, edit, archive, and filter speaker slots with explicit domain statuses (empty, draft, ready, changed, archived).
- Spatial Composer surface: Place a selected record in a spatial composer (a 2D area representing the greenroom) and rebalance capacity (e.g. adjust capacity numbers, change statuses).
- Portable work artifact: Export and restore the actual session work (speaker-greenroom-v1-spatial-composer.json).
</core_features>

<user_flows>
- Complete User Flow: The user creates or edits a record, uses the spatial composer to adjust its place and capacity, watches linked views (summary and details) react, and then exports the completed artifact. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Boundaries & Recovery: Try exact bounds (e.g., maximum capacity, minimum duration), an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- A conflicting or incomplete mutation in the spatial composer is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
</edge_cases>

<visual_design>
- Visual Hierarchy: The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Causal Motion: Motion connects the acted-on item to its new state (e.g., morphing or translating from the list to the composer) and has a reduced-motion equivalent (respecting prefers-reduced-motion without layout jumps).
</motion>

<responsiveness>
- Mobile Mode: Use the signature interaction at a narrow viewport (e.g., below 768px). The desktop primary surface becomes a usable stack/drawer/stepper without horizontal overflow. Touch targets are preserved.
</responsiveness>

<accessibility>
- Alternate Input: Repeat the signature interaction (placing in the spatial composer and rebalancing capacity) with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Large Collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive (within 100ms for direct manipulation) and unrelated rows stay stable.
</performance>

<writing>
- Domain Copy: Labels, statuses, errors, and empty-state text are domain-specific. Copy names the domain consequence and recovery action precisely (e.g., "Rebalance Capacity", "Status: Ready", "Invalid capacity").
</writing>

<innovation>
- Linked Utility: Mutate a record in the spatial composer and use the linked representation (e.g., derived summaries or filters) to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Strict in-memory state only; NO localStorage or other persistence mechanisms are allowed.
- The exported artifact must be named speaker-greenroom-v1-spatial-composer.json and follow the ConferenceSpeakerGreenroomBoardSession schema (with schemaVersion, exportedAt, records, derived, and history).
</requirements>

<integrity>
- Clean start: No authored work, completion, approval, export, or success evidence may be preseeded.
- True browser mechanics: Implement normal pointer actionability, computed style while actually hovered, keyboard traversal, and reduced-motion causal parity.
</integrity>

<delivery>
- The solution must run on port 3000 via `npm start`.
- No console errors or page errors during normal interactions.
</delivery>

<webmcp_action_contract>
window.webmcp_session_info = async () => ({ task_id: 'frontend-planning-conference-speaker-greenroom-board-spatial-composer-rn-harbor-artifact' });
</webmcp_action_contract>
