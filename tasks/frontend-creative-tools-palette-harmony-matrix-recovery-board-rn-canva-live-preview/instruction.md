<summary>
Build a Palette Harmony Matrix — Recovery Board — Canva Live Preview tool using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte. The app manages colors through a domain-native browser surface where mutating a failed record to a recovery path repairs downstream consequences. The app produces the operator's session artifact: a downloadable and copyable Session JSON document plus a branded PNG compiled live from the recovery board, tool state, and saved records, conforming to the API-shaped field contracts with an Import feature that round-trips that JSON. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Colors collection —
- Create, edit, archive, and filter colors with explicit domain statuses (empty, draft, ready, changed, archived).
- Direct mutation changes the primary record, linked view, and status together.
- Filter or reorder records by domain state.
- Exact field boundaries are accepted; adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and display inline validation explaining recovery.

Feature: Recovery Board surface —
- Use a recovery board interaction to move a failed record into a recovery path and repair its downstream consequences.
- Visible states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo the last mutation to restore ordering, selection, and derived values.
- Updates recovery-board geometry/selection, derived summaries, and event history in a shared state.

Feature: Portable work artifact (useful end state) —
- Export and restore the actual session work in a fresh state.
- Export opens a surface with two tabs: Session JSON and PNG.
- Copy writes the Session JSON to the clipboard; Download triggers a real file download of the preview.
- Import clears the current session and imports a valid payload with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.

Session field contract:
- schemaVersion: exactly palette-harmony-v1
- exportedAt: RFC3339 string (regenerated on import)
- records: array of PaletteHarmonyMatrixSession objects (ID, status, colors)
- derived: object with recovery-boardState, summary
- history: array of events
</core_features>

<user_flows>
- Complete user flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
- Artifact round trip: Export, clear, import, and inspect the edited variant record and derived state. Authored order/selection/geometry and domain state survive; invalid import is a no-op.
</user_flows>

<edge_cases>
- Boundaries and recovery: Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Visual hierarchy: The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
- Desktop primary surface plus summary and inspector.
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Causal motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Mobile mode: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
</responsiveness>

<accessibility>
- Alternate input: Alternate input produces identical state with visible focus and live feedback using keyboard and touch-equivalent controls.
</accessibility>

<performance>
- Large collection: The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
</performance>

<writing>
- Domain copy: Copy names the domain consequence and recovery action precisely across labels, statuses, errors, and empty-state text.
</writing>

<innovation>
- Linked utility: Linked views provide domain utility beyond CRUD when mutating a record.
</innovation>

<requirements>
Shared application state must use Solid stores (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs.
Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2 (pinned), and Kobalte. All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
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
- Entity fields: colors; status
- Artifact operations: export; import
- Export formats: session-json; png
- Import modes: session-json

Mechanics exclusions:
- Drag, resize, and touch gestures stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
