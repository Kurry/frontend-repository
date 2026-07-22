<summary>
Build a Ceramic Glaze Test Atlas using React, Zustand, and Tailwind CSS 4.3.2. The application manages glaze tests through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core mechanic is the Scenario Weaver: branch a selected record into a scenario and compare linked outcomes. This concept adapts a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree, into a self-contained frontend job. The app produces the user's session files: an interoperable JSON document containing the glaze atlas, compliant with the provided data schema, which can be exported and re-imported to restore state.
</summary>

<core_features>
Feature: Glaze Tests collection —
- A collection surface that displays glaze tests. Supports multi-select, folders, and queue state.
- Create, edit, archive, and filter glaze tests with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state/artifact effect: Mutates records and status fields in glaze-atlas-v1.json.

Feature: Scenario Weaver surface —
- Use the scenario weaver interaction to derive a decision about the collection.
- Signature interaction: branch a selected record into a scenario and compare linked outcomes.
- Undo the last mutation and inspect the linked representation.
- Visible states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state/artifact effect: Updates scenario-weaver geometry/selection, derived summaries, and event history.

Feature: Portable work artifact —
- Export and restore the actual session work in a fresh state.
- Export the current artifact.
- Clear and import it with field-level validation.
- Visible states: unsaved, exported, validated, replayed.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- Shared-state/artifact effect: Produces glaze-atlas-v1.json with schemaVersion, exportedAt, records, derived state, and history.

Feature: Data and artifact contract —
- Record shape: CeramicGlazeTestAtlasSession with schemaVersion, exportedAt, records, derived{}, and history[]; each record is an API-shaped would-be request body.
- Validation rules: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together.
- Persistence: In-memory only; export/import is the persistence boundary.
- Import/export: glaze-atlas-v1.json uses the scenario-weaver schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
- Interoperable format: glaze-atlas-v1-scenario-weaver.json.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear, with a desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Causal motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent (reduced motion preserves feedback without transforms).
</motion>

<requirements>
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack/drawer/stepper on mobile.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard and touch-equivalent) produces identical state with visible focus and live feedback.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable.
- Writing: Copy names the domain consequence and recovery action precisely.
- No backend: In-memory state only, NO localStorage.
- All required libraries must be installed locally via npm. Use of CDNs is strictly prohibited.
- The exported artifact must be downloadable and structurally sound (a JSON file matching the schema).
</requirements>

<webmcp_action_contract>
Action signature: seed_records(records)
Action signature: query_session()
Action signature: import_session(sessionData)
Action signature: branch_scenario(recordId)
</webmcp_action_contract>
