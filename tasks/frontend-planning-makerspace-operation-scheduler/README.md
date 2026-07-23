# Makerspace Operation Scheduler

Makerspace Operation Scheduler.

## Judging

To score this task against an already-built application:

```bash
uv run harbor score <trial-or-job-dir> \
  --task tasks/frontend-planning-makerspace-operation-scheduler \
  --label my-label \
  --action append
```

## Running end-to-end

To run the builder agent and the verifier end-to-end:

```bash
harbor run -p tasks/frontend-planning-makerspace-operation-scheduler \
  -a claude-code \
  -m sonnet
```
