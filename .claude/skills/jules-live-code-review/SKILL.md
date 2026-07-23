---
name: jules-live-code-review
description: Review and steer live Google Jules coding sessions while they are still working, including fleets split across primary and backup Jules API accounts. Use when asked to audit ongoing Jules sessions, code-review live Jules work, supervise an active Jules fleet, maintain a concurrency floor, catch scope or test-quality defects before PR creation, or send focused feedback through the Jules CLI. Designed for frontend-repository workflows and reusable with any repository connected to Jules.
---

# Jules Live Code Review

Review the evidence Jules is producing in real time, then send small, specific corrections before defects harden into a PR. Stay in reviewer mode: do not take over implementation, dispatch replacement work, or restructure the fleet unless the user asks.

## Preflight

1. Read the sibling `../jules/SKILL.md` completely. Follow its CLI and agent-to-agent communication rules.
2. Read the target repository's `AGENTS.md` or equivalent instructions.
3. Confirm the connected source from session data. For this repository, Jules normally works from `sources/github/Kurry/frontend-repository`, even when the upstream PR target is Mercor.
4. Use the account wrapper, never hand-written API calls. It selects the
   repository's bundled CLI and maps `backup` to `JULES_BACKUP_API_KEY` without
   printing either credential. If the backup key is only declared in
   `~/.zshrc`, the wrapper loads it in an isolated zsh process:

```bash
JULES_ACCOUNT=.claude/skills/jules-live-code-review/scripts/jules-account
"$JULES_ACCOUNT" primary list --all --state IN_PROGRESS
"$JULES_ACCOUNT" backup list --all --state IN_PROGRESS
"$JULES_ACCOUNT" primary get <session-id>
"$JULES_ACCOUNT" backup activities <session-id> --all
```

Put global flags before the command:
`"$JULES_ACCOUNT" backup --json activities ...`. Never echo, log, write, or
pass either key as a literal command-line argument.

## Live review loop

### 1. Inventory both accounts without steering

- For every configured account, list `IN_PROGRESS`,
  `AWAITING_PLAN_APPROVAL`, and `AWAITING_USER_FEEDBACK` separately because the
  CLI accepts one state filter per invocation. Always pass `--all`; state
  filtering happens after pagination, so omitting it silently excludes matching
  sessions beyond the first page.
- Keep the account label with every session ID. Session IDs alone are not
  sufficient routing information because every later `get`, `activities`, and
  `message` call must use the credential that owns the session.
- Build the combined fleet count from completed full pagination on both
  accounts. Do not add stale snapshots, delivered-message counts, or inferred
  state transitions. If either account's list is still running, report a
  provisional floor and name the missing account.
- De-duplicate by `(source, starting branch, task/path ownership)` for work
  coordination, while still counting distinct API sessions for a user-requested
  concurrency target. Flag duplicate task ownership rather than silently
  assigning both sessions overlapping edits.
- Record session ID, title, source, starting branch, state, update time, and PR output if present.
- Treat sessions with no activities as queued or not yet reviewable. Do not send speculative feedback.
- Note sessions that own overlapping app, spec, package, lockfile, fixture, registry, or generated-output paths.

### 2. Read one complete session at a time

Before every message, use the session's owning account to read its current
`get` result and complete `activities --all` stream. Inspect:

- the original prompt and explicit file scope;
- the latest plan and every later user correction;
- progress claims and agent questions;
- the agent's own code-review output;
- generated change sets or PR diffs when available;
- current tests and checks on an opened PR.

Evidence priority is: actual diff and test output, then agent self-review, then progress claims, then plan. A claim such as "all tests pass" is not proof of test quality.

If a PR exists, review it with `gh pr diff`, `gh pr checks`, and review-thread reads. If the session has completed, give corrections with a bespoke `@jules` PR comment instead of `jules message`.

### 3. Review for concrete defects

Check the exact task contract, then look for these recurring blockers.

#### Scope and repository hygiene

- Files outside the prompt's allowlist.
- Root package/config changes made to repair a task-local test.
- Scratch generators, criteria dumps, logs, PR-body files, `test-results`, screenshots, or temporary scripts committed as deliverables.
- Duplicate Playwright packages or dependencies added to `dependencies` instead of the required `devDependencies`.
- Existing scripts, canonical prefixes, or generated regions overwritten instead of extended.
- Two live sessions editing the same source/spec/package/lockfile surface.

#### Fabricated or weak tests

Reject tests whose assertion would pass regardless of the criterion:

- `body` or generic element visibility for a multi-step behavior;
- `typeof value === 'string'`, tautologies, or nonempty-text fallbacks;
- navigation-only bodies;
- conditional `if (isVisible())` assertions;
- generated placeholder assertions shared across many criteria;
- `test.fixme`, `test.skip`, TODO stubs, or empty tests for deterministic behavior;
- WebMCP shortcuts used to grade a gesture or animation;
- broad "representative" tests used in place of one test per required criterion.

Require exact actions and observables: before/after count deltas, parsed export shapes, import round-trips, persisted reload state, boundary values, focus return, computed hover styles, WebMCP mutation visible in both returned state and DOM, reduced-motion behavior, console errors, and measured mobile overflow.

Treat `NOT-AUTOMATABLE` narrowly. Subjective taste may qualify; keyboard behavior, ARIA, responsive geometry, computed style, motion mechanics, DOM structure, and data contracts usually do not.

#### Frontend-repository invariants

- Keep task tests below the literal canonical-region marker and preserve every line above it.
- Use an existing `test:e2e` script and Playwright version; add `test:e2e:criteria` when required instead of replacing the existing suite.
- Let a genuine oracle failure remain failing and disclose it. Never weaken the assertion to preserve an all-green claim.
- Do not generate `reward.json`, `reward-details.json`, or a self-scored `JUDGE_REPORT.md` when the active owner policy bans those artifacts.
- Keep `tests/`, `instruction.md`, shared tooling, other tasks, and generated surfaces read-only unless explicitly in scope.
- Preserve the WebMCP contract and verify shared state in the visible UI.

#### Application code

Review ordinary code risks too: missing imports, stale field names, invalid schema/handler mismatches, fallback logic masking explicit lookup errors, timestamps or IDs regenerated during round-trips, nonserializable DOM state, service-worker cache staleness, pointer-blocking overlays, inaccessible focus handling, and seeded-data changes that distort existing contracts.

### 4. Send bespoke feedback

Send a message only after reading that session's stream. Never template, batch-generate, or auto-send replies.

Good feedback:

- names the exact file, criterion ID, function, progress claim, or observed pattern;
- distinguishes blocking defects from guardrails;
- states the required behavior and how to verify it;
- preserves honest failures rather than demanding green tests;
- stays inside the session's authorized scope;
- answers a pending question directly and autonomously.

Use the same account that supplied the session:

```bash
"$JULES_ACCOUNT" <primary-or-backup> message <session-id> "<session-specific review feedback>"
```

Do not praise generally, restate the entire prompt, auto-approve plans, or send feedback to a session with no reviewable activity.

### 5. Confirm receipt and continue reviewing

1. Re-read `activities --all` through the same account and verify the message
   appears as `userMessaged`.
2. Re-run `get` to record the current state. For a previously paused session,
   confirm it resumed; for an already `IN_PROGRESS` session, the
   `userMessaged` activity is sufficient proof of delivery and a revised plan
   is optional.
3. Inspect later progress, change sets, or test output for the requested
   correction; delivery or acknowledgment is not proof the code changed.
4. If the session fails, inspect the last activity and failure reason. Do not assume the review caused the failure and do not automatically recreate the session.
5. Keep reviewing until every active session either has no reviewable work yet, is following the contract, has received a concrete correction, or has completed and moved to PR review.

## Reporting

Give the user a compact review ledger:

| Account / session | Evidence reviewed | Finding | Feedback sent | Current state |
|---|---|---|---|---|

Separate confirmed code defects from plan risks and unreviewable queued
sessions. Report primary, backup, and combined full-pagination counts when a
fleet target matters. Report exact session IDs or links for important blockers.
Never claim a correction landed until later activity, a diff, or test output
proves it.
