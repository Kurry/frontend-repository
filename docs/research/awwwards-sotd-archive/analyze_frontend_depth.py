#!/usr/bin/env python3
"""Measure CSS language usage and advanced asset systems in retained mirrors."""

from __future__ import annotations

import argparse
import collections
import csv
import datetime as dt
import json
import re
import struct
from pathlib import Path


CSS_FEATURES: dict[str, tuple[str, str]] = {
    # Layout and responsive composition.
    "grid": ("layout", r"(?:display\s*:\s*(?:inline-)?grid\b|grid-template-|grid-auto-)"),
    "subgrid": ("layout", r"\bsubgrid\b"),
    "flexbox": ("layout", r"(?:display\s*:\s*(?:inline-)?flex\b|flex-(?:flow|grow|shrink|basis|direction|wrap))"),
    "multi_column": ("layout", r"(?:^|[;{])\s*(?:column-count|column-width|columns)\s*:"),
    "gap": ("layout", r"(?:^|[;{])\s*(?:gap|row-gap|column-gap)\s*:"),
    "aspect_ratio": ("layout", r"\baspect-ratio\s*:"),
    "object_fit_position": ("layout", r"\bobject-(?:fit|position)\s*:"),
    "sticky_position": ("layout", r"position\s*:\s*(?:-webkit-)?sticky\b"),
    "fixed_position": ("layout", r"position\s*:\s*fixed\b"),
    "logical_properties": ("layout", r"\b(?:margin|padding|inset|border|block-size|inline-size)-(?:block|inline)(?:-start|-end)?\s*:"),
    "container_queries": ("responsive", r"(?:@container\b|container-(?:type|name)\s*:)"),
    "media_queries": ("responsive", r"@media\b"),
    "interaction_media_queries": ("responsive", r"@media[^\{]*(?:hover|pointer|any-hover|any-pointer)\s*:"),
    "prefers_reduced_motion": ("responsive", r"prefers-reduced-motion\s*:"),
    "prefers_color_scheme": ("responsive", r"prefers-color-scheme\s*:"),
    "prefers_contrast_forced_colors": ("responsive", r"(?:prefers-contrast|forced-colors)\s*:"),
    "dynamic_viewport_units": ("responsive", r"(?:\d|\)|\b)(?:dvh|dvw|svh|svw|lvh|lvw)\b"),
    "container_query_units": ("responsive", r"(?:\d|\)|\b)cq(?:w|h|i|b|min|max)\b"),
    "clamp_min_max": ("responsive", r"\b(?:clamp|min|max)\s*\("),
    # Typography.
    "font_face": ("typography", r"@font-face\b"),
    "variable_fonts": ("typography", r"(?:font-variation-settings|font-optical-sizing)\s*:"),
    "font_features": ("typography", r"(?:font-feature-settings|font-variant-(?:numeric|ligatures|caps))\s*:"),
    "text_wrap_balance_pretty": ("typography", r"text-wrap\s*:\s*(?:balance|pretty)\b"),
    "text_stroke": ("typography", r"(?:-webkit-)?text-stroke(?:-width|-color)?\s*:"),
    "writing_modes": ("typography", r"(?:writing-mode|text-orientation)\s*:"),
    "fluid_letter_spacing": ("typography", r"letter-spacing\s*:\s*(?:clamp|min|max|calc)\s*\("),
    # Color, material, and image treatment.
    "custom_properties": ("color_material", r"(?:^|[;{])\s*--[\w-]+\s*:"),
    "gradients": ("color_material", r"(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\("),
    "oklch_oklab": ("color_material", r"\bokl(?:ch|ab)\s*\("),
    "lab_lch": ("color_material", r"(?<!ok)\b(?:lab|lch)\s*\("),
    "display_p3": ("color_material", r"color\s*\(\s*display-p3\b"),
    "color_mix": ("color_material", r"\bcolor-mix\s*\("),
    "backdrop_filter": ("color_material", r"(?:-webkit-)?backdrop-filter\s*:"),
    "filter_effects": ("color_material", r"(?<!backdrop-)filter\s*:"),
    "blend_modes": ("color_material", r"(?:mix-blend-mode|background-blend-mode)\s*:"),
    "masks": ("color_material", r"(?:-webkit-)?mask(?:-image|-size|-position|-repeat|-composite)?\s*:"),
    "clip_path": ("color_material", r"(?:-webkit-)?clip-path\s*:"),
    "shadows": ("color_material", r"(?:box-shadow|text-shadow|filter\s*:[^;{}]*drop-shadow)"),
    "svg_data_uri": ("color_material", r"data\s*:\s*image/svg\+xml"),
    # Motion and spatial effects.
    "keyframes": ("motion", r"@(?:-webkit-)?keyframes\b"),
    "animations": ("motion", r"(?:^|[;{])\s*(?:-webkit-)?animation(?:-[\w-]+)?\s*:"),
    "transitions": ("motion", r"(?:^|[;{])\s*(?:-webkit-)?transition(?:-[\w-]+)?\s*:"),
    "transforms": ("motion", r"(?:^|[;{])\s*(?:-webkit-)?transform\s*:"),
    "transform_3d": ("motion", r"(?:translate3d|rotate3d|matrix3d|perspective\s*\(|transform-style\s*:\s*preserve-3d)"),
    "perspective": ("motion", r"(?:^|[;{])\s*perspective(?:-origin)?\s*:"),
    "will_change": ("motion", r"\bwill-change\s*:"),
    "scroll_behavior": ("motion", r"\bscroll-behavior\s*:"),
    "scroll_snap": ("motion", r"\bscroll-snap-(?:type|align|stop)\s*:"),
    "scroll_driven_animation": ("motion", r"(?:scroll-timeline|view-timeline|animation-timeline|animation-range)\s*:"),
    "view_transitions": ("motion", r"(?:::\s*view-transition|view-transition-name\s*:|@view-transition\b)"),
    "motion_paths": ("motion", r"(?:offset-path|offset-distance|offset-rotate)\s*:"),
    # Selectors, cascade, and rendering behavior.
    "has_selector": ("selectors_cascade", r":has\s*\("),
    "is_where_selectors": ("selectors_cascade", r":(?:is|where)\s*\("),
    "focus_visible": ("selectors_cascade", r":focus-visible\b"),
    "cascade_layers": ("selectors_cascade", r"@layer\b"),
    "supports_queries": ("selectors_cascade", r"@supports\b"),
    "scope_rule": ("selectors_cascade", r"@scope\b"),
    "css_nesting": ("selectors_cascade", r"(?:^|[;{}])\s*&(?:[\s>+~.:#\[])"),
    "selection_marker_styling": ("selectors_cascade", r"::(?:selection|marker)\b"),
    "custom_scrollbars": ("selectors_cascade", r"(?:::-webkit-scrollbar|scrollbar-(?:color|width))"),
    "popover_anchor_positioning": ("selectors_cascade", r"(?::popover-open|anchor-name\s*:|position-anchor\s*:|position-area\s*:|anchor\s*\()"),
    "content_visibility": ("rendering", r"\bcontent-visibility\s*:"),
    "containment": ("rendering", r"(?:^|[;{])\s*contain\s*:"),
    "pointer_events": ("interaction", r"\bpointer-events\s*:"),
    "touch_action": ("interaction", r"\btouch-action\s*:"),
    "overscroll_behavior": ("interaction", r"\boverscroll-behavior(?:-[xy])?\s*:"),
    "user_select": ("interaction", r"(?:-webkit-)?user-select\s*:"),
}

COMPILED_CSS_FEATURES = {
    name: re.compile(pattern, re.IGNORECASE | re.MULTILINE)
    for name, (_, pattern) in CSS_FEATURES.items()
}

ADVANCED_EXTENSIONS = {
    "glb", "gltf", "fbx", "obj", "usdz", "dae", "3ds",
    "ktx", "ktx2", "basis", "dds", "astc",
    "hdr", "exr", "riv", "wasm", "drc", "draco",
    "glsl", "vert", "frag", "wgsl", "spv", "splinecode",
}

ASSET_REFERENCE_RE = re.compile(
    r"\.((?:glb|gltf|fbx|obj|usdz|dae|3ds|ktx2?|basis|dds|astc|hdr|exr|riv|wasm|drc|draco|glsl|vert|frag|wgsl|spv|splinecode))(?=[?#\"'()\\\s]|$)",
    re.IGNORECASE,
)

RUNTIME_SIGNALS: dict[str, re.Pattern[str]] = {
    "draco_decoder": re.compile(r"(?:DRACOLoader|draco_decoder|KHR_draco_mesh_compression)", re.I),
    "basis_ktx2_transcoder": re.compile(r"(?:KTX2Loader|BasisTextureLoader|basis_transcoder|KHR_texture_basisu)", re.I),
    "meshopt_decoder": re.compile(r"(?:MeshoptDecoder|EXT_meshopt_compression)", re.I),
    "gltf_loader": re.compile(r"(?:GLTFLoader|loadGLTF|model/gltf)", re.I),
    "rive_runtime": re.compile(r"(?:@rive-app|rive\.wasm|new\s+Rive\b)", re.I),
    "lottie_runtime": re.compile(r"(?:lottie-web|bodymovin|loadAnimation\s*\()", re.I),
    "webassembly_runtime": re.compile(r"(?:WebAssembly\.(?:instantiate|compile)|instantiateStreaming)", re.I),
    "webgpu": re.compile(r"(?:navigator\.gpu|GPUDevice\b|GPUCanvasContext\b|@group\s*\()", re.I),
    "webxr": re.compile(r"(?:navigator\.xr|XRSession\b|immersive-(?:vr|ar))", re.I),
    "shader_source": re.compile(r"(?:gl_FragColor|gl_Position|uniform\s+(?:vec|mat|sampler)|#version\s+300\s+es)", re.I),
    "offscreen_canvas": re.compile(r"(?:OffscreenCanvas|transferControlToOffscreen)", re.I),
    "web_worker": re.compile(r"(?:new\s+Worker\s*\(|SharedWorker\s*\()", re.I),
}

TEXT_EXTENSIONS = {"css", "html", "htm", "js", "mjs", "cjs", "json", "webmanifest", "xml", "txt", "php"}


def load_jsonl(path: Path) -> list[dict]:
    # JSON strings may legally contain U+2028/U+2029. Split only on the
    # physical newline used as the JSONL record separator.
    return [json.loads(line) for line in path.read_text(encoding="utf-8").split("\n") if line]


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def detect_css_features(css: str) -> set[str]:
    return {name for name, pattern in COMPILED_CSS_FEATURES.items() if pattern.search(css)}


def asset_category(path_or_extension: str) -> str:
    extension = path_or_extension.rsplit(".", 1)[-1].lower().split("?", 1)[0]
    if extension == "lottie_json":
        return "vector_animation"
    if extension in {"glb", "gltf", "fbx", "obj", "usdz", "dae", "3ds"}:
        return "3d_model"
    if extension in {"ktx", "ktx2", "basis", "dds", "astc"}:
        return "gpu_texture"
    if extension in {"hdr", "exr"}:
        return "environment_map"
    if extension == "riv":
        return "vector_animation"
    if extension == "wasm":
        return "webassembly"
    if extension in {"drc", "draco"}:
        return "compressed_geometry"
    if extension in {"glsl", "vert", "frag", "wgsl", "spv"}:
        return "shader"
    if extension == "splinecode":
        return "spline_scene"
    return "other"


def is_retained_advanced_asset(path: Path) -> bool:
    return path.suffix.lower().lstrip(".") in ADVANCED_EXTENSIONS and path.stat().st_size > 0


def parse_glb(path: Path) -> dict:
    try:
        data = path.read_bytes()
        if len(data) < 20 or data[:4] != b"glTF":
            return {}
        version, declared_length = struct.unpack_from("<II", data, 4)
        chunk_length, chunk_type = struct.unpack_from("<II", data, 12)
        if chunk_type != 0x4E4F534A or 20 + chunk_length > len(data):
            return {"glb_version": version, "declared_bytes": declared_length}
        document = json.loads(data[20:20 + chunk_length].rstrip(b" \x00").decode("utf-8"))
        return {
            "glb_version": version,
            "declared_bytes": declared_length,
            "extensions_used": sorted(document.get("extensionsUsed", [])),
            "extensions_required": sorted(document.get("extensionsRequired", [])),
            "scenes": len(document.get("scenes", [])),
            "nodes": len(document.get("nodes", [])),
            "meshes": len(document.get("meshes", [])),
            "materials": len(document.get("materials", [])),
            "animations": len(document.get("animations", [])),
            "textures": len(document.get("textures", [])),
        }
    except (OSError, ValueError, json.JSONDecodeError, struct.error, UnicodeDecodeError):
        return {}


def parse_ktx2(path: Path) -> dict:
    identifier = b"\xabKTX 20\xbb\r\n\x1a\n"
    try:
        with path.open("rb") as handle:
            header = handle.read(48)
        if len(header) < 48 or header[:12] != identifier:
            return {}
        values = struct.unpack_from("<9I", header, 12)
        return {
            "vk_format": values[0],
            "type_size": values[1],
            "pixel_width": values[2],
            "pixel_height": values[3],
            "pixel_depth": values[4],
            "layer_count": values[5],
            "face_count": values[6],
            "level_count": values[7],
            "supercompression_scheme": values[8],
        }
    except (OSError, struct.error):
        return {}


def parse_hdr(path: Path) -> dict:
    try:
        head = path.read_bytes()[:4096].decode("ascii", errors="ignore")
    except OSError:
        return {}
    match = re.search(r"-Y\s+(\d+)\s+\+X\s+(\d+)", head)
    return {"pixel_width": int(match.group(2)), "pixel_height": int(match.group(1))} if match else {}


def binary_metadata(path: Path) -> dict:
    extension = path.suffix.lower().lstrip(".")
    if extension == "glb":
        return parse_glb(path)
    if extension == "ktx2":
        return parse_ktx2(path)
    if extension == "hdr":
        return parse_hdr(path)
    if extension == "wasm":
        try:
            header = path.read_bytes()[:8]
        except OSError:
            return {}
        return {"wasm_version": int.from_bytes(header[4:8], "little")} if header.startswith(b"\x00asm") else {}
    return {}


def pbr_roles(name: str) -> list[str]:
    normalized = name.lower()
    aliases = {
        "base_color": ("basecolor", "base-color", "albedo", "diffuse"),
        "metallic": ("metallic", "metalness"),
        "roughness": ("roughness",),
        "normal": ("normal",),
        "alpha": ("alpha", "opacity"),
        "depth": ("depth", "height", "displacement"),
        "ambient_occlusion": ("occlusion", "_ao", "-ao"),
        "emissive": ("emissive",),
        "shadow": ("shadow",),
        "mask": ("mask",),
    }
    return [role for role, tokens in aliases.items() if any(token in normalized for token in tokens)]


def lottie_metadata(path: Path, text: str) -> dict | None:
    if path.suffix.lower() != ".json" or '"layers"' not in text or '"v"' not in text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict) or not isinstance(data.get("layers"), list) or "v" not in data:
        return None
    return {
        "version": data["v"],
        "width": data.get("w"),
        "height": data.get("h"),
        "frame_rate": data.get("fr"),
        "in_point": data.get("ip"),
        "out_point": data.get("op"),
        "layer_count": len(data["layers"]),
    }


def is_lottie_json(path: Path, text: str) -> bool:
    return lottie_metadata(path, text) is not None


def render_report_section(
    manifest: dict,
    css_counts: collections.Counter[str],
    referenced_format_sites: collections.Counter[str],
) -> str:
    css_denominator = int(manifest["sites_with_css"])
    feature_labels = [
        ("transforms", "Transforms"),
        ("transitions", "transitions"),
        ("flexbox", "flexbox"),
        ("custom_properties", "custom properties"),
        ("grid", "grid"),
        ("transform_3d", "3D transforms"),
        ("clip_path", "clipping"),
        ("dynamic_viewport_units", "dynamic viewport units"),
        ("backdrop_filter", "backdrop filters"),
        ("masks", "masks"),
        ("has_selector", "`:has()`"),
        ("prefers_reduced_motion", "reduced-motion queries"),
    ]
    features = ", ".join(
        f"{label} ({percent(css_counts[name], css_denominator):.1f}%)"
        for name, label in feature_labels
        if css_counts[name]
    )
    shader_sites = sum(referenced_format_sites[name] for name in ("glsl", "frag", "vert"))
    references = [
        ("GLB", referenced_format_sites["glb"]),
        ("WASM", referenced_format_sites["wasm"]),
        ("KTX2", referenced_format_sites["ktx2"]),
        ("shader files", shader_sites),
        ("Rive", referenced_format_sites["riv"]),
        ("HDR", referenced_format_sites["hdr"]),
        ("Spline scenes", referenced_format_sites["splinecode"]),
    ]
    reference_text = ", ".join(f"{label} ({count} sites)" for label, count in references if count)
    return f"""## CSS and production-asset depth

A second pass over the {int(manifest['mirrored_html_sites']):,} direct-cohort retained mirrors measures the actual
CSS language and advanced asset systems. Among {css_denominator:,} sites with retained CSS,
the analyzer found {int(manifest['css_features']):,} feature families and {int(manifest['css_feature_pairs']):,} site-level feature pairs.
{features} show the production vocabulary hidden by a single `css_animation` flag.

The same pass found {int(manifest['sites_with_referenced_advanced_assets']):,} sites referencing an advanced production asset and {int(manifest['sites_with_retained_advanced_assets']):,}
with an advanced production asset retained. References include {reference_text}. Runtime signals connect those files to
OffscreenCanvas, workers, glTF loaders, Draco, Basis/KTX2, Meshopt, Rive,
WebAssembly, WebGPU, and WebXR pipelines.

See [FRONTEND-DEPTH.md](FRONTEND-DEPTH.md) for the full method, CSS tables,
retained-versus-referenced asset evidence, parsed GLB/KTX2/HDR metadata, the
Lando Norris production-system analysis, and limitations."""


def upsert_report_section(report: str, section: str) -> str:
    heading = "## CSS and production-asset depth"
    next_heading = "## Repeated feature bundles"
    if heading in report:
        start = report.index(heading)
        end = report.index(next_heading, start)
        return report[:start] + section.rstrip() + "\n\n" + report[end:]
    if next_heading not in report:
        raise ValueError(f"REPORT.md is missing insertion anchor: {next_heading}")
    start = report.index(next_heading)
    return report[:start] + section.rstrip() + "\n\n" + report[start:]


def synchronize_study_outputs(output_dir: Path, manifest: dict, report_section: str) -> None:
    summary = {key: value for key, value in manifest.items() if key != "generated_at"}
    study_manifest_path = output_dir / "study-manifest.json"
    if study_manifest_path.exists():
        study_manifest = json.loads(study_manifest_path.read_text(encoding="utf-8"))
        study_manifest["frontend_depth"] = summary
        study_manifest_path.write_text(
            json.dumps(study_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
    report_path = output_dir / "REPORT.md"
    if report_path.exists():
        report_path.write_text(
            upsert_report_section(report_path.read_text(encoding="utf-8"), report_section),
            encoding="utf-8",
        )


def write_frequency(path: Path, rows: list[list[object]], header: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)


def percent(count: int, denominator: int) -> float:
    return round(100 * count / denominator, 3) if denominator else 0.0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mirror-root", type=Path, required=True)
    parser.add_argument("--mirror-status", type=Path, required=True)
    parser.add_argument("--fingerprints", type=Path, required=True)
    parser.add_argument("--asset-root", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    statuses = {int(row["archive_rank"]): row for row in load_jsonl(args.mirror_status)}
    live_ranks = {
        int(row["archive_rank"])
        for row in load_jsonl(args.fingerprints)
        if row.get("reachable_html")
    }
    mirrored = [
        row for row in statuses.values()
        if int(row["archive_rank"]) in live_ranks
        and row.get("visitable_html")
        and (args.mirror_root / str(row.get("mirror_path", ""))).is_dir()
    ]
    mirrored.sort(key=lambda row: int(row["archive_rank"]))

    css_counts: collections.Counter[str] = collections.Counter()
    css_pairs: collections.Counter[tuple[str, str]] = collections.Counter()
    retained_format_sites: collections.Counter[str] = collections.Counter()
    retained_format_files: collections.Counter[str] = collections.Counter()
    retained_format_bytes: collections.Counter[str] = collections.Counter()
    referenced_format_sites: collections.Counter[str] = collections.Counter()
    runtime_counts: collections.Counter[str] = collections.Counter()
    css_site_rows: list[dict] = []
    asset_site_rows: list[list[object]] = []
    asset_inventory: list[dict] = []

    for status in mirrored:
        rank = int(status["archive_rank"])
        root = args.mirror_root / str(status["mirror_path"])
        files = [path for path in root.rglob("*") if path.is_file()]
        css_chunks: list[str] = []
        inline_blocks = 0
        text_chunks: list[str] = []
        retained_formats: set[str] = set()
        referenced_formats: set[str] = set()
        runtime_signals: set[str] = set()
        retained_categories: set[str] = set()
        lottie_files = 0
        lottie_bytes = 0

        for path in files:
            extension = path.suffix.lower().lstrip(".")
            if is_retained_advanced_asset(path):
                retained_formats.add(extension)
                retained_categories.add(asset_category(extension))
                retained_format_files[extension] += 1
                retained_format_bytes[extension] += path.stat().st_size
                asset_inventory.append({
                    "archive_rank": rank,
                    "slug": status.get("slug", ""),
                    "mirror_path": status.get("mirror_path", ""),
                    "path": path.relative_to(root).as_posix(),
                    "extension": extension,
                    "category": asset_category(extension),
                    "bytes": path.stat().st_size,
                    "metadata": binary_metadata(path),
                    "pbr_roles": pbr_roles(path.name),
                })
            if extension not in TEXT_EXTENSIONS:
                continue
            text = read_text(path)
            if not text:
                continue
            text_chunks.append(text)
            if extension == "css":
                css_chunks.append(text)
            elif extension in {"html", "htm", "php"}:
                blocks = re.findall(r"<style\b[^>]*>(.*?)</style\s*>", text, re.I | re.S)
                css_chunks.extend(blocks)
                inline_blocks += len(blocks)
            metadata = lottie_metadata(path, text)
            if metadata is not None:
                lottie_files += 1
                lottie_bytes += path.stat().st_size
                asset_inventory.append({
                    "archive_rank": rank,
                    "slug": status.get("slug", ""),
                    "mirror_path": status.get("mirror_path", ""),
                    "path": path.relative_to(root).as_posix(),
                    "extension": "lottie_json",
                    "category": "vector_animation",
                    "bytes": path.stat().st_size,
                    "metadata": metadata,
                    "pbr_roles": pbr_roles(path.name),
                })

        css_text = "\n".join(css_chunks)
        features = sorted(detect_css_features(css_text))
        if css_text:
            css_counts.update(features)
            for index, first in enumerate(features):
                for second in features[index + 1:]:
                    css_pairs[(first, second)] += 1
            css_site_rows.append({
                "archive_rank": rank,
                "slug": status.get("slug", ""),
                "mirror_path": status.get("mirror_path", ""),
                "css_file_count": sum(path.suffix.lower() == ".css" for path in files),
                "inline_style_blocks": inline_blocks,
                "css_bytes": len(css_text.encode("utf-8")),
                "features": features,
            })

        all_text = "\n".join(text_chunks)
        referenced_formats.update(match.group(1).lower() for match in ASSET_REFERENCE_RE.finditer(all_text))
        for name, pattern in RUNTIME_SIGNALS.items():
            if pattern.search(all_text):
                runtime_signals.add(name)
        if lottie_files:
            retained_formats.add("lottie_json")
            retained_categories.add("vector_animation")
            retained_format_files["lottie_json"] += lottie_files
            retained_format_bytes["lottie_json"] += lottie_bytes
            runtime_signals.add("lottie_asset")
        for extension in retained_formats:
            retained_format_sites[extension] += 1
        for extension in referenced_formats:
            referenced_format_sites[extension] += 1
        runtime_counts.update(runtime_signals)
        all_categories = retained_categories | {asset_category(ext) for ext in referenced_formats}
        retained_asset_files = sum(
            1
            for path in files
            if is_retained_advanced_asset(path)
        ) + lottie_files
        retained_asset_bytes = sum(
            path.stat().st_size
            for path in files
            if is_retained_advanced_asset(path)
        ) + lottie_bytes
        asset_site_rows.append([
            rank,
            status.get("slug", ""),
            status.get("source_url", ""),
            len(all_categories - {"other"}),
            " | ".join(sorted(all_categories - {"other"})),
            " | ".join(sorted(retained_formats)),
            " | ".join(sorted(referenced_formats)),
            " | ".join(sorted(runtime_signals)),
            retained_asset_files,
            retained_asset_bytes,
        ])

    css_denominator = len(css_site_rows)
    mirrored_denominator = len(mirrored)
    write_frequency(
        args.output_dir / "css-feature-frequency.csv",
        [
            [CSS_FEATURES[name][0], name, count, percent(count, css_denominator), percent(count, mirrored_denominator)]
            for name, count in sorted(css_counts.items(), key=lambda item: (-item[1], item[0]))
        ],
        ["category", "feature", "site_count", "percent_of_css_sites", "percent_of_mirrored_sites"],
    )
    write_frequency(
        args.output_dir / "css-feature-cooccurrence.csv",
        [
            [first, second, count, percent(count, css_denominator)]
            for (first, second), count in css_pairs.most_common()
        ],
        ["feature_a", "feature_b", "site_count", "percent_of_css_sites"],
    )
    with (args.output_dir / "site-css-features.jsonl").open("w", encoding="utf-8") as handle:
        for row in css_site_rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    formats = sorted(retained_format_sites | referenced_format_sites, key=lambda name: (-(retained_format_sites[name] + referenced_format_sites[name]), name))
    write_frequency(
        args.output_dir / "advanced-asset-format-frequency.csv",
        [
            [
                extension,
                asset_category(extension),
                retained_format_sites[extension],
                retained_format_files[extension],
                retained_format_bytes[extension],
                referenced_format_sites[extension],
                percent(retained_format_sites[extension], mirrored_denominator),
                percent(referenced_format_sites[extension], mirrored_denominator),
            ]
            for extension in formats
        ],
        [
            "format", "category", "retained_site_count", "retained_file_count", "retained_bytes",
            "referenced_site_count", "percent_retained_sites", "percent_referenced_sites",
        ],
    )
    write_frequency(
        args.output_dir / "advanced-runtime-signal-frequency.csv",
        [[name, count, percent(count, mirrored_denominator)] for name, count in runtime_counts.most_common()],
        ["runtime_signal", "site_count", "percent_of_mirrored_sites"],
    )
    asset_site_rows.sort(key=lambda row: (-int(row[3]), -int(row[8]), int(row[0])))
    write_frequency(
        args.output_dir / "advanced-asset-sites.csv",
        asset_site_rows,
        [
            "archive_rank", "slug", "source_url", "asset_system_breadth", "asset_categories",
            "retained_formats", "referenced_formats", "runtime_signals", "retained_asset_files", "retained_asset_bytes",
        ],
    )
    with (args.output_dir / "advanced-asset-inventory.jsonl").open("w", encoding="utf-8") as handle:
        for row in sorted(asset_inventory, key=lambda item: (item["archive_rank"], item["path"])):
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    landon_files: list[dict] = []
    if args.asset_root and args.asset_root.exists():
        for path in sorted(item for item in args.asset_root.rglob("*") if item.is_file()):
            extension = path.suffix.lower().lstrip(".") or "[none]"
            landon_files.append({
                "path": path.relative_to(args.asset_root).as_posix(),
                "extension": extension,
                "category": asset_category(extension),
                "bytes": path.stat().st_size,
                "metadata": binary_metadata(path),
                "pbr_roles": pbr_roles(path.name),
            })
    category_counts = collections.Counter(row["category"] for row in landon_files)
    role_counts = collections.Counter(role for row in landon_files for role in row["pbr_roles"])
    landon_system = {
        "source_label": "landonorris-design-assets",
        "available": bool(landon_files),
        "file_count": len(landon_files),
        "total_bytes": sum(row["bytes"] for row in landon_files),
        "category_counts": dict(sorted(category_counts.items())),
        "pbr_role_counts": dict(sorted(role_counts.items())),
        "production_systems": {
            "compressed_3d_pipeline": any(row["extension"] == "glb" for row in landon_files) and any(row["extension"] == "ktx2" for row in landon_files),
            "basis_transcode_pipeline": any(row["extension"] == "wasm" and "basis" in row["path"].lower() for row in landon_files),
            "hdr_lighting_variants": sum(row["extension"] == "hdr" for row in landon_files),
            "rive_state_machine_assets": sum(row["extension"] == "riv" for row in landon_files),
        },
        "files": landon_files,
    }
    (args.output_dir / "landonorris-asset-system.json").write_text(
        json.dumps(landon_system, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )

    manifest = {
        "generated_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat(),
        "mirrored_html_sites": mirrored_denominator,
        "sites_with_css": css_denominator,
        "css_features": len(css_counts),
        "css_feature_pairs": len(css_pairs),
        "retained_advanced_asset_files": sum(retained_format_files.values()),
        "retained_advanced_asset_bytes": sum(retained_format_bytes.values()),
        "sites_with_retained_advanced_assets": sum(bool(row[5]) for row in asset_site_rows),
        "sites_with_referenced_advanced_assets": sum(bool(row[6]) for row in asset_site_rows),
        "runtime_signals": len(runtime_counts),
        "svg_retention_policy": "retained_as_vector_code_asset",
    }
    (args.output_dir / "frontend-depth-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    report_section = render_report_section(manifest, css_counts, referenced_format_sites)
    synchronize_study_outputs(args.output_dir, manifest, report_section)
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
