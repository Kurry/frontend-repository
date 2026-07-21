# Production readiness checklist

Phased checklist for taking the corpus — 65 active tasks under `tasks/`, plus 38
quarantined under `tasks-quarantine/` — to production. Each phase links the
GitHub issue that tracks its work. Run all commands from the repo root unless noted.

## Phase 0 — Merge in-flight work

- [x] Land the 9 open `oracle-fix/*` PRs: #522, #523, #524, #525, #526, #527, #528, #530, #532
      (all merged 2026-07-21; per-slug issues closed).

## Phase 1 — First full corpus validation (#533)

- [ ] `corpuscheck validate --all --force` (first run: `--force`, never `--incremental`)
- [ ] `corpuscheck drift --all` (shared-file drift + assignment orphans)
- [ ] `corpuscheck status --all` (readiness funnel snapshot)
- [ ] `uv run corpuscheck propagate --check` (zero drift)
- [ ] `uv run pytest packages/corpuscheck/tests`
- [ ] corpuscheck's own pytest suite (`packages/corpuscheck/tests/`, includes the webmcp_h3 contract tests)
- [ ] Triage every failure: fix, or waive with
      `corpuscheck baseline accept <slug> <tier> --reason "..."` (sparingly, reason required).
- [x] Dist policy: resolved by quarantining 38 tasks (`tasks-quarantine/`) whose only
      oracle-tier failure was "start references 'dist'/'build' but it is absent"
      (2026-07-21). Reinstate per `tasks-quarantine/README.md`.
- [ ] Run once with `--strict-dimensions --strict-oracle` and record the delta
      (non-core dimension tomls and oracle paths only warn by default).

Rubric-tier decision: there is no negative-rubric requirement — negatives
(`negate=true`) and non-innovation catch-alls are optional, and corpuscheck is
relaxed to match (it only requires ≥1 positive criterion per dimension and
innovation's single positive catch-all).

## Phase 2 — Repo hygiene (#534)

- [ ] Delete untracked root captures (`smoke-desktop-postboot.png`, `smoke-mineclash-game.png`).
- [ ] Remove tracked junk: `.orig` merge leftovers, committed `.log` files,
      ~45 stray dev screenshots at `solution/app/` roots, unreferenced debug/smoke
      `.mjs` scripts, the `dropdown-debug` route, `_capture_sunsama_refs.mjs`.
      (Full inventory in #534. Never touch `environment/reference-screenshots/`.)
- [ ] Resolve the needs-confirmation items (corpuscheck `reports/*.json` — resolved: deleted + gitignored,
      ghostty-config `font-playground` route, `regen_dimension_tomls.py` — resolved: deleted).
- [ ] Harden `.gitignore`: `*.orig`, `*.rej`, blanket `*.log`, `Thumbs.db`,
      `desktop.ini`, solution-app-scoped `smoke*/screenshot*/verification*` PNGs.
- [ ] Re-run the Phase 1 command set clean.

## Phase 3 — Task shape completeness (#535)

- [ ] Capture + install `environment/reference-screenshots/` for the 35 active tasks
      missing them (recounted after the quarantine; original 37-task list in #535
      included quarantined slugs):
      `uv run corpuscheck screenshots capture <slug ...>` then
      `uv run corpuscheck screenshots install <slug ...>`,
      then `uv run corpuscheck propagate` (Dockerfile COPY line) and `--check`.
- [x] Decide README policy and make the corpus uniform: every active task's `README.md`
      and `solution/app/README.md` are standardized generated surfaces owned by
      `corpuscheck propagate` (drift-checked by `--check`).

## Phase 4 — Docs / tooling truthfulness (#536)

- [x] Docs half done on main: CLAUDE.md/AGENTS.md no longer mention anticheat or
      mcp_contract; the corpus is canonically **13** dimension tomls.
- [x] Align tooling: remove `anticheat` + `mcp_contract` from corpuscheck
      (dimension list, anticheat rubric-tier checks, README, tests) and update
      the corpuscheck webmcp_h3 tests + scaffold/skill assets to the 13-dim set.

## Phase 5 — Evidence gates (stretch, not release-blocking)

- [ ] Advance tasks through the corpuscheck readiness lifecycle
      (`registered → static_valid → oracle_serving → oracle_certified → nop_certified → trial_ready`)
      by feeding harbor trial results to `corpuscheck record serving/oracle/nop`
      (oracle reward ≥ 0.9, NOP reward ≤ 0.15).
- [ ] Ingest verifier artifacts into `corpuscheck reliability` for per-criterion
      flip rates, oracle false-negatives, and vacuous-on-NOP criteria.
