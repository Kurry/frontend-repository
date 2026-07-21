---
name: harvest-oracle
description: >-
  Harvest a finished harbor trial's built agent app into a task's
  solution/app oracle (for tasks that lack one), copy the trial's
  reward-details.json into solution/, commit each app separately, push to main,
  and drive a Jules fleet (held at N concurrent, refilled on completion) that
  fixes each task's oracle against its graded failures. Use when a trial is
  running and you want to backfill missing oracles from agent builds and/or
  dispatch per-task Jules fix sessions from reward-details.
domain: orchestration
---

# Harvest oracles from a running trial + drive a Jules fix-fleet

A harbor trial builds each task's app under
`jobs/<job>/<task>__<id>/artifacts/app/` and grades it into
`jobs/<job>/<task>__<id>/verifier/reward-details.json`. The full task slug is in
that trial dir's `config.json` (`task.path`). This skill turns those finished
builds into committed `solution/app` oracles for tasks that lack one, then
dispatches one Jules session per task to fix the oracle against its graded
failures — keeping a fixed number of Jules sessions in flight.

## Pieces

- `scripts/harvest_oracle.py` — copy `artifacts/app/` → `tasks/<slug>/solution/app`
  (minus `node_modules`/`.git`) and `verifier/reward-details.json` →
  `tasks/<slug>/solution/reward-details.json`, ONLY for tasks with no oracle
  (unless `--force`). Prints one JSON line per harvested task. Optional score
  gate: `--min-reward`.
- `scripts/jules_fleet_driver.py` — ONE idempotent reconcile pass: count our
  live Jules sessions, and for each finished-but-undispatched task, fill open
  slots up to `--target` by (harvest if oracle-less → `git commit` per app →
  one `git push`) then `jules create` with a fix prompt built from that task's
  `reward-details.json`. State in a JSONL so passes never double-dispatch.

## The loop

Jules only sees **pushed** `main`, so every harvested oracle must be committed
and pushed before its session launches. One reconcile pass:

1. Count live sessions (state ∉ {COMPLETED, FAILED}) among ids in the state file.
2. Slots = `target - live`. Scan the job dir for finished tasks
   (`artifacts/app` + `verifier/reward-details.json`) not already in state.
3. For up to `slots` of them: harvest if the task has no oracle, `git add
   tasks/<slug>/solution`, commit `oracle(<slug>): …`. After all commits in the
   pass, ONE `git push`. Then `jules create --source Kurry/frontend-repository`
   per task (auto-PR, **no** `--require-plan-approval` → plans and proceeds).
4. Append `{slug, session_id}` to state.

Re-run the pass on a timer (~90s) until the trial app is gone and the queue is
empty. Because harvest skips tasks that already have an oracle and the state
file records dispatched slugs, re-runs are safe.

## Jules prompt contract (per task)

The fix prompt names the task, points Jules at `tasks/<slug>/solution/app` ONLY
(never `tests/`, never other tasks — disjoint file surface per the
`jules-fleet-sequencing` skill), pastes the failing criteria (value 0 /
`BLOCKED:` / `FAIL:`) grouped by dimension from `reward-details.json`, and cites
`tasks/<slug>/instruction.md` as the spec. It ends with the finish-line rule:
**commit is the deliverable; do not `git push`; AUTO_CREATE_PR opens the PR;
conclude at a clean commit** (per `jules-api` skill — the push-block is by
design, not an error).

## Guardrails

- Never overwrite an existing oracle without `--force`.
- One Jules session per task; tasks own disjoint files (`tasks/<slug>/solution/app`)
  so the fleet is merge-order-free.
- Leave PRs for review (no auto-merge) unless told otherwise.
- Skills `jules-api` and `jules-fleet-sequencing` (in-project) own the Jules
  lifecycle and fleet-sequencing rules; this skill is the harbor-artifact glue.
