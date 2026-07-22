#!/usr/bin/env python3
"""Validate archive coverage, live-mirror coverage, and exclusion integrity."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from analyze import latest_by_rank, load_jsonl
from mirror_sites import EXCLUDED_EXTENSIONS, excluded_by_signature


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--fingerprints", type=Path, required=True)
    parser.add_argument("--mirror-status", type=Path, required=True)
    parser.add_argument("--mirror-root", type=Path)
    args = parser.parse_args()

    archive = load_jsonl(args.archive)
    fingerprints = latest_by_rank(load_jsonl(args.fingerprints))
    mirror_status = latest_by_rank(load_jsonl(args.mirror_status))
    expected_ranks = set(range(1, len(archive) + 1))
    archive_ranks = {int(row["archive_rank"]) for row in archive}
    fingerprint_ranks = set(fingerprints)
    live_ranks = {rank for rank, row in fingerprints.items() if row.get("reachable_html")}
    mirrored_ranks = set(mirror_status)

    errors: list[str] = []
    if archive_ranks != expected_ranks:
        errors.append("archive ranks are not unique and contiguous")
    if fingerprint_ranks != expected_ranks:
        missing = sorted(expected_ranks - fingerprint_ranks)
        extra = sorted(fingerprint_ranks - expected_ranks)
        errors.append(f"fingerprint coverage mismatch: missing={missing[:10]} extra={extra[:10]}")
    missing_live_mirrors = sorted(live_ranks - mirrored_ranks)
    if missing_live_mirrors:
        errors.append(
            f"{len(missing_live_mirrors)} live sites lack an HTTrack outcome; "
            f"first ranks={missing_live_mirrors[:10]}"
        )

    excluded_files: list[str] = []
    if args.mirror_root:
        for path in args.mirror_root.rglob("*"):
            if path.is_file() and (
                path.suffix.lower().lstrip(".") in EXCLUDED_EXTENSIONS or excluded_by_signature(path)
            ):
                excluded_files.append(path.relative_to(args.mirror_root).as_posix())
                if len(excluded_files) >= 20:
                    break
    if excluded_files:
        errors.append(f"excluded media/font files are present: {excluded_files}")

    summary = {
        "archive_records": len(archive),
        "fingerprint_records": len(fingerprints),
        "live_html_records": len(live_ranks),
        "mirror_status_records": len(mirror_status),
        "live_mirror_status_records": len(live_ranks & mirrored_ranks),
        "excluded_media_or_font_files_found": len(excluded_files),
        "valid": not errors,
        "errors": errors,
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
