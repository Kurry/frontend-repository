<summary>
Build a Ceramic Glaze Test Atlas Constraint Canvas application using React, Vite, Zustand, Tailwind CSS 4.3.2, and dnd-kit. The app is a domain-native browser surface to manage glaze tests where dragging a selected record across constraint lanes resolves conflicts. It produces a shareable filtered workflow view whose grouping, context, and generated update remain linked. The app operates entirely in-memory (good-app genre, NO localStorage) and exports an interoperable artifact (glaze-atlas-v1-constraint-canvas.json).
You must not use CDNs or npm installs; all required dependencies are already specified in the workspace package.json.
</summary>

<reference_screenshots>
None
</reference_screenshots>

<core_features>
Feature: Glaze Tests collection —
- Create, edit, archive, and filter glaze tests with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Modifying records updates the records[] and status fields in the exported artifact.

Feature: Constraint Canvas surface —
- Drag a selected record across constraint lanes and resolve a conflict.
- Visible states include idle, selected, changed, conflict, and resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state/artifact effect: Updates constraint-canvas geometry/selection, derived summaries, and event history.

Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state.
- Export the current artifact as glaze-atlas-v1-constraint-canvas.json.
- Clear the session and import an artifact with field-level validation.
- Visible states: unsaved, exported, validated, replayed.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- The artifact schema (CeramicGlazeTestAtlasSession) includes schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[], derived, and history[].
</core_features>

<visual_design>
Feature: Experience and Layout —
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout features a primary surface plus a summary and inspector.
- Mobile layout transforms secondary surfaces into drawers or stacked steps, preserving touch targets and avoiding horizontal clipping.
- The visual hierarchy makes current state and next action clear.
- Domain copy names the domain consequence and recovery action precisely.
</visual_design>

<motion>
Feature: Causal Motion —
- The acted-on item moves or morphs into its new state during drag and drop.
- Reduced motion preserves feedback without transforms (e.g. state change without animation).
</motion>

<requirements>
All implementations MUST be purely local. You must not use CDNs or npm installs; all required dependencies are already specified in the workspace package.json.
- AC-01: signature_interaction — The constraint canvas mutation (dragging a selected record across constraint lanes and resolving a conflict) changes the primary record, linked view, and status together.
- AC-02: visual_hierarchy — Inspecting the primary work surface, linked summary, and detail panel reveals a visual hierarchy that makes current state and next action clear.
- AC-03: causal_motion — Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- AC-04: schema_contract — Querying the current state and exporting after the mutation produces an artifact containing the declared API-shaped fields (schemaVersion, exportedAt, records, derived, history).
- AC-05: complete_user_flow — Create, edit, mutate, undo, and complete one record; the end-to-end job is recoverable without reload.
- AC-06: boundaries_recovery — Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
- AC-07: mobile_mode — Using the signature interaction at a narrow viewport, the desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
- AC-08: alternate_input — Repeating the signature interaction with keyboard and touch-equivalent controls produces identical state with visible focus and live feedback.
- AC-09: large_collection — Exercising a seeded collection with at least 100 records leaves the signature interaction responsive and unrelated rows stable.
- AC-10: domain_copy — Inspecting labels, statuses, errors, and empty-state text reveals copy that names the domain consequence and recovery action precisely.
- AC-11: linked_utility — Mutating a record and using the linked representation to make the next decision proves linked views provide domain utility beyond CRUD.
- AC-12: source_fidelity — Comparing the implementation with the cited source interaction vocabulary shows the visual and interaction thesis is coherent without copying unrelated screens.
- AC-13: artifact_round_trip — Exporting, clearing, importing, and inspecting the edited variant record and derived state proves authored order/selection/geometry and domain state survive; invalid import is a no-op.
</requirements>

<webmcp_action_contract>
{
  "app": "Ceramic Glaze Test Atlas — Constraint Canvas",
  "schemaVersion": "glaze-atlas-session-v1"
}
</webmcp_action_contract>
