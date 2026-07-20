#!/usr/bin/env python3
"""Mirror open Jules PRs from the origin repo to Mercor-Intelligence, re-authored
as the local git user and SSH-signed so they pass the org's verify_commits rule
and pick up free Cursor Bugbot + Socket Security reviews.

Idempotent: skips a branch if the target already has an open PR for it, or if it
was recorded as empty (cherry-pick produced no diff) in the state file.

One pass (call from the loop):
  mirror_prs_to_mercor.py [--origin Kurry/frontend-repository]
     [--target Mercor-Intelligence/frontend-repository] [--mercor-remote mercor]
     [--origin-remote origin]
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
    ap.add_argument("--origin", default="Kurry/frontend-repository")
    ap.add_argument("--target", default="Mercor-Intelligence/frontend-repository")
    ap.add_argument("--mercor-remote", default="mercor")
    ap.add_argument("--origin-remote", default="origin")
    ap.add_argument("--state", type=Path,
                    default=ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent" / ".mirrored-prs.jsonl")
    ap.add_argument("--worktree", type=Path,
                    default=Path(tempfile.gettempdir()) / "harvest-oracle-mirror-wt")
    args = ap.parse_args()

    state = load_state(args.state)
    # keep mercor/main current — the PR base
    base_fetch = sh("git", "fetch", args.mercor_remote, "main")
    if base_fetch.returncode != 0:
        raise RuntimeError(f"git fetch {args.mercor_remote} main failed: {base_fetch.stderr.strip()}")

    prs = gh_json("pr", "list", "--repo", args.origin, "--state", "open",
                  "--limit", "300", "--json", "number,title,headRefName,headRefOid,body")
    # target-side open PRs (skip branches already mirrored)
    tgt = gh_json("pr", "list", "--repo", args.target, "--state", "open",
                  "--limit", "300", "--json", "headRefName")
    tgt_heads = {p["headRefName"] for p in tgt}

    # ensure worktree
    if not (args.worktree / ".git").exists():
        added = sh("git", "worktree", "add", "--detach", str(args.worktree), f"{args.mercor_remote}/main")
        if added.returncode != 0:
            raise RuntimeError(f"git worktree add failed for {args.worktree}: {added.stderr.strip()}")

    done = mirrored = skipped = 0
    for p in prs:
        br = p["headRefName"]
        prior = state.get(br, {})
        same_empty_head = prior.get("status") == "empty" and prior.get("origin_head") == p["headRefOid"]
        if br in tgt_heads or same_empty_head:
            done += 1
            continue
        title, body, num = p["title"], (p.get("body") or ""), p["number"]
        wt = args.worktree
        # Fetch the Jules branch tip. The branch is based on a stale/divergent
        # main, so replaying its commits is fragile — instead take the FIXED
        # solution/app from its tip and commit it fresh on current mercor/main.
        tip = f"refs/remotes/{args.origin_remote}/{br}"
        fetched = sh("git", "fetch", args.origin_remote, f"{br}:{tip}")
        if fetched.returncode != 0:
            print(f"FAIL fetch #{num} {br}: {fetched.stderr[:200]}", file=sys.stderr)
            continue
        # Inspect the complete PR diff, not only its tip commit: later commits
        # may contain metadata-only fixes while solution/app changed earlier.
        diff = sh("gh", "pr", "diff", str(num), "--repo", args.origin, "--name-only")
        if diff.returncode != 0:
            print(f"FAIL diff #{num} {br}: {diff.stderr[:200]}", file=sys.stderr)
            continue
        paths = diff.stdout
        slugs = sorted({p.split("/")[1] for p in paths.splitlines()
                        if p.startswith("tasks/") and len(p.split("/")) > 2})
        if not slugs:
            print(f"skip #{num} {br}: touches no tasks/<slug>", file=sys.stderr); skipped += 1; continue
        checkout = sh("git", "checkout", "-B", f"mir-{num}", f"{args.mercor_remote}/main", cwd=wt)
        if checkout.returncode != 0:
            print(f"FAIL checkout base #{num} {br}: {checkout.stderr[:200]}", file=sys.stderr)
            continue
        for slug in slugs:
            copied = sh("git", "checkout", tip, "--", f"tasks/{slug}/solution/app", cwd=wt)
            if copied.returncode != 0:
                print(f"FAIL copy #{num} {br} {slug}: {copied.stderr[:200]}", file=sys.stderr)
                break
        else:
            copied = None
        if copied is not None and copied.returncode != 0:
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
