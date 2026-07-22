<summary>
Manage plant observations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence.

Existing tools split plant observations editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Slack's shipped pattern of embedded workflows, real-time data, approval before AI edits, templates, and analytics into a self-contained frontend job.

The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
</summary>

<core_features>
- Plant Observations collection: Create, edit, archive, and filter plant observations with explicit domain statuses (e.g. empty, draft, ready, changed, archived).
- Provenance Atlas surface: Use the provenance atlas interaction to derive a decision about the collection. The signature interaction is "trace a selected record to source evidence and quarantine a bad lineage".
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact to plant-growth-v1-provenance-atlas.json. Clear and import it with field-level validation.
- Undo the last mutation and inspect the linked representation. Undo restores ordering, selection, and derived values.
</core_features>

<user_flows>
- The user traces a selected record to source evidence and quarantines a bad lineage, watches linked views react, then exports the completed artifact.
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
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
- Copy names the domain consequence and recovery action precisely.
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
</writing>

<requirements>
- The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- The useful end state is an interoperable downloadable artifact plant-growth-v1-provenance-atlas.json.
- Record shape: IndoorPlantGrowthJournalSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- A valid import restores authored structure and regenerates exportedAt.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below.
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
- Entity fields: id; status; sourceEvidence; quarantined
- Artifact operations: export; import; copy
- Export formats: plant-growth-v1-provenance-atlas.json
- Import modes: plant-growth-v1-provenance-atlas.json

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- window.webmcp_session_info = async () => ({ task_id: "eval-intelligence/frontend-data-tracking-indoor-plant-growth-journal-provenance-atlas-rn-slack-canvas" })
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
