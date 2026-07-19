# corpuscheck

`corpuscheck` certifies that the frontend task corpus works as a dataset for
valid evaluation, not merely that its files parse. It combines cheap static
validation, persisted fingerprints and waivers, and positive/negative trial
gates.

```bash
corpuscheck discover --root ../../tasks
corpuscheck validate frontend-workflow-docuseal
corpuscheck validate --all --incremental
corpuscheck drift --all
corpuscheck status --all
corpuscheck advance frontend-workflow-docuseal
corpuscheck history frontend-workflow-docuseal --limit 10
```

Every command accepts `--db PATH`. The default database is
`tools/corpuscheck/.corpuscheck.db`. Validation stores its run, per-tier
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

## Check-only guarantee

Corpus task files and shared repository sources are always read-only. The tool
writes only beneath `tools/corpuscheck/`, except for an explicitly selected
`--db` SQLite path and an explicitly selected `nop-scaffold --out` directory,
which must be outside the repository. JSON reports are restricted to
`tools/corpuscheck/` as well.
