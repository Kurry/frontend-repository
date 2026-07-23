<summary>
Build a Market Stall Flow Planner for a fictional community market organizer to assign stalls and coordinate arrival windows. Use React and Tailwind CSS 4.3.2. The app must provide a framework-agnostic synthesis of adaptive grids, scheduling matrices, resource planning, constraint prediction, approvals, and interruption recovery primitives. All assets must be served locally without CDNs.
</summary>

<core_features>
Feature: Site map and stall geometry —
- Place, rotate, swap, group, or remove exact footprint polygons within zones
- Bounds, clearance, aisle width, entrances, accessible routes, emergency fixture corridors, and reserved zones are visible constraints
- Keyboard grid movement and mobile coordinate sheets equal pointer edits

Feature: Vendor commitments and adjacency —
- Each vendor has footprint family, utility demand, category, arrival duration, equipment needs, preferred/forbidden neighbors, visibility request, and accessibility requirement
- A constraint lens explains satisfied, violated, waived, and unresolved commitments by exact vendor and geometry

Feature: Utility and path overlays —
- Ports have exact capacity; routed connections consume capacity and maximum-length bounds
- Walking/service paths recompute around polygons and cannot cross stalls
- Selecting a path highlights affected vendors, arrival sequence, readiness, and export entries

Feature: Arrival, setup, and departure lanes —
- Schedule vendor vehicle arrival, unload, setup, inspection, open, teardown, and departure blocks on entrance/service lanes
- Spatial route conflicts and temporal overlaps are coupled; boundary-touching is allowed where fixture rules permit
- Locked active blocks cannot move

Feature: Shared equipment allocation —
- Reserve tables, carts, tents, or cable covers by exact unit and interval
- Issue/return events are append-only and quantities remain conserved
- Substitute equipment changes footprint or setup duration and propagates into constraints and readiness

Feature: Scenario branches and live recovery —
- Fork normal, rain, no-show, or blocked-lane layouts; compare capacity, path lengths, utility load, vendor commitment score, lateness, and unplaced vendors
- Merge per stall/vendor
- Approve, advance clock, check in arrivals, trigger a partial setup, then resequence, relocate, substitute, or rollback unissued equipment

Feature: Responsive planner and artifacts —
- Desktop links map, commitment matrix, arrival lanes, resources, and scenario compare
- Tablet uses map/timeline panes
- Mobile uses zone cards, focused map, placement sheet, arrival queue, constraint stack, and recovery stepper with every action preserved
</core_features>

<visual_design>
- Inspect placed/unplaced/selected, clear/conflict/waived, utility/path/load, planned/locked/partial, branch/stale states visually with distinct legible designs
</visual_design>

<motion>
- Move/rotate/swap, reroute, schedule, allocate, compare/merge, check in/recover, then repeat reduced motion with causal endpoints and values agreeing
</motion>

<requirements>
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export
- Interleave UI/WebMCP geometry, vendor/constraint, path/utility, schedule, equipment, branch/approval, clock/check-in/recovery, history, artifact, transfer, reset; canonical state matches
- Artifact contract files: market-plan.json, vendor-assignments.csv, arrival-plan.ics, site-plan.svg, operations-brief.md
- Fresh load shows immutable site/vendor fixtures (42 vendors, 48 stall polygons, 12 site zones, 18 utility ports, 3 entrances, 2 accessible routes, 8 shared-equipment units, 16 arrival windows, 1 rain scenario, 1 no-show, 1 blocked service lane) and no placements
- No NPM local packages or CDNs are allowed; all dependencies must be installed locally.

Dashboard-derived hardness contract. The whole job is incomplete unless the implementation proves every clause below through the proposal's own named entities, canonical mutation, linked views, and portable artifact:
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

Depth-first completion protocol (mandatory)
For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
- Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
- Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
- Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
- Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions.
- Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
- If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates (hard)
- No TODO markers in user-facing behavior.
- Every feature branch has an explicit observable evidence path.
- Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
- Zero partial mutation on validation/import failure.
- Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
