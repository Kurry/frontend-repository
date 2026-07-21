# Quarantined tasks

These 38 tasks are quarantined (2026-07-21) pending a decision on the dist policy.

Each task's oracle (`solution/app`) serves a build output — its `start` script
references `dist/` or `build/` — but the built output is not committed to git.
The corpuscheck oracle tier therefore fails them with:

```
oracle: start references 'dist', but solution/app/dist is absent
```

That was each task's **only** corpuscheck failure; everything else about them is
intact. They are excluded from the active corpus (now the 65 tasks under
`tasks/`), from `scripts/propagate_canonical.py`, and from the corpuscheck
validate/drift sweeps.

## How to reinstate a task

1. Either commit the built output (`cd solution/app && npm ci && npm run build`,
   then commit `dist/`), or relax the corpuscheck oracle-tier dist check.
2. `git mv tasks-quarantine/<slug> tasks/<slug>`
3. Re-run `python3 scripts/propagate_canonical.py` and the corpuscheck sweep
   (`cd tools/corpuscheck && uv run corpuscheck validate --all --force --root ../../tasks`).
