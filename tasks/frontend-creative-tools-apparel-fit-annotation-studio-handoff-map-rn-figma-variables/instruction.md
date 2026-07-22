# Task: Apparel Fit Annotation Studio — Handoff Map — Figma Variables

**Genre:** `good-app`
**Target users:** People who manage fit annotations in a bounded local workflow

## <summary>
Manage fit annotations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: connect a selected record to a handoff owner and update readiness. Release-derived concept: a visual token/prototype editor where variable changes update modes, preview states, and export tokens.

Existing tools split fit annotations editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Figma's shipped pattern of variable modes, expressions, conditionals, and code-to-canvas design-system synchronization into a self-contained frontend job.
</summary>

## <core_features>
Complete the Fit Annotations collection before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.
Create, edit, archive, and filter fit annotations with explicit domain statuses.
Create, edit, and delete one record.
Filter or reorder records by domain state.
Visible states: empty, draft, ready, changed, archived.
Exact field boundaries are accepted while adjacent out-of-range values are rejected.
Invalid required fields preserve the prior valid record and explain recovery.
Mutates records array and status fields in the shared state.

Complete the Handoff Map surface before moving on.
Use the handoff map interaction to derive a decision about the collection.
Connect a selected record to a handoff owner and update readiness.
Undo the last mutation and inspect the linked representation.
Visible states: idle, selected, changed, conflict, resolved.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Updates handoff-map geometry and selection, derived summaries, and event history.

Complete the Portable work artifact before moving on.
Export and restore the actual session work in a fresh state.
Export the current artifact.
Clear and import it with field-level validation.
Visible states: unsaved, exported, validated, replayed.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
Produces a session json with schemaVersion, exportedAt, records, derived state, and history.

Data contract details:
Record shape is ApparelFitAnnotationStudioSession with schemaVersion, exportedAt, records array, derived object, and history array. Each record is an API-shaped would-be request body.
schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
Record IDs are unique and status values are explicit enums.
Required fields, numeric and date bounds, and cross-record references validate together.
Persistence is in-memory only; export and import is the persistence boundary. No localStorage.
Import and export uses the handoff-map schema, rejects invalid records without mutation, and regenerates exportedAt.
Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
</core_features>

## <visual_design>
The user connects a selected record to a handoff owner and updates readiness, watches linked views react, then exports the completed artifact.
The signature interaction is connecting a selected record to a handoff owner and updating readiness.
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Undo undoes it.
Linked views: The handoff map surface, derived summary, and artifact query share one state.
Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

## <motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

## <requirements>
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support are implemented.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
Stack: React, Vite, Zustand, Tailwind CSS 4.3.2 (pinned), date-fns. No other libraries.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
State must be purely in-memory.
</requirements>

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
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; state; owner
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Gestures for drag/drop remain Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
