<summary>
The user catalogs pieces and material provenance, places them on kiln shelves, enforces footprint/height/clearance/glaze constraints, composes a staged firing curve, assigns witness fixtures, starts a deterministic batch, handles sensor/deviation and piece-defect events, branches refire or quarantine decisions, reviews outcomes, and exports exact load, firing, and provenance artifacts. This is not an inventory or chart dashboard. The signature interaction is dragging a piece on a shelf and reshaping a firing-curve segment while clearance, shelf load, glaze adjacency, witness placement, predicted fixture outcomes, batch eligibility, provenance, result mapping, and artifacts update together.
</summary>

<reference_screenshots>

</reference_screenshots>

<core_features>
- Piece and material provenance: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Pieces store id, footprint polygon fixture, height band, mass grams, clay lot, glaze lots/surfaces, firing stage, owner code, and status. Source lot cards link material properties and prior fixture results. Editing a tested material assignment creates a piece revision and marks dependent plans/results stale without rewriting batch snapshots.
- Shelf load canvas: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Pieces drag/rotate in 15-degree increments across shelves. Placement enforces bounds, pairwise clearance, shelf-post exclusion, load grams, height/overhang, and orientation rules. Keyboard nudge/rotate/shelf controls and mobile coordinate sheets equal pointer gestures. Invalid placements remain preview-only.
- Glaze and adjacency graph: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Edges identify forbidden adjacency, required separation, shared catch tile, or allowed pairing by glaze/clay fixture combination. Distance derives from footprint polygons. Selecting a rule highlights exact pieces/shelf regions and prior evidence cards. Contradictory manual exceptions reject; allowed exceptions require fixture type and note.
- Witness and sensor placement: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Witness fixtures occupy bounded shelf regions and must cover declared low/mid/high zones without collision. Sensor channels bind fixture shelf positions. Moving pieces or witnesses updates coverage and predicted readings. A firing plan cannot be approved with missing coverage or occupied sensor region.
- Firing-curve composer: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. The curve is ordered ramp, hold, controlled-cool, and natural-cool segments with start/end temperature fixture units, rate, duration, and stage tags. Handles drag on time/temperature axes; keyboard/numeric controls equal pointer. Segments must be continuous, satisfy bounds/rate/hold/total-duration rules, and include required stages for loaded materials.
- Deterministic prediction and comparison: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Fixture functions map material lots, shelf zones, witness coverage, and sampled curve into predicted result labels and energy points. Predictions are clearly simulated. Users fork plans, compare placements, adjacency, shelf loads, curve segments/samples, witnesses, predictions, time, and energy, then merge property/range conflicts.
- Batch execution and partial results: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Execution advances reserve pieces -> precheck -> ramp/hold/cool segments -> unload inspection -> reconcile. Logical clock and sampled sensor readings are deterministic. Fixture events include one sensor dropout, a hold deviation, and two piece defects. Pause/recover sensor, accept bounded deviation, branch remaining curve when allowed, abort, quarantine pieces, or create a refire plan preserves attempts/snapshots.
- Responsive studio and artifacts: Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end. Desktop shows shelves, piece/material rail, curve/witness views, and batch/result panel. Mobile becomes shelf mini-maps, piece coordinate cards, vertical adjacency/witness lineage, curve segment sheets, and batch stepper. Export produces canonical JSON, SVG shelf maps and curve/result report, CSV piece/material/batch/sensor ledger, and Markdown load/firing/unload runbook; import reconstructs state exactly.
</core_features>

<visual_design>
- Hierarchy stays legible when inspecting selected/preview/collision/clearance/load/height/incompatible, uncovered/witnessed, curve/finding, active/deviated/defect/quarantine/refire states.
- The visual design includes distinct visual cues for different item statuses (e.g. valid, preview-only invalid, conflicting adjacency).
</visual_design>

<motion>
- Move/rotate, propagate distance/coverage, reshape/sample curve, advance/deviate/recover batch, then repeat reduced. Causal endpoints and values agree.
- Causal motion: Piece travel, distance/coverage propagation, curve-handle sampling, batch progression/deviation, and result/refire flow explain cause. Reduced motion retains before/after regions/values/status.
</motion>

<requirements>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization.
- Exercise adversarial orderings (canonical edit before/after merge, undo followed by branch, cancel after preview). Equivalent orders must converge; cancelled actions restore complete prior snapshot.
- Treat every import mode as an atomic transaction. Validate all records/fields before commit. Reject unknown enums, exact-boundary violations, duplicate IDs, contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the end state an interoperable downloadable artifact of the session's actual work with exact filenames, schemas, required keys, units, precision, stable sort order, relationship integrity, and regenerated generatedAt / exportedAt. Import restores state; re-export is identical except regenerated metadata.
- Verify genre-correct reload behavior and isolation: persisted state must survive reload exactly; transient states must not leak into persistence. Separate sessions/import attempts must not silently share state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field. Error copy must identify the field, rejected value/rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal, modal focus trap/return, live announcements, non-color evidence, reduced-motion causal parity.
- Direct manipulation acknowledges within 100 ms, linked/derived views settle within 500 ms, and export/import complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
- Complete 1440/768/375 responsiveness. Mobile flows retain every action, 44-pixel targets, no overflow. Mobile becomes shelf mini-maps, piece coordinate cards, vertical adjacency/witness lineage, curve segment sheets, and batch stepper.

- The application must use Tailwind CSS 4.3.2.
- The application must follow the npm-local/no-CDN rule.

- Depth-first completion protocol (mandatory): For every subsystem in this proposal, complete it only when there are no unimplemented implication states. Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions. Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions. Explore each dependency recursively, then explore how each loops back through shared state and event timelines. Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions. Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior. If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.
- Completion gates (hard): No TODO markers in user-facing behavior. Every feature branch has an explicit observable evidence path. Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated. Zero partial mutation on validation/import failure. Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
</requirements>

<integrity>
- KilnFiringProject uses schemaVersion: "kiln-firing-project/v1" and stores fixture/hash/logical clock/grid, kiln/shelves/posts/zones/capacities, piece revisions/footprints/material lots/status, plan branch DAG/placements/rotations/heights/merge choices, adjacency rules/exceptions, witnesses/sensors/coverage, firing segments/sampled curve/stages, predictions/reviews/approval, batch snapshots/events/attempts/readings/deviations/results/quarantine/refire lineage, annotations/view state/history, derived geometry/distance/load/coverage/curve/prediction/artifact checksums, SVGs, CSV, Markdown, and UTC exportedAt.
- Canonical re-export changes only exportedAt; SVG, CSV, and Markdown remain byte-identical.
</integrity>

<delivery>
- In scope: One fictional kiln model, 500 pieces/20 shelves/5,000 samples/500 batches, JSON + SVG + CSV + Markdown.
- Out of scope: Real ceramics/safety advice or kiln control, arbitrary materials/models, commerce, collaboration, accounts, network, or backend persistence.
</delivery>

<webmcp_action_contract>

</webmcp_action_contract>
