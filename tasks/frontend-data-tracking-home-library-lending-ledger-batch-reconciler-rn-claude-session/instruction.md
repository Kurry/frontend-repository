<summary>
Manage books through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: group selected records into a batch and reconcile aggregate totals. Release-derived concept: a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states.

Stack: React 18 with Zustand (or similar in-memory state), Tailwind CSS 4.3.2, and Framer Motion for animations. All assets must be loaded locally without CDNs.
</summary>

<core_features>
The primary domain mutation allows users to group selected records into a batch and reconcile aggregate totals.
The batch reconciler mutation changes the primary record, linked view, and status together.
The application supports creating, editing, archiving, and filtering books with explicit domain statuses.
There is a portable work artifact feature that allows exporting and restoring the actual session work in a fresh state.
The application includes a local session ledger exposing save health, tool-output retention, safe resume, and recovery states.
</core_features>

<visual_design>
The visual hierarchy makes the current state and next action clear, with a distinctive workbench layout.
The design features clear state tokens, intentional density, and a calm, focused canvas.
</visual_design>

<motion>
Motion connects the acted-on item to its new state, visually representing the reconciliation action.
The application provides a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
The state must be exclusively in-memory, with no use of localStorage, sessionStorage, or remote backend syncs.
Validating record boundaries must be strictly enforced, rejecting adjacent out-of-range values.
Exported artifacts must strictly follow the library-lending-v1-batch-reconciler.json schema.
A valid import restores the authored structure and regenerates the exportedAt timestamp.
The implementation must pass an exact round-trip verification: exporting, clearing, importing, and comparing the derived state.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the contract; register tools yourself using the same handlers as the visible UI; honor mechanics exclusions.
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
- Entity: book
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; author; status
- Editor object types: batch-reconciler
- Editor operations: select; update_property; set_content
- Editor properties: aggregate_totals; batch_status
- Artifact operations: export; import; copy
- Export formats: library-lending-v1-batch-reconciler-json
- Import modes: library-lending-v1-batch-reconciler-json

Mechanics exclusions:
- Drag-and-drop, gesture mechanics stay Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
