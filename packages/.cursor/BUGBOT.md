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

---

# Deep-review protocol for tooling PRs (mandatory)

1. **Blast-radius first.** For any change under `src/corpuscheck/canonical/` or
   `src/corpuscheck/schemas/`: enumerate exactly which per-task generated surfaces it
   affects and verify this PR contains the matching propagation (or an explicit
   zero-drift verification claim you check for plausibility). Diff one representative
   propagated copy against the template by eye.
2. **Behavior tracing.** For validate/drift/propagate changes: identify each check the
   code path adds, removes, or weakens; state the corpus defect class each removed/
   weakened check used to catch; require justification per removal. Silent narrowing
   (fingerprint widening, tier skips, warning-ification of failures) is BLOCKING.
3. **Test mapping.** Map every behavior change to a test in packages/corpuscheck/tests
   (existing or added in this PR). Behavior changes with no test delta get a named Bug
   each — this repo has no CI, so untested tooling changes reach production unexecuted.
4. **Judge-env changes** (canonical entrypoint, mcp fragments, playwright configs):
   reason through the full boot sequence (two Chromes, CDP ports, env interpolation,
   MCP server args) and state what breaks if the change is wrong — these bugs suppress
   scores corpus-wide and are invisible until a sweep (see the reduced-motion incident,
   PR #711).
5. **Full-diff sweep** as in the tasks protocol: classify every hunk.
