<summary>
Manage community garden workday tasks via a domain-native browser surface where one canonical mutation updates linked views and an interoperable artifact. Focus: select a work task and "place a selected record in a spatial composer and rebalance capacity", preserving authored state and derived consequences for a clean round-trip. Borrowed pattern: Provenance artifact provenance (scrubbed API keys, source labels, trial downloads, plain JSON, and explicit upload failures) reinterpreted as an interoperable evidence artifact inspector. Must be an in-memory application without localStorage or backend API sync.
</summary>

<core_features>
- Work Tasks collection: Create, edit, archive, and filter work tasks with explicit domain statuses (empty, draft, ready, changed, archived).
- Spatial Composer surface: The user can place a selected record in a spatial composer and rebalance capacity. This is the signature mutation.
- Linked Views: The spatial composer, derived summary, and artifact query all share one state and react instantly.
- Portable work artifact: Export and import the actual session work in a fresh state via garden-workday-v1-spatial-composer.json without silent failure.
- Validation: Accept exact bounds while rejecting out-of-range values. Provide field-level recovery for invalid fields.
- Undo: Ctrl/Cmd+Z or an explicit button to undo the last mutation and inspect the linked representation, restoring ordering, selection, and derived values.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record.
- Use the signature interaction (place a selected record in a spatial composer and rebalance capacity) and observe changes to the primary record, linked view, and status.
- Export, clear, import, and inspect the edited variant record and derived state.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
- Provenance-style artifact inspector: clear read-only rendering of exported metrics, schema versions, explicit upload failure states.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state (e.g. smooth translation when placed in the spatial composer).
- Reduced-motion support: gracefully replaces transforms with instantaneous jumps when preferred.
</motion>

<responsiveness>
- Narrow layouts change the interaction model, preserving touch targets. Desktop primary surface plus summary and inspector becomes a usable stack/drawer/stepper without horizontal overflow on mobile viewports.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation as the signature interaction pointer drag/drop. Visible focus and live feedback.
</accessibility>

<performance>
- Remain responsive with 100+ seeded records. The signature interaction stays fast and unrelated rows stay stable without rebuilding.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
- No placeholder or lorem-ipsum text.
</writing>

<innovation>
Optional enhancements the builder may add (none required for a passing build): a before/after capacity flip view, or a printable workday summary.
</innovation>

<requirements>
- The application must use React 19.x and Tailwind CSS 4.3.2.
- Use in-memory state only (no localStorage, no sessionStorage, no external APIs).
- Must include a downloadable interoperable artifact conforming to garden-workday-v1-spatial-composer.json.
- State contracts: garden-workday-v1.json uses the spatial-composer schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
- All forms must validate inputs and display inline errors without mutating state on failure.
- All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and `/solution/app`.
- Do not add random files to the root directory.
</integrity>

<delivery>
- Produce an original self-contained app in `/solution/app`. Scaffold via `npm create vite@latest . -- --template react-ts` or similar under `/solution/app`.
- The `package.json` must have `start` (serves the app on port 3000) and `verify:build` (exits 0 when build is successful).
- Commit `/solution/app/dist/` if serving build output.
- Serve via `npm start` on port 3000.
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
    "Invokes the same domain command used by the visible control."
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
- Entity: workday-task
- Entity operations: create; select; update; delete
- Entity fields: id; title; status; assignedCapacity
- Artifact operations: export; import
- Export formats: garden-workday-v1-spatial-composer.json
- Import modes: garden-workday-v1-spatial-composer.json

Mechanics exclusions:
- Drag/drop interaction stays Playwright (gesture mechanics).
- Raw file paths/blobs forbidden in WebMCP args.
</webmcp_action_contract>
