<summary>
Build a Quilt Block Layout Studio Provenance Atlas application using React 19, Vite, Zustand, Tailwind CSS 4.3.2, and Framer Motion. This app requires a strict npm-local/no-CDN installation. The app manages quilt blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core feature is a canonical variant mutation where the user traces a selected record to source evidence and quarantines a bad lineage. The app produces the operator session artifact: a downloadable and copyable Session JSON document named quilt-layout-v1-provenance-atlas.json compiled live from the collection state. It features embedded workflows, real-time data, approval before edits, templates, and analytics into a self-contained frontend job.
</summary>

<core_features>
Feature: Quilt Blocks collection
Create, edit, archive, and filter quilt blocks with explicit domain statuses.
Interactions include create, edit, delete one record, and filter or reorder records by domain state.
Visible states are empty, draft, ready, changed, archived.
Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Invalid required fields preserve the prior valid record and explain recovery.
Mutates records array and status fields in the artifact.

Feature: Provenance Atlas surface
Use the provenance atlas interaction to derive a decision about the collection.
Interactions include trace a selected record to source evidence and quarantine a bad lineage, and undo the last mutation and inspect the linked representation.
Visible states are idle, selected, changed, conflict, resolved.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Updates provenance atlas geometry and selection, derived summaries, and event history.

Feature: Portable work artifact
Export and restore the actual session work in a fresh state.
Interactions include export the current artifact, clear, and import it with field-level validation.
Visible states are unsaved, exported, validated, replayed.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
Produces quilt-layout-v1-provenance-atlas.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<visual_design>
Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Writing: Copy names the domain consequence and recovery action precisely.
</visual_design>

<motion>
Causal motion: The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
Transitions: State transitions empty, draft, ready, changed, archived; idle, selected, changed, conflict, resolved use motion to clarify provenance.
</motion>

<requirements>
The implementation must use Tailwind CSS 4.3.2 and a strict npm-local/no-CDN installation rule.
The user traces a selected record to source evidence and quarantines a bad lineage, watches linked views react, then exports the completed artifact.
Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl or Cmd Z undoes it.
The provenance atlas surface, derived summary, and artifact query share one state.
Keep edits responsive on 100 plus records and avoid rebuilding unrelated surfaces.
The artifact preserves authored state and derived consequences for a clean round trip.
schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
Record IDs are unique and status values are explicit enums.
Required fields, numeric or date bounds, and cross-record references validate together.
Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.

<webmcp_action_contract>
The application must implement the standard WebMCP contract bindings via window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool to expose all specific state manipulation tools including create, update, delete, trace, quarantine, undo, export, and import.
</webmcp_action_contract>
</requirements>
