<summary>
Build an interactive fiction branch board and handoff map to manage story nodes. The user manages story nodes through a domain-native browser surface where connecting a selected record to a handoff owner updates readiness, linked views, and an interoperable artifact. Stack: Solid.js with Solid stores or React with Zustand, Tailwind CSS 4.3.2 (pinned), and vanilla motion.dev for animation. No network calls. All state must be entirely in-memory (no localStorage, sessionStorage, or other browser storage APIs). All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Story Nodes collection: Create, edit, archive, and filter story nodes. Story nodes have statuses (e.g. empty, draft, ready, changed, archived).
- Handoff Map surface: A visual interaction where the user can connect a selected record to a handoff owner and update readiness. It includes a linked summary and event history.
- Portable work artifact: Export and import the session data (fiction-branches-v1.json) with strict schema validation. Invalid imports make no changes.
- Undo/redo: Users can undo the last mutation and inspect the linked representation. Undo restores ordering, selection, and derived values.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The layout features a primary desktop surface plus summary and inspector. Mobile screens transform secondary surfaces into drawers or stacked steps without horizontal clipping.
- The visual hierarchy makes the current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Shared application state must use Zustand (in-memory only) to manage story nodes, handoff map state, and history. Do not use localStorage, sessionStorage, or other browser storage APIs.
- The signature mutation is: connect a selected record to a handoff owner and update readiness. This must instantly update the handoff map, derived summaries, and the state ready for export.
- Stack: React, Zustand, Tailwind CSS 4.3.2. All libraries installed via npm and bundled locally; no CDN imports.
- Form inputs and data must validate: The application must enforce field boundaries, catch invalid cross-field values, and reject malformed imports, preserving the prior valid state and explaining recovery.
- Keyboard and touch-equivalent controls must produce the identical canonical mutation as direct manipulation.
- Seed at least 100 records for testing the large collection performance, ensuring the interaction remains responsive.
- Do not use markdown backticks inside core_features or requirements tags.
End artifact format is interoperable JSON containing schemaVersion (v1), exportedAt, records array, derived object, and history array.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
- Editor object types: handoff-map-node
- Editor properties: owner; readiness
- Editor modes: view; connect
- Editor operations: select; update_property; switch_mode
- Entity: story-node
- Entity operations: create; select; update; delete
- Entity fields: title; content; status
- Artifact operations: export; import
- Export formats: fiction-branches-v1.json
- Import modes: fiction-branches-v1.json

Mechanics exclusions:
- Drag/drop geometry of nodes stays Playwright (gesture mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
