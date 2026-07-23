# Material Cut-Nesting Planner

Material cut-nesting planner with kerf, grain, defects, and cut-tree topology.

## Judging

```bash
# Verify the oracle builds and serves with zero errors
uv run corpuscheck validate --force --root tasks frontend-planning-material-cut-nesting-planner

# Evaluate an agent run
harbor run -p tasks/frontend-planning-material-cut-nesting-planner -a <agent>
```

## Running

```bash
cd solution/app
npm install
npm run build
npm run preview
```
