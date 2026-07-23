# Decision Minutes Lineage Board

<summary>
The user schedules agenda blocks, advances a logical meeting clock, captures source-bound proposals, creates amendments, records participant positions and quorum, adopts/rejects/tables decisions, tracks dissent and rationale, generates action dependencies, supersedes prior decisions in a later session, and exports exact minutes, decision register, and calendars.
- Build tooling: React/Vite with client-side routing. Styling is Tailwind CSS 4.3.2 (pinned). All interactivity lives in client state after load.
</summary>

<core_features>
- Agenda and meeting clock: blocks drag/resize on a minute timeline with planned/actual start/end, owner, objective, required participants, and decision rule. Logical clock controls start, pause, resume, extend, skip, and close. Moving one block previews downstream time/attendance/quorum impact.
- Proposal and evidence cards: proposals bind exact agenda/source spans and contain motion text, scope, effective date, decision rule, and expected action criteria. Source cards drag onto proposal claims. Editing after introduction creates a revision.
- Amendment branch graph: amendments target exact proposal revision ranges/properties and are friendly, substitute, add, delete, or refer. Branches resolve in declared order. Accepted amendment produces new revision; cycles and stale-target amendments reject.
- Attendance, quorum, and positions: append-only attendance events. Quorum derives by role/instant. Positions are support/oppose/abstain/consent/objection/recusal/absent. Decisions cannot close without current quorum and complete eligible positions.
- Decision and dissent register: outcomes are adopted, rejected, tabled-to-date, withdrawn, no-decision. Register freezes revision, rule, eligible set, positions, tally, objections, rationale, source ids, time. Later correction appends erratum or supersession edge.
- Action and dependency board: adopted decisions generate action cards with owner, outcome, evidence, due date, dependencies, authorizing revision. Superseding marks affected open actions review-required.
- Speaking queue and unresolved items: deterministic queue with request time, agenda item, point type. Chair reorder requires reason. Parking-lot questions bind ids and route to future. Closing item requires resolved state or explicit outcome.
- Responsive board and artifacts: Desktop shows clock, graph, attendance, decision rail. Mobile shows cards, vertical lineage, sheets, queue, stepper. Export produces canonical JSON, Markdown minutes, CSV register, ICS calendars, SVG lineage. Import reconstructs exactly.
</core_features>

<visual_design>
- Inspect planned/active/overrun, introduced/amended/withdrawn, present/absent/recused, quorum/position/outcome/dissent, action/superseded states -> lineage stays legible.
</visual_design>

<motion>
- Shift agenda/time, branch/merge amendment, update quorum/tally, generate/review action, supersede, then repeat reduced -> causal endpoints/state agree.
</motion>

<requirements>
- DecisionMinutesLedger uses schemaVersion: "decision-minutes-ledger/v1" and stores fixture/hash/timezone/logical clock, participants/roles/attendance events, agenda blocks/planned/actual times, sources/spans, proposal revision DAG/amendments/status, evidence bindings, position events/quorum/tallies, decision events/dissent/errata/supersession edges, action graph/status/handoffs, speaking queue/events/parking items, reviews/approval/annotations/view state/history, derived time/quorum/tally/lineage/action/artifact checksums, Markdown, CSV, ICS, SVG, and UTC exportedAt.
- Meeting/agenda/attendance times are integer seconds in fixture zone; logical event state is append-only and valid.
- Proposal/amendment revision graph is acyclic; amendments target current exact revision/property/range and merge deterministically.
- Quorum, eligible positions, denominators, thresholds, consent/objection, recusal/absence rules are exact at decision instant.
- Decisions are immutable append-only records; errata and supersession edges preserve originals and form an acyclic lineage.
- Actions reference one valid adopted decision revision and dependency DAG; supersession review propagation is deterministic.
- Markdown chronology/text/tallies, CSV rows, ICS UIDs/times/status, and SVG nodes/edges/timeline agree with canonical ledger.
- Import rejects fixture/timezone mismatch, invalid event/revision/amendment, quorum/tally forgery, impossible decision/erratum/supersession, unauthorized action/cycle, queue event error, forged checksum, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; Markdown, CSV, ICS, and SVG remain byte-identical.
- All libraries installed via npm and bundled locally; no CDN imports.
- Tailwind CSS 4.3.2 is required.
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
- browse-query-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
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
- Browsable entity: minutes
- Destinations: agenda; proposals; amendment-graph; attendance; decisions; actions; queue; export
- Filters: status; owner; rule
- Sorts: time-asc; time-desc; status
- Themes: light; dark
- Entity: agenda-block; proposal; amendment; attendance-event; position; decision; action; queue-item
- Entity operations: create; update; delete; reorder
- Artifact operations: import; export; copy
- Export formats: json; md; csv; ics; svg
- Import modes: json

Mechanics exclusions:
- Drag and drop timeline/graph interactions are Playwright responsibilities
- Raw artifact contents in WebMCP are forbidden
- Local file picker interactions are Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
