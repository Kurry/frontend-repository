# Photo Sequence Caption Loom — Recovery Board — Canva Live Preview

<summary>
Create a React frontend application (using Vite, styled with Tailwind CSS 4) that allows users to manage photo sequences in a bounded local workflow. The core functionality is the "Recovery Board", which adapts Canva's shipped pattern of live mobile previews, speaker-time notes, whiteboard pan shortcuts, charts, and custom short links into a self-contained frontend job. The signature interaction is to move a failed record into a recovery path and repair its downstream consequences. The entire application state must be maintained in-memory only (no localStorage or external APIs), and the app must be served locally without CDNs.
</summary>

<core_features>
- **Photo Sequences collection**: Create, edit, archive, and filter photo sequences with explicit domain statuses (empty, draft, ready, changed, archived).
- **Recovery Board surface**: Use the recovery board interaction to derive a decision about the collection. The signature interaction is to move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation. The states are idle, selected, changed, conflict, resolved.
- **Portable work artifact**: Export and restore the actual session work in a fresh state. Export the current artifact; Clear and import it with field-level validation. The states are unsaved, exported, validated, replayed.
- **Linked views**: The recovery board surface, derived summary, and artifact query share one state. Mutating a record in one view must synchronously update all linked views.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
- State: All application state must be in-memory only. Do not use localStorage, sessionStorage, or external APIs. A page reload must reset the app to its seeded state.
- Seed data: Seed a deterministic collection with at least 100 records (empty, boundary, valid, and conflict states) to demonstrate performance. Target outcomes should not be pre-completed.
- File formatting: Use the shape `PhotoSequenceCaptionLoomSession` for export, containing `schemaVersion` (task-specific v1 enum), `exportedAt` (RFC3339), `records` (array of items with explicit enum statuses), `derived`, and `history`.
- Export/Import: The portable work artifact (`photo-caption-v1-recovery-board.json`) uses the recovery-board schema for export and import. Reject invalid records without mutation and regenerate `exportedAt` on import. A valid import restores authored structure.
- Validation: Implement field-level validation for boundaries and cross-record references. Invalid actions give field-level recovery and preserve prior valid state. A conflicting or incomplete mutation in the Recovery Board is rejected without partial updates.
- Undo: `Ctrl`/`Cmd+Z` must undo the signature mutation and restore ordering, selection, and derived values.
- Alternate Input: Keyboard and touch-equivalent controls must produce the identical canonical mutation as mouse interactions.
- Stack: React, Vite, Tailwind CSS 4.3.2.
- Local dependencies only: All assets and libraries must be loaded locally without CDNs.
- Serve: The application must be served on port 3000 via `npm start`.
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
- Editor object types: recovery-board
- Editor properties: state; selection
- Editor modes: idle; selected; changed; conflict; resolved
- Editor operations: select; update_property; switch_mode; preview
- Entity: record
- Entity operations: create; select; update; delete; reorder
- Entity fields: id; status; name; notes
- Artifact operations: export; import; copy
- Export formats: photo-caption-v1-recovery-board.json
- Import modes: photo-caption-v1-recovery-board.json

Mechanics exclusions:
- Drag-and-drop or physical interaction stays Playwright-driven.
- Copy to clipboard or physical download events stay Playwright-observed.
- Viewport size updates for responsive layouts remain Playwright-driven.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
