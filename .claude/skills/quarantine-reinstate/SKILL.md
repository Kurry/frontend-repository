---
name: quarantine-reinstate
description: Dispatch Jules sessions that move tasks from tasks-quarantine/ back to tasks/, with automatic failover to the backup Jules account when the primary hits its daily limit. Use when asked to reinstate quarantined tasks, run a quarantine-reinstatement wave, or dispatch Jules on the second account.
---

# quarantine-reinstate: Jules-driven reinstatement of quarantined tasks

Every directory in `tasks-quarantine/` is a task whose oracle could not serve
from a clean checkout — almost always because `solution/app` serves a build
output (`vite preview`, `http-server dist`) whose `dist/` was never committed.
Reinstatement = make the oracle serve honestly, prove it, and `git mv` the
task back to `tasks/`. This skill dispatches that work to Jules, one session
per task, and keeps dispatching past the primary account's daily limit by
failing over to the backup account.

## Two accounts, one wrapper

Use `scripts/julesq` exactly like the jules CLI (`.claude/skills/jules/scripts/jules`)
— same subcommands, same flags:

```bash
.claude/skills/quarantine-reinstate/scripts/julesq create --source Kurry/frontend-repository --prompt "..."
.claude/skills/quarantine-reinstate/scripts/julesq wait <session_id>
```

- Keys: primary = `JULES_API_KEY`, backup = `JULES_BACKUP_API_KEY` (both live
  in `~/.zshrc`; non-interactive shells don't source it — `grep` the values
  into the env, never echo them).
- `create` tries primary first; on a daily-quota error (429 /
  RESOURCE_EXHAUSTED / "quota") it retries once on backup and says so on
  stderr.
- **Sessions are account-scoped.** The wrapper records which account created
  each session in `~/.mercor/jules-session-accounts.jsonl` and routes every
  follow-up (`get`, `activities`, `message`, `approve`, `wait`, `merge`) to
  the right account automatically. Without the map, a backup-account session
  looks like a 404 from the primary — do not diagnose those as deleted.
- `list` shows one account at a time. Sweep both:
  `julesq list --all` then `JULES_ACCOUNT=backup julesq list --all`.
- Force an account (skip failover) with `JULES_ACCOUNT=primary|backup`.
- Each account has its own concurrency budget (~60); the wrapper does not
  merge them. Track per-account occupancy before a wave.

Everything in the `jules` skill still binds here — Part 2 fleet sequencing,
agent-to-agent communication (never script replies), AUTO_CREATE_PR (commit
is the finish line; a blocked `git push` inside the sandbox is COMPLETION,
not an error), the `--all` pagination trap on `activities`, and fork→Mercor
PR mirroring with commit re-signing.

## The reinstatement ticket

One session per quarantined slug. Prompt template (fill every blank; a
session that has to guess will wander):

```
Repo Kurry/frontend-repository, base branch main. Work ONLY inside
tasks-quarantine/<slug>/ and finish with `git mv tasks-quarantine/<slug> tasks/<slug>`.

Goal: reinstate this quarantined Harbor task. It was quarantined because the
oracle (solution/app) does not serve from a clean checkout — typically the
app serves built output whose dist/ was never committed.

Steps:
1. cd tasks-quarantine/<slug>/solution/app && npm ci. Run the build
   (`npm run verify:build` if present, else the package's build script) and
   COMMIT the build output directory (dist/ or equivalent) alongside the
   source — the repo convention is that built oracles keep dist/ committed so
   `npm start` serves with zero network access.
2. Prove it: `npm start` must serve on port 3000 from a fresh clone state
   with ZERO console errors and ZERO page errors on load.
3. If solution/app/e2e.spec.mjs exists, `npx playwright test -c
   e2e.playwright.config.mjs` must pass; paste the real run output in the PR.
   Do not add test.skip/test.fixme/isVisible-guarded assertions.
4. git mv tasks-quarantine/<slug> tasks/<slug> (history-preserving move; do
   not copy).
5. From the repo root run `uv run corpuscheck propagate <slug>` then
   `uv run corpuscheck validate --force --root tasks <slug>` and make both
   clean.

Evidence policy: ONE WebM (VP9) walkthrough of the served app, or one
screenshot if nothing moves. No image galleries. Never fabricate
reward.json/reward-details.json.

PR: extremely detailed body — what was broken, every file changed and why,
the honest command outputs from steps 2-3 and 5. Commit is the finish line;
do NOT git push by hand; Jules automation opens the PR.
```

Dispatch loop for a wave:

```bash
for slug in $(ls tasks-quarantine | head -N); do
  .claude/skills/quarantine-reinstate/scripts/julesq create \
    --source Kurry/frontend-repository \
    --title "reinstate: $slug" \
    --prompt "$(render_ticket $slug)"
done
```

Independence holds by construction (each session owns exactly one task
directory), so the whole wave is `Jules parallel` — no ownership matrix
conflicts are possible unless two sessions get the same slug. Never dispatch
the same slug twice; check both accounts' live sessions first.

## After the sessions finish

1. Audit before mirroring: the fabrication taxonomy applies (skip-stubs,
   vacuous assertions, uncommitted-dist claims — verify `dist/` is actually
   in the diff when the app serves one).
2. Mirror fork PRs to Mercor-Intelligence with re-signed commits (GH013 —
   see the jules skill / memory).
3. A reinstated task counts only when its PR merges on Mercor AND
   `uv run corpuscheck validate` passes on main with the task under `tasks/`.
