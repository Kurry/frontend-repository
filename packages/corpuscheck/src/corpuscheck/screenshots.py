#!/usr/bin/env python3
"""Install captured reference screenshots into task environments.

Copies reference-screenshots/<slug>/*.png (produced by
capture_reference_screenshots.mjs) into tasks/<slug>/environment/
reference-screenshots/, adds an idempotent Dockerfile COPY so the images land
at /reference-screenshots in the builder container, and inserts an idempotent
<reference_screenshots> note into the task instruction so builders know the
images exist and may be used.

validation.json is deliberately NOT copied (it describes the oracle run).

Also maintains the <reference_screenshots> inventory sentence: when the
capture includes the responsive overviews (overview-tablet.png /
overview-mobile.png), an existing legacy inventory sentence is extended
in place to mention them (idempotent; custom surrounding prose untouched).

CLI: `corpuscheck screenshots install [--dry-run] [slug ...]`
     (no args = every slug with a capture directory; --dry-run reports
     what would change without writing anything)

Capture itself (`corpuscheck screenshots capture [slug ...]`) shells out to
the node asset assets/capture_reference_screenshots.mjs, which serves each
oracle and writes reference-screenshots/<slug>/ at the repository root.
"""

from __future__ import annotations

import re
import shutil
import subprocess
from pathlib import Path

from .repo import find_repo_root, package_data


def _captures_dir() -> Path:
    return find_repo_root() / "reference-screenshots"

DOCKERFILE_COPY = "COPY reference-screenshots/ /reference-screenshots/\n"

RESPONSIVE_CLAUSE = (
    "overview-tablet.png and overview-mobile.png are full-page responsive\n"
    "reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; "
)

INSTRUCTION_NOTE = """
<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>
"""

# Legacy inventory sentence (with or without backticks, any line wrapping):
# "overview.png is a full-page desktop-layout overview (downscaled); "
# followed directly by the segment-NN clause. The responsive clause is
# spliced between the two.
LEGACY_INVENTORY_RE = re.compile(
    r"(`?overview\.png`? is a full-page desktop-layout\s+"
    r"overview \(downscaled\); )(`?segment-NN\.png`?)"
)


def extend_inventory(itext: str, backticks: bool) -> str:
    """Splice the responsive-overview clause into a legacy inventory sentence."""
    if "overview-tablet.png" in itext:
        return itext  # already extended
    clause = RESPONSIVE_CLAUSE
    if backticks:
        clause = clause.replace("overview-tablet.png", "`overview-tablet.png`") \
                       .replace("overview-mobile.png", "`overview-mobile.png`")
    return LEGACY_INVENTORY_RE.sub(lambda m: m.group(1) + clause + m.group(2), itext, count=1)


def install(slug: str, dry_run: bool = False) -> str:
    cap_dir = _captures_dir() / slug
    task_dir = find_repo_root() / "tasks" / slug
    if not cap_dir.is_dir():
        return "no-captures"
    pngs = sorted(cap_dir.glob("*.png"))
    if not pngs:
        return "no-pngs"
    if not task_dir.is_dir():
        return "no-task"
    has_responsive = any(p.name == "overview-tablet.png" for p in pngs) or any(
        p.name == "overview-mobile.png" for p in pngs)

    # 1) images into the environment build context
    dest = task_dir / "environment" / "reference-screenshots"
    if not dry_run:
        if dest.exists():
            shutil.rmtree(dest)
        dest.mkdir(parents=True)
        for png in pngs:
            shutil.copy2(png, dest / png.name)

    # 2) Dockerfile COPY (idempotent)
    dockerfile = task_dir / "environment" / "Dockerfile"
    text = dockerfile.read_text()
    if DOCKERFILE_COPY.strip() not in text:
        if not text.endswith("\n"):
            text += "\n"
        text += "\n# Reference screenshots for the builder (never shipped in /app)\n"
        text += DOCKERFILE_COPY
        if not dry_run:
            dockerfile.write_text(text)

    # 3) instruction note (idempotent), inserted right after </summary>;
    #    existing notes get their inventory sentence extended in place when
    #    the capture includes the responsive overviews.
    instruction = task_dir / "instruction.md"
    itext = instruction.read_text()
    note = "kept"
    if "<reference_screenshots>" not in itext:
        anchor = "</summary>\n"
        if anchor not in itext:
            return "no-summary-anchor"
        itext = itext.replace(anchor, anchor + INSTRUCTION_NOTE, 1)
        if not dry_run:
            instruction.write_text(itext)
        note = "inserted"
    elif has_responsive:
        backticks = "`overview.png`" in itext
        extended = extend_inventory(itext, backticks)
        if extended != itext:
            if not dry_run:
                instruction.write_text(extended)
            note = "inventory-extended"
        elif "overview-tablet.png" not in itext:
            return "inventory-not-extendable"

    prefix = "would-install" if dry_run else "installed"
    return f"{prefix}:{len(pngs)}:note-{note}"


def install_many(slugs: list[str], dry_run: bool = False) -> int:
    """Install captures for the given slugs (all captured slugs when empty)."""
    captures = _captures_dir()
    if not slugs:
        if not captures.is_dir():
            print(f"no capture directory at {captures}")
            return 1
        slugs = sorted(p.name for p in captures.iterdir() if p.is_dir())
    failures = 0
    for slug in slugs:
        status = install(slug, dry_run=dry_run)
        print(f"{slug}: {status}")
        if not (status.startswith("installed") or status.startswith("would-install")):
            failures += 1
    return 1 if failures else 0


def capture(args: list[str]) -> int:
    """Run the node capture asset against the repository's task oracles.

    ``args`` are passed through to the script (slugs and/or --viewports=...).
    Requires ``node`` on PATH; playwright must be resolvable (see the asset's
    resolution order).
    """
    root = find_repo_root()
    script = package_data("assets", "capture_reference_screenshots.mjs")
    node = shutil.which("node")
    if node is None:
        print(
            "error: `node` was not found on PATH — corpuscheck screenshots capture "
            "runs a Node script (install Node.js >= 20 and retry)"
        )
        return 127
    completed = subprocess.run([node, str(script), *args], cwd=root)
    return completed.returncode
