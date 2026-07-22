# Apparel Fit Annotation Studio — Replay Timeline

<summary>
Manage fit annotations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint.
</summary>

<core_features>
Fit Annotations Collection: Create, edit, archive, and filter fit annotations with explicit domain statuses (draft, ready, changed, archived).
Replay Timeline: Scrub a selected record through its timeline (history of edits/mutations) and restore a prior checkpoint. The replay timeline surface, derived summary, and artifact query share one state.
Linked Utilities: The replay timeline mutation changes the primary record, linked view, and status together. Undo the last mutation and inspect the linked representation.
Export and Import: Export the current artifact, clear the session, and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
WebMCP Contract: Implement standard WebMCP tools for data seeding, query, import, and export.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Visual hierarchy makes current state and next action clear.
Desktop layout has a primary surface plus summary and inspector.
Mobile layout transforms secondary surfaces into drawers or stacked steps without horizontal overflow.
Accessible semantic controls, keyboard parity, focus management, live updates, contrast.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
No Persistence: In-memory state only (no localStorage). Export/import is the persistence boundary.
Artifact: The interoperable artifact is fit-annotations-v1-replay-timeline.json. It includes schemaVersion (v1 enum), exportedAt (RFC3339), records[], derived{}, and history[].
Validation: Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set. Tailwind CSS 4.3.2 is required.
</requirements>

<integrity>
Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- timeline-replay-v1

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

<module_spec id="timeline-replay-v1">
{
  "id": "timeline-replay-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Timeline replay",
  "purpose": "History scrub, undo, redo, and checkpoint restore.",
  "permitted_operations": ["scrub", "restore", "undo", "redo"],
  "binding_keys": {
    "required_any_of": [["timeline_operations"]],
    "optional": ["timeline_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No generic state setter."
  ],
  "tool_name_prefix": "timeline"
}
</module_spec>

Bindings:
- Entity: fit-annotation
- Entity operations: create; select; update; delete
- Entity fields: status
- Artifact operations: export; import; copy
- Export formats: fit-annotations-v1-replay-timeline-json
- Import modes: fit-annotations-v1-replay-timeline-json
- Timeline operations: scrub; restore; undo

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard copy stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
