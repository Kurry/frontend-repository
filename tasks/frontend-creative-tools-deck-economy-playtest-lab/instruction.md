# Deck Economy Playtest Lab

<summary>
The user composes card definitions and layouts, builds deck variants, inspects exact draw/resource probabilities, writes effect graphs from safe primitives, runs deterministic turn simulations, records human-fixture playtests, finds dominance/dead-draw/economy issues, branches repairs, approves a set, and exports printable cards, rules, and replayable test artifacts.

This is not a playable card game or image generator. The signature interaction is editing one card’s cost/effect and layout while deck composition, probability curves, effect graph, resource-flow chart, simulation traces, playtest metrics, branch diff, print sheets, and artifacts update together. The UI is built with Vite, React, and Tailwind CSS 4.3.2.
</summary>

<core_features>
Card schema and visual composer
Cards define id, name, type, copies, cost vector, timing, target, tags, effect graph, rules text, flavor, and fixed local art asset. Text/image/stat/icon blocks drag/resize/align within a 63x88-mm safe/bleed canvas. Geometry, overflow, contrast, missing icon/alt, and rules-text parity update live; keyboard/mobile numeric controls equal pointer edits.

Safe effect graph
Users connect typed primitives such as gain, spend, draw, discard, exhaust, move, modify, choose, condition, repeat-bounded, and end. Ports enforce resource/card/player/value types. Cycles reject except declared bounded repeat max 3. Graph execution deterministically produces canonical effect text and trace; manual rules text must agree or be marked explanatory only.

Deck composition and constraints
Deck rows/cards drag among included, sideboard, and excluded groups with copy counts. Total must be 30, type/tag/copy bounds exact, and every referenced card/tag/resource exists. Multiple named deck branches compare composition/cost curve/tag coverage/expected opening states.

Exact probability and economy views
Without replacement, the app computes exact rational probabilities for drawing type/tag/card combinations by turn under fixed mulligan rules. Resource curves show generated/spent/held/wasted values from selected deterministic scenarios. Selecting a probability or flow segment highlights exact cards and trace events; denominators and assumptions are visible.

Deterministic turn simulator
The user chooses deck branch, fixture opponent policy, seed, starting player, and mulligan, then steps draw, gain, action, cleanup phases. Valid plays expose cost/target/effect preview; illegal actions reject. Pause, checkpoint, branch a different action, rewind by creating trace lineage, or replay preserves events and canonical state hashes.

Playtest observation ledger
Fixture or user-simulated tests record deck versions, turns, winner/draw, resource states, cards played/held/dead, decision notes, and issue tags. Imported fixture summaries cannot be edited; annotations and classification decisions append. Metrics distinguish simulated versus observed fixture tests and never pool them silently.

Balance evaluator and revision branches
The deterministic evaluator finds opening-hand dead rate, unpayable card rate, resource flood/starvation, card inclusion/usage, repeated dominance under fixed scenarios, game length, and effect/rules mismatch. Findings cite exact cards/scenarios/traces. Editing a tested card creates a set revision and marks dependent simulations/approval stale; compare/merge resolves card/property/effect/layout conflicts.

Responsive lab and artifacts
Desktop shows card canvas/schema, effect/deck panels, probability/economy views, and simulator/review timeline. Mobile becomes card preview, property/layout sheets, vertical effect graph, deck cards, probability drilldowns, and turn stepper. Export produces canonical JSON, SVG printable cards/imposition sheet, CSV card/deck/test/trace ledger, and Markdown rules/changelog/scenario expectations; import reconstructs state exactly.
</core_features>

<visual_design>
Visual hierarchy must keep selected/overflow/mismatch cards, ports/graphs, included/sideboard/invalid decks, rational/flow charts, and phase/legal/illegal/checkpoint states legible. Stale and approved states are clearly distinguished.
</visual_design>

<motion>
Moving layouts, connecting/executing effects, changing decks/probabilities, drawing/playing/branching traces, and stale/rerun updates must retain explicit cause-and-effect indicators. Under reduced motion, endpoints and paths must agree without animation.
</motion>

<requirements>
Deterministic fixture. The fictional two-player prototype Lantern Guilds uses a 30-card deck, three resource types, five action phases, 18 safe effect primitives, fixed turn/hand/discard/exhaust rules, six starter cards, eight seeded simulation scenarios, and ten playtest summaries. No gambling, real money, or network play exists.

Artifact contract. DeckPlaytestProject uses schemaVersion: "deck-playtest-project/v1" and stores fixture/hash/grid/precision, set/card revision DAG/active/approved heads, card schemas/layout geometry/assets/alt, typed effect graphs/generated text, deck branch DAG/composition/merge choices, exact probability rational values, scenarios/policies/seeds, simulation trace DAG/events/state hashes/checkpoints, fixture/playtest observations/classifications, evaluator runs/findings/reviews, annotations/view state/history, derived schema/layout/effect/composition/probability/economy/metric/artifact checksums, SVGs, CSV, Markdown, and UTC exportedAt.

- Card ids/revisions are unique and immutable after use; schema bounds/copy/deck total/type/resource references exact.
- Layout uses integer micrometers inside bleed/safe regions; text metrics and overflow use bundled deterministic tables.
- Effect graphs have typed valid ports and bounded acyclic execution; traces conserve cards/resources and generated canonical text.
- Probabilities store reduced rational numerator/denominator from declared combination formulas and exact mulligan policy.
- Simulation events are append-only, legal under phase/state, and state hashes reproduce from seed/deck/revision/policy/actions.
- Test version provenance and simulated-versus-fixture denominators remain distinct; approval checksum current.
- SVG card geometry/text/icons, CSV rows/rational/trace values, and Markdown rules/changelog/expectations agree with approved canonical set.
- Import rejects fixture/grid mismatch, invalid card/deck/schema/layout, effect type/cycle/bound error, probability/trace/state conservation forgery, revision/branch cycle, forged evaluation/approval/checksum, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; SVG, CSV, and Markdown remain byte-identical.

All UI libraries must be installed via npm; do not load scripts or styles from CDNs.

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

Gate constraints:
- 20-second demo: Edit a card cost, connect a typed gain/draw effect, trigger rules-text mismatch, repair it, move/resize its stat block, add copies until deck total fails, inspect exact opening probability, simulate and checkpoint a turn, branch another action, classify a dead draw, revise the card, rerun/approve, and export.
- Canonical mutation: Changing one card cost/effect/layout changes rules text, deck constraints/curve, exact probabilities, legal simulation actions/resource flow, test/evaluator freshness, print sheet, history, WebMCP state, and artifacts.
- Alternate input: Card properties/layout, effect binding, deck composition, probability navigation, simulator actions/checkpoints, test classification, branch/merge, and export have keyboard paths.
- Linked views: Card canvas/schema, effect graph/text, deck builder, probability/economy charts, simulator state/trace, playtest ledger, evaluator/branch diff, and artifacts share one reducer.
- Causal motion: Card/layout edits, graph execution, probability/resource shifts, draw/play/trace progression, and stale/rerun states explain cause; reduced motion retains explicit before/after values/paths.
- Mobile transformation: Card/property/layout sheets, vertical effect graph, deck cards, probability drilldowns, turn stepper, and review drawer preserve the complete job.
- CRUD substitution: Forms cannot express spatial card layout, typed effect execution, exact deck probabilities, branchable deterministic traces, or print/test artifact parity.
</requirements>

<integrity>
The task is not a blank canvas. An implementation MUST NOT bypass the stated workflow:

- Bypassing the deterministic schema/geometry/graph/combinatorics/state-machine functions.
- Faking exact creative-schema and replay state propagation with mocked values.
- Persisting to an external backend service instead of the requested artifact output.
- Replacing the 1,000 cards/5,000 effect nodes/500 decks/10,000 traces performance requirement with a trivial scale.

Implement strictly what is specified in this PRD.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- All UI libraries must be installed via npm; do not load scripts or styles from CDNs.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `

</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
