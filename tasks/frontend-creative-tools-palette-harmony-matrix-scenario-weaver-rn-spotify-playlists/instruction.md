# Palette Harmony Matrix — Scenario Weaver — Spotify Playlists

<summary>
Manage colors through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: branch a selected record into a scenario and compare linked outcomes. Release-derived concept: a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree.
</summary>

<core_features>
Create, edit, archive, and filter colors with explicit domain statuses.
Use the scenario weaver interaction to derive a decision about the collection. Branch a selected record into a scenario and compare linked outcomes.
Undo the last mutation and inspect the linked representation.
Export the current artifact, clear it, and import it with field-level validation.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes current state and next action clear.
Desktop layout consists of a primary surface plus summary and inspector.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
Bounded local workflow, in-memory state only, NO localStorage or server backends. A page reload must return to the initial seeded state.
Create at least 100 seeded records to test the large collection performance requirement.
Ensure the state models a PaletteHarmonyMatrixSession with schemaVersion, exportedAt, records, derived, and history.
The UI must have a primary desktop surface, with narrow layouts adapting into a usable stack, drawer, or stepper without horizontal overflow.
Implement alternate input parity: Keyboard and touch-equivalent controls must produce the identical canonical mutation; Ctrl/Cmd+Z must undo it.
Validation: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Invalid cross-field values must be rejected while valid boundaries are accepted. Malformed imports or missing required fields should fail safely, preserving the previous valid state.
Import and Export must work correctly with palette-harmony-v1-scenario-weaver.json shapes.
Build stack must use React and Tailwind CSS 4.3.2. No external backend networks.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
Package scripts in the app must expose exactly npm start (port 3000) and verify:build.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- structured-editor-v1
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
- Editor object types: color-record
- Editor properties: hex; lightness; hue
- Editor modes: scenario
- Editor operations: select; update_property; preview
- Entity: color
- Entity operations: create; select; update; delete
- Entity fields: name; hex; status
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag or real user interaction for layout reorders stays Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args
- Actual file downloading to OS stays Playwright-observed
</webmcp_action_contract>