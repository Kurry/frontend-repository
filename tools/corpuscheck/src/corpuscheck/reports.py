"""Machine-readable corpus validation reports."""

from __future__ import annotations

import json
from pathlib import Path

from .validate import TaskValidation


def write_json_report(results: list[TaskValidation], path: str | Path) -> dict:
    passed = sum(result.passed for result in results)
    report = {
        "results": [
            {
                "task": result.task_dir,
                "passed": result.passed,
                "waived_checks": sorted(result.waived_checks),
                "warnings": result.warnings,
                "messages": result.messages,
            }
            for result in results
        ],
        "summary": {
            "passed": passed,
            "failed": len(results) - passed,
            "total": len(results),
        },
    }
    output = Path(path).resolve()
    package_root = Path(__file__).resolve().parents[2]
    try:
        output.relative_to(package_root)
    except ValueError:
        raise ValueError("reports may only be written under tools/corpuscheck")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n")
    return report
