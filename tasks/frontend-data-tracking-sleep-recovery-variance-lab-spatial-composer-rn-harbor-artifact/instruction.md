<summary>
A sleep recovery variance lab to track, curate, and make decisions on sleep sessions. Features a spatial composer allowing you to drag or map sleep records onto a 2D recovery capacity chart, updating summary data. Contains standard list views, filtering, and a robust offline/in-memory data artifact model that imports/exports a deterministic JSON file for analysis, avoiding remote endpoints.
</summary>

<core_features>
- Sleep Sessions Collection: You can view, create, edit, archive, and delete sleep session records. Fields: ID, name, score, duration, status (draft, ready, changed, archived).
- The Spatial Composer: A unique canvas showing a 2-axis layout for records (e.g. recovery vs sleep quality). The main interaction is "place a selected record in a spatial composer and rebalance capacity", setting spatial X/Y coordinates and adjusting global "capacity rebalance" derived totals dynamically.
- Interactive Filter & Map: List can be filtered by domain state. Clicking a list item shows it in the detail view. The detail view supports applying it to the spatial composer.
- History & Undo: Global undo restores previous state completely.
</core_features>

<user_flows>
- The user can select a sleep session record, place it in the spatial composer to adjust recovery vs sleep quality metrics. Doing so updates the summary capacity values globally.
- The user can undo mutations.
- The user can export a full backup as sleep-recovery-v1-spatial-composer.json containing the precise records and spatial state.
- The user can clear data and then import a valid JSON backup, cleanly restoring the session and visually recovering the composer state.
</user_flows>

<edge_cases>
- Submitting the composer coordinates out-of-bounds displays an error and leaves state unchanged.
- Trying to load an invalid or conflicting JSON file rejects the upload, displaying a summary error instead of silently swallowing or partially applying the state.
</edge_cases>

<visual_design>
- Minimalist, dark-themed Artifact Provenance aesthetic. Focus on raw data and explicit actions.
- The Spatial Composer must visually reflect its data with contrasting indicators.
- Reduced noise—actions are prominent, with distinct active states for composer selection.
</visual_design>

<motion>
- Records placed into the spatial composer should transition smoothly to their new location (causal motion).
- Support prefers-reduced-motion to bypass animations while retaining interaction fidelity.
</motion>

<responsiveness>
- The UI must adapt to mobile. The spatial composer might stack above or collapse list items into a drawer or tabbed interface instead of a side-by-side layout.
</responsiveness>

<accessibility>
- Spatial composer and other main controls must be accessible via keyboard (e.g., arrow keys for movement).
- Actions announce to screen readers.
- Focus is cleanly managed within dialogs/modals.
</accessibility>

<performance>
- The system must remain snappy even if seeded with 100+ simulated records, reacting under 100ms.
</performance>

<writing>
- Domain vocabulary: "Sleep Session", "Draft", "Ready", "Archived", "Spatial Composer", "Recovery Capacity", "Artifact Provenance".
- Direct and objective tone for error messages.
</writing>

<innovation>
- A localized artifact provenance workflow that brings "infrastructure as code" strictness to sleep recovery—all session data and composer placement metrics round-trip purely in a schema-validated local JSON file, bringing offline utility to user tracking.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- In-memory state only (no localStorage).
- A schema version check schemaVersion: "v1" is required on JSON imports.
</requirements>

<integrity>
- Everything must be functionally complete as specified. No missing buttons or placeholders.
</integrity>

<delivery>
- Must be a fully working app served by npm start.
- Must pass tests with correct output.
</delivery>

<webmcp_action_contract>
- Implement window.webmcp_session_info, window.webmcp_list_tools, window.webmcp_invoke_tool.
- Support tools: entity_create_record, entity_update_record, entity_delete_record, artifact_export_session_json, artifact_import_session_json, artifact_query_session_json, editor_select.
</webmcp_action_contract>
