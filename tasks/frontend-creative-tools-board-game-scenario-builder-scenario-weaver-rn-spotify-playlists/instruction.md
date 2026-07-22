<summary>
Build a Board Game Scenario Builder featuring a Scenario Weaver module, adapted from Spotify's collaborative playlist management patterns, using React, Zustand, and Tailwind CSS 4.3.2. This application serves as a domain-native workbench where users can branch scenario cards, mutate them, and observe derived consequences across linked views. It operates entirely with in-memory state and produces a portable, interoperable session artifact (scenario-builder-v1-scenario-weaver.json) that preserves authored structure, derived state, and history.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Scenario Cards Collection —
- Seed a deterministic collection with at least 4 scenario cards (including empty, boundary, valid, and conflict states).
- Users can create, edit, archive, and filter scenario cards.
- Each scenario card uses explicit domain statuses (e.g., draft, ready, changed, archived).
- Filtering or reordering records by domain state updates the visible collection.
- Field-level validation: Exact field boundaries are accepted, while adjacent out-of-range values are rejected.
- When saving fails due to validation, invalid required fields preserve the prior valid record and explain the recovery action.
- The collection shares state: mutations here update records array and status fields in the export artifact.

Feature: Scenario Weaver Surface —
- Support branching a selected record into a scenario to compare linked outcomes. This is the canonical domain mutation.
- The Weaver surface supports states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation, which accurately restores ordering, selection, and derived values.
- The Weaver mutation updates the scenario-weaver geometry/selection, derived summaries, and event history across the shared state.

Feature: Portable Work Artifact —
- Export the current session work into a fresh state file formatted as scenario-builder-v1.json.
- The export contains: schemaVersion (task-specific v1 enum), exportedAt (RFC3339 timestamp), records (array of API-shaped request bodies), derived (object), and history (array).
- Clear the current session.
- Import an exported JSON session file.
- The import validates the schema: malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import completely replaces the in-memory state, restoring authored structure and regenerating exportedAt.
- The cycle of export to clear to import to re-open edited record exactly matches the authored structure, derived state, and history.
</core_features>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy clearly differentiates the current state and the next action.
- Layout: Desktop view provides a primary surface, a linked summary panel, and a detail inspector side-by-side.
- The design must not be a generic CRUD table shell; it must embody the linked-view workbench thesis.
- Copy naming: Labels, statuses, errors, and empty-state text precisely name the domain consequence and recovery action.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
- Causal motion: When branching or mutating a record, motion visibly connects the acted-on item to its new state (e.g., moving from the collection into the Weaver, or morphing state tokens).
- Reduced-motion equivalent: When prefers-reduced-motion: reduce is active, animations are disabled but visual feedback and state changes remain instantaneous and clear.
</motion>

<requirements>
Requirements (each line is an observable behavior the finished app must exhibit):
- Responsiveness: The desktop surface becomes a usable stack, drawer, or stepper on narrow viewports without horizontal clipping or overflow. Narrow layouts adjust the interaction model appropriately.
- Accessibility: Semantic HTML controls, complete keyboard parity (all interactions, including the signature mutation, are keyboard-accessible with visible focus rings), live aria-live updates for status changes, and strong contrast.
- Alternate Input: Keyboard and touch-equivalent controls produce the identical canonical mutation as mouse interactions. Ctrl+Z or Cmd+Z undoes the canonical mutation.
- Performance: The application remains responsive with a seeded collection of at least 100 records. Executing the signature interaction does not rebuild unrelated surfaces.
- State Coherence: Modifying a record must immediately update the Weaver, the derived summary panel, and the export artifact simultaneously (linked views).
- Use local npm dependencies only; do not load scripts or stylesheets from external CDNs.
</requirements>

<webmcp_action_contract>
Action contract (this defines the required WebMCP bindings the app must implement):
- export_session: Extracts the current session state as a JSON object containing schemaVersion, records, derived, history, and weaverState.
- import_session: Accepts a sessionData JSON object, completely replacing the internal state, simulating an artifact replay.
- query_state: Returns the raw application state directly from the store for deterministic verification.
</webmcp_action_contract>
