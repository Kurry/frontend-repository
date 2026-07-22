<summary>
Build an Accessible Caption Choreography Studio, a browser-based application for timed text composition. The app allows users to align transcript tokens to media time, group them into caption cues, drag/resize cues on a timeline, identify speakers and sound descriptions, branch wording alternatives, review validation findings (e.g., reading speed, shot boundary conflicts), and approve a master version for export. The app works entirely in-memory with no backend and exports interoperable WebVTT, SRT, SVG cue sheets, and a canonical Session JSON. It uses Tailwind CSS 4.3.2.
</summary>

<core_features>
Feature: Token-to-cue choreography —
- Users can drag transcript tokens into ordered cue blocks on the timeline.
- Users can split or merge cues, and edit wording. The UI retains source-token provenance.
- Cue edges can be dragged to resize with 10-millisecond precision.
- Cues must be constrained to 500–7000 ms duration, non-negative, and strictly within the media duration (96 seconds). Cues must remain ordered per lane.
- Keyboard controls (nudge/resize) are supported alongside pointer edits. Mobile UI includes numeric timecode sheets matching pointer edits.

Feature: Overlap and lane semantics —
- Simultaneous speech uses exactly two visible speaker lanes. Sound-description cues occupy a distinct third lane.
- Ordinary cues cannot overlap in the same lane.
- Moving a cue previews collisions, reading speed, and shot-crossing before commit.

Feature: Speaker and accessibility styling —
- Speaker identity, off-screen status, italics, and sound-description type are semantic properties.
- A safe-area preview shows line wrapping at a fixed output width (max 2 lines, 42 characters per line).
- Missing speaker/sound labels or position collisions block approval.

Feature: Wording branches and provenance —
- Cues can fork into wording variants (branches).
- Each branch retains token source ids, edits, timing, rationale, and reviewer decisions.
- A compare view highlights differences in text, timing, and style. Merging resolves conflicts explicitly.

Feature: Synchronized preview and navigation —
- The playhead synchronizes the video frame, waveform, current cue, transcript token, shot, reading-speed cursor, and mini-map.
- Clicking any linked entity seeks the logical clock.
- Supports loop cue, previous/next finding, 0.5×/1×/1.5× playback, and keyboard transport.

Feature: Deterministic validation workflow —
- Validation checks intervals, line-break/render, reading speed, shot boundaries, semantics, and export parity.
- Findings point to exact cues and rules, categorized as errors or warnings.
- The first render batch deterministically fails one cue font check and one export timestamp (for testing the retry-failed-only capability).

Feature: Review and master approval —
- Reviewers accept/reject cue variants and acknowledge warnings.
- Master approval is blocked until all errors resolve and validation checksum is current.
- Approval freezes cue order, text, timing, style, and export checksums.

Feature: Export and Import (useful end state) —
- Artifact contract: Export produces Canonical JSON, WebVTT, SRT, and an SVG cue map.
- The project uses schemaVersion caption-choreography/v1 and contains media duration, tokens, shots, cue lanes, wording branches, logical playback state, validator runs, reviews, and exportedAt.
- Importing canonical JSON or supported VTT reconstructs the state. JSON import strictly rejects mismatched fixtures, cycles, or validation anomalies.
</core_features>

<visual_design>
- The UI contains a media preview, waveform/shot/cue lanes, transcript sidebar, cue inspector, and review rail on desktop.
- On mobile, the layout transforms into a media header, current/adjacent cue cards, token picker, timecode sheets, vertical finding list, and transport bar.
- Clear typographic hierarchy for transcript tokens, distinguishing bound vs. unbound tokens.
- Temporal hierarchy stays legible: timeline clearly marks shots, active reading speed, and collisions.
</visual_design>

<motion>
- Cue drag and resize operations update visual state (collisions, speed limits) continuously.
- Seeking the playhead updates video and synced UI elements fluidly.
- Reduced motion setting retains the playhead, status, and delta evidence without animations.
</motion>

<requirements>
- Direct studio entry without login or backend dependency.
- Deterministic fixture data: 96-second VP9 WebM, 11 shots, 3 speakers, 126 timestamped tokens, 5 non-speech sounds, starter transcript with 4 errors.
- Output artifacts (JSON, VTT, SRT, SVG) must be generated strictly from current state and be downloadable.
- Adhere to the API-shaped session JSON format.
- Fully in-memory state; no localStorage persistence.
- Do not use CDNs; all libraries must be installed locally via npm.
- WebMCP standard contract for tooling implemented in the app.
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
- Entity: cue
- Entity operations: select; add; delete; update; split; merge; branch; resolve
- Entity fields: interval; text; speaker; lane; styling; findings
- Editor object types: timeline; waveform; transcript; branch-graph
- Editor operations: select; add; delete; update_property
- Workflow completion: stale-validation
- Workflow completion: approved-master
- Workflow completion: collision-warning
- Workflow completion: speed-warning
- Commands: validate; approve; retry; play; seek
- Session State: clock; validation-freshness; approval-status
- Artifact Formats: caption-choreography-project-json; webvtt; srt; svg-cue-map
- Transfer Directions: import; export

Mechanics exclusions:
- Drag geometry, continuous timeline zoom, responsive UI transformations, and keyboard selection boundaries remain Playwright responsibilities.
- File downloads, clipboard access, and exact visual rendering of VTT outputs must be checked via Playwright.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
