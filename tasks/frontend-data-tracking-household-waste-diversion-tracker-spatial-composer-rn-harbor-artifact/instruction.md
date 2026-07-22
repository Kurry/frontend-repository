<summary>
Manage waste events through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
</summary>

<core_features>
- Waste Events collection: Create, edit, archive, and filter waste events with explicit domain statuses.
- Spatial Composer surface: Use the spatial composer interaction to derive a decision about the collection. Place a selected record in a spatial composer and rebalance capacity. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear it, and import it with field-level validation.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- The user places a selected record in a spatial composer and rebalances capacity, watches linked views react, then exports the completed artifact.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms and causal parity.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Good-app genre means in-memory state only, NO localStorage.
- Manage waste events through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact.
- The whole job is incomplete unless the implementation proves every clause below through the proposal's own named entities, canonical mutation, linked views, and portable artifact.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
</requirements>

<integrity>
- Never fabricate media — an evidence.webm must be a real recording.
- No silent failure.
- Ensure strict separation of state between imports.
</integrity>

<delivery>
- The solution must be in solution/app.
- Must serve on port 3000 via npm start.
- No console or page errors.
- One WebM (VP9) walkthrough in evidence.webm.
- Run validation and generate proper dimension TOMLs.
</delivery>

<webmcp_action_contract>
{
  "modules": [
    "entity-collection-v1",
    "artifact-transfer-v1"
  ]
}
</webmcp_action_contract>
