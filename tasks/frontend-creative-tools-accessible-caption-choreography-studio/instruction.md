# Task: Accessible Caption Choreography Studio

<summary>
The user aligns transcript tokens to media time, groups them into caption cues, drags/resizes cues, identifies speakers and sound descriptions, branches wording alternatives, reviews reading-speed and shot-boundary findings, simulates render validation failures, approves a master, and exports interoperable WebVTT/SRT plus a visual cue sheet. Text, timing, provenance, and review state must remain coherent.

This is not a transcript textarea. The signature interaction is manipulating caption blocks over waveform and shot lanes while the media preview, transcript tokens, reading-speed plot, speaker map, variant lineage, validator, and export text update in lockstep.

Build tooling: Vite, React, TypeScript. Styling: Tailwind CSS 4.3.2. Motion: React Spring or Framer Motion. Data management: Redux Toolkit or Zustand (local memory only).
</summary>

<core_features>
- Transcript tokens drag into ordered cue blocks; users split/merge cues and edit wording without losing source-token provenance
- Cue edges drag at 10-millisecond precision and snap optionally to token, frame, or shot boundaries (500–7000 ms duration bounds, nonnegative, within media duration, ordered per lane)
- Ordinary cues cannot overlap in one lane; simultaneous speech uses exactly two visible speaker lanes with aligned placement rules; sound-description cues occupy a distinct lane and may overlap speech only under declared policy
- Moving one cue previews collisions, gaps, reading speed, and shot-crossing before commit
- Speaker identity, off-screen status, position region, italics, music marker, and sound-description type are semantic properties, not arbitrary CSS
- A preview safe-area shows line wrapping at the fixed output width; cues allow at most two lines and 42 characters per line; position collisions and missing speaker/sound labels block approval
- Low-confidence or high-speed cues may fork into wording variants; each branch retains token source ids, edits, timing, rationale, and reviewer decision
- Compare highlights word, punctuation, line-break, timing, and semantic-style deltas; merge resolves each conflict explicitly; changing active wording never moves timing unless selected
- Playhead movement synchronizes video frame, waveform, current cue, transcript token, shot, reading-speed cursor, and mini-map; clicking any linked entity seeks the logical clock
- Loop cue, previous/next finding, 0.5×/1×/1.5× playback, and keyboard transport are available
- Validation runs tokenize → check intervals → line-break/render → reading speed → shot boundaries → speaker/sound semantics → export parity; findings name exact cue/rule/value and are error, warning, or acknowledged exception
- Validation runs pause/resume/retry and become stale after relevant edits; first render batch deterministically fails one cue font check and one export timestamp, preserving successful results for retry-failed-only
- Reviewers accept/reject cue variants, acknowledge bounded warnings, pin exact frame/token evidence, and approve a master only when all errors resolve and validation checksum is current
- Rewinding before approval creates a master branch; approval freezes cue order/text/timing/style/source and export checksums
- Export produces canonical JSON, WebVTT, SRT, and SVG cue map; import of canonical JSON or supported VTT reconstructs and validates state with explicit provenance limits
</core_features>

<visual_design>
- Desktop shows media/waveform lanes, transcript, cue inspector, and review rail
- Temporal hierarchy stays legible across cue/lane/shot, collision/speed, speaker/sound, branch, finding, and stale/approved states
- Color is supplemental; semantic properties dictate rendering (italics, music markers, safe-area wrappers)
</visual_design>

<motion>
- Cue travel/resize, collision/speed propagation, seek, branch diff, and validator recovery explain cause visually
- Reduced motion retains playhead/status/delta evidence while removing continuous translation/sliding
</motion>

<requirements>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded
- Keyboard/exact-value paths converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization (no extra events for no-op/cancel)
- Exercise adversarial orderings (e.g. undo followed by branch; cancel after transient preview); equivalent orders must converge, cancelled actions restore complete prior snapshot (selection, viewport, filters, focus, history anchor)
- Every import mode is an atomic transaction validating all records/fields before commit; reject unknown enums, exact-boundary violations, duplicate/dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation
- Export must be an interoperable downloadable artifact with exact filenames, schemas, required keys, units, precision, stable sort order, and regenerated exportedAt values; import round-trips state exactly
- Genre-correct reload isolation: state that the PRD promises to persist must survive reload exactly (localStorage is permitted for this task per 'hard browser app' genre, but must strictly scope to this session); transient previews, dialogs, and invalid drafts must not leak into persistence
- Cover exact boundaries (minimum, maximum, just-inside, just-outside) for every bounded field (e.g. 500-7000ms cues, two-line/42-character limits); error copy must identify field, rejected value, rule, and recovery action
- Graded interactions require real browser mechanics: normal pointer actionability, computed style while actually hovered, keyboard traversal/shortcuts (undo, command/search), modal focus trap, live announcements, non-color evidence, reduced-motion causal parity
- Performance bounds: direct manipulation acknowledges within 100 ms, linked/derived views settle within 500 ms, export/import complete within 2 s without dropped interactions, stale views, layout jumps, console/page errors, or non-local network dependence
- Mobile viewport: becomes media header, current/adjacent cue cards, token picker, timecode sheets, vertical finding list, and transport bar without page-level overflow or sub-44px targets; precision operations remain available
- The fictional 96-second VP9 WebM contains 11 shots, three speakers, 126 timestamped transcript tokens, five non-speech sounds, two overlapping utterances, one low-confidence phrase, and deterministic waveform/thumbnail data. The starter transcript has four deliberate alignment errors. Playback controlled by logical media clock.
- All libraries installed via npm and bundled locally; no CDN imports.
- All libraries installed via npm and bundled locally; no CDN imports.
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
- browse-query-v1
- entity-collection-v1
- structured-editor-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
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
- Destinations: media-lanes; transcript; cue-inspector; review-rail; mobile-timecode-sheets; mobile-semantic-sheets; export-drawer
- Themes: light; dark; reduced-motion
- Entity: cue
- Entity operations: create; select; update; delete; split; merge
- Entity fields: text; interval; lane; speaker; sound_description; confidence; status; token_ids
- Editor operations: select; add; delete; update_property; set_content; switch_mode; preview
- Editor object types: cue; branch
- Editor properties: timing; style; binding; clock
- Artifact operations: export; import
- Export formats: json; vtt; srt; svg
- Import modes: json; vtt

Mechanics exclusions:
- Continuous cue geometry, synchronized token/media selection, and overlap lane bounds stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard and downloaded artifact contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
