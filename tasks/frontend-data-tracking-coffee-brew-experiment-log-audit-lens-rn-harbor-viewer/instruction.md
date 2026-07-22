# Coffee Brew Experiment Log — Audit Lens — Workflow Viewer

<summary>
Manage brew experiments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.

Stack: React (latest), Tailwind CSS 4.3.2, Vite. The app must run completely in the browser (in-memory state only). No localStorage, sessionStorage, or remote APIs.
All assets must be loaded locally without CDNs.
</summary>

<core_features>
Brew Experiments collection
Create, edit, archive, and filter brew experiments with explicit domain statuses.
Create, edit, delete one record.
Filter or reorder records by domain state.
Visible states: empty, draft, ready, changed, archived.
Boundaries and recovery: Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Shared-state/artifact effect: Mutates records array and status fields in brew-experiment-v1.json.

Audit Lens surface
Use the audit lens interaction to derive a decision about the collection.
Attach evidence to a selected record and resolve an audit discrepancy.
Undo the last mutation and inspect the linked representation.
Visible states: idle, selected, changed, conflict, resolved.
Boundaries and recovery: A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Shared-state/artifact effect: Updates audit-lens geometry/selection, derived summaries, and event history.

Portable work artifact
Export and restore the actual session work in a fresh state.
Export the current artifact.
Clear and import it with field-level validation.
Visible states: unsaved, exported, validated, replayed.
Boundaries and recovery: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
Shared-state/artifact effect: Produces brew-experiment-v1.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
Data and artifact contract:
Record shape: CoffeeBrewExperimentLogSession with schemaVersion, exportedAt, records array, derived object, and history array; each record is an API-shaped would-be request body.
Validation rules: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together.
Persistence: In-memory only; export/import is the persistence boundary.
Import/export: brew-experiment-v1.json uses the audit-lens schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
Useful end artifact: Interoperable brew experiments session artifact in brew-experiment-v1-audit-lens.json.
Round trip: Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Linked views: The audit lens surface, derived summary, and artifact query share one state.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed (seed at least 100 records for performance testing).
All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Entity fields: status; evidence
- Artifact operations: export; import
- Export formats: brew-experiment-v1-audit-lens
- Import modes: brew-experiment-v1-audit-lens

Mechanics exclusions:
- Drag, scroll, animation
- Focus, hover
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
