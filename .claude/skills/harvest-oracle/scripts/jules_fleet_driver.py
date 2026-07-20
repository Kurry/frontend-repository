#!/usr/bin/env python3
"""One idempotent reconcile pass of the harvest → commit → push → Jules fleet.

Holds up to --target Jules sessions in flight. Each pass:
  1. Count our live sessions (state file ids whose Jules state is non-terminal).
  2. For each finished-but-undispatched trial task, fill open slots:
       harvest (if oracle-less) -> git commit per app -> (one push) -> jules create
  3. Append {slug, session_id} to the state JSONL.

Re-run on a timer until the trial ends. Harvest skips existing oracles and the
state file records dispatched slugs, so passes never double-dispatch.

Usage:
  jules_fleet_driver.py --job <dir> [--target 60] [--state <jsonl>]
      [--source Kurry/frontend-repository] [--max-new N] [--no-dispatch]
      [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
JULES = ROOT / ".claude" / "skills" / "jules-api" / "scripts" / "jules"
HARVEST = Path(__file__).resolve().parent / "harvest_oracle.py"
TERMINAL = {"COMPLETED", "FAILED"}


def run(cmd, timeout=None, **kw):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT, timeout=timeout, **kw)
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(cmd, 124, "", "timeout")


def jules(*args, want_json=False, timeout=None):
    # --json is a GLOBAL flag on the wrapper (must precede the subcommand).
    pre = ["--json"] if want_json else []
    return run([sys.executable, str(JULES), *pre, *args], timeout=timeout)


def load_state(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                rows.append(json.loads(line))
            except Exception:
                pass
    return rows


def append_state(path: Path, row: dict) -> None:
    with path.open("a") as f:
        f.write(json.dumps(row) + "\n")


def slug_for(subdir: Path) -> str | None:
    cfg = subdir / "config.json"
    if not cfg.is_file():
        return None
    try:
        d = json.loads(cfg.read_text())
    except Exception:
        return None
    return Path((d.get("task") or {}).get("path", "")).name or None


def has_oracle(slug: str) -> bool:
    app = ROOT / "tasks" / slug / "solution" / "app"
    return app.is_dir() and any(app.iterdir())


def finished_tasks(job: Path) -> list[tuple[str, Path]]:
    """(slug, trial_subdir) for finished tasks, newest-first."""
    out = []
    for sub in sorted(job.glob("frontend-*__*"), key=lambda p: p.stat().st_mtime, reverse=True):
        if (sub / "artifacts" / "app").is_dir() and (sub / "verifier" / "reward-details.json").is_file():
            slug = slug_for(sub)
            if slug:
                out.append((slug, sub))
    return out


def session_state(sid: str) -> str:
    """Fetch one session's state (fast single GET, bounded)."""
    res = jules("get", sid, want_json=True, timeout=30)
    if res.returncode == 0 and res.stdout.strip():
        try:
            return json.loads(res.stdout).get("state", "IN_PROGRESS")
        except Exception:
            pass
    return "IN_PROGRESS"  # unknown ⇒ assume live (don't over-dispatch)


def live_count(state: list[dict], term_cache: set[str]) -> tuple[int, dict]:
    """Poll only OUR sessions (ids in state), skipping cached-terminal ones.
    Threaded so a 60-wide fleet polls in seconds, not minutes."""
    ours = [r["session_id"] for r in state if r.get("session_id")]
    to_poll = [sid for sid in ours if sid not in term_cache]
    states: dict[str, str] = {sid: "COMPLETED" for sid in ours if sid in term_cache}
    if to_poll:
        with ThreadPoolExecutor(max_workers=12) as ex:
            for sid, st in zip(to_poll, ex.map(session_state, to_poll)):
                states[sid] = st
                if st in TERMINAL:
                    term_cache.add(sid)
    live = sum(1 for sid in ours if states.get(sid, "IN_PROGRESS") not in TERMINAL)
    return live, states


def build_prompt(slug: str, sub: Path) -> str:
    rd = json.loads((sub / "verifier" / "reward-details.json").read_text())
    # Per-dimension fail counts — the SCOPE Jules must grasp. The complete list
    # (every id + description + judge reasoning) lives in the committed
    # solution/reward-details.json, which Jules reads directly — the prompt no
    # longer truncates it.
    per_dim: dict[str, tuple[int, int]] = {}
    total_fail = total = 0
    for dim, block in rd.items():
        if not isinstance(block, dict) or "criteria" not in block:
            continue
        f = t = 0
        for c in block["criteria"]:
            t += 1
            if c.get("value", 1) == 0 or str(c.get("reasoning", "")).startswith(("BLOCKED:", "FAIL:")):
                f += 1
        if t:
            per_dim[dim] = (f, t); total_fail += f; total += t
    scope = "\n".join(f"  - {dim}: {f}/{t} failing" for dim, (f, t) in sorted(per_dim.items(), key=lambda x: -x[1][0]) if f)
    return f"""Bring the reference app at `tasks/{slug}/solution/app` to a PASSING build on EVERY graded criterion.
This is the task ORACLE (reference solution) — the target is 100%, not a partial fix.

THE COMPLETE FAILURE LIST IS IN THE REPO. Read `tasks/{slug}/solution/reward-details.json` — it holds every
criterion with its `value` (0 = failing), `description`, and the judge's `reasoning`. You MUST address EVERY
criterion whose value is 0 or whose reasoning begins with `BLOCKED:` or `FAIL:`. Do not fix a sample — work
the whole list. Also read `tasks/{slug}/instruction.md` (the spec) and make the app fully honor it.

Scope of work — {total_fail} of {total} criteria are currently failing, by dimension:
{scope}

Priority order when working the list: (1) core_features, user_flows, behavioral — the app must work
end-to-end with the exact stated evidence and state persistence; (2) anticheat — real handlers, no fake
success; (3) technical, edge_cases, mcp_contract — zero console/network errors, boundary/empty states,
WebMCP tools call the same logic as the UI; (4) accessibility, responsiveness; (5) visual_design, motion,
design_fidelity, writing.

REQUIREMENTS: keep `package.json` scripts `start` (serves on port 3000) and `verify:build` (exits 0 on a
successful build). `npm run verify:build` MUST pass and `npm start` MUST serve. Re-read reward-details.json
as you go and keep fixing until you have genuinely addressed every failing criterion.

SCOPE: edit ONLY files under `tasks/{slug}/solution/app`. Do NOT touch `tests/`, `reward-details.json`,
other tasks, or shared scripts. This session owns a disjoint file surface.

FINISH LINE: a clean commit IS the deliverable. Do NOT `git push` — the sandbox blocks direct pushes by
design and AUTO_CREATE_PR opens the PR from your committed changeset. Work autonomously to completion; do
not pause to ask what to prioritize, and do not loop on push failures.
"""


def reconcile_pass(args, state_path, term_cache) -> dict:
    """One reconcile-to-target pass. Returns a summary dict."""
    job = args.job
    state = load_state(state_path)
    done_slugs = {r["slug"] for r in state}

    live, _ = (0, {}) if args.no_dispatch else live_count(state, term_cache)
    slots = max(0, args.target - live)
    queue = [(s, d) for (s, d) in finished_tasks(job) if s not in done_slugs]
    take = queue[: slots if args.max_new is None else min(slots, args.max_new)]

    print(f"# live={live} target={args.target} slots={slots} "
          f"queued={len(queue)} taking={len(take)} state={state_path.name}", file=sys.stderr)

    if not take:
        return {"live": live, "dispatched": 0, "queued": len(queue)}

    # Phase A: harvest + commit each (separate commit per app).
    committed = []
    for slug, sub in take:
        if not has_oracle(slug):
            hv_cmd = [sys.executable, str(HARVEST), "--job", str(job), "--slug", slug]
            if args.dry_run:
                hv_cmd.append("--dry-run")
            hv = run(hv_cmd)
            sys.stderr.write(hv.stderr)
            if not has_oracle(slug) and not args.dry_run:
                print(f"SKIP {slug}: harvest produced no oracle", file=sys.stderr)
                continue
        if not args.dry_run:
            run(["git", "add", f"tasks/{slug}/solution"])
            score = ""
            rj = sub / "verifier" / "reward.json"
            try:
                d = json.loads(rj.read_text())
                score = f" reward={d.get('reward')} pass={d.get('pass')} anticheat={d.get('anticheat')}"
            except Exception:
                pass
            cm = run(["git", "commit", "-m",
                      f"oracle({slug}): harvest agent build from trial{score}\n\n"
                      f"Seed reference solution/app + reward-details.json from "
                      f"{sub.name}; Jules fixes it against graded criteria.\n\n"
                      f"Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"])
            if cm.returncode != 0 and "nothing to commit" not in (cm.stdout + cm.stderr):
                sys.stderr.write(cm.stdout + cm.stderr)
        committed.append((slug, sub))

    # Phase B: one push so Jules sees every harvested oracle on main.
    if committed and not args.dry_run:
        push = run(["git", "push", "origin", "HEAD:main"])
        if push.returncode != 0:
            sys.stderr.write("PUSH FAILED:\n" + push.stdout + push.stderr)
            return {"error": "push_failed", "dispatched": 0}

    # Phase C: dispatch one Jules session per task.
    if args.no_dispatch or args.dry_run:
        for slug, sub in committed:
            print(f"[dry] would dispatch jules for {slug}", file=sys.stderr)
        return {"live_before": live, "dispatched": 0, "queued_remaining": len(queue)}

    # Dispatch in parallel — each `jules create` is an independent ~10s API call,
    # so serial dispatch is the ramp bottleneck. Thread pool + a lock on the append.
    import threading
    write_lock = threading.Lock()

    def dispatch_one(item):
        slug, sub = item
        prompt = build_prompt(slug, sub)
        res = jules("create", "--source", args.source, "--prompt", prompt,
                    "--title", f"oracle fix: {slug}", want_json=True, timeout=120)
        sid = ""
        if res.returncode == 0 and res.stdout.strip():
            try:
                d = json.loads(res.stdout)
                sid = str(d.get("id") or d.get("name", "")).split("/")[-1]
            except Exception:
                pass
        if not sid:
            sys.stderr.write(f"DISPATCH FAILED {slug}: {res.stdout}{res.stderr}\n")
            return 0
        with write_lock:
            append_state(state_path, {"slug": slug, "session_id": sid, "trial": sub.name})
        print(f"dispatched {slug} -> session {sid}", file=sys.stderr)
        return 1

    dispatched = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for got in ex.map(dispatch_one, committed):
            dispatched += got

    return {"live_before": live, "dispatched": dispatched, "queued_remaining": len(queue) - dispatched}


def main() -> None:
    import time
    ap = argparse.ArgumentParser()
    ap.add_argument("--job", type=Path, required=True)
    ap.add_argument("--target", type=int, default=60)
    ap.add_argument("--state", type=Path, default=None)
    ap.add_argument("--source", default="Kurry/frontend-repository")
    ap.add_argument("--max-new", type=int, default=None)
    ap.add_argument("--no-dispatch", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--once", action="store_true", help="single pass then exit")
    ap.add_argument("--interval", type=int, default=150, help="seconds between passes")
    ap.add_argument("--idle-passes", type=int, default=4,
                    help="stop after this many consecutive passes with empty queue")
    args = ap.parse_args()

    state_path = args.state or (args.job / ".jules-fleet-state.jsonl")
    term_cache: set[str] = set()
    idle = 0
    while True:
        summ = reconcile_pass(args, state_path, term_cache)
        print(json.dumps(summ), flush=True)
        if args.once:
            break
        # Stop when the queue has stayed empty across several passes (trial done,
        # nothing left to dispatch). Live sessions may still be finishing in the cloud.
        if summ.get("queued", summ.get("queued_remaining", 1)) == 0:
            idle += 1
            if idle >= args.idle_passes:
                print("# queue empty across idle passes — fleet fully dispatched; exiting",
                      file=sys.stderr)
                break
        else:
            idle = 0
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
