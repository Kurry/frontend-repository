#!/usr/bin/env python3
"""Recover oracle fixes from Jules sessions that COMPLETED with a changeset but
never opened a PR (AUTO_CREATE_PR didn't fire because they concluded via the
feedback path). For each: pull the final gitPatch, apply it at its base commit to
reconstruct the fixed solution/app, commit that onto mercor/main (dist excluded,
signed, authored as the local user), push, and open a PR on Mercor-Intelligence.

Usage: recover_jules_patches.py [--limit N] [--only <slug>]
Input: /tmp/comp_recoverable.json  ([{sid, slug}, ...])
"""
from __future__ import annotations
import json, subprocess, sys, shutil, argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
J = str(ROOT / ".claude" / "skills" / "jules-api" / "scripts" / "jules")
SB = Path("/private/tmp/claude-501/-Users-kurrytran-frontend-repository/0a2c5e5d-30a3-4e80-a8b2-fc368a34c16a/scratchpad")
MERCOR_WT = SB / "recover-mercor-wt"
BASE_WT = SB / "recover-base-wt"
TARGET = "Mercor-Intelligence/frontend-repository"
STATE = ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent" / ".recovered-prs.jsonl"


def sh(*a, cwd=ROOT, **k):
    return subprocess.run(a, capture_output=True, text=True, cwd=cwd, **k)


def final_patch(sid):
    """Largest gitPatch (the final changeset) + its baseCommitId."""
    r = sh(sys.executable, J, "--json", "activities", sid)
    try:
        d = json.loads(r.stdout); acts = d if isinstance(d, list) else d.get("activities", [])
    except Exception:
        return None, None
    best, base = "", None
    for a in acts:
        for art in (a.get("artifacts") or []):
            gp = art.get("gitPatch") or (art.get("changeSet") or {}).get("gitPatch")
            if gp and len(gp.get("unidiffPatch", "")) > len(best):
                best = gp["unidiffPatch"]; base = gp.get("baseCommitId")
    return (best or None), base


def load_done():
    d = set()
    if STATE.exists():
        for l in STATE.read_text().splitlines():
            try: d.add(json.loads(l)["slug"])
            except Exception: pass
    return d


def probe_recoverable():
    """Poll the fleet for sessions that COMPLETED with a changeset but no PR."""
    from concurrent.futures import ThreadPoolExecutor
    rows = [json.loads(l) for l in
            (ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent" / ".jules-fleet-state.jsonl")
            .read_text().splitlines() if l.strip()]
    seen = {r["session_id"]: r["slug"] for r in rows}

    def probe(it):
        sid, slug = it
        try:
            d = json.loads(sh(sys.executable, J, "--json", "get", sid).stdout)
        except Exception:
            return None
        if d.get("state") != "COMPLETED":
            return None
        if any(o.get("pullRequest") for o in d.get("outputs", [])):
            return None
        try:
            a = json.loads(sh(sys.executable, J, "--json", "activities", sid).stdout)
            acts = a if isinstance(a, list) else a.get("activities", [])
            if any("gitPatch" in json.dumps(x) or "changeSet" in json.dumps(x) or x.get("artifacts") for x in acts):
                return {"sid": sid, "slug": slug}
        except Exception:
            pass
        return None

    return [r for r in ThreadPoolExecutor(max_workers=16).map(probe, seen.items()) if r]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--only", default=None)
    ap.add_argument("--sids", default=None,
                    help="comma-separated session ids to recover regardless of state (stuck loopers)")
    args = ap.parse_args()

    if args.sids:
        smap = {r["session_id"]: r["slug"] for r in
                (json.loads(l) for l in
                 (ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent" / ".jules-fleet-state.jsonl")
                 .read_text().splitlines() if l.strip())}
        recov = [{"sid": s, "slug": smap[s]} for s in args.sids.split(",") if s in smap]
        print(f"# recovering {len(recov)} explicit stuck session(s)", file=sys.stderr)
    else:
        recov = probe_recoverable()
        print(f"# {len(recov)} completed-no-PR sessions with a changeset", file=sys.stderr)
    if args.only:
        recov = [r for r in recov if r["slug"] == args.only]
    done = load_done()
    sh("git", "fetch", "mercor", "main")
    tgt_heads = set()
    r = sh("gh", "pr", "list", "--repo", TARGET, "--state", "open", "--limit", "300", "--json", "headRefName")
    try: tgt_heads = {p["headRefName"] for p in json.loads(r.stdout)}
    except Exception: pass

    # worktrees
    for wt, ref in [(MERCOR_WT, "mercor/main")]:
        if not (wt / ".git").exists():
            sh("git", "worktree", "add", "--force", "--detach", str(wt), ref)

    ok = skip = fail = 0
    for rec in (recov[: args.limit] if args.limit else recov):
        sid, slug = rec["sid"], rec["slug"]
        branch = f"recover-{slug}"
        if slug in done or branch in tgt_heads:
            skip += 1; continue
        patch, base = final_patch(sid)
        if not patch or not base:
            print(f"skip {slug}: no patch", file=sys.stderr); skip += 1; continue
        if sh("git", "cat-file", "-e", base).returncode != 0:
            print(f"skip {slug}: base {base[:8]} not in repo", file=sys.stderr); skip += 1; continue
        # base worktree at the patch's base commit — robustly clear any leftover
        sh("git", "worktree", "remove", "--force", str(BASE_WT))
        shutil.rmtree(BASE_WT, ignore_errors=True)
        sh("git", "worktree", "prune")
        if sh("git", "worktree", "add", "--force", "--detach", str(BASE_WT), base).returncode != 0:
            print(f"skip {slug}: base worktree failed", file=sys.stderr); fail += 1; continue
        pf = SB / f"patch-{slug}.diff"; pf.write_text(patch)
        ap_res = sh("git", "apply", "--whitespace=nowarn", str(pf), cwd=BASE_WT)
        if ap_res.returncode != 0:
            ap_res = sh("git", "apply", "--3way", "--whitespace=nowarn", str(pf), cwd=BASE_WT)
        src = BASE_WT / "tasks" / slug / "solution" / "app"
        if not src.is_dir():
            print(f"skip {slug}: no solution/app after apply ({ap_res.stderr[:120]})", file=sys.stderr); fail += 1; continue
        # fresh branch off mercor/main, replace the task's solution/app (minus dist)
        sh("git", "checkout", "-B", branch, "mercor/main", cwd=MERCOR_WT)
        dst = MERCOR_WT / "tasks" / slug / "solution" / "app"
        if dst.exists(): shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("dist", "node_modules", ".git", ".DS_Store"))
        sh("git", "add", f"tasks/{slug}/solution/app", cwd=MERCOR_WT)
        if not sh("git", "diff", "--cached", "--name-only", cwd=MERCOR_WT).stdout.strip():
            print(f"skip {slug}: no diff vs mercor/main", file=sys.stderr); skip += 1; continue
        sh("git", "commit", "-S", "-m",
           f"fix({slug}): recovered oracle fix (Jules completed without opening a PR)", cwd=MERCOR_WT)
        if sh("git", "push", "-f", "mercor", f"{branch}:{branch}", cwd=MERCOR_WT).returncode != 0:
            print(f"FAIL push {slug}", file=sys.stderr); fail += 1; continue
        pr = sh("gh", "pr", "create", "--repo", TARGET, "--head", branch, "--base", "main",
                "--title", f"fix({slug}): recovered oracle fix",
                "--body", f"Recovered from Jules session {sid}, which completed with a changeset but never opened a PR. Oracle fixes for {slug} (dist excluded, re-signed). Cursor Bugbot review requested.")
        url = (pr.stdout or pr.stderr).strip().splitlines()[-1] if (pr.stdout or pr.stderr).strip() else "?"
        with STATE.open("a") as f:
            f.write(json.dumps({"slug": slug, "sid": sid, "url": url}) + "\n")
        print(f"recovered {slug} -> {url}", file=sys.stderr); ok += 1
    print(json.dumps({"recovered": ok, "skipped": skip, "failed": fail}))


if __name__ == "__main__":
    main()
