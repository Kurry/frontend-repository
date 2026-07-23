# Rental Turnaround Control Board

<summary>
Create a workflow coordination app for rental property turnaround management, where users inspect a floorplan, schedule repair tasks, track inventory and access custody, branch scope decisions, and export a partial handoff package.
The app is a frontend-only React application using Vite and Tailwind CSS 4.3.2. Use local React state (e.g. useReducer or context) to coordinate state between the spatial room-state floorplan, finding and evidence ledger, work graph timeline, inventory and key custody, branch and approval flow, and final responsive artifacts. All libraries must be installed via npm and bundled locally; no CDN imports are allowed.
This is not a simple maintenance ticket list, but a complete workflow app. The signature interaction is selecting loci on a room floorplan and scheduling their tasks on a timeline while finding states, evidence images, inventory consumption, dependencies, and readiness update interactively.
</summary>

<core_features>
- Room-state floorplan: Selectable SVG loci representing rooms and fixtures display inspection status, severity, active work, and verification overlays. Users can select loci individually or via a lasso to create a work scope, maintaining exact spatial coordinate mappings.
- Findings and evidence ledger: Users record findings containing fixture, category, severity, notes, evidence hashes, captured-at logical time, and supersession state. Duplicate evidence hashes remain distinct, and findings can be traced from evidence selection through to decision and handoff.
- Work graph and turnaround timeline: Tasks are created from findings and scheduled on worker lanes. Users define dependencies, assignee, duration, room access needs, inventory items, and verification rules. Tasks remain as "previews" if cycles, overlaps, unavailable access, or unverified predecessors exist.
- Inventory and key custody: Users can reserve, issue, consume, return, or substitute inventory units and key access items through an append-only chain of custody events. Inventory counts never fall below zero, duplicate events are idempotent, and task readiness blocks on available resources.
- Scope branches and approval: For each fixture decision (repair, replace, defer, accept-as-is), users compare cost, time, dependencies, inventory, and unresolved findings. Approved decisions freeze the evidence and schedule basis; subsequent changes mark the approval as stale.
- Dispatch, verification, and partial handoff: The user can advance the clock to dispatch tasks and record deterministic verification progress against evidence. At a partial handoff state (e.g. 19 of 22 tasks complete), the app exposes blocked rooms, missing key returns, and stale verification, allowing the user to recover via resequencing, inventory substitution, or conditional handoff.
- Responsive command surface and artifacts: The desktop view links floorplan, evidence, timeline, inventory, branching, and readiness simultaneously. Tablet view uses synchronized panes. Mobile view uses room/fixture cards, evidence sheets, day/worker schedules, custody steppers, and a handoff checklist retaining full capability.
</core_features>

<visual_design>
- Visual cues must distinctly indicate uninspected, finding, work-in-progress, and verified states on the floorplan loci and evidence ledger.
- Selections, linked items, reserved/issued/consumed inventory, checked-out/returned keys, branched, stale, partial, and ready states must be clearly legible and distinguishable.
- The UI must handle dense data layouts effectively, scaling gracefully from 1440px desktop down to 375px mobile without horizontal overflow or sub-44px tap targets.
</visual_design>

<motion>
- Interactions like locus selection, lassoing, task scheduling, inventory reservation, approval merging, dispatch, verification, and partial handoff recovery must show clear causal motion connecting the user's action to the resulting state change.
- Reduced motion settings must preserve exact endpoint states and values without animating.
</motion>

<requirements>
- The app must load from a strictly deterministic immutable fixture state (fictional unit with 8 rooms, 46 fixtures, 31 findings, 18 evidence hashes, 22 tasks, 14 inventory lots, 6 keys, 3 workers, 1 delivery delay, and a 7-day logical clock). Real occupant data is strictly forbidden.
- No prior authored work, completion, export, or success evidence may be preseeded in the starting state. All user milestones must become observable strictly through explicit user UI actions.
- Any pointer or direct-manipulation path (like drag and drop) must converge identically with the explicit keyboard or form-based path for the same action, producing identical canonical events, WebMCP state, and export records.
- Implement robust atomic transaction behavior for import modes: reject duplicate IDs, invalid boundaries, unknown enums, cycles, overlapping intervals, custody arithmetic violations, and forged handoff hashes, reverting to zero mutation if validation fails.
- The session state must persist reliably across reloads while explicitly excluding transient views (hover states, dialogs, draft selections) from being persisted.
- Bound field constraints and enum uniqueness rules must surface precise field-level error messages identifying the field and rejected value, clearing only upon correction.
- The useful end state is a suite of deterministic artifact downloads: turnaround.json (canonical schema state), work-order.csv (task list with state and assignee), turnaround.ics (task and access blocks), unit-status.svg (floorplan and status overlays), and handoff-packet.md (readiness and provenance).
- Interactions must meet performance thresholds on maximum fixture loads: direct manipulation acknowledged within 100ms, linked views settled within 500ms, and exports/imports completed within 2 seconds.
- Keyboard traversal, modal focus traps, ARIA announcements, and complete non-mouse usability must be maintained throughout all major workflows.
- All libraries are installed via npm and bundled locally; no CDN imports.
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
- Editor object types: floorplan-locus; workflow-graph
- Editor properties: position; verification
- Editor operations: select; update_property; preview
- Entity: task; inventory
- Entity operations: create; select; update; delete
- Entity fields: dependencies; assignee
- Artifact operations: export; import
- Export formats: json; csv; ics; svg; md
- Import modes: canonical-state

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Lasso and drag gestures stay Playwright when mechanism matters

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
