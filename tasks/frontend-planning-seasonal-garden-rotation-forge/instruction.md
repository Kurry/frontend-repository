# Seasonal Garden Rotation Forge

<summary>
The user draws crop blocks into bed grids across four seasons, links succession and companion relationships, satisfies family-rotation/light/water/spacing constraints, allocates seed lots, shifts planting/harvest windows, generates dependent tasks, compares plan branches, resolves deterministic evaluator findings, and exports seasonal maps plus task/seed manifests. This is not a plant list or calendar. The signature interaction is dragging/resizing a crop block in one season while adjacent seasons, rotation history, companion graph, resource bands, seed ledger, task timeline, harvest curve, and artifacts update together. The application must be built using Vite and React, strictly enforcing local dependencies via npm (no CDNs) and utilizing Tailwind CSS 4.3.2 for styling.
</summary>

<core_features>
Each season has synchronized bed grids. Crop blocks drag, resize, rotate when allowed, copy, and move between beds/seasons. Blocks snap to the grid, cannot overlap or leave bounds, and must meet variety area/spacing increments. Keyboard arrows/resize/season transfer and mobile coordinate sheets equal pointer gestures.

Blocks occupy planting-through-clear dates within their season. A bed cell may host successive blocks only when intervals do not overlap and the turnaround buffer is met. Moving a date edge or crop block previews which future blocks shift, orphan, or collide. The lineage view connects predecessor/successor occupancy by exact bed region.

Each cell tracks crop family across historic and planned seasons. Fixture rules require a declared gap before the same family returns, with two typed exceptions. A rotation-debt lens colors cells and lists exact prior/future blocks. Exceptions need a reason and alter evaluator/readiness state without changing geometry.

Users link blocks as companion or succession pairs. Companion eligibility depends on overlap in time and boundary distance; incompatibility depends on family/variety, shared bed, and declared radius. Selecting an edge highlights both spatial regions and dates. Contradictory/duplicate edges and invalid distances reject.

Each block derives fixture light demand, water demand, and height shadow footprint. Bed/day water bands and seasonal resource charts aggregate planned demand under fixed capacities. Tall blocks cast deterministic north-oriented shadow regions. Resource lenses are analytical and never auto-move crops.

Required seeds derive from area/spacing plus fixture germination buffer. Users bind lots by variety, quantity, expiry season, and reserved/consumed status. Allocations cannot exceed lot availability or use expired/incompatible lots. Changing block area/variety marks allocations and dependent sow tasks stale until reconciled.

Blocks generate prepare, sow, thin, water-check, harvest-window, and clear tasks using fixture offsets. Dependencies and bed/resource collisions appear on a timeline. Scoped date edits can adjust this task only or shift the crop block, with explicit provenance. Harvest curves aggregate deterministic range/yield values and select exact contributing blocks.

Users fork season plans, compare geometry, rotation debt, graph edges, resources, seed demand, tasks, and harvest curves, then merge property-level conflicts. A deterministic evaluator validates each rule and supports pinned evidence, exceptions, and approval. Desktop uses canvases/graphs/timeline; mobile uses bed mini-maps, crop/coordinate/date sheets, vertical lineage, and ledger drawers. Export produces JSON, SVG map per season, CSV seed/task manifests, and ICS tasks.
</core_features>

<visual_design>
Inspect selected, preview, overlap, succession, rotation debt, companion conflict, shadow, overcapacity, stale seed, task, and approved states. The hierarchy stays legible across all these states.
</visual_design>

<motion>
Move and resize blocks. Propagate seasons, edges, resources, seeds, and tasks. Compare branches. Then repeat with reduced motion. Causal endpoints and values must agree. Block travel/resize, cross-season propagation, graph/resource/seed/task shifts, and compare transitions explain cause; reduced motion retains persistent before/after regions and deltas.
</motion>

<requirements>
The application must be built using Vite and React, strictly enforcing local dependencies via npm (no CDNs) and utilizing Tailwind CSS 4.3.2 for styling.
SeasonalGardenPlan uses schemaVersion: "seasonal-garden-plan/v1" and stores fixture/hash/timezone/grid/north, beds/zones/history, plan branch DAG/active/approved head, crop blocks/geometry/variety/dates, succession/companion edges/exceptions, resource/shadow values, seed lots/allocations/movements, generated tasks/scope overrides, evaluator runs/findings/reviews, annotations/view state/history, derived occupancy/rotation/distance/resource/seed/task/harvest/artifact checksums, SVGs, two CSVs, ICS, and UTC exportedAt.
Geometry uses 0.25-meter integer grid units and stays bounded/nonoverlapping for coincident intervals.
Date intervals, turnaround, spacing/area, family-gap, companion/incompatibility distance, shadow, and capacity formulas use declared fixture rules.
Succession/companion graphs reference valid blocks and declared acyclicity; plan branch DAG is acyclic with resolved merges.
Seed movements conserve integer counts per lot and active allocations match required quantity/variety/expiry.
Task ids derive from block/type; dependencies/dates and scoped overrides preserve provenance.
SVG geometry/labels, CSV allocation/task rows, and ICS UID/time/status agree with approved canonical plan.
Import rejects fixture/grid/timezone mismatch, overlap/bounds/date/rule violation, graph/branch cycle, seed imbalance, orphan/stale task/evaluation, forged checksum, unsafe SVG, or artifact disagreement atomically.
Canonical re-export changes only exportedAt; SVG, CSV, and ICS remain byte-identical.
Interleave UI/WebMCP block, edge, date, seed, task, branch, evaluator, history, and transfer actions. Ids, geometry, quantities, checksums, and files must match.
Complete at 1440px, 768px, and 375px widths. Mini-map/crop/date/edge/seed/task mobile flows must retain every action, have 44-pixel targets, and no overflow.
Place, resize, transfer blocks, bind edges, edit dates, allocate seeds, navigate tasks/findings, merge/approve, and export without using a pointer. Focus and state must match the pointer experience.
Operate 200 blocks, 100 edges, 100 lots, and 1,000 tasks across eight seasons. Interactions must stay responsive and stale derivations must cancel.
Trigger every geometry/date/rotation/graph/resource/seed/task conflict. Copy must name the exact bed/cell/block/season/rule/value/lot/task and recovery action.
Verify grid/intervals, family/companion/shadow/resource rules, seed conservation, task derivation, SVG/CSV/ICS formats. Garden-fixture semantics must be exact.
Interleave geometry/date/edge edits, seed stale/repair, scoped task, branch merge, undo, approval, export/import. Topology, quantities, and files round-trip exactly.
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
- Entity: crop-block
- Entity operations: select; update; delete

Mechanics exclusions:
- canvas drag and drop is unbindable

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
