#!/usr/bin/env python3
"""Mirror each Awwwards live-site candidate with HTTrack.

Mirrors are intentionally kept outside Git.  The runner records one status row
per archive entry and excludes raster images, video, audio, and fonts while
retaining SVG, code, text, manifests, shaders, WASM, Rive, and lightweight 3D
assets.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path
from urllib.parse import urlparse


EXCLUDED_EXTENSIONS = [
    # Raster photos and image delivery formats. SVG remains in scope as a
    # code-like vector/interface asset rather than being scrubbed as a photo.
    "jpg", "jpeg", "png", "gif", "webp", "avif", "ico", "bmp", "tif", "tiff", "heic", "heif",
    # Video and audio.
    "mp4", "webm", "mov", "m4v", "avi", "mkv", "ogv", "mp3", "wav", "ogg", "m4a", "aac", "flac",
    # Fonts.
    "woff", "woff2", "ttf", "otf", "eot",
]

EXCLUDED_MIME_FILTERS = [
    "-mime:image/*",
    "+mime:image/svg+xml",
    "-mime:video/*",
    "-mime:audio/*",
    "-mime:font/*",
    "-mime:application/font-*",
    "-mime:application/x-font-*",
    "-mime:application/vnd.ms-fontobject",
]


def safe_slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-.")
    return normalized[:90] or hashlib.sha256(value.encode()).hexdigest()[:16]


def excluded_by_signature(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            head = handle.read(64)
    except OSError:
        return False
    return any(
        (
            head.startswith(b"\xff\xd8\xff"),
            head.startswith(b"\x89PNG\r\n\x1a\n"),
            head.startswith((b"GIF87a", b"GIF89a")),
            head.startswith(b"BM"),
            head.startswith((b"II*\x00", b"MM\x00*")),
            head.startswith(b"\x00\x00\x01\x00"),
            head.startswith(b"OggS"),
            head.startswith(b"fLaC"),
            head.startswith(b"ID3"),
            head.startswith(b"\x1aE\xdf\xa3"),
            head.startswith((b"wOFF", b"wOF2", b"OTTO", b"ttcf", b"\x00\x01\x00\x00")),
            len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] in {b"WEBP", b"WAVE", b"AVI "},
            len(head) >= 12 and head[4:8] == b"ftyp",
        )
    )


def sanitize_directory(destination: Path) -> tuple[int, int]:
    removed_files = 0
    removed_bytes = 0
    cache = destination / "hts-cache"
    if cache.exists():
        cache_files = [path for path in cache.rglob("*") if path.is_file()]
        removed_files += len(cache_files)
        removed_bytes += sum(path.stat().st_size for path in cache_files)
        shutil.rmtree(cache)
    for path in [item for item in destination.rglob("*") if item.is_file()]:
        extension = path.suffix.lower().lstrip(".")
        if extension in EXCLUDED_EXTENSIONS or excluded_by_signature(path):
            removed_files += 1
            removed_bytes += path.stat().st_size
            path.unlink()
    return removed_files, removed_bytes


def update_file_evidence(result: dict[str, object], destination: Path) -> None:
    files = [path for path in destination.rglob("*") if path.is_file()]
    result["file_count"] = len(files)
    result["bytes"] = sum(path.stat().st_size for path in files)
    html_files = [
        path
        for path in files
        if path.suffix.lower() in {".html", ".htm"} and path.stat().st_size > 0
    ]
    result["visitable_html"] = bool(html_files)
    if not html_files and result["status"] == "mirrored":
        result["status"] = "no_html"


def mirror_one(record: dict[str, object], mirror_root: Path, timeout: int) -> dict[str, object]:
    started = time.monotonic()
    url = str(record.get("live_url") or "")
    slug = safe_slug(str(record["slug"]))
    destination = mirror_root / f"{int(record['archive_rank']):04d}-{slug}"
    result: dict[str, object] = {
        "archive_rank": record["archive_rank"],
        "slug": record["slug"],
        "source_url": url,
        "mirror_path": destination.name,
        "status": "pending",
        "exit_code": None,
        "duration_seconds": None,
        "file_count": 0,
        "bytes": 0,
    }
    if not url:
        result["status"] = "missing_url"
        return result

    destination.mkdir(parents=True, exist_ok=True)
    filters = [f"-*.{ext}" for ext in EXCLUDED_EXTENSIONS]
    command = [
        "httrack",
        url,
        "-O",
        str(destination),
        "-r1",          # landing document and its first-level dependencies
        "-%e1",        # directly linked external assets, not external page recursion
        "-n",           # non-HTML dependencies near the landing page
        "-s2",          # always follow robots.txt and meta robots
        "-m5000000,2000000",  # 5 MB non-HTML, 2 MB HTML per file
        "-M25000000",   # 25 MB maximum mirror size per site
        "-A250000",     # 250 KB/s maximum transfer rate per process
        "-%c2",         # at most two connections per second
        "-c2",          # at most two sockets per site
        "-T12",         # link timeout
        "-R0",          # no retry storm
        "-E120",        # HTTrack's own wall-time ceiling
        "-I0",          # no generated index
        "-o0",          # do not create local HTML error pages
        "-Q",           # quiet console; logs remain in the mirror
        "-%N2",         # always delay type acceptance until response MIME is known
        "-F",
        "Mozilla/5.0 (compatible; AwwwardsSOTDResearch/1.0; +https://github.com/Mercor-Intelligence/frontend-repository)",
        *filters,
        *EXCLUDED_MIME_FILTERS,
    ]
    try:
        completed = subprocess.run(
            command,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
            check=False,
        )
        result["exit_code"] = completed.returncode
        result["status"] = "mirrored" if completed.returncode == 0 else "httrack_error"
        if completed.stderr and completed.returncode != 0:
            result["error"] = completed.stderr[-1000:]
    except subprocess.TimeoutExpired:
        result["status"] = "timeout"

    removed_files, removed_bytes = sanitize_directory(destination)
    result["sanitized_removed_files"] = removed_files
    result["sanitized_removed_bytes"] = removed_bytes
    update_file_evidence(result, destination)
    result["duration_seconds"] = round(time.monotonic() - started, 3)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--mirror-root", type=Path, required=True)
    parser.add_argument("--status-jsonl", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=150)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--fingerprints", type=Path)
    parser.add_argument("--only-live", action="store_true")
    parser.add_argument("--sanitize-only", action="store_true")
    args = parser.parse_args()

    if shutil.which("httrack") is None:
        raise SystemExit("httrack is required")
    args.mirror_root.mkdir(parents=True, exist_ok=True)
    args.status_jsonl.parent.mkdir(parents=True, exist_ok=True)
    records = [json.loads(line) for line in args.archive.read_text(encoding="utf-8").splitlines() if line]
    if args.only_live:
        if not args.fingerprints or not args.fingerprints.exists():
            raise SystemExit("--only-live requires an existing --fingerprints JSONL")
        live_by_rank: dict[int, bool] = {}
        for line in args.fingerprints.read_text(encoding="utf-8").splitlines():
            if line:
                fingerprint = json.loads(line)
                live_by_rank[int(fingerprint["archive_rank"])] = bool(fingerprint.get("reachable_html"))
        records = [record for record in records if live_by_rank.get(int(record["archive_rank"]), False)]
    if args.limit:
        records = records[: args.limit]

    completed_by_rank: dict[int, dict[str, object]] = {}
    if args.status_jsonl.exists():
        for line in args.status_jsonl.read_text(encoding="utf-8").splitlines():
            if line:
                existing = json.loads(line)
                completed_by_rank[int(existing["archive_rank"])] = existing
    if args.sanitize_only:
        total_removed_files = 0
        total_removed_bytes = 0
        for destination in sorted(path for path in args.mirror_root.iterdir() if path.is_dir()):
            removed_files, removed_bytes = sanitize_directory(destination)
            total_removed_files += removed_files
            total_removed_bytes += removed_bytes
        for result in completed_by_rank.values():
            destination = args.mirror_root / str(result["mirror_path"])
            if destination.exists():
                update_file_evidence(result, destination)
            if result.get("exit_code") == 0:
                result.pop("error", None)
        temporary = args.status_jsonl.with_suffix(args.status_jsonl.suffix + ".tmp")
        temporary.write_text(
            "".join(
                json.dumps(completed_by_rank[rank], ensure_ascii=False, sort_keys=True) + "\n"
                for rank in sorted(completed_by_rank)
            ),
            encoding="utf-8",
        )
        temporary.replace(args.status_jsonl)
        print(json.dumps({
            "status_records": len(completed_by_rank),
            "removed_files": total_removed_files,
            "removed_bytes": total_removed_bytes,
        }, indent=2, sort_keys=True))
        return 0
    pending = [record for record in records if int(record["archive_rank"]) not in completed_by_rank]
    in_scope_ranks = {int(record["archive_rank"]) for record in records}
    processed = len(in_scope_ranks & set(completed_by_rank))

    with args.status_jsonl.open("a", encoding="utf-8") as status_file:
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {
                executor.submit(mirror_one, record, args.mirror_root, args.timeout): record
                for record in pending
            }
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                processed += 1
                status_file.write(json.dumps(result, ensure_ascii=False, sort_keys=True) + "\n")
                status_file.flush()
                print(
                    f"[{processed}/{len(records)}] rank={result['archive_rank']} {result['slug']}: "
                    f"{result['status']} ({result['file_count']} files, {result['bytes']} bytes)",
                    flush=True,
                )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
