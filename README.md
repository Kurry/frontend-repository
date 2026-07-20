# frontend-repository

103 frontend-only Harbor eval tasks (`tasks/frontend-*`) in four genres:
good-app rebuilds (in-memory state, no localStorage), pixel-perfect
website-fidelity recreations of live sites, hard browser apps/games
(canvas/game/tool apps), and framework rebuilds (localStorage kept where the
source PRD mandates it). Each task asks a builder agent to recreate a
reference web application from an observable-behavior PRD (`instruction.md`),
then judges the built app in a real browser across fifteen tag-aligned
dimensions — `core_features`, `visual_design`, `motion`, `technical`,
`user_flows`, `edge_cases`, `responsiveness`, `accessibility`, `performance`,
`writing`, `innovation`, `design_fidelity`, `mcp_contract`, `anticheat`,
`behavioral` — with `pass` at `reward >= 0.7`, both gated on `anticheat`.

## Quick start

```bash
# run a task end-to-end (builder + verifier)
harbor run -p tasks/frontend-data-tracking-admin-analytics-dashboard -a claude-code -m sonnet

# re-score an existing trial without re-running the builder (harbor fork at ~/harbor)
cd ~/harbor && uv run harbor score <trial-or-job-dir> \
  --task "$PWD"/tasks/<slug> --label rescore --action append

# unit tests (run from repo root)
python3 -m unittest scripts.tests.test_webmcp_h3
```

Environment: `CLAUDE_CODE_OAUTH_TOKEN` (builder agent), `OPENAI_API_KEY`
(verifier/judge). Optional `REWARDKIT_MODEL=gpt-5.6-luna` switches judging to
the cheap dev tier; production judging uses the toml default (`gpt-5.6-sol`).

## Task anatomy

Every `tasks/frontend-<slug>/` directory follows the same shape:

- `instruction.md` — the PRD the builder agent sees. Content sections
  (`<summary>`, `<core_features>`, `<visual_design>`, `<motion>`,
  `<requirements>`) are written as observable behaviors (action → expected
  evidence). Protected sections (`<integrity>`, `<delivery>`,
  `<webmcp_action_contract>`, `<reference_screenshots>`) are contract/plumbing
  — the WebMCP contract is mandatory at authoring time, never deferred.
- `environment/` — the builder's Dockerfile plus `reference-screenshots/`
  (copied into the container; images are advisory, instruction text wins).
- `solution/app` — the working oracle, used by `solve.sh`, the screenshot
  capture script, and validated to serve with zero console/page errors.
- `tests/` — the verifier: `test.sh` (entry point), `system_prompt.md` (judge
  prompt), `webmcp_stdio_server.mjs` (WebMCP bridge), fifteen tag-aligned
  `<dim>/<dim>.toml` rubric files, and `reward.toml` (aggregation + gating).

## How judging works

`tests/test.sh` builds/serves the app on port 3000, launches a shared headless
Chrome with a CDP endpoint, and runs rewardkit. The judge grades only what it
observes: Playwright MCP for observation and gesture mechanics, plus a
task-local WebMCP bridge (`tests/webmcp_stdio_server.mjs`) that invokes the
app's contract-mandated `window.webmcp_*` tools on the same page — WebMCP
accelerates judging but is never itself a scoring criterion. Criteria live in
`tests/<dimension>/<dimension>.toml`; results (including per-dimension
`cost_usd`) land in `reward.json` / `reward-details.json`.

## Running sweeps with `configs/`

`configs/*.yaml` are ready-made Harbor job configs for corpus-wide runs —
each documents its own setup in a header comment, but the invocation shape
and gotchas below are common to all of them:

```bash
# from repo root
uv run harbor run -y -c configs/<file>.yaml --yes

# smoke a single task first before a full sweep
uv run harbor run -y -c configs/<file>.yaml -i <slug> --job-name smoke --yes
```

| Config | Purpose |
|---|---|
| `install-only-all-tasks.yaml` | Install-only sweep across every task × agent (claude-code, codex, kimi-cli, mini-swe-agent) — no trial execution, just confirms setup works. |
| `oracle-validate-all-tasks.yaml` | Runs each task's own `solution/solve.sh` through the real verifier, corpus-wide, on the cheap `gpt-5.6-luna-pro` judge — confirms reference solutions still pass. |
| `sonnet5-codex-oauth.yaml` (+ `-smoke.yaml`) | Full-corpus (or one-task smoke) builder run: claude-code on Sonnet 5 via Claude subscription OAuth, judged by codex via ChatGPT-plan OAuth. |
| `sonnet5-remaining.yaml` | Same builder/judge pairing, pinned to an explicit task list — for partial-corpus reruns. |
| `trial-codex-sol-pro.yaml` | Modal fleet sweep with codex/`gpt-5.6-sol-pro` as the real coding-agent builder, judged by codex. |
| `trial-kimi3.yaml` | Modal fleet sweep with kimi-cli/`kimi-k3` as the builder, judged by codex. |

Two things every config comment repeats, worth knowing up front:

- **Modal's `keepalive` gotcha.** Modal replaces the image `ENTRYPOINT` with
  its own sandbox keepalive, so every Modal config routes it through
  `/opt/verifier/entrypoint.sh` (`environment.kwargs.keepalive: [...]`) —
  without this the shared CDP Chrome never starts and every trial fails as an
  infra error. Local Docker only overrides `CMD`, so it needs no such
  override.
- **Env vars per agent/judge.** `claude-code` wants
  `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`; `codex` (builder or
  judge) wants `OPENAI_API_KEY` or `CODEX_AUTH_JSON`; `kimi-cli` wants
  `KIMI_API_KEY`. `REWARDKIT_MODEL` overrides the judge model for a cheaper
  dev-tier pass; unset it for production judging (`gpt-5.6-sol`).

## Repository layout

- `tasks/frontend-*/` — the 103 packaged tasks (instruction, environment with
  reference screenshots, working oracle under `solution/`, verifier under
  `tests/`). Generated — do not hand-edit shared files.
- `configs/` — Harbor job configs for corpus-wide sweeps (see above).
- `scripts/` — source of truth: `package_frontend_tasks.py` (all shared
  templates), `canonical/` (judge prompt, MCP fragments, test.sh),
  `regen_dimension_tomls.py`, `capture_reference_screenshots.mjs`,
  `install_reference_screenshots.py`, `webmcp_h3.py`, `tests/`.
- `schemas/` — WebMCP task assignments and slug→source mapping.
- `packages/webmcp-contracts/` — WebMCP module spec source of truth.
- `docs/` — `rubrics.md` (criterion authoring conventions), `instructions.md`,
  `distribution.md`.
- `tools/corpuscheck/` — corpus quality/readiness tracker (see
  `CONTRIBUTING.md`).
- `.cursor/skills/` — authoring skills: `frontend-good-app-eval` (instruction/
  checklist/rubric conventions), `create-task` (new-task pipeline),
  `task-from-html` (task from a saved page capture).

Authoring sources (per-task PRDs, reference captures, rubric/checklist JSON)
are archived outside the repo; restore them before running packaging or rubric
regeneration. See `CLAUDE.md` for the full development guide.

## Where to look next

- `CLAUDE.md` / `AGENTS.md` — full development guide and the non-negotiable
  corpus invariants (judge integrity, polarity discipline, WebMCP contract
  mandate, scripted consistency).
- `docs/rubrics.md` — criterion authoring conventions.
- `CONTRIBUTING.md` — task category distribution and how to check/advance a
  task's quality state.
- `rubric-align` / `create-rubrics` skills — the rubric alignment workflow.
