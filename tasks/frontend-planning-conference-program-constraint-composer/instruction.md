<summary>
Build a multi-room Conference Program Constraint Composer using React 19, Zustand, Tailwind CSS 4.3.2, and dnd-kit. The app is a deterministic interval and multi-resource scheduler targeting a two-day "Common Ground" conference. The operator uses drag-and-drop on a room/time grid to schedule 36 sessions, 28 speakers, 8 rooms, 10 attendee-interest cohorts, and 6 AV resources, resolving overlap conflicts and path deficits while satisfying prerequisite chains. It yields downloadable JSON, ICS, CSV, SVG, and Markdown artifacts without relying on server persistence (in-memory state only).
</summary>

<core_features>
Room/time schedule grid: A desktop-first multi-room time grid divided into 5-minute intervals spanning 08:00 to 18:00 over two days. Each room is a lane. Drag and resize session blocks across lanes and times.
Session definitions: 36 pre-defined sessions (via fixture) each with a title, required capacity, and base duration bounds.
Resource bindings: Each session binds one or more of 28 speakers, plus a required combination of 6 AV resources (e.g. microphones, projectors). Multi-booking the same speaker or resource simultaneously triggers a visible conflict.
Track graph and dependencies: Prerequisite chains between sessions (e.g. Session A must happen before Session B). Graph cycles or violations show exact track deficits.
Cohort flow and capacity: 10 attendee-interest cohorts flow into scheduled sessions. Expected attendance derives from cohort assignment vs room capacity. Overflow logic computes unserved interest.
Accessible walking buffers: Directed building graph logic (stairs, distances). Transfer time between consecutive sessions must clear exact minimum accessible paths.
Disruption rehearsal: A mode to inject a synthetic speaker cancellation and room closure during the event, branching the schedule for a repair scenario.
Break placement: Universal break blocks that pause all track requirements but consume time.
Export and Artifacts: Export the final schedule.
JSON format conforming to exact schema.
ICS exports per speaker/room.
CSV ledger of all assignments.
SVG map representing the schedule blocks.
Markdown run sheet.
</core_features>

<visual_design>
Data-dense, analytical desktop-first layout with high contrast for schedule grid and sidebars.
Schedule grid features visual indicators for conflicts (red highlights or hatched patterns).
Linked view indicators when selecting a session (highlights related graph dependencies, cohort flows).
</visual_design>

<motion>
Drag and drop (via dnd-kit) shows the session block visually snapping to the 5-minute grid lanes.
Fluid adjustments when resizing sessions.
Propagated errors (e.g., path deficit, resource overlaps) animate in gracefully.
Rehearsal branching visually branches or swaps UI states.
Respects prefers-reduced-motion.
</motion>

<requirements>
Strictly use React 19, Zustand, Tailwind CSS 4.3.2, dnd-kit, lucide-react, date-fns. No other state/UI libraries.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
The app operates purely in memory. No localStorage. A page refresh resets to initial fixtures.
All session, speaker, room, resource, and cohort data must be hardcoded deterministic fixtures initialized in the Zustand store on load.
Artifact Export Contract:
JSON must match schemaVersion conference-program/v1 with keys: timezone, rooms, sessions, speakers, resources, cohorts, breaks, placements, rehearsal, branchDAG.
JSON must import reliably to reconstruct exact state (round-trippable).
WebMCP Integration: Implement window.webmcp_session_info, window.webmcp_list_tools, window.webmcp_invoke_tool binding to entity-collection-v1 (sessions, rooms, cohorts), structured-editor-v1 (placements, blocks), and artifact-transfer-v1 (export JSON).
The repo structure is solution/app/package.json. npm run build exits 0. npm start serves on port 3000.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

Bindings:
- Editor object types: session-block
- Editor operations: select; update_property; preview
- Entity: session; room; speaker; cohort
- Entity operations: select; update
- Entity fields: name; time; room
- Artifact operations: export; import; copy
- Export formats: session-json; ics; csv; svg; markdown
- Import modes: session-json
</webmcp_action_contract>
