<summary>
Build a Music Practice Loop Composer using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte. The app manages practice segments in a bounded local workflow, letting users branch a selected record into a scenario and compare linked outcomes. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Practice Segments collection —
- Create, edit, archive, and filter practice segments with explicit domain statuses.
- Filter or reorder records by domain state.
- Empty, draft, ready, changed, and archived states are visible.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Mutates records[] and status fields in practice-loop-v1.json.
- Seed a deterministic collection with at least 100 records including empty, boundary, valid, and conflict states.

Feature: Scenario Weaver surface —
- Branch a selected record into a scenario and compare linked outcomes.
- Undo the last mutation and inspect the linked representation.
- Idle, selected, changed, conflict, and resolved states are visible.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Updates scenario-weaver geometry/selection, derived summaries, and event history.

Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state.
- Export the current artifact.
- Clear and import it with field-level validation.
- Unsaved, exported, validated, and replayed states are visible.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- Produces practice-loop-v1-scenario-weaver.json with schemaVersion (practice-loop-v1), exportedAt (RFC3339), records[], derived{}, and history[].

Feature: Data and artifact contract —
- The exported artifact conforms to MusicPracticeLoopComposerSession schema.
- schemaVersion is exactly practice-loop-v1 and exportedAt is a valid RFC3339 timestamp.
- Record IDs are unique and status values are explicit enums.
- Required fields, numeric/date bounds, and cross-record references validate together.
- In-memory persistence only; export/import is the persistence boundary (NO localStorage).
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens.
- Intentional density and a calm focused canvas.
- Desktop layout has a primary surface plus summary and inspector panels.
- Semantic controls, high contrast, and clear visual hierarchy for current state and next action.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- The app must use Solid.js, Tailwind CSS 4.3.2, and Kobalte.
- All state must be in-memory only; never use localStorage.
- All assets must be loaded locally without CDNs.
- Keyboard and touch-equivalent controls must produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive behavior: Narrow layouts change the interaction model (e.g. desktop surface becomes a usable stack/drawer/stepper), preserve touch targets, and avoid horizontal clipping.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The app must be fully functional and served on port 3000 via `npm start`.
- No external network requests or console errors.
</delivery>

<webmcp_action_contract>
Bindings:
- Entity: record
- Entity operations: create; select; update; delete; reorder
- Entity fields: status; data
- Artifact operations: export; import
- Import modes: practice-loop-v1-scenario-weaver
- Export formats: practice-loop-v1-scenario-weaver

Mechanics exclusions:
- Drag, resize, and motion mechanics stay Playwright (gesture mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
