import os
import json

with open('tasks/frontend-creative-tools-shapeshift-grid/task.toml', 'r') as f:
    task_toml_template = f.read()

task_toml = """[task]
slug = "frontend-productivity-focus-soundscape-automation-mixer"
name = "Focus Soundscape Automation Mixer"
summary = "Mix ambient audio sources, automate gain/filters over time, run focus sessions, and export JSON/WAV."
archetype = "productivity"
genre = "hard browser app/Web Audio tool"
target_user = "Knowledge workers designing a bounded ambient sound profile for timed focus sessions"
primary_interaction = "Direct manipulation, timeline automation, audio synthesis"
difficulty = "advanced"

[artifacts]
oracle_app = true
reference_screenshots = false

[dependencies]
npm = true

[contract]
requires_webmcp = true
"""

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/task.toml', 'w') as f:
    f.write(task_toml)

instruction_content = """<summary>
Build a Focus Soundscape Automation Mixer using React, Tailwind CSS 4.3.2, and Web Audio API. The app is a deterministic ambient sound mixer and focus timer that allows the user to mix deterministic white/pink/brown noise and two oscillator voices, position layers on an XY pad, draw gain/filter automation over a 25-minute timeline, preview the live spectrum, run a timed focus session, log interruptions against the automation timeline, compare two sound profiles, and export a portable preset plus deterministic 10-second WAV preview. State is strictly in-memory (no localStorage).
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

<user_flows>
- Build → audition → automate → repair clipping → focus/interruption → compare → render/export → reset → import → exact reconstruction.
</user_flows>

<edge_cases>
- Try duplicate source, XY bounds/overlap focus, crossed filter, out-of-range link, ninth/duplicate automation point, clip boundary, autoplay resume, stale recipe, malformed import → named recovery.
</edge_cases>

<visual_design>
- Inspect inactive, selected, overlapping, automated, playing, clipping, paused, compared, and certified states to ensure audio hierarchy remains legible.
- The design should convey a "hard browser app/Web Audio tool" aesthetic, dense and information-rich but logically sectioned (Patch bay, XY Pad, Filters, Timeline, Analyser, Guard, Focus Clock).
</visual_design>

<motion>
- Causal numeric/audio endpoints agree: Mix/filter/automate, play/analyse, focus/pause, compare, and repeat reduced.
- Reduced motion uses a low-frequency static spectrum summary and numeric peak/RMS rather than continuous animation.
- Visual sampling stops when audio stops.
</motion>

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
- Serve strictly from npm via Vite proxy/bundler. No CDN scripts or third-party web fonts.
</requirements>

<webmcp_action_contract>
<module_spec id="structured-editor-v1">
</module_spec>
<module_spec id="entity-collection-v1">
</module_spec>
<module_spec id="artifact-transfer-v1">
</module_spec>
</webmcp_action_contract>
"""

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md', 'w') as f:
    f.write(instruction_content)

os.system('rm -rf tasks/frontend-productivity-focus-soundscape-automation-mixer/solution/app/node_modules')
os.system('rm -rf tasks/frontend-productivity-focus-soundscape-automation-mixer/solution/app/.gitignore tasks/frontend-productivity-focus-soundscape-automation-mixer/solution/app/eslint.config.js')
os.system('touch tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/core_features/core_features.toml')
os.system('touch tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/visual_design/visual_design.toml')
os.system('touch tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/motion/motion.toml')
os.system('touch tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/technical/technical.toml')

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/solution/app/package.json', 'w') as f:
    f.write("""{
  "name": "focus-soundscape-automation-mixer",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "vite --host 0.0.0.0 --port 3000",
    "verify:build": "vite build",
    "test:e2e": "playwright test",
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "4.3.2",
    "lucide-react": "^0.473.0",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "@playwright/test": "1.61.0",
    "vite": "^6.0.7",
    "@tailwindcss/vite": "4.3.2"
  }
}""")
