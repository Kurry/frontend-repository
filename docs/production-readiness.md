# Production readiness checklist

Phased checklist for taking the 103-task corpus to production. Each phase links the
GitHub issue that tracks its work. Run all commands from the repo root unless noted.

## Phase 0 — Merge in-flight work

- [x] Land the 9 open `oracle-fix/*` PRs: #522, #523, #524, #525, #526, #527, #528, #530, #532
      (all merged 2026-07-21; per-slug issues closed).

## Phase 1 — First full corpus validation (#533)

- [ ] `corpuscheck validate --all --force` (first run: `--force`, never `--incremental`)
- [ ] `corpuscheck drift --all` (shared-file drift + assignment orphans)
- [ ] `corpuscheck status --all` (readiness funnel snapshot)
- [ ] `python3 scripts/propagate_canonical.py --check` (zero drift)
- [ ] `python3 -m unittest scripts.tests.test_webmcp_h3`
- [ ] corpuscheck's own pytest suite (`tools/corpuscheck/tests/`)
- [ ] Triage every failure: fix, or waive with
      `corpuscheck baseline accept <slug> <tier> --reason "..."` (sparingly, reason required).
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
      `.mjs` scripts, the `dropdown-debug` route, `scripts/_capture_sunsama_refs.mjs`.
      (Full inventory in #534. Never touch `environment/reference-screenshots/`.)
- [ ] Resolve the needs-confirmation items (`tools/corpuscheck/reports/*.json`,
      ghostty-config `font-playground` route, `scripts/regen_dimension_tomls.py`).
- [ ] Harden `.gitignore`: `*.orig`, `*.rej`, blanket `*.log`, `Thumbs.db`,
      `desktop.ini`, solution-app-scoped `smoke*/screenshot*/verification*` PNGs.
- [ ] Re-run the Phase 1 command set clean.

## Phase 3 — Task shape completeness (#535)

- [ ] Capture + install `environment/reference-screenshots/` for the 37 tasks
      missing them (list in #535):
      `node scripts/capture_reference_screenshots.mjs <slug ...>` then
      `python3 scripts/install_reference_screenshots.py <slug ...>`,
      then `python3 scripts/propagate_canonical.py` (Dockerfile COPY line) and `--check`.
- [ ] Decide README policy and make the corpus uniform (38 tasks lack `README.md`).

## Phase 4 — Docs / tooling truthfulness (#536)

- [x] Docs half done on main: CLAUDE.md/AGENTS.md no longer mention anticheat or
      mcp_contract; the corpus is canonically **13** dimension tomls.
- [x] Align tooling: remove `anticheat` + `mcp_contract` from `tools/corpuscheck`
      (dimension list, anticheat rubric-tier checks, README, tests) and update
      `scripts/tests/test_webmcp_h3.py` + scaffold/skill assets to the 13-dim set.

## Phase 5 — Evidence gates (stretch, not release-blocking)

- [ ] Advance tasks through the corpuscheck readiness lifecycle
      (`registered → static_valid → oracle_serving → oracle_certified → nop_certified → trial_ready`)
      by feeding harbor trial results to `corpuscheck record serving/oracle/nop`
      (oracle reward ≥ 0.9, NOP reward ≤ 0.15).
- [ ] Ingest verifier artifacts into `corpuscheck reliability` for per-criterion
      flip rates, oracle false-negatives, and vacuous-on-NOP criteria.
