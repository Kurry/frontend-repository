import os

instruction_content = """<summary>
Build a Focus Soundscape Automation Mixer using React, Tailwind CSS, and Web Audio API. The app is a deterministic ambient sound mixer and focus timer that allows the user to mix deterministic white/pink/brown noise and two oscillator voices, position layers on an XY pad, draw gain/filter automation over a 25-minute timeline, preview the live spectrum, run a timed focus session, log interruptions against the automation timeline, compare two sound profiles, and export a portable preset plus deterministic 10-second WAV preview. State is strictly in-memory (no localStorage).
</summary>

<core_features>
Feature: Audio graph patch bay —
- Five sources are available: seeded white, pink, and brown noise plus two sine oscillators (Oscillator A and Oscillator B).
- Source cards drag into active/inactive racks or toggle by keyboard/mobile controls. Active sources route source→filter→gain→master→analyser/destination.
- The visible patch graph reflects real node state and selection. Duplicate source activation is forbidden; disabling a source disconnects it and cancels only its scheduled automation while preserving authored points.

Feature: Spatial XY mix pad —
- Five source pucks move on a bounded XY pad: X controls stereo pan -1..1 and Y controls source gain 0..1.
- Keyboard arrows move 0.05 and Shift 0.1; numeric fields and touch share the same handler. Pucks may overlap but remain separately focusable through a cycle command.
- Mono WAV rendering ignores pan by declared downmix while preset/live stereo retain it.

Feature: Filter and difference-frequency controls —
- Each source has low/high-cut handles on a logarithmic frequency rail with invariant low < high (80–12,000 Hz).
- Oscillator A and B base range is 80–400 Hz. Oscillator B can link to A at a 0–30 Hz difference, causing its base frequency to follow A; unlink preserves current absolute frequency.
- Values outside range, crossing filters, or oscillator result above 400 Hz remain preview-only.

Feature: Automation timeline —
- For gain, pan, low-cut, and high-cut, the user creates up to eight control points over a 25-minute normalized session timeline.
- Points drag in time/value, reorder only by time, and interpolate linearly. Exact-time duplicates merge by latest explicit edit.
- A loopable 60-second audition maps normalized automation proportionally without changing canonical times.

Feature: Live analyser and causal visualization —
- Waveform, FFT bars, source contribution strips, and loudness meter derive from the active audio graph.
- Selecting a source isolates its visual contribution without soloing audio unless explicitly toggled.
- Visual sampling stops when audio stops.

Feature: Safety and clipping guard —
- The master gain and summed peak must stay under deterministic fixture thresholds.
- The guard shows contributing sources and exact overage, blocks preset certification/WAV render, but does not silently lower levels.
- A limiter preview demonstrates bounded output without mutating canonical gains; enabling the limiter is an explicit preset property.

Feature: Focus session and interruption coupling —
- A deterministic 25-minute focus clock follows automation; pause opens a required interruption sheet (internal|external|urgent) with note and recovery (resume|end|restart).
- Interruption markers appear on automation and session ledger. Resume preserves elapsed normalized time; restart creates a new attempt.
- Audio suspends on pause/end and resumes through explicit user action.

Feature: Comparison and artifact export —
- Two named profiles compare graph activation, puck positions, filter/oscillator values, automation curves, peak/RMS, and interruption outcomes.
- Export produces a JSON document matching the Artifact contract and a deterministic 10-second mono WAV preview (44.1-kHz, RIFF/WAVE PCM16 mono) derived from the first 10 normalized seconds.
- Import reconstructs the exact state and recalculates atomically.

Artifact Contract (FocusSoundscapePreset JSON):
- schemaVersion: exactly "focus-soundscape/v1"
- recipeVersion, seed, sampleRate (44100).
- sources: array of objects with id, active, gain, pan, filterLow, filterHigh, freq (for oscillators), linkDiff (for Osc B).
- automation: tracks and points. Points have time (0-1500) and value. Maximum 8 points per parameter/source.
- limiterEnabled (boolean), masterGain (0-1).
- profiles: optional array of two profiles.
- sessions: focus attempts and interruption events.
- exportedAt: UTC string.
</core_features>

<visual_design>
- Inspect inactive, selected, overlapping, automated, playing, clipping, paused, compared, and certified states to ensure audio hierarchy remains legible.
- The design should convey a "hard browser app/Web Audio tool" aesthetic, dense and information-rich but logically sectioned (Patch bay, XY Pad, Filters, Timeline, Analyser, Guard, Focus Clock).
</visual_design>

<motion>
- Causal numeric/audio endpoints agree: Mix/filter/automate, play/analyse, focus/pause, compare, and repeat reduced.
- Reduced motion uses a low-frequency static spectrum summary and numeric peak/RMS rather than continuous animation.
- Visual sampling stops when audio stops.
</motion>

<user_flows>
- Build → audition → automate → repair clipping → focus/interruption → compare → render/export → reset → import → exact reconstruction.
</user_flows>

<edge_cases>
- Try duplicate source, XY bounds/overlap focus, crossed filter, out-of-range link, ninth/duplicate automation point, clip boundary, autoplay resume, stale recipe, malformed import → named recovery.
</edge_cases>

<responsiveness>
- Complete at 1440/768/375 → mobile audio/automation/focus flow retains every action, 44-pixel targets, and no overflow.
- Mobile transforms into source carousel, full-screen XY pad, automation point list + curve, analyser card, and focus/interruption sheet.
</responsiveness>

<accessibility>
- Activate/move sources, set filters/frequency, edit automation, operate clocks, resolve clipping, compare, and export without pointer → focus/value/state match.
</accessibility>

<performance>
- Move pucks/points while audio/analyser runs → responsive controls, one active audio graph, stale schedules/visual loops cancelled on stop/reset.
</performance>

<writing>
- Trigger constraints → copy names exact source/parameter/time/value/peak/session rule and concrete recovery without health claims.
</writing>

<innovation>
- Move one puck → real audio graph, patch, analyser, metrics, compare, WAV hash, history, and artifact coordinate.
</innovation>

<requirements>
- NO localStorage or backend persistence. State must be entirely in-memory.
- Provide a robust WebMCP contract binding `window.webmcp_session_info`, `webmcp_list_tools`, `webmcp_invoke_tool`.
</requirements>
"""

os.makedirs('tasks/frontend-productivity-focus-soundscape-automation-mixer', exist_ok=True)
with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md', 'w') as f:
    f.write(instruction_content)
