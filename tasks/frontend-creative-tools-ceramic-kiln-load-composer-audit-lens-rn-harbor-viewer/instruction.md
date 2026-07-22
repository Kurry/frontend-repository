<summary>
Build a Ceramic Kiln Load Composer using React, Vite, Tailwind CSS 4.3.2, and Zustand. The app produces the operator's session artifact: a downloadable and copyable Session JSON document compiled live from the collection, audit lens state, and history.
</summary>

# Task proposal: Ceramic Kiln Load Composer — Audit Lens — H-Viewer

**Proposed slug:** `frontend-creative-tools-ceramic-kiln-load-composer-audit-lens-rn-h-viewer`
**Genre:** `good-app`
**Target users:** People who manage kiln pieces in a bounded local workflow

## Whole job

Manage kiln pieces through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.

Existing tools split kiln pieces editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts H-Framework's shipped pattern of job viewer keyboard navigation, trial file browsing, plain JSON output, and upload/error handling into a self-contained frontend job.

### Source inspiration

- https://ceramicartsnetwork.org/
- https://www.skutt.com/
- https://github.com/h-framework/h-viewer/releases

### Why this belongs in the corpus

- Canonical variant mutation: attach evidence to a selected record and resolve an audit discrepancy.
- The artifact kiln-load-v1.json preserves authored state and derived consequences for a clean round trip.
- Release-note lineage (H-Framework): a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery; the borrowed pattern is reinterpreted as a finite local artifact, not copied branding.

<core_features>

Feature groups

Depth-first execution is mandatory for this group: complete its named outcome, every interaction and visible state, every connected view and derived/artifact effect, then exhaust enhancements, boundary and invalid/empty/conflict cases, recovery/undo/retry, alternate input, responsive behavior, accessibility, motion, and polish before beginning the next group. A feature is incomplete while any connected state, edge case, recovery path, or TODO/shallow placeholder remains.

Kiln Pieces collection

Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.

Outcome: Create, edit, archive, and filter kiln pieces with explicit domain statuses.

Interactions

- Create/edit/delete one record
- Filter or reorder records by domain state

Visible states: empty, draft, ready, changed, archived

Boundaries and recovery

- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.

Shared-state/artifact effect: Mutates records[] and status fields in kiln-load-v1.json.

Audit Lens surface

Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.

Outcome: Use the audit lens interaction to derive a decision about the collection.

Interactions

- attach evidence to a selected record and resolve an audit discrepancy
- Undo the last mutation and inspect the linked representation

Visible states: idle, selected, changed, conflict, resolved

Boundaries and recovery

- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.

Shared-state/artifact effect: Updates audit-lens geometry/selection, derived summaries, and event history.

Portable work artifact

Complete this group before moving on: follow every connection from its mutation through linked surfaces and artifacts, implement all states and recovery paths, then verify edge cases and power-user enhancements end to end.

Outcome: Export and restore the actual session work in a fresh state.

Interactions

- Export the current artifact
- Clear and import it with field-level validation

Visible states: unsaved, exported, validated, replayed

Boundaries and recovery

- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.

Shared-state/artifact effect: Produces kiln-load-v1.json with schemaVersion, exportedAt, records, derived state, and history.


</core_features>

<visual_design>

Experience direction

20-second demo: The user attach evidence to a selected record and resolve an audit discrepancy, watches linked views react, then exports the completed artifact.

- Signature interaction: attach evidence to a selected record and resolve an audit discrepancy
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The audit lens surface, derived summary, and artifact query share one state.
- Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- Motion: The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.

</visual_design>

<requirements>
- Tailwind CSS 4.3.2
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- derived-decision-v1

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

<module_spec id="derived-decision-v1">
{
  "id": "derived-decision-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Derived decision",
  "purpose": "Audit, summary, and consequential mutation workflows.",
  "permitted_operations": ["mutate", "undo", "query_state"],
  "binding_keys": {
    "required_any_of": [["decision_operations"]],
    "optional": ["decision_states", "visible_postconditions"]
  },
  "restrictions": [
    "Invokes the same domain command used by the visible control.",
    "No generic state setter or arbitrary patch object."
  ],
  "tool_name_prefix": "decision"
}
</module_spec>

Bindings:
- Entity: kiln-piece
- Entity operations: create; select; update; delete; toggle
- Entity fields: id; status; evidence
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json
- Decision operations: mutate; undo; query_state
- Decision states: idle; selected; changed; conflict; resolved

Mechanics exclusions:
- Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters.
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
