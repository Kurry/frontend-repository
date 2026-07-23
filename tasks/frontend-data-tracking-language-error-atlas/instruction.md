# Language Error Atlas

<summary>
Archetype: data tracking and productivity
Genre: hard browser app/text-attempt and error-pattern tracker

The user aligns original and corrected text, marks exact error spans, classifies and links them to concepts, compares attempt revisions, groups recurring patterns, schedules contrast exercises, records new attempts, reviews deterministic transfer findings, and exports a portable error corpus and practice plan. Original text, proposed correction, accepted correction, explanation, and later independent performance must remain distinct.

This is not a flashcard deck or grammar checker. The signature interaction is brushing an error span in one attempt while aligned revisions, concept graph, recurrence matrix, sentence diff, practice queue, transfer timeline, and artifacts synchronize to that exact text operation.

Deterministic fixture:
The fictional learner corpus contains 24 short English-as-target-language attempts, immutable prompts, UTF-8 text with punctuation and combining-character cases, 38 expert correction candidates, 16 concepts in a prerequisite graph, four disputed classifications, and a 21-day practice calendar. All evaluator and future-attempt fixtures are local and deterministic.
</summary>

<core_features>
Span-aligned correction editor:
Users select an exact source range and create replace, insert, delete, move, or split/merge correction operations. Operations render an aligned diff and cannot overlap incompatibly. Offsets use Unicode code points with declared normalization. Keyboard range controls and mobile token/range sheets equal pointer selection.

Correction review and branches:
Candidate corrections may have alternatives. Users accept, edit, reject, or branch a correction, preserving author/source, rationale, confidence label, and before/after text. Applying operations produces a derived revision; changing an earlier operation marks downstream offsets stale until deterministic rebase/review. Merge resolves each operation/text conflict explicitly.

Error taxonomy and concept graph:
Accepted corrections bind one primary and optional secondary error type plus one or more concepts. Concepts connect by prerequisite, contrast, or often-confused edges. Cycles reject for prerequisites. Selecting any concept highlights exact spans, corrections, prompts, attempts, and scheduled exercises; graph binding has keyboard/mobile equivalents.

Pattern clustering and recurrence matrix:
Users group accepted errors into named patterns based on learner rule, context signature, and concept set. The matrix crosses pattern/concept against attempt/date and distinguishes occurrence, opportunity-without-error, not-applicable, and unreviewed. Counts and rates use exact denominators; filters never silently drop opportunities.

Contrast exercise composer:
Users assemble deterministic fixture sentence pairs into identify, choose, rewrite, or explain tasks. Each exercise binds target concept/pattern, prerequisite concepts, source error ids, acceptable operation set, and scoring rule. Scheduling uses due date, spacing stage, and conflict with other tasks; edits create versioned exercise definitions.

Attempt and review workflow:
An exercise run moves ready -> active -> submitted -> evaluated -> reviewed -> scheduled-next/complete. Submission text is immutable. The deterministic evaluator returns exact operation alignment and partial-credit components; the user may accept or dispute with span evidence. Retry creates a new attempt, never overwrites a score.

Transfer and mastery evidence:
Transfer views compare error rates only on eligible independent prompts after a practice event. A timeline shows intervention, opportunities, recurrence, and confidence bands using fixed fixture formulas, without claiming general language mastery. Changing classification or opportunity eligibility marks findings stale and requires rerun.

Responsive atlas and artifacts:
Desktop shows text/diff, concept graph, recurrence matrix, and exercise/transfer rail. Mobile becomes attempt cards, token-range/correction sheets, vertical revision/concept lineage, matrix drilldowns, and exercise stepper. Export produces canonical JSON, CSV span/correction/attempt ledger, Markdown contrast practice pack with answer key, and SVG concept/recurrence map; import reconstructs state exactly.
</core_features>

<visual_design>
Responsive Design: Complete at 1440/768/375. Mobile flows retain every action, 44-pixel targets, no overflow. Attempt/range/correction/rebase/concept/matrix/exercise flows adapt appropriately.
Legibility: Inspect source/selected/insert/delete/move/stale/rebased/accepted/rejected, occurrence/opportunity/unreviewed, due/run/score/finding states. Provenance stays legible.
</visual_design>

<motion>
Causal motion: Span highlight/operation diff, stale/rebase mapping, concept/pattern propagation, schedule/score/transfer changes explain cause. Reduced motion retains persistent range and count deltas.
</motion>

<requirements>
- Styling MUST be done with Tailwind CSS 4.3.2.
- All libraries must be installed via npm and bundled locally; no CDN imports.

Artifact contract:
LanguageErrorCorpus uses schemaVersion: "language-error-corpus/v1" and stores fixture/hash/Unicode normalization, prompts/original submissions, correction branch DAG/operations/offset revisions/rebases/decisions, derived text revisions, taxonomy/concept graph/bindings, patterns/opportunity classifications, exercise versions/schedule, run submissions/evaluations/reviews/attempts, transfer analyses/findings, filters/annotations/history, derived diff/rate/score/schedule/artifact checksums, CSV, Markdown, SVG, and UTC exportedAt.
- Text is normalized per declared form; offsets are half-open Unicode code-point indexes and slice exact original/revision strings.
- Correction operations are valid, nonoverlapping under declared rules, and derived text is deterministic; rebases map every affected operation or mark unresolved.
- Correction/concept/exercise branch graphs are acyclic where declared; prerequisite concepts form a DAG.
- Opportunity states are mutually exclusive and pattern rates expose numerator/eligible denominator exactly.
- Exercise submissions are immutable; scores derive from acceptable operations and append-only attempts; disputes preserve original evaluation.
- Transfer membership and formulas use exact post-practice eligible attempts and never conflate unreviewed/not-applicable.
- CSV text/offset/operation rows, Markdown tasks/answers, and SVG nodes/edges/cell counts agree with canonical selected corpus.
- Import rejects fixture/normalization mismatch, out-of-range/stale/overlapping operation, branch/prerequisite cycle, invalid opportunity/score/schedule event, mutated submission, forged derived/checksum, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; CSV, Markdown, and SVG remain byte-identical.

Dashboard-derived hardness contract:
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.

Frontend-native gate:
20-second demo: Select and replace an error span, add an alternative correction, edit an earlier operation until downstream offsets stale, rebase it, bind a concept, group a recurring pattern, schedule a contrast exercise, submit/review a retry, brush its transfer interval, and export the corpus.
- Canonical mutation: Reclassifying or rebasing one accepted span changes derived revision, concept/pattern matrix, eligible exercise schedule, transfer membership/finding, history, WebMCP state, and artifacts.
- Alternate input: Range selection/edit operations, branch/merge/rebase, concept binding, matrix navigation, exercise composition/run/review, transfer brushing controls, and export have keyboard paths.
- Linked views: Original/aligned diff, correction history, concept graph, pattern/recurrence matrix, exercise schedule/runner, transfer timeline, reviewer, and artifacts share one reducer.
- Causal motion: Span highlight/operation diff, stale/rebase mapping, concept/pattern propagation, schedule/score/transfer changes explain cause; reduced motion retains persistent range and count deltas.
- Mobile transformation: Attempt/token-range cards, correction/rebase sheets, vertical concept/revision lineage, matrix drilldowns, and exercise runner preserve the complete job.
- CRUD substitution: Forms cannot express Unicode span operations, aligned revision/rebase, text-to-concept recurrence topology, opportunity denominators, or immutable attempt evaluation.

Depth-first completion protocol (mandatory):
For every subsystem in this proposal, complete it only when there are no unimplemented implication states.
- Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
- Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
- Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
- Add complete recovery and recovery-by-default cases: malformed/partial input, duplicate/lost/late events, approval races, transient and terminal failures, cancellation + resume semantics, import/export drift, no-network constraints in demo mode, runtime/console regressions.
- Revisit with a second pass for critical UX branches: keyboard parity, reduced motion, and 375px behavior.
- If any branch has no explicit behavior, status, or recovery, continue exploring before marking complete.

Completion gates (hard):
- No TODO markers in user-facing behavior.
- Every feature branch has an explicit observable evidence path.
- Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated.
- Zero partial mutation on validation/import failure.
- Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.

Verification, scope, and pilot:
Fresh load shows immutable prompts/submissions/candidate examples with no user correction decision, concept binding, pattern, exercise version/run, transfer review, annotation, or export. WebMCP exposes fixture queries and canonical correction/operation, branch/rebase, taxonomy/concept/pattern, opportunity, exercise/schedule/run, evaluation/review/transfer, history, artifact, transfer, and reset handlers. Browser verification grades real text-range selection/diff, keyboard range paths, graph/matrix linking, focus, motion, responsive transformation, and downloaded CSV/Markdown/SVG parsing.
In scope: One fictional corpus, 10,000 attempts/100,000 operations, bounded concepts/exercises/runs, JSON + CSV + Markdown + SVG.
Out of scope: Real language advice/evaluation, speech/audio, live AI/network, collaboration, accounts, or backend persistence.
</requirements>

<integrity>
</integrity>
<delivery>
</delivery>
<webmcp_action_contract>
</webmcp_action_contract>
