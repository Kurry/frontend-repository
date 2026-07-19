# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this repo is

103 frontend-only Harbor eval tasks (`tasks/frontend-*`). Each task asks a builder agent to rebuild a reference web app from a PRD-style `instruction.md`; an LLM judge (codex, `gpt-5.6-sol`) then grades the built app in a real browser across **fifteen tag-aligned dimensions** (core_features, visual_design, motion, technical, user_flows, edge_cases, responsiveness, accessibility, performance, writing, innovation, design_fidelity, mcp_contract, anticheat, behavioral). Everything under `tasks/` is **generated or vendored** — the source of truth for shared pieces lives in `scripts/`.

## Non-negotiable invariants (hard-won; a violation is a corpus defect)

1. **Consistency is scripted, never hand-propagated.** After ANY edit to a canonical source (`scripts/canonical/*`, the `DOCKERFILE`/`TASK_TOML_TMPL` constants, the judge header), run `python3 scripts/propagate_canonical.py` and confirm `--check` reports zero drift. Never hand-copy a shared file to N tasks. corpuscheck's shared-shape tier + `drift` fail on any divergence.
2. **Judge integrity (in `scripts/canonical/system_prompt.md`, propagated).** The judge is an OBSERVER, never a repairer: it must not create/modify/delete any file (never "fix" a broken app to grade it — a broken app scores broken), never read app source from disk, and `browser_evaluate` is read-only measurement only (no DOM/storage/state mutation via JS — real interactions or the declared WebMCP tools only). Judge `cwd` is `/logs/verifier`, NOT `/app`. Verdicts prefix reasoning `BLOCKED:` (couldn't exercise) vs `FAIL:` (exercised, misbehaved).
3. **WebMCP contract mandatory at authoring time** with per-`Feature:`-group binding coverage; the bridge (`webmcp_stdio_server.mjs`) resolves its target to the VISIBLE tab (a multi-tab desync once caused fabricated-success verdicts). Unit suite fails contract-less task dirs.
4. **Rubric criteria are LLM-judge, browser-observable statements ONLY — never code/`.py` checks.** Every PRD promise must be tested by a criterion a violating build would actually FAIL (adversarial coverage). Recurring holes: export-content SHAPE contracts (+ regenerated `exportedAt`/`generatedAt` stamps), secondary import modes with per-field validation, field-bound contracts (max/range/enum/cross-field), keyboard shortcuts (undo Ctrl+Z, Cmd+K), interoperable export formats (ICS/PGN/JSON-Schema), boundary values at the exact stated threshold.
5. **Polarity discipline.** A description that asserts a DEFECT must carry `negate = true` (else it rewards the failure — a real bug found corpus-wide); a `negate = true` description states the bad condition PRESENT, never as an absence. anticheat is verbatim/all-negative/`all_pass`-gated; innovation may be all-positive with a positive catch-all. `reward.toml` gates both `reward` and `pass` on anticheat. Never rewrite/renumber/delete an existing criterion you didn't author — ids are provenance; only ADD.
6. **API-shaped schemas without a backend** (mandate 5 in docs/instructions.md): form/data schemas mirror the domain's real API payload shapes; the created record IS the would-be request body; exports/imports validate against the same schemas.
7. **Useful end state** (`harden-task` skill): every app converges on a produced, interoperable, downloadable artifact of the session's actual work — MCP-queryable, genre-correct persistence, import round-trips.

Four genres: **good-app** tasks (the original 25, in-memory state, no localStorage), **website-fidelity** tasks (8, pixel-perfect recreations of live sites — landing-landonorris, landing-avax-network, landing-hildenkaira, mosbyfiles, landing-razorpay-sprint-26, landing-readymag, landing-units-gr, landing-wolverineworldwide), **hard browser apps/games** (21, canvas/game/tool apps from zto-phase2 PRDs), and **framework rebuilds** (11, e.g. workflow-docuseal, creative-tools-mermaid-live-editor, data-tracking-ghostfolio, data-tracking-plausible-analytics). The latter two genres keep localStorage where their source PRD mandates it — the no-localStorage rule binds only the good-app genre. Any task video that the judge must see rendered needs a VP9 `.webm` source ahead of mp4 — the judge's codec-limited chromium cannot decode h264.

## Commands

```bash
# Unit tests (MUST run from repo root — module discovery is cwd-relative)
python3 -m unittest scripts.tests.test_webmcp_h3

# Run a task end-to-end (builder + verifier)
harbor run -p tasks/frontend-data-tracking-admin-analytics-dashboard -a Codex -m sonnet

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

**Legacy authoring archive.** Historic per-task authoring folders were moved to `~/Documents/frontend-repository-authoring-backup-2026-07-18`; `regen_dimension_tomls.py` and full `package_frontend_tasks.py` runs are legacy paths that need them restored. Do not route new work through that pipeline — edit instruction.md and the dimension tomls directly. The mapping slug→source lives in `schemas/webmcp-task-sources.json` and `TASK_SPECS` in `scripts/package_frontend_tasks.py`.

## Architecture

### Generation pipeline (edit generators, never the per-task copies)

`scripts/package_frontend_tasks.py` is the single source of truth for everything replicated across tasks: `TEST_SH` (tests/test.sh), `TASK_TOML_TMPL` + `ARTIFACT_EXCLUDES` (task.toml), `DOCKERFILE`, the judge `[judge]` header, and `rubric_to_tomls()` (legacy: compiled archived authoring JSON into dimension tomls). `scripts/canonical/` holds the authored templates it inlines: `system_prompt.md` (judge prompt), `mcp/reward_mcp_servers.toml` (judge MCP servers fragment), `mcp/webmcp_stdio_server.mjs` (vendored per task as `tests/webmcp_stdio_server.mjs`), `test.sh`. All `test.sh` and `task.toml` copies across the 65 tasks are byte-identical products of these templates — a unit test enforces the artifact-exclude set, so a drive-by edit to one copy will fail CI-style checks.

### Task anatomy

- `instruction.md` — PRD the builder sees. Content sections (`<summary>`, `<core_features>`, `<visual_design>`, `<motion>`, `<requirements>`) are written as observable behaviors (action → expected evidence, quantifiers resolved). Protected sections (`<integrity>`, `<delivery>`, `<webmcp_action_contract>`, `<reference_screenshots>`) are contract/plumbing — the webmcp block is rendered by `scripts/webmcp_h3.py` from `schemas/webmcp-assignments.json` and module specs in `packages/webmcp-contracts`. The contract is mandatory at authoring time (never deferred; the unit suite fails contract-less task dirs), and bindings aim to cover every `Feature:` group — groups the modules can't express get an explicit `mechanics_exclusions` entry.
- `environment/` — Dockerfile + `reference-screenshots/` (copied to `/reference-screenshots` in the builder container; images are advisory, instruction text wins).
- `solution/app` — the oracle. Used by `solve.sh`, by the screenshot capture script, and validated to serve with zero console/page errors. Oracles that serve a build output (`vite preview`, `http-server dist`) keep the built `dist/` committed alongside the source so both the capture harness and `test.sh` (`verify:build` then `start`) work.
- `tests/` — `test.sh` (verifier entry), `system_prompt.md`, `mcp/webmcp_stdio_server.mjs`, and four `<dim>/<dim>.toml` rubrics (31–42 criteria per task).

### Verifier / judge stack

`tests/test.sh` installs pinned deps (`tasks/_pins.py`; rewardkit is pinned to a SHA of the Kurry/harbor fork on GitHub — bump `HARBOR_REWARDKIT_GIT_SHA` and regenerate test.sh copies together), launches a **shared headless Chrome** with `--remote-debugging-port` and blink pointer-capability flags (without them headless Linux reports `hover: none` and Tailwind v4 strips every `hover:` style — motion criteria then false-fail), exports `WEBMCP_CDP_PORT`/`WEBMCP_CDP_ENDPOINT`, serves the app on port 3000, and runs `rewardkit /tests`.

The judge gets two MCP servers attached to that same Chrome: **playwright** (`@playwright/mcp`, observation + gesture mechanics) and **webmcp** (the task-local CDP bridge), which calls the app's contract-mandated `window.webmcp_session_info/list_tools/invoke_tool` on the *same page* playwright drives — apps are client-side-state SPAs, so a second page would be a different app instance. The judge prompt mandates WebMCP-first for state-changing setup and playwright for anything a criterion grades mechanically, plus accuracy guards (hover verdicts via computed-style-while-hovering, desktop-viewport before layout judgments, count deltas measured immediately around the action, fresh-load before reveal-state criteria — WebMCP scroll jumps pollute scroll-reveal state — and two-frame early/settled sampling for sub-second intro animations).

### Rubric conventions (see `docs/rubrics.md`)

Criteria are authored directly as `[[criterion]]` entries in the dimension tomls (id stable, descriptive snake_case `name`, `type`/`weight`/`negate` per `docs/rubrics.md`). Rules that matter: every dimension keeps ≥1 positive and ≥1 negative (negatives are anti-cheat, phrased as the bad condition being present); titles must be browser-observable — internal-implementation claims ("uses Redux Toolkit") are banned because judges cannot verify them; criteria that grade an animation/gesture must require the real UI control path (a WebMCP state shortcut would snap the state and falsely show no animation); `nice to have` maps to weight 0.5, `must have` to 1.0. Keep instruction and rubrics mutually consistent in both directions (the `rubric-align` skill enforces this).
