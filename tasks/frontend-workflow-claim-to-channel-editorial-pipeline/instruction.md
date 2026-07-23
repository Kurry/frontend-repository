# Claim-to-Channel Editorial Pipeline

<summary>
A small editorial team turning one fictional source packet into coordinated article, newsletter, and social deliverables. The user decomposes a source packet into claims, binds evidence, routes content cards through drafting and review, creates channel variants, resolves copy and asset conflicts, handles a partial batch failure, approves a release checkpoint, and exports an interoperable publication pack. Every status transition is constrained by evidence, dependencies, and review gates rather than being a cosmetic Kanban move.
</summary>

<core_features>
Claim and evidence graph: Users create claim nodes, drag source excerpts onto them, classify support as direct, contextual, conflicting, or rejected, and connect claims to content blocks. A claim needs at least one direct source before approval. Selecting a source span highlights exact dependent claims/cards/blocks; keyboard source-target binding and mobile selectors match drag behavior. Contradictory direct evidence requires an explicit resolution note.
Constraint-aware production board: Cards move through inbox, sourced, drafting, editorial review, fact review, accessibility review, approved, scheduled, and packaged. Each card has channel, owner persona, due slot, dependencies, claim coverage, variant head, and review requirements. A move previews blockers and downstream effects; invalid drops snap back with an actionable reason. WIP limits and dependency rules are exact. Blocked moves must be graded as no-ops with explanations (visible reason naming constraint, unchanged state on blocked/cancelled drag). Consequential moves propagate to timeline and packaging preview immediately.
Block composer and channel variants: Article/newsletter cards contain ordered heading, paragraph, quote, image, caption, CTA, and metadata blocks. Social cards use a fixed spatial canvas with text/image/safe-area controls. Users fork a block or whole card into channel variants, compare source/text/asset deltas, and merge property-by-property. Character, word, alt-text, image-crop, and required-claim rules update live.
Routed and parallel workflow execution: Starting production routes each card by channel and risk. Fact and accessibility reviews may run in parallel after editorial review; packaging waits for both. Run steps show queued, active, awaiting input, approved, rejected, failed, superseded, or complete. Pause, resume, retry, skip-only-when-optional, and rewind preserve attempt lineage. Rewinding a reviewed claim marks dependent approvals stale.
Deterministic evaluators and review gates: Local evaluators check claim coverage, unsupported wording, channel limits, alt text, reading level, required metadata, and cross-channel consistency. Each result names exact blocks/claims/rules and provides evidence, not hidden reasoning. The reviewer accepts, rejects, edits, or grants a bounded exception with expiry and note. Approval checkpoints freeze card and claim checksums.
Release timeline and batch recovery: Approved deliverables occupy channel lanes on a release timeline; drag changes scheduled slot within fixed windows. Packaging runs as a batch and deterministically fails one social image plus the newsletter metadata on the first attempt. Retry failed-only, replace asset, repair metadata, or cancel remaining keeps successful outputs and attempt logs. No real publication occurs.
Impact and completion analytics: Linked rings and matrices show claim coverage, stale/approved blocks, channel readiness, review workload, and package status. Clicking a segment filters/highlights exact entities. Completion means every required deliverable has current approvals and checksum-valid output; card count alone never implies readiness.
Staleness propagation: After a claim edit, every dependent deliverable block and every channel artifact that cites it (directly or transitively) shows a visible stale marker naming the changed claim, in one committed transition; resolving a stale block clears exactly its marker and no others; a claim edit that reaches zero dependents is itself observable (no markers, artifact unchanged).
</core_features>

<visual_design>
Inspect claim support/conflict, blocked/moving/stale/approved card, block/variant, run/review, timeline, and package states — hierarchy and provenance stay legible.
Empty states: Removing every deliverable from a channel reveals that channel's named empty state in board, timeline, and artifact preview; an all-stale board shows the stale summary, never a green packaged artifact.
Citation exactness: Citations select and highlight the exact claim excerpt; unsupported or dangling claims are flagged with a visible state.
</visual_design>

<motion>
Drag, bind, branch/merge, propagate stale state, schedule, retry, then repeat reduced — causal endpoints and canonical values agree.
Motion numerics and reduced-motion path: Card-move, staleness-wave, and timeline-shift transitions need named durations (150–300ms) with early/settled frame sampling and computed hover deltas; reduced motion is verifiable via a visible chrome toggle or ?reducedMotion=1 fresh load.
</motion>

<requirements>
No API/Backend: All state must be managed in-memory or in local storage (localStorage is forbidden for good-app genre eval, in-memory state only).
Depth-first completion protocol (mandatory): - Complete each subsystem's named outcome, every interaction and visible state, every connected view and derived/artifact effect, then exhaust enhancements, boundary and invalid/empty/conflict cases, recovery/undo/retry, alternate input, responsive behavior, accessibility, motion, and polish before beginning the next group. A feature is incomplete while any connected state, edge case, recovery path, or TODO/shallow placeholder remains.
Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
Add complete recovery and recovery-by-default cases.
Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.
Completion gates (hard): No TODO markers in user-facing behavior. Every feature branch has an explicit observable evidence path. Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated. Zero partial mutation on validation/import failure. Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
Dashboard-derived hardness contract: - Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization.
Exercise adversarial orderings (e.g. edit before/after merge, undo followed by branch, cancel after preview, import after divergent local edits). Equivalent orders must converge. Cancelled actions restore complete prior snapshot.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records before commit, rejecting unknown enums, duplicate/dangling IDs, stale values with zero state mutation.
End state is an interoperable downloadable artifact. Specify exact filenames, schemas, required keys, units, stable sort order, regenerated metadata. Import must restore authored and derived state, and re-export must be semantically identical.
Verify genre-correct reload behavior and isolation (in-memory state only). Separate sessions must not silently share state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format rules. Error copy identifies field, rejected value/rule, and recovery action. Correcting value clears only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while hovered, keyboard traversal/shortcuts (undo/command), modal focus trap, live announcements, reduced-motion causal parity, full canonical flow at mobile viewport (no overflow, min 44px targets).
Performance: max fixture manipulation within 100ms, linked/derived views settle within 500ms, export/import complete within 2s without non-local network dependence.
Author one adversarial browser-observable rubric criterion for every promise and feature group.
Artifact contract: EditorialPipelinePack uses schemaVersion: "editorial-pipeline-pack/v1" and stores fixture/hash, source documents/spans, claims/evidence/resolutions, deliverable cards/dependencies/status/history, ordered content blocks, variant DAG/merge choices, workflow runs/steps/attempts, evaluator results/exceptions/approvals, release slots, package attempts/files, filters/selection/annotations, ordered undo history, derived coverage/readiness/text/asset/package checksums, Markdown/SVG/CSV/file manifest, and UTC exportedAt.
Channel artifacts compile live: Packaged channel artifacts are compiled from current claim and deliverable state on every mutation; block with named diagnostic if packaging touches a stale dependency.
Responsive workflow: Desktop shows board, claim graph, composer, run/review rail. Tablet uses switchable board/graph/composer. Mobile becomes lane stacks, card detail sheets, vertical dependency lineage, numeric social transforms. Export produces canonical JSON, Markdown article, SVG social cards, CSV release manifest, ZIP-like file manifest.
All libraries installed via npm and bundled locally; no CDN imports.
Use Tailwind CSS v4.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>

<reference_screenshots>
</reference_screenshots>
