#!/usr/bin/env python3
"""Harvest a finished trial's built app into a task's solution/app oracle.

For each finished trial subdir in a harbor job (has artifacts/app AND
verifier/reward-details.json), resolve the task slug from config.json, and — only
for tasks that currently LACK an oracle (empty/missing solution/app) unless
--force — plant:
  artifacts/app/                -> tasks/<slug>/solution/app/   (minus node_modules/.git)
  verifier/reward-details.json  -> tasks/<slug>/solution/reward-details.json

node_modules and .git are never copied (rebuilt by test.sh; huge/irrelevant).
Prints one JSON line per harvested task so the caller can commit each separately.

Usage:
  harvest_oracle.py [--job <dir>] [--slug <slug> ...] [--force] [--dry-run]
                    [--min-reward X] [--require-anticheat-pass]
Defaults: newest jobs/*/ dir; all finished oracle-less tasks; no score gate.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
EXCLUDE = {"node_modules", ".git", ".DS_Store"}


def newest_job() -> Path:
    jobs = sorted((ROOT / "jobs").glob("*/"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not jobs:
        sys.exit("no jobs/ dirs found")
    return jobs[0]


def has_oracle(slug: str) -> bool:
    app = ROOT / "tasks" / slug / "solution" / "app"
    return app.is_dir() and any(app.iterdir())


def slug_for(subdir: Path) -> str | None:
    cfg = subdir / "config.json"
    if not cfg.is_file():
        return None
    try:
        data = json.loads(cfg.read_text())
    except Exception:
        return None
    path = (data.get("task") or {}).get("path", "")
    return Path(path).name or None


def copytree_clean(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(
        src, dst,
        ignore=shutil.ignore_patterns(*EXCLUDE),
        symlinks=False,
    )


def read_score(subdir: Path) -> dict:
    rj = subdir / "verifier" / "reward.json"
    try:
        d = json.loads(rj.read_text())
        return {"reward": d.get("reward"), "pass": d.get("pass"), "anticheat": d.get("anticheat")}
    except Exception:
        return {}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--job", type=Path, default=None)
    ap.add_argument("--slug", action="append", default=[])
    ap.add_argument("--force", action="store_true", help="overwrite existing oracles")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--min-reward", type=float, default=None)
    ap.add_argument("--require-anticheat-pass", action="store_true")
    args = ap.parse_args()

    job = args.job or newest_job()
    want = set(args.slug)
    harvested = []
    for subdir in sorted(job.glob("frontend-*__*")):
        app = subdir / "artifacts" / "app"
        rd = subdir / "verifier" / "reward-details.json"
        if not app.is_dir() or not rd.is_file():
            continue  # not finished
        slug = slug_for(subdir)
        if not slug:
            continue
        if want and slug not in want:
            continue
        if has_oracle(slug) and not args.force:
            continue
        score = read_score(subdir)
        if args.min_reward is not None and (score.get("reward") or 0) < args.min_reward:
            print(f"SKIP {slug}: reward {score.get('reward')} < {args.min_reward}", file=sys.stderr)
            continue
        if args.require_anticheat_pass and (score.get("anticheat") or 0) < 1.0:
            print(f"SKIP {slug}: anticheat {score.get('anticheat')} < 1.0", file=sys.stderr)
            continue

        sol = ROOT / "tasks" / slug / "solution"
        dst_app = sol / "app"
        dst_rd = sol / "reward-details.json"
        rec = {"slug": slug, "trial": subdir.name, "app": str(dst_app.relative_to(ROOT)),
               "reward_details": str(dst_rd.relative_to(ROOT)), **score}
        if not args.dry_run:
            sol.mkdir(parents=True, exist_ok=True)
            copytree_clean(app, dst_app)
            shutil.copy2(rd, dst_rd)
        harvested.append(rec)
        print(json.dumps(rec))

    print(f"# harvested {len(harvested)} task(s) from {job.name}"
          + (" (dry-run)" if args.dry_run else ""), file=sys.stderr)


if __name__ == "__main__":
    main()
