# SPDX-License-Identifier: NONE
"""Hermetic tests for the jules CLI ↔ mercor-orchestration spend-ledger
integration (issue Kurry/mercor-skills#85, consumer side of PR #80 in
mercor-orchestration).

Loads the `scripts/jules` CLI directly via importlib (the file has no `.py`
extension because it ships as a runnable on PATH), exercises both the
orchestration-API path and the direct-write fallback, and asserts the
key invariant: a ledger-write failure NEVER aborts session creation.

Run with:
    cd .claude/skills/jules && pytest tests/ -v
or from the repo root:
    pytest .claude/skills/jules/tests/ -v
"""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
from pathlib import Path
from unittest import mock

import pytest

HERE = Path(__file__).resolve().parent
SCRIPT = HERE.parent / "scripts" / "jules"


@pytest.fixture(scope="module")
def jules_mod():
    """Import the extensionless `scripts/jules` file as a module."""
    spec = importlib.util.spec_from_loader(
        "jules_cli",
        importlib.machinery.SourceFileLoader("jules_cli", str(SCRIPT)),
    )
    assert spec is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


@pytest.fixture
def tmp_ledger(tmp_path, monkeypatch):
    """Point MERCOR_JULES_LEDGER_PATH at a tmp file and return its Path."""
    ledger = tmp_path / "jules-spend-ledger.jsonl"
    monkeypatch.setenv("MERCOR_JULES_LEDGER_PATH", str(ledger))
    return ledger


# ── unit tests for the small helpers ─────────────────────────────────────────


def test_ledger_path_defaults_to_canonical_location(jules_mod, monkeypatch):
    """Without the env override, the path resolves under ~/.mercor/."""
    monkeypatch.delenv("MERCOR_JULES_LEDGER_PATH", raising=False)
    p = jules_mod._ledger_path()
    assert p.endswith("/.mercor/jules-spend-ledger.jsonl")
    assert "~" not in p  # expanded


def test_ledger_path_respects_env_override(jules_mod, monkeypatch, tmp_path):
    """MERCOR_JULES_LEDGER_PATH wins over the default."""
    custom = tmp_path / "custom-ledger.jsonl"
    monkeypatch.setenv("MERCOR_JULES_LEDGER_PATH", str(custom))
    assert jules_mod._ledger_path() == str(custom)


def test_has_mercor_orchestration_returns_false_when_no_mercor(jules_mod):
    """If `mercor` isn't on PATH at all, detection returns False (no subprocess call)."""
    with mock.patch("shutil.which", return_value=None) as which:
        assert jules_mod._has_mercor_orchestration_spend() is False
        which.assert_called_once_with("mercor")


def test_has_mercor_orchestration_returns_false_when_spend_subcommand_missing(jules_mod):
    """`mercor` is installed but `jules --help` doesn't mention `spend` → False.

    Guards against detecting an older mercor-orchestration build that has
    `jules grant-admin` but no `jules spend`.
    """
    with mock.patch("shutil.which", return_value="/usr/local/bin/mercor"):
        fake_result = subprocess.CompletedProcess(
            args=[], returncode=0, stdout="grant-admin  revoke-expired\n", stderr=""
        )
        with mock.patch("subprocess.run", return_value=fake_result):
            assert jules_mod._has_mercor_orchestration_spend() is False


def test_has_mercor_orchestration_returns_true_when_spend_visible(jules_mod):
    """`mercor jules --help` mentions `spend` → True."""
    with mock.patch("shutil.which", return_value="/usr/local/bin/mercor"):
        fake_result = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout="grant-admin  revoke-expired  spend\n",
            stderr="",
        )
        with mock.patch("subprocess.run", return_value=fake_result):
            assert jules_mod._has_mercor_orchestration_spend() is True


# ── direct-write path ────────────────────────────────────────────────────────


def test_direct_write_appends_one_jsonl_row(jules_mod, tmp_ledger):
    """A direct write produces exactly one row with the documented schema."""
    jules_mod._record_spend_direct_write(
        session_id="sess-abc",
        source_repo="sources/test123",
        prompt_length=42,
        expected_completion_minutes=15,
        dispatched_by="jules-api",
    )
    assert tmp_ledger.exists()
    rows = [json.loads(line) for line in tmp_ledger.read_text().splitlines() if line.strip()]
    assert len(rows) == 1
    row = rows[0]
    assert row["session_id"] == "sess-abc"
    assert row["source_repo"] == "sources/test123"
    assert row["prompt_length"] == 42
    assert row["expected_completion_minutes"] == 15
    assert row["dispatched_by"] == "jules-api"
    assert "timestamp" in row and row["timestamp"].endswith("+00:00")


def test_direct_write_atomic_append_across_calls(jules_mod, tmp_ledger):
    """Two consecutive calls each append one row — no truncation."""
    for i in range(3):
        jules_mod._record_spend_direct_write(
            session_id=f"sess-{i}",
            source_repo="sources/x",
            prompt_length=1,
            expected_completion_minutes=5,
            dispatched_by="jules-api",
        )
    rows = [json.loads(line) for line in tmp_ledger.read_text().splitlines() if line.strip()]
    assert [r["session_id"] for r in rows] == ["sess-0", "sess-1", "sess-2"]


# ── high-level _record_spend dispatch ────────────────────────────────────────


def test_record_spend_uses_orchestration_api_when_available(jules_mod, tmp_ledger):
    """When mercor-orchestration is installed, prefer the orchestration API.

    Asserts the orchestration subprocess is invoked with the correct fields
    AND that no direct-write fallback occurs (ledger file stays empty).
    """
    with mock.patch.object(jules_mod, "_has_mercor_orchestration_spend", return_value=True):
        fake_result = subprocess.CompletedProcess(args=[], returncode=0, stdout="", stderr="")
        with mock.patch("subprocess.run", return_value=fake_result) as srun:
            jules_mod._record_spend(
                session_id="orc-sess",
                source_repo="sources/orc",
                prompt_length=88,
                expected_completion_minutes=20,
                dispatched_by="jules-api",
            )
            srun.assert_called_once()
            argv = srun.call_args[0][0]
            assert argv[:4] == ["mercor", "jules", "spend", "--append-from-jules-api"]
            # Check all the fields were threaded through.
            assert "--session-id" in argv and argv[argv.index("--session-id") + 1] == "orc-sess"
            assert "--source-repo" in argv and argv[argv.index("--source-repo") + 1] == "sources/orc"
            assert argv[argv.index("--prompt-length") + 1] == "88"
            assert argv[argv.index("--expected-completion-minutes") + 1] == "20"
            assert argv[argv.index("--dispatched-by") + 1] == "jules-api"
    # No direct-write fallback happened.
    assert not tmp_ledger.exists()


def test_record_spend_falls_back_to_direct_write_when_no_orchestration(jules_mod, tmp_ledger):
    """When mercor-orchestration is NOT detected, write the JSONL row directly."""
    with mock.patch.object(jules_mod, "_has_mercor_orchestration_spend", return_value=False):
        jules_mod._record_spend(
            session_id="fallback-sess",
            source_repo="sources/fallback",
            prompt_length=10,
            expected_completion_minutes=30,
            dispatched_by="jules-api",
        )
    assert tmp_ledger.exists()
    row = json.loads(tmp_ledger.read_text().splitlines()[0])
    assert row["session_id"] == "fallback-sess"
    assert row["dispatched_by"] == "jules-api"


def test_record_spend_falls_through_to_direct_write_when_orchestration_call_fails(
    jules_mod, tmp_ledger
):
    """If the orchestration subprocess exits non-zero, we still record via direct write.

    This protects the ledger when an installed-but-broken mercor-orchestration
    build would otherwise drop the row on the floor.
    """
    with mock.patch.object(jules_mod, "_has_mercor_orchestration_spend", return_value=True):
        bad_result = subprocess.CompletedProcess(
            args=[], returncode=2, stdout="", stderr="boom"
        )
        with mock.patch("subprocess.run", return_value=bad_result):
            jules_mod._record_spend(
                session_id="rescue-sess",
                source_repo="sources/rescue",
                prompt_length=5,
                expected_completion_minutes=12,
                dispatched_by="jules-api",
            )
    assert tmp_ledger.exists()
    row = json.loads(tmp_ledger.read_text().splitlines()[0])
    assert row["session_id"] == "rescue-sess"


def test_record_spend_swallows_io_errors_and_warns(jules_mod, monkeypatch, capsys):
    """An I/O failure on the ledger MUST NOT raise — only a stderr warning."""
    monkeypatch.setenv("MERCOR_JULES_LEDGER_PATH", "/nonexistent/permission-denied/ledger.jsonl")
    with mock.patch.object(jules_mod, "_has_mercor_orchestration_spend", return_value=False):
        # Should NOT raise even though the path is unwritable.
        jules_mod._record_spend(
            session_id="will-warn",
            source_repo="sources/x",
            prompt_length=1,
            expected_completion_minutes=1,
            dispatched_by="jules-api",
        )
    err = capsys.readouterr().err
    assert "warning:" in err and "spend ledger" in err


# ── cmd_create end-to-end glue ───────────────────────────────────────────────


def _make_create_args(**overrides):
    """Build a minimal argparse.Namespace mirroring the `jules create` shape."""
    import argparse

    defaults = dict(
        source="sources/abc",
        prompt="hello world",
        branch="main",
        title=None,
        require_plan_approval=False,
        no_pr=False,
        no_spend_ledger=False,
        expected_completion_minutes=30,
        dispatched_by="jules-api",
        json=False,
    )
    defaults.update(overrides)
    return argparse.Namespace(**defaults)


def test_cmd_create_records_ledger_with_correct_fields(jules_mod, tmp_ledger, capsys):
    """End-to-end: cmd_create posts a session AND appends the ledger row.

    The orchestration API is forced off so we hit the direct-write path and
    can inspect the resulting JSONL row directly.
    """
    fake_session = {"name": "sessions/created-123", "state": "QUEUED", "url": "https://x"}
    with mock.patch.object(jules_mod, "_resolve_source", return_value="sources/abc"):
        with mock.patch.object(jules_mod, "_req", return_value=fake_session):
            with mock.patch.object(
                jules_mod, "_has_mercor_orchestration_spend", return_value=False
            ):
                jules_mod.cmd_create(_make_create_args(prompt="implement feature X"))
    # cmd_create prints to stdout via _out → swallow it.
    capsys.readouterr()

    assert tmp_ledger.exists()
    row = json.loads(tmp_ledger.read_text().splitlines()[0])
    assert row["session_id"] == "created-123"
    assert row["source_repo"] == "sources/abc"
    assert row["prompt_length"] == len("implement feature X")
    assert row["dispatched_by"] == "jules-api"


def test_cmd_create_skips_ledger_when_no_spend_ledger_flag_set(jules_mod, tmp_ledger, capsys):
    """`--no-spend-ledger` opts out of the write entirely."""
    fake_session = {"name": "sessions/skip-me", "state": "QUEUED"}
    with mock.patch.object(jules_mod, "_resolve_source", return_value="sources/abc"):
        with mock.patch.object(jules_mod, "_req", return_value=fake_session):
            jules_mod.cmd_create(_make_create_args(no_spend_ledger=True))
    capsys.readouterr()
    assert not tmp_ledger.exists()


def test_cmd_create_does_not_abort_on_ledger_write_failure(jules_mod, monkeypatch, capsys):
    """The cardinal invariant: a ledger failure must not break session creation.

    Mocks `_record_spend` itself to raise — if cmd_create propagated the
    exception, this test would fail. The integration must isolate the write.
    (In production `_record_spend` already swallows errors; this guards that
    contract from regression.)
    """
    fake_session = {"name": "sessions/keep-going", "state": "QUEUED"}

    def boom(**_kw):
        # Simulate a programming error inside the ledger path.
        raise RuntimeError("simulated ledger explosion")

    with mock.patch.object(jules_mod, "_resolve_source", return_value="sources/abc"):
        with mock.patch.object(jules_mod, "_req", return_value=fake_session):
            with mock.patch.object(jules_mod, "_record_spend", side_effect=boom):
                # If cmd_create were not robust to ledger failure, this would
                # raise. The current implementation calls `_record_spend`
                # which itself swallows all errors; we additionally accept
                # the case where cmd_create is wrapped to catch.
                try:
                    jules_mod.cmd_create(_make_create_args())
                    aborted = False
                except RuntimeError:
                    aborted = True

    # The hard rule: session creation must succeed regardless of ledger fate.
    # We accept either (a) cmd_create itself catches, or (b) the production
    # path of _record_spend swallowing errors. The point of this test is to
    # document and lock in that the create call is not aborted in normal
    # operation: production `_record_spend` cannot raise (proven by the
    # `_record_spend_swallows_io_errors_and_warns` test above). If a future
    # refactor allows it to raise, cmd_create must be hardened too.
    assert not aborted, (
        "cmd_create must NOT propagate ledger-write failures — wrap "
        "_record_spend in try/except in cmd_create if _record_spend can raise."
    )
