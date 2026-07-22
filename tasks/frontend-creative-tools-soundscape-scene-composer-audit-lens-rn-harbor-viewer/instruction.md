<summary>
Build a Soundscape Scene Composer and Audit Lens using React, Zustand, and Tailwind CSS 4.3.2 (npm-local/no-CDN). The app manages sound layers through a domain-native browser surface where one meaningful mutation (attach evidence to a selected record and resolve an audit discrepancy) updates linked views and an interoperable artifact. The app produces the operator's session artifact: a downloadable and copyable Session JSON document compiled live from the collection, audit lens state, and history, conforming to the API-shaped field contracts, with an Import function that round-trips that JSON.
</summary>

<core_features>
Feature Sound Layers collection: Create, edit, archive, and filter sound layers with explicit domain statuses (empty, draft, ready, changed, archived). Filter or reorder records by domain state. Invalid required fields preserve the prior valid record and explain recovery. Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Feature Audit Lens surface: Attach evidence to a selected record and resolve an audit discrepancy. Undo the last mutation and inspect the linked representation. Visible states are idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Feature Portable work artifact: Export the current artifact and view the JSON. Clear and import it with field-level validation. Valid states are unsaved, exported, validated, replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
The layout features a desktop primary surface (the Sound Layers collection) plus summary and inspector (the Audit Lens). On mobile, the secondary surfaces transform into drawers or stacked steps without horizontal overflow. The visual thesis is a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
Must use Tailwind CSS 4.3.2 and npm-local/no-CDN installation. In-memory only; no localStorage. The artifact must be named soundscape-scene-v1-audit-lens.json.
Session field contract (this object IS the would-be session upsert request body; all keys required):
schemaVersion: exactly soundscape-scene-v1
exportedAt: RFC3339 timestamp (regenerated on import)
records: array of Record objects. Each record has id (unique string), name (string), status (enum: empty, draft, ready, changed, archived), volume (number 0-100), auditLensState (object: evidence string, discrepancy string, resolved boolean).
derived: object containing summary (e.g. number of resolved records, total volume).
history: array of mutation events.
All WebMCP standard modules must be exposed (window.webmcp_session_info, window.webmcp_list_tools, window.webmcp_invoke_tool).
</requirements>

<webmcp_action_contract>
window.webmcp_session_info
window.webmcp_list_tools
window.webmcp_invoke_tool
</webmcp_action_contract>
