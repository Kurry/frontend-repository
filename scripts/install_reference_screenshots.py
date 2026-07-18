#!/usr/bin/env python3
"""Install captured reference screenshots into task environments.

Copies reference-screenshots/<slug>/*.png (produced by
capture_reference_screenshots.mjs) into tasks/<slug>/environment/
reference-screenshots/, adds an idempotent Dockerfile COPY so the images land
at /reference-screenshots in the builder container, and inserts an idempotent
<reference_screenshots> note into the task instruction so builders know the
images exist and may be used.

validation.json is deliberately NOT copied (it describes the oracle run).

Usage: python3 scripts/install_reference_screenshots.py [slug ...]
       (no args = every slug with a capture directory)
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPTURES = ROOT / "reference-screenshots"

DOCKERFILE_COPY = "COPY reference-screenshots/ /reference-screenshots/\n"

INSTRUCTION_NOTE = """
<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>
"""


def install(slug: str) -> str:
    cap_dir = CAPTURES / slug
    task_dir = ROOT / "tasks" / slug
    if not cap_dir.is_dir():
        return "no-captures"
    pngs = sorted(cap_dir.glob("*.png"))
    if not pngs:
        return "no-pngs"
    if not task_dir.is_dir():
        return "no-task"

    # 1) images into the environment build context
    dest = task_dir / "environment" / "reference-screenshots"
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
        dockerfile.write_text(text)

    # 3) instruction note (idempotent), inserted right after </summary>
    instruction = task_dir / "instruction.md"
    itext = instruction.read_text()
    if "<reference_screenshots>" not in itext:
        anchor = "</summary>\n"
        if anchor not in itext:
            return "no-summary-anchor"
        itext = itext.replace(anchor, anchor + INSTRUCTION_NOTE, 1)
        instruction.write_text(itext)

    return f"installed:{len(pngs)}"


def main() -> int:
    slugs = sys.argv[1:] or sorted(p.name for p in CAPTURES.iterdir() if p.is_dir())
    failures = 0
    for slug in slugs:
        status = install(slug)
        print(f"{slug}: {status}")
        if not status.startswith("installed"):
            failures += 1
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
