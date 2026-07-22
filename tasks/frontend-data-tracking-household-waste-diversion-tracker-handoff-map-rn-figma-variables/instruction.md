<summary>
Manage waste events through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: connect a selected record to a handoff owner and update readiness.
</summary>

<core_features>
- Waste Events collection: Create, edit, archive, and filter waste events with explicit domain statuses (empty, draft, ready, changed, archived).
- Handoff Map surface: Connect a selected record to a handoff owner and update readiness. Undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation is rejected without partial updates.
- Portable work artifact: Export and restore the actual session work in a fresh state. Clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The handoff map surface, derived summary, and artifact query share one state.
</core_features>

<user_flows>
- Connect a selected record to a handoff owner and update readiness. The handoff map mutation changes the primary record, linked view, and status together.
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Export, clear, import, and inspect the edited variant record and derived state. Authored order/selection/geometry and domain state survive; invalid import is a no-op.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
- Visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely. Inspect labels, statuses, errors, and empty-state text.
</writing>

<requirements>
- Shared application state must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- The end state an interoperable downloadable artifact of the session's actual work: waste-diversion-v1.json (or waste-diversion-v1-handoff-map.json).
- Provide Zod schemas to model the artifact data structures: HouseholdWasteDiversionTrackerSession with schemaVersion (v1), exportedAt, records[], derived{}, and history[].
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed. (Seed at least a few records, maybe one for 100+ perf check if needed, but a few normal ones and one empty state).
- The task must serve on port 3000 via npm start with zero console/page errors.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run npm start and confirm the app serves on port 3000.
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
- Entity fields: id; name; status; weight; type; owner; notes
- Artifact operations: export; import; copy
- Export formats: waste-diversion-v1-json
- Import modes: waste-diversion-v1-json

Mechanics exclusions:
- Drag, resize, and gesture mechanics remain Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
