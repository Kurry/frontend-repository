import importlib.util
import html
import json
import tempfile
import unittest
from pathlib import Path


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

    def test_mirror_excludes_images_video_audio_and_fonts(self):
        expected = {"jpg", "png", "svg", "webp", "mp4", "webm", "mp3", "wav", "woff", "woff2", "ttf", "otf"}
        self.assertTrue(expected.issubset(set(mirror_sites.EXCLUDED_EXTENSIONS)))
        self.assertFalse({"html", "css", "js", "json", "wasm", "glb", "gltf", "ktx2", "hdr", "riv"} & set(mirror_sites.EXCLUDED_EXTENSIONS))
        self.assertIn("-mime:image/*", mirror_sites.EXCLUDED_MIME_FILTERS)
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

        self.assertEqual(record["title"], "safe\u2028title")

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


if __name__ == "__main__":
    unittest.main()
