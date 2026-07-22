<summary>
Build the Material Cut-Nesting Planner, a hard browser app for spatial fabrication planning. The user places and rotates pieces on stock, honors kerf/grain/edge/defect constraints, draws guillotine cut order, tracks parent/child offcuts, allocates project parts, simulates cutting with failures and recovery, compares nesting branches, certifies one plan, and exports exact cut diagrams plus inventory/manifests. Use React with reducer state, SVG canvases, and canonical serializers. In-memory state only, no localStorage.
</summary>

<core_features>
- Stock-sheet nesting canvas: Place and drag pieces on a 1-mm grid. Rotate 90 degrees only when grain permits. Keep placements inside usable stock (after edge margin), avoid defects and other pieces by 3-mm kerf clearance, matching material/thickness. Include keyboard nudge/rotate support.
- Project part allocation: 26 required parts from 4 materials. Each instance binds exactly one placement. Unassigned/overproduced pieces remain separately visible. Selecting an assembly highlights related elements.
- Guillotine cut-tree editor: Draw full-length horizontal or vertical cuts across the current rectangular region. Cuts consume kerf (3mm) and create two child regions. Piece placements must end in separable leaves. Prevent crossing/non-guillotine cuts.
- Lenses: Display grain direction, required visible edges, defect/clearance regions, and support risk. Ensure next cut leaves regions supported.
- Offcut lineage and inventory: Retain unconsumed leaf regions as named offcuts. Track parent stock/cut path/material/grain/defects. Conserved, reserved, produced, scrapped, and available stock balance out.
- Cost and waste analysis: Linked charts showing purchased area/cents, part area, kerf loss, defect exclusion, reusable offcut, and scrap. Branch comparison separates cost, waste, yield, cut count, and completeness.
- Execution and recovery: Reserve sheets -> verify setup -> execute cuts in tree order -> label -> reconcile output. Handle deterministic failures (e.g. wrong orientation, saw stop, damaged region). Allow pause, retry, mark scrap, re-nest, branch plan, or abandon.
- Responsive artifacts: Export canonical JSON, SVG per sheet with cut order, CSV ledger, and Markdown cut list. Import reconstructs state perfectly.
</core_features>

<visual_design>
- Desktop shows sheet canvases, parts/stock rail, cut tree/sequence, and cost/execution panel.
- Mobile becomes sheet mini-maps, piece/coordinate cards, vertical cut-tree lineage, stock/offcut ledger, and execution stepper.
- Constraint lenses (grain, edge, defect, support) use distinct styling/colors to differentiate boundaries.
- Distinguish between reserved, produced, scrapped, failed, and certified states clearly in the UI.
</visual_design>

<motion>
- Causal motion: Piece travel, cut-region split, tree/sequence propagation, offcut production, and failure recovery explain consequence.
- Reduced motion retains changed regions/lineage/deltas without animation.
</motion>

<requirements>
- In-memory state only. No localStorage or other browser storage APIs. A page reload must return to the seeded state.
- Implement exactly the deterministic fixture: 26 parts, 4 materials, 6 stock sheets, 5 offcuts, 8 rectangular defect regions, edge rules, 3-mm kerf, and specific execution failures. A valid plan using 4 sheets must be possible.
- Provide a useful downloadable end state (MaterialCutPlan JSON, SVG, CSV, Markdown) matching the required schema. Import should reconstruct exactly.
- Stack: React, Tailwind CSS 4.3.2 (pinned), frontend-only.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Serve over local HTTP on port 3000 via npm start with zero console/page errors.
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
    "Closed entity and field enums only."
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
- Editor object types: piece, cut
- Editor properties: position, rotation, execution-state
- Editor modes: placement, cut-tree, lens-grain, lens-edge, lens-defect
- Editor operations: select, add, update_property, switch_mode
- Entity: plan-branch, offcut, part
- Entity operations: create, select, update
- Entity fields: branch-name, status
- Artifact operations: export, import
- Export formats: material-cut-plan-json, svg, csv, markdown
- Import modes: material-cut-plan-json

Mechanics exclusions:
- Drag-and-drop geometry mutation remains Playwright-driven.
- Export file generation (blob) stays Playwright-observed.
</webmcp_action_contract>
