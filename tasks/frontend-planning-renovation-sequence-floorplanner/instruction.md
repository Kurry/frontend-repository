# Renovation Sequence Floorplanner

<summary>
Archetype: planning and Kanban / workflow
Genre: hard browser app/spatial project sequencer

The user places work zones on a fixed floor plan, binds work packages, draws dependencies, schedules crews and deliveries, preserves household access/dust separation, routes inspection approvals, rehearses deterministic delays and partial failures, compares schedule branches, and exports a build plan with spatial maps, timeline, and budget/material ledgers. Tailwind CSS 4.3.2 is required. All libraries must be installed locally via npm without CDN imports.

This is not a task board or floor-plan decorator. The signature interaction is dragging/resizing a work-zone interval across floor and timeline views while access paths, dependency edges, crew/material conflicts, inspection gates, cost draw, completion forecast, and artifacts update together.
</summary>

<core_features>
Work-zone floor canvas
Users place axis-aligned rectangular zones within allowed room polygons, resize on grid, assign work packages, and mark dust, noise, utility-shutoff, or storage effects. Zones cannot overlap incompatible active work, cross walls, block both entrances, or eliminate the fixture's required accessible path. Keyboard/numeric and mobile coordinate sheets equal drag/resize.

Dependency and inspection graph
Packages connect by finish-start, start-start, cure-delay, delivery-before, and inspection-before edges. Cycles reject. Inspection nodes require declared prerequisite packages/evidence and freeze exact work/material checksums at approval. Editing a prerequisite marks downstream approvals stale and blocks dependent work.

Schedule and crew lanes
Work bars drag/resize on a day/hour timeline under duration bounds, crew availability/skill, work-hour windows, cure delays, and package dependencies. A crew cannot occupy two locations or incompatible zones simultaneously. Critical path and float recompute deterministically; invalid changes remain preview-only.

Household access and phase planner
Daily floor snapshots show open paths from occupied bedroom to entrance/bath/kitchen substitute under fixture rules. Users define phases and temporary partitions/paths. Dust and utility lenses show affected rooms by active package. A day cannot be approved when required access or essential utility coverage fails.

Material batch ledger
Packages reserve batch quantities with delivery day, storage footprint, compatible work, and expiry. Deliveries need a valid entrance-to-storage path and storage zone capacity. Reservations, delivered, consumed, returned, damaged, and remaining quantities conserve exactly. Rescheduling work may stale a delivery/expiry allocation.

Budget and payment draw
Line items store labor, material, contingency, and inspection costs in integer cents. The baseline, committed reservations, actual consumption, change orders, refunds, and remaining contingency reconcile in a waterfall. A change order creates a revision and requires approval before schedule/material consequences become canonical.

Delay and failure recovery workflow
The workflow progresses plan to validate to reserve to execute to inspect to close per package. Fixture events include a two-day material delay and a failed inspection after a subset of packages completed. The user can shift downstream work, substitute compatible batch, split crew assignment, branch the schedule, retry inspection after rework, or abandon a branch while preserving completed facts and attempts.

Responsive plan and artifacts
Desktop shows floor, schedule/dependency graph, resource/material/budget rail, and run timeline. Mobile becomes floor mini-maps, zone/package cards, date/crew sheets, vertical dependency/inspection lineage, and ledger/recovery drawers. Export produces canonical JSON, SVG daily/phase floor maps, CSV schedule/material/budget ledger, and ICS tasks/inspections/deliveries; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect selected/preview/collision/path/effect/critical/conflict/reserved/delayed/stale/failed/approved states, spatial and workflow hierarchy stays legible.
</visual_design>

<motion>
- Move/resize zone/bar, reroute path, shift dependency, reserve/deliver, stale/recover, then repeat reduced, causal endpoints and values agree.
</motion>

<requirements>
Shared application state must live in a local React/Vite reducer (in-memory only). All libraries must be installed locally via npm without CDN imports. Styling is Tailwind CSS 4.3.2.

Deterministic fixture
The fictional one-floor home has 10 rooms/zones, two entrances, one required habitable path, fixed walls/doors/utilities, 18 work packages, four crews, 12 material batches, three inspection types, fixed integer-cent costs, and two deterministic delay/failure events. A valid 28-day schedule exists. Geometry uses a 0.25-meter grid; no real building advice is provided.

Artifact contract
RenovationSequencePlan uses schemaVersion renovation-sequence-plan/v1 and stores fixture/hash/timezone/grid, floor geometry/doors/utilities, plan branch DAG/active/approved head, zones/effects, packages/dependency DAG/schedules/crews/phases, temporary access/partitions, materials/batches/reservations/movements/deliveries, inspections/evidence/approvals, budgets/change orders/payment events, execution/recovery attempts, annotations/view state/history, derived collision/path/critical/resource/inventory/cost/artifact checksums, SVGs, CSV, ICS, and UTC exportedAt.
Zone geometry uses integer grid units, stays in allowed room regions, and daily simultaneous zones satisfy overlap/access/effect rules.
Package graph is acyclic; dates/durations/cure delays/crew skills/hours and inspection gates are exact.
Access uses deterministic fixture graph/path clearance; essential utility/day rules derive from active effects.
Material movements conserve integer quantities per batch; storage geometry/capacity/path and expiry are valid.
Budget uses integer cents and waterfall balances; approved changes/inspections reference current checksums.
Attempts are append-only; branch recovery preserves completed immutable facts and cannot duplicate consumption/payment.
SVG geometry/day labels, CSV rows/cents/quantities, and ICS UID/times/status agree with approved canonical branch.
Import rejects fixture/grid/timezone mismatch, zone/access violation, graph cycle/schedule/resource conflict, inventory imbalance, stale/forged approval/change/attempt/checksum, unsafe SVG, or artifact disagreement atomically.
Canonical re-export changes only exportedAt; SVG, CSV, and ICS remain byte-identical.

Depth-first completion protocol (mandatory)

For every subsystem in this proposal, complete it only when there are no unimplemented implication states.

- Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
- Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
- Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
- Add complete recovery and recovery-by-default cases:
  - malformed/partial input,
  - duplicate/lost/late events,
  - approval races,
  - transient and terminal failures,
  - cancellation + resume semantics,
  - import/export drift,
  - no-network constraints in demo mode,
  - runtime/console regressions.
- Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
- If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates (hard)

- No TODO markers in user-facing behavior.
- Every feature branch has an explicit observable evidence path.
- Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
- Zero partial mutation on validation/import failure.
- Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
</requirements>

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
- Browsable entity: plan
- Destinations: floor-canvas; schedule-timeline; household-access; material-ledger; budget; recovery-workflow
- Filters: status; zone
- Sorts: start-date; cost
- Themes: light; dark
- Entity: zone; package; crew; phase; material; inspection; branch
- Entity operations: create; select; update; delete
- Entity fields: dimensions; dates; crew-id; material-id; status; cost
- Artifact operations: export; import
- Export formats: json; svg; csv; ics
- Import modes: plan-json

Mechanics exclusions:
- Canvas/drag drop operations are primarily Playwright responsibilities.
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard and downloaded artifact contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
