#!/usr/bin/env python3
"""Propagate every canonical shared surface to all task directories.

The single consistency tool: run after ANY edit to a canonical source.
Idempotent; creates missing plumbing files for registered tasks.

Surfaces:
  tests/test.sh                 <- scripts/canonical/test.sh (0755)
  tests/system_prompt.md        <- scripts/canonical/system_prompt.md
  tests/webmcp_stdio_server.mjs <- scripts/canonical/mcp/webmcp_stdio_server.mjs
  tests/reward.toml             <- scripts/canonical/reward.toml
  environment/Dockerfile        <- package_frontend_tasks.DOCKERFILE
                                   (+ reference-screenshots COPY line when the
                                    directory exists)
  task.toml                     <- render_task_toml(slug, description) using
                                   schemas/webmcp-task-sources.json descriptions
  [judge] cwd                   <- enforced to "/logs/verifier" in every
                                   tests/<dim>/<dim>.toml

Usage: python3 scripts/propagate_canonical.py [slug ...] [--check]
--check reports files that would change and exits 1 if any (no writes).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import package_frontend_tasks as pkg  # noqa: E402

SCREENSHOT_COPY = "COPY reference-screenshots/ /reference-screenshots/\n"
JUDGE_CWD = 'cwd = "/logs/verifier"'


def desired_files(task: Path, sources: dict) -> dict[Path, bytes]:
    out: dict[Path, bytes] = {}
    canon = ROOT / "scripts/canonical"
    out[task / "tests/test.sh"] = (canon / "test.sh").read_bytes()
    out[task / "tests/system_prompt.md"] = (canon / "system_prompt.md").read_bytes()
    out[task / "tests/webmcp_stdio_server.mjs"] = (
        canon / "mcp/webmcp_stdio_server.mjs"
    ).read_bytes()
    out[task / "tests/reward.toml"] = (canon / "reward.toml").read_bytes()

    dockerfile = pkg.DOCKERFILE
    if (task / "environment/reference-screenshots").is_dir():
        dockerfile += SCREENSHOT_COPY
    out[task / "environment/Dockerfile"] = dockerfile.encode()

    meta = sources.get(task.name)
    if meta and meta.get("description"):
        out[task / "task.toml"] = pkg.render_task_toml(
            task.name, meta["description"]
        ).encode()
    return out


def fix_judge_cwd(task: Path, check: bool) -> list[Path]:
    changed = []
    for toml in task.glob("tests/*/*.toml"):
        text = toml.read_text()
        fixed = re.sub(r'(?m)^cwd = ".*"$', JUDGE_CWD, text)
        if fixed != text:
            changed.append(toml)
            if not check:
                toml.write_text(fixed)
    return changed


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    sources = json.loads((ROOT / "schemas/webmcp-task-sources.json").read_text())
    tasks = (
        [ROOT / "tasks" / s for s in args.slugs]
        if args.slugs
        else sorted(
            p for p in (ROOT / "tasks").iterdir()
            if p.is_dir() and p.name.startswith("frontend-")
        )
    )
    drift: list[str] = []
    for task in tasks:
        if not (task / "tests").is_dir():
            continue
        for path, want in desired_files(task, sources).items():
            if not path.exists() or path.read_bytes() != want:
                drift.append(str(path.relative_to(ROOT)))
                if not args.check:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_bytes(want)
                    if path.name == "test.sh":
                        path.chmod(0o755)
        for toml in fix_judge_cwd(task, args.check):
            drift.append(str(toml.relative_to(ROOT)))

    verb = "would change" if args.check else "updated"
    print(f"{verb}: {len(drift)} files across {len(tasks)} tasks")
    for d in drift[:10]:
        print(" ", d)
    if len(drift) > 10:
        print(f"  ... and {len(drift) - 10} more")
    return 1 if (args.check and drift) else 0


if __name__ == "__main__":
    raise SystemExit(main())
