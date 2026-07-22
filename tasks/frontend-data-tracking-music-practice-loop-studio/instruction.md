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

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: practice-loop; tempo-point; take-event
- Editor properties: name; start; end; repetitions; rules; bpm; measure; beat; event-type
- Editor operations: select; add; delete; update_property; set_content; switch_mode; preview
- Editor modes: score; tempo; takes; schedule
- Entity: practice-item
- Entity operations: create; select; update; delete; toggle
- Entity fields: entity-type; name; range; repetitions; rules; day; status
- Session operations: start; pause; resume; stop; restart
- Artifact operations: export; import; copy
- Export formats: practice-dossier-json; practice-events-csv; score-overlay-svg; practice-schedule-ics; practice-summary-md
- Import modes: practice-dossier-json

Mechanics exclusions:
- Score brushing, range resizing, curve dragging, scrubbing, and keyboard navigation stay Playwright-observed
- Metronome timing, playback cadence, and animation endpoints stay Playwright-observed
- Native downloads, file-picker import, and clipboard contents stay Playwright-observed; WebMCP returns no artifact contents

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
