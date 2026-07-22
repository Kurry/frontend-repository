# Task proposal: Volunteer Shift Exchange Board

**Proposed slug:** `frontend-workflow-volunteer-shift-exchange-board`
**Archetype:** `Kanban / workflow` and `planning`
**Genre:** `hard browser app/constraint-aware roster exchange`
**Source basis:** framework-agnostic synthesis of actor state, task queues, anticipatory scheduling, approval hooks, routing, checkpoints, and partial-batch recovery primitives
**Target user:** A coordinator and fictional volunteers maintaining event coverage through multi-person shift exchanges

<summary>
Build a Volunteer Shift Exchange Board using React, Redux (or similar in-memory state), Tailwind CSS 4.3.2, and headless components (like Radix UI or Headless UI). The app allows users to inspect roster coverage, create direct or cyclic shift exchanges, assign replacement roles, validate hard and soft constraints, gather participant responses, approve transactions, handle expiry, and export the final roster plus an audit ledger. The app produces the user's session artifact: a downloadable and copyable Session JSON document, an ICS roster, a CSV audit ledger, and an SVG exchange diagram. All libraries must be installed via npm and bundled locally; no CDN imports of any library, font, or icon set are allowed.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Roster and coverage canvas —
- Shift cards occupy time lanes by volunteer and venue. Dragging a card to another volunteer proposes reassignment; drawing successive edges creates a two- to five-person exchange loop. Keyboard source-target selection and mobile exchange sheets equal pointer gestures.
- Coverage cells show required versus assigned role counts and select exact shifts.
Feature: Exchange transaction composer —
- Each exchange stores offered shift, requested/received shift, role assignment, participants, rationale, expiry, and optional coordinator override. Open chains are invalid; duplicate shift/participant roles and self-loops reject. The composer previews before/after roster, coverage, hours, fairness, travel, and conflicts without mutating committed ownership.
Feature: Constraint graph —
- Hard rules cover availability, skill/certification, accessibility-compatible venue, overlapping time, 11-hour rest, 20-hour cap, role coverage, and cross-venue travel. Soft rules cover preferences and fairness.
- Selecting a conflict highlights exact volunteer, shifts, edge, threshold, and remediation. Overrides are allowed only for declared soft rules and require a note.
Feature: Participant response workflow —
- Sending a proposal creates tentative shift reservations and response tasks for every participant. States are draft, sent, viewed, accepted, declined, expired, withdrawn, awaiting coordinator, approved, committing, committed, rolled-back, or failed.
- One decline or expiry releases all reservations. Editing after acceptance creates a revision and resets affected responses with visible lineage.
Feature: Coordinator approval and atomic commit —
- When all participants accept and hard constraints pass, the coordinator compares the current roster checksum against the proposal base. If current state changed, approval becomes stale and requires rebase/review.
- Commit changes all shift owners simultaneously and appends ownership history; no intermediate roster may appear as committed.
Feature: Partial-failure simulation and rollback —
- The fixture can fail after two internal ownership writes. The UI must expose the failed commit attempt while canonical roster remains at the pretransaction snapshot, then allow retry atomic commit, rebase, edit revision, or cancel. Retry is idempotent and cannot duplicate audit events or responses.
Feature: Fairness and waitlist routing —
- Charts show desirable/undesirable hours, total hours, preference match, and recent swap burden per volunteer. A waitlist routes open shifts to eligible volunteers in deterministic priority order and produces proposals only.
Feature: Responsive roster and artifacts —
- Desktop shows roster canvas, exchange/constraint graph, response queue, and coverage/fairness rail. Mobile becomes day/venue shift cards, participant chips, vertical exchange lineage, conflict sheets, response stepper, and coverage drilldowns.
- Export produces canonical JSON, one ICS roster, CSV shift ownership/audit ledger, and SVG exchange diagram; import reconstructs transactions exactly.
</core_features>

<user_flows>
- Verify complex transaction flows can be navigated via UI.
</user_flows>

<edge_cases>
- Validate handling of edge cases in transactions.
</edge_cases>

<visual_design>
- Light paper stage with high-contrast ink and soft radial washes; condensed UI type.
- Floating panels, distinct visual states for draft, sent, accepted, etc.
- Responsive layout converting dense canvas to vertical flows on mobile.
</visual_design>

<motion>
- Exchange edges, reservation overlays, coverage/fairness shifts, expiry release, atomic commit/rollback animate cause; reduced motion retains explicit before/after ownership traces.
</motion>

<responsiveness>
- Verify that mobile flows handle the required transformations.
</responsiveness>

<accessibility>
- All interactions must be keyboard navigable and accessible.
</accessibility>

<performance>
- Animations and canvas actions perform within bounds.
</performance>

<writing>
- Assert text is clear and accurate in all tooltips and views.
</writing>

<innovation>
- Extra behaviors that enhance the primary workflow.
</innovation>

<requirements>
- Stack: React, Redux (or similar in-memory state), Tailwind CSS 4.3.2 (pinned), Headless UI/Radix UI.
- No backend; all state is in-memory.
- Must produce downloadable JSON, ICS, CSV, and SVG artifacts matching the specs.
- Run on port 3000 via npm start
- No localStorage for main state; reload resets to fixture.
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
- Editor object types: shift-exchange-edge
- Editor properties: reservation; override; revision
- Editor modes: draft; sent; committed; rolled-back; failed
- Editor operations: select; add; delete; update_property; set_content; switch_mode; preview
- Entity: shift-ownership
- Entity operations: create; select; update; delete; toggle
- Entity fields: volunteer; shift; role; time
- Artifact operations: export; import; copy
- Export formats: session-json; ics; csv; svg
- Import modes: session-json

Mechanics exclusions:
- Drag/drop canvas interactions
- Waitlist logical-clock scheduling internals
- Detailed accessibility tooltips

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
