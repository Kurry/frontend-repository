<summary>
Manage invoices through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact.
Variant focus: trace a selected record to source evidence and quarantine a bad lineage.
Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence.
Stack: React, Tailwind CSS 4.3.2, Lucide React icons. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Invoices collection: Create, edit, archive, and filter invoices with explicit domain statuses (empty, draft, ready, changed, archived). Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery. Shared-state/artifact effect: Mutates records[] and status fields in invoice-aging-v1.json.
Provenance Atlas surface: Use the provenance atlas interaction to derive a decision about the collection. Trace a selected record to source evidence and quarantine a bad lineage. Undo the last mutation and inspect the linked representation. Visible states: idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. Shared-state/artifact effect: Updates provenance-atlas geometry/selection, derived summaries, and event history.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact. Clear and import it with field-level validation. Visible states: unsaved, exported, validated, replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt. Shared-state/artifact effect: Produces invoice-aging-v1.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<user_flows>
Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Linked views provide domain utility beyond CRUD. Mutate a record and use the linked representation to make the next decision.
</innovation>

<requirements>
The app state must be in-memory only; no localStorage or remote network calls.
Seed a deterministic collection with at least 100 records including empty, boundary, valid, and conflict states; no target outcome is pre-completed.
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Linked views: The provenance atlas surface, derived summary, and artifact query share one state.
Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Artifact Shape:
FreelanceInvoiceAgingLensSession with schemaVersion="v1", exportedAt (RFC3339), records[], derived{}, and history[]. Each record is an API-shaped would-be request body.
Export/import: invoice-aging-v1.json uses the provenance-atlas schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
All assets must be loaded locally without CDNs. All libraries installed via npm and bundled locally.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in /app. Serve on port 3000 via npm start. Provide a verify:build script.
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
- Entity: invoice
- Entity operations: create; select; update; delete
- Entity fields: id; client; amount; status; sourceEvidence; quarantineReason; lineage
- Artifact operations: export; import; copy
- Export formats: invoice-aging-v1.json
- Import modes: invoice-aging-v1.json

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright
- Mirror-partner cell painting during continuous drag stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- PNG rasterization fidelity and clipboard copy stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
