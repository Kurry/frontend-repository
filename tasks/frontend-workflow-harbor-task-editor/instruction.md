# Provenance Task Editor Console

<summary>
Build a dedicated, browser-native Provenance task editor for creating, editing, validating, and versioning Provenance task packages from deterministic fixtures. Use Tailwind CSS 4.3.2.
</summary>

<core_features>
Core objective
- Author and validate Provenance task files with one canonical reducer state.
- Edit all key task surfaces in-app (metadata, prompt, rubrics, solution artifacts descriptors).
- Run synchronous, schema-based validation before saving.
- Export and re-import complete package state as a stable JSON transfer model.
- Keep reviewer workflow and exports in scope as downstream consumers (compatible contract with the companion reviewer task).

Required editor capabilities
Package shell editing
- Maintain one canonical in-memory model for:
  - task.toml fields ([metadata], [evaluator.env], [evaluator], runtime settings)
  - instruction.md
  - README.md metadata fields
  - rubric dimensions and criteria (answer_comprehensiveness, negative_rubrics, plus any required dimension files)
  - solution descriptors (golden_prompt.md, foils/foils.toml, trajectory, artifact expectations)
- Add in-app support for:
  - creating a new task draft from fixture seeds,
  - duplicating from template,
  - reset-to-template,
  - deterministic preview regeneration.

Validation-first editing
- Inline validation with precise messages for:
  - duplicate/non-sequential criterion IDs,
  - fixed 1.x/2.x behavior expectations,
  - missing required dimensions/keys,
  - malformed TOML,
  - payload shape mismatches in foils,
  - forbidden credentials/network artifacts.
- The canonical schema must be enforced before export and before reviewer handoff.

Deterministic export/import
- Export one ProvenanceTaskEditorState JSON with versioned schema and generated metadata.
- Support import that is atomic:
  - malformed import ⇒ prior state preserved,
  - only well-formed payloads applied,
  - round-trip (export→import→export) is stable except regenerated timestamps.

Author workflow
- Show state-driven progress and artifact health in one side panel:
  - readiness,
  - validation failures,
  - stale derived fields,
  - generated/derived file previews,
  - saveability.
- Provide undo, clear, and explicit "safe apply" actions.

API-shaped schema contract
Exported/imported editor state must include at least:
- schemaVersion (required)
- exportedAt (ISO 8601)
- taskSlug (required)
- task object containing:
  - taskToml canonicalized snapshot,
  - instructionMd,
  - rubricFiles and criteria,
  - solutionDescriptors.
- editor object containing:
  - active view,
  - validation report,
  - dirty/dirtySource,
  - generatedAt,
  - file manifest + checksums.
No unknown keys are required to be accepted; extra keys are preserved only when marked extension-safe.

Modal dispatch and live streaming
The editor must support dispatching the active task draft to Modal and reflecting streaming execution results back into the UI and artifact state:
- Include an explicit "Run on Modal" action that sends the current canonical editor snapshot to a Modal worker.
- Show full run lifecycle states: queued, starting, running, streaming, completed, failed, cancelled.
- Stream event payloads into the UI as they arrive (console logs, status transitions, structured event frames, diagnostics, and final verdict signals).
- Persist streamed output in canonical editor state for export/import, replay, and reviewer handoff.
- Preserve previously received events on cancellation/retry; do not lose prior partial output.
- Support checkpointed resume without duplicate event emission.
- Provide retry and cancel controls that update the stream record deterministically.
- When Modal is unavailable, fall back to an in-app mock worker stream that preserves the same event schema and reducer semantics.
- Maintain zero external network behavior outside the intended Modal dispatch path.

Full streaming hardening contract
This workbench/editor must support all streaming semantics end-to-end:
- Tool-call fidelity: render every tool action as a first-class card with name, arguments, state transition, result/error payload, duration, and timestamp.
- Progress gating: when any tool or stage requires approval, execution halts and no downstream mutation occurs until approval is resolved.
- Approval UX: keyboard-accessible Approve/Deny flow; deny branch is explicit and recorded; repeated resolution attempts are rejected idempotently.
- Retries: bounded retries with visible attempt count and exponential backoff; completed work is not replayed on retry.
- Cancellation: abort stream immediately, preserve already emitted events, and emit a terminal cancelled event with no later deltas.
- Checkpoint/Resume: persisted checkpoints allow resume from failure point with event deduplication and no duplicate completed entries.
- Structured output streaming: progressively assemble typed structured output (RunReport, TaskPackage, etc. equivalent per task) instead of only final snapshot.
- Terminal failure: terminal failure surfaces recovery guidance and still preserves partial output/events for debugging.
- Streaming integrity: each run has deterministic idempotent event ordering; event replay from export/import is stable.
- Offline mode: local mock-stream fallback uses identical event schema and reducer logic.
- Verification: all streamed artifacts remain import/export-compatible and replay in reviewer surfaces.

End-to-end execution journeys (required)
This proposal is implemented as one deterministic journey, not disconnected screens. Every user action must be a state transition in a single local reducer and replayed from artifacts.
Authoring journey
1. Open task → load seed/default or import artifact/previous draft.
2. Edit task fields, instruction, rubrics, and solution descriptors.
3. Run inline validation.
4. If blocking issues exist, block run/export and show precise fixable diagnostics.
5. If clean, mark readyToDispatch = true.
6. Save as draft and/or export canonical artifact.
Dispatch journey
1. User clicks Run on Modal (or Run mocked stream when unavailable).
2. App creates immutable runId and writes run lifecycle transition queued → starting → running.
3. Worker/events begin streaming into the live timeline.
4. Each event is appended in order to canonical run.events and visible as: tool-card rows, status deltas, console lines, structured checkpoints, stage outcomes and verdict signals.
Approval branch journey
1. Any event/stage with requiresApproval = true sets run state to awaiting_approval.
2. No downstream state changes are allowed until explicit user action.
3. Approve advances to the next stage; Deny stores branch rationale and follows defined rollback/fix branch.
4. Repeated resolution attempts are ignored (idempotent once resolved).
Retry/cancel journey
1. If a retryable failure occurs, run transitions to failed_retryable with visible attempt count.
2. Retry uses bounded backoff and continues from latest checkpoint.
3. Already-completed steps are skipped; only incomplete steps replay.
4. If user cancels, run transitions to cancelled and hard-stops further events.
5. Existing events remain preserved; canceled/resumed runs carry both finalState and partialOutput.
Resume journey
1. Resume command loads last checkpoint + cursor.
2. The reducer deduplicates events by runId/eventId.
3. Replayed stream continues from cursor only, with no duplicate completed work.
Review journey
1. Reviewer imports artifact bundle or runs from same canonical stream output.
2. Findings + gate statuses are reconstructed from runs, checkpoints, tool events, and state snapshots.
3. Reviewer can override only with explicit rationale and traceability.
4. Review output is written back into the same canonical model.
Round-trip journey
1. Export produces canonical artifact including: editor state, reviews, run timeline/events/checkpoints, checksums/manifests.
2. Import validates full shape/cross-field constraints.
3. Invalid import is rejected without partial state mutation.
4. Valid import rehydrates exactly the same visible state (except regenerated timestamps).

Journey acceptance matrix (required)
Authoring: Deterministic validation feedback updates reducer immediately (Must-happen); Save/export succeeds while blocking errors remain (Must-not-happen).
Streaming: Ordered event timeline and structured tool cards are always visible (Must-happen); Late deltas after cancel/terminal states (Must-not-happen).
Approval: Progress halts until explicit user decision (Must-happen); Silent progress through approval gates (Must-not-happen).
Retry: Resume from checkpoint with deduped events (Must-happen); Replaying already-completed work (Must-not-happen).
Cancel: Preserves all prior events and sets terminal state (Must-happen); Losing partial output or reintroducing events (Must-not-happen).
Review: Same canonical state rendered from export/import and run output (Must-happen); Non-deterministic reconstruction (Must-not-happen).
Round-trip: Stable re-import/re-export for valid payloads (Must-happen); Partial-mutation on malformed import (Must-not-happen).

Depth-first completion protocol (mandatory)
Apply the following before implementation is considered done: for every subsystem, complete its full dependency graph and edge-case tree before moving on.
CORE: Canonical event + run state engine (the root of all features)
- Implement first: Define one typed ProvenanceTaskWorkbenchStateV1 with explicit slices: tasks, activeTaskId, editor, reviewer, runs, artifacts. Enforce a single reducer entrypoint for all mutations.
- Implement all direct connections: Connect every editor field edit -> derived preview -> validation -> toolbar/action availability. Connect every run event -> run timeline -> run summary -> artifact writer. Connect every reviewer import -> reconstructed state -> evidence panels -> export.
- Implement downstreams recursively: Validation pipeline reads schema + cross-field rules. Export/import module reads/writes same reducer snapshots. WebMCP tool layer maps every action into reducer actions and does not mutate directly.
- Edge cases: Duplicate action IDs. Out-of-order events. Action replay after resume. Concurrent reducers and stale closures. Corrupted imported run payloads. Partial stream with terminal error.
- Completion gates for this layer: Deterministic snapshot identity by schemaVersion + taskSlug + clockMonotonic. Action log contains prevVersion, nextVersion, actor, timestamp, cause. Re-importing the same artifact yields byte-stable canonical payload (except timestamps).
SUBSYSTEM: Streaming run pipeline
- Implement first: Add explicit state machine: queued -> starting -> running -> awaiting_approval -> streaming -> retrying -> completed|failed|cancelled -> finalized. Stream ingestion pipeline processes event frames into: tool card list, status feed, checkpoint ledger, structured partial output.
- Expand each connection immediately: On each event: append canonical event and emit UI diff event for rendering. On status change: persist phase/status/attempt and propagate to toolbar, reviewer evidence, and export metadata. On completion/fail: close run ledger, freeze mutating fields, unlock review action set.
- Recursive enhancements: Add bounded retry budget and delay strategy to run scheduler. Add cancellation token propagation path (must stop ingestion, preserve prefix output). Add dedupe guard by (runId,eventId) in reducer. Add fallback mock-worker pipeline that emits same frame schema.
- Edge cases: Double resume invocation. Resume after cancellation. Resume after successful completion. Multiple streams for one run id. Tool timeout + partial output + no verdict. Modal unavailable at dispatch time.
- Completion gates: No events after terminal states. Every terminal state has one terminal summary artifact. Checkpoint and event count remain consistent with UI row count.
SUBSYSTEM: Approval semantics
- Implement first: Model approval as a mandatory transition state in workflow graph. Show blocking banner and disable downstream actions until resolved.
- Explore all connected flows: Tool-level approvals and stage-level approvals. Keyboard-only controls: Enter/Space to select, Escape to cancel/close. Explicit deny branch with reason and reason-required validation before moving forward.
- Recursive enhancements: Anti-double-resolution lock (same approval cannot be resolved twice). Persist decision provenance (actor, time, comment, nextAction). Branch visualization (green path / red path / pending).
- Edge cases: Approval lost from stale event order. Approve after cancel. Deny with empty rationale. Network race where approval arrives after timeout.
- Completion gates: Deny branch is deterministic and visible in reviewer evidence. No downstream run events generated when awaiting unresolved approval.
SUBSYSTEM: Validation + schema compatibility
- Implement first: Real-time validation for required fields and cross-field constraints. Hard block for malformed TOML/JSON/criteria topology.
- Implement every connection: Validation errors drive editor state, run readiness gates, export readiness. Reviewer override requires baseline validation freshness. Import pipeline runs full schema validator before state apply.
- Recursive enhancements: Severity model (error/warn/info) with stable codes. "First error" jump focus and fix-it links. Error provenance per artifact source when importing historical runs.
- Edge cases: Unknown enums. Criterion ID collisions between dimensions. Non-ASCII IDs and whitespace. Malicious oversized payloads.
- Completion gates: All blocking errors resolved before run dispatch. Import failure keeps prior state unchanged.
SUBSYSTEM: Artifact round-trip as source of truth
- Implement first: Single export envelope versioned as provenance-task-workbench/v1. Include all canonical state slices and run event logs.
- Expand connections: Export used by: reviewer reconstruction, run import fallback, checkpoint replay, sharing. Import path: parse -> validate -> migrate -> hydrate store -> re-render all surfaces.
- Recursive enhancements: Manifest checksums and file registry. Deterministic ordering and stable key sorting. Optional compression for run logs with checksum map.
- Edge cases: Missing sidecar files. Duplicate filenames / checksum mismatch. Forward-compat fields.
- Completion gates: export→import→export equivalent for valid bundle (except regenerated generatedAt/exportedAt). Round-trip across both app instances (workbench + reviewer surface) identical.
SUBSYSTEM: Reviewer parity
- Implement first: Reviewer view consumes the same canonical state produced by editor + run execution.
- Implement all implications: Mapping matrix from run event categories to verdict gates. Derived recommendation states with explicit override reasons. Link evidence back to exact tool events and checkpoints.
- Recursive enhancements: Replay timeline scrubber. Side-by-side expected vs actual diff in verdict lane. "Why this verdict?" explanation summary.
- Edge cases: Imported artifacts with partial run logs. Reviewer opened before run completion. Mixed-editor/reviewer local edits in same session.
- Completion gates: Reopening the same artifact yields identical reviewer outcomes.
Subsystem: Frontend resilience and polish
- Implement first: Keyboard-only route for all critical actions. 375/768/1440 layout without overflow.
- Expand everything users expect: Loading/error/retry states per button and stream card. Reduced-motion path with preserved state. Focus visibility and announcements.
- Recursive enhancements: Hotkeys map with configurable shortcuts. Undo stack and history scrubber. Export/Import progress with resumable feedback.
- Edge cases: Memory pressure on 60+ trials. Long-running stream > 5k events. Zero-console-error budget enforced in CI-like flows.
- Completion gates: Keyboard smoke pass for dispatch/approval/retry/cancel/export/import. No horizontal overflow at 375. Zero console/runtime errors in all states.

#Cross-feature invariants to verify before finishing this feature set
- No reducer mutation outside action dispatcher.
- No stream event can change action sequencing order.
- Every terminal state is immutable.
- Reviewer outputs are reconstructible from stream + artifacts without hidden state.
- Modal and mock streams produce schema-equivalent records.
- Explicit "why can't I proceed" diagnostics for every blocked path.
</core_features>

<visual_design>
- All controls operable by keyboard.
- Focus management for modal/pane transitions.
- 375px/768px/1440px render states with no overflow.
</visual_design>

<motion>
- Reduced-motion preserves endpoint behavior.
</motion>

<requirements>
- Implement frontend-only in React/Vite. Use Tailwind CSS 4.3.2.
- Keep all state deterministic and replayable from one reducer store.
- No external network or backend; all logic local to app. No auth flow.
- Use local, in-bundle fixtures and typed local models.
- The app must load its assets exclusively via npm-local packages. Do not rely on external CDNs or unbundled scripts.
</requirements>

<integrity>
The reviewer will verify this task exclusively via browser observations. Internal implementation details (e.g. Redux vs. Context) are unobservable and must not be graded directly.
</integrity>

<delivery>
The solution must be a single, standalone React/Vite web application that can be built via `npm run build` and served.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
