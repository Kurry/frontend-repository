# frontend-workflow-rental-turnaround-control-board

Kanban / workflow app for rental property turnaround management.

## Judging

To evaluate this task:

```bash
# capture screenshot evidence and optionally run an AI-vision heuristic pass
uv run corpuscheck screenshots capture frontend-workflow-rental-turnaround-control-board

# execute WebMCP tools and interactive Playwright paths against the app
uv run corpuscheck webmcp apply frontend-workflow-rental-turnaround-control-board
# (Optional CI/human gating on the captured behavior logs)

# launch a dev-environment HTTP server with `npm start` and attach the headless Chrome judge
uv run test.sh
```

## Running

To run the application manually in development mode:

```bash
cd solution/app
npm install
npm run verify:build
npm start
```
