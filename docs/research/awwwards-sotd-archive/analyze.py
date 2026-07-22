#!/usr/bin/env python3
"""Build reviewable tables and a report from the archive and live fingerprints."""

from __future__ import annotations

import argparse
import collections
import csv
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse


TECH_TAGS = {
    "11ty", "adobe after effects", "adobe illustrator", "adobe photoshop", "after effects",
    "adobe xd", "angular", "anime.js", "astro", "aws", "backbone.js", "barba.js", "blender",
    "bootstrap", "cables", "canvas api", "cinema 4d", "cloudflare", "contentful", "craft cms",
    "createjs", "css", "css framework", "curtains.js", "d3", "datocms", "debian", "demandware",
    "directus", "docker", "drupal", "editor x", "elementor", "express", "facebook api", "fastclick",
    "figma", "firebase", "flickity", "font awesome", "framer", "gatsby", "glsl", "google app engine",
    "google font api", "graphql", "gsap", "hammer.js", "handlebars", "highway.js", "html5", "hugo",
    "iis", "ink", "javascript", "jquery", "jquery mobile", "jquery ui", "knockout", "laravel",
    "lo-dash", "locomotive scroll", "lodash", "lottie", "magento", "matter.js", "mediaelement.js",
    "modernizr", "neos cms", "netlify", "next.js", "nginx", "node.js", "nuxt.js", "optimizely",
    "owl carousel", "p5.js", "php", "pixijs", "prestashop", "prismic", "pwa", "python", "raphael.js",
    "react", "readymag", "redux", "requirejs", "reveal.js", "ruby", "sanity", "sass", "seo", "shopify",
    "sketch", "skrollr.js", "snap.svg", "socket.io", "soundmanager", "spin.js", "svelte", "svg",
    "swiper.js", "tailwind", "three.js", "tilda", "timber", "tween.js", "twitter api", "typekit",
    "typescript", "underscore.js", "unity", "unreal engine", "vanilla js", "varnish", "velocity.js",
    "vercel", "videojs", "vite", "vr", "vue.js", "web fonts", "webflow", "webgl", "webpack", "webrtc",
    "websockets", "webvr", "woocommerce", "wordpress", "yepnope", "youtube api", "zepto",
}

INTERACTION_TAGS = {
    "360", "3d", "404 pages", "about page", "animation", "app style", "contact page",
    "data visualization", "filters and effects", "footer design", "forms and input", "fullscreen",
    "gallery", "gestures / interaction", "header design", "horizontal layout", "infinite scroll",
    "interaction design", "menu - horizontal", "menu - vertical", "microinteractions", "motion",
    "navigation menu", "parallax", "project page", "responsive", "responsive design", "scrolling",
    "single page", "social integration", "sound-audio", "storytelling", "transitions",
    "unusual navigation", "video",
}

VISUAL_TAGS = {
    "art & illustration", "big background images", "clean", "colorful", "copy design", "experimental",
    "flat design", "graphic design", "illustration", "icons", "minimal", "photographic", "photography",
    "retro", "typography", "ui design", "vector", "black", "blue", "bright", "brown", "flexible",
    "green", "orange", "pink", "red", "silver", "texture", "trend", "white", "yellow",
    "content architecture",
}

EXCLUDED_MIRROR_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "ico", "bmp", "tif", "tiff", "heic", "heif",
    "mp4", "webm", "mov", "m4v", "avi", "mkv", "ogv", "mp3", "wav", "ogg", "m4a", "aac", "flac",
    "woff", "woff2", "ttf", "otf", "eot",
}

KNOWN_ASSET_EXTENSIONS = EXCLUDED_MIRROR_EXTENSIONS | {
    "html", "htm", "css", "js", "mjs", "cjs", "json", "xml", "txt", "csv", "map",
    "webmanifest", "wasm", "glsl", "vert", "frag", "wgsl", "glb", "gltf", "ktx2", "basis",
    "hdr", "exr", "riv", "bin", "drc", "m3u8", "pdf", "zip",
}

TAG_LABEL_ALIASES = {
    "cloudflare": "Cloudflare",
    "javascript": "JavaScript",
    "lo-dash": "Lodash",
    "lodash": "Lodash",
    "next.js": "Next.js",
    "typescript": "TypeScript",
    "wordpress": "WordPress",
}


def load_jsonl(path: Path) -> list[dict]:
    # JSON permits U+2028/U+2029 inside strings; split only on physical JSONL
    # record separators so titles containing those characters remain parseable.
    return [json.loads(line) for line in path.read_text(encoding="utf-8").split("\n") if line]


def latest_by_rank(rows: list[dict]) -> dict[int, dict]:
    return {int(row["archive_rank"]): row for row in rows}


def normalize_technology(name: str) -> str:
    # Wappalyzer appends versions as Name:1.2.3. Preserve colons in product
    # names unless the final segment starts with a digit.
    head, separator, tail = name.rpartition(":")
    if separator and re.match(r"^v?\d", tail):
        return head
    return name


def filtered_asset_formats(row: dict) -> dict[str, int]:
    return {
        extension: int(count)
        for extension, count in row.get("referenced_asset_formats", {}).items()
        if extension.lower() in KNOWN_ASSET_EXTENSIONS
    }


def changed_redirect_host(requested_url: str, final_url: str) -> bool:
    requested = (urlparse(requested_url).hostname or "").lower().removeprefix("www.")
    final = (urlparse(final_url).hostname or "").lower().removeprefix("www.")
    return bool(requested and final and requested != final)


def tag_groups(tags: list[str]) -> tuple[list[str], list[str], list[str], list[str]]:
    technologies, interactions, visuals, industries = [], [], [], []
    for tag in tags:
        normalized = tag.strip().lower()
        label = TAG_LABEL_ALIASES.get(normalized, tag)
        if normalized in TECH_TAGS:
            technologies.append(label)
        elif normalized in INTERACTION_TAGS:
            interactions.append(label)
        elif normalized in VISUAL_TAGS:
            visuals.append(label)
        else:
            industries.append(label)
    return technologies, interactions, visuals, industries


def write_counter(
    path: Path,
    field: str,
    counter: collections.Counter,
    denominator: int,
    denominator_label: str = "live_sites",
) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow([field, "site_count", f"percent_of_{denominator_label}"])
        for value, count in counter.most_common():
            writer.writerow([value, count, round(100 * count / denominator, 3) if denominator else 0])


def asset_category(extension: str) -> str:
    if extension in {"glb", "gltf"}:
        return "3d_model"
    if extension in {"ktx2", "basis"}:
        return "gpu_texture"
    if extension in {"hdr", "exr"}:
        return "environment_map"
    if extension == "riv":
        return "rive_animation"
    if extension in {"wasm", "js", "mjs"}:
        return "runtime"
    if extension in {"woff", "woff2", "ttf", "otf", "eot"}:
        return "font"
    if extension in {"jpg", "jpeg", "png", "gif", "webp", "avif", "svg"}:
        return "image"
    if extension in {"mp4", "webm", "mov", "m4v"}:
        return "video"
    if extension in {"mp3", "wav", "ogg", "m4a", "aac", "flac"}:
        return "audio"
    return "other"


def inventory_asset_reference(root: Path | None) -> dict:
    if root is None or not root.exists():
        return {"source_label": "landonorris-design-assets", "available": False, "files": []}
    files = []
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        relative = path.relative_to(root).as_posix()
        extension = path.suffix.lower().lstrip(".") or "[none]"
        files.append(
            {
                "path": relative,
                "extension": extension,
                "category": asset_category(extension),
                "bytes": path.stat().st_size,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "excluded_from_mirror": extension in EXCLUDED_MIRROR_EXTENSIONS,
            }
        )
    return {
        "source_label": "landonorris-design-assets",
        "available": True,
        "file_count": len(files),
        "total_bytes": sum(item["bytes"] for item in files),
        "files": files,
    }


def markdown_table(
    rows: list[tuple[str, int]],
    denominator: int,
    limit: int = 20,
    share_label: str = "Share of live sites",
) -> str:
    lines = [f"| Item | Sites | {share_label} |", "|---|---:|---:|"]
    for name, count in rows[:limit]:
        share = 100 * count / denominator if denominator else 0
        lines.append(f"| {name.replace('|', '\\|')} | {count:,} | {share:.1f}% |")
    return "\n".join(lines)


def write_site_status(path: Path, archive: list[dict], fingerprints: dict[int, dict], mirrors: dict[int, dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow([
            "archive_rank", "slug", "title", "award_date", "awwwards_url", "requested_url",
            "visit_status", "http_status", "final_url", "redirect_host_changed", "mirror_status", "mirror_has_html",
            "mirror_file_count", "mirror_bytes",
        ])
        for record in archive:
            rank = int(record["archive_rank"])
            fingerprint = fingerprints.get(rank, {})
            mirror = mirrors.get(rank, {})
            default_mirror_status = "pending_live" if fingerprint.get("reachable_html") else "not_in_live_scope"
            writer.writerow([
                rank, record["slug"], record["title"], record["award_date"], record["awwwards_url"],
                record.get("live_url", ""), fingerprint.get("visit_status", "not_fingerprinted"),
                fingerprint.get("http_status", ""), fingerprint.get("final_url", ""),
                changed_redirect_host(
                    str(fingerprint.get("requested_url", "")), str(fingerprint.get("final_url", ""))
                ),
                mirror.get("status", default_mirror_status), mirror.get("visitable_html", False),
                mirror.get("file_count", 0), mirror.get("bytes", 0),
            ])


def write_compact_fingerprints(path: Path, fingerprints: dict[int, dict]) -> None:
    fields = (
        "archive_rank", "slug", "title", "award_date", "awwwards_url", "requested_url", "final_url",
        "visit_status", "reachable_html", "http_status", "content_type", "bytes_inspected",
        "page_title", "response_headers", "feature_signals", "referenced_asset_formats",
        "awwwards_tags",
    )
    with path.open("w", encoding="utf-8") as handle:
        for rank in sorted(fingerprints):
            source = fingerprints[rank]
            compact = {field: source[field] for field in fields if field in source}
            compact["technologies"] = [
                {
                    "name": normalize_technology(item["name"]),
                    "categories": sorted(set(item.get("categories", []))),
                }
                for item in source.get("technologies", [])
            ]
            compact["referenced_asset_formats"] = filtered_asset_formats(source)
            compact["redirect_host_changed"] = changed_redirect_host(
                str(source.get("requested_url", "")), str(source.get("final_url", ""))
            )
            handle.write(json.dumps(compact, ensure_ascii=False, sort_keys=True) + "\n")


def percent_phrase(counter: collections.Counter, denominator: int, count: int = 5) -> str:
    if not denominator:
        return "No live-site observations were available."
    return ", ".join(
        f"{name} ({sites:,}; {100 * sites / denominator:.1f}%)"
        for name, sites in counter.most_common(count)
    )


def yearly_survivorship_table(
    yearly_archive: collections.Counter[str], yearly_live: collections.Counter[str]
) -> str:
    lines = ["| Award year | Archive sites | Live HTML | Survival |", "|---:|---:|---:|---:|"]
    for year in sorted(yearly_archive, reverse=True):
        archived = yearly_archive[year]
        live = yearly_live[year]
        lines.append(f"| {year} | {archived:,} | {live:,} | {100 * live / archived:.1f}% |")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--fingerprints", type=Path, required=True)
    parser.add_argument("--mirror-status", type=Path)
    parser.add_argument("--asset-root", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    archive = load_jsonl(args.archive)
    fingerprints = latest_by_rank(load_jsonl(args.fingerprints))
    mirror_status = latest_by_rank(load_jsonl(args.mirror_status)) if args.mirror_status and args.mirror_status.exists() else {}
    live = [row for row in fingerprints.values() if row.get("reachable_html")]
    live.sort(key=lambda row: int(row["archive_rank"]))
    denominator = len(live)

    status_counts = collections.Counter(row.get("visit_status", "not_fingerprinted") for row in fingerprints.values())
    if len(fingerprints) < len(archive):
        status_counts["not_fingerprinted"] += len(archive) - len(fingerprints)
    tech_counts: collections.Counter[str] = collections.Counter()
    tech_category_counts: collections.Counter[str] = collections.Counter()
    awwwards_tech_counts: collections.Counter[str] = collections.Counter()
    interaction_counts: collections.Counter[str] = collections.Counter()
    visual_counts: collections.Counter[str] = collections.Counter()
    industry_counts: collections.Counter[str] = collections.Counter()
    asset_format_counts: collections.Counter[str] = collections.Counter()
    asset_reference_counts: collections.Counter[str] = collections.Counter()
    signal_counts: collections.Counter[str] = collections.Counter()
    technology_pairs: collections.Counter[tuple[str, str]] = collections.Counter()
    feature_bundles: collections.Counter[str] = collections.Counter()
    yearly_archive: collections.Counter[str] = collections.Counter(row["award_date"][:4] for row in archive)
    yearly_live: collections.Counter[str] = collections.Counter()
    yearly_technologies: dict[str, collections.Counter[str]] = collections.defaultdict(collections.Counter)

    with (args.output_dir / "live-sites.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow([
            "archive_rank", "title", "award_date", "awwwards_url", "requested_url", "final_url", "studio",
            "redirect_host_changed", "http_status", "technologies", "technology_categories", "awwwards_technology_tags",
            "interaction_features", "visual_styles", "industry_tags", "referenced_asset_formats",
            "canvas", "webgl", "three_d", "video", "audio", "rive", "lottie", "css_animation",
            "smooth_scroll", "service_worker", "webassembly", "model_3d_asset", "mirror_status",
        ])
        for row in live:
            technologies = sorted({normalize_technology(item["name"]) for item in row.get("technologies", [])})
            categories = sorted({category for item in row.get("technologies", []) for category in item.get("categories", [])})
            aww_tech, interactions, visuals, industries = tag_groups(row.get("awwwards_tags", []))
            award_year = row["award_date"][:4]
            yearly_live[award_year] += 1
            for technology in technologies:
                tech_counts[technology] += 1
                yearly_technologies[award_year][technology] += 1
            for index, first in enumerate(technologies):
                for second in technologies[index + 1:]:
                    technology_pairs[(first, second)] += 1
            for category in categories:
                tech_category_counts[category] += 1
            awwwards_tech_counts.update(set(aww_tech))
            interaction_counts.update(set(interactions))
            visual_counts.update(set(visuals))
            industry_counts.update(set(industries))
            referenced_formats = filtered_asset_formats(row)
            asset_format_counts.update(referenced_formats.keys())
            asset_reference_counts.update(referenced_formats)
            for signal, present in row.get("feature_signals", {}).items():
                if present:
                    signal_counts[signal] += 1
            signals = row.get("feature_signals", {})
            if signals.get("webgl") or signals.get("model_3d_asset") or "3D" in aww_tech + interactions:
                feature_bundles["immersive_3d"] += 1
            if "Scrolling" in interactions and "Storytelling" in interactions:
                feature_bundles["scroll_storytelling"] += 1
            if "Animation" in interactions and "Transitions" in interactions:
                feature_bundles["animation_plus_transitions"] += 1
            if "Microinteractions" in interactions and "Interaction Design" in interactions:
                feature_bundles["microinteraction_system"] += 1
            if signals.get("canvas") and signals.get("webgl"):
                feature_bundles["canvas_plus_webgl"] += 1
            if signals.get("video") and signals.get("audio"):
                feature_bundles["video_plus_audio"] += 1
            mirror = mirror_status.get(int(row["archive_rank"]), {})
            writer.writerow([
                row["archive_rank"], row["title"], row["award_date"], row["awwwards_url"], row["requested_url"],
                row.get("final_url", ""), row.get("studio", ""),
                changed_redirect_host(str(row.get("requested_url", "")), str(row.get("final_url", ""))),
                row.get("http_status", ""),
                " | ".join(technologies), " | ".join(categories), " | ".join(sorted(aww_tech)),
                " | ".join(sorted(interactions)), " | ".join(sorted(visuals)), " | ".join(sorted(industries)),
                " | ".join(f"{key}:{value}" for key, value in sorted(referenced_formats.items())),
                *[row.get("feature_signals", {}).get(key, False) for key in (
                    "canvas", "webgl", "three_d", "video", "audio", "rive", "lottie", "css_animation",
                    "smooth_scroll", "service_worker", "webassembly", "model_3d_asset",
                )],
                mirror.get("status", "pending_live"),
            ])

    write_site_status(args.output_dir / "site-status.csv", archive, fingerprints, mirror_status)
    write_compact_fingerprints(args.output_dir / "site-fingerprints.jsonl", fingerprints)

    with (args.output_dir / "yearly-survivorship.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["award_year", "archive_sites", "live_html_sites", "live_html_percent"])
        for year in sorted(yearly_archive, reverse=True):
            writer.writerow([
                year,
                yearly_archive[year],
                yearly_live[year],
                round(100 * yearly_live[year] / yearly_archive[year], 3),
            ])

    with (args.output_dir / "technology-by-award-year.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["award_year", "technology", "site_count", "percent_of_live_sites_in_year"])
        for year in sorted(yearly_live, reverse=True):
            for technology, count in yearly_technologies[year].most_common():
                writer.writerow([year, technology, count, round(100 * count / yearly_live[year], 3)])

    with (args.output_dir / "technology-cooccurrence.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["technology_a", "technology_b", "site_count", "percent_of_live_sites"])
        for (first, second), count in technology_pairs.most_common():
            writer.writerow([first, second, count, round(100 * count / denominator, 3) if denominator else 0])

    write_counter(args.output_dir / "technology-frequency.csv", "technology", tech_counts, denominator)
    write_counter(args.output_dir / "technology-category-frequency.csv", "category", tech_category_counts, denominator)
    write_counter(args.output_dir / "awwwards-technology-tag-frequency.csv", "technology_tag", awwwards_tech_counts, denominator)
    write_counter(args.output_dir / "interaction-frequency.csv", "interaction", interaction_counts, denominator)
    write_counter(args.output_dir / "visual-style-frequency.csv", "visual_style", visual_counts, denominator)
    write_counter(args.output_dir / "industry-frequency.csv", "industry", industry_counts, denominator)
    write_counter(args.output_dir / "feature-signal-frequency.csv", "signal", signal_counts, denominator)
    write_counter(args.output_dir / "feature-bundle-frequency.csv", "feature_bundle", feature_bundles, denominator)
    with (args.output_dir / "referenced-asset-format-frequency.csv").open(
        "w", encoding="utf-8", newline=""
    ) as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["extension", "site_count", "percent_of_live_sites", "reference_count"])
        for extension, count in asset_format_counts.most_common():
            writer.writerow([
                extension,
                count,
                round(100 * count / denominator, 3) if denominator else 0,
                asset_reference_counts[extension],
            ])
    write_counter(
        args.output_dir / "visit-status-frequency.csv",
        "status",
        status_counts,
        len(archive),
        "archive_sites",
    )
    mirrored_ranks = set(mirror_status)
    live_ranks = {int(row["archive_rank"]) for row in live}
    all_ranks = {int(row["archive_rank"]) for row in archive}
    live_mirror_status = {
        rank: row for rank, row in mirror_status.items() if rank in live_ranks
    }
    mirror_counts = collections.Counter(
        row.get("status", "unknown") for row in live_mirror_status.values()
    )
    pending_live = len(live_ranks - mirrored_ranks)
    not_in_live_scope = len(all_ranks - live_ranks)
    if pending_live:
        mirror_counts["pending_live"] += pending_live
    if not_in_live_scope:
        mirror_counts["not_in_live_scope"] += not_in_live_scope
    write_counter(
        args.output_dir / "mirror-status-frequency.csv",
        "status",
        mirror_counts,
        len(archive),
        "archive_sites",
    )

    asset_reference = inventory_asset_reference(args.asset_root)
    (args.output_dir / "landonorris-asset-reference.json").write_text(
        json.dumps(asset_reference, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    changed_host_count = sum(
        changed_redirect_host(str(row.get("requested_url", "")), str(row.get("final_url", "")))
        for row in live
    )
    manifest = {
        "generated_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat(),
        "archive_records": len(archive),
        "fingerprinted_records": len(fingerprints),
        "live_html_records": len(live),
        "mirror_status_records": len(mirror_status),
        "mirror_out_of_scope_pilot_records": len(mirrored_ranks - live_ranks),
        "mirror_html_records": sum(
            bool(row.get("visitable_html")) for row in live_mirror_status.values()
        ),
        "mirror_live_scope_records": len(live_ranks & mirrored_ranks),
        "mirror_live_scope_complete": live_ranks <= mirrored_ranks,
        "unique_detected_technologies": len(tech_counts),
        "unique_detected_technology_categories": len(tech_category_counts),
        "unique_awwwards_technology_tags": len(awwwards_tech_counts),
        "unique_technology_pairs": len(technology_pairs),
        "live_redirect_host_changed_records": changed_host_count,
        "newest_award_date": archive[0]["award_date"],
        "oldest_award_date": archive[-1]["award_date"],
        "awwwards_displayed_count_at_collection": 6410,
        "pagination_record_count": len(archive),
        "display_pagination_difference": 6410 - len(archive),
    }
    (args.output_dir / "study-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    newest_year = max(yearly_archive)
    lowest_survival_year = min(yearly_archive, key=lambda year: yearly_live[year] / yearly_archive[year])
    newest_survival = 100 * yearly_live[newest_year] / yearly_archive[newest_year]
    lowest_survival = 100 * yearly_live[lowest_survival_year] / yearly_archive[lowest_survival_year]
    report = f"""# Technology and interaction study of the Awwwards SOTD archive

## Outcome

This snapshot contains **{len(archive):,} unique Awwwards Sites of the Day** from
{archive[-1]['award_date']} through {archive[0]['award_date']}. Of the
**{len(fingerprints):,} sites fingerprinted**, **{len(live):,}** still
returned visitable HTML. Deep technology, interaction, and asset distributions
below use only that live subset; inaccessible records remain in the status table.

Awwwards displayed 6,410 SOTD items at collection time, while its actual
pagination ended after {len(archive):,} unique cards. The study records the
{6410 - len(archive):,}-item discrepancy instead of filling it with inferred rows.
The live subset yielded **{len(tech_counts):,} distinct detected technologies** in
**{len(tech_category_counts):,} categories** and **{len(technology_pairs):,} observed
technology pairs**; the CSV appendices retain the complete lists.
**{changed_host_count:,} live responses** ended on a different hostname than the
Awwwards card URL. Those rows stay visible as `redirect_host_changed`; the study does
not assume every cross-domain destination is the original award-winning experience.

## What the evidence says

The most common live-response fingerprints are {percent_phrase(tech_counts, denominator)}.
These are delivery and implementation observations, not a prescribed stack. In
particular, infrastructure signals such as HSTS, HTTP/3, and Cloudflare should not
be confused with frontend frameworks.

Awwwards' own interaction taxonomy is led by
{percent_phrase(interaction_counts, denominator)}. Independent HTML inspection
finds {percent_phrase(signal_counts, denominator)}. The disagreement between those
two layers is useful: editorial tags describe the awarded experience, while a
single bounded fetch can only observe what was delivered to that request.

## Evidence model and method

1. Enumerate listing pages newest-first until three consecutive exhausted pages.
2. Preserve Awwwards title, award date, studio, external URL, and editorial tags.
3. Visit each external URL with redirects enabled and a strict timeout; classify
   HTML, blocked, parked, missing, server, TLS/DNS, timeout, and non-HTML outcomes.
4. Detect technologies with `wappalyzergo` v0.2.90 from response headers, cookies,
   metadata, HTML, and script references. Keep Awwwards technology tags as a
   separate editorial evidence layer.
5. Mirror every direct-probe `live_html` candidate with HTTrack 3.49-2 at depth 1 while respecting robots,
   rate/size caps, and the requested media/font exclusions. Mirrors remain outside Git.
6. Count browser-native signals and referenced asset formats from live HTML.

The three evidence layers remain separate throughout the outputs:

- **Archive evidence**: Awwwards card fields and editorial tags for all records.
- **Live-response evidence**: status, headers, Wappalyzer matches, and HTML signals.
- **Mirror evidence**: HTTrack outcome and retained code/configuration assets after
  the explicit image, video, audio, and font exclusions.

## Visit status

{markdown_table(status_counts.most_common(), len(archive), 20, "Share of archive")}

## HTTrack status

{markdown_table(mirror_counts.most_common(), len(archive), 20, "Share of archive")}

This table classifies the direct-probe live cohort and labels every other archive row
`not_in_live_scope`. The raw status evidence also retains
**{len(mirrored_ranks - live_ranks):,} exploratory pilot attempts** made before the
live-only scope was frozen; those pilots do not alter the table's cohort counts.

## Survivorship by award year

{yearly_survivorship_table(yearly_archive, yearly_live)}

The newest partial-year cohort returned HTML for {newest_survival:.1f}% of records;
the lowest-survival cohort, {lowest_survival_year}, returned HTML for
{lowest_survival:.1f}%. The date cohorts expose survivorship bias directly: older winners have had more time
to change domains, lose certificates, retire campaigns, or become parking pages. The
`technology-by-award-year.csv` table therefore uses each year's live subset as its own
denominator and should not be read as a longitudinal panel of unchanged sites.

## Detected technologies

{markdown_table(tech_counts.most_common(), denominator, 30)}

## Technology categories

{markdown_table(tech_category_counts.most_common(), denominator, 25)}

## Awwwards technology tags

{markdown_table(awwwards_tech_counts.most_common(), denominator, 30)}

## Interaction patterns

{markdown_table(interaction_counts.most_common(), denominator, 30)}

## Browser and asset signals

{markdown_table(signal_counts.most_common(), denominator, 20)}

## Repeated feature bundles

{markdown_table(feature_bundles.most_common(), denominator, 20)}

## Visual styles

{markdown_table(visual_counts.most_common(), denominator, 25)}

## How to use this study for frontend tasks

The archive supports feature combinations, not a mandate to put every detected
technology into one application. A defensible concept chooses one coherent spine
(for example, a Three.js product scene or a Webflow editorial site), adds the
interaction patterns that fit that spine, and expresses each promise as a visible
action and observable result. Runtime evidence should guide feasibility; editorial
tags should guide experience; neither should be converted into invisible rubric
requirements such as “uses framework X.”

The strongest recurring task ingredients are a purposeful transition system,
scroll-linked narrative progression, tactile microinteractions, responsive alternate
layouts, and a useful end state. Advanced assets such as GLB, KTX2, HDR, Rive, and
WASM are justified only when the experience exposes their value and still provides
loading, reduced-motion, keyboard, touch, and fallback paths.

## Failure patterns this avoids

- **Mega-stack synthesis:** technology frequencies are alternatives and
  co-occurrences, not permission to demand React, Vue, Nuxt, Next.js, Webflow, and
  WordPress in one build.
- **Screenshot-only imitation:** visual resemblance does not prove navigation,
  transitions, 3D controls, forms, persistence, export, or responsive behavior.
- **Dependency-name grading:** browser-observable outcomes are valid criteria;
  source-level implementation claims are not.
- **Survivorship laundering:** dead, blocked, parked, and TLS/DNS failures stay in
  `site-status.csv` and the denominator rather than disappearing from the study.
- **Tag/detection conflation:** `GSAP` on an Awwwards card is editorial evidence;
  a Wappalyzer match is live-response evidence. The CSVs never merge the two.
- **Asset dumping:** the mirror excludes heavy media and fonts, honors robots,
  and enforces per-file, per-site, rate, socket, retry, depth, and time ceilings.
- **Decorative complexity without an end state:** generated tasks should culminate
  in a saved configuration, shareable state, playable result, or downloadable
  artifact rather than ending at a passive landing page.

## Limitations

- Technology fingerprints are evidence-based but not source-code proof; bundled,
  renamed, proxied, or server-only systems can remain invisible.
- Awwwards tags are editorial metadata and are reported separately from live detection.
- Consent walls, bot defenses, regional gating, expired TLS, and client-only rendering
  reduce observability. They are status outcomes, not silently excluded failures.
- The mirror intentionally excludes images, video, audio, and fonts and caps depth,
  time, file size, total bytes, request rate, and sockets per site.
- Client-side routes and lazy-loaded dependencies that require a real browser gesture
  can be absent from the bounded mirror and initial HTML fingerprint.
- Counts describe awarded sites, not the web at large; Awwwards selection effects are
  part of the sample and should not be generalized away.
- The Landonorris asset inventory is a local reference taxonomy only. No proprietary
  asset bytes are included in Git.
"""
    (args.output_dir / "REPORT.md").write_text(report, encoding="utf-8")
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
