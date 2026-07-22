# Frontend task synthesis from live-site and product-release evidence

## Decision

The research does not support a single “use all 6,500 sites' technologies” task.
That would reward dependency accumulation instead of frontend judgment, and many
technologies are mutually exclusive alternatives. The useful synthesis is a small
set of hard, coherent browser applications that combine frequently co-occurring
experience patterns with exact user outcomes.

The three proposals below preserve the user's requested subjects: browser Stockfish,
a PLO study tool, and a Lacoste Polo Factory-style immersive experience. They are
task briefs, not copies of the source products, brands, text, art, or proprietary
data.

## Research signals carried into the tasks

- The Awwwards archive contributes fullscreen composition, WebGL/3D, transitions,
  scroll narrative, responsive design, unusual navigation, microinteractions, and
  robust visual fallback patterns. Live detections and Awwwards editorial tags remain
  separate evidence layers in the accompanying CSVs.
- The [State of JavaScript 2025 library results](https://2025.stateofjs.com/en-US/libraries/)
  make Vite a pragmatic baseline: the survey reports it as both highly loved and the
  second most-used item. The same survey calls Next.js unusually polarizing, so these
  frontend-only tasks do not prescribe it without a product reason.
- Recent [Claude Code releases](https://github.com/anthropics/claude-code/releases)
  highlight nested/background work, searchable plugin catalogs, narrow-layout state,
  preserved sessions, safe mode, policy enforcement, clearer blocked/error recovery,
  and reduced idle rerenders. Those become visible UX ideas: resumable sessions,
  search/filter, explicit state provenance, graceful fallback, and efficient idle UI.
- Recent [Harbor releases](https://github.com/harbor-framework/harbor/releases)
  emphasize streaming runs, cost views, ATIF subagent trajectories, multi-step tasks,
  adapter parity, and failure fixes. Those become evaluation ideas: event timelines,
  deterministic replay, tool/UI parity, generated artifacts, and no silent failure.
- The local `landonorris-design-assets` reference supplies an asset taxonomy—not
  reusable content—covering GLB, KTX2, HDR, Rive, WASM, and fonts. The study commits
  only filenames, sizes, categories, and hashes; no proprietary bytes.

## Task A — Browser Chess Engine Arena

**Whole job.** A player completes and reviews a legal chess game against an in-browser
Stockfish opponent without a backend.

**Feasibility.** [Stockfish.js](https://github.com/nmrugg/stockfish.js) provides
browser WASM builds and UCI commands. Its
current guidance recommends the roughly 7 MB lite single-threaded build for most web
projects; the stronger multithreaded build is much larger and needs cross-origin
isolation headers. The task should therefore require a Web Worker and a single-threaded
WASM fallback, not assume SharedArrayBuffer is available.

**Required observable behavior.**

1. New Game lets the player choose White, Black, or Random; engine strength; and a
   time control. Choosing Black makes a visible engine opening move.
2. Pointer/touch drag and click-click keyboard-accessible movement share one legal
   move model. Legal destinations appear after selection; illegal drops restore the
   piece and explain why without changing the move list.
3. Castling, en passant, promotion choice, check, checkmate, stalemate, repetition,
   insufficient material, resignation, and flag fall produce correct visible states.
4. Stockfish runs outside the UI thread. While thinking, the board remains interactive
   enough to open settings and the clocks remain smooth; stale engine answers from a
   superseded game are ignored.
5. A review rail shows SAN moves, current ply, last move, captured material, evaluation,
   and a principal-variation line. Arrow keys step through history without mutating the
   finished game.
6. Download PGN exports the actual game with regenerated date, result, colors, time
   control, and engine-strength headers. Importing that PGN reconstructs the same final
   position and review timeline or reports a line-specific parse error.
7. The compact layout moves controls below the board, enlarges touch targets, and
   preserves a square board. Reduced motion removes piece tweening but keeps origin and
   destination legible.
8. If WASM fails to load, an explicit recovery panel offers Retry and local two-player
   mode; it never pretends an engine move occurred.

**Useful end state.** A completed, interoperable PGN plus a reviewable game timeline.

**Do not grade.** The framework name, component structure, CSS methodology, or a raw
dependency string. Grade gameplay through real board interactions and inspect the PGN.

## Task B — Four-Card PLO Decision Lab

**Whole job.** An adult learner studies a deterministic four-card Pot-Limit Omaha
decision set, drills selected spots, and exports a reproducible training session. It
is educational only: no wagering, deposits, prizes, or real-time-assistance claims.

The [GTO Wizard PLO product reference](https://gtowizard.com/plo/) advertises
browser-based presolved study, side-by-side ranges,
custom stack/rake/sizing inputs, full-hand or single-spot practice, instant strategy
feedback, hints, filters, and session statistics. The task recreates that interaction
model with bundled fixture solutions; it does not claim to solve arbitrary poker trees
or copy proprietary strategy data.

**Required observable behavior.**

1. Study setup selects cash or tournament, position, effective stack, rake profile,
   street, board texture, and allowed action sizes. Field bounds and cross-field errors
   appear beside the exact control and block an invalid drill.
2. The study view shows four hole cards, board, pot, stacks, action history, and a
   frequency-weighted strategy. Fold/call/raise segments share colors across the action
   bar, combo list, and range summary.
3. Filters for suits, pairing, connectedness, hand class, draw class, and action update
   a visible matching-combo count. Clearing filters restores the same ordering.
4. A drill can cover one spot or a full bundled hand. The learner commits an action and,
   only then, sees mixed-strategy frequency, EV delta, explanation, and the next node.
   A seeded randomizer makes session replay deterministic.
5. A mistake filter, streak, accuracy, cumulative EV loss, and per-texture breakdown
   update from the same canonical decisions. Undo removes exactly the latest answered
   decision and recomputes every linked statistic.
6. The range comparison view places hero and opponent summaries side by side and keeps
   the current board/action context visible. Narrow screens switch to explicit tabs,
   not two unreadably compressed matrices.
7. Export produces a versioned JSON drill containing setup, source-fixture identity,
   filters, seed, ordered decisions, expected frequencies, EV deltas, and a regenerated
   `exportedAt`. Import round-trips it exactly and rejects unknown versions, bad card
   duplication, out-of-range stacks, and impossible action sequences per field.
8. Keyboard shortcuts cover primary actions, hint, next decision, range tab, and undo;
   touch controls expose the same state changes. Color is never the only strategy cue.

**Useful end state.** A portable drill/session JSON that reproduces the learner's exact
spot selection and decisions.

**Do not grade.** Solver strength or proprietary GTO correctness. Grade internal fixture
consistency, interaction integrity, validation, feedback timing, and artifact parity.

## Task C — Immersive Polo Atelier

**Whole job.** A visitor moves through a stylized virtual atelier, completes the stages
of constructing an original polo design, and downloads a portable design receipt.

**Evidence-backed technical profile.** The current
[Polo Factory response](https://members-play.lacoste.com/polo-factory-experience/us/en/)
contains Vue scoped
style markers and Vite-style module assets; Wappalyzer detects Firebase; Awwwards labels
the experience WebGL, Three.js, fullscreen, and 3D. Its HTML also exposes a fixed
fullscreen WebGL wrapper, responsive/touch rules, locale routing, loading UI, CSS
transitions, and a registration flow. These are observations, not a license to copy
Lacoste assets, trademarks, product text, or customer forms.

**Required observable behavior.**

1. A load sequence reports named stages—shell, scene, textures, interactions—and can
   retry a failed stage. Skip 3D enters a designed DOM fallback with the same atelier
   choices and final artifact.
2. The visitor advances through fabric, weave, dye, cut, stitching, and emblem stations.
   Each station has one signature direct manipulation, an instruction, progress, and a
   visible before/after effect on the same garment model.
3. Orbit/pan is constrained to preserve composition. Pointer, keyboard, and touch paths
   reach equivalent station actions; focus never disappears inside the canvas.
4. Scene transitions move the camera and interface as one causal event. Reduced-motion
   mode crossfades or snaps while retaining station orientation and progress evidence.
5. Materials use lightweight 3D and runtime assets where available: GLB/glTF geometry,
   compressed GPU textures, an HDR environment, optional Rive instruction UI, and a
   worker/WASM decoder. Every advanced path has a timeout and semantic fallback.
6. A compact screen uses a guided stepper and gesture-safe bottom sheet rather than a
   scaled desktop HUD. Landscape and portrait preserve the garment and current control.
7. Locale switching preserves the authored design and current station. Form validation,
   if present, uses fictional local data and never transmits personal information.
8. Finish produces a JSON design receipt and a PNG preview generated from the current
   garment state. JSON includes schema version, material ids, color values, station
   choices, camera-neutral thumbnail metadata, and regenerated timestamp; import
   reconstructs the design or reports field-specific errors.

**Useful end state.** An original design receipt and preview, not a passive marketing
landing page.

**Do not grade.** Brand imitation, proprietary asset reuse, or hidden implementation
details. Grade the visual scene, state transitions, fallback parity, direct manipulation,
responsive transformation, and exported design.

## Shared authoring constraints

- Start with illustrative data but no pre-completed credited outcome.
- Use one canonical state model for UI actions, WebMCP actions, persistence, and export.
- Every promised gesture must have a browser-observable criterion and an alternate input.
- Measure loading, blocked, invalid, empty, interrupted, and restored states rather than
  grading only the happy path.
- Require real artifacts and inspect their shape, values, ordering, regenerated timestamps,
  and import behavior.
- Keep visual references advisory. Task instructions own exact behavior, and evaluation
  never reads source code to infer success.
