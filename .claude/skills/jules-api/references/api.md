# Jules v1alpha REST API — full reference

Base URL: `https://jules.googleapis.com/v1alpha`
Auth header: `x-goog-api-key: $JULES_API_KEY` (keys from https://jules.google.com/settings#api, max 3/account)
POST bodies need `Content-Type: application/json`.

> Host gotcha: the public quickstart renders the host as `julius.googleapis.com`
> in a few snippets — that is a documentation typo. The correct host is
> `jules.googleapis.com` (confirmed live).

## Table of contents
1. Data types (Session / Source / Activity / artifacts)
2. Endpoints (create, get, list, sendMessage, approvePlan, activities, sources)
3. Lifecycle & polling
4. Documented gaps — do not invent these fields

---

## 1. Data types

### Session
| Field | Type | Notes |
|---|---|---|
| `name` | string | Output. `sessions/{id}` |
| `id` | string | Output |
| `prompt` | string | **Required** on create |
| `sourceContext` | object | **Required** on create |
| `title` | string | Optional; auto-generated if omitted |
| `requirePlanApproval` | bool | Input only. `true` ⇒ holds at `AWAITING_PLAN_APPROVAL` |
| `automationMode` | enum | Input only. Documented value: `AUTO_CREATE_PR` |
| `state` | enum | Output (see lifecycle) |
| `url` | string | Output — **web UI** URL, not a PR URL |
| `createTime`/`updateTime` | RFC3339 | Output |
| `outputs[]` | array | Output — each element: `{ "pullRequest": { "url", "title", "description" } }` (populated once a PR is created) |

**`sourceContext`**: `{ "source": "sources/{id}", "githubRepoContext": { "startingBranch": "main" } }`

**`state` enum**: `STATE_UNSPECIFIED`, `QUEUED`, `PLANNING`, `AWAITING_PLAN_APPROVAL`,
`AWAITING_USER_FEEDBACK`, `IN_PROGRESS`, `PAUSED`, `FAILED`, `COMPLETED`.

**`automationMode` enum**: `AUTOMATION_MODE_UNSPECIFIED` (default — no PR
auto-created) · `AUTO_CREATE_PR` (open a PR when changes are ready).

### Source
`{ "name": "sources/{id}", "id", "githubRepo": { "owner", "repo", "isPrivate",
"defaultBranch": {"displayName"}, "branches": [{"displayName"}] } }`

### Activity
Common: `name`, `id`, `description`, `createTime`, `originator`, `artifacts[]`.
Exactly one union field is set per activity:

| Union field | Nested |
|---|---|
| `agentMessaged` | `agentMessage` (string) |
| `userMessaged` | `userMessage` (string) |
| `planGenerated` | `plan` = `{id, steps:[{id,title,description,index}], createTime}` |
| `planApproved` | `planId` |
| `progressUpdated` | `title`, `description` |
| `sessionCompleted` | — |
| `sessionFailed` | `reason` |

**Artifact** union: `ChangeSet {source, gitPatch}`, `GitPatch {unidiffPatch,
baseCommitId, suggestedCommitMessage}`, `Media {data, mimeType}`,
`BashOutput {command, output, exitCode}`. Code changes surface here as
`ChangeSet`/`gitPatch` — that diff is how you read what Jules produced.

---

## 2. Endpoints

| # | Method & path | Purpose | Body |
|---|---|---|---|
| 1 | `POST /sessions` | create session | `{prompt, sourceContext, title?, requirePlanApproval?, automationMode?}` |
| 2 | `GET /sessions/{id}` | get one session (incl. `outputs[]`) | — |
| 3 | `GET /sessions?pageSize&pageToken` | list sessions | — |
| 4 | `DELETE /sessions/{id}` | delete a session | — (empty response) |
| 5 | `POST /sessions/{id}:sendMessage` | send message/feedback | `{prompt}` |
| 6 | `POST /sessions/{id}:approvePlan` | approve pending plan | `{}` |
| 7 | `GET /sessions/{id}/activities?pageSize&pageToken&createTime` | monitor progress | — |
| 8 | `GET /sessions/{id}/activities/{aid}` | get one activity | — |
| 9 | `GET /sources?pageSize&pageToken&filter` | list connected repos | — |
| 10 | `GET /sources/{id}` | get one source | — |

`sources` `filter` example: `?filter=name=sources/<id>` (URL-encode; supports
`OR`). `activities` accepts `createTime=<RFC3339>` to fetch only newer events.

`pageSize` is 1–100. List responses: `{ "<resource>": [...], "nextPageToken": "..." }`.

Create example:
```bash
curl https://jules.googleapis.com/v1alpha/sessions -X POST \
  -H "Content-Type: application/json" -H "x-goog-api-key: $JULES_API_KEY" \
  -d '{"prompt":"Fix the failing test in foo.py","sourceContext":
       {"source":"sources/github/owner/repo","githubRepoContext":{"startingBranch":"main"}},
       "requirePlanApproval":true,"automationMode":"AUTO_CREATE_PR"}'
```

HTTP status: 200 ok · 400 bad request · 401 bad key · 403 forbidden ·
404 missing · 429 rate-limited (back off & retry) · 500 server.
Errors return `{"error":{"code","message","status"}}`.

---

## 3. Lifecycle & polling

`QUEUED → PLANNING → [AWAITING_PLAN_APPROVAL] → IN_PROGRESS →
[AWAITING_USER_FEEDBACK | PAUSED] → COMPLETED | FAILED`

Poll cadence: 5–15s on `GET /sessions/{id}` (cheap) or list activities for the
stream. Act on these states:
- `AWAITING_PLAN_APPROVAL` → `:approvePlan` (only reached if `requirePlanApproval`)
- `AWAITING_USER_FEEDBACK` → `:sendMessage` answering the agent's question
- `COMPLETED` → read activities for `ChangeSet`/`gitPatch`; PR is opened in the
  repo when `automationMode=AUTO_CREATE_PR`.

The bundled `scripts/jules wait` encodes this: exit 0 COMPLETED, 2 needs-human,
1 FAILED/timeout.

---

## 4. Notes

- The created PR URL **is** available: `GET /sessions/{id}` →
  `outputs[].pullRequest.url` (plus `.title`, `.description`), populated once
  Jules opens a PR (requires `automationMode=AUTO_CREATE_PR`). `Session.url`
  is the separate web-UI link. `scripts/jules get`/`wait` print both.
- Source name format differs by surface: the docs show
  `sources/github-owner-repo`; the live API returns `sources/github/owner/repo`.
  Trust what `jules sources` returns for real calls.
- `DELETE /sessions/{id}` is permanent and returns an empty body — there is
  still no documented *pause/cancel*, only delete.
- `outputs[]` currently documents only the `pullRequest` variant; treat other
  keys as unknown rather than inventing them.

### Changelog-confirmed behaviors (not in the endpoint tables)

- **No merge endpoint exists** anywhere in the API — merging is GitHub-side
  (`gh pr merge`); `scripts/jules merge` does this handoff.
- **`@jules` Reactive Mode** (2025-09-23): Jules acts only on PR/issue comments
  that explicitly `@jules`. Iterate on an open PR with `gh pr comment`.
- **Issue-label dispatch** (2025-06-26): the `jules` label on a GitHub issue
  starts a task — an alternative to `POST /sessions`.
- **`createTime` activity filter** (2026-01-26) behaves as a *range cursor*
  (fetch newer-than) — used by `jules activities --since`.
- **Repoless sessions** (2026-01-26): a session can run in an ephemeral cloud
  env with no `sourceContext`; outputs come back as git-patch file outputs.
- **CI Fixer** (2026-02-19): Jules can loop fixing failing CI on its PR;
  commit-authorship modes (Jules / co-authored / user) are a Settings option.
- **Env vars** (2025-10-01): repo-level env vars; surfaces live as
  `sourceContext.environmentVariablesEnabled`.
