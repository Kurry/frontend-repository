# Bugbot rules — packages/ (tooling)

Included when a PR touches `packages/corpuscheck/` or `packages/webmcp-contracts/`.

- `packages/corpuscheck` is the single source of truth for everything replicated across
  tasks: canonical templates (`src/corpuscheck/canonical/`), schemas
  (`src/corpuscheck/schemas/`), and the `corpuscheck` CLI (validate / drift / propagate /
  scaffold / webmcp / screenshots). A change to any canonical template MUST be paired
  with a propagation run — flag template edits whose PR does not also update the 65
  per-task copies (or state that `uv run corpuscheck propagate` was run with zero
  remaining drift in the Verification contract).
- The corpus is exactly 13 dimensions; flag any reintroduction of `anticheat` or
  `mcp_contract` expectations, and any new requirement that rubric dimensions carry
  negative criteria or per-dimension catch-alls (negatives optional; catch-all only in
  `innovation`).
- Flag changes that would make `validate`/`drift` silently skip checks (e.g. widening
  `--incremental` fingerprints, removing tiers) without an explicit rationale.
- `packages/webmcp-contracts` module specs feed rendered `<webmcp_action_contract>`
  blocks in all instructions; spec changes must state their blast radius (how many task
  contracts re-render) and pair with the re-render.
- pytest suites live in `packages/corpuscheck/tests`; behavior changes without test
  updates are suspect. The judge env has NO CI — reviewers are the only gate, so treat
  missing verification evidence in the PR body as a blocker.
