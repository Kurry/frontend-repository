---
name: jules-fleet-sequencing
description: Sequence large Google Jules coding-agent fleets so the driver agent keeps serial critical-path work local while dispatching only truly parallel, merge-order-free Jules tasks. Use when planning or running many Jules sessions, using a daily Jules quota, splitting backlog/issues across agents, diagnosing failed/rejected Jules sessions, preventing dependency-chain fanout, designing file ownership matrices, or deciding whether work should be done locally vs delegated to Jules.
---

# Jules Fleet Sequencing

Use this skill to turn a large backlog into a live Jules fleet without creating false parallelism. The driver agent is not just a dispatcher: it owns the serial work that unlocks the fleet.

## First Rule

**Driver keeps serial work. Jules gets only independent work.**

Do not delegate a small critical-path blocker, interface contract, branch protection/settings change, merge/rebase chore, CI unstick, or ticket-rewrite task when doing it locally would unlock many Jules tasks. Dispatching the blocker and waiting is underutilization disguised as parallelism.

## Active Driver Rule

Updating the task list is not progress. It is a checkpoint that must be followed by action.

After recording or restructuring a plan, immediately do exactly one of these before stopping:

1. Execute the first `driver-owned serial` task locally with tools.
2. Dispatch every currently ready `Jules parallel` task whose ownership matrix is conflict-free.
3. If nothing can be executed or dispatched, state the concrete blocker and start a monitored wait with an explicit wake condition, poll command, and next action.

Never end a turn with only: "task list updated", "plan recorded", "queued", "holding", or "waiting" unless a tool-backed monitor or follow-up has actually been started. The driver must keep moving the fleet until the next action is genuinely external.

Use this invariant:

```text
Plan update -> immediate tool action -> observed result -> next action.
```

If the agent feels tempted to "sleep" after planning, it should instead execute `S1` locally or dispatch the ready parallel wave.

## Classify Before Dispatch

Build a table with one row per unit of work before creating sessions:

| Class | Owner | Dispatch rule |
|---|---|---|
| `driver-owned serial` | Driver agent | Execute locally now. Examples: frozen interface PR, shared module edit, branch protection, CI/automerge fixes, rebases, merge conflict repair, ticket reshaping. |
| `Jules parallel` | Jules | Dispatch only if it owns disjoint files, depends only on `main`, has a self-contained prompt, and can merge in any order. |
| `blocked` | Nobody yet | Do not dispatch. First merge the contract, resolve product intent, or split/rewrite the ticket. |

Independence means both conditions are true:

1. The task modifies a disjoint file/test surface.
2. The task imports/depends only on an immutable contract already merged to `main`.

If either condition is false, it is not ready for Jules fanout.

## Required Ownership Matrix

Before every Jules wave, write a file ownership matrix:

```markdown
| Task | Owner | Source files | Test files | Depends on main-only contract? | Ready? |
|---|---|---|---|---|---|
| FC-interface | driver | harvest/schema/*, harvest/record.py | tests/test_schema.py | n/a | serial |
| FC-17 | Jules | harvest/plugins/pr_comments.py | tests/test_pr_comments.py | yes | ready |
```

Rules:

- No file may appear in two Jules tasks, including tests, fixtures, registries, and barrel exports.
- Shared registries must be append-only through per-task files or entry points; otherwise the registry edit is driver-owned serial work.
- If two tasks need the same source or test file, merge them into one task or make the shared interface local-first.
- If a task needs an unmerged PR, do not dispatch it. Merge/freeze the interface first.

## Dispatch Algorithm

1. **Inventory live state.** Check open PRs, required checks, current Jules sessions, and recent failed/awaiting-feedback sessions. Prefer the existing `jules-api` skill/CLI for raw Jules lifecycle work.
2. **Extract blockers.** Identify tiny interface PRs, shared contracts, CI/automerge settings, and ticket rewrites. Do these locally.
3. **Freeze the contract.** Merge the interface-only PR to `main`: schema, typed stubs, signature-only skeletons, empty extension points, and fixtures. No downstream logic belongs here.
4. **Rewrite parallel tickets.** Inline the frozen contract, exact file ownership, branch name, tests, acceptance criteria, and the rule: commit/PR automation is the finish line; do not push by hand.
5. **Fan out Jules.** Dispatch every `Jules parallel` row whose matrix is conflict-free. Use enough sessions to saturate capacity, but reserve quota for retries.
6. **Monitor and replenish.** As PRs land, fail, or ask questions, the driver triages. Fix serial blockers locally, close/merge duplicates, rewrite bad prompts, and dispatch the next ready tickets.

## Good Workflow Shape

Healthy sequencing looks like this:

1. Record the full plan up front: `S1`, `S2`, `S3` for serial unlocks and `P` for parallel Jules waves.
2. Execute `S1` locally immediately, especially if it freezes contracts, creates repos, lands ADRs, or resolves docs/spec contradictions.
3. Verify the serial artifact is on `main` before depending on it.
4. Continue the serial chain locally while preparing Jules prompts in parallel.
5. Dispatch Jules only after each prompt depends on frozen `main` artifacts and owns disjoint files.

Example shape:

```text
S1 serial: merge contracts/ADR PR, freezing all interfaces.
S2 serial: create repo, skeleton directories, and first issue.
S3 serial: create dependent instance repo.
S4 serial: resolve contradictory documentation that would confuse agents.
P parallel: dispatch independent scaffolder/plugin builds via Jules.
```

If the next action unlocks the whole fleet, the driver does it. Jules is for the wide layer after the narrow bridge is already built.

## Staying Awake

The driver remains active while any of these are true:

- A serial task can be performed locally.
- A ready Jules ticket has not been dispatched.
- A Jules PR is failing for a reason the driver can fix.
- A PR is green but needs merge/automerge/rebase attention.
- A failed or awaiting-feedback Jules session can be converted into a better ticket.

Only wait when the next state transition is outside the driver's control, such as CI currently running or a Jules session actively producing a PR. Even then, record the poll command and the next action:

```text
Waiting on CI for PR #123.
Poll: gh pr checks 123 --repo Kurry/example --watch
Wake action: if green, merge; if red, inspect failing logs and patch locally.
```

## Never Delegate These

- A small fully specified blocker that many tasks wait on.
- The first interface/schema/contract PR in a wave.
- Shared-file refactors unless the whole refactor is one Jules task.
- Branch protection, repository settings, automerge policy, release workflow fixes, or CI required-check repair.
- Rebase/update-branch/merge-conflict/green-PR merge chores.
- Ticket decomposition, file ownership matrix creation, or duplicate issue consolidation.

## Jules Ticket Contract

Every Jules prompt must be self-contained:

- Repo and base branch.
- Unique branch name.
- Exclusive source/test files.
- Frozen contract excerpt or link to files already on `main`.
- Exact in-scope and out-of-scope files.
- Test commands and expected signals.
- Acceptance criteria.
- “Do not git push. Commit is the finish line; Jules automation opens/updates the PR.”

Read `references/ticket-template.md` when writing prompts.

## Failure Pattern Review

Read `references/failure-patterns.md` before a large wave, after any batch of failures, or whenever an agent proposes gating most work behind one Jules session.

If session JSON is available, run:

```bash
python scripts/jules_fleet_audit.py /tmp/jules_sessions.json
```

Use the output to spot failed clusters, duplicate prompts, awaiting-feedback sessions, and likely blocked-vs-ready queues. If no JSON file exists, capture it with the existing Jules API skill first.
