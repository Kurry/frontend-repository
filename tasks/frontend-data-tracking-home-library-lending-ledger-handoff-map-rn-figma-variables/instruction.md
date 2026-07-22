<summary>
Build a "Home Library Lending Ledger" application with a "Handoff Map" interaction, inspired by Figma Variables (a visual token/prototype editor where variable changes update modes, preview states, and export tokens). The app manages books in a bounded local workflow. It uses a domain-native browser surface where one meaningful mutation (connecting a selected record to a handoff owner and updating readiness) updates linked views and an interoperable artifact. It must have in-memory state only (no localStorage) and provide a useful downloadable interoperable artifact of the session's work.
</summary>

<core_features>
- Books collection: Create, edit, archive, and filter books with explicit domain statuses.
- Handoff Map surface: Use the handoff map interaction to derive a decision about the collection. Connect a selected record to a handoff owner and update readiness.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact (library-lending-v1-handoff-map.json). Clear and import it with field-level validation.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation in the handoff map is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
- The visual hierarchy makes current state and next action clear.
- The visual and interaction thesis is coherent without copying unrelated screens.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Mobile transforms secondary surfaces into drawers or stacked steps.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- At the maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
- Domain copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Optional enhancements the builder may add.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- In-memory state only (no localStorage or sessionStorage).
- Seed a deterministic collection with at least 100 records including empty, boundary, valid, and conflict states.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
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
  "restrictions": []
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
  "restrictions": []
}
</module_spec>

Bindings:
- Entity: book
- Entity operations: create; select; update; delete
- Entity fields: title; status; owner; readiness
- Artifact operations: export; import; copy
- Export formats: library-lending-v1-handoff-map.json
- Import modes: library-lending-v1-handoff-map.json

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
