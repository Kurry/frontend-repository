<summary>
Build Cognitive Load Day Sculptor, a hard browser app/time-blocking tool for knowledge workers arranging one demanding day around a deterministic personal energy curve. The application uses a 15-minute day timeline (08:00-20:00), dragging tasks onto it, splitting blocks, managing dependencies, monitoring cognitive capacity over time, and tracking interruptions. The final artifact is a reproducible day plan exported as Session JSON and valid iCalendar (ICS). All state is in-memory only (no localStorage).
</summary>

<core_features>
Feature: Priority matrix backlog
- Tasks begin in a 2x2 urgency/importance matrix backlog. Dragging a task between quadrants mutates its urgency/importance booleans and priority score.
- Keyboard/mobile quadrant pickers are equivalent to dragging.
- Hierarchical tasks expand/collapse; a parent's progress is derived from child scheduled/completed duration. Parents cannot be scheduled directly while they have unscheduled leaf children.
Feature: Capacity time-block canvas
- The day timeline runs 08:00-20:00 in 15-minute slots (48 slots).
- It overlays a fixed capacity curve (0-10 per slot).
- Dragging a task onto the timeline creates a block. Resizing changes planned duration in 15-minute steps.
- Non-splittable tasks require one exact-duration block. Splittable tasks can have up to 3 chunks, each at least its minimum chunk size.
- Blocks cannot overlap fixed appointments or each other. A preview shows displacement and overload before committing a drop/resize.
Feature: Interval load model
- Demand per slot = active task's load + a deterministic context-switch cost (added when adjacent blocks have different categories).
- Demand exceeding capacity is painted as an overload region and adds overload points.
- Breaks (3 fixed windows) restore 1 capacity point for the next 2 slots, only if the break is at least 15 minutes and uninterrupted.
- Math is visible in a slot inspector and an energy/load comparison chart.
Feature: Dependency and deadline propagation
- Dependent tasks must start after all prerequisite completions.
- Moving an upstream block pushes downstream unlocked blocks by the same delta if propagation mode is ON. If OFF, it creates locked conflicts.
- Crossing a deadline displays the exact missed duration.
- A dependency graph and timeline share selection, highlighting the critical chain.
Feature: Interruption and recovery log
- Pausing an active focus block early opens an interruption sheet requiring category (internal|external|urgent), lost minutes, and recovery choice (resume|reschedule|rollover|drop).
- This decision updates the block duration, downstream feasibility, daily velocity, and an immutable event ledger.
- Resuming a block increments its interruption count and preserves task lineage.
Feature: Live focus and velocity views
- Focus mode hides planning chrome, showing current task, time bar, capacity/load, next break, dependency note, and controls.
- A deterministic timer advances based on explicit clock controls (not system time).
- Velocity compares completed weighted task points to a fixture target, updating a burndown/rollover forecast.
Feature: Morning rollover and scenario comparison
- A rollover drawer lists unfinished fixture tasks from the prior day, allowing defer|drop|escalate in bulk, updating the backlog.
- Two day-plan checkpoints can be created and compared (showing block changes, overload, switch cost, deadline risk, velocity).
- Global Undo/Redo restores semantic and view state.
Feature: Session export and import
- Export provides JSON (the day plan with history, checkpoints, focus state, derived checksums) and valid ICS events (for task blocks, appointments, breaks).
- Import strictly validates state, rejecting invalid overlaps, durations, or corrupted states, reconstructing exact UI.
</core_features>

<user_flows>
- Rollover flow: open rollover drawer, escalate one task to the backlog -> appears in matrix.
- Planning flow: move task to Urgent/Important -> drag onto timeline at 09:00 -> see capacity adjust.
- Conflict flow: drag dependent task before its prerequisite -> blocked (or pushes prerequisite if propagation ON).
- Split flow: drag a splittable task onto a break boundary -> split into two chunks.
- Focus flow: enter focus mode -> start timer -> pause -> log internal interruption with "reschedule" -> downstream tasks shift.
- Export flow: create a checkpoint -> export -> produces valid JSON and ICS with 15-minute aligned DTSTART/DTEND.
</user_flows>

<edge_cases>
- Try overlapping a block with a fixed appointment -> preview rejects placement.
- Try resizing a splittable chunk below its minimum size -> rejected.
- Try a fourth chunk for a splittable task -> rejected.
- Dependency/deadline boundary: locked propagation prevents moving an upstream task if it pushes a downstream locked task past 20:00.
- Malformed import: throws inline error, state remains untouched.
</edge_cases>

<visual_design>
- Desktop shows matrix/backlog, timeline/curve, graph, and analytics.
- Tablet stacks graph/analytics.
- Mobile transforms into priority cards, horizontal time ruler, block editor sheet, capacity strip, dependency chain, and focus/interrupt flow. Target sizes minimum 44px.
- Legible overload regions, distinct states for locked, dependent, and interrupted blocks.
</visual_design>

<motion>
- Causal motion: Block placement/propagation, overload fill, and interruption reschedule clearly animate consequences.
- Reduced motion uses instant endpoints plus persistent deltas.
</motion>

<responsiveness>
- Complete at 1440/768/375 → mobile priority/time/focus flow retains every action, 44-pixel targets, and no page overflow.
</responsiveness>

<accessibility>
- Prioritize, place/resize blocks, navigate slots/graph, interrupt/recover, rollover, focus/complete, compare, and export without pointer → focus/state match.
</accessibility>

<performance>
- Drag blocks across 48 slots with 15 tasks/dependencies and run timer → responsive updates, stale propagation/timers cancelled, no old load flash.
</performance>

<writing>
- Trigger conflicts → copy names exact task/block/slot/dependency/deadline/capacity rule and concrete recovery.
</writing>

<innovation>
- Move one prerequisite → timeline, load curve, downstream blocks, graph, deadlines, velocity, comparison, history, and artifact coordinate.
</innovation>

<requirements>
- State: In-memory reducer state only (no localStorage). Reload resets to seeded fixture.
- Fixture data: 15 tasks (with duration, load 1-10, urgency, importance, deadline, splittable, min chunk, 6 dependency edges), 2 fixed appointments, 3 break windows, capacity curve over 48 slots. Feasible non-overload plan exists.
- Stack: React, Tailwind CSS 4.3.2 (pinned), lucide-react, framer-motion (or motion), zod.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
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

Bindings:
- Editor object types: time-block
- Editor properties: start; duration; locked
- Editor modes: planning; focus; compare
- Editor operations: select; update_property; switch_mode; preview
- Entity: task
- Entity operations: select; update; toggle
- Entity fields: urgency; importance; priority
- Artifact operations: export; import
- Export formats: session-json; ics
- Import modes: session-json

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
