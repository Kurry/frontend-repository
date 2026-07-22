<summary>
Build a Drum Pattern Practice Board using React and Tailwind CSS 4.3.2. The app manages drum patterns through a domain-native browser surface where one meaningful mutation (connect a selected record to a handoff owner and update readiness) updates linked views and an interoperable artifact. The app produces the operator's session artifact: a downloadable and copyable Session JSON document compiled live from the board, tools, and saved records. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Drum Patterns collection
- Seed at least 100 records for testing large collections to verify responsive edits and state transitions
- Users can create, edit, archive, and delete drum pattern records with explicit domain statuses (empty, draft, ready, changed, archived)
- Users can filter and reorder records by domain state
- Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Mutates records array and status fields in drum-pattern-v1.json

Feature: Handoff Map surface
- Primary signature interaction: connect a selected record to a handoff owner and update readiness
- Visible states: idle, selected, changed, conflict, resolved
- Users can Undo the last mutation and inspect the linked representation
- A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Updates handoff-map geometry/selection, derived summaries, and event history

Feature: Portable work artifact
- Users can export the current session artifact as a JSON file (drum-pattern-v1-handoff-map.json)
- Users can clear the board and import a session artifact with field-level validation
- Visible states: unsaved, exported, validated, replayed
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
- Produces drum-pattern-v1.json with schemaVersion (v1 enum), exportedAt (RFC3339), records array, derived state, and history.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Desktop layout features a primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps to avoid horizontal overflow.
- Copy names the domain consequence and recovery action precisely (e.g. labels, statuses, errors, empty-state text).
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Tailwind CSS 4.3.2 must be used.
- All assets must be loaded locally without CDNs.
- The state must be entirely in-memory. Never use localStorage or remote network calls.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Keyboard parity, focus management, live updates, contrast, and reduced-motion support are required.
- The UI must remain responsive with 100+ records and avoid rebuilding unrelated surfaces.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
1. solution/app with npm start serving on port 3000
2. The WebMCP contract implemented and exposed on window
3. Evidence video (evidence.webm) in environment/reference-screenshots
</delivery>

<webmcp_action_contract>
window.webmcp_session_info = { project: "drum-pattern-practice-board-handoff-map", version: "1.0.0" };
window.webmcp_list_tools = () => [
  { name: "query_state", description: "Query the current application state.", inputSchema: { type: "object", properties: {} } },
  { name: "import_session", description: "Import a session artifact directly to state.", inputSchema: { type: "object", properties: { records: { type: "array", description: "Drum pattern records array" } }, required: ["records"] } }
];
window.webmcp_invoke_tool = (name, args) => { /* Implementation */ };
</webmcp_action_contract>
