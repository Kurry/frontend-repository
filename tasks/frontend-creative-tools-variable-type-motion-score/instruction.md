<summary>
Build a frontend-native kinetic typography editor for authoring responsive 12-second variable font title sequences using Tailwind CSS 4.3.2. The app relies on framework-agnostic synthesis of a web preview, code output, branch management, task timeline, schema rendering, deterministic property prediction, and results review, all driven by a shared responsive orchestration state over a bundled variable font fixture.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Text block stage —
- Blocks drag, resize, and rotate within a fixed stage safe area; the block geometry binds content, semantic role, alignment, max lines, and responsive anchor using normalized millionths per viewport.
- Keyboard nudge/resize/rotate actions and mobile numeric sheets produce identical state and evidence compared to pointer gestures.
- Block overlap is permitted only with an explicitly declared stacking relationship.
Feature: Variable-axis inspector —
- Selecting a block exposes its base variable font axes (wght 200–900, wdth 75–125, slnt -12–0, opsz 10–72) and per-axis keyframes.
- Sliders, numeric inputs, multi-selection deltas, and curve handles strictly clamp to exact font bounds.
- Interpolation obeys declared linear, ease-in, ease-out, ease-in-out, or cubic-bezier rules, quantized to 1/1000 precision at 24-fps.
Feature: Timeline and keyframe score —
- Each block declares enter, hold, emphasis, and exit intervals; axis, opacity, position, rotation, and tracking curves all share one timeline.
- Keyframes drag and snap to frame or semantic beat markers, can be copied/pasted, and retimed as a group.
- Crossing keyframes strictly reorder only after an explicit confirmation; duplicate property/time keys merge according to a declared rule.
Feature: Semantic emphasis choreography —
- The 12-second fixture (288 frames) contains five semantic message beats that declare which block is primary, supporting, or hidden for each interval.
- A deterministic prominence score calculates emphasis based on contrast, size, position, opacity, and axis weight.
- A semantic lane highlights prominence ties, priority inversions, or missing emphasis, without auto-correcting the visual score.
Feature: Responsive line-break and anchor maps —
- Desktop (1440px), tablet (768px), and mobile (375px) modes provide fixed containers with deterministic font metric and line-break tables.
- A single score handles responsive layouts via viewport overrides for geometry, font size, max lines, and selected keyframes, inheriting by property with visible provenance.
- Conflicting overrides trigger an explicit resolution requirement; a linked map visualizes line breaks and clipping across viewports and scrub times.
Feature: Playback and reduced-motion design —
- Logical playback provides scrub, play/pause, frame step, beat loop, and playback speed controls.
- A separately authored reduced-motion score maintains reading order of all semantic beats via static or crossfade-only transitions without spatial or axis animation beyond declared limits.
- Toggling reduced-motion preference swaps the active score for preview, without destroying or overriding canonical full-motion keyframes.
Feature: Branch, compare, and validation —
- The user can fork score branches, comparing stage geometry, keyframes, sampled values, wraps, prominence, and fallbacks in a linked view.
- A branch merge interface resolves differences by block, property, or time range.
- The validator checks axis bounds, stage/safe clipping, line counts, block overlap, curve continuity, beat coverage, contrast, full/reduced durations, and export parity; zero validation failures enables score approval, freezing checksums.
Feature: Responsive editor and artifacts (useful end state) —
- The desktop layout presents the stage, timeline/curves, block/axis inspector, and multi-viewport/validator rail simultaneously.
- Mobile editing adapts into a preview, block cards, property sheets, a vertical beat timeline, viewport/reduced-motion drawer, and frame controls.
- Export produces a canonical JSON payload, CSS custom properties/keyframes with media queries, standalone SVG storyboards for specified times/viewports, and a Markdown motion/accessibility spec.
- Artifact export re-exports the identical bytes/semantics except for the exportedAt timestamp.
- Importing an exported JSON artifact atomically restores authored and derived states, rejecting corrupted, mismatched, or cycle-bearing documents.
</core_features>

<visual_design>
- Inspecting selected, keyed, interpolated, clipped, wrapped, overlapped, prominence, inheritance, override, full/reduced, branch, or finding states consistently maintains visual hierarchy and legibility.
- The UI handles states like prominence ties, missing beats, and clipping gracefully without layout breakage or overlap unless explicitly authorized.
- Overrides, inheritance, and unverified data carry visible provenance tags or visual distinction.
</visual_design>

<motion>
- Interactions like add/retime/curve editing, scrubbing, looping, and viewport transitions provide instant visual updates.
- Toggling reduced-motion preference updates the causal preview and reduced-motion editor without layout shifts.
- Any direct manipulation of the stage or timeline correctly triggers a visible layout/prominence/validation loop within 100ms.
- Connected views and derivatives settle accurately within 500ms, and export/import operations complete within 2s without dropped interactions or stale states.
</motion>

<requirements>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded beyond the initial flawed Northstar VF fixture.
- A single user edit MUST flow fully through stage, keyframes, timeline, wrap, validation, and artifact export via a single robust orchestration reducer.
- Keyboard and numeric exact-value paths MUST converge to identical events as pointer direct-manipulation paths.
- Cancelled actions, invalid imports, and transient hover states MUST restore the prior clean state without mutating persistence or zeroing history.
- The exported artifact MUST adhere to the exact format contract outlined in the specs, retaining the fixture, branch DAG, keyframes, semantic beats, and artifacts exactly, and regenerating exportedAt.
- The frontend logic MUST handle exact boundary maximums and minimums (200 blocks, 5000 keyframes, 24-fps across 288 frames) without degradation or non-local network dependencies.
- Code dependencies must be installed locally via npm; do not load scripts or styles via CDN.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
