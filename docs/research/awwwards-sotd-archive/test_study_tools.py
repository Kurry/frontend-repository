import importlib.util
import html
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).parent


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


analyze = load_module("analyze")
collect_archive = load_module("collect_archive")
mirror_sites = load_module("mirror_sites")
analyze_frontend_depth = load_module("analyze_frontend_depth")


class StudyToolTests(unittest.TestCase):
    def test_awwwards_card_parser_preserves_observable_fields(self):
        model = {
            "id": 42,
            "slug": "sample-site",
            "title": "Sample &amp; Site",
            "createdAt": 1_704_067_200,
            "tags": ["GSAP", "Animation"],
        }
        encoded_model = html.escape(json.dumps(model), quote=True)
        source = f'''<li class="col-3 js-collectable">
          <a data-collectable-model-value="{encoded_model}"></a>
          <a href="https://example.com" target="_blank">Visit</a>
          <h3 class="avatar-name__title">Example Studio</h3>
        </li>'''

        [record] = collect_archive.parse_page(7, source)

        self.assertEqual(record["slug"], "sample-site")
        self.assertEqual(record["title"], "Sample & Site")
        self.assertEqual(record["live_url"], "https://example.com")
        self.assertEqual(record["studio"], "Example Studio")
        self.assertEqual(record["awwwards_tags"], ["GSAP", "Animation"])

    def test_mirror_excludes_raster_media_video_audio_and_fonts_but_keeps_svg(self):
        expected = {"jpg", "png", "webp", "mp4", "webm", "mp3", "wav", "woff", "woff2", "ttf", "otf"}
        self.assertTrue(expected.issubset(set(mirror_sites.EXCLUDED_EXTENSIONS)))
        self.assertFalse({"html", "css", "js", "json", "svg", "wasm", "glb", "gltf", "ktx2", "hdr", "riv"} & set(mirror_sites.EXCLUDED_EXTENSIONS))
        self.assertIn("-mime:image/*", mirror_sites.EXCLUDED_MIME_FILTERS)
        self.assertIn("+mime:image/svg+xml", mirror_sites.EXCLUDED_MIME_FILTERS)
        self.assertIn("-mime:font/*", mirror_sites.EXCLUDED_MIME_FILTERS)

    def test_signature_sanitizer_catches_proxy_media_without_harming_code(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            disguised_image = root / "next-image-proxy"
            disguised_image.write_bytes(b"\x89PNG\r\n\x1a\n" + b"payload")
            javascript = root / "bundle"
            javascript.write_bytes(b"export const answer = 42")
            self.assertTrue(mirror_sites.excluded_by_signature(disguised_image))
            self.assertFalse(mirror_sites.excluded_by_signature(javascript))

    def test_safe_slug_is_bounded_and_path_safe(self):
        slug = mirror_sites.safe_slug("../../Lacoste Polo Factory? / US")
        self.assertEqual(slug, "lacoste-polo-factory-us")
        self.assertLessEqual(len(slug), 90)
        self.assertNotIn("/", slug)

    def test_technology_versions_are_normalized_without_losing_product_colons(self):
        self.assertEqual(analyze.normalize_technology("jQuery:3.7.1"), "jQuery")
        self.assertEqual(analyze.normalize_technology("Example:Enterprise"), "Example:Enterprise")

    def test_historical_awwwards_tags_are_not_laundered_into_industries(self):
        technologies, interactions, visuals, industries = analyze.tag_groups(
            ["Nginx", "Webpack", "Firebase", "next.js", "Animation", "Black", "Design Agencies"]
        )
        self.assertEqual(technologies, ["Nginx", "Webpack", "Firebase", "Next.js"])
        self.assertEqual(interactions, ["Animation"])
        self.assertEqual(visuals, ["Black"])
        self.assertEqual(industries, ["Design Agencies"])

    def test_asset_formats_reject_domain_suffixes_and_numeric_paths(self):
        formats = analyze.filtered_asset_formats(
            {"referenced_asset_formats": {"js": 3, "glb": 1, "com": 8, "0": 2}}
        )
        self.assertEqual(formats, {"js": 3, "glb": 1})

    def test_compact_fingerprints_preserve_editorial_tags(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "fingerprints.jsonl"
            analyze.write_compact_fingerprints(
                output,
                {
                    1: {
                        "archive_rank": 1,
                        "awwwards_tags": ["GSAP", "Animation"],
                        "requested_url": "https://example.com",
                        "final_url": "https://example.com",
                        "technologies": [],
                    }
                },
            )
            compact = json.loads(output.read_text(encoding="utf-8"))

        self.assertEqual(compact["awwwards_tags"], ["GSAP", "Animation"])

    def test_jsonl_loader_preserves_unicode_line_separators_in_strings(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "records.jsonl"
            path.write_text(json.dumps({"title": "safe\u2028title"}) + "\n", encoding="utf-8")
            [record] = analyze.load_jsonl(path)
            depth_records = analyze_frontend_depth.load_jsonl(path)

        self.assertEqual(record["title"], "safe\u2028title")
        self.assertEqual(depth_records[0]["title"], "safe\u2028title")

    def test_redirect_host_change_is_observed_without_claiming_repurpose(self):
        self.assertFalse(analyze.changed_redirect_host("https://www.example.com/a", "https://example.com/b"))
        self.assertTrue(analyze.changed_redirect_host("https://example.com", "https://another.example/path"))

    def test_landonorris_inventory_hashes_metadata_without_copying_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "scene.glb").write_bytes(b"glb")
            (root / "type.woff2").write_bytes(b"font")

            inventory = analyze.inventory_asset_reference(root)

        self.assertEqual(inventory["file_count"], 2)
        by_extension = {item["extension"]: item for item in inventory["files"]}
        self.assertEqual(by_extension["glb"]["category"], "3d_model")
        self.assertFalse(by_extension["glb"]["excluded_from_mirror"])
        self.assertTrue(by_extension["woff2"]["excluded_from_mirror"])
        self.assertEqual(len(by_extension["glb"]["sha256"]), 64)

    def test_css_depth_detection_covers_production_feature_families(self):
        css = """
        @container card (min-width: 40rem) { .card:has(img) { display: grid; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none; } }
        .hero { color: oklch(70% .2 20); text-wrap: balance; backdrop-filter: blur(1rem); }
        .track { scroll-snap-type: x mandatory; animation-timeline: view(); }
        """

        features = analyze_frontend_depth.detect_css_features(css)

        self.assertTrue({
            "container_queries", "has_selector", "grid", "prefers_reduced_motion",
            "oklch_oklab", "text_wrap_balance_pretty", "backdrop_filter",
            "scroll_snap", "scroll_driven_animation",
        }.issubset(features))

    def test_advanced_asset_classification_separates_runtime_systems(self):
        self.assertEqual(analyze_frontend_depth.asset_category("scene.glb"), "3d_model")
        self.assertEqual(analyze_frontend_depth.asset_category("albedo.ktx2"), "gpu_texture")
        self.assertEqual(analyze_frontend_depth.asset_category("studio.hdr"), "environment_map")
        self.assertEqual(analyze_frontend_depth.asset_category("button.riv"), "vector_animation")
        self.assertEqual(analyze_frontend_depth.asset_category("decoder.wasm"), "webassembly")

    def test_zero_byte_advanced_asset_is_not_retained_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            placeholder = Path(directory) / "scene.splinecode"
            placeholder.touch()

            self.assertFalse(analyze_frontend_depth.is_retained_advanced_asset(placeholder))
            placeholder.write_bytes(b"scene")
            self.assertTrue(analyze_frontend_depth.is_retained_advanced_asset(placeholder))

    def test_lottie_metadata_is_inventory_ready(self):
        payload = json.dumps({
            "v": "5.9.0", "w": 1880, "h": 980, "fr": 15,
            "ip": 0, "op": 100, "layers": [{}, {}],
        })

        metadata = analyze_frontend_depth.lottie_metadata(Path("hero.json"), payload)

        self.assertEqual(metadata, {
            "version": "5.9.0", "width": 1880, "height": 980,
            "frame_rate": 15, "in_point": 0, "out_point": 100,
            "layer_count": 2,
        })

    def test_depth_pass_synchronizes_parent_manifest_and_report(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / "study-manifest.json").write_text(
                json.dumps({"archive_records": 10, "generated_at": "study-time"}) + "\n",
                encoding="utf-8",
            )
            (output / "REPORT.md").write_text(
                "# Report\n\n## Browser and asset signals\n\nTable\n\n"
                "## Repeated feature bundles\n\nBundles\n",
                encoding="utf-8",
            )
            manifest = {"generated_at": "depth-time", "mirrored_html_sites": 8}
            section = "## CSS and production-asset depth\n\nDepth evidence."

            analyze_frontend_depth.synchronize_study_outputs(output, manifest, section)
            analyze_frontend_depth.synchronize_study_outputs(output, manifest, section)

            merged = json.loads((output / "study-manifest.json").read_text(encoding="utf-8"))
            report = (output / "REPORT.md").read_text(encoding="utf-8")
        self.assertEqual(merged["frontend_depth"], {"mirrored_html_sites": 8})
        self.assertEqual(report.count("## CSS and production-asset depth"), 1)
        self.assertLess(
            report.index("## CSS and production-asset depth"),
            report.index("## Repeated feature bundles"),
        )

    def test_primary_analysis_preserves_depth_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / "frontend-depth-manifest.json").write_text(
                json.dumps({"generated_at": "depth-time", "css_features": 66}) + "\n",
                encoding="utf-8",
            )
            (output / "REPORT.md").write_text(
                "# Report\n\n## CSS and production-asset depth\n\nDepth evidence.\n\n"
                "## Repeated feature bundles\n\nBundles\n",
                encoding="utf-8",
            )

            manifest, section = analyze.existing_frontend_depth(output)

        self.assertEqual(manifest["css_features"], 66)
        self.assertEqual(section, "## CSS and production-asset depth\n\nDepth evidence.")

    def test_depth_analysis_inventories_lottie_and_updates_parent_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            mirror_root = root / "mirrors"
            site_root = mirror_root / "0001-sample"
            site_root.mkdir(parents=True)
            (site_root / "index.html").write_text(
                '<link rel="stylesheet" href="style.css">', encoding="utf-8"
            )
            (site_root / "style.css").write_text(".card { display: grid; }", encoding="utf-8")
            (site_root / "hero.json").write_text(
                json.dumps({"v": "5.9.0", "layers": [{}]}), encoding="utf-8"
            )
            status = root / "status.jsonl"
            status.write_text(json.dumps({
                "archive_rank": 1, "slug": "sample", "source_url": "https://example.com",
                "mirror_path": "0001-sample", "visitable_html": True,
            }) + "\n", encoding="utf-8")
            fingerprints = root / "fingerprints.jsonl"
            fingerprints.write_text(json.dumps({
                "archive_rank": 1, "reachable_html": True,
            }) + "\n", encoding="utf-8")
            output = root / "output"
            output.mkdir()
            (output / "study-manifest.json").write_text("{}\n", encoding="utf-8")
            (output / "REPORT.md").write_text(
                "# Report\n\n## Repeated feature bundles\n\nBundles\n", encoding="utf-8"
            )
            argv = [
                "analyze_frontend_depth.py", "--mirror-root", str(mirror_root),
                "--mirror-status", str(status), "--fingerprints", str(fingerprints),
                "--output-dir", str(output),
            ]

            with mock.patch.object(sys, "argv", argv):
                self.assertEqual(analyze_frontend_depth.main(), 0)

            inventory = [
                json.loads(line)
                for line in (output / "advanced-asset-inventory.jsonl").read_text().splitlines()
            ]
            study_manifest = json.loads((output / "study-manifest.json").read_text())
            report = (output / "REPORT.md").read_text()
        self.assertEqual(len(inventory), 1)
        self.assertEqual(inventory[0]["extension"], "lottie_json")
        self.assertEqual(study_manifest["frontend_depth"]["retained_advanced_asset_files"], 1)
        self.assertIn("## CSS and production-asset depth", report)


if __name__ == "__main__":
    unittest.main()
