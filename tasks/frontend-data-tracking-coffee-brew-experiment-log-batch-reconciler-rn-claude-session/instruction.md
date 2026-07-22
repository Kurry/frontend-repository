# Coffee Brew Experiment Log — Batch Reconciler — Claude Session

<summary>
Manage brew experiments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: group selected records into a batch and reconcile aggregate totals. Release-derived concept: a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states.

The application allows users to create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived). It includes a Batch Reconciler surface that allows users to group selected records into a batch and reconcile aggregate totals. It also features a portable work artifact that can be exported and imported.

Stack: React with standard functional state (in-memory only), Tailwind CSS 4.3.2 (pinned); frontend-only. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Brew Experiments collection: Create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived).
- Batch Reconciler surface: Group selected records into a batch and reconcile aggregate totals. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export the current artifact (brew-experiment-v1-batch-reconciler.json). Clear and import it with field-level validation.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The batch reconciler surface, derived summary, and artifact query share one state.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Copy names the domain consequence and recovery action precisely.
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Shared application state must be entirely in-memory. Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- Data Contract: Record shape is CoffeeBrewExperimentLogSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.
  - schemaVersion is a task-specific v1 enum ('v1') and exportedAt is RFC3339.
  - Record IDs are unique and status values are explicit enums ('empty', 'draft', 'ready', 'changed', 'archived').
  - Export/import is the persistence boundary.
  - brew-experiment-v1.json uses the batch-reconciler schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
  - Round trip: Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
  - Include at least 4 saved records so the collection is non-empty on first load.
- Validation:
  - Exact field boundaries are accepted while adjacent out-of-range values are rejected.
  - Invalid required fields preserve the prior valid record and explain recovery.
  - A conflicting or incomplete mutation is rejected without partial updates.
  - Undo restores ordering, selection, and derived values.
  - Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: status; batch
- Artifact operations: export; import; copy
- Export formats: brew-experiment-v1-batch-reconciler
- Import modes: brew-experiment-v1-batch-reconciler

Mechanics exclusions:
- Real gesture, touch, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
