---
name: rubric-align
description: >-
  Align a frontend eval task's thirteen tag-aligned dimension rubrics with its
  instruction.md, following
  docs/rubrics.md — instruction↔verifier coverage both directions, dimension-
  appropriate criterion polarity, an open-ended judge catch-all for innovation,
  and criteria for the task's assigned kit (microinteractions, chart
  sensitivity, editor round-trips, hydration for meta-framework tasks). Use
  whenever asked to align, update, extend, or audit a task's rubrics, dimension
  tomls, or verifier criteria against its instruction — including after an
  instruction migration, even if the request only says "update the rubrics for
  <task>".
---

# Align a task's dimension rubrics with its instruction

You are editing the thirteen dimension tomls of one task so the rubric and the instruction agree in both directions: everything the instruction promises is graded somewhere, and nothing is graded that the instruction never asked for. All thirteen canonical dimension files are required. docs/rubrics.md is the criterion style guide; this skill is the workflow.

The tag-to-dimension map is: `<core_features>` → `core_features`, `<visual_design>` → `visual_design`, `<motion>` → `motion`, `<user_flows>` → `user_flows`, `<edge_cases>` → `edge_cases`, `<responsiveness>` → `responsiveness`, `<accessibility>` → `accessibility`, `<performance>` → `performance`, `<writing>` → `writing`, `<innovation>` → `innovation`, `<reference_screenshots>` → `design_fidelity`, and `<requirements>` → `technical`. `behavioral` is deliberately tag-less.

## Inputs to read first

**Blocker check before anything else:** the instruction must contain a non-empty `<webmcp_action_contract>` block. State-setup criteria presume the judge can drive state through the contract's bindings; aligning rubrics against a contract-less instruction produces criteria the judge cannot set up. If the block is missing, STOP and report it — the contract (assignment in `schemas/webmcp-assignments.json`, rendered by `scripts/webmcp_h3.py`) must be added first.

1. The task's `instruction.md` — the contract being graded. List its behavioral promises per section as you read.
2. Every present canonical toml under `tests/<dimension>/<dimension>.toml`: `core_features`, `visual_design`, `motion`, `technical`, `user_flows`, `edge_cases`, `responsiveness`, `accessibility`, `performance`, `writing`, `innovation`, `design_fidelity`, and `behavioral`. All thirteen are required; the validator FAILs any missing file.
3. `docs/rubrics.md` — you need: the dimension definitions, "Authoring Criteria: From HLI Verifier to TOML", "Open-Ended Judge Catch-All Criterion", and (when the task's kit or genre calls for them) the showcase extensions and Meta-Framework Delivery Criteria (10.m).
4. `docs/distribution.md` — the task's row, to know which kit categories need criteria (domain library asks, celebration moments, delivery mode).

## The alignment passes (do all four)

**Pass 1 — instruction → rubric (coverage).** Every observable promise in the instruction that a real user would care about should map to the tag-aligned dimension above. Add criteria for uncovered promises. New-kit promises get the asks from rubrics.md: sort round-trips, large-collection smoothness, drag-to-reschedule, formatting round-trip + undo, chart-redraws-on-input-change, inline per-field validation, hydration-clean console + deep-link parity for meta-framework delivery.

Read adversarially: for each promise, ask "would any existing criterion actually FAIL a build that violates this?" A vague criterion a violating build could still pass does not count as coverage. Corpus audit found *entire features* ungraded (a prompt workbench with 18 uncovered features — pricing estimator, command palette, undo/redo, bulk export — all promised, none tested). The recurring coverage holes to hunt every time (they hide because the happy path is graded and these are the periphery):
- **Export/artifact content contracts.** An export criterion that only checks "a file downloads" is not coverage — grade the exact SHAPE (every field the instruction names) and that it reflects the session's actual mutations. Especially regenerated stamps (`exportedAt`/`generatedAt` must change per export) and that counts/summaries inside the export equal the visible ones.
- **Secondary import modes.** CSV/JSON/archive/sample-fixture imports beyond the primary path, each with per-field schema-validation rejection naming the offending field (API-shaped-schema mandate).
- **Field-bound contracts.** Every declared bound is its own criterion: max lengths, numeric ranges, closed enums, cross-field rules (allocations sum to 100, min≤max), unique-name constraints — a build accepting an out-of-bound value must fail.
- **Keyboard-shortcut affordances.** Ctrl+Z/Ctrl+Shift+Z undo/redo, Cmd/Ctrl+K palette, digit shortcuts — promised in the instruction, routinely ungraded.
- **Interoperable-export formats** (ICS VEVENT shape, PGN, JSON-Schema draft validity) graded for real downstream usability, not just presence.
- **Boundary values** at the exact threshold the instruction states (the 0.40 band edge, the >120-char truncation, the sum-to-100 gate).

**Pass 1b — user flows and state tracking (the hardest coverage, verify it explicitly).** Isolated single-action criteria are easy; what slips through is end-to-end flow grading. Every multi-step flow the instruction describes gets at least one criterion written as a full scripted probe: starting condition → action sequence → exact evidence, where the evidence spans state surfaces — the immediate count delta measured around the action, the derived surface (KPIs, badges, charts) updating, a second view showing the same datum without reload, and the reload rule for the task's persistence genre (seeded reset for in-memory; facets surviving for storage-mandated tasks — all facets coherently, never a mix). If the instruction promises a flow the rubric only grades step-by-step, add the chained criterion; step criteria don't prove the chain.

**Pass 2 — rubric → instruction (no phantom grading).** Flag and fix criteria that grade behavior the instruction never states. Prefer fixing the *instruction-side gap was already handled by instruction-migrate*; here, if a criterion is genuinely orphaned (references removed features, wrong stack names, old styling system), rewrite it to match the instruction or delete it. Never grade internal implementation ("uses Zustand") — a browser judge can't verify it.

**Pass 3 — polarity and style.** Each dimension keeps at least one positive criterion; negative (`negate = true`) criteria are allowed but never required. When a negative is used, it states the bad condition being present and set `negate = true` — never phrase a negated description as an absence (that double-inverts). **The polarity-bug class to hunt (found live corpus-wide):** a criterion whose description asserts a FAILURE ("shows no hover feedback", "fails to close", "the counts desync") but is missing `negate = true` — it silently rewards the failure (present→1.0). Every criterion whose description describes something BAD must carry `negate = true`; every `negate = true` criterion must describe the bad condition as PRESENT, never as an absence. When you write or review a negative, say the polarity out loud: "this describes a defect, so negate=true; the judge answering 'yes, the defect is present' must score 0." The validator WARNs on the most unambiguous cases but cannot catch "shows no X" ambiguity — that is your job. Every criterion is one observable pass/fail statement with resolved quantifiers; animation/gesture criteria require the real UI control path (never a WebMCP state shortcut, which snaps state and falsely shows no animation); scroll-reveal and intro-animation criteria note fresh-load. Weights: must-have 1.0, nice-to-have 0.5; the `[judge]` weights are 0.5 for Writing and 0.25 for Innovation.

**Pass 4 — catch-all.** Only `innovation` carries a catch-all: exactly one open-ended, positive judge catch-all criterion (id `innovation.catchall`, binary, weight 1.0) requiring the judge to (a) name the enhancement, (b) cite concrete browser evidence, (c) answer no if any other criterion in the file already covers it, and (d) apply a "would plausibly matter to a real user" significance bar. Other dimensions do not need a catch-all. Copy the template from docs/rubrics.md.

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

The validator checks: TOML parses; every dimension has ≥1 positive criterion; Innovation has exactly one positive catch-all with the required clauses; no negated description is phrased as an absence ("does not", "no longer", "never" openers); no internal-implementation phrasing appears ("uses <library>", "implemented with"); ids are unique. Fix every FAIL it reports.

## Report

End with: per dimension — criteria added (with ids), criteria rewritten/deleted and why, the coverage gaps you closed in each direction, and the validator output.
