# Stop-Motion Exposure Sheet

<summary>
Build a hard browser app/frame sequence and take planner for stop-motion animation. The user blocks shots into frame exposures, stages abstract subjects and props, aligns dialogue/music cue fixtures, plans holds and replacements, records deterministic capture events, compares alternate takes, detects continuity and timing defects, recovers missing/duplicate frames, approves a cut, and exports a reproducible animation packet.

The app uses entirely in-memory state (no localStorage or backend), and allows exporting and importing project data via files. Built with React and Tailwind CSS 4.3.2.
</summary>

<core_features>
Exposure sheet and ripple editing: Rows represent subject, prop, camera, lighting, dialogue, and audio cue tracks; columns are frames. Create/split/join/trim/move exposure ranges, holds, blanks, and replacements. Ripple and overwrite modes have explicit previews; keyboard range commands and mobile frame sheets equal pointer edits.
Stage and onion skins: Place/transform abstract objects (vector shapes) in shot-local normalized coordinates with position, rotation, scale, depth, facing, and visibility. Configurable previous/next onion skins show exact frame offsets. Camera crop and stage bounds transform predictably after shot resize.
Cue alignment and timing: Fixture waveform envelopes and dialogue syllable markers align to frames. Drag cues or ranges and see frames, seconds, shot duration, holds, and downstream boundaries update. Frame-rate conversion is out of scope; all timing uses exact integer frames (12 fps).
Prop and pose continuity: Track owner, position class, orientation, damage/state, visibility, and pose tags across frame intervals and shot boundaries. Selecting a conflict highlights prior/current frame, exposure cells, take evidence, cue, and resolution choices.
Capture event ledger: Advance the logical clock and record capture, retake, mark-missing, invalidate, or restore events with stable ids and source frame. Events are append-only and idempotent. Planned exposure and actual capture remain distinct; duplicate capture identity never silently overwrites.
Take branches and cut approval: Fork takes, replace frame ranges, compare flicker/difference overlays and timing/continuity deltas, then merge per range/object. Approve a cut revision; later exposure, transform, cue, or capture changes mark it stale. Reapprove records a new immutable revision.
Export/Import artifacts: stop-motion-project.json schema/version, fixture hash, frame rate, shots, ranges, objects/transforms, cues, continuity facts, takes, capture events, approvals, and lineage. exposure-sheet.csv one row per track/range with shot, frame start/end inclusive, type, object/cue, take, and state. capture-manifest.json ordered expected frames, accepted capture ids/hashes, missing/invalid state, take source, and cut revision. timing-map.svg shots, exposure ranges, cues, continuity markers, and selected frame with accessible labels. cut-notes.md shot durations, take choices, missing frames, waivers, cue/continuity notes, and revision provenance.
</core_features>

<visual_design>
Linked Views: Desktop links stage, exposure grid, cue track, continuity inspector, take compare, and event ledger. Tablet uses synchronized panes. Mobile uses shot strip, focused stage, frame-range sheet, cue stepper, continuity cards, and take/recovery queue with complete actions.
Distinctions: Inspect planned/captured/missing/invalid, hold/blank/replacement, onion offsets, cue/continuity, take/delta, stale/approved states -> distinctions must stay legible visually.
Responsive Studio: Must gracefully resize between 1440px (desktop), 768px (tablet), and 375px (mobile). Mobile target hit areas must be at least 44x44 pixels with no overflow.
</visual_design>

<motion>
Causal motion: Ripple edits push downstream ranges/cues; onion skins and take deltas interpolate from exact source frames.
Reduced motion: Respect prefers-reduced-motion reduce by replacing transitions with instant updates, keeping endpoints and values intact.
</motion>

<requirements>
Deterministic Fixture: Start with an original 42-second project at 12 fps with 6 shots, 504 frames, 5 abstract subjects, 9 props, 74 exposure cells, 17 cue markers, 3 takes, 2 missing frames, 1 duplicate capture id, 1 continuity mismatch, and deterministic logical capture time. (504 frames across 6 shots: roughly 84 frames/shot, adjust as needed).
Browser-Observable Behavior: No hidden state or local storage. File imports must strictly validate inputs (rejecting overlapping ranges, bad transforms, frame bounds, dangling cues, duplicate capture ids, impossible event order, derived timing, or forged approval hashes). Form submissions must not be the only way to interact. Keyboard and pointer paths must be fully supported. Focus, announcements, and exact matching semantics are required.
Strict Data Shape: Data models (JSON/CSV/SVG/MD) must contain exact mappings as detailed.
Libraries must be installed via local npm install, fetching from CDNs is not allowed. Built using Tailwind CSS 4.3.2.
</requirements>

<webmcp_action_contract>
window.webmcp_list_tools() -> returns list of available tools.
window.webmcp_invoke_tool(tool_name, args) -> executes tool and returns JSON string result.
</webmcp_action_contract>
