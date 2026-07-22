---
name: instruction-md-hardening
description: Deepen Harbor task instruction.md files into a complete, evaluator-ready artifact with full state-machine behavior, deterministic edge-case coverage, and end-to-end execution workflows. Use for any request to strengthen, rewrite, expand, or harden instruction.md (including validator, reviewer, and streaming/contract requirements).
---

# Instruction.md Hardening

Use this skill to revise a Harbor task `instruction.md` into a depth-complete spec that is directly testable by browser-visible criteria and deterministic to implement.

## Purpose

- Expand shallow or vague instructions into a complete behavior contract.
- Turn ambiguous behavior into observable states, transitions, and boundaries.
- Add missing evidence, recovery, and failure-flow requirements.
- Keep scope aligned with repo invariants and WebMCP/WebMCP-contract expectations.
- Preserve existing behavior while tightening only missing specification detail.

## Inputs to gather first

- `instruction.md` current body.
- Task metadata and current rubric files.
- Canonical/authoring constraints from repo instructions.
- Existing WebMCP/tooling bindings for the task.
- Any existing issue/proposal context (if this is for an issue brief).

## Core principles

- **Do not rewrite the entire product**; only add precision where intent is implied but under-specified.
- **Do not weaken or bypass rubrics**; only add additive criteria-compatible behavior.
- **Write for the judge and browser**, not implementation details.
- **Use concrete states and deterministic outcomes** (never ambiguous “may” behavior).
- **Depth-first completion**: finish one feature’s state/edges/variants/controls before moving to the next.

## Step 1 — Baseline contract pass

For each existing section, classify current quality:

1. Identify primary user flow(s).
2. List mutable data entities and their states.
3. Map each user action to expected observable response.
4. Detect missing constraints:
   - blocked transitions,
   - timeouts,
   - retry branches,
   - approval gates,
   - cancellation/abort behavior,
   - persistence/import/export requirements,
   - failure states.

## Step 2 — Add end-to-end journey layer

Create or expand sections that explicitly cover all connected journeys:

- Authoring/edit journey (draft -> validate -> ready).
- Dispatch/run journey (queued -> running -> terminal state).
- Approval journey (approve/deny branches and consequences).
- Retry/cancel journey (attempt budgets, backoff, dedupe).
- Resume journey (resume from checkpoint without re-emitting completed work).
- Review journey (reconstruction from export/stream/review artifacts).
- Round-trip journey (export/import → same visible state, import failure safe-fail).

For each journey, include:

- Preconditions.
- Transition table (state + trigger + side effects).
- Terminal outcomes.
- Recovery path.
- One negative test for each path.

## Step 3 — Specify structured runtime model

When a task uses streaming, tools, approvals, or run outputs, add a canonical event/state schema in instruction prose.

Required schema fields to include (or equivalent):

- `runId` (stable per dispatch)
- `phase`
- `status`
- `attempt`
- `toolEvents[]` (name, args, state, result/error, timing, correlation)
- `checkpoints[]` (cursor + persisted digest)
- `streamText`
- `finalOutput`

If the task has no streaming, replace with task-specific equivalent state fields and keep them explicit.

## Step 4 — Lock edge cases and failures

Add explicit failure branches as first-class requirements:

- Validation failure blocks dispatch.
- Duplicate/out-of-order events are ignored or rejected deterministically.
- Partial import must preserve prior state.
- Cancelled states preserve prior output and stop late deltas.
- Invalid credentials/network artifacts are blocked in local/offline modes.
- Missing artifact fields produce explicit diagnostics and explainable fallback.

For each failure class, specify:

- Exact condition.
- Surface signal (UI/text/tool).
- Recovery action.
- Whether this should be blocking or advisory.

## Step 5 — Add deterministic acceptance language

For every added behavior, add behavior that can be judged in-browser:

- concrete action → concrete evidence mapping,
- expected timing/ordering constraints,
- explicit no-op expectations in non-action states,
- accessibility expectations for critical actions,
- layout constraints at desktop + mobile widths.

Avoid implementation claims and backend-only assertions.

## Step 6 — WebMCP and parity requirements (if applicable)

If the task has WebMCP tooling:

- State each tool-to-UI parity rule.
- Require deterministic synchronization between tool invocation and visible UI.
- Require tool-call evidence (args, state, result/error, timestamp) as reviewer-observable output.
- Add mismatch handling when tool output diverges from internal state.

## Step 7 — Validation and review consistency

Ensure instruction updates align with:

- existing rubrics (no criterion drift),
- artifact schemas,
- test names and judge-facing expectations,
- import/export behavior across surfaces.

Do not add criteria IDs here; only define behavior. Keep IDs to rubric editors.

## Deepening checklist (use before finalizing)

1. Have you added preconditions for every major action?
2. Have you defined what happens on failure for every major action?
3. Have you added recovery for every failure path?
4. Is every action idempotent and non-duplicating where relevant?
5. Do approvals explicitly gate progress?
6. Are export/import boundaries explicit and failure-safe?
7. Is there a no-network/explicit-network policy?
8. Are keyboard/focus/responsive requirements explicitly called out?
9. Can every required path be reproduced from exported artifact data?
10. Are all transitions observable without internal-implementation assumptions?

## Editing rules

- Preserve user-provided tone where possible; enrich structure and specificity.
- Keep existing section anchors and conventions where present.
- Keep changes additive and backward compatible unless explicitly requested otherwise.
- Do not add non-testable or unverifiable claims.

## Completion decision

Only mark hardening complete when every section has:

- deterministic states,
- explicit transition logic,
- blocking and non-blocking failure definitions,
- visible evidence per behavior,
- and a clear recovery path.
