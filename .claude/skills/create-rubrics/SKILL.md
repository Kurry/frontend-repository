---
name: create-rubrics
description: >-
  Create and specialize a frontend eval task's complete 15-dimension rubric
  layout under tests/, following docs/rubrics.md and the task's instruction.md.
  Use whenever asked to "create rubrics", "generate dimensions", "scaffold the
  test dimensions", or "specialize rubrics for <task>".
---

# Create a task's complete rubric set

Create all 15 dimension TOMLs for one task, then specialize their scaffolded baselines into browser-observable, task-specific criteria. Treat `docs/rubrics.md` as the criterion specification and `docs/instructions.md` as the instruction-tag contract.

## The 15-dimension canon

| Dimension folder | `instruction.md` XML tag | `docs/rubrics.md` section |
|---|---|---|
| `core_features` | `<core_features>` | §5 |
| `visual_design` | `<visual_design>` | §2 |
| `motion` | `<motion>` | §8 |
| `technical` | `<requirements>` | §10 |
| `user_flows` | `<user_flows>` | §6 |
| `edge_cases` | `<edge_cases>` | §4 |
| `responsiveness` | `<responsiveness>` | §7 |
| `accessibility` | `<accessibility>` | §1 |
| `performance` | `<performance>` | §9 |
| `writing` | `<writing>` | §15 |
| `innovation` | `<innovation>` | §11 |
| `design_fidelity` | `<reference_screenshots>` | §3 |
| `mcp_contract` | `<webmcp_action_contract>` | §12 |
| `anticheat` | no tag; probe secrecy | §13 |
| `behavioral` | no tag; probes derived from `<core_features>` + `<user_flows>` | §14 |

Apply the 1:1 tag-alignment rule: each gradeable instruction tag verifies against its table-assigned dimension, never a legacy folded substitute. A dimension may use another tag only for the two explicitly derived or tagless cases above.

## Inputs to read first

1. Read `docs/rubrics.md` completely, including the dimension definitions, TOML authoring rules, catch-all rules, genre persistence matrix, and §14 probe patterns.
2. Read `docs/instructions.md` completely.
3. Read the task's complete `instruction.md`, including its protected WebMCP block.
4. Inspect every existing `tests/<dimension>/<dimension>.toml` and `tests/reward.toml`; preserve the task's established ID provenance where criteria already exist.

## Workflow

1. Check the 11 newer dimension folders: `user_flows`, `edge_cases`, `responsiveness`, `accessibility`, `performance`, `writing`, `innovation`, `design_fidelity`, `mcp_contract`, `anticheat`, and `behavioral`. If any is missing, scaffold the baselines from the repository root:

   ```bash
   python3 scripts/generate_dimension_scaffolds.py <slug>
   ```

   This generator may arrive in a parallel change; reference this path and do not invent a replacement when it is unavailable.

2. Read `instruction.md` line by line and inventory every observable promise, exact seeded string, quantity, breakpoint, duration, state, and recovery behavior under each gradeable tag.

3. For each tag-aligned dimension, SPECIALIZE the baseline criteria into task-specific observable statements. Cite the exact seeded strings and resolved quantities from that tag's lines. Enforce coverage in both directions: every behavioral line in the tag maps to at least one criterion, and every specialized criterion is grounded in an instruction line. Do not leave generic baseline wording where task evidence exists.

4. Author `behavioral` criteria from `<core_features>` and `<user_flows>` using applicable §14 patterns: a multi-facet reload round-trip that honors the genre's persistence rule, sort reversal, derived-view sensitivity, cross-view echo, immediate count delta, input-dependent output, interleaved flows, and edge-state round-trip. Each probe states the starting condition, action sequence, and exact evidence. Do not force an inapplicable pattern merely to fill a quota.

5. Specialize `mcp_contract` against the task's ACTUAL module names, operations, and bindings in `<webmcp_action_contract>`. Never describe a generic or assumed module assignment.

6. NEVER specialize `anticheat`. Section 13 is intentionally app-agnostic and secret from the builder; leave its baseline criteria verbatim.

7. Keep `writing` self-scoping ("where the app renders …") and nice-to-have. Keep `innovation` self-scoping, optional/bonus, and positive where it rewards work beyond the specification; for fidelity tasks, reward execution quality rather than invention beyond the reference.

## Criterion and file rules

- Keep at least one positive and one negative criterion in every dimension. `anticheat` is the sole exception: all-negative is correct and `[scoring].aggregation` must be `"all_pass"`.
- Keep exactly one criterion whose ID ends in `.catchall` per file. Use the positive form for `innovation`; use the strict unambiguous-deception form for `anticheat`; use a negative catch-all everywhere else.
- State the bad condition as PRESENT in every `negate = true` description. Never state an absence and then negate it, which double-inverts the result.
- Require the real UI control path for animation and gesture criteria. Require a fresh page load for intro or scroll-reveal checks because prior scrolling pollutes reveal state.
- Grade browser-observable evidence only. Never claim internal implementation or stack identity such as "uses React" or "implemented with Zustand".
- Use criterion weight `1.0` for must-haves and `0.5` for nice-to-haves. Criterion weight `0.25` is invalid.
- Keep criterion IDs and descriptions unique within each file.
- Keep canonical `[judge]` content byte-identical across all 15 files. The only permitted per-dimension header line is its canonical judge `weight`: `innovation` uses `0.25`, `writing` uses `0.5`, and other generated values remain as scaffolded. Do not alter any other `[judge]` or `[[judge.mcp_servers]]` byte.

## Validate

Run the bundled structural validator from the repository root:

```bash
python3 .claude/skills/create-rubrics/scripts/validate_dimensions.py tasks/<slug>
```

Fix every `FAIL`. A missing `reward.toml` anti-cheat gate propagation may appear as `WARN` while the parallel corpus change is incomplete.

Then run the corpus validator:

```bash
cd tools/corpuscheck && .venv/bin/python -m corpuscheck.cli validate <slug>
```

