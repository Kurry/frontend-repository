# Music Practice Loop Studio

<summary>
A data tracking and productivity app for instrumentalists to plan and review bounded practice loops against an abstract score.
The signature interaction is brushing measures on a score strip and reshaping a tempo curve while loop cards, metronome timeline, mistake heatmap, take compare, session queue, mastery evidence, schedule, and artifacts update together. This is a good-app genre and all state remains in-memory only (NO localStorage). No remote CDNs; all assets and dependencies must be local npm packages. Built with Tailwind CSS 4.3.2.
</summary>

<core_features>
Score range and loop editor: Users brush contiguous measure ranges, snap to phrase/section boundaries, and create loops with name, objective, hand/voice tag, repetitions, success rule, and notes. Loops may overlap. Keyboard controls are equal to pointer brushing.
Tempo-ramp composer: Each loop has keyframes by repetition or logical minute, with BPM, step/linear ramp, backoff-on-error, and maximum attempts. Values stay within fixture min/target bounds. A curve editor and table share state.
Logical session runner: A session queues loops and advances count-in → playing → awaiting self-mark → repeat/backoff/advance → break → complete. Play/pause/restart/skip-allowed and logical metronome ticks are deterministic. Session events are append-only.
Mistake and annotation alignment: Take events bind measure, beat rational, category, severity, source, and optional note. Users drag misaligned fixture events along a measure/beat lane or use numeric selectors; moving one preserves original timestamp/provenance. Multiple events may share a beat. Missing versus no-error measures are distinct.
Take comparison: Two takes compare with synchronized score cursor, event lanes, tempo trace, restarts, and loop boundaries. Scrubbing a beat highlights both takes and current score/heatmap cells.
Error patterns and loop adaptation: Users group events into patterns by measure range/category/context, then bind patterns to loops. A deterministic evaluator computes eligible attempts, success runs, recurrence after tempo increase, and transfer to full-section takes. Suggestions may shrink/expand loop, lower/raise BPM, change repetitions, or schedule review; acceptance creates a loop revision.
Schedule and performance plan: Loop reviews occupy a 21-day calendar with due date, spacing stage, estimated minutes, and prerequisites. Dragging tasks previews daily load and section coverage. A performance plan orders full-section/run-through checkpoints.
Responsive studio and artifacts: Desktop shows score/loop ranges, tempo/session timeline, take/error compare, and pattern/schedule rail. Mobile becomes score mini-strip, loop/range/tempo sheets, session controls, vertical take/event lineage, heatmap drilldowns, and schedule cards. Export produces canonical JSON, CSV session/take/event ledger, SVG annotated score/tempo/heatmap report, and ICS practice schedule; import reconstructs state exactly.
</core_features>

<visual_design>
Inspect loop/overlap/phrase/meter, keyed/ramped/backoff, active/paused/incomplete, aligned/misaligned/error/no-error/missing, due/approved states. Hierarchy must remain legible.
</visual_design>

<motion>
Brush/resize, curve/tempo cursor, play/pause/backoff, align/scrub takes, adapt/schedule, then repeat reduced. Causal endpoints and values must agree.
</motion>

<requirements>
AC-01 Range/tempo, run/recover session, align/label/compare takes, pattern/adapt, schedule/approve, and export → all positions/times/files agree.
AC-02 Inspect loop/overlap/phrase/meter, keyed/ramped/backoff, active/paused/incomplete, aligned/misaligned/error/no-error/missing, due/approved states → hierarchy stays legible.
AC-03 Brush/resize, curve/tempo cursor, play/pause/backoff, align/scrub takes, adapt/schedule, then repeat reduced → causal endpoints and values agree.
AC-04 Interleave UI/WebMCP loop/tempo, clock/session, take/event/alignment, pattern/evaluator, schedule/approval, history, and transfer actions → ids, rationals, seconds, checksums, files match.
AC-05 Define loop → tempo → practice/recover → annotate/align → compare → pattern/adapt → schedule/approve → export → reset/import.
AC-06 Test first/last measure, meter-cross mode, rational beat boundary, min/target BPM, duplicate keyframe, reload timer, incomplete take, nonmonotonic anchor, missing vs no-error, zero eligible denominator, stale approval, forged import → named recovery.
AC-07 Complete at 1440/768/375 → score/range/tempo/session/take/heatmap/schedule mobile flows retain every action, 44-pixel targets, no overflow.
AC-08 Select ranges, edit tempo, control session/metronome, align/navigate events, compare, accept suggestion, schedule/approve, and export without pointer → focus/state match.
AC-09 Operate 2,000 measures, 10,000 loops, 100,000 events, and 5,000 sessions → interactions remain responsive and stale heatmap/evaluator work cancels.
AC-10 Trigger every range/meter/tempo/session/alignment/evidence/schedule conflict → copy names exact loop/measure/beat/BPM/take/event/denominator and recovery.
AC-11 Move one beat-aligned error or tempo point → playback/session timing, compare, pattern evidence, loop revision, schedule, approval, and artifacts remain coherent.
AC-12 Verify rational positions, tempo/time math, event state, alignment, denominators/adaptation, CSV/SVG/ICS → practice semantics are exact.
AC-13 Interleave active-session reload, backoff, event re-alignment, loop revision, schedule/approval staleness, undo plan-only, export/import → events, rationals, lineage, and files round-trip exactly.
Must use Tailwind CSS 4.3.2. All dependencies must be local npm packages (no CDN allowed).
</requirements>

<webmcp_action_contract>
<module name="query_fixture">
  <description>Returns the deterministic fixture.</description>
</module>
<module name="get_state">
  <description>Returns current application state.</description>
</module>
<module name="set_state">
  <description>Overrides application state.</description>
</module>
<module name="reset">
  <description>Resets all state to initial.</description>
</module>
</webmcp_action_contract>
