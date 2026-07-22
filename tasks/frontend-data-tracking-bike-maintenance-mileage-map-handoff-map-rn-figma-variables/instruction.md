# Bike Maintenance Mileage Map — Handoff Map

<summary>
Build a Bike Maintenance Mileage Map that allows users to manage bike service records through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core interaction is to connect a selected record to a handoff owner and update readiness. This concept adapts the visual token/prototype editor pattern (where variable changes update modes, preview states, and export tokens) into a self-contained frontend job. Build this as a single-page application using React, Vite, Zustand, Tailwind CSS 4.3.2, and Framer Motion, with no backend or network dependencies.
</summary>

<core_features>
Bike Service Records collection: Create, edit, archive, and filter bike service records with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields must preserve the prior valid record and explain recovery.
Handoff Map surface: A visual interaction canvas where users can connect a selected record to a handoff owner and update its readiness. A conflicting or incomplete mutation must be rejected without partial updates. Provide an undo function that restores ordering, selection, and derived values.
Portable work artifact: Users can export the current artifact as bike-maintenance-v1-handoff-map.json and clear/import it with field-level validation. Malformed schema, duplicate IDs, unknown references, or invalid bounds must make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface (handoff map) plus a summary and an inspector; mobile transforms secondary surfaces into drawers or stacked steps without horizontal clipping.
The visual hierarchy makes the current state and next action clear.
Typography and spacing should be clean and consistent, utilizing Tailwind CSS utility classes.
</visual_design>

<motion>
Causal motion: The acted-on item moves or morphs into its new state when connecting a selected record to a handoff owner and updating readiness.
Reduced motion: Support reduced-motion preferences by preserving feedback without transforms (e.g., fast crossfades instead of layout transitions).
</motion>

<requirements>
State Management: Use Zustand for all shared application state (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload must return the app to its seeded state.
Seeded Data: The application must start with a deterministic collection of at least 4 records representing empty, boundary, valid, and conflict states, without any target outcome pre-completed.
Form Validation: Use React Hook Form with Zod for all forms and field validations. Show inline per-field errors.
Schema: Record shape BikeMaintenanceMileageMapSession requires schemaVersion exactly task-specific-v1, exportedAt RFC3339, records array, derived object, and history array. Record ID must be unique. Status values must be explicit enums (e.g., draft, ready, archived). Required fields, numeric/date bounds, and cross-record references validate together.
Alternate Input: Keyboard and touch-equivalent controls must produce the identical canonical mutation as pointer interactions. Ctrl/Cmd+Z undoes the last mutation.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. Unrelated rows should stay stable during the signature interaction.
Icons: Use Lucide React for all icons.
Build Tooling: React 19 (or 18), Vite, Tailwind CSS 4.3.2 (pinned; no CDN), Framer Motion, Zustand, React Hook Form, and Zod. Use npm-local/no-CDN installation. Remove erasableSyntaxOnly from tsconfig if using Vites react-ts template. Use .cjs for ad-hoc node scripts if using ES modules.
End-state Contract: Exporting MUST produce a JSON matching the described schema. Importing MUST validate against the schema.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

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
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: id; status; mileage; notes
- Editor object types: handoff-map-node
- Editor properties: owner; readiness
- Editor operations: select; update_property
- Artifact operations: import; export; copy
- Export formats: bike-maintenance-v1-handoff-map-json
- Import modes: bike-maintenance-v1-handoff-map-json

Mechanics exclusions:
- Drag-and-drop or gesture-based selection on the map stays Playwright-driven.
- Animation and transition effects are observed via Playwright.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
