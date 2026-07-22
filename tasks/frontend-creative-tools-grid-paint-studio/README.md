# Grid Paint Studio

QR color grid paint studio variant.

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

    harbor run -p tasks/frontend-creative-tools-grid-paint-studio -a claude-code -m sonnet
