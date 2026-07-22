# Indoor Plant Growth Journal Batch Reconciler Rn Claude Session

Build an 'Indoor Plant Growth Journal — Batch Reconciler' using React and Tailwind CSS. The app features a domain-native UI for managing plant observations, derived batch reconciliation, and portable session artifacts (plant-growth-v1.json). The app strictly uses in-memory state, ensuring no localStorage or other persistence mechanisms are employed.

A frontend-only Harbor eval task. A builder agent recreates the
app in `instruction.md`, delivering a self-contained SPA in `/app`
with `start` (port 3000) and `verify:build` scripts plus the
WebMCP tool surface from the action contract.

## Judging

The verifier serves the built app and grades it in a real browser
across 13 weighted dimensions; `pass` at reward >= 0.7. The judge
observes via Playwright MCP and drives state-changing setup through
the app's registered WebMCP tools (a task-local CDP bridge in
`tests/webmcp_stdio_server.mjs`). Criteria live in
`tests/<dimension>/<dimension>.toml`.

## Running

    harbor run -p tasks/frontend-data-tracking-indoor-plant-growth-journal-batch-reconciler-rn-claude-session -a claude-code -m sonnet
