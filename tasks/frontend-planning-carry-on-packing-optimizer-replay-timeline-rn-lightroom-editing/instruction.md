<summary>
Build a Carry-On Packing Optimizer focusing on the Replay Timeline interaction. This app is a frontend-only tool to manage packing items, featuring a domain-native signature interaction: scrubbing a selected record through its timeline and restoring a prior checkpoint. It draws inspiration from a media board pattern where selections, batch edits, histogram ranges, and sequence exports remain synchronized, adapting this into a local packing optimizer artifact using Tailwind CSS 4.3.2.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Packing Items collection —
- Create, edit, archive, and filter packing items. Each item has explicit domain statuses (e.g., draft, ready, changed, archived) and attributes (name, category, weight, quantity).
- Exact field boundaries are accepted (e.g., valid weights, non-negative quantities); invalid inputs preserve the prior valid record and explain recovery.
- Mutates the records list and status fields in memory.
Feature: Replay Timeline surface —
- Scrub a selected record through its timeline: A dedicated UI control (timeline scrubber or list of history checkpoints) allows the user to preview past states of a selected item.
- Restore a prior checkpoint: Apply a selected past state to the current record, effectively rewinding its state.
- Undo the last mutation globally and inspect the linked representation.
- A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Shared-state effect: Updates replay-timeline geometry/selection, derived summaries, and event history.
Feature: Portable work artifact —
- Export the current artifact containing schemaVersion, exportedAt, records, derived, and history.
- Clear the current session and import a JSON artifact with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. Valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
Visual design constraints:
- Visual hierarchy: The primary work surface (item list/grid), linked summary (weight/item totals), and detail panel (item editor and replay timeline) are distinct and make current state/next action clear.
- Domain-specific workbench: Clear state tokens, intentional density, and a calm focused canvas, avoiding a generic CRUD look.
</visual_design>

<motion>
Motion constraints:
- Causal motion: Motion connects the acted-on item to its new state (e.g., animating an item moving to the archived state or transitioning properties during a timeline scrub).
- Reduced motion: Respect prefers-reduced-motion to provide a no-transform fallback.
</motion>

<responsiveness>
Responsiveness constraints:
- Mobile mode: Narrow viewports change the interaction model (e.g., desktop side-panel becomes a full-screen drawer or stacked steps), preserve touch targets, and avoid horizontal overflow/clipping.
</responsiveness>

<accessibility>
Accessibility constraints:
- Alternate input: Keyboard and touch-equivalent controls produce the identical canonical mutation (timeline scrub and restore).
- Keyboard shortcuts: Ctrl+Z (or Cmd+Z) undoes the last mutation.
</accessibility>

<performance>
Performance constraints:
- Large collection: The signature interaction (timeline scrubbing) remains responsive with at least 100 seeded records, without rebuilding unrelated surfaces.
</performance>

<writing>
Writing constraints:
- Domain copy: Labels, statuses, errors, and empty-state text clearly describe packing optimization (e.g., Draft, Ready to Pack, Archived). Errors describe field-level recovery precisely.
</writing>

<innovation>
Innovation constraints:
- Linked utility: The replay timeline surface, derived summary, and artifact query share one state. Mutating a record (or scrubbing its timeline) instantly updates the linked derived summary (e.g., total weight chart or status distribution).
</innovation>

<requirements>
Requirements:
- The app must serve on port 3000.
- State is strictly in-memory (no localStorage). Export/import is the only persistence.
- Implement WebMCP contracts for entity-v1 and artifact-transfer-v1 using standard operations (entity_create_record, entity_update_record, etc.).
- Do not use generic terms like Workflow or Intelligence in user-facing UI or variables.
- Use npm-local dependencies only; no CDNs. Tailwind CSS 4.3.2 must be used.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Deliverables:
- A fully working Vite/React application in `solution/app`.
- Evidence of successful completion and adherence to constraints.
</delivery>

<webmcp_action_contract>
<module_spec id="entity-v1">
{
  "id": "entity-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity and collection management",
  "purpose": "Standard CRUD, selection, and toggle operations.",
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
- Entity: packing_item
- Entity operations: create; select; update; delete
- Entity fields: name; category; weight; quantity; status
- Editor object types: timeline_record
- Editor operations: scrub_timeline; restore_checkpoint; undo
- Artifact operations: export; import; clear
- Export formats: carry-on-pack-v1.json
- Import modes: carry-on-pack-v1.json

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
