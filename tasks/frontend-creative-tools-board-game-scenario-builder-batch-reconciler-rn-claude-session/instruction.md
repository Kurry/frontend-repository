# Board Game Scenario Builder — Batch Reconciler — Claude Session

<summary>
Manage scenario cards through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: group selected records into a batch and reconcile aggregate totals. Release-derived concept: a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states. Build with React 19, Vite, Tailwind CSS 4.3.2.
</summary>

<core_features>
Scenario Cards collection: Create, edit, archive, and filter scenario cards with explicit domain statuses. Create/edit/delete one record. Filter or reorder records by domain state (empty, draft, ready, changed, archived). Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Batch Reconciler surface: Group selected records into a batch and reconcile aggregate totals. Undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact as scenario-builder-v1-batch-reconciler.json. Clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
Visual hierarchy: The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
Domain copy: Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
</visual_design>

<motion>
Causal motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
State persistence: In-memory state ONLY. Do NOT use localStorage, sessionStorage, or IndexedDB. No external CDNs are allowed; all dependencies must be installed via npm locally.
Data schemas: BoardGameScenarioBuilderSession shape: { schemaVersion: "v1", exportedAt: "string", records: [], derived: {}, history: [] } and ScenarioCard shape: { id: "string", title: "string", description: "string", status: "empty or draft or ready or changed or archived", difficulty: "number" }.
Portability: Must include a useful downloadable end state (scenario-builder-v1-batch-reconciler.json) that matches the schema and can be imported back to restore state.
Alternate input: Alternate input produces identical state with visible focus and live feedback (keyboard and touch-equivalent).
Responsiveness: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on narrow viewports.
</requirements>

<webmcp_action_contract>
Action group: Manage scenarios
- list_scenarios: returns all scenarios
- create_scenario: creates a new scenario
- update_scenario: updates a scenario
- delete_scenario: deletes a scenario
- batch_reconcile: groups selected records into a batch and reconcile aggregate totals
- undo_last_mutation: undo the last mutation
- get_session_info: returns artifact schema
</webmcp_action_contract>
