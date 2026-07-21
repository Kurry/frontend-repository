#!/usr/bin/env python3
"""Validate a frontend task's complete 13-dimension rubric layout."""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path
from typing import Any


DIMENSIONS = (
    "core_features",
    "visual_design",
    "motion",
    "technical",
    "user_flows",
    "edge_cases",
    "responsiveness",
    "accessibility",
    "performance",
    "writing",
    "innovation",
    "design_fidelity",
    "behavioral",
)
ALLOWED_CRITERION_WEIGHTS = {0.5, 1.0}
JUDGE_WEIGHT_LINE = re.compile(
    r"^[ \t]*weight[ \t]*=[ \t]*[+-]?(?:\d+(?:\.\d*)?|\.\d+)[ \t]*(?:\r?\n|$)"
)


def report(level: str, message: str) -> None:
    print(f"{level} {message}")


def load_toml(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    try:
        return tomllib.loads(path.read_text(encoding="utf-8")), None
    except (OSError, UnicodeError, tomllib.TOMLDecodeError) as exc:
        return None, str(exc)


def normalized_judge_header(text: str) -> str | None:
    """Return the raw judge header with only its optional weight line removed."""
    lines = text.splitlines(keepends=True)
    start = next((index for index, line in enumerate(lines) if line.strip() == "[judge]"), None)
    if start is None:
        return None

    end = len(lines)
    for index in range(start + 1, len(lines)):
        stripped = lines[index].strip()
        if not stripped.startswith("["):
            continue
        if stripped.startswith("[[judge.") or stripped.startswith("[judge."):
            continue
        end = index
        break

    return "".join(
        line for line in lines[start:end] if JUDGE_WEIGHT_LINE.fullmatch(line) is None
    )


def validate_dimension(
    dimension: str, path: Path, data: dict[str, Any]
) -> tuple[int, str | None]:
    failures = 0
    criteria = data.get("criterion")
    if not isinstance(criteria, list):
        criteria = []

    positives = sum(item.get("negate") is not True for item in criteria)
    if positives >= 1:
        report("PASS", f"{dimension} has at least one positive criterion")
    else:
        report("FAIL", f"{dimension} needs at least one positive criterion")
        failures += 1

    if dimension == "innovation":
        catchalls = [
            item
            for item in criteria
            if isinstance(item.get("id"), str) and item["id"].endswith(".catchall")
        ]
        if len(catchalls) == 1 and catchalls[0].get("negate") is not True:
            report("PASS", "innovation has exactly one positive catch-all")
        else:
            report("FAIL", "innovation must have exactly one non-negated .catchall criterion")
            failures += 1

    ids = [item.get("id") for item in criteria]
    duplicate_ids = sorted({item_id for item_id in ids if ids.count(item_id) > 1}, key=str)
    if duplicate_ids:
        report("FAIL", f"{dimension} has duplicate criterion ids: {duplicate_ids}")
        failures += 1
    else:
        report("PASS", f"{dimension} criterion ids are unique")

    invalid_weights = [
        (item.get("id", "<missing-id>"), item.get("weight"))
        for item in criteria
        if item.get("weight") not in ALLOWED_CRITERION_WEIGHTS
    ]
    if invalid_weights:
        report("FAIL", f"{dimension} has invalid criterion weights: {invalid_weights}")
        failures += 1
    else:
        report("PASS", f"{dimension} criterion weights are only 0.5 or 1.0")

    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return failures, None
    header = normalized_judge_header(text)
    if header is None:
        report("FAIL", f"{dimension} is missing a [judge] header")
        failures += 1
    return failures, header


def validate_reward(task_dir: Path) -> int:
    reward_path = task_dir / "tests" / "reward.toml"
    if not reward_path.is_file():
        report("FAIL", f"missing {reward_path}")
        return 1

    data, error = load_toml(reward_path)
    if error is not None or data is None:
        report("FAIL", f"{reward_path} does not parse: {error}")
        return 1
    report("PASS", "reward.toml parses")

    rewards = data.get("reward")
    if not isinstance(rewards, list):
        rewards = []
    reward_entry = next((item for item in rewards if item.get("name") == "reward"), None)
    if reward_entry is None:
        report("FAIL", 'reward.toml has no [[reward]] entry with name="reward"')
        return 1
    report("PASS", 'reward.toml has a [[reward]] entry with name="reward"')
    return 0


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python3 validate_dimensions.py tasks/<slug>", file=sys.stderr)
        return 2

    task_dir = Path(argv[1])
    tests_dir = task_dir / "tests"
    failures = 0
    headers: dict[str, str] = {}

    for dimension in DIMENSIONS:
        path = tests_dir / dimension / f"{dimension}.toml"
        if not path.is_file():
            report("FAIL", f"missing {path}")
            failures += 1
            continue

        data, error = load_toml(path)
        if error is not None or data is None:
            report("FAIL", f"{path} does not parse: {error}")
            failures += 1
            continue
        report("PASS", f"{path} exists and parses")
        dimension_failures, header = validate_dimension(dimension, path, data)
        failures += dimension_failures
        if header is not None:
            headers[dimension] = header

    if headers:
        first_dimension = next(iter(headers))
        first_header = headers[first_dimension]
        mismatched = [name for name, header in headers.items() if header != first_header]
        if mismatched:
            report(
                "FAIL",
                "[judge] blocks differ after stripping optional weight lines: "
                + ", ".join(mismatched),
            )
            failures += 1
        else:
            report(
                "PASS",
                f"[judge] blocks are byte-identical across {len(headers)} present dimension files "
                "after stripping optional weight lines",
            )

    failures += validate_reward(task_dir)

    if failures:
        report("FAIL", f"validation completed with {failures} failure(s)")
        return 1
    report("PASS", "validation completed with 0 failures")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
