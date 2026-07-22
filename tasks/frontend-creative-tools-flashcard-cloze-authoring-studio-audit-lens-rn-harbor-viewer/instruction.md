<summary>
Build a Flashcard Cloze Authoring Studio — Audit Lens — Release-derived Viewer using React, Vite, and Tailwind CSS 4.3.2. This app manages cloze cards through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core interaction is to attach evidence to a selected record and resolve an audit discrepancy. It features keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery. The state is entirely in-memory (no localStorage) and produces a downloadable interoperable artifact cloze-deck-v1.json with an exact artifact round-trip import capability. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Signature Mutation: attach evidence to a selected record and resolve an audit discrepancy. The audit lens mutation changes the primary record, linked view, and status together.
- Cloze Cards collection: Create, edit, archive, and filter cloze cards with explicit domain statuses.
- Audit Lens surface: Use the audit lens interaction to derive a decision about the collection. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export the current session work artifact to cloze-deck-v1.json. Clear and import it with field-level validation, restoring authored structure and regenerating exportedAt.
</core_features>

<visual_design>
- Visual Hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps without horizontal clipping.
</visual_design>

<motion>
- Causal Motion: attach evidence to a selected record and resolve an audit discrepancy. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
- The state must be entirely in-memory. NO localStorage.
- All assets must be loaded locally without CDNs. Framework is React, Vite, and Tailwind CSS 4.3.2.
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The oracle should be placed in `solution/app` and startable on port 3000 via `npm start`.
- WebMCP standard modules contract must be implemented on the window object.
</delivery>
<webmcp_action_contract>
<module name="cloze_cards">
<action name="create" />
<action name="read" />
<action name="update" />
<action name="delete" />
</module>
</webmcp_action_contract>
