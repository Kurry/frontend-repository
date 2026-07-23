---
name: rubrics
description: >-
  Create, specialize, and align a frontend eval task's complete 13-dimension
  rubric layout under tests/, following docs/rubrics.md and the task's
  instruction.md — scaffolded-baseline specialization, instruction↔verifier
  coverage both directions, dimension-appropriate criterion polarity, an
  open-ended judge catch-all for innovation, and criteria for the task's
  assigned kit (microinteractions, chart sensitivity, editor round-trips,
  hydration for meta-framework tasks). Use whenever asked to "create rubrics",
  "generate dimensions", "scaffold the test dimensions", or "specialize
  rubrics for a task", AND whenever asked to align, update, extend, or audit a
  task's rubrics, dimension tomls, or verifier criteria against its
  instruction — including after an instruction migration, even if the request
  only says "update the rubrics for a task".
---

# Rubrics: create and align a task's 13-dimension rubric set

One skill, two modes. Pick the mode from what the task actually needs:

- **Mode A — Create rubrics from scratch**: the task is missing dimension
  folders or its files still carry scaffolded generic baselines. You scaffold
  what's missing and specialize every baseline into task-specific,
  browser-observable criteria.
- **Mode B — Align existing rubrics with instruction.md**: all thirteen files
  exist with task criteria, and the job is coverage/consistency — everything
  the instruction promises is graded somewhere, nothing is graded that the
  instruction never asked for.

Route by request: "create/generate/scaffold/specialize rubrics" → Mode A;
"align/update/extend/audit rubrics against the instruction" (including after
an instruction migration) → Mode B. When in doubt, run Mode A's
specialization checks first, then Mode B's four alignment passes — they
compose. Both modes share the criterion rules, polarity doctrine, TOML
mechanics, and validators at the end of this file. Treat `docs/rubrics.md` as
the criterion specification and `docs/instructions.md` as the
instruction-tag contract throughout.

## The 13-dimension canon (both modes)

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
| `behavioral` | no tag; probes derived from `<core_features>` + `<user_flows>` | §14 |

Apply the 1:1 tag-alignment rule: each gradeable instruction tag verifies
against its table-assigned dimension, never a legacy folded substitute. A
dimension may use another tag only for the two explicitly derived or tagless
cases above. All thirteen canonical dimension files are required; the
validator FAILs any missing file.

## Inputs to read first (both modes)

**Blocker check before anything else (Mode B especially):** the instruction
must contain a non-empty `<webmcp_action_contract>` block. State-setup
criteria presume the judge can drive state through the contract's bindings;
authoring or aligning rubrics against a contract-less instruction produces
criteria the judge cannot set up. If the block is missing, STOP and report it
— the contract (assignment in corpuscheck `schemas/webmcp-assignments.json`,
rendered by `uv run corpuscheck webmcp apply`) must be added first.

1. Read `docs/rubrics.md` completely, including the dimension definitions,
   TOML authoring rules ("Authoring Criteria: From HLI Verifier to TOML"),
   catch-all rules ("Open-Ended Judge Catch-All Criterion"), genre
   persistence matrix, §14 probe patterns, and (when the task's kit or genre
   calls for them) the showcase extensions and Meta-Framework Delivery
   Criteria (10.m).
2. Read `docs/instructions.md` completely.
3. Read the task's complete `instruction.md`, including its protected WebMCP
   block. List its behavioral promises per section as you read.
4. Inspect every existing `tests/<dimension>/<dimension>.toml` and
   `tests/reward.toml`; preserve the task's established ID provenance where
   criteria already exist.
5. `docs/distribution.md` — the task's row, to know which kit categories need
   criteria (domain library asks, celebration moments, delivery mode).

---

## Mode A — Create rubrics from scratch

### Workflow

1. Check the 9 newer dimension folders: `user_flows`, `edge_cases`,
   `responsiveness`, `accessibility`, `performance`, `writing`, `innovation`,
   `design_fidelity`, and `behavioral`. If any is missing, scaffold the
   baselines from the repository root:

   ```bash
   uv run corpuscheck scaffold <slug>
   ```

   This generator may arrive in a parallel change; reference this path and do
   not invent a replacement when it is unavailable.

2. Read `instruction.md` line by line and inventory every observable promise,
   exact seeded string, quantity, breakpoint, duration, state, and recovery
   behavior under each gradeable tag.

3. For each tag-aligned dimension, SPECIALIZE the baseline criteria into
   task-specific observable statements. Cite the exact seeded strings and
   resolved quantities from that tag's lines. Enforce coverage in both
   directions: every behavioral line in the tag maps to at least one
   criterion, and every specialized criterion is grounded in an instruction
   line. Do not leave generic baseline wording where task evidence exists.

4. Author `behavioral` criteria from `<core_features>` and `<user_flows>`
   using applicable §14 patterns: a multi-facet reload round-trip that honors
   the genre's persistence rule, sort reversal, derived-view sensitivity,
   cross-view echo, immediate count delta, input-dependent output,
   interleaved flows, and edge-state round-trip. Each probe states the
   starting condition, action sequence, and exact evidence. Do not force an
   inapplicable pattern merely to fill a quota.

5. Keep `writing` self-scoping ("where the app renders …") and nice-to-have.
   Keep `innovation` self-scoping, optional/bonus, and positive where it
   rewards work beyond the specification; for fidelity tasks, reward
   execution quality rather than invention beyond the reference.

### Handling pre-existing criteria vs adding new ones

Every dimension file you open already contains criteria — either the
scaffolded baselines (the 9 newer dimensions) or hand-authored task criteria
(the original four). Treat them differently:

- **Scaffolded baselines (generic wording, no task nouns):** specialize in
  place — keep the id, rewrite the description around the task's actual
  surfaces and seeded strings, upgrade the name to a descriptive snake_case
  label. A baseline that genuinely cannot apply to this task (e.g. a drag
  criterion in an app with no drag) is DELETED, not left as dead generic text —
  but first check whether the instruction implies a genre-equivalent to
  specialize toward instead.
- **Hand-authored existing criteria (task nouns already present):** preserve
  them. Never delete or renumber; ids are provenance. Reword only to fix a
  rule violation (stack identity, double-inverted negation, unresolved
  quantifier), and upgrade numeric names when touching a criterion anyway.
- **Add** a new criterion only when an instruction promise has no home in any
  existing criterion — continue the file's id scheme (next free number).
  Before adding, check the OTHER dimension files: a promise already graded in
  its tag-aligned home must not be duplicated into a second dimension.
- Never let specialization shrink coverage: after your pass, every behavioral
  line under the dimension's tag still maps to at least one criterion.

---

## Mode B — Align existing rubrics with the instruction

You are editing the thirteen dimension tomls of one task so the rubric and
the instruction agree in both directions. docs/rubrics.md is the criterion
style guide; this section is the workflow. Do all four passes.

**Pass 1 — instruction → rubric (coverage).** Every observable promise in the
instruction that a real user would care about should map to the tag-aligned
dimension above. Add criteria for uncovered promises. New-kit promises get
the asks from rubrics.md: sort round-trips, large-collection smoothness,
drag-to-reschedule, formatting round-trip + undo,
chart-redraws-on-input-change, inline per-field validation, hydration-clean
console + deep-link parity for meta-framework delivery.

Read adversarially: for each promise, ask "would any existing criterion
actually FAIL a build that violates this?" A vague criterion a violating
build could still pass does not count as coverage. Corpus audit found
*entire features* ungraded (a prompt workbench with 18 uncovered features —
pricing estimator, command palette, undo/redo, bulk export — all promised,
none tested). The recurring coverage holes to hunt every time (they hide
because the happy path is graded and these are the periphery):
- **Export/artifact content contracts.** An export criterion that only checks
  "a file downloads" is not coverage — grade the exact SHAPE (every field the
  instruction names) and that it reflects the session's actual mutations.
  Especially regenerated stamps (`exportedAt`/`generatedAt` must change per
  export) and that counts/summaries inside the export equal the visible ones.
- **Secondary import modes.** CSV/JSON/archive/sample-fixture imports beyond
  the primary path, each with per-field schema-validation rejection naming
  the offending field (API-shaped-schema mandate).
- **Field-bound contracts.** Every declared bound is its own criterion: max
  lengths, numeric ranges, closed enums, cross-field rules (allocations sum
  to 100, min≤max), unique-name constraints — a build accepting an
  out-of-bound value must fail.
- **Keyboard-shortcut affordances.** Ctrl+Z/Ctrl+Shift+Z undo/redo,
  Cmd/Ctrl+K palette, digit shortcuts — promised in the instruction,
  routinely ungraded.
- **Interoperable-export formats** (ICS VEVENT shape, PGN, JSON-Schema draft
  validity) graded for real downstream usability, not just presence.
- **Boundary values** at the exact threshold the instruction states (the 0.40
  band edge, the >120-char truncation, the sum-to-100 gate).

**Pass 1b — user flows and state tracking (the hardest coverage, verify it
explicitly).** Isolated single-action criteria are easy; what slips through
is end-to-end flow grading. Every multi-step flow the instruction describes
gets at least one criterion written as a full scripted probe: starting
condition → action sequence → exact evidence, where the evidence spans state
surfaces — the immediate count delta measured around the action, the derived
surface (KPIs, badges, charts) updating, a second view showing the same
datum without reload, and the reload rule for the task's persistence genre
(seeded reset for in-memory; facets surviving for storage-mandated tasks —
all facets coherently, never a mix). If the instruction promises a flow the
rubric only grades step-by-step, add the chained criterion; step criteria
don't prove the chain.

**Pass 2 — rubric → instruction (no phantom grading).** Flag and fix
criteria that grade behavior the instruction never states. The
instruction-side gap is handled by the task-authoring skill's
instruction-migration workflow; here, if a criterion is genuinely orphaned
(references removed features, wrong stack names, old styling system),
rewrite it to match the instruction or delete it. Never grade internal
implementation ("uses Zustand") — a browser judge can't verify it.

**Pass 3 — polarity and style.** Each dimension keeps at least one positive
criterion; negative (`negate = true`) criteria are allowed but never
required. When a negative is used, it states the bad condition being present
and sets `negate = true` — never phrase a negated description as an absence
(that double-inverts). **The polarity-bug class to hunt (found live
corpus-wide):** a criterion whose description asserts a FAILURE ("shows no
hover feedback", "fails to close", "the counts desync") but is missing
`negate = true` — it silently rewards the failure (present→1.0). Every
criterion whose description describes something BAD must carry
`negate = true`; every `negate = true` criterion must describe the bad
condition as PRESENT, never as an absence. When you write or review a
negative, say the polarity out loud: "this describes a defect, so
negate=true; the judge answering 'yes, the defect is present' must score 0."
The validator WARNs on the most unambiguous cases but cannot catch "shows no
X" ambiguity — that is your job. Every criterion is one observable pass/fail
statement with resolved quantifiers; animation/gesture criteria require the
real UI control path (never a WebMCP state shortcut, which snaps state and
falsely shows no animation); scroll-reveal and intro-animation criteria note
fresh-load. Weights: must-have 1.0, nice-to-have 0.5; the `[judge]` weights
are 0.5 for Writing and 0.25 for Innovation.

**Pass 4 — catch-all.** Only `innovation` carries a catch-all: exactly one
open-ended, positive judge catch-all criterion (id `innovation.catchall`,
binary, weight 1.0) requiring the judge to (a) name the enhancement, (b)
cite concrete browser evidence, (c) answer no if any other criterion in the
file already covers it, and (d) apply a "would plausibly matter to a real
user" significance bar. Other dimensions do not need a catch-all. Copy the
template from docs/rubrics.md.

---

## Polarity mix — negatives are optional, but use them well (both modes)

Negative (`negate = true`) criteria are never required; a dimension may be
all-positive. When the instruction implies silent failures, regressions, or
shortcuts that positives cannot see (a build can "have hover states" and
still clip text at 1440px), a negative can catch them. Do not aim for a
prescribed ratio — add negatives only where they earn their place, derived
per docs/rubrics.md's "How to Identify or Expand Criteria":

- For every user-journey step you grade positively, ask what its **silent
  failure** looks like (no feedback, desync, dead end, clipped layout) — each
  answer that the instruction implies is a candidate negative, phrased as the
  bad condition present.
- Ask the **red-team question** per dimension: "how would a builder make the
  positive pass without doing the work?" — the answer becomes a negative here
  or a behavioral probe (different-inputs-different-outputs, reload
  round-trip), which is what makes hardcoding unprofitable.
- Where docs/rubrics.md ships a Negative HLI list, specialize only the ones
  the task's instruction makes concrete, exactly as you specialize positives.
  Never pad with filler negatives.
- Negatives must be independently observable failures, not mirror-image
  restatements of a positive in the same file (a positive "toasts
  auto-dismiss" plus a negative "toasts never dismiss" grades the same fact
  twice — pick the polarity that catches more, usually the negative, or make
  the negative cover a distinct failure like "toast blocks interaction while
  visible").

## Criterion and file rules (both modes)

- Keep at least one positive criterion in every dimension. Negative
  (`negate = true`) criteria are allowed where they catch a real failure
  mode, but they are never required.
- Keep exactly one positive criterion whose ID ends in `.catchall` in
  `innovation`. Other dimensions do not need a catch-all.
- State the bad condition as PRESENT in every `negate = true` description.
  Never state an absence and then negate it, which double-inverts the result.
- Require the real UI control path for animation and gesture criteria.
  Require a fresh page load for intro or scroll-reveal checks because prior
  scrolling pollutes reveal state.
- Grade browser-observable evidence only. Never claim internal implementation
  or stack identity such as "uses React" or "implemented with Zustand".
- Use criterion weight `1.0` for must-haves and `0.5` for nice-to-haves.
  Criterion weight `0.25` is invalid.
- Keep criterion IDs and descriptions unique within each file.
- Keep canonical `[judge]` content byte-identical across all 13 files. The
  only permitted per-dimension header line is its canonical judge `weight`:
  `innovation` uses `0.25`, `writing` uses `0.5`, and other generated values
  remain as scaffolded. Do not alter any other `[judge]` or
  `[[judge.mcp_servers]]` byte.

## TOML mechanics (match the house shape exactly)

- Never touch the `[judge]` header, `[[judge.mcp_servers]]` blocks, or
  `[scoring]` — edit only `[[criterion]]` entries.
- Entry shape used across this repo:

```toml
[[criterion]]
id = "1.7"
name = "drag_reorder_animates"
description = "After dragging the 'Deep Work' row above 'Reading', the list shows the new order and the move animates rather than snapping"
type = "binary"
weight = 1.0
```

- Keep existing ids stable; new criteria continue the file's id scheme (next
  free number in the section). `negate = true` goes on negatives. Do not
  renumber existing entries — ids are provenance.
- `name` is a **descriptive snake_case label** of what the criterion checks
  (`drag_reorder_animates`, `empty_state_after_last_delete`,
  `core_features_catchall`) — never a numeric echo of the id like `1_7`. Give
  every criterion you ADD a descriptive name, and upgrade the numeric names
  of any criterion you REWRITE while you're touching it (ids still never
  change). Descriptive names are what humans grep in reward-details output;
  `1_32` tells a reader nothing.

## Validate (both modes)

Run the bundled structural validators from the repository root:

```bash
python3 .claude/skills/rubrics/scripts/validate_dimensions.py tasks/<slug>
python3 .claude/skills/rubrics/scripts/validate_rubric.py tasks/<slug>/tests
```

`validate_rubric.py` checks: TOML parses; every dimension has ≥1 positive
criterion; Innovation has exactly one positive catch-all with the required
clauses; no negated description is phrased as an absence ("does not", "no
longer", "never" openers); no internal-implementation phrasing appears
("uses <library>", "implemented with"); ids are unique. Fix every FAIL
either validator reports.

Then run the corpus validator:

```bash
uv run corpuscheck validate <slug>   # from the repo root
```

## Report (Mode B)

End with: per dimension — criteria added (with ids), criteria
rewritten/deleted and why, the coverage gaps you closed in each direction,
and the validator output.
