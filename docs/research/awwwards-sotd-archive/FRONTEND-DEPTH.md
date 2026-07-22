# CSS and production-asset depth study

## Outcome

This second-pass study inspects the retained code/configuration mirror rather than relying on Awwwards tags or initial HTML alone. It covers the **4,434 direct-probe live sites with retained HTML**. Of those, **2,210 sites** retained at least one external stylesheet or inline style block. The analyzer found **66 CSS feature families** and **2,131 site-level feature pairs**.

The same pass scans retained HTML, CSS, JavaScript, JSON, and manifests for production-asset references and runtime loaders. It found **275 sites** referencing an advanced asset format and **14 sites** with at least one non-empty advanced binary actually retained by the bounded mirror. Reference evidence and retained-file evidence remain separate.

Complete appendices:

- `css-feature-frequency.csv`
- `css-feature-cooccurrence.csv`
- `site-css-features.jsonl`
- `advanced-asset-format-frequency.csv`
- `advanced-runtime-signal-frequency.csv`
- `advanced-asset-sites.csv`
- `advanced-asset-inventory.jsonl`
- `landonorris-asset-system.json`
- `frontend-depth-manifest.json`

## CSS language usage

Percentages below use the 2,210-site retained-CSS cohort. The mirrored-site percentage remains available in the CSV.

| Feature | Sites | Share of CSS sites |
|---|---:|---:|
| Media queries | 2,029 | 91.8% |
| Transforms | 2,007 | 90.8% |
| Transitions | 1,967 | 89.0% |
| Flexbox | 1,964 | 88.9% |
| Fixed positioning | 1,959 | 88.6% |
| `@font-face` | 1,946 | 88.1% |
| CSS custom properties | 1,536 | 69.5% |
| Gradients | 1,455 | 65.8% |
| Grid | 1,378 | 62.4% |
| 3D transforms | 1,269 | 57.4% |
| `will-change` | 1,211 | 54.8% |
| `clip-path` | 882 | 39.9% |
| `clamp()` / `min()` / `max()` | 857 | 38.8% |
| Dynamic viewport units | 782 | 35.4% |
| Backdrop filters | 695 | 31.4% |
| CSS masks | 607 | 27.5% |
| `:focus-visible` | 598 | 27.1% |
| `:has()` | 480 | 21.7% |
| Reduced-motion queries | 357 | 16.2% |
| Variable-font controls | 353 | 16.0% |
| Scroll snap | 349 | 15.8% |
| Balanced/pretty text wrapping | 251 | 11.4% |
| Container queries | 162 | 7.3% |
| `color-mix()` | 179 | 8.1% |
| Cascade layers | 99 | 4.5% |
| Subgrid | 86 | 3.9% |
| OKLCH/OKLab | 48 | 2.2% |
| View transitions | 35 | 1.6% |
| Scroll-driven animation | 13 | 0.6% |

The dominant production vocabulary is not a single animation library. It is a CSS system: responsive queries, flex/grid composition, transforms and transitions, custom properties, gradients/material effects, clipping/masking, and interaction-state selectors. Emerging primitives are present but still selective. A task should therefore prescribe the visible composition or motion outcome and allow CSS to carry it when CSS is sufficient.

Only 357 retained-CSS sites included a reduced-motion query. That is evidence of an accessibility gap in the awarded cohort, not permission to omit reduced-motion behavior from new production tasks.

## Advanced production assets

The bounded mirror retained 39 non-empty advanced files totaling 61,195,478 bytes. Two large Lottie JSON sequences account for 41,223,640 bytes; the remaining retained binary set includes 24 GLBs, six KTX textures, three WASM modules, two HDR environments, one EXR environment, and one FBX model. A zero-byte Spline placeholder remains reference evidence only and is not counted as a retained asset.

References inside retained code reveal a much larger production pipeline than direct file retention alone:

| Format | Referencing sites | Retained sites | Production role |
|---|---:|---:|---|
| GLB | 111 | 8 | Packaged glTF scenes and objects |
| WASM | 107 | 3 | Decoders, physics, rendering, and compute |
| OBJ | 56 | 0 | Legacy/interchange geometry |
| KTX2 | 51 | 0 | GPU-compressed textures |
| Fragment shaders | 39 | 0 | Custom material/postprocessing programs |
| glTF | 28 | 0 | Scene/model manifests |
| Rive | 25 | 0 | Interactive vector state machines |
| HDR | 24 | 2 | Image-based lighting environments |
| KTX | 18 | 2 | GPU texture containers |
| Spline scenes | 19 | 1 | Authored interactive 3D scenes |
| Basis textures | 13 | 0 | Transcodable GPU textures |
| GLSL | 12 | 0 | Shader source |
| EXR | 6 | 1 | High-dynamic-range environments/data |
| FBX | 6 | 1 | Interchange geometry/animation |

Runtime evidence further connects assets into systems:

| Runtime signal | Sites | Share of mirrors |
|---|---:|---:|
| OffscreenCanvas | 306 | 6.9% |
| Shader source | 270 | 6.1% |
| Web Worker | 252 | 5.7% |
| Lottie runtime | 203 | 4.6% |
| glTF loader | 116 | 2.6% |
| Draco decoder | 113 | 2.5% |
| Basis/KTX2 transcoder | 101 | 2.3% |
| Meshopt decoder | 94 | 2.1% |
| WebAssembly instantiation | 59 | 1.3% |
| WebGPU | 23 | 0.5% |
| Rive runtime | 22 | 0.5% |
| WebXR | 13 | 0.3% |

The correct unit for task design is the asset system, not an isolated extension. A GLB task may also need compressed geometry, GPU textures, environment lighting, a worker/WASM decoder, staged loading, cleanup, reduced-motion handling, touch/keyboard controls, and a semantic fallback. Requiring only “include a GLB” rewards asset dumping rather than production engineering.

## High-breadth examples

`advanced-asset-sites.csv` keeps every site and sorts by distinct production-asset category breadth without treating that breadth as a quality score. Examples with broad referenced systems include Zentry; Heidelberg CCUS; Altermind; Spring/Summer; Shopify Editions Summer 2024; Hubtown; The Power of Storytelling; Planet O.N.O.; UNESCO Stolen Objects Museum; and several Noomo experiences.

Directly retained examples provide stronger binary evidence:

- Hut 8 retained three Draco-compressed GLBs.
- Composites Archi retained seven GLBs, including an animated feather scene and large tunnel geometry.
- Shopify Editions retained eight small Draco-compressed product/brand GLBs, two with animations.
- Cleo AI retained a phone GLB using clearcoat and specular material extensions plus an HDR reflection environment.
- Inkwell retained a Rapier physics WASM module.
- The Monolith Project retained a Draco decoder WASM module.
- Mill3 Studio retained a Rive WebGL2 WASM runtime.

## Lando Norris asset system

The local `/Users/kurrytran/Documents/landonorris-design-assets` directory is now analyzed as a production system, not merely hashed as a list of files. No proprietary bytes are committed.

| Layer | Evidence | Production role |
|---|---|---|
| Geometry | 5 GLBs | Helmet, track, award, and scene objects |
| Geometry compression | Draco required by 3 GLBs | Smaller network payloads with decoder requirement |
| GPU materials | 13 KTX2 textures | Base color, metallic, roughness, alpha, depth, shadow, and mask channels |
| Texture delivery | Basis transcoder JS + WASM | Runtime GPU-format selection/transcoding |
| Lighting | 3 HDR variants, each 512×256 | Dark, faded, and light environment states |
| Vector interaction | 8 Rive files | Buttons, circuits, transition, phrase, signature, and mobile-landscape state assets |
| Typography | Mona Sans variable + Brier Bold files | Brand voice; fonts remain excluded from mirrors |

The KTX2 metadata shows mipmapped 512–2048px textures using BasisLZ or Zstandard supercompression. The GLB metadata exposes scene/node/mesh/material counts and required extensions. This is the depth that was absent from the original study.

The retained Lando mirror itself contains HTML and a 188KB stylesheet but did not retain its runtime binaries. Its CSS still demonstrates 36 measured feature families, including grid/flex composition, dynamic viewport units, `clamp()`, variable fonts, balanced text wrapping, masks, clipping, blend/filter effects, 3D transforms, perspective, sticky/fixed positioning, focus-visible styling, and SVG data URIs. The local asset directory supplies separate binary evidence and is not presented as mirror-derived.

## Policy correction

The original mirror policy scrubbed SVG under the broad image exclusion. That was incorrect: the request excluded photos, video, audio, and fonts, while SVG commonly carries interface vectors, masks, symbols, diagrams, and code-like animation assets. The policy now retains `.svg` and explicitly re-allows `image/svg+xml` while continuing to reject raster-image MIME types and binary signatures.

Existing mirrors are not claimed to contain SVG files that were previously removed. Initial HTML and CSS still provide SVG-reference and data-URI evidence; a future mirror replay under the corrected policy can retain those vector files.

## Limitations

- Only 2,210 of 4,434 retained HTML mirrors included CSS text; CSS percentages use that visible subset.
- Regex classification reports feature-family presence, not semantic correctness or rendered quality.
- Minified bundles can reference formats or loaders that are not exercised on the landing route.
- HTTrack depth, MIME decisions, client-only loading, consent gates, and size/time caps reduce binary retention.
- A referenced asset is weaker evidence than a retained and parsed binary; both columns are reported.
- Asset-system breadth is descriptive and must not become a leaderboard or a requirement to accumulate formats.
