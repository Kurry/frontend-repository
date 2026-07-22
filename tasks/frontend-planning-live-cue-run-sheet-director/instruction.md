<summary>
Build a Live Cue Run-Sheet Director. The app is a deterministic event-planning and run-sheet execution environment where an event lead arranges multi-lane cues, resolves resource conflicts, rehearses a time-scaled simulation, and calls a live deterministic show. It produces a portable run sheet JSON with cue topology, resources, actuals, annotations, and a valid ICS calendar export. The application is an entirely in-memory browser app with no backend, operating with a deterministic 70-minute fixture and test clock.
</summary>

<core_features>
Feature: Multi-lane cue timeline — Cue cards drag across five lanes (stage, audio, lighting, video, guest) and time, resize in five-second increments, and snap to dependency/fixed anchors; keyboard/mobile lane/time editors are equivalent. Each cue stores planned start/duration, owner, resource ids, trigger, and readiness checklist. Moving an upstream cue shifts unlocked after descendants; fixed and locked cues create visible slack/overlap conflicts instead.
Feature: Dependency and trigger graph — Connect cue ports to declare triggers. after waits for source completion plus offset, with shares start, fixed ignores upstream time but may retain a readiness dependency, and manual becomes eligible after prerequisites. Cycles, incompatible trigger combinations, multiple primary triggers, and missing source cues reject. Graph and timeline share selection.
Feature: Resource and owner conflict matrix — A lane-independent matrix maps time × crew/resource. Overlap conflicts identify exact cues and seconds. A cue may request exclusive or shared resource mode; fixture rules declare which resources support sharing. Reassigning owner/resource updates cards, matrix, conflict drawer, and printable run sheet. Hard capacity conflicts block certification.
Feature: Rehearsal and drift simulation — Rehearsal plays through planned cues with a deterministic accelerated clock. The user injects one fixture delay, hold, or early completion and watches actual/projected markers, slack, critical path, and end time update. Pause/resume/single-step preserve the active cue. Rehearsal writes a separate event ledger and never marks the live show complete.
Feature: Live show-call mode — Live mode presents oversized current/next cues, countdown/count-up, owner/resource checklist, GO, HOLD, SKIP, and COMPLETE controls. GO requires readiness or an explicit allowed override. The deterministic test clock controls time. Each call records planned/actual times and drift. Only eligible cues can go; one active exclusive stage cue is allowed.
Feature: Contingency branch director — Two cue groups have primary/contingency branches. A contingency becomes selectable only when its condition event occurs, such as delay above threshold or skipped guest cue. Choosing it atomically disables incompatible future cues, enables branch cues, reroutes dependencies, and updates projected end/resources. Prior actual events remain immutable.
Feature: Recovery, comparison, and reporting — The conflict drawer distinguishes plan conflict, readiness, late, missed anchor, blocked dependency, resource collision, and orphan branch. The lead saves two plan checkpoints and compares topology, timings, conflicts, critical path, and end. Undo/redo applies during planning/rehearsal setup; issued live events are immutable and use explicit corrective events.
Feature: Responsive transformation and artifact — Desktop shows timeline, graph, matrix, drift, and cue inspector. Tablet tabs graph/matrix. Mobile transforms into now/next show-call cards, vertical cue runway, owner/resource sheets, conflict drawer, and compact drift strip. Export/import preserves planning and live state and generates valid ICS plus black-and-white print run sheet.
</core_features>

<visual_design>
- State inspection: Inspect planned, selected, conflicted, rehearsing, held, live, late, branched, compared, and completed states. The visual hierarchy must stay legible across all states and conflicts.
- Clear indicators for slack, overlap conflicts, branch eligibility, drift, critical path, and missing dependencies.
</visual_design>

<motion>
- Move/propagate, rehearse, call, drift, branch, compare, and repeat reduced: Causality and final times/state agree. Dependency shifts, cue pulses, drift propagation, and branch reroute explain consequences. Reduced motion uses instant endpoints plus persistent changed-cue/time markers.
</motion>

<requirements>
The application must be implemented using Solid.js, Tailwind CSS 4.3.2, and Vite. All dependencies must be bundled locally with no external CDN references.
The artifact uses schemaVersion: "live-cue-run-sheet/v1".
It stores fixture id/hash/timezone, ordered cue records/lane/start/duration/owner/resources/trigger/locks/checklist, dependency graph, branch choice/state, plan checkpoints, rehearsal events, immutable live events/corrections, annotations, view/clock state, ordered planning history, derived conflicts/critical-path/projected-end/drift/checksums, ICS, and UTC exportedAt.
Cue ids/order are unique; planned times and durations use five-second increments inside program bounds.
Trigger graph is acyclic; each cue has at most one primary timing trigger and all sources exist.
Exclusive owner/resource intervals do not overlap in a certifiable plan; shared resources obey fixture capacity.
Live event sequence increments one; actual timestamps never decrease; GO/HOLD/SKIP/COMPLETE/correction transitions follow declared cue state machine.
Branch choices preserve prior actuals and disable/enable only declared fixture membership.
ICS has stable unique UIDs and timezone-aware ordered times for planned cues; print data uses deterministic cue/lane order.
Import rejects fixture mismatch, invalid time/trigger/cycle/resource/state/branch/event order, forged derived/ICS/print/checksum, or duplicate history, then recalculates atomically. Canonical re-export changes only exportedAt.
Start with a fictional 70-minute program with 24 cues, five lanes, six crew roles, eight shared resources, 18 dependency edges, two contingency branches, three fixed-time anchors, and four intentional conflicts. A valid plan must exist.
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
- TODO: product bindings pending module-owner review

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>

<webmcp_action_contract>
{
  "name": "export_artifact",
  "description": "Exports the JSON run-sheet artifact."
}
</webmcp_action_contract>
