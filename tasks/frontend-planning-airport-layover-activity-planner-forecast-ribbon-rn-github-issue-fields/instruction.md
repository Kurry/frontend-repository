<summary>
Create a self-contained React frontend to manage layover activities via a domain-native browser surface. It adapts the GitHub issue fields and duplicate merge patterns into a local "Forecast Ribbon" where selecting a record and adjusting its values previews and commits connected outcomes. The application must operate purely in-memory and provide a portable artifact via export/import that includes records, derived state, and history.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
- Layover Activities collection: Create, edit, delete, and filter layover activities (fields include title, duration, cost, status). Valid statuses are empty, draft, ready, changed, archived.
- Forecast Ribbon surface: Select a record, adjust its values on a forecast ribbon to compare projected outcomes (duration/cost vs budget), and commit changes.
- Derived State: Updating a record through the forecast ribbon updates linked views like summary (total duration, total cost) synchronously.
- Undo: Revert the last mutation, restoring prior ordering, selection, and derived values.
</core_features>

<user_flows>
- Creating a layover activity shows it in the list. Selecting it opens the Forecast Ribbon. Adjusting values in the ribbon shows a preview. Saving commits the change to the collection and updates the summary.
</user_flows>

<edge_cases>
- Empty states are handled gracefully.
- Invalid values (e.g. negative duration) trigger inline field-level validation and block submission.
- Undo restores the exact state before the last committed forecast mutation.
- Importing a malformed artifact makes zero state changes.
</edge_cases>

<visual_design>
- A distinctive, calm, focused workbench. Desktop layout features a primary collection view, a summary section, and a detail panel for the Forecast Ribbon.
- Clear visual tokens for activity statuses.
</visual_design>

<motion>
- The acted-on item animates into its new state (e.g. moving between statuses or updating totals). A reduced-motion equivalent must preserve feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts transform the secondary surfaces (forecast ribbon, summary) into drawers or stacked steps to preserve touch targets without horizontal clipping.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation as pointer interactions.
- Semantic HTML and ARIA where appropriate to manage focus.
</accessibility>

<performance>
- Edits remain responsive with up to 100+ records, avoiding full re-renders of unrelated surfaces.
</performance>

<writing>
- Domain copy names the consequence and recovery action precisely (e.g., "Duration exceeds limit", "Adjust duration").
</writing>

<innovation>
- The linked representation gives domain utility beyond basic CRUD by previewing and verifying projected outcomes before committing.
</innovation>

<requirements>
- The application must be built using React and Vite.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Persistence must be strictly in-memory (NO localStorage, sessionStorage, or IndexedDB).
- The exported artifact must be layover-plan-v1.json with schemaVersion, exportedAt, records array, derived object, and history array.
</requirements>

<integrity>
- Zero external network dependencies for runtime functionality.
- The state must be entirely self-contained within the session. Reloading wipes state.
</integrity>

<delivery>
- Provide a working app on port 3000 (`npm start`).
- Implement the `<webmcp_action_contract>` exactly as specified.
- The artifact must be perfectly round-trippable.
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
  "purpose": "CRUD and query operations on a bounded collection of items.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity", "entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP."
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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity: layover_activity
- Entity operations: create; select; update; delete
- Entity fields: title; duration; cost; status
- Artifact operations: export; import
- Export formats: layover-plan-v1
- Import modes: layover-plan-v1

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args.
- Hover, drag, mobile transformations, and animations are Playwright-observed.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
