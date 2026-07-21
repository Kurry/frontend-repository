from __future__ import annotations

import re

from corpuscheck.discovery import discover
from corpuscheck.drift import DriftKind, detect_corpus_drift
from corpuscheck.validate import STACK_NAMES, validate_task


def _stack_pattern() -> re.Pattern[str]:
    return re.compile(
        r"\b(?:uses|using|implemented with|built with|powered by|via)\s+(?:"
        + "|".join(re.escape(name) for name in STACK_NAMES)
        + r")\b",
        re.I,
    )


def test_stack_scan_flags_only_identity_phrasing():
    pat = _stack_pattern()
    # Real un-verifiable stack-identity claims must be flagged.
    assert pat.search("the app is built with React and hydrates cleanly")
    assert pat.search("uses Tailwind utility classes for spacing")
    # Ordinary prose where a framework name is an English/CSS word must NOT flag
    # (the 'solid' false-positive class that tripped three real criteria).
    assert not pat.search("a 2 pixel solid brand-blue left border")
    assert not pat.search("full-viewport solid-black boot screen")
    assert not pat.search("the tag chip set (study, sharp, solid, trap, endgame)")


def test_real_eval_dashboard_passes_static_validation(TASKS_ROOT):
    result = validate_task(TASKS_ROOT / "frontend-data-tracking-eval-dashboard")

    assert result.passed, result.messages
    assert not any(not check.passed for check in result.checks)


def test_real_discovery_has_at_least_64_assigned_tasks(TASKS_ROOT):
    # 65 active tasks remain under tasks/ after the 2026-07-21 quarantine of
    # 38 dist-absent oracles into tasks-quarantine/.
    tasks = discover(TASKS_ROOT)

    assert len(tasks) >= 64
    assert sum(task.has_assignment for task in tasks) >= 64


def test_real_corpus_has_no_missing_or_orphan_directories(TASKS_ROOT):
    report = detect_corpus_drift(TASKS_ROOT)
    forbidden = {DriftKind.MISSING_TASK_DIR, DriftKind.ORPHAN_DIR}

    assert not [item for item in report.items if item.kind in forbidden]
