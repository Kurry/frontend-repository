<summary>
Manage fit annotations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.
</summary>

<core_features>
- Fit Annotations Collection: Create, edit, archive, and filter fit annotations. Domain statuses are explicit enums: empty, draft, ready, changed, archived. Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Recovery Board Surface: A visual board to manage records. The signature interaction is to move a failed record into a recovery path and repair its downstream consequences. This mutation changes the primary record, linked view (derived summary), and status together. A conflicting or incomplete mutation is rejected without partial updates.
- Undo Support: Undo the last mutation and inspect the linked representation. Undo restores ordering, selection, and derived values.
- Portable Work Artifact: Export and restore the actual session work in a fresh state. Export the current artifact as fit-annotations-v1.json. Clear and import it with field-level validation.
- Linked Utility: Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- Complete User Flow: Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</core_features>

<visual_design>
- Visual Hierarchy: The visual hierarchy makes the current state and next action clear on the primary work surface, linked summary, and detail panel.
- Domain Copy: Labels, statuses, errors, and empty-state text name the domain consequence and recovery action precisely.
- Design Fidelity: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The visual and interaction thesis is coherent.
- Responsive Behavior (Mobile Mode): Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</visual_design>

<motion>
- Causal Motion: Motion connects the acted-on item to its new state (e.g., when moving a failed record into a recovery path) and has a reduced-motion equivalent. Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Tech Stack: React, Vite, Tailwind CSS 4.3.2, Zustand.
- State Persistence: In-memory only; no localStorage, sessionStorage, or indexedDB. Export/import is the persistence boundary.
- Schema Contract: The exported artifact fit-annotations-v1.json must be a JSON object with schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records (array), derived (object), and history (array). Record IDs must be unique, and status values must be explicit enums (empty, draft, ready, changed, archived, conflict, resolved). Required fields, numeric/date bounds, and cross-record references validate together.
- Boundary & Recovery (Import): Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
- Alternate Input: Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
- Performance (Large Collection): Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates (using aria-live), contrast, and reduced-motion support.
- Pre-seeded Data: Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed. Include at least 100 records for performance validation.
- Delivery: Serve the app on port 3000 via npm start. Zero console/page errors.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- Entity: fit-annotation
- Entity operations: create; select; update; delete
- Entity fields: status
- Artifact operations: export; import
- Export formats: fit-annotations-v1
- Import modes: fit-annotations-v1

Mechanics exclusions:
- Drag, resize, and gesture mechanics remain Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.
</webmcp_action_contract>
