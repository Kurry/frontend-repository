# Feltrun

Single-player Texas hold'em poker table good-app eval.

A frontend-only Harbor eval task. A builder agent recreates the application
described in `instruction.md` (an observable-behavior PRD for an opaque
reference app), delivering a self-contained SPA in `/app` with npm scripts
named exactly `start` (serves on port 3000) and `verify:build`, plus the
in-page WebMCP tool surface defined by the instruction's action contract.

## Judging

The verifier serves the built app and grades it in a real browser across
four weighted dimensions — core_features, technical, visual_design, motion
— with `pass` at reward >= 0.7. The judge observes via Playwright MCP and
drives state-changing setup through the app's registered WebMCP tools (a
task-local CDP bridge in `tests/mcp/`). Criteria live in
`tests/<dimension>/<dimension>.toml`.

## Running

```bash
# full trial (builder + verifier); needs CLAUDE_CODE_OAUTH_TOKEN + OPENAI_API_KEY
harbor run -p tasks/frontend-feltrun -a claude-code -m sonnet

# re-score an existing trial (harbor fork at ~/harbor)
cd ~/harbor && uv run harbor score <trial-dir> --task <abs-path-to>/tasks/frontend-feltrun \
  --label rescore --action append
```

Set `REWARDKIT_MODEL=gpt-5.6-luna` in the environment for cheap dev-tier
judging; production uses the toml default.

## Layout

- `instruction.md` — the builder's complete specification
- `environment/` — container image + reference screenshots shown to the builder
- `solution/` — working oracle app + `solve.sh` (verifier-side only)
- `tests/` — verifier entrypoint, judge prompt, dimension rubrics, WebMCP bridge
