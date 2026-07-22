<summary>
Conference Speaker Greenroom Board — Forecast Ribbon — GitHub Issue Fields

Manage speaker slots through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.

This concept adapts GitHub's shipped pattern of issue fields, duplicate detection, saved views, advanced project search, and release information in issue sidebars into a self-contained frontend job.

The application must be a React application using Tailwind CSS 4.3.2. All state must be in-memory only (no localStorage or sessionStorage).
</summary>

<core_features>
- Create, edit, archive, and filter speaker slots with explicit domain statuses (empty, draft, ready, changed, archived).
- Adjust a selected record on a forecast ribbon and compare projected outcomes.
- Undo the last mutation and inspect the linked representation.
- Export the current artifact.
- Clear and import the artifact with field-level validation.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper on mobile.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Invalid required fields preserve the prior valid record and explain recovery, identifying the field, rejected value or rule, and recovery action.
</writing>

<requirements>
- The application must use React.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Persistence: In-memory only; export/import is the persistence boundary. No localStorage or sessionStorage.
- Import/export: speaker-greenroom-v1.json uses the forecast-ribbon schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
- Data format: ConferenceSpeakerGreenroomBoardSession with schemaVersion (v1 enum), exportedAt (RFC3339), records array, derived object, and history array; each record is an API-shaped would-be request body.
- Record IDs are unique and status values are explicit enums (empty, draft, ready, changed, archived).
- Required fields, numeric/date bounds, and cross-record references validate together.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- Serve via npm start on port 3000.
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
- Entity fields: id; status; title; speaker; time; forecastScore
- Artifact operations: export; import
- Export formats: speaker-greenroom-v1
- Import modes: speaker-greenroom-v1

Mechanics exclusions:
- Drag/drop forecast ribbon interaction stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
