# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this repo is

65 active frontend-only Harbor eval tasks (`tasks/frontend-*`), plus 38 quarantined under `tasks-quarantine/` (dist-absent oracles; see `tasks-quarantine/README.md`). Each task asks a builder agent to rebuild a reference web app from a PRD-style `instruction.md`; an LLM judge (codex, `gpt-5.6-sol`) then grades the built app in a real browser across **thirteen tag-aligned dimensions** (core_features, visual_design, motion, technical, user_flows, edge_cases, responsiveness, accessibility, performance, writing, innovation, design_fidelity, behavioral). Everything under `tasks/` is **generated or vendored** — the source of truth for shared pieces lives in `packages/corpuscheck/` (python tooling, canonical templates, schemas) and `packages/webmcp-contracts/` (module specs).

## Non-negotiable invariants (hard-won; a violation is a corpus defect)

1. **Consistency is scripted, never hand-propagated.** After ANY edit to a canonical source (`packages/corpuscheck/src/corpuscheck/canonical/*`, the `DOCKERFILE`/`TASK_TOML_TMPL` constants, the judge header), run `uv run corpuscheck propagate` and confirm `--check` reports zero drift. Never hand-copy a shared file to N tasks. corpuscheck's shared-shape tier + `drift` fail on any divergence.
2. **Judge integrity (in corpuscheck `canonical/system_prompt.md`, propagated).** The judge is an OBSERVER, never a repairer: it must not create/modify/delete any file (never "fix" a broken app to grade it — a broken app scores broken), never read app source from disk, and `browser_evaluate` is read-only measurement only (no DOM/storage/state mutation via JS — real interactions or the declared WebMCP tools only). Judge `cwd` is `/logs/verifier`, NOT `/app`. Verdicts prefix reasoning `BLOCKED:` (couldn't exercise) vs `FAIL:` (exercised, misbehaved).
3. **WebMCP contract mandatory at authoring time** with per-`Feature:`-group binding coverage; the bridge (`webmcp_stdio_server.mjs`) resolves its target to the VISIBLE tab (a multi-tab desync once caused fabricated-success verdicts). Unit suite fails contract-less task dirs.
4. **Rubric criteria are LLM-judge, browser-observable statements ONLY — never code/`.py` checks.** Every PRD promise must be tested by a criterion a violating build would actually FAIL (adversarial coverage). Recurring holes: export-content SHAPE contracts (+ regenerated `exportedAt`/`generatedAt` stamps), secondary import modes with per-field validation, field-bound contracts (max/range/enum/cross-field), keyboard shortcuts (undo Ctrl+Z, Cmd+K), interoperable export formats (ICS/PGN/JSON-Schema), boundary values at the exact stated threshold.
5. **Polarity discipline.** A description that asserts a DEFECT must carry `negate = true` (else it rewards the failure — a real bug found corpus-wide); a `negate = true` description states the bad condition PRESENT, never as an absence. innovation may be all-positive with a positive catch-all. Never rewrite/renumber/delete an existing criterion you didn't author — ids are provenance; only ADD.
6. **API-shaped schemas without a backend** (mandate 5 in docs/instructions.md): form/data schemas mirror the domain's real API payload shapes; the created record IS the would-be request body; exports/imports validate against the same schemas.
7. **Useful end state** (`task-authoring` skill): every app converges on a produced, interoperable, downloadable artifact of the session's actual work — MCP-queryable, genre-correct persistence, import round-trips.

Four genres: **good-app** tasks (the original 25, in-memory state, no localStorage), **website-fidelity** tasks (8, pixel-perfect recreations of live sites — landing-landonorris, landing-avax-network, landing-hildenkaira, mosbyfiles, landing-razorpay-sprint-26, landing-readymag, landing-units-gr, landing-wolverineworldwide), **hard browser apps/games** (21, canvas/game/tool apps from zto-phase2 PRDs), and **framework rebuilds** (11, e.g. workflow-docuseal, creative-tools-mermaid-live-editor, data-tracking-ghostfolio, data-tracking-plausible-analytics). The latter two genres keep localStorage where their source PRD mandates it — the no-localStorage rule binds only the good-app genre. Any task video that the judge must see rendered needs a VP9 `.webm` source ahead of mp4 — the judge's codec-limited chromium cannot decode h264.

## Commands

```bash
# Unit tests (corpuscheck package suite, includes the webmcp_h3 contract tests)
uv run pytest packages/corpuscheck/tests

# Corpus certification + consistency (all tooling is the corpuscheck CLI,
# a uv-workspace member at packages/corpuscheck — run from repo root)
uv run corpuscheck validate --all --force --root tasks
uv run corpuscheck propagate --check   # canonical-surface drift (zero = clean)

# Run a task end-to-end (builder + verifier)
harbor run -p tasks/frontend-data-tracking-admin-analytics-dashboard -a Codex -m sonnet

# Re-score an existing trial's artifacts without re-running the builder.
# `harbor score` exists ONLY in the Kurry/harbor fork (not upstream). The repo's
# pyproject.toml + uv.lock pin harbor to that fork by SHA, so run from repo root:
uv run harbor score <trial-or-job-dir> \
  --task tasks/<slug> --label my-label --action append

# Cheap dev-tier judging (no file edits): export REWARDKIT_MODEL=gpt-5.6-luna
# Production judging uses the toml default (gpt-5.6-sol). Local verifier auth
# may use OPENAI_API_KEY or CODEX_AUTH_JSON; the builder agent needs
# CLAUDE_CODE_OAUTH_TOKEN.

# Capture reference screenshots from every task's solution/app oracle
# (also a per-oracle smoke validation: serve + zero console/page errors)
uv run corpuscheck screenshots capture [slug ...]
uv run corpuscheck screenshots install [slug ...]   # install into task envs

```

### Judge-in-CI

Maintainers can comment exactly `/judge` on an open PR to run
`.github/workflows/judge-oracle.yml` for a PR whose diff is confined to exactly one
`tasks/<slug>/solution/app/` tree. The workflow
runs the task's `solution/solve.sh` through Harbor's `oracle` agent and judges
it with `gpt-5.6-luna` using the repository's `CODEX_AUTH_JSON` secret. It
updates a sticky PR score comment and appends the successful `{slug, sha, model,
total, per-dim}` record to `docs/judge-ledger.jsonl` on `main`; verifier
`reward.json` and `reward-details.json` stay in ephemeral job storage and must
never be committed under a task.

The command is restricted to `OWNER`, `MEMBER`, or `COLLABORATOR` comments
because it consumes the owner's ChatGPT-plan quota and exposes an OAuth secret
to the verifier environment. It never runs automatically on PR-controlled code. Runs are globally serialized
and accept one task only. Do not add matrix fanout, broad push triggers, or
corpus sweeps to this OAuth workflow. For a manual run, dispatch **Judge oracle
with Codex OAuth** with one task slug.

Dimension tomls (`tests/<dim>/<dim>.toml`) are the single source of truth for criteria and are edited directly (see `docs/rubrics.md` for criterion conventions; the `rubrics` skill does the alignment work). Outcome / user-flow lists are authored as criteria in a dimension toml — the `behavioral` dimension covers them when a task ships it; until then they live in `core_features`. There is no separate outcomes file.

**Legacy authoring archive.** Historic per-task authoring folders were moved to `~/Documents/frontend-repository-authoring-backup-2026-07-18`; the retired `regen_dimension_tomls.py` (deleted) and full `package_frontend_tasks` runs are legacy paths that need them restored. Do not route new work through that pipeline — edit instruction.md and the dimension tomls directly. The mapping slug→source lives in corpuscheck package data (`packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json`) and `TASK_SPECS` in `corpuscheck/package_frontend_tasks.py`.

## Architecture

### Generation pipeline (edit generators, never the per-task copies)

`corpuscheck.package_frontend_tasks` (`packages/corpuscheck/src/corpuscheck/package_frontend_tasks.py`) is the single source of truth for everything replicated across tasks: `TEST_SH` (tests/test.sh), `TASK_TOML_TMPL` + `ARTIFACT_EXCLUDES` (task.toml), `DOCKERFILE`, the judge `[judge]` header, and `rubric_to_tomls()` (legacy: compiled archived authoring JSON into dimension tomls). `packages/corpuscheck/src/corpuscheck/canonical/` holds the authored templates it inlines: `system_prompt.md` (judge prompt), `mcp/reward_mcp_servers.toml` (judge MCP servers fragment), `mcp/webmcp_stdio_server.mjs` (vendored per task as `tests/webmcp_stdio_server.mjs`), `test.sh`. All `test.sh` and `task.toml` copies across the 65 tasks are byte-identical products of these templates — a unit test enforces the artifact-exclude set, so a drive-by edit to one copy will fail CI-style checks.

### Task anatomy

- `instruction.md` — PRD the builder sees. Content sections (`<summary>`, `<core_features>`, `<visual_design>`, `<motion>`, `<requirements>`) are written as observable behaviors (action → expected evidence, quantifiers resolved). Protected sections (`<integrity>`, `<delivery>`, `<webmcp_action_contract>`, `<reference_screenshots>`) are contract/plumbing — the webmcp block is rendered by `corpuscheck webmcp apply` (`corpuscheck/webmcp_h3.py`) from corpuscheck schemas/webmcp-assignments.json and module specs in `packages/webmcp-contracts`. The contract is mandatory at authoring time (never deferred; the unit suite fails contract-less task dirs), and bindings aim to cover every `Feature:` group — groups the modules can't express get an explicit `mechanics_exclusions` entry.
- `README.md` — canonical generated surface (title + one-line description from corpuscheck schemas/webmcp-task-sources.json, standard Judging/Running sections), rendered by `corpuscheck propagate` — never hand-edited.
- `environment/` — Dockerfile + `reference-screenshots/` (copied to `/reference-screenshots` in the builder container; images are advisory, instruction text wins).
- `solution/app` — the oracle. Used by `solve.sh`, by the screenshot capture script, and validated to serve with zero console/page errors. Oracles that serve a build output (`vite preview`, `http-server dist`) keep the built `dist/` committed alongside the source so both the capture harness and `test.sh` (`verify:build` then `start`) work. Its `README.md` is likewise a generated `corpuscheck propagate` surface (module list from corpuscheck schemas/webmcp-assignments.json).
- `tests/` — `test.sh` (verifier entry), `system_prompt.md`, `mcp/webmcp_stdio_server.mjs`, and four `<dim>/<dim>.toml` rubrics (31–42 criteria per task).

### Verifier / judge stack

The judge env is split for integrity: `environment/Dockerfile` bakes builder-safe pinned tooling (`tasks/_pins.py`; playwright, `@playwright/mcp`, start-server-and-test) plus the WebMCP bridge at `/opt/webmcp/webmcp_stdio_server.mjs` for builder self-tests, while the judge-only **rewardkit** harness is installed by `tests/test.sh` at verify time — deliberately never baked, so the builder agent cannot inspect or tamper with it (bump `HARBOR_REWARDKIT_GIT_SHA` and regenerate test.sh copies together; a failed install is an infra error, exit 1). The baked entrypoint (`/opt/verifier/entrypoint.sh`) launches a **shared headless Chrome** on CDP port 9222 with blink pointer-capability flags (without them headless Linux reports `hover: none` and Tailwind v4 strips every `hover:` style — motion criteria then false-fail), and a Docker `HEALTHCHECK` (Chrome CDP up) surfaces a broken judge env at `harbor run --install-only` time, before any trial. On Modal, harbor replaces the image ENTRYPOINT with its sandbox keepalive — modal job configs must set `environment.kwargs.keepalive: ["/opt/verifier/entrypoint.sh", "sh", "-c", "sleep infinity"]` so Chrome still starts (all configs/*.yaml do); local docker only overrides CMD and needs nothing. `tests/test.sh` installs rewardkit, gates on Chrome health (unreachable = infra error, non-zero exit), exports `WEBMCP_CDP_PORT`/`WEBMCP_CDP_ENDPOINT`, serves the app on port 3000, and runs `rewardkit /tests`; app build failures write a zero `reward.json` and exit 0.

The judge gets two MCP servers attached to that same Chrome: **playwright** (`@playwright/mcp`, observation + gesture mechanics) and **webmcp** (the task-local CDP bridge), which calls the app's contract-mandated `window.webmcp_session_info/list_tools/invoke_tool` on the *same page* playwright drives — apps are client-side-state SPAs, so a second page would be a different app instance. The judge prompt mandates WebMCP-first for state-changing setup and playwright for anything a criterion grades mechanically, plus accuracy guards (hover verdicts via computed-style-while-hovering, desktop-viewport before layout judgments, count deltas measured immediately around the action, fresh-load before reveal-state criteria — WebMCP scroll jumps pollute scroll-reveal state — and two-frame early/settled sampling for sub-second intro animations).

### Rubric conventions (see `docs/rubrics.md`)

Criteria are authored directly as `[[criterion]]` entries in the dimension tomls (id stable, descriptive snake_case `name`, `type`/`weight`/`negate` per `docs/rubrics.md`). Rules that matter: every dimension keeps ≥1 positive criterion; negatives (`negate=true`) are allowed but never required, and only `innovation` carries a catch-all (positive). When a negative is used it is phrased as the bad condition being present; titles must be browser-observable — internal-implementation claims ("uses Redux Toolkit") are banned because judges cannot verify them; criteria that grade an animation/gesture must require the real UI control path (a WebMCP state shortcut would snap the state and falsely show no animation); `nice to have` maps to weight 0.5, `must have` to 1.0. Keep instruction and rubrics mutually consistent in both directions (the `rubrics` skill enforces this).

## Pull request messages

PR bodies are checkable specifications, not summaries. Always include: (1) a **What this PR does** paragraph naming the exact task/tooling touched and linked issue; (2) a **This PR must** checklist itemizing every intended change — for oracle fixes, one item per addressed criterion with its name and the previously observed failure; (3) a **Verification contract** listing the commands run and their observable results (build clean, port-3000 serve with zero console errors, WebMCP round-trip, verification media committed, no out-of-scope changes). Bugbot reviews PRs against their stated promises — a thin body makes the review vacuous, so it is treated as a defect.

## Cursor Cloud specific instructions

The startup update script runs `uv sync` (Python `uv` workspace: `harbor` fork + `corpuscheck`) and `npm ci` (root npm workspace: `@zto/webmcp-contracts` + Playwright/ESLint dev deps). `uv` lives at `~/.local/bin`; if it is not on `PATH` in a fresh shell, invoke it as `~/.local/bin/uv`. Standard commands live in this file's **Commands** section, `README.md`, root `package.json` scripts, and per-task `solution/app/package.json` — reference those rather than re-deriving them.

- **`uv sync` and root `npm ci` do NOT install per-task oracle dependencies.** Each `tasks/<slug>/solution/app/` is its own npm project. To run/build an oracle: `cd tasks/<slug>/solution/app && npm install && npm run verify:build && npm run start` (serves on `http://localhost:3000` via `vite preview --strictPort`, so free port 3000 first). There are ~100 task apps; install only the one(s) you are working on, on demand.
- **`uv run corpuscheck propagate --check` reports pre-existing drift** (~133 files across tasks) on a clean checkout — this is the corpus's committed state, not a setup failure. Only treat NEW drift you introduce as actionable.
- **`corpuscheck validate` takes task names as positional args** (e.g. `uv run corpuscheck validate frontend-game-letterdrop --root tasks`), not `-i`. Use `--all` for the whole corpus.
- **The full `harbor run` builder+verifier loop is NOT set up here.** It needs Docker (not installed) plus external LLM credentials — `CLAUDE_CODE_OAUTH_TOKEN` (builder) and `OPENAI_API_KEY`/`CODEX_AUTH_JSON` (judge, `REWARDKIT_MODEL=gpt-5.6-luna` for the cheap dev tier). Day-to-day authoring/validation and running oracle apps do not require it.
