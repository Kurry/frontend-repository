<summary>
Manage ceramic glaze tests through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Focus on the core job: connect a selected record to a handoff owner and update readiness. This concept adapts Figma's shipped pattern of variable modes, expressions, conditionals, and code-to-canvas design-system synchronization into a self-contained frontend job.
</summary>

<core_features>
- Glaze Tests Collection: Create, edit, archive, and filter glaze tests with explicit domain statuses (empty, draft, ready, changed, archived).
- Handoff Map Surface: A visual domain-specific mapper that connects a selected glaze test record to a handoff owner and updates readiness.
- Undo: Undo the last handoff map mutation, restoring ordering, selection, and derived values.
- Artifact Persistence: Export and restore the actual session work in a fresh state via glaze-atlas-v1.json with field-level validation and schema structure.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The primary surface is the Handoff Map, supplemented by a derived summary and inspector.
- Visual hierarchy makes current state and next action clear, utilizing Tailwind CSS 4.
- High-fidelity components utilizing vector SVG icons.
- No placeholder or lorem-ipsum text.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state during the canonical mutation (handoff map).
- Reduced motion preserves feedback without transforms (using framer-motion matching system preferences).
</motion>

<requirements>
- Shared application state uses Zustand (in-memory only); no localStorage/sessionStorage. A page reload must return to the seeded state.
- Stack: React, Vite, Tailwind CSS 4.3.2, Zustand, Framer Motion, React Hook Form + Zod, date-fns.
- Seed the collection with at least 100 deterministic records including empty, boundary, valid, and conflict states, so performance is observable (responsive interactions without unrelated row rebuilds).
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive behavior: Narrow layouts (mobile) transform secondary surfaces into drawers or stacked steps. Interaction model changes to preserve touch targets and avoid horizontal clipping.
- Boundaries & Recovery: Exact field boundaries accepted. Invalid required fields preserve prior valid record.
- Invalid artifact import is a no-op (malformed schema, duplicate IDs, unknown references, etc.).
- Useful end state: The session's work product is glaze-atlas-v1.json (Export action).
- WebMCP contract implemented exactly as described below.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<delivery>
- Produce an original self-contained app in `/solution/app`.
- `/solution/app/package.json` MUST define npm scripts `start` (serves the app on port 3000) and `verify:build`.
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
- Editor object types: glaze-record
- Editor properties: owner; readiness
- Editor modes: map; list
- Editor operations: select; update_property; preview
- Entity: glaze-test
- Entity operations: create; select; update; delete; toggle
- Entity fields: id; name; status; owner; readiness
- Artifact operations: export; import; copy
- Export formats: glaze-atlas-v1-json
- Import modes: glaze-atlas-v1-json

Mechanics exclusions:
- Drag/gestures in handoff map stay Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args
- Downloaded artifacts stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>