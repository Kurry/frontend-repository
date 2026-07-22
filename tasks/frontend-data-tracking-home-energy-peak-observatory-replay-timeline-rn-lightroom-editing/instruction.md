<summary>
Create a browser-native "Home Energy Peak Observatory" application to manage energy readings in a bounded local workflow. The core signature mutation allows users to scrub a selected record through its timeline and restore a prior checkpoint, observing real-time updates in linked views (summary, history, replay timeline) and generating a synchronized portable JSON artifact.

This is a frontend-only good-app genre evaluation task. All state must remain strictly in-memory during the session (no localStorage, no remote network calls), utilizing a downloaded and uploaded JSON artifact for persistence.

All styling must be implemented using Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Energy Readings collection: Users can create, edit, archive, and filter energy readings with explicit domain statuses.
Replay Timeline surface: Users can scrub a selected record through its timeline, restore a prior checkpoint, and undo the last mutation.
Portable work artifact: Users can export the current canonical state as energy-peak-v1-replay-timeline.json and clear/import it with field-level validation, allowing round-trip persistence of authored state, derived state, and history.
</core_features>

<visual_design>
The UI should present a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
A desktop layout should feature a primary surface plus summary and inspector panels.
Mobile layouts should transform secondary surfaces into drawers or stacked steps without horizontal overflow.
</visual_design>

<motion>
The acted-on item must move or morph into its new state.
Causal motion must connect the acted-on item to its consequence.
A reduced-motion alternative must preserve feedback without layout transforms.
</motion>

<requirements>
The application must support at least 100 seeded records responsively without unrelated UI rebuilds.
Alternate input (keyboard and touch-equivalents) must produce the exact identical canonical mutation, and Ctrl/Cmd+Z must undo it.
Invalid actions (e.g. invalid bounds, cross-field conflicts, malformed imports) must be rejected, preserving the prior valid state and offering field-level recovery.
The portable JSON artifact must include schemaVersion, exportedAt, records, derived, and history.
All assets must be loaded locally without CDNs.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
Provide a full React/Vite implementation in the /app directory.
It must build with npm run build and run smoothly in a browser.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- timeline-scrub-v1
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

<module_spec id="timeline-scrub-v1">
{
  "id": "timeline-scrub-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Timeline scrub",
  "purpose": "Scrub a selected record through its timeline and restore a prior checkpoint.",
  "permitted_operations": ["scrub", "restore_checkpoint", "undo"],
  "binding_keys": {
    "required_any_of": [["timeline_operations"]],
    "optional": ["timeline_states", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, and drawing remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "timeline"
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
- Entity: reading
- Entity operations: create; select; update; archive; filter
- Entity fields: status; value; timestamp
- Timeline operations: scrub; restore_checkpoint; undo
- Timeline states: idle; selected; changed; conflict; resolved
- Artifact operations: export; import; clear
- Export formats: energy-peak-v1-replay-timeline.json
- Import modes: json

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args
- File system and clipboard actions stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
