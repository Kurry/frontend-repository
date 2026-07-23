# Makerspace Operation Scheduler

<summary>
Archetype: planning and Kanban / workflow
Genre: hard browser app/resource-constrained operation planner

The user decomposes projects into operations, links material lots and qualification evidence, assigns operators and machines, sequences reservations, groups compatible setups, responds to delays and machine outages, checks work in/out, recovers partial runs, closes projects, and exports an interoperable operations packet.

This is not a booking calendar. The signature interaction is dragging an operation across a machine-time lane while predecessor paths, operator qualification, material allocation, setup/changeover blocks, queue promises, risk, partial-run state, and artifacts update together.

Target user: A fictional community workshop coordinator sequencing projects through shared equipment
</summary>

<core_features>
- Build graph, assign machine/operator/material, batch setups, run/pause/recover, outage-branch/merge, approve, and export — times, quantities, events, and files agree.
- Create, split, join, and reorder operations with finish-start, start-start, or batch-compatible edges.
- Each operation stores duration, setup family, eligible machines, operator role, material requirements, and output quantity.
- Cycles and impossible joins remain preview-only.
- Machine and operator scheduling matrix: rows are machine lanes with operator overlays; drag/resize or use keyboard/mobile time controls.
- An assignment is valid only when machine, qualified operator, material, predecessors, maintenance, and setup windows agree.
- Conflict lenses explain every contributing constraint.
- Setup-family batching: group adjacent compatible operations to share setup time. Reordering can save setup minutes but cannot silently break due promises or dependencies.
- Compare current and candidate schedules by completion, changeover, idle, risk, and material readiness.
- Qualification and material evidence: select an operation to trace operator qualification records and material lots.
- Lot allocation uses exact units and reservations; scraps/returns are append-only events.
- Missing, expired-at-fixture-time, duplicate, and insufficient evidence are distinct states.
- Check-in, partial run, and recovery: advance a logical clock, check an operation in, record actual output/consumption, pause at a deterministic partial run.
- Resume, reassign, split remainder, scrap, or rollback unconsumed allocations.
- Events are idempotent and actual history is never rewritten by replanning.
- Outage and queue repair branches: trigger the fixture outage, branch repair options, shift eligible operations, preserve locked/in-progress work, compare lateness/setup/material effects, and merge per operation.
- Approving a repair freezes its basis; subsequent fixture changes mark it stale.
- Desktop links graph, scheduling lanes, qualifications/lots, compare, and run log.
</core_features>

<visual_design>
- Inspect eligible/ineligible, planned/locked/running/partial, allocated/short, setup/maintenance/outage, branch/stale states — distinctions remain legible.
- UI uses clear status colors and iconography to distinguish the multiple distinct operation states and constraints (qualification expired vs missing, etc.).
</visual_design>

<motion>
- Move/resize, batch/unbatch, allocate, check in/pause/recover, outage/repair/merge, then repeat reduced — causal endpoints and totals agree.
- Dependency paths and setup blocks reroute from changes; outage repair and partial-run recovery animate provenance.
- Reduced motion preserves endpoints but skips animations.
</motion>

<requirements>
- Tailwind CSS 4.3.2 must be used for styling.
- All npm dependencies must be installed locally. Do not use CDNs or external script tags.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- The fictional workshop has 18 projects, 63 operations, 12 machines, 16 operators, 11 qualification records, 27 material lots, four setup families, two maintenance windows, one outage, three partial runs, and a 14-day logical clock. Qualifications are synthetic capabilities, not real safety guidance.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization.
- No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits.
- Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
- Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work.
- workshop-plan.json: schema/version, fixture hash, logical clock, projects, operations, edges, assignments, qualifications, lots, branches, events, approvals, and lineage.
- machine-schedule.csv: one row per setup/operation/maintenance block with exact times, ids, operator, setup, material, and state.
- reservations.ics: accepted machine/operator blocks with stable UID and UTC timestamps.
- operation-map.svg: selected project DAG and scheduled lane geometry with accessible labels.
- run-packet.md: ordered operations, evidence, allocations, conflicts, recovery decisions, and revision hashes.
- Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values.
- A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence.
- Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules.
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
- Depth-first execution is mandatory for feature groups: Project operation graph, Machine and operator scheduling matrix, Setup-family batching, Qualification and material evidence, Check-in, partial run, and recovery, Outage and queue repair branches, Responsive board and artifacts.
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
- Entity: operation
- Entity operations: select; update; toggle; reorder
- Entity fields: project; machine; operator; material; setup_family; status; duration
- Editor object types: assignment; repair_branch
- Editor properties: start_time; end_time; risk; lateness
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor modes: planning; repair; comparison
- Session operations: start; pause; resume; advance
- Demos: check_in; partial_run; machine_outage
- Artifact operations: export; import
- Export formats: json; csv; ics; svg; md

Mechanics exclusions:
- Dragging operations in the scheduling matrix is a gesture graded via Playwright
- Graph geometry updates (nodes, edges) are visual results of data operations

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
