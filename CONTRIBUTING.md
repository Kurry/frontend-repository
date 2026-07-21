# Contributing

This file tracks two things: how the 103 tasks break down by category, and
how to check or advance any task's current quality/readiness state. It is
not a generic PR/style/branching guide — see `CLAUDE.md` / `AGENTS.md` for
repo conventions and non-negotiable invariants.

## Task distribution by category

Task slugs carry their category as a prefix (`frontend-<category>-<name>`):

| Category | Count | Covers |
|---|---|---|
| `creative-tools` | 27 | Theme/palette/config builders, editors, annotation and portfolio tools |
| `workflow` | 21 | Admin/user-management and document-workflow apps |
| `productivity` | 19 | Habits, tasks, notes, time, focus, bookmarks, personal utilities |
| `data-tracking` | 17 | Expense/finance/analytics/portfolio dashboards and timelines |
| `landing` | 8 | Landing/marketing homepages, incl. pixel-perfect fidelity conversions |
| `game` | 6 | Playable games and game-sims |
| `planning` | 4 | Day planners and trip itineraries |
| (unprefixed) | 1 | `frontend-mosbyfiles` — ten-route editorial fidelity site |

Framework rebuilds (e.g. `data-tracking-ghostfolio`, `workflow-docuseal`,
`creative-tools-mermaid-live-editor`) carry their archetype's category, not a
separate "rebuild" bucket.

## Task quality tracking

Every task's readiness lives in `packages/corpuscheck`, not in this file — the
corpus changes too often for a hand-edited table to stay honest. See
`packages/corpuscheck/README.md` for the full command surface; the everyday loop
(from the repo root) is:

```bash
uv run corpuscheck discover                   # register new/renamed tasks
uv run corpuscheck validate --all --incremental  # run static tiers, refresh fingerprints
uv run corpuscheck status --all               # print every task's current stage
uv run corpuscheck advance <slug>             # recompute static stages after a fix
```

Readiness is a lifecycle, monotonic only while a task's content is unchanged:

```text
registered -> static_valid -> oracle_serving -> oracle_certified
           -> nop_certified -> trial_ready
```

The static stages (`registered`, `static_valid`) are recomputed by
`validate`/`advance` from the seven check tiers (`layout`, `shared_shape`,
`contract`, `instruction`, `rubric`, `eval_validity`, `oracle`). The later
stages require explicit evidence — a real oracle trial scoring high
(`corpuscheck record oracle <slug> --trial ... --reward-min 0.9`) and a
deliberately empty NOP app scoring near zero
(`corpuscheck record nop <slug> --trial ... --reward-max 0.15`) — the
SWE-gen-style two-sided validity test that shows criteria reward the intended
behavior and don't pass vacuously.

Before calling a task's rubric/instruction fix "done": get it to at least
`oracle_certified`, and run `corpuscheck reliability report` (or
`judge-accuracy`) to check the fix didn't introduce noisy criteria — high
flip rates, oracle false negatives, or criteria that pass vacuously on the
NOP app.

Use `corpuscheck baseline accept <slug> <tier> --reason "..."` for deliberate,
reasoned exceptions only — never to silently skip a real failure.
`corpuscheck baseline list` / `remove` manage existing waivers.

## Where task quality is actually defined

`corpuscheck` tells you *whether* a task is valid; it doesn't define what
"valid" means. For that:

- `docs/rubrics.md` — criterion authoring conventions (id stability,
  positive/negative balance, browser-observable phrasing).
- `CLAUDE.md` / `AGENTS.md` — the non-negotiable invariants: judge integrity
  (observer never repairer), polarity discipline (negatives state the defect
  as present), the WebMCP contract mandate, and scripted consistency
  (`uv run corpuscheck propagate`) for anything shared across tasks.
