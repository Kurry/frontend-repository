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
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def sh(*a, cwd=ROOT, **k):
    return subprocess.run(a, capture_output=True, text=True, cwd=cwd, **k)


def gh_json(*a):
    r = sh("gh", *a)
    if r.returncode != 0:
        raise RuntimeError(f"gh {' '.join(a)} failed: {r.stderr.strip()}")
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"gh {' '.join(a)} returned invalid JSON: {exc}") from exc


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
    ap.add_argument("--origin", default="Kurry/frontend-repository",
                    help="gh repo slug (for gh pr list)")
    ap.add_argument("--origin-remote", default="origin",
                    help="git remote NAME for fetches (not the gh slug)")
    ap.add_argument("--target", default="Mercor-Intelligence/frontend-repository")
    ap.add_argument("--mercor-remote", default="mercor")
    ap.add_argument("--state", type=Path,
                    default=ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent" / ".mirrored-prs.jsonl")
    ap.add_argument("--reprocess", action="store_true",
                    help="re-push already-mirrored branches (e.g. after excluding dist)")
    ap.add_argument("--worktree", type=Path,
                    default=Path(tempfile.gettempdir()) / f"{ROOT.name}-mirror-wt")
    args = ap.parse_args()

    state = load_state(args.state)
    # keep mercor/main current — the PR base
    fetch_base = sh("git", "fetch", args.mercor_remote, "main")
    if fetch_base.returncode != 0:
        raise SystemExit(f"FAIL fetch {args.mercor_remote}/main: {fetch_base.stderr.strip()}")
    # bulk-fetch ALL origin branches up front so every origin/<pr-branch> is
    # resolvable on the first pass (per-branch fetch had a first-pass race that
    # made new branches skip until a second run).
    fetch_all = sh("git", "fetch", args.origin_remote, "+refs/heads/*:refs/remotes/origin/*")
    if fetch_all.returncode != 0:
        raise SystemExit(f"FAIL fetch {args.origin_remote}/*: {fetch_all.stderr.strip()}")

    prs = gh_json("pr", "list", "--repo", args.origin, "--state", "open",
                  "--limit", "300", "--json", "number,title,headRefName,headRefOid,body")
    # target-side open PRs (skip branches already mirrored)
    tgt = gh_json("pr", "list", "--repo", args.target, "--state", "open",
                  "--limit", "300", "--json", "headRefName")
    tgt_heads = {p["headRefName"] for p in tgt}

    # ensure worktree
    if not (args.worktree / ".git").exists():
        added = sh("git", "worktree", "add", "--detach", str(args.worktree),
                   f"{args.mercor_remote}/main")
        if added.returncode != 0:
            raise SystemExit(f"FAIL create worktree {args.worktree}: {added.stderr.strip()}")

    done = mirrored = skipped = 0
    for p in prs:
        br = p["headRefName"]
        # Re-mirror when the target PR is gone or the origin head moved: skip
        # only if the target still has an open PR, or the branch was recorded
        # empty against this exact origin head. --reprocess forces a re-push.
        prior = state.get(br, {})
        same_empty_head = prior.get("status") == "empty" and prior.get("origin_head") == p["headRefOid"]
        if (br in tgt_heads or same_empty_head) and not args.reprocess:
            done += 1
            continue
        title, body, num = p["title"], (p.get("body") or ""), p["number"]
        wt = args.worktree
        # Fetch the Jules branch tip. The branch is based on a stale/divergent
        # main, so replaying its commits is fragile — instead take the FIXED
        # solution/app from its tip and commit it fresh on current mercor/main.
        fetch_br = sh("git", "fetch", args.origin_remote, br)  # updates refs/remotes/origin/<br>
        if fetch_br.returncode != 0:
            print(f"skip #{num} {br}: fetch failed: {fetch_br.stderr.strip()[:200]}", file=sys.stderr)
            skipped += 1
            continue
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
        checkout = sh("git", "checkout", "-B", f"mir-{num}", f"{args.mercor_remote}/main", cwd=wt)
        if checkout.returncode != 0:
            print(f"FAIL checkout base #{num} {br}: {checkout.stderr[:200]}", file=sys.stderr)
            continue
        copy_failed = False
        for slug in slugs:
            # source only — never mirror built dist/ (bloats the PR; rebuilt by verify:build)
            copied = sh("git", "checkout", tip, "--", f"tasks/{slug}/solution/app",
                        f":(exclude)tasks/{slug}/solution/app/dist", cwd=wt)
            if copied.returncode != 0:
                print(f"FAIL copy #{num} {br} {slug}: {copied.stderr[:200]}", file=sys.stderr)
                copy_failed = True
                break
            # drop any dist that slipped in (base had it, or nested)
            for d in (Path(wt) / "tasks" / slug / "solution" / "app").glob("**/dist"):
                if d.is_dir():
                    sh("git", "rm", "-rq", "--", str(d.relative_to(wt)), cwd=wt)
        if copy_failed:
            continue
        sh("git", "add", "-A", cwd=wt)
        staged = sh("git", "diff", "--cached", "--name-only", cwd=wt).stdout.strip()
        if not staged:
            with args.state.open("a") as f:
                f.write(json.dumps({"branch": br, "origin_pr": num, "origin_head": p["headRefOid"], "status": "empty"}) + "\n")
            print(f"skip #{num} {br}: no diff vs mercor/main (already applied)", file=sys.stderr)
            skipped += 1
            continue
        commit = sh("git", "commit", "-S", "-m", title, cwd=wt)  # authored as local user (you)
        if commit.returncode != 0:
            print(f"FAIL commit #{num} {br}: {commit.stderr[:200]}", file=sys.stderr)
            continue
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
        if pr.returncode != 0:
            print(f"FAIL create PR #{num} {br}: {pr.stderr[:200]}", file=sys.stderr)
            continue
        url = (pr.stdout or pr.stderr).strip().splitlines()[-1] if (pr.stdout or pr.stderr).strip() else "?"
        with args.state.open("a") as f:
            f.write(json.dumps({"branch": br, "origin_pr": num, "status": "mirrored", "url": url}) + "\n")
        print(f"mirrored #{num} {br} -> {url}", file=sys.stderr)
        mirrored += 1

    print(json.dumps({"open_origin_prs": len(prs), "already_done": done,
                      "mirrored": mirrored, "skipped_empty": skipped}))


if __name__ == "__main__":
    main()
