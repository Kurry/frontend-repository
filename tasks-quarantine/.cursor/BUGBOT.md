# Bugbot rules — tasks-quarantine/

Included when a PR touches quarantined tasks (oracles whose `start` serves uncommitted
dist/build output).

- Quarantined tasks are OUT of the active corpus: they receive no rubric edits, no
  canonical propagation, and no oracle-fix waves. Flag any PR that modifies a quarantined
  task without either (a) reinstating it (fix the build-output story, then `git mv` back
  to `tasks/` with docs/count updates in the same PR), or (b) an explicit stated reason.
- Reinstatement PRs must show: `verify:build` produces the output `start` serves; the
  task passes `uv run corpuscheck validate --root tasks <slug>` after the move; corpus
  counts in CLAUDE.md/AGENTS.md/README updated (65 active + 38 quarantined changes).
