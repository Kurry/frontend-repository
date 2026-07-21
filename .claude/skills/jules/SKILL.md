---
name: jules
description: >-
  Drive Google's Jules asynchronous coding agent through its v1alpha REST API
  and sequence large Jules fleets. Use whenever asked to hand a coding task to
  Jules, ask Jules to make a change, create or monitor a Jules session, approve
  a plan, answer session feedback, list sources/sessions/activities, collect a
  resulting diff or PR, or merge a Jules PR. Also use for JULES_API_KEY,
  jules.google, Jules API scripting, daily-quota planning, splitting backlogs
  across agents, diagnosing failed or rejected sessions, preventing dependency
  fanout, building file-ownership matrices, deciding local versus delegated
  work, and dispatching only independent merge-order-free fleet tasks while
  the driver keeps serial critical-path work local.
---

# Jules: REST API mechanics + fleet sequencing

Jules is Google's asynchronous coding agent. You give it a prompt and a
connected GitHub repo; it plans, edits code in its own sandbox, optionally
opens a PR, and pauses to ask questions or for plan approval. This skill has
two major parts: **Part 1 — API mechanics** (the session lifecycle over the
v1alpha REST API, via the bundled CLI) and **Part 2 — Fleet sequencing**
(turning a large backlog into a live Jules fleet without false parallelism).
Single-session work needs only Part 1; any multi-session or backlog-splitting
work must follow Part 2's rules and uses Part 1 for the raw lifecycle calls.

---

# Part 1 — Jules REST API

## Use the bundled CLI — don't hand-roll curl

`scripts/jules` (Python, stdlib only — no install) wraps every endpoint with
auth, pagination, 429 backoff, and source-name resolution already handled.
Reaching for raw `curl` means re-deriving all of that each time and getting
the host/header wrong; the script is the reusable, correct path. Run it
straight from the skill dir:

```bash
.claude/skills/jules/scripts/jules <command> [--json]
```

Auth is automatic: it reads `JULES_API_KEY` from the environment, falling
back to a `.env` in the working dir or any parent. Never echo the key.

### Commands

| Command | What it does |
|---|---|
| `jules sources [--all]` | list connected GitHub repos (the `source` you create against) |
| `jules create --source <repo> --prompt "<task>" [--branch main] [--title T] [--require-plan-approval] [--no-pr]` | start a session — **opens a PR by default** |
| `jules get <session_id>` | one session + its state (prints the PR URL once it exists) |
| `jules list [--state IN_PROGRESS] [--all]` | list sessions |
| `jules activities <session_id> [--all]` | the progress/message/plan/diff stream |
| `jules message <session_id> "<text>"` | answer the agent / steer it (mid-session) |
| `jules approve <session_id>` | approve the pending plan |
| `jules wait <session_id> [--timeout 1800] [--interval 10]` | poll until done; exit 0=COMPLETED, 2=needs-human, 1=FAILED/timeout |
| `jules merge <session_id> [--method squash] [--admin]` | merge the PR Jules opened, via `gh` |
| `jules delete <session_id>` | permanently delete a session |

**Auto-PR is the default.** The reason you delegate to Jules is to get a
**merged PR** back, so `create` sets `automationMode=AUTO_CREATE_PR` unless you
pass `--no-pr` (patch-only). `get`/`wait` print the PR URL from
`outputs[].pullRequest.url` as soon as it exists. `delete` is irreversible —
confirm with the user first.

`--source` accepts a full `sources/...` name, `owner/repo`, or a bare repo
name (it resolves against the live source list and refuses ambiguous matches,
so you can't silently target the wrong repo). Add `--json` to any command for
machine-readable output to pipe onward.

## The standard workflow: dispatch → PR → merged

The job is almost never "create a session" — it's "get this change **merged**."
The Jules REST API only goes as far as opening the PR; the last mile
(iterating on it, merging it) is GitHub, via `gh`. Own the whole loop:

1. **Pick the source.** If the user named a repo, pass it to `--source`.
   Otherwise run `jules sources` and confirm — creating a session is a real
   side effect on a real repo, so don't guess the target when it's unclear.
2. **Dispatch.** `jules create --source <repo> --prompt "<task>"`. Auto-PR is
   already the default. Run **autonomous** (no `--require-plan-approval`) for
   the common "just get it done and merged" ask — the approval gate exists for
   when the user explicitly wants to vet the plan first, not as the default.
3. **Wait.** `jules wait <id>` streams activity and stops when there's
   something to do:
   - exit **2** → needs a human. `jules get` for the state:
     `AWAITING_PLAN_APPROVAL` → show the plan, get a yes, `jules approve`,
     wait again. `AWAITING_USER_FEEDBACK` → surface the question, get the
     answer, `jules message <id> "<answer>"`, wait again.
   - exit **0** → `COMPLETED`; the PR URL is printed.
   - exit **1** → `FAILED` (`sessionFailed.reason`) or timed out.
4. **Review / iterate on the PR (GitHub side).** To request changes, **comment
   on the PR mentioning `@jules`** — `gh pr comment <pr-url> --body "@jules
   also handle the empty-input case"`. Jules watches its PRs and pushes a new
   commit in response. This is the GitHub-native iteration path; `jules
   message` only works while the *session* is still live, whereas an `@jules`
   PR comment works on the open PR even after the session completes.
5. **Merge.** `jules merge <id>` — reads `outputs[].pullRequest.url`. **Jules
   opens its PRs as drafts**, so `merge` marks the PR ready (`gh pr ready`)
   before `gh pr merge --squash --delete-branch` — a plain `gh pr merge`
   fails with "Pull Request is still a draft". Add `--admin` if branch
   protection or pending checks would otherwise block it. *Confirm with the
   user before merging unless they've asked for a fully autonomous
   dispatch-and-merge.*

> **The agent inside the session must NEVER `git push` by hand.** With
> `automationMode=AUTO_CREATE_PR`, the Jules sandbox **blocks direct
> pushes by design** and Jules' own automation opens/updates the PR from
> the session's *committed* changeset. The agent's job ends at a clean
> commit — that commit IS the deliverable. A session that reports
> "implemented + tested + committed but `git push` fails / sandbox
> blocks it" is **COMPLETE, not blocked** — do not treat the push failure
> as an error to solve, and do not let the session loop on it. Tell it:
> "commit is the finish line; do not push; AUTO_CREATE_PR opens the PR;
> conclude." (This single misunderstanding caused sessions to re-enter
> `AWAITING_USER_FEEDBACK` 20+ times while their work was already done.)

Long tasks run many minutes. Don't busy-poll tighter than ~10s; tell the user
it's a background run rather than blocking silently.

### Other GitHub-native paths (no REST call needed)

- **Dispatch via issue label:** adding the `jules` label to a GitHub issue
  starts a task from that issue — `gh issue edit <n> --add-label jules`. Handy
  when the work is already written up as an issue; no `jules create` needed.
- **Iterate via `@jules` (Reactive Mode):** Jules only acts on PR/issue
  comments that explicitly mention `@jules` — so a plain review comment won't
  accidentally trigger it; an `@jules …` comment will. This is the durable
  iteration channel (works post-session, unlike `jules message`).
- **CI Fixer:** Jules can run a fix-commit loop on failing CI for its own PR.
  If merge is blocked by red checks, an `@jules the CI is failing on X` nudge
  is usually better than forcing the merge with `--admin`.

## Reading results

Two distinct URLs — don't conflate them: `session.url` is the **Jules web-UI**
link; the **PR** is `outputs[].pullRequest.url` (plus `.title` /
`.description`), populated once Jules opens the PR. With `--no-pr` there is no
PR — only the `changeSet`/`gitPatch` artifact on a completed activity; report
that honestly rather than implying a PR exists.

## When things look off

- `401`/`403` → bad or missing key. Confirm `JULES_API_KEY` is set; don't
  print it.
- `429` → rate limited. The script already backs off; if it still fails,
  slow the polling interval.
- Empty `activities` right after create is normal — Jules is still `QUEUED`/
  `PLANNING`. Keep waiting.
- A source that "doesn't exist": the repo must be connected to Jules first
  (done in the Jules web UI, not via this API). `jules sources` shows what's
  actually connected.

## Spend ledger (mercor-orchestration)

Every `jules create` appends one row to
`~/.mercor/jules-spend-ledger.jsonl` so `mercor jules spend` (from
mercor-orchestration PR #80) can roll up Jules usage across the fleet.
The write is best-effort: a failure logs a stderr warning and the
session still succeeds. Override the ledger path with
`MERCOR_JULES_LEDGER_PATH`; skip the write per-call with
`--no-spend-ledger`; override the estimate with
`--expected-completion-minutes N`; stamp a custom caller with
`--dispatched-by <name>` (default `jules-api`). Full schema, detection
logic, and producer/consumer contract:
[`references/spend-ledger-integration.md`](references/spend-ledger-integration.md).

## Deeper reference

Full data-type schemas, every endpoint with curl, the state machine, and a
list of fields that are **undocumented (don't invent them)** are in
[`references/api.md`](references/api.md). Read it when you need a field the
CLI doesn't surface, are building a raw request, or need to reason about an
unusual state.

---

# Part 2 — Jules Fleet Sequencing

Use this part to turn a large backlog into a live Jules fleet without
creating false parallelism. The driver agent is not just a dispatcher: it
owns the serial work that unlocks the fleet.

## First Rule

**Driver keeps serial work. Jules gets only independent work.**

Do not delegate a small critical-path blocker, interface contract, branch
protection/settings change, merge/rebase chore, CI unstick, or ticket-rewrite
task when doing it locally would unlock many Jules tasks. Dispatching the
blocker and waiting is underutilization disguised as parallelism.

## Active Driver Rule

Updating the task list is not progress. It is a checkpoint that must be
followed by action.

After recording or restructuring a plan, immediately do exactly one of these
before stopping:

1. Execute the first `driver-owned serial` task locally with tools.
2. Dispatch every currently ready `Jules parallel` task whose ownership
   matrix is conflict-free.
3. If nothing can be executed or dispatched, state the concrete blocker and
   start a monitored wait with an explicit wake condition, poll command, and
   next action.

Never end a turn with only: "task list updated", "plan recorded", "queued",
"holding", or "waiting" unless a tool-backed monitor or follow-up has
actually been started. The driver must keep moving the fleet until the next
action is genuinely external.

Use this invariant:

```text
Plan update -> immediate tool action -> observed result -> next action.
```

If the agent feels tempted to "sleep" after planning, it should instead
execute `S1` locally or dispatch the ready parallel wave.

## Classify Before Dispatch

Build a table with one row per unit of work before creating sessions:

| Class | Owner | Dispatch rule |
|---|---|---|
| `driver-owned serial` | Driver agent | Execute locally now. Examples: frozen interface PR, shared module edit, branch protection, CI/automerge fixes, rebases, merge conflict repair, ticket reshaping. |
| `Jules parallel` | Jules | Dispatch only if it owns disjoint files, depends only on `main`, has a self-contained prompt, and can merge in any order. |
| `blocked` | Nobody yet | Do not dispatch. First merge the contract, resolve product intent, or split/rewrite the ticket. |

Independence means both conditions are true:

1. The task modifies a disjoint file/test surface.
2. The task imports/depends only on an immutable contract already merged to
   `main`.

If either condition is false, it is not ready for Jules fanout.

## Required Ownership Matrix

Before every Jules wave, write a file ownership matrix:

```markdown
| Task | Owner | Source files | Test files | Depends on main-only contract? | Ready? |
|---|---|---|---|---|---|
| FC-interface | driver | harvest/schema/*, harvest/record.py | tests/test_schema.py | n/a | serial |
| FC-17 | Jules | harvest/plugins/pr_comments.py | tests/test_pr_comments.py | yes | ready |
```

Rules:

- No file may appear in two Jules tasks, including tests, fixtures,
  registries, and barrel exports.
- Shared registries must be append-only through per-task files or entry
  points; otherwise the registry edit is driver-owned serial work.
- If two tasks need the same source or test file, merge them into one task or
  make the shared interface local-first.
- If a task needs an unmerged PR, do not dispatch it. Merge/freeze the
  interface first.

## Dispatch Algorithm

1. **Inventory live state.** Check open PRs, required checks, current Jules
   sessions, and recent failed/awaiting-feedback sessions. Use the Part 1
   CLI for raw Jules lifecycle work.
2. **Extract blockers.** Identify tiny interface PRs, shared contracts,
   CI/automerge settings, and ticket rewrites. Do these locally.
3. **Freeze the contract.** Merge the interface-only PR to `main`: schema,
   typed stubs, signature-only skeletons, empty extension points, and
   fixtures. No downstream logic belongs here.
4. **Rewrite parallel tickets.** Inline the frozen contract, exact file
   ownership, branch name, tests, acceptance criteria, and the rule:
   commit/PR automation is the finish line; do not push by hand.
5. **Fan out Jules.** Dispatch every `Jules parallel` row whose matrix is
   conflict-free. Use enough sessions to saturate capacity, but reserve quota
   for retries.
6. **Monitor and replenish.** As PRs land, fail, or ask questions, the driver
   triages. Fix serial blockers locally, close/merge duplicates, rewrite bad
   prompts, and dispatch the next ready tickets.

## Good Workflow Shape

Healthy sequencing looks like this:

1. Record the full plan up front: `S1`, `S2`, `S3` for serial unlocks and `P`
   for parallel Jules waves.
2. Execute `S1` locally immediately, especially if it freezes contracts,
   creates repos, lands ADRs, or resolves docs/spec contradictions.
3. Verify the serial artifact is on `main` before depending on it.
4. Continue the serial chain locally while preparing Jules prompts in
   parallel.
5. Dispatch Jules only after each prompt depends on frozen `main` artifacts
   and owns disjoint files.

Example shape:

```text
S1 serial: merge contracts/ADR PR, freezing all interfaces.
S2 serial: create repo, skeleton directories, and first issue.
S3 serial: create dependent instance repo.
S4 serial: resolve contradictory documentation that would confuse agents.
P parallel: dispatch independent scaffolder/plugin builds via Jules.
```

If the next action unlocks the whole fleet, the driver does it. Jules is for
the wide layer after the narrow bridge is already built.

## Staying Awake

The driver remains active while any of these are true:

- A serial task can be performed locally.
- A ready Jules ticket has not been dispatched.
- A Jules PR is failing for a reason the driver can fix.
- A PR is green but needs merge/automerge/rebase attention.
- A failed or awaiting-feedback Jules session can be converted into a better
  ticket.

Only wait when the next state transition is outside the driver's control,
such as CI currently running or a Jules session actively producing a PR. Even
then, record the poll command and the next action:

```text
Waiting on CI for PR #123.
Poll: gh pr checks 123 --repo Kurry/example --watch
Wake action: if green, merge; if red, inspect failing logs and patch locally.
```

## Never Delegate These

- A small fully specified blocker that many tasks wait on.
- The first interface/schema/contract PR in a wave.
- Shared-file refactors unless the whole refactor is one Jules task.
- Branch protection, repository settings, automerge policy, release workflow
  fixes, or CI required-check repair.
- Rebase/update-branch/merge-conflict/green-PR merge chores.
- Ticket decomposition, file ownership matrix creation, or duplicate issue
  consolidation.

## Jules Ticket Contract

Every Jules prompt must be self-contained:

- Repo and base branch.
- Unique branch name.
- Exclusive source/test files.
- Frozen contract excerpt or link to files already on `main`.
- Exact in-scope and out-of-scope files.
- Test commands and expected signals.
- Acceptance criteria.
- "Do not git push. Commit is the finish line; Jules automation opens/updates
  the PR."

Read `references/ticket-template.md` when writing prompts.

## Failure Pattern Review

Read `references/failure-patterns.md` before a large wave, after any batch of
failures, or whenever an agent proposes gating most work behind one Jules
session.

If session JSON is available, run:

```bash
python .claude/skills/jules/scripts/jules_fleet_audit.py /tmp/jules_sessions.json
```

Use the output to spot failed clusters, duplicate prompts, awaiting-feedback
sessions, and likely blocked-vs-ready queues. If no JSON file exists, capture
it with the Part 1 CLI first.
