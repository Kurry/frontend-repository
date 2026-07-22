<summary>
Build an Apparel Fit Annotation Studio using React, Vite, Zustand, Tailwind CSS 4.3.2, and framer-motion. The app manages fit annotations through a domain-native browser surface where one meaningful mutation (adjust a selected record on a forecast ribbon) updates linked views and an interoperable artifact (fit-annotations-v1-forecast-ribbon.json). It interprets GitHub's shipped pattern of issue fields into a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.
</summary>

<core_features>
Feature: Fit Annotations collection —
- Seed a deterministic collection of fit annotations with at least 100 records showing empty, boundary, valid, and conflict states, ensuring no target outcome is pre-completed.
- Collection supports create, edit, archive, and delete operations.
- Explicit domain statuses for records: empty, draft, ready, changed, archived.
- Filter or reorder records by domain state in a saved queries side-panel.
- GitHub Issue Fields pattern: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery via inline validation.

Feature: Forecast Ribbon surface (Signature Interaction) —
- A forecast ribbon interaction to derive a decision about the collection.
- Signature interaction: adjust a selected record on a forecast ribbon and compare projected outcomes. The forecast ribbon mutation changes the primary record, linked view, and status together.
- Visible ribbon states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo button restores ordering, selection, and derived values of the last mutation.
- The forecast ribbon surface, derived summary, and artifact query share one state.

Feature: Portable work artifact (Export/Import) —
- Export the current artifact, generating fit-annotations-v1-forecast-ribbon.json.
- The export contains the declared API-shaped fields and regenerates the exportedAt timestamp.
- Clear the workspace, and import the JSON with field-level validation.
- A valid import restores authored structure, authored order/selection/geometry, domain state, derived state, and history.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change during import (invalid import is a no-op).

Data and Artifact Contract:
- ApparelFitAnnotationStudioSession object is the root of the JSON artifact.
- schemaVersion: exactly fit-annotations-v1 enum.
- exportedAt: valid RFC3339 timestamp.
- records: array of annotation objects. Record IDs must be unique. Status values are explicit enums (empty, draft, ready, changed, archived).
- derived: object containing derived summary state.
- history: array preserving event history for undo.
- Required fields, numeric/date bounds, and cross-record references validate together.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Visual hierarchy makes current state and next action clear, with desktop primary surface plus summary and inspector.
- The visual and interaction thesis is coherent without copying unrelated screens (do not just copy GitHub's branding, reinterpret the pattern).
</visual_design>

<motion>
- Causal motion: the acted-on item moves or morphs into its new state.
- Reduced motion equivalent: with prefers-reduced-motion set, animations are removed or replaced with instant transitions while preserving feedback without transforms.
</motion>

<responsiveness>
- Mobile mode: at a narrow viewport, use the signature interaction. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
- Alternate input parity: repeat the signature interaction with keyboard and touch-equivalent controls.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, focus management, live updates, contrast, and reduced-motion support.
- Visible focus and live feedback during alternate input.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Large collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked utility: mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- Stack: React 18+, Vite, Zustand (for shared state), Tailwind CSS 4.3.2, lucide-react, framer-motion, react-hook-form, zod.
- No localStorage or external database. State is strictly in-memory.
- A page reload returns the app to its seeded state.
- All forms are driven by react-hook-form paired with a Zod schema for inline validation.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool only.
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
- Editor object types: forecast-ribbon-record
- Editor properties: projection, priority, release
- Editor modes: adjust, compare
- Editor operations: select, update_property, switch_mode
- Entity: fit-annotation
- Entity operations: create, select, update, delete
- Entity fields: status, typed-fields, duplicate-merge-id, saved-query, release-provenance
- Artifact operations: export, import, copy
- Export formats: fit-annotations-v1-forecast-ribbon.json
- Import modes: fit-annotations-v1-forecast-ribbon.json

Mechanics exclusions:
- Drag/resize on the forecast ribbon stays Playwright (gesture mechanics).
- Canvas panning and complex morphs stay Playwright-observed.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
