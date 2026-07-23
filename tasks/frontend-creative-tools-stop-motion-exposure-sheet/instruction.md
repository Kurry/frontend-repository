<summary>
A framework-agnostic browser app for planning stop-motion animation sequences. The user blocks shots into frame exposures, stages abstract subjects and props, aligns dialogue/music cue fixtures, plans holds and replacements, records deterministic capture events, compares alternate takes, detects continuity and timing defects, recovers missing/duplicate frames, approves a cut, and exports a reproducible animation packet.

This is not a video player or generic storyboard. The signature interaction is dragging an exposure range or manipulating a subject on the current frame while onion skins, dopesheet timing, cue waveform, prop continuity, shot duration, take comparison, approval freshness, and artifacts update together.

Build tooling: strictly React and Vite. Do not use Next.js, Remix, or any other meta-framework. State management must use Redux Toolkit or a local React/Vite reducer (in-memory only). All interactivity lives in client state. Styling must use Tailwind CSS 4.3.2 (pinned). All libraries installed via npm and bundled locally; no CDN imports.
</summary>

<core_features>
- Exposure sheet and ripple editing: Rows represent subject, prop, camera, lighting, dialogue, and audio cue tracks; columns are frames. Create, split, join, trim, and move exposure ranges, holds, blanks, and replacements. Ripple and overwrite modes have explicit previews; keyboard range commands and mobile frame sheets equal pointer edits.
- Stage and onion skins: Place and transform abstract objects in shot-local normalized coordinates with position, rotation, scale, depth, facing, and visibility. Configurable previous and next onion skins show exact frame offsets. Camera crop and stage bounds transform predictably after shot resize.
- Cue alignment and timing: Fixture waveform envelopes and dialogue syllable markers align to frames. Drag cues or ranges and see frames, seconds, shot duration, holds, and downstream boundaries update. Frame-rate conversion is out of scope; all timing uses exact integer frames.
- Prop and pose continuity: Track owner, position class, orientation, damage state, visibility, and pose tags across frame intervals and shot boundaries. Selecting a conflict highlights prior and current frame, exposure cells, take evidence, cue, and resolution choices.
- Capture event ledger: Advance the logical clock and record capture, retake, mark-missing, invalidate, or restore events with stable ids and source frame. Events are append-only and idempotent. Planned exposure and actual capture remain distinct; duplicate capture identity never silently overwrites.
- Take branches and cut approval: Fork takes, replace frame ranges, compare flicker and difference overlays and timing and continuity deltas, then merge per range or object. Approve a cut revision; later exposure, transform, cue, or capture changes mark it stale. Reapprove records a new immutable revision.
- Artifact contract: Export deterministic JSON project schema, CSV exposure sheet, JSON capture manifest, SVG timing map, and Markdown cut notes. Export is deterministic except regenerated exportedAt. Reset and import recreates canonical state and equivalent files. Imports reject invalid files atomically.
</core_features>

<visual_design>
- Inspect planned, captured, missing, invalid, hold, blank, replacement, onion offsets, cue, continuity, take, delta, stale, and approved states with clear, distinct visual treatments. Distinctions must stay legible.
- Dense grids and complex views remain legible through careful use of typography, color scale, borders, and whitespace.
</visual_design>

<motion>
- Ripple edits push downstream ranges and cues smoothly; onion skins and take deltas interpolate from exact source frames.
- Split, ripple, transform, align cue, capture, recover, compare, merge, approve, stale, and reapprove actions have clear feedback and causal endpoints.
- Repeating these actions with reduced motion keeps endpoints and values correct without continuous animation.
</motion>

<requirements>
- Deterministic fixture: Seed an original 42-second project at 12 fps with six shots, 504 frames, five abstract subjects, nine props, 74 exposure cells, 17 cue markers, three takes, two missing frames, one duplicate capture id, one continuity mismatch, and deterministic logical capture time. Preview frames are generated vector shapes.
- Whole job and Dashboard-derived hardness contract:
  - Begin from a genuinely clean state (fixture-only): no authored work, completion, approval, export, or success evidence may be preseeded beyond the fixture.
  - Keyboard and exact-value path converges to one canonical event identical to the direct-manipulation path.
  - Exercise adversarial orderings (for example, edit after merge or approval). Equivalent orders converge. Cancelled actions restore prior snapshot exactly.
  - Treat every import mode as an atomic transaction validating all records and fields before commit. Reject violations with zero state mutation.
  - Useful end state is an interoperable downloadable artifact. Import must restore authored and derived state, and re-export must be semantically identical (except regenerated metadata).
  - State must survive reload exactly. Transient previews and drafts do not leak into persistence.
  - Exact boundaries: Cover min, max, just-inside, and just-outside values. Error copy identifies field, rejected value or rule, and recovery.
  - Graded interactions require real browser mechanics (pointer, hover computed style, keyboard traversal, modal focus trap).
  - Performance: Direct manipulation acknowledged within 100ms, linked and derived views settle within 500ms, export and import complete within 2s.
- Depth-first completion protocol: For every subsystem, complete state model, rendering, stream and error and approval and retry paths, persistence, and verification before moving to the next. Add recovery for malformed input, missing events, races, transient and terminal failures, cancellation, and import drift.
- In scope: Abstract vector frames, original fixture cues and copy, deterministic 12-fps planning, JSON, CSV, SVG, and Markdown files.
- Out of scope: Camera hardware, audio encoding, video encoding, generated imagery, copyrighted media, collaboration, accounts, network, backend persistence.
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
- Browsable entity: shot
- Destinations: stage; exposure-grid; cue-track; continuity-inspector; take-compare; event-ledger
- Filters: status; take
- Sorts: frame-order
- Themes: default
- Entity: shot; range; transform; cue; event; take; approval
- Entity operations: create; select; update; delete; toggle
- Entity fields: shot-id; frame-start; frame-end; track-id; x; y; rotation; scale; take-id; approval-status
- Artifact operations: export; import; copy
- Export formats: json; csv; svg; markdown
- Import modes: json

Mechanics exclusions:
- Drag-and-drop manipulation tooling stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard and downloaded artifact contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
