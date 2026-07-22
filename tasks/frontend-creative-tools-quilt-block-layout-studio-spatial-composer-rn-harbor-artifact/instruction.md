# Task proposal: Quilt Block Layout Studio — Spatial Composer — Local Artifact Provenance

**Genre:** `good-app`
**Target users:** People who manage quilt blocks in a bounded local workflow

<summary>
Manage quilt blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
</summary>

## Whole job

Manage quilt blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.

Existing tools split quilt blocks editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts The shipped pattern of scrubbed API keys, source labels, trial downloads, plain JSON, and explicit upload failures into a self-contained frontend job.

### Source inspiration

- https://www.quilterscache.com/
- https://www.fatquartershop.com/
- https://github.com/example-framework/example/releases

### Why this belongs in the corpus

- Canonical variant mutation: place a selected record in a spatial composer and rebalance capacity.
- The artifact quilt-layout-v1.json preserves authored state and derived consequences for a clean round trip.
- Release-note lineage: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure; the borrowed pattern is reinterpreted as a finite local artifact, not copied branding.

## Feature groups

Depth-first execution is mandatory for this group: complete its named outcome, every interaction and visible state, every connected view and derived/artifact effect, then exhaust enhancements, boundary and invalid/empty/conflict cases, recovery/undo/retry, alternate input, responsive behavior, accessibility, motion, and polish before beginning the next group. A feature is incomplete while any connected state, edge case, recovery path, or TODO/shallow placeholder remains.

<core_features>
Quilt Blocks collection:
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Outcome: Create, edit, archive, and filter quilt blocks with explicit domain statuses.
Interactions
Create/edit/delete one record
Filter or reorder records by domain state
Visible states: empty, draft, ready, changed, archived
Boundaries and recovery
Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Invalid required fields preserve the prior valid record and explain recovery.
Shared-state/artifact effect: Mutates records[] and status fields in quilt-layout-v1.json.

Spatial Composer surface:
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Outcome: Use the spatial composer interaction to derive a decision about the collection.
Interactions
place a selected record in a spatial composer and rebalance capacity
Undo the last mutation and inspect the linked representation
Visible states: idle, selected, changed, conflict, resolved
Boundaries and recovery
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Shared-state/artifact effect: Updates spatial-composer geometry/selection, derived summaries, and event history.

Portable work artifact:
Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Outcome: Export and restore the actual session work in a fresh state.
Interactions
Export the current artifact
Clear and import it with field-level validation
Visible states: unsaved, exported, validated, replayed
Boundaries and recovery
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
Shared-state/artifact effect: Produces quilt-layout-v1.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

## Data and artifact contract

**Record shape:** QuiltBlockLayoutStudioSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.

**Validation rules**

- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Record IDs are unique and status values are explicit enums.
- Required fields, numeric/date bounds, and cross-record references validate together.

**Persistence:** In-memory only; export/import is the persistence boundary.

**Import/export:** quilt-layout-v1.json uses the spatial-composer schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.

**Useful end artifact:** Interoperable quilt blocks session artifact

**Interoperable format:** quilt-layout-v1-spatial-composer.json

**Round trip:** Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.

## Experience direction

**20-second demo:** The user place a selected record in a spatial composer and rebalance capacity, watches linked views react, then exports the completed artifact.

<visual_design>
Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
Motion: The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
Signature interaction: place a selected record in a spatial composer and rebalance capacity
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Linked views: The spatial composer surface, derived summary, and artifact query share one state.
Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.

Use strictly npm-local dependencies; no external CDNs are permitted.
Use Tailwind CSS 4.3.2.
</requirements>

### Frontend-native gate

- **Canonical mutation:** place a selected record in a spatial composer and rebalance capacity
- **Artifact-preserved state:** records[].spatial-composerState, derived.summary, history[]
- **CRUD substitution test:** A CRUD table cannot satisfy the domain-native signature, linked derived consequence, alternate input, causal motion, mobile transformation, or exact artifact round trip.
- **Dedicated criteria:** signature_interaction=AC-01, alternate_input=AC-08, linked_views=AC-11, causal_motion=AC-03, mobile_transformation=AC-07, artifact_round_trip=AC-13

## Browser-observable acceptance contract

| ID | Dimension | Criterion | User action | Required evidence |
|---|---|---|---|---|
| AC-01 | core_features | signature_mutation | place a selected record in a spatial composer and rebalance capacity. | The spatial composer mutation changes the primary record, linked view, and status together. |
| AC-02 | visual_design | visual_hierarchy | Inspect the primary work surface, linked summary, and detail panel. | The visual hierarchy makes current state and next action clear. |
| AC-03 | motion | causal_motion | place a selected record in a spatial composer and rebalance capacity. | Motion connects the acted-on item to its new state and has a reduced-motion equivalent. |
| AC-04 | technical | schema_contract | Query the current state and export after the mutation. | The tool result and artifact contain the declared API-shaped fields. |
| AC-05 | user_flows | complete_user_flow | Create, edit, mutate, undo, and complete one record. | The end-to-end job is recoverable without reload. |
| AC-06 | edge_cases | boundaries_recovery | Try exact bounds, an invalid cross-field value, an empty state, and malformed import. | Each invalid action gives field-level recovery and preserves prior valid state. |
| AC-07 | responsiveness | mobile_mode | Use the signature interaction at a narrow viewport. | The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow. |
| AC-08 | accessibility | alternate_input | Repeat the signature interaction with keyboard and touch-equivalent controls. | Alternate input produces identical state with visible focus and live feedback. |
| AC-09 | performance | large_collection | Exercise a seeded collection with at least 100 records. | The signature interaction remains responsive and unrelated rows stay stable. |
| AC-10 | writing | domain_copy | Inspect labels, statuses, errors, and empty-state text. | Copy names the domain consequence and recovery action precisely. |
| AC-11 | innovation | linked_utility | Mutate a record and use the linked representation to make the next decision. | Linked views provide domain utility beyond CRUD. |
| AC-12 | design_fidelity | source_fidelity | Compare the implementation with the cited source interaction vocabulary. | The visual and interaction thesis is coherent without copying unrelated screens. |
| AC-13 | behavioral | artifact_round_trip | Export, clear, import, and inspect the edited variant record and derived state. | Authored order/selection/geometry and domain state survive; invalid import is a no-op. |

<webmcp_action_contract>
Window global tools include `seed_records`, `query_state`, and `import_artifact`.
</webmcp_action_contract>
