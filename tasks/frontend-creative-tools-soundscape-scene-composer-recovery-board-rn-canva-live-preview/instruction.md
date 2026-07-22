<summary>
Build a Soundscape Scene Composer and Recovery Board using React, Tailwind CSS 4.3.2, and Lucide React. All assets must be loaded locally without CDNs. The app provides a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core workflow allows the user to manage sound layers, move a failed record into a recovery path, and repair its downstream consequences. This simulates a design workspace where desktop edits update a mobile preview, timing notes, and a portable share artifact. The app maintains entirely in-memory state and produces a downloadable JSON session artifact conforming to the SoundscapeSceneComposerSession schema.
</summary>

<core_features>
Feature: Sound Layers collection. Create, edit, archive, and filter sound layers with explicit domain statuses (empty, draft, ready, changed, archived, failed). Users can create or edit one record at a time. Users can filter or reorder records by domain state. Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery. These actions mutate the records array and status fields in the shared state.

Feature: Recovery Board surface. Provide a recovery board interaction to derive a decision about the collection. The signature interaction is to move a failed record into a recovery path and repair its downstream consequences. Users can undo the last mutation and inspect the linked representation. Visible states include idle, selected, changed, conflict, and resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. These actions update recovery-board geometry, selection, derived summaries, and event history in the shared state.

Feature: Portable work artifact. Export and restore the actual session work in a fresh state. Users can export the current artifact and clear or import it with field-level validation. Visible states include unsaved, exported, validated, and replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates the exportedAt timestamp. This produces soundscape-scene-v1-recovery-board.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<visual_design>
Visual hierarchy makes current state and next action clear. The layout features a desktop primary surface plus a summary and inspector panel. On mobile, secondary surfaces transform into drawers or stacked steps without horizontal clipping. The design is a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
Motion connects the acted-on item to its new state. The acted-on item moves or morphs into its new state. A reduced motion equivalent is provided that preserves feedback without transforms or animations.
</motion>

<requirements>
The app must be completely frontend-native with zero backend or external API calls. All state must be in-memory only without using localStorage or sessionStorage. The app must use Tailwind CSS 4.3.2 for styling. All assets must be loaded locally without CDNs. Keyboard and touch-equivalent controls must produce the identical canonical mutation as mouse interactions. Ctrl or Cmd plus Z must undo the canonical mutation. Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support are required. The signature interaction must remain responsive with at least 100 seeded records without rebuilding unrelated surfaces. The artifact schema uses schemaVersion "v1", an exportedAt RFC3339 timestamp, explicit enum status values, unique record IDs, and strict field bounds.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Deliver the complete application in the /app directory, starting on port 3000 via npm start. The application must run without console errors. Implement the window-bound WebMCP contract providing session info, tool list, and tool invocation handlers.
</delivery>

<webmcp_action_contract>
<contract>
<module name="structured-editor-v1" />
<module name="entity-collection-v1" />
<module name="artifact-transfer-v1" />
</contract>
</webmcp_action_contract>