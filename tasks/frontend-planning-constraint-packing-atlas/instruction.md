# Task proposal: Constraint Packing Atlas

**Proposed slug:** `frontend-planning-constraint-packing-atlas`
**Archetype:** `planning`
**Genre:** `hard browser app/spatial packing planner`
**Source basis:** framework-agnostic use of orchestration canvas, adaptive grid, task progress, prediction, review, schema-renderer, and branching workflow primitives
**Target user:** A fictional group packing shared equipment into bounded bags for a multi-checkpoint trip

<summary>
The user arranges rectangular item footprints inside layered bag compartments, rotates and groups items, assigns ownership, enforces mass/volume/access/incompatibility rules, verifies kit completeness, branches and compares layouts, rehearses checkpoint removal/repacking, and exports exact bag diagrams plus manifests. Item geometry and operational readiness must agree across every view.

This is not a checklist. The signature interaction is dragging an item between compartment layers while packing canvases, center-of-mass indicators, kit graph, checkpoint sequence, owner matrix, conflict ledger, and print artifacts update together.

All libraries installed via npm and bundled locally; no CDN imports. Use Tailwind CSS 4.3.2.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Compartment packing canvas
Items drag, rotate by 90 degrees, and move between top/bottom layers and compartments. Footprints cannot overlap, cross bounds, or occupy a reserved zone. Keyboard arrows/rotate/layer controls and mobile numeric placement sheets equal pointer actions. Invalid placement remains a translucent preview and snaps back with exact conflict ids.

Containment and grouping
Pouches are bounded child containers whose contents move with them and contribute aggregate mass. A group may require co-location but not overlap. Nesting depth is at most two; cycles reject. Removing a pouch from a bag removes its contents from bag readiness without deleting assignments.

Mass, balance, and carrying constraints
Each bag and compartment has mass capacity; each carrier has a personal limit. The canvas shows center of mass and left/right imbalance under an exact 10% threshold. Assigning a bag to an owner updates personal load and shared-weight equity. Geometry, not item order, determines center of mass.

Kit and ownership graph
Items belong to required kits such as shelter, first aid, cooking, navigation, and documents. The graph shows missing, packed, inaccessible, duplicated, and owner-conflicted nodes. Selecting a kit highlights exact canvas items and manifest rows. One item may satisfy multiple kits but exists in one physical location.

Incompatibility, fragility, and access rules
Declared pairs cannot share a bag; fragile items cannot have occupied top-layer footprint above them; liquids require sealed compartments. Checkpoint items need a collision-free removal path from their layer to the compartment opening and may not require removing more than a fixed number of blockers. An access lens animates removal order without mutating layout.

Checkpoint rehearsal workflow
The route has departure, security, trailhead, camp, and return checkpoints. Users rehearse take-out/use/repack events against a logical sequence. Failed access, missing kit, wrong owner, or forgotten repack pauses the run. Retry step, choose another valid removal order, branch the layout, or abandon preserves attempts and cannot duplicate/loss an item.

Layout branches and comparison
Users fork named layouts, compare item positions, bags/layers, owner loads, balance, kit readiness, access blockers, and checkpoint results, then merge nonconflicting item placements property-by-property. A certified layout freezes fixture/layout/checkpoint checksums and becomes stale after any material change.
</core_features>

<visual_design>
Fresh load shows immutable items/bags/kits/checkpoints with empty compartments and no owner assignment, layout branch, rehearsal, certification, annotation, or export. Desktop shows bag canvases, item/kit rail, owner/conflict matrix, and checkpoint timeline.
</visual_design>

<motion>
Item travel, mass/balance shifts, kit edges, blocker removal, and checkpoint progression explain consequences; reduced motion retains explicit delta outlines/order labels.
Item-move, balance-shift, and checkpoint transitions need named durations (150–300ms) with early/settled frame sampling and computed hover deltas on items and compartments; reduced motion is verifiable via a visible chrome toggle or ?reducedMotion=1 fresh load.
</motion>

<requirements>
Deterministic fixture
The fictional four-person expedition has 34 items, three bags, seven rectangular compartments across two depth layers, fixed footprint dimensions/mass, six kits, four checkpoint-required items, three incompatibility pairs, two fragile items, and one shared-weight rule. A valid layout exists. Geometry uses a 1-centimeter grid and integer grams.

Artifact contract
ConstraintPackingPlan uses schemaVersion: "constraint-packing-plan/v1" and stores fixture/hash/grid, bag/compartment geometry/capacity/opening, items/footprints/mass/properties, container nesting, placements/layers/rotations, owner/bag assignments, kits/rules, access paths/removal orders, layout branch DAG/merge choices, rehearsal runs/attempts, certification, annotations/view state/history, derived collision/mass/balance/readiness/access/artifact checksums, SVGs, CSV, Markdown, and UTC exportedAt.
Positions/dimensions are integer centimeters; rotations are 0/90; every item has exactly one location; footprints stay bounded and nonoverlapping.
Container graph is acyclic, depth ≤2, and aggregate footprint/mass/capacity rules hold.
Mass uses integer grams; center of mass and imbalance use declared deterministic rounding; owner limits and shared equity derive exactly.
Incompatibility, sealed, fragility, kit, and access-path/blocker rules reference valid items/compartments.
Rehearsal events are append-only and item conservation holds across every step; certification checksum is current.
SVG footprints/layers/labels, CSV rows, and Markdown checkpoint order agree with canonical certified layout.
Import rejects fixture/grid mismatch, overlap/bounds/capacity violation, nesting cycle, duplicate/lost item, invalid owner/kit/access/run, forged derived/certification/checksum, unsafe SVG, or artifact disagreement atomically.
Canonical re-export changes only exportedAt; SVG, CSV, and Markdown remain byte-identical.

Depth-first completion protocol (mandatory)
For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery-by-default cases:
malformed/partial input,
duplicate/lost/late events,
approval races,
transient and terminal failures,
cancellation + resume semantics,
import/export drift,
no-network constraints in demo mode,
runtime/console regressions.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates (hard)
No TODO markers in user-facing behavior.
Every feature branch has an explicit observable evidence path.
Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
Zero partial mutation on validation/import failure.
Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.

Dashboard-derived hardness contract
The whole job is incomplete unless the implementation proves every clause below through the proposal's own named entities, canonical mutation, linked views, and portable artifact:
Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

Responsive planner and artifacts
Mobile becomes bag mini-maps, item cards, coordinate/layer sheets, vertical access/rehearsal steps, and kit/owner drawers. Export produces canonical JSON, one SVG cutaway per bag, CSV item manifest, and Markdown checkpoint checklist; import reconstructs the layout exactly.

All libraries installed via npm and bundled locally; no CDN imports.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
