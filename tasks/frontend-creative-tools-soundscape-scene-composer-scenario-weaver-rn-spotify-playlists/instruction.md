# Soundscape Scene Composer — Scenario Weaver

<summary>
Manage sound layers through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: branch a selected record into a scenario and compare linked outcomes. Release-derived concept: a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree. This application adapts Spotify's shipped pattern of collaborative reorder, bulk playlist actions, folders, queue reshuffle, and background-download progress into a self-contained frontend job. The signature interaction is "branch a selected record into a scenario and compare linked outcomes", which creates a unified mutation across the UI, artifact, and WebMCP representation.
</summary>

<reference_screenshots>
This task contains no reference screenshots. Follow the visual design instructions precisely.
</reference_screenshots>

<core_features>
1. Create, edit, archive, and filter sound layers with explicit domain statuses (empty, draft, ready, changed, archived).
2. Branch a selected record into a scenario and compare linked outcomes using a scenario weaver surface.
3. Observe linked views: the primary surface, scenario weaver decision surface, derived summary, and artifact query must share one deterministic state.
4. Export and restore the actual session work in a fresh state via soundscape-scene-v1-scenario-weaver.json.
5. Provide a full undo/redo stack (or at least undo for the last mutation) that restores ordering, selection, and derived values.
</core_features>

<user_flows>
1. Branching flow: The user selects a sound layer record, triggers "branch a selected record into a scenario and compare linked outcomes", and observes the record split, the scenario weaver UI update, the derived summary change, and the status field update synchronously.
2. Editing flow: Create, edit, delete one record. Filter or reorder records by domain state.
3. Import/Export flow: Export the current artifact, clear the session state, and import the artifact with field-level validation to restore authored structure and derived state.
</user_flows>

<edge_cases>
1. Boundary acceptance: Exact field boundaries are accepted, adjacent out-of-range values are rejected.
2. Invalid required fields: Preserve the prior valid record and explain recovery.
3. Scenario weaver conflict: A conflicting or incomplete mutation is rejected without partial updates.
4. Import validation: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
</edge_cases>

<visual_design>
1. A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
2. The visual hierarchy makes current state and next action clear across the primary surface, linked summary, and detail panel.
3. Display explicit status badges: empty, draft, ready, changed, archived, idle, selected, conflict, resolved.
</visual_design>

<motion>
1. The acted-on item moves or morphs into its new state during the scenario weaver branch interaction.
2. Motion connects the acted-on item to its new state and has a reduced-motion equivalent (no transforms, preserve feedback).
</motion>

<responsiveness>
1. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
2. Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</responsiveness>

<accessibility>
1. Semantic controls, keyboard parity (Ctrl/Cmd+Z to undo), focus management, live updates, contrast, and reduced-motion support.
2. Keyboard and touch-equivalent controls produce the identical canonical mutation as mouse interactions.
</accessibility>

<performance>
1. Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
2. The signature interaction remains responsive and unrelated rows stay stable when acting on a large collection.
</performance>

<writing>
1. Domain copy precisely names the domain consequence and recovery actions.
2. Labels, statuses, errors, and empty-state text use consistent Sound Layers nomenclature.
</writing>

<innovation>
1. Linked utility: Mutating a record and using the linked representation to make the next decision provides domain utility beyond standard CRUD.
</innovation>

<requirements>
1. The state must be entirely in-memory; DO NOT use localStorage or backend persistence. Export/import is the only persistence boundary.
2. The UI must expose a WebMCP contract via window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool. All dependencies must be strictly local and defined in your package.json (no CDNs allowed). Tailwind CSS 4.3.2 must be used for styling.
3. Support exporting and importing a JSON artifact shaped as SoundscapeSceneComposerSession (soundscape-scene-v1-scenario-weaver.json) which includes schemaVersion, exportedAt, records[], derived{}, and history[].
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The solution must be built using React and Vite, running on port 3000.
- All dependencies must be strictly local and defined in your package.json (no CDNs allowed).
- Implement the comprehensive feature set described using Tailwind CSS 4.3.2.
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
  "title": "Command session",
  "purpose": "Domain workflows, orchestration, branching, testing, generation, and step-by-step sessions.",
  "permitted_operations": ["start", "step", "submit", "approve", "reject", "undo", "redo", "cancel"],
  "binding_keys": {
    "required_any_of": [["session_workflows"], ["session_commands"]],
    "optional": ["session_steps", "session_states", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary JS execution, terminal access, or non-domain logic via WebMCP.",
    "Complex payload inputs remain constrained to domain-specific structures."
  ],
  "tool_name_prefix": "command"
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
- Editor object types: scenario-weaver
- Editor operations: select; update_property; preview
- Entity: sound-layer
- Entity operations: create; select; update; delete; reorder
- Entity fields: name; status; volume; pan; effects
- Session workflows: branch-scenario
- Session commands: start; submit; undo; redo
- Session states: idle; selected; changed; conflict; resolved
- Artifact operations: export; import; copy
- Export formats: soundscape-scene-v1-scenario-weaver.json
- Import modes: soundscape-scene-v1-scenario-weaver.json

Mechanics exclusions:
- Real gesture, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
</webmcp_action_contract>
