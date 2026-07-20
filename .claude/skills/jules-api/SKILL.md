---
name: jules-api
description: >-
  Drive Google's Jules async coding agent through its v1alpha REST API
  (jules.googleapis.com) to delegate a coding task end-to-end: discover a
  connected GitHub repo, create a session from a prompt, monitor progress,
  approve the plan, answer the agent's questions, and collect the resulting
  diff/PR. Use this skill whenever the user wants to hand a coding task off to
  Jules, "ask Jules to…", kick off / check on / reply to a Jules session,
  create a Jules coding session via the API, poll a session to completion,
  approve a Jules plan, or list Jules sources/sessions/activities — even if
  they just mention "Jules" plus a repo and a task. Also trigger on
  JULES_API_KEY, jules.google, "the Jules API", or scripting async agent runs.
domain: orchestration
---

# Jules REST API

Jules is Google's asynchronous coding agent. You give it a prompt and a
connected GitHub repo; it plans, edits code in its own sandbox, optionally
opens a PR, and pauses to ask questions or for plan approval. This skill
drives the full session lifecycle over the v1alpha REST API.

## Use the bundled CLI — don't hand-roll curl

`scripts/jules` (Python, stdlib only — no install) wraps every endpoint with
auth, pagination, 429 backoff, and source-name resolution already handled.
Reaching for raw `curl` means re-deriving all of that each time and getting
the host/header wrong; the script is the reusable, correct path. Run it
straight from the skill dir:

```bash
.claude/skills/jules-api/scripts/jules <command> [--json]
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
