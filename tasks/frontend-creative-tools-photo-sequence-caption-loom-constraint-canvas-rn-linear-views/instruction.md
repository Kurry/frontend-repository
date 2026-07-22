<summary>
Build a Photo Sequence Caption Loom using React, pure in-memory state, and Tailwind CSS 4.3.2. The app allows users to manage photo sequences through a Constraint Canvas surface where dragging a selected record across constraint lanes resolves a conflict. The app mimics Linear's filtered views, where a shareable filtered workflow view whose grouping, context, and generated update remain linked. The end result must be a purely local, in-memory app (no localStorage) that lets the user manage a list of records and export an interoperable photo-caption-v1-constraint-canvas.json artifact preserving authored state and derived consequences for a clean round trip. All assets must be loaded locally without CDNs.
</summary>

<reference_screenshots>
Screenshots are theoretically available in /reference-screenshots/, but this is a pure-code spec task: implement what is written here. Where a screenshot and the text conflict, the text wins.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Photo Sequences collection —
- Create, edit, and delete photo sequence records in a main collection. Each record should contain an ID, a title/caption, and a status field (e.g., empty, draft, ready, changed, archived).
- The collection supports explicit domain statuses.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Filter or reorder records by domain state.

Feature: Constraint Canvas surface —
- Use a Constraint Canvas interaction to derive a decision about the collection. The canvas displays lanes corresponding to constraint states (idle, selected, changed, conflict, resolved).
- The canonical mutation: drag a selected record across constraint lanes and resolve a conflict.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values. Undo the last mutation and inspect the linked representation.

Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state via a clean API-shaped JSON file (photo-caption-v1-constraint-canvas.json).
- Exported artifact schema: PhotoSequenceCaptionLoomSession with schemaVersion, exportedAt, records[], derived{}, and history[].
- schemaVersion is a task-specific v1 enum.
- Clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
</user_flows>

<edge_cases>
</edge_cases>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The constraint canvas mutation changes the primary record, linked view, and status together.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
</responsiveness>

<accessibility>
</accessibility>

<performance>
</performance>

<writing>
</writing>

<innovation>
</innovation>

<requirements>
Requirements (each line is an observable behavior the finished app must exhibit):
- No external network requests; pure local React with Vite. All assets must be loaded locally without CDNs.
- Styling strictly with Tailwind CSS 4.3.2.
- No localStorage or sessionStorage or IndexedDB; all state strictly in-memory. Refreshing wipes it.
- Responsive design. At a narrow viewport, the desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
- Accessible: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard/touch) produces identical state with visible focus and live feedback.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- The oracle implementation should be placed in solution/app with a functional npm start target serving on port 3000.
</delivery>

<webmcp_action_contract>
<module_spec id="structured-editor-v1">
</module_spec>
<module_spec id="entity-collection-v1">
</module_spec>
<module_spec id="artifact-transfer-v1">
</module_spec>
</webmcp_action_contract>
