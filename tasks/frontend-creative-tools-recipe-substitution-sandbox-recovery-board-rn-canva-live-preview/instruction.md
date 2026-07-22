<summary>
Manage recipe ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. This concept adapts a design workspace pattern (where desktop edits update mobile preview, timing notes, and a portable share artifact) into a self-contained frontend job.

Stack: React (latest version via Vite), Zustand for shared state, Tailwind CSS 4.3.2 (pinned), Framer Motion for causal motion, and Lucide React for icons.
</summary>

<core_features>
- Recipe Ingredients collection: Create, edit, archive, and filter recipe ingredients with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields preserve the prior valid record and explain recovery.
- Recovery Board surface: Use the recovery board interaction to derive a decision about the collection (move a failed record into a recovery path and repair its downstream consequences). A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Portable work artifact: Export and restore the actual session work in a fresh state. Valid import restores authored structure and regenerates exportedAt. Malformed schema or references make no state change.
- Artifact format: recipe-substitution-v1.json uses the recovery-board schema for export and import, with schemaVersion, exportedAt, records array, derived object, and history array.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The layout presents a desktop primary surface plus summary and inspector.
- Visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent without transforms.
</motion>

<requirements>
- Tailwind CSS 4.3.2 must be installed locally via npm (npm-local/no-CDN). Do not use CDN links for Tailwind, fonts, or icons.
- State is strictly in-memory using Zustand. Do not use localStorage, sessionStorage, or other browser storage APIs. A page reload must return the app to its seeded state.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive behavior: Narrow layouts (mobile) transform secondary surfaces into drawers or stacked steps, change interaction model, preserve touch targets, and avoid horizontal clipping.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Performance: Keep edits responsive on 100+ seeded records and avoid rebuilding unrelated surfaces.
- Seed at least 100 records in the collection for performance verification (including empty, boundary, valid, and conflict states).
- Useful end state: The interoperable recipe-substitution-v1.json session artifact.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below.
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
- Editor object types: recovery-board
- Editor operations: select; update_property; set_content
- Entity: record
- Entity operations: create; select; update; delete; toggle
- Entity fields: status
- Artifact operations: export; import; copy
- Export formats: recipe-substitution-v1.json
- Import modes: recipe-substitution-v1.json

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
