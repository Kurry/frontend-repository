<summary>
Manage work tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence.

This task makes the connected user job observable in one frontend-only product.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Work Tasks collection: Create, edit, archive, and filter work tasks with explicit domain statuses.
Provenance Atlas surface: Use the provenance atlas interaction to derive a decision about the collection. Trace a selected record to source evidence and quarantine a bad lineage. Undo the last mutation and inspect the linked representation.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, and clear and import it with field-level validation.
</core_features>

<user_flows>
The user traces a selected record to source evidence and quarantines a bad lineage, watches linked views react, then exports the completed artifact.
Create, edit, mutate, undo, and complete one record.
</user_flows>

<edge_cases>
Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Invalid required fields preserve the prior valid record and explain recovery.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
Record IDs are unique and status values are explicit enums.
Required fields, numeric/date bounds, and cross-record references validate together.
In-memory only; export/import is the persistence boundary.
App must be built with Tailwind CSS 4.3.2 and installed locally via npm (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Complete all functionality, states, constraints, UI/UX requirements, and export/import contracts in `/app` and produce a running build on port 3000.
</delivery>

<webmcp_action_contract>
# WebMCP action contract

The app must expose `window.webmcp_session_info`, `window.webmcp_list_tools`, and `window.webmcp_invoke_tool` to allow automated verification. The verifier will invoke these tools to test state mutations and assertions. The app must implement the following tools:

## Tools

### `entity_create_record`
Create a new entity record.

**Arguments:**
- `record` (object) The record data to create. Must conform to the schema required by the domain.

**Returns:**
- `success` (boolean) true if the operation succeeded.
- `id` (string) The ID of the created record.
- `error` (string, optional) Error message if the operation failed.

### `entity_update_record`
Update an existing entity record.

**Arguments:**
- `id` (string) The ID of the record to update.
- `updates` (object) Partial or complete record data to update.

**Returns:**
- `success` (boolean) true if the operation succeeded.
- `error` (string, optional) Error message if the operation failed.

### `artifact_export_session_json`
Export the entire session state as a structured JSON artifact.

**Arguments:**
None

**Returns:**
- `success` (boolean) true if the operation succeeded.
- `artifact` (object) The exported session data matching the domain schema.
- `error` (string, optional) Error message if the operation failed.

### `artifact_import_session_json`
Import a structured JSON artifact to replace the session state.

**Arguments:**
- `artifact` (object) The session data to import. Must match the domain schema.

**Returns:**
- `success` (boolean) true if the operation succeeded.
- `error` (string, optional) Error message if the operation failed.
</webmcp_action_contract>
