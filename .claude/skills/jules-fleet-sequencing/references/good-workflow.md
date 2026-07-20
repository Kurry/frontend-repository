# Good Jules Fleet Workflow

A good Jules fleet driver behaves like an execution lead, not a passive queue manager.

## Pattern

Start by recording the whole work breakdown:

```text
S1 serial: merge contracts + ADR PR, freezing all interfaces.
S2 serial: create repo + frozen skeleton + seed issue.
S3 serial: create dependent instance repo.
S4 serial: resolve documentation contradictions before agents read them.
P parallel: dispatch independent builds via Jules after the interfaces land.
```

Then execute the serial chain directly:

1. Do `S1` locally.
2. Open and merge the PR.
3. Verify the contract exists on `origin/main`.
4. Move to `S2` locally while preparing the parallel prompts.
5. Dispatch Jules only when the `P` tasks depend only on merged `main` artifacts and have disjoint file ownership.

## Why It Works

The driver owns the narrow bridge. Jules owns the wide road.

This avoids the common failure where the driver delegates the keystone PR, waits on one asynchronous session, and leaves dozens or hundreds of usable Jules slots idle. The small serial chain should be pushed through by the driver as fast as possible because every minute saved there multiplies across the parallel wave.

## Active Task Lists

A task list is an execution queue, not a stopping point.

After every task-list update, the driver must immediately execute the first actionable row:

- If the first actionable row is serial, do it locally now.
- If several rows are ready parallel work, dispatch the whole conflict-free wave.
- If all rows are blocked, name the blocker, start a concrete monitor, and state the wake action.

Bad:

```text
Task list updated. S1 is next.
```

Good:

```text
Task list updated. Executing S1 now: opening the interface PR and merging it to main.
```

If the agent updates the plan and then goes idle, it has failed the workflow even if the plan is correct.

## Signals Of A Good Plan

- The serial tasks are numbered and visibly in progress.
- The driver can say which artifact has landed on `main`.
- Parallel tickets are prepared but not dispatched before their dependency exists.
- Jules prompts reference frozen files, not pending PRs.
- The plan has an explicit replenish loop after failures or merges.
- Every plan update is followed by a tool-backed action or a monitored wait with a wake condition.

## Anti-Pattern

Do not say: "Only the interface Jules session is in progress; all other work is gated."

Say instead: "I am implementing and merging the interface locally now. Once it is on `main`, I will fan out the disjoint tickets."

Do not say: "Task list updated. I am ready for the next step."

Say instead: "Task list updated. I am executing the next serial step now."
