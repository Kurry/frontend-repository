<summary>
Build a Photo Sequence Caption Loom — Handoff Map frontend application where users manage photo sequences in a bounded local workflow. The canonical variant mutation is connecting a selected record to a handoff owner and updating readiness. The application uses entirely in-memory state (good-app genre) except when exporting/importing the portable work artifact.
</summary>

<core_features>
- Feature: Photo Sequences collection
  - Create, edit, archive, and filter photo sequences with explicit domain statuses.
  - Users can create/edit/delete one record at a time.
  - Filter or reorder records by domain state.
  - Visible states: empty, draft, ready, changed, archived.
  - Invalid required fields preserve the prior valid record and explain recovery.
  - Shared-state/artifact effect: Mutates records array and status fields in photo-caption-v1-handoff-map.json.
- Feature: Handoff Map surface
  - Use the handoff map interaction to derive a decision about the collection.
  - Connect a selected record to a handoff owner and update readiness.
  - Undo the last mutation and inspect the linked representation.
  - Visible states: idle, selected, changed, conflict, resolved.
  - A conflicting or incomplete mutation is rejected without partial updates.
  - Undo restores ordering, selection, and derived values.
  - Shared-state/artifact effect: Updates handoff-map geometry/selection, derived summaries, and event history.
- Feature: Portable work artifact
  - Export and restore the actual session work in a fresh state.
  - Export the current artifact to photo-caption-v1-handoff-map.json.
  - Clear and import it with field-level validation.
  - Visible states: unsaved, exported, validated, replayed.
  - Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
  - A valid import restores authored structure and regenerates exportedAt.
  - Shared-state/artifact effect: Produces photo-caption-v1.json with schemaVersion, exportedAt, records, derived state, and history.
  - The portable work artifact schema shape:
    - schemaVersion (enum: "v1")
    - exportedAt (RFC3339 string)
    - records (Array of objects, explicit enum statuses)
    - derived (Object)
    - history (Array of events)
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout: Primary surface plus summary and inspector.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion (prefers-reduced-motion) preserves feedback without transforms.
</motion>

<requirements>
- State must be entirely in-memory. NO localStorage or sessionStorage.
- Use Tailwind CSS 4.3.2.
- All assets must be loaded locally without CDNs.
- Bounded collection, three linked views, one canonical domain mutation, undo, validation, WebMCP, and artifact round trip.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
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
- structured-editor-v1

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

Bindings:
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: id; status; title; owner
- Artifact operations: export; import
- Export formats: photo-caption-v1-handoff-map.json
- Import modes: photo-caption-v1-handoff-map.json
- Editor object types: handoff-map-connection
- Editor operations: add; delete; select

Mechanics exclusions:
- Drag/drop gestures for handoff mapping stay Playwright
- File dialog interaction for import/export stays Playwright
</webmcp_action_contract>