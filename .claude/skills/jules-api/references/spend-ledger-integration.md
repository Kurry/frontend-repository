# Spend-ledger integration (mercor-orchestration)

`jules create` writes one row to the **Jules spend ledger** on every
successful session dispatch so that `mercor jules spend` (shipped by
mercor-orchestration PR #80) can roll up Jules usage across the fleet.
The write is **best-effort and additive**: it never aborts or alters the
session-create call, and it tolerates a missing/broken mercor-orchestration
install.

## Where the ledger lives

Canonical path: `~/.mercor/jules-spend-ledger.jsonl`

Override with the `MERCOR_JULES_LEDGER_PATH` env var (useful for tests
or to redirect a CI job's ledger to a workspace-scoped file).

## Row schema (JSONL — one object per line)

| field | type | meaning |
|---|---|---|
| `timestamp` | RFC3339 UTC string | when the dispatch was recorded |
| `session_id` | string | last segment of the Jules `sessions/...` name |
| `source_repo` | string | the resolved `sources/...` name passed to Jules |
| `prompt_length` | int | `len(prompt)` in characters |
| `expected_completion_minutes` | int | estimate (default 30, override with `--expected-completion-minutes N`) |
| `dispatched_by` | string | caller identifier — `"jules-api"` for this CLI, `"mercor-cli"` / `"user"` / etc. for other producers |

This is the same schema written by
`mercor_orchestration.jules.spend_ledger.append_entry()`, so both
producers (orchestration's own code and this CLI) interleave cleanly
and `mercor jules spend --since 24h` reads them uniformly.

## How `scripts/jules` populates it

After a successful `POST /v1alpha/sessions` returns, `cmd_create` invokes
`_record_spend(...)` with the resolved source name, the new session id,
the prompt length, the user-supplied estimate, and the caller identifier
(`jules-api` by default). The helper picks one of two paths:

1. **Orchestration API** (preferred when available): detect
   `mercor jules spend` on PATH, then shell out to
   `mercor jules spend --append-from-jules-api --session-id ... \
   --source-repo ... --prompt-length ... \
   --expected-completion-minutes ... --dispatched-by ...`.
   This routes the write through orchestration's own code (single source
   of truth for ledger format + side-effects).

2. **Direct JSONL append** (fallback): if `mercor` is not installed, or
   the orchestration call exits non-zero, append one JSON line directly
   to the ledger file. The append is atomic on POSIX for our line size
   (well under `PIPE_BUF`), so concurrent `jules-api` callers don't need
   locking.

Either failure mode (orchestration subprocess exits non-zero, ledger I/O
error, etc.) results in **a single warning line on stderr** and a
successful `jules create`. The cardinal rule is: a ledger problem must
never stop the user from dispatching their session.

## How `mercor jules spend` consumes it

`mercor jules spend [--since 24h|7d|30d]` (from
`mercor_orchestration.jules.commands.Spend`) calls
`spend_ledger.summarize(since_ts)`, which reads every row from the ledger
file (skipping malformed lines), filters by `timestamp`, and prints
session count + total expected minutes as a Rich table. Because both
producers write the same schema to the same file, a row appended by the
jules-api CLI shows up in the very next `mercor jules spend` call.

## CLI flags added to `jules create`

```text
--no-spend-ledger                    skip the ledger write entirely
--expected-completion-minutes N      override the recorded estimate (default: 30)
--dispatched-by NAME                 override the caller identifier (default: "jules-api")
```

`--no-spend-ledger` exists mostly as an escape hatch for tests and
dry-run-style automation; in normal use the default (write the row) is
what you want.

## Detection logic (why two probes)

`_has_mercor_orchestration_spend()` does:

1. `shutil.which("mercor")` — cheap binary-present check.
2. `mercor jules --help` and grep for `spend` — guards against an older
   mercor-orchestration build that has `jules grant-admin` but not yet
   the `jules spend` subcommand from PR #80.

Only when both pass do we shell out to the orchestration API; otherwise
we fall straight to the direct-write path.

## Tests

`skills/jules-api/tests/test_spend_ledger_integration.py` covers (14
hermetic cases):

- env-var override + default path resolution
- detection short-circuits when `mercor` is missing
- detection returns False when `spend` subcommand absent
- detection returns True when `spend` is in `--help`
- direct write produces one valid JSONL row with the documented fields
- multiple direct writes append cleanly (no truncation)
- orchestration API is preferred when detection passes
- direct-write fallback when orchestration is absent
- direct-write rescue when the orchestration subprocess exits non-zero
- I/O failures produce a stderr warning, not an exception
- end-to-end `cmd_create` records the ledger with correct fields
- `--no-spend-ledger` skips the write entirely
- `cmd_create` never aborts even if `_record_spend` somehow raised
