<summary>
Carry-On Packing Optimizer — Spatial Composer is a frontend web application that helps users manage packing items in a bounded local workflow. It features a spatial composer where users can place selected records to rebalance capacity, derived decision summaries, and a portable artifact workflow with redaction, source lineage, downloadable files, and no silent failure.
</summary>

<core_features>
- Create, edit, archive, and filter packing items with explicit domain statuses (empty, draft, ready, changed, archived)
- Place a selected record in a spatial composer and rebalance capacity (signature interaction)
- Undo the last mutation and inspect the linked representation
- Export the current artifact as carry-on-pack-v1.json
- Clear the current session and import an artifact with field-level validation
</core_features>

<user_flows>
- Create, edit, mutate (place a selected record in a spatial composer and rebalance capacity), undo, and complete one record. The end-to-end job must be recoverable without reload.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete spatial mutation is rejected without partial updates.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change on import. A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear, with desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state when placed in the spatial composer.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping. Desktop surface becomes a usable stack/drawer/stepper on mobile.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable.
- Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Error copy must identify the field, rejected value or rule, and recovery action.
</writing>

<innovation>
- Linked utility: Mutating a record and using the linked representation to make the next decision provides domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use React/Vite with Tailwind CSS 4.3.2. All libraries must be npm-local (no CDNs).
- State must be in-memory only; NO localStorage, sessionStorage, or other persistence mechanisms. A page reload must return the app to its clean seeded state.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- The useful end state is an interoperable downloadable artifact (carry-on-pack-v1.json) containing schemaVersion, exportedAt, records, derived, and history.
- Validation rules: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums.
- The app must serve on port 3000 via npm start.
- No brand names like "Provenance" in the oracle code. Substitute with "Provenance" or generic terms.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step. Implement exactly the `<webmcp_action_contract>` below.
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
- Entity: packing-item
- Entity operations: create; select; update; delete
- Entity fields: id; name; status; weight; volume; placed
- Artifact operations: export; import; copy
- Export formats: carry-on-pack-v1-json
- Import modes: carry-on-pack-v1-json

Mechanics exclusions:
- Drag-and-drop or geometric spatial composition stays Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args.
</webmcp_action_contract>
