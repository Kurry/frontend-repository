<summary>
Emergency Drill Evacuation Planner — Recovery Board — Canva Live Preview. A frontend application to manage drill checkpoints in a bounded local workflow. The core signature interaction is to move a failed record into a recovery path and repair its downstream consequences. The user job is observable in one connected surface where desktop edits update mobile preview, timing notes, and a portable share artifact (evacuation-drill-v1.json). It uses React and Vite, with Tailwind CSS 4.3.2, and exclusively in-memory state.
</summary>

<core_features>
- Drill Checkpoints collection: Create, edit, archive, and filter drill checkpoints with explicit domain statuses (empty, draft, ready, changed, archived). Validates exact field boundaries. Invalid fields preserve the prior valid record and explain recovery.
- Recovery Board surface: Move a failed record into a recovery path and repair its downstream consequences. Provides undo (Ctrl/Cmd+Z) for the last mutation. Reject conflicting or incomplete mutations without partial updates.
- Portable work artifact: Export and import the session work (evacuation-drill-v1.json). Import applies field-level validation and regenerates exportedAt. Valid import restores authored structure; invalid import makes no state change.
</core_features>

<user_flows>
- Complete user flow: Create, edit, mutate via Recovery Board, undo, and complete one record. The end-to-end job must be recoverable without reload.
</user_flows>

<edge_cases>
- Boundaries and recovery: Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Visual hierarchy: Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- Source fidelity: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas, without copying unrelated screens.
</visual_design>

<motion>
- Causal motion: Moving a failed record into a recovery path connects the acted-on item to its new state via motion. Must have a reduced-motion equivalent.
</motion>

<responsiveness>
- Mobile mode: Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Alternate input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Large collection: Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Domain copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Linked utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- In-memory state only. NO localStorage or other persistence mechanisms are allowed.
- Ensure the useful end state is an interoperable downloadable artifact of the session's actual work (evacuation-drill-v1-recovery-board.json).
- Validate all records and fields before commit; reject unknown enums, duplicate or dangling IDs, cross-field contradictions.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build`.
- Run via `npm start` on port 3000.
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
- Entity operations: create; update; delete; select
- Entity fields: id; title; status; description; area
- Artifact operations: export; import
- Export formats: evacuation-drill-v1
- Import modes: evacuation-drill-v1

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)
- File selection stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
