# CSS and production-asset systems

Read `docs/research/awwwards-sotd-archive/FRONTEND-DEPTH.md` for complete counts and limitations.

## CSS craft vocabulary

The retained-CSS cohort shows that high-end production styling is usually a system of ordinary and advanced CSS primitives, not proof that a motion library is required.

Choose features by product role:

- **Composition:** flexbox, grid, subgrid, aspect ratio, object fit, sticky/fixed positioning, logical properties, container queries, and fluid `clamp()` sizing.
- **Typography:** variable-font axes, numeric features, balanced/pretty wrapping, writing modes, controlled measure, and fluid letter spacing.
- **Material:** custom properties, gradients, clipping, masks, shadows, blend modes, filters, backdrop filters, wide-gamut/OKLCH color, and SVG vectors.
- **Motion:** transitions, keyframes, transforms, perspective, scroll snap, view transitions, scroll-driven animation, and motion paths.
- **Interaction:** pointer/hover media queries, focus-visible, touch action, overscroll containment, `:has()`, and semantic reduced-motion alternatives.
- **Rendering:** containment, content visibility, cascade layers, feature queries, and bounded `will-change` use.

Task requirements should state what the user observes. Prefer “the selected card expands while neighboring cards retain their grid position” over “use CSS Grid and View Transitions.” Name a CSS primitive only when exercising that primitive is itself the task's technical purpose.

Treat frequent practices critically. Only 16.2% of retained-CSS sites exposed reduced-motion queries; that is a cohort weakness to improve, not a production standard to copy.

## Asset-system contracts

Advanced assets earn inclusion only as a coherent pipeline:

| Layer | Candidate formats | Requirement to specify |
|---|---|---|
| Geometry | GLB/glTF, FBX, OBJ, Spline | Visible object/scene role, controls, bounds, and semantic fallback |
| Material | KTX2/Basis, PBR maps | Channel roles, resolution/mips, decoder path, and low-memory fallback |
| Lighting | HDR/EXR | Environment/state role and lower-cost fallback |
| Vector state | Rive, Lottie, SVG | State machine or narrative role, input mapping, and static/reduced-motion fallback |
| Shader | GLSL/WGSL | Visible material/postprocess purpose, capability check, and non-shader fallback |
| Runtime | WASM, worker, OffscreenCanvas | Loading/progress, stale-result handling, cleanup, error/retry, and main-thread responsiveness |
| Compression | Draco, Meshopt, Basis | Decoder availability, timeout, and uncompressed or simpler fallback |

For any chosen system, define:

1. the useful visual or interaction outcome;
2. which asset is the source of that outcome;
3. staged loading and honest progress;
4. decoder/worker initialization and bounded failure;
5. keyboard, touch, and pointer access to equivalent outcomes;
6. reduced-motion behavior;
7. device/capability degradation;
8. resource disposal and stale async protection;
9. browser-observable evidence a judge can exercise.

## Lando Norris reference system

The local metadata demonstrates a complete pipeline:

- five GLBs, including Draco-compressed geometry;
- thirteen mipmapped KTX2 textures carrying base-color, metallic, roughness, alpha, depth, shadow, and mask roles;
- Basis JavaScript/WASM transcoding for runtime GPU texture delivery;
- three HDR environment variants for lighting states;
- eight Rive files for controls, transitions, signatures, phrases, circuits, and orientation UI;
- variable and display fonts, inventoried but excluded from mirror downloads.

Do not copy those proprietary assets. Use the architecture as a reference: geometry + material channels + environment + decoder + state-machine UI + fallbacks. A task inspired by it should require an original asset set and visible pipeline behavior.

## Rubric evidence

Good criteria verify outcomes across the pipeline:

- staged loader names geometry, textures, and interaction readiness before the scene becomes operable;
- changing a material visibly updates the same model and persists into the exported artifact;
- forced decoder failure reaches a useful fallback and Retry rather than a blank canvas;
- reduced motion removes camera travel and loops while preserving station/state orientation;
- compact layout keeps semantic controls reachable without requiring precision canvas gestures;
- leaving and re-entering a scene does not duplicate workers, audio, render loops, or GPU resources.

Do not grade asset filenames, hidden loader classes, or dependency strings.
