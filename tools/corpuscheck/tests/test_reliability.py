from __future__ import annotations

import json
from pathlib import Path

import pytest

from corpuscheck.cli import app
from corpuscheck.reliability import (
    NOP_LABEL,
    ORACLE_LABEL,
    RewardDetailsError,
    blocked_counts,
    compute_judge_accuracy,
    corpus_flip_rates,
    flip_rates,
    ingest_trial,
    mean_flip_rate,
    parse_reward_details,
)
from corpuscheck.state import connect, set_readiness


SLUG = "frontend-synthetic-task"


def write_trial(root: Path, name: str, dimensions: dict) -> Path:
    """dimensions: {dimension: [(criterion_id, value, reasoning), ...]}"""
    trial = root / name
    (trial / "verifier").mkdir(parents=True, exist_ok=True)
    payload = {
        dimension: {
            "score": 0.0,
            "criteria": [
                {"id": cid, "name": cid, "value": value, "raw": "yes" if value >= 1 else "no", "reasoning": reasoning}
                for cid, value, reasoning in criteria
            ],
        }
        for dimension, criteria in dimensions.items()
    }
    (trial / "verifier" / "reward-details.json").write_text(json.dumps(payload))
    return trial


FOUR_PASS = {
    "core_features": [("1.1", 1.0, "ok"), ("1.2", 1.0, "ok")],
    "motion": [("2.1", 1.0, "ok"), ("2.2", 1.0, "ok")],
}


def test_parse_reward_details_flattens_and_flags_blocked(tmp_path):
    trial = write_trial(
        tmp_path,
        "trial",
        {"technical": [("3.1", 0.0, "BLOCKED: browser never launched"), ("3.2", 1.0, "fine")]},
    )
    records = parse_reward_details(trial)
    assert {(r["dimension"], r["criterion_id"], r["value"], r["blocked"]) for r in records} == {
        ("technical", "3.1", 0.0, 1),
        ("technical", "3.2", 1.0, 0),
    }
    with pytest.raises(RewardDetailsError):
        parse_reward_details(tmp_path / "missing")


def test_ingest_is_idempotent_and_replaces_values(tmp_path, db_path, runner):
    first = write_trial(tmp_path, "trial-a", FOUR_PASS)
    result = runner.invoke(
        app, ["reliability", "ingest", SLUG, "--trial", str(first), "--label", "run-1", "--db", str(db_path)]
    )
    assert result.exit_code == 0, result.output
    assert "4 criteria" in result.output

    changed = write_trial(
        tmp_path,
        "trial-a2",
        {
            "core_features": [("1.1", 0.0, "regressed"), ("1.2", 1.0, "ok")],
            "motion": [("2.1", 1.0, "ok"), ("2.2", 1.0, "ok")],
        },
    )
    again = runner.invoke(
        app, ["reliability", "ingest", SLUG, "--trial", str(changed), "--label", "run-1", "--db", str(db_path)]
    )
    assert again.exit_code == 0, again.output
    with connect(db_path) as connection:
        rows = connection.execute(
            "SELECT dimension, criterion_id, value FROM verdicts WHERE slug = ? AND label = 'run-1'",
            (SLUG,),
        ).fetchall()
    assert len(rows) == 4
    values = {(row["dimension"], row["criterion_id"]): row["value"] for row in rows}
    assert values[("core_features", "1.1")] == 0.0


def test_flip_rate_two_labels_disagree_on_one_of_four(tmp_path, db_path, runner):
    trial_a = write_trial(tmp_path, "trial-a", FOUR_PASS)
    trial_b = write_trial(
        tmp_path,
        "trial-b",
        {
            "core_features": [("1.1", 0.0, "flipped"), ("1.2", 1.0, "ok")],
            "motion": [("2.1", 1.0, "ok"), ("2.2", 1.0, "ok")],
        },
    )
    with connect(db_path) as connection:
        ingest_trial(connection, SLUG, "label-a", trial_a)
        ingest_trial(connection, SLUG, "label-b", trial_b)
        rates = flip_rates(connection, SLUG)
    assert len(rates) == 4
    by_id = {(item["dimension"], item["criterion_id"]): item["flip_rate"] for item in rates}
    assert by_id[("core_features", "1.1")] == 1.0
    assert all(rate == 0.0 for key, rate in by_id.items() if key != ("core_features", "1.1"))
    assert mean_flip_rate(rates) == pytest.approx(0.25)
    assert rates[0]["criterion_id"] == "1.1"  # sorted noisiest-first

    result = runner.invoke(app, ["reliability", "flips", SLUG, "--db", str(db_path)])
    assert result.exit_code == 0, result.output
    assert "mean flip rate: 0.250" in result.output

    rollup = runner.invoke(app, ["reliability", "flips", "--all", "--db", str(db_path)])
    assert rollup.exit_code == 0, rollup.output
    assert "1.1" in rollup.output


def test_flips_min_labels_guard(tmp_path, db_path, runner):
    trial = write_trial(tmp_path, "trial-a", FOUR_PASS)
    with connect(db_path) as connection:
        ingest_trial(connection, SLUG, "only-label", trial)
    result = runner.invoke(app, ["reliability", "flips", SLUG, "--db", str(db_path)])
    assert result.exit_code == 1
    assert "fewer than 2" in result.output


def test_corpus_rollup_joins_on_dimension_and_criterion(tmp_path, db_path):
    flip = {
        "core_features": [("1.1", 0.0, "flipped"), ("1.2", 1.0, "ok")],
        "motion": [("2.1", 1.0, "ok"), ("2.2", 1.0, "ok")],
    }
    trial_pass = write_trial(tmp_path, "trial-pass", FOUR_PASS)
    trial_flip = write_trial(tmp_path, "trial-flip", flip)
    with connect(db_path) as connection:
        for slug in ("frontend-a", "frontend-b"):
            ingest_trial(connection, slug, "label-a", trial_pass)
            ingest_trial(connection, slug, "label-b", trial_flip)
        rollup = corpus_flip_rates(connection)
    top = rollup[0]
    assert (top["dimension"], top["criterion_id"]) == ("core_features", "1.1")
    assert top["slugs"] == 2 and top["pairs"] == 2 and top["disagreements"] == 2
    assert top["flip_rate"] == 1.0


def test_judge_accuracy_oracle_false_negatives(tmp_path, db_path, runner):
    oracle_trial = write_trial(
        tmp_path,
        "oracle-trial",
        {
            "core_features": [("1.1", 1.0, "ok"), ("1.2", 0.0, "judge missed it")],
            "motion": [("2.1", 1.0, "ok")],
        },
    )
    with connect(db_path) as connection:
        set_readiness(connection, SLUG, "oracle_certified", {"trial_path": str(oracle_trial), "reward": 0.95})

    result = runner.invoke(app, ["judge-accuracy", "--db", str(db_path)])
    assert result.exit_code == 0, result.output
    assert "oracle false negatives" in result.output
    assert "core_features: 1/2 FN" in result.output
    assert "1.2" in result.output
    with connect(db_path) as connection:
        assert connection.execute(
            "SELECT 1 FROM verdicts WHERE slug = ? AND label = ?", (SLUG, ORACLE_LABEL)
        ).fetchone()
        row = connection.execute(
            "SELECT fail_count, total FROM judge_accuracy WHERE slug = ? AND dimension = 'core_features' AND run_kind = 'oracle'",
            (SLUG,),
        ).fetchone()
        assert (row["fail_count"], row["total"]) == (1, 2)
        motion = connection.execute(
            "SELECT fail_count, total FROM judge_accuracy WHERE slug = ? AND dimension = 'motion' AND run_kind = 'oracle'",
            (SLUG,),
        ).fetchone()
        assert (motion["fail_count"], motion["total"]) == (0, 1)


def test_judge_accuracy_vacuous_on_nop(tmp_path, db_path, runner):
    nop_trial = write_trial(
        tmp_path,
        "nop-trial",
        {"core_features": [("1.1", 1.0, "passed on an empty app"), ("1.2", 0.0, "correctly failed")]},
    )
    with connect(db_path) as connection:
        set_readiness(connection, SLUG, "trial_ready", {"trial_path": str(nop_trial), "reward": 0.05})

    result = runner.invoke(app, ["judge-accuracy", "--db", str(db_path)])
    assert result.exit_code == 0, result.output
    assert "vacuous on NOP" in result.output
    assert "core_features: 1/2 vacuous" in result.output
    with connect(db_path) as connection:
        row = connection.execute(
            "SELECT fail_count, total FROM judge_accuracy WHERE slug = ? AND run_kind = 'nop'",
            (SLUG,),
        ).fetchone()
        assert (row["fail_count"], row["total"]) == (1, 2)
        assert connection.execute(
            "SELECT value FROM verdicts WHERE slug = ? AND label = ? AND criterion_id = '1.1'",
            (SLUG, NOP_LABEL),
        ).fetchone()["value"] == 1.0


def test_blocked_counting_and_report(tmp_path, db_path, runner):
    trial = write_trial(
        tmp_path,
        "blocked-trial",
        {
            "technical": [
                ("3.1", 0.0, "BLOCKED: MCP tool failed"),
                ("3.2", 0.0, "BLOCKED: browser unavailable"),
                ("3.3", 0.0, "genuinely failed"),
            ]
        },
    )
    with connect(db_path) as connection:
        ingest_trial(connection, SLUG, "run-1", trial)
        counts = blocked_counts(connection)
    assert counts == [{"slug": SLUG, "blocked": 2, "total": 3}]

    report = runner.invoke(app, ["reliability", "report", "--db", str(db_path)])
    assert report.exit_code == 0, report.output
    assert "Judge reliability report" in report.output
    assert f"{SLUG}: 2 BLOCKED of 3 verdicts" in report.output


def test_compute_judge_accuracy_skips_gate_failed_and_reingest_keeps_anchor(tmp_path, db_path):
    good = write_trial(tmp_path, "good", {"motion": [("2.1", 1.0, "ok")]})
    with connect(db_path) as connection:
        set_readiness(connection, "frontend-gated", "oracle_certified", {"trial_path": str(good), "gate": "failed"})
        set_readiness(connection, SLUG, "oracle_certified", {"trial_path": str(good)})
        results = compute_judge_accuracy(connection)
        assert "frontend-gated" not in results["oracle"]
        assert SLUG in results["oracle"]
        # anchor already ingested: a second compute does not re-read the trial path
        (good / "verifier" / "reward-details.json").unlink()
        second = compute_judge_accuracy(connection)
    assert SLUG in second["oracle"]
    assert second["errors"] == []
