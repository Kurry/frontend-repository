#!/usr/bin/env python3
"""Mirror open Jules PRs from the origin repo to Mercor-Intelligence, re-authored
as the local git user and SSH-signed so they pass the org's verify_commits rule
and pick up free Cursor Bugbot + Socket Security reviews.

Idempotent: skips a branch if the target already has an open PR for it, or if it
was recorded as empty (cherry-pick produced no diff) in the state file.

One pass (call from the loop):
  mirror_prs_to_mercor.py [--origin Kurry/frontend-repository]
     [--target Mercor-Intelligence/frontend-repository] [--mercor-remote mercor]
     [--state <jsonl>] [--worktree <dir>]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def sh(*a, cwd=ROOT, **k):
    return subprocess.run(a, capture_output=True, text=True, cwd=cwd, **k)


def gh_json(*a):
    r = sh("gh", *a)
    try:
        return json.loads(r.stdout)
    except Exception:
        return []


def load_state(p: Path) -> dict:
    d = {}
    if p.exists():
        for line in p.read_text().splitlines():
            if line.strip():
                try:
                    row = json.loads(line); d[row["branch"]] = row
                except Exception:
                    pass
    return d


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="Kurry/frontend-repository")
    ap.add_argument("--target", default="Mercor-Intelligence/frontend-repository")
    ap.add_argument("--mercor-remote", default="mercor")
    ap.add_argument("--state", type=Path,
                    default=ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent" / ".mirrored-prs.jsonl")
    ap.add_argument("--reprocess", action="store_true",
                    help="re-push already-mirrored branches (e.g. after excluding dist)")
    ap.add_argument("--worktree", type=Path,
                    default=Path("/private/tmp/claude-501/-Users-kurrytran-frontend-repository/0a2c5e5d-30a3-4e80-a8b2-fc368a34c16a/scratchpad/mirror-wt"))
    args = ap.parse_args()

    state = load_state(args.state)
    # keep mercor/main current — the PR base
    sh("git", "fetch", args.mercor_remote, "main")

    prs = gh_json("pr", "list", "--repo", args.origin, "--state", "open",
                  "--limit", "300", "--json", "number,title,headRefName,body")
    # target-side open PRs (skip branches already mirrored)
    tgt = gh_json("pr", "list", "--repo", args.target, "--state", "open",
                  "--limit", "300", "--json", "headRefName")
    tgt_heads = {p["headRefName"] for p in tgt}

    # ensure worktree
    if not (args.worktree / ".git").exists():
        sh("git", "worktree", "add", "--detach", str(args.worktree), f"{args.mercor_remote}/main")

    done = mirrored = skipped = 0
    for p in prs:
        br = p["headRefName"]
        already = br in tgt_heads or (br in state and state[br].get("status") in ("mirrored", "empty"))
        if already and not args.reprocess:
            done += 1
            continue
        title, body, num = p["title"], (p.get("body") or ""), p["number"]
        wt = args.worktree
        # Fetch the Jules branch tip. The branch is based on a stale/divergent
        # main, so replaying its commits is fragile — instead take the FIXED
        # solution/app from its tip and commit it fresh on current mercor/main.
        sh("git", "fetch", args.origin, br)  # updates refs/remotes/origin/<br>
        # Resolve to a full SHA in ROOT — a SHA is resolvable from any worktree
        # (shared object store), unlike a fresh remote ref name.
        tip = sh("git", "rev-parse", f"origin/{br}").stdout.strip()
        if not tip:
            print(f"skip #{num} {br}: could not resolve origin ref", file=sys.stderr); skipped += 1; continue
        # Files the branch changed vs its fork point — robust for merge commits
        # (plain diff-tree shows nothing on a merge) and normal commits alike.
        base = sh("git", "merge-base", "origin/main", tip).stdout.strip() or "origin/main"
        paths = sh("git", "diff", "--name-only", base, tip).stdout
        slugs = sorted({p.split("/")[1] for p in paths.splitlines()
                        if p.startswith("tasks/") and len(p.split("/")) > 2})
        if not slugs:
            print(f"skip #{num} {br}: touches no tasks/<slug>", file=sys.stderr); skipped += 1; continue
        sh("git", "checkout", "-B", f"mir-{num}", f"{args.mercor_remote}/main", cwd=wt)
        for slug in slugs:
            # source only — never mirror built dist/ (bloats the PR; rebuilt by verify:build)
            sh("git", "checkout", tip, "--", f"tasks/{slug}/solution/app",
               f":(exclude)tasks/{slug}/solution/app/dist", cwd=wt)
            # drop any dist that slipped in (base had it, or nested)
            for d in (Path(wt) / "tasks" / slug / "solution" / "app").glob("**/dist"):
                if d.is_dir():
                    sh("git", "rm", "-rq", "--", str(d.relative_to(wt)), cwd=wt)
        sh("git", "add", "-A", cwd=wt)
        staged = sh("git", "diff", "--cached", "--name-only", cwd=wt).stdout.strip()
        if not staged:
            with args.state.open("a") as f:
                f.write(json.dumps({"branch": br, "origin_pr": num, "status": "empty"}) + "\n")
            print(f"skip #{num} {br}: no diff vs mercor/main (already applied)", file=sys.stderr)
            skipped += 1
            continue
        sh("git", "commit", "-S", "-m", title, cwd=wt)  # authored as local user (you)
        push = sh("git", "push", "-f", args.mercor_remote, f"mir-{num}:{br}", cwd=wt)
        if push.returncode != 0:
            print(f"FAIL push #{num} {br}: {push.stderr[:200]}", file=sys.stderr)
            continue
        if br in tgt_heads:
            # branch already has an open PR; the force-push above updated it
            print(f"updated #{num} {br}: force-pushed (dropped dist)", file=sys.stderr)
            mirrored += 1
            continue
        nb = body + f"\n\n---\nMirrored from {args.origin}#{num} (Jules oracle-fix), re-authored + re-signed."
        pr = sh("gh", "pr", "create", "--repo", args.target, "--head", br, "--base", "main",
                "--title", title, "--body", nb)
        url = (pr.stdout or pr.stderr).strip().splitlines()[-1] if (pr.stdout or pr.stderr).strip() else "?"
        with args.state.open("a") as f:
            f.write(json.dumps({"branch": br, "origin_pr": num, "status": "mirrored", "url": url}) + "\n")
        print(f"mirrored #{num} {br} -> {url}", file=sys.stderr)
        mirrored += 1

    print(json.dumps({"open_origin_prs": len(prs), "already_done": done,
                      "mirrored": mirrored, "skipped_empty": skipped}))


if __name__ == "__main__":
    main()
