<summary>
Manage waste events through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

Existing tools split waste events editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Canva's shipped pattern of live mobile previews, speaker-time notes, whiteboard pan shortcuts, charts, and custom short links into a self-contained frontend job.
</summary>

<core_features>
Waste Events collection
- Create, edit, archive, and filter waste events with explicit domain statuses.
- Create/edit/delete one record.
- Filter or reorder records by domain state.
- Visible states: empty, draft, ready, changed, archived.
- Shared-state/artifact effect: Mutates records[] and status fields in waste-diversion-v1.json.

Recovery Board surface
- Use the recovery board interaction to derive a decision about the collection.
- Move a failed record into a recovery path and repair its downstream consequences.
- Undo the last mutation and inspect the linked representation.
- Visible states: idle, selected, changed, conflict, resolved.
- Shared-state/artifact effect: Updates recovery-board geometry/selection, derived summaries, and event history.
</core_features>

<user_flows>
- Move a failed record into a recovery path and repair its downstream consequences. The recovery board mutation changes the primary record, linked view, and status together.
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector.
- Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent (preserves feedback without transforms).
</motion>

<responsiveness>
- Mobile transforms secondary surfaces into drawers or stacked steps.
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- The visual and interaction thesis is coherent without copying unrelated screens.
</innovation>

<requirements>
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly (in-memory only).
- Require real browser mechanics for graded interactions.
- The application must use Tailwind CSS 4.3.2. All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- For every pointer or direct-manipulation path, make the keyboard/exact-value path converge to one canonical event.
</integrity>

<delivery>
- Export and restore the actual session work in a fresh state.
- Export the current artifact; clear and import it with field-level validation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work: waste-diversion-v1-recovery-board.json.
- Round trip: Export, clear, import, and inspect the edited variant record and derived state. Authored order/selection/geometry and domain state survive; invalid import is a no-op.
</delivery>

<webmcp_action_contract>
**Feature bindings**
- Waste Events collection -> CRUD, status, validation, and query module (entity-collection-v1).
- Linked decision surface -> canonical mutation, derived state, undo, and query module.
- Portable work artifact -> export/import and artifact query module (artifact-transfer-v1).

**Record shape:** HouseholdWasteDiversionTrackerSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.
**Validation rules**
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Record IDs are unique and status values are explicit enums.
- Required fields, numeric/date bounds, and cross-record references validate together.

**Persistence:** In-memory only; export/import is the persistence boundary.
</webmcp_action_contract>
