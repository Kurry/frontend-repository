#!/usr/bin/env python3
"""Comment the FAILING graded criteria on each open PR (Mercor-Intelligence by
default) so oracle-fix agents and Cursor Bugbot can read exactly what to fix.

For each open PR: resolve the task slug from its changed files, read
tasks/<slug>/solution/reward-details.json, keep only failing criteria (value 0 or
reasoning starting BLOCKED:/FAIL:), and post one comment grouped by dimension.
Idempotent: skips a PR that already has the marker comment.

  comment_failing_criteria.py [--repo Mercor-Intelligence/frontend-repository] [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MARKER = "<!-- failing-criteria-report -->"


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True, cwd=ROOT)


def gh_json(*a):
    r = sh("gh", *a)
    try:
        return json.loads(r.stdout)
    except Exception:
        return []


def slug_from_files(files) -> str | None:
    for f in files:
        p = f.get("path", "")
        if p.startswith("tasks/") and len(p.split("/")) > 2:
            return p.split("/")[1]
    return None


def failing_report(slug: str) -> tuple[str, int]:
    rd_path = ROOT / "tasks" / slug / "solution" / "reward-details.json"
    if not rd_path.is_file():
        return "", 0
    data = json.loads(rd_path.read_text())
    total_fail = 0
    sections = []
    for dim, block in sorted(data.items()):
        if not isinstance(block, dict) or "criteria" not in block:
            continue
        rows = []
        for c in block["criteria"]:
            failing = c.get("value", 1) == 0 or str(c.get("reasoning", "")).startswith(("BLOCKED:", "FAIL:"))
            if not failing:
                continue
            total_fail += 1
            desc = " ".join(str(c.get("description", "")).split())[:160]
            reason = " ".join(str(c.get("reasoning", "")).split())[:200]
            rows.append(f"- **[{c.get('id')}]** {desc}" + (f" — _{reason}_" if reason else ""))
        if rows:
            sections.append(f"### {dim} ({len(rows)} failing)\n" + "\n".join(rows))
    if not sections:
        return "", 0
    body = (f"{MARKER}\n## ❌ Failing graded criteria for `{slug}` ({total_fail} failing)\n\n"
            f"For the agent fixing this oracle and for **@cursor** review — address every item below. "
            f"The complete graded detail is in `tasks/{slug}/solution/reward-details.json`.\n\n"
            + "\n\n".join(sections))
    # GitHub comment hard limit ~65536 chars
    if len(body) > 63000:
        body = body[:63000] + "\n\n_…truncated — see `solution/reward-details.json` for the rest._"
    return body, total_fail


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="Mercor-Intelligence/frontend-repository")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    prs = gh_json("pr", "list", "--repo", args.repo, "--state", "open",
                  "--limit", "300", "--json", "number,headRefName")
    commented = skipped = 0
    for pr in prs:
        num = pr["number"]
        files = gh_json("pr", "view", str(num), "--repo", args.repo, "--json", "files").get("files", []) \
            if False else gh_json("pr", "view", str(num), "--repo", args.repo, "--json", "files")
        files = files.get("files", []) if isinstance(files, dict) else []
        slug = slug_from_files(files)
        if not slug:
            skipped += 1
            continue
        # idempotency: already has the marker?
        comments = gh_json("pr", "view", str(num), "--repo", args.repo, "--json", "comments")
        existing = comments.get("comments", []) if isinstance(comments, dict) else []
        if any(MARKER in (c.get("body", "")) for c in existing):
            skipped += 1
            continue
        body, n = failing_report(slug)
        if not body:
            skipped += 1
            continue
        if args.dry_run:
            print(f"[dry] PR #{num} {slug}: would comment {n} failing criteria ({len(body)} chars)", file=sys.stderr)
            commented += 1
            continue
        r = sh("gh", "pr", "comment", str(num), "--repo", args.repo, "--body", body)
        if r.returncode == 0:
            print(f"commented PR #{num} {slug}: {n} failing", file=sys.stderr)
            commented += 1
        else:
            print(f"FAIL PR #{num} {slug}: {r.stderr[:120]}", file=sys.stderr)
    print(json.dumps({"open_prs": len(prs), "commented": commented, "skipped": skipped}))


if __name__ == "__main__":
    main()
