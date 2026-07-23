# frontend-creative-tools-variable-type-motion-score

Variable type motion score kinetic typography editor.

## Judging

To judge a builder run against this task locally:

```bash
# Using Kurry/harbor:
uv run harbor score <trial-or-job-dir> \
  --task tasks/frontend-creative-tools-variable-type-motion-score \
  --label local-run \
  --action append
```

## Running the oracle

To run the reference solution (oracle) locally for exploration:

```bash
harbor run -p tasks/frontend-creative-tools-variable-type-motion-score --install-only
# Wait for the harbor build, then open port 3000
```
