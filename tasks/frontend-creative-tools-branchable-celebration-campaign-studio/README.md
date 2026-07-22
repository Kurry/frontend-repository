# Branchable Celebration Campaign Studio

A host composes a layered invitation, branches its message and artwork into alternatives, binds recipient groups to variants, reviews generated suggestions with evidence, approves or rejects workflow checkpoints, rehearses delivery failures, tracks RSVP replies, and exports a self-contained campaign bundle plus print-ready cards. Generation is never a one-shot chat response: every step is visible, interruptible, resumable, and tied to the canonical design and recipient state.

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

    harbor run -p tasks/frontend-creative-tools-branchable-celebration-campaign-studio -a claude-code -m sonnet
