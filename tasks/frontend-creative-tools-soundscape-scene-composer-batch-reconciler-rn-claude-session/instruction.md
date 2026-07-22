# Soundscape Scene Composer — Batch Reconciler

<summary>
A React+Vite web application using Tailwind CSS 4.3.2 for composing and reconciling soundscape scenes locally.
The application manages sound layers (records) and allows users to group selected records into a batch and reconcile aggregate totals.
It relies solely on in-memory Solid or Zustand stores (no localStorage, sessionStorage, or external APIs).
All assets must be loaded locally without CDNs.
</summary>

<core_features>
Users can create, edit, archive, and filter sound layers with explicit domain statuses (empty, draft, ready, changed, archived).
Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Invalid required fields preserve the prior valid record and explain recovery.
Users can select multiple sound layers, group them into a batch, and reconcile aggregate totals.
Reconciling updates the aggregate summary and linked views immediately.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Users can export the entire soundscape scene as a JSON artifact (soundscape-scene-v1-batch-reconciler.json).
Users can clear the session and import a previously exported JSON artifact with full field-level validation.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Visual hierarchy clearly indicates current state (e.g. idle, selected, changed, conflict, resolved) and next actions.
Layout features a desktop primary surface plus summary and inspector.
Mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state (causal motion).
Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
Shared application state must use in-memory stores only (no localStorage, sessionStorage, or remote APIs).
The state includes records, derived state (such as aggregate summaries), and history for undo functionality.
The UI must include a primary work surface, linked summary, and detail panel.
The signature interaction (group selected records into a batch and reconcile aggregate totals) must simultaneously update the primary record, linked view, and status.
Stack: React with Vite, Tailwind CSS 4.3.2 (pinned). No component libraries other than basic Radix/HeadlessUI if needed, but styling must be Tailwind.
The tool result and artifact contain the declared API-shaped fields (SoundscapeSceneComposerSession with schemaVersion v1, exportedAt as RFC3339, records, derived, history).
Alternate input: Keyboard and touch-equivalent controls must produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Responsive design: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Performance: Editing remains responsive with 100+ seeded records and unrelated surfaces do not rebuild.
All forms and imports must validate strictly via an API-shaped contract.
All assets must be loaded locally without CDNs.
Serve over local HTTP on port 3000 for verification.
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
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder", "batch_mutate"],
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
- Entity operations: create; select; update; delete; batch_mutate
- Entity fields: id; name; status; volume; pan; length
- Artifact operations: export; import; copy
- Export formats: soundscape-scene-v1-batch-reconciler-json
- Import modes: soundscape-scene-v1-batch-reconciler-json

Mechanics exclusions:
- Drag/drop
- Audio playback

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
