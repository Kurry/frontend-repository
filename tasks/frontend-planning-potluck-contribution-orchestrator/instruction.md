<summary>
Build a Potluck Contribution Orchestrator application using Tailwind CSS 4.3.2 to coordinate dishes, contributors, equipment, arrivals, and buffet service for one community meal. The app must produce the canonical event run pack and artifacts (JSON, CSV, ICS, SVG, Markdown), conforming to the artifact contracts, with state synchronization across linked views. All state is in-memory; no localStorage.
</summary>

<core_features>
Feature: Coverage and serving matrix —
- A matrix where rows are course roles (8 targets) and columns are dietary groups (6 groups). Each cell displays required portions.
- Dish cards (representing contributions) provide typed portions to one or more cells under declared overlap rules.
- Selecting a cell highlights the exact dishes, contributors, and labels contributing to it.
- The matrix displays undercoverage, overconcentration, and unknown allergen data as distinct states.

Feature: Contributor commitment workflow —
- A proposal contains: dish name, portions, recipe-card fixture id, dietary/allergen tags, arrival time, temperature state, equipment needs, cost reimbursement, owner, and fallback.
- Commitments step through states: draft, invited, clarification, revised, accepted, declined, expired, withdrawn, arrived-partial, arrived-complete, failed, substituted, or reconciled.
- Accepting a commitment reserves coverage/resources but does not mark food as arrived.

Feature: Revision, swap, and fallback transactions —
- Editing an accepted dish's quantity, timing, or resources creates a revision and resets approvals.
- Two contributors may swap whole commitments, or one may hand off to a fallback, applied atomically after all parties accept.
- Rejected or expired swaps leave original commitments intact.

Feature: Arrival and resource timeline —
- Dish bars include arrival, holding, reheat/chill, service-ready, and expiry intervals.
- Appliance slots (3 appliances) have capacity, temperature, mode, and cleanup buffers.
- Dragging or resizing bars previews conflicts and downstream readiness.
- Provides keyboard scheduling and mobile date/duration/resource sheets equal to pointer gestures.

Feature: Buffet layout canvas —
- Serving vessels occupy rectangular footprints on a centimeter grid.
- Users can move and rotate them, attach labels/utensils, and draw a one-way guest flow.
- Enforces layout bounds, non-overlap, hot/cold station separation, allergen separation, label clearance, and aisle width (4 serving stations).
- A placement is active only based on dish readiness and actual arrival.

Feature: Event-day run and partial recovery —
- The run advances through: check-in → receive/inspect → quantity reconcile → hold/reheat → label/place → replenish → close.
- Support fixture events: contributor dropout, 20-minute late arrival, and one dish at 60% quantity.
- Users can activate fallback, resize coverage, swap resource slot, split/relabel portions, move buffet placement, or mark a typed exception while preserving attempts and actual facts.

Feature: Cost and responsibility ledger —
- Optional reimbursements (integer cents) connect receipts to accepted/actual commitments.
- Reconciles requested, approved, paid-simulated, reversed, and remaining amounts.
- Responsibility view shows host/contributor/fallback tasks, blocking dependencies, and completion evidence.
- Event certification requires coverage, labels, reconciled quantities, and closed obligations.

Feature: Responsive run pack and artifacts —
- Responsive layout across desktop (all tools) and mobile (steppers, drawers, sheets).
- Export produces: canonical JSON, CSV dish/coverage/cost ledger, ICS arrival/resource/tasks, SVG buffet map, and Markdown run sheet/labels.
- Import reconstructs state exactly from JSON.
</core_features>

<visual_design>
- Inspect proposed/accepted/revised/declined/partial/fallback, under/covered, resource conflict, layout/allergen/label, run/cost/cert states with distinct legible visual hierarchy.
</visual_design>

<motion>
- Causal motion: Dish card flow, coverage redistribution, atomic swap, resource shift, buffet activation, and partial-recovery propagation explain cause.
- Reduced motion retains explicit before/after portions/times/owners without animations.
</motion>

<requirements>
- Frontend-only in-memory app (no localStorage) running on port 3000.
- Start empty but populated with deterministic fixtures (32 attendees, 6 dietary groups, 12 contributors, 18 proposed dishes, 8 course targets, fixed allergens, 3 appliances, 4 stations).
- Implements exact artifact contracts as defined in the job description (PotluckEventPlan schemaVersion: "potluck-event-plan/v1").
- Artifact exports: JSON, CSV, ICS, SVG, Markdown. Import parses and validates exactly.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- Run via `npm start` on port 3000.
- Implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI.
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
- Editor object types: buffet-vessel
- Editor properties: position; rotation; label; flow
- Editor modes: placement; draw-flow
- Editor operations: select; update_property; set_content
- Entity: commitment; revision; swap; resource-slot
- Entity operations: create; select; update; delete
- Entity fields: dish; portions; owner; state
- Artifact operations: export; import; copy
- Export formats: session-json; csv; ics; svg; markdown
- Import modes: session-json

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright
- File path selection and raw blob inspection stays Playwright
</webmcp_action_contract>
