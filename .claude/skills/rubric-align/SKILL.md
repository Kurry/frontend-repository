---
name: rubric-align
description: >-
  Align a frontend eval task's four dimension rubrics (tests/{core_features,
  visual_design,motion,technical}/*.toml) with its instruction.md, following
  docs/rubrics.md — instruction↔verifier coverage both directions, positive AND
  negative criteria per dimension, an open-ended judge catch-all per dimension,
  and criteria for the task's assigned kit (microinteractions, chart
  sensitivity, editor round-trips, hydration for meta-framework tasks). Use
  whenever asked to align, update, extend, or audit a task's rubrics, dimension
  tomls, or verifier criteria against its instruction — including after an
  instruction migration, even if the request only says "update the rubrics for
  <task>".
---

# Align a task's dimension rubrics with its instruction

You are editing the four dimension tomls of one task so the rubric and the instruction agree in both directions: everything the instruction promises is graded somewhere, and nothing is graded that the instruction never asked for. docs/rubrics.md is the criterion style guide; this skill is the workflow.

## Inputs to read first

**Blocker check before anything else:** the instruction must contain a non-empty `<webmcp_action_contract>` block. State-setup criteria presume the judge can drive state through the contract's bindings; aligning rubrics against a contract-less instruction produces criteria the judge cannot set up. If the block is missing, STOP and report it — the contract (assignment in `schemas/webmcp-assignments.json`, rendered by `scripts/webmcp_h3.py`) must be added first.

1. The task's `instruction.md` — the contract being graded. List its behavioral promises per section as you read.
2. The task's four tomls: `tests/core_features/core_features.toml`, `tests/visual_design/visual_design.toml`, `tests/motion/motion.toml`, `tests/technical/technical.toml`.
3. `docs/rubrics.md` — you need: the dimension definitions, "Authoring Criteria: From HLI Verifier to TOML", "Open-Ended Judge Catch-All Criterion", and (when the task's kit or genre calls for them) the showcase extensions and Meta-Framework Delivery Criteria (10.m).
4. `docs/distribution.md` — the task's row, to know which kit categories need criteria (domain library asks, celebration moments, delivery mode).

## The alignment passes (do all four)

**Pass 1 — instruction → rubric (coverage).** Every observable promise in the instruction that a real user would care about should map to a criterion in the right dimension (core behaviors → core_features; layout/palette/density → visual_design; transitions/hover/celebration → motion; console/storage/coherence/load → technical). Add criteria for uncovered promises. New-kit promises get the asks from rubrics.md: sort round-trips, large-collection smoothness, drag-to-reschedule, formatting round-trip + undo, chart-redraws-on-input-change, inline per-field validation, hydration-clean console + deep-link parity for meta-framework delivery.

**Pass 1b — user flows and state tracking (the hardest coverage, verify it explicitly).** Isolated single-action criteria are easy; what slips through is end-to-end flow grading. Every multi-step flow the instruction describes gets at least one criterion written as a full scripted probe: starting condition → action sequence → exact evidence, where the evidence spans state surfaces — the immediate count delta measured around the action, the derived surface (KPIs, badges, charts) updating, a second view showing the same datum without reload, and the reload rule for the task's persistence genre (seeded reset for in-memory; facets surviving for storage-mandated tasks — all facets coherently, never a mix). If the instruction promises a flow the rubric only grades step-by-step, add the chained criterion; step criteria don't prove the chain.

**Pass 2 — rubric → instruction (no phantom grading).** Flag and fix criteria that grade behavior the instruction never states. Prefer fixing the *instruction-side gap was already handled by instruction-migrate*; here, if a criterion is genuinely orphaned (references removed features, wrong stack names, old styling system), rewrite it to match the instruction or delete it. Never grade internal implementation ("uses Zustand") — a browser judge can't verify it.

**Pass 3 — polarity and style.** Each dimension keeps at least one positive and at least one negative criterion. Negatives state the bad condition being present and set `negate = true` — never phrase a negated description as an absence (that double-inverts). Every criterion is one observable pass/fail statement with resolved quantifiers; animation/gesture criteria require the real UI control path (never a WebMCP state shortcut, which snaps state and falsely shows no animation); scroll-reveal and intro-animation criteria note fresh-load. Weights: must-have 1.0, nice-to-have 0.5.

**Pass 4 — catch-all.** Every dimension file ends with exactly one open-ended judge catch-all criterion (id `<dim>.catchall`, `negate = true`, binary, weight 1.0), specialized to the dimension, requiring the judge to (a) name the defect, (b) cite concrete browser evidence, (c) answer no if any other criterion in the file already covers it, and (d) apply a "would plausibly matter to a real user" significance bar. Copy the template from docs/rubrics.md and swap the dimension noun.

## TOML mechanics (match the house shape exactly)

- Never touch the `[judge]` header, `[[judge.mcp_servers]]` blocks, or `[scoring]` — edit only `[[criterion]]` entries.
- Entry shape used across this repo:

```toml
[[criterion]]
id = "1.7"
name = "drag_reorder_animates"
description = "After dragging the 'Deep Work' row above 'Reading', the list shows the new order and the move animates rather than snapping"
type = "binary"
weight = 1.0
```

- Keep existing ids stable; new criteria continue the file's id scheme (next free number in the section). `negate = true` goes on negatives. Do not renumber existing entries — ids are provenance.
- `name` is a **descriptive snake_case label** of what the criterion checks (`drag_reorder_animates`, `empty_state_after_last_delete`, `core_features_catchall`) — never a numeric echo of the id like `1_7`. Give every criterion you ADD a descriptive name, and upgrade the numeric names of any criterion you REWRITE while you're touching it (ids still never change). Descriptive names are what humans grep in reward-details output; `1_32` tells a reader nothing.
- Validate every edited file parses and passes the polarity/catch-all checks:

```bash
python3 .claude/skills/rubric-align/scripts/validate_rubric.py tasks/<slug>/tests
```

The validator checks: TOML parses; ≥1 positive and ≥1 negative per dimension; exactly one catch-all per dimension with the required clauses; no negated description phrased as an absence ("does not", "no longer", "never" openers); no internal-implementation phrasing ("uses <library>", "implemented with"); unique ids. Fix every FAIL it reports.

## Report

End with: per dimension — criteria added (with ids), criteria rewritten/deleted and why, the coverage gaps you closed in each direction, and the validator output.
