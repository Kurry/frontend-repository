<summary>
Build a Podcast Episode Assembly Board using React, Zustand, and Tailwind CSS 4.3.2. The app supports multitrack timeline assembly, transcript and citation binding, chapter and narrative block authoring, mix automation, rights workflow, branch cuts, rendering with partial failure recovery, and artifacts export. The app runs completely in-browser with in-memory state, using bundled deterministic fixtures, providing exact XML/CSV/JSON/VTT/Markdown/SVG export and round-trip import capabilities. All npm dependencies must be local (no CDNs).
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Source bin and clip provenance —
- The app provides a Source Bin listing 24 deterministic source clips (Side Street Signals fixtures) with duration, speaker/type, transcript snippet, rights state, and immutable media hash.
- Users create timeline clip instances from source in/out ranges by dragging or clicking "Insert"; the source media state never mutates.
- Selecting a timeline instance highlights exact transcript tokens, rights record, source waveform, and other instances of the same source.
Feature: Multitrack timeline —
- The board has dialogue, music, ambient, and marker lanes supporting drag, trim, split, ripple move, nonripple move, gap close, mute, fade, and crossfade.
- Timeline operations use integer milliseconds and snap to transcript token boundaries, 10-ms increments, or chapter markers.
- Dialogue overlaps require declared cross-talk lanes; fades and crossfades obey clip bounds.
- Keyboard and mobile numeric operations equal pointer gestures for inserting, moving, trimming, splitting, and rippling clips.
Feature: Transcript and citation binding —
- Active dialogue instances derive transcript tokens inside source ranges.
- Editors can mark tokens as included/excluded, correct fixture errors with provenance, and bind exact spans to show-note claims/quotes.
- Ripple edits shift episode times without changing source times. Orphaned citations and words outside clip ranges block approval.
Feature: Chapters and narrative blocks —
- A narrative outline supports cold open, introduction, three chapters, transition, and credits blocks.
- Blocks define title, role, time range, required speakers/topics, and show-note summary.
- Reordering blocks moves their clip groups under explicit ripple preview. Chapters cannot overlap and must cover the approved timeline under declared intro/credit rules.
Feature: Loudness and mix automation —
- Clip gain and lane automation points produce deterministic sampled loudness/peak fixture values via linear interpolation.
- Curves drag on time/value axes.
- A validator checks dialogue target band, jump thresholds, clipping, music-under-dialogue ducking, and fade continuity.
Feature: Rights and approval workflow —
- Every included source requires allowed usage, territory fixture, attribution text, and expiry after publish date.
- Transcript/citation, editorial, rights, accessibility, and master approvals freeze exact cut checksums; any material edit marks affected approvals stale.
Feature: Branch cuts and partial render recovery —
- Users can fork cuts to compare clip membership/order/ranges, transcript, chapters, mix, duration, rights, and notes, then merge property/time-range conflicts.
- Render workflow produces master, transcript, chapters, artwork manifest, and RSS item.
- The first batch deterministically fails transcript timestamp and RSS enclosure checks; a retry failed-only preserves successful outputs and attempts.
Feature: Export and Import —
- Export produces Canonical JSON schemaVersion podcast-episode-package/v1, CSV EDL/transcript ledger, WebVTT transcript, RSS XML item, Markdown show notes/credits, and SVG timeline/loudness report.
- Import reconstructs state exactly and rejects invalid artifacts.
- Canonical re-export changes only exportedAt; CSV, VTT, RSS, Markdown, and SVG remain byte-identical.
</core_features>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
- The layout presents source/transcript, multitrack/outline, mix/rights, and approval/render rails in a cohesive desktop view.
- Hierarchy remains legible across source/instance/trim/split/gap/overlap/fade, token/citation, chapter, mix/finding, rights/stale/approved/render states.
- Color coding visually distinguishes dialogue vs. music vs. ambient lanes, active vs. stale approval states, and pass vs. fail validation findings.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
- Clip travel/trim/ripple, transcript/chapter shifts, and automation/loudness changes visually animate.
- Stale approval transitions and render retries explain cause with causal motion.
- Reduced motion retains before/after time/value/status deltas instantly without animation.
</motion>

<requirements>
Technical requirements (each line is an observable behavior the finished app must exhibit):
- Operates entirely in-memory (no localStorage) after initialization with starter fixtures.
- Serves successfully on port 3000 with zero console errors.
- WebMCP contract implemented via window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool conforming to standard shape.
- Exposes WebMCP tools for interacting with clip/timeline, transcript/citation, chapter, mix, rights/approval, branch, render, history, transfer, and reset.
- Responsive reflows scale down to 375px mobile, becoming source/clip cards, timeline mini-map, trim/fade/automation sheets, vertical chapter/provenance lineage, and approval/render stepper, retaining all actions.
- Full keyboard accessibility for insert/move/trim/split clips, edit fades/automation, navigate/correct/cite transcript, reorder chapters, review rights, merge/approve/render, and export without pointer.
- Interleave UI/WebMCP actions (clip/timeline, transcript, chapter, mix, rights, branch, render, history, transfer) and assert ids, ms, samples, checksums, files match.
- All dependencies must be resolved locally (via npm) without using CDNs.
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
- entity-collection-v1
- structured-editor-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
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
- Entity: source-clip-and-timeline-instance
- Entity operations: create; select; update; delete; reorder; toggle
- Entity fields: source-range; lane; episode-time; transcript-inclusion; citation; rights-state; approval-state
- Editor object types: timeline-instance; transcript-token; citation; narrative-block; automation-point; branch-cut
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor properties: source-in; source-out; start-ms; duration-ms; lane; gain; fade; included; title; summary; approval
- Editor modes: sources; timeline; transcript; chapters; mix; rights; branches; render
- Session operations: start; pause; resume; stop; restart; advance
- Demos: validation-run; render-run; retry-failed-render
- Artifact operations: export; import; copy
- Export formats: canonical-json; edl-csv; transcript-csv; webvtt; rss-xml; show-notes-markdown; timeline-svg
- Import modes: canonical-json
- Value bounds: timeline time and source ranges are non-negative integer milliseconds and remain within source bounds; chapters do not overlap and cover the approved timeline under declared intro and credit rules; rights require allowed usage, territory, attribution, and expiry after publish date; PodcastEpisodePackage schemaVersion is exactly podcast-episode-package/v1
- Workflow completion: inserting a source range creates a timeline instance without changing the source clip and selecting it highlights bound transcript, rights, waveform, and sibling instances
- Workflow completion: timeline and transcript edits update episode timing while preserving source timing and immediately refresh validation findings and stale approval indicators
- Workflow completion: reordering narrative blocks shows a ripple preview and moves the corresponding clip groups when confirmed
- Workflow completion: a material edit after approval marks the affected checksum-bound approvals stale
- Workflow completion: the first render run fails transcript timestamp and RSS enclosure outputs while preserving successful outputs; retry-failed completes only those failed outputs
- Workflow completion: canonical JSON import reconstructs the visible cut and invalid import names offending fields without changing state
- Workflow completion: re-export changes only exportedAt in canonical JSON while CSV, VTT, RSS, Markdown, and SVG remain byte-identical

Mechanics exclusions:
- Timeline drag, trim, split, ripple/nonripple movement, gap close, fades, crossfades, and automation-curve dragging are gesture mechanics graded through Playwright; equivalent state mutations use bound editor operations
- Keyboard shortcuts, mobile numeric editing, lane hover states, responsive layout, focus indicators, dialogs, and visual transitions remain Playwright-driven
- Waveform, loudness, peak, clipping, ducking, and fade-continuity visuals are observed through Playwright; validation session state uses command-session bindings
- File downloads, native file-picker interaction, and clipboard contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
