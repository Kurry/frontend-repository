<summary>
Material Cut-Nesting Planner.
A hard browser app / spatial fabrication planner where a user arranges rectangular project pieces onto bounded stock sheets under declared fixture rules.
The user places and rotates pieces on stock, honors kerf/grain/edge/defect constraints, draws guillotine cut order, tracks parent/child offcuts, allocates project parts, simulates cutting with failures and recovery, compares nesting branches, certifies one plan, and exports exact cut diagrams plus inventory/manifests.
Built with Tailwind CSS 4.3.2. Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies.

Deterministic fixture:
The fictional project requires 26 rectangular pieces from four materials. Inventory contains six stock sheets and five offcuts, fixed integer-millimeter dimensions/thickness/grain/cost, eight rectangular defect regions, edge-quality rules, 3-mm kerf, and deterministic execution failures. A valid plan exists using four sheets.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
- Stock-sheet nesting canvas: Pieces drag on a 1-mm grid and rotate 90 degrees only when grain permits. Placements include exact x/y/width/height/orientation and must stay inside usable stock after edge margin, avoid defects/other pieces by kerf clearance, and match material/thickness. Keyboard nudge/rotate and mobile coordinate sheets equal pointer gestures.
- Project part allocation: Required parts have part number, quantity, dimensions, material, thickness, grain, visible-edge requirements, and assembly group. Each required instance binds exactly one placement. Duplicating a placement cannot satisfy two instances; unallocated required parts and over-allocated parts are named states; completeness never reports 100% with an unplaced required part or an invalid cut tree. Selecting an assembly highlights all sheets/cuts/manifest rows.
- Guillotine cut-tree editor: Users draw full-length horizontal or vertical cuts across the current rectangular region. Each cut consumes kerf and creates exactly two child regions; later cuts belong to a selected leaf. Piece placements must end in separable leaves under declared trim rules. The tree, sheet lines, and sequence timeline share selection. Crossing/non-guillotine/orphan cuts reject. Every edit preserves edge-to-edge guillotine validity: a cut that would create a non-guillotine remainder is blocked with a visible reason naming the invalid segment.
- Grain, edge, defect, and support lenses: Lenses display grain direction, required visible edges, defect/clearance regions, and support risk. A visible-edge piece must bind a qualifying original-stock edge or declared finish operation. During sequence simulation, the next cut must leave both resulting regions supported under fixture thresholds.
- Offcut lineage and inventory: Unconsumed leaf regions above minimum dimensions can be retained as named offcuts. Retaining is proposed until execution confirms the producing cuts. Consumed, reserved, produced, scrapped, and available stock quantities/areas reconcile exactly; no offcut may exist before its parent cut succeeds. Offcut lineage is deterministic and never rewritten; re-nesting consumes offcuts by id without mutating their provenance.
- Cost and waste analysis: Linked charts show purchased area/cents, part area, kerf loss, defect exclusion, reusable offcut, and scrap by sheet/material/project. Waste percentage uses declared denominator and precision. Area and cost math states units, precision, and the kerf/waste model explicitly; the cost view reconciles against the artifact to the stated precision after every edit. Branch comparison separates cost, raw waste, reusable yield, cut count, and completeness.
- Execution and recovery workflow: Workflow reserves sheets -> verifies setup -> executes cuts in tree order -> labels parts/offcuts -> reconciles output. Executed cuts append to execution history and are immutable to later nesting edits. Recovery preserves completed cuts; retry reuses inputs and attempt history, increments attempt counts exactly once per retry.
</core_features>

<user_flows>
Allocate, nest, constrain, cut sequence, offcuts, cost, execute, fail, recover, certify, export, reset, import.
</user_flows>

<edge_cases>
Test exact touching, kerf, margin, grain rotation, defect boundary, duplicate part instance, non-guillotine cut, crossing cut, orphan cut, support threshold, tiny offcut, damage after completed cut, area remainder, cents remainder, forged import with named recovery.
</edge_cases>

<visual_design>
Placement and cut edits propagate to all nine surfaces in one transition. Dragging or resizing a piece placement or cut line must update collision/waste state, grain lens, defect clearance, cut-tree validity, offcut inventory, project completeness, execution state, cost, and artifacts together, with the previous placement gone from every surface; waste and cost recompute from the new nesting immediately.
Collision, defect, and grain violations are graded no-ops. Placing a piece overlapping another piece, a declared defect region, or the sheet boundary, or violating grain direction/edge-quality constraints, is blocked with a visible diagnostic naming the exact violated constraint and region, and zero mutation; a cancelled mid-drag leaves everything untouched.
Inspect selected, preview, overlap, grain, edge, defect, kerf, leaf, cut, support, reserved, produced, scrap, failed, and certified states with legible hierarchy.
</visual_design>

<motion>
Motion numerics, testable reduced motion. Placement, cut, and offcut-split transitions need named durations (150-300ms) with early/settled frame sampling and computed hover deltas.
Reduced motion via a chrome toggle, never browser emulation.
Move, rotate, split cut regions, reroute tree order, produce, scrap offcut, recover failure, then repeat reduced, causal endpoints agree.
</motion>

<responsiveness>
Complete at 1440, 768, 375 with mini-map, piece, coordinate, cut, offcut, execution mobile flows retaining every action, 44-pixel targets, no overflow.
</responsiveness>

<accessibility>
Place/rotate pieces, draw cuts via coordinate controls, navigate tree/order/lenses, retain offcuts, compare, recover, certify, and export without pointer focus matching state.
</accessibility>

<performance>
Operate 500 pieces, 50 sheets, 1000 cuts, and 100 branches or attempts where interaction remains responsive and stale geometry calculations cancel.
</performance>

<writing>
Trigger every geometry, material, cut, inventory, execution conflict with copy naming exact part, sheet, region, cut, dimension, rule, offcut, event and recovery.
</writing>

<innovation>
Move one part or cut where nesting geometry, separability, cut lineage, offcut inventory, waste/cost, execution recovery, and artifacts remain coherent.
</innovation>

<requirements>
Tailwind CSS 4.3.2 is required.
Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies.
Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
Mobile becomes sheet mini-maps, piece/coordinate cards, vertical cut-tree lineage, stock/offcut ledger, and execution stepper.
Desktop shows sheet canvases, parts/stock rail, cut tree/sequence, and cost/execution panel.
Export produces canonical JSON, SVG per sheet with cut order, CSV part/stock/offcut/cost ledger, and Markdown cut list; import reconstructs state exactly.
MaterialCutPlan uses schemaVersion: "material-cut-plan/v1".
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright - no partial credit for a build that does not come up.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
