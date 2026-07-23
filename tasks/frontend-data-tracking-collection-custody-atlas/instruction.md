<summary>
Build a spatial provenance and custody tracker for a fictional small collection curator tracking objects, evidence, displays, condition, and custody using React, Tailwind CSS 4.3.2, and Vite. The app is a framework-agnostic synthesis of memory timelines, source/citation cards, network graph, task pipeline, review, scheduling matrix, schema, and actor-state primitives. It must produce a portable CollectionCustodyDossier artifact after cataloging objects, assembling provenance chains, marking condition regions, arranging display cases, scheduling rotations, executing loans with chain-of-custody, and certifying the state.
</summary>

<core_features>
Feature: Object catalog and evidence —
- Object records display title, creator, date range, medium, dimensions, identifiers, tags, environmental class, and an immutable fixture image placeholder
- Users can bind exact source spans to assertions, classifying them as direct, contextual, conflicting, or rejected
- Unsupported required assertions remain visible and explicitly block certification
- Binding evidence supports full keyboard and mobile navigation paths from source to target

Feature: Provenance chain graph —
- Users place ownership, custody, and location events on a timeline and connect source evidence
- The graph strictly prevents incompatible overlapping intervals; gaps and conflicting claims are explicitly rendered
- A disputed interval branches into alternative interpretations; choosing one interpretation never deletes the alternative branch
- Scrubbing the timeline dynamically synchronizes the graph, object card, source spans, and location map

Feature: Condition annotation —
- Users can draw rectangular or polygonal regions on a fixed front/back outline to mark conditions
- Users classify each region's finding, severity, observed time, source, and status
- Repeat inspections allow visual comparison of regions and values across time
- Resolving a finding automatically appends evidence and preserves the original geometry
- An object with a stale condition review is strictly blocked from entering declared display or loan states

Feature: Exhibit case layout —
- Objects can be dragged, rotated 90 degrees, and placed into rectangular footprints on case shelves
- Cases strictly enforce spatial bounds, overlap prevention, weight limits, environmental class, light sensitivity, adjacency incompatibility, and label clearance rules
- Keyboard placement and mobile coordinate entry perfectly match the outcome of pointer drag gestures
- Selecting a theme highlights required objects and visually flags any provenance or condition gaps

Feature: Rotation and exposure planner —
- Display intervals occupy object and case timelines, accumulating fixture light and exposure points over time
- Users can move and resize rotations under constraints for maximum continuous and cumulative exposure, rest periods, case availability, and theme date rules
- Editing an interval provides an immediate preview of affected inspections, tasks, exhibit coverage, and loan conflicts

Feature: Loan and chain-of-custody workflow —
- A simulated loan progresses through explicit states: proposal, review, condition-out, packed, custody transfer, in-transit, received, displayed/held, return transfer, condition-in, closed
- Each checkpoint requires an exact object set, responsible fictional actor, logical time, seal id, and attached evidence
- Transfer changes custody atomically only after both sides confirm the exact identical manifest checksum

Feature: Discrepancy and partial-failure recovery —
- Fixture failures include a mismatched seal and one object missing from a received manifest
- The workflow preserves successful object checkpoints but strictly blocks custody completion for the affected manifest
- Users can reconcile evidence, correct and reissue a manifest revision, return the affected object, or roll back the pending transfer without duplicating custody events

Feature: Responsive atlas and artifacts —
- The desktop layout presents the catalog/provenance graph, case layout, condition/rotation, and custody workflow together
- The mobile layout reflows into object/source cards, vertical provenance/custody lineage, condition coordinate sheets, case mini-maps, and rotation/checkpoint steppers
- Export produces a canonical JSON artifact (CollectionCustodyDossier), a CSV object/provenance/condition/custody ledger, SVG case/condition maps, and a Markdown catalog/exhibit/loan report
- Import reconstructs the exact state perfectly, rejecting invalid checksums, overlapping intervals, or mismatched rules atomically
</core_features>

<visual_design>
- Implements clear visual distinction for supported, conflicting, gap, and disputed provenance states to maintain legibility in the graph
- Clearly renders condition annotation regions with distinct styling for open, resolved, and stale states
- Visually flags placed vs. conflicted items in the exhibit case layout
- Represents accumulated exposure on the timeline with clear danger/threshold indicators
- Checkpoints and custody workflows display clear visual states for mismatch, pending, transferred, and certified
</visual_design>

<motion>
- Causal motion explains the cause of object travel, provenance branches, condition overlays, exposure progression, manifest/custody transfers, and discrepancy rollbacks
- When reduced motion is requested, all animations are disabled while retaining location, status, and delta traces that agree with custody outcomes
</motion>

<requirements>
- All assets must be bundled locally. Do not load resources from external CDNs. Use npm to install any dependencies.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded
- Use the exact seeded deterministic fixture scale: 30 objects, 12 creators/sources, 44 provenance documents with exact spans, 4 display cases, 2 storage zones, 6 environmental classes, 8 condition findings, 3 exhibit themes, 1 disputed ownership interval, and 2 deterministic loan failures.
- Keyboard and direct manipulation paths must converge to one canonical event with identical stable IDs, derived values, linked-view selection, and history
- Treat every import mode as an atomic transaction; reject known invalid states (unknown enums, duplicate IDs, corrupted manifests) with zero state mutation
- Transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence; persisted state must survive page reload exactly
- At the maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked views within 500 ms, and export/import within 2 s without dropped interactions
</requirements>

<integrity>
The solution must strictly maintain the core architecture rules.
</integrity>
<delivery>
- Submit via `solution/app` with all code and build scripts
- Make sure `npm run build` succeeds and produces `dist/`
</delivery>
<webmcp_action_contract>
</webmcp_action_contract>
