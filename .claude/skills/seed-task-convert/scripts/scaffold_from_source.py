#!/usr/bin/env python3
"""Scaffold a new-shape task dir from a same-genre skeleton + a seed source.

Steps:
  1. Copy the skeleton task (canonical judge headers, environment/, tests/ tree,
     solve.sh) into tasks/<slug>, excluding node_modules/dist.
  2. Replace solution/app with the seed source's app/ (the oracle build).
  3. Set task.toml name + a starter description.
  4. Sync the oracle lockfile (npm install --package-lock-only) so `npm ci`
     during oracle-ci will succeed.

Run from the repo root. Rubrics and instruction are handled by later phases.

Usage:
  scaffold_from_source.py --source <seed_dir> --skeleton <existing-slug> --slug <new-slug>
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]  # .../frontend-repository


def rsync(src: Path, dst: Path, excludes: list[str]) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    args = ["rsync", "-a"]
    for e in excludes:
        args += ["--exclude", e]
    args += [f"{src}/", f"{dst}/"]
    subprocess.run(args, check=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="~/Downloads/zto-seed-tasks-2/<browser_slug>")
    ap.add_argument("--skeleton", required=True, help="existing valid task slug to copy")
    ap.add_argument("--slug", required=True, help="frontend-<genre>-<name>")
    ap.add_argument("--org", default="mercor-intelligence")
    args = ap.parse_args()

    source = Path(args.source).expanduser()
    skeleton = REPO / "tasks" / args.skeleton
    dst = REPO / "tasks" / args.slug
    if dst.exists():
        print(f"ERROR: {dst} already exists", file=sys.stderr)
        return 1
    for p, label in [(source, "source"), (skeleton, "skeleton")]:
        if not p.exists():
            print(f"ERROR: {label} not found: {p}", file=sys.stderr)
            return 1

    # 1. skeleton
    rsync(skeleton, dst, ["node_modules", "dist", ".DS_Store"])
    # 2. oracle app
    shutil.rmtree(dst / "solution" / "app", ignore_errors=True)
    rsync(source / "app", dst / "solution" / "app", ["node_modules", ".DS_Store"])
    # 3. task.toml name/description
    tt = dst / "task.toml"
    txt = tt.read_text()
    txt = re.sub(r'name = "[^"]*"', f'name = "{args.org}/{args.slug}"', txt, count=1)
    name = args.slug.split("-", 2)[-1]
    txt = re.sub(r'description = "[^"]*"', f'description = "{name} (seed-converted)"', txt, count=1)
    tt.write_text(txt)
    # 4. sync lockfile
    app = dst / "solution" / "app"
    if (app / "package.json").exists():
        r = subprocess.run(
            ["npm", "install", "--package-lock-only", "--no-audit", "--no-fund"],
            cwd=app, capture_output=True, text=True,
        )
        print("  lockfile sync:", "ok" if r.returncode == 0 else f"WARN\n{r.stderr[-400:]}")

    print(f"\nScaffolded {dst}")
    print("NEXT: convert_rubrics.py, rewrite instruction.md, register + render contract, write webmcp.ts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
