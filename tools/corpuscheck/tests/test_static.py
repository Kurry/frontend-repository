from __future__ import annotations

from corpuscheck.discovery import discover
from corpuscheck.drift import DriftKind, detect_corpus_drift
from corpuscheck.validate import validate_task


def test_real_eval_dashboard_passes_static_validation(TASKS_ROOT):
    result = validate_task(TASKS_ROOT / "frontend-data-tracking-eval-dashboard")

    assert result.passed, result.messages
    assert not any(not check.passed for check in result.checks)


def test_real_discovery_has_at_least_89_assigned_tasks(TASKS_ROOT):
    tasks = discover(TASKS_ROOT)

    assert len(tasks) >= 89
    assert sum(task.has_assignment for task in tasks) >= 89


def test_real_corpus_has_no_missing_or_orphan_directories(TASKS_ROOT):
    report = detect_corpus_drift(TASKS_ROOT)
    forbidden = {DriftKind.MISSING_TASK_DIR, DriftKind.ORPHAN_DIR}

    assert not [item for item in report.items if item.kind in forbidden]
