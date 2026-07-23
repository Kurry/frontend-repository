# Wardrobe Wear-Cycle Atelier

<summary>
The user arranges garments into outfits, schedules and logs actual wear, tracks airing/laundry/drying/repair cycles, enforces care and compatibility rules, analyzes utilization/cost-per-wear, branches packing capsules, resolves event conflicts, and exports a portable inventory and lifecycle dossier. Planned, worn, unavailable, and retired states must remain distinct.

This is not a closet inventory. The signature interaction is dragging garments onto a layered outfit silhouette and weekly timeline while compatibility edges, availability, care queue, utilization matrix, capsule capacity, lifecycle history, and artifacts update together. Uses Tailwind CSS 4.3.2.
</summary>

<core_features>
Outfit composition canvas: Compose an outfit by dragging garments into slots. Enforce required/optional slots and layer order. Show preview warnings for compatibility rules. Provide a keyboard-accessible selection mechanism parallel to dragging.
Plan vs. actual timeline: Drag outfit instances onto a weekly timeline. Log actual wear, which snapshots the garment items and times (cannot overlap). Distinguish planned wear from actual wear.
Lifecycle and Availability: Garment state is append-only derived from events (acquired, worn, aired, wash-start, wash-complete, dry-start, dry-complete, repair-start, repair-complete, lent, returned, lost, retired). A garment must be available to be scheduled in an outfit.
Care-batch planner: Users assemble care batches under capacity/color/temperature rules. Exclude items that shouldn't be batched. Provide controls to pause, fail, retry, split, or abandon a batch, preserving already-completed item states.
Repair and condition evidence: Bind condition notes to a garment region. Generate a repair task with severity, required kit, and note. Completing repair consumes fixture kit quantity and requires before/after state.
Utilization and analytics: Visualize utilization across a calendar heatmap, utilization scatter plot, category matrix, and pairing graph. Show wears, wear-days, days-since-wear, care cycles, planned conflicts, and integer-cent cost-per-wear. Interactions cross-filter linked views.
Capsule branching and packing: Build bounded packing capsules with minimums and limits. Branch compare metrics across garments and outfit coverage. Reconcile and merge conflicts.
</core_features>

<visual_design>
Render an organized workspace with the outfit canvas, timeline, and care/lifecycle queue.
Use explicit visual cues for state: available vs. washing vs. drying vs. repair vs. conflicted.
Clear structural hierarchy across linked views. Ensure text legibility with proper contrast and distinct iconography for actions.
Ensure the interface remains uncluttered despite high data density.
</visual_design>

<motion>
Show smooth transitions during garment-to-slot drag and drop.
Provide clear visual feedback when a garment transitions lifecycle states.
Analytics views and capsule updates should animate changes causally.
Observe prefers-reduced-motion to disable complex animations while retaining badge updates.
</motion>

<requirements>
Deterministic fixture: The fictional wardrobe has 36 garments across 10 categories, fixed colors/warmth/formality/weather tags, purchase cents, care symbols, maximum wear-before-care rules, three outfit occasions, 12 historic wear/care events, two repairs, four laundry resources, and a seven-day weather/occasion fixture. No shopping or style advice is provided.
Whole job deterministic transactions: Treat every workflow as a transaction that either applies fully or safely recovers/aborts. No double-activation glitches.
Artifact contract: Export an interoperable artifact matching schemaVersion "wardrobe-lifecycle-dossier-v1". It must store fixture/hash/timezone, garments/care, outfits, events/care batches/repairs/capsule DAG, CSV/SVG/ICS checksums, and UTC exportedAt.
Import: Import must fully reconstruct the state. Reject mis-matched fixtures, timezones, and forged states. Re-exporting an imported artifact must yield an identical artifact except for exportedAt.
Use local dependencies via npm only. CDN links are strictly forbidden.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated `generatedAt`/`exportedAt` values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</integrity>

<delivery>
- The solution MUST be built entirely locally in `/app/solution/app` with standard Vite + React configuration.
- The build must succeed completely offline. Use local WebMCP modules only (no network requests).
- Code must be robust and error-free, passing all verification criteria without human intervention.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
