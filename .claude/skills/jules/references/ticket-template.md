# Jules Ticket Templates

Copy these structures into prompts. Keep each ticket self-contained.

## Interface-Only Blocker

Use this only if the driver cannot safely do the blocker locally. Prefer local execution for small interface PRs.

```markdown
Repo: Kurry/<repo>
Base branch: main
Branch: driver/interface-<slug>

Goal: land the frozen interface that downstream Jules tickets will import from main.

Scope:
- Modify only: <schema/stub/fixture files>
- Do not implement downstream business logic.
- Do not touch: <shared unrelated dirs>

Contract to materialize:
- <schema/literal/stub details>
- <append-only extension point>
- <minimal fixtures>

Tests:
- <exact command>

Acceptance:
- Interface files exist on main after merge.
- Downstream tickets can import the contract without depending on this PR branch.
- No downstream feature logic included.

Do not git push. Commit is the finish line; Jules automation opens/updates the PR.
```

## Disjoint Parallel Plugin

```markdown
Repo: Kurry/<repo>
Base branch: main
Branch: jules/<ticket-slug>

This ticket is independent. It depends only on the frozen contract already merged to main:
- <contract files and relevant excerpt>

Exclusive file ownership:
- Source: <one or more files no other ticket owns>
- Tests: <one or more files no other ticket owns>

Implement:
- <specific behavior>
- Register only through the append-only extension point; do not edit shared registries unless explicitly listed above.

Do not modify:
- <shared files, other plugin files, workflows, generated artifacts>

Tests:
- <exact commands>

Acceptance:
- <observable behavior>
- Tests pass.
- Diff touches only owned files.
- No root scratch files.

Do not git push. Commit is the finish line; Jules automation opens/updates the PR.
```

## Repo-Local CI Fix

```markdown
Repo: Kurry/<repo>
Base branch: main
Branch: jules/ci-<slug>

Goal: fix only the repo-local CI issue described here.

Exclusive file ownership:
- Workflows: <exact .github/workflows files>
- Tests: none unless listed here.

Do:
- <specific CI change>

Do not:
- Touch source code, tests, lockfiles, or unrelated workflows.
- Change branch protection/settings; driver owns that serially.

Validation:
- YAML parses.
- PR checks run.

Acceptance:
- Diff limited to listed workflow files.
- Required checks pass or the failing check is explicitly advisory.

Do not git push. Commit is the finish line; Jules automation opens/updates the PR.
```

## Feedback Or Nudge Policy

Use `@jules` PR comments or the Jules API only after classifying the state:

- If the prompt was underspecified, do not nudge vaguely. Rewrite with exact fixtures/files/tests.
- If the PR is green but blocked by branch state, driver updates/rebases/merges.
- If the PR touched unowned files, request a scope correction or close it.
- If duplicate sessions exist, keep the best one and stop spending attention on the rest.
