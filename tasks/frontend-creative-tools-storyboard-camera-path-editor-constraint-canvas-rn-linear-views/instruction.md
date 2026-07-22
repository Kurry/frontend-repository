# Storyboard Camera Path Editor — Constraint Canvas — Linear Filtered Views

## <summary>
A domain-native browser surface for managing story beats. It features a Constraint Canvas where users can drag a selected record across constraint lanes and resolve a conflict. The app supports a shareable filtered workflow view where grouping, context, and generated updates remain linked. The genre is good-app, which means in-memory state only (no localStorage). All assets must be loaded locally without CDNs. Tailwind CSS 4.3.2 must be used for styling.
</summary>

## <core_features>
- The Constraint Canvas mutation changes the primary record, linked view, and status together (drag a selected record across constraint lanes and resolve a conflict).
</core_features>

## <user_flows>
- Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

## <edge_cases>
- Boundaries and Recovery: Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

## <visual_design>
- Visual Hierarchy: The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
- Design Fidelity: The visual and interaction thesis is coherent without copying unrelated screens.
</visual_design>

## <motion>
- Causal Motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

## <responsiveness>
- Mobile Mode: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports.
</responsiveness>

## <accessibility>
- Alternate Input: Alternate input produces identical state with visible focus and live feedback.
</accessibility>

## <performance>
- Large Collection: The signature interaction remains responsive on a seeded collection with at least 100 records and unrelated rows stay stable.
</performance>

## <writing>
- Domain Copy: Copy names the domain consequence and recovery action precisely.
</writing>

## <innovation>
- Linked Utility: Linked views provide domain utility beyond CRUD.
</innovation>

## <behavioral>
- Portable Work Artifact: Export, clear, import, and inspect the edited variant record and derived state.
</behavioral>

## <technical>
- Schema Contract: Query the current state and export after the mutation. The tool result and artifact contain the declared API-shaped fields.
</technical>

## <requirements>
- Requirement 1: Schema Contract. The tool result and artifact contain the declared API-shaped fields.
- Requirement 2: Boundaries and Recovery. Each invalid action gives field-level recovery and preserves prior valid state.
- Requirement 3: Mobile Mode. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports.
- Requirement 4: Alternate Input. Alternate input produces identical state with visible focus and live feedback.
- Requirement 5: Large Collection. The signature interaction remains responsive on a seeded collection with at least 100 records and unrelated rows stay stable.
- Requirement 6: Domain Copy. Copy names the domain consequence and recovery action precisely.
- Requirement 7: Linked Utility. Linked views provide domain utility beyond CRUD.
- All assets must be loaded locally without CDNs.
- Tailwind CSS 4.3.2 must be used for styling.
</requirements>

## <integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

## <delivery>
- The oracle implementation must serve on port 3000 via npm start with zero console/page errors.
- Include a useful downloadable end state and API-shaped data schemas.
- Expose the standard WebMCP module contract (webmcp_session_info, webmcp_list_tools, webmcp_invoke_tool).
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

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
- Editor object types: story-beat
- Editor operations: select; update_property; set_content
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: status
- Artifact operations: export; import; copy
- Export formats: json
- Import modes: json

Mechanics exclusions:
- Drag across constraint lanes stays Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
