#!/usr/bin/env python3
"""Regenerate tests/<dim>/<dim>.toml for every packaged task from its authoring
rubric.json + verifier_checklist.json — without running the full packaging
pipeline (which rebuilds whole task dirs and would clobber hand-curated files).

Validates polarity per dimension before writing and criteria coverage after.

Usage: python3 scripts/regen_dimension_tomls.py [slug ...]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "scripts"), str(ROOT / "tasks")]

import package_frontend_tasks as pk  # noqa: E402


def regen(slug: str) -> str:
    task_dir = ROOT / "tasks" / slug
    rubric_path = pk.authoring_rubric_path(slug)
    if not rubric_path.exists():
        return "no-authoring-rubric"
    rubric = [
        i for i in json.loads(rubric_path.read_text())
        if not pk.is_checklist_aggregate(i)
    ]
    pol = pk.verify_polarity(rubric)
    if pol:
        return f"polarity-fail: {pol}"
    checklist = pk.load_authoring_checklist(slug)
    pk.write_dimension_tomls(task_dir, rubric, checklist=checklist)
    coverage = pk.verify_task_criteria_coverage(task_dir, slug=slug)
    if coverage:
        return f"coverage-fail: {coverage}"
    n = len(rubric) + len(checklist)
    return f"ok:{n}-criteria"


def main() -> int:
    slugs = sys.argv[1:] or sorted(pk.TASK_SPECS)
    failures = 0
    for slug in slugs:
        status = regen(slug)
        print(f"{slug}: {status}")
        if not status.startswith("ok"):
            failures += 1
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
