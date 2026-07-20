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
        return json.loads(r.stdout).get("state", "IN_PROGRESS")
    except Exception:
        return "IN_PROGRESS"


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
    ap.add_argument("--target", type=int, default=60)
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

    # candidates: slugs still below their desired agent count, worst-first
    cands = []
    for slug, fails in failcounts.items():
        want = desired_agents(fails)
        have = v2_counts.get(slug, 0)
        if have < want:
            cands.append((fails, slug, want - have))
    cands.sort(reverse=True)

    slots = max(0, args.target - live)
    if args.max_new is not None:
        slots = min(slots, args.max_new)
    print(f"# live={live} target={args.target} slots={slots} candidates={len(cands)}", file=sys.stderr)

    dispatched = 0
    for fails, slug, need in cands:
        if dispatched >= slots:
            break
        sub = subdir_for(slug)
        if not sub:
            continue
        prompt = d.build_prompt(slug, sub)
        for _ in range(min(need, slots - dispatched)):
            if args.dry_run:
                print(f"[dry] would dispatch strong {slug} (fails={fails})", file=sys.stderr)
                dispatched += 1
                continue
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
                continue
            with V2_STATE.open("a") as f:
                f.write(json.dumps({"slug": slug, "session_id": sid, "fails": fails, "strong": True}) + "\n")
            dispatched += 1
            print(f"strong-dispatch {slug} (fails={fails}) -> {sid}", file=sys.stderr)

    print(json.dumps({"live_before": live, "dispatched": dispatched,
                      "remaining_candidates": max(0, len(cands) - dispatched)}))


if __name__ == "__main__":
    main()
