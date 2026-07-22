# Appliance Service History — Replay Timeline

<summary>
Manage appliance records through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized.

Stack: React 18+ (or Vue/Svelte/Solid), Tailwind CSS 4.3.2 (pinned), no component library for primary surfaces, Lucide or Phosphor icons, standard React/browser built-ins; frontend-only. Do not use CDNs or npm-local; all packages must be locally installed via npm.
</summary>

<core_features>
- Create, edit, delete, archive, and filter appliance records.
- Explicit domain statuses: empty, draft, ready, changed, archived.
- Invalid required fields preserve the prior valid record and explain recovery.
- Replay Timeline interaction: Scrub a selected record through its timeline and restore a prior checkpoint.
- Linked summary/details and visual indicators reflect timeline states and edits immediately.
- Export interoperable session artifact (appliance-service-v1.json).
- Import artifact with field-level validation to restore session state.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Visual hierarchy separates the primary work surface, linked summary, and detail panel.
- Semantic controls, explicit contrasts.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Meaningful state transitions have causal motion.
- Reduced-motion support is explicit (respects prefers-reduced-motion without layout breakage).
</motion>

<requirements>
- In-memory state only (no localStorage, sessionStorage, or other persistence APIs; a page reload resets to a seeded initial state).
- Seed a deterministic collection with at least 5 records featuring empty, boundary, valid, and conflict states.
- The UI must handle at least 100 records without lag.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Desktop layout: primary surface plus summary and inspector.
- Mobile layout: responsive transformation; secondary surfaces become drawers or stacked steps. No horizontal clipping.
- Artifact format: appliance-service-v1-replay-timeline.json. Schema: { schemaVersion: 'v1', exportedAt: string (RFC3339), records: array, derived: object, history: array }.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- All dependencies must be locally installed via npm; no CDN imports are allowed (npm-local/no-CDN rule).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`.
- `package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- Run via `npm start` on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
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
- Editor object types: appliance-record, timeline-event
- Editor properties: timeline_checkpoint
- Editor modes: replay
- Editor operations: select, update_property, switch_mode, preview
- Entity: appliance-record
- Entity operations: create, select, update, delete, toggle, reorder
- Entity fields: status, service_history, metadata
- Artifact operations: import, export, copy
- Export formats: appliance-service-v1-replay-timeline-json
- Import modes: appliance-service-v1-replay-timeline-json

Mechanics exclusions:
- Scrubbing interaction geometry and drag mechanics stay Playwright (gesture mechanics)
- Canvas visual manipulation stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
