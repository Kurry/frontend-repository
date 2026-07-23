# Production readiness checklist

Phased checklist for taking the corpus — 65 active tasks under `tasks/`, plus 38
quarantined under `tasks-quarantine/` — to production. Each phase links the
GitHub issue that tracks its work. Run all commands from the repo root unless noted.

## Phase 0 — Merge in-flight work

- [x] Land the 9 open `oracle-fix/*` PRs: #522, #523, #524, #525, #526, #527, #528, #530, #532
      (all merged 2026-07-21; per-slug issues closed).

## Phase 1 — First full corpus validation (#533)

- [x] `corpuscheck validate --all --force` — 65/65 active tasks pass.
- [x] `corpuscheck drift --all` — shared surfaces and assignment inventory clean.
- [x] `corpuscheck status --all` — all 65 tasks are at `static_valid`.
- [x] `uv run corpuscheck propagate --check` — zero drift.
- [x] `uv run pytest packages/corpuscheck/tests` — 55 tests pass, including
      the webmcp_h3 contract suite.
- [x] `npm run test:webmcp-contracts` and `npm run typecheck:webmcp-contracts`
      — 19 contract tests pass and TypeScript is clean.
- [x] Triage every failure: fix, or waive with
      `corpuscheck baseline accept <slug> <tier> --reason "..."` (sparingly, reason required).
- [x] Dist policy: resolved by quarantining 38 tasks (`tasks-quarantine/`) whose only
      oracle-tier failure was "start references 'dist'/'build' but it is absent"
      (2026-07-21). Reinstate per `tasks-quarantine/README.md`.
- [x] Run once with `--strict-oracle` — 65/65 pass. The retired
      `--strict-dimensions` flag no longer exists because all thirteen dimensions
      are canonical validation inputs.

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

- [x] Capture + install `environment/reference-screenshots/` for all 65 active
      tasks (#555). Every tracked task now has the directory, and
      `uv run corpuscheck propagate --check` reports zero drift.
- [x] Decide README policy and make the corpus uniform: every active task's `README.md`
      and `solution/app/README.md` are standardized generated surfaces owned by
      `corpuscheck propagate` (drift-checked by `--check`).

PR #541 removed the stale task-local `solution/reward-details.json` files that existed
at that point. Current verifier results still live in Harbor trial output under
`verifier/reward-details.json`; newly generated oracle-judge snapshots may be committed
under `solution/` as audited review evidence according to `.cursor/BUGBOT.md`.

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
