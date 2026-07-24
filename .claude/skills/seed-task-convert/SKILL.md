---
name: seed-task-convert
description: >-
  Convert a legacy browser_ seed task (from the zto-seed-tasks-2 export, shape
  task/ + app/ + oracle/) into a new-shape frontend-repository Harbor eval task
  (tasks/frontend-<genre>-<name>/) that passes `corpuscheck validate` AND
  `corpuscheck oracle-ci`. Use this skill whenever the user wants to convert,
  migrate, port, or "reshape" one or more browser_ seed tasks into the new task
  format, mentions the zto-seed-tasks-2 / Downloads seed folder, asks to turn a
  browser_ app into a frontend-* task, or wants to batch-convert the remaining
  seed tasks. This is the end-to-end recipe: scaffold, port rubrics, rewrite the
  instruction into canonical sections, register + render the WebMCP contract,
  WRITE the solution/app WebMCP bridge (src/webmcp.ts), then certify with
  corpuscheck. Trigger even if the user only says "do another one" or "convert
  the rest" in a context where seed-task conversion is the ongoing work.
---

# seed-task-convert

Convert one legacy `browser_<name>` seed task into a new-shape
`tasks/frontend-<genre>-<name>` task that passes both `corpuscheck validate`
(static tiers) and `corpuscheck oracle-ci` (build → serve → WebMCP probe → e2e
→ judge-setup). Run this once per task; batch by looping.

## Why this is shaped the way it is

The two task formats differ in ways that make conversion partly mechanical and
partly authored:

- **Rubrics** move from 8 source dims (functional/ux/design/behavioral/technical/
  accessibility/writing/anticheat) to 13 tag-aligned dims, and every criterion
  must gain a stable `id` + a snake_case `name`, with weights collapsed to the
  only two the corpus allows: `0.5` (nice-to-have) and `1.0` (must-have). This
  is scriptable — `scripts/convert_rubrics.py` does it.
- **The instruction** is NOT markdown in the new shape. `corpuscheck` parses it
  into canonical XML-like sections (`<summary>` … `<webmcp_action_contract>`),
  plain text, no markdown. The source PRD must be rewritten into those sections.
  This is authored (you write it), guided by `references/instruction-sections.md`.
- **WebMCP** is new. The new verifier drives the app through a `window.webmcp_*`
  bridge the old apps never had, so you REGISTER the task's module contract and
  then WRITE a `solution/app/src/webmcp.ts` that exposes it, wired to the app's
  real state actions. `references/webmcp-bridge.md` + `assets/webmcp.template.ts`
  carry the pattern and the exact probe requirements.

The mechanical steps are scripted so every conversion is consistent; the two
authored steps (instruction, bridge) are where your judgment goes, and both have
tight contracts you can check against.

## Inputs and naming

- Source: `~/Downloads/zto-seed-tasks-2/<browser_slug>/` with `task/`
  (instruction.md, task.toml, tests/, reference.png), `app/` (the SolidJS/React
  oracle build), `oracle/`, `verifier/`.
- Target slug: `frontend-<genre>-<name>` where `<genre>` comes from the source
  `task/task.toml` `category` (mini-productivity/utility → usually `productivity`;
  dataviz-dashboard → `data-tracking`; game-sim → `game`; creative → `creative-tools`).
  Match an existing genre in `tasks/` — run `ls tasks/ | sed 's/frontend-//' | cut -d- -f1-2 | sort -u`.
- Pick a same-genre, already-valid task as the **skeleton** (e.g.
  `frontend-productivity-loopdaily` is a good good-app reference). Confirm it is
  valid: `uv run corpuscheck discover | grep <skeleton>` (wants yes/yes/yes).

## The six phases

Run from the repo root (`~/frontend-repository`). All `corpuscheck` commands
accept a task-slug argument so you can stay scoped to the one task — never run
the corpus-wide form (`propagate` with no slug), it rewrites hundreds of files.

### 1 — Scaffold

```bash
python .claude/skills/seed-task-convert/scripts/scaffold_from_source.py \
  --source ~/Downloads/zto-seed-tasks-2/<browser_slug> \
  --skeleton frontend-productivity-loopdaily \
  --slug frontend-<genre>-<name>
```

This copies the skeleton (canonical `[judge]` headers, environment/, solve.sh),
swaps in the source `app/` as `solution/app`, sets `task.toml` name/description,
and syncs the oracle lockfile so `npm ci` will work. It does NOT overwrite the
rubrics or instruction — those come next.

### 2 — Port the rubrics (scripted)

```bash
python .claude/skills/seed-task-convert/scripts/convert_rubrics.py \
  --source ~/Downloads/zto-seed-tasks-2/<browser_slug>/task/tests \
  --target tasks/frontend-<genre>-<name>/tests
```

Ports the 7 domain dims, adds `id`+`name`, normalizes weights to {0.5, 1.0},
and installs the `innovation.catchall`. It leaves the 6 foundation dims (motion,
responsiveness, performance, design_fidelity, edge_cases anti-cheat, plus the
propagated pieces) from the skeleton. Then **add ≥1 app-specific positive
criterion to `tests/edge_cases/edge_cases.toml`** (the skeleton's edge_cases are
all `negate=true` anti-cheat, and the rubric tier requires a positive) — base
them on the app's real recovery/empty-state/adversarial behaviors.

### 3 — Rewrite the instruction (authored)

Rewrite `instruction.md` into canonical sections following
`references/instruction-sections.md`. Keep the source PRD's features but express
them as plain-text section bodies (no `**`, `#`, or backticks outside the
PROTECTED sections). Reuse a same-genre task's `<integrity>`/`<delivery>`
verbatim. Name the pinned Tailwind version and the no-CDN rule in the requirements.
Do NOT hand-write `<webmcp_action_contract>` — phase 4 renders it.

### 4 — Register + render the WebMCP contract (scripted + authored binding)

Author a module binding for the app (which of browse/entity/form/artifact
operations the app supports, and the product vocabulary), then register it:

```bash
python .claude/skills/seed-task-convert/scripts/register_task.py \
  --slug frontend-<genre>-<name> \
  --binding /tmp/<name>_binding.json     # see references/webmcp-bridge.md for the shape
uv run corpuscheck webmcp apply          # renders <webmcp_action_contract> into instruction.md
```

`register_task.py` writes the description into `webmcp-task-sources.json` and the
binding into BOTH `webmcp-assignment-map.json` and the compiled
`webmcp-assignments.json` (oracle-ci reads the compiled file — a common trap if
you only edit the map).

### 5 — Write the WebMCP bridge (authored, from a template)

Read the app's `solution/app/src/store.*` to learn its exported state actions
(create/update/delete, toggles, export/import, recovery), and its nav structure.
Then write `solution/app/src/webmcp.ts` from `assets/webmcp.template.ts`, wiring
each tool handler to the app's REAL actions (not fake success). Register it in
the entry file (`initWebMcp()` after `render(...)` in `src/index.tsx`, or the
React equivalent). The exact probe contract (surface, module coverage, a
read-only tool ending in `search`/`validate`/`select` that round-trips) is in
`references/webmcp-bridge.md` — follow it or oracle-ci's webmcp stage fails.

### 6 — Render canonical surfaces + certify

```bash
uv run corpuscheck propagate frontend-<genre>-<name>     # README.md + task.toml
rm -rf tasks/frontend-<genre>-<name>/solution/app/node_modules   # if a prior build vendored it
uv run corpuscheck validate frontend-<genre>-<name> --force      # want: 1/1 passed
lsof -ti:3000 | xargs kill -9 2>/dev/null                        # free the serve port
uv run corpuscheck oracle-ci frontend-<genre>-<name>             # want: all stages PASS
uv run corpuscheck screenshots capture frontend-<genre>-<name>   # oracle smoke (0 console errors)
```

`validate` should report `1/1 passed`; `oracle-ci` should report PASS for
static/build/serve-browser/webmcp/e2e/judge-setup.

## Gotchas (each cost a debugging cycle the first time)

- **Weights**: only `0.5` and `1.0` validate. `1.5`/`2.0`/`0.25` fail `eval_validity`.
- **`id` required**: every criterion needs an `id`; the old `name`-as-id format is waived only for pre-existing tasks. The script adds both.
- **catch-all id**: the innovation catch-all is recognized by `id` ending in `.catchall`, nothing else.
- **edge_cases needs a positive**: the anti-cheat criteria are all `negate=true`.
- **Instruction is not markdown**: markdown inside a non-PROTECTED section fails the `instruction` tier.
- **compiled assignments**: oracle-ci reads `webmcp-assignments.json`, not the map. `register_task.py` writes both.
- **read-only probe**: at least one tool whose name ends in `search`/`validate`/`select` must return an object with `ok`/`success`. `form.validate` is the easy one.
- **vendored node_modules**: a build leaves `solution/app/node_modules`, which fails the `layout` tier — delete it before `validate`.
- **stay scoped**: pass the slug to every `corpuscheck` command; the bare `propagate` rewrites the whole corpus. If you ever cause corpus-wide drift, revert with `git restore <other-paths>` / `git clean` scoped to exclude your new task.

## Footprint per task

One new `tasks/frontend-<genre>-<name>/` dir, plus three registry edits
(`webmcp-task-sources.json`, `webmcp-assignment-map.json`,
`webmcp-assignments.json`). Nothing else should change.

## Batching

To convert the remaining seed tasks, loop the six phases one task at a time
(phases 3 and 5 need per-app authoring, so this is semi-automated, not a pure
batch). Convert, certify green, then move on — a task that fails a tier is not
done. Keep a short ledger of converted slugs so reruns are idempotent.
