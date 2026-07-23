# Conference Program Constraint Composer

<summary>
Build a multi-room agenda scheduler for a fictional program chair scheduling sessions, speakers, rooms, attendee cohorts, and resources for a two-day conference.
The user places sessions on a room/time grid, assigns speakers and AV resources, preserves dependencies and accessibility, models attendee-interest cohorts and walking flows, creates track continuity, schedules breaks, resolves conflicts, branches program alternatives, rehearses a cancellation/room failure, approves a schedule, and exports exact calendars, maps, and run ledgers.
This is not an event CRUD calendar. The signature interaction is dragging/resizing a session block while speaker/room/resource conflicts, cohort demand, capacity overflow, walking buffers, track graph, break coverage, run tasks, and artifacts update together.

Deterministic fixture: The fictional two-day Common Ground conference has 36 sessions, 28 speakers, eight rooms across two floors, 10 attendee-interest cohorts with fixed sizes/preferences, six AV resources, room capacities/accessibility, directed walking graph, three track prerequisites, and deterministic speaker cancellation/room-closure events. A valid program exists.
</summary>

<core_features>
- Room/time schedule grid: Session blocks drag/resize on five-minute slots within conference hours and room lanes. Types define setup/cleanup, duration bounds, capacity model, and break eligibility. Keyboard move/resize/room assignment and mobile date/time/room sheets equal pointer gestures. Invalid commits remain preview-only with exact blockers.
- Speaker and resource binding: Sessions bind one or more speakers plus required microphone/projector/streaming/interpreter fixtures. Speaker availability, setup/cleanup, simultaneous assignment, room capability, and resource travel are exact. Changing a requirement previews affected sessions and tasks; shared resources cannot be double-booked.
- Session dependency and track graph: Edges represent prerequisite, recommended-before, same-track, continuation, or cannot-overlap. Hard graph cycles reject. Track lanes show continuity and intentional gaps. Selecting an edge highlights schedule blocks, affected cohorts, walking route, and exported calendar links.
- Cohort interest and capacity flow: Each cohort ranks session tags and deterministically chooses among simultaneous options under declared tie-breaking. Expected attendance and overflow derive from cohort assignment and room capacity. Users may split a cohort only where fixture allows. Moving a block propagates cohort choices, unserved interest, room load, and inter-session walking feasibility.
- Walking and accessibility buffers: The building graph contains stairs, elevator, distance, one-way, and closure edges. Cohort/speaker transfer time uses exact accessible shortest paths and minimum buffers. Back-to-back sessions that cannot be reached flag exact route/time deficit. A map lens selects the relevant schedule pair without changing it.
- Break, meal, and recovery constraints: The program requires bounded continuous-session time, meal window, two universal breaks, room reset, and speaker rest. Break cells contribute no session coverage but alter walking and resource repositioning. Exceptions require a typed reason and remain visible in approval.
- Disruption rehearsal and branch repair: Logical-clock rehearsal injects a speaker cancellation and room closure after 5 sessions are complete. Users replace speaker from fixture pool, swap rooms, move/shorten eligible future sessions, convert to panel only where schema permits, cancel with dependency repair, or fork a recovery branch. Completed sessions and historical attendance remain immutable.
- Responsive program and artifacts: Desktop shows schedule grid, dependency/track graph, cohort/capacity bands, and map/resource/run rail. Mobile becomes day/room session cards, date/resource sheets, vertical dependency/walking lineage, cohort/overflow drilldowns, and rehearsal stepper. Export produces canonical JSON, ICS per audience/speaker/room, CSV session/resource/cohort/task ledger, SVG program and walking maps, and Markdown run sheet; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect selected/preview/conflict/capacity/overflow/path deficit/track/break/completed/cancelled/repaired/approved states → hierarchy stays legible.
</visual_design>

<motion>
- Causal motion: Session travel/resize, cohort flow/capacity, graph/path reroute, resource reposition, and disruption repair explain cause.
- Reduced motion retains before/after blocks/counts/routes with immediate causal parity without animations.
</motion>

<requirements>
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 with design tokens. All libraries installed via npm and bundled locally; no CDN imports.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
- Depth-first completion protocol (mandatory): For every subsystem in this proposal, complete it only when there are no unimplemented implication states. Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions. Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions. Explore each dependency recursively, then explore how each loops back through shared state and event timelines. Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions. Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior. If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.
- Completion gates (hard): No TODO markers in user-facing behavior. Every feature branch has an explicit observable evidence path. Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated. Zero partial mutation on validation/import failure. Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
- Artifact contract: ConferenceProgram uses schemaVersion: conference-program/v1 and stores fixture/hash/timezone/logical clock, rooms/building graph/capabilities, sessions/types/tags/requirements, speakers/availability, resources, schedule branch DAG/placements/merge choices, dependency/track graph, cohorts/preferences/assignments/capacity, walking paths/buffers, breaks/exceptions, rehearsal runs/events/completed sessions/repairs, tasks/reviews/approval/annotations/view state/history, derived conflict/flow/capacity/path/coverage/artifact checksums, ICS set, CSV, SVGs, Markdown, and UTC exportedAt. Times align to five-minute slots with explicit zone/offset; duration/setup/cleanup and conference bounds exact. Speaker/resource/room assignments satisfy availability/capability/nonoverlap/travel; dependency graph obeys typed cycle/order rules. Cohort choice uses declared preference/tie-breaking and integer sizes; room attendance/capacity/overflow and unserved interest derive exactly. Walking paths use valid directed accessible edges and exact speed/buffer; closures apply at declared logical times. Rehearsal events are append-only and completed sessions/attendance immutable across repair branches. ICS UIDs/times/attendees/locations, CSV rows/counts/tasks, SVG blocks/routes, and Markdown order agree with approved canonical branch. Import rejects fixture/timezone mismatch, schedule/resource/dependency/capacity/path violation, invalid cohort split, impossible disruption/repair event, branch cycle, forged derived/approval/checksum, unsafe SVG, or artifact disagreement atomically. Canonical re-export changes only exportedAt; ICS, CSV, SVG, and Markdown remain byte-identical.
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
- entity-collection-v1
- structured-editor-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
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

Bindings:
- Entity: session
- Entity operations: create; select; update; delete
- Entity fields: title; speaker; room; duration; start_time; resources; prerequisites
- Editor object types: schedule_block; cohort_flow; walking_path
- Editor properties: x; y; width; height; capacity; buffer_time
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor modes: grid; graph; map; rehearsal
- Session operations: start; pause; resume
- Demos: cancellation-rehearsal
- Artifact operations: import; export
- Export formats: conference-json; schedule-ics; roster-csv; map-svg
- Value bounds: time slots in 5min increments; resource unique assignment; cohort sizes positive integers
- Workflow completion: schedule-updated
- Workflow completion: conflicts-highlighted
- Workflow completion: capacity-derived
- Workflow completion: artifact-ready

Mechanics exclusions:
- Session drag-and-drop, path routing, and reduced motion retain Playwright-driven graded mechanics

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
