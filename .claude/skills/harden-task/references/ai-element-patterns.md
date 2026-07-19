# AI-app component patterns for the Aether suite (authoring guidance)

These are UI patterns from a reference AI-elements component library, restated as
IMPLEMENTATION-AGNOSTIC observable behaviors. Instructions must describe the behavior,
never a library or component name. Use the patterns that fit each task's features —
these are the interaction vocabulary of a production AI product, and each pattern also
names the state that must live in the task's shared store (Zustand), per the
state-tracking mandate (views derive from the one store; WebMCP handlers drive the
same store commands).

## Streaming response surface
- Simulated generation renders progressively (text appears incrementally, not all at once);
  a status affordance distinguishes waiting / streaming / complete.
- While streaming, the view auto-follows the latest content; if the user scrolls up,
  auto-follow stops and a jump-to-latest control appears; activating it resumes following.
- The submit control changes to a stop control while streaming; stopping freezes the
  output at its current text and re-enables input.
- State: per-run streaming status, accumulated text, follow/paused scroll flag — in the store.

## Prompt input group
- A multiline input grows with content up to a cap; Enter submits, Shift+Enter inserts
  a newline; submit is disabled when the input is empty or a run is streaming.
- A model selector adjoins the input; the selected model is visible at all times and is
  reflected in the resulting run's metadata row.
- A toolbar row carries secondary actions (attach/settings/etc. per task) with tooltips.
- State: draft text, selected model, submitting flag.

## Reasoning / disclosure panel
- A collapsible region labeled as reasoning (or scan detail, scoring detail, etc.) is
  collapsed by default, expands/collapses on activation with a rotation cue on its
  chevron, and remembers its open state per item while the app is open.
- While its parent run is streaming, the disclosure shows an active indicator; when
  complete it shows a duration summary line.
- State: per-item expanded flags.

## Branch / variant navigation
- Where a response or record has multiple variants, prev/next controls plus a position
  label (e.g. 2 of 3) flip between variants; controls disable at the ends; flipping
  variants updates the displayed content and any dependent panels without a reload.
- State: per-item active variant index.

## Tool / step invocation panel
- A run is decomposed into visible steps (tool calls, scan stages, node executions):
  each step shows name, status progression (pending → running → complete/error), its
  input summary, and an expandable output; statuses advance visibly during simulation.
- State: per-step status and output, driven by the same simulated-run machinery.

## Task / progress list
- Long-running simulated work renders as a checklist that ticks items as they complete,
  with per-item status icons and an overall progress indicator; file/entity references
  inside items render as distinct chips.
- State: per-item completion in the store (WebMCP-triggered runs must tick identically).

## Code block
- Code-bearing content renders in a monospaced block with syntax-aware styling, a
  language label, and a copy control that gives visible confirmation (icon swap or
  toast) and puts the exact text on the clipboard.
- State: transient copied-feedback flag.

## Sources / citations
- Content derived from other records (prompts, documents, models) exposes a sources
  affordance: a count trigger opens a list of the contributing items; each links to the
  item's detail view in-app (no outbound navigation).
- State: which sources belong to which record (derived from the store, not duplicated).

## Suggestions row
- A horizontal row of suggestion chips above/below the input; clicking one fills the
  input (or applies the filter) exactly and moves focus appropriately; the row scrolls
  horizontally without vertical layout shift when it overflows.

## Attachments
- Records that carry files (prompts, documents, runs) display attachments in one of
  three visible arrangements as fits the surface: thumbnail grid (visual contexts),
  compact inline badges that reveal a preview on hover, or detailed rows with name and
  type metadata.
- Each attachment shows a type-appropriate preview (image thumbnail, media glyph, or
  document icon fallback), its filename, and — where removal applies — a remove control
  revealed on hover that deletes exactly that attachment with visible feedback.
- Attachments are simulated/seeded data (no real upload backend); an add control lets
  the user pick from seeded assets and the new attachment appears immediately.
- State: per-record attachment lists in the store; hover-preview and remove feedback
  are transient UI state.

## Workflow durability vocabulary (frontend-only)
For tasks with runs, scans, executions, or multi-step simulations, borrow the durable-
workflow mental model, entirely client-side and observable:
- Runs are decomposed into named steps with visible statuses: pending → running →
  complete / failed / retrying / waiting; each step shows attempt count when it has
  retried and a wait reason when sleeping (e.g. "waiting 5s before retry 2 of 3").
- Simulated failures retry automatically with a visible backoff countdown and attempt
  counter; exhausting retries marks the step failed with an inline error summary and a
  manual retry control that resumes FROM THAT STEP, not from the start.
- A run can be paused and resumed: pausing freezes step progression at a checkpoint;
  resuming continues from the exact step where it stopped, with completed steps never
  re-executing (their timestamps/outputs stay frozen).
- Every run has an observable event timeline: an ordered log of step transitions with
  timestamps, filterable by status; selecting a timeline entry highlights its step.
- Run-level rollups derive live from step states (n of m complete, overall duration,
  failure count) and update as steps advance.
- State: run/step statuses, attempts, checkpoints, and the event log all in the store;
  a reload rule per genre (in-memory tasks reset to seeds); WebMCP-triggered runs
  produce the same step/event trail as UI-triggered ones.

## Loader & empty states
- Every async surface has a deliberate loading affordance (spinner/skeleton) and a
  designed empty state naming what belongs there and the control that creates it.

## Cross-cutting state-tracking rules (restate in <requirements>)
- All of the above state lives in the assigned store: run/streaming status, step
  statuses, expanded/collapsed flags, active variant indices, draft inputs, selected
  model, follow-scroll flag, copy feedback, filters/sort/selection, active view, theme.
- Views derive from the one store — flipping a branch, ticking a step, or streaming a
  token never creates a second copy of the data.
- WebMCP tool handlers invoke the same store commands as the visible controls, so a
  contract-driven run streams/ticks/updates identically to a UI-driven one.
