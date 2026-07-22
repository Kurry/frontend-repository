# Task: Branchable Celebration Campaign Studio

<summary>
A host composes a layered invitation, branches its message and artwork into alternatives, binds recipient groups to variants, reviews generated suggestions with evidence, approves or rejects workflow checkpoints, rehearses delivery failures, tracks RSVP replies, and exports a self-contained campaign bundle plus print-ready cards. Generation is never a one-shot chat response: every step is visible, interruptible, resumable, and tied to the canonical design and recipient state. This includes Tailwind CSS 4.3.2.
</summary>

<core_features>
- Layered invitation canvas (front and back, 5x7 inch) with text, image, shape, and RSVP-code layers. Supports drag, resize, rotate, align, distribute, reorder, lock, hide, and edit.
- Branch graph for copy and artwork variants. Accepting deterministic suggestions creates named branch nodes. Compare mode highlights deltas; merge mode resolves conflicts.
- Resumable workflow timeline: brief, source review, copy variants, artwork variants, accessibility review, host approval, personalization, delivery rehearsal, RSVP tracking, package. Supports pause, resume, retry, reject, and rewind (which forks).
- Evidence, reasoning, and review panel showing suggestion rationale, cited fixture source snippets, and output previews. Explicit approval needed for artwork, accessibility exceptions, and personalization.
- Recipient personalization matrix for 12 deterministic recipients across 4 households. Rows bind variants, salutations, inserts, channels, send windows, and consents.
- Delivery rehearsal simulation and failure recovery. Queue timeline simulates limits, missing consents, and partial batch failures, with append-only retry logs.
- RSVP ledger tracks pending, viewed, accepted, declined, needs-follow-up states, reconciling deterministic reply events without altering active payload.
</core_features>

<visual_design>
- Split workspace integrating spatial canvas, branch/run rail, and contextual recipient/review panel.
- Layer boundaries, selection states, transforms, and warnings (bleed, contrast, overflow, missing alt-text) have distinct visual signifiers.
- Branch nodes indicate status (active, accepted, rejected, superseded) and lineage depth.
- Rehearsal queue and RSVP ledger rows show unambiguous categorical states (queued vs failed, accepted vs declined).
</visual_design>

<motion>
- Reduced motion preferences fall back to immediate endpoints and persistent status text.
- Causal motion: Branch creation, layer movement, run propagation, queue retry, and metric updates animate from origin to destination (unless reduced motion is active).
</motion>

<requirements>
- CelebrationCampaign artifact contract with schemaVersion celebration-campaign/v1.
- All features must operate completely in browser memory (no localStorage, no network calls to external APIs, only the deterministic fixture data). No CDN calls. Everything must be npm-local.
- Export produces a ZIP bundle containing canonical JSON, one SVG per variant, print HTML sheet, and RSVP CSV. Import reconstructs this exact state.
- WebMCP contract must implement modules to manipulate and query this state.
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
- Editor object types: canvas-layer; branch-node
- Editor properties: position; rotation; dimensions; content; lineage
- Entity: recipient
- Entity operations: select; update; bind
- Entity fields: household; salutation; channel; consent; rsvp_state
- Session operations: pause; resume; retry; rewind; rehearse
- Session State Fields: workflow_step; run_graph; queue
- Artifact Types: campaign_bundle
- Transfer Operations: export; import

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
