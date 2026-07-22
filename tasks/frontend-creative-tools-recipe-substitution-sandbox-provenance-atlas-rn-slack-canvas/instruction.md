# Recipe Substitution Sandbox — Provenance Atlas — Slack Canvas

<summary>
Manage recipe ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Trace a selected record to source evidence and quarantine a bad lineage using a collaborative canvas with embedded state transitions, approval gates, and usage evidence. The environment is Tailwind CSS 4.3.2 installed via npm-local/no-CDN.
</summary>

<core_features>
Create, edit, archive, and filter recipe ingredients with explicit domain statuses (empty, draft, ready, changed, archived).
The Provenance Atlas interaction derives a decision about the collection by tracing a selected record to source evidence and quarantining a bad lineage.
Includes embedded workflows, real-time data, and approval gates before edits (Slack Canvas lineage).
Export and restore the session work to an interoperable artifact in a fresh state without persistence (no localStorage).
Undo the last mutation and inspect the linked representation.
Manage large collections (100+ records) efficiently.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The desktop primary surface pairs with a summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps without horizontal clipping.
The visual hierarchy makes the current state and next action explicitly clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Includes a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
The solution must be built exclusively using Tailwind CSS 4.3.2 via local npm installation without CDN links.
The solution is completely frontend-native with in-memory persistence only; do not use localStorage or backend synchronization.
The domain contract uses a strict artifact schema (recipe-substitution-v1.json) containing schemaVersion, exportedAt, records, derived, and history.
Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Invalid required fields preserve the prior valid record and explain recovery.
A conflicting or incomplete mutation in the Provenance Atlas is rejected without partial updates.
Importing a malformed schema, duplicate IDs, unknown references, or invalid bounds makes no state change.
A valid import restores authored structure and regenerates exportedAt.
</requirements>
<webmcp_action_contract>
Action contract matching standard webmcp patterns.
</webmcp_action_contract>
