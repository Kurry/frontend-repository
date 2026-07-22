<summary>
Manage lesson blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence. Existing tools split lesson blocks editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts shipped patterns of embedded workflows, real-time data, approval before AI edits, templates, and analytics into a self-contained frontend job.
</summary>

<reference_screenshots>
None provided.
</reference_screenshots>

<core_features>
The user manages lesson blocks and explicitly changes their statuses through direct interaction.
The application presents a list of lesson blocks with states: empty, draft, ready, changed, and archived.
The user executes a provenance atlas interaction to trace a selected record to source evidence and quarantine a bad lineage.
A canonical mutation changes the primary record, linked views, and status simultaneously.
The user can undo the last mutation and inspect the linked representation.
The user exports the current state as an interoperable JSON artifact and imports it.
</core_features>

<user_flows>
The user creates a new lesson block and edits its details.
The user selects a lesson block and executes the provenance atlas interaction to trace it to source evidence and quarantine a bad lineage.
The user observes the derived summary view and the lesson block status update immediately.
The user undoes the last interaction and verifies the state reverts correctly.
The user clicks the export button to download the current session state as a JSON file.
The user clicks the clear button to reset the application state to empty.
The user uploads the previously exported JSON file to restore the exact state, including history and derivations.
</user_flows>

<edge_cases>
The application rejects invalid cross-field values without partial updates.
The application preserves the prior valid state when an invalid action is attempted.
The application rejects malformed schema imports or invalid record bounds without altering current state.
The application prevents horizontal clipping or overflow when rendering long field values.
</edge_cases>

<visual_design>
The visual hierarchy clearly indicates the current state and the next available action.
The application presents a distinctive, domain-specific workbench with clear state tokens.
The interface uses a primary desktop surface, a derived summary view, and a detail panel.
</visual_design>

<motion>
Motion visually connects the acted-on item to its new state during a mutation.
The interface supports a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<responsiveness>
The desktop surface transforms into a usable stack, drawer, or stepper layout at narrow viewports.
The interface prevents horizontal overflow on mobile devices.
The interface maintains functional touch targets for all interactive elements in narrow viewports.
</responsiveness>

<accessibility>
The user can perform the signature interaction using fully keyboard-accessible controls.
The user can perform the signature interaction using fully touch-equivalent controls.
The interface maintains visible focus management for interactive elements.
The interface uses semantic controls and provides live feedback updates.
</accessibility>

<performance>
The application remains responsive when interacting with a seeded collection of at least 100 records.
Unrelated rows or surfaces remain stable and do not visibly rebuild during the signature interaction.
</performance>

<writing>
The interface uses precise domain copy to name consequences and recovery actions.
Labels, statuses, errors, and empty-state texts are domain-specific and instructive.
</writing>

<innovation>
The linked representations provide clear domain utility beyond basic CRUD operations.
The provenance atlas interaction integrates tightly with the derived decision making process.
(Catch-all) One innovation requirement was not covered by specific visual evidence.
</innovation>

<requirements>
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
The state must be entirely in-memory with no localStorage or remote network calls.
The signature interaction must be "trace a selected record to source evidence and quarantine a bad lineage".
The interoperable artifact format must be lesson-arc-v1-provenance-atlas.json.
The exported artifact must have schemaVersion v1, RFC3339 exportedAt, records[], derived{}, and history[].
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The oracle application must be a working React application built with Vite and Tailwind CSS. All libraries must be npm-local (no CDNs).
- The oracle application must serve on port 3000 via npm start with zero console or page errors.
- The oracle application must implement the window.webmcp_session_info WebMCP contract.
- The oracle application must implement the full scope of features described in this document.
- The application must use Tailwind CSS 4.3.2.
</delivery>

<webmcp_action_contract>
- Tool `entity_update_record` has a `description` field.
- Tool `entity_update_record` has an `id` parameter.
- Tool `entity_update_record` has an `evidence` parameter.
</webmcp_action_contract>
