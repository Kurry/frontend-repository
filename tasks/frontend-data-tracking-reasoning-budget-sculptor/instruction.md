<summary>
Build a Reasoning-Budget Sculptor tool using React and Tailwind CSS 4.3.2. A researcher reshapes token budgets across analysis phases of a frozen trajectory, protects indispensable evidence, and compares two allocations to understand where truncation would break causal continuity. Resizing phase bands conserves a fixed total, while linked event retention, dependency, cost, and outcome views recompute. The result is a portable budget policy with exact phase bounds, retained evidence, fallback rules, and deterministic projections.
The app produces the operator's session artifact: a downloadable ReasoningBudgetPolicy JSON document compiled live from the UI, conforming to the specified API schema.
</summary>

<core_features>
Feature: Conservation timeline —
- Eight phase bands occupy a shared token ruler representing 24,000 allocatable tokens total
- Dragging a boundary transfers tokens between adjacent phases while preserving exactly 24,000 total tokens
- Keyboard arrows on boundary handles use 100-token steps, and Shift+arrows use 1,000-token steps
- Direct numeric entry performs the same constrained transfer
- Minimum/maximum collisions produce visible elastic resistance and name the blocking phase (Phase minimums total 9,000; maximums total 33,000)
- A global scale handle redistributes tokens by unlocked weights with deterministic largest-remainder rounding
- Phase limits can be individually locked to prevent changes to their token allocation during redistribution or adjacent resizing

Feature: Evidence retention lattice —
- A fixture of 96 ordered events grouped into eight phases, 12 evidence anchors, 15 dependency edges, and 24,000 total weight
- Every event renders as a weighted cell linked to dependency ancestors
- Cells display states: retained, truncated, pinned, dependency-rescued, or impossible
- A pure retention model keeps complete events in order until a phase cap, except pinned anchors and their required dependency ancestors
- The model never invents fractional events (tokens are allocated per event, and if a phase token cap is reached, subsequent non-pinned events are truncated)
- Clicking an event synchronizes the phase, trace excerpt, token ledger, and dependency path
- Pinning evidence forces ancestors into retention; this may expose a deficit if the phase token cap is exceeded, prompting the researcher to transfer budget, unpin, or select a summary fallback

Feature: Truncation and fallback editor —
- For each protected anchor, the researcher can define one ordered fallback: retain raw event, retain a fixture-provided summary, or mark loss unacceptable
- Summaries have fixed token weights and source-event membership
- A fold/unfold gesture changes the allocation calculation and visible topology without editing fixture content
- Invalid summaries with missing source ancestry block certification

Feature: Linked projection views —
- A stacked retention chart, phase cost bars, dependency-break map, and outcome-risk ribbon are displayed
- These views share hover, focus, and brush selection
- Brushing a token interval highlights affected events and reports retained count, protected coverage, broken edges, and unused tokens
- A before/after compare pins a second allocation (checkpoint) and renders boundary displacement plus event-set symmetric difference

Feature: Scenario pressure and recovery —
- Three deterministic pressure fixtures can be applied: context reduced to 18,000 tokens, phase minimum increased, or a new protected anchor added
- The current policy reflows according to its lock/fallback rules
- Over-constrained states remain editable, name the exact deficit, and prevent certification
- Reverting pressure restores the identical prior hashes

Feature: Policy history and transfer —
- Undo/redo records every boundary, lock, pin, fallback, pressure, and annotation mutation
- Two named checkpoints can be saved and compared
- Export produces a valid ReasoningBudgetPolicy JSON with schemaVersion reasoning-budget-policy/v1 and UTC exportedAt
- Import rejects unknown ids, wrong total, noninteger values, violated locks, impossible fallback membership, duplicate history order, fixture mismatch, or forged checksum, then recalculates atomically
- Import round-trips correctly, and Export reset import export is byte-equivalent except exportedAt
</core_features>

<visual_design>
- Desktop aligns the token ruler, lattice, and projections horizontally
- Tablet stacks projections under a scroll-synchronized ruler
- Inspecting full, truncated, rescued, impossible, pressured, and compared states shows legible hierarchy and token geometry
- UI should visually indicate the constraints: minimums, maximums, and total cap
- Elastic resistance must be visually apparent when limits are hit
- Missing source ancestry or over-constrained states must clearly block certification visually
</visual_design>

<motion>
- Boundaries displace, cells fold, and paths/risk update to explain truncation smoothly
- Reduced motion shows exact endpoints and persistent deltas without intermediate smooth transitions
- Causal transitions correctly match final states for resize, pin, fold, pressure, compare, and undo actions
</motion>

<requirements>
- Desktop, tablet, and mobile layouts must be correctly implemented
- Mobile (<=767px): becomes an eight-step phase editor with a persistent conservation meter, compact dependency cards, and exact numeric transfer sheet; pin, fallback, pressure, compare, undo, import, and export remain available without page overflow
- Pointer-free (keyboard-only) accessibility is required for transferring boundaries, navigating/pinning cells, choosing fallbacks, setting brush bounds, pressure, compare, and export
- Performance: Continuously resizing across 96 cells and 15 dependencies maintains 16ms target feedback, stale projections cancelled, and no old-state flash
- All logic runs entirely in the browser (in-memory state only, no localStorage, no backend)
- Do not load external resources via CDNs; use only local npm dependencies.
</requirements>

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
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP."
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
    "Bounded string and numeric values."
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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: phase; event; checkpoint
- Editor properties: allocation; locked; pinned; fallback
- Editor modes: normal; compare; pressured
- Editor operations: select; update_property; switch_mode; set_content
- Entity: fallback; checkpoint
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; type
- Artifact operations: export; import; copy
- Export formats: policy-json
- Import modes: policy-json
</webmcp_action_contract>