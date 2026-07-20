#!/usr/bin/env python3
"""Re-dispatch Jules oracle-fix sessions with the strong prompt (reads full
solution/reward-details.json, demands 100%). Scales agents-per-task by failure
size so the worst oracles get multiple independent attempts.

One wave: count live sessions (main + v2 state), fill open slots up to --target
by dispatching tasks that haven't reached their desired agent count, worst-first.
Idempotent via the v2 state file (slug -> how many strong sessions dispatched).

  redispatch_strong.py [--target 60] [--max-new N] [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import jules_fleet_driver as d  # noqa: E402

JOB = ROOT / "jobs" / "trial-codex-sol-xhigh-max-50-concurrent"
MAIN_STATE = JOB / ".jules-fleet-state.jsonl"
V2_STATE = JOB / ".jules-strong-state.jsonl"
J = str(ROOT / ".claude/skills/jules-api/scripts/jules")
TERMINAL = {"COMPLETED", "FAILED"}


def desired_agents(fails: int) -> int:
    if fails >= 250:
        return 3
    if fails >= 120:
        return 2
    return 1


def load_jsonl(p: Path):
    return [json.loads(l) for l in p.read_text().splitlines() if l.strip()] if p.exists() else []


def session_state(sid: str) -> str:
    try:
        r = subprocess.run([sys.executable, J, "--json", "get", sid],
                           capture_output=True, text=True, timeout=25)
        if r.returncode != 0 and "404" in (r.stderr or ""):
            return "COMPLETED"  # deleted/expired session — not holding a slot
        return json.loads(r.stdout).get("state", "IN_PROGRESS")
    except Exception:
        # Transient poll error (429/timeout): do NOT block dispatch on it —
        # Jules' server-side concurrency cap rejects over-dispatch with
        # FAILED_PRECONDITION, which the wave handles by stopping.
        return "COMPLETED"


def subdir_for(slug: str) -> Path | None:
    for c in JOB.glob("frontend-*__*/config.json"):
        try:
            if Path(json.loads(c.read_text())["task"]["path"]).name == slug:
                return c.parent
        except Exception:
            pass
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", type=int, default=60, help="max concurrent live sessions")
    ap.add_argument("--quota", type=int, default=300, help="total session budget to consume")
    ap.add_argument("--cap-per-task", type=int, default=5, help="max strong attempts per task")
    ap.add_argument("--max-new", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    # failure counts per slug (computed from reward-details in the trial dirs)
    failcounts: dict[str, int] = {}
    for c in JOB.glob("frontend-*__*/config.json"):
        rd = c.parent / "verifier/reward-details.json"
        if not rd.is_file():
            continue
        try:
            slug = Path(json.loads(c.read_text())["task"]["path"]).name
            data = json.loads(rd.read_text())
        except Exception:
            continue
        f = sum(1 for b in data.values() if isinstance(b, dict) and "criteria" in b
                for cr in b["criteria"]
                if cr.get("value", 1) == 0 or str(cr.get("reasoning", "")).startswith(("BLOCKED:", "FAIL:")))
        failcounts[slug] = f

    # live sessions across BOTH state files (account-wide cap is shared)
    all_rows = load_jsonl(MAIN_STATE) + load_jsonl(V2_STATE)
    all_ids = [r["session_id"] for r in all_rows if r.get("session_id")]
    states = dict(zip(all_ids, ThreadPoolExecutor(max_workers=16).map(session_state, all_ids)))
    live = sum(1 for s in states.values() if s not in TERMINAL)

    # how many strong (v2) sessions each slug already has
    v2_counts = Counter(r["slug"] for r in load_jsonl(V2_STATE))

    # total sessions used so far (original + strong) — quota is the whole budget
    total_used = len(all_rows)
    # fill open concurrency slots, but never exceed the remaining quota
    slots = max(0, args.target - live)
    if args.max_new is not None:
        slots = min(slots, args.max_new)
    slots = min(slots, max(0, args.quota - total_used))
    print(f"# live={live} target={args.target} total_used={total_used}/{args.quota} "
          f"slots={slots}", file=sys.stderr)

    # Pick per slot: worst-failing, fewest attempts first (score = fails/(attempts+1)),
    # capped per task, so the quota spreads with heavy weight on the worst oracles.
    def pick():
        best, best_score = None, -1.0
        for slug, fails in failcounts.items():
            n = v2_counts.get(slug, 0)
            if n >= args.cap_per_task:
                continue
            score = fails / (n + 1)
            if score > best_score:
                best, best_score = slug, score
        return best

    dispatched = 0
    while dispatched < slots:
        slug = pick()
        if not slug:
            break  # every task at cap
        sub = subdir_for(slug)
        if not sub:
            failcounts.pop(slug, None); continue
        prompt = d.build_prompt(slug, sub)
        fails = failcounts[slug]
        if True:
            if args.dry_run:
                print(f"[dry] would dispatch strong {slug} (fails={fails}, "
                      f"attempt #{v2_counts.get(slug,0)+1})", file=sys.stderr)
                v2_counts[slug] += 1; dispatched += 1; continue
            r = subprocess.run([sys.executable, J, "--json", "create", "--source",
                                "Kurry/frontend-repository", "--prompt", prompt,
                                "--title", f"oracle 100% fix: {slug}"],
                               capture_output=True, text=True, timeout=120)
            try:
                sid = str(json.loads(r.stdout).get("id", "")).split("/")[-1]
            except Exception:
                sid = ""
            if not sid:
                if "PRECONDITION" in r.stderr or "400" in r.stderr:
                    print(f"# hit concurrency cap at {dispatched} dispatched", file=sys.stderr)
                    print(json.dumps({"live_before": live, "dispatched": dispatched, "capped": True}))
                    return
                failcounts.pop(slug, None)  # drop on transient failure; retries next wave
                continue
            with V2_STATE.open("a") as f:
                f.write(json.dumps({"slug": slug, "session_id": sid, "fails": fails, "strong": True}) + "\n")
            v2_counts[slug] += 1
            dispatched += 1
            print(f"strong-dispatch {slug} (fails={fails}, attempt #{v2_counts[slug]}) -> {sid}", file=sys.stderr)

    print(json.dumps({"live_before": live, "dispatched": dispatched,
                      "total_used": total_used + dispatched, "quota": args.quota,
                      "quota_remaining": max(0, args.quota - total_used - dispatched)}))


if __name__ == "__main__":
    main()
