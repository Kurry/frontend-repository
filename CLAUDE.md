# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

65 frontend-only Harbor eval tasks (`tasks/frontend-*`). Each task asks a builder agent to rebuild a reference web app from a PRD-style `instruction.md`; an LLM judge (codex, `gpt-5.6-sol`) then grades the built app in a real browser across fifteen dimensions (core_features, visual_design, motion, technical, user_flows, edge_cases, responsiveness, accessibility, performance, writing, innovation, design_fidelity, mcp_contract, anticheat, behavioral). Everything under `tasks/` is **generated or vendored** — the source of truth for shared pieces lives in `scripts/`.

Four genres: **good-app** tasks (the original 25, in-memory state, no localStorage), **website-fidelity** tasks (8, pixel-perfect recreations of live sites — landing-landonorris, landing-avax-network, landing-hildenkaira, mosbyfiles, landing-razorpay-sprint-26, landing-readymag, landing-units-gr, landing-wolverineworldwide), **hard browser apps/games** (21, canvas/game/tool apps from zto-phase2 PRDs), and **framework rebuilds** (11, e.g. workflow-docuseal, creative-tools-mermaid-live-editor, data-tracking-ghostfolio, data-tracking-plausible-analytics). The latter two genres keep localStorage where their source PRD mandates it — the no-localStorage rule binds only the good-app genre. Any task video that the judge must see rendered needs a VP9 `.webm` source ahead of mp4 — the judge's codec-limited chromium cannot decode h264.

## Commands

```bash
# Unit tests (MUST run from repo root — module discovery is cwd-relative)
python3 -m unittest scripts.tests.test_webmcp_h3

# Run a task end-to-end (builder + verifier)
harbor run -p tasks/frontend-data-tracking-admin-analytics-dashboard -a claude-code -m sonnet

# Re-score an existing trial's artifacts without re-running the builder.
# `harbor score` exists ONLY in the Kurry/harbor fork (not upstream). The repo's
# pyproject.toml + uv.lock pin harbor to that fork by SHA, so run from repo root:
uv run harbor score <trial-or-job-dir> \
  --task tasks/<slug> --label my-label --action append

# Cheap dev-tier judging (no file edits): export REWARDKIT_MODEL=gpt-5.6-luna
# Production judging uses the toml default (gpt-5.6-sol). Verifier needs
# OPENAI_API_KEY in the host env; the builder agent needs CLAUDE_CODE_OAUTH_TOKEN.

# Capture reference screenshots from every task's solution/app oracle
# (also a per-oracle smoke validation: serve + zero console/page errors)
node scripts/capture_reference_screenshots.mjs [slug ...]
python3 scripts/install_reference_screenshots.py [slug ...]   # install into task envs

```

Dimension tomls (`tests/<dim>/<dim>.toml`) are the single source of truth for criteria and are edited directly (see `docs/rubrics.md` for criterion conventions; the `rubric-align` skill does the alignment work). Outcome / user-flow lists are authored as criteria in a dimension toml — the `behavioral` dimension covers them when a task ships it; until then they live in `core_features`. There is no separate outcomes file.

## Non-negotiable invariants (hard-won; see AGENTS.md for the full list)

Every one of these is a corpus defect if violated, and each has a guard:
- **Consistency is scripted**: after any canonical edit run `python3 scripts/propagate_canonical.py` (`--check` = zero drift). Never hand-copy shared files.
- **15 tag-aligned dimensions** per task (`scripts/generate_dimension_scaffolds.py` baselines them; `create-rubrics` specializes; `rubric-align` aligns). anticheat is verbatim/all-negative/`all_pass`; `reward.toml` gates reward AND pass on it.
- **Judge integrity** (canonical `system_prompt.md`, cwd `/logs/verifier`): observer never repairer, never reads app source, `browser_evaluate` read-only, `BLOCKED:`/`FAIL:` prefixes.
- **Criteria are LLM-judge only, never code checks**; every PRD promise must be tested by a criterion a violating build would FAIL; negatives carry `negate=true` and state the defect as present; only ADD criteria, never renumber/delete (ids are provenance).
- **API-shaped schemas** and a **useful downloadable end state** are authoring mandates, not extras.

**Legacy authoring archive.** Historic per-task authoring folders were moved to `~/Documents/frontend-repository-authoring-backup-2026-07-18`; `regen_dimension_tomls.py` and full `package_frontend_tasks.py` runs are legacy paths that need them restored. Do not route new work through that pipeline — edit instruction.md and the dimension tomls directly. The mapping slug→source lives in `schemas/webmcp-task-sources.json` and `TASK_SPECS` in `scripts/package_frontend_tasks.py`.

## Architecture

### Generation pipeline (edit generators, never the per-task copies)

`scripts/package_frontend_tasks.py` is the single source of truth for everything replicated across tasks: `TEST_SH` (tests/test.sh), `TASK_TOML_TMPL` + `ARTIFACT_EXCLUDES` (task.toml), `DOCKERFILE`, the judge `[judge]` header, and `rubric_to_tomls()` (legacy: compiled archived authoring JSON into dimension tomls). `scripts/canonical/` holds the authored templates it inlines: `system_prompt.md` (judge prompt), `mcp/reward_mcp_servers.toml` (judge MCP servers fragment), `mcp/webmcp_stdio_server.mjs` (vendored per task as `tests/webmcp_stdio_server.mjs`), `test.sh`. All `test.sh` and `task.toml` copies across the 65 tasks are byte-identical products of these templates — a unit test enforces the artifact-exclude set, so a drive-by edit to one copy will fail CI-style checks.

### Task anatomy

- `instruction.md` — PRD the builder sees. Content sections (`<summary>`, `<core_features>`, `<visual_design>`, `<motion>`, `<requirements>`) are written as observable behaviors (action → expected evidence, quantifiers resolved). Protected sections (`<integrity>`, `<delivery>`, `<webmcp_action_contract>`, `<reference_screenshots>`) are contract/plumbing — the webmcp block is rendered by `scripts/webmcp_h3.py` from `schemas/webmcp-assignments.json` and module specs in `packages/webmcp-contracts`. The contract is mandatory at authoring time (never deferred; the unit suite fails contract-less task dirs), and bindings aim to cover every `Feature:` group — groups the modules can't express get an explicit `mechanics_exclusions` entry.
- `environment/` — Dockerfile + `reference-screenshots/` (copied to `/reference-screenshots` in the builder container; images are advisory, instruction text wins).
- `solution/app` — the oracle. Used by `solve.sh`, by the screenshot capture script, and validated to serve with zero console/page errors. Oracles that serve a build output (`vite preview`, `http-server dist`) keep the built `dist/` committed alongside the source so both the capture harness and `test.sh` (`verify:build` then `start`) work.
- `tests/` — `test.sh` (verifier entry), `system_prompt.md`, `mcp/webmcp_stdio_server.mjs`, and fifteen tag-aligned `<dim>/<dim>.toml` rubrics (31–42 criteria in the four core dims; baseline criteria in the rest until specialized).

### Verifier / judge stack

`tests/test.sh` installs pinned deps (`tasks/_pins.py`; rewardkit is pinned to a SHA of the Kurry/harbor fork on GitHub — bump `HARBOR_REWARDKIT_GIT_SHA` and regenerate test.sh copies together), launches a **shared headless Chrome** with `--remote-debugging-port` and blink pointer-capability flags (without them headless Linux reports `hover: none` and Tailwind v4 strips every `hover:` style — motion criteria then false-fail), exports `WEBMCP_CDP_PORT`/`WEBMCP_CDP_ENDPOINT`, serves the app on port 3000, and runs `rewardkit /tests`.

The judge gets two MCP servers attached to that same Chrome: **playwright** (`@playwright/mcp`, observation + gesture mechanics) and **webmcp** (the task-local CDP bridge), which calls the app's contract-mandated `window.webmcp_session_info/list_tools/invoke_tool` on the *same page* playwright drives — apps are client-side-state SPAs, so a second page would be a different app instance. The judge prompt mandates WebMCP-first for state-changing setup and playwright for anything a criterion grades mechanically, plus accuracy guards (hover verdicts via computed-style-while-hovering, desktop-viewport before layout judgments, count deltas measured immediately around the action, fresh-load before reveal-state criteria — WebMCP scroll jumps pollute scroll-reveal state — and two-frame early/settled sampling for sub-second intro animations).

### Rubric conventions (see `docs/rubrics.md`)

Criteria are authored directly as `[[criterion]]` entries in the dimension tomls (id stable, descriptive snake_case `name`, `type`/`weight`/`negate` per `docs/rubrics.md`). Rules that matter: ordinary dimensions keep ≥1 positive and ≥1 negative; `anticheat` is all-negative and `innovation` may be all-positive. Negatives are phrased as the bad condition being present; titles must be browser-observable — internal-implementation claims ("uses Redux Toolkit") are banned because judges cannot verify them; criteria that grade an animation/gesture must require the real UI control path (a WebMCP state shortcut would snap the state and falsely show no animation); `nice to have` maps to weight 0.5, `must have` to 1.0. Keep instruction and rubrics mutually consistent in both directions (the `rubric-align` skill enforces this).
