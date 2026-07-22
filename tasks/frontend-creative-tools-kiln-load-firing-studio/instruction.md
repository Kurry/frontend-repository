<summary>
Build a Kiln Load & Firing Studio, a hard browser app for spatial batch and curve planning using React, Zustand, and Tailwind CSS 4.3.2. The app lets a fictional ceramics studio coordinator arrange pieces and rehearse a bounded firing plan, combining spatial placement, glaze constraints, piecewise curve generation, and immutable batch execution state. The app must produce the user's downloadable and copyable artifacts: a Session JSON document, SVG shelf/curve reports, CSV ledgers, and a Markdown runbook, with Import that reconstructs state exactly. The app operates entirely in-memory with no persistent browser storage.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Piece and material provenance —
- Pieces store id, footprint polygon fixture, height band, mass grams, clay lot, glaze lots/surfaces, firing stage, owner code, and status. Source lot cards link material properties and prior fixture results.
- Editing a tested material assignment creates a piece revision and marks dependent plans/results stale without rewriting batch snapshots.
Feature: Shelf load canvas —
- Four circular shelves approximated by fixed polygon boundaries, three height bands, integer-millimeter geometry. 28 deterministic pieces available to place.
- Pieces drag/rotate in 15-degree increments across shelf polygons and height bands.
- Placement enforces bounds, pairwise clearance, shelf-post exclusion, load grams, height/overhang, and orientation rules. Invalid placements remain preview-only (snap back or reject).
- Keyboard nudge/rotate/shelf controls and mobile coordinate sheets equal pointer gestures.
Feature: Glaze and adjacency graph —
- Edges identify forbidden adjacency, required separation, shared catch tile, or allowed pairing by glaze/clay fixture combination. Distance derives from footprint polygons.
- Selecting a rule highlights exact pieces/shelf regions and prior evidence cards.
- Contradictory manual exceptions reject; allowed exceptions require fixture type and note.
Feature: Witness and sensor placement —
- Witness fixtures occupy bounded shelf regions and must cover declared low/mid/high zones without collision. Sensor channels bind fixture shelf positions.
- Moving pieces or witnesses updates coverage and predicted readings. A firing plan cannot be approved with missing coverage or occupied sensor region.
Feature: Firing-curve composer —
- Contiguous piecewise curve with ordered ramp, hold, controlled-cool, and natural-cool segments. Segments define start/end temperature fixture units, rate, duration, and stage tags.
- Handles drag on time/temperature axes; keyboard/numeric controls equal pointer.
- Segments must be continuous, satisfy bounds/rate/hold/total-duration rules, and include required stages for loaded materials.
Feature: Deterministic prediction and comparison —
- Fixture functions map material lots, shelf zones, witness coverage, and sampled curve into predicted result labels and energy points. Predictions are clearly simulated.
- Users fork plans, compare placements, adjacency, shelf loads, curve segments/samples, witnesses, predictions, time, and energy, then merge property/range conflicts.
Feature: Batch execution and partial results —
- Execution advances reserve pieces → precheck → ramp/hold/cool segments → unload inspection → reconcile.
- Logical clock and sampled sensor readings are deterministic. Fixture events include one sensor dropout, a hold deviation, and two piece defects.
- Pause/recover sensor, accept bounded deviation, branch remaining curve when allowed, abort, quarantine pieces, or create a refire plan preserves attempts/snapshots.
Feature: Responsive studio and artifacts (useful end state) —
- Desktop shows shelves, piece/material rail, curve/witness views, and batch/result panel.
- Mobile becomes shelf mini-maps, piece coordinate cards, vertical adjacency/witness lineage, curve segment sheets, and batch stepper.
Export produces canonical JSON, SVG shelf maps and curve/result report, CSV piece/material/batch/sensor ledger, and Markdown load/firing/unload runbook.
Import reconstructs state exactlyemain byte-identical.
</core_features>

<user_flows>
End-to-end flows:
- Load flow: catalog pieces → place on load/constrain → place witnesses → author curve → compare/approve → fire batch/deviate/recover → inspect/quarantine/refire → export → reset/import.
- Spatial conflict flow: place/rotate a piece until clearance fails, repair it, add an incompatible glaze neighbor, move a witness to restore zone coverage.
- Curve edit flow: reshape a curve until continuity/rate fails, branch/repair it, start the batch, handle sensor dropout and hold deviation, quarantine a defect and create a refire branch.
</user_flows>

<edge_cases>
- Test polygon/touching clearance, 15° rotation bounds.
- Post/height/load bounds, adjacency distance constraints.
- Witness coverage exactness.
- Curve continuity/rate/hold/total exact bounds.
- Sensor dropout handling, snapshot immutability on edit, defect/refire piece conservation.
- Stale approvals and forged imports correctly identify and trigger named recovery or rejection.
</edge_cases>

<visual_design>
- Inspect selected/preview/collision/clearance/load/height/incompatible states visually on shelves.
- Uncovered/witnessed zones must be distinct.
- Curve active/deviated/defect/quarantine/refire states cleanly marked.
- Hierarchy stays legible across complex overlays.
</visual_design>

<motion>
- Move/rotate pieces, propagate distance/coverage visually, reshape/sample curve dynamically.
- Advance/deviate/recover batch with clear causality (e.g. state machines moving forward).
With prefers-reduced-motion set, animations are removed and values agree perfectly.
</motion>

<responsiveness>
- Complete flows must work at 1440px, 768px, and 375px widths.
- Mobile (375px) shelf mini-maps, coordinate cards, vertical rule/coverage lineage, curve segment sheets, and batch/result stepper retain every action with 44-pixel minimum touch targets and no overflow.
</responsiveness>

<accessibility>
- Place/rotate via keyboard controls. Navigate rules/coverage, edit curve, compare/merge, control batch, reconcile/refire, and export without pointer.
- Focus and state match pointer-driven interactions perfectly.
</accessibility>

<performance>
- Operate smoothly with 500 pieces, 20 shelves, 5,000 curve samples, and 500 batches/branches.
- Interactions remain responsive and stale geometry/prediction work cancels quickly.
</performance>

<writing>
- Trigger every geometry/material/coverage/curve/batch/result conflict → copy names the exact piece/shelf/zone/rule/segment/sample/event and the necessary recovery steps clearly.
</writing>

<requirements>
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
Stack: React, Vite, Zustand (in-memory state only, NO localStorage), Tailwind CSS 4.3.2.
- Implement deterministic fixtures for the "Northstar K-8" kiln model (4 circular shelves, 3 height bands, 28 pieces, 6 clay/glaze combos, 8 firing primitives, 4 witnesses).
- No external network requests; all logic is offline/in-memory.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
- WebMCP is a required delivery step. Implement exactly the `<webmcp_action_contract>` below.
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
- Editor object types: piece; curve-segment; witness; shelf
- Editor properties: position; rotation; material; rate; duration; target-temp
- Editor modes: placement; curve; batch; results
- Editor operations: select; update_property; switch_mode; preview
- Entity: plan-branch; batch-record
- Entity operations: create; select; update; delete
- Entity fields: name; state; logical-clock
- Artifact operations: export; import
- Export formats: session-json; svg; csv; markdown
- Import modes: session-json

Mechanics exclusions:
- Drag piece, drag curve segment
- File contents validation

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
