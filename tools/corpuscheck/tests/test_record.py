from __future__ import annotations

import json

from corpuscheck.cli import app
from corpuscheck.state import connect, readiness, set_readiness


SLUG = "frontend-workflow-docuseal"


def write_trial(tmp_path, reward, details=None):
    trial = tmp_path / f"trial-{str(reward).replace('.', '-')}"
    verifier = trial / "verifier"
    verifier.mkdir(parents=True)
    (verifier / "reward.json").write_text(json.dumps({"reward": reward}))
    if details is not None:
        (verifier / "reward-details.json").write_text(json.dumps(details))
    return trial


def seed_stage(db_path, stage):
    with connect(db_path) as connection:
        set_readiness(connection, SLUG, stage, {"seed": True})


def test_high_oracle_reward_advances_to_oracle_certified(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, _ = copy_task(SLUG, tmp_path)
    seed_stage(db_path, "static_valid")
    validation = tmp_path / "validation.json"
    validation.write_text(
        json.dumps({"served": True, "consoleErrors": [], "pageErrors": []})
    )
    serving = runner.invoke(
        app,
        [
            "record", "serving", SLUG,
            "--validation", str(validation),
            "--root", str(tasks_root),
            "--db", str(db_path),
        ],
    )
    assert serving.exit_code == 0, serving.output
    with connect(db_path) as connection:
        assert readiness(connection, SLUG)["stage"] == "oracle_serving"

    trial = write_trial(tmp_path, 0.95)
    certified = runner.invoke(
        app,
        [
            "record", "oracle", SLUG,
            "--trial", str(trial),
            "--root", str(tasks_root),
            "--db", str(db_path),
        ],
    )

    assert certified.exit_code == 0, certified.output
    with connect(db_path) as connection:
        row = readiness(connection, SLUG)
        assert row["stage"] == "oracle_certified"
        assert json.loads(row["evidence_json"])["reward"] == 0.95


def test_low_oracle_reward_preserves_stage_but_stores_evidence(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, _ = copy_task(SLUG, tmp_path)
    seed_stage(db_path, "oracle_serving")
    trial = write_trial(tmp_path, 0.7)

    result = runner.invoke(
        app,
        [
            "record", "oracle", SLUG,
            "--trial", str(trial),
            "--root", str(tasks_root),
            "--db", str(db_path),
        ],
    )

    assert result.exit_code == 1
    with connect(db_path) as connection:
        row = readiness(connection, SLUG)
        evidence = json.loads(row["evidence_json"])
    assert row["stage"] == "oracle_serving"
    assert evidence["reward"] == 0.7
    assert evidence["gate"] == "failed"


def test_low_nop_reward_advances_through_nop_certified_to_trial_ready(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, _ = copy_task(SLUG, tmp_path)
    seed_stage(db_path, "oracle_certified")
    trial = write_trial(tmp_path, 0.05)

    result = runner.invoke(
        app,
        [
            "record", "nop", SLUG,
            "--trial", str(trial),
            "--root", str(tasks_root),
            "--db", str(db_path),
        ],
    )

    assert result.exit_code == 0, result.output
    with connect(db_path) as connection:
        row = readiness(connection, SLUG)
    assert row["stage"] == "trial_ready"
    assert json.loads(row["evidence_json"])["reward"] == 0.05


def test_high_nop_reward_names_vacuous_criteria_and_preserves_stage(
    copy_task, tmp_path, db_path, runner
):
    tasks_root, _ = copy_task(SLUG, tmp_path)
    seed_stage(db_path, "oracle_certified")
    details = {
        "dimensions": {
            "core_features": {
                "criteria": [
                    {"id": "1.2", "value": 1},
                    {"id": "1.3", "value": 0},
                ]
            },
            "technical": {"criteria": [{"id": "2.4", "value": 1.0}]},
        }
    }
    trial = write_trial(tmp_path, 0.4, details)

    result = runner.invoke(
        app,
        [
            "record", "nop", SLUG,
            "--trial", str(trial),
            "--root", str(tasks_root),
            "--db", str(db_path),
        ],
    )

    assert result.exit_code == 1
    assert "core_features/1.2" in result.output
    assert "technical/2.4" in result.output
    assert "core_features/1.3" not in result.output
    with connect(db_path) as connection:
        assert readiness(connection, SLUG)["stage"] == "oracle_certified"
