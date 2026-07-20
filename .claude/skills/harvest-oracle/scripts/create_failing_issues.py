#!/usr/bin/env python3
"""Create one GitHub issue per task on Mercor-Intelligence/frontend-repository
listing ALL failing graded criteria (from tasks/<slug>/solution/reward-details.json),
grouped by dimension. Idempotent: skips a task that already has its issue
(matched by the exact title). For review + as a source agents/Cursor can read.

  create_failing_issues.py [--repo Mercor-Intelligence/frontend-repository]
      [--label jules] [--dry-run] [--only <slug> ...]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True, cwd=ROOT)


def failing_body(slug: str) -> tuple[str, int]:
    rd = ROOT / "tasks" / slug / "solution" / "reward-details.json"
    if not rd.is_file():
        return "", 0
    data = json.loads(rd.read_text())
    total = 0
    sections = []
    for dim, block in sorted(data.items()):
        if not isinstance(block, dict) or "criteria" not in block:
            continue
        rows = []
        for c in block["criteria"]:
            if not (c.get("value", 1) == 0 or str(c.get("reasoning", "")).startswith(("BLOCKED:", "FAIL:"))):
                continue
            total += 1
            desc = " ".join(str(c.get("description", "")).split())[:160]
            reason = " ".join(str(c.get("reasoning", "")).split())[:200]
            rows.append(f"- [ ] **[{c.get('id')}]** {desc}" + (f" — _{reason}_" if reason else ""))
        if rows:
            sections.append(f"### {dim} ({len(rows)} failing)\n" + "\n".join(rows))
    if not sections:
        return "", 0
    body = (f"Reference oracle at `tasks/{slug}/solution/app` must pass **every** graded criterion "
            f"(target 100%). Below is the complete list of currently-failing criteria "
            f"({total} of the graded set). Full detail: `tasks/{slug}/solution/reward-details.json`.\n\n"
            f"Priority: core_features / user_flows / behavioral → anticheat → technical / edge_cases / "
            f"mcp_contract → accessibility / responsiveness → visual_design / motion / design_fidelity / writing.\n\n"
            + "\n\n".join(sections))
    if len(body) > 63000:
        body = body[:63000] + "\n\n_…truncated — see `solution/reward-details.json` for the rest._"
    return body, total


def existing_titles(repo: str) -> set[str]:
    r = sh("gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", "500",
           "--json", "title")
    try:
        return {i["title"] for i in json.loads(r.stdout)}
    except Exception:
        return set()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="Mercor-Intelligence/frontend-repository")
    ap.add_argument("--label", default=None, help="label to add (e.g. 'jules' to auto-dispatch)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", nargs="*", default=None)
    args = ap.parse_args()

    slugs = sorted(p.parent.parent.name for p in ROOT.glob("tasks/*/solution/reward-details.json"))
    if args.only:
        slugs = [s for s in slugs if s in set(args.only)]
    have = existing_titles(args.repo)
    created = skipped = 0
    for slug in slugs:
        title = f"oracle-fix: {slug}"
        if title in have:
            skipped += 1
            continue
        body, n = failing_body(slug)
        if not body:
            skipped += 1
            continue
        if args.dry_run:
            print(f"[dry] would create issue '{title}' ({n} failing, {len(body)} chars)", file=sys.stderr)
            created += 1
            continue
        cmd = ["gh", "issue", "create", "--repo", args.repo, "--title", title, "--body", body]
        if args.label:
            cmd += ["--label", args.label]
        r = sh(*cmd)
        url = (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr).strip() else "?"
        if r.returncode == 0:
            print(f"created {slug}: {n} failing -> {url}", file=sys.stderr)
            created += 1
        else:
            print(f"FAIL {slug}: {r.stderr[:150]}", file=sys.stderr)
    print(json.dumps({"tasks": len(slugs), "created": created, "skipped": skipped}))


if __name__ == "__main__":
    main()
