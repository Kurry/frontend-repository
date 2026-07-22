<summary>
Build a Museum Visit Route Composer using a modern frontend framework (React, Vue, Svelte, or Solid), Tailwind CSS 4.3.2, and a client-side state store. The application allows a fictional four-person group to compose an accessible, timed route through the Northlight Museum. Users drag exhibits into a route order on a floor map and timeline, allocate dwell time, honor timed-entry/accessibility/closure constraints, balance group interests, create bounded split-and-rejoin branches, rehearse delays, repair missed windows, and export a synchronized visit plan with maps and calendars. The app is completely in-memory (no backend or local storage).
</summary>

<core_features>
Feature: Exhibit selection and interest matrix —
- Visitors score fixture interest tags. Exhibits have required/optional status, dwell range, floor, capacity window, and prerequisites.
- Dragging an exhibit into must/optional/skip updates per-person and group coverage.
- A matrix and rings select exact visitors/exhibits.
- Required exhibits cannot be skipped without a typed exception.

Feature: Floor route canvas —
- Users click/drag exhibits into an ordered route and may insert entrance, rest, café, and exit stops.
- The app computes deterministic shortest accessible path over allowed edges between stops.
- Selecting a segment highlights edges, distance, travel time, accessibility, and closures.
- Keyboard reorder/source-target insertion and mobile stop sheets equal map gestures.

Feature: Dwell and timed-entry timeline —
- Stops occupy travel plus dwell intervals. Dwell bars resize within exhibit bounds.
- Arrival must satisfy timed-entry windows, opening/closure, visit start/end, and prerequisite order.
- Moving/resizing one stop previews downstream times and missed windows before commit.
- Waiting time is explicit and may be assigned to rest/café only where feasible.

Feature: Group split and rejoin gates —
- The route may split into at most two subgroups for a bounded interval.
- Users assign visitors and branch stops, then place a rejoin node/time.
- A minor/protected-pair fixture rule, individual accessibility, timed windows, and group membership apply per branch.
- Rejoin requires both branches to reach the same node within a five-minute tolerance or adds explicit waiting.

Feature: Preference and fatigue bands —
- Linked charts show interest coverage, walking distance, stairs/elevator use, continuous activity, rest cadence, and time distribution per visitor.
- Fatigue is a deterministic fixture score, not health advice.
- Selecting a high band highlights exact route segments/stops; analysis never auto-edits the plan.

Feature: Reservation and checkpoint workflow —
- Timed entries are simulated reservations with held, confirmed, expired, released, or used state under logical clock controls.
- Plan edits can stale a reservation.
- The visit workflow checks entrance -> reservations -> route stops -> split/rejoin -> exit.
- Pause/resume and checkpoint evidence preserve attempt lineage.

Feature: Delay rehearsal and repair —
- Fixture events include elevator closure and 12-minute exhibit delay after the third stop.
- Rehearsal advances a logical clock and route cursor, then exposes impacted paths/windows/rejoin.
- Users reroute, shorten dwell within bounds, skip optional stop, swap branch stop, move reservation if fixture allows, or fork a repair plan while preserving completed stops.

Feature: Responsive planner and artifacts (Export/Import) —
- Desktop shows floor map, ordered route/timeline, interest/fatigue rail, and reservation/rehearsal state.
- Mobile becomes floor mini-map, stop cards, reorder/dwell sheets, vertical split/rejoin lineage, visitor metrics, and checkpoint stepper.
- Export produces canonical JSON, SVG floor-route maps, ICS route/reservations, and CSV stop/visitor itinerary; import reconstructs state exactly.
- Canonical re-export changes only exportedAt; SVG, ICS, and CSV remain byte-identical.
</core_features>

<visual_design>
- Inspect selected/required/optional, route/closure/access, early/on-time/late, group/split/rejoin/wait, held/stale/used, completed/repair states -> hierarchy stays legible.
- Linked views share one reducer.
</visual_design>

<motion>
- Reorder/redraw, resize/propagate time, split/rejoin, stale reservation, reroute delay explain cause; reduced motion retains changed-edge/time deltas.
</motion>

<requirements>
- App runs completely offline using local npm packages without external CDNs.
- Complete deterministic fixture for Northlight Museum (three floors, 38 path nodes, 52 directed edges with distance/stairs/elevator/closure attributes, 20 exhibits, four timed-entry windows, two rest areas, one café, four visitors with interests/mobility needs, a 210-minute visit budget, and deterministic crowd/delay events).
- MuseumVisitPlan uses schemaVersion: "museum-visit-plan/v1" and stores fixture/hash/timezone/logical clock, path graph/exhibit/window fixtures, visitors/interests/needs, plan branch DAG/active/approved head, selected exhibits/exceptions, ordered group/branch stops/dwell, computed path edges/times, split/rejoin assignments/waits, reservations/events, rehearsal attempts/completed stops/delay repairs, annotations/view state/history, derived accessibility/coverage/distance/fatigue/timing/artifact checksums, SVGs, ICS, CSV, and UTC exportedAt.
- Path segments reference valid directed edges and use exact distance/speed/stair/elevator/closure rules per visitor/subgroup.
- Stop order, travel/dwell/wait intervals, prerequisites, timed windows, visit bounds, and completed-stop immutability are exact.
- Split has two nonempty disjoint visitor sets covering the group; protected rules hold; rejoin node/time/wait tolerance is exact.
- Reservation state transitions follow the logical clock and bind exact exhibit/window/visitors/plan checksum.
- Plan branch graph is acyclic; repair after rehearsal preserves completed canonical stops and attempts.
- SVG paths/nodes, ICS UID/times/groups, and CSV stop/person rows agree with approved canonical plan.
- Import rejects fixture/timezone mismatch, invalid/disconnected/inaccessible path, time/window/prerequisite error, invalid split/rejoin, impossible reservation/rehearsal event, forged derived/checksum, unsafe SVG, or artifact disagreement atomically.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1
- command-session-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

Bindings:
- Editor object types: stop; branch; exhibit
- Editor properties: dwell_time; subgroup
- Editor modes: route; rehearsal
- Editor operations: select; update_property; switch_mode
- Entity: reservation
- Entity operations: select; update; create; delete
- Entity fields: state; exhibit_id; time_window
- Artifact operations: import; export
- Export formats: session-json; svg; ics; csv
- Import modes: session-json

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
