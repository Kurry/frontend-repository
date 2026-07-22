#!/usr/bin/env python3
"""Fail when an aesthetic instruction edit changes Harbor task shape."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


EDITABLE_TAGS = {
    "visual_design",
    "motion",
    "responsiveness",
    "accessibility",
    "writing",
}
PROTECTED_TAGS = {
    "integrity",
    "delivery",
    "webmcp_action_contract",
    "reference_screenshots",
}
TAG_RE = re.compile(r"<([a-zA-Z0-9_:-]+)>(.*?)</\1>", re.DOTALL)
FEATURE_RE = re.compile(r"^\s*Feature:\s*(.+?)\s*(?:—|-)?\s*$", re.MULTILINE)


def run_git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or "git command failed")
    return result.stdout


def parse_tags(text: str) -> list[tuple[str, str]]:
    return [(match.group(1), match.group(2)) for match in TAG_RE.finditer(text)]


def bullet_count(body: str) -> int:
    return sum(1 for line in body.splitlines() if line.lstrip().startswith("- "))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("task_dir", type=Path)
    parser.add_argument("--base", default="HEAD")
    args = parser.parse_args()

    task_dir = args.task_dir.resolve()
    instruction = task_dir / "instruction.md"
    if not instruction.is_file():
        parser.error(f"missing {instruction}")

    repo = Path(run_git(task_dir, "rev-parse", "--show-toplevel").strip())
    relative_task = task_dir.relative_to(repo)
    relative_instruction = instruction.relative_to(repo)

    try:
        before = run_git(repo, "show", f"{args.base}:{relative_instruction.as_posix()}")
    except RuntimeError as error:
        print(f"ERROR: cannot read baseline instruction: {error}", file=sys.stderr)
        return 2
    after = instruction.read_text(encoding="utf-8")

    failures: list[str] = []
    before_tags = parse_tags(before)
    after_tags = parse_tags(after)
    before_names = [name for name, _ in before_tags]
    after_names = [name for name, _ in after_tags]
    if before_names != after_names:
        failures.append("XML tag names or order changed")

    before_map = dict(before_tags)
    after_map = dict(after_tags)
    for name in before_names:
        if name not in after_map:
            continue
        if name in EDITABLE_TAGS:
            if bullet_count(before_map[name]) != bullet_count(after_map[name]):
                failures.append(f"<{name}> bullet count changed")
        elif before_map[name] != after_map[name]:
            failures.append(f"immutable <{name}> content changed")

    if FEATURE_RE.findall(before) != FEATURE_RE.findall(after):
        failures.append("Feature headings changed")

    for name in PROTECTED_TAGS:
        if before_map.get(name) != after_map.get(name):
            failures.append(f"protected <{name}> block changed")

    changed = run_git(repo, "diff", "--name-only", args.base, "--").splitlines()
    untracked = run_git(
        repo,
        "ls-files",
        "--others",
        "--exclude-standard",
    ).splitlines()
    allowed = relative_instruction.as_posix()
    unexpected = sorted({path for path in [*changed, *untracked] if path != allowed})
    if unexpected:
        failures.append("files outside the instruction changed: " + ", ".join(unexpected))

    if failures:
        print("TASK SHAPE CHANGED")
        for failure in failures:
            print(f"- {failure}")
        return 1

    changed_sections = [
        name
        for name in EDITABLE_TAGS
        if before_map.get(name) != after_map.get(name)
    ]
    print("TASK SHAPE CONSTANT")
    print("Editable sections changed: " + (", ".join(sorted(changed_sections)) or "none"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
