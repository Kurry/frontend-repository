# Color Blindness Palette Simulator — Batch Reconciler

<summary>
Genre: good-app
Target users: People who manage palette swatches in a bounded local workflow.
Stack: React 19, Vite, Tailwind CSS 4.3.2, Zustand (in-memory state only, no localStorage).
Concept: A domain-native browser surface where palette swatches are managed, and one meaningful mutation (group selected records into a batch and reconcile aggregate totals) updates linked views and an interoperable artifact. It includes a local session ledger that exposes save health, safe resume, and recovery states.
</summary>

<core_features>
- Palette Swatches Collection: Create, edit, archive, and filter palette swatches (fields: id, name, hex, status: draft|ready|changed|archived).
- Batch Reconciler: Select multiple swatches, group them into a batch, and reconcile aggregate totals (e.g., average luminance, pass/fail WCAG contrast against #FFFFFF, or color blindness simulation). This canonical mutation updates the primary record statuses to 'changed', updates the linked derived summary view, and pushes to history.
- Undo / Recovery: Undo the last mutation to restore ordering, selection, and derived values.
- Session Ledger: A visible log or status area exposing save health (unsaved changes), tool-output retention, safe resume, and recovery states (invalid action warnings).
- Portable Work Artifact: Export the current artifact as palette-simulation-v1-batch-reconciler.json and import it with field-level validation.
</core_features>

<visual_design>
- Distinctive domain-specific workbench with clear state tokens and intentional density.
- Visual hierarchy makes current state and next action clear.
- No raw lorem ipsum.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state (causal motion).
- Reduced motion preserves feedback without transforms (e.g. prefers-reduced-motion: reduce).
</motion>

<requirements>
- State Management: In-memory only (e.g. Zustand). No localStorage, sessionStorage, or IndexedDB. A page reload returns the app to its seeded state.
- Seed Data: Seed at least 3 valid records, 1 boundary/conflict state record. No target outcome is pre-completed.
- Boundaries and Recovery: Exact field boundaries accepted. Invalid required fields preserve the prior valid record and explain recovery.
- Artifact: schemaVersion: 'palette-simulation-v1', exportedAt (RFC3339), records, derived, history.
- Validation: Invalid import makes no state change and shows field-level validation error. Valid import restores authored structure and regenerates exportedAt.
- Responsiveness: Desktop primary surface plus summary. Narrow layouts change interaction model (stack/drawer) without horizontal clipping.
- Accessibility: Semantic controls, keyboard parity (Enter/Space to trigger actions), focus management, live updates (aria-live="polite").
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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity: swatch
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; hex; status
- Artifact operations: export; import; copy
- Export formats: palette-simulation-v1-batch-reconciler.json
- Import modes: palette-simulation-v1
</webmcp_action_contract>
