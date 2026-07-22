# Awwwards Sites of the Day archive study

This directory contains the reproducible collector and analysis inputs for a
full-archive study of [Awwwards Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/).
The study distinguishes the
archive sampling frame from the subset of live, visitable sites and retains
failed/retired records so survivorship is measurable.

The generated [REPORT.md](REPORT.md) summarizes the evidence. The
[task synthesis](TASK-SYNTHESIS.md) turns recurring patterns into three coherent,
browser-observable task briefs instead of one unbuildable mega-stack.

## Collection policy

- Crawl Awwwards listing pagination until it is exhausted; never assume a fixed
  count such as 1,000 or 6,500.
- Treat Awwwards card metadata as the source for title, award date, external URL,
  studio, and editorial tags.
- Probe every external URL, then use HTTrack for a bounded landing-page mirror of
  each URL that still returns visitable HTML.
- Respect `robots.txt` and page-level robot directives.
- Keep mirrors outside Git. Commit only derived evidence and aggregate data.
- Exclude raster photos/images, video, audio, and fonts. Retain SVG, HTML, CSS,
  JavaScript, JSON, manifests, WASM, shaders, Rive, and lightweight
  3D/configuration assets.
- Reject media/fonts by URL extension and response MIME type, then delete any
  proxy-disguised media/font signature and HTTrack response cache before recording
  the per-site result.
- Mark a mirror `visitable_html` only when it contains an HTML document;
  never silently drop inaccessible sites.

## Reproduce

Prerequisites are Python 3.11+, Go 1.25+, HTTrack 3.49-2, and enough temporary
disk for the uncommitted mirror. Wappalyzergo is pinned by `fingerprint/go.mod`.

```bash
study_dir=/tmp/awwwards-sotd-study
mirror_dir=/tmp/awwwards-sotd-mirrors

python3 docs/research/awwwards-sotd-archive/collect_archive.py \
  --output-dir "$study_dir"

cd docs/research/awwwards-sotd-archive/fingerprint
go run . \
  --archive "$study_dir/archive.jsonl" \
  --output "$study_dir/fingerprints.jsonl" \
  --workers 16

cd -
python3 docs/research/awwwards-sotd-archive/mirror_sites.py \
  --archive "$study_dir/archive.jsonl" \
  --fingerprints "$study_dir/fingerprints.jsonl" \
  --only-live \
  --mirror-root "$mirror_dir" \
  --status-jsonl "$study_dir/mirror-status.jsonl" \
  --workers 4

python3 docs/research/awwwards-sotd-archive/analyze.py \
  --archive "$study_dir/archive.jsonl" \
  --fingerprints "$study_dir/fingerprints.jsonl" \
  --mirror-status "$study_dir/mirror-status.jsonl" \
  --asset-root /path/to/landonorris-design-assets \
  --output-dir "$study_dir/analysis"

python3 docs/research/awwwards-sotd-archive/analyze_frontend_depth.py \
  --mirror-root "$mirror_dir" \
  --mirror-status "$study_dir/mirror-status.jsonl" \
  --fingerprints "$study_dir/fingerprints.jsonl" \
  --asset-root /path/to/landonorris-design-assets \
  --output-dir "$study_dir/analysis"
```

The mirror runner is resumable: completed archive ranks in `mirror-status.jsonl`
are skipped on subsequent runs.

Run the focused checks with:

```bash
python3 -m unittest discover \
  -s docs/research/awwwards-sotd-archive \
  -p 'test_*.py' -v

cd docs/research/awwwards-sotd-archive/fingerprint && go test ./...

python3 docs/research/awwwards-sotd-archive/validate_study.py \
  --archive "$study_dir/archive.jsonl" \
  --fingerprints "$study_dir/fingerprints.jsonl" \
  --mirror-status "$study_dir/mirror-status.jsonl" \
  --mirror-root "$mirror_dir"
```

## Committed evidence

- `archive.jsonl`: one stable newest-first row per Awwwards card.
- `site-status.csv`: every archive record, including inaccessible outcomes.
- `site-fingerprints.jsonl`: compact direct-response evidence without copied page bodies.
- Frequency CSVs: technologies, categories, tags, interactions, signals, bundles,
  asset references, co-occurrences, yearly trends, visit outcomes, and mirror outcomes.
- CSS/asset-depth appendices: site-level CSS features and co-occurrences,
  retained-versus-referenced advanced asset formats, runtime-loader signals,
  parsed retained binary metadata, and the expanded Lando production system.
- `FRONTEND-DEPTH.md`: interpretation of those deeper CSS and production-asset results.
- `landonorris-asset-reference.json`: metadata and hashes only; no reference assets.
- `study-manifest.json`: row counts, date bounds, mirror coverage, and the discrepancy
  between the displayed Awwwards count and actual pagination.

The raw HTTrack mirror, response bodies, and Wappalyzer descriptions are intentionally
not committed.

## Asset-reference example

The separate local `landonorris-design-assets` reference demonstrates why code
and advanced runtime assets remain in scope even when conventional media is
excluded. It contains GLB models, KTX2 GPU textures, HDR environment maps, Rive
state-machine files, a Basis Universal WASM transcoder, and WOFF2 fonts. Fonts
are inventoried in the methodology but excluded from HTTrack downloads, as are
photos, video, and audio. SVG is retained as a vector/code asset. No proprietary
reference asset is copied into Git.
