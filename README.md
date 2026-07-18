# frontend-repository

Frontend-only Harbor eval tasks (`tasks/frontend-*`). Each task asks a builder
agent to recreate a reference web application from an observable-behavior PRD
(`instruction.md`), then judges the built app in a real browser across four
weighted dimensions — core_features, technical, visual_design, motion — with
`pass` at reward >= 0.7.

## Quick start

```bash
# run a task end-to-end (builder + verifier)
harbor run -p tasks/frontend-admin-analytics-dashboard -a claude-code -m sonnet

# re-score an existing trial without re-running the builder (harbor fork at ~/harbor)
cd ~/harbor && uv run harbor score <trial-or-job-dir> \
  --task "$PWD"/tasks/<slug> --label rescore --action append

# unit tests (run from repo root)
python3 -m unittest scripts.tests.test_webmcp_h3
```

Environment: `CLAUDE_CODE_OAUTH_TOKEN` (builder agent), `OPENAI_API_KEY`
(verifier/judge). Optional `REWARDKIT_MODEL=gpt-5.6-luna` switches judging to
the cheap dev tier; production judging uses the toml default (`gpt-5.6-sol`).

## How judging works

`tests/test.sh` builds/serves the app on port 3000, launches a shared headless
Chrome with a CDP endpoint, and runs rewardkit. The judge grades only what it
observes: Playwright MCP for observation and gesture mechanics, plus a
task-local WebMCP bridge (`tests/mcp/webmcp_stdio_server.mjs`) that invokes the
app's contract-mandated `window.webmcp_*` tools on the same page — WebMCP
accelerates judging but is never itself a scoring criterion. Criteria live in
`tests/<dimension>/<dimension>.toml`; results (including per-dimension
`cost_usd`) land in `reward.json` / `reward-details.json`.

## Repository layout

- `tasks/frontend-*/` — the 23 packaged tasks (instruction, environment with
  reference screenshots, working oracle under `solution/`, verifier under
  `tests/`). Generated — do not hand-edit shared files.
- `scripts/` — source of truth: `package_frontend_tasks.py` (all shared
  templates), `canonical/` (judge prompt, MCP fragments, test.sh),
  `regen_dimension_tomls.py`, `capture_reference_screenshots.mjs`,
  `install_reference_screenshots.py`, `webmcp_h3.py`, `tests/`.
- `schemas/` — WebMCP task assignments and slug→source mapping.
- `packages/webmcp-contracts/` — WebMCP module spec source of truth.
- `.cursor/skills/` — authoring skills: `frontend-good-app-eval` (instruction/
  checklist/rubric conventions), `create-task` (new-task pipeline),
  `task-from-html` (task from a saved page capture).

Authoring sources (per-task PRDs, reference captures, rubric/checklist JSON)
are archived outside the repo; restore them before running packaging or rubric
regeneration. See `CLAUDE.md` for the full development guide.
