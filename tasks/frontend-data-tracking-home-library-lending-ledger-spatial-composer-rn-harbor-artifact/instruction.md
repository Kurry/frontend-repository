<summary>
Home Library Lending Ledger — Spatial Composer — Provenance Artifact Provenance

Manage books through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.

Existing tools split books editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Provenance's shipped pattern of scrubbed API keys, source labels, trial downloads, plain JSON, and explicit upload failures into a self-contained frontend job.

The user manages a collection of books, placing them into a Spatial Composer to rebalance lending capacity.
</summary>

<core_features>
- Books collection: Create, edit, archive, and filter books with explicit domain statuses.
- Spatial Composer surface: Place a selected record in a spatial composer and rebalance capacity. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export and restore the actual session work in a fresh state. Clear and import it with field-level validation.
</core_features>

<user_flows>
- The user places a selected record in a spatial composer and rebalances capacity, watches linked views react, then exports the completed artifact.
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation in the Spatial Composer is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds during Import make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Visual hierarchy makes current state and next action clear.
- Desktop layout has a primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms (causal parity).
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper on mobile.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- At the maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s.
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked utility: Linked views provide domain utility beyond basic CRUD.
</innovation>

<requirements>
The app must use strictly in-memory state; NO localStorage, sessionStorage, or other persistence mechanisms are allowed. A page reload returns the app to its seeded state.
All libraries must be npm-local (no CDNs).
The application must use Tailwind CSS 4.3.2.

- Seed a deterministic collection with empty, boundary, valid, and conflict states (at least 4 records). No target outcome is pre-completed.
- The exported artifact must use the shape HomeLibraryLendingLedgerSession containing schemaVersion, exportedAt, records (array), derived (object), and history (array).
- The exported format must be named library-lending-v1-spatial-composer.json.
- The Spatial Composer interaction updates records[].spatialComposerState, derived.summary, and history[].
- A CRUD table cannot satisfy the domain-native signature.
- Serve over local HTTP for verification.
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
- Entity: book
- Entity operations: create; update; delete; toggle
- Entity fields: title; status; capacity; spatialComposerState
- Artifact operations: export; import; copy
- Export formats: library-lending-v1-spatial-composer.json
- Import modes: library-lending-v1-spatial-composer.json

Mechanics exclusions:
- Drag/Drop and exact visual composition in Spatial Composer stays Playwright (gesture mechanics)
- File picking for import/export stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
