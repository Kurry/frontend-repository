<summary>
Manage costume looks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence. Existing tools split costume looks editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Slack's shipped pattern of embedded workflows, real-time data, approval before AI edits, templates, and analytics into a self-contained frontend job. This application uses Tailwind CSS 4.3.2.
</summary>

<core_features>
Costume Looks collection: Create, edit, archive, and filter costume looks with explicit domain statuses. Includes draft, ready, changed, and archived states.
Provenance Atlas surface: Use the provenance atlas interaction to derive a decision about the collection. Trace a selected record to source evidence and quarantine a bad lineage. Undo the last mutation and inspect the linked representation. Includes idle, selected, changed, conflict, and resolved states.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear and import it with field-level validation.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Desktop primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps. Visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
The application must be a fully functional implementation in a single page without relying on external backends or localStorage for persistence.
The application must implement the CharacterCostumeContinuityBoardSession schema version v1 and export it as costume-continuity-v1-provenance-atlas.json.
The application must expose a WebMCP contract implementing the standard modules for interacting with the application state.
The application must include e2e tests using Playwright covering all defined deterministic criteria.
The artifact export/import must perform strict validation and reject invalid records without partial mutation.
The signature interaction (trace a selected record to source evidence and quarantine a bad lineage) must be usable via keyboard and touch-equivalent controls.
All dependencies must be installed locally via npm; no external CDNs may be used. Tailwind CSS 4.3.2 must be used.
</requirements>

<webmcp_action_contract>
The WebMCP contract includes listing tools and invoking tool changes for the schema and mutations.
</webmcp_action_contract>
