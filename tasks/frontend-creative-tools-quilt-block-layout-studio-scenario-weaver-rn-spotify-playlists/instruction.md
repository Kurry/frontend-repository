<summary>
Create the Quilt Block Layout Studio — Scenario Weaver, a frontend application where users manage quilt blocks in a bounded local workflow. The core job is a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree, adapted to a finite local artifact. Users can create, edit, archive, and filter quilt blocks; branch a selected record into a scenario to compare linked outcomes; and export/import an interoperable artifact.

The application must use strictly in-memory state (no localStorage).
</summary>

<core_features>
- Quilt Blocks collection: Create, edit, archive, and filter quilt blocks with explicit domain statuses (empty, draft, ready, changed, archived).
- Scenario Weaver surface: Branch a selected record into a scenario and compare linked outcomes. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export quilt-layout-v1-scenario-weaver.json with schemaVersion, exportedAt, records, derived, and history.
</core_features>

<user_flows>
- End-to-end complete job: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
</responsiveness>

<accessibility>
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Alternate input produces identical state with visible focus and live feedback.
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Exercise a seeded collection with at least 100 records: The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely (labels, statuses, errors, and empty-state text).
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD: Mutate a record and use the linked representation to make the next decision.
Optional enhancements the builder may add (none required for a passing build): not covered by basic CRUD, provides additional evidence of scenario tracking utility.
</innovation>

<requirements>
- The application must use React (18+) and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- State must be completely in-memory (e.g. using Zustand or React Context); no localStorage, sessionStorage, or IndexedDB. A page reload returns the app to its seeded state.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed. Ensure at least one record has empty state, one has boundary values, one is valid, and one simulates a conflict state for testing. Seed at least 100 records for performance testing.
- The exported artifact must be quilt-layout-v1-scenario-weaver.json with the shape QuiltBlockLayoutStudioSession: schemaVersion (set to quilt-layout-v1), exportedAt (RFC3339 string), records (array of quilt block records), derived (object), and history (array of actions).
- Record fields must include id (unique), name, status (empty, draft, ready, changed, archived), and any other fields necessary to render the quilt block layout.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI.
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
- Entity: quilt-block
- Entity operations: create; select; update; delete
- Entity fields: name; status; scenario-weaverState
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
