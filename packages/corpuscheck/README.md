# corpuscheck

`corpuscheck` certifies that the frontend task corpus works as a dataset for
valid evaluation, not merely that its files parse. It combines cheap static
validation, persisted fingerprints and waivers, and positive/negative trial
gates.

All commands run from the repository root via the uv workspace
(`uv run corpuscheck ...`). New consolidated subcommands: `propagate`
(canonical shared surfaces), `scaffold` (dimension baselines), `webmcp`
(contract render/check/apply), and `screenshots capture|install`
(oracle reference screenshots; capture shells out to the node asset in
`src/corpuscheck/assets/`), and `oracle-ci` (the no-LLM oracle workspace and
judge-setup contract). Canonical templates and WebMCP schemas ship as package
data under `src/corpuscheck/canonical/` and `src/corpuscheck/schemas/`.

```bash
uv run corpuscheck discover
uv run corpuscheck validate frontend-workflow-docuseal
uv run corpuscheck validate --all --incremental
uv run corpuscheck drift --all
uv run corpuscheck propagate --check
uv run corpuscheck scaffold --check
uv run corpuscheck webmcp check
uv run corpuscheck oracle-ci frontend-workflow-docuseal
uv run corpuscheck oracle-ci --changed
uv run corpuscheck screenshots capture <slug>
uv run corpuscheck screenshots install <slug>
corpuscheck status --all
corpuscheck advance frontend-workflow-docuseal
corpuscheck history frontend-workflow-docuseal --limit 10
corpuscheck reliability ingest SLUG --trial /path/to/trial --label rerun-1
corpuscheck reliability flips SLUG --min-labels 2
corpuscheck reliability flips --all
corpuscheck judge-accuracy
corpuscheck reliability report
```

Every command accepts `--db PATH`. The default database is
`packages/corpuscheck/.corpuscheck.db`. Validation stores its run, per-tier
results, and task fingerprints. `--incremental` skips a task only when its
fingerprint is unchanged since its last all-pass run; `--force` disables that
skip. At the end, validation compares with the previous identical validation
command and reports newly-failing, known-failing, and fixed checks.

## Validation tiers

The tiers are `layout`, `shared_shape`, `contract`, `instruction`, `rubric`,
`eval_validity`, and (when `solution/app` exists) `oracle`. They check canonical
layout and shared files, instruction and WebMCP integrity, rubric/eval validity,
authoring debris, executable verifier plumbing, oracle package shape, denied
brands, build-output presence, and browser-compatible video source ordering.

Accept only deliberate exceptions, using a tier name as the check key:

```bash
corpuscheck baseline accept frontend-example rubric --reason "legacy exception"
corpuscheck baseline list
corpuscheck baseline remove frontend-example rubric
```

A baselined failure prints as `WAIVED`, is stored as `skip`, and does not fail
the run.

## Readiness lifecycle

Readiness is monotonic only while task content is unchanged:

```text
registered -> static_valid -> oracle_serving -> oracle_certified
           -> nop_certified -> trial_ready
```

`advance SLUG` recomputes the two static stages. A changed fingerprint demotes
the task to the highest stage still statically provable. Higher stages require
explicit evidence:

```bash
corpuscheck record serving SLUG --validation /path/to/validation.json
corpuscheck record oracle SLUG --trial /path/to/oracle-trial --reward-min 0.9
corpuscheck nop-scaffold SLUG --out /tmp/nop-SLUG
corpuscheck record nop SLUG --trial /path/to/nop-trial --reward-max 0.15
```

This follows the SWE-gen-style two-sided validity test: the known-good oracle
must score highly, while a deliberately empty NOP app must score near zero.
Together they show that criteria reward the intended behavior and do not pass
vacuously. Failed oracle gates print dimension scores; failed NOP gates identify
criteria that passed on the empty app.

The NOP scaffold contains an empty body, WebMCP contract stubs, and exactly the
`start` and `verify:build` scripts needed for a normal Harbor trial.

## Oracle contract CI

`oracle-ci` is the deterministic pre-scoring gate for solution oracles. By
default it runs six stages: all static validation tiers; `npm ci` plus
`verify:build`; a port-3000 Chromium smoke with non-empty HTML and zero
console/page errors; assigned-module, read-only, and visible-mutation WebMCP
probes; the task's canonical Playwright e2e suite (`solution/app/e2e.spec.mjs`,
run against the same served app and skipped with a log line when absent); and a
structural boot of every dimension TOML's judge MCP servers against the primary
and reduced-motion CDP browsers. It never installs rewardkit, calls an LLM, or
needs API keys.

GitHub splits those responsibilities between two checks. Oracle contract CI
passes `--skip-e2e` and runs the other five stages; the Playwright Tests matrix
owns e2e execution and report artifacts for each changed task, then updates one
PR comment with every task's pass, fail, or skip status. Local invocations
continue to run all six stages unless they explicitly pass `--skip-e2e`.

The command copies each `solution/app` to a temporary directory before install,
build, and serve, so tracked oracle files stay unchanged. Install the root Node
workspace and Playwright Chromium once before local use:

```bash
npm ci
npx playwright install chromium
uv run corpuscheck oracle-ci <slug>
```

## Judge reliability

The reliability harness derives ground truth from machine artifacts only — it
ingests existing trial directories and never launches judged runs or asks for
human labels. `reliability ingest SLUG --trial DIR --label NAME` parses
`DIR/verifier/reward-details.json` into the `verdicts` table (one row per
slug/label/dimension/criterion, replaced on re-ingest); a verdict whose
reasoning starts with `BLOCKED:` is flagged blocked. Values are treated as
already normalized: `value < 1` means the criterion failed.

`reliability flips SLUG` reports each criterion's flip rate — the fraction of
ingested label pairs that disagree on the pass/fail verdict at `value >= 1` —
requiring at least `--min-labels` (default 2) labels per criterion.
`reliability flips --all` rolls disagreements up corpus-wide per
dimension + criterion id.

`judge-accuracy` reuses readiness evidence: an `oracle_certified` slug's stored
trial path is ingested under the `oracle-anchor` label (if absent) and scored
for per-dimension oracle false negatives (criteria failing on the known-good
oracle, with failing ids listed); a `nop_certified`/`trial_ready` slug's stored
NOP trial is ingested under `nop-anchor` and scored for vacuous criteria
(criteria passing on the empty app). Summaries persist in the `judge_accuracy`
table keyed by slug/dimension/run kind.

`reliability report` prints a markdown-style summary: noisiest criteria,
per-dimension oracle false-negative rates, the vacuous-criteria list, and
BLOCKED verdict counts by task (the Blocked-vs-Fail taxonomy).

## Check-only guarantee

Corpus task files and shared repository sources are always read-only. The tool
writes only beneath `packages/corpuscheck/`, except for an explicitly selected
`--db` SQLite path and an explicitly selected `nop-scaffold --out` directory,
which must be outside the repository. JSON reports are restricted to
`packages/corpuscheck/` as well.
