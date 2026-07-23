# eval-intelligence/frontend-planning-market-stall-flow-planner

Market stall flow planner with adaptive grids, scheduling matrices, resource planning, constraint prediction, approvals, and interruption recovery primitives.

## Judging

To score an un-judged run, or re-score a trial:

```bash
uv run harbor score <trial-or-job-dir> --task tasks/frontend-planning-market-stall-flow-planner
```

This task uses 13 grading dimensions (core_features, visual_design, motion, technical, user_flows, edge_cases, responsiveness, accessibility, performance, writing, innovation, design_fidelity, behavioral).

## Running the oracle

To run the oracle manually, ensure the task has a `solution/app` directory (a task skeleton without an app cannot be run).

```bash
cd tasks/frontend-planning-market-stall-flow-planner/solution/app
npm install
npm run verify:build
npm start &
```
