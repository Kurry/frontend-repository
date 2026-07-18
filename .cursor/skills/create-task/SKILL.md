---
name: create-task
description: >-
  Create a brand-new frontend Harbor eval task in this repo end-to-end: authoring
  folder (instruction/checklist/rubric/reference app), WebMCP assignment,
  packaged tasks/frontend-<slug>/ tree, oracle validation, reference screenshots,
  and a smoke scoring run. Use whenever the user asks to add a new task, package
  a new app into an eval, or turn a reference app / inspiration URL into a
  frontend-* task folder.
---

# Create a new frontend Harbor eval task

End-to-end recipe for adding `tasks/frontend-<slug>/`. Authoring content rules
(instruction register, checklist, rubric) live in the sibling skill
`frontend-good-app-eval` — this skill is the pipeline around them.

## Prerequisite: restore archived authoring sources

The authoring folders were moved out of the repo. Restore before packaging:

```bash
cp -R ~/Documents/frontend-repository-authoring-backup-2026-07-18/<Source> ./
# (or restore all of them if running full packaging)
```

## Step 1 — Authoring folder `<Source>/`

Create at repo root (e.g. `MyNewApp/` or `variants/MyNewApp/`):

- `instruction.md` — content sections only (`<summary>` … `<requirements>`),
  written per `frontend-good-app-eval`. No delivery/integrity/webmcp blocks —
  packaging adds those.
- `verifier_checklist.json` — `[{"id": "1", "title": "On load, ..."}, ...]`
  (~10–14 browser-observable walkthrough steps; becomes core criteria 1.1..1.N).
- `rubric.json` — HLI criteria (exact annotation strings; ≥1 positive and
  ≥1 negative per dimension or packaging fails `verify_polarity`).
- `README.md` — PRD naming the inspiration URL and specifying the reference
  exactly (node labels, seeded counts, motion params).
- The reference implementation files (static HTML/CSS/JS or built app) — these
  become the oracle.

## Step 2 — Register the task

Three places, kept consistent:

1. `TASK_SPECS` in `scripts/package_frontend_tasks.py` — slug → source,
   description, webmcp `modules`, `bindings`, `mechanics_exclusions`.
2. `schemas/webmcp-task-sources.json` — slug → source/instruction paths.
3. `schemas/webmcp-assignments.json` — the webmcp assignment (modules from
   `packages/webmcp-contracts` specs; bindings MUST name real product values —
   a filter binding like `artist` when the UI filters by `period` breaks
   builders). `scripts/webmcp_h3.py` renders the instruction contract block
   from this file; `test_assignment_map_covers_23` asserts the count, so bump
   its expectation when adding a 24th task.

## Step 3 — Package

```bash
python3 scripts/package_frontend_tasks.py   # full pipeline, rebuilds task dirs
```

This writes: `instruction.md` (content + delivery + webmcp contract),
`task.toml` (canonical template: codex judge env, artifact excludes),
`environment/Dockerfile`, `solution/` (oracle copy + `solve.sh`),
`tests/` (test.sh, system_prompt.md, `mcp/webmcp_stdio_server.mjs`, four
dimension tomls). If only rubric/checklist changed later, use
`python3 scripts/regen_dimension_tomls.py <slug>` instead of full packaging
(full packaging wipes hand-curated task files).

## Step 4 — Oracle validation + reference screenshots

```bash
node scripts/capture_reference_screenshots.mjs <slug>
```

Must report `OK ... consoleErr=0 pageErr=0` — fix the oracle app until it does
(common defects: entity-encoded `&quot;` attributes in captured HTML, missing
vendor chunks, unguarded optional libs). Then install for the builder:

```bash
python3 scripts/install_reference_screenshots.py <slug>
```

(Adds `environment/reference-screenshots/` + Dockerfile COPY + the
`<reference_screenshots>` instruction note. Screenshots are advisory; the
instruction text wins.)

## Step 5 — Validate

```bash
python3 -m unittest scripts.tests.test_webmcp_h3        # from repo root
cd ~/harbor && uv run python -c "
import tomllib
from harbor.models.task.config import TaskConfig
TaskConfig.model_validate(tomllib.load(open('/Users/kurrytran/frontend-repository/tasks/<slug>/task.toml','rb')))
print('schema ok')"
```

## Step 6 — Smoke run

Cheap dev-tier scoring against the oracle (or a trial) before any full run:

```bash
# full run (builder + verifier):
harbor run -p tasks/<slug> -a claude-code -m sonnet
# re-score an existing trial with the dev-tier judge (fork-only command):
cd ~/harbor && REWARDKIT_MODEL=gpt-5.6-luna uv run harbor score <trial-dir> \
  --task /Users/kurrytran/frontend-repository/tasks/<slug> --label smoke --action append
```

Needs `OPENAI_API_KEY` (verifier) and `CLAUDE_CODE_OAUTH_TOKEN` (builder) in the
host env. Expect the oracle to score high; read `reward-details.json` (includes
per-dimension `cost_usd`) and adjudicate any failed criterion by hand-testing
the app before blaming the rubric or the judge.

## Gotchas

- Never hand-edit the 23 generated copies of `test.sh` / `task.toml` /
  dimension tomls — edit the generator templates in
  `scripts/package_frontend_tasks.py` + `scripts/canonical/` and regenerate.
- The app under test must expose `window.webmcp_session_info/list_tools/
  invoke_tool` (contract Implementation section) — the judge's webmcp bridge
  discovers exactly that surface.
- `package.json` must define scripts named exactly `start` (port 3000) and
  `verify:build`; the artifact excludes are enforced by a unit test.
