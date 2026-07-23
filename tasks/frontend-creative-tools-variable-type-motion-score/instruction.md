# Variable Type Motion Score

<summary>
Build a framework agnostic kinetic typography editor for composing a responsive 12 second kinetic type title sequence. The user lays out text blocks, manipulates variable font axes, creates keyframes and easing segments, coordinates semantic emphasis, tests desktop, tablet, and mobile wraps, authors a meaningful reduced motion state, branches and compares scores, validates clipping, readability, and timing, and exports exact CSS, SVG storyboard, and motion spec artifacts.
</summary>

<reference_screenshots></reference_screenshots>

<core_features>
Begin from a genuinely clean state where no authored work, completion, approval, export, or success evidence is preseeded.
Each milestone becomes observable only after its real user interface action with exact before and after entity and event count deltas.
Text blocks drag, resize, and rotate within a fixed stage safe area and bind content, semantic role, alignment, maximum lines, and responsive anchor.
Keyboard nudge, resize, and rotate and mobile numeric sheets equal pointer gestures.
The fictional bundled Northstar VF font exposes weight 200 to 900, width 75 to 125, slant negative 12 to 0, and optical size 10 to 72.
Each block has base axis values and per axis keyframes.
Sliders, numeric inputs, multi selection deltas, and curve handles clamp to exact font bounds.
Axis values interpolate using declared linear, ease in, ease out, ease in out, or cubic bezier rules and quantize to thousandths at 24 frames per second samples.
Blocks have enter, hold, emphasis, and exit intervals, while axis, opacity, position, rotation, and tracking curves share one timeline.
Keyframes drag and snap to frame and beat markers, copy, paste, and retime as a group.
Crossing keyframes reorder only after explicit confirmation, and duplicate property or time keys merge under a declared rule.
Dragging axis keyframes or text blocks across the beat timeline updates live preview, axis curves, line break map, container geometry, emphasis order, accessibility fallback, branch diff, validator, and artifacts together in one transition, with the previous score state gone from every surface.
Five message beats declare which block should be primary, supporting, or hidden at each interval.
Contrast, size, position, opacity, and axis weight contribute to a deterministic prominence score.
The semantic lane highlights ties, inversions, or missing emphasis.
Semantic emphasis must never violate document object model focus reading order.
Desktop, tablet, and mobile viewports have fixed containers and font metric tables.
Authors may share a score or create viewport overrides for geometry, font size, maximum lines, and selected keyframes.
A linked map shows line breaks and clipping at all viewports and scrub times.
Container geometry changes recompute the line break map and anchor positions deterministically, and responsive reflow never strands an anchor on the wrong line.
Users fork score branches, compare stage geometry, keyframes, curves, sampled values, wraps, prominence, and fallback, then merge by block, property, or time range.
Branching the score copies keyframe and emphasis state, and edits on a branch never rewrite the trunk.
The branch diff compares two named branches with per keyframe deltas.
The validator checks axis bounds, stage and safe clipping, line count, block overlap, curve continuity, beat coverage, contrast fixture values, full and reduced duration, and export parity.
Approving a score with an open blocking finding is blocked with a named reason and zero mutation.
Rapid double keyframe of the same beat produces exactly one keyframe.
</core_features>

<visual_design>
Desktop shows stage, timeline and curves, block and axis inspector, and multi viewport and validator rail.
Mobile editing uses preview, block cards, property and keyframe sheets, vertical beat timeline, viewport and reduced motion drawer, and frame controls.
The full canonical flow at the stated mobile viewport functions without page level overflow or sub 44 pixel targets.
Error copy identifies the field, rejected value or rule, and recovery action, and correcting the value clears only the corresponding error.
</visual_design>

<motion>
Logical playback supports scrub, play and pause, frame step, beat loop, and speed.
Every scored transition states its variable axis interpolation path, duration, and easing explicitly.
Playback timing is beat quantized by the stated model.
Reduced motion is a separately authored static or crossfade only score that preserves all semantic beats in reading order without spatial or axis animation beyond declared limits.
Toggling preference changes the active score but not canonical full motion keys.
The accessibility fallback renders identical text content and emphasis hierarchy with movement replaced by declared non motion cues like weight, size, or underline.
Emphasis order in the fallback matches the animated version exactly.
</motion>

<requirements>
The 12 second fixture has six text blocks, five semantic beats, fixed glyph metrics and line break tables at 1440, 768, and 375 viewports, 24 frames per second logical playback, and one flawed starter score with clipping, axis overflow, and poor reduced motion order.
The useful end state is an interoperable downloadable artifact of the session actual work.
Export produces canonical JSON, CSS custom properties, keyframes, media query, standalone SVG storyboard sheets at required times and viewports, and Markdown motion and accessibility spec.
CSS, SVG, and Markdown artifacts compile live on every mutation.
Import acts as an atomic transaction over the same application programming interface shaped schema used by create, edit, and export.
Import validates all records and fields before commit, reporting every diagnostic together, and rejecting unknown enums, boundary violations, duplicate IDs, contradictions, stale derived values, and corrupted manifests with zero state mutation.
A successful import restores authored and derived state, and re export is semantically identical except for explicitly allowed regenerated metadata.
At maximum declared fixture of 200 blocks, 5000 keyframes, and three viewports, direct manipulation acknowledges within 100 milliseconds, linked views settle within 500 milliseconds, and export and import complete within 2 seconds without dropped interactions, stale views, layout jumps, console errors, page errors, or non local network dependence.
For every pointer or direct manipulation path, the keyboard or exact value path converges to one canonical event with identical stable IDs, derived values, linked view selection, history, WebMCP observable state, persistence, and export bytes.
Modal focus trap and opener return, live announcements, non color evidence, and causal parity must be implemented.
Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies.
Tailwind CSS 4.3.2 must be used.
Session personalization must utilize in memory JavaScript variables rather than browser storage APIs.
</requirements>

<integrity></integrity>

<delivery></delivery>

<webmcp_action_contract></webmcp_action_contract>
