from __future__ import annotations

import sqlite3
import re

from corpuscheck.cli import app
from corpuscheck.state import STAGES, connect, readiness, set_readiness, stage_at_least


SLUG = "frontend-data-tracking-eval-dashboard"
DOCUSEAL_SLUG = "frontend-workflow-docuseal"


def invoke_validate(runner, tasks_root, db_path, *extra):
    return runner.invoke(
        app,
        ["validate", SLUG, "--root", str(tasks_root), "--db", str(db_path), *extra],
    )


def test_validate_records_run_and_per_check_results(copy_task, tmp_path, db_path, runner):
    tasks_root, _ = copy_task(SLUG, tmp_path)

    result = invoke_validate(runner, tasks_root, db_path)

    assert result.exit_code == 0, result.output
    with sqlite3.connect(db_path) as connection:
        run_count = connection.execute("SELECT COUNT(*) FROM runs").fetchone()[0]
        rows = connection.execute(
            "SELECT tier, check_name, status FROM results WHERE slug = ?", (SLUG,)
        ).fetchall()
    assert run_count == 1
    assert len(rows) >= 7
    assert {row[0] for row in rows} >= {
        "layout", "shared_shape", "contract", "instruction", "rubric", "eval_validity", "oracle"
    }


def test_incremental_skips_then_changed_fingerprint_revalidates(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, task = copy_task(SLUG, tmp_path)
    first = invoke_validate(runner, tasks_root, db_path)
    assert first.exit_code == 0, first.output
    with connect(db_path) as connection:
        original = connection.execute(
            "SELECT content_hash FROM fingerprints WHERE slug = ?", (SLUG,)
        ).fetchone()["content_hash"]

    second = invoke_validate(runner, tasks_root, db_path, "--incremental")
    assert second.exit_code == 0, second.output
    assert "SKIP" in second.output and "unchanged" in second.output
    with connect(db_path) as connection:
        latest_run = connection.execute("SELECT MAX(id) AS id FROM runs").fetchone()["id"]
        statuses = connection.execute(
            "SELECT check_name, status FROM results WHERE run_id = ?", (latest_run,)
        ).fetchall()
    assert [(row["check_name"], row["status"]) for row in statuses] == [("incremental", "skip")]

    (task / "INVENTORY.md").write_text("changed\n")
    third = invoke_validate(runner, tasks_root, db_path, "--incremental")
    assert third.exit_code == 1
    assert "SKIP" not in third.output
    with connect(db_path) as connection:
        changed = connection.execute(
            "SELECT content_hash FROM fingerprints WHERE slug = ?", (SLUG,)
        ).fetchone()["content_hash"]
    assert changed != original


def test_changed_static_failure_demotes_readiness_to_registered(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, task = copy_task(SLUG, tmp_path)
    advanced = runner.invoke(
        app, ["advance", SLUG, "--root", str(tasks_root), "--db", str(db_path)]
    )
    assert advanced.exit_code == 0, advanced.output
    with connect(db_path) as connection:
        assert readiness(connection, SLUG)["stage"] == "static_valid"

    (task / "INVENTORY.md").write_text("changed\n")
    failed = invoke_validate(runner, tasks_root, db_path)

    assert failed.exit_code == 1
    with connect(db_path) as connection:
        assert readiness(connection, SLUG)["stage"] == "registered"


def test_baseline_accept_waives_failure_and_remove_restores_it(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, task = copy_task(SLUG, tmp_path)
    (task / "INVENTORY.md").write_text("failure\n")
    assert invoke_validate(runner, tasks_root, db_path).exit_code == 1

    accepted = runner.invoke(
        app,
        ["baseline", "accept", SLUG, "layout", "--reason", "test waiver", "--db", str(db_path)],
    )
    assert accepted.exit_code == 0, accepted.output
    waived = invoke_validate(runner, tasks_root, db_path)
    assert waived.exit_code == 0, waived.output
    assert "WAIVED" in waived.output
    with connect(db_path) as connection:
        latest_run = connection.execute("SELECT MAX(id) AS id FROM runs").fetchone()["id"]
        status = connection.execute(
            "SELECT status FROM results WHERE run_id = ? AND slug = ? AND check_name = 'layout'",
            (latest_run, SLUG),
        ).fetchone()["status"]
    assert status == "skip"

    removed = runner.invoke(
        app, ["baseline", "remove", SLUG, "layout", "--db", str(db_path)]
    )
    assert removed.exit_code == 0, removed.output
    restored = invoke_validate(runner, tasks_root, db_path)
    assert restored.exit_code == 1
    assert "layout" in restored.output


def test_regression_summary_reports_newly_failing_then_fixed(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, task = copy_task(SLUG, tmp_path)
    inventory = task / "INVENTORY.md"
    inventory.write_text("failure\n")

    failing = invoke_validate(runner, tasks_root, db_path)
    assert failing.exit_code == 1
    assert "newly-failing: 1" in failing.output
    assert f"{SLUG}/layout" in failing.output

    inventory.unlink()
    fixed = invoke_validate(runner, tasks_root, db_path)
    assert fixed.exit_code == 0, fixed.output
    assert "fixed: 1" in fixed.output
    assert f"{SLUG}/layout" in fixed.output


def test_readiness_rerecord_replaces_row_and_status_funnel_matches_stage_rows(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, _ = copy_task(SLUG, tmp_path)
    copy_task(DOCUSEAL_SLUG, tmp_path)
    with connect(db_path) as connection:
        set_readiness(connection, SLUG, "registered", {"attempt": 1})
        set_readiness(connection, SLUG, "static_valid", {"attempt": 2})
        set_readiness(connection, DOCUSEAL_SLUG, "trial_ready", {"attempt": 1})
        rows = connection.execute("SELECT slug, stage, evidence_json FROM readiness").fetchall()
        assert sum(row["slug"] == SLUG for row in rows) == 1
        assert readiness(connection, SLUG)["evidence_json"] == '{"attempt": 2}'
        expected = {
            stage: sum(stage_at_least(row["stage"], stage) for row in rows)
            for stage in STAGES
        }

    status = runner.invoke(
        app, ["status", "--all", "--root", str(tasks_root), "--db", str(db_path)]
    )
    assert status.exit_code == 0, status.output
    for stage, count in expected.items():
        assert re.search(rf"│\s*{re.escape(stage)}\s*│\s*{count}\s*│", status.output)
