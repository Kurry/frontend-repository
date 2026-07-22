#!/usr/bin/env python3
"""Collect the complete Awwwards Sites of the Day archive.

The listing cards already contain the award timestamp, external URL, studio,
and Awwwards taxonomy.  This collector stops only after pagination is exhausted,
deduplicates by submission slug, and writes a stable newest-first JSONL corpus.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import html
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path


BASE_URL = "https://www.awwwards.com/websites/sites_of_the_day/"
USER_AGENT = (
    "Mozilla/5.0 (compatible; AwwwardsSOTDResearch/1.0; "
    "+https://github.com/Mercor-Intelligence/frontend-repository)"
)
CARD_RE = re.compile(r'<li class="col-3 js-collectable".*?</li>', re.S)
MODEL_RE = re.compile(r'data-collectable-model-value="([^"]+)"')
EXTERNAL_RE = re.compile(r'href="(https?://[^"]+)"\s+target="_blank"')
STUDIO_RE = re.compile(r'<h3 class="avatar-name__title">(.*?)</h3>', re.S)


def fetch_page(page: int, retries: int = 3) -> tuple[int, str]:
    url = BASE_URL if page == 1 else f"{BASE_URL}?page={page}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return page, response.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as error:
            # Awwwards returns 404 after the final pagination page.
            if error.code == 404:
                return page, ""
            if attempt + 1 == retries:
                raise
            time.sleep(1.5 * (attempt + 1))
        except (urllib.error.URLError, TimeoutError):
            if attempt + 1 == retries:
                raise
            time.sleep(1.5 * (attempt + 1))
    raise AssertionError("unreachable")


def parse_page(page: int, source: str) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for position, block in enumerate(CARD_RE.findall(source), start=1):
        model_match = MODEL_RE.search(block)
        if not model_match:
            continue
        model = json.loads(html.unescape(model_match.group(1)))
        external_match = EXTERNAL_RE.search(block)
        studio_match = STUDIO_RE.search(block)
        timestamp = int(model["createdAt"])
        records.append(
            {
                "page": page,
                "position_on_page": position,
                "submission_id": model.get("id"),
                "slug": model["slug"],
                "title": html.unescape(model["title"]),
                "awwwards_url": f"https://www.awwwards.com/sites/{model['slug']}",
                "live_url": html.unescape(external_match.group(1)) if external_match else None,
                "studio": html.unescape(re.sub(r"<[^>]+>", "", studio_match.group(1))).strip()
                if studio_match
                else None,
                "award_timestamp": timestamp,
                "award_date": dt.datetime.fromtimestamp(timestamp, dt.UTC).date().isoformat(),
                "awwwards_tags": [html.unescape(tag) for tag in model.get("tags", [])],
            }
        )
    return records


def collect(max_pages: int, workers: int) -> list[dict[str, object]]:
    # Fetch in bounded waves.  Three consecutive empty pages marks exhaustion.
    all_records: list[dict[str, object]] = []
    empty_streak = 0
    for wave_start in range(1, max_pages + 1, workers):
        pages = list(range(wave_start, min(max_pages + 1, wave_start + workers)))
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
            responses = list(executor.map(fetch_page, pages))
        for page, source in sorted(responses):
            parsed = parse_page(page, source)
            if parsed:
                all_records.extend(parsed)
                empty_streak = 0
            else:
                empty_streak += 1
        if empty_streak >= 3:
            break

    all_records.sort(
        key=lambda record: (
            -int(record["award_timestamp"]),
            int(record["page"]),
            int(record["position_on_page"]),
        )
    )
    deduped: list[dict[str, object]] = []
    seen: set[str] = set()
    for record in all_records:
        slug = str(record["slug"])
        if slug in seen:
            continue
        seen.add(slug)
        record["archive_rank"] = len(deduped) + 1
        deduped.append(record)
    return deduped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--max-pages", type=int, default=260)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    records = collect(args.max_pages, args.workers)
    if not records:
        raise SystemExit("No Awwwards records were collected")

    snapshot = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()
    for record in records:
        record["archive_snapshot_at"] = snapshot

    jsonl_path = args.output_dir / "archive.jsonl"
    jsonl_path.write_text(
        "".join(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n" for record in records),
        encoding="utf-8",
    )
    urls_path = args.output_dir / "live-candidates.txt"
    urls_path.write_text(
        "".join(f"{record['live_url']}\n" for record in records if record.get("live_url")),
        encoding="utf-8",
    )
    manifest = {
        "snapshot_at": snapshot,
        "record_count": len(records),
        "newest_award_date": records[0]["award_date"],
        "oldest_award_date": records[-1]["award_date"],
        "pages_scanned": max(int(record["page"]) for record in records),
        "records_with_live_url": sum(bool(record.get("live_url")) for record in records),
    }
    (args.output_dir / "archive-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
