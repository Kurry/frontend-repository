<summary>
Apparel Fit Annotation Studio — Audit Lens — Job Viewer
Genre: good-app
Target users: People who manage fit annotations in a bounded local workflow

Manage fit annotations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.

This concept adapts The Framework shipped pattern of job viewer keyboard navigation, trial file browsing, plain JSON output, and upload/error handling into a self-contained frontend job.

Source inspiration:
- https://www.clo3d.com/
- https://www.seamwork.com/
- https://github.com/the-framework/core/releases
</summary>

<core_features>
- Create, edit, archive, and filter fit annotations with explicit domain statuses (empty, draft, ready, changed, archived)
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery
- Mutates records[] and status fields in fit-annotations-v1.json
- Attach evidence to a selected record and resolve an audit discrepancy
- Undo the last mutation and inspect the linked representation
- A conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values
- Updates audit-lens geometry/selection, derived summaries, and event history
- Export the current artifact
- Clear and import it with field-level validation
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
- Produces fit-annotations-v1-audit-lens.json with schemaVersion, exportedAt, records, derived, and history
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
- Visual hierarchy makes current state and next action clear
- Desktop primary surface plus summary and inspector
- The visual and interaction thesis is coherent without copying unrelated screens
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state
- Reduced motion preserves feedback without transforms
</motion>

<requirements>
- Persistence: In-memory only; no localStorage or sessionStorage. A page reload returns the app to its seeded state
- State contracts: ApparelFitAnnotationStudioSession with schemaVersion, exportedAt, records[], derived{}, and history[]
- Validation rules: schemaVersion is a task-specific v1 enum (fit-annotations-v1) and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed
- Narrow layouts change interaction model (stack/drawer/stepper), preserve touch targets, and avoid horizontal clipping
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it
- Keep edits responsive on 100+ seeded records and avoid rebuilding unrelated surfaces
- Domain copy names the domain consequence and recovery action precisely
- Stack: React with Vite, Tailwind CSS 4.3.2, Framer Motion, Zustand, React Hook Form, and Zod
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed.
- `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is a required delivery step. Implement exactly the `<webmcp_action_contract>` below.
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
- Editor object types: audit-lens
- Editor properties: evidence-attached, discrepancy-resolved
- Editor modes: idle, active, conflict
- Editor operations: select, update_property, preview
- Entity: fit-annotation
- Entity operations: create, select, update, delete
- Entity fields: id, status, evidence
- Artifact operations: export, import, copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag/resize geometry stays Playwright
- File picker interaction, clipboard copy stay Playwright
</webmcp_action_contract>
