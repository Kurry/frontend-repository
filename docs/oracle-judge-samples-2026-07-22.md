# Oracle judge samples

Verbatim output from the `gpt-5.6-luna` Codex judge (`.github/workflows/judge-oracle.yml`,
the `/judge` PR-comment trigger) for 35 tasks scored during the 2026-07-22/23
oracle-fix sweep. These are `--agent oracle` runs — the pre-committed
`solution/solve.sh` being judged, not an LLM builder trial, so there is no
builder trajectory here.

## Layout

```
trajectories/<slug>/  # the judge's own reasoning traces
                       # (trajectory.codex.batch.<hash>.jsonl, one per
                       # dimension batch call — not a single trajectory.json)
rewards/<slug>/        # reward.json (per-dimension + weighted total) and
                       # reward-details.json (per-criterion verdicts)
artifacts/<slug>/app/  # tracked source for the oracle app that was judged
```

The artifact snapshot mirrors the Git-tracked contents of each task's
`tasks/<slug>/solution/app/` directory. Screenshots, console logs, and other
verifier-run byproducts remain excluded: `artifacts/` contains the app that
was judged, while `trajectories/` and `rewards/` contain the judge's reasoning
and scoring output.

Where a task was judged more than once during the sweep, this snapshot keeps
the artifacts from its most recent (highest run id) valid attempt.

## Scope

This is a partial snapshot, not the full sweep: only 35 of the ~87 tasks
scored during the sweep still had a downloadable `judge-jobs-*` GitHub
Actions artifact when this was captured (older runs had already expired, or
predate the workflow fix that made artifact upload unconditional). The full
list of scores for every task is tracked separately, not in this folder. The
`artifacts/`, `trajectories/`, and `rewards/` trees contain the same 35 slugs.
