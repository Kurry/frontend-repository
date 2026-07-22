# Stage Blocking Path Studio

## <summary>
You will build a deterministic, framework-agnostic spatiotemporal performance planner and blocking studio for a fictional stage scene, "The Last Lantern." The application must orchestrate actor and prop movement, custody handoffs, entrance/exit timing, collision and sightline analysis, branch repair, and export artifacts. The signature interaction is dragging a path waypoint at one scene beat while actor positions, travel feasibility, collision/sightline overlays, dialogue focus, prop custody, entrance timing, cue anchors, rehearsal trace, and artifacts update together. The application operates entirely in-memory with no localStorage or backend persistence. Built with React and Tailwind CSS 4.3.2. All dependencies must be npm-local (no CDNs).
</summary>

## <core_features>
Stage and Entity Placement: Provide a 12x8-meter stage polygon with three entrances and 10 scenic obstacles/zones. Actors (5) and props (6) occupy circle/rectangle footprints on a 0.1-meter grid with facing direction. Ensure positions stay in accessible stage/entrance zones and outside obstacles.
Beat-Aligned Path Editor: Implement waypoints for each actor/prop keyed to scene beat (1 to 48) with x/y/facing, movement type, and hold. Paths interpolate linearly between beats under speed bounds. Allow dragging, inserting, deleting, copying, mirroring, and retiming waypoints. Duplicate beat points and impossible travel must remain preview-only.
Collision, Aisle, and Accessibility Analysis: Sample paths at declared beat fractions to detect actor/prop/obstacle collisions, blocked entrances, inaccessible path/turn radius, and required clear aisle. Selecting a finding must highlight exact entities, beat interval, sampled positions, and repair options.
Sightline and Dialogue Focus: Implement raycasting from audience sample points to the speaking actor’s center, respecting scenic/actor occlusion. Dialogue blocks declare primary speaker and optional addressed actor; facing and distance rules apply. Provide a heatmap by beat showing sightline/focus coverage.
Entrance, Exit, and Scene Continuity: Restrict actor entrances/exits to assigned entrances; they cannot appear onstage before/after state. Ensure costume/role changes enforce offstage duration. Scene beat blocks bind dialogue/action objective, required people/props, and technical cue anchors.
Prop Custody and Handoffs: Guarantee each prop has exactly one location/custodian at every beat. Require spatial proximity, free-hand fixture, and valid state for pickup, set-down, pass, conceal, reveal, and preset events. Handoffs must animate owner-to-owner and update prop path.
Branch, Rehearsal, and Repair: Enable blocking variant forks, allowing comparison of positions, paths, and timing, and merging of ranges. Provide a logical rehearsal that advances beats and records late/early/missed path/cue/handoff events. Require absence/delayed-entrance repair (e.g., understudy substitution, reroute) as future-only branches, keeping completed beats immutable.
Export and Artifacts: Produce canonical JSON (schemaVersion: "stage-blocking-score/v1"), SVG stage maps at key beats plus a path atlas, CSV waypoint/custody/rehearsal ledger, and a Markdown script. Provide import that reconstructs state exactly and rejects any mismatches or forged data.
</core_features>

## <visual_design>
Layout: The desktop layout features a stage/path canvas, beat timeline, continuity/custody graph, and analysis/rehearsal rail. Mobile layout transforms to a stage mini-map, actor/waypoint cards, vertical beat/entrance/custody lineage, finding drilldowns, and rehearsal controls.
Hierarchy and Legibility: Clearly distinguish selected, waypoint, path, hold, collision, inaccessible, occluded, focus, offstage/onstage, prop custody, completed, disrupted, and approved states.
Grid and Canvas: Draw a clean 0.1-meter grid (visualized appropriately for scale).
</visual_design>

## <motion>
Causal Animation: Waypoint/path travel, focus/occlusion changes, handoff owner flow, and absence repair must explain cause through smooth transitions.
Reduced Motion: When prefers-reduced-motion is active, retain sampled path/beat/status deltas but disable smooth interpolations between states.
</motion>

## <requirements>
All application state must be strictly in-memory (no localStorage, sessionStorage, IndexedDB, or backend).
The application must serve on port 3000 (npm start must run the application or serve the built output dist/ on port 3000).
The app must start with immutable stage/scene/actors/props and flawed starter blocking with no user edit, branch, rehearsal, approval, annotation, or export.
Moving one waypoint must predictably change interpolated positions, collisions, cue timing, handoff feasibility, rehearsal trace, WebMCP state, and downloadable artifacts.
Provide keyboard paths for all actions: placement, facing, waypoint editing, beat/cue changes, prop custody, branching, rehearsal, findings navigation, and export.
Provide a responsive layout that remains fully functional on 1440px, 768px, and 375px widths.
Support 200 actors/props, 10,000 beats/waypoints, and 1,000 rehearsal branches responsively; cancel stale sampling/raycast work during interactions.
Built with React and Tailwind CSS 4.3.2. All dependencies must be npm-local (no CDNs).
</requirements>

## <integrity>
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
- Editor object types: actor-waypoint; prop-waypoint; blocking-branch
- Editor operations: select; add; delete; update_property; switch_mode; preview
- Editor properties: beat; x; y; facing; movement-type; hold
- Editor modes: stage; paths; sightlines; custody; rehearsal; artifacts
- Session operations: start; pause; resume; stop; restart; advance
- Artifact operations: export; import; copy
- Export formats: canonical-json; stage-map-svg; path-atlas-svg; waypoint-csv; custody-csv; rehearsal-csv; script-markdown
- Import modes: canonical-json
- Workflow completion: selected entity and waypoint
- Workflow completion: current beat and stage positions
- Workflow completion: active branch and rehearsal trace
- Workflow completion: artifact preview

Mechanics exclusions:
- Waypoint dragging, snapping, mirroring, and retiming gestures stay Playwright-driven; editor operations expose the resulting score state without bypassing gesture criteria
- Collision, sightline, focus, entrance, and custody overlay geometry stays Playwright-observed
- Rehearsal timing, smooth path interpolation, handoff animation, and reduced-motion behavior stay Playwright-observed
- File picker, clipboard contents, downloaded artifact bytes, and SVG rendering fidelity remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
